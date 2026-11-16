export const MIN_ZOOM = 1;

export const MAX_ZOOM = 3;

/** The crop square, as a share of the frame: the band around it shows, dimmed, what is cut off. */
export const CROP_SHARE = 0.88;

/** Side of the exported avatar, in pixels (never larger than the cropped part of the source). */
export const OUTPUT_SIZE = 800;

export const KEYBOARD_STEP_PX = 10;

export type Point = { x: number; y: number };

export type ImageSize = { width: number; height: number };

/** Screen moves of the arrow keys: the picture follows the key, so the centre moves the other way. */
export const KEY_MOVES: Record<string, Point> = {
    ArrowLeft: { x: KEYBOARD_STEP_PX, y: 0 },
    ArrowRight: { x: -KEYBOARD_STEP_PX, y: 0 },
    ArrowUp: { x: 0, y: KEYBOARD_STEP_PX },
    ArrowDown: { x: 0, y: -KEYBOARD_STEP_PX },
};

export function clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
}

/** Keep the frame, and so the crop square, covered by the picture at this zoom. */
export function clampCenter(
    point: Point,
    atZoom: number,
    natural: ImageSize | null,
): Point {
    if (!natural) {
        return point;
    }

    const halfSide = Math.min(natural.width, natural.height) / (2 * atZoom);

    return {
        x: clamp(point.x, halfSide, natural.width - halfSide),
        y: clamp(point.y, halfSide, natural.height - halfSide),
    };
}

/** Draw the square of `side` image pixels around `center` into a JPEG file of at most `OUTPUT_SIZE` pixels. */
export function exportSquare(
    image: HTMLImageElement,
    center: Point,
    side: number,
): Promise<File> {
    return new Promise<File>((resolve, reject) => {
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
    });
}
