<?php

namespace App\Support\Seo;

use App\Models\Article;
use App\Models\Category;
use App\Models\User;
use Illuminate\Support\Str;

/**
 * Schema.org entities for the JSON-LD `@graph` (SEO-LD-1 to 5). Entities point at each other by `@id`.
 * Only facts shown on the page or stored in the database: nothing invented.
 */
class StructuredData
{
    /**
     * Google truncates longer article headlines.
     */
    private const int HeadlineLength = 110;

    public static function websiteId(): string
    {
        return Seo::homeUrl().'#website';
    }

    public static function personId(): string
    {
        return Seo::homeUrl().'#randy-donny';
    }

    /**
     * The blog, with the search box Google may show under the result.
     *
     * @return array<string, mixed>
     */
    public static function website(?User $author): array
    {
        return array_filter([
            '@type' => 'WebSite',
            '@id' => self::websiteId(),
            'url' => Seo::homeUrl(),
            'name' => config()->string('blog.name'),
            'description' => config()->string('blog.description'),
            'inLanguage' => config()->string('blog.language'),
            'publisher' => $author ? ['@id' => self::personId()] : null,
            'potentialAction' => [
                '@type' => 'SearchAction',
                'target' => [
                    '@type' => 'EntryPoint',
                    'urlTemplate' => route('search').'?q={search_term_string}',
                ],
                'query-input' => 'required name=search_term_string',
            ],
        ]);
    }

    /**
     * The author, also the publisher: a personal blog has no organisation behind it.
     *
     * @return array<string, mixed>
     */
    public static function person(User $author): array
    {
        return array_filter([
            '@type' => 'Person',
            '@id' => self::personId(),
            'name' => self::authorName(),
            'url' => route('profile.show', $author->slug),
            'image' => $author->avatar ? ShareImage::large($author->avatar) : null,
            'description' => $author->metaDescription() ?: null,
            'sameAs' => array_values(config()->array('blog.social')),
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    public static function blogPosting(Article $article, ?User $author): array
    {
        $image = $article->cover_photo ?: $author?->avatar;

        return array_filter([
            '@type' => 'BlogPosting',
            '@id' => route('articles.show', $article->slug).'#article',
            'headline' => Str::limit(Str::squish($article->title), self::HeadlineLength - 1, '…', preserveWords: true),
            'description' => $article->metaDescription() ?: null,
            'image' => $image ? ShareImage::structuredData($image) : null,
            'datePublished' => $article->published_date?->toIso8601String(),
            'dateModified' => ($article->updated_at ?? $article->published_date)?->toIso8601String(),
            'author' => $author ? ['@id' => self::personId()] : null,
            'publisher' => $author ? ['@id' => self::personId()] : null,
            'mainEntityOfPage' => route('articles.show', $article->slug),
            'isPartOf' => ['@id' => self::websiteId()],
            'inLanguage' => config()->string('blog.language'),
            'wordCount' => $article->wordCount(),
            'articleSection' => $article->categories->map(fn (Category $category): string => $category->value)->values()->all() ?: null,
            'keywords' => Str::squish($article->keywords ?? '') ?: null,
        ]);
    }

    /**
     * Accueil › article title.
     *
     * @return array<string, mixed>
     */
    public static function breadcrumb(Article $article): array
    {
        return [
            '@type' => 'BreadcrumbList',
            'itemListElement' => [
                ['@type' => 'ListItem', 'position' => 1, 'name' => 'Accueil', 'item' => Seo::homeUrl()],
                ['@type' => 'ListItem', 'position' => 2, 'name' => Str::squish($article->title), 'item' => route('articles.show', $article->slug)],
            ],
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public static function profilePage(User $author): array
    {
        return array_filter([
            '@type' => 'ProfilePage',
            '@id' => route('profile.show', $author->slug),
            'url' => route('profile.show', $author->slug),
            'mainEntity' => ['@id' => self::personId()],
            'isPartOf' => ['@id' => self::websiteId()],
            'inLanguage' => config()->string('blog.language'),
            'dateModified' => $author->updated_at?->toIso8601String(),
        ]);
    }

    /**
     * A plain page of the site, such as the privacy policy.
     *
     * @return array<string, mixed>
     */
    public static function webPage(string $url, string $name, string $description): array
    {
        return [
            '@type' => 'WebPage',
            '@id' => $url,
            'url' => $url,
            'name' => $name,
            'description' => $description,
            'isPartOf' => ['@id' => self::websiteId()],
            'inLanguage' => config()->string('blog.language'),
        ];
    }

    /**
     * The author's name as people know it. Not `display_name`, which holds a headline (« The man I used to be… »).
     */
    public static function authorName(): string
    {
        return config()->string('blog.name');
    }

    /**
     * JSON for a `<script type="application/ld+json">`. `JSON_HEX_TAG` escapes `<` and `>`, so `</script>` in a title stays inert.
     *
     * @param  array<int, array<string, mixed>>  $graph
     */
    public static function encode(array $graph): string
    {
        return json_encode(
            ['@context' => 'https://schema.org', '@graph' => array_values($graph)],
            JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_HEX_TAG | JSON_THROW_ON_ERROR,
        );
    }
}
