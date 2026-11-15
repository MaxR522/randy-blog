/** Image types the cover and avatar fields accept; the server checks them again. */
export const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

/** Same limit as the server rule on the cover. */
export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

/** Browsers report M4A under several names; the extension decides when the type is unknown. */
export const ACCEPTED_AUDIO_TYPES = [
    'audio/mpeg',
    'audio/mp3',
    'audio/mp4',
    'audio/x-m4a',
    'audio/m4a',
];

export const ACCEPTED_AUDIO_EXTENSIONS = ['.mp3', '.m4a'];

/** Same limit as the server rule on the article audio. */
export const MAX_AUDIO_BYTES = 50 * 1024 * 1024;

const sizeFormatter = new Intl.NumberFormat('fr-FR', {
    maximumFractionDigits: 1,
});

/**
 * File size in French units, « 820 Ko » or « 1,5 Mo ».
 */
export function formatSize(bytes: number): string {
    return bytes >= 1024 * 1024
        ? `${sizeFormatter.format(bytes / (1024 * 1024))} Mo`
        : `${Math.max(1, Math.round(bytes / 1024))} Ko`;
}

/**
 * Whether the file is an MP3 or M4A, by its type or, when the browser does not know it, by its extension.
 */
export function isAcceptedAudio(file: File): boolean {
    const name = file.name.toLowerCase();

    return (
        ACCEPTED_AUDIO_TYPES.includes(file.type) ||
        ACCEPTED_AUDIO_EXTENSIONS.some((extension) => name.endsWith(extension))
    );
}

/**
 * Seconds as « m:ss ».
 */
export function clock(seconds: number): string {
    const whole = Math.max(0, Math.round(seconds));

    return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, '0')}`;
}
