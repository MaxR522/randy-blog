import { useForm } from '@inertiajs/react';
import type { FormEvent } from 'react';
import { useEffect } from 'react';
import {
    destroyRecoveryEmail,
    updateRecoveryEmail,
} from '@/actions/App/Http/Controllers/Admin/AccountSecurityController';
import type { EditorProps } from '@/components/admin/account-row';
import { useFocusOnOpen } from '@/components/admin/account-row';
import { EditorActions } from '@/components/admin/avatar-editor';
import { PasswordField } from '@/components/admin/password-field';
import { TextField } from '@/components/admin/text-field';
import { Button } from '@/components/public/button';
import { adminLabels } from '@/lib/labels.admin.fr';

const text = adminLabels.security;

export function RecoveryEmailEditor({
    value,
    onDirtyChange,
    onDone,
}: EditorProps & { value: string | null }) {
    const form = useForm({ recovery_email: value ?? '', password: '' });
    const formRef = useFocusOnOpen();

    useEffect(() => onDirtyChange(form.isDirty), [form.isDirty, onDirtyChange]);

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

    return (
        <form
            ref={formRef}
            onSubmit={submit}
            className="flex flex-col gap-4"
            noValidate
        >
            <p className="text-caption text-grey-dark">
                {text.recoveryEmailHelp}
            </p>
            <TextField
                label={text.newRecoveryEmail}
                name="recovery_email"
                type="email"
                autoComplete="email"
                value={form.data.recovery_email}
                onChange={(event) =>
                    form.setData('recovery_email', event.target.value)
                }
                error={form.errors.recovery_email}
                required
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
            <div className="tablet:flex-row tablet:items-center tablet:justify-between flex flex-col-reverse gap-2">
                {value && (
                    <Button
                        variant="ghost"
                        onClick={remove}
                        disabled={form.processing}
                        className="text-red-700"
                    >
                        {text.removeRecoveryEmail}
                    </Button>
                )}
                <div className="tablet:ml-auto">
                    <EditorActions isBusy={form.processing} onCancel={onDone} />
                </div>
            </div>
        </form>
    );
}
