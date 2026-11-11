<?php

namespace App\Listeners;

use App\Models\User;
use App\Notifications\NewDeviceLogin;
use App\Support\UserAgent;
use Illuminate\Auth\Events\Failed;
use Illuminate\Auth\Events\Login;
use Laravel\Fortify\Events\TwoFactorAuthenticationFailed;

/**
 * Writes the login history (ADM-SEC-6) and alerts on a login from a new browser (ADM-SEC-7).
 *
 * Only the login form and the 2FA challenge count: the remember-me cookie also fires `Login` when it reopens a
 * session, and so does `Auth::login()` when a device logout reissues the current device's cookie. An account with
 * 2FA fires no `Login` on the password step, so a login through the challenge is recorded once, on the challenge.
 */
class RecordLoginEvent
{
    public function handle(Login|Failed|TwoFactorAuthenticationFailed $event): void
    {
        $request = request();
        $isTwoFactorChallenge = $request->routeIs('two-factor.login.store');

        if (! $event->user instanceof User || ! ($request->routeIs('login.store') || $isTwoFactorChallenge)) {
            return;
        }

        $user = $event->user;
        $userAgent = $request->userAgent();
        $succeeded = $event instanceof Login;

        $isNewDevice = $succeeded
            && $user->loginEvents()->exists()
            && ! $user->loginEvents()->where('succeeded', true)->where('user_agent', $userAgent)->exists();

        $loginEvent = $user->loginEvents()->create([
            'ip' => $request->ip(),
            'user_agent' => $userAgent,
            'succeeded' => $succeeded,
            'two_factor_used' => $isTwoFactorChallenge,
        ]);

        if ($isNewDevice) {
            $user->notify(new NewDeviceLogin(UserAgent::fromString($userAgent)->label(), $loginEvent->ip, $loginEvent->created_at ?? now()));
        }
    }
}
