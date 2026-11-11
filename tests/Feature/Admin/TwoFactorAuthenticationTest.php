<?php

use App\Models\LoginEvent;
use App\Models\User;
use App\Notifications\TwoFactorDisabled;
use App\Notifications\TwoFactorEnabled;
use Illuminate\Support\Facades\Notification;
use Inertia\Testing\AssertableInertia as Assert;
use Laravel\Fortify\Fortify;
use PragmaRX\Google2FA\Google2FA;

const TwoFactorPassword = 'mot-de-passe-actuel';

const TwoFactorRecoveryCodes = ['AAAAAAAAAA-BBBBBBBBBB', 'CCCCCCCCCC-DDDDDDDDDD'];

beforeEach(function () {
    $this->author = User::factory()->create(['email' => 'randy@randy-donny.com', 'password' => TwoFactorPassword]);
});

/**
 * An account with 2FA already confirmed, as the Security tab leaves it.
 */
function withConfirmedTwoFactor(User $user): User
{
    $user->forceFill([
        'two_factor_secret' => Fortify::currentEncrypter()->encrypt(app(Google2FA::class)->generateSecretKey()),
        'two_factor_recovery_codes' => Fortify::currentEncrypter()->encrypt(json_encode(TwoFactorRecoveryCodes)),
        'two_factor_confirmed_at' => now(),
    ])->save();

    return $user;
}

function currentTwoFactorCode(User $user): string
{
    return app(Google2FA::class)->getCurrentOtp(Fortify::currentEncrypter()->decrypt((string) $user->fresh()?->two_factor_secret));
}

function passwordStep(bool $remember = false): mixed
{
    return test()->post(route('login.store'), ['email' => 'randy@randy-donny.com', 'password' => TwoFactorPassword, 'remember' => $remember]);
}

test('ADM-SEC-4 enabling needs the password, then shows the QR code and the key until a code confirms them', function () {
    $this->actingAs($this->author)
        ->post(route('admin.account.two-factor.enable'), ['password' => 'faux'])
        ->assertSessionHasErrors(['password' => 'Le mot de passe est incorrect.']);
    expect($this->author->fresh()->two_factor_secret)->toBeNull();

    $this->actingAs($this->author)
        ->post(route('admin.account.two-factor.enable'), ['password' => TwoFactorPassword])
        ->assertRedirect();

    expect($this->author->fresh())
        ->two_factor_secret->not->toBeNull()
        ->two_factor_confirmed_at->toBeNull()
        ->hasEnabledTwoFactorAuthentication()->toBeFalse();

    $this->actingAs($this->author)->get(route('admin.account.security'))
        ->assertInertia(fn (Assert $page) => $page
            ->where('security.twoFactor.enabled', false)
            ->where('security.twoFactor.pending', true)
            ->where('security.twoFactor.qrCodeSvg', fn (string $svg): bool => str_contains($svg, '<svg'))
            ->whereType('security.twoFactor.secretKey', 'string'));
});

test('ADM-SEC-4 a wrong code does not confirm, the right one turns 2FA on, alerts and flashes the recovery codes once', function () {
    Notification::fake();
    $this->actingAs($this->author)->post(route('admin.account.two-factor.enable'), ['password' => TwoFactorPassword]);

    $this->actingAs($this->author)
        ->put(route('admin.account.two-factor.confirm'), ['code' => '000000'])
        ->assertSessionHasErrors('code');
    expect($this->author->fresh()->hasEnabledTwoFactorAuthentication())->toBeFalse();

    $code = currentTwoFactorCode($this->author);
    $response = $this->actingAs($this->author)
        ->put(route('admin.account.two-factor.confirm'), ['code' => substr($code, 0, 3).' '.substr($code, 3)]);

    $author = $this->author->fresh();
    expect($author->hasEnabledTwoFactorAuthentication())->toBeTrue();
    $response->assertRedirect()->assertInertiaFlash('recoveryCodes', $author->recoveryCodes());
    Notification::assertSentTo($author, TwoFactorEnabled::class);

    $this->actingAs($author)->get(route('admin.account.security'))
        ->assertInertia(fn (Assert $page) => $page->hasFlash('recoveryCodes'));
    $this->actingAs($author)->get(route('admin.account.security'))
        ->assertInertia(fn (Assert $page) => $page
            ->missingFlash('recoveryCodes')
            ->where('security.twoFactor.enabled', true)
            ->where('security.twoFactor.qrCodeSvg', null)
            ->where('security.twoFactor.secretKey', null));
});

test('ADM-SEC-4 « Annuler » drops an unconfirmed setup but never a confirmed 2FA', function () {
    $this->actingAs($this->author)->post(route('admin.account.two-factor.enable'), ['password' => TwoFactorPassword]);
    $this->actingAs($this->author)->delete(route('admin.account.two-factor.cancel'));
    expect($this->author->fresh()->two_factor_secret)->toBeNull();

    withConfirmedTwoFactor($this->author);
    $this->actingAs($this->author)->delete(route('admin.account.two-factor.cancel'));
    expect($this->author->fresh()->hasEnabledTwoFactorAuthentication())->toBeTrue();
});

test('ADM-SEC-4 regenerating the recovery codes needs the password and replaces them', function () {
    withConfirmedTwoFactor($this->author);

    $this->actingAs($this->author)
        ->post(route('admin.account.two-factor.recovery-codes'), ['password' => 'faux'])
        ->assertSessionHasErrors('password');
    expect($this->author->fresh()->recoveryCodes())->toBe(TwoFactorRecoveryCodes);

    $this->actingAs($this->author)
        ->post(route('admin.account.two-factor.recovery-codes'), ['password' => TwoFactorPassword])
        ->assertRedirect()
        ->assertInertiaFlash('recoveryCodes');
    expect($this->author->fresh()->recoveryCodes())->toHaveCount(8)->not->toContain(TwoFactorRecoveryCodes[0]);
});

test('ADM-SEC-4 disabling needs the password and sends an alert', function () {
    Notification::fake();
    withConfirmedTwoFactor($this->author);

    $this->actingAs($this->author)
        ->delete(route('admin.account.two-factor.disable'), ['password' => 'faux'])
        ->assertSessionHasErrors('password');
    expect($this->author->fresh()->hasEnabledTwoFactorAuthentication())->toBeTrue();

    $this->actingAs($this->author)
        ->delete(route('admin.account.two-factor.disable'), ['password' => TwoFactorPassword])
        ->assertRedirect();

    expect($this->author->fresh())->two_factor_secret->toBeNull()->two_factor_recovery_codes->toBeNull();
    Notification::assertSentTo($this->author, TwoFactorDisabled::class);
});

test('ADM-SEC-4 the secret and the recovery codes never leave the model', function () {
    withConfirmedTwoFactor($this->author);

    expect($this->author->fresh()->toArray())->not->toHaveKeys(['two_factor_secret', 'two_factor_recovery_codes']);
});

test('ADM-SEC-4 with 2FA on, the password leads to the challenge without logging in', function () {
    withConfirmedTwoFactor($this->author);

    passwordStep()->assertRedirect(route('two-factor.login'));

    $this->assertGuest();
    $this->get(route('two-factor.login'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->component('admin/two-factor-challenge'));
});

test('ADM-SEC-4 the challenge without a pending login goes back to the login page', function () {
    $this->get(route('two-factor.login'))->assertRedirect(route('login'));
});

test('ADM-SEC-4 the right code logs in, keeps « Se souvenir de moi » and records a 2FA login', function () {
    withConfirmedTwoFactor($this->author);
    passwordStep(remember: true);

    $response = $this->post(route('two-factor.login.store'), ['code' => currentTwoFactorCode($this->author)]);

    $response->assertRedirect('/admin');
    $this->assertAuthenticatedAs($this->author);
    $response->assertCookie(auth()->guard('web')->getRecallerName());
    expect(LoginEvent::query()->sole())->succeeded->toBeTrue()->two_factor_used->toBeTrue();
});

test('ADM-SEC-4 a wrong code is refused in French and recorded as a failed 2FA login', function () {
    withConfirmedTwoFactor($this->author);
    passwordStep();

    $this->post(route('two-factor.login.store'), ['code' => '000000'])
        ->assertRedirect(route('two-factor.login'))
        ->assertSessionHasErrors(['code' => 'Ce code est incorrect.']);

    $this->assertGuest();
    expect(LoginEvent::query()->sole())->succeeded->toBeFalse()->two_factor_used->toBeTrue();
});

test('ADM-SEC-4 a recovery code logs in once', function () {
    withConfirmedTwoFactor($this->author);
    passwordStep();

    $this->post(route('two-factor.login.store'), ['recovery_code' => TwoFactorRecoveryCodes[0]])->assertRedirect('/admin');
    $this->assertAuthenticatedAs($this->author);
    expect($this->author->fresh()->recoveryCodes())->not->toContain(TwoFactorRecoveryCodes[0])->toHaveCount(2);

    $this->post(route('logout'));
    passwordStep();

    $this->post(route('two-factor.login.store'), ['recovery_code' => TwoFactorRecoveryCodes[0]])
        ->assertSessionHasErrors(['recovery_code' => 'Ce code de récupération est incorrect.']);
    $this->assertGuest();
});

test('NFR-SEC-4 the challenge allows 5 codes a minute and answers on the form', function () {
    withConfirmedTwoFactor($this->author);
    passwordStep();

    foreach (range(1, 5) as $attempt) {
        $this->post(route('two-factor.login.store'), ['code' => '000000']);
    }

    $this->post(route('two-factor.login.store'), ['code' => currentTwoFactorCode($this->author)])
        ->assertSessionHasErrors('code');
    $this->assertGuest();
});
