import { InfiniteScroll } from '@inertiajs/react';
import { LoaderCircle } from 'lucide-react';
import { StandardCard } from '@/components/public/article-cards';
import { buttonClasses } from '@/components/public/button';
import { SectionHeader } from '@/components/public/section-header';
import { useLoadMoreAnnouncement } from '@/hooks/use-load-more-announcement';
import { labels } from '@/lib/labels.fr';
import { cn } from '@/lib/utils';
import type { ArticleCard, ScrollProp } from '@/types';

const container = 'mx-auto w-full max-w-7xl px-gutter';

type AllArticlesProps = {
    articles: ScrollProp<ArticleCard>;
    /** `/?page=n` of the next page, or `null` once every article is shown. */
    nextPageUrl: string | null;
};

/**
 * « Tous les articles » with « Voir plus ». After a load, the count is announced and focus moves
 * to the first new title, since the button may disappear and would otherwise drop focus to the page.
 */
export function AllArticles({ articles, nextPageUrl }: AllArticlesProps) {
    const count = articles.data.length;
    const { listRef, announcement, markLoadStart } = useLoadMoreAnnouncement(
        count,
        nextPageUrl !== null,
    );

    if (count === 0) {
        return null;
    }

    return (
        <section
            id="tous-les-articles"
            aria-labelledby="tous-les-articles-titre"
            className={`${container} pt-section pb-section`}
        >
            <SectionHeader
                id="tous-les-articles-titre"
                title={labels.home.allArticles}
            />
            <InfiniteScroll
                data="articles"
                manual
                onlyNext
                preserveUrl
                next={({ loading, fetch, hasMore }) =>
                    hasMore &&
                    nextPageUrl !== null && (
                        <div className="laptop:mt-14 mt-8 flex justify-center">
                            {/* A real link to `/?page=n`: crawlers and visitors without JavaScript reach every article (SEO-CRAWL-6). */}
                            <a
                                href={nextPageUrl}
                                aria-busy={loading || undefined}
                                onClick={(event) => {
                                    event.preventDefault();

                                    if (loading) {
                                        return;
                                    }

                                    markLoadStart();
                                    fetch();
                                }}
                                className={buttonClasses(
                                    'secondary',
                                    cn(
                                        'h-12 px-8',
                                        loading && 'cursor-progress',
                                    ),
                                )}
                            >
                                {loading && (
                                    <LoaderCircle
                                        aria-hidden="true"
                                        className="size-4.5 animate-spin"
                                        strokeWidth={1.75}
                                    />
                                )}
                                {labels.home.seeMore}
                            </a>
                        </div>
                    )
                }
            >
                <ul
                    ref={listRef}
                    role="list"
                    className="border-grey-light tablet:grid tablet:grid-cols-2 tablet:gap-x-grid tablet:gap-y-12 tablet:border-t-0 laptop:grid-cols-3 border-t"
                >
                    {articles.data.map((article) => (
                        <StandardCard
                            key={article.id}
                            article={article}
                            layout="compact-below-tablet"
                            sizes="(min-width: 1280px) 389px, (min-width: 1024px) 31vw, (min-width: 768px) 48vw, 96px"
                        />
                    ))}
                </ul>
            </InfiniteScroll>
            <p role="status" className="sr-only">
                {announcement}
            </p>
        </section>
    );
}
