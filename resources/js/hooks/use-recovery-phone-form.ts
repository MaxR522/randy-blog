import { useForm } from '@inertiajs/react';
import type { FormEvent } from 'react';
import { updateRecoveryPhone } from '@/actions/App/Http/Controllers/Admin/AccountSecurityController';
import { formatPhone } from '@/helpers/phone';

/**
 * Inline editor of the recovery phone, behind the current password. `start()` refills it from the saved value,
 * formatted, each time the editor opens.
 */
export function useRecoveryPhoneForm(value: string | null, onDone: () => void) {
    const fieldsOf = () => ({
        recovery_phone: value ? formatPhone(value) : '',
        password: '',
    });
    const form = useForm(fieldsOf());

    function start(): void {
        const fields = fieldsOf();
        form.setDefaults(fields);
        form.setData(fields);
        form.clearErrors();
    }

    function submit(event: FormEvent<HTMLFormElement>): void {
        event.preventDefault();
        form.put(updateRecoveryPhone.url(), {
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
        changePhone: (phone: string): void =>
            form.setData('recovery_phone', phone),
        changePassword: (password: string): void =>
            form.setData('password', password),
        start,
        submit,
    };
}

export type RecoveryPhoneForm = ReturnType<typeof useRecoveryPhoneForm>;
