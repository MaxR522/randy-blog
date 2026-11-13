import { Link, router } from '@inertiajs/react';
import { Mail } from 'lucide-react';
import type { ReactNode } from 'react';
import {
    duplicate,
    show,
} from '@/actions/App/Http/Controllers/Admin/NewsletterController';
import { AdminHead } from '@/components/admin/admin-head';
import type { DataTableColumn } from '@/components/admin/data-table';
import { DataTable } from '@/components/admin/data-table';
import { EmptyState } from '@/components/admin/empty-state';
import { ListPagination } from '@/components/admin/list-pagination';
import { NewsletterStatusBadge } from '@/components/admin/newsletter-status-badge';
import { PageHeader } from '@/components/admin/page-header';
import {
    CreateNewsletterLink,
    SubscriptionTabs,
} from '@/components/admin/subscription-tabs';
import { Button, buttonClasses } from '@/components/public/button';
import AdminLayout from '@/layouts/admin-layout';
import { adminLabels } from '@/lib/labels.admin.fr';
import { frenchTypography } from '@/lib/typography';
import type { AdminList, AdminNewsletter } from '@/types/admin';

const text = adminLabels.newsletters;
const tabsText = adminLabels.subscriptions;

type NewslettersProps = {
    newsletters: AdminList<AdminNewsletter>;
    subscriberCount: number;
    newsletterCount: number;
};

/**
 * « Newsletters envoyées », the second tab of « Abonnements » (ADM-SUB-10). A draft is reopened; the others are
 * viewed and duplicated.
 */
export default function Newsletters({
    newsletters,
    subscriberCount,
    newsletterCount,
}: NewslettersProps) {
    const columns: DataTableColumn<AdminNewsletter>[] = [
        {
            key: 'subject',
            header: text.columns.subject,
            cellClassName: 'font-medium',
            render: (newsletter) => frenchTypography(newsletter.subject),
        },
        {
            key: 'status',
            header: text.columns.status,
            render: (newsletter) => (
                <NewsletterStatusBadge status={newsletter.status} />
            ),
        },
        {
            key: 'sentAt',
            header: text.columns.sentAt,
            cellClassName: 'text-grey-dark whitespace-nowrap',
            render: (newsletter) => newsletter.sentAtLabel ?? '—',
        },
        ...(
            [
                ['recipients', text.columns.recipients, 'recipientsCount'],
                ['delivered', text.columns.delivered, 'sentCount'],
                ['failed', text.columns.failed, 'failedCount'],
            ] as const
        ).map(([key, header, field]): DataTableColumn<AdminNewsletter> => ({
            key,
            header,
            isNumeric: true,
            render: (newsletter) =>
                newsletter.status === 'draft' ? (
                    <span className="text-grey-dark">—</span>
                ) : (
                    newsletter[field]
                ),
        })),
        {
            key: 'actions',
            header: text.columns.actions,
            alignEnd: true,
            cellClassName: 'whitespace-nowrap',
            render: (newsletter) => (
                <RowActions newsletter={newsletter} variant="ghost" />
            ),
        },
    ];

    return (
        <>
            <AdminHead title={tabsText.newslettersTab} />
            <PageHeader
                title={tabsText.title}
                action={<CreateNewsletterLink />}
            />

            <SubscriptionTabs
                current="newsletters"
                subscriberCount={subscriberCount}
                newsletterCount={newsletterCount}
            />

            {newsletters.data.length > 0 ? (
                <>
                    <DataTable
                        caption={text.caption}
                        columns={columns}
                        rows={newsletters.data}
                        rowKey={(newsletter) => newsletter.id}
                        mobileListClassName="flex flex-col gap-2.5"
                        renderMobileItem={(newsletter) => (
                            <MobileCard newsletter={newsletter} />
                        )}
                    />
                    <ListPagination
                        currentPage={newsletters.currentPage}
                        lastPage={newsletters.lastPage}
                        previousUrl={newsletters.previousUrl}
                        nextUrl={newsletters.nextUrl}
                    />
                </>
            ) : (
                <EmptyState icon={Mail} message={text.empty} />
            )}
        </>
    );
}

Newsletters.layout = (page: ReactNode) => <AdminLayout>{page}</AdminLayout>;

function RowActions({
    newsletter,
    variant,
}: {
    newsletter: AdminNewsletter;
    variant: 'ghost' | 'secondary';
}) {
    const className =
        variant === 'ghost'
            ? buttonClasses('ghost', 'h-10 px-3 text-sm')
            : buttonClasses('secondary');

    if (newsletter.status === 'draft') {
        return (
            <Link
                href={show.url(newsletter.id)}
                aria-label={text.resumeNamed(newsletter.subject)}
                className={className}
            >
                {text.resume}
            </Link>
        );
    }

    return (
        <span className="inline-flex gap-2">
            <Link
                href={show.url(newsletter.id)}
                aria-label={text.viewNamed(newsletter.subject)}
                className={className}
            >
                {text.view}
            </Link>
            {newsletter.status !== 'sending' && (
                <Button
                    variant={variant}
                    onClick={() => router.post(duplicate.url(newsletter.id))}
                    aria-label={text.duplicateNamed(newsletter.subject)}
                    className={
                        variant === 'ghost' ? 'h-10 px-3 text-sm' : undefined
                    }
                >
                    {text.duplicate}
                </Button>
            )}
        </span>
    );
}

function MobileCard({ newsletter }: { newsletter: AdminNewsletter }) {
    return (
        <div className="border-grey-light flex flex-col gap-2 rounded-md border px-4 py-3.5">
            <h2 className="text-body leading-[1.35] font-semibold">
                {frenchTypography(newsletter.subject)}
            </h2>
            <div className="text-grey-dark flex flex-wrap items-center gap-2 text-[0.8125rem]">
                <NewsletterStatusBadge status={newsletter.status} />
                {newsletter.sentAtShortLabel}
            </div>
            {newsletter.status !== 'draft' && (
                <p className="text-grey-dark text-[0.8125rem]">
                    {text.delivery(
                        newsletter.sentCount,
                        newsletter.recipientsCount,
                        newsletter.failedCount,
                    )}
                </p>
            )}
            <div className="flex gap-2 self-start">
                <RowActions newsletter={newsletter} variant="secondary" />
            </div>
        </div>
    );
}
