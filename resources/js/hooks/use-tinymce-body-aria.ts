import { useEffect } from 'react';
import type { Editor as TinyMCEInstance } from 'tinymce';

/**
 * Keeps the editing area's `aria-invalid` and `aria-description` in step with the field, since the error state and
 * its message change while the editor stays mounted.
 */
export function useTinymceBodyAria(
    editor: TinyMCEInstance | null,
    isInvalid: boolean,
    description: string | undefined,
): void {
    useEffect(() => {
        if (!editor) {
            return;
        }

        const body = editor.getBody();

        if (isInvalid) {
            body.setAttribute('aria-invalid', 'true');
        } else {
            body.removeAttribute('aria-invalid');
        }

        if (description) {
            body.setAttribute('aria-description', description);
        } else {
            body.removeAttribute('aria-description');
        }
    }, [editor, isInvalid, description]);
}
