<?php

use Inertia\Testing\AssertableInertia as Assert;

test('the privacy policy page is public', function () {
    $this->get(route('privacy'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->component('privacy'));
});
