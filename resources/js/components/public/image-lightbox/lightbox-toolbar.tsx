import { X, ZoomIn, ZoomOut } from 'lucide-react';
import type { Ref } from 'react';
import { labels } from '@/lib/labels.fr';
import { cn } from '@/lib/utils';

const iconButtonClasses =
    'inline-flex size-11 items-center justify-center rounded-md text-white hover:bg-white/10 focus-visible:outline-white aria-disabled:cursor-not-allowed aria-disabled:opacity-40 aria-disabled:hover:bg-transparent';

type LightboxToolbarProps = {
    scale: number;
    isMinScale: boolean;
    isMaxScale: boolean;
    onZoomOut: () => void;
    onZoomIn: () => void;
    onClose: () => void;
    closeButtonRef: Ref<HTMLButtonElement>;
};

/**
 * Zoom out, the zoom level (announced), zoom in and close, at the top right of the lightbox.
 */
export function LightboxToolbar({
    scale,
    isMinScale,
    isMaxScale,
    onZoomOut,
    onZoomIn,
    onClose,
    closeButtonRef,
}: LightboxToolbarProps) {
    return (
        <div className="flex items-center justify-end gap-1 px-2 py-2">
            <button
                type="button"
                aria-label={labels.article.image.zoomOut}
                aria-disabled={isMinScale}
                onClick={onZoomOut}
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
                {labels.article.image.zoomLevel(Math.round(scale * 100))}
            </span>
            <button
                type="button"
                aria-label={labels.article.image.zoomIn}
                aria-disabled={isMaxScale}
                onClick={onZoomIn}
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
    );
}
