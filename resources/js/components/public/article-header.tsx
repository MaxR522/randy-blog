import { Link } from '@inertiajs/react';
import { CategoryChips } from '@/components/public/category-chips';
import { labels } from '@/lib/labels.fr';
import { frenchTypography } from '@/lib/typography';
import type { ArticleDetail } from '@/types';

/**
 * Chips, date and reading time, title, chapô and byline. Left-aligned on phones, centred from tablet.
 */
export function ArticleHeader({ article }: { article: ArticleDetail }) {
    return (
        <header className="px-gutter tablet:pt-12 laptop:pt-16 mx-auto w-full max-w-7xl pt-8">
            <div className="max-w-article-header tablet:items-center tablet:text-center mx-auto flex flex-col items-start">
                <CategoryChips
                    categories={article.categories}
                    className="tablet:justify-center"
                />
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
                <h1 className="text-h1 tablet:mt-4.5 tablet:text-balance mt-3.5 font-sans">
                    {frenchTypography(article.title)}
                </h1>
                {article.chapoHtml && (
                    <div
                        className="text-chapo text-grey-dark tablet:mt-5.5 mt-4 max-w-180 font-sans text-pretty [&_p+p]:mt-3"
                        dangerouslySetInnerHTML={{ __html: article.chapoHtml }}
                    />
                )}
                {article.author && (
                    <p className="text-button tablet:mt-6 mt-4.5 font-medium">
                        {labels.article.byline}{' '}
                        <Link
                            href={article.author.url}
                            className="text-accent-600 hover:text-accent-800 font-semibold underline underline-offset-3"
                        >
                            {article.author.name}
                        </Link>
                    </p>
                )}
            </div>
        </header>
    );
}
