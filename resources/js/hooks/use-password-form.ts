import { useForm } from '@inertiajs/react';
import type { FormEvent } from 'react';
import { updatePassword } from '@/actions/App/Http/Controllers/Admin/AccountSecurityController';

const EMPTY = { current_password: '', password: '', password_confirmation: '' };

/**
 * Inline editor of the password; the other devices are logged out once it changes. `start()` empties it each time
 * the editor opens.
 */
export function usePasswordForm(onDone: () => void) {
    const form = useForm({ ...EMPTY });

    function start(): void {
        form.setDefaults({ ...EMPTY });
        form.setData({ ...EMPTY });
        form.clearErrors();
    }

    function submit(event: FormEvent<HTMLFormElement>): void {
        event.preventDefault();
        form.put(updatePassword.url(), {
            preserveScroll: true,
            onSuccess: onDone,
            onError: () => form.reset(),
        });
    }

    return {
        data: form.data,
        errors: form.errors,
        isBusy: form.processing,
        isDirty: form.isDirty,
        change: (field: keyof typeof EMPTY, value: string): void =>
            form.setData(field, value),
        start,
        submit,
    };
}

export type PasswordForm = ReturnType<typeof usePasswordForm>;
