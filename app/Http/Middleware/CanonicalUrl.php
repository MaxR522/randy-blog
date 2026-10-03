<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * One permanent redirect to the canonical URL (SEO-CRAWL-5): the host of APP_URL (`www.` goes to the bare domain)
 * and no trailing slash. Both fixes go in the same hop. Production only.
 *
 * http → https is left to the web server: behind a TLS proxy the app may see every request as http.
 */
class CanonicalUrl
{
    public function handle(Request $request, Closure $next): Response
    {
        if (! app()->isProduction() || ! $request->isMethodSafe()) {
            return $next($request);
        }

        $root = config()->string('app.url');
        $canonicalHost = parse_url($root, PHP_URL_HOST);
        $path = $request->getPathInfo();
        $hasTrailingSlash = $path !== '/' && str_ends_with($path, '/');

        if ($request->getHost() === $canonicalHost && ! $hasTrailingSlash) {
            return $next($request);
        }

        $query = $request->getQueryString();
        $target = rtrim($root, '/').($path === '/' ? '/' : rtrim($path, '/')).($query ? "?{$query}" : '');

        return redirect()->to($target, 301);
    }
}
