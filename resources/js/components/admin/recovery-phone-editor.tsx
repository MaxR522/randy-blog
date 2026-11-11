import { useForm } from '@inertiajs/react';
import type { FormEvent } from 'react';
import { useEffect } from 'react';
import { updateRecoveryPhone } from '@/actions/App/Http/Controllers/Admin/AccountSecurityController';
import type { EditorProps } from '@/components/admin/account-row';
import { useFocusOnOpen } from '@/components/admin/account-row';
import { EditorActions } from '@/components/admin/avatar-editor';
import { PasswordField } from '@/components/admin/password-field';
import { TextField } from '@/components/admin/text-field';
import { adminLabels } from '@/lib/labels.admin.fr';
import { formatPhone } from '@/lib/phone';

const text = adminLabels.security;

export function RecoveryPhoneEditor({
    value,
    onDirtyChange,
    onDone,
}: EditorProps & { value: string | null }) {
    const form = useForm({
        recovery_phone: value ? formatPhone(value) : '',
        password: '',
    });
    const formRef = useFocusOnOpen();

    useEffect(() => onDirtyChange(form.isDirty), [form.isDirty, onDirtyChange]);

    function submit(event: FormEvent<HTMLFormElement>): void {
        event.preventDefault();
        form.put(updateRecoveryPhone.url(), {
            preserveScroll: true,
            onSuccess: onDone,
            onError: () => form.reset('password'),
        });
    }

    return (
        <form
            ref={formRef}
            onSubmit={submit}
            className="flex flex-col gap-4"
            noValidate
        >
            <TextField
                label={text.phoneNumber}
                name="recovery_phone"
                type="tel"
                autoComplete="tel"
                inputMode="tel"
                placeholder="+261 34 00 000 00"
                value={form.data.recovery_phone}
                onChange={(event) =>
                    form.setData('recovery_phone', event.target.value)
                }
                error={form.errors.recovery_phone}
                help={text.phoneNumberHelp}
            />
            <PasswordField
                label={text.currentPassword}
                name="password"
                autoComplete="current-password"
                value={form.data.password}
                onChange={(event) =>
                    form.setData('password', event.target.value)
                }
                error={form.errors.password}
                required
            />
            <EditorActions isBusy={form.processing} onCancel={onDone} />
        </form>
    );
}
