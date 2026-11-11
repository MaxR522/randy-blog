<?php

namespace App\Listeners;

use App\Models\User;
use App\Notifications\NewDeviceLogin;
use App\Support\UserAgent;
use Illuminate\Auth\Events\Failed;
use Illuminate\Auth\Events\Login;

/**
 * Writes the login history (ADM-SEC-6) and alerts on a login from a new browser (ADM-SEC-7).
 *
 * Only the login form counts: the remember-me cookie also fires `Login` when it reopens a session, and so does
 * `Auth::login()` when a device logout reissues the current device's cookie.
 */
class RecordLoginEvent
{
    public function handle(Login|Failed $event): void
    {
        $request = request();

        if (! $event->user instanceof User || ! $request->routeIs('login.store')) {
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
        ]);

        if ($isNewDevice) {
            $user->notify(new NewDeviceLogin(UserAgent::fromString($userAgent)->label(), $loginEvent->ip, $loginEvent->created_at ?? now()));
        }
    }
}
