import { ArticleCover, coverPreload } from '@/components/public/article-cover';
import { AudioSlot } from '@/components/public/audio-slot';
import { ArticleEndCta } from '@/components/public/article-end-cta';
import { ArticleHeader } from '@/components/public/article-header';
import { ArticlePagination } from '@/components/public/article-pagination';
import type { LightboxImage } from '@/components/public/image-lightbox';
import { ImageLightbox } from '@/components/public/image-lightbox';
import { ShareButtons } from '@/components/public/share-buttons';
import { Seo } from '@/components/public/seo';
import PublicLayout from '@/layouts/public-layout';
import { frenchTypography } from '@/lib/typography';
import type { ArticleCard, ArticleDetail, SeoData } from '@/types';
import type { MouseEvent } from 'react';
import { useState } from 'react';

type ArticleProps = {
    seo: SeoData;
    article: ArticleDetail;
    previous: ArticleCard | null;
    next: ArticleCard | null;
};

const container = 'mx-auto w-full max-w-7xl px-gutter';

/**
 * Image behind an `a.image-zoom` link (the cover, or a body image wrapped by the server), or `null` for any other
 * click. The link points at the original image, so the cover opens whole rather than as its 16:9 crop.
 * Modified and middle clicks keep the link's own behaviour, such as opening the image in a new tab.
 */
function zoomableImageFrom(
    event: MouseEvent<HTMLElement>,
): LightboxImage | null {
    if (
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey ||
        !(event.target instanceof Element)
    ) {
        return null;
    }

    const link = event.target.closest<HTMLAnchorElement>('a.image-zoom');
    const image = link?.querySelector('img');

    if (!link || !image) {
        return null;
    }

    return {
        src: link.href,
        previewSrc: image.currentSrc || image.src,
        alt: image.alt,
        caption:
            image
                .closest('figure')
                ?.querySelector('figcaption')
                ?.textContent?.trim() || null,
    };
}

export default function Article({
    seo,
    article,
    previous,
    next,
}: ArticleProps) {
    const title = frenchTypography(article.title);
    const [zoomedImage, setZoomedImage] = useState<LightboxImage | null>(null);

    function handleImageClick(event: MouseEvent<HTMLElement>): void {
        const image = zoomableImageFrom(event);

        if (image) {
            event.preventDefault();
            setZoomedImage(image);
        }
    }

    return (
        <PublicLayout navbar="back">
            <Seo
                seo={seo}
                preloadImage={
                    article.cover ? coverPreload(article.cover) : undefined
                }
            />

            <article onClick={handleImageClick}>
                <ArticleHeader article={article} />

                <div className={`${container} tablet:pt-10 pt-6`}>
                    <div className="max-w-article-header laptop:max-w-article-cover border-grey-light tablet:flex-row tablet:items-center tablet:justify-between tablet:gap-6 tablet:py-3 mx-auto flex flex-col gap-3.5 border-y py-3.5">
                        <AudioSlot minutes={article.readingTime} />
                        <ShareButtons url={article.url} title={title} />
                    </div>
                </div>

                {article.cover && (
                    <ArticleCover
                        src={article.cover}
                        alt={article.coverAlt}
                        credit={article.coverCredit}
                    />
                )}

                <div className={`${container} laptop:pt-14 pt-8`}>
                    <div
                        className="article-body"
                        dangerouslySetInnerHTML={{
                            __html: article.contentHtml,
                        }}
                    />
                </div>

                <div className={`${container} laptop:pt-4 pt-2`}>
                    <ArticleEndCta />
                </div>
            </article>

            <ImageLightbox
                image={zoomedImage}
                onClose={() => setZoomedImage(null)}
            />

            <div
                className={`${container} laptop:mt-14 laptop:pb-18 mt-6 pb-10`}
            >
                <ArticlePagination previous={previous} next={next} />
            </div>
        </PublicLayout>
    );
}
