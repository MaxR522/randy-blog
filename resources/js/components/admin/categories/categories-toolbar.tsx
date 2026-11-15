import type { ChangeEvent } from 'react';
import { ListSearch } from '@/components/admin/list-search';
import type { CategorySort } from '@/helpers/categories';
import type { ListSearchState } from '@/hooks/use-list-search';
import { adminLabels } from '@/lib/labels.admin.fr';

const text = adminLabels.categories;

type CategoriesToolbarProps = {
    search: ListSearchState;
    total: number;
    sort: CategorySort;
    onSortChange: (sort: string) => void;
};

/**
 * Search, the number of categories found and, on phones, the sort select, above the list.
 */
export function CategoriesToolbar({
    search,
    total,
    sort,
    onSortChange,
}: CategoriesToolbarProps) {
    return (
        <div className="tablet:flex-row tablet:items-center mb-4 flex flex-col gap-4">
            <ListSearch
                label={text.search}
                placeholder={text.searchPlaceholder}
                query={search.query}
                onQueryChange={search.changeQuery}
                className="tablet:w-95"
            />
            <div className="tablet:ml-auto flex items-center justify-between gap-4">
                <p
                    role="status"
                    className="text-grey-dark tablet:text-sm text-[0.8125rem]"
                >
                    {text.count(total)}
                </p>
                <label className="tablet:hidden flex items-center gap-2 text-sm">
                    {text.sortBy}
                    <select
                        value={sort}
                        onChange={(event: ChangeEvent<HTMLSelectElement>) =>
                            onSortChange(event.target.value)
                        }
                        className="border-grey-medium text-primary h-11 rounded-md border bg-white px-2 text-sm"
                    >
                        <option value="name">{text.sortName}</option>
                        <option value="date">{text.sortDate}</option>
                    </select>
                </label>
            </div>
        </div>
    );
}
