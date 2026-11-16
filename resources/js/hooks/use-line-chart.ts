import type { KeyboardEvent, PointerEvent } from 'react';
import { useEffect, useRef, useState } from 'react';
import {
    DEFAULT_WIDTH,
    keyMoveOf,
    MARGIN,
    MIN_WIDTH,
} from '@/helpers/line-chart';

/**
 * The line chart's behaviour: its pixel width (measured again when the chart comes back from the table view), the
 * day under the pointer or picked with the arrow keys, and the chart / table toggle.
 */
export function useLineChart(count: number) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [width, setWidth] = useState(DEFAULT_WIDTH);
    const [activeIndex, setActiveIndex] = useState<number | null>(null);
    const [isTable, setIsTable] = useState(false);

    useEffect(() => {
        const container = containerRef.current;

        if (container === null) {
            return;
        }

        const observer = new ResizeObserver(([entry]) => {
            setWidth(Math.max(MIN_WIDTH, Math.round(entry.contentRect.width)));
        });
        observer.observe(container);

        return () => observer.disconnect();
    }, [isTable]);

    function moveTo(
        event: PointerEvent<HTMLDivElement>,
        plotWidth: number,
    ): void {
        const bounds = event.currentTarget.getBoundingClientRect();
        const ratio = (event.clientX - bounds.left - MARGIN.left) / plotWidth;

        setActiveIndex(
            Math.min(count - 1, Math.max(0, Math.round(ratio * (count - 1)))),
        );
    }

    function handleKeyDown(event: KeyboardEvent<HTMLDivElement>): void {
        const move = keyMoveOf(event.key, count);

        if (move !== undefined) {
            event.preventDefault();
            setActiveIndex((index) => move(index ?? count - 1));
        }
    }

    return {
        containerRef,
        width,
        activeIndex,
        isTable,
        moveTo,
        handleKeyDown,
        clearActive: (): void => setActiveIndex(null),
        toggleTable: (): void => setIsTable((value) => !value),
    };
}

export type LineChartState = ReturnType<typeof useLineChart>;
