<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\PasswordUpdateRequest;
use App\Http\Requests\RecoveryEmailRequest;
use App\Http\Requests\RecoveryPhoneRequest;
use App\Models\Article;
use App\Models\LoginEvent;
use App\Models\User;
use App\Notifications\ConfirmRecoveryEmail;
use App\Notifications\PasswordChanged;
use App\Notifications\RecoveryEmailChanged;
use App\Notifications\TwoFactorDisabled;
use App\Notifications\TwoFactorEnabled;
use App\Support\UserAgent;
use Carbon\CarbonImmutable;
use Illuminate\Auth\SessionGuard;
use Illuminate\Database\Query\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use Laravel\Fortify\Actions\ConfirmTwoFactorAuthentication;
use Laravel\Fortify\Actions\DisableTwoFactorAuthentication;
use Laravel\Fortify\Actions\EnableTwoFactorAuthentication;
use Laravel\Fortify\Actions\GenerateNewRecoveryCodes;
use Laravel\Fortify\Fortify;

/**
 * « Gestion du compte », Security tab (spec §5.6.2).
 */
class AccountSecurityController extends Controller
{
    public function show(Request $request): Response
    {
        /** @var User $user */
        $user = $request->user();

        return Inertia::render('admin/account-security', [
            'security' => [
                'recoveryEmail' => $user->recovery_email,
                'recoveryEmailVerified' => $user->hasVerifiedRecoveryEmail(),
                'recoveryPhone' => $user->recovery_phone,
                'twoFactor' => $this->twoFactorState($user),
                'devices' => $this->devices($request, $user),
                'loginEvents' => $user->loginEvents()
                    ->latest('created_at')
                    ->latest('id')
                    ->limit(LoginEvent::HistoryLength)
                    ->get()
                    ->map(fn (LoginEvent $event): array => [
                        'id' => $event->id,
                        'date' => $this->frenchDateTime($event->created_at),
                        'shortDate' => $this->frenchDateTime($event->created_at, short: true),
                        'device' => UserAgent::fromString($event->user_agent)->shortLabel(),
                        'ip' => $event->ip,
                        'succeeded' => $event->succeeded,
                        'twoFactorUsed' => $event->two_factor_used,
                    ]),
            ],
        ]);
    }

    /**
     * Change the password (ADM-SEC-3); every other device is logged out.
     */
    public function updatePassword(PasswordUpdateRequest $request): RedirectResponse
    {
        /** @var User $user */
        $user = $request->user();

        $user->forceFill(['password' => $request->string('password')->toString()])->save();

        $this->logOutOtherDevices($request, $user);

        $user->notify(new PasswordChanged);

        return Inertia::flash('success', 'Mot de passe modifié. Les autres appareils ont été déconnectés.')->back();
    }

    /**
     * Set or change the recovery email (ADM-SEC-1). It stays « Non vérifié », and unused, until its link is opened.
     */
    public function updateRecoveryEmail(RecoveryEmailRequest $request): RedirectResponse
    {
        /** @var User $user */
        $user = $request->user();
        $recoveryEmail = $request->string('recovery_email')->toString();

        if ($recoveryEmail === $user->recovery_email && $user->hasVerifiedRecoveryEmail()) {
            return Inertia::flash('success', 'Cet email de récupération est déjà vérifié.')->back();
        }

        $user->forceFill(['recovery_email' => $recoveryEmail, 'recovery_email_verified_at' => null])->save();

        $confirmationUrl = URL::temporarySignedRoute(
            'admin.account.recovery-email.confirm',
            now()->addMinutes(ConfirmRecoveryEmail::ExpiresInMinutes),
            ['user' => $user->id, 'hash' => $this->recoveryEmailHash($recoveryEmail)],
        );

        Notification::route('mail', $recoveryEmail)->notify(new ConfirmRecoveryEmail($confirmationUrl));
        Notification::route('mail', $user->email)->notify(new RecoveryEmailChanged($recoveryEmail));

        return Inertia::flash('success', "Un lien de vérification a été envoyé à {$recoveryEmail}.")->back();
    }

    public function destroyRecoveryEmail(Request $request): RedirectResponse
    {
        $this->validateCurrentPassword($request);

        /** @var User $user */
        $user = $request->user();
        $user->forceFill(['recovery_email' => null, 'recovery_email_verified_at' => null])->save();

        Notification::route('mail', $user->email)->notify(new RecoveryEmailChanged(null));

        return Inertia::flash('success', 'Email de récupération supprimé.')->back();
    }

    /**
     * Verify the recovery email from its link. Like the login email link, it works without a session, and any
     * invalid link (bad signature, expired, or an address changed since) gets the 404.
     */
    public function confirmRecoveryEmail(Request $request, User $user): RedirectResponse
    {
        abort_unless($request->hasValidSignature(), 404);
        abort_if($user->recovery_email === null, 404);
        abort_unless(hash_equals($this->recoveryEmailHash($user->recovery_email), $request->string('hash')->toString()), 404);

        if ($user->recovery_email_verified_at === null) {
            $user->forceFill(['recovery_email_verified_at' => now()])->save();
        }

        $message = "L’email de récupération {$user->recovery_email} est vérifié.";

        if ($request->user()?->is($user)) {
            Inertia::flash('success', $message);

            return to_route('admin.account.security');
        }

        return to_route('login')->with('status', $message);
    }

    /**
     * Store the recovery phone, or remove it when the field is empty (ADM-SEC-2). No SMS verification (Q6).
     */
    public function updateRecoveryPhone(RecoveryPhoneRequest $request): RedirectResponse
    {
        /** @var User $user */
        $user = $request->user();
        $phone = $request->input('recovery_phone');

        $user->forceFill(['recovery_phone' => $phone, 'recovery_phone_verified_at' => null])->save();

        return Inertia::flash('success', $phone === null ? 'Téléphone de récupération supprimé.' : 'Téléphone de récupération enregistré.')->back();
    }

    /**
     * « Activer la 2FA » (ADM-SEC-4): after the password, a new secret and 8 recovery codes, unused until a code from
     * the app confirms the secret.
     */
    public function enableTwoFactor(Request $request, EnableTwoFactorAuthentication $enable): RedirectResponse
    {
        $this->validateCurrentPassword($request);

        /** @var User $user */
        $user = $request->user();

        if ($user->hasEnabledTwoFactorAuthentication()) {
            return back();
        }

        $enable($user, force: true);

        return back();
    }

    /**
     * The first code from the app turns 2FA on; the recovery codes are shown once, through the flash data.
     */
    public function confirmTwoFactor(Request $request, ConfirmTwoFactorAuthentication $confirm): RedirectResponse
    {
        $request->validate(['code' => ['required', 'string']], ['code.required' => 'Saisissez le code à 6 chiffres.']);

        /** @var User $user */
        $user = $request->user();

        if ($user->hasEnabledTwoFactorAuthentication()) {
            return back();
        }

        try {
            $confirm($user, preg_replace('/\s+/', '', $request->string('code')->toString()));
        } catch (ValidationException) {
            // Fortify puts the error in a named bag, which the page does not read.
            throw ValidationException::withMessages(['code' => 'Ce code est incorrect. Vérifiez l’heure de votre téléphone et réessayez.']);
        }

        $user->notify(new TwoFactorEnabled);

        return Inertia::flash(['success' => 'Authentification à deux facteurs activée.', 'recoveryCodes' => $user->recoveryCodes()])->back();
    }

    /**
     * « Annuler » during the setup drops the unconfirmed secret. A confirmed 2FA is only removed with the password.
     */
    public function cancelTwoFactor(Request $request, DisableTwoFactorAuthentication $disable): RedirectResponse
    {
        /** @var User $user */
        $user = $request->user();

        if (! $user->hasEnabledTwoFactorAuthentication()) {
            $disable($user);
        }

        return back();
    }

    /**
     * « Régénérer les codes de récupération »: the old codes stop working.
     */
    public function regenerateRecoveryCodes(Request $request, GenerateNewRecoveryCodes $generate): RedirectResponse
    {
        $this->validateCurrentPassword($request);

        /** @var User $user */
        $user = $request->user();

        abort_unless($user->hasEnabledTwoFactorAuthentication(), 404);

        $generate($user);

        return Inertia::flash(['success' => 'Nouveaux codes de récupération générés. Les anciens ne fonctionnent plus.', 'recoveryCodes' => $user->recoveryCodes()])->back();
    }

    /**
     * « Désactiver la 2FA ».
     */
    public function disableTwoFactor(Request $request, DisableTwoFactorAuthentication $disable): RedirectResponse
    {
        $this->validateCurrentPassword($request);

        /** @var User $user */
        $user = $request->user();

        abort_unless($user->hasEnabledTwoFactorAuthentication(), 404);

        $disable($user);

        $user->notify(new TwoFactorDisabled);

        return Inertia::flash('success', 'Authentification à deux facteurs désactivée.')->back();
    }

    /**
     * « Déconnecter » on one device (ADM-SEC-5): every session of that browser and IP ends. The current device is not
     * in the list of targets.
     */
    public function destroySession(Request $request, string $device): RedirectResponse
    {
        /** @var User $user */
        $user = $request->user();

        /** @var Collection<int, object{id: string, ip_address: string|null, user_agent: string|null}> $sessions */
        $sessions = $this->activeSessions($user)->get(['id', 'ip_address', 'user_agent']);
        $currentSessionId = $request->session()->getId();

        $targets = $sessions->filter(fn (object $session): bool => hash_equals($this->deviceKey($session), $device));

        abort_if($targets->isEmpty() || $targets->contains('id', $currentSessionId), 404);

        DB::table(config()->string('session.table'))->whereIn('id', $targets->pluck('id'))->delete();
        $this->forgetRememberedDevices($request, $user);

        return Inertia::flash('success', 'Appareil déconnecté.')->back();
    }

    /**
     * « Déconnecter tous les autres appareils » (ADM-SEC-5).
     */
    public function destroyOtherSessions(Request $request): RedirectResponse
    {
        /** @var User $user */
        $user = $request->user();

        $this->logOutOtherDevices($request, $user);

        return Inertia::flash('success', 'Les autres appareils ont été déconnectés.')->back();
    }

    /**
     * The account's devices, one row per browser and IP however many sessions it holds, with « Cet appareil » first.
     * Expired sessions are left out: the database driver only deletes them now and then. Session IDs never reach the
     * page: each device is addressed by a keyed hash of its browser and IP.
     *
     * @return list<array{key: string, device: string, shortDevice: string, ip: string|null, lastActivity: string, isCurrent: bool}>
     */
    private function devices(Request $request, User $user): array
    {
        $currentSessionId = $request->session()->getId();

        /** @var Collection<int, object{id: string, ip_address: string|null, user_agent: string|null, last_activity: int}> $sessions */
        $sessions = $this->activeSessions($user)
            ->orderByDesc('last_activity')
            ->get(['id', 'ip_address', 'user_agent', 'last_activity']);

        /** @var list<array{key: string, device: string, shortDevice: string, ip: string|null, lastActivity: string, isCurrent: bool}> */
        return $sessions
            ->groupBy(fn (object $session): string => $this->deviceKey($session))
            ->map(function (Collection $deviceSessions, string $key) use ($currentSessionId): array {
                /** @var object{id: string, ip_address: string|null, user_agent: string|null, last_activity: int} $latest */
                $latest = $deviceSessions->first();
                $userAgent = UserAgent::fromString($latest->user_agent);
                $isCurrent = $deviceSessions->contains('id', $currentSessionId);

                return [
                    'key' => $key,
                    'device' => $userAgent->label(),
                    'shortDevice' => $userAgent->shortLabel(),
                    'ip' => $latest->ip_address,
                    'lastActivity' => $isCurrent ? 'Maintenant' : $this->lastActivity(CarbonImmutable::createFromTimestamp($latest->last_activity)),
                    'isCurrent' => $isCurrent,
                ];
            })
            ->sortByDesc('isCurrent')
            ->values()
            ->all();
    }

    /**
     * The 2FA row: enabled, being set up (QR code and key, until a code confirms them), or off. The secret and the
     * codes never reach the page once 2FA is on.
     *
     * @return array{enabled: bool, pending: bool, qrCodeSvg: string|null, secretKey: string|null}
     */
    private function twoFactorState(User $user): array
    {
        $isEnabled = $user->hasEnabledTwoFactorAuthentication();
        $isPending = ! $isEnabled && $user->two_factor_secret !== null;

        return [
            'enabled' => $isEnabled,
            'pending' => $isPending,
            'qrCodeSvg' => $isPending ? $user->twoFactorQrCodeSvg() : null,
            'secretKey' => $isPending ? trim(chunk_split(Fortify::currentEncrypter()->decrypt($user->two_factor_secret), 4, ' ')) : null,
        ];
    }

    private function validateCurrentPassword(Request $request): void
    {
        $request->validate(
            ['password' => ['required', 'string', 'current_password']],
            ['password.required' => 'Le mot de passe actuel est obligatoire.', 'password.current_password' => 'Le mot de passe est incorrect.'],
        );
    }

    /**
     * Delete every other session of the account and make its remember-me cookies useless.
     */
    private function logOutOtherDevices(Request $request, User $user): void
    {
        $this->otherSessions($request, $user)->delete();
        $this->forgetRememberedDevices($request, $user);
    }

    /**
     * There is one remember token per account, so a logged-out device could come back through its cookie: cycle the
     * token, then give the current device a new cookie if it had one. The `Login` this fires is not recorded, since
     * it does not come from the login form.
     */
    private function forgetRememberedDevices(Request $request, User $user): void
    {
        /** @var SessionGuard $guard */
        $guard = Auth::guard('web');

        $guard->getProvider()->updateRememberToken($user, Str::random(60));

        if ($request->cookies->has($guard->getRecallerName())) {
            $guard->login($user, remember: true);
        }
    }

    private function otherSessions(Request $request, User $user): Builder
    {
        return DB::table(config()->string('session.table'))
            ->where('user_id', $user->id)
            ->where('id', '!=', $request->session()->getId());
    }

    /**
     * Sessions still within `session.lifetime`.
     */
    private function activeSessions(User $user): Builder
    {
        return DB::table(config()->string('session.table'))
            ->where('user_id', $user->id)
            ->where('last_activity', '>=', now()->subMinutes(config()->integer('session.lifetime'))->getTimestamp());
    }

    /**
     * A device is a browser at an IP address.
     *
     * @param  object{ip_address: string|null, user_agent: string|null}  $session
     */
    private function deviceKey(object $session): string
    {
        return Str::substr(hash_hmac('sha256', $session->user_agent.'|'.$session->ip_address, config()->string('app.key')), 0, 32);
    }

    private function recoveryEmailHash(string $recoveryEmail): string
    {
        return sha1(mb_strtolower($recoveryEmail));
    }

    /**
     * « Il y a 2 heures » within a day, then the date: « 3 novembre 2026 ».
     */
    private function lastActivity(CarbonImmutable $lastActivity): string
    {
        if ($lastActivity->diffInMinutes(now()) < 1) {
            return 'Maintenant';
        }

        if ($lastActivity->diffInHours(now()) < 24) {
            return Str::ucfirst($lastActivity->diffForHumans());
        }

        return Article::frenchDate($lastActivity);
    }

    /**
     * « 7 novembre 2026, 09 h 12 », or « 7 nov. 2026, 09 h 12 » on phones.
     */
    private function frenchDateTime(?CarbonImmutable $date, bool $short = false): string
    {
        $date ??= CarbonImmutable::now();
        $time = $date->setTimezone(config()->string('app.display_timezone'))->format('H \h i');

        return ($short ? Article::shortFrenchDate($date) : Article::frenchDate($date)).', '.$time;
    }
}
