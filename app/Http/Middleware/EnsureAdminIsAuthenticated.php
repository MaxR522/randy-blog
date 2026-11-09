<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Hides the admin panel from guests (spec Q10): they get the same 404 as any unknown URL, not a redirect to the login page.
 */
class EnsureAdminIsAuthenticated
{
    public function handle(Request $request, Closure $next): Response
    {
        abort_unless($request->user() !== null, 404);

        return $next($request);
    }
}
