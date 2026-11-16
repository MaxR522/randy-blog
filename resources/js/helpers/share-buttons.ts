/** How long « Lien copié » shows, in milliseconds. */
export const COPIED_DURATION_MS = 2000;

/** Facebook share dialog for the URL. */
export function facebookShareUrl(url: string): string {
    return `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
}

/** X post intent with the URL and the title. */
export function xShareUrl(url: string, title: string): string {
    return `https://x.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`;
}

/** LinkedIn share dialog for the URL. */
export function linkedInShareUrl(url: string): string {
    return `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
}

/** Copy with the Clipboard API, or with the legacy command where the API is missing or refuses. */
export async function copyToClipboard(text: string): Promise<void> {
    try {
        await navigator.clipboard.writeText(text);

        return;
    } catch {
        // Falls through to the legacy copy below.
    }

    const field = document.createElement('textarea');

    field.value = text;
    field.setAttribute('readonly', '');
    field.className = 'fixed -left-full opacity-0';
    document.body.append(field);
    field.select();

    const isCopied = document.execCommand('copy');

    field.remove();

    if (!isCopied) {
        throw new Error('Copy refused');
    }
}
