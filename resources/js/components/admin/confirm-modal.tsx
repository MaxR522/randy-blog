import { useId } from 'react';
import { useModalDialog } from '@/components/admin/modal';
import { Button } from '@/components/public/button';
import { adminLabels } from '@/lib/labels.admin.fr';

type ConfirmModalProps = {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    isConfirming?: boolean;
    title: string;
    /** Optional: a deletion may have nothing more to say than its title. */
    description?: string;
    confirmLabel: string;
};

/**
 * Confirmation of a destructive action. Focus starts on « Annuler »; stays a card on phones.
 */
export function ConfirmModal({
    isOpen,
    onClose,
    onConfirm,
    isConfirming = false,
    title,
    description,
    confirmLabel,
}: ConfirmModalProps) {
    const id = useId();
    const titleId = `${id}-titre`;
    const descriptionId = `${id}-description`;
    const { dialogRef, closeOnVeilClick } = useModalDialog(isOpen, onClose);

    return (
        <dialog
            ref={dialogRef}
            role="alertdialog"
            aria-labelledby={titleId}
            aria-describedby={description ? descriptionId : undefined}
            onClose={onClose}
            onClick={closeOnVeilClick}
            className="backdrop:bg-primary/50 text-primary tablet:w-full tablet:max-w-120 m-auto w-[calc(100%-2rem)] max-w-none rounded-lg bg-white p-0"
        >
            {isOpen && (
                <div className="tablet:p-6 p-5">
                    <h2
                        id={titleId}
                        className="tablet:text-xl text-lg leading-[1.3] font-semibold"
                    >
                        {title}
                    </h2>
                    {description && (
                        <p
                            id={descriptionId}
                            className="tablet:mt-3 mt-2.5 text-[0.9375rem] leading-[1.55]"
                        >
                            {description}
                        </p>
                    )}
                    <div className="tablet:mt-6 tablet:flex-row tablet:justify-end mt-5 flex flex-col-reverse gap-2">
                        <Button
                            variant="secondary"
                            onClick={onClose}
                            data-autofocus
                            className="tablet:h-11 h-12"
                        >
                            {adminLabels.modal.cancel}
                        </Button>
                        <Button
                            variant="danger"
                            onClick={onConfirm}
                            isLoading={isConfirming}
                            disabled={isConfirming}
                            className="tablet:h-11 h-12"
                        >
                            {confirmLabel}
                        </Button>
                    </div>
                </div>
            )}
        </dialog>
    );
}
