<?php

use App\Mail\NewsletterMail;
use App\Models\Article;
use App\Models\Category;
use App\Models\Newsletter;
use App\Models\Subscription;
use App\Models\User;
use App\NewsletterAudience;
use App\NewsletterStatus;
use App\Support\ArticleHtml;
use Illuminate\Support\Facades\Mail;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    $this->author = User::factory()->create(['email' => 'randy@exemple.fr']);
});

/**
 * @return array<string, mixed>
 */
function newsletterFields(array $overrides = []): array
{
    return [
        'subject' => 'Le taxi-be, parlement roulant',
        'preheader' => 'Une nouvelle chronique.',
        'content' => '<p>Bonjour,</p>',
        'audience' => 'all',
        ...$overrides,
    ];
}

test('ADM-COM-8 guests get a 404 on the newsletter routes', function (string $method, string $url) {
    $this->{$method}($url)->assertNotFound();
})->with([
    ['get', '/admin/abonnements/newsletters'],
    ['get', '/admin/newsletters/nouvelle'],
    ['post', '/admin/newsletters'],
    ['post', '/admin/newsletters/apercu'],
    ['post', '/admin/newsletters/test'],
    ['get', '/admin/newsletters/articles'],
    ['get', '/admin/newsletters/abonnes'],
]);

test('ADM-SUB-10 the list shows drafts first, then the newest sent, with their counts', function () {
    Newsletter::factory()->sent()->create(['subject' => 'Ancienne', 'sent_at' => now()->subMonth()]);
    Newsletter::factory()->partiallyFailed()->create(['subject' => 'Récente', 'sent_at' => now()->subDay()]);
    Newsletter::factory()->create(['subject' => 'Brouillon']);

    $this->actingAs($this->author)
        ->get('/admin/abonnements/newsletters')
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/newsletters')
            ->where('newsletters.data.0.subject', 'Brouillon')
            ->where('newsletters.data.0.status', 'draft')
            ->where('newsletters.data.1.subject', 'Récente')
            ->where('newsletters.data.1.status', 'partially_failed')
            ->where('newsletters.data.1.sentCount', 8)
            ->where('newsletters.data.1.failedCount', 2)
            ->where('newsletters.data.2.subject', 'Ancienne')
            ->where('newsletterCount', 3));
});

test('ADM-SUB-26 « Enregistrer le brouillon » stores a draft and opens it', function () {
    $response = $this->actingAs($this->author)->post('/admin/newsletters', newsletterFields([
        'content' => '<p>Bonjour</p><script>alert(1)</script>',
    ]));

    $newsletter = Newsletter::query()->sole();

    $response->assertRedirect("/admin/newsletters/{$newsletter->id}")->assertInertiaFlash('success', 'Brouillon enregistré.');

    expect($newsletter)
        ->status->toBe(NewsletterStatus::Draft)
        ->subject->toBe('Le taxi-be, parlement roulant')
        ->content->toBe('<p>Bonjour</p>')
        ->audience->toBe(NewsletterAudience::All);
});

test('ADM-SUB-20 a draft needs a subject of at most 150 characters', function (array $fields, string $field, string $message) {
    $this->actingAs($this->author)
        ->post('/admin/newsletters', newsletterFields($fields))
        ->assertSessionHasErrors([$field => $message]);

    expect(Newsletter::query()->count())->toBe(0);
})->with([
    'missing subject' => [['subject' => '  '], 'subject', 'L’objet est obligatoire.'],
    'long subject' => [['subject' => str_repeat('a', 151)], 'subject', 'L’objet ne peut pas dépasser 150 caractères.'],
    'long preheader' => [['preheader' => str_repeat('a', 151)], 'preheader', 'Le texte d’aperçu ne peut pas dépasser 150 caractères.'],
]);

test('ADM-SUB-10 a draft can be reopened and saved again', function () {
    $newsletter = Newsletter::factory()->create();

    $this->actingAs($this->author)
        ->get("/admin/newsletters/{$newsletter->id}")
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/newsletter-editor')
            ->where('newsletter.id', $newsletter->id)
            ->where('emailHtml', null));

    $this->actingAs($this->author)
        ->put("/admin/newsletters/{$newsletter->id}", newsletterFields(['subject' => 'Nouvel objet']))
        ->assertRedirect()
        ->assertInertiaFlash('success', 'Brouillon enregistré.');

    expect($newsletter->fresh()->subject)->toBe('Nouvel objet');
});

test('ADM-SUB-10 a sent newsletter is shown read-only and cannot be changed', function () {
    $newsletter = Newsletter::factory()->sent()->create(['subject' => 'Envoyée']);

    $this->actingAs($this->author)
        ->get("/admin/newsletters/{$newsletter->id}")
        ->assertInertia(fn (Assert $page) => $page
            ->where('newsletter.status', 'sent')
            ->where('emailHtml', fn (string $html) => str_contains($html, 'Envoyée')));

    $this->actingAs($this->author)
        ->put("/admin/newsletters/{$newsletter->id}", newsletterFields())
        ->assertForbidden();

    expect($newsletter->fresh()->subject)->toBe('Envoyée');
});

test('ADM-SUB-25 a selection keeps only confirmed subscribers, saved as pending recipients', function () {
    $confirmed = Subscription::factory()->count(2)->create();

    $this->actingAs($this->author)
        ->post('/admin/newsletters', newsletterFields(['audience' => 'selection', 'subscription_ids' => $confirmed->pluck('id')->all()]))
        ->assertSessionHasNoErrors();

    $newsletter = Newsletter::query()->sole();

    expect($newsletter->audience)->toBe(NewsletterAudience::Selection)
        ->and($newsletter->recipients()->pluck('subscription_id')->all())->toEqualCanonicalizing($confirmed->pluck('id')->all());

    $this->actingAs($this->author)
        ->get("/admin/newsletters/{$newsletter->id}")
        ->assertInertia(fn (Assert $page) => $page->has('selectedSubscribers', 2)->where('confirmedCount', 2));

    $this->actingAs($this->author)
        ->put("/admin/newsletters/{$newsletter->id}", newsletterFields())
        ->assertSessionHasNoErrors();

    expect($newsletter->recipients()->count())->toBe(0);
});

test('ADM-SUB-25 a selection rejects addresses that are not confirmed, and cannot be empty', function (Closure $ids, string $field, string $message) {
    $this->actingAs($this->author)
        ->post('/admin/newsletters', newsletterFields(['audience' => 'selection', 'subscription_ids' => $ids()]))
        ->assertSessionHasErrors([$field => $message]);

    expect(Newsletter::query()->count())->toBe(0);
})->with([
    'pending' => [fn () => [Subscription::factory()->pending()->create()->id], 'subscription_ids.0', 'Un des abonnés choisis n’est plus abonné.'],
    'unsubscribed' => [fn () => [Subscription::factory()->unsubscribed()->create()->id], 'subscription_ids.0', 'Un des abonnés choisis n’est plus abonné.'],
    'empty' => [fn () => [], 'subscription_ids', 'Choisissez au moins un abonné.'],
]);

test('ADM-SUB-10 « Dupliquer » makes a draft copy that keeps only the still confirmed selection', function () {
    $stillConfirmed = Subscription::factory()->create();
    $gone = Subscription::factory()->create();
    $newsletter = Newsletter::factory()->sent()->create(['audience' => NewsletterAudience::Selection, 'subject' => 'Octobre']);
    $newsletter->recipients()->createMany([['subscription_id' => $stillConfirmed->id], ['subscription_id' => $gone->id]]);
    $gone->update(['unsubscribed_at' => now()]);

    $response = $this->actingAs($this->author)->post("/admin/newsletters/{$newsletter->id}/dupliquer");

    $copy = Newsletter::query()->whereKeyNot($newsletter->id)->sole();

    $response->assertRedirect("/admin/newsletters/{$copy->id}");

    expect($copy)
        ->status->toBe(NewsletterStatus::Draft)
        ->subject->toBe('Octobre')
        ->sent_at->toBeNull()
        ->and($copy->recipients()->pluck('subscription_id')->all())->toBe([$stillConfirmed->id]);
});

test('ADM-SUB-21 the article picker searches published articles only', function () {
    Article::factory()->published()->create(['title' => 'La démocratie à l’épreuve']);
    Article::factory()->draft()->create(['title' => 'Démocratie en brouillon']);
    Article::factory()->published()->create(['title' => 'Le taxi-be']);

    $this->actingAs($this->author)
        ->getJson('/admin/newsletters/articles?q=democratie')
        ->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.title', 'La démocratie à l’épreuve');
});

test('ADM-SUB-25 the subscriber picker lists confirmed subscribers only', function () {
    Subscription::factory()->create(['email' => 'claire@exemple.fr']);
    Subscription::factory()->pending()->create(['email' => 'claude@exemple.fr']);

    $this->actingAs($this->author)
        ->getJson('/admin/newsletters/abonnes?q=cla')
        ->assertOk()
        ->assertJsonPath('total', 1)
        ->assertJsonPath('data.0.email', 'claire@exemple.fr');
});

test('ADM-SUB-21 the preview renders each article card with UTM links and drops cards it cannot show', function () {
    $category = Category::factory()->create(['value' => 'Société']);
    $article = Article::factory()->published()->create(['title' => 'Le taxi-be, parlement roulant', 'lead_paragraph' => '<p>Quinze places assises.</p>']);
    $article->categories()->attach($category);
    $draft = Article::factory()->draft()->create(['title' => 'Pas encore publié']);

    $html = $this->actingAs($this->author)
        ->postJson('/admin/newsletters/apercu', [
            'subject' => 'Novembre : trois chroniques',
            'preheader' => 'Texte d’aperçu',
            'content' => "<p>Bonjour,</p><div data-article-card=\"{$article->id}\"><p>aperçu</p></div><div data-article-card=\"{$draft->id}\"></div><div data-article-card=\"999999\"></div>",
        ])
        ->assertOk()
        ->json('html');

    expect($html)
        ->toContain('Blog de Randy Donny')
        ->not->toContain('Je pense, donc j’essuie')
        ->toContain('Bonjour,')
        ->toContain('Texte d’aperçu')
        ->toContain('Le taxi-be, parlement roulant')
        ->toContain('Quinze places assises.')
        ->toContain('Société')
        ->toContain(e("/articles/{$article->slug}?utm_source=newsletter&utm_medium=email&utm_campaign=novembre-trois-chroniques"))
        ->toContain('Se désabonner')
        ->not->toContain('Pas encore publié')
        ->not->toContain('data-article-card')
        ->not->toContain('aperçu</p>');
});

test('ADM-SUB-24 « Envoyer un test » sends the email to the author only', function () {
    Mail::fake();
    Subscription::factory()->count(2)->create();

    $this->actingAs($this->author)
        ->post('/admin/newsletters/test', newsletterFields())
        ->assertRedirect()
        ->assertInertiaFlash('success', 'Email de test envoyé à randy@exemple.fr.');

    Mail::assertSent(NewsletterMail::class, 1);
    Mail::assertSent(NewsletterMail::class, fn (NewsletterMail $mail) => $mail->hasTo('randy@exemple.fr')
        && $mail->emailSubject === '[Test] Le taxi-be, parlement roulant');
});

test('ADM-SUB-24 a test needs some content', function () {
    Mail::fake();

    $this->actingAs($this->author)
        ->post('/admin/newsletters/test', newsletterFields(['content' => '<p></p>']))
        ->assertSessionHasErrors(['content' => 'Le contenu est obligatoire pour envoyer un test.']);

    Mail::assertNothingSent();
});

test('the article card placeholder is kept in newsletter content only', function () {
    $html = '<div data-article-card="12"><p>Carte</p></div><div data-article-card="x"></div>';

    expect(ArticleHtml::clean($html, allowArticleCards: true))->toBe('<div data-article-card="12"><p>Carte</p></div><div></div>')
        ->and(ArticleHtml::clean($html))->not->toContain('data-article-card');
});
