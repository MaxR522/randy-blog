import { Link } from '@inertiajs/react';
import { ArticleImage } from '@/components/public/article-image';
import { CategoryChips } from '@/components/public/category-chips';
import { labels } from '@/lib/labels.fr';
import { frenchTypography } from '@/lib/typography';
import type { SearchResult as SearchResultData } from '@/types';

/**
 * One result, in a list item. Mobile: 96 px thumbnail beside title and date, excerpt below at full width.
 * From tablet: 240 px image left; chips, title, excerpt and « date · reading time » right.
 * The matched words of the excerpt are `<mark>` elements.
 */
export function SearchResult({ article }: { article: SearchResultData }) {
    return (
        <li className="border-grey-light border-b">
            <article className="tablet:grid-cols-[240px_1fr] tablet:grid-rows-[auto_auto_1fr] tablet:gap-x-8 tablet:py-8 grid grid-cols-[96px_1fr] gap-x-4 py-6">
                <Link
                    href={article.url}
                    tabIndex={-1}
                    aria-hidden="true"
                    className="tablet:row-span-3 block self-start"
                >
                    <ArticleImage
                        src={article.cover}
                        sizes="(min-width: 768px) 240px, 96px"
                    />
                </Link>
                <div className="min-w-0">
                    <CategoryChips
                        categories={article.categories}
                        className="tablet:flex mb-2.5 hidden"
                    />
                    <h2 className="text-primary tablet:text-[1.75rem]/[1.2] tablet:tracking-[-0.015em] font-sans text-xl/[1.25] font-semibold tracking-[-0.01em]">
                        <Link
                            href={article.url}
                            className="hover:text-accent-800"
                        >
                            {frenchTypography(article.title)}
                        </Link>
                    </h2>
                    {article.date && (
                        <p className="text-meta text-grey-dark tablet:hidden mt-1.5 font-medium">
                            <time dateTime={article.date}>
                                {article.dateLabel}
                            </time>
                        </p>
                    )}
                </div>
                {article.excerpt.length > 0 && (
                    <p className="text-primary tablet:col-span-1 tablet:mt-2.5 tablet:text-[1.0625rem]/[27px] col-span-2 mt-3 font-sans text-base/[25px]">
                        {article.excerpt.map((segment, index) =>
                            segment.highlighted ? (
                                <mark
                                    key={index}
                                    className="bg-accent-100 text-primary rounded-sm px-0.5"
                                >
                                    {frenchTypography(segment.text)}
                                </mark>
                            ) : (
                                frenchTypography(segment.text)
                            ),
                        )}
                    </p>
                )}
                <p className="text-meta text-grey-dark tablet:col-start-2 tablet:block mt-3 hidden font-medium">
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
            </article>
        </li>
    );
}
