import type { KeyboardEvent, PointerEvent } from 'react';
import { useEffect, useRef, useState } from 'react';
import type { LightboxImage, Point, View } from '@/helpers/image-lightbox';
import {
    BUTTON_STEP,
    clampViewWithin,
    DOUBLE_TAP_SCALE,
    isDoubleTap,
    MAX_SCALE,
    MIN_SCALE,
    renderedSize,
    RESET,
    TAP_SLOP_PX,
    zoomedAround,
} from '@/helpers/image-lightbox';

/**
 * Zoom and pan of the lightbox picture: the buttons, `+` / `-` / `0`, the wheel, a pinch or a double tap zoom; a
 * drag pans once zoomed; a single tap beside the picture closes the viewer when not zoomed. The view resets for
 * each new image.
 */
export function useZoomPan(image: LightboxImage | null, onClose: () => void) {
    const stageRef = useRef<HTMLDivElement>(null);
    const imageRef = useRef<HTMLImageElement>(null);
    const pointers = useRef(new Map<number, Point>());
    const lastTap = useRef<{ time: number; point: Point } | null>(null);
    const pressStart = useRef<Point | null>(null);
    const [view, setView] = useState<View>(RESET);
    const [isAnimated, setIsAnimated] = useState(false);

    useEffect(() => {
        if (image) {
            setView(RESET);
        }
    }, [image]);

    /** The picture rendered at scale 1, measured inside its `object-contain` box (letterboxing does not count). */
    function pictureSize(): Point | null {
        const picture = imageRef.current;

        return picture?.naturalWidth ? renderedSize(picture) : null;
    }

    function clampView(next: View): View {
        const stage = stageRef.current;

        return clampViewWithin(
            next,
            stage ? { x: stage.clientWidth, y: stage.clientHeight } : null,
            pictureSize(),
        );
    }

    /** Point relative to the stage centre, which is the transform origin. */
    function fromCentre(clientX: number, clientY: number): Point {
        const rect = stageRef.current?.getBoundingClientRect();

        if (!rect) {
            return { x: 0, y: 0 };
        }

        return {
            x: clientX - rect.left - rect.width / 2,
            y: clientY - rect.top - rect.height / 2,
        };
    }

    /** Scale to `scale` while the picture point under `focus` stays where it is. */
    function zoomAround(current: View, scale: number, focus: Point): View {
        return clampView(zoomedAround(current, scale, focus));
    }

    /** Whether a pointer is over the picture itself, not the letterbox around it. */
    function isOverPicture(clientX: number, clientY: number): boolean {
        const size = pictureSize();

        if (!size) {
            return false;
        }

        const point = fromCentre(clientX, clientY);

        return (
            Math.abs(point.x - view.x) <= (size.x * view.scale) / 2 &&
            Math.abs(point.y - view.y) <= (size.y * view.scale) / 2
        );
    }

    function zoomBy(factor: number): void {
        setIsAnimated(true);
        setView((current) =>
            zoomAround(current, current.scale * factor, { x: 0, y: 0 }),
        );
    }

    function reset(): void {
        setIsAnimated(true);
        setView(RESET);
    }

    useEffect(() => {
        const stage = stageRef.current;

        if (!stage || !image) {
            return;
        }

        /** Native listener: React's wheel listener is passive, and the page (or a trackpad pinch) must not zoom. */
        function handleWheel(event: WheelEvent): void {
            event.preventDefault();
            setIsAnimated(false);

            const focus = fromCentre(event.clientX, event.clientY);
            const factor = Math.exp(-event.deltaY * 0.002);

            setView((current) =>
                zoomAround(current, current.scale * factor, focus),
            );
        }

        stage.addEventListener('wheel', handleWheel, { passive: false });

        return () => stage.removeEventListener('wheel', handleWheel);
    });

    function handlePointerDown(event: PointerEvent<HTMLDivElement>): void {
        event.currentTarget.setPointerCapture(event.pointerId);
        pointers.current.set(event.pointerId, {
            x: event.clientX,
            y: event.clientY,
        });
        pressStart.current =
            pointers.current.size === 1
                ? { x: event.clientX, y: event.clientY }
                : null;
        setIsAnimated(false);
    }

    function handlePointerMove(event: PointerEvent<HTMLDivElement>): void {
        const previous = pointers.current.get(event.pointerId);

        if (!previous) {
            return;
        }

        const others = [...pointers.current.entries()].filter(
            ([id]) => id !== event.pointerId,
        );
        const moved = { x: event.clientX, y: event.clientY };

        pointers.current.set(event.pointerId, moved);

        if (others.length === 1) {
            const other = others[0][1];
            const previousDistance = Math.hypot(
                previous.x - other.x,
                previous.y - other.y,
            );
            const distance = Math.hypot(moved.x - other.x, moved.y - other.y);
            const previousMid = fromCentre(
                (previous.x + other.x) / 2,
                (previous.y + other.y) / 2,
            );
            const mid = fromCentre(
                (moved.x + other.x) / 2,
                (moved.y + other.y) / 2,
            );

            if (previousDistance === 0) {
                return;
            }

            setView((current) => {
                const zoomed = zoomAround(
                    current,
                    current.scale * (distance / previousDistance),
                    previousMid,
                );

                return clampView({
                    ...zoomed,
                    x: zoomed.x + mid.x - previousMid.x,
                    y: zoomed.y + mid.y - previousMid.y,
                });
            });

            return;
        }

        if (others.length === 0) {
            setView((current) =>
                current.scale === MIN_SCALE
                    ? current
                    : clampView({
                          ...current,
                          x: current.x + moved.x - previous.x,
                          y: current.y + moved.y - previous.y,
                      }),
            );
        }
    }

    /** Double tap on the picture toggles the zoom; a single tap beside it closes the viewer when not zoomed. */
    function handleTap(event: PointerEvent<HTMLDivElement>): void {
        const point = { x: event.clientX, y: event.clientY };

        if (!isOverPicture(event.clientX, event.clientY)) {
            lastTap.current = null;

            if (view.scale === MIN_SCALE) {
                onClose();
            }

            return;
        }

        if (isDoubleTap(lastTap.current, event.timeStamp, point)) {
            lastTap.current = null;
            setIsAnimated(true);
            setView((current) =>
                current.scale > MIN_SCALE
                    ? RESET
                    : zoomAround(
                          current,
                          DOUBLE_TAP_SCALE,
                          fromCentre(point.x, point.y),
                      ),
            );

            return;
        }

        lastTap.current = { time: event.timeStamp, point };
    }

    function handlePointerUp(event: PointerEvent<HTMLDivElement>): void {
        pointers.current.delete(event.pointerId);

        const start = pressStart.current;
        pressStart.current = null;

        if (
            start === null ||
            Math.hypot(event.clientX - start.x, event.clientY - start.y) >
                TAP_SLOP_PX
        ) {
            return;
        }

        handleTap(event);
    }

    function handleKeyDown(event: KeyboardEvent<HTMLDialogElement>): void {
        if (event.key === '+' || event.key === '=') {
            event.preventDefault();
            zoomBy(BUTTON_STEP);
        } else if (event.key === '-') {
            event.preventDefault();
            zoomBy(1 / BUTTON_STEP);
        } else if (event.key === '0') {
            event.preventDefault();
            reset();
        }
    }

    const isMinScale = view.scale <= MIN_SCALE;
    const isMaxScale = view.scale >= MAX_SCALE;

    return {
        stageRef,
        imageRef,
        view,
        isAnimated,
        isMinScale,
        isMaxScale,
        zoomIn: (): void => {
            if (!isMaxScale) {
                zoomBy(BUTTON_STEP);
            }
        },
        zoomOut: (): void => {
            if (!isMinScale) {
                zoomBy(1 / BUTTON_STEP);
            }
        },
        handlePointerDown,
        handlePointerMove,
        handlePointerUp,
        handleKeyDown,
    };
}

export type ZoomPan = ReturnType<typeof useZoomPan>;
