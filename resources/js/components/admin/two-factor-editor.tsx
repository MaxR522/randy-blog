import { router, useForm, usePage } from '@inertiajs/react';
import type { FormEvent } from 'react';
import { useEffect, useState } from 'react';
import {
    cancelTwoFactor,
    confirmTwoFactor,
    disableTwoFactor,
    enableTwoFactor,
    regenerateRecoveryCodes,
} from '@/actions/App/Http/Controllers/Admin/AccountSecurityController';
import type { EditorProps } from '@/components/admin/account-row';
import { useFocusOnOpen } from '@/components/admin/account-row';
import { PasswordField } from '@/components/admin/password-field';
import { TextField } from '@/components/admin/text-field';
import { Button } from '@/components/public/button';
import { adminLabels } from '@/lib/labels.admin.fr';
import type { AccountTwoFactor } from '@/types/admin';

const text = adminLabels.security;
const actionsClasses =
    'tablet:flex tablet:justify-end grid grid-cols-2 gap-2 [&>button]:tablet:h-11 [&>button]:h-12';

/**
 * « Authentification à deux facteurs (2FA) » (ADM-SEC-4): password, then QR code and first code, then the recovery
 * codes, shown once. Once on, the password regenerates the codes or turns 2FA off.
 */
export function TwoFactorEditor({
    twoFactor,
    onDirtyChange,
    onDone,
}: EditorProps & { twoFactor: AccountTwoFactor }) {
    const recoveryCodes = usePage().flash.recoveryCodes;

    if (recoveryCodes && recoveryCodes.length > 0) {
        return <RecoveryCodes codes={recoveryCodes} onDone={onDone} />;
    }

    if (twoFactor.enabled) {
        return (
            <ManageTwoFactor onDirtyChange={onDirtyChange} onDone={onDone} />
        );
    }

    if (twoFactor.pending) {
        return (
            <ConfirmTwoFactor
                twoFactor={twoFactor}
                onDirtyChange={onDirtyChange}
                onDone={onDone}
            />
        );
    }

    return <StartTwoFactor onDirtyChange={onDirtyChange} onDone={onDone} />;
}

function StartTwoFactor({ onDirtyChange, onDone }: EditorProps) {
    const form = useForm({ password: '' });
    const formRef = useFocusOnOpen();

    useEffect(() => onDirtyChange(form.isDirty), [form.isDirty, onDirtyChange]);

    function submit(event: FormEvent<HTMLFormElement>): void {
        event.preventDefault();
        form.post(enableTwoFactor.url(), {
            preserveScroll: true,
            onFinish: () => form.reset('password'),
        });
    }

    return (
        <form
            ref={formRef}
            onSubmit={submit}
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
                value={form.data.password}
                onChange={(event) =>
                    form.setData('password', event.target.value)
                }
                error={form.errors.password}
                required
            />
            <div className={actionsClasses}>
                <Button
                    variant="secondary"
                    onClick={onDone}
                    disabled={form.processing}
                >
                    {adminLabels.account.cancel}
                </Button>
                <Button
                    type="submit"
                    isLoading={form.processing}
                    disabled={form.processing}
                >
                    {text.twoFactorContinue}
                </Button>
            </div>
        </form>
    );
}

function ConfirmTwoFactor({
    twoFactor,
    onDirtyChange,
    onDone,
}: EditorProps & { twoFactor: AccountTwoFactor }) {
    const form = useForm({ code: '' });
    const formRef = useFocusOnOpen();

    useEffect(() => onDirtyChange(true), [onDirtyChange]);

    function submit(event: FormEvent<HTMLFormElement>): void {
        event.preventDefault();
        form.put(confirmTwoFactor.url(), {
            preserveScroll: true,
            onError: () => form.reset('code'),
        });
    }

    function cancel(): void {
        router.delete(cancelTwoFactor.url(), {
            preserveScroll: true,
            onSuccess: onDone,
        });
    }

    return (
        <form
            ref={formRef}
            onSubmit={submit}
            className="flex flex-col gap-5"
            noValidate
        >
            <p className="text-[0.9375rem] leading-[1.55]">
                {text.twoFactorScan}
            </p>
            <div className="tablet:flex-row tablet:items-start flex flex-col gap-6">
                {twoFactor.qrCodeSvg && (
                    <div
                        role="img"
                        aria-label={text.twoFactorQrCode}
                        className="border-grey-light size-42 flex-none rounded-md border bg-white p-3 [&_svg]:size-full"
                        dangerouslySetInnerHTML={{
                            __html: twoFactor.qrCodeSvg,
                        }}
                    />
                )}
                <div className="flex max-w-80 flex-1 flex-col gap-3">
                    <p className="text-caption text-grey-dark">
                        {text.twoFactorKey}{' '}
                        <code className="text-primary font-mono break-all">
                            {twoFactor.secretKey}
                        </code>
                    </p>
                    <TextField
                        label={text.twoFactorCode}
                        name="code"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        placeholder="000 000"
                        maxLength={7}
                        value={form.data.code}
                        onChange={(event) =>
                            form.setData('code', event.target.value)
                        }
                        error={form.errors.code}
                        className="text-xl tracking-[0.2em] tabular-nums"
                        required
                    />
                    <div className={actionsClasses}>
                        <Button
                            variant="secondary"
                            onClick={cancel}
                            disabled={form.processing}
                        >
                            {adminLabels.account.cancel}
                        </Button>
                        <Button
                            type="submit"
                            isLoading={form.processing}
                            disabled={form.processing}
                        >
                            {text.twoFactorEnable}
                        </Button>
                    </div>
                </div>
            </div>
        </form>
    );
}

function ManageTwoFactor({ onDirtyChange, onDone }: EditorProps) {
    const form = useForm({ password: '' });
    const formRef = useFocusOnOpen();

    useEffect(() => onDirtyChange(form.isDirty), [form.isDirty, onDirtyChange]);

    function regenerate(event: FormEvent<HTMLFormElement>): void {
        event.preventDefault();
        form.post(regenerateRecoveryCodes.url(), {
            preserveScroll: true,
            onFinish: () => form.reset('password'),
        });
    }

    function disable(): void {
        form.delete(disableTwoFactor.url(), {
            preserveScroll: true,
            onSuccess: onDone,
            onFinish: () => form.reset('password'),
        });
    }

    return (
        <form
            ref={formRef}
            onSubmit={regenerate}
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
                value={form.data.password}
                onChange={(event) =>
                    form.setData('password', event.target.value)
                }
                error={form.errors.password}
                required
            />
            <div className="flex flex-col gap-2">
                <Button
                    type="submit"
                    variant="secondary"
                    isLoading={form.processing}
                    disabled={form.processing}
                    className="tablet:h-11 h-12"
                >
                    {text.regenerateCodes}
                </Button>
                <Button
                    variant="danger"
                    onClick={disable}
                    disabled={form.processing}
                    className="tablet:h-11 h-12"
                >
                    {text.disableTwoFactor}
                </Button>
                <Button
                    variant="ghost"
                    onClick={onDone}
                    disabled={form.processing}
                    className="tablet:h-11 h-12"
                >
                    {adminLabels.account.cancel}
                </Button>
            </div>
        </form>
    );
}

function RecoveryCodes({
    codes,
    onDone,
}: {
    codes: string[];
    onDone: () => void;
}) {
    const [isCopied, setIsCopied] = useState(false);
    const codesText = codes.join('\n');

    async function copy(): Promise<void> {
        await navigator.clipboard.writeText(codesText);
        setIsCopied(true);
        window.setTimeout(() => setIsCopied(false), 2000);
    }

    function download(): void {
        const url = URL.createObjectURL(
            new Blob([`${codesText}\n`], { type: 'text/plain' }),
        );
        const link = document.createElement('a');
        link.href = url;
        link.download = text.codesFileName;
        link.click();
        URL.revokeObjectURL(url);
    }

    return (
        <div className="flex flex-col gap-4">
            <div className="border-grey-light tablet:p-5 rounded-md border p-4">
                <h3 className="mb-1 text-[0.9375rem] font-semibold">
                    {text.recoveryCodes}
                </h3>
                <p className="text-caption text-grey-dark mb-3.5">
                    {text.recoveryCodesHelp}
                </p>
                <ul className="tablet:grid-cols-2 laptop:grid-cols-3 grid grid-cols-1 gap-x-4 gap-y-2 font-mono text-sm leading-5.5">
                    {codes.map((code) => (
                        <li key={code} className="break-all">
                            {code}
                        </li>
                    ))}
                </ul>
                <div className="mt-4 flex gap-2">
                    <Button variant="secondary" onClick={copy}>
                        {isCopied ? text.codesCopied : text.copyCodes}
                    </Button>
                    <Button variant="secondary" onClick={download}>
                        {text.downloadCodes}
                    </Button>
                </div>
                <p role="status" className="sr-only">
                    {isCopied ? text.codesCopied : ''}
                </p>
            </div>
            <div className="tablet:justify-end flex">
                <Button onClick={onDone} className="tablet:h-11 h-12">
                    {text.done}
                </Button>
            </div>
        </div>
    );
}
