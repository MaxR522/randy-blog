import { PageLink } from '@/components/public/pagination';
import { labels } from '@/lib/labels.fr';
import type { AdminList } from '@/types/admin';

type ListPaginationProps = Pick<
    AdminList<unknown>,
    'currentPage' | 'lastPage' | 'previousUrl' | 'nextUrl'
>;

/**
 * « Précédent » / « Page 1 sur 4 » / « Suivant », shown even on a single page, unlike the public one.
 */
export function ListPagination({
    currentPage,
    lastPage,
    previousUrl,
    nextUrl,
}: ListPaginationProps) {
    return (
        <nav
            aria-label={labels.a11y.pagination}
            className="mt-5 flex items-center justify-between gap-4"
        >
            <PageLink href={previousUrl}>{labels.pagination.previous}</PageLink>
            <p className="text-body-small text-grey-dark font-medium whitespace-nowrap">
                {labels.pagination.page(currentPage, lastPage)}
            </p>
            <PageLink href={nextUrl}>{labels.pagination.next}</PageLink>
        </nav>
    );
}
