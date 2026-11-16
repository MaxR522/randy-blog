/** Id of the admin `<main>`, target of the skip link and of the focus when a dialog's trigger is gone. */
export const MAIN_ID = 'contenu';

/** `localStorage` key of the collapsed desktop sidebar. */
export const COLLAPSED_STORAGE_KEY = 'admin-sidebar-collapsed';

/** From this width the sidebar shows beside the page and the phone drawer closes. */
export const LAPTOP_QUERY = '(min-width: 64rem)';

/** Whether the desktop sidebar was left collapsed; `false` when storage is blocked. */
export function readIsCollapsed(): boolean {
    try {
        return window.localStorage.getItem(COLLAPSED_STORAGE_KEY) === '1';
    } catch {
        return false;
    }
}

/** Remembers the desktop sidebar state; storage can be blocked, and the sidebar then just forgets it. */
export function storeIsCollapsed(isCollapsed: boolean): void {
    try {
        window.localStorage.setItem(
            COLLAPSED_STORAGE_KEY,
            isCollapsed ? '1' : '0',
        );
    } catch {
        // Storage can be blocked: the sidebar just forgets its state.
    }
}
