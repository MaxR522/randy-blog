<?php

use App\Models\Article;
use App\Models\Category;
use App\Models\User;
use Illuminate\Support\Carbon;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    $this->author = User::factory()->create();
});

/**
 * Create a published article by the test author, published the given number of days ago.
 */
function publishedArticle(int $daysAgo, array $attributes = []): Article
{
    return Article::factory()
        ->for(test()->author, 'author')
        ->published(now()->subDays($daysAgo))
        ->create($attributes);
}

test('home page renders without any article', function () {
    $this->get(route('home'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('home')
            ->has('latest', 0)
            ->has('categorySections', 0)
            ->has('articles.data', 0));
});

test('only published articles are shown', function () {
    $published = publishedArticle(1);
    Article::factory()->for($this->author, 'author')->create();
    Article::factory()->for($this->author, 'author')->archived()->create();
    Article::factory()->for($this->author, 'author')->published(now()->addDay())->create();
    publishedArticle(2)->delete();

    $this->get(route('home'))
        ->assertInertia(fn (Assert $page) => $page
            ->where('latest.0.id', $published->id)
            ->has('latest', 1)
            ->has('articles.data', 1));
});

test('latest shows the five newest articles', function () {
    $articles = collect(range(1, 8))->map(fn (int $daysAgo) => publishedArticle($daysAgo));

    $this->get(route('home'))
        ->assertInertia(fn (Assert $page) => $page
            ->where('latest', fn ($latest) => collect($latest)->pluck('id')->all() === $articles->take(5)->pluck('id')->all()));
});

test('cards carry the data the design needs', function () {
    Carbon::setTestNow('2026-09-21 12:00:00');
    $category = Category::factory()->create(['value' => 'Politique']);
    $article = publishedArticle(0, [
        'title' => 'Le vote, ce rendez-vous manqué ',
        'lead_paragraph' => '<p>Une <strong>chronique</strong> d&rsquo;un pays qui attend.</p>',
        'published_date' => '2026-07-01 08:00:00',
    ]);
    $article->categories()->attach($category);

    $this->get(route('home'))
        ->assertInertia(fn (Assert $page) => $page
            ->where('latest.0.title', 'Le vote, ce rendez-vous manqué')
            ->where('latest.0.chapo', 'Une chronique d’un pays qui attend.')
            ->where('latest.0.dateLabel', '1er juillet 2026')
            ->where('latest.0.categories', [['id' => $category->id, 'name' => 'Politique']])
            ->where('latest.0.cover', $article->cover_photo));
});

test('category sections need three published articles, newest first, at most four rows of four', function () {
    $categories = Category::factory()->count(6)->create();
    $tooSmall = Category::factory()->create();

    foreach ($categories as $index => $category) {
        foreach (range(1, 5) as $position) {
            publishedArticle(($index * 10) + $position)->categories()->attach($category);
        }
    }

    publishedArticle(0)->categories()->attach($tooSmall);
    publishedArticle(0)->categories()->attach($tooSmall);
    Article::factory()->for($this->author, 'author')->create()->categories()->attach($tooSmall);

    $this->get(route('home'))
        ->assertInertia(fn (Assert $page) => $page
            ->has('categorySections', 4)
            ->where('categorySections', fn ($sections) => collect($sections)->pluck('id')->all() === $categories->take(4)->pluck('id')->all())
            ->has('categorySections.0.articles', 4));
});

test('all articles are paginated by nine and load the next page in place', function () {
    collect(range(1, 12))->each(fn (int $daysAgo) => publishedArticle($daysAgo));

    $this->get(route('home'))
        ->assertInertia(fn (Assert $page) => $page->has('articles.data', 9));

    $this->get(route('home', ['page' => 2]))
        ->assertInertia(fn (Assert $page) => $page
            ->reloadOnly('articles', fn (Assert $reload) => $reload
                ->has('articles.data', 3)
                ->missing('latest')
                ->missing('categorySections')));
});
