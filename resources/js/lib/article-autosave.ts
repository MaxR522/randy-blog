import { useCallback, useEffect, useRef, useState } from 'react';

const INTERVAL_MS = 30_000;

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

type Snapshot = { fields: AutosavedFields; savedAt: string };

function storageKey(articleId: number | null): string {
    return `${KEY_PREFIX}${articleId ?? 'nouveau'}`;
}

function read(key: string): Snapshot | null {
    try {
        const raw = window.localStorage.getItem(key);

        return raw ? (JSON.parse(raw) as Snapshot) : null;
    } catch {
        return null;
    }
}

function write(key: string, snapshot: Snapshot): boolean {
    try {
        window.localStorage.setItem(key, JSON.stringify(snapshot));

        return true;
    } catch {
        return false;
    }
}

function remove(key: string): void {
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

function sameFields(a: AutosavedFields, b: AutosavedFields): boolean {
    return JSON.stringify(a) === JSON.stringify(b);
}

/**
 * Keeps a copy of the editor in `localStorage` every 30 s while it has unsaved changes (ADM-ART-31), and offers
 * a copy left by an earlier visit when it is newer than the saved article and differs from it.
 */
export function useArticleAutosave(
    articleId: number | null,
    fields: AutosavedFields,
    isDirty: boolean,
    serverFields: AutosavedFields,
    serverUpdatedAt: string | null,
) {
    const key = storageKey(articleId);
    const fieldsRef = useRef(fields);
    const [savedAt, setSavedAt] = useState<Date | null>(null);
    const [pending, setPending] = useState<Snapshot | null>(() => {
        const snapshot = typeof window === 'undefined' ? null : read(key);

        if (!snapshot || sameFields(snapshot.fields, serverFields)) {
            return null;
        }

        if (
            serverUpdatedAt &&
            new Date(snapshot.savedAt) <= new Date(serverUpdatedAt)
        ) {
            return null;
        }

        return snapshot;
    });

    useEffect(() => {
        fieldsRef.current = fields;
    }, [fields]);

    useEffect(() => {
        if (!isDirty) {
            return;
        }

        const timer = window.setInterval(() => {
            const now = new Date();

            if (
                write(key, {
                    fields: fieldsRef.current,
                    savedAt: now.toISOString(),
                })
            ) {
                setSavedAt(now);
            }
        }, INTERVAL_MS);

        return () => window.clearInterval(timer);
    }, [isDirty, key]);

    /** Forget the copy: after a successful save, or when the author ignores it. */
    const clear = useCallback(() => {
        remove(key);
        setPending(null);
        setSavedAt(null);
    }, [key]);

    return {
        savedAt,
        pending,
        pendingSavedAt: pending ? new Date(pending.savedAt) : null,
        dismissPending: () => setPending(null),
        clear,
    };
}
