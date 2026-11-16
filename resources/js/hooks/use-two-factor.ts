import { router, useForm } from '@inertiajs/react';
import type { FormEvent } from 'react';
import {
    cancelTwoFactor,
    confirmTwoFactor,
    disableTwoFactor,
    enableTwoFactor,
    regenerateRecoveryCodes,
} from '@/actions/App/Http/Controllers/Admin/AccountSecurityController';
import { twoFactorStepOf } from '@/helpers/two-factor';
import type { AccountTwoFactor } from '@/types/admin';

/**
 * « Authentification à deux facteurs (2FA) » (ADM-SEC-4): password, then QR code and first code, then the recovery
 * codes, shown once. Once on, the password regenerates the codes or turns 2FA off. A pending setup and the
 * recovery codes on screen count as unsaved, so leaving asks first. `start()` empties the fields each time the
 * editor opens.
 */
export function useTwoFactor(
    twoFactor: AccountTwoFactor,
    recoveryCodes: string[] | undefined,
    onDone: () => void,
) {
    const passwordForm = useForm({ password: '' });
    const codeForm = useForm({ code: '' });
    const step = twoFactorStepOf(twoFactor, recoveryCodes);

    function start(): void {
        passwordForm.setDefaults({ password: '' });
        passwordForm.setData({ password: '' });
        passwordForm.clearErrors();
        codeForm.setDefaults({ code: '' });
        codeForm.setData({ code: '' });
        codeForm.clearErrors();
    }

    function enable(event: FormEvent<HTMLFormElement>): void {
        event.preventDefault();
        passwordForm.post(enableTwoFactor.url(), {
            preserveScroll: true,
            onFinish: () => passwordForm.reset('password'),
        });
    }

    function confirm(event: FormEvent<HTMLFormElement>): void {
        event.preventDefault();
        codeForm.put(confirmTwoFactor.url(), {
            preserveScroll: true,
            onError: () => codeForm.reset('code'),
        });
    }

    function cancel(): void {
        router.delete(cancelTwoFactor.url(), {
            preserveScroll: true,
            onSuccess: onDone,
        });
    }

    function regenerate(event: FormEvent<HTMLFormElement>): void {
        event.preventDefault();
        passwordForm.post(regenerateRecoveryCodes.url(), {
            preserveScroll: true,
            onFinish: () => passwordForm.reset('password'),
        });
    }

    function disable(): void {
        passwordForm.delete(disableTwoFactor.url(), {
            preserveScroll: true,
            onSuccess: onDone,
            onFinish: () => passwordForm.reset('password'),
        });
    }

    return {
        step,
        twoFactor,
        recoveryCodes: recoveryCodes ?? [],
        password: passwordForm.data.password,
        passwordError: passwordForm.errors.password,
        code: codeForm.data.code,
        codeError: codeForm.errors.code,
        isBusy: passwordForm.processing || codeForm.processing,
        isDirty: step === 'confirm' || step === 'codes' || passwordForm.isDirty,
        changePassword: (password: string): void =>
            passwordForm.setData('password', password),
        changeCode: (code: string): void => codeForm.setData('code', code),
        start,
        enable,
        confirm,
        cancel,
        regenerate,
        disable,
        done: onDone,
    };
}

export type TwoFactor = ReturnType<typeof useTwoFactor>;
