import { X } from 'lucide-react';
import { SidebarNav } from '@/components/admin/sidebar-nav';
import { useSidebarDrawer } from '@/hooks/use-sidebar-drawer';
import { adminLabels } from '@/lib/labels.admin.fr';

const text = adminLabels.shell;

type SidebarDrawerProps = {
    isOpen: boolean;
    onClose: () => void;
    /** The current page path, from the layout. */
    currentUrl: string;
};

/**
 * Sidebar under 1024 px, in a native modal `<dialog>` (focus trap, Escape, focus return).
 * Closes on a click on the veil, on navigation, and when the window grows to the desktop layout.
 */
export function SidebarDrawer({
    isOpen,
    onClose,
    currentUrl,
}: SidebarDrawerProps) {
    const { dialogRef, handleClick } = useSidebarDrawer(isOpen, onClose);

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
                {isOpen && (
                    <SidebarNav
                        label={text.drawerNav}
                        currentUrl={currentUrl}
                    />
                )}
            </div>
        </dialog>
    );
}
