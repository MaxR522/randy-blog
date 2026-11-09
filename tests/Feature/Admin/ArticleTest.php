<?php

use App\ArticleStatus;
use App\Models\Article;
use App\Models\Category;
use App\Models\User;
use App\Support\Seo\SeoCache;
use Illuminate\Support\Facades\Cache;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    $this->author = User::factory()->create();
});

/**
 * @return array<int, string>
 */
function listedArticleTitles(string $url): array
{
    $titles = [];

    test()->actingAs(test()->author)->get($url)->assertOk()->assertInertia(function (Assert $page) use (&$titles) {
        $titles = array_column($page->toArray()['props']['articles']['data'], 'title');
    });

    return $titles;
}

test('ADM-COM-8 guests get a 404 on every article route', function (string $method, string $path) {
    $article = Article::factory()->create();

    $this->{$method}(str_replace('{id}', (string) $article->id, $path))->assertNotFound();

    expect($article->fresh())
        ->status->toBe(ArticleStatus::Draft)
        ->trashed()->toBeFalse();
})->with([
    ['get', '/admin/articles'],
    ['patch', '/admin/articles/{id}/publier'],
    ['patch', '/admin/articles/{id}/archiver'],
    ['delete', '/admin/articles/{id}'],
    ['get', '/admin/articles/{id}/apercu'],
]);

test('ADM-ART-2 a row gives the title, status, categories and the preview link', function () {
    $draft = Article::factory()->create(['title' => 'Brouillon']);
    $draft->categories()->attach(Category::factory()->create(['key' => 'SOCIETE', 'value' => 'Société']));
    $published = Article::factory()->published()->create(['title' => 'Publié']);

    $this->actingAs($this->author)
        ->get('/admin/articles')
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/articles')
            ->where('articles.data.0.title', 'Brouillon')
            ->where('articles.data.0.status', 'DRAFT')
            ->where('articles.data.0.categories', ['Société'])
            ->where('articles.data.0.previewUrl', route('admin.articles.preview', $draft))
            ->where('articles.data.1.status', 'PUBLISHED')
            ->where('articles.data.1.previewUrl', route('admin.articles.preview', $published))
            ->where('hasArticles', true));
});

test('ADM-ART-4 drafts come first by creation date, then the others by publication date', function () {
    Article::factory()->published(now()->subDays(10))->create(['title' => 'Publié ancien']);
    Article::factory()->archived()->create(['title' => 'Archivé récent', 'published_date' => now()->subDays(2)]);
    Article::factory()->published(now()->subDays(5))->create(['title' => 'Publié moyen']);
    Article::factory()->create(['title' => 'Brouillon ancien', 'created_at' => now()->subDays(30)]);
    Article::factory()->create(['title' => 'Brouillon récent', 'created_at' => now()->subDay()]);

    expect(listedArticleTitles('/admin/articles'))->toBe([
        'Brouillon récent',
        'Brouillon ancien',
        'Archivé récent',
        'Publié moyen',
        'Publié ancien',
    ]);
});

test('ADM-COM-5 the list shows 10 rows per page and keeps the query string in its links', function () {
    Article::factory()->count(11)->sequence(fn ($sequence) => ['title' => sprintf('Sujet %02d', $sequence->index + 1)])->create();

    $this->actingAs($this->author)
        ->get('/admin/articles?q=sujet')
        ->assertInertia(fn (Assert $page) => $page
            ->has('articles.data', 10)
            ->where('articles.total', 11)
            ->where('articles.lastPage', 2)
            ->where('articles.nextUrl', fn (string $url) => str_contains($url, 'q=sujet') && str_contains($url, 'page=2')));
});

test('ADM-COM-5 a page past the end redirects to the last page and keeps the filters', function () {
    Article::factory()->create();

    $this->actingAs($this->author)
        ->get('/admin/articles?status=draft&page=3')
        ->assertRedirect('/admin/articles?status=draft&page=1');
});

test('ADM-ART-5 search by title ignores accents and case and treats % literally', function (string $query, array $expected) {
    Article::factory()->create(['title' => 'Éloge de la lenteur']);
    Article::factory()->create(['title' => 'Une hausse de 100% des prix']);

    expect(listedArticleTitles('/admin/articles?q='.urlencode($query)))->toBe($expected);
})->with([
    ['eloge', ['Éloge de la lenteur']],
    ['ÉLOGE', ['Éloge de la lenteur']],
    ['%', ['Une hausse de 100% des prix']],
]);

test('ADM-ART-5 the status filter keeps one status, and an unknown one shows them all', function (string $status, array $expected) {
    Article::factory()->create(['title' => 'Brouillon']);
    Article::factory()->published()->create(['title' => 'Publié']);
    Article::factory()->archived()->create(['title' => 'Archivé']);

    expect(listedArticleTitles('/admin/articles?status='.$status))->toEqualCanonicalizing($expected);
})->with([
    ['draft', ['Brouillon']],
    ['published', ['Publié']],
    ['archived', ['Archivé']],
    ['inconnu', ['Brouillon', 'Publié', 'Archivé']],
]);

test('ADM-ART-60 the list tells an empty blog from a search without results', function () {
    $this->actingAs($this->author)
        ->get('/admin/articles')
        ->assertInertia(fn (Assert $page) => $page->where('articles.total', 0)->where('hasArticles', false));

    Article::factory()->create();

    $this->actingAs($this->author)
        ->get('/admin/articles?q=introuvable')
        ->assertInertia(fn (Assert $page) => $page->where('articles.total', 0)->where('hasArticles', true));
});

test('ADM-ART-61 publishing a draft sets its publication date to now', function () {
    $this->freezeSecond();
    $article = Article::factory()->create();

    $this->actingAs($this->author)
        ->patch("/admin/articles/{$article->id}/publier")
        ->assertRedirect()
        ->assertInertiaFlash('success', 'Article publié.');

    expect($article->fresh())
        ->status->toBe(ArticleStatus::Published)
        ->published_date->toEqual(now()->toImmutable());
});

test('ADM-ART-61 re-publishing an archived article keeps its first publication date', function () {
    $firstPublication = now()->subYear()->startOfSecond();
    $article = Article::factory()->archived()->create(['published_date' => $firstPublication]);

    $this->actingAs($this->author)->patch("/admin/articles/{$article->id}/publier")->assertRedirect();

    expect($article->fresh())
        ->status->toBe(ArticleStatus::Published)
        ->published_date->toEqual($firstPublication->toImmutable());
});

test('ADM-ART-62 archiving hides the article and keeps its publication date', function () {
    $publishedDate = now()->subMonth()->startOfSecond();
    $article = Article::factory()->published($publishedDate)->create();

    $this->actingAs($this->author)
        ->patch("/admin/articles/{$article->id}/archiver")
        ->assertRedirect()
        ->assertInertiaFlash('success', 'Article archivé.');

    expect($article->fresh())
        ->status->toBe(ArticleStatus::Archived)
        ->published_date->toEqual($publishedDate->toImmutable());

    $this->get(route('articles.show', $article->slug))->assertGone();
});

test('ADM-ART-3 an action that does not fit the status is refused', function (string $state, string $method, string $path) {
    $article = Article::factory()->{$state}()->create();
    $before = $article->fresh();

    $this->actingAs($this->author)
        ->{$method}(str_replace('{id}', (string) $article->id, $path))
        ->assertConflict();

    expect($article->fresh())
        ->status->toBe($before->status)
        ->trashed()->toBeFalse();
})->with([
    'publish a published article' => ['published', 'patch', '/admin/articles/{id}/publier'],
    'archive a draft' => ['draft', 'patch', '/admin/articles/{id}/archiver'],
    'archive an archived article' => ['archived', 'patch', '/admin/articles/{id}/archiver'],
    'delete a published article' => ['published', 'delete', '/admin/articles/{id}'],
    'delete an archived article' => ['archived', 'delete', '/admin/articles/{id}'],
]);

test('ADM-ART-3 deleting a draft soft deletes it', function () {
    $article = Article::factory()->create();

    $this->actingAs($this->author)
        ->delete("/admin/articles/{$article->id}")
        ->assertRedirect()
        ->assertInertiaFlash('success', 'Article supprimé.');

    expect($article->fresh()->trashed())->toBeTrue();
});

test('publishing and archiving refresh the crawl files', function (string $state, string $action) {
    $article = Article::factory()->{$state}()->create();
    Cache::put(SeoCache::Sitemap, 'ancien sitemap');

    $this->actingAs($this->author)->patch("/admin/articles/{$article->id}/{$action}")->assertRedirect();

    expect(Cache::has(SeoCache::Sitemap))->toBeFalse();
})->with([
    ['draft', 'publier'],
    ['published', 'archiver'],
]);

test('PUB-ART-13 the author previews any article with the banner, out of search engines', function (string $state, bool $isPublished) {
    $article = Article::factory()->{$state}()->create(['title' => 'Pas encore prêt']);

    $this->actingAs($this->author)
        ->get("/admin/articles/{$article->id}/apercu")
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('article')
            ->where('isPreview', true)
            ->where('isPublished', $isPublished)
            ->where('isEmbedded', false)
            ->where('article.title', 'Pas encore prêt')
            ->where('seo.robots', 'noindex, nofollow')
            ->where('previous', null)
            ->where('next', null));
})->with([
    ['draft', false],
    ['archived', false],
    ['published', true],
]);

test('PUB-ART-13 the public URL of a draft stays a 404, even for the logged-in author', function () {
    $article = Article::factory()->create();

    $this->actingAs($this->author)->get(route('articles.show', $article->slug))->assertNotFound();
});

test('PUB-ART-13 the list viewer loads the preview without the site chrome', function () {
    $article = Article::factory()->create();

    $this->actingAs($this->author)
        ->get("/admin/articles/{$article->id}/apercu?integre=1")
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('article')
            ->where('isEmbedded', true)
            ->where('seo.robots', 'noindex, nofollow'));
});
