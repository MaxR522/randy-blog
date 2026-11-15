import type { DataTableColumn } from '@/components/admin/data-table';
import { DataTable } from '@/components/admin/data-table';
import { SubscriptionMobileRow } from '@/components/admin/subscriptions/subscription-mobile-row';
import { SubscriptionStatusBadge } from '@/components/admin/subscriptions/subscription-status-badge';
import { Button } from '@/components/public/button';
import type { Subscription } from '@/helpers/subscriptions';
import { adminLabels } from '@/lib/labels.admin.fr';

const text = adminLabels.subscriptions;

type SubscriptionsTableProps = {
    subscriptions: Subscription[];
    onDelete: (subscription: Subscription) => void;
};

/**
 * The subscribers as a table on wider screens and as rows on phones.
 */
export function SubscriptionsTable({
    subscriptions,
    onDelete,
}: SubscriptionsTableProps) {
    const columns: DataTableColumn<Subscription>[] = [
        {
            key: 'email',
            header: text.columns.email,
            cellClassName: 'break-all',
            render: (subscription) => subscription.email,
        },
        {
            key: 'date',
            header: text.columns.date,
            cellClassName: 'text-grey-dark whitespace-nowrap',
            render: (subscription) =>
                subscription.subscribedAt && (
                    <time dateTime={subscription.subscribedAt}>
                        {subscription.subscribedAtLabel}
                    </time>
                ),
        },
        {
            key: 'status',
            header: text.columns.status,
            render: (subscription) => (
                <SubscriptionStatusBadge status={subscription.status} />
            ),
        },
        {
            key: 'actions',
            header: text.columns.actions,
            alignEnd: true,
            cellClassName: 'whitespace-nowrap',
            render: (subscription) => (
                <Button
                    variant="ghost"
                    onClick={() => onDelete(subscription)}
                    aria-label={text.deleteNamed(subscription.email)}
                    className="h-10 px-3 text-sm text-red-700"
                >
                    {text.delete}
                </Button>
            ),
        },
    ];

    return (
        <DataTable
            caption={text.subscribersTab}
            columns={columns}
            rows={subscriptions}
            rowKey={(subscription) => subscription.id}
            renderMobileItem={(subscription) => (
                <SubscriptionMobileRow
                    subscription={subscription}
                    onDelete={() => onDelete(subscription)}
                />
            )}
        />
    );
}
