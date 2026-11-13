import type { StatusBadgeVariant } from '@/components/admin/status-badge';
import { StatusBadge } from '@/components/admin/status-badge';
import { adminLabels } from '@/lib/labels.admin.fr';
import type { NewsletterStatus } from '@/types/admin';

const variants: Record<NewsletterStatus, StatusBadgeVariant> = {
    draft: 'neutral',
    sending: 'info',
    sent: 'ok',
    partially_failed: 'bad',
};

export function NewsletterStatusBadge({
    status,
}: {
    status: NewsletterStatus;
}) {
    return (
        <StatusBadge variant={variants[status]}>
            {adminLabels.newsletters.status[status]}
        </StatusBadge>
    );
}
