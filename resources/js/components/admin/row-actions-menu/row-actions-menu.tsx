import { EllipsisVertical } from 'lucide-react';
import { useId } from 'react';
import { PopoverMenu } from '@/components/admin/row-actions-menu/popover-menu';
import { SheetMenu } from '@/components/admin/row-actions-menu/sheet-menu';
import type { RowAction } from '@/helpers/row-actions-menu';
import { useRowActionsMenu } from '@/hooks/use-row-actions-menu';
import { cn } from '@/lib/utils';

type RowActionsMenuProps = {
    /** Accessible name of the trigger, naming the row: « Actions pour « titre » ». */
    triggerLabel: string;
    /** Accessible name of the menu. */
    menuLabel: string;
    /** Heading of the bottom sheet on phones. */
    title: string;
    actions: RowAction[];
};

/**
 * Kebab button opening the actions of a row: a menu under the button from 768 px, a bottom sheet below.
 * The layout is picked when the menu opens, from the viewport width at that moment.
 */
export function RowActionsMenu({
    triggerLabel,
    menuLabel,
    title,
    actions,
}: RowActionsMenuProps) {
    const menu = useRowActionsMenu();
    const menuId = useId();

    return (
        <div className="relative inline-block text-left">
            <button
                ref={menu.triggerRef}
                type="button"
                onClick={menu.toggle}
                aria-label={triggerLabel}
                aria-haspopup="menu"
                aria-expanded={menu.isOpen}
                aria-controls={menu.mode === 'popover' ? menuId : undefined}
                className={cn(
                    'text-primary flex size-11 flex-none cursor-pointer items-center justify-center rounded-md border border-transparent',
                    menu.isOpen && 'border-primary bg-white',
                )}
            >
                <EllipsisVertical
                    aria-hidden="true"
                    className="size-5"
                    strokeWidth={2}
                />
            </button>

            {menu.mode === 'popover' && (
                <PopoverMenu
                    id={menuId}
                    label={menuLabel}
                    actions={actions}
                    triggerRef={menu.triggerRef}
                    onSelect={menu.select}
                    onClose={menu.close}
                />
            )}

            <SheetMenu
                isOpen={menu.mode === 'sheet'}
                label={menuLabel}
                title={title}
                actions={actions}
                onSelect={menu.select}
                onClose={() => menu.close(false)}
            />
        </div>
    );
}
