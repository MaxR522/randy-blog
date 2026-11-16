import { useEffect, useRef } from 'react';

/**
 * Focus the first field when an inline editor opens.
 */
export function useFocusOnOpen() {
    const containerRef = useRef<HTMLFormElement>(null);

    useEffect(() => {
        containerRef.current
            ?.querySelector<HTMLElement>('input, [contenteditable], iframe')
            ?.focus();
    }, []);

    return containerRef;
}
