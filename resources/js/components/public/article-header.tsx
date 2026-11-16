import { Link } from '@inertiajs/react';
import { CategoryChips } from '@/components/public/category-chips';
import { labels } from '@/lib/labels.fr';
import { frenchTypography } from '@/helpers/typography';
import type { ArticleDetail } from '@/types';

/**
 * Chips, date and reading time, title, chapô and byline. Left-aligned on every screen, against the page gutter
 * (the left edge of the navbar); the title and chapô span the full page container.
 */
export function ArticleHeader({ article }: { article: ArticleDetail }) {
    return (
        <header className="px-gutter tablet:pt-12 laptop:pt-16 mx-auto w-full max-w-7xl pt-8">
            <div className="flex flex-col items-start">
                <CategoryChips categories={article.categories} />
                <p className="text-body-small text-grey-dark tablet:mt-4.5 mt-3.5 font-medium">
                    {article.date && (
                        <>
                            <time dateTime={article.date}>
                                {article.dateLabel}
                            </time>
                            {' · '}
                        </>
                    )}
                    {labels.article.readingTime(article.readingTime)}
                </p>
                <h1 className="text-h1 tablet:mt-4.5 tablet:text-pretty mt-3.5 font-sans">
                    {frenchTypography(article.title)}
                </h1>
                {article.chapoHtml && (
                    <div
                        className="article-chapo text-chapo text-grey-dark tablet:mt-5.5 mt-4 font-sans text-pretty [&_p+p]:mt-3"
                        dangerouslySetInnerHTML={{ __html: article.chapoHtml }}
                    />
                )}
                {article.author && (
                    <p className="text-button tablet:mt-6 mt-4.5 font-medium">
                        {labels.article.byline}{' '}
                        <Link
                            href={article.author.url}
                            className="link font-semibold"
                        >
                            {article.author.name}
                        </Link>
                    </p>
                )}
            </div>
        </header>
    );
}
