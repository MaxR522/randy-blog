import type { MouseEvent, RefObject } from 'react';
import { useEffect, useRef } from 'react';

/**
 * Drives a native modal `<dialog>`, which brings the focus trap, Escape and the focus return.
 * Focus goes to the element marked `data-autofocus`, otherwise the browser would pick the close button.
 */
export function useModalDialog(
    isOpen: boolean,
    onClose: () => void,
): {
    dialogRef: RefObject<HTMLDialogElement | null>;
    closeOnVeilClick: (event: MouseEvent<HTMLDialogElement>) => void;
} {
    const dialogRef = useRef<HTMLDialogElement>(null);

    useEffect(() => {
        const dialog = dialogRef.current;

        if (!dialog || !isOpen) {
            return;
        }

        dialog.showModal();
        dialog.querySelector<HTMLElement>('[data-autofocus]')?.focus();
        document.documentElement.style.overflow = 'hidden';

        return () => {
            document.documentElement.style.overflow = '';

            if (dialog.open) {
                dialog.close();
            }
        };
    }, [isOpen]);

    function closeOnVeilClick(event: MouseEvent<HTMLDialogElement>): void {
        if (event.target === dialogRef.current) {
            onClose();
        }
    }

    return { dialogRef, closeOnVeilClick };
}
