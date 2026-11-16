import { TwoFactorActions } from '@/components/admin/account/two-factor/two-factor-actions';
import { TextField } from '@/components/admin/text-field';
import { Button } from '@/components/public/button';
import { useFocusOnOpen } from '@/hooks/use-focus-on-open';
import type { TwoFactor } from '@/hooks/use-two-factor';
import { adminLabels } from '@/lib/labels.admin.fr';

const text = adminLabels.security;

/**
 * Second two-factor step: the QR code, the setup key and the first code.
 */
export function ConfirmTwoFactor({ twoFactor }: { twoFactor: TwoFactor }) {
    const formRef = useFocusOnOpen();
    const { qrCodeSvg, secretKey } = twoFactor.twoFactor;

    return (
        <form
            ref={formRef}
            onSubmit={twoFactor.confirm}
            className="flex flex-col gap-5"
            noValidate
        >
            <p className="text-[0.9375rem] leading-[1.55]">
                {text.twoFactorScan}
            </p>
            <div className="tablet:flex-row tablet:items-start flex flex-col gap-6">
                {qrCodeSvg && (
                    <div
                        role="img"
                        aria-label={text.twoFactorQrCode}
                        className="border-grey-light size-42 flex-none rounded-md border bg-white p-3 [&_svg]:size-full"
                        dangerouslySetInnerHTML={{
                            __html: qrCodeSvg,
                        }}
                    />
                )}
                <div className="flex max-w-80 flex-1 flex-col gap-3">
                    <p className="text-caption text-grey-dark">
                        {text.twoFactorKey}{' '}
                        <code className="text-primary font-mono break-all">
                            {secretKey}
                        </code>
                    </p>
                    <TextField
                        label={text.twoFactorCode}
                        name="code"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        placeholder="000 000"
                        maxLength={7}
                        value={twoFactor.code}
                        onChange={(event) =>
                            twoFactor.changeCode(event.target.value)
                        }
                        error={twoFactor.codeError}
                        className="text-xl tracking-[0.2em] tabular-nums"
                        required
                    />
                    <TwoFactorActions>
                        <Button
                            variant="secondary"
                            onClick={twoFactor.cancel}
                            disabled={twoFactor.isBusy}
                        >
                            {adminLabels.account.cancel}
                        </Button>
                        <Button
                            type="submit"
                            isLoading={twoFactor.isBusy}
                            disabled={twoFactor.isBusy}
                        >
                            {text.twoFactorEnable}
                        </Button>
                    </TwoFactorActions>
                </div>
            </div>
        </form>
    );
}
