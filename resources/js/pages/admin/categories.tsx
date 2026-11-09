import { Form, router, usePage } from '@inertiajs/react';
import { Folder, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import type { ChangeEvent, ReactNode } from 'react';
import { useEffect, useRef, useState } from 'react';
import {
    destroy,
    store,
    update,
} from '@/actions/App/Http/Controllers/Admin/CategoryController';
import { AdminHead } from '@/components/admin/admin-head';
import { ConfirmModal } from '@/components/admin/confirm-modal';
import type { DataTableColumn } from '@/components/admin/data-table';
import { DataTable } from '@/components/admin/data-table';
import { EmptyState } from '@/components/admin/empty-state';
import { ListPagination } from '@/components/admin/list-pagination';
import { ListSearch } from '@/components/admin/list-search';
import { Modal, ModalBody, ModalFooter } from '@/components/admin/modal';
import { PageHeader } from '@/components/admin/page-header';
import { TextField } from '@/components/admin/text-field';
import { Button } from '@/components/public/button';
import AdminLayout from '@/layouts/admin-layout';
import { adminLabels } from '@/lib/labels.admin.fr';
import { listUrl, listVisitOptions } from '@/lib/list-url';
import { frenchTypography } from '@/lib/typography';
import type { AdminList, SortDirection } from '@/types/admin';

const text = adminLabels.categories;

const MAIN_ID = 'contenu';

type Category = {
    id: number;
    name: string;
    articlesCount: number;
    createdAt: string | null;
    createdAtLabel: string | null;
    createdAtShortLabel: string | null;
};

type CategorySort = 'name' | 'date';

type CategoriesProps = {
    categories: AdminList<Category>;
    filters: {
        q: string;
        sort: CategorySort;
        direction: SortDirection;
    };
    hasCategories: boolean;
};

/** `null` when closed, `'new'` when creating, otherwise the category being edited. */
type EditedCategory = Category | 'new' | null;

export default function Categories({
    categories,
    filters,
    hasCategories,
}: CategoriesProps) {
    const { url } = usePage();
    const [edited, setEdited] = useState<EditedCategory>(null);
    const [deleted, setDeleted] = useState<Category | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const shouldFocusMain = useRef(false);

    // The trigger of the dialog is gone with its row, so the focus has nowhere to return. Runs after the dialog has closed.
    useEffect(() => {
        if (deleted === null && shouldFocusMain.current) {
            shouldFocusMain.current = false;
            document.getElementById(MAIN_ID)?.focus();
        }
    }, [deleted]);

    function sortColumn(
        sort: CategorySort,
    ): NonNullable<DataTableColumn<Category>['sort']> {
        const isActive = filters.sort === sort;
        const nextDirection = filters.direction === 'asc' ? 'desc' : 'asc';

        return {
            href: listUrl(url, {
                sort,
                direction: isActive ? nextDirection : null,
            }),
            direction: isActive ? filters.direction : null,
        };
    }

    function changeMobileSort(event: ChangeEvent<HTMLSelectElement>): void {
        router.get(
            listUrl(url, { sort: event.target.value, direction: null }),
            {},
            listVisitOptions,
        );
    }

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

    const columns: DataTableColumn<Category>[] = [
        {
            key: 'name',
            header: text.columns.name,
            cellClassName: 'font-medium',
            sort: sortColumn('name'),
            render: (category) => category.name,
        },
        {
            key: 'date',
            header: text.columns.date,
            cellClassName: 'text-grey-dark',
            sort: sortColumn('date'),
            render: (category) =>
                category.createdAt && (
                    <time dateTime={category.createdAt}>
                        {category.createdAtLabel}
                    </time>
                ),
        },
        {
            key: 'articles',
            header: text.columns.articles,
            alignEnd: true,
            isNumeric: true,
            render: (category) => category.articlesCount,
        },
        {
            key: 'actions',
            header: text.columns.actions,
            alignEnd: true,
            cellClassName: 'whitespace-nowrap',
            render: (category) => (
                <>
                    <Button
                        variant="ghost"
                        onClick={() => setEdited(category)}
                        aria-label={text.editNamed(category.name)}
                        className="h-10 px-3 text-sm"
                    >
                        {text.edit}
                    </Button>
                    <Button
                        variant="ghost"
                        onClick={() => setDeleted(category)}
                        aria-label={text.deleteNamed(category.name)}
                        className="h-10 px-3 text-sm text-red-700"
                    >
                        {text.delete}
                    </Button>
                </>
            ),
        },
    ];

    const createButton = (
        <Button
            onClick={() => setEdited('new')}
            className="tablet:w-auto w-full"
        >
            <Plus aria-hidden="true" className="size-4.5" strokeWidth={2} />
            {text.create}
        </Button>
    );

    return (
        <>
            <AdminHead title={text.title} />
            <PageHeader title={text.title} action={createButton} />

            {hasCategories ? (
                <>
                    <div className="tablet:flex-row tablet:items-center mb-4 flex flex-col gap-4">
                        <ListSearch
                            label={text.search}
                            placeholder={text.searchPlaceholder}
                            value={filters.q}
                            className="tablet:w-95"
                        />
                        <div className="tablet:ml-auto flex items-center justify-between gap-4">
                            <p
                                role="status"
                                className="text-grey-dark tablet:text-sm text-[0.8125rem]"
                            >
                                {text.count(categories.total)}
                            </p>
                            <label className="tablet:hidden flex items-center gap-2 text-sm">
                                {text.sortBy}
                                <select
                                    value={filters.sort}
                                    onChange={changeMobileSort}
                                    className="border-grey-medium text-primary h-11 rounded-md border bg-white px-2 text-sm"
                                >
                                    <option value="name">
                                        {text.sortName}
                                    </option>
                                    <option value="date">
                                        {text.sortDate}
                                    </option>
                                </select>
                            </label>
                        </div>
                    </div>

                    {categories.data.length > 0 ? (
                        <>
                            <DataTable
                                caption={text.title}
                                columns={columns}
                                rows={categories.data}
                                rowKey={(category) => category.id}
                                renderMobileItem={(category) => (
                                    <MobileRow
                                        category={category}
                                        onEdit={() => setEdited(category)}
                                        onDelete={() => setDeleted(category)}
                                    />
                                )}
                            />
                            <ListPagination
                                currentPage={categories.currentPage}
                                lastPage={categories.lastPage}
                                previousUrl={categories.previousUrl}
                                nextUrl={categories.nextUrl}
                            />
                        </>
                    ) : (
                        <EmptyState icon={Search} message={text.noMatch} />
                    )}
                </>
            ) : (
                <EmptyState
                    icon={Folder}
                    message={text.empty}
                    action={createButton}
                />
            )}

            <CategoryFormModal
                edited={edited}
                onClose={() => setEdited(null)}
            />

            <ConfirmModal
                isOpen={deleted !== null}
                onClose={() => setDeleted(null)}
                onConfirm={confirmDeletion}
                isConfirming={isDeleting}
                title={
                    deleted
                        ? frenchTypography(text.deleteTitle(deleted.name))
                        : ''
                }
                description={
                    deleted && deleted.articlesCount > 0
                        ? text.deleteUsage(deleted.articlesCount)
                        : undefined
                }
                confirmLabel={text.delete}
            />
        </>
    );
}

Categories.layout = (page: ReactNode) => <AdminLayout>{page}</AdminLayout>;

type MobileRowProps = {
    category: Category;
    onEdit: () => void;
    onDelete: () => void;
};

function MobileRow({ category, onEdit, onDelete }: MobileRowProps) {
    const iconButtonClasses =
        'flex size-11 flex-none cursor-pointer items-center justify-center rounded-md';

    return (
        <div className="border-grey-light flex items-center gap-2 border-b py-2.5">
            <div className="min-w-0 flex-1">
                <p className="text-body font-semibold">{category.name}</p>
                <p className="text-grey-dark mt-0.5 text-[0.8125rem]">
                    {text.mobileMeta(
                        category.articlesCount,
                        category.createdAtShortLabel,
                    )}
                </p>
            </div>
            <button
                type="button"
                onClick={onEdit}
                aria-label={text.editNamed(category.name)}
                className={`text-primary ${iconButtonClasses}`}
            >
                <Pencil
                    aria-hidden="true"
                    className="size-4.5"
                    strokeWidth={1.75}
                />
            </button>
            <button
                type="button"
                onClick={onDelete}
                aria-label={text.deleteNamed(category.name)}
                className={`text-red-700 ${iconButtonClasses}`}
            >
                <Trash2
                    aria-hidden="true"
                    className="size-4.5"
                    strokeWidth={1.75}
                />
            </button>
        </div>
    );
}

type CategoryFormModalProps = {
    edited: EditedCategory;
    onClose: () => void;
};

/**
 * Creates or edits. No native `required`: the French inline message comes from the server (ADM-COM-7).
 */
function CategoryFormModal({ edited, onClose }: CategoryFormModalProps) {
    const category = edited === 'new' ? null : edited;
    const action = category ? update.form(category.id) : store.form();

    return (
        <Modal
            isOpen={edited !== null}
            onClose={onClose}
            title={category ? text.editTitle : text.create}
        >
            <Form
                {...action}
                options={{ preserveScroll: true }}
                onSuccess={onClose}
                className="tablet:flex-none flex min-h-0 flex-1 flex-col"
            >
                {({ errors, processing }) => (
                    <>
                        <ModalBody>
                            <TextField
                                label={text.nameField}
                                name="name"
                                defaultValue={category?.name}
                                autoComplete="off"
                                aria-required="true"
                                data-autofocus
                                error={errors.name}
                            />
                        </ModalBody>
                        <ModalFooter>
                            <Button
                                variant="secondary"
                                onClick={onClose}
                                className="tablet:h-11 h-12"
                            >
                                {adminLabels.modal.cancel}
                            </Button>
                            <Button
                                type="submit"
                                isLoading={processing}
                                disabled={processing}
                                className="tablet:h-11 h-12"
                            >
                                {adminLabels.modal.save}
                            </Button>
                        </ModalFooter>
                    </>
                )}
            </Form>
        </Modal>
    );
}
