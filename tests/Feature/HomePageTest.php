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
            ->has('articles.data', 0));
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
            publishedArticle(100 + ($index * 10) + $position)->categories()->attach($category);
        }
    }

    collect(range(1, 5))->each(fn (int $daysAgo) => publishedArticle($daysAgo));
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
    collect(range(1, 19))->each(fn (int $daysAgo) => publishedArticle($daysAgo));

    $this->get(route('home'))
        ->assertInertia(fn (Assert $page) => $page->has('articles.data', 9));

    $this->get(route('home', ['page' => 2]))
        ->assertInertia(fn (Assert $page) => $page
            ->reloadOnly('articles', fn (Assert $reload) => $reload
                ->has('articles.data', 5)
                ->missing('latest')
                ->missing('categorySections')));
});

/**
 * IDs of the articles a home page response shows, section by section (empty for a section the response leaves out).
 *
 * @return array{latest: list<int>, rows: array<int, list<int>>, articles: list<int>}
 */
function homeSections(Assert $page): array
{
    $props = $page->toArray()['props'];

    return [
        'latest' => array_column($props['latest'] ?? [], 'id'),
        'rows' => collect($props['categorySections'] ?? [])
            ->mapWithKeys(fn (array $row): array => [$row['id'] => array_column($row['articles'], 'id')])
            ->all(),
        'articles' => array_column($props['articles']['data'], 'id'),
    ];
}

/**
 * Sections of the home page as a visitor first loads it.
 *
 * @return array{latest: list<int>, rows: array<int, list<int>>, articles: list<int>}
 */
function visitHome(array $query = []): array
{
    $sections = [];

    test()->get(route('home', $query))
        ->assertOk()
        ->assertInertia(function (Assert $page) use (&$sections) {
            $sections = homeSections($page);
        });

    return $sections;
}

test('an article appears at most once on the home page, every page of all articles included', function () {
    $categories = Category::factory()->count(3)->create();

    foreach (range(1, 40) as $daysAgo) {
        $article = publishedArticle($daysAgo);
        $article->categories()->attach($categories[$daysAgo % 3]);

        if ($daysAgo % 4 === 0) {
            $article->categories()->attach($categories[($daysAgo + 1) % 3]);
        }
    }

    $firstPage = visitHome();
    $shown = [...$firstPage['latest'], ...array_merge(...array_values($firstPage['rows'])), ...$firstPage['articles']];

    $nextPage = [];
    $this->get(route('home', ['page' => 2]))
        ->assertInertia(function (Assert $page) use (&$nextPage) {
            $page->reloadOnly('articles', function (Assert $reload) use (&$nextPage) {
                $nextPage = homeSections($reload)['articles'];
            });
        });

    $everything = [...$shown, ...$nextPage];

    expect($firstPage['rows'])->toHaveCount(3)
        ->and($firstPage['articles'])->toHaveCount(9)
        ->and($nextPage)->toHaveCount(9)
        ->and(array_unique($everything))->toHaveCount(5 + 12 + 9 + 9);
});

test('the second page of all articles renders server-side without the articles shown above', function () {
    collect(range(1, 19))->each(fn (int $daysAgo) => publishedArticle($daysAgo));

    $firstPage = visitHome();
    $secondPage = visitHome(['page' => 2]);

    expect($secondPage['latest'])->toBe($firstPage['latest'])
        ->and($secondPage['articles'])->toHaveCount(5)
        ->and(array_intersect($secondPage['articles'], [...$firstPage['latest'], ...$firstPage['articles']]))->toBeEmpty();
});

test('a category row takes its next articles when the newest are already in the latest publications', function () {
    $history = Category::factory()->create();
    $uncategorised = collect([1, 2])->map(fn (int $daysAgo) => publishedArticle($daysAgo));
    $historyArticles = collect(range(3, 12))->map(function (int $daysAgo) use ($history) {
        $article = publishedArticle($daysAgo);
        $article->categories()->attach($history);

        return $article;
    });

    $sections = visitHome();

    expect($sections['latest'])->toBe([...$uncategorised->pluck('id'), ...$historyArticles->take(3)->pluck('id')])
        ->and($sections['rows'])->toBe([$history->id => $historyArticles->slice(3, 4)->pluck('id')->all()])
        ->and($sections['articles'])->toBe($historyArticles->slice(7)->pluck('id')->all());
});

test('an article in two categories appears only in the higher row', function () {
    collect(range(1, 5))->each(fn (int $daysAgo) => publishedArticle($daysAgo));
    [$higher, $lower] = Category::factory()->count(2)->create();

    $shared = publishedArticle(10);
    $shared->categories()->attach([$higher->id, $lower->id]);
    $higherArticles = collect(range(11, 13))->map(function (int $daysAgo) use ($higher) {
        $article = publishedArticle($daysAgo);
        $article->categories()->attach($higher);

        return $article;
    });
    $lowerArticles = collect(range(20, 24))->map(function (int $daysAgo) use ($lower) {
        $article = publishedArticle($daysAgo);
        $article->categories()->attach($lower);

        return $article;
    });

    $sections = visitHome();

    expect($sections['rows'])->toBe([
        $higher->id => [$shared->id, ...$higherArticles->pluck('id')],
        $lower->id => $lowerArticles->take(4)->pluck('id')->all(),
    ]);
});

test('a row shows whatever is left, and a category with nothing left gives its place to the next one', function () {
    $categories = Category::factory()->count(5)->create();
    $sizes = [3, 4, 3, 3, 3];
    $daysAgo = 0;
    $articles = [];

    foreach ($categories as $index => $category) {
        foreach (range(1, $sizes[$index]) as $position) {
            $article = publishedArticle(++$daysAgo);
            $article->categories()->attach($category);
            $articles[$index][] = $article->id;
        }
    }

    $sections = visitHome();

    expect($sections['latest'])->toBe([...$articles[0], $articles[1][0], $articles[1][1]])
        ->and(array_keys($sections['rows']))->toBe($categories->slice(1)->pluck('id')->all())
        ->and($sections['rows'][$categories[1]->id])->toBe([$articles[1][2], $articles[1][3]]);
});
