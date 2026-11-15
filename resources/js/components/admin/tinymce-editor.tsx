import { Editor } from '@tinymce/tinymce-react';
import { useState } from 'react';
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
import type { ToolbarButton } from '@/helpers/tinymce-editor';
import {
    addHeaderRowToNewTables,
    copyFontFaces,
    labelEditorBody,
    protectArticleCards,
    registerToolbarButtons,
} from '@/helpers/tinymce-editor';
import { useTinymceBodyAria } from '@/hooks/use-tinymce-body-aria';
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
    toolbarButtons?: ToolbarButton[];
    /**
     * Called instead of `onChange` when TinyMCE rewrites the loaded HTML on its own (whitespace, attribute order),
     * so the page can take it as its saved state rather than as an unsaved change.
     */
    onNormalize?: (html: string) => void;
};

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

    useTinymceBodyAria(editor, isInvalid, description);

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

                    registerToolbarButtons(editor, toolbarButtons);

                    editor.on('init', () => {
                        copyFontFaces(editor);
                        labelEditorBody(editor, labelId);
                    });
                },
            }}
        />
    );
}
