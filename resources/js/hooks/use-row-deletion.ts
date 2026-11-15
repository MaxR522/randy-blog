import { router } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import { MAIN_ID } from '@/helpers/admin-shell';

/**
 * Deleting a row of a list after a confirmation dialog: the row asked about, the request, and the focus moved to
 * the main area once the row is gone.
 */
export function useRowDeletion<Row extends { id: number }>(
    urlOf: (id: number) => string,
) {
    const [deleted, setDeleted] = useState<Row | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const shouldFocusMain = useRef(false);

    // The trigger of the dialog is gone with its row, so the focus has nowhere to return. Runs after the dialog has closed.
    useEffect(() => {
        if (deleted === null && shouldFocusMain.current) {
            shouldFocusMain.current = false;
            document.getElementById(MAIN_ID)?.focus();
        }
    }, [deleted]);

    function confirmDeletion(): void {
        if (!deleted) {
            return;
        }

        router.delete(urlOf(deleted.id), {
            preserveScroll: true,
            onStart: () => setIsDeleting(true),
            onFinish: () => setIsDeleting(false),
            onSuccess: () => {
                shouldFocusMain.current = true;
                setDeleted(null);
            },
        });
    }

    return {
        deleted,
        isDeleting,
        askDeletion: (row: Row): void => setDeleted(row),
        cancelDeletion: (): void => setDeleted(null),
        confirmDeletion,
    };
}

export type RowDeletion<Row extends { id: number }> = ReturnType<
    typeof useRowDeletion<Row>
>;
