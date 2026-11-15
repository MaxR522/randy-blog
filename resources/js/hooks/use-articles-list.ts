import { router } from '@inertiajs/react';
import { useState } from 'react';
import {
    archive,
    destroy,
    publish,
} from '@/actions/App/Http/Controllers/Admin/ArticleController';
import type { ArticleListItem, ArticleRow } from '@/helpers/articles';
import { articleRowsOf } from '@/helpers/articles';
import type { RowAction } from '@/helpers/row-actions-menu';
import { useArticlePreview } from '@/hooks/use-article-preview';
import { useRowDeletion } from '@/hooks/use-row-deletion';
import { adminLabels } from '@/lib/labels.admin.fr';

const text = adminLabels.articles;

/**
 * State and actions of the articles list: rows, the row actions, the preview panel and the deletion of a draft.
 */
export function useArticlesList(articles: ArticleListItem[]) {
    const rows = articleRowsOf(articles);
    const deletion = useRowDeletion<ArticleRow>((id) => destroy.url(id));
    const [previewed, setPreviewed] = useState<ArticleRow | null>(null);
    // The row reloaded after « Publier » or « Archiver » in the panel; the snapshot when it left the filtered page.
    const previewedArticle = previewed
        ? (rows.find((article) => article.id === previewed.id) ?? previewed)
        : null;
    const preview = useArticlePreview(previewedArticle);

    function archiveArticle(article: ArticleRow): void {
        router.patch(archive.url(article.id), {}, { preserveScroll: true });
    }

    function publishArticle(article: ArticleRow): void {
        router.patch(publish.url(article.id), {}, { preserveScroll: true });
    }

    function rowActions(article: ArticleRow): RowAction[] {
        const actions: RowAction[] = [
            { key: 'edit', label: text.edit, href: article.editUrl },
            {
                key: 'preview',
                label: text.preview,
                onSelect: () => setPreviewed(article),
            },
        ];

        if (article.status === 'PUBLISHED') {
            actions.push({
                key: 'archive',
                label: text.archive,
                onSelect: () => archiveArticle(article),
            });
        } else {
            actions.push({
                key: 'publish',
                label: text.publish,
                onSelect: () => publishArticle(article),
            });
        }

        if (article.status === 'DRAFT') {
            actions.push({
                key: 'delete',
                label: text.delete,
                isDanger: true,
                onSelect: () => deletion.askDeletion(article),
            });
        }

        return actions;
    }

    return {
        rows,
        rowActions,
        deletion,
        previewedArticle,
        preview,
        closePreview: (): void => setPreviewed(null),
    };
}

export type ArticlesList = ReturnType<typeof useArticlesList>;
