import type { DataTableColumn } from '@/components/admin/data-table';
import { DataTable } from '@/components/admin/data-table';
import { NewsletterStatusBadge } from '@/components/admin/newsletter-status-badge';
import { NewsletterMobileCard } from '@/components/admin/newsletters/newsletter-mobile-card';
import { NewsletterRowActions } from '@/components/admin/newsletters/newsletter-row-actions';
import type { NewsletterRow } from '@/helpers/newsletters';
import { frenchTypography } from '@/helpers/typography';
import { adminLabels } from '@/lib/labels.admin.fr';

const text = adminLabels.newsletters;

type NewslettersTableProps = {
    rows: NewsletterRow[];
    onDuplicate: (newsletter: NewsletterRow) => void;
};

/**
 * The newsletters as a table on wider screens and as cards on phones. A draft shows no delivery counts.
 */
export function NewslettersTable({ rows, onDuplicate }: NewslettersTableProps) {
    const columns: DataTableColumn<NewsletterRow>[] = [
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
        ).map(([key, header, field]): DataTableColumn<NewsletterRow> => ({
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
                <NewsletterRowActions
                    newsletter={newsletter}
                    variant="ghost"
                    onDuplicate={onDuplicate}
                />
            ),
        },
    ];

    return (
        <DataTable
            caption={text.caption}
            columns={columns}
            rows={rows}
            rowKey={(newsletter) => newsletter.id}
            mobileListClassName="flex flex-col gap-2.5"
            renderMobileItem={(newsletter) => (
                <NewsletterMobileCard
                    newsletter={newsletter}
                    onDuplicate={onDuplicate}
                />
            )}
        />
    );
}
