<?php

use App\Models\Article;
use App\Models\Category;
use App\Models\User;
use Illuminate\Support\Carbon;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    $this->author = User::factory()->create(['name' => 'Randy', 'display_name' => 'Randy Donny', 'slug' => 'randy-donny']);
});

/**
 * Create an article by the test author, published the given number of days ago.
 */
function publishedArticleDaysAgo(int $daysAgo, array $attributes = []): Article
{
    return Article::factory()
        ->for(test()->author, 'author')
        ->published(now()->subDays($daysAgo))
        ->create($attributes);
}

test('a published article renders at its V1 URL', function () {
    Carbon::setTestNow('2026-09-21 12:00:00');
    $category = Category::factory()->create(['value' => 'Politique']);
    $article = publishedArticleDaysAgo(0, [
        'title' => 'La photographie, témoin de la métamorphose de Madagascar au XIXe siècle',
        'slug' => 'la-photographie-temoin-de-la-metamorphose-de-madagascar-au-xixe-siecle',
        'lead_paragraph' => '<p>Une <strong>chronique</strong>.</p>',
        'content' => '<p>Corps</p>',
        'cover_photo_credit' => 'Jean Dupont',
        'read_duration' => 6,
        'published_date' => '2026-09-19 08:00:00',
    ]);
    $article->categories()->attach($category);

    $this->get('/articles/la-photographie-temoin-de-la-metamorphose-de-madagascar-au-xixe-siecle')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('article')
            ->where('article.id', $article->id)
            ->where('article.title', 'La photographie, témoin de la métamorphose de Madagascar au XIXe siècle')
            ->where('article.dateLabel', '19 septembre 2026')
            ->where('article.readingTime', 6)
            ->where('article.chapoHtml', '<p>Une <strong>chronique</strong>.</p>')
            ->where('article.contentHtml', '<p>Corps</p>')
            ->where('article.coverCredit', 'Jean Dupont')
            ->where('article.coverAlt', $article->title)
            ->where('article.categories', [['id' => $category->id, 'name' => 'Politique']])
            ->where('article.author', ['name' => 'Randy Donny', 'url' => route('profile.show', 'randy-donny')])
            ->where('previous', null)
            ->where('next', null));
});

test('the reading time falls back to the word count when it was never computed', function () {
    $article = publishedArticleDaysAgo(1, [
        'read_duration' => 0,
        'raw_content' => str_repeat('démocratie ', 461),
    ]);

    $this->get(route('articles.show', $article->slug))
        ->assertInertia(fn (Assert $page) => $page->where('article.readingTime', 3));
});

test('the meta description falls back to the chapô', function () {
    $article = publishedArticleDaysAgo(1, [
        'description' => null,
        'lead_paragraph' => '<p>Un chapô <em>court</em>.</p>',
    ]);

    $this->get(route('articles.show', $article->slug))
        ->assertInertia(fn (Assert $page) => $page->where('article.description', 'Un chapô court.'));
});

test('the article body is sanitized', function () {
    $article = publishedArticleDaysAgo(1, [
        'content' => '<h1>Titre</h1><p onclick="steal()">Texte</p><script>alert(1)</script>',
    ]);

    $this->get(route('articles.show', $article->slug))
        ->assertInertia(fn (Assert $page) => $page->where('article.contentHtml', '<h2>Titre</h2><p>Texte</p>'));
});

test('drafts and scheduled articles are not found (PUB-ART-13)', function (Closure $makeArticle) {
    $article = $makeArticle();

    $this->get(route('articles.show', $article->slug))->assertNotFound();
})->with([
    'draft' => [fn () => Article::factory()->for(test()->author, 'author')->create()],
    'scheduled' => [fn () => Article::factory()->for(test()->author, 'author')->published(now()->addDay())->create()],
]);

test('archived articles are gone (SEO-CRAWL-4)', function () {
    $article = Article::factory()->for($this->author, 'author')->archived()->create();

    $this->get(route('articles.show', $article->slug))->assertStatus(410);
});

test('deleted articles and unknown slugs are not found', function () {
    $article = publishedArticleDaysAgo(1);
    $article->delete();

    $this->get(route('articles.show', $article->slug))->assertNotFound();
    $this->get('/articles/cet-article-n-existe-pas')->assertNotFound();
});

test('previous is the next older published article and next the next newer one (PUB-ART-8)', function () {
    $oldest = publishedArticleDaysAgo(10);
    $older = publishedArticleDaysAgo(5);
    Article::factory()->for($this->author, 'author')->archived()->create(['published_date' => now()->subDays(3)]);
    $current = publishedArticleDaysAgo(2);
    Article::factory()->for($this->author, 'author')->published(now()->addDay())->create();
    $newer = publishedArticleDaysAgo(1);

    $this->get(route('articles.show', $current->slug))
        ->assertInertia(fn (Assert $page) => $page
            ->where('previous.id', $older->id)
            ->where('previous.url', route('articles.show', $older->slug))
            ->where('next.id', $newer->id));

    $this->get(route('articles.show', $oldest->slug))
        ->assertInertia(fn (Assert $page) => $page
            ->where('previous', null)
            ->where('next.id', $older->id));

    $this->get(route('articles.show', $newer->slug))
        ->assertInertia(fn (Assert $page) => $page
            ->where('previous.id', $current->id)
            ->where('next', null));
});

test('articles published at the same moment are ordered by id', function () {
    $date = now()->subDay();
    $first = publishedArticleDaysAgo(1, ['published_date' => $date]);
    $second = publishedArticleDaysAgo(1, ['published_date' => $date]);

    $this->get(route('articles.show', $second->slug))
        ->assertInertia(fn (Assert $page) => $page
            ->where('previous.id', $first->id)
            ->where('next', null));
});
