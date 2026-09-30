import { Head } from '@inertiajs/react';
import { ArticleCover } from '@/components/public/article-cover';
import { AudioSlot } from '@/components/public/audio-slot';
import { ArticleEndCta } from '@/components/public/article-end-cta';
import { ArticleHeader } from '@/components/public/article-header';
import { ArticlePagination } from '@/components/public/article-pagination';
import { ShareButtons } from '@/components/public/share-buttons';
import PublicLayout from '@/layouts/public-layout';
import { frenchTypography } from '@/lib/typography';
import type { ArticleCard, ArticleDetail } from '@/types';

type ArticleProps = {
    article: ArticleDetail;
    previous: ArticleCard | null;
    next: ArticleCard | null;
};

const container = 'mx-auto w-full max-w-7xl px-gutter';

export default function Article({ article, previous, next }: ArticleProps) {
    const title = frenchTypography(article.title);

    return (
        <PublicLayout navbar="back">
            <Head>
                <title>{title}</title>
                <meta
                    name="description"
                    content={frenchTypography(article.description)}
                />
            </Head>

            <article>
                <ArticleHeader article={article} />

                <div className={`${container} tablet:pt-10 pt-6`}>
                    <div className="max-w-article-header border-grey-light tablet:flex-row tablet:items-center tablet:justify-between tablet:gap-6 tablet:py-3 mx-auto flex flex-col gap-3.5 border-y py-3.5">
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

            <div
                className={`${container} laptop:mt-14 laptop:pb-18 mt-6 pb-10`}
            >
                <ArticlePagination previous={previous} next={next} />
            </div>
        </PublicLayout>
    );
}
