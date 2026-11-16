import { useForm } from '@inertiajs/react';
import type { FormEvent } from 'react';
import {
    destroyRecoveryEmail,
    updateRecoveryEmail,
} from '@/actions/App/Http/Controllers/Admin/AccountSecurityController';

/**
 * Inline editor of the recovery email: change it or remove it, both behind the current password. `start()` refills
 * it from the saved value each time the editor opens.
 */
export function useRecoveryEmailForm(value: string | null, onDone: () => void) {
    const form = useForm({ recovery_email: value ?? '', password: '' });

    function start(): void {
        const fields = { recovery_email: value ?? '', password: '' };
        form.setDefaults(fields);
        form.setData(fields);
        form.clearErrors();
    }

    function submit(event: FormEvent<HTMLFormElement>): void {
        event.preventDefault();
        form.put(updateRecoveryEmail.url(), {
            preserveScroll: true,
            onSuccess: onDone,
            onError: () => form.reset('password'),
        });
    }

    function remove(): void {
        form.transform((data) => ({ password: data.password }));
        form.delete(destroyRecoveryEmail.url(), {
            preserveScroll: true,
            onSuccess: onDone,
            onError: () => form.reset('password'),
            onFinish: () => form.transform((data) => data),
        });
    }

    return {
        data: form.data,
        errors: form.errors,
        isBusy: form.processing,
        isDirty: form.isDirty,
        canRemove: value !== null && value !== '',
        changeEmail: (email: string): void =>
            form.setData('recovery_email', email),
        changePassword: (password: string): void =>
            form.setData('password', password),
        start,
        submit,
        remove,
    };
}

export type RecoveryEmailForm = ReturnType<typeof useRecoveryEmailForm>;
