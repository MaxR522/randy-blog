/**
 * Head tags of a public page, built on the server by `App\Support\Seo\Seo` and passed as the `seo` prop.
 */
export type SeoData = {
    title: string;
    description: string;
    canonical: string | null;
    robots: string;
    type: 'website' | 'article' | 'profile';
    siteName: string;
    locale: string;
    twitterHandle: string;
    image: {
        url: string;
        width: number | null;
        height: number | null;
        alt: string;
    } | null;
    article: {
        publishedTime: string | null;
        modifiedTime: string | null;
        author: string | null;
        section: string | null;
        tags: string[];
    } | null;
    alternates: { type: string; href: string; title: string }[];
    /** Already-encoded JSON-LD, `<` escaped on the server. */
    jsonLd: string | null;
};

/**
 * The LCP image, preloaded from the head so the browser fetches it before parsing the body (SEO-PERF-1).
 */
export type PreloadImage = {
    href: string;
    srcSet?: string;
    sizes: string;
};
