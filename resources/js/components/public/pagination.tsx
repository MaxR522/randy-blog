import { Link } from '@inertiajs/react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import type { ReactNode } from 'react';
import { buttonClasses } from '@/components/public/button';
import { labels } from '@/lib/labels.fr';
import { cn } from '@/lib/utils';

/**
 * Below tablet the arrows are hidden and the padding tighter, so both buttons and « Page 2 sur 7 » fit 328 px.
 */
const mobilePadding = 'tablet:px-5 px-4';

type PageLinkProps = {
    href: string | null;
    children: ReactNode;
};

/**
 * A link cannot be disabled: the unavailable one is a span styled as a disabled secondary button.
 */
function PageLink({ href, children }: PageLinkProps) {
    if (href === null) {
        return (
            <span
                aria-disabled="true"
                className={buttonClasses(
                    'secondary',
                    cn(
                        mobilePadding,
                        'border-grey-light text-grey-medium cursor-not-allowed hover:bg-white',
                    ),
                )}
            >
                {children}
            </span>
        );
    }

    return (
        <Link href={href} className={buttonClasses('secondary', mobilePadding)}>
            {children}
        </Link>
    );
}

type PaginationProps = {
    currentPage: number;
    lastPage: number;
    previousUrl: string | null;
    nextUrl: string | null;
};

/**
 * « Précédent » / « Page 2 sur 7 » / « Suivant ». Nothing when there is a single page.
 */
export function Pagination({
    currentPage,
    lastPage,
    previousUrl,
    nextUrl,
}: PaginationProps) {
    if (lastPage <= 1) {
        return null;
    }

    return (
        <nav
            aria-label={labels.a11y.pagination}
            className="flex items-center justify-between gap-4"
        >
            <PageLink href={previousUrl}>
                <ArrowLeft
                    aria-hidden="true"
                    className="tablet:block hidden size-4"
                    strokeWidth={1.75}
                />
                {labels.pagination.previous}
            </PageLink>
            <p className="text-body-small text-grey-dark font-medium whitespace-nowrap">
                {labels.pagination.page(currentPage, lastPage)}
            </p>
            <PageLink href={nextUrl}>
                {labels.pagination.next}
                <ArrowRight
                    aria-hidden="true"
                    className="tablet:block hidden size-4"
                    strokeWidth={1.75}
                />
            </PageLink>
        </nav>
    );
}
