import type { DataTableColumn } from '@/components/admin/data-table';
import { listUrl } from '@/helpers/list-url';
import type { SortDirection } from '@/types/admin';

/** A category of the admin list, as `CategoryController::index` sends it. */
export type Category = {
    id: number;
    name: string;
    articlesCount: number;
    createdAt: string | null;
    createdAtLabel: string | null;
    createdAtShortLabel: string | null;
};

/** Sort of the categories list, bound to `?sort=`. */
export type CategorySort = 'name' | 'date';

/** The list's query string, as the server read it. */
export type CategoryFilters = {
    q: string;
    sort: CategorySort;
    direction: SortDirection;
};

/** `null` when closed, `'new'` when creating, otherwise the category being edited. */
export type EditedCategory = Category | 'new' | null;

/** Sort link of a column header: the active column flips its direction, another one starts from the default. */
export type ColumnSort = NonNullable<DataTableColumn<Category>['sort']>;

/**
 * The sort link and the current direction of the `sort` column header.
 */
export function categorySortOf(
    url: string,
    filters: CategoryFilters,
    sort: CategorySort,
): ColumnSort {
    const isActive = filters.sort === sort;
    const nextDirection = filters.direction === 'asc' ? 'desc' : 'asc';

    return {
        href: listUrl(url, {
            sort,
            direction: isActive ? nextDirection : null,
        }),
        direction: isActive ? filters.direction : null,
    };
}
