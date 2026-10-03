<?php

namespace App\Http\Middleware;

use App\Support\Seo\Seo;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * `X-Robots-Tag: noindex, nofollow` on responses search engines must never index (SEO-CRAWL-2, SEO-CRAWL-3):
 * the admin panel, always, and every page of a copy that is not indexable (staging, preview, development: see `blog.indexable`).
 *
 * The header covers what `robots.txt` cannot: a crawler that reaches an admin URL anyway, through a link, still
 * gets told not to index it.
 */
class NoIndexHeader
{
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        if (! Seo::isIndexable() || $request->is('admin', 'admin/*')) {
            $response->headers->set('X-Robots-Tag', 'noindex, nofollow');
        }

        return $response;
    }
}
