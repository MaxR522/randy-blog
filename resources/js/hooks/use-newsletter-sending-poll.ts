import { usePoll } from '@inertiajs/react';
import { useEffect } from 'react';

/**
 * Reloads the newsletter every 5 seconds while it is being sent, so the delivery counts move (ADM-SUB-27).
 */
export function useNewsletterSendingPoll(isSending: boolean): void {
    const { start, stop } = usePoll(
        5000,
        { only: ['newsletter'] },
        { autoStart: false },
    );

    useEffect(() => {
        if (isSending) {
            start();
        } else {
            stop();
        }

        return stop;
    }, [isSending, start, stop]);
}
