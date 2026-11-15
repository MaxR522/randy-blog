import { Link, usePage } from '@inertiajs/react';
import { FileText, Plus, Search } from 'lucide-react';
import type { ReactNode } from 'react';
import { AdminHead } from '@/components/admin/admin-head';
import { ArticlePreviewPanel } from '@/components/admin/article-preview-panel';
import { ArticlesTable } from '@/components/admin/articles/articles-table';
import { ArticlesToolbar } from '@/components/admin/articles/articles-toolbar';
import { ConfirmModal } from '@/components/admin/confirm-modal';
import { EmptyState } from '@/components/admin/empty-state';
import { ListPagination } from '@/components/admin/list-pagination';
import { PageHeader } from '@/components/admin/page-header';
import { buttonClasses } from '@/components/public/button';
import type { ArticleListItem, ArticleStatusFilter } from '@/helpers/articles';
import { frenchTypography } from '@/helpers/typography';
import { useArticlesList } from '@/hooks/use-articles-list';
import { useListSearch } from '@/hooks/use-list-search';
import AdminLayout from '@/layouts/admin-layout';
import { adminLabels } from '@/lib/labels.admin.fr';
import { create } from '@/routes/admin/articles';
import type { AdminList } from '@/types/admin';

const text = adminLabels.articles;

type ArticlesProps = {
    articles: AdminList<ArticleListItem>;
    filters: {
        q: string;
        status: ArticleStatusFilter | null;
    };
    hasArticles: boolean;
};

export default function Articles({
    articles,
    filters,
    hasArticles,
}: ArticlesProps) {
    const { url } = usePage();
    const list = useArticlesList(articles.data);
    const search = useListSearch(filters.q);
    const { deletion, previewedArticle, preview } = list;

    const createButton = (
        <Link
            href={create.url()}
            className={buttonClasses('primary', 'tablet:w-auto w-full')}
        >
            <Plus aria-hidden="true" className="size-4.5" strokeWidth={2} />
            {text.create}
        </Link>
    );

    return (
        <>
            <AdminHead title={text.title} />
            <PageHeader title={text.title} action={createButton} />

            {hasArticles ? (
                <>
                    <ArticlesToolbar
                        search={search}
                        status={filters.status}
                        url={url}
                        total={articles.total}
                    />

                    {list.rows.length > 0 ? (
                        <>
                            <ArticlesTable
                                rows={list.rows}
                                actionsOf={list.rowActions}
                            />
                            <ListPagination
                                currentPage={articles.currentPage}
                                lastPage={articles.lastPage}
                                previousUrl={articles.previousUrl}
                                nextUrl={articles.nextUrl}
                            />
                        </>
                    ) : (
                        <EmptyState icon={Search} message={text.noMatch} />
                    )}
                </>
            ) : (
                <EmptyState
                    icon={FileText}
                    message={text.empty}
                    action={createButton}
                />
            )}

            <ArticlePreviewPanel
                article={previewedArticle}
                onClose={list.closePreview}
                editUrl={previewedArticle?.editUrl ?? null}
                isChangingStatus={preview.isChangingStatus}
                onChangeStatus={preview.changeStatus}
                frameVersion={preview.frameVersion}
                isFrameLoaded={preview.isFrameLoaded}
                onFrameLoad={preview.markFrameLoaded}
            />

            <ConfirmModal
                isOpen={deletion.deleted !== null}
                onClose={deletion.cancelDeletion}
                onConfirm={deletion.confirmDeletion}
                isConfirming={deletion.isDeleting}
                title={
                    deletion.deleted
                        ? frenchTypography(
                              text.deleteTitle(deletion.deleted.title),
                          )
                        : ''
                }
                description={text.deleteDescription}
                confirmLabel={text.delete}
            />
        </>
    );
}

Articles.layout = (page: ReactNode) => <AdminLayout>{page}</AdminLayout>;
