import type { KeyboardEvent, PointerEvent, SyntheticEvent } from 'react';
import { useEffect, useRef, useState } from 'react';
import type { ImageSize, Point } from '@/helpers/square-crop';
import {
    clamp,
    clampCenter,
    CROP_SHARE,
    exportSquare,
    KEY_MOVES,
    MAX_ZOOM,
    MIN_ZOOM,
} from '@/helpers/square-crop';
import { useObjectUrl } from '@/hooks/use-object-url';

/**
 * Square crop of a picked image (ADM-ACC-1): drag to move it, zoom with the range, the wheel or a pinch; arrow keys
 * move it and + / − zoom while the frame has focus. Positions are kept in image pixels, so the crop does not depend
 * on the frame's size on screen.
 */
export function useSquareCrop(file: File) {
    const frameRef = useRef<HTMLDivElement>(null);
    const imageRef = useRef<HTMLImageElement>(null);
    const pointers = useRef(new Map<number, Point>());
    const pinchDistance = useRef<number | null>(null);
    const url = useObjectUrl(file);
    const [natural, setNatural] = useState<ImageSize | null>(null);
    const [frameSize, setFrameSize] = useState(0);
    const [zoom, setZoom] = useState(MIN_ZOOM);
    const [center, setCenter] = useState<Point>({ x: 0, y: 0 });

    useEffect(() => {
        setNatural(null);
        setZoom(MIN_ZOOM);
    }, [file]);

    useEffect(() => {
        const frame = frameRef.current;

        if (!frame) {
            return;
        }

        const observer = new ResizeObserver(([entry]) =>
            setFrameSize(entry.contentRect.width),
        );
        observer.observe(frame);

        return () => observer.disconnect();
    }, []);

    const shortSide = natural ? Math.min(natural.width, natural.height) : 1;
    const cropSize = frameSize * CROP_SHARE;
    // The picture always fills the whole frame; the crop square is the part inside the white border.
    const scale = (frameSize / shortSide) * zoom;

    function changeZoom(nextZoom: number): void {
        const clampedZoom = clamp(nextZoom, MIN_ZOOM, MAX_ZOOM);
        setZoom(clampedZoom);
        setCenter((current) => clampCenter(current, clampedZoom, natural));
    }

    function moveBy(dxScreen: number, dyScreen: number): void {
        if (scale <= 0) {
            return;
        }

        setCenter((current) =>
            clampCenter(
                {
                    x: current.x - dxScreen / scale,
                    y: current.y - dyScreen / scale,
                },
                zoom,
                natural,
            ),
        );
    }

    // React attaches wheel listeners as passive, which cannot stop the page from scrolling.
    const changeZoomRef = useRef(changeZoom);
    changeZoomRef.current = changeZoom;
    const zoomRef = useRef(zoom);
    zoomRef.current = zoom;

    useEffect(() => {
        const frame = frameRef.current;

        if (!frame) {
            return;
        }

        function onWheel(event: WheelEvent): void {
            event.preventDefault();
            changeZoomRef.current(
                zoomRef.current * Math.exp(-event.deltaY / 500),
            );
        }

        frame.addEventListener('wheel', onWheel, { passive: false });

        return () => frame.removeEventListener('wheel', onWheel);
    }, []);

    function handlePointerDown(event: PointerEvent<HTMLDivElement>): void {
        event.currentTarget.setPointerCapture(event.pointerId);
        pointers.current.set(event.pointerId, {
            x: event.clientX,
            y: event.clientY,
        });
        pinchDistance.current = null;
    }

    function handlePointerMove(event: PointerEvent<HTMLDivElement>): void {
        const previous = pointers.current.get(event.pointerId);

        if (!previous) {
            return;
        }

        const current = { x: event.clientX, y: event.clientY };
        pointers.current.set(event.pointerId, current);

        if (pointers.current.size === 2) {
            const [first, second] = [...pointers.current.values()];
            const distance = Math.hypot(first.x - second.x, first.y - second.y);

            if (pinchDistance.current !== null && pinchDistance.current > 0) {
                changeZoom(zoom * (distance / pinchDistance.current));
            }

            pinchDistance.current = distance;

            return;
        }

        moveBy(current.x - previous.x, current.y - previous.y);
    }

    function handlePointerUp(event: PointerEvent<HTMLDivElement>): void {
        pointers.current.delete(event.pointerId);
        pinchDistance.current = null;
    }

    function handleKeyDown(event: KeyboardEvent<HTMLDivElement>): void {
        const move = KEY_MOVES[event.key];

        if (move) {
            event.preventDefault();
            moveBy(move.x, move.y);
        } else if (event.key === '+' || event.key === '=') {
            event.preventDefault();
            changeZoom(zoom + 0.1);
        } else if (event.key === '-') {
            event.preventDefault();
            changeZoom(zoom - 0.1);
        }
    }

    function handleImageLoad(event: SyntheticEvent<HTMLImageElement>): void {
        const { naturalWidth, naturalHeight } = event.currentTarget;
        setNatural({ width: naturalWidth, height: naturalHeight });
        setCenter({ x: naturalWidth / 2, y: naturalHeight / 2 });
    }

    /** The visible square, drawn into a JPEG file. */
    function exportFile(): Promise<File> {
        const image = imageRef.current;

        if (!image || !natural) {
            return Promise.reject(new Error('Image not loaded'));
        }

        return exportSquare(image, center, (shortSide * CROP_SHARE) / zoom);
    }

    return {
        frameRef,
        imageRef,
        url,
        natural,
        zoom,
        frameSize,
        center,
        scale,
        inset: (frameSize - cropSize) / 2,
        changeZoom,
        handlePointerDown,
        handlePointerMove,
        handlePointerUp,
        handleKeyDown,
        handleImageLoad,
        exportFile,
    };
}

export type SquareCrop = ReturnType<typeof useSquareCrop>;
