import { router, usePage } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import { listUrl, listVisitOptions } from '@/helpers/list-url';

const DEBOUNCE_MILLISECONDS = 300;

/**
 * Search of a list bound to `?q=` (ADM-COM-5): the typed text, and a visit 300 ms after the last keystroke.
 * The visit keeps the page state, so the input keeps its focus.
 */
export function useListSearch(value: string) {
    const { url } = usePage();
    const [query, setQuery] = useState(value);
    const timeout = useRef<number | undefined>(undefined);

    useEffect(() => () => window.clearTimeout(timeout.current), []);

    function changeQuery(search: string): void {
        setQuery(search);
        window.clearTimeout(timeout.current);
        timeout.current = window.setTimeout(() => {
            router.get(
                listUrl(url, { q: search.trim() || null }),
                {},
                listVisitOptions,
            );
        }, DEBOUNCE_MILLISECONDS);
    }

    return { query, changeQuery };
}

export type ListSearchState = ReturnType<typeof useListSearch>;
