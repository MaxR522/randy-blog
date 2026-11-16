import { ConfirmTwoFactor } from '@/components/admin/account/two-factor/confirm-two-factor';
import { ManageTwoFactor } from '@/components/admin/account/two-factor/manage-two-factor';
import { RecoveryCodes } from '@/components/admin/account/two-factor/recovery-codes';
import { StartTwoFactor } from '@/components/admin/account/two-factor/start-two-factor';
import type { TwoFactor } from '@/hooks/use-two-factor';

/**
 * « Authentification à deux facteurs (2FA) » (ADM-SEC-4): the step `useTwoFactor` is on.
 */
export function TwoFactorEditor({ twoFactor }: { twoFactor: TwoFactor }) {
    switch (twoFactor.step) {
        case 'codes':
            return (
                <RecoveryCodes
                    codes={twoFactor.recoveryCodes}
                    onDone={twoFactor.done}
                />
            );
        case 'manage':
            return <ManageTwoFactor twoFactor={twoFactor} />;
        case 'confirm':
            return <ConfirmTwoFactor twoFactor={twoFactor} />;
        default:
            return <StartTwoFactor twoFactor={twoFactor} />;
    }
}
