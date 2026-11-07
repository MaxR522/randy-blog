import { cloudinaryCoverSrcSet, cloudinaryCoverUrl } from '@/lib/cloudinary';
import { frenchTypography } from '@/lib/typography';
import type { PreloadImage } from '@/types';

const WIDTHS = [640, 960, 1280, 1680, 2240] as const;

const SIZES =
    '(min-width: 1184px) 1120px, (min-width: 1024px) calc(100vw - 64px), (min-width: 768px) calc(100vw - 48px), 100vw';

/**
 * The cover as the article page preloads it from the head: same URL, srcset and sizes as the `<img>`.
 */
export function coverPreload(src: string): PreloadImage {
    return {
        href: cloudinaryCoverUrl(src, 1280),
        srcSet: cloudinaryCoverSrcSet(src, WIDTHS),
        sizes: SIZES,
    };
}

type ArticleCoverProps = {
    src: string;
    alt: string;
    credit: string | null;
};

/**
 * 16:9 cover, edge to edge on phones, 1120 px wide at most. Cloudinary crops it around the subject, or frames it
 * when cropping would lose the subject or stretch a small source (see `cloudinaryCoverUrl`). It is the page's LCP
 * image: loaded eagerly with a high fetch priority.
 */
export function ArticleCover({ src, alt, credit }: ArticleCoverProps) {
    return (
        <figure className="tablet:px-gutter tablet:mt-10 mx-auto mt-6 w-full max-w-7xl">
            <div className="max-w-article-cover mx-auto">
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
                    className="aspect-cover bg-grey-subtle tablet:rounded-sm w-full object-cover"
                />
                {credit && (
                    <figcaption className="text-caption text-grey-dark px-gutter tablet:mt-3 tablet:max-w-lg tablet:px-0 mx-auto mt-2.5 text-center text-balance">
                        {frenchTypography(credit)}
                    </figcaption>
                )}
            </div>
        </figure>
    );
}
