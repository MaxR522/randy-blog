<?php

use App\Models\Article;

test('llms.txt describes the blog and links every published article in Markdown', function () {
    $article = Article::factory()->published()->create(['title' => 'Un article', 'description' => 'Sa description.']);
    $draft = Article::factory()->create();

    $text = $this->get('/llms.txt')
        ->assertOk()
        ->assertHeader('Content-Type', 'text/plain; charset=UTF-8')
        ->getContent();

    expect($text)
        ->toStartWith("# Randy Donny\n\n> ".config('blog.description'))
        ->toContain('- [Un article]('.route('articles.markdown', $article->slug).') ('.$article->published_date->toDateString().'): Sa description.')
        ->toContain(route('llms-full'))
        ->not->toContain($draft->slug);
});

test('llms-full.txt holds the text of every published article', function () {
    Article::factory()->published()->create(['title' => 'Premier', 'content' => '<p>Texte du premier.</p>']);
    Article::factory()->published()->create(['title' => 'Second', 'content' => '<p>Texte du second.</p>']);
    Article::factory()->create(['content' => '<p>Brouillon secret.</p>']);

    $this->get('/llms-full.txt')
        ->assertOk()
        ->assertSeeText('# Premier', escape: false)
        ->assertSeeText('Texte du premier.', escape: false)
        ->assertSeeText('Texte du second.', escape: false)
        ->assertDontSeeText('Brouillon secret.', escape: false);
});
