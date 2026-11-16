import { useEffect, useRef } from 'react';

/**
 * Opens the native modal `<dialog>` while there is something to show (focus trap, Escape, focus return come with
 * it), puts the focus on the close button and locks the page scroll; closes it when there is nothing left.
 */
export function useLightboxDialog(isOpen: boolean) {
    const dialogRef = useRef<HTMLDialogElement>(null);
    const closeButtonRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        const dialog = dialogRef.current;

        if (!dialog) {
            return;
        }

        if (!isOpen) {
            if (dialog.open) {
                dialog.close();
            }

            return;
        }

        dialog.showModal();
        closeButtonRef.current?.focus();

        const root = document.documentElement;
        const previousOverflow = root.style.overflow;
        root.style.overflow = 'hidden';

        return () => {
            root.style.overflow = previousOverflow;
        };
    }, [isOpen]);

    return { dialogRef, closeButtonRef };
}
