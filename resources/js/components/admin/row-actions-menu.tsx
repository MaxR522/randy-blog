import { Link, router } from '@inertiajs/react';
import { EllipsisVertical } from 'lucide-react';
import type { KeyboardEvent, RefObject } from 'react';
import { Fragment, useEffect, useId, useRef, useState } from 'react';
import { useModalDialog } from '@/components/admin/modal';
import { Button } from '@/components/public/button';
import { adminLabels } from '@/lib/labels.admin.fr';
import { cn } from '@/lib/utils';

const TABLET_QUERY = '(min-width: 48rem)';

export type RowAction = {
    key: string;
    label: string;
    /** An Inertia link, unless `opensInNewTab`. */
    href?: string;
    opensInNewTab?: boolean;
    onSelect?: () => void;
    /** Red, after a hairline, as the last item. */
    isDanger?: boolean;
};

type RowActionsMenuProps = {
    /** Accessible name of the trigger, naming the row: « Actions pour « titre » ». */
    triggerLabel: string;
    /** Accessible name of the menu. */
    menuLabel: string;
    /** Heading of the bottom sheet on phones. */
    title: string;
    actions: RowAction[];
};

type MenuMode = 'popover' | 'sheet' | null;

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
    const [mode, setMode] = useState<MenuMode>(null);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const menuId = useId();

    function open(): void {
        setMode(window.matchMedia(TABLET_QUERY).matches ? 'popover' : 'sheet');
    }

    function close(shouldReturnFocus: boolean): void {
        setMode(null);

        if (shouldReturnFocus) {
            triggerRef.current?.focus();
        }
    }

    function select(action: RowAction): void {
        // Unmounting a link during its own click cancels it: the browser only follows a link still in the page.
        if (action.opensInNewTab) {
            window.setTimeout(() => close(true));

            return;
        }

        close(true);
        action.onSelect?.();
    }

    useEffect(() => {
        if (mode === null) {
            return;
        }

        return router.on('navigate', () => setMode(null));
    }, [mode]);

    return (
        <div className="relative inline-block text-left">
            <button
                ref={triggerRef}
                type="button"
                onClick={() => (mode === null ? open() : close(true))}
                aria-label={triggerLabel}
                aria-haspopup="menu"
                aria-expanded={mode !== null}
                aria-controls={mode === 'popover' ? menuId : undefined}
                className={cn(
                    'text-primary flex size-11 flex-none cursor-pointer items-center justify-center rounded-md border border-transparent',
                    mode !== null && 'border-primary bg-white',
                )}
            >
                <EllipsisVertical
                    aria-hidden="true"
                    className="size-5"
                    strokeWidth={2}
                />
            </button>

            {mode === 'popover' && (
                <PopoverMenu
                    id={menuId}
                    label={menuLabel}
                    actions={actions}
                    triggerRef={triggerRef}
                    onSelect={select}
                    onClose={close}
                />
            )}

            <SheetMenu
                isOpen={mode === 'sheet'}
                label={menuLabel}
                title={title}
                actions={actions}
                onSelect={select}
                onClose={() => close(false)}
            />
        </div>
    );
}

type MenuListProps = {
    actions: RowAction[];
    onSelect: (action: RowAction) => void;
    itemClassName: string;
    /** Focus the first item on opening. */
    autoFocusFirst?: boolean;
};

function MenuItems({
    actions,
    onSelect,
    itemClassName,
    autoFocusFirst = false,
}: MenuListProps) {
    return actions.map((action, index) => {
        const className = cn(
            itemClassName,
            action.isDanger ? 'text-red-700' : 'text-primary',
        );
        const focusProps =
            autoFocusFirst && index === 0 ? { 'data-autofocus': true } : {};
        let item;

        if (action.href && action.opensInNewTab) {
            item = (
                <a
                    href={action.href}
                    target="_blank"
                    rel="noopener"
                    role="menuitem"
                    onClick={() => onSelect(action)}
                    className={className}
                    {...focusProps}
                >
                    {action.label}
                    <span className="sr-only"> {adminLabels.shell.newTab}</span>
                </a>
            );
        } else if (action.href) {
            item = (
                <Link
                    href={action.href}
                    role="menuitem"
                    onClick={() => onSelect(action)}
                    className={className}
                    {...focusProps}
                >
                    {action.label}
                </Link>
            );
        } else {
            item = (
                <button
                    type="button"
                    role="menuitem"
                    onClick={() => onSelect(action)}
                    className={cn(className, 'w-full cursor-pointer text-left')}
                    {...focusProps}
                >
                    {action.label}
                </button>
            );
        }

        return (
            <Fragment key={action.key}>
                {action.isDanger && index > 0 && (
                    <div
                        role="separator"
                        className="border-grey-light my-1.5 border-t"
                    />
                )}
                {item}
            </Fragment>
        );
    });
}

type PopoverMenuProps = {
    id: string;
    label: string;
    actions: RowAction[];
    triggerRef: RefObject<HTMLButtonElement | null>;
    onSelect: (action: RowAction) => void;
    onClose: (shouldReturnFocus: boolean) => void;
};

/**
 * Menu pattern: focus on the first item, arrow keys, Home and End; Escape returns to the button, Tab leaves.
 */
function PopoverMenu({
    id,
    label,
    actions,
    triggerRef,
    onSelect,
    onClose,
}: PopoverMenuProps) {
    const menuRef = useRef<HTMLDivElement>(null);
    const onCloseRef = useRef(onClose);

    useEffect(() => {
        onCloseRef.current = onClose;
    });

    useEffect(() => {
        menuRef.current
            ?.querySelector<HTMLElement>('[role="menuitem"]')
            ?.focus();

        function closeOnOutsidePointer(event: PointerEvent): void {
            const target = event.target as Node;

            if (
                !menuRef.current?.contains(target) &&
                !triggerRef.current?.contains(target)
            ) {
                onCloseRef.current(false);
            }
        }

        document.addEventListener('pointerdown', closeOnOutsidePointer);

        return () =>
            document.removeEventListener('pointerdown', closeOnOutsidePointer);
    }, [triggerRef]);

    function handleKeyDown(event: KeyboardEvent<HTMLDivElement>): void {
        const items = Array.from(
            menuRef.current?.querySelectorAll<HTMLElement>(
                '[role="menuitem"]',
            ) ?? [],
        );
        const current = items.indexOf(document.activeElement as HTMLElement);
        const moves: Record<string, number> = {
            ArrowDown: (current + 1) % items.length,
            ArrowUp: (current - 1 + items.length) % items.length,
            Home: 0,
            End: items.length - 1,
        };

        if (event.key in moves) {
            event.preventDefault();
            items[moves[event.key]]?.focus();
        } else if (event.key === 'Escape') {
            event.preventDefault();
            onClose(true);
        } else if (event.key === 'Tab') {
            onClose(false);
        }
    }

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
function SheetMenu({
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
