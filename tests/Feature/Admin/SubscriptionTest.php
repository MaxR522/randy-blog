<?php

use App\Models\Subscription;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    $this->author = User::factory()->create();
});

test('ADM-COM-8 guests get a 404 on every subscriber route', function (string $method) {
    $subscription = Subscription::factory()->create();

    $this->{$method}($method === 'get' ? '/admin/abonnements' : "/admin/abonnements/{$subscription->id}")->assertNotFound();

    expect($subscription->fresh())->not->toBeNull();
})->with(['get', 'delete']);

test('ADM-SUB-2 the list shows each subscriber with its status, most recent first', function () {
    Subscription::factory()->create(['email' => 'ancien@exemple.fr', 'created_at' => now()->subDays(3)]);
    Subscription::factory()->pending()->create(['email' => 'attente@exemple.fr', 'created_at' => now()->subDay()]);
    Subscription::factory()->unsubscribed()->create(['email' => 'parti@exemple.fr', 'created_at' => now()->subDays(2)]);
    Subscription::factory()->trashed()->create(['email' => 'efface@exemple.fr']);

    $this->actingAs($this->author)
        ->get('/admin/abonnements')
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/subscriptions')
            ->where('subscriptions.data.0.email', 'attente@exemple.fr')
            ->where('subscriptions.data.0.status', 'pending')
            ->where('subscriptions.data.1.status', 'unsubscribed')
            ->where('subscriptions.data.2.status', 'confirmed')
            ->where('subscriptions.total', 3)
            ->where('subscriberCount', 3));
});

test('ADM-SUB-3 the list is searched by email and filtered by status', function (array $query, array $expected) {
    Subscription::factory()->create(['email' => 'claire@exemple.fr']);
    Subscription::factory()->pending()->create(['email' => 'claude@exemple.fr']);
    Subscription::factory()->unsubscribed()->create(['email' => 'paul@exemple.fr']);

    $this->actingAs($this->author)
        ->get('/admin/abonnements?'.http_build_query($query))
        ->assertInertia(function (Assert $page) use ($expected) {
            expect(array_column($page->toArray()['props']['subscriptions']['data'], 'email'))->toEqualCanonicalizing($expected);
        });
})->with([
    'search' => [['q' => 'CLA'], ['claire@exemple.fr', 'claude@exemple.fr']],
    'search escapes wildcards' => [['q' => '%'], []],
    'confirmed' => [['status' => 'confirmed'], ['claire@exemple.fr']],
    'pending' => [['status' => 'pending'], ['claude@exemple.fr']],
    'unsubscribed' => [['status' => 'unsubscribed'], ['paul@exemple.fr']],
    'search and status' => [['q' => 'cla', 'status' => 'pending'], ['claude@exemple.fr']],
]);

test('ADM-SUB-4 « Supprimer » erases the address for good', function () {
    $subscription = Subscription::factory()->create();

    $this->actingAs($this->author)
        ->from('/admin/abonnements')
        ->delete("/admin/abonnements/{$subscription->id}")
        ->assertRedirect('/admin/abonnements')
        ->assertInertiaFlash('success', 'Abonné supprimé.');

    expect(Subscription::withTrashed()->find($subscription->id))->toBeNull();
});
