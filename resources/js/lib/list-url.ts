/**
 * URL of the list with some query parameters changed (`null` removes one).
 * Any change goes back to the first page, since the current one may no longer exist.
 */
export function listUrl(
    currentUrl: string,
    changes: Record<string, string | null>,
): string {
    const [path, search] = currentUrl.split('?');
    const params = new URLSearchParams(search);

    params.delete('page');

    for (const [name, value] of Object.entries(changes)) {
        if (value === null) {
            params.delete(name);
        } else {
            params.set(name, value);
        }
    }

    const query = params.toString();

    return query ? `${path}?${query}` : path;
}

/**
 * Visit options of a list change: same page component, same scroll, no new history entry per keystroke.
 */
export const listVisitOptions = {
    preserveState: true,
    preserveScroll: true,
    replace: true,
};
