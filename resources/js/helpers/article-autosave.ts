/**
 * How often the editor is copied to the browser while it has unsaved changes.
 */
export const AUTOSAVE_INTERVAL_MS = 30_000;

const KEY_PREFIX = 'admin-article-brouillon:';

/**
 * The editor fields that can live in the browser: everything but the cover file.
 */
export type AutosavedFields = {
    title: string;
    lead_paragraph: string;
    content: string;
    cover_photo_credit: string;
    category_ids: number[];
    new_categories: string[];
    description: string;
    keywords: string;
    slug: string;
};

/**
 * One copy of the editor, with the time it was taken.
 */
export type Snapshot = { fields: AutosavedFields; savedAt: string };

/**
 * The `localStorage` key of an article's copy; a new article has its own.
 */
export function storageKey(articleId: number | null): string {
    return `${KEY_PREFIX}${articleId ?? 'nouveau'}`;
}

/**
 * The stored copy, or `null` when there is none or storage is blocked.
 */
export function read(key: string): Snapshot | null {
    try {
        const raw = window.localStorage.getItem(key);

        return raw ? (JSON.parse(raw) as Snapshot) : null;
    } catch {
        return null;
    }
}

/**
 * Store a copy; `false` when storage is full or blocked.
 */
export function write(key: string, snapshot: Snapshot): boolean {
    try {
        window.localStorage.setItem(key, JSON.stringify(snapshot));

        return true;
    } catch {
        return false;
    }
}

/**
 * Delete a copy; blocked storage is ignored.
 */
export function remove(key: string): void {
    try {
        window.localStorage.removeItem(key);
    } catch {
        // Storage can be blocked: there is nothing to clear then.
    }
}

/**
 * Forget the copy of an article, once the server has it.
 */
export function clearArticleAutosave(articleId: number | null): void {
    remove(storageKey(articleId));
}

/**
 * « 14 h 32 », as French typography writes times.
 */
export function frenchTime(date: Date): string {
    return `${date.getHours()} h ${String(date.getMinutes()).padStart(2, '0')}`;
}

/**
 * Whether two sets of fields hold the same values.
 */
export function sameFields(a: AutosavedFields, b: AutosavedFields): boolean {
    return JSON.stringify(a) === JSON.stringify(b);
}
