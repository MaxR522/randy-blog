import { useEffect, useState } from 'react';

/**
 * A « Copié » flag that turns itself off after `durationMs`, for copy buttons and their live region.
 */
export function useCopiedFlag(durationMs: number) {
    const [isCopied, setIsCopied] = useState(false);

    useEffect(() => {
        if (!isCopied) {
            return;
        }

        const timeout = window.setTimeout(() => setIsCopied(false), durationMs);

        return () => window.clearTimeout(timeout);
    }, [isCopied, durationMs]);

    return { isCopied, setIsCopied };
}
