import { router } from '@inertiajs/react';
import { X } from 'lucide-react';
import type { MouseEvent } from 'react';
import { useEffect, useRef } from 'react';
import { SidebarNav } from '@/components/admin/sidebar-nav';
import { adminLabels } from '@/lib/labels.admin.fr';

const text = adminLabels.shell;

const LAPTOP_QUERY = '(min-width: 64rem)';

type SidebarDrawerProps = {
    isOpen: boolean;
    onClose: () => void;
};

/**
 * Sidebar under 1024 px, in a native modal `<dialog>` (focus trap, Escape, focus return).
 * Closes on a click on the veil, on navigation, and when the window grows to the desktop layout.
 */
export function SidebarDrawer({ isOpen, onClose }: SidebarDrawerProps) {
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

    return (
        <dialog
            ref={dialogRef}
            aria-label={text.drawerNav}
            onClose={onClose}
            onClick={handleClick}
            className="border-grey-light backdrop:bg-primary/50 m-0 h-dvh max-h-none w-70 max-w-none border-r bg-white p-0"
        >
            <div className="flex h-full flex-col px-3 pt-1.5 pb-4">
                <div className="mb-2 flex h-11 items-center justify-between">
                    <span className="pl-0.5 text-[1.0625rem] font-semibold">
                        {text.menu}
                    </span>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label={text.closeMenu}
                        className="text-primary flex size-11 cursor-pointer items-center justify-center rounded-md"
                    >
                        <X
                            aria-hidden="true"
                            className="size-5.5"
                            strokeWidth={1.75}
                        />
                    </button>
                </div>
                {isOpen && <SidebarNav label={text.drawerNav} />}
            </div>
        </dialog>
    );
}
