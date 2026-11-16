import { PasswordField } from '@/components/admin/password-field';
import { TextField } from '@/components/admin/text-field';
import { Button } from '@/components/public/button';
import { useFocusOnOpen } from '@/hooks/use-focus-on-open';
import type { LoginEmailForm } from '@/hooks/use-login-email-form';
import { adminLabels } from '@/lib/labels.admin.fr';

const text = adminLabels.account;

type LoginEmailEditorProps = {
    form: LoginEmailForm;
    onCancel: () => void;
};

/**
 * Inline editor of the login email: new address and current password, then « Envoyer le lien ».
 */
export function LoginEmailEditor({ form, onCancel }: LoginEmailEditorProps) {
    const formRef = useFocusOnOpen();

    return (
        <form
            ref={formRef}
            onSubmit={form.submit}
            className="flex flex-col gap-4"
            noValidate
        >
            <p className="text-caption text-grey-dark">{text.loginEmailHelp}</p>
            <TextField
                label={text.newEmail}
                name="email"
                type="email"
                autoComplete="email"
                value={form.data.email}
                onChange={(event) => form.changeEmail(event.target.value)}
                error={form.errors.email}
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
            <div className="tablet:flex tablet:justify-end grid grid-cols-2 gap-2">
                <Button
                    variant="secondary"
                    onClick={onCancel}
                    disabled={form.isBusy}
                    className="tablet:h-11 h-12"
                >
                    {text.cancel}
                </Button>
                <Button
                    type="submit"
                    isLoading={form.isBusy}
                    disabled={form.isBusy}
                    className="tablet:h-11 h-12 px-4"
                >
                    {text.sendLink}
                </Button>
            </div>
        </form>
    );
}
