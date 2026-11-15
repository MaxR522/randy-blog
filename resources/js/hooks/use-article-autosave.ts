import { useCallback, useEffect, useRef, useState } from 'react';
import type { AutosavedFields, Snapshot } from '@/helpers/article-autosave';
import {
    AUTOSAVE_INTERVAL_MS,
    read,
    remove,
    sameFields,
    storageKey,
    write,
} from '@/helpers/article-autosave';

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
        }, AUTOSAVE_INTERVAL_MS);

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
