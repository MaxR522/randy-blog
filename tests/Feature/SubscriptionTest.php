<?php

use App\Models\Subscription;
use App\Notifications\ConfirmSubscription;
use App\Support\DnsResolver;
use Illuminate\Support\Facades\Notification;
use Illuminate\Testing\TestResponse;
use Inertia\Testing\AssertableInertia as Assert;

/**
 * Domains that receive mail in these tests; every other domain has no MX record. No network involved.
 */
beforeEach(function () {
    app()->instance(DnsResolver::class, new class extends DnsResolver
    {
        public function acceptsMail(string $domain): bool
        {
            return in_array($domain, ['exemple.fr', 'mailinator.com', 'x.mailinator.com'], true);
        }
    });
});

function subscribe(string $email, array $extra = []): TestResponse
{
    return test()->from('/')->post('/abonnement', ['email' => $email, ...$extra]);
}

test('PUB-SUB-4 a new address is stored as pending and gets a confirmation link valid 48 hours', function () {
    Notification::fake();
    $this->freezeSecond();

    subscribe(' Lecteur@Exemple.fr ')
        ->assertRedirect('/')
        ->assertSessionHasNoErrors()
        ->assertInertiaFlash('subscribed', true);

    $subscription = Subscription::sole();
    expect($subscription->email)->toBe('lecteur@exemple.fr')
        ->and($subscription->is_verified)->toBeFalse()
        ->and($subscription->last_confirmation_sent_at->equalTo(now()))->toBeTrue();

    Notification::assertSentTo($subscription, ConfirmSubscription::class, function (ConfirmSubscription $notification) {
        parse_str((string) parse_url($notification->confirmationUrl, PHP_URL_QUERY), $query);

        return (int) $query['expires'] === now()->addHours(48)->getTimestamp();
    });
});

test('PUB-SUB-2 an address refused by the checks gets its French message and is not stored', function (string $email, string $message) {
    Notification::fake();

    subscribe($email)->assertSessionHasErrors(['email' => $message]);

    expect(Subscription::count())->toBe(0);
    Notification::assertNothingSent();
})->with([
    'empty' => ['', 'Veuillez saisir une adresse email valide.'],
    'malformed' => ['lecteur@', 'Veuillez saisir une adresse email valide.'],
    'domain without mail server' => ['lecteur@domaine-inconnu.fr', 'Veuillez saisir une adresse email valide.'],
    'disposable' => ['lecteur@mailinator.com', 'Les adresses email temporaires ne sont pas acceptées.'],
    'disposable subdomain' => ['lecteur@x.mailinator.com', 'Les adresses email temporaires ne sont pas acceptées.'],
]);

test('PUB-SUB-3 a filled honeypot gets the usual answer and nothing is stored', function () {
    Notification::fake();

    subscribe('robot@exemple.fr', ['website' => 'https://spam.example'])
        ->assertSessionHasNoErrors()
        ->assertInertiaFlash('subscribed', true);

    expect(Subscription::count())->toBe(0);
    Notification::assertNothingSent();
});

test('PUB-SUB-3 the form takes 5 attempts per IP per hour', function () {
    Notification::fake();

    foreach (range(1, 5) as $attempt) {
        subscribe("lecteur{$attempt}@exemple.fr")->assertSessionHasNoErrors();
    }

    subscribe('lecteur6@exemple.fr')->assertSessionHasErrors(['email' => 'Trop de tentatives. Réessayez dans une heure.']);

    expect(Subscription::count())->toBe(5);
});

test('PUB-SUB-5 a confirmed address gets the same answer and no new email', function () {
    Notification::fake();
    $subscription = Subscription::factory()->create(['email' => 'lecteur@exemple.fr']);

    subscribe('Lecteur@exemple.fr')->assertSessionHasNoErrors()->assertInertiaFlash('subscribed', true);

    expect($subscription->fresh()->is_verified)->toBeTrue();
    Notification::assertNothingSent();
});

test('PUB-SUB-5 a pending address gets the email again at most every 10 minutes', function () {
    Notification::fake();
    $subscription = Subscription::factory()->pending()->create([
        'email' => 'lecteur@exemple.fr',
        'last_confirmation_sent_at' => now()->subMinutes(9),
    ]);

    subscribe('lecteur@exemple.fr')->assertInertiaFlash('subscribed', true);
    Notification::assertNothingSent();

    $this->travel(2)->minutes();
    subscribe('lecteur@exemple.fr')->assertInertiaFlash('subscribed', true);
    Notification::assertSentToTimes($subscription, ConfirmSubscription::class, 1);
});

test('PUB-SUB-5 an unsubscribed or erased address restarts as pending', function (string $state) {
    Notification::fake();
    $subscription = Subscription::factory()->{$state}()->create([
        'email' => 'lecteur@exemple.fr',
        'created_at' => now()->subYear(),
    ]);

    subscribe('lecteur@exemple.fr')->assertInertiaFlash('subscribed', true);

    $subscription = Subscription::sole();
    expect($subscription->status->value)->toBe('pending')
        ->and($subscription->created_at->isToday())->toBeTrue();
    Notification::assertSentTo($subscription, ConfirmSubscription::class);
})->with([
    'unsubscribed' => ['unsubscribed'],
    'soft deleted in V1' => ['trashed'],
]);

test('PUB-SUB-6 the confirmation link confirms the address and keeps the IP as proof', function () {
    $subscription = Subscription::factory()->pending()->create();

    $this->get($subscription->confirmationUrl(), ['REMOTE_ADDR' => '203.0.113.7'])
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('subscription-status')
            ->where('state', 'confirmed')
            ->where('seo.robots', 'noindex, nofollow'));

    $subscription->refresh();
    expect($subscription->is_verified)->toBeTrue()
        ->and($subscription->verified_at)->not->toBeNull()
        ->and($subscription->confirmed_ip)->toBe('203.0.113.7');
});

test('PUB-SUB-6 an expired, tampered or obsolete link shows the expired page and confirms nothing', function (Closure $link) {
    $subscription = Subscription::factory()->pending()->create();

    $this->get($link($subscription))
        ->assertForbidden()
        ->assertInertia(fn (Assert $page) => $page->component('subscription-status')->where('state', 'expired'));

    expect($subscription->fresh()?->is_verified)->not->toBeTrue();
})->with([
    'expired' => [function (Subscription $subscription): string {
        $url = $subscription->confirmationUrl();
        test()->travel(49)->hours();

        return $url;
    }],
    'tampered' => [fn (Subscription $subscription): string => str_replace('confirmer/'.$subscription->id, 'confirmer/'.($subscription->id + 1), $subscription->confirmationUrl())],
    'address erased since' => [function (Subscription $subscription): string {
        $url = $subscription->confirmationUrl();
        $subscription->forceDelete();

        return $url;
    }],
]);

test('PUB-SUB-6 an old confirmation link does not resubscribe an address that unsubscribed', function () {
    $subscription = Subscription::factory()->pending()->create();
    $url = $subscription->confirmationUrl();
    $subscription->update(['unsubscribed_at' => now()]);

    $this->get($url)->assertForbidden();

    expect($subscription->fresh()->status->value)->toBe('unsubscribed');
});

test('PUB-SUB-8 the unsubscribe link unsubscribes in one click and shows the page', function () {
    $subscription = Subscription::factory()->create();

    $this->get($subscription->unsubscribeUrl())
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->component('subscription-status')->where('state', 'unsubscribed'));

    expect($subscription->fresh()->unsubscribed_at)->not->toBeNull();
});

test('PUB-SUB-8 mail clients unsubscribe with a one-click POST, without a CSRF token', function () {
    $subscription = Subscription::factory()->create();

    $this->post($subscription->unsubscribeUrl(), ['List-Unsubscribe' => 'One-Click'])->assertOk();

    expect($subscription->fresh()->unsubscribed_at)->not->toBeNull();
});

test('PUB-SUB-8 an unsigned unsubscribe link is a 404', function () {
    $subscription = Subscription::factory()->create();

    $this->get('/abonnement/desabonner/'.$subscription->id)->assertNotFound();

    expect($subscription->fresh()->unsubscribed_at)->toBeNull();
});

test('PUB-SUB-9 pending addresses never confirmed for 30 days are purged', function () {
    $stale = Subscription::factory()->pending()->create(['last_confirmation_sent_at' => now()->subDays(31)]);
    $recent = Subscription::factory()->pending()->create(['last_confirmation_sent_at' => now()->subDays(29)]);
    $confirmed = Subscription::factory()->create(['last_confirmation_sent_at' => now()->subDays(400)]);

    $this->artisan('model:prune', ['--model' => [Subscription::class]])->assertSuccessful();

    expect(Subscription::withTrashed()->pluck('id')->all())->toEqualCanonicalizing([$recent->id, $confirmed->id])
        ->and(Subscription::withTrashed()->find($stale->id))->toBeNull();
});
