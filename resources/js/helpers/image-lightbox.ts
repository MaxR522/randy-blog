export type LightboxImage = {
    /** Original image, fetched at full resolution. */
    src: string;
    /** Version already on the page, shown while the full one loads. */
    previewSrc: string;
    alt: string;
    caption: string | null;
};

export type View = { scale: number; x: number; y: number };

export type Point = { x: number; y: number };

export const MIN_SCALE = 1;
export const MAX_SCALE = 4;
export const BUTTON_STEP = 1.5;
export const DOUBLE_TAP_SCALE = 2.5;
export const DOUBLE_TAP_MS = 300;
export const TAP_SLOP_PX = 10;
/** Width of the full-resolution image fetched from Cloudinary. */
export const FULL_WIDTH = 2400;

export const RESET: View = { scale: MIN_SCALE, x: 0, y: 0 };

/** Size of the picture drawn inside its `object-contain` box, at scale 1. */
export function renderedSize(picture: HTMLImageElement): Point {
    const fit = Math.min(
        picture.clientWidth / picture.naturalWidth,
        picture.clientHeight / picture.naturalHeight,
    );

    return { x: picture.naturalWidth * fit, y: picture.naturalHeight * fit };
}

export function clampScale(scale: number): number {
    return Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale));
}

/**
 * Keep the picture over a stage of `stage` pixels: once zoomed it can move until its edges reach the stage edges.
 * `size` is the picture rendered at scale 1, or `null` while it is not measurable.
 */
export function clampViewWithin(
    next: View,
    stage: Point | null,
    size: Point | null,
): View {
    const scale = clampScale(next.scale);

    if (stage === null || size === null || scale === MIN_SCALE) {
        return { scale, x: 0, y: 0 };
    }

    const maxX = Math.max(0, (size.x * scale - stage.x) / 2);
    const maxY = Math.max(0, (size.y * scale - stage.y) / 2);

    return {
        scale,
        x: Math.min(maxX, Math.max(-maxX, next.x)),
        y: Math.min(maxY, Math.max(-maxY, next.y)),
    };
}

/** The view scaled to `scale` with the picture point under `focus` kept in place (before clamping). */
export function zoomedAround(current: View, scale: number, focus: Point): View {
    const ratio = clampScale(scale) / current.scale;

    return {
        scale,
        x: focus.x - (focus.x - current.x) * ratio,
        y: focus.y - (focus.y - current.y) * ratio,
    };
}

/** Whether two taps are close enough in time and place to make a double tap. */
export function isDoubleTap(
    previous: { time: number; point: Point } | null,
    time: number,
    point: Point,
): boolean {
    return (
        previous !== null &&
        time - previous.time < DOUBLE_TAP_MS &&
        Math.hypot(point.x - previous.point.x, point.y - previous.point.y) <
            TAP_SLOP_PX * 3
    );
}
