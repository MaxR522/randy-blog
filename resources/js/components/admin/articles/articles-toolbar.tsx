import { ListSearch } from '@/components/admin/list-search';
import { StatusFilters } from '@/components/admin/status-filters';
import type { ArticleStatusFilter } from '@/helpers/articles';
import { articleStatusFilters } from '@/helpers/articles';
import type { ListSearchState } from '@/hooks/use-list-search';
import { adminLabels } from '@/lib/labels.admin.fr';

const text = adminLabels.articles;

type ArticlesToolbarProps = {
    search: ListSearchState;
    status: ArticleStatusFilter | null;
    /** The current list URL, which the status filters change. */
    url: string;
    total: number;
};

/**
 * Search, status filters and the number of articles found, above the list.
 */
export function ArticlesToolbar({
    search,
    status,
    url,
    total,
}: ArticlesToolbarProps) {
    return (
        <div className="tablet:flex-row tablet:flex-wrap tablet:items-center mb-4 flex flex-col gap-4">
            <ListSearch
                label={text.search}
                placeholder={text.searchPlaceholder}
                query={search.query}
                onQueryChange={search.changeQuery}
                className="tablet:w-95"
            />
            <StatusFilters
                label={text.statusFilter}
                options={articleStatusFilters}
                current={status}
                url={url}
            />
            <p
                role="status"
                className="text-grey-dark tablet:ml-auto tablet:text-sm text-[0.8125rem]"
            >
                {text.count(total)}
            </p>
        </div>
    );
}
