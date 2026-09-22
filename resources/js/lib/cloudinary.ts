const UPLOAD_SEGMENT = '/image/upload/';

function isCloudinaryUrl(url: string): boolean {
    return url.includes('res.cloudinary.com') && url.includes(UPLOAD_SEGMENT);
}

/**
 * Cloudinary delivery URL resized to the given width (never upscaled).
 * Other URLs are returned untouched.
 */
export function cloudinaryUrl(url: string, width: number): string {
    if (!isCloudinaryUrl(url)) {
        return url;
    }

    return url.replace(UPLOAD_SEGMENT, `${UPLOAD_SEGMENT}w_${width},c_limit/`);
}

/**
 * `srcset` for a Cloudinary image, or `undefined` for other URLs.
 */
export function cloudinarySrcSet(
    url: string,
    widths: readonly number[],
): string | undefined {
    if (!isCloudinaryUrl(url)) {
        return undefined;
    }

    return widths
        .map((width) => `${cloudinaryUrl(url, width)} ${width}w`)
        .join(', ');
}
