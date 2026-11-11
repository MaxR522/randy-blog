<?php

use App\Models\LoginEvent;
use App\Models\User;
use App\Notifications\ConfirmRecoveryEmail;
use App\Notifications\NewDeviceLogin;
use App\Notifications\PasswordChanged;
use App\Notifications\RecoveryEmailChanged;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Notifications\AnonymousNotifiable;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\Str;
use Inertia\Testing\AssertableInertia as Assert;

const SecurityPassword = 'mot-de-passe-actuel';

const SecurityNewPassword = 'Nouveau-mot-de-passe-1!';

const FirefoxLinux = 'Mozilla/5.0 (X11; Linux x86_64; rv:132.0) Gecko/20100101 Firefox/132.0';

const SafariIphone = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Mobile/15E148 Safari/604.1';

beforeEach(function () {
    $this->author = User::factory()->create(['email' => 'randy@randy-donny.com', 'password' => SecurityPassword]);
});

/**
 * A row of the `sessions` table, as the database session driver writes it.
 */
function storeSession(User $user, string $userAgent = SafariIphone, ?int $lastActivity = null, string $ip = '102.16.31.140'): string
{
    $id = Str::random(40);

    DB::table('sessions')->insert([
        'id' => $id,
        'user_id' => $user->id,
        'ip_address' => $ip,
        'user_agent' => $userAgent,
        'payload' => '',
        'last_activity' => $lastActivity ?? now()->subMinutes(30)->timestamp,
    ]);

    return $id;
}

/**
 * The key the page gives a device: a browser at an IP address.
 */
function deviceKey(string $userAgent, string $ip = '102.16.31.140'): string
{
    return Str::substr(hash_hmac('sha256', $userAgent.'|'.$ip, config('app.key')), 0, 32);
}

/**
 * Act on the panel from the session `$sessionId`, so that the controller sees it as « Cet appareil ».
 */
function onDevice(User $user, string $sessionId): mixed
{
    return test()->actingAs($user)->withCookie(config('session.cookie'), $sessionId);
}

function recoveryEmailConfirmationUrl(User $user, string $address, int $minutes = 60): string
{
    return URL::temporarySignedRoute('admin.account.recovery-email.confirm', now()->addMinutes($minutes), [
        'user' => $user->id,
        'hash' => sha1($address),
    ]);
}

test('ADM-COM-8 guests get a 404 on the security routes and nothing changes', function (string $method, string $path) {
    $this->{$method}($path, ['password' => SecurityPassword, 'recovery_email' => 'pirate@example.com', 'recovery_phone' => '+261340000000'])
        ->assertNotFound();

    expect($this->author->fresh())->recovery_email->toBeNull()->recovery_phone->toBeNull();
})->with([
    ['get', '/admin/compte/securite'],
    ['put', '/admin/compte/mot-de-passe'],
    ['put', '/admin/compte/email-recuperation'],
    ['delete', '/admin/compte/email-recuperation'],
    ['put', '/admin/compte/telephone-recuperation'],
    ['delete', '/admin/compte/appareils'],
    ['delete', '/admin/compte/appareils/abc'],
]);

test('§5.6.2 the security tab shows the recovery details, the devices and the history', function () {
    $this->author->forceFill(['recovery_email' => 'secours@example.com', 'recovery_email_verified_at' => now(), 'recovery_phone' => '+261340000000'])->save();
    $currentSession = storeSession($this->author, FirefoxLinux, now()->timestamp);
    storeSession($this->author, SafariIphone);
    storeSession(User::factory()->create());
    LoginEvent::factory()->for($this->author)->failed()->create(['user_agent' => SafariIphone, 'created_at' => now()->subDay()]);
    LoginEvent::factory()->for($this->author)->create(['created_at' => now()]);

    onDevice($this->author, $currentSession)
        ->get(route('admin.account.security'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/account-security')
            ->where('security.recoveryEmail', 'secours@example.com')
            ->where('security.recoveryEmailVerified', true)
            ->where('security.recoveryPhone', '+261340000000')
            ->has('security.devices', 2)
            ->where('security.devices.0.isCurrent', true)
            ->where('security.devices.0.device', 'Firefox · Linux · ordinateur')
            ->where('security.devices.0.lastActivity', 'Maintenant')
            ->where('security.devices.1.isCurrent', false)
            ->where('security.devices.1.device', 'Safari · iOS · mobile')
            ->where('security.devices.1.lastActivity', 'Il y a 30 minutes')
            ->has('security.loginEvents', 2)
            ->where('security.loginEvents.0.succeeded', true)
            ->where('security.loginEvents.1.succeeded', false)
            ->where('security.loginEvents.1.device', 'Safari · iOS'));
});

test('ADM-SEC-5 session IDs never reach the page', function () {
    $otherSession = storeSession($this->author);

    $this->actingAs($this->author)
        ->get(route('admin.account.security'))
        ->assertOk()
        ->assertDontSee($otherSession);
});

test('ADM-SEC-6 the history lists the last 50 logins only', function () {
    LoginEvent::factory()->for($this->author)->count(55)->create();

    $this->actingAs($this->author)
        ->get(route('admin.account.security'))
        ->assertInertia(fn (Assert $page) => $page->has('security.loginEvents', LoginEvent::HistoryLength));
});

test('ADM-SEC-3 a new password logs out the other devices and sends an alert to both addresses', function () {
    Notification::fake();
    $this->author->forceFill(['recovery_email' => 'secours@example.com', 'recovery_email_verified_at' => now()])->save();
    $currentSession = storeSession($this->author, FirefoxLinux);
    $otherSession = storeSession($this->author);
    $rememberToken = $this->author->remember_token;

    onDevice($this->author, $currentSession)
        ->put(route('admin.account.password'), [
            'current_password' => SecurityPassword,
            'password' => SecurityNewPassword,
            'password_confirmation' => SecurityNewPassword,
        ])
        ->assertSessionHasNoErrors()
        ->assertRedirect();

    $author = $this->author->fresh();

    expect(Hash::check(SecurityNewPassword, $author->password))->toBeTrue()
        ->and($author->remember_token)->not->toBe($rememberToken)
        ->and(DB::table('sessions')->where('id', $otherSession)->exists())->toBeFalse()
        ->and(DB::table('sessions')->where('id', $currentSession)->exists())->toBeTrue();

    $this->assertAuthenticatedAs($author);

    Notification::assertSentTo($author, PasswordChanged::class, fn (PasswordChanged $notification, array $channels, User $notifiable): bool => $notifiable->routeNotificationForMail($notification) === ['randy@randy-donny.com', 'secours@example.com']);
});

test('ADM-SEC-3 the password form refuses invalid input with French messages', function (array $input, string $field, string $message) {
    Notification::fake();

    $this->actingAs($this->author)
        ->from(route('admin.account.security'))
        ->put(route('admin.account.password'), $input)
        ->assertSessionHasErrors([$field => $message]);

    expect(Hash::check(SecurityPassword, $this->author->fresh()->password))->toBeTrue();
    Notification::assertNothingSent();
})->with([
    'wrong current password' => [['current_password' => 'faux', 'password' => SecurityNewPassword, 'password_confirmation' => SecurityNewPassword], 'current_password', 'Le mot de passe actuel est incorrect.'],
    'confirmation mismatch' => [['current_password' => SecurityPassword, 'password' => SecurityNewPassword, 'password_confirmation' => 'autre'], 'password', 'La confirmation ne correspond pas au nouveau mot de passe.'],
    'same as current' => [['current_password' => SecurityPassword, 'password' => SecurityPassword, 'password_confirmation' => SecurityPassword], 'password', 'Le nouveau mot de passe doit être différent de l’actuel.'],
]);

test('ADM-SEC-1 a recovery email is stored unverified and gets a verification link', function () {
    Notification::fake();

    $this->actingAs($this->author)
        ->put(route('admin.account.recovery-email'), ['recovery_email' => ' Secours@Example.com ', 'password' => SecurityPassword])
        ->assertSessionHasNoErrors();

    expect($this->author->fresh())
        ->recovery_email->toBe('secours@example.com')
        ->recovery_email_verified_at->toBeNull();

    Notification::assertSentOnDemand(ConfirmRecoveryEmail::class, fn (ConfirmRecoveryEmail $notification, array $channels, AnonymousNotifiable $notifiable): bool => $notifiable->routes['mail'] === 'secours@example.com');
    Notification::assertSentOnDemand(RecoveryEmailChanged::class, fn (RecoveryEmailChanged $notification, array $channels, AnonymousNotifiable $notifiable): bool => $notifiable->routes['mail'] === 'randy@randy-donny.com');
});

test('ADM-SEC-1 the recovery email form refuses invalid input', function (array $input, string $field, string $message) {
    Notification::fake();

    $this->actingAs($this->author)
        ->from(route('admin.account.security'))
        ->put(route('admin.account.recovery-email'), $input)
        ->assertSessionHasErrors([$field => $message]);

    expect($this->author->fresh()->recovery_email)->toBeNull();
    Notification::assertNothingSent();
})->with([
    'the login email' => [['recovery_email' => 'Randy@randy-donny.com', 'password' => SecurityPassword], 'recovery_email', 'L’email de récupération doit être différent de l’adresse de connexion.'],
    'not an email' => [['recovery_email' => 'secours', 'password' => SecurityPassword], 'recovery_email', 'Veuillez saisir une adresse email valide.'],
    'wrong password' => [['recovery_email' => 'secours@example.com', 'password' => 'faux'], 'password', 'Le mot de passe est incorrect.'],
]);

test('ADM-SEC-1 the link verifies the recovery email, even without a session', function () {
    $this->author->forceFill(['recovery_email' => 'secours@example.com'])->save();

    $this->get(recoveryEmailConfirmationUrl($this->author, 'secours@example.com'))
        ->assertRedirect(route('login'))
        ->assertSessionHas('status', 'L’email de récupération secours@example.com est vérifié.');

    expect($this->author->fresh()->hasVerifiedRecoveryEmail())->toBeTrue();
});

test('ADM-SEC-1 an expired, tampered or outdated link gets the 404', function (Closure $url) {
    $this->author->forceFill(['recovery_email' => 'secours@example.com'])->save();

    $this->get($url($this->author))->assertNotFound();

    expect($this->author->fresh()->recovery_email_verified_at)->toBeNull();
})->with([
    'expired' => [fn (User $user) => recoveryEmailConfirmationUrl($user, 'secours@example.com', minutes: -1)],
    'tampered' => [fn (User $user) => recoveryEmailConfirmationUrl($user, 'secours@example.com').'x'],
    'address changed since' => [fn (User $user) => recoveryEmailConfirmationUrl($user, 'ancienne@example.com')],
]);

test('ADM-SEC-1 removing the recovery email needs the password and alerts the login email', function () {
    Notification::fake();
    $this->author->forceFill(['recovery_email' => 'secours@example.com', 'recovery_email_verified_at' => now()])->save();

    $this->actingAs($this->author)
        ->from(route('admin.account.security'))
        ->delete(route('admin.account.recovery-email.destroy'), ['password' => 'faux'])
        ->assertSessionHasErrors('password');

    expect($this->author->fresh()->recovery_email)->toBe('secours@example.com');

    $this->actingAs($this->author)
        ->delete(route('admin.account.recovery-email.destroy'), ['password' => SecurityPassword])
        ->assertSessionHasNoErrors();

    expect($this->author->fresh())->recovery_email->toBeNull()->recovery_email_verified_at->toBeNull();
    Notification::assertSentOnDemand(RecoveryEmailChanged::class);
});

test('ADM-SEC-1 the login email cannot become the recovery email', function () {
    Notification::fake();
    $this->author->forceFill(['recovery_email' => 'secours@example.com'])->save();

    $this->actingAs($this->author)
        ->from(route('admin.account'))
        ->post(route('admin.account.email'), ['email' => 'Secours@example.com', 'password' => SecurityPassword])
        ->assertSessionHasErrors(['email' => 'C’est votre email de récupération : choisissez une autre adresse de connexion.']);
});

test('ADM-AUTH-2 reset links go to the verified recovery email too', function (bool $isVerified, array $addresses) {
    $this->author->forceFill(['recovery_email' => 'secours@example.com', 'recovery_email_verified_at' => $isVerified ? now() : null])->save();

    expect($this->author->routeNotificationForMail(new ResetPassword('token')))->toBe($addresses)
        ->and($this->author->routeNotificationForMail(new RecoveryEmailChanged(null)))->toBe('randy@randy-donny.com');
})->with([
    'verified' => [true, ['randy@randy-donny.com', 'secours@example.com']],
    'unverified' => [false, ['randy@randy-donny.com']],
]);

test('ADM-SEC-2 the recovery phone is stored in international format, unverified', function () {
    $this->actingAs($this->author)
        ->put(route('admin.account.recovery-phone'), ['recovery_phone' => '+261 34 00-000.00', 'password' => SecurityPassword])
        ->assertSessionHasNoErrors();

    expect($this->author->fresh())
        ->recovery_phone->toBe('+261340000000')
        ->recovery_phone_verified_at->toBeNull();

    $this->actingAs($this->author)
        ->put(route('admin.account.recovery-phone'), ['recovery_phone' => '', 'password' => SecurityPassword])
        ->assertSessionHasNoErrors();

    expect($this->author->fresh()->recovery_phone)->toBeNull();
});

test('ADM-SEC-2 a number without its country code is refused', function (string $phone) {
    $this->actingAs($this->author)
        ->from(route('admin.account.security'))
        ->put(route('admin.account.recovery-phone'), ['recovery_phone' => $phone, 'password' => SecurityPassword])
        ->assertSessionHasErrors(['recovery_phone' => 'Saisissez le numéro au format international, par exemple +261 34 00 000 00.']);
})->with(['034 00 000 00', '+0 34 00 000 00', '+261 34', 'abc']);

test('ADM-SEC-2 the recovery phone needs the current password', function (?string $password, string $message) {
    $this->actingAs($this->author)
        ->from(route('admin.account.security'))
        ->put(route('admin.account.recovery-phone'), ['recovery_phone' => '+261 34 00 000 00', 'password' => $password])
        ->assertSessionHasErrors(['password' => $message]);

    expect($this->author->fresh()->recovery_phone)->toBeNull();
})->with([
    'missing' => [null, 'Le mot de passe actuel est obligatoire.'],
    'wrong' => ['faux', 'Le mot de passe est incorrect.'],
]);

test('ADM-SEC-5 a device shows once, however many sessions it holds', function () {
    $currentSession = storeSession($this->author, FirefoxLinux);
    storeSession($this->author, FirefoxLinux);
    storeSession($this->author, SafariIphone, now()->subMinutes(10)->timestamp);
    storeSession($this->author, SafariIphone, now()->subMinutes(40)->timestamp);
    storeSession($this->author, SafariIphone, ip: '41.188.12.9');

    onDevice($this->author, $currentSession)
        ->get(route('admin.account.security'))
        ->assertInertia(fn (Assert $page) => $page
            ->has('security.devices', 3)
            ->where('security.devices.0.isCurrent', true)
            ->where('security.devices.0.device', 'Firefox · Linux · ordinateur')
            ->where('security.devices.1.ip', '102.16.31.140')
            ->where('security.devices.1.lastActivity', 'Il y a 10 minutes')
            ->where('security.devices.2.ip', '41.188.12.9'));
});

test('ADM-SEC-5 an expired session is neither listed nor a target', function () {
    $currentSession = storeSession($this->author, FirefoxLinux);
    storeSession($this->author, SafariIphone, now()->subMinutes(config('session.lifetime') + 1)->timestamp);

    onDevice($this->author, $currentSession)
        ->get(route('admin.account.security'))
        ->assertInertia(fn (Assert $page) => $page->has('security.devices', 1));

    onDevice($this->author, $currentSession)
        ->delete(route('admin.account.devices.destroy', ['device' => deviceKey(SafariIphone)]))
        ->assertNotFound();
});

test('ADM-SEC-5 « Déconnecter » ends every session of that device, and its remember-me cookie stops working', function () {
    $currentSession = storeSession($this->author, FirefoxLinux);
    $targetSessions = [storeSession($this->author), storeSession($this->author)];
    $keptSession = storeSession($this->author, ip: '41.188.12.9');
    $rememberToken = $this->author->remember_token;

    onDevice($this->author, $currentSession)
        ->delete(route('admin.account.devices.destroy', ['device' => deviceKey(SafariIphone)]))
        ->assertRedirect();

    expect(DB::table('sessions')->whereIn('id', $targetSessions)->exists())->toBeFalse()
        ->and(DB::table('sessions')->where('id', $currentSession)->exists())->toBeTrue()
        ->and(DB::table('sessions')->where('id', $keptSession)->exists())->toBeTrue()
        ->and($this->author->fresh()->remember_token)->not->toBe($rememberToken);
});

test('ADM-SEC-5 the current device and other accounts’ devices cannot be targeted', function () {
    $currentSession = storeSession($this->author, FirefoxLinux);
    storeSession(User::factory()->create(), SafariIphone);

    foreach ([deviceKey(FirefoxLinux), deviceKey(SafariIphone)] as $key) {
        onDevice($this->author, $currentSession)
            ->delete(route('admin.account.devices.destroy', ['device' => $key]))
            ->assertNotFound();
    }

    expect(DB::table('sessions')->count())->toBe(2);
});

test('ADM-SEC-5 « Déconnecter tous les autres appareils » keeps only the current one', function () {
    $currentSession = storeSession($this->author, FirefoxLinux);
    storeSession($this->author);
    storeSession($this->author);
    $strangerSession = storeSession(User::factory()->create());

    onDevice($this->author, $currentSession)
        ->delete(route('admin.account.devices.destroy-others'))
        ->assertRedirect();

    expect(DB::table('sessions')->pluck('id')->sort()->values()->all())
        ->toBe(collect([$currentSession, $strangerSession])->sort()->values()->all());

    $this->assertAuthenticatedAs($this->author);
});

test('ADM-SEC-6 the login form records successes and failures on known accounts only', function () {
    $this->withHeader('User-Agent', SafariIphone)
        ->post(route('login.store'), ['email' => 'randy@randy-donny.com', 'password' => 'faux']);
    $this->post(route('login.store'), ['email' => 'inconnu@example.com', 'password' => 'faux']);
    $this->withHeader('User-Agent', SafariIphone)
        ->post(route('login.store'), ['email' => 'randy@randy-donny.com', 'password' => SecurityPassword]);

    expect(LoginEvent::query()->orderBy('id')->get(['user_id', 'user_agent', 'succeeded'])->toArray())->toBe([
        ['user_id' => $this->author->id, 'user_agent' => SafariIphone, 'succeeded' => false],
        ['user_id' => $this->author->id, 'user_agent' => SafariIphone, 'succeeded' => true],
    ]);
});

test('ADM-SEC-6 a session reopened by the remember-me cookie is not a new login', function () {
    $recaller = $this->author->id.'|'.$this->author->remember_token.'|'.hash_hmac('sha256', $this->author->password, config('app.key'));

    $this->withCookie(Auth::guard('web')->getRecallerName(), $recaller)
        ->get(route('admin.account.security'))
        ->assertOk();

    $this->assertAuthenticatedAs($this->author);
    expect(LoginEvent::query()->count())->toBe(0);
});

test('ADM-SEC-7 a login from an unseen browser sends an alert, a known one does not', function () {
    Notification::fake();
    LoginEvent::factory()->for($this->author)->create(['user_agent' => FirefoxLinux]);

    $this->withHeader('User-Agent', FirefoxLinux)
        ->post(route('login.store'), ['email' => 'randy@randy-donny.com', 'password' => SecurityPassword]);
    Notification::assertNothingSent();

    $this->post(route('logout'));
    $this->withHeader('User-Agent', SafariIphone)
        ->post(route('login.store'), ['email' => 'randy@randy-donny.com', 'password' => SecurityPassword]);

    Notification::assertSentTo($this->author, NewDeviceLogin::class, fn (NewDeviceLogin $notification): bool => $notification->device === 'Safari · iOS · mobile');
});

test('ADM-SEC-7 the very first recorded login sends no alert', function () {
    Notification::fake();

    $this->post(route('login.store'), ['email' => 'randy@randy-donny.com', 'password' => SecurityPassword]);

    Notification::assertNothingSent();
    expect(LoginEvent::query()->count())->toBe(1);
});
