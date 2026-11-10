<?php

namespace App\Support;

use App\Models\Article;
use App\Models\ArticleSlugRedirect;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

/**
 * Article URLs (ADM-ART-64, SEO-URL-1): lowercase, hyphenated, without accents, unique, and kept as redirects once changed.
 */
class ArticleSlug
{
    /**
     * A free slug for this title: `le-taxi-be`, then `le-taxi-be-2`, `le-taxi-be-3`…
     *
     * Deleted articles and old slugs still count as taken, so a redirect never points at the wrong article.
     */
    public static function generate(string $title, ?int $ignoredArticleId = null): string
    {
        $base = self::fromTitle($title) ?: 'article';
        $slug = $base;

        for ($suffix = 2; self::isTaken($slug, $ignoredArticleId); $suffix++) {
            $slug = "{$base}-{$suffix}";
        }

        return $slug;
    }

    /**
     * The slug a title gives, before any suffix: « Je pense, donc j’essuie » becomes `je-pense-donc-j-essuie`.
     * Apostrophes separate words, where `Str::slug` alone would glue them (`jessuie`).
     */
    public static function fromTitle(string $title): string
    {
        return Str::slug(str_replace(["'", '’'], ' ', $title), language: 'fr');
    }

    /**
     * Whether another article uses this slug, now or as an old slug that redirects.
     */
    public static function isTaken(string $slug, ?int $ignoredArticleId = null): bool
    {
        $usedByArticle = Article::withTrashed()
            ->where('slug', $slug)
            ->when($ignoredArticleId !== null, fn ($query) => $query->whereKeyNot($ignoredArticleId))
            ->exists();

        return $usedByArticle || ArticleSlugRedirect::query()
            ->where('old_slug', $slug)
            ->when($ignoredArticleId !== null, fn ($query) => $query->where('article_id', '!=', $ignoredArticleId))
            ->exists();
    }

    /**
     * Give the article a new slug. Once the article has been public, the previous slug is kept as a redirect;
     * going back to an old slug drops its redirect.
     */
    public static function change(Article $article, string $newSlug): void
    {
        $previousSlug = $article->getOriginal('slug');

        if ($previousSlug === $newSlug) {
            return;
        }

        $article->slug = $newSlug;

        if (! $article->exists || $previousSlug === null || $article->getOriginal('published_date') === null) {
            return;
        }

        $article->slugRedirects()->where('old_slug', $newSlug)->delete();
        $article->slugRedirects()->create(['old_slug' => $previousSlug]);
    }

    /**
     * The current slug of the article that used to answer at this one, if any.
     */
    public static function redirectTarget(string $oldSlug): ?string
    {
        return ArticleSlugRedirect::query()
            ->where('old_slug', $oldSlug)
            ->with('article')
            ->first()
            ?->article
            ?->slug;
    }

    /**
     * For a public article route whose slug matches no article: a 301 to the current URL when the slug is an old one,
     * the usual 404 otherwise.
     *
     * @throws NotFoundHttpException
     */
    public static function redirectResponse(Request $request, string $routeName): RedirectResponse
    {
        $oldSlug = $request->route('article');
        $currentSlug = is_string($oldSlug) ? self::redirectTarget($oldSlug) : null;

        if ($currentSlug === null) {
            throw new NotFoundHttpException;
        }

        return redirect()->route($routeName, $currentSlug, 301);
    }
}
