import { router, usePage } from '@inertiajs/react';
import { Mail, Search, Trash2 } from 'lucide-react';
import type { ReactNode } from 'react';
import { useEffect, useRef, useState } from 'react';
import { destroy } from '@/actions/App/Http/Controllers/Admin/SubscriptionController';
import { AdminHead } from '@/components/admin/admin-head';
import { ConfirmModal } from '@/components/admin/confirm-modal';
import type { DataTableColumn } from '@/components/admin/data-table';
import { DataTable } from '@/components/admin/data-table';
import { EmptyState } from '@/components/admin/empty-state';
import { ListPagination } from '@/components/admin/list-pagination';
import { ListSearch } from '@/components/admin/list-search';
import { PageHeader } from '@/components/admin/page-header';
import type { StatusBadgeVariant } from '@/components/admin/status-badge';
import { StatusBadge } from '@/components/admin/status-badge';
import type { StatusFilterOption } from '@/components/admin/status-filters';
import { StatusFilters } from '@/components/admin/status-filters';
import {
    CreateNewsletterLink,
    SubscriptionTabs,
} from '@/components/admin/subscription-tabs';
import { Button } from '@/components/public/button';
import AdminLayout from '@/layouts/admin-layout';
import { adminLabels } from '@/lib/labels.admin.fr';
import type { AdminList } from '@/types/admin';

const text = adminLabels.subscriptions;

const MAIN_ID = 'contenu';

type SubscriptionStatus = 'confirmed' | 'pending' | 'unsubscribed';

type Subscription = {
    id: number;
    email: string;
    status: SubscriptionStatus;
    subscribedAt: string | null;
    subscribedAtLabel: string | null;
    subscribedAtShortLabel: string | null;
};

type SubscriptionsProps = {
    subscriptions: AdminList<Subscription>;
    filters: {
        q: string;
        status: SubscriptionStatus | null;
    };
    subscriberCount: number;
    newsletterCount: number;
};

const statusFilters: StatusFilterOption<SubscriptionStatus>[] = [
    { value: null, label: text.statusFilters.all },
    { value: 'confirmed', label: text.statusFilters.confirmed },
    { value: 'pending', label: text.statusFilters.pending },
    { value: 'unsubscribed', label: text.statusFilters.unsubscribed },
];

const statusVariants: Record<SubscriptionStatus, StatusBadgeVariant> = {
    confirmed: 'ok',
    pending: 'warn',
    unsubscribed: 'muted',
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
    const [deleted, setDeleted] = useState<Subscription | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const shouldFocusMain = useRef(false);

    // The trigger of the dialog is gone with its row, so the focus has nowhere to return. Runs after the dialog has closed.
    useEffect(() => {
        if (deleted === null && shouldFocusMain.current) {
            shouldFocusMain.current = false;
            document.getElementById(MAIN_ID)?.focus();
        }
    }, [deleted]);

    function confirmDeletion(): void {
        if (!deleted) {
            return;
        }

        router.delete(destroy.url(deleted.id), {
            preserveScroll: true,
            onStart: () => setIsDeleting(true),
            onFinish: () => setIsDeleting(false),
            onSuccess: () => {
                shouldFocusMain.current = true;
                setDeleted(null);
            },
        });
    }

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
                    onClick={() => setDeleted(subscription)}
                    aria-label={text.deleteNamed(subscription.email)}
                    className="h-10 px-3 text-sm text-red-700"
                >
                    {text.delete}
                </Button>
            ),
        },
    ];

    return (
        <>
            <AdminHead title={text.title} />
            <PageHeader title={text.title} action={<CreateNewsletterLink />} />

            <SubscriptionTabs
                current="subscribers"
                subscriberCount={subscriberCount}
                newsletterCount={newsletterCount}
            />

            {subscriberCount > 0 ? (
                <>
                    <div className="tablet:flex-row tablet:flex-wrap tablet:items-center mb-4 flex flex-col gap-4">
                        <ListSearch
                            label={text.search}
                            placeholder={text.searchPlaceholder}
                            value={filters.q}
                            className="tablet:w-85"
                        />
                        <StatusFilters
                            label={text.statusFilter}
                            options={statusFilters}
                            current={filters.status}
                            url={url}
                        />
                        <p
                            role="status"
                            className="text-grey-dark tablet:ml-auto tablet:text-sm text-[0.8125rem]"
                        >
                            {text.count(subscriptions.total)}
                        </p>
                    </div>

                    {subscriptions.data.length > 0 ? (
                        <>
                            <DataTable
                                caption={text.subscribersTab}
                                columns={columns}
                                rows={subscriptions.data}
                                rowKey={(subscription) => subscription.id}
                                renderMobileItem={(subscription) => (
                                    <MobileRow
                                        subscription={subscription}
                                        onDelete={() =>
                                            setDeleted(subscription)
                                        }
                                    />
                                )}
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
                isOpen={deleted !== null}
                onClose={() => setDeleted(null)}
                onConfirm={confirmDeletion}
                isConfirming={isDeleting}
                title={deleted ? text.deleteTitle(deleted.email) : ''}
                description={text.deleteDescription}
                confirmLabel={text.delete}
            />
        </>
    );
}

Subscriptions.layout = (page: ReactNode) => <AdminLayout>{page}</AdminLayout>;

function SubscriptionStatusBadge({ status }: { status: SubscriptionStatus }) {
    return (
        <StatusBadge variant={statusVariants[status]}>
            {text.status[status]}
        </StatusBadge>
    );
}

function MobileRow({
    subscription,
    onDelete,
}: {
    subscription: Subscription;
    onDelete: () => void;
}) {
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
