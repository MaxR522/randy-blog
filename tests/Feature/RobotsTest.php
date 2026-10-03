<?php

use Illuminate\Support\Facades\Route;

test('SEO-CRAWL-2 robots.txt closes everything outside production', function () {
    $this->get('/robots.txt')
        ->assertOk()
        ->assertHeader('Content-Type', 'text/plain; charset=UTF-8')
        ->assertSeeText("User-agent: *\nDisallow: /\n", escape: false);
});

test('SEO-CRAWL-2 robots.txt in production keeps crawlers out of private paths and points to the sitemap', function () {
    $this->app['env'] = 'production';

    $robots = $this->get('/robots.txt')->assertOk()->getContent();

    expect($robots)
        ->toContain("User-agent: *\nDisallow: /admin\nDisallow: /abonnement/\nDisallow: /recherche\n")
        ->toContain('Sitemap: '.route('sitemap'))
        ->not->toContain("Disallow: /\n");
});

test('SEO-CRAWL-2 robots.txt in production names AI crawlers with the same rules', function () {
    $this->app['env'] = 'production';

    $robots = $this->get('/robots.txt')->getContent();

    expect($robots)->toContain("User-agent: GPTBot\n", "User-agent: ClaudeBot\n", "User-agent: PerplexityBot\n", "User-agent: Google-Extended\n")
        ->and(substr_count($robots, 'Disallow: /admin'))->toBe(2)
        ->and($robots)->not->toContain('Allow:');
});

test('SEO-CRAWL-2 every response outside production carries X-Robots-Tag noindex', function () {
    $this->get(route('privacy'))->assertHeader('X-Robots-Tag', 'noindex, nofollow');
});

test('SEO-CRAWL-2 production responses carry no X-Robots-Tag', function () {
    $this->app['env'] = 'production';

    $this->get(route('privacy'))->assertHeaderMissing('X-Robots-Tag');
});

test('SEO-CRAWL-3 admin responses carry X-Robots-Tag noindex in production', function () {
    $this->app['env'] = 'production';
    Route::middleware('web')->get('/admin/articles', fn () => 'admin');

    $this->get('/admin/articles')->assertHeader('X-Robots-Tag', 'noindex, nofollow');
});

test('SEO-CRAWL-2 a local copy can be opened to crawlers for an audit', function () {
    config(['blog.indexable' => 'true']);

    expect($this->get('/robots.txt')->getContent())->toContain("Disallow: /admin\n")->not->toContain("Disallow: /\n");
    $this->get(route('privacy'))->assertHeaderMissing('X-Robots-Tag');
});

test('SEO-CRAWL-2 production can be closed to crawlers', function () {
    $this->app['env'] = 'production';
    config(['blog.indexable' => 'false']);

    $this->get('/robots.txt')->assertSeeText("User-agent: *\nDisallow: /\n", escape: false);
    $this->get(route('privacy'))->assertHeader('X-Robots-Tag', 'noindex, nofollow');
});
