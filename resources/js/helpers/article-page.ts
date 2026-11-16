import type { MouseEvent } from 'react';
import type { LightboxImage } from '@/helpers/image-lightbox';

/**
 * Image behind an `a.image-zoom` link (the cover, or a body image wrapped by the server), or `null` for any other
 * click. The link points at the original image, so the cover opens whole rather than as its 16:9 crop.
 * Modified and middle clicks keep the link's own behaviour, such as opening the image in a new tab.
 */
export function zoomableImageFrom(
    event: MouseEvent<HTMLElement>,
): LightboxImage | null {
    if (
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey ||
        !(event.target instanceof Element)
    ) {
        return null;
    }

    const link = event.target.closest<HTMLAnchorElement>('a.image-zoom');
    const image = link?.querySelector('img');

    if (!link || !image) {
        return null;
    }

    return {
        src: link.href,
        previewSrc: image.currentSrc || image.src,
        alt: image.alt,
        caption:
            image
                .closest('figure')
                ?.querySelector('figcaption')
                ?.textContent?.trim() || null,
    };
}
