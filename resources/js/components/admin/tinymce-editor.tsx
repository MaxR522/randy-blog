import { Editor } from '@tinymce/tinymce-react';
import { useEffect, useState } from 'react';
import type { Editor as TinyMCEInstance } from 'tinymce';
// TinyMCE first: the other modules expect the global `tinymce`.
import 'tinymce/tinymce';
import 'tinymce/models/dom/model';
import 'tinymce/themes/silver';
import 'tinymce/icons/default';
import 'tinymce/skins/ui/oxide/skin';
import 'tinymce/skins/ui/oxide/content';
import 'tinymce/plugins/advlist';
import 'tinymce/plugins/autoresize';
import 'tinymce/plugins/fullscreen';
import 'tinymce/plugins/image';
import 'tinymce/plugins/link';
import 'tinymce/plugins/lists';
import 'tinymce/plugins/media';
import 'tinymce/plugins/table';
import 'tinymce/plugins/wordcount';
import 'tinymce-i18n/langs8/fr-FR';
import contentStyle from '../../../css/editor-content.css?inline';
import type { RichTextConfig, UploadFolder } from '@/lib/tinymce-configs';
import { tinymceOptions } from '@/lib/tinymce-configs';

export type TinyMCEEditorProps = {
    config: RichTextConfig;
    value: string;
    onChange: (html: string) => void;
    labelId: string;
    /** Help and error text, read inside the iframe, where `aria-describedby` cannot reach the page's ids. */
    description?: string;
    isInvalid?: boolean;
    uploadFolder?: UploadFolder;
    placeholder?: string;
};

/**
 * The page's self-hosted Inter, copied into the editor iframe, which does not inherit the page's `@font-face` rules.
 */
function copyFontFaces(editor: TinyMCEInstance): void {
    const fontFaces = Array.from(document.querySelectorAll('style'))
        .map((style) => style.textContent ?? '')
        .filter((css) => css.includes('@font-face'))
        .join('\n');

    if (fontFaces !== '') {
        editor.dom.addStyle(fontFaces);
    }
}

/**
 * Tables get a header row as soon as they are inserted (A11Y-BODY-2).
 */
function addHeaderRowToNewTables(editor: TinyMCEInstance): void {
    editor.on('NewTable', ({ table }: { table: HTMLTableElement }) => {
        const firstCell = table.querySelector('td, th');

        if (!firstCell) {
            return;
        }

        editor.selection.select(firstCell, true);
        editor.selection.collapse(true);
        editor.execCommand('mceTableRowType', false, { type: 'header' });
    });
}

/**
 * Bundled TinyMCE (GPL build, no API key, Q2). Loaded lazily by `RichTextEditor`.
 */
export default function TinyMCEEditor({
    config,
    value,
    onChange,
    labelId,
    description,
    isInvalid = false,
    uploadFolder,
    placeholder,
}: TinyMCEEditorProps) {
    const [editor, setEditor] = useState<TinyMCEInstance | null>(null);

    // The error state and its message change while the editor stays mounted.
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

    return (
        <Editor
            licenseKey="gpl"
            onInit={(_event, instance) => setEditor(instance)}
            value={value}
            onEditorChange={(html) => onChange(html)}
            init={{
                ...tinymceOptions(config, contentStyle, uploadFolder),
                placeholder,
                setup: (editor) => {
                    addHeaderRowToNewTables(editor);
                    editor.on('init', () => {
                        copyFontFaces(editor);
                        // Name the editing area after the visible label, for screen readers inside the iframe.
                        const label =
                            document.getElementById(labelId)?.textContent;
                        const body = editor.getBody();

                        if (label) {
                            body.setAttribute('aria-label', label);
                        }
                    });
                },
            }}
        />
    );
}
