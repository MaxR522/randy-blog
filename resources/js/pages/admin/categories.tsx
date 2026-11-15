import { Folder, Plus, Search } from 'lucide-react';
import type { ReactNode } from 'react';
import { AdminHead } from '@/components/admin/admin-head';
import { CategoriesTable } from '@/components/admin/categories/categories-table';
import { CategoriesToolbar } from '@/components/admin/categories/categories-toolbar';
import { CategoryFormModal } from '@/components/admin/categories/category-form-modal';
import { ConfirmModal } from '@/components/admin/confirm-modal';
import { EmptyState } from '@/components/admin/empty-state';
import { ListPagination } from '@/components/admin/list-pagination';
import { PageHeader } from '@/components/admin/page-header';
import { Button } from '@/components/public/button';
import type { Category, CategoryFilters } from '@/helpers/categories';
import { frenchTypography } from '@/helpers/typography';
import { useCategoriesList } from '@/hooks/use-categories-list';
import { useListSearch } from '@/hooks/use-list-search';
import AdminLayout from '@/layouts/admin-layout';
import { adminLabels } from '@/lib/labels.admin.fr';
import type { AdminList } from '@/types/admin';

const text = adminLabels.categories;

type CategoriesProps = {
    categories: AdminList<Category>;
    filters: CategoryFilters;
    hasCategories: boolean;
};

export default function Categories({
    categories,
    filters,
    hasCategories,
}: CategoriesProps) {
    const search = useListSearch(filters.q);
    const list = useCategoriesList(filters);
    const { deletion } = list;

    const createButton = (
        <Button onClick={list.openCreate} className="tablet:w-auto w-full">
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
                    <CategoriesToolbar
                        search={search}
                        total={categories.total}
                        sort={filters.sort}
                        onSortChange={list.changeSort}
                    />

                    {categories.data.length > 0 ? (
                        <>
                            <CategoriesTable
                                categories={categories.data}
                                sortOf={list.sortOf}
                                onEdit={list.openEdit}
                                onDelete={deletion.askDeletion}
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
                isOpen={list.isFormOpen}
                isEditing={list.editedCategory !== null}
                form={list.form}
                onClose={list.closeForm}
                onSubmit={list.saveForm}
            />

            <ConfirmModal
                isOpen={deletion.deleted !== null}
                onClose={deletion.cancelDeletion}
                onConfirm={deletion.confirmDeletion}
                isConfirming={deletion.isDeleting}
                title={
                    deletion.deleted
                        ? frenchTypography(
                              text.deleteTitle(deletion.deleted.name),
                          )
                        : ''
                }
                description={
                    deletion.deleted && deletion.deleted.articlesCount > 0
                        ? text.deleteUsage(deletion.deleted.articlesCount)
                        : undefined
                }
                confirmLabel={text.delete}
            />
        </>
    );
}

Categories.layout = (page: ReactNode) => <AdminLayout>{page}</AdminLayout>;
