import { router } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import type { MenuMode, RowAction } from '@/helpers/row-actions-menu';
import { menuModeForViewport } from '@/helpers/row-actions-menu';

/**
 * Open and close state of a row actions menu. The layout is picked when the menu opens; any visit closes it.
 */
export function useRowActionsMenu() {
    const [mode, setMode] = useState<MenuMode>(null);
    const triggerRef = useRef<HTMLButtonElement>(null);

    function close(shouldReturnFocus: boolean): void {
        setMode(null);

        if (shouldReturnFocus) {
            triggerRef.current?.focus();
        }
    }

    function toggle(): void {
        if (mode === null) {
            setMode(menuModeForViewport());
        } else {
            close(true);
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

    return {
        mode,
        isOpen: mode !== null,
        triggerRef,
        toggle,
        close,
        select,
    };
}
