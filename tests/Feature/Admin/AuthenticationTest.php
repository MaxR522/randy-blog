<?php

use App\Models\User;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Password;
use Inertia\Testing\AssertableInertia as Assert;

const AdminLoginPassword = 'mot-de-passe-actuel';
const AdminNewPassword = 'Nouveau-mot-de-passe-1';

function adminUser(): User
{
    return User::factory()->create(['password' => AdminLoginPassword]);
}

test('ADM-AUTH-1 the author logs in and lands on the admin panel', function () {
    $user = adminUser();

    $this->post(route('login.store'), ['email' => $user->email, 'password' => AdminLoginPassword])
        ->assertRedirect('/admin');

    $this->assertAuthenticatedAs($user);
});

test('ADM-AUTH-1 a wrong password and an unknown email get the same French message', function () {
    $user = adminUser();
    $message = 'Ces identifiants ne correspondent pas à nos enregistrements.';

    $this->post(route('login.store'), ['email' => $user->email, 'password' => 'faux'])
        ->assertSessionHasErrors(['email' => $message]);
    $this->post(route('login.store'), ['email' => 'inconnu@example.com', 'password' => 'faux'])
        ->assertSessionHasErrors(['email' => $message]);

    $this->assertGuest();
});

test('ADM-AUTH-1 the sixth attempt in a minute is refused on the form, even with the right password', function () {
    $this->freezeTime();
    $user = adminUser();

    foreach (range(1, 5) as $attempt) {
        $this->post(route('login.store'), ['email' => $user->email, 'password' => 'faux']);
    }

    $this->post(route('login.store'), ['email' => $user->email, 'password' => AdminLoginPassword])
        ->assertRedirect()
        ->assertSessionHasErrors(['email' => 'Trop de tentatives. Réessayez dans 60 secondes.']);

    $this->assertGuest();
});

test('ADM-AUTH-1 the throttle counts per email, so another address is not locked out', function () {
    $user = adminUser();

    foreach (range(1, 5) as $attempt) {
        $this->post(route('login.store'), ['email' => 'inconnu@example.com', 'password' => 'faux']);
    }

    $this->post(route('login.store'), ['email' => $user->email, 'password' => AdminLoginPassword])
        ->assertRedirect('/admin');
});

test('a soft-deleted user cannot log in', function () {
    $user = adminUser();
    $user->delete();

    $this->post(route('login.store'), ['email' => $user->email, 'password' => AdminLoginPassword])
        ->assertSessionHasErrors('email');

    $this->assertGuest();
});

test('ADM-AUTH-4 « Se souvenir de moi » sets a cookie that lasts 30 days', function () {
    $user = adminUser();

    $response = $this->post(route('login.store'), ['email' => $user->email, 'password' => AdminLoginPassword, 'remember' => '1']);

    $cookie = collect($response->headers->getCookies())
        ->first(fn ($cookie) => str_starts_with($cookie->getName(), 'remember_web_'));

    expect($cookie)->not->toBeNull()
        ->and($cookie->getExpiresTime())->toBeGreaterThan(now()->addDays(29)->timestamp)
        ->and($cookie->getExpiresTime())->toBeLessThanOrEqual(now()->addDays(30)->addMinute()->timestamp);
});

test('ADM-AUTH-4 no remember cookie is set without the checkbox', function () {
    $user = adminUser();

    $response = $this->post(route('login.store'), ['email' => $user->email, 'password' => AdminLoginPassword]);

    expect(collect($response->headers->getCookies())->map->getName()->implode(' '))->not->toContain('remember_web_');
});

test('ADM-AUTH-3 logging out ends the session and returns to the login page', function () {
    $this->actingAs(adminUser())
        ->post(route('logout'))
        ->assertRedirect('/admin/connexion');

    $this->assertGuest();
});

test('ADM-AUTH-3 logging out needs a POST', function () {
    $this->actingAs(adminUser())->get('/admin/deconnexion')->assertMethodNotAllowed();

    $this->assertAuthenticated();
});

test('there is no registration route', function () {
    $this->get('/register')->assertNotFound();
    $this->post('/register')->assertNotFound();
});

test('ADM-AUTH-2 a known address gets a French reset link valid at the French URL', function () {
    Notification::fake();
    $user = adminUser();

    $this->from(route('password.request'))->post(route('password.email'), ['email' => $user->email])
        ->assertRedirect(route('password.request'))
        ->assertSessionHas('status', 'Si un compte existe pour cette adresse, un lien vient d’être envoyé.');

    Notification::assertSentTo($user, ResetPassword::class, function (ResetPassword $notification) use ($user): bool {
        $mail = $notification->toMail($user);

        return $mail->subject === 'Réinitialisation de votre mot de passe'
            && str_contains($mail->actionUrl, "/admin/reinitialisation/{$notification->token}");
    });
});

test('ADM-AUTH-2 an unknown address gets the identical answer and no email', function () {
    Notification::fake();

    $this->from(route('password.request'))->post(route('password.email'), ['email' => 'inconnu@example.com'])
        ->assertRedirect(route('password.request'))
        ->assertSessionHasNoErrors()
        ->assertSessionHas('status', 'Si un compte existe pour cette adresse, un lien vient d’être envoyé.');

    Notification::assertNothingSent();
});

test('NFR-SEC-4 reset requests are throttled with a French error, not a 429 page', function () {
    Notification::fake();
    $this->freezeTime();

    foreach (range(1, 5) as $attempt) {
        $this->post(route('password.email'), ['email' => 'inconnu@example.com']);
    }

    $this->from(route('password.request'))->post(route('password.email'), ['email' => 'inconnu@example.com'])
        ->assertRedirect(route('password.request'))
        ->assertSessionHasErrors(['email' => 'Trop de tentatives. Réessayez dans 60 secondes.']);
});

test('ADM-AUTH-2 a valid token changes the password, rotates the remember token and returns to login', function () {
    $user = adminUser();
    $rememberToken = $user->remember_token;

    $this->post(route('password.update'), [
        'token' => Password::createToken($user),
        'email' => $user->email,
        'password' => AdminNewPassword,
        'password_confirmation' => AdminNewPassword,
    ])->assertRedirect(route('login'))->assertSessionHas('status', 'Votre mot de passe a été réinitialisé.');

    $user->refresh();

    expect(Hash::check(AdminNewPassword, $user->password))->toBeTrue()
        ->and($user->remember_token)->not->toBe($rememberToken);
});

test('ADM-AUTH-2 an invalid token leaves the password unchanged', function () {
    $user = adminUser();

    $this->post(route('password.update'), [
        'token' => 'invalide',
        'email' => $user->email,
        'password' => AdminNewPassword,
        'password_confirmation' => AdminNewPassword,
    ])->assertSessionHasErrors(['email' => 'Ce lien de réinitialisation du mot de passe n\'est pas valide.']);

    expect(Hash::check(AdminLoginPassword, $user->fresh()->password))->toBeTrue();
});

test('ADM-AUTH-2 the new password must be confirmed', function () {
    $user = adminUser();

    $this->post(route('password.update'), [
        'token' => Password::createToken($user),
        'email' => $user->email,
        'password' => AdminNewPassword,
        'password_confirmation' => 'different',
    ])->assertSessionHasErrors('password');

    expect(Hash::check(AdminLoginPassword, $user->fresh()->password))->toBeTrue();
});

test('the reset page receives the token and address from the emailed link', function () {
    $this->get(route('password.reset', ['token' => 'jeton', 'email' => 'randy@example.com']))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/reset-password')
            ->where('token', 'jeton')
            ->where('email', 'randy@example.com'));
});

test('the login page shows the status left by a password reset', function () {
    $this->withSession(['status' => 'Votre mot de passe a été réinitialisé.'])
        ->get(route('login'))
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/login')
            ->where('status', 'Votre mot de passe a été réinitialisé.'));
});
