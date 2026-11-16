import { useEffect, useState } from 'react';

/**
 * The full-resolution source once it has loaded in the background, the preview until then.
 */
export function useFullImage(
    fullSrc: string | null,
    previewSrc: string | undefined,
): string | undefined {
    const [loadedFullSrc, setLoadedFullSrc] = useState<string | null>(null);

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

    return fullSrc && loadedFullSrc === fullSrc ? fullSrc : previewSrc;
}
