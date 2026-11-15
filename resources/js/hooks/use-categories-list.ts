import { router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import { destroy } from '@/actions/App/Http/Controllers/Admin/CategoryController';
import type {
    Category,
    CategoryFilters,
    CategorySort,
    ColumnSort,
    EditedCategory,
} from '@/helpers/categories';
import { categorySortOf } from '@/helpers/categories';
import { listUrl, listVisitOptions } from '@/helpers/list-url';
import { useCategoryForm } from '@/hooks/use-category-form';
import { useRowDeletion } from '@/hooks/use-row-deletion';

/**
 * State and actions of the categories list: the sort, the create or edit modal and the deletion of a category.
 */
export function useCategoriesList(filters: CategoryFilters) {
    const { url } = usePage();
    const [edited, setEdited] = useState<EditedCategory>(null);
    const deletion = useRowDeletion<Category>((id) => destroy.url(id));
    const form = useCategoryForm(() => setEdited(null));
    const category = edited === 'new' ? null : edited;

    function openForm(next: Category | null): void {
        form.start(next);
        setEdited(next ?? 'new');
    }

    function changeSort(sort: string): void {
        router.get(
            listUrl(url, { sort, direction: null }),
            {},
            listVisitOptions,
        );
    }

    return {
        sortOf: (sort: CategorySort): ColumnSort =>
            categorySortOf(url, filters, sort),
        changeSort,
        deletion,
        form,
        isFormOpen: edited !== null,
        editedCategory: category,
        openCreate: (): void => openForm(null),
        openEdit: (next: Category): void => openForm(next),
        closeForm: (): void => setEdited(null),
        saveForm: (): void => form.submit(category),
    };
}

export type CategoriesList = ReturnType<typeof useCategoriesList>;
