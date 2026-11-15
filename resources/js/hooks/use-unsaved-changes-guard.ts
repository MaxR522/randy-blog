import { router } from '@inertiajs/react';
import { useEffect } from 'react';

/**
 * Warn before leaving with unsaved changes (ADM-COM-7): the browser's own prompt for a reload or a closed tab,
 * the confirm modal for a visit inside the admin.
 */
export function useUnsavedChangesGuard(
    isDirty: boolean,
    isLeavingRef: { current: boolean },
    onBlockedVisit: (url: string) => void,
): void {
    useEffect(() => {
        if (!isDirty) {
            return;
        }

        function onBeforeUnload(event: BeforeUnloadEvent): void {
            event.preventDefault();
        }

        window.addEventListener('beforeunload', onBeforeUnload);

        const removeBeforeListener = router.on('before', (event) => {
            const { visit } = event.detail;

            if (visit.method !== 'get' || isLeavingRef.current) {
                return;
            }

            event.preventDefault();
            onBlockedVisit(visit.url.href);
        });

        return () => {
            window.removeEventListener('beforeunload', onBeforeUnload);
            removeBeforeListener();
        };
    }, [isDirty, isLeavingRef, onBlockedVisit]);
}
