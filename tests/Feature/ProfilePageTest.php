<?php

use App\Models\Article;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    $this->author = User::factory()->create([
        'name' => 'Randy Donny',
        'display_name' => 'The man I used to be...',
        'slug' => 'randy-donny',
        'avatar' => 'https://res.cloudinary.com/randy-blog/image/upload/v1/portrait.jpg',
        'avatar_credit' => 'Jean Dupont',
        'bio' => '<p>Historien de formation.</p><script>alert(1)</script><p><span id="ancre"></span></p>',
    ]);
});

test('the profile page shows the author with a sanitized biography', function () {
    $this->get('/profil/randy-donny')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('profile')
            ->where('author.name', 'The man I used to be...')
            ->where('author.fullName', 'Randy Donny')
            ->where('author.avatar', 'https://res.cloudinary.com/randy-blog/image/upload/v1/portrait.jpg')
            ->where('author.avatarCredit', 'Jean Dupont')
            ->where('author.bioHtml', '<p>Historien de formation.</p>')
            ->where('author.description', 'Historien de formation.'));
});

test('the profile name falls back to the account name without a display name', function () {
    $this->author->forceFill(['display_name' => null])->save();

    $this->get('/profil/randy-donny')
        ->assertInertia(fn (Assert $page) => $page->where('author.name', 'Randy Donny'));
});

test('the profile lists the three latest published articles of the author', function () {
    $articles = collect([1, 2, 3, 4])->map(fn (int $daysAgo) => Article::factory()
        ->for($this->author, 'author')
        ->published(now()->subDays($daysAgo))
        ->create());
    Article::factory()->for($this->author, 'author')->create();
    Article::factory()->for($this->author, 'author')->archived()->create();
    Article::factory()->for($this->author, 'author')->published(now()->addDay())->create();
    Article::factory()->for(User::factory(), 'author')->published(now()->subHour())->create();

    $this->get('/profil/randy-donny')
        ->assertInertia(fn (Assert $page) => $page
            ->where('latest', fn ($latest) => collect($latest)->pluck('id')->all() === $articles->take(3)->pluck('id')->all()));
});

test('an unknown profile answers 404', function () {
    $this->get('/profil/inconnu')->assertNotFound();
});

test('the V1 profile URL redirects permanently to the new one (SEO-CRAWL-5)', function () {
    $this->get('/profile/randy-donny')
        ->assertStatus(301)
        ->assertRedirect(route('profile.show', 'randy-donny'));
});
