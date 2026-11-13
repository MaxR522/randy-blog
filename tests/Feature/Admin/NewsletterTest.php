<?php

use App\Jobs\SendNewsletterToRecipient;
use App\Mail\NewsletterMail;
use App\Models\Article;
use App\Models\Category;
use App\Models\Newsletter;
use App\Models\NewsletterRecipient;
use App\Models\Subscription;
use App\Models\User;
use App\NewsletterAudience;
use App\NewsletterRecipientStatus;
use App\NewsletterStatus;
use App\Support\ArticleHtml;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Queue;
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
    ['post', '/admin/newsletters/envoyer'],
    ['post', '/admin/newsletters/1/envoyer'],
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

test('ADM-SUB-24 « Envoyer un test » also goes to the verified recovery email, in its own email', function () {
    Mail::fake();
    $this->author->forceFill(['recovery_email' => 'secours@exemple.fr', 'recovery_email_verified_at' => now()])->save();

    $this->actingAs($this->author)
        ->post('/admin/newsletters/test', newsletterFields())
        ->assertInertiaFlash('success', 'Email de test envoyé à randy@exemple.fr et secours@exemple.fr.');

    Mail::assertSent(NewsletterMail::class, 2);
    Mail::assertSent(NewsletterMail::class, fn (NewsletterMail $mail) => $mail->hasTo('secours@exemple.fr') && ! $mail->hasTo('randy@exemple.fr'));
});

test('ADM-SUB-24 an unverified recovery email gets no test', function () {
    Mail::fake();
    $this->author->forceFill(['recovery_email' => 'secours@exemple.fr', 'recovery_email_verified_at' => null])->save();

    $this->actingAs($this->author)
        ->post('/admin/newsletters/test', newsletterFields())
        ->assertInertiaFlash('success', 'Email de test envoyé à randy@exemple.fr.');

    Mail::assertNotSent(NewsletterMail::class, fn (NewsletterMail $mail) => $mail->hasTo('secours@exemple.fr'));
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

test('ADM-SUB-26 « Envoyer » freezes the confirmed subscribers and the email, then queues one job each', function () {
    Queue::fake([SendNewsletterToRecipient::class]);
    $confirmed = Subscription::factory()->count(2)->create();
    Subscription::factory()->pending()->create();
    Subscription::factory()->unsubscribed()->create();
    $draft = Newsletter::factory()->create();

    $this->actingAs($this->author)
        ->post("/admin/newsletters/{$draft->id}/envoyer", newsletterFields())
        ->assertRedirect("/admin/newsletters/{$draft->id}")
        ->assertInertiaFlash('success', 'Newsletter en cours d’envoi.');

    $draft->refresh();
    expect($draft->status)->toBe(NewsletterStatus::Sending)
        ->and($draft->subject)->toBe('Le taxi-be, parlement roulant')
        ->and($draft->sent_at)->not->toBeNull()
        ->and($draft->recipients_count)->toBe(2)
        ->and($draft->html)->toContain('Bonjour,')->toContain('%%UNSUBSCRIBE_URL%%')
        ->and($draft->recipients()->pluck('subscription_id')->sort()->values()->all())->toBe($confirmed->pluck('id')->sort()->values()->all());
    Queue::assertPushed(SendNewsletterToRecipient::class, 2);
});

test('ADM-SUB-26 an unsaved composer is created and sent to its selection only', function () {
    Queue::fake([SendNewsletterToRecipient::class]);
    [$kept, $leaving] = Subscription::factory()->count(2)->create();
    Subscription::factory()->create();

    $this->actingAs($this->author)
        ->post('/admin/newsletters/envoyer', newsletterFields(['audience' => 'selection', 'subscription_ids' => [$kept->id, $leaving->id]]))
        ->assertRedirect();

    $newsletter = Newsletter::query()->sole();
    expect($newsletter->status)->toBe(NewsletterStatus::Sending)
        ->and($newsletter->recipients_count)->toBe(2);
    Queue::assertPushed(SendNewsletterToRecipient::class, 2);
});

test('ADM-SUB-26 sending needs content and a confirmed subscriber', function () {
    Queue::fake([SendNewsletterToRecipient::class]);
    Subscription::factory()->pending()->create();

    $this->actingAs($this->author)
        ->post('/admin/newsletters/envoyer', newsletterFields(['content' => '<p></p>']))
        ->assertSessionHasErrors([
            'content' => 'Le contenu est obligatoire pour envoyer la newsletter.',
            'audience' => 'Aucun abonné confirmé à qui envoyer.',
        ]);

    expect(Newsletter::query()->count())->toBe(0);
    Queue::assertNothingPushed();
});

test('ADM-SUB-26 a newsletter already sent cannot be sent again', function () {
    Queue::fake([SendNewsletterToRecipient::class]);
    Subscription::factory()->create();
    $sent = Newsletter::factory()->sent()->create();

    $this->actingAs($this->author)
        ->post("/admin/newsletters/{$sent->id}/envoyer", newsletterFields())
        ->assertForbidden();

    Queue::assertNothingPushed();
});

test('ADM-SUB-27 ADM-SUB-28 each subscriber gets the email with their own one-click unsubscribe link, then the newsletter is sent', function () {
    Mail::fake();
    [$first, $second] = Subscription::factory()->count(2)->create();

    $this->actingAs($this->author)->post('/admin/newsletters/envoyer', newsletterFields());

    $newsletter = Newsletter::query()->sole();
    expect($newsletter->status)->toBe(NewsletterStatus::Sent)
        ->and($newsletter->sent_count)->toBe(2)
        ->and($newsletter->failed_count)->toBe(0)
        ->and($newsletter->recipients()->where('status', NewsletterRecipientStatus::Sent)->whereNotNull('sent_at')->count())->toBe(2);

    foreach ([$first, $second] as $subscription) {
        $recipient = NewsletterRecipient::query()->where('subscription_id', $subscription->id)->sole();

        Mail::assertSent(NewsletterMail::class, function (NewsletterMail $mail) use ($subscription, $recipient): bool {
            $headers = $mail->headers()->text;

            return $mail->hasTo($subscription->email)
                && $mail->emailSubject === 'Le taxi-be, parlement roulant'
                && str_contains($mail->renderedHtml, e($subscription->unsubscribeUrl()))
                && ! str_contains($mail->renderedHtml, '%%UNSUBSCRIBE_URL%%')
                && $headers['List-Unsubscribe'] === '<'.$subscription->unsubscribeUrl().'>'
                && $headers['List-Unsubscribe-Post'] === 'List-Unsubscribe=One-Click'
                && $headers['X-Mailin-custom'] === 'newsletter-recipient:'.$recipient->id;
        });
    }
});

test('ADM-SUB-27 a failed email counts as failed and ends the newsletter as « Échec partiel »', function () {
    $newsletter = Newsletter::factory()->create(['status' => NewsletterStatus::Sending, 'recipients_count' => 2, 'sent_count' => 1, 'html' => '<p>x</p>']);
    $newsletter->recipients()->create(['subscription_id' => Subscription::factory()->create()->id, 'status' => NewsletterRecipientStatus::Sent]);
    $failing = $newsletter->recipients()->create(['subscription_id' => Subscription::factory()->create()->id]);

    (new SendNewsletterToRecipient($failing->id))->failed(new RuntimeException('550 Mailbox unavailable'));

    expect($failing->refresh()->status)->toBe(NewsletterRecipientStatus::Failed)
        ->and($failing->error)->toBe('550 Mailbox unavailable')
        ->and($newsletter->refresh()->failed_count)->toBe(1)
        ->and($newsletter->status)->toBe(NewsletterStatus::PartiallyFailed);
});

test('PUB-SUB-7 a subscriber who left after « Envoyer » gets nothing and no longer counts', function () {
    Mail::fake();
    $newsletter = Newsletter::factory()->create(['status' => NewsletterStatus::Sending, 'recipients_count' => 1, 'html' => '<p>x</p>']);
    $recipient = $newsletter->recipients()->create(['subscription_id' => Subscription::factory()->unsubscribed()->create()->id]);

    SendNewsletterToRecipient::dispatchSync($recipient->id);

    Mail::assertNothingSent();
    expect(NewsletterRecipient::query()->find($recipient->id))->toBeNull()
        ->and($newsletter->refresh()->recipients_count)->toBe(0)
        ->and($newsletter->status)->toBe(NewsletterStatus::Sent);
});

test('ADM-SUB-10 a sent newsletter shows the email as it went out, its link leading to the home page', function () {
    $sent = Newsletter::factory()->sent()->create(['content' => '<p>Contenu modifié depuis</p>', 'html' => '<p>Envoyé</p><a href="%%UNSUBSCRIBE_URL%%">Se désabonner</a>']);

    $this->actingAs($this->author)
        ->get("/admin/newsletters/{$sent->id}")
        ->assertInertia(fn (Assert $page) => $page
            ->where('emailHtml', '<p>Envoyé</p><a href="'.url('/').'">Se désabonner</a>'));
});

test('ADM-SUB-30 publishing offers to send the article, and the composer opens with its card', function () {
    $draft = Article::factory()->draft()->create();

    $this->actingAs($this->author)
        ->patch("/admin/articles/{$draft->id}/publier")
        ->assertInertiaFlash('publishedArticleId', $draft->id);

    $this->actingAs($this->author)
        ->get("/admin/newsletters/nouvelle?article={$draft->id}")
        ->assertInertia(fn (Assert $page) => $page
            ->where('initialArticle.id', $draft->id)
            ->where('initialArticle.title', $draft->title));
});

test('ADM-SUB-30 the composer ignores an article that is not published', function () {
    $draft = Article::factory()->draft()->create();

    $this->actingAs($this->author)
        ->get("/admin/newsletters/nouvelle?article={$draft->id}")
        ->assertInertia(fn (Assert $page) => $page->where('initialArticle', null));
});
