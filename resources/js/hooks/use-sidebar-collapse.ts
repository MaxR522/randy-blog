import { useState } from 'react';
import { readIsCollapsed, storeIsCollapsed } from '@/helpers/admin-shell';

/**
 * The desktop sidebar, collapsed to its icons or not, remembered in `localStorage`. The admin is client-rendered
 * only (`HandleInertiaRequests::$withoutSsr`), so it can read the storage on first render.
 */
export function useSidebarCollapse() {
    const [isCollapsed, setIsCollapsed] = useState(readIsCollapsed);

    function toggle(): void {
        storeIsCollapsed(!isCollapsed);
        setIsCollapsed(!isCollapsed);
    }

    return { isCollapsed, toggle };
}
