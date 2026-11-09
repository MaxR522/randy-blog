<?php

namespace App\Providers;

use App\Support\Seo\Seo;
use Carbon\CarbonImmutable;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\ServiceProvider;
use Illuminate\Validation\Rules\Password;
use Inertia\ExceptionResponse;
use Inertia\Inertia;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $this->configureDefaults();
        $this->configureErrorPages();
    }

    /**
     * Render missing pages with the public 404 page, keeping the real 404 status (SEO-CRAWL-4).
     * An expired form in the admin goes back to its page with a message; the 303 matters because
     * the CSRF check runs before Inertia's middleware, which otherwise turns a redirect after `DELETE` into a 303.
     * Other errors and JSON requests fall through to Laravel's default rendering.
     */
    protected function configureErrorPages(): void
    {
        Inertia::handleExceptionsUsing(function (ExceptionResponse $response): ExceptionResponse|RedirectResponse|null {
            if ($response->request->expectsJson()) {
                return null;
            }

            if ($response->statusCode() === 419 && $response->request->is('admin', 'admin/*')) {
                Inertia::flash('error', 'La page a expiré. Réessayez.');

                return back(303);
            }

            if ($response->statusCode() !== 404) {
                return null;
            }

            return $response->render('not-found', ['seo' => Seo::notFound()->toArray()])->withSharedData();
        });
    }

    /**
     * Configure default behaviors for production-ready applications.
     */
    protected function configureDefaults(): void
    {
        Date::use(CarbonImmutable::class);

        /*
         * Absolute URLs (canonical, sitemap, feeds, structured data) always use APP_URL, whatever host the request came through.
         */
        URL::forceRootUrl(config()->string('app.url'));

        if (str_starts_with(config()->string('app.url'), 'https://')) {
            URL::forceScheme('https');
        }

        DB::prohibitDestructiveCommands(
            app()->isProduction(),
        );

        Password::defaults(fn (): ?Password => app()->isProduction()
            ? Password::min(12)
                ->mixedCase()
                ->letters()
                ->numbers()
                ->symbols()
                ->uncompromised()
            : null,
        );
    }
}
