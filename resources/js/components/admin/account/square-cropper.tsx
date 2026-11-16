import type { Ref } from 'react';
import { useImperativeHandle } from 'react';
import { MAX_ZOOM, MIN_ZOOM } from '@/helpers/square-crop';
import { useSquareCrop } from '@/hooks/use-square-crop';
import { adminLabels } from '@/lib/labels.admin.fr';

const text = adminLabels.account;

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

/**
 * Square crop frame and zoom range of a picked image (ADM-ACC-1); the behaviour lives in `useSquareCrop`.
 */
export function SquareCropper({ file, onError, ref }: SquareCropperProps) {
    const crop = useSquareCrop(file);

    useImperativeHandle(ref, () => ({ exportFile: crop.exportFile }));

    return (
        <div className="flex w-full flex-col gap-2.5">
            <div
                ref={crop.frameRef}
                role="group"
                tabIndex={0}
                aria-label={text.cropArea}
                onPointerDown={crop.handlePointerDown}
                onPointerMove={crop.handlePointerMove}
                onPointerUp={crop.handlePointerUp}
                onPointerCancel={crop.handlePointerUp}
                onKeyDown={crop.handleKeyDown}
                className="bg-grey-subtle focus-visible:outline-accent-600 relative aspect-square w-full cursor-grab touch-none overflow-hidden rounded-sm select-none active:cursor-grabbing"
            >
                {crop.url && (
                    <img
                        ref={crop.imageRef}
                        src={crop.url}
                        alt=""
                        draggable={false}
                        onLoad={crop.handleImageLoad}
                        onError={onError}
                        className="pointer-events-none absolute top-0 left-0 max-w-none origin-top-left"
                        style={
                            crop.natural
                                ? {
                                      width: crop.natural.width,
                                      height: crop.natural.height,
                                      transform: `translate(${crop.frameSize / 2 - crop.center.x * crop.scale}px, ${crop.frameSize / 2 - crop.center.y * crop.scale}px) scale(${crop.scale})`,
                                  }
                                : { opacity: 0 }
                        }
                    />
                )}
                <div
                    aria-hidden="true"
                    className="pointer-events-none absolute border-2 border-white shadow-[0_0_0_999px_rgb(43_43_43/0.35)]"
                    style={{ inset: crop.inset }}
                />
            </div>
            <input
                type="range"
                min={MIN_ZOOM}
                max={MAX_ZOOM}
                step={0.05}
                value={crop.zoom}
                aria-label={text.cropZoom}
                onChange={(event) =>
                    crop.changeZoom(Number(event.target.value))
                }
                className="accent-primary h-11 w-full"
            />
        </div>
    );
}
