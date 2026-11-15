import type { RefObject } from 'react';
import { MenuItems } from '@/components/admin/row-actions-menu/menu-items';
import type { RowAction } from '@/helpers/row-actions-menu';
import { useMenuNavigation } from '@/hooks/use-menu-navigation';

type PopoverMenuProps = {
    id: string;
    label: string;
    actions: RowAction[];
    triggerRef: RefObject<HTMLButtonElement | null>;
    onSelect: (action: RowAction) => void;
    onClose: (shouldReturnFocus: boolean) => void;
};

/**
 * Menu under the kebab button from 768 px, with the menu keyboard pattern.
 */
export function PopoverMenu({
    id,
    label,
    actions,
    triggerRef,
    onSelect,
    onClose,
}: PopoverMenuProps) {
    const { menuRef, handleKeyDown } = useMenuNavigation(triggerRef, onClose);

    return (
        <div
            ref={menuRef}
            id={id}
            role="menu"
            aria-label={label}
            onKeyDown={handleKeyDown}
            className="border-grey-light absolute top-full right-0 z-20 mt-1 w-55 rounded-md border bg-white p-1.5 shadow-[0_1px_0_rgb(0_0_0/0.04),0_8px_24px_-12px_rgb(0_0_0/0.18)]"
        >
            <MenuItems
                actions={actions}
                onSelect={onSelect}
                itemClassName="hover:bg-grey-subtle flex h-11 items-center rounded-md px-3.5 text-sm font-medium"
            />
        </div>
    );
}
