import { Link } from '@inertiajs/react';
import { ArticleImage } from '@/components/public/article-image';
import { CategoryChips } from '@/components/public/category-chips';
import { frenchTypography } from '@/lib/typography';
import { cn } from '@/lib/utils';
import type { ArticleCard } from '@/types';

const titleClasses =
    'font-sans font-semibold tracking-[-0.01em] text-balance text-primary';

const titleLinkClasses = 'hover:text-accent-800';

type ImageLinkProps = {
    article: ArticleCard;
    sizes: string;
    isPriority?: boolean;
    className?: string;
};

/**
 * The image repeats the title link, so it is hidden from keyboard and screen readers.
 */
function ImageLink({ article, sizes, isPriority, className }: ImageLinkProps) {
    return (
        <Link
            href={article.url}
            tabIndex={-1}
            aria-hidden="true"
            className={cn('block', className)}
        >
            <ArticleImage
                src={article.cover}
                sizes={sizes}
                isPriority={isPriority}
            />
        </Link>
    );
}

function ArticleDate({
    article,
    className,
}: {
    article: ArticleCard;
    className?: string;
}) {
    if (!article.date) {
        return null;
    }

    return (
        <p className={cn('text-meta text-grey-dark font-medium', className)}>
            <time dateTime={article.date}>{article.dateLabel}</time>
        </p>
    );
}

/**
 * Lead card of a group: image, chips, title, chapô, date. Its image is the first one on the home page.
 */
export function LargeCard({ article }: { article: ArticleCard }) {
    return (
        <article className="flex min-w-0 flex-col">
            <ImageLink
                article={article}
                sizes="(min-width: 1280px) 596px, (min-width: 1024px) 48vw, 100vw"
                isPriority
            />
            <CategoryChips categories={article.categories} className="mt-4" />
            <h3 className={cn(titleClasses, 'text-card-large mt-3')}>
                <Link href={article.url} className={titleLinkClasses}>
                    {frenchTypography(article.title)}
                </Link>
            </h3>
            {article.chapo && (
                <p className="text-grey-dark laptop:text-base/normal mt-2.5 font-sans text-[0.9375rem]/normal text-pretty">
                    {frenchTypography(article.chapo)}
                </p>
            )}
            <ArticleDate article={article} className="mt-3.5" />
        </article>
    );
}

/**
 * How a standard card lays out:
 * - `stack`: image above the title at every width.
 * - `compact-below-laptop`: compact row (96 px thumbnail, hairline below)
 *   under 1024 px, stacked from laptop on.
 * - `compact-below-tablet`: compact row under 768 px, stacked from tablet on,
 *   with the wide title in the 3-column laptop grid.
 * - `row`: 248 px card of a mobile horizontal scroller, grid cell from tablet.
 */
type StandardCardLayout =
    | 'stack'
    | 'compact-below-tablet'
    | 'compact-below-laptop'
    | 'row';

/**
 * `item` sizes the list item (width, snap, hairline), `article` lays out image and text inside it.
 */
const standardLayouts: Record<
    StandardCardLayout,
    {
        item: string;
        article: string;
        image: string;
        title: string;
        date: string;
    }
> = {
    stack: {
        item: '',
        article: 'flex flex-col',
        image: '',
        title: 'mt-3.5 text-card',
        date: 'mt-2',
    },
    'compact-below-laptop': {
        item: 'border-b border-grey-light py-4 laptop:border-0 laptop:py-0',
        article: 'flex items-start gap-4 laptop:flex-col laptop:gap-0',
        image: 'w-24 flex-none laptop:w-full',
        title: 'text-card-compact laptop:mt-3.5 laptop:text-card',
        date: 'mt-1.5 laptop:mt-2',
    },
    row: {
        item: 'w-62 flex-none snap-start tablet:w-auto',
        article: 'flex flex-col',
        image: '',
        title: 'mt-3 text-lg/[1.3] tablet:mt-3.5 tablet:text-card',
        date: 'mt-1.5 tablet:mt-2',
    },
    'compact-below-tablet': {
        item: 'border-b border-grey-light py-4 tablet:border-0 tablet:py-0',
        article: 'flex items-start gap-4 tablet:flex-col tablet:gap-0',
        image: 'w-24 flex-none tablet:w-full',
        title: 'text-card-compact tablet:mt-3.5 tablet:text-card laptop:text-card-wide',
        date: 'mt-1.5 tablet:mt-2',
    },
};

type StandardCardProps = {
    article: ArticleCard;
    layout?: StandardCardLayout;
    sizes: string;
};

/**
 * Grid and row card: image, title, date. Renders a list item: place it in a `<ul role="list">`,
 * so screen readers announce the group and its size.
 */
export function StandardCard({
    article,
    layout = 'stack',
    sizes,
}: StandardCardProps) {
    const classes = standardLayouts[layout];

    return (
        <li className={cn('min-w-0', classes.item)}>
            <article className={cn('min-w-0', classes.article)}>
                <ImageLink
                    article={article}
                    sizes={sizes}
                    className={classes.image}
                />
                <div className="min-w-0">
                    <h3 className={cn(titleClasses, classes.title)}>
                        <Link href={article.url} className={titleLinkClasses}>
                            {frenchTypography(article.title)}
                        </Link>
                    </h3>
                    <ArticleDate article={article} className={classes.date} />
                </div>
            </article>
        </li>
    );
}
