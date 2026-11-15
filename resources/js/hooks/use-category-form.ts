import { useForm } from '@inertiajs/react';
import {
    store,
    update,
} from '@/actions/App/Http/Controllers/Admin/CategoryController';
import type { Category } from '@/helpers/categories';

/**
 * The create or edit form of a category. No client check: the French inline message comes from the server
 * (ADM-COM-7). `start()` fills the field for the category being edited, or empties it for a new one.
 */
export function useCategoryForm(onSaved: () => void) {
    const form = useForm({ name: '' });

    function start(category: Category | null): void {
        form.setDefaults({ name: category?.name ?? '' });
        form.setData({ name: category?.name ?? '' });
        form.clearErrors();
    }

    function submit(category: Category | null): void {
        const options = { preserveScroll: true, onSuccess: onSaved };

        if (category) {
            form.put(update.url(category.id), options);
        } else {
            form.post(store.url(), options);
        }
    }

    return {
        name: form.data.name,
        error: form.errors.name,
        isSaving: form.processing,
        changeName: (name: string): void => form.setData('name', name),
        start,
        submit,
    };
}

export type CategoryForm = ReturnType<typeof useCategoryForm>;
