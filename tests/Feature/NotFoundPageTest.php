<?php

use Inertia\Testing\AssertableInertia as Assert;

test('a missing page renders the public 404 page with a real 404 status', function () {
    $this->get('/page-qui-n-existe-pas')
        ->assertNotFound()
        ->assertInertia(fn (Assert $page) => $page->component('not-found'));
});

test('an unknown article slug renders the public 404 page', function () {
    $this->get('/articles/inconnu')
        ->assertNotFound()
        ->assertInertia(fn (Assert $page) => $page->component('not-found'));
});

test('a JSON request to a missing page still gets a JSON 404', function () {
    $this->getJson('/page-qui-n-existe-pas')
        ->assertNotFound()
        ->assertHeader('Content-Type', 'application/json');
});
