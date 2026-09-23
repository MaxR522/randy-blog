import { useEffect, useState } from 'react';

/**
 * Set once the first page has mounted in the browser, so the initial load is not announced.
 */
let hasMountedOnce = false;

type PageAnnouncerProps = {
    mainId: string;
};

/**
 * After an Inertia visit, moves focus to the main content and announces the new page heading,
 * since a screen reader otherwise says nothing when a client-side link is followed.
 * The public layout remounts on every visit, so this runs once per page.
 */
export function PageAnnouncer({ mainId }: PageAnnouncerProps) {
    const [announcement, setAnnouncement] = useState('');

    useEffect(() => {
        if (!hasMountedOnce) {
            hasMountedOnce = true;

            return;
        }

        const main = document.getElementById(mainId);

        if (!main || window.location.hash !== '') {
            return;
        }

        main.focus({ preventScroll: true });

        const timeout = window.setTimeout(() => {
            setAnnouncement(
                main.querySelector('h1')?.textContent?.trim() ?? document.title,
            );
        }, 100);

        return () => window.clearTimeout(timeout);
    }, [mainId]);

    return (
        <div aria-live="polite" aria-atomic="true" className="sr-only">
            {announcement}
        </div>
    );
}
