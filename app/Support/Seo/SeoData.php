<?php

namespace App\Support\Seo;

/**
 * Everything the `Seo` React component puts in the page `<head>` (SEO-HEAD-1), built by {@see Seo}.
 *
 * @phpstan-type SeoImage array{url: string, width: int|null, height: int|null, alt: string}
 * @phpstan-type SeoArticle array{publishedTime: string|null, modifiedTime: string|null, author: string|null, section: string|null, tags: array<int, string>}
 * @phpstan-type SeoAlternate array{type: string, href: string, title: string}
 */
final readonly class SeoData
{
    /**
     * Indexable pages that may show a large image preview in results and Discover (SEO-CRAWL-3).
     */
    public const string IndexWithLargeImage = 'index, follow, max-image-preview:large';

    public const string Index = 'index, follow';

    /**
     * Search results: not indexed, but their links are followed.
     */
    public const string NoIndexFollow = 'noindex, follow';

    public const string NoIndex = 'noindex';

    /**
     * Confirmations and previews: neither indexed nor followed.
     */
    public const string NoIndexNoFollow = 'noindex, nofollow';

    /**
     * @param  'website'|'article'|'profile'  $type  Open Graph type
     * @param  SeoImage|null  $image
     * @param  SeoArticle|null  $article
     * @param  list<SeoAlternate>  $alternates
     * @param  array<int, array<string, mixed>>  $graph  JSON-LD `@graph` entities
     */
    public function __construct(
        public string $title,
        public string $description,
        public ?string $canonical,
        public string $robots,
        public string $type = 'website',
        public ?array $image = null,
        public ?array $article = null,
        public array $alternates = [],
        public array $graph = [],
    ) {}

    /**
     * Whether search engines may index the page (it then gets a canonical URL and social tags).
     */
    public function isIndexable(): bool
    {
        return str_starts_with($this->robots, 'index');
    }

    /**
     * The props sent to the page. `jsonLd` is already encoded, with `<` escaped so a title can never close the script tag.
     *
     * @return array{
     *     title: string,
     *     description: string,
     *     canonical: string|null,
     *     robots: string,
     *     type: string,
     *     siteName: string,
     *     locale: string,
     *     twitterHandle: string,
     *     image: SeoImage|null,
     *     article: SeoArticle|null,
     *     alternates: list<SeoAlternate>,
     *     jsonLd: string|null,
     * }
     */
    public function toArray(): array
    {
        return [
            'title' => $this->title,
            'description' => $this->description,
            'canonical' => $this->canonical,
            'robots' => $this->robots,
            'type' => $this->type,
            'siteName' => config()->string('blog.name'),
            'locale' => config()->string('blog.og_locale'),
            'twitterHandle' => config()->string('blog.x_handle'),
            'image' => $this->image,
            'article' => $this->article,
            'alternates' => $this->alternates,
            'jsonLd' => $this->graph === [] ? null : StructuredData::encode($this->graph),
        ];
    }
}
