import type { KeyboardEvent, RefObject } from 'react';
import { useEffect, useRef } from 'react';
import { menuItemIndexAfter } from '@/helpers/row-actions-menu';

/**
 * Menu pattern: focus on the first item, arrow keys, Home and End; Escape returns to the button, Tab leaves,
 * a pointer outside the menu and its button closes it.
 */
export function useMenuNavigation(
    triggerRef: RefObject<HTMLButtonElement | null>,
    onClose: (shouldReturnFocus: boolean) => void,
) {
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
        const next = menuItemIndexAfter(event.key, current, items.length);

        if (next !== null) {
            event.preventDefault();
            items[next]?.focus();
        } else if (event.key === 'Escape') {
            event.preventDefault();
            onClose(true);
        } else if (event.key === 'Tab') {
            onClose(false);
        }
    }

    return { menuRef, handleKeyDown };
}
