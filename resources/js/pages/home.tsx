import { usePage } from '@inertiajs/react';
import { LargeCard, StandardCard } from '@/components/public/article-cards';
import { AllArticles } from '@/components/public/home/all-articles';
import { BannerDescription } from '@/components/public/home/banner-description';
import { SearchBar } from '@/components/public/search-bar';
import { SectionHeader } from '@/components/public/section-header';
import { SubscriptionBlock } from '@/components/public/subscription-block';
import { Seo } from '@/components/public/seo';
import PublicLayout from '@/layouts/public-layout';
import { labels } from '@/lib/labels.fr';
import { frenchTypography } from '@/helpers/typography';
import { useSearch } from '@/hooks/use-search';
import { useSubscription } from '@/hooks/use-subscription';
import { home, privacy } from '@/routes';
import type {
    ArticleCard,
    CategorySection,
    ScrollProp,
    SeoData,
} from '@/types';

type HomeProps = {
    seo: SeoData;
    authorUrl: string | null;
    latest: ArticleCard[];
    categorySections: CategorySection[];
    articles: ScrollProp<ArticleCard>;
};

const container = 'mx-auto w-full max-w-7xl px-gutter';

export default function Home({
    seo,
    authorUrl,
    latest,
    categorySections,
    articles,
}: HomeProps) {
    const [leadArticle, ...otherLatest] = latest;
    const search = useSearch();
    const subscription = useSubscription();
    const nextPage = usePage().scrollProps?.articles?.nextPage;

    return (
        <PublicLayout navbar="home" authorUrl={authorUrl}>
            <Seo seo={seo} />

            <section className="border-grey-light border-b">
                <div className={`${container} laptop:py-18 pt-10 pb-12`}>
                    <div className="max-w-180 min-w-0">
                        <h1 className="text-display font-sans text-balance">
                            {frenchTypography(labels.brand.tagline)}
                        </h1>
                        <BannerDescription />
                        <div className="laptop:mt-9 mt-6">
                            <SearchBar search={search} />
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
                        moreHref={
                            articles.data.length > 0
                                ? '#tous-les-articles'
                                : undefined
                        }
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

            <AllArticles
                articles={articles}
                nextPageUrl={
                    nextPage != null
                        ? home.url({ query: { page: nextPage } })
                        : null
                }
            />

            <SubscriptionBlock
                subscription={subscription}
                privacyUrl={privacy.url()}
            />
        </PublicLayout>
    );
}
