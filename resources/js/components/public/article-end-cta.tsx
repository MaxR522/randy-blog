import { buttonClasses } from '@/components/public/button';
import { labels } from '@/lib/labels.fr';
import { frenchTypography } from '@/lib/typography';
import { home } from '@/routes';

/**
 * One-line invitation to subscribe after the article, linking to the home page subscription block.
 */
export function ArticleEndCta() {
    return (
        <aside
            aria-label={labels.a11y.subscription}
            className="max-w-article border-primary border-b-grey-light laptop:flex-row laptop:items-center laptop:justify-between laptop:gap-6 laptop:py-7 mx-auto flex flex-col items-start gap-4 border-t-2 border-b py-6"
        >
            <p className="laptop:max-w-95 laptop:text-2xl text-[1.375rem] leading-tight font-semibold tracking-[-0.01em] text-balance">
                {frenchTypography(labels.article.ctaText)}
            </p>
            <a
                href={`${home.url()}#abonnement`}
                className={buttonClasses('secondary', 'flex-none')}
            >
                {frenchTypography(labels.nav.subscribe)}
            </a>
        </aside>
    );
}
