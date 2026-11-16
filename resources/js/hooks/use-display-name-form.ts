import { useForm } from '@inertiajs/react';
import type { FormEvent } from 'react';
import { displayName } from '@/routes/admin/account';

/**
 * Inline editor of the display name (biography byline only). `start()` refills it from the saved value each time
 * the editor opens.
 */
export function useDisplayNameForm(value: string, onDone: () => void) {
    const form = useForm({ display_name: value });

    function start(): void {
        form.setDefaults({ display_name: value });
        form.setData({ display_name: value });
        form.clearErrors();
    }

    function submit(event: FormEvent<HTMLFormElement>): void {
        event.preventDefault();
        form.patch(displayName.url(), {
            preserveScroll: true,
            onSuccess: onDone,
        });
    }

    return {
        value: form.data.display_name,
        error: form.errors.display_name,
        isBusy: form.processing,
        isDirty: form.isDirty,
        change: (name: string): void => form.setData('display_name', name),
        start,
        submit,
    };
}

export type DisplayNameForm = ReturnType<typeof useDisplayNameForm>;
