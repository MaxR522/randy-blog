import { usePage } from '@inertiajs/react';
import { Mail, Search } from 'lucide-react';
import type { ReactNode } from 'react';
import { destroy } from '@/actions/App/Http/Controllers/Admin/SubscriptionController';
import { AdminHead } from '@/components/admin/admin-head';
import { ConfirmModal } from '@/components/admin/confirm-modal';
import { EmptyState } from '@/components/admin/empty-state';
import { ListPagination } from '@/components/admin/list-pagination';
import { PageHeader } from '@/components/admin/page-header';
import {
    CreateNewsletterLink,
    SubscriptionTabs,
} from '@/components/admin/subscriptions/subscription-tabs';
import { SubscriptionsTable } from '@/components/admin/subscriptions/subscriptions-table';
import { SubscriptionsToolbar } from '@/components/admin/subscriptions/subscriptions-toolbar';
import type { Subscription, SubscriptionStatus } from '@/helpers/subscriptions';
import { subscriptionsUrlsOf } from '@/helpers/subscriptions';
import { useListSearch } from '@/hooks/use-list-search';
import { useRowDeletion } from '@/hooks/use-row-deletion';
import AdminLayout from '@/layouts/admin-layout';
import { adminLabels } from '@/lib/labels.admin.fr';
import type { AdminList } from '@/types/admin';

const text = adminLabels.subscriptions;

type SubscriptionsProps = {
    subscriptions: AdminList<Subscription>;
    filters: {
        q: string;
        status: SubscriptionStatus | null;
    };
    subscriberCount: number;
    newsletterCount: number;
};

/**
 * Subscriber list (ADM-SUB-1…4), the first tab of « Abonnements ».
 */
export default function Subscriptions({
    subscriptions,
    filters,
    subscriberCount,
    newsletterCount,
}: SubscriptionsProps) {
    const { url } = usePage();
    const search = useListSearch(filters.q);
    const deletion = useRowDeletion<Subscription>((id) => destroy.url(id));
    const urls = subscriptionsUrlsOf();

    return (
        <>
            <AdminHead title={text.title} />
            <PageHeader
                title={text.title}
                action={<CreateNewsletterLink href={urls.createNewsletter} />}
            />

            <SubscriptionTabs
                current="subscribers"
                subscriberCount={subscriberCount}
                newsletterCount={newsletterCount}
                subscribersUrl={urls.subscribers}
                newslettersUrl={urls.newsletters}
            />

            {subscriberCount > 0 ? (
                <>
                    <SubscriptionsToolbar
                        search={search}
                        status={filters.status}
                        url={url}
                        total={subscriptions.total}
                    />

                    {subscriptions.data.length > 0 ? (
                        <>
                            <SubscriptionsTable
                                subscriptions={subscriptions.data}
                                onDelete={deletion.askDeletion}
                            />
                            <ListPagination
                                currentPage={subscriptions.currentPage}
                                lastPage={subscriptions.lastPage}
                                previousUrl={subscriptions.previousUrl}
                                nextUrl={subscriptions.nextUrl}
                            />
                        </>
                    ) : (
                        <EmptyState icon={Search} message={text.noMatch} />
                    )}
                </>
            ) : (
                <EmptyState icon={Mail} message={text.empty} />
            )}

            <ConfirmModal
                isOpen={deletion.deleted !== null}
                onClose={deletion.cancelDeletion}
                onConfirm={deletion.confirmDeletion}
                isConfirming={deletion.isDeleting}
                title={
                    deletion.deleted
                        ? text.deleteTitle(deletion.deleted.email)
                        : ''
                }
                description={text.deleteDescription}
                confirmLabel={text.delete}
            />
        </>
    );
}

Subscriptions.layout = (page: ReactNode) => <AdminLayout>{page}</AdminLayout>;
