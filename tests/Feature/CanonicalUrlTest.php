<?php

use App\Http\Middleware\CanonicalUrl;
use Illuminate\Http\Request;

beforeEach(function () {
    config(['app.url' => 'https://randy-donny.com']);
});

test('SEO-CRAWL-5 the www host and a trailing slash redirect to the canonical URL in one hop', function () {
    $this->app['env'] = 'production';

    $this->get('https://www.randy-donny.com/politique-de-confidentialite/?a=1')
        ->assertStatus(301)
        ->assertRedirect('https://randy-donny.com/politique-de-confidentialite?a=1');
});

test('SEO-CRAWL-5 a trailing slash on the canonical host redirects without it', function () {
    $this->app['env'] = 'production';

    // The test client trims trailing slashes, so the request goes to the middleware directly.
    $response = (new CanonicalUrl)->handle(
        Request::create('https://randy-donny.com/politique-de-confidentialite/'),
        fn () => response('page'),
    );

    expect($response->getStatusCode())->toBe(301)
        ->and($response->headers->get('Location'))->toBe('https://randy-donny.com/politique-de-confidentialite');
});

test('SEO-CRAWL-5 the canonical URL is served as is', function () {
    $this->app['env'] = 'production';

    $this->get('https://randy-donny.com/politique-de-confidentialite')->assertOk();
});

test('SEO-CRAWL-5 nothing redirects outside production', function () {
    $this->get('https://www.randy-donny.com/politique-de-confidentialite')->assertOk();
});
