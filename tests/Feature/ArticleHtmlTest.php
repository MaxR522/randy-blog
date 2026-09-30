<?php

use App\Support\ArticleHtml;

test('empty input gives an empty string', function (?string $html) {
    expect(ArticleHtml::sanitize($html))->toBe('');
})->with([null, '', '   ']);

test('unsafe markup is removed (NFR-SEC-3)', function () {
    $html = '<p onclick="steal()" style="color:red">Texte</p><script>alert(1)</script><style>p{}</style>'
        .'<a href="javascript:alert(1)">lien</a><form><input name="x"></form>';

    expect(ArticleHtml::sanitize($html))->toBe('<p>Texte</p><a>lien</a>');
});

test('unknown elements keep their text', function () {
    expect(ArticleHtml::sanitize('<p><font color="red">Texte</font></p>'))->toBe('<p>Texte</p>');
});

test('long content is not truncated', function () {
    $html = str_repeat('<p>Un paragraphe assez long pour dépasser la limite par défaut du sanitizer.</p>', 1000);

    expect(ArticleHtml::sanitize($html))->toBe($html);
});

test('headings start at h2 and stop at h4 (SEO-CONT-1)', function () {
    expect(ArticleHtml::sanitize('<h1 lang="en">Un</h1><h3>Trois</h3><h5>Cinq</h5><h6>Six</h6>'))
        ->toBe('<h2 lang="en">Un</h2><h3>Trois</h3><h4>Cinq</h4><h4>Six</h4>');
});

test('the Encadré keeps its class and note role, other classes and roles go', function () {
    expect(ArticleHtml::sanitize('<div class="callout-box mce-x" role="note"><h4>Titre</h4></div><p class="x" role="button">Texte</p>'))
        ->toBe('<div class="callout-box" role="note"><h4>Titre</h4></div><p>Texte</p>');
});

test('accessibility attributes survive (A11Y-BODY-1)', function () {
    $html = '<figure><img src="https://res.cloudinary.com/x/image/upload/a.jpg" alt="Un marché"><figcaption>Légende</figcaption></figure>'
        .'<p lang="mg"><abbr title="Organisation des Nations unies">ONU</abbr></p>';

    expect(ArticleHtml::sanitize($html))->toBe(
        '<figure><img src="https://res.cloudinary.com/x/image/upload/a.jpg" alt="Un marché" loading="lazy" decoding="async"><figcaption>Légende</figcaption></figure>'
        .'<p lang="mg"><abbr title="Organisation des Nations unies">ONU</abbr></p>'
    );
});

test('images without alt text are marked decorative', function () {
    expect(ArticleHtml::sanitize('<img src="https://example.com/a.jpg">'))
        ->toBe('<img src="https://example.com/a.jpg" loading="lazy" decoding="async" alt="">');
});

test('tables keep their headers and scroll in a labelled box', function () {
    expect(ArticleHtml::sanitize('<table><caption>Délais</caption><tr><th scope="row">A</th><td colspan="2">B</td></tr></table>'))
        ->toBe('<div class="table-scroll" role="region" tabindex="0" aria-label="Délais"><table><caption>Délais</caption><tbody><tr><th scope="row">A</th><td colspan="2">B</td></tr></tbody></table></div>');
});

test('links opening a new tab get noopener', function () {
    expect(ArticleHtml::sanitize('<a href="https://example.com" target="_blank">A</a><a href="/articles/x" target="_self">B</a>'))
        ->toBe('<a href="https://example.com" target="_blank" rel="noopener noreferrer">A</a><a href="/articles/x">B</a>');
});

test('YouTube iframes are wrapped in a titled video box, other iframes removed', function () {
    $html = '<p><iframe src="https://www.youtube.com/embed/abc"></iframe></p>'
        .'<div class="video"><iframe src="https://www.youtube-nocookie.com/embed/def" title="Réunion"></iframe></div>'
        .'<iframe src="https://evil.example.com/embed"></iframe>';

    expect(ArticleHtml::sanitize($html))->toBe(
        '<div class="video"><iframe src="https://www.youtube.com/embed/abc" title="Vidéo YouTube"></iframe></div>'
        .'<div class="video"><iframe src="https://www.youtube-nocookie.com/embed/def" title="Réunion"></iframe></div>'
    );
});

test('Cloudinary videos keep their controls, other sources and empty videos are removed', function () {
    $html = '<video style="display: table;" poster="" controls="controls" width="500" height="250">'
        .'<source src="https://res.cloudinary.com/randy-blog/video/upload/a.mp4" type="video/mp4">'
        .'<source src="https://evil.example.com/b.mp4" type="video/mp4"></video>'
        .'<video src="https://evil.example.com/c.mp4"></video>';

    expect(ArticleHtml::sanitize($html))->toBe(
        '<video controls="" width="500" height="250" preload="metadata" playsinline="">'
        .'<source src="https://res.cloudinary.com/randy-blog/video/upload/a.mp4" type="video/mp4"></video>'
    );
});
