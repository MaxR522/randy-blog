import { X } from 'lucide-react';
import type { MouseEvent, ReactNode, RefObject } from 'react';
import { useEffect, useId, useRef } from 'react';
import { adminLabels } from '@/lib/labels.admin.fr';
import { cn } from '@/lib/utils';

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

type ModalProps = {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: ReactNode;
};

/**
 * Full screen on phones, centred from 768 px. Its content mounts on opening, so a form starts afresh each time.
 * Children are a `ModalBody` and a `ModalFooter`, inside a form or not.
 */
export function Modal({ isOpen, onClose, title, children }: ModalProps) {
    const titleId = useId();
    const { dialogRef, closeOnVeilClick } = useModalDialog(isOpen, onClose);

    return (
        <dialog
            ref={dialogRef}
            aria-labelledby={titleId}
            onClose={onClose}
            onClick={closeOnVeilClick}
            className="backdrop:bg-primary/50 text-primary tablet:m-auto tablet:h-fit tablet:max-h-[calc(100dvh-4rem)] tablet:w-full tablet:max-w-120 tablet:rounded-lg m-0 h-dvh max-h-none w-full max-w-none bg-white p-0"
        >
            {isOpen && (
                <div className="tablet:h-auto tablet:p-6 flex h-full flex-col">
                    <div className="border-grey-light tablet:h-auto tablet:flex-row-reverse tablet:items-start tablet:justify-between tablet:gap-4 tablet:border-0 tablet:px-0 flex h-14 flex-none items-center gap-1 border-b px-1">
                        <button
                            type="button"
                            onClick={onClose}
                            aria-label={adminLabels.modal.close}
                            className="text-primary tablet:-mt-2.5 tablet:-mr-2.5 flex size-11 flex-none cursor-pointer items-center justify-center rounded-md"
                        >
                            <X
                                aria-hidden="true"
                                className="size-5.5"
                                strokeWidth={1.75}
                            />
                        </button>
                        <h2
                            id={titleId}
                            className="tablet:text-xl text-[1.0625rem] leading-[1.3] font-semibold"
                        >
                            {title}
                        </h2>
                    </div>
                    {children}
                </div>
            )}
        </dialog>
    );
}

export function ModalBody({
    className,
    children,
}: {
    className?: string;
    children: ReactNode;
}) {
    return (
        <div
            className={cn(
                'tablet:mt-5 tablet:flex-none tablet:p-0 flex-1 overflow-y-auto px-4 py-5',
                className,
            )}
        >
            {children}
        </div>
    );
}

export function ModalFooter({ children }: { children: ReactNode }) {
    return (
        <div className="border-grey-light tablet:mt-6 tablet:flex tablet:justify-end tablet:border-0 tablet:p-0 grid flex-none grid-cols-2 gap-2 border-t px-4 py-3">
            {children}
        </div>
    );
}
