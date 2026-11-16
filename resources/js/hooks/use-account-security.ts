import type { SecurityField } from '@/helpers/account';
import { useDeviceSignOut } from '@/hooks/use-device-sign-out';
import { useInlineEditing } from '@/hooks/use-inline-editing';
import { usePasswordForm } from '@/hooks/use-password-form';
import { useRecoveryEmailForm } from '@/hooks/use-recovery-email-form';
import { useRecoveryPhoneForm } from '@/hooks/use-recovery-phone-form';
import { useTwoFactor } from '@/hooks/use-two-factor';
import type { AccountSecurity } from '@/types/admin';

/**
 * « Gestion du compte », Security tab (spec §5.6.2): one form per field (the recovery codes come from the flash),
 * one inline editor open at a time, and the device logouts.
 */
export function useAccountSecurity(
    security: AccountSecurity,
    recoveryCodes: string[] | undefined,
) {
    // Runs on save, after `editing` below is set.
    const done = (): void => editing.close();
    const forms = {
        recoveryEmail: useRecoveryEmailForm(security.recoveryEmail, done),
        recoveryPhone: useRecoveryPhoneForm(security.recoveryPhone, done),
        password: usePasswordForm(done),
        twoFactor: useTwoFactor(security.twoFactor, recoveryCodes, done),
    };
    const editing = useInlineEditing<SecurityField>({
        isDirtyOf: (field) => forms[field].isDirty,
        onOpen: (field) => forms[field].start(),
    });

    return {
        ...editing,
        ...forms,
        signOut: useDeviceSignOut(),
    };
}

export type AccountSecurityForms = ReturnType<typeof useAccountSecurity>;
