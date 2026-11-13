<?php

use App\Models\Newsletter;
use App\Models\Subscription;
use App\NewsletterRecipientStatus;
use App\NewsletterStatus;

beforeEach(function () {
    config(['services.brevo.webhook_token' => 'secret-token']);
});

test('the webhook refuses a missing or wrong token, and is off without one', function () {
    $subscription = Subscription::factory()->create();
    $event = ['event' => 'spam', 'email' => $subscription->email];

    $this->postJson('/webhooks/brevo', $event)->assertUnauthorized();
    $this->withToken('wrong')->postJson('/webhooks/brevo', $event)->assertUnauthorized();

    config(['services.brevo.webhook_token' => null]);
    $this->withToken('secret-token')->postJson('/webhooks/brevo', $event)->assertNotFound();

    expect($subscription->refresh()->unsubscribed_at)->toBeNull();
});

test('a spam complaint or an unsubscribe through Brevo unsubscribes the address, with a bearer or basic token', function () {
    $complaining = Subscription::factory()->create(['email' => 'plainte@exemple.fr']);
    $leaving = Subscription::factory()->create();

    $this->withToken('secret-token')->postJson('/webhooks/brevo', ['event' => 'spam', 'email' => 'Plainte@Exemple.fr'])->assertOk();
    $this->withBasicAuth('brevo', 'secret-token')->postJson('/webhooks/brevo', ['event' => 'unsubscribed', 'email' => $leaving->email])->assertOk();

    expect($complaining->refresh()->unsubscribed_at)->not->toBeNull()
        ->and($leaving->refresh()->unsubscribed_at)->not->toBeNull();
});

test('a hard bounce unsubscribes the address and moves its newsletter email from delivered to failed', function () {
    $subscription = Subscription::factory()->create();
    $newsletter = Newsletter::factory()->sent()->create(['recipients_count' => 1, 'sent_count' => 1]);
    $recipient = $newsletter->recipients()->create(['subscription_id' => $subscription->id, 'status' => NewsletterRecipientStatus::Sent, 'sent_at' => now()]);

    $this->withToken('secret-token')->postJson('/webhooks/brevo', [[
        'event' => 'hard_bounce',
        'email' => $subscription->email,
        'reason' => 'mailbox does not exist',
        'X-Mailin-custom' => 'newsletter-recipient:'.$recipient->id,
    ]])->assertOk();

    expect($subscription->refresh()->unsubscribed_at)->not->toBeNull()
        ->and($recipient->refresh()->status)->toBe(NewsletterRecipientStatus::Failed)
        ->and($recipient->error)->toBe('mailbox does not exist')
        ->and($newsletter->refresh()->sent_count)->toBe(0)
        ->and($newsletter->failed_count)->toBe(1)
        ->and($newsletter->status)->toBe(NewsletterStatus::PartiallyFailed);
});

test('a hard bounce counts a newsletter email as failed only once', function () {
    $subscription = Subscription::factory()->create();
    $newsletter = Newsletter::factory()->sent()->create(['recipients_count' => 1, 'sent_count' => 1]);
    $recipient = $newsletter->recipients()->create(['subscription_id' => $subscription->id, 'status' => NewsletterRecipientStatus::Sent]);
    $event = ['event' => 'hard_bounce', 'email' => $subscription->email, 'X-Mailin-custom' => 'newsletter-recipient:'.$recipient->id];

    $this->withToken('secret-token')->postJson('/webhooks/brevo', $event)->assertOk();
    $this->withToken('secret-token')->postJson('/webhooks/brevo', $event)->assertOk();

    expect($newsletter->refresh()->failed_count)->toBe(1)
        ->and($newsletter->sent_count)->toBe(0);
});

test('other events are acknowledged and change nothing', function () {
    $subscription = Subscription::factory()->create();

    $this->withToken('secret-token')
        ->postJson('/webhooks/brevo', ['event' => 'soft_bounce', 'email' => $subscription->email])
        ->assertOk();

    expect($subscription->refresh()->unsubscribed_at)->toBeNull();
});
