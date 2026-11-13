import { Link, router, usePage } from '@inertiajs/react';
import { FileText, Plus, Search } from 'lucide-react';
import type { ReactNode } from 'react';
import { useEffect, useRef, useState } from 'react';
import {
    archive,
    destroy,
    publish,
} from '@/actions/App/Http/Controllers/Admin/ArticleController';
import { AdminHead } from '@/components/admin/admin-head';
import type {
    ArticleStatus,
    PreviewedArticle,
} from '@/components/admin/article-preview-panel';
import {
    ArticlePreviewPanel,
    statusVariants,
} from '@/components/admin/article-preview-panel';
import { ConfirmModal } from '@/components/admin/confirm-modal';
import type { DataTableColumn } from '@/components/admin/data-table';
import { DataTable } from '@/components/admin/data-table';
import { EmptyState } from '@/components/admin/empty-state';
import { ListPagination } from '@/components/admin/list-pagination';
import { ListSearch } from '@/components/admin/list-search';
import { PageHeader } from '@/components/admin/page-header';
import type { RowAction } from '@/components/admin/row-actions-menu';
import { RowActionsMenu } from '@/components/admin/row-actions-menu';
import { StatusBadge } from '@/components/admin/status-badge';
import type { StatusFilterOption } from '@/components/admin/status-filters';
import { StatusFilters } from '@/components/admin/status-filters';
import { buttonClasses } from '@/components/public/button';
import AdminLayout from '@/layouts/admin-layout';
import { adminLabels } from '@/lib/labels.admin.fr';
import { frenchTypography } from '@/lib/typography';
import { create, edit } from '@/routes/admin/articles';
import type { AdminList } from '@/types/admin';

const text = adminLabels.articles;

const MAIN_ID = 'contenu';

type StatusFilter = 'draft' | 'published' | 'archived';

type Article = {
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

type ArticlesProps = {
    articles: AdminList<Article>;
    filters: {
        q: string;
        status: StatusFilter | null;
    };
    hasArticles: boolean;
};

const statusFilters: StatusFilterOption<StatusFilter>[] = [
    { value: null, label: text.statusFilters.all },
    { value: 'draft', label: text.statusFilters.draft },
    { value: 'published', label: text.statusFilters.published },
    { value: 'archived', label: text.statusFilters.archived },
];

export default function Articles({
    articles,
    filters,
    hasArticles,
}: ArticlesProps) {
    const { url } = usePage();
    const [deleted, setDeleted] = useState<Article | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [previewed, setPreviewed] = useState<PreviewedArticle | null>(null);
    // The row reloaded after « Publier » or « Archiver » in the panel; the snapshot when it left the filtered page.
    const previewedArticle = previewed
        ? (articles.data.find((article) => article.id === previewed.id) ??
          previewed)
        : null;
    const shouldFocusMain = useRef(false);

    // The trigger of the dialog is gone with its row, so the focus has nowhere to return. Runs after the dialog has closed.
    useEffect(() => {
        if (deleted === null && shouldFocusMain.current) {
            shouldFocusMain.current = false;
            document.getElementById(MAIN_ID)?.focus();
        }
    }, [deleted]);

    function confirmDeletion(): void {
        if (!deleted) {
            return;
        }

        router.delete(destroy.url(deleted.id), {
            preserveScroll: true,
            onStart: () => setIsDeleting(true),
            onFinish: () => setIsDeleting(false),
            onSuccess: () => {
                shouldFocusMain.current = true;
                setDeleted(null);
            },
        });
    }

    function rowActions(article: Article): RowAction[] {
        const actions: RowAction[] = [
            { key: 'edit', label: text.edit, href: edit.url(article.id) },
        ];

        actions.push({
            key: 'preview',
            label: text.preview,
            onSelect: () => setPreviewed(article),
        });

        if (article.status === 'PUBLISHED') {
            actions.push({
                key: 'archive',
                label: text.archive,
                onSelect: () =>
                    router.patch(
                        archive.url(article.id),
                        {},
                        { preserveScroll: true },
                    ),
            });
        } else {
            actions.push({
                key: 'publish',
                label: text.publish,
                onSelect: () =>
                    router.patch(
                        publish.url(article.id),
                        {},
                        { preserveScroll: true },
                    ),
            });
        }

        if (article.status === 'DRAFT') {
            actions.push({
                key: 'delete',
                label: text.delete,
                isDanger: true,
                onSelect: () => setDeleted(article),
            });
        }

        return actions;
    }

    function actionsMenu(article: Article): ReactNode {
        return (
            <RowActionsMenu
                triggerLabel={text.actionsFor(article.title)}
                menuLabel={text.actionsMenu}
                title={article.title}
                actions={rowActions(article)}
            />
        );
    }

    const columns: DataTableColumn<Article>[] = [
        {
            key: 'title',
            header: text.columns.title,
            render: (article) => (
                <Link
                    href={edit.url(article.id)}
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
            render: actionsMenu,
        },
    ];

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
                    <div className="tablet:flex-row tablet:flex-wrap tablet:items-center mb-4 flex flex-col gap-4">
                        <ListSearch
                            label={text.search}
                            placeholder={text.searchPlaceholder}
                            value={filters.q}
                            className="tablet:w-95"
                        />
                        <StatusFilters
                            label={text.statusFilter}
                            options={statusFilters}
                            current={filters.status}
                            url={url}
                        />
                        <p
                            role="status"
                            className="text-grey-dark tablet:ml-auto tablet:text-sm text-[0.8125rem]"
                        >
                            {text.count(articles.total)}
                        </p>
                    </div>

                    {articles.data.length > 0 ? (
                        <>
                            <DataTable
                                caption={text.title}
                                columns={columns}
                                rows={articles.data}
                                rowKey={(article) => article.id}
                                mobileListClassName="flex flex-col gap-2.5"
                                renderMobileItem={(article) => (
                                    <MobileCard
                                        article={article}
                                        menu={actionsMenu(article)}
                                    />
                                )}
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
                onClose={() => setPreviewed(null)}
            />

            <ConfirmModal
                isOpen={deleted !== null}
                onClose={() => setDeleted(null)}
                onConfirm={confirmDeletion}
                isConfirming={isDeleting}
                title={
                    deleted
                        ? frenchTypography(text.deleteTitle(deleted.title))
                        : ''
                }
                description={text.deleteDescription}
                confirmLabel={text.delete}
            />
        </>
    );
}

Articles.layout = (page: ReactNode) => <AdminLayout>{page}</AdminLayout>;

function ArticleStatusBadge({ status }: { status: ArticleStatus }) {
    return (
        <StatusBadge variant={statusVariants[status]}>
            {text.status[status]}
        </StatusBadge>
    );
}

/**
 * Publication date, or « Créé le … » for a draft, which has none yet.
 */
function ArticleDate({
    article,
    isShort,
}: {
    article: Article;
    isShort: boolean;
}) {
    if (article.status !== 'DRAFT' && article.publishedAt) {
        return (
            <time dateTime={article.publishedAt}>
                {isShort
                    ? article.publishedAtShortLabel
                    : article.publishedAtLabel}
            </time>
        );
    }

    const createdLabel = isShort
        ? article.createdAtShortLabel
        : article.createdAtLabel;

    return article.createdAt && createdLabel ? (
        <time dateTime={article.createdAt}>{text.createdOn(createdLabel)}</time>
    ) : null;
}

function MobileCard({ article, menu }: { article: Article; menu: ReactNode }) {
    return (
        <div className="border-grey-light flex flex-col gap-2.5 rounded-md border px-4 py-3.5">
            <div className="flex items-start justify-between gap-2">
                <h2 className="text-body leading-[1.35] font-semibold">
                    <Link href={edit.url(article.id)} className="text-primary">
                        {frenchTypography(article.title)}
                    </Link>
                </h2>
                <div className="-mt-2.5 -mr-3">{menu}</div>
            </div>
            <div className="text-grey-dark flex flex-wrap items-center gap-2 text-[0.8125rem] font-medium">
                <ArticleStatusBadge status={article.status} />
                <ArticleDate article={article} isShort />
            </div>
            {article.categories.length > 0 && (
                <p className="text-grey-dark text-[0.8125rem]">
                    {article.categories.join(', ')}
                </p>
            )}
        </div>
    );
}
