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

/**
 * A text button added to the toolbar, such as the newsletter's « Insérer un article ». Its name goes in the toolbar.
 */
export type ToolbarButton = {
    name: string;
    text: string;
    icon?: string;
    onAction: (editor: TinyMCEInstance) => void;
};

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
    toolbarButtons?: ToolbarButton[];
    /**
     * Called instead of `onChange` when TinyMCE rewrites the loaded HTML on its own (whitespace, attribute order),
     * so the page can take it as its saved state rather than as an unsaved change.
     */
    onNormalize?: (html: string) => void;
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
 * The newsletter's article card placeholders (ADM-SUB-21) are previews: not editable in the editor, and saved without
 * the attribute that makes them so. The server renders the real card from `data-article-card`.
 */
function protectArticleCards(editor: TinyMCEInstance): void {
    editor.on('PreInit', () => {
        editor.parser.addAttributeFilter('data-article-card', (nodes) => {
            nodes.forEach((node) => node.attr('contenteditable', 'false'));
        });
        editor.serializer.addAttributeFilter('data-article-card', (nodes) => {
            nodes.forEach((node) => node.attr('contenteditable', null));
        });
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
    toolbarButtons = [],
    onNormalize,
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
            onEditorChange={(html, instance) => {
                if (onNormalize && !instance.isDirty()) {
                    onNormalize(html);
                } else {
                    onChange(html);
                }
            }}
            init={{
                ...tinymceOptions(config, contentStyle, uploadFolder),
                placeholder,
                setup: (editor) => {
                    addHeaderRowToNewTables(editor);

                    if (config === 'newsletter') {
                        protectArticleCards(editor);
                    }

                    toolbarButtons.forEach((button) => {
                        editor.ui.registry.addButton(button.name, {
                            text: button.text,
                            icon: button.icon,
                            onAction: () => button.onAction(editor),
                        });
                    });

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
