import { Search as SearchIcon } from 'lucide-react';
import { StandardCard } from '@/components/public/article-cards';
import { Pagination } from '@/components/public/pagination';
import { SearchBar } from '@/components/public/search-bar';
import { SearchResult } from '@/components/public/search-result';
import { SectionHeader } from '@/components/public/section-header';
import { Seo } from '@/components/public/seo';
import PublicLayout from '@/layouts/public-layout';
import { labels } from '@/lib/labels.fr';
import { frenchTypography } from '@/lib/typography';
import type { ArticleCard, SearchResults, SeoData } from '@/types';

type SearchProps = {
    seo: SeoData;
    query: string;
    results: SearchResults;
    latest: ArticleCard[];
};

const container = 'mx-auto w-full max-w-7xl px-gutter';

const column = 'mx-auto max-w-220';

export default function Search({ seo, query, results, latest }: SearchProps) {
    const title = frenchTypography(labels.search.resultsFor(query));
    const hasResults = results.total > 0;

    return (
        <PublicLayout navbar="back">
            <Seo seo={seo} />

            <div className={`${container} tablet:pt-16 pt-8`}>
                <div className={column}>
                    <h1 className="text-h1 laptop:text-[3rem]/[1.12] font-sans">
                        {title}
                    </h1>
                    <div className="mt-5">
                        <SearchBar
                            key={query}
                            defaultValue={query}
                            size="compact"
                        />
                    </div>
                    <p
                        role="status"
                        className="text-body-small text-grey-dark mt-4 font-medium"
                    >
                        {labels.search.count(results.total)}
                    </p>
                </div>
            </div>

            <div className={`${container} tablet:pt-6 laptop:pb-24 pt-4 pb-14`}>
                <div className={`${column} border-primary border-t-2`}>
                    {hasResults ? (
                        <>
                            <ul role="list">
                                {results.data.map((article) => (
                                    <SearchResult
                                        key={article.id}
                                        article={article}
                                    />
                                ))}
                            </ul>
                            <div className="laptop:mt-12 mt-8">
                                <Pagination
                                    currentPage={results.currentPage}
                                    lastPage={results.lastPage}
                                    previousUrl={results.previousUrl}
                                    nextUrl={results.nextUrl}
                                />
                            </div>
                        </>
                    ) : (
                        <div
                            role="status"
                            className="tablet:py-20 flex flex-col items-center gap-6 py-14 text-center"
                        >
                            <SearchIcon
                                aria-hidden="true"
                                className="text-grey-medium size-10"
                                strokeWidth={1.75}
                            />
                            <p className="tablet:text-[2.125rem] max-w-130 font-sans text-[1.875rem]/[1.2] font-semibold tracking-[-0.015em] text-balance">
                                {frenchTypography(labels.search.empty)}
                            </p>
                        </div>
                    )}
                </div>

                {latest.length > 0 && (
                    <section
                        aria-labelledby="derniers-articles"
                        className={`${column} tablet:mt-6`}
                    >
                        <SectionHeader
                            id="derniers-articles"
                            title={labels.search.latest}
                        />
                        <ul
                            role="list"
                            className="gap-grid tablet:grid tablet:grid-cols-2 laptop:grid-cols-3 tablet:gap-y-12"
                        >
                            {latest.map((article) => (
                                <StandardCard
                                    key={article.id}
                                    article={article}
                                    layout="compact-below-tablet"
                                    sizes="(min-width: 1024px) 280px, (min-width: 768px) 50vw, 96px"
                                />
                            ))}
                        </ul>
                    </section>
                )}
            </div>
        </PublicLayout>
    );
}
