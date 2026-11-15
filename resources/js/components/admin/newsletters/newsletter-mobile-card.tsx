import { NewsletterStatusBadge } from '@/components/admin/newsletter-status-badge';
import { NewsletterRowActions } from '@/components/admin/newsletters/newsletter-row-actions';
import type { NewsletterRow } from '@/helpers/newsletters';
import { frenchTypography } from '@/helpers/typography';
import { adminLabels } from '@/lib/labels.admin.fr';

const text = adminLabels.newsletters;

type NewsletterMobileCardProps = {
    newsletter: NewsletterRow;
    onDuplicate: (newsletter: NewsletterRow) => void;
};

/**
 * A newsletter on a phone: subject, status, date, delivery counts and its actions.
 */
export function NewsletterMobileCard({
    newsletter,
    onDuplicate,
}: NewsletterMobileCardProps) {
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
                <NewsletterRowActions
                    newsletter={newsletter}
                    variant="secondary"
                    onDuplicate={onDuplicate}
                />
            </div>
        </div>
    );
}
