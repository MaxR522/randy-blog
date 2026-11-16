import { router } from '@inertiajs/react';
import type { MouseEvent } from 'react';
import { useEffect, useRef } from 'react';
import { LAPTOP_QUERY } from '@/helpers/admin-shell';

/**
 * The phone sidebar in a native modal `<dialog>`: opened while `isOpen`, page scroll locked, closed on a click on
 * the veil, on navigation, and when the window grows to the desktop layout.
 */
export function useSidebarDrawer(isOpen: boolean, onClose: () => void) {
    const dialogRef = useRef<HTMLDialogElement>(null);

    useEffect(() => {
        const dialog = dialogRef.current;

        if (!dialog || !isOpen) {
            return;
        }

        dialog.showModal();
        document.documentElement.style.overflow = 'hidden';

        const removeNavigateListener = router.on('navigate', onClose);
        const laptopQuery = window.matchMedia(LAPTOP_QUERY);
        laptopQuery.addEventListener('change', onClose);

        return () => {
            removeNavigateListener();
            laptopQuery.removeEventListener('change', onClose);
            document.documentElement.style.overflow = '';

            if (dialog.open) {
                dialog.close();
            }
        };
    }, [isOpen, onClose]);

    function handleClick(event: MouseEvent<HTMLDialogElement>): void {
        if (event.target === dialogRef.current) {
            onClose();
        }
    }

    return { dialogRef, handleClick };
}
