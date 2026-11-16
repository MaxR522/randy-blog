import { EditorActions } from '@/components/admin/account/editor-actions';
import { PasswordField } from '@/components/admin/password-field';
import { PasswordRules } from '@/components/admin/password-rules';
import { useFocusOnOpen } from '@/hooks/use-focus-on-open';
import type { PasswordForm } from '@/hooks/use-password-form';
import { adminLabels } from '@/lib/labels.admin.fr';

const text = adminLabels.security;

type PasswordEditorProps = {
    form: PasswordForm;
    onCancel: () => void;
};

/**
 * Inline editor of the password: current one, new one with its rules, confirmation.
 */
export function PasswordEditor({ form, onCancel }: PasswordEditorProps) {
    const formRef = useFocusOnOpen();

    return (
        <form
            ref={formRef}
            onSubmit={form.submit}
            className="flex max-w-110 flex-col gap-4"
            noValidate
        >
            <PasswordField
                label={text.currentPassword}
                name="current_password"
                autoComplete="current-password"
                value={form.data.current_password}
                onChange={(event) =>
                    form.change('current_password', event.target.value)
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
                    form.change('password', event.target.value)
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
                    form.change('password_confirmation', event.target.value)
                }
                error={form.errors.password_confirmation}
                required
            />
            <p className="text-caption text-grey-dark">
                {text.otherDevicesLoggedOut}
            </p>
            <EditorActions isBusy={form.isBusy} onCancel={onCancel} />
        </form>
    );
}
