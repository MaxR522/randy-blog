<?php

use App\ArticleStatus;
use App\Models\Article;
use App\Models\ArticleSlugRedirect;
use App\Models\Category;
use App\Models\User;
use Illuminate\Http\Client\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Http;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    config(['services.cloudinary.url' => 'cloudinary://123456:s3cr3t@randy']);
    $this->author = User::factory()->create();
    $this->category = Category::factory()->create(['key' => 'SOCIETE', 'value' => 'Société']);
});

/**
 * Every field the editor sends, filled so the article can be published.
 *
 * @param  array<string, mixed>  $overrides
 * @return array<string, mixed>
 */
function completeArticlePayload(array $overrides = []): array
{
    return [
        'intent' => 'save',
        'title' => 'Le taxi-be, parlement roulant',
        'lead_paragraph' => '<p>Quinze places assises.</p>',
        'cover' => UploadedFile::fake()->image('taxi.jpg', 1600, 1067),
        'cover_photo_credit' => 'Jean Dupont',
        'content' => '<p>Le taxi-be démarre quand il est plein.</p>',
        'category_ids' => [test()->category->id],
        'description' => 'Chronique d’un taxi-be.',
        'keywords' => 'taxi-be, Antananarivo',
        ...$overrides,
    ];
}

function fakeCloudinaryUpload(string $url = 'https://res.cloudinary.com/randy/image/upload/v1/articles/nouvelle.jpg'): void
{
    Http::fake([
        'https://api.cloudinary.com/v1_1/randy/image/upload' => Http::response(['secure_url' => $url, 'width' => 1600, 'height' => 1067]),
        'https://api.cloudinary.com/v1_1/randy/image/destroy' => Http::response(['result' => 'ok']),
    ]);
}

test('ADM-COM-8 guests get a 404 on the editor routes and nothing is saved', function (string $method, string $path) {
    $article = Article::factory()->create(['title' => 'Avant']);

    $this->{$method}(str_replace('{id}', (string) $article->id, $path), ['intent' => 'save', 'title' => 'Après'])->assertNotFound();

    expect($article->fresh()->title)->toBe('Avant');
    expect(Article::count())->toBe(1);
})->with([
    ['get', '/admin/articles/nouveau'],
    ['post', '/admin/articles'],
    ['get', '/admin/articles/{id}/modifier'],
    ['put', '/admin/articles/{id}'],
]);

test('ADM-ART-10 the editor loads a saved article with its categories', function () {
    $article = Article::factory()->published()->create(['slug' => 'le-taxi-be']);
    $article->categories()->attach($this->category);

    $this->actingAs($this->author)
        ->get(route('admin.articles.edit', $article))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/article-editor')
            ->where('article.id', $article->id)
            ->where('article.categoryIds', [$this->category->id])
            ->where('article.isSlugFrozen', true)
            ->where('article.previewUrl', route('admin.articles.preview', $article))
            ->where('categories', [['id' => $this->category->id, 'name' => 'Société']]));
});

test('ADM-ART-29 a draft saves with only its title, as a draft of the logged-in author', function () {
    $this->actingAs($this->author)
        ->post(route('admin.articles.store'), ['intent' => 'save', 'title' => 'Le taxi-be, parlement roulant'])
        ->assertSessionHasNoErrors()
        ->assertRedirect(route('admin.articles.edit', Article::sole()));

    expect(Article::sole())
        ->status->toBe(ArticleStatus::Draft)
        ->author_id->toBe($this->author->id)
        ->slug->toBe('le-taxi-be-parlement-roulant')
        ->published_date->toBeNull();
});

test('ADM-ART-29 publishing needs every field', function () {
    $this->actingAs($this->author)
        ->post(route('admin.articles.store'), ['intent' => 'publish', 'title' => 'Le taxi-be', 'lead_paragraph' => '<p></p>'])
        ->assertSessionHasErrors([
            'lead_paragraph' => 'Le chapô est obligatoire.',
            'cover' => 'L’image de couverture est obligatoire.',
            'cover_photo_credit' => 'Le crédit photo est obligatoire.',
            'content' => 'Le contenu est obligatoire.',
            'category_ids' => 'Choisissez au moins une catégorie.',
            'description' => 'La description SEO est obligatoire.',
            'keywords' => 'Les mots-clés sont obligatoires.',
        ]);

    expect(Article::count())->toBe(0);
});

test('ADM-ART-29 saving a published article still needs every field', function () {
    $article = Article::factory()->published()->create(['description' => 'Avant']);

    $this->actingAs($this->author)
        ->put(route('admin.articles.update', $article), ['intent' => 'save', 'title' => $article->title])
        ->assertSessionHasErrors(['description' => 'La description SEO est obligatoire.']);

    expect($article->fresh()->description)->toBe('Avant');
});

test('ADM-ART-20 the title is required and at most 255 characters', function (string $title, string $message) {
    $this->actingAs($this->author)
        ->post(route('admin.articles.store'), ['intent' => 'save', 'title' => $title])
        ->assertSessionHasErrors(['title' => $message]);
})->with([
    ['', 'Le titre est obligatoire.'],
    [str_repeat('a', 256), 'Le titre ne peut pas dépasser 255 caractères.'],
]);

test('ADM-ART-26 the SEO description is at most 160 characters', function () {
    $this->actingAs($this->author)
        ->post(route('admin.articles.store'), ['intent' => 'save', 'title' => 'Titre', 'description' => str_repeat('a', 161)])
        ->assertSessionHasErrors(['description' => 'La description SEO ne peut pas dépasser 160 caractères.']);
});

test('ADM-ART-61 « Publier » saves and publishes with the cover uploaded to Cloudinary', function () {
    $this->travelTo('2026-11-10 09:30:00');
    fakeCloudinaryUpload();

    $this->actingAs($this->author)
        ->post(route('admin.articles.store'), completeArticlePayload(['intent' => 'publish']))
        ->assertSessionHasNoErrors();

    expect(Article::sole())
        ->status->toBe(ArticleStatus::Published)
        ->published_date->toDateTimeString()->toBe('2026-11-10 09:30:00')
        ->cover_photo->toBe('https://res.cloudinary.com/randy/image/upload/v1/articles/nouvelle.jpg')
        ->and(Article::sole()->categories->pluck('id')->all())->toBe([$this->category->id]);
});

test('ADM-ART-61 re-publishing an archived article from the editor keeps its first date', function () {
    $article = Article::factory()->archived()->create(['published_date' => '2026-01-15 08:00:00']);

    $this->actingAs($this->author)
        ->put(route('admin.articles.update', $article), completeArticlePayload(['intent' => 'publish', 'cover' => null]))
        ->assertSessionHasNoErrors();

    expect($article->fresh())
        ->status->toBe(ArticleStatus::Published)
        ->published_date->toDateTimeString()->toBe('2026-01-15 08:00:00');
});

test('ADM-ART-65 editing never changes the author', function () {
    $article = Article::factory()->create();
    $originalAuthorId = $article->author_id;

    $this->actingAs($this->author)
        ->put(route('admin.articles.update', $article), ['intent' => 'save', 'title' => 'Nouveau titre'])
        ->assertSessionHasNoErrors();

    expect($article->fresh())
        ->title->toBe('Nouveau titre')
        ->author_id->toBe($originalAuthorId);
});

test('rich text is stored sanitized, with its plain text and reading time', function () {
    $this->actingAs($this->author)
        ->post(route('admin.articles.store'), [
            'intent' => 'save',
            'title' => 'Titre',
            'lead_paragraph' => '<p>Le <strong>chapô</strong>.</p><script>alert(1)</script>',
            'content' => '<h1>Partie</h1><p>'.str_repeat('mot ', 401).'</p><img src="https://res.cloudinary.com/randy/image/upload/v1/a.jpg" alt="A">',
        ])
        ->assertSessionHasNoErrors();

    expect(Article::sole())
        ->lead_paragraph->toBe('<p>Le <strong>chapô</strong>.</p>')
        ->content->toStartWith('<h2>Partie</h2>')
        ->content->toContain('src="https://res.cloudinary.com/randy/image/upload/v1/a.jpg"')
        ->content->not->toContain('srcset')
        ->raw_content->toStartWith('Le chapô. Partie mot mot')
        ->read_duration->toBe(3);
});

test('ADM-ART-27 keywords are stored trimmed, deduplicated and comma separated', function () {
    $this->actingAs($this->author)
        ->post(route('admin.articles.store'), ['intent' => 'save', 'title' => 'Titre', 'keywords' => ' taxi-be ,Antananarivo,, Taxi-be , société '])
        ->assertSessionHasNoErrors();

    expect(Article::sole()->keywords)->toBe('taxi-be, Antananarivo, société');
});

test('ADM-ART-25 a category typed in the editor is created once and reused whatever the case', function () {
    $this->actingAs($this->author)
        ->post(route('admin.articles.store'), ['intent' => 'save', 'title' => 'Titre', 'new_categories' => ['Transports', 'société']])
        ->assertSessionHasNoErrors();

    expect(Category::query()->where('value', 'Transports')->sole()->key)->toBe('TRANSPORTS');
    expect(Category::count())->toBe(2);
    expect(Article::sole()->categories->pluck('value')->sort()->values()->all())->toBe(['Société', 'Transports']);
});

test('ADM-ART-22 a new cover replaces the previous one, which is deleted from Cloudinary', function () {
    fakeCloudinaryUpload();
    $article = Article::factory()->create(['cover_photo' => 'https://res.cloudinary.com/randy/image/upload/v1/articles/ancienne.jpg']);

    $this->actingAs($this->author)
        ->put(route('admin.articles.update', $article), ['intent' => 'save', 'title' => 'Titre', 'cover' => UploadedFile::fake()->image('taxi.jpg')])
        ->assertSessionHasNoErrors();

    expect($article->fresh()->cover_photo)->toBe('https://res.cloudinary.com/randy/image/upload/v1/articles/nouvelle.jpg');
    Http::assertSent(fn (Request $request) => str_ends_with($request->url(), '/image/destroy') && $request['public_id'] === 'articles/ancienne');
});

test('ADM-ART-22 removing the cover clears it and deletes the image', function () {
    fakeCloudinaryUpload();
    $article = Article::factory()->create(['cover_photo' => 'https://res.cloudinary.com/randy/image/upload/v1/articles/ancienne.jpg']);

    $this->actingAs($this->author)
        ->put(route('admin.articles.update', $article), ['intent' => 'save', 'title' => 'Titre', 'remove_cover' => true])
        ->assertSessionHasNoErrors();

    expect($article->fresh()->cover_photo)->toBeNull();
    Http::assertSent(fn (Request $request) => str_ends_with($request->url(), '/image/destroy'));
});

test('ADM-ART-22 a Cloudinary failure is shown on the cover field and nothing is saved', function () {
    Http::fake(['*' => Http::response(['error' => ['message' => 'Down']], 500)]);
    $article = Article::factory()->create(['title' => 'Avant']);

    $this->actingAs($this->author)
        ->put(route('admin.articles.update', $article), ['intent' => 'save', 'title' => 'Après', 'cover' => UploadedFile::fake()->image('taxi.jpg')])
        ->assertSessionHasErrors('cover');

    expect($article->fresh()->title)->toBe('Avant');
});

test('ADM-ART-64 a new slug gets a suffix when another article, even deleted, has it', function () {
    Article::factory()->create(['slug' => 'le-taxi-be'])->delete();

    $this->actingAs($this->author)
        ->post(route('admin.articles.store'), ['intent' => 'save', 'title' => 'Le taxi-be'])
        ->assertSessionHasNoErrors();

    expect(Article::sole()->slug)->toBe('le-taxi-be-2');
});

test('ADM-ART-64 before the first publication the slug follows the title, without redirects', function () {
    $article = Article::factory()->create(['title' => 'Ancien titre', 'slug' => 'ancien-titre']);

    $this->actingAs($this->author)
        ->put(route('admin.articles.update', $article), ['intent' => 'save', 'title' => 'Nouveau titre', 'slug' => 'ancien-titre'])
        ->assertSessionHasNoErrors();

    expect($article->fresh()->slug)->toBe('ancien-titre');

    $this->actingAs($this->author)
        ->put(route('admin.articles.update', $article), ['intent' => 'save', 'title' => 'Nouveau titre', 'slug' => 'nouveau-titre'])
        ->assertSessionHasNoErrors();

    expect($article->fresh()->slug)->toBe('nouveau-titre');
    expect(ArticleSlugRedirect::count())->toBe(0);
});

test('ADM-ART-64 after publication the title no longer changes the slug', function () {
    $article = Article::factory()->published()->create(['title' => 'Ancien titre', 'slug' => 'ancien-titre']);

    $this->actingAs($this->author)
        ->put(route('admin.articles.update', $article), completeArticlePayload(['title' => 'Nouveau titre', 'slug' => 'ancien-titre', 'cover' => null]))
        ->assertSessionHasNoErrors();

    expect($article->fresh())
        ->title->toBe('Nouveau titre')
        ->slug->toBe('ancien-titre');
});

test('ADM-ART-64 a changed URL keeps the old one as a 301, also for the Markdown copy', function () {
    $article = Article::factory()->published()->create(['slug' => 'ancien-titre']);

    $this->actingAs($this->author)
        ->put(route('admin.articles.update', $article), completeArticlePayload(['slug' => 'nouveau-titre', 'cover' => null]))
        ->assertSessionHasNoErrors();
    auth()->logout();

    $this->get('/articles/ancien-titre')->assertMovedPermanently()->assertRedirect(route('articles.show', 'nouveau-titre'));
    $this->get('/articles/ancien-titre.md')->assertMovedPermanently()->assertRedirect(route('articles.markdown', 'nouveau-titre'));
    $this->get('/articles/inconnu')->assertNotFound();
});

test('ADM-ART-64 going back to an old URL drops its redirect', function () {
    $article = Article::factory()->published()->create(['slug' => 'nouveau-titre']);
    $article->slugRedirects()->create(['old_slug' => 'ancien-titre']);

    $this->actingAs($this->author)
        ->put(route('admin.articles.update', $article), completeArticlePayload(['slug' => 'ancien-titre', 'cover' => null]))
        ->assertSessionHasNoErrors();

    expect($article->fresh()->slug)->toBe('ancien-titre');
    expect(ArticleSlugRedirect::query()->pluck('old_slug')->all())->toBe(['nouveau-titre']);
});

test('ADM-ART-64 a typed URL must be free and well formed', function (string $slug, string $message) {
    Article::factory()->create(['slug' => 'deja-pris']);

    $this->actingAs($this->author)
        ->post(route('admin.articles.store'), ['intent' => 'save', 'title' => 'Titre', 'slug' => $slug])
        ->assertSessionHasErrors(['slug' => $message]);
})->with([
    ['deja-pris', 'Cette URL est déjà utilisée par un autre article.'],
    ['Avec Espaces', 'L’URL ne peut contenir que des lettres minuscules sans accents, des chiffres et des tirets.'],
]);

test('SEO-URL-1 apostrophes and accents in the title give separate plain words in the slug', function () {
    $this->actingAs($this->author)
        ->post(route('admin.articles.store'), ['intent' => 'save', 'title' => 'Je pense, donc j’essuie… l’été'])
        ->assertSessionHasNoErrors();

    expect(Article::sole()->slug)->toBe('je-pense-donc-j-essuie-l-ete');
});
