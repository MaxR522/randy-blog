import { useEffect, useRef, useState } from 'react';
import { labels } from '@/lib/labels.fr';

/**
 * After « Voir plus » loads more cards, announce how many arrived (and when none are left) and move focus to the
 * first new title, since the button may disappear and would otherwise drop focus to the page (A11Y-LIVE).
 * `markLoadStart()` is called just before the load.
 */
export function useLoadMoreAnnouncement(count: number, hasNextPage: boolean) {
    const listRef = useRef<HTMLUListElement>(null);
    const countBeforeLoadRef = useRef<number | null>(null);
    const [announcement, setAnnouncement] = useState('');

    useEffect(() => {
        const countBeforeLoad = countBeforeLoadRef.current;

        if (countBeforeLoad === null || count <= countBeforeLoad) {
            return;
        }

        countBeforeLoadRef.current = null;
        listRef.current?.children[countBeforeLoad]
            ?.querySelector<HTMLAnchorElement>('h3 a')
            ?.focus();

        const loaded = labels.a11y.moreArticlesLoaded(count - countBeforeLoad);

        setAnnouncement(
            hasNextPage ? loaded : `${loaded}. ${labels.a11y.allArticlesShown}`,
        );
    }, [count, hasNextPage]);

    return {
        listRef,
        announcement,
        markLoadStart: (): void => {
            countBeforeLoadRef.current = count;
        },
    };
}
