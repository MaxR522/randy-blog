import { Link } from '@inertiajs/react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { labels } from '@/lib/labels.fr';
import { frenchTypography } from '@/lib/typography';
import { cn } from '@/lib/utils';
import type { ArticleCard } from '@/types';

type NeighbourLinkProps = {
    article: ArticleCard;
    direction: 'previous' | 'next';
};

/**
 * One link per cell; the overline is inside it, so its name reads « Article précédent : titre ».
 */
function NeighbourLink({ article, direction }: NeighbourLinkProps) {
    const isNext = direction === 'next';
    const Arrow = isNext ? ArrowRight : ArrowLeft;
    const overline = isNext ? labels.article.next : labels.article.previous;

    return (
        <Link
            href={article.url}
            className={cn(
                'group border-grey-light text-primary laptop:border-b-0 laptop:py-7 flex flex-col gap-2.5 border-b py-5',
                isNext && 'laptop:items-end laptop:text-right',
            )}
        >
            <span className="text-overline text-accent-700 inline-flex items-center gap-2 font-semibold uppercase">
                {!isNext && (
                    <Arrow
                        aria-hidden="true"
                        className="size-4"
                        strokeWidth={1.75}
                    />
                )}
                {overline}
                <span className="sr-only">{' :'}</span>
                {isNext && (
                    <Arrow
                        aria-hidden="true"
                        className="size-4"
                        strokeWidth={1.75}
                    />
                )}
            </span>
            <span className="laptop:text-[1.625rem] group-hover:text-accent-800 tablet:leading-[1.2] max-w-120 text-[1.3125rem] leading-[1.3] font-semibold tracking-[-0.01em] text-balance">
                {frenchTypography(article.title)}
            </span>
            {article.date && (
                <time
                    dateTime={article.date}
                    className="text-meta text-grey-dark font-medium"
                >
                    {article.dateLabel}
                </time>
            )}
        </Link>
    );
}

type ArticlePaginationProps = {
    previous: ArticleCard | null;
    next: ArticleCard | null;
};

/**
 * « Article précédent » (older) and « Article suivant » (newer): side by side from laptop, stacked below.
 */
export function ArticlePagination({ previous, next }: ArticlePaginationProps) {
    if (!previous && !next) {
        return null;
    }

    return (
        <nav
            aria-label={labels.a11y.articleNav}
            className="border-primary laptop:grid laptop:grid-cols-2 border-t-2"
        >
            <div className="laptop:border-grey-light laptop:border-r laptop:pr-8">
                {previous && (
                    <NeighbourLink article={previous} direction="previous" />
                )}
            </div>
            <div className="laptop:pl-8">
                {next && <NeighbourLink article={next} direction="next" />}
            </div>
        </nav>
    );
}
