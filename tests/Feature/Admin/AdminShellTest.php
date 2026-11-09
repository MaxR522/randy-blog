<?php

use App\Models\User;
use Illuminate\Support\Facades\Http;
use Inertia\Testing\AssertableInertia as Assert;

test('Q10 guests get the public 404 on every admin page', function (string $path) {
    $this->get($path)
        ->assertNotFound()
        ->assertInertia(fn (Assert $page) => $page->component('not-found'));
})->with(['/admin', '/admin/articles', '/admin/categories', '/admin/abonnements', '/admin/compte']);

test('Q10 guests get a 404 on logout too', function () {
    $this->post('/admin/deconnexion')->assertNotFound();
});

test('SEO-CRAWL-3 the login page answers guests and carries the noindex header in production', function () {
    $this->app['env'] = 'production';

    $this->get('/admin/connexion')
        ->assertOk()
        ->assertHeader('X-Robots-Tag', 'noindex, nofollow')
        ->assertInertia(fn (Assert $page) => $page->component('admin/login'));
});

test('a logged-in author is sent from /admin to the articles', function () {
    $this->actingAs(User::factory()->create())
        ->get('/admin')
        ->assertRedirect('/admin/articles');
});

test('a logged-in author skips the login pages', function (string $path) {
    $this->actingAs(User::factory()->create())
        ->get($path)
        ->assertRedirect('/admin');
})->with(['/admin/connexion', '/admin/mot-de-passe-oublie']);

test('each section opens for a logged-in author', function (string $path, string $title) {
    $this->actingAs(User::factory()->create())
        ->get($path)
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->component('admin/placeholder')->where('title', $title));
})->with([
    ['/admin/abonnements', 'Abonnements'],
    ['/admin/compte', 'Compte'],
]);

test('a session opened before a password change is logged out', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->withSession(['password_hash_web' => 'hash-de-l-ancien-mot-de-passe'])
        ->get('/admin/articles')
        ->assertRedirect('/admin/connexion');

    $this->assertGuest();
});

test('the shared user exposes only what the shell displays', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->get('/admin/articles')
        ->assertInertia(fn (Assert $page) => $page
            ->where('auth.user', [
                'id' => $user->id,
                'avatar' => null,
            ]));
});

test('NFR-PERF-1 admin pages skip SSR while public pages use it', function () {
    config(['inertia.ssr.enabled' => true, 'inertia.ssr.ensure_bundle_exists' => false]);
    Http::fake(['*' => Http::response(['head' => [], 'body' => '<div></div>'])]);

    $this->get('/admin/connexion')->assertOk();
    Http::assertNothingSent();

    $this->get('/politique-de-confidentialite')->assertOk();
    Http::assertSentCount(1);
});
