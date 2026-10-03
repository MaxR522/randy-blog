<?php

use App\Models\Article;
use App\Models\User;

test('SEO-MAP-1 the sitemap lists the pages and only the published articles with their last change', function () {
    $this->travelTo('2026-09-21 12:00:00');
    $author = User::factory()->create(['slug' => 'randy-donny']);
    $published = Article::factory()->for($author, 'author')->published(now()->subDay())->create([
        'cover_photo' => 'https://res.cloudinary.com/randy-blog/image/upload/f_auto,q_70/cover',
    ]);
    $draft = Article::factory()->for($author, 'author')->create();
    $archived = Article::factory()->for($author, 'author')->archived()->create();
    $scheduled = Article::factory()->for($author, 'author')->published(now()->addDay())->create();

    $response = $this->get('/sitemap.xml')
        ->assertOk()
        ->assertHeader('Content-Type', 'application/xml; charset=UTF-8');
    $xml = simplexml_load_string($response->getContent());
    $entries = collect(iterator_to_array($xml->url, false))->mapWithKeys(fn (SimpleXMLElement $url) => [(string) $url->loc => (string) $url->lastmod]);

    expect($entries->keys()->all())->toBe([
        url('/').'/',
        route('profile.show', 'randy-donny'),
        route('privacy'),
        route('articles.show', $published->slug),
    ])
        ->and($entries[route('articles.show', $published->slug)])->toBe('2026-09-21T12:00:00+00:00')
        ->and($response->getContent())
        ->toContain('<image:loc>https://res.cloudinary.com/randy-blog/image/upload/w_1200,c_limit,f_jpg,q_auto/cover</image:loc>')
        ->not->toContain($draft->slug, $archived->slug, $scheduled->slug);
});

test('SEO-MAP-2 the sitemap shows an article as soon as it is published', function () {
    $article = Article::factory()->create();
    $this->get('/sitemap.xml')->assertDontSee($article->slug);

    $article->update(['status' => 'PUBLISHED', 'published_date' => now()->subMinute()]);

    $this->get('/sitemap.xml')->assertSee(route('articles.show', $article->slug));
});
