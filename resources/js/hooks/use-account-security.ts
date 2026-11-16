import { useState } from 'react';
import type { SecurityField } from '@/helpers/account';
import { useDeviceSignOut } from '@/hooks/use-device-sign-out';
import { useInlineEditing } from '@/hooks/use-inline-editing';
import { usePasswordForm } from '@/hooks/use-password-form';
import { useRecoveryEmailForm } from '@/hooks/use-recovery-email-form';
import { useRecoveryPhoneForm } from '@/hooks/use-recovery-phone-form';
import type { AccountSecurity } from '@/types/admin';

/**
 * « Gestion du compte », Security tab (spec §5.6.2): one form per field, one inline editor open at a time, and the
 * device logouts.
 */
export function useAccountSecurity(security: AccountSecurity) {
    // The two-factor editor still holds its own forms and reports whether they are dirty.
    const [isTwoFactorDirty, setIsTwoFactorDirty] = useState(false);
    // Runs on save, after `editing` below is set.
    const done = (): void => editing.close();
    const forms = {
        recoveryEmail: useRecoveryEmailForm(security.recoveryEmail, done),
        recoveryPhone: useRecoveryPhoneForm(security.recoveryPhone, done),
        password: usePasswordForm(done),
    };
    const editing = useInlineEditing<SecurityField>({
        isDirtyOf: (field) =>
            field === 'twoFactor' ? isTwoFactorDirty : forms[field].isDirty,
        onOpen: (field) => {
            if (field === 'twoFactor') {
                setIsTwoFactorDirty(false);
            } else {
                forms[field].start();
            }
        },
    });

    return {
        ...editing,
        ...forms,
        setIsTwoFactorDirty,
        signOut: useDeviceSignOut(),
    };
}

export type AccountSecurityForms = ReturnType<typeof useAccountSecurity>;
