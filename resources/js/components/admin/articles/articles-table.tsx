import { Link } from '@inertiajs/react';
import { ArticleActionsMenu } from '@/components/admin/articles/article-actions-menu';
import { ArticleDate } from '@/components/admin/articles/article-date';
import { ArticleMobileCard } from '@/components/admin/articles/article-mobile-card';
import { ArticleStatusBadge } from '@/components/admin/articles/article-status-badge';
import type { DataTableColumn } from '@/components/admin/data-table';
import { DataTable } from '@/components/admin/data-table';
import type { ArticleRow } from '@/helpers/articles';
import type { RowAction } from '@/helpers/row-actions-menu';
import { frenchTypography } from '@/helpers/typography';
import { adminLabels } from '@/lib/labels.admin.fr';

const text = adminLabels.articles;

type ArticlesTableProps = {
    rows: ArticleRow[];
    actionsOf: (article: ArticleRow) => RowAction[];
};

/**
 * Table of the articles from 768 px, a list of cards below.
 */
export function ArticlesTable({ rows, actionsOf }: ArticlesTableProps) {
    const menuOf = (article: ArticleRow) => (
        <ArticleActionsMenu article={article} actions={actionsOf(article)} />
    );

    const columns: DataTableColumn<ArticleRow>[] = [
        {
            key: 'title',
            header: text.columns.title,
            render: (article) => (
                <Link
                    href={article.editUrl}
                    className="text-primary font-medium hover:underline"
                >
                    {frenchTypography(article.title)}
                </Link>
            ),
        },
        {
            key: 'date',
            header: text.columns.date,
            cellClassName: 'text-grey-dark whitespace-nowrap',
            render: (article) => (
                <ArticleDate article={article} isShort={false} />
            ),
        },
        {
            key: 'categories',
            header: text.columns.categories,
            cellClassName: 'text-grey-dark',
            render: (article) => article.categories.join(', '),
        },
        {
            key: 'status',
            header: text.columns.status,
            render: (article) => <ArticleStatusBadge status={article.status} />,
        },
        {
            key: 'actions',
            header: text.columns.actions,
            alignEnd: true,
            cellClassName: 'py-0.5',
            render: menuOf,
        },
    ];

    return (
        <DataTable
            caption={text.title}
            columns={columns}
            rows={rows}
            rowKey={(article) => article.id}
            mobileListClassName="flex flex-col gap-2.5"
            renderMobileItem={(article) => (
                <ArticleMobileCard article={article} menu={menuOf(article)} />
            )}
        />
    );
}
