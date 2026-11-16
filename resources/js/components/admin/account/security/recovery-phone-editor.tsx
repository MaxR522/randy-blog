import { EditorActions } from '@/components/admin/account/editor-actions';
import { PasswordField } from '@/components/admin/password-field';
import { TextField } from '@/components/admin/text-field';
import { useFocusOnOpen } from '@/hooks/use-focus-on-open';
import type { RecoveryPhoneForm } from '@/hooks/use-recovery-phone-form';
import { adminLabels } from '@/lib/labels.admin.fr';

const text = adminLabels.security;

type RecoveryPhoneEditorProps = {
    form: RecoveryPhoneForm;
    onCancel: () => void;
};

/**
 * Inline editor of the recovery phone.
 */
export function RecoveryPhoneEditor({
    form,
    onCancel,
}: RecoveryPhoneEditorProps) {
    const formRef = useFocusOnOpen();

    return (
        <form
            ref={formRef}
            onSubmit={form.submit}
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
                onChange={(event) => form.changePhone(event.target.value)}
                error={form.errors.recovery_phone}
                help={text.phoneNumberHelp}
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
            <EditorActions isBusy={form.isBusy} onCancel={onCancel} />
        </form>
    );
}
