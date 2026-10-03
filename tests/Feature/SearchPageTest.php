<?php

use App\Models\Article;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    $this->author = User::factory()->create();
});

/**
 * Create a published article by the test author whose text is the given sentence.
 */
function searchableArticle(string $text, array $attributes = []): Article
{
    return Article::factory()
        ->for(test()->author, 'author')
        ->published($attributes['published_date'] ?? now()->subDay())
        ->create(['raw_content' => $text, ...$attributes]);
}

test('search ignores accents and matches word forms', function () {
    $match = searchableArticle('Les démocraties africaines face au vote.');
    searchableArticle('Un texte sur la cuisine malgache.');

    $this->get(route('search', ['q' => 'democratie']))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('search')
            ->where('query', 'democratie')
            ->where('results.total', 1)
            ->where('results.data.0.id', $match->id)
            ->has('latest', 0));
});

test('only published articles are found', function () {
    $published = searchableArticle('La démocratie au quotidien.');
    Article::factory()->for($this->author, 'author')->create(['raw_content' => 'La démocratie en brouillon.']);
    Article::factory()->for($this->author, 'author')->archived()->create(['raw_content' => 'La démocratie archivée.']);
    Article::factory()->for($this->author, 'author')->published(now()->addDay())->create(['raw_content' => 'La démocratie demain.']);
    searchableArticle('La démocratie supprimée.')->delete();

    $this->get(route('search', ['q' => 'démocratie']))
        ->assertInertia(fn (Assert $page) => $page
            ->where('results.total', 1)
            ->where('results.data.0.id', $published->id));
});

test('the best match comes first', function () {
    $weak = searchableArticle('La démocratie, une fois, puis tout autre chose: la pluie, le vent, la mer.', ['published_date' => now()->subHour()]);
    $strong = searchableArticle('Démocratie, démocratie, démocratie: la démocratie partout.', ['published_date' => now()->subYear()]);

    $this->get(route('search', ['q' => 'démocratie']))
        ->assertInertia(fn (Assert $page) => $page
            ->where('results.data.0.id', $strong->id)
            ->where('results.data.1.id', $weak->id));
});

test('the excerpt highlights matched words in their accented form', function () {
    searchableArticle('Il suffit d’écouter le marché pour comprendre que la démocratie se joue au quotidien.');

    $this->get(route('search', ['q' => 'democratie']))
        ->assertInertia(fn (Assert $page) => $page
            ->where('results.data.0.excerpt', [
                ['text' => 'Il suffit d’écouter le marché pour comprendre que la ', 'highlighted' => false],
                ['text' => 'démocratie', 'highlighted' => true],
                ['text' => ' se joue au quotidien.', 'highlighted' => false],
            ]));
});

test('results are paginated by ten and keep the query in page links', function () {
    collect(range(1, 12))->each(fn (int $day) => searchableArticle('La démocratie, épisode '.$day.'.', ['published_date' => now()->subDays($day)]));

    $this->get(route('search', ['q' => 'démocratie', 'page' => 2]))
        ->assertInertia(fn (Assert $page) => $page
            ->where('results.total', 12)
            ->has('results.data', 2)
            ->where('results.currentPage', 2)
            ->where('results.lastPage', 2)
            ->where('results.nextUrl', null)
            ->where('results.previousUrl', fn (string $url) => str_contains($url, 'q=d%C3%A9mocratie') && str_contains($url, 'page=1')));
});

test('no result suggests the three latest articles', function () {
    collect(range(1, 4))->each(fn (int $day) => searchableArticle('Un texte sur la cuisine.', ['published_date' => now()->subDays($day)]));

    $this->get(route('search', ['q' => 'parapluie']))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('results.total', 0)
            ->has('results.data', 0)
            ->has('latest', 3));
});

test('search syntax and stray punctuation never break the query', function (string $query) {
    searchableArticle('La démocratie au quotidien.');

    $this->get(route('search', ['q' => $query]))->assertOk();
})->with(['"démocratie', '-démocratie', 'or', "l'élection", '& | ! :*', '<script>']);

test('an empty query goes back to the home page', function () {
    $this->get(route('search', ['q' => '   ']))->assertRedirect(route('home'));
});
