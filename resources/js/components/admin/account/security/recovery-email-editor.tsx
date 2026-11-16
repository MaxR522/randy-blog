import { EditorActions } from '@/components/admin/account/editor-actions';
import { PasswordField } from '@/components/admin/password-field';
import { TextField } from '@/components/admin/text-field';
import { Button } from '@/components/public/button';
import { useFocusOnOpen } from '@/hooks/use-focus-on-open';
import type { RecoveryEmailForm } from '@/hooks/use-recovery-email-form';
import { adminLabels } from '@/lib/labels.admin.fr';

const text = adminLabels.security;

type RecoveryEmailEditorProps = {
    form: RecoveryEmailForm;
    onCancel: () => void;
};

/**
 * Inline editor of the recovery email, with « Supprimer » when one is saved.
 */
export function RecoveryEmailEditor({
    form,
    onCancel,
}: RecoveryEmailEditorProps) {
    const formRef = useFocusOnOpen();

    return (
        <form
            ref={formRef}
            onSubmit={form.submit}
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
                onChange={(event) => form.changeEmail(event.target.value)}
                error={form.errors.recovery_email}
                required
            />
            <PasswordField
                label={text.currentPassword}
                name="password"
                autoComplete="current-password"
                value={form.data.password}
                onChange={(event) => form.changePassword(event.target.value)}
                error={form.errors.password}
                required
            />
            <div className="tablet:flex-row tablet:items-center tablet:justify-between flex flex-col-reverse gap-2">
                {form.canRemove && (
                    <Button
                        variant="ghost"
                        onClick={form.remove}
                        disabled={form.isBusy}
                        className="text-red-700"
                    >
                        {text.removeRecoveryEmail}
                    </Button>
                )}
                <div className="tablet:ml-auto">
                    <EditorActions isBusy={form.isBusy} onCancel={onCancel} />
                </div>
            </div>
        </form>
    );
}
