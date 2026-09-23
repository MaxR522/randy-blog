import { Head, InfiniteScroll, usePage } from '@inertiajs/react';
import type { ReactNode } from 'react';
import { useEffect, useRef, useState } from 'react';
import { LargeCard, StandardCard } from '@/components/public/article-cards';
import { Button } from '@/components/public/button';
import { ExternalLink } from '@/components/public/external-link';
import { SearchBar } from '@/components/public/search-bar';
import { SectionHeader } from '@/components/public/section-header';
import { SubscriptionBlock } from '@/components/public/subscription-block';
import PublicLayout from '@/layouts/public-layout';
import { labels } from '@/lib/labels.fr';
import { socialUrls } from '@/lib/social';
import { frenchTypography } from '@/lib/typography';
import type { ArticleCard, CategorySection, ScrollProp } from '@/types';

type HomeProps = {
    authorUrl: string | null;
    latest: ArticleCard[];
    categorySections: CategorySection[];
    articles: ScrollProp<ArticleCard>;
};

const bannerLinkUrls = [
    socialUrls.hautetfort,
    socialUrls.facebook,
    socialUrls.x,
    socialUrls.linkedin,
    socialUrls.youtube,
];

/**
 * Banner description with its link words (`labels.home.heroLinks`, in order) turned into external links.
 */
function BannerDescription() {
    const parts: ReactNode[] = [];
    let rest: string = labels.home.heroDescription;

    labels.home.heroLinks.forEach((linkText, index) => {
        const position = rest.indexOf(linkText);

        parts.push(frenchTypography(rest.slice(0, position)));
        parts.push(
            <ExternalLink
                key={linkText}
                href={bannerLinkUrls[index]}
                className="text-accent-600 hover:text-accent-800 underline underline-offset-3"
            >
                {linkText}
            </ExternalLink>,
        );
        rest = rest.slice(position + linkText.length);
    });

    parts.push(frenchTypography(rest));

    return (
        <p className="text-body/[1.625] laptop:mt-7 laptop:text-lg/7 mt-5 text-pretty">
            {parts}
        </p>
    );
}

const container = 'mx-auto w-full max-w-7xl px-gutter';

/**
 * « Tous les articles » with « Voir plus ». After a load, the count is announced and focus moves
 * to the first new title, since the button may disappear and would otherwise drop focus to the page.
 */
function AllArticles({ articles }: { articles: ScrollProp<ArticleCard> }) {
    const listRef = useRef<HTMLUListElement>(null);
    const countBeforeLoadRef = useRef<number | null>(null);
    const [announcement, setAnnouncement] = useState('');
    const hasNextPage = usePage().scrollProps?.articles?.nextPage != null;
    const count = articles.data.length;

    useEffect(() => {
        const countBeforeLoad = countBeforeLoadRef.current;

        if (countBeforeLoad === null || count <= countBeforeLoad) {
            return;
        }

        countBeforeLoadRef.current = null;
        listRef.current?.children[countBeforeLoad]
            ?.querySelector<HTMLAnchorElement>('h3 a')
            ?.focus();

        const loaded = labels.a11y.moreArticlesLoaded(count - countBeforeLoad);

        setAnnouncement(
            hasNextPage ? loaded : `${loaded}. ${labels.a11y.allArticlesShown}`,
        );
    }, [count, hasNextPage]);

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
                    hasMore && (
                        <div className="laptop:mt-14 mt-8 flex justify-center">
                            <Button
                                variant="secondary"
                                isLoading={loading}
                                onClick={() => {
                                    countBeforeLoadRef.current = count;
                                    fetch();
                                }}
                                className="h-12 px-8"
                            >
                                {labels.home.seeMore}
                            </Button>
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

export default function Home({
    authorUrl,
    latest,
    categorySections,
    articles,
}: HomeProps) {
    const [leadArticle, ...otherLatest] = latest;

    return (
        <PublicLayout navbar="home" authorUrl={authorUrl}>
            <Head>
                <meta
                    name="description"
                    content={frenchTypography(labels.home.heroDescription)}
                />
            </Head>

            <section className="border-grey-light border-b">
                <div className={`${container} laptop:py-18 pt-10 pb-12`}>
                    <div className="max-w-180 min-w-0">
                        <h1 className="text-display font-sans text-balance">
                            {frenchTypography(labels.brand.tagline)}
                        </h1>
                        <BannerDescription />
                        <div className="laptop:mt-9 mt-6">
                            <SearchBar />
                        </div>
                    </div>
                </div>
            </section>

            {leadArticle && (
                <section
                    aria-labelledby="dernieres-publications"
                    className={`${container} pt-section`}
                >
                    <SectionHeader
                        id="dernieres-publications"
                        title={labels.home.latest}
                        moreHref="#tous-les-articles"
                    />
                    <div className="gap-x-grid laptop:grid-cols-2 laptop:items-start grid">
                        <LargeCard article={leadArticle} />
                        {otherLatest.length > 0 && (
                            <ul
                                role="list"
                                className="border-grey-light laptop:mt-0 laptop:grid laptop:grid-cols-2 laptop:gap-x-grid laptop:gap-y-8 laptop:border-t-0 mt-3 border-t"
                            >
                                {otherLatest.map((article) => (
                                    <StandardCard
                                        key={article.id}
                                        article={article}
                                        layout="compact-below-laptop"
                                        sizes="(min-width: 1280px) 286px, (min-width: 1024px) 23vw, 96px"
                                    />
                                ))}
                            </ul>
                        )}
                    </div>
                </section>
            )}

            {categorySections.map((section) => (
                <section
                    key={section.id}
                    aria-labelledby={`categorie-${section.id}`}
                    className={`${container} pt-section`}
                >
                    <SectionHeader
                        id={`categorie-${section.id}`}
                        title={section.name}
                    />
                    <ul
                        role="list"
                        className="-mx-gutter scroll-pl-gutter px-gutter tablet:mx-0 tablet:grid tablet:grid-cols-2 tablet:gap-grid tablet:overflow-visible tablet:px-0 tablet:pb-0 laptop:grid-cols-4 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-1"
                    >
                        {section.articles.map((article) => (
                            <StandardCard
                                key={article.id}
                                article={article}
                                layout="row"
                                sizes="(min-width: 1280px) 286px, (min-width: 1024px) 23vw, (min-width: 768px) 48vw, 248px"
                            />
                        ))}
                    </ul>
                </section>
            ))}

            <AllArticles articles={articles} />

            <SubscriptionBlock />
        </PublicLayout>
    );
}
