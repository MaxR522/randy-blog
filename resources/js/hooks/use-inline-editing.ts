import { router } from '@inertiajs/react';
import { useCallback, useRef, useState } from 'react';
import { useUnsavedChangesGuard } from '@/hooks/use-unsaved-changes-guard';

type InlineEditingOptions<Field extends string> = {
    /** Whether the open editor of this field holds unsaved changes. */
    isDirtyOf: (field: Field) => boolean;
    /** Called when « Modifier » opens the editor of this field, before it shows. */
    onOpen?: (field: Field) => void;
};

/**
 * One inline editor open at a time on a « Gestion du compte » tab, with the unsaved-changes guard and the focus
 * returned to the « Modifier » button that opened it.
 */
export function useInlineEditing<Field extends string>({
    isDirtyOf,
    onOpen,
}: InlineEditingOptions<Field>) {
    const [editing, setEditing] = useState<Field | null>(null);
    const [leavingUrl, setLeavingUrl] = useState<string | null>(null);
    const isLeavingRef = useRef(false);
    const editButtons = useRef(new Map<Field, HTMLButtonElement>());

    useUnsavedChangesGuard(
        editing !== null && isDirtyOf(editing),
        isLeavingRef,
        setLeavingUrl,
    );

    const close = useCallback(() => {
        const field = editing;
        setEditing(null);
        // Back on the button that opened the editor, once it is enabled again.
        requestAnimationFrame(
            () => field && editButtons.current.get(field)?.focus(),
        );
    }, [editing]);

    function rowProps(field: Field) {
        const isEditing = editing === field;

        return {
            isEditing,
            isLocked: editing !== null && !isEditing,
            onEdit: () => {
                onOpen?.(field);
                setEditing(field);
            },
            editButtonRef: (button: HTMLButtonElement | null) => {
                if (button) {
                    editButtons.current.set(field, button);
                }
            },
        };
    }

    function confirmLeave(): void {
        isLeavingRef.current = true;

        if (leavingUrl) {
            router.visit(leavingUrl);
        }
    }

    return {
        editing,
        rowProps,
        close,
        isLeaving: leavingUrl !== null,
        confirmLeave,
        cancelLeave: (): void => setLeavingUrl(null),
    };
}

export type InlineEditing = ReturnType<typeof useInlineEditing>;
