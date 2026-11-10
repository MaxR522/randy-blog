import type { KeyboardEvent, PointerEvent, Ref } from 'react';
import { useEffect, useImperativeHandle, useRef, useState } from 'react';
import { adminLabels } from '@/lib/labels.admin.fr';

const text = adminLabels.account;

const MIN_ZOOM = 1;

const MAX_ZOOM = 3;

/** The crop square, as a share of the frame: the band around it shows, dimmed, what is cut off. */
const CROP_SHARE = 0.88;

/** Side of the exported avatar, in pixels (never larger than the cropped part of the source). */
const OUTPUT_SIZE = 800;

const KEYBOARD_STEP_PX = 10;

type Point = { x: number; y: number };

export type SquareCropperHandle = {
    /** The visible square, drawn into a JPEG file. */
    exportFile: () => Promise<File>;
};

type SquareCropperProps = {
    file: File;
    /** The image could not be decoded. */
    onError: () => void;
    ref?: Ref<SquareCropperHandle>;
};

function clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
}

/**
 * Square crop of a picked image (ADM-ACC-1): drag to move it, zoom with the range, the wheel or a pinch; arrow
 * keys move it and + / − zoom while the frame has focus. Positions are kept in image pixels, so the crop does not
 * depend on the frame's size on screen.
 */
export function SquareCropper({ file, onError, ref }: SquareCropperProps) {
    const frameRef = useRef<HTMLDivElement>(null);
    const imageRef = useRef<HTMLImageElement>(null);
    const pointers = useRef(new Map<number, Point>());
    const pinchDistance = useRef<number | null>(null);
    const [url, setUrl] = useState<string | null>(null);
    const [natural, setNatural] = useState<{
        width: number;
        height: number;
    } | null>(null);
    const [frameSize, setFrameSize] = useState(0);
    const [zoom, setZoom] = useState(MIN_ZOOM);
    const [center, setCenter] = useState<Point>({ x: 0, y: 0 });

    useEffect(() => {
        const objectUrl = URL.createObjectURL(file);
        setUrl(objectUrl);
        setNatural(null);
        setZoom(MIN_ZOOM);

        return () => URL.revokeObjectURL(objectUrl);
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

    /** Keep the frame, and so the crop square, covered by the picture. */
    function clampCenter(point: Point, atZoom: number): Point {
        if (!natural) {
            return point;
        }

        const halfSide = shortSide / (2 * atZoom);

        return {
            x: clamp(point.x, halfSide, natural.width - halfSide),
            y: clamp(point.y, halfSide, natural.height - halfSide),
        };
    }

    function changeZoom(nextZoom: number): void {
        const clampedZoom = clamp(nextZoom, MIN_ZOOM, MAX_ZOOM);
        setZoom(clampedZoom);
        setCenter((current) => clampCenter(current, clampedZoom));
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
        const moves: Record<string, Point> = {
            ArrowLeft: { x: KEYBOARD_STEP_PX, y: 0 },
            ArrowRight: { x: -KEYBOARD_STEP_PX, y: 0 },
            ArrowUp: { x: 0, y: KEYBOARD_STEP_PX },
            ArrowDown: { x: 0, y: -KEYBOARD_STEP_PX },
        };

        if (moves[event.key]) {
            event.preventDefault();
            moveBy(moves[event.key].x, moves[event.key].y);
        } else if (event.key === '+' || event.key === '=') {
            event.preventDefault();
            changeZoom(zoom + 0.1);
        } else if (event.key === '-') {
            event.preventDefault();
            changeZoom(zoom - 0.1);
        }
    }

    useImperativeHandle(ref, () => ({
        exportFile: () =>
            new Promise<File>((resolve, reject) => {
                const image = imageRef.current;

                if (!image || !natural) {
                    reject(new Error('Image not loaded'));

                    return;
                }

                const side = (shortSide * CROP_SHARE) / zoom;
                const outputSize = Math.min(OUTPUT_SIZE, Math.round(side));
                const canvas = document.createElement('canvas');
                canvas.width = outputSize;
                canvas.height = outputSize;
                const context = canvas.getContext('2d');

                if (!context) {
                    reject(new Error('Canvas unavailable'));

                    return;
                }

                context.imageSmoothingQuality = 'high';
                context.drawImage(
                    image,
                    center.x - side / 2,
                    center.y - side / 2,
                    side,
                    side,
                    0,
                    0,
                    outputSize,
                    outputSize,
                );
                canvas.toBlob(
                    (blob) =>
                        blob
                            ? resolve(
                                  new File([blob], 'avatar.jpg', {
                                      type: 'image/jpeg',
                                  }),
                              )
                            : reject(new Error('Export failed')),
                    'image/jpeg',
                    0.9,
                );
            }),
    }));

    const inset = (frameSize - cropSize) / 2;

    return (
        <div className="flex w-full flex-col gap-2.5">
            <div
                ref={frameRef}
                role="group"
                tabIndex={0}
                aria-label={text.cropArea}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
                onKeyDown={handleKeyDown}
                className="bg-grey-subtle focus-visible:outline-accent-600 relative aspect-square w-full cursor-grab touch-none overflow-hidden rounded-sm select-none active:cursor-grabbing"
            >
                {url && (
                    <img
                        ref={imageRef}
                        src={url}
                        alt=""
                        draggable={false}
                        onLoad={(event) => {
                            const { naturalWidth, naturalHeight } =
                                event.currentTarget;
                            setNatural({
                                width: naturalWidth,
                                height: naturalHeight,
                            });
                            setCenter({
                                x: naturalWidth / 2,
                                y: naturalHeight / 2,
                            });
                        }}
                        onError={onError}
                        className="pointer-events-none absolute top-0 left-0 max-w-none origin-top-left"
                        style={
                            natural
                                ? {
                                      width: natural.width,
                                      height: natural.height,
                                      transform: `translate(${frameSize / 2 - center.x * scale}px, ${frameSize / 2 - center.y * scale}px) scale(${scale})`,
                                  }
                                : { opacity: 0 }
                        }
                    />
                )}
                <div
                    aria-hidden="true"
                    className="pointer-events-none absolute border-2 border-white shadow-[0_0_0_999px_rgb(43_43_43/0.35)]"
                    style={{ inset }}
                />
            </div>
            <input
                type="range"
                min={MIN_ZOOM}
                max={MAX_ZOOM}
                step={0.05}
                value={zoom}
                aria-label={text.cropZoom}
                onChange={(event) => changeZoom(Number(event.target.value))}
                className="accent-primary h-11 w-full"
            />
        </div>
    );
}
