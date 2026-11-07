const UPLOAD_SEGMENT = '/image/upload/';

/**
 * Transformations stored in the URL, like the `f_auto,q_70` of V1 covers (same rule as `ShareImage::transform`).
 */
const STORED_TRANSFORMATIONS = /\/image\/upload\/(?:[a-z]{1,3}_[^/]*\/)*/;

const DELIVERY = 'f_auto,q_auto';

/**
 * Sources narrower than this, or with a ratio below `COVER_MIN_RATIO`, are framed on the article page, not cropped.
 */
const COVER_MIN_WIDTH = 640;
const COVER_MIN_RATIO = 1.2;

/**
 * The `grey-subtle` token: Cloudinary draws the frame into the image, so it cannot use the CSS variable.
 */
const COVER_FRAME_COLOR = 'F4F4F4';

function isCloudinaryUrl(url: string): boolean {
    return url.includes('res.cloudinary.com') && url.includes(UPLOAD_SEGMENT);
}

function withTransformation(url: string, transformation: string): string {
    if (!isCloudinaryUrl(url)) {
        return url;
    }

    return url.replace(
        STORED_TRANSFORMATIONS,
        `${UPLOAD_SEGMENT}${transformation}/`,
    );
}

function srcSetFor(
    url: string,
    widths: readonly number[],
    urlForWidth: (url: string, width: number) => string,
): string | undefined {
    if (!isCloudinaryUrl(url)) {
        return undefined;
    }

    return widths
        .map((width) => `${urlForWidth(url, width)} ${width}w`)
        .join(', ');
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
    return srcSetFor(url, widths, cloudinaryUrl);
}

/**
 * Card image: 3:2, cropped around the subject, never upscaled. The crop comes first, on its own,
 * because `c_lfill` leaves a source smaller than the requested size uncropped.
 */
export function cloudinaryCardUrl(url: string, width: number): string {
    return withTransformation(
        url,
        `c_fill,g_auto,ar_3:2/c_limit,w_${width}/${DELIVERY}`,
    );
}

export function cloudinaryCardSrcSet(
    url: string,
    widths: readonly number[],
): string | undefined {
    return srcSetFor(url, widths, cloudinaryCardUrl);
}

/**
 * Article cover, always 16:9. A wide enough source is cropped around the subject. A portrait, square or small
 * one is shown whole in a neutral frame, and a small one is first enlarged 2× at most so it stays legible.
 */
export function cloudinaryCoverUrl(url: string, width: number): string {
    const height = Math.round((width * 9) / 16);

    return withTransformation(
        url,
        [
            `if_iw_lt_${COVER_MIN_WIDTH}/c_scale,w_2.0/if_end`,
            `if_iw_lt_${COVER_MIN_WIDTH}_or_ar_lt_${COVER_MIN_RATIO}`,
            `c_lpad,w_${width},h_${height},b_rgb:${COVER_FRAME_COLOR}`,
            'if_else',
            `c_fill,g_auto,ar_16:9/c_limit,w_${width}`,
            'if_end',
            DELIVERY,
        ].join('/'),
    );
}

export function cloudinaryCoverSrcSet(
    url: string,
    widths: readonly number[],
): string | undefined {
    return srcSetFor(url, widths, cloudinaryCoverUrl);
}
