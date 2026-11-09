<?php

namespace App\Providers;

use App\Actions\Fortify\ResetUserPassword;
use App\Http\Responses\UniformPasswordResetLinkResponse;
use App\Models\User;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;
use Inertia\Inertia;
use Inertia\Response;
use Laravel\Fortify\Contracts\FailedPasswordResetLinkRequestResponse;
use Laravel\Fortify\Fortify;

class FortifyServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        /*
         * The routes live in `routes/admin.php`: Fortify's own have no throttle on password reset (NFR-SEC-4).
         */
        Fortify::ignoreRoutes();

        $this->app->bind(FailedPasswordResetLinkRequestResponse::class, UniformPasswordResetLinkResponse::class);
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Fortify::resetUserPasswordsUsing(ResetUserPassword::class);

        $this->configureViews();
        $this->configurePasswordReset();
    }

    /**
     * Render the authentication pages with Inertia.
     */
    protected function configureViews(): void
    {
        Fortify::loginView(fn (Request $request): Response => Inertia::render('admin/login', [
            'status' => $request->session()->get('status'),
        ]));

        Fortify::requestPasswordResetLinkView(fn (Request $request): Response => Inertia::render('admin/forgot-password', [
            'status' => $request->session()->get('status'),
        ]));

        Fortify::resetPasswordView(fn (Request $request): Response => Inertia::render('admin/reset-password', [
            'token' => $request->route('token'),
            'email' => $request->string('email')->toString(),
        ]));
    }

    /**
     * French reset email, and a throttle on the reset endpoints that answers on the form rather than with a 429 page.
     */
    protected function configurePasswordReset(): void
    {
        ResetPassword::toMailUsing(fn (User $user, string $token): MailMessage => (new MailMessage)
            ->subject('Réinitialisation de votre mot de passe')
            ->greeting('Bonjour,')
            ->line('Vous recevez cet email car une réinitialisation du mot de passe a été demandée pour votre compte.')
            ->action('Réinitialiser le mot de passe', route('password.reset', [
                'token' => $token,
                'email' => $user->getEmailForPasswordReset(),
            ]))
            ->line('Ce lien est valable 60 minutes.')
            ->line('Si vous n’êtes pas à l’origine de cette demande, ignorez cet email : votre mot de passe ne change pas.')
            ->salutation('Randy Donny'));

        RateLimiter::for('admin-password-reset', fn (Request $request): Limit => Limit::perMinute(5)
            ->by($request->ip())
            ->response(fn (Request $request, array $headers) => back()->withErrors([
                Fortify::email() => trans('auth.throttle', ['seconds' => $headers['Retry-After']]),
            ])));
    }
}
