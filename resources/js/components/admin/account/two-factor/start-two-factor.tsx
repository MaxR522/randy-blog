import { TwoFactorActions } from '@/components/admin/account/two-factor/two-factor-actions';
import { PasswordField } from '@/components/admin/password-field';
import { Button } from '@/components/public/button';
import { useFocusOnOpen } from '@/hooks/use-focus-on-open';
import type { TwoFactor } from '@/hooks/use-two-factor';
import { adminLabels } from '@/lib/labels.admin.fr';

const text = adminLabels.security;

/**
 * First two-factor step: the current password before the QR code.
 */
export function StartTwoFactor({ twoFactor }: { twoFactor: TwoFactor }) {
    const formRef = useFocusOnOpen();

    return (
        <form
            ref={formRef}
            onSubmit={twoFactor.enable}
            className="flex max-w-110 flex-col gap-4"
            noValidate
        >
            <p className="text-caption text-grey-dark">
                {text.twoFactorPasswordHelp}
            </p>
            <PasswordField
                label={text.currentPassword}
                name="password"
                autoComplete="current-password"
                value={twoFactor.password}
                onChange={(event) =>
                    twoFactor.changePassword(event.target.value)
                }
                error={twoFactor.passwordError}
                required
            />
            <TwoFactorActions>
                <Button
                    variant="secondary"
                    onClick={twoFactor.done}
                    disabled={twoFactor.isBusy}
                >
                    {adminLabels.account.cancel}
                </Button>
                <Button
                    type="submit"
                    isLoading={twoFactor.isBusy}
                    disabled={twoFactor.isBusy}
                >
                    {text.twoFactorContinue}
                </Button>
            </TwoFactorActions>
        </form>
    );
}
