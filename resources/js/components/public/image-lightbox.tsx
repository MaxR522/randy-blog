import { X, ZoomIn, ZoomOut } from 'lucide-react';
import type { KeyboardEvent, PointerEvent } from 'react';
import { useEffect, useRef, useState } from 'react';
import { cloudinaryFullUrl } from '@/lib/cloudinary';
import { labels } from '@/lib/labels.fr';
import { cn } from '@/lib/utils';

export type LightboxImage = {
    /** Original image, fetched at full resolution. */
    src: string;
    /** Version already on the page, shown while the full one loads. */
    previewSrc: string;
    alt: string;
    caption: string | null;
};

type ImageLightboxProps = {
    image: LightboxImage | null;
    onClose: () => void;
};

type View = { scale: number; x: number; y: number };

type Point = { x: number; y: number };

const MIN_SCALE = 1;
const MAX_SCALE = 4;
const BUTTON_STEP = 1.5;
const DOUBLE_TAP_SCALE = 2.5;
const DOUBLE_TAP_MS = 300;
const TAP_SLOP_PX = 10;
const FULL_WIDTH = 2400;

const RESET: View = { scale: MIN_SCALE, x: 0, y: 0 };

/**
 * Size of the picture drawn inside its `object-contain` box, at scale 1.
 */
function renderedSize(picture: HTMLImageElement): Point {
    const fit = Math.min(
        picture.clientWidth / picture.naturalWidth,
        picture.clientHeight / picture.naturalHeight,
    );

    return { x: picture.naturalWidth * fit, y: picture.naturalHeight * fit };
}

const iconButtonClasses =
    'inline-flex size-11 items-center justify-center rounded-md text-white hover:bg-white/10 focus-visible:outline-white aria-disabled:cursor-not-allowed aria-disabled:opacity-40 aria-disabled:hover:bg-transparent';

function clampScale(scale: number): number {
    return Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale));
}

/**
 * Full-screen viewer for article body images, in a native modal `<dialog>` (focus trap, Escape, focus return).
 * Zoom with the buttons, `+` / `-` / `0`, the wheel, a pinch or a double tap; drag to pan once zoomed.
 */
export function ImageLightbox({ image, onClose }: ImageLightboxProps) {
    const dialogRef = useRef<HTMLDialogElement>(null);
    const stageRef = useRef<HTMLDivElement>(null);
    const imageRef = useRef<HTMLImageElement>(null);
    const closeButtonRef = useRef<HTMLButtonElement>(null);
    const pointers = useRef(new Map<number, Point>());
    const lastTap = useRef<{ time: number; point: Point } | null>(null);
    const pressStart = useRef<Point | null>(null);

    const [view, setView] = useState<View>(RESET);
    const [isAnimated, setIsAnimated] = useState(false);
    const [loadedFullSrc, setLoadedFullSrc] = useState<string | null>(null);

    const fullSrc = image ? cloudinaryFullUrl(image.src, FULL_WIDTH) : null;

    useEffect(() => {
        const dialog = dialogRef.current;

        if (!dialog) {
            return;
        }

        if (!image) {
            if (dialog.open) {
                dialog.close();
            }

            return;
        }

        setView(RESET);
        dialog.showModal();
        closeButtonRef.current?.focus();

        const root = document.documentElement;
        const previousOverflow = root.style.overflow;
        root.style.overflow = 'hidden';

        return () => {
            root.style.overflow = previousOverflow;
        };
    }, [image]);

    useEffect(() => {
        if (!fullSrc) {
            return;
        }

        const loader = new Image();
        loader.onload = () => setLoadedFullSrc(fullSrc);
        loader.src = fullSrc;

        return () => {
            loader.onload = null;
        };
    }, [fullSrc]);

    /**
     * Whether a pointer is over the picture itself, not the letterbox around it.
     */
    function isOverPicture(clientX: number, clientY: number): boolean {
        const picture = imageRef.current;

        if (!picture?.naturalWidth) {
            return false;
        }

        const size = renderedSize(picture);
        const point = fromCentre(clientX, clientY);

        return (
            Math.abs(point.x - view.x) <= (size.x * view.scale) / 2 &&
            Math.abs(point.y - view.y) <= (size.y * view.scale) / 2
        );
    }

    /**
     * Keep the picture over the stage: once zoomed it can move until its edges reach the stage edges.
     * The rendered picture is measured inside its `object-contain` box, so letterboxing does not count.
     */
    function clampView(next: View): View {
        const stage = stageRef.current;
        const picture = imageRef.current;
        const scale = clampScale(next.scale);

        if (
            !stage ||
            !picture ||
            !picture.naturalWidth ||
            scale === MIN_SCALE
        ) {
            return { scale, x: 0, y: 0 };
        }

        const size = renderedSize(picture);
        const maxX = Math.max(0, (size.x * scale - stage.clientWidth) / 2);
        const maxY = Math.max(0, (size.y * scale - stage.clientHeight) / 2);

        return {
            scale,
            x: Math.min(maxX, Math.max(-maxX, next.x)),
            y: Math.min(maxY, Math.max(-maxY, next.y)),
        };
    }

    /**
     * Point relative to the stage centre, which is the transform origin.
     */
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

    /**
     * Scale to `scale` while the picture point under `focus` stays where it is.
     */
    function zoomAround(current: View, scale: number, focus: Point): View {
        const ratio = clampScale(scale) / current.scale;

        return clampView({
            scale,
            x: focus.x - (focus.x - current.x) * ratio,
            y: focus.y - (focus.y - current.y) * ratio,
        });
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

        /**
         * Native listener: React's wheel listener is passive, and the page (or a trackpad pinch) must not zoom.
         */
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

    /**
     * Double tap on the picture toggles the zoom; a single tap beside it closes the viewer when not zoomed.
     */
    function handleTap(event: PointerEvent<HTMLDivElement>): void {
        const isOnPicture = isOverPicture(event.clientX, event.clientY);
        const point = { x: event.clientX, y: event.clientY };
        const previous = lastTap.current;

        if (!isOnPicture) {
            lastTap.current = null;

            if (view.scale === MIN_SCALE) {
                onClose();
            }

            return;
        }

        if (
            previous &&
            event.timeStamp - previous.time < DOUBLE_TAP_MS &&
            Math.hypot(point.x - previous.point.x, point.y - previous.point.y) <
                TAP_SLOP_PX * 3
        ) {
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
    const displayedSrc =
        image && loadedFullSrc === fullSrc && fullSrc
            ? fullSrc
            : image?.previewSrc;

    return (
        <dialog
            ref={dialogRef}
            aria-label={labels.article.image.dialog}
            onClose={onClose}
            onKeyDown={handleKeyDown}
            className="bg-primary m-0 h-dvh max-h-none w-dvw max-w-none p-0 text-white backdrop:bg-black/80"
        >
            {image && (
                <div className="flex h-full flex-col">
                    <div className="flex items-center justify-end gap-1 px-2 py-2">
                        <button
                            type="button"
                            aria-label={labels.article.image.zoomOut}
                            aria-disabled={isMinScale}
                            onClick={() =>
                                !isMinScale && zoomBy(1 / BUTTON_STEP)
                            }
                            className={iconButtonClasses}
                        >
                            <ZoomOut
                                className="size-5"
                                strokeWidth={1.75}
                                aria-hidden="true"
                                focusable="false"
                            />
                        </button>
                        <span
                            aria-live="polite"
                            className="text-meta min-w-14 text-center font-medium tabular-nums"
                        >
                            {labels.article.image.zoomLevel(
                                Math.round(view.scale * 100),
                            )}
                        </span>
                        <button
                            type="button"
                            aria-label={labels.article.image.zoomIn}
                            aria-disabled={isMaxScale}
                            onClick={() => !isMaxScale && zoomBy(BUTTON_STEP)}
                            className={iconButtonClasses}
                        >
                            <ZoomIn
                                className="size-5"
                                strokeWidth={1.75}
                                aria-hidden="true"
                                focusable="false"
                            />
                        </button>
                        <button
                            type="button"
                            aria-label={labels.article.image.close}
                            ref={closeButtonRef}
                            onClick={onClose}
                            className={cn(iconButtonClasses, 'ml-2')}
                        >
                            <X
                                className="size-5.5"
                                strokeWidth={1.75}
                                aria-hidden="true"
                                focusable="false"
                            />
                        </button>
                    </div>

                    <div
                        ref={stageRef}
                        onPointerDown={handlePointerDown}
                        onPointerMove={handlePointerMove}
                        onPointerUp={handlePointerUp}
                        onPointerCancel={handlePointerUp}
                        className={cn(
                            'relative min-h-0 flex-1 touch-none overflow-hidden select-none',
                            isMinScale ? 'cursor-zoom-in' : 'cursor-grab',
                        )}
                    >
                        <img
                            ref={imageRef}
                            src={displayedSrc}
                            alt={image.alt}
                            draggable={false}
                            style={{
                                transform: `translate(${view.x}px, ${view.y}px) scale(${view.scale})`,
                            }}
                            className={cn(
                                'absolute inset-0 m-auto h-full w-full object-contain',
                                isAnimated &&
                                    'ease-standard transition-transform duration-(--duration-base) motion-reduce:transition-none',
                            )}
                        />
                    </div>

                    {image.caption && (
                        <p className="text-caption mx-auto max-w-lg px-4 pt-3 pb-4 text-center text-balance text-white/85">
                            {image.caption}
                        </p>
                    )}
                </div>
            )}
        </dialog>
    );
}
