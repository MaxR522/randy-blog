import type { StatusBadgeVariant } from '@/components/admin/status-badge';

/**
 * Same values as the `ArticleStatus` enum on the server.
 */
export type ArticleStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

/**
 * Badge colour of each status, in the list, the editor and the preview panel.
 */
export const statusVariants: Record<ArticleStatus, StatusBadgeVariant> = {
    DRAFT: 'neutral',
    PUBLISHED: 'ok',
    ARCHIVED: 'muted',
};

/**
 * What the preview panel needs to show an article.
 */
export type PreviewedArticle = {
    id: number;
    title: string;
    status: ArticleStatus;
    previewUrl: string;
};
