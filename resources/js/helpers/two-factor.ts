import type { AccountTwoFactor } from '@/types/admin';

/** How long « Codes copiés » stays on the button, in milliseconds. */
export const CODES_COPIED_MS = 2000;

/** Which screen the two-factor editor shows: the recovery codes once, then by the account's 2FA state. */
export type TwoFactorStep = 'codes' | 'manage' | 'confirm' | 'start';

/** The screen of the two-factor editor: fresh recovery codes first, then managing, confirming or starting 2FA. */
export function twoFactorStepOf(
    twoFactor: AccountTwoFactor,
    recoveryCodes: string[] | undefined,
): TwoFactorStep {
    if (recoveryCodes && recoveryCodes.length > 0) {
        return 'codes';
    }

    if (twoFactor.enabled) {
        return 'manage';
    }

    return twoFactor.pending ? 'confirm' : 'start';
}

/** Save the text as a plain-text file through a temporary link. */
export function downloadText(content: string, fileName: string): void {
    const url = URL.createObjectURL(
        new Blob([content], { type: 'text/plain' }),
    );
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
}
