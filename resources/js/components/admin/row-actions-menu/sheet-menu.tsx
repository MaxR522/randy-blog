import { MenuItems } from '@/components/admin/row-actions-menu/menu-items';
import { Button } from '@/components/public/button';
import type { RowAction } from '@/helpers/row-actions-menu';
import { useModalDialog } from '@/hooks/use-modal-dialog';
import { adminLabels } from '@/lib/labels.admin.fr';

type SheetMenuProps = {
    isOpen: boolean;
    label: string;
    title: string;
    actions: RowAction[];
    onSelect: (action: RowAction) => void;
    onClose: () => void;
};

/**
 * Bottom sheet in a native modal `<dialog>`: focus trap, Escape and focus return come with it.
 */
export function SheetMenu({
    isOpen,
    label,
    title,
    actions,
    onSelect,
    onClose,
}: SheetMenuProps) {
    const { dialogRef, closeOnVeilClick } = useModalDialog(isOpen, onClose);

    return (
        <dialog
            ref={dialogRef}
            aria-label={label}
            onClose={onClose}
            onClick={closeOnVeilClick}
            className="backdrop:bg-primary/50 text-primary m-0 mt-auto h-fit max-h-[85dvh] w-full max-w-none rounded-t-lg bg-white p-0"
        >
            {isOpen && (
                <div className="px-2 pt-2 pb-6">
                    <div
                        aria-hidden="true"
                        className="bg-grey-light mx-auto mt-1 mb-2 h-1 w-10 rounded-xs"
                    />
                    <p className="border-grey-light border-b px-3 pt-2 pb-3 text-[0.9375rem] font-semibold">
                        {title}
                    </p>
                    <div role="menu" aria-label={label}>
                        <MenuItems
                            actions={actions}
                            onSelect={onSelect}
                            autoFocusFirst
                            itemClassName="flex min-h-13 items-center px-3 text-body font-medium"
                        />
                    </div>
                    <Button
                        variant="secondary"
                        onClick={onClose}
                        className="mt-2 w-full"
                    >
                        {adminLabels.modal.cancel}
                    </Button>
                </div>
            )}
        </dialog>
    );
}
