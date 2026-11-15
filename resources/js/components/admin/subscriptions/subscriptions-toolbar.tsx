import { ListSearch } from '@/components/admin/list-search';
import { StatusFilters } from '@/components/admin/status-filters';
import type { SubscriptionStatus } from '@/helpers/subscriptions';
import { subscriptionStatusFilters } from '@/helpers/subscriptions';
import type { ListSearchState } from '@/hooks/use-list-search';
import { adminLabels } from '@/lib/labels.admin.fr';

const text = adminLabels.subscriptions;

type SubscriptionsToolbarProps = {
    search: ListSearchState;
    status: SubscriptionStatus | null;
    /** The current list URL, which the status filters change. */
    url: string;
    total: number;
};

/**
 * Search, status filters and the number of subscribers found, above the list.
 */
export function SubscriptionsToolbar({
    search,
    status,
    url,
    total,
}: SubscriptionsToolbarProps) {
    return (
        <div className="tablet:flex-row tablet:flex-wrap tablet:items-center mb-4 flex flex-col gap-4">
            <ListSearch
                label={text.search}
                placeholder={text.searchPlaceholder}
                query={search.query}
                onQueryChange={search.changeQuery}
                className="tablet:w-85"
            />
            <StatusFilters
                label={text.statusFilter}
                options={subscriptionStatusFilters}
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
