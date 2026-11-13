<?php

use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('the measurement id is shared on public pages', function () {
    config(['services.google_analytics.measurement_id' => 'G-TEST123']);

    $this->get(route('privacy'))
        ->assertInertia(fn (Assert $page) => $page->where('analytics.measurementId', 'G-TEST123'));
});

test('the measurement id is null when it is not configured', function () {
    config(['services.google_analytics.measurement_id' => '']);

    $this->get(route('privacy'))
        ->assertInertia(fn (Assert $page) => $page->where('analytics.measurementId', null));
});

test('the measurement id is never shared on admin pages', function () {
    config(['services.google_analytics.measurement_id' => 'G-TEST123']);

    $this->actingAs(User::factory()->create())
        ->get('/admin/articles')
        ->assertInertia(fn (Assert $page) => $page->where('analytics.measurementId', null));
});
