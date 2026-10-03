import { Head } from '@inertiajs/react';
import { frenchTypography } from '@/lib/typography';
import type { PreloadImage, SeoData } from '@/types';

type SeoProps = {
    seo: SeoData;
    preloadImage?: PreloadImage;
};

/**
 * Every search and social tag of a public page (SEO-HEAD-1). Rendered in the SSR HTML; each tag has a
 * `head-key` so client-side visits replace the previous page's tags instead of adding to them.
 * The title goes through `Head`'s `title` prop, which escapes it in the server output. `Head` prints every
 * prop it is given, `undefined` included, so optional attributes are left out rather than set to `undefined`.
 */
export function Seo({ seo, preloadImage }: SeoProps) {
    const title = frenchTypography(seo.title);
    const description = frenchTypography(seo.description);
    const isIndexable = seo.robots.startsWith('index');

    return (
        <Head title={title}>
            {description && (
                <meta
                    head-key="description"
                    name="description"
                    content={description}
                />
            )}
            <meta head-key="robots" name="robots" content={seo.robots} />
            {seo.canonical && (
                <link
                    head-key="canonical"
                    rel="canonical"
                    href={seo.canonical}
                />
            )}
            {preloadImage && (
                <link
                    head-key="preload-image"
                    rel="preload"
                    as="image"
                    href={preloadImage.href}
                    {...(preloadImage.srcSet && {
                        imageSrcSet: preloadImage.srcSet,
                        imageSizes: preloadImage.sizes,
                    })}
                    fetchPriority="high"
                />
            )}
            {seo.alternates.map((alternate) => (
                <link
                    key={alternate.href}
                    head-key={`alternate-${alternate.type}`}
                    rel="alternate"
                    type={alternate.type}
                    href={alternate.href}
                    title={frenchTypography(alternate.title)}
                />
            ))}

            {isIndexable && [
                <meta
                    key="og:type"
                    head-key="og:type"
                    property="og:type"
                    content={seo.type}
                />,
                <meta
                    key="og:site_name"
                    head-key="og:site_name"
                    property="og:site_name"
                    content={seo.siteName}
                />,
                <meta
                    key="og:locale"
                    head-key="og:locale"
                    property="og:locale"
                    content={seo.locale}
                />,
                <meta
                    key="og:title"
                    head-key="og:title"
                    property="og:title"
                    content={title}
                />,
                <meta
                    key="og:description"
                    head-key="og:description"
                    property="og:description"
                    content={description}
                />,
                seo.canonical && (
                    <meta
                        key="og:url"
                        head-key="og:url"
                        property="og:url"
                        content={seo.canonical}
                    />
                ),
                <meta
                    key="twitter:card"
                    head-key="twitter:card"
                    name="twitter:card"
                    content={seo.image ? 'summary_large_image' : 'summary'}
                />,
                <meta
                    key="twitter:site"
                    head-key="twitter:site"
                    name="twitter:site"
                    content={seo.twitterHandle}
                />,
                <meta
                    key="twitter:creator"
                    head-key="twitter:creator"
                    name="twitter:creator"
                    content={seo.twitterHandle}
                />,
            ]}

            {isIndexable &&
                seo.image && [
                    <meta
                        key="og:image"
                        head-key="og:image"
                        property="og:image"
                        content={seo.image.url}
                    />,
                    seo.image.width && (
                        <meta
                            key="og:image:width"
                            head-key="og:image:width"
                            property="og:image:width"
                            content={String(seo.image.width)}
                        />
                    ),
                    seo.image.height && (
                        <meta
                            key="og:image:height"
                            head-key="og:image:height"
                            property="og:image:height"
                            content={String(seo.image.height)}
                        />
                    ),
                    <meta
                        key="og:image:alt"
                        head-key="og:image:alt"
                        property="og:image:alt"
                        content={frenchTypography(seo.image.alt)}
                    />,
                ]}

            {isIndexable &&
                seo.article && [
                    seo.article.publishedTime && (
                        <meta
                            key="article:published_time"
                            head-key="article:published_time"
                            property="article:published_time"
                            content={seo.article.publishedTime}
                        />
                    ),
                    seo.article.modifiedTime && (
                        <meta
                            key="article:modified_time"
                            head-key="article:modified_time"
                            property="article:modified_time"
                            content={seo.article.modifiedTime}
                        />
                    ),
                    seo.article.author && (
                        <meta
                            key="article:author"
                            head-key="article:author"
                            property="article:author"
                            content={seo.article.author}
                        />
                    ),
                    seo.article.section && (
                        <meta
                            key="article:section"
                            head-key="article:section"
                            property="article:section"
                            content={seo.article.section}
                        />
                    ),
                    ...seo.article.tags.map((tag, index) => (
                        <meta
                            key={`article:tag:${index}`}
                            head-key={`article:tag:${index}`}
                            property="article:tag"
                            content={tag}
                        />
                    )),
                ]}

            {seo.jsonLd && (
                <script
                    head-key="json-ld"
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: seo.jsonLd }}
                />
            )}
        </Head>
    );
}
