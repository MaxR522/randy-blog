import { PasswordField } from '@/components/admin/password-field';
import { Button } from '@/components/public/button';
import { useFocusOnOpen } from '@/hooks/use-focus-on-open';
import type { TwoFactor } from '@/hooks/use-two-factor';
import { adminLabels } from '@/lib/labels.admin.fr';

const text = adminLabels.security;

/**
 * Two-factor on: the current password regenerates the recovery codes or turns 2FA off.
 */
export function ManageTwoFactor({ twoFactor }: { twoFactor: TwoFactor }) {
    const formRef = useFocusOnOpen();

    return (
        <form
            ref={formRef}
            onSubmit={twoFactor.regenerate}
            className="flex max-w-110 flex-col gap-4"
            noValidate
        >
            <p className="text-caption text-grey-dark">
                {text.twoFactorManageHelp}
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
            <div className="flex flex-col gap-2">
                <Button
                    type="submit"
                    variant="secondary"
                    isLoading={twoFactor.isBusy}
                    disabled={twoFactor.isBusy}
                    className="tablet:h-11 h-12"
                >
                    {text.regenerateCodes}
                </Button>
                <Button
                    variant="danger"
                    onClick={twoFactor.disable}
                    disabled={twoFactor.isBusy}
                    className="tablet:h-11 h-12"
                >
                    {text.disableTwoFactor}
                </Button>
                <Button
                    variant="ghost"
                    onClick={twoFactor.done}
                    disabled={twoFactor.isBusy}
                    className="tablet:h-11 h-12"
                >
                    {adminLabels.account.cancel}
                </Button>
            </div>
        </form>
    );
}
