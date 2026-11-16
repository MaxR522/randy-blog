import { useEffect, useRef, useState } from 'react';
import type { Toast } from '@/helpers/flash-toasts';
import { toastDurationOf, toastOf } from '@/helpers/flash-toasts';

type FlashMessages = Parameters<typeof toastOf>[0];

/**
 * The toast of the last action's flash (ADM-COM-6), hidden after a while unless the pointer or the focus is on it
 * (WCAG 2.2.1). Each flash gets a new id, so the same message twice in a row is announced twice.
 */
export function useFlashToasts(flash: FlashMessages) {
    const [toast, setToast] = useState<Toast | null>(null);
    const [isPaused, setIsPaused] = useState(false);
    const nextId = useRef(0);

    useEffect(() => {
        const next = toastOf(flash, nextId.current + 1);

        if (!next) {
            return;
        }

        nextId.current += 1;
        setToast(next);
        setIsPaused(false);
    }, [flash]);

    // Tied to the toast, not to `flash`: any later visit brings an empty `flash`, which must not cancel the hiding.
    useEffect(() => {
        if (!toast || isPaused) {
            return;
        }

        const timeout = window.setTimeout(
            () => setToast(null),
            toastDurationOf(toast),
        );

        return () => window.clearTimeout(timeout);
    }, [toast, isPaused]);

    return {
        toast,
        pause: (): void => setIsPaused(true),
        resume: (): void => setIsPaused(false),
        dismiss: (): void => setToast(null),
    };
}

export type FlashToastsState = ReturnType<typeof useFlashToasts>;
