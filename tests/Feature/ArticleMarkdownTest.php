<?php

use App\Models\Article;
use App\Models\User;

test('a published article is served as Markdown, canonical to its page and not indexed', function () {
    $this->app['env'] = 'production';
    $this->travelTo('2026-09-21 12:00:00');
    $author = User::factory()->create(['slug' => 'randy-donny']);
    $article = Article::factory()->for($author, 'author')->published(now()->subDays(2))->create([
        'title' => 'Un article',
        'slug' => 'un-article',
        'lead_paragraph' => '<p>Le chapô.</p>',
        'content' => '<p>Le texte.</p>',
        'read_duration' => 4,
    ]);

    $response = $this->get('/articles/un-article.md')
        ->assertOk()
        ->assertHeader('Content-Type', 'text/markdown; charset=UTF-8')
        ->assertHeader('Link', '<'.route('articles.show', 'un-article').'>; rel="canonical"')
        ->assertHeader('X-Robots-Tag', 'noindex');

    expect($response->getContent())
        ->toStartWith("---\ntitle: \"Un article\"\nurl: \"".route('articles.show', 'un-article')."\"\nauthor: \"Randy Donny\"")
        ->toContain("# Un article\n\n*Par Randy Donny · 19 septembre 2026 · 4 min de lecture*\n\nLe chapô.\n\nLe texte.\n\n---\n\nSource : [Un article](".route('articles.show', 'un-article').')');
});

test('the Markdown copy of a draft is missing', function () {
    $article = Article::factory()->create();

    $this->get(route('articles.markdown', $article->slug))->assertNotFound();
});

test('the Markdown copy of an archived article is gone', function () {
    $article = Article::factory()->archived()->create();

    $this->get(route('articles.markdown', $article->slug))->assertStatus(410);
});

test('the article HTML becomes Markdown', function () {
    $article = Article::factory()->published()->create([
        'lead_paragraph' => null,
        'content' => <<<'HTML'
            <h1>Grand titre</h1>
            <p>Du <strong>gras</strong>, de l’<em>italique</em> et un <a href="https://example.com/page">lien</a>.<br>Ligne suivante.</p>
            <ul><li>Un<ul><li>Un point un</li></ul></li><li>Deux</li></ul>
            <ol><li>Premier</li><li>Second</li></ol>
            <blockquote><p>Une citation.</p></blockquote>
            <div class="callout-box"><h4>À retenir</h4><p>Le point clé.</p></div>
            <table><tr><th>Année</th><th>Fait</th></tr><tr><td>1896</td><td>Abolition</td></tr></table>
            <p>Un astérisque * et un [crochet].</p>
            HTML,
    ]);

    expect($this->get(route('articles.markdown', $article->slug))->getContent())->toContain(<<<'MARKDOWN'
        ## Grand titre

        Du **gras**, de l’*italique* et un [lien](https://example.com/page).  
        Ligne suivante.

        - Un
            - Un point un
        - Deux

        1. Premier
        2. Second

        > Une citation.

        > #### À retenir
        >
        > Le point clé.

        | Année | Fait |
        | --- | --- |
        | 1896 | Abolition |

        Un astérisque \* et un \[crochet\].
        MARKDOWN);
});
