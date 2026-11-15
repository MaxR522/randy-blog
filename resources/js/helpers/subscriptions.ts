import type { StatusBadgeVariant } from '@/components/admin/status-badge';
import type { StatusFilterOption } from '@/components/admin/status-filters';
import {
    create as createNewsletter,
    index as newslettersIndex,
} from '@/actions/App/Http/Controllers/Admin/NewsletterController';
import { index as subscriptionsIndex } from '@/actions/App/Http/Controllers/Admin/SubscriptionController';
import { adminLabels } from '@/lib/labels.admin.fr';

const text = adminLabels.subscriptions;

/** Status of a subscription, also the status filter bound to `?status=`. */
export type SubscriptionStatus = 'confirmed' | 'pending' | 'unsubscribed';

/** A subscription of the admin list, as `SubscriptionController::index` sends it. */
export type Subscription = {
    id: number;
    email: string;
    status: SubscriptionStatus;
    subscribedAt: string | null;
    subscribedAtLabel: string | null;
    subscribedAtShortLabel: string | null;
};

export const subscriptionStatusFilters: StatusFilterOption<SubscriptionStatus>[] =
    [
        { value: null, label: text.statusFilters.all },
        { value: 'confirmed', label: text.statusFilters.confirmed },
        { value: 'pending', label: text.statusFilters.pending },
        { value: 'unsubscribed', label: text.statusFilters.unsubscribed },
    ];

export const subscriptionStatusVariants: Record<
    SubscriptionStatus,
    StatusBadgeVariant
> = {
    confirmed: 'ok',
    pending: 'warn',
    unsubscribed: 'muted',
};

/** URLs of the « Abonnements » tabs and of « Créer une newsletter », shared by both tabs. */
export type SubscriptionsUrls = {
    subscribers: string;
    newsletters: string;
    createNewsletter: string;
};

/**
 * The URLs of the two tabs of « Abonnements » and of « Créer une newsletter ».
 */
export function subscriptionsUrlsOf(): SubscriptionsUrls {
    return {
        subscribers: subscriptionsIndex.url(),
        newsletters: newslettersIndex.url(),
        createNewsletter: createNewsletter.url(),
    };
}
