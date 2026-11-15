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

/** How the menu is shown: a popover under the button, a bottom sheet, or closed. */
export type MenuMode = 'popover' | 'sheet' | null;

const TABLET_QUERY = '(min-width: 48rem)';

/**
 * Layout of the menu for the viewport width at this moment: popover from 768 px, bottom sheet below.
 */
export function menuModeForViewport(): 'popover' | 'sheet' {
    return window.matchMedia(TABLET_QUERY).matches ? 'popover' : 'sheet';
}

/**
 * Index of the item a menu key moves to (arrows wrap around, Home and End), or `null` for any other key.
 */
export function menuItemIndexAfter(
    key: string,
    current: number,
    count: number,
): number | null {
    const moves: Record<string, number> = {
        ArrowDown: (current + 1) % count,
        ArrowUp: (current - 1 + count) % count,
        Home: 0,
        End: count - 1,
    };

    return key in moves ? moves[key] : null;
}
