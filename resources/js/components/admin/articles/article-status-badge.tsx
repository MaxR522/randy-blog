import { StatusBadge } from '@/components/admin/status-badge';
import type { ArticleStatus } from '@/helpers/article';
import { statusVariants } from '@/helpers/article';
import { adminLabels } from '@/lib/labels.admin.fr';

const text = adminLabels.articles;

type ArticleStatusBadgeProps = {
    status: ArticleStatus;
};

/**
 * Status of an article in the list: Brouillon, Publié or Archivé.
 */
export function ArticleStatusBadge({ status }: ArticleStatusBadgeProps) {
    return (
        <StatusBadge variant={statusVariants[status]}>
            {text.status[status]}
        </StatusBadge>
    );
}
