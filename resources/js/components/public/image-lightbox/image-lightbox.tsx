import { LightboxToolbar } from '@/components/public/image-lightbox/lightbox-toolbar';
import type { LightboxImage } from '@/helpers/image-lightbox';
import { FULL_WIDTH } from '@/helpers/image-lightbox';
import { useFullImage } from '@/hooks/use-full-image';
import { useLightboxDialog } from '@/hooks/use-lightbox-dialog';
import { useZoomPan } from '@/hooks/use-zoom-pan';
import { cloudinaryFullUrl } from '@/lib/cloudinary';
import { labels } from '@/lib/labels.fr';
import { cn } from '@/lib/utils';

type ImageLightboxProps = {
    image: LightboxImage | null;
    onClose: () => void;
};

/**
 * Full-screen viewer for article body images, in a native modal `<dialog>` (focus trap, Escape, focus return).
 * Zoom with the buttons, `+` / `-` / `0`, the wheel, a pinch or a double tap; drag to pan once zoomed.
 */
export function ImageLightbox({ image, onClose }: ImageLightboxProps) {
    const { dialogRef, closeButtonRef } = useLightboxDialog(image !== null);
    const zoom = useZoomPan(image, onClose);
    const displayedSrc = useFullImage(
        image ? cloudinaryFullUrl(image.src, FULL_WIDTH) : null,
        image?.previewSrc,
    );

    return (
        <dialog
            ref={dialogRef}
            aria-label={labels.article.image.dialog}
            onClose={onClose}
            onKeyDown={zoom.handleKeyDown}
            className="bg-primary m-0 h-dvh max-h-none w-dvw max-w-none p-0 text-white backdrop:bg-black/80"
        >
            {image && (
                <div className="flex h-full flex-col">
                    <LightboxToolbar
                        scale={zoom.view.scale}
                        isMinScale={zoom.isMinScale}
                        isMaxScale={zoom.isMaxScale}
                        onZoomOut={zoom.zoomOut}
                        onZoomIn={zoom.zoomIn}
                        onClose={onClose}
                        closeButtonRef={closeButtonRef}
                    />

                    <div
                        ref={zoom.stageRef}
                        onPointerDown={zoom.handlePointerDown}
                        onPointerMove={zoom.handlePointerMove}
                        onPointerUp={zoom.handlePointerUp}
                        onPointerCancel={zoom.handlePointerUp}
                        className={cn(
                            'relative min-h-0 flex-1 touch-none overflow-hidden select-none',
                            zoom.isMinScale ? 'cursor-zoom-in' : 'cursor-grab',
                        )}
                    >
                        <img
                            ref={zoom.imageRef}
                            src={displayedSrc}
                            alt={image.alt}
                            draggable={false}
                            style={{
                                transform: `translate(${zoom.view.x}px, ${zoom.view.y}px) scale(${zoom.view.scale})`,
                            }}
                            className={cn(
                                'absolute inset-0 m-auto h-full w-full object-contain',
                                zoom.isAnimated &&
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
