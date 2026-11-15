import { StatusBadge } from '@/components/admin/status-badge';
import type { SubscriptionStatus } from '@/helpers/subscriptions';
import { subscriptionStatusVariants } from '@/helpers/subscriptions';
import { adminLabels } from '@/lib/labels.admin.fr';

const text = adminLabels.subscriptions;

/**
 * The status of a subscription as a coloured badge with its French label.
 */
export function SubscriptionStatusBadge({
    status,
}: {
    status: SubscriptionStatus;
}) {
    return (
        <StatusBadge variant={subscriptionStatusVariants[status]}>
            {text.status[status]}
        </StatusBadge>
    );
}
