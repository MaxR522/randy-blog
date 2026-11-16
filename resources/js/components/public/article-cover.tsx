import {
    cloudinaryCoverMobileSrcSet,
    cloudinaryCoverMobileUrl,
    cloudinaryCoverSrcSet,
    cloudinaryCoverUrl,
} from '@/lib/cloudinary';
import { labels } from '@/lib/labels.fr';
import { frenchTypography } from '@/helpers/typography';
import type { PreloadImage } from '@/types';

const WIDTHS = [640, 960, 1280, 1680, 2240] as const;

const SIZES =
    '(min-width: 1184px) 1120px, (min-width: 1024px) calc(100vw - 64px), (min-width: 768px) calc(100vw - 48px), 100vw';

/**
 * Phones (below the `tablet` breakpoint): edge to edge, a portrait or square source in a 1:1 frame.
 */
const MOBILE_MEDIA = '(max-width: 47.99rem)';
const MOBILE_WIDTHS = [640, 960, 1280] as const;
const MOBILE_SIZES = '100vw';

/**
 * The cover as the article page preloads it from the head: one preload per `<picture>` source, each limited to its
 * media query, with the same URL, srcset and sizes as the source.
 */
export function coverPreload(src: string): PreloadImage[] {
    return [
        {
            href: cloudinaryCoverMobileUrl(src, 960),
            srcSet: cloudinaryCoverMobileSrcSet(src, MOBILE_WIDTHS),
            sizes: MOBILE_SIZES,
            media: MOBILE_MEDIA,
        },
        {
            href: cloudinaryCoverUrl(src, 1280),
            srcSet: cloudinaryCoverSrcSet(src, WIDTHS),
            sizes: SIZES,
            media: '(min-width: 48rem)',
        },
    ];
}

type ArticleCoverProps = {
    src: string;
    alt: string;
    credit: string | null;
};

/**
 * 16:9 cover, edge to edge on phones, 1120 px wide at most. Cloudinary crops it around the subject, or frames it
 * when cropping would lose the subject or stretch a small source (see `cloudinaryCoverUrl`). On phones a portrait or
 * square source gets a 1:1 frame instead (`cloudinaryCoverMobileUrl`), so the box follows the delivered image there;
 * the 1280 × 720 attributes hold a 16:9 space until it loads. It is the page's LCP image: loaded eagerly with a high
 * fetch priority. It links to the original image, which the article page opens in the full-screen viewer
 * (`a.image-zoom`, like body images).
 */
export function ArticleCover({ src, alt, credit }: ArticleCoverProps) {
    return (
        <figure className="tablet:px-gutter tablet:mt-10 mx-auto mt-6 w-full max-w-7xl">
            <div className="max-w-article-cover mx-auto">
                <a
                    href={src}
                    aria-label={labels.article.image.open(alt)}
                    className="image-zoom tablet:rounded-sm block cursor-zoom-in"
                >
                    <picture>
                        <source
                            media={MOBILE_MEDIA}
                            srcSet={cloudinaryCoverMobileSrcSet(
                                src,
                                MOBILE_WIDTHS,
                            )}
                            sizes={MOBILE_SIZES}
                        />
                        <img
                            src={cloudinaryCoverUrl(src, 1280)}
                            srcSet={cloudinaryCoverSrcSet(src, WIDTHS)}
                            sizes={SIZES}
                            alt={alt}
                            width={1280}
                            height={720}
                            loading="eager"
                            fetchPriority="high"
                            decoding="async"
                            className="tablet:aspect-cover bg-grey-subtle tablet:rounded-sm block h-auto w-full object-cover"
                        />
                    </picture>
                </a>
                {credit && (
                    <figcaption className="text-caption text-grey-dark px-gutter tablet:mt-3 tablet:max-w-lg tablet:px-0 tablet:text-balance mx-auto mt-2.5 text-center text-pretty">
                        {frenchTypography(credit)}
                    </figcaption>
                )}
            </div>
        </figure>
    );
}
