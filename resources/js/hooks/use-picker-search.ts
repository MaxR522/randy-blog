import { useEffect, useRef, useState } from 'react';

const DEBOUNCE_MILLISECONDS = 300;

/**
 * The typed text of a picker's search field, and `onSearch` with the trimmed text 300 ms after the last keystroke.
 */
export function usePickerSearch(onSearch: (query: string) => void) {
    const [query, setQuery] = useState('');
    const timeout = useRef<number | undefined>(undefined);

    useEffect(() => () => window.clearTimeout(timeout.current), []);

    function changeQuery(search: string): void {
        setQuery(search);
        window.clearTimeout(timeout.current);
        timeout.current = window.setTimeout(
            () => onSearch(search.trim()),
            DEBOUNCE_MILLISECONDS,
        );
    }

    return { query, changeQuery };
}
