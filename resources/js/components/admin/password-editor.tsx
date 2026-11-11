import { useForm } from '@inertiajs/react';
import type { FormEvent } from 'react';
import { useEffect } from 'react';
import { updatePassword } from '@/actions/App/Http/Controllers/Admin/AccountSecurityController';
import type { EditorProps } from '@/components/admin/account-row';
import { useFocusOnOpen } from '@/components/admin/account-row';
import { EditorActions } from '@/components/admin/avatar-editor';
import { PasswordField } from '@/components/admin/password-field';
import { PasswordRules } from '@/components/admin/password-rules';
import { adminLabels } from '@/lib/labels.admin.fr';

const text = adminLabels.security;

export function PasswordEditor({ onDirtyChange, onDone }: EditorProps) {
    const form = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });
    const formRef = useFocusOnOpen();

    useEffect(() => onDirtyChange(form.isDirty), [form.isDirty, onDirtyChange]);

    function submit(event: FormEvent<HTMLFormElement>): void {
        event.preventDefault();
        form.put(updatePassword.url(), {
            preserveScroll: true,
            onSuccess: onDone,
            onError: () => form.reset(),
        });
    }

    return (
        <form
            ref={formRef}
            onSubmit={submit}
            className="flex max-w-110 flex-col gap-4"
            noValidate
        >
            <PasswordField
                label={text.currentPassword}
                name="current_password"
                autoComplete="current-password"
                value={form.data.current_password}
                onChange={(event) =>
                    form.setData('current_password', event.target.value)
                }
                error={form.errors.current_password}
                required
            />
            <PasswordField
                label={text.newPassword}
                name="password"
                autoComplete="new-password"
                value={form.data.password}
                onChange={(event) =>
                    form.setData('password', event.target.value)
                }
                error={form.errors.password}
                aria-describedby="regles-mot-de-passe"
                required
            />
            <PasswordRules
                id="regles-mot-de-passe"
                password={form.data.password}
            />
            <PasswordField
                label={text.confirmPassword}
                name="password_confirmation"
                autoComplete="new-password"
                value={form.data.password_confirmation}
                onChange={(event) =>
                    form.setData('password_confirmation', event.target.value)
                }
                error={form.errors.password_confirmation}
                required
            />
            <p className="text-caption text-grey-dark">
                {text.otherDevicesLoggedOut}
            </p>
            <EditorActions isBusy={form.processing} onCancel={onDone} />
        </form>
    );
}
