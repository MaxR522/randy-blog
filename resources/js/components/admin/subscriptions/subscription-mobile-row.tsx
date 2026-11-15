import { Trash2 } from 'lucide-react';
import { SubscriptionStatusBadge } from '@/components/admin/subscriptions/subscription-status-badge';
import type { Subscription } from '@/helpers/subscriptions';
import { adminLabels } from '@/lib/labels.admin.fr';

const text = adminLabels.subscriptions;

type SubscriptionMobileRowProps = {
    subscription: Subscription;
    onDelete: () => void;
};

/**
 * A subscription on a phone: the email, its status and date, and the delete icon button.
 */
export function SubscriptionMobileRow({
    subscription,
    onDelete,
}: SubscriptionMobileRowProps) {
    return (
        <div className="border-grey-light flex items-center gap-2 border-b py-2.5">
            <div className="min-w-0 flex-1">
                <p className="truncate text-[0.9375rem] font-medium">
                    {subscription.email}
                </p>
                <p className="text-grey-dark mt-1 flex items-center gap-2 text-[0.8125rem]">
                    <SubscriptionStatusBadge status={subscription.status} />
                    {subscription.subscribedAt && (
                        <time dateTime={subscription.subscribedAt}>
                            {subscription.subscribedAtShortLabel}
                        </time>
                    )}
                </p>
            </div>
            <button
                type="button"
                onClick={onDelete}
                aria-label={text.deleteNamed(subscription.email)}
                className="flex size-11 flex-none cursor-pointer items-center justify-center rounded-md text-red-700"
            >
                <Trash2
                    aria-hidden="true"
                    className="size-4.5"
                    strokeWidth={1.75}
                />
            </button>
        </div>
    );
}
