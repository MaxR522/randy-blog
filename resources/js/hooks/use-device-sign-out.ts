import { router } from '@inertiajs/react';
import { useState } from 'react';
import {
    destroyOtherSessions,
    destroySession,
} from '@/actions/App/Http/Controllers/Admin/AccountSecurityController';
import type { DeviceSignOutTarget } from '@/helpers/account';

/**
 * « Appareils connectés » (ADM-SEC-5): logging out one device or all the others, after a confirmation
 * (ADM-COM-6). `ask()` opens the confirmation for a target, `confirm()` sends the logout.
 */
export function useDeviceSignOut() {
    const [target, setTarget] = useState<DeviceSignOutTarget | null>(null);
    const [isConfirming, setIsConfirming] = useState(false);

    function confirm(): void {
        const url =
            target === 'others'
                ? destroyOtherSessions.url()
                : target
                  ? destroySession.url({ device: target.key })
                  : null;

        if (!url) {
            return;
        }

        router.delete(url, {
            preserveScroll: true,
            onStart: () => setIsConfirming(true),
            onFinish: () => {
                setIsConfirming(false);
                setTarget(null);
            },
        });
    }

    return {
        target,
        isConfirming,
        ask: (next: DeviceSignOutTarget): void => setTarget(next),
        cancel: (): void => setTarget(null),
        confirm,
    };
}

export type DeviceSignOut = ReturnType<typeof useDeviceSignOut>;
