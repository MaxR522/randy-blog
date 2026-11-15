import { Link } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import { AdminHead } from '@/components/admin/admin-head';
import { NewsletterStatusBadge } from '@/components/admin/newsletter-status-badge';
import { Button } from '@/components/public/button';
import { frenchTypography } from '@/helpers/typography';
import { adminLabels } from '@/lib/labels.admin.fr';
import { cn } from '@/lib/utils';
import type { AdminNewsletter } from '@/types/admin';

const text = adminLabels.newsletterEditor;
const deliveryText = adminLabels.newsletters;

type SentNewsletterProps = {
    newsletter: AdminNewsletter;
    emailHtml: string;
    backUrl: string;
    onDuplicate: () => void;
};

/**
 * A newsletter no longer a draft: its email as sent, its delivery counts and « Dupliquer » (ADM-SUB-10).
 */
export function SentNewsletter({
    newsletter,
    emailHtml,
    backUrl,
    onDuplicate,
}: SentNewsletterProps) {
    const isSending = newsletter.status === 'sending';

    return (
        <>
            <AdminHead title={newsletter.subject} />

            <Link
                href={backUrl}
                className="text-body-small text-primary mb-3 inline-flex min-h-11 items-center gap-1.5 font-medium hover:underline"
            >
                <ArrowLeft className="size-4" aria-hidden="true" />
                {adminLabels.subscriptions.title}
            </Link>

            <div className="tablet:flex-row tablet:items-center mb-6 flex flex-col gap-4">
                <div className="flex min-w-0 flex-1 flex-col gap-2">
                    <h1 className="tablet:text-h2 text-[1.375rem] leading-tight font-semibold">
                        {frenchTypography(newsletter.subject)}
                    </h1>
                    <p className="text-body-small text-grey-dark flex flex-wrap items-center gap-2">
                        <NewsletterStatusBadge status={newsletter.status} />
                        {newsletter.sentAtLabel &&
                            text.sentOn(newsletter.sentAtLabel)}
                        <span>
                            ·{' '}
                            {deliveryText.delivery(
                                newsletter.sentCount,
                                newsletter.recipientsCount,
                                newsletter.failedCount,
                            )}
                        </span>
                    </p>
                </div>
                {!isSending && (
                    <Button
                        variant="secondary"
                        onClick={onDuplicate}
                        className={cn('tablet:w-auto w-full')}
                    >
                        {text.duplicate}
                    </Button>
                )}
            </div>

            <iframe
                title={adminLabels.newsletterPreview.frameTitle}
                sandbox=""
                srcDoc={emailHtml}
                className="border-grey-light h-[75dvh] w-full rounded-md border"
            />
        </>
    );
}
