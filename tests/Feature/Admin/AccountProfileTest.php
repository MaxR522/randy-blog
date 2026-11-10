<?php

use App\Models\User;
use App\Notifications\ConfirmLoginEmailChange;
use App\Notifications\LoginEmailChanged;
use App\Support\Seo\SeoCache;
use Illuminate\Http\Client\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Notifications\AnonymousNotifiable;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\URL;
use Inertia\Testing\AssertableInertia as Assert;

const OldAvatarUrl = 'https://res.cloudinary.com/randy/image/upload/v1/avatars/ancien.jpg';

const NewAvatarUrl = 'https://res.cloudinary.com/randy/image/upload/v1/avatars/nouveau.jpg';

beforeEach(function () {
    config(['services.cloudinary.url' => 'cloudinary://123456:s3cr3t@randy']);
    $this->author = User::factory()->create(['email' => 'randy@randy-donny.com']);
});

function fakeCloudinaryAvatarUpload(): void
{
    Http::preventStrayRequests();
    Http::fake([
        'https://api.cloudinary.com/v1_1/randy/image/upload' => Http::response(['secure_url' => NewAvatarUrl, 'width' => 800, 'height' => 800]),
        'https://api.cloudinary.com/v1_1/randy/image/destroy' => Http::response(['result' => 'ok']),
    ]);
}

/**
 * The link the confirmation email carries, as the controller builds it.
 */
function emailConfirmationUrl(User $user, string $newEmail, ?string $hash = null, int $minutes = 60): string
{
    return URL::temporarySignedRoute('admin.account.email.confirm', now()->addMinutes($minutes), [
        'user' => $user->id,
        'email' => $newEmail,
        'hash' => $hash ?? sha1($user->email),
    ]);
}

test('ADM-COM-8 guests get a 404 on the account routes and nothing changes', function (string $method, string $path) {
    $this->{$method}($path, ['display_name' => 'Pirate', 'bio' => 'Pirate', 'email' => 'pirate@example.com', 'password' => 'password'])
        ->assertNotFound();

    expect($this->author->fresh())
        ->display_name->not->toBe('Pirate')
        ->email->toBe('randy@randy-donny.com');
})->with([
    ['get', '/admin/compte'],
    ['get', '/admin/compte/securite'],
    ['post', '/admin/compte/avatar'],
    ['patch', '/admin/compte/nom-affichage'],
    ['patch', '/admin/compte/biographie'],
    ['post', '/admin/compte/email'],
]);

test('§5.6.1 the profile tab shows the saved fields', function () {
    $this->author->update([
        'display_name' => 'The man I used to be…',
        'bio' => '<p>Bienvenue.</p>',
        'avatar' => OldAvatarUrl,
        'avatar_credit' => 'Jean Dupont',
    ]);

    $this->actingAs($this->author)
        ->get(route('admin.account'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/account-profile')
            ->where('profile.displayName', 'The man I used to be…')
            ->where('profile.bio', '<p>Bienvenue.</p>')
            ->where('profile.avatar', OldAvatarUrl)
            ->where('profile.avatarCredit', 'Jean Dupont')
            ->where('profile.email', 'randy@randy-donny.com'));
});

test('ADM-ACC-2 the display name is saved trimmed', function () {
    $this->actingAs($this->author)
        ->patch(route('admin.account.display-name'), ['display_name' => '  The man I used to be…  '])
        ->assertSessionHasNoErrors()
        ->assertRedirect();

    expect($this->author->fresh()->display_name)->toBe('The man I used to be…');
});

test('ADM-ACC-2 the display name is required and limited to 100 characters', function (string $value, string $message) {
    $this->author->update(['display_name' => 'Avant']);

    $this->actingAs($this->author)
        ->patch(route('admin.account.display-name'), ['display_name' => $value])
        ->assertSessionHasErrors(['display_name' => $message]);

    expect($this->author->fresh()->display_name)->toBe('Avant');
})->with([
    'empty' => ['', 'Le nom d’affichage est obligatoire.'],
    'too long' => [str_repeat('a', 101), 'Le nom d’affichage ne peut pas dépasser 100 caractères.'],
]);

test('ADM-ACC-3 the biography is sanitized before it is stored', function () {
    $this->actingAs($this->author)
        ->patch(route('admin.account.biography'), ['bio' => '<p><strong>Bienvenue</strong>.</p><script>alert(1)</script>'])
        ->assertSessionHasNoErrors();

    expect($this->author->fresh()->bio)
        ->toContain('<strong>Bienvenue</strong>')
        ->not->toContain('script');
});

test('ADM-ACC-3 an emptied biography is stored as null', function () {
    $this->author->update(['bio' => '<p>Avant</p>']);

    $this->actingAs($this->author)
        ->patch(route('admin.account.biography'), ['bio' => ''])
        ->assertSessionHasNoErrors();

    expect($this->author->fresh()->bio)->toBeNull();
});

test('ADM-ACC-1 a new avatar goes to the avatars folder and the previous image is deleted', function () {
    fakeCloudinaryAvatarUpload();
    $this->author->update(['avatar' => OldAvatarUrl, 'avatar_credit' => 'Ancien']);

    $this->actingAs($this->author)
        ->post(route('admin.account.avatar'), ['avatar' => UploadedFile::fake()->image('avatar.jpg', 800, 800), 'avatar_credit' => ' Jean Dupont '])
        ->assertSessionHasNoErrors();

    expect($this->author->fresh())
        ->avatar->toBe(NewAvatarUrl)
        ->avatar_credit->toBe('Jean Dupont');
    Http::assertSent(fn (Request $request) => str_ends_with($request->url(), '/image/upload')
        && collect($request->data())->firstWhere('name', 'folder')['contents'] === 'avatars');
    Http::assertSent(fn (Request $request) => str_ends_with($request->url(), '/image/destroy') && $request['public_id'] === 'avatars/ancien');
});

test('ADM-ACC-1 the credit can change without a new image', function () {
    fakeCloudinaryAvatarUpload();
    $this->author->update(['avatar' => OldAvatarUrl, 'avatar_credit' => 'Ancien']);

    $this->actingAs($this->author)
        ->post(route('admin.account.avatar'), ['avatar_credit' => 'Jean Dupont'])
        ->assertSessionHasNoErrors();

    expect($this->author->fresh())
        ->avatar->toBe(OldAvatarUrl)
        ->avatar_credit->toBe('Jean Dupont');
    Http::assertNothingSent();
});

test('ADM-ACC-1 the avatar must be a JPG, PNG or WebP of 2 MB at most', function (UploadedFile $file, string $message) {
    fakeCloudinaryAvatarUpload();

    $this->actingAs($this->author)
        ->post(route('admin.account.avatar'), ['avatar' => $file])
        ->assertSessionHasErrors(['avatar' => $message]);

    Http::assertNothingSent();
})->with([
    'too large' => [fn () => UploadedFile::fake()->image('avatar.jpg')->size(2049), 'L’image ne doit pas dépasser 2 Mo.'],
    'not an image' => [fn () => UploadedFile::fake()->create('avatar.pdf', 10, 'application/pdf'), 'Le fichier doit être une image JPG, PNG ou WebP.'],
]);

test('ADM-ACC-1 a Cloudinary failure is shown on the avatar field and the previous avatar stays', function () {
    Http::preventStrayRequests();
    Http::fake(['https://api.cloudinary.com/v1_1/randy/image/upload' => Http::response(['error' => ['message' => 'Down']], 500)]);
    $this->author->update(['avatar' => OldAvatarUrl]);

    $this->actingAs($this->author)
        ->post(route('admin.account.avatar'), ['avatar' => UploadedFile::fake()->image('avatar.jpg')])
        ->assertSessionHasErrors(['avatar' => 'L’image n’a pas pu être envoyée. Réessayez dans quelques instants.']);

    expect($this->author->fresh()->avatar)->toBe(OldAvatarUrl);
});

test('a profile change clears the cached crawl files, a login token write does not', function () {
    Cache::put(SeoCache::Sitemap, 'ancien sitemap');

    $this->author->forceFill(['remember_token' => 'jeton'])->save();
    expect(Cache::has(SeoCache::Sitemap))->toBeTrue();

    $this->actingAs($this->author)->patch(route('admin.account.display-name'), ['display_name' => 'Nouveau']);
    expect(Cache::has(SeoCache::Sitemap))->toBeFalse();
});

test('ADM-ACC-4 a change request emails a confirmation link to the new address and changes nothing yet', function () {
    Notification::fake();

    $this->actingAs($this->author)
        ->post(route('admin.account.email'), ['email' => ' Nouveau@Randy-Donny.com ', 'password' => 'password'])
        ->assertSessionHasNoErrors();

    expect($this->author->fresh()->email)->toBe('randy@randy-donny.com');
    Notification::assertSentOnDemand(
        ConfirmLoginEmailChange::class,
        fn (ConfirmLoginEmailChange $notification, array $channels, AnonymousNotifiable $notifiable) => $notifiable->routes['mail'] === 'nouveau@randy-donny.com'
            && str_contains($notification->confirmationUrl, '/admin/compte/email/confirmer/'.$this->author->id)
            && str_contains($notification->confirmationUrl, 'signature='),
    );
});

test('ADM-ACC-4 the change request is refused without the right password or with an unusable address', function (array $payload, string $field, string $message) {
    Notification::fake();
    User::factory()->create(['email' => 'pris@example.com']);

    $this->actingAs($this->author)
        ->post(route('admin.account.email'), $payload)
        ->assertSessionHasErrors([$field => $message]);

    Notification::assertNothingSent();
})->with([
    'wrong password' => [['email' => 'nouveau@example.com', 'password' => 'mauvais'], 'password', 'Le mot de passe est incorrect.'],
    'same address' => [['email' => 'Randy@randy-donny.com', 'password' => 'password'], 'email', 'C’est déjà votre adresse de connexion.'],
    'taken address' => [['email' => 'pris@example.com', 'password' => 'password'], 'email', 'Cette adresse email est déjà utilisée.'],
    'invalid address' => [['email' => 'pas-une-adresse', 'password' => 'password'], 'email', 'Veuillez saisir une adresse email valide.'],
]);

test('ADM-ACC-4 the emailed link applies the new address, even without a session, and warns the old one', function () {
    Notification::fake();
    DB::table('password_reset_tokens')->insert(['email' => 'randy@randy-donny.com', 'token' => 'jeton', 'created_at' => now()]);

    $this->get(emailConfirmationUrl($this->author, 'nouveau@randy-donny.com'))
        ->assertRedirect(route('login'))
        ->assertSessionHas('status', 'Votre adresse de connexion est désormais nouveau@randy-donny.com. Connectez-vous avec cette adresse.');

    expect($this->author->fresh())
        ->email->toBe('nouveau@randy-donny.com')
        ->email_verified_at->not->toBeNull();
    expect(DB::table('password_reset_tokens')->count())->toBe(0);
    Notification::assertSentOnDemand(
        LoginEmailChanged::class,
        fn (LoginEmailChanged $notification, array $channels, AnonymousNotifiable $notifiable) => $notifiable->routes['mail'] === 'randy@randy-donny.com',
    );
});

test('ADM-ACC-4 the link opened while logged in returns to the profile tab', function () {
    Notification::fake();

    $this->actingAs($this->author)
        ->get(emailConfirmationUrl($this->author, 'nouveau@randy-donny.com'))
        ->assertRedirect(route('admin.account'));

    expect($this->author->fresh()->email)->toBe('nouveau@randy-donny.com');
});

test('ADM-ACC-4 a tampered, expired, stale or taken link gets a 404 and changes nothing', function (Closure $url) {
    Notification::fake();
    User::factory()->create(['email' => 'pris@example.com']);

    $this->get($url($this->author))->assertNotFound();

    expect($this->author->fresh()->email)->toBe('randy@randy-donny.com');
    Notification::assertNothingSent();
})->with([
    'tampered address' => [fn (User $user) => str_replace('nouveau%40', 'pirate%40', emailConfirmationUrl($user, 'nouveau@randy-donny.com'))],
    'expired' => [fn (User $user) => emailConfirmationUrl($user, 'nouveau@randy-donny.com', minutes: -1)],
    'address changed since' => [fn (User $user) => emailConfirmationUrl($user, 'nouveau@randy-donny.com', hash: sha1('autre@randy-donny.com'))],
    'address taken since' => [fn (User $user) => emailConfirmationUrl($user, 'pris@example.com')],
]);
