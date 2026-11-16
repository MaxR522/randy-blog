import { useForm } from '@inertiajs/react';
import type { FormEvent } from 'react';
import { email as emailRoute } from '@/routes/admin/account';

const EMPTY = { email: '', password: '' };

/**
 * Inline editor of the login email: the new address and the current password; the server sends a confirmation
 * link. `start()` empties it each time the editor opens.
 */
export function useLoginEmailForm(onDone: () => void) {
    const form = useForm({ ...EMPTY });

    function start(): void {
        form.setDefaults({ ...EMPTY });
        form.setData({ ...EMPTY });
        form.clearErrors();
    }

    function submit(event: FormEvent<HTMLFormElement>): void {
        event.preventDefault();
        form.post(emailRoute.url(), {
            preserveScroll: true,
            onSuccess: onDone,
            onError: () => form.reset('password'),
        });
    }

    return {
        data: form.data,
        errors: form.errors,
        isBusy: form.processing,
        isDirty: form.isDirty,
        changeEmail: (email: string): void => form.setData('email', email),
        changePassword: (password: string): void =>
            form.setData('password', password),
        start,
        submit,
    };
}

export type LoginEmailForm = ReturnType<typeof useLoginEmailForm>;
