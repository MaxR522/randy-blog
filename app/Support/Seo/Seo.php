<?php

namespace App\Support\Seo;

use App\Models\Article;
use App\Models\Category;
use App\Models\User;
use Illuminate\Support\Str;

/**
 * The head tags of every public page, in one place (SEO-HEAD-1 to 8, SEO-CRAWL-3, SEO-LD-1 to 3).
 *
 * Canonical URLs are built from routes, never from the request, so tracking parameters never reach them.
 */
class Seo
{
    /**
     * Search engines show about this many characters of a description.
     */
    private const int DescriptionLength = 157;

    /**
     * The home page; page 2 and further of « Tous les articles » are indexable and canonical to themselves (SEO-HEAD-4).
     */
    public static function home(int $page = 1): SeoData
    {
        $author = self::author();
        $isFirstPage = $page <= 1;

        return new SeoData(
            title: $isFirstPage
                ? self::name().' — '.config()->string('blog.tagline')
                : self::withSuffix("Tous les articles, page {$page}"),
            description: $isFirstPage
                ? config()->string('blog.description')
                : "Tous les articles du blog de Randy Donny, du plus récent au plus ancien : page {$page}.",
            canonical: $isFirstPage ? self::homeUrl() : self::homeUrl().'?page='.$page,
            robots: SeoData::IndexWithLargeImage,
            image: self::authorImage($author),
            graph: array_filter([
                StructuredData::website($author),
                $author ? StructuredData::person($author) : null,
            ]),
        );
    }

    /**
     * A published article: `og:type` article with its dates, `BlogPosting` and breadcrumb.
     */
    public static function article(Article $article): SeoData
    {
        $article->loadMissing(['categories', 'author']);
        $author = $article->author;
        $title = Str::squish($article->title);
        $url = route('articles.show', $article->slug);
        $categories = $article->categories->map(fn (Category $category): string => $category->value)->values()->all();
        $image = $article->cover_photo
            ? [...ShareImage::openGraph($article->cover_photo), 'alt' => $title]
            : self::authorImage($author);

        return new SeoData(
            title: self::withSuffix($title),
            description: $article->metaDescription(),
            canonical: $url,
            robots: SeoData::IndexWithLargeImage,
            type: 'article',
            image: $image,
            article: [
                'publishedTime' => $article->published_date?->toIso8601String(),
                'modifiedTime' => ($article->updated_at ?? $article->published_date)?->toIso8601String(),
                'author' => $author ? route('profile.show', $author->slug) : null,
                'section' => $categories[0] ?? null,
                'tags' => $categories,
            ],
            alternates: [[
                'type' => 'text/markdown',
                'href' => route('articles.markdown', $article->slug),
                'title' => $title,
            ]],
            graph: array_filter([
                StructuredData::blogPosting($article, $author),
                StructuredData::breadcrumb($article),
                $author ? StructuredData::person($author) : null,
                StructuredData::website($author),
            ]),
        );
    }

    /**
     * The author page.
     */
    public static function profile(User $author): SeoData
    {
        return new SeoData(
            title: self::name().' — À propos',
            description: $author->metaDescription() ?: config()->string('blog.description'),
            canonical: route('profile.show', $author->slug),
            robots: SeoData::Index,
            type: 'profile',
            image: self::authorImage($author),
            graph: [
                StructuredData::profilePage($author),
                StructuredData::person($author),
                StructuredData::website($author),
            ],
        );
    }

    /**
     * The privacy policy; same title and summary as `resources/js/lib/privacy-policy.fr.ts`.
     */
    public static function privacy(): SeoData
    {
        $url = route('privacy');
        $title = 'Politique de confidentialité';
        $description = 'Quelles données le site randy-donny.com collecte, pourquoi et combien de temps : mesure d’audience avec Google Analytics, newsletter, cookies et vos droits.';

        return new SeoData(
            title: self::withSuffix($title),
            description: $description,
            canonical: $url,
            robots: SeoData::Index,
            image: self::authorImage(self::author()),
            graph: [StructuredData::webPage($url, $title, $description)],
        );
    }

    /**
     * Search results are not indexed, their links are followed (PUB-SRCH-7).
     */
    public static function search(string $query): SeoData
    {
        return new SeoData(
            title: self::withSuffix("Résultats pour « {$query} »"),
            description: Str::limit("Les articles de Randy Donny qui parlent de « {$query} ».", self::DescriptionLength, '…', preserveWords: true),
            canonical: null,
            robots: SeoData::NoIndexFollow,
        );
    }

    public static function notFound(): SeoData
    {
        return new SeoData(
            title: self::withSuffix('Page introuvable'),
            description: 'Cette page n’existe pas ou plus. Cherchez un article ou revenez à la page d’accueil.',
            canonical: null,
            robots: SeoData::NoIndex,
        );
    }

    /**
     * Pages nobody should find through a search engine: subscription confirmations, article previews.
     */
    public static function private(string $title): SeoData
    {
        return new SeoData(
            title: self::withSuffix($title),
            description: '',
            canonical: null,
            robots: SeoData::NoIndexNoFollow,
        );
    }

    /**
     * Whether search engines may index this copy of the site: production, unless `blog.indexable` says otherwise.
     */
    public static function isIndexable(): bool
    {
        $indexable = config('blog.indexable');

        return $indexable === null ? app()->isProduction() : filter_var($indexable, FILTER_VALIDATE_BOOLEAN);
    }

    /**
     * The blog's single author: the first account, as on the navbar link.
     */
    public static function author(): ?User
    {
        return User::query()->oldest('id')->first();
    }

    /**
     * The home page URL with its slash, the form search engines and share previews show: `https://randy-donny.com/`.
     */
    public static function homeUrl(): string
    {
        return url('/').'/';
    }

    private static function name(): string
    {
        return config()->string('blog.name');
    }

    private static function withSuffix(string $title): string
    {
        return $title.' — '.self::name();
    }

    /**
     * Pages without a cover of their own share the author's photo.
     *
     * @return array{url: string, width: int|null, height: int|null, alt: string}|null
     */
    private static function authorImage(?User $author): ?array
    {
        if (! $author?->avatar) {
            return null;
        }

        return [...ShareImage::openGraph($author->avatar), 'alt' => StructuredData::authorName()];
    }
}
