<?php

use App\Models\Article;
use App\Models\Category;

test('the RSS feed lists published articles with their full sanitized text', function () {
    $category = Category::factory()->create(['value' => 'Culture']);
    $article = Article::factory()->published()->create([
        'title' => 'Un article',
        'lead_paragraph' => '<p>Le chapô.</p>',
        'content' => '<p>Le texte.</p><script>alert(1)</script>',
    ]);
    $article->categories()->attach($category);
    $draft = Article::factory()->create();

    $response = $this->get('/feed.xml')
        ->assertOk()
        ->assertHeader('Content-Type', 'application/rss+xml; charset=UTF-8');
    $item = simplexml_load_string($response->getContent())->channel->item;

    expect($item)->toHaveCount(1)
        ->and((string) $item->title)->toBe('Un article')
        ->and((string) $item->link)->toBe(route('articles.show', $article->slug))
        ->and((string) $item->category)->toBe('Culture')
        ->and((string) $item->children('content', true)->encoded)->toBe('<p>Le chapô.</p><p>Le texte.</p>')
        ->and($response->getContent())->not->toContain($draft->slug);
});
