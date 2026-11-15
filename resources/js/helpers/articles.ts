import type { StatusFilterOption } from '@/components/admin/status-filters';
import type { ArticleStatus } from '@/helpers/article';
import { adminLabels } from '@/lib/labels.admin.fr';
import { edit } from '@/routes/admin/articles';

const text = adminLabels.articles;

/** Status filter of the articles list, bound to `?status=`. */
export type ArticleStatusFilter = 'draft' | 'published' | 'archived';

/** An article of the admin list, as `ArticleController::index` sends it. */
export type ArticleListItem = {
    id: number;
    title: string;
    status: ArticleStatus;
    publishedAt: string | null;
    publishedAtLabel: string | null;
    publishedAtShortLabel: string | null;
    createdAt: string | null;
    createdAtLabel: string | null;
    createdAtShortLabel: string | null;
    categories: string[];
    previewUrl: string;
};

/** A list item with the URL of its editor. */
export type ArticleRow = ArticleListItem & { editUrl: string };

export const articleStatusFilters: StatusFilterOption<ArticleStatusFilter>[] = [
    { value: null, label: text.statusFilters.all },
    { value: 'draft', label: text.statusFilters.draft },
    { value: 'published', label: text.statusFilters.published },
    { value: 'archived', label: text.statusFilters.archived },
];

/**
 * Rows of the list, each with the URL of its editor.
 */
export function articleRowsOf(articles: ArticleListItem[]): ArticleRow[] {
    return articles.map((article) => ({
        ...article,
        editUrl: edit.url(article.id),
    }));
}
