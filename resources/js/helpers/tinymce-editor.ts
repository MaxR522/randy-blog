import type { Editor as TinyMCEInstance } from 'tinymce';

/**
 * A text button added to the toolbar, such as the newsletter's « Insérer un article ». Its name goes in the toolbar.
 */
export type ToolbarButton = {
    name: string;
    text: string;
    icon?: string;
    onAction: (editor: TinyMCEInstance) => void;
};

/**
 * The page's self-hosted Inter, copied into the editor iframe, which does not inherit the page's `@font-face` rules.
 */
export function copyFontFaces(editor: TinyMCEInstance): void {
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
export function addHeaderRowToNewTables(editor: TinyMCEInstance): void {
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
export function protectArticleCards(editor: TinyMCEInstance): void {
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
 * Adds the page's own text buttons to the toolbar registry.
 */
export function registerToolbarButtons(
    editor: TinyMCEInstance,
    buttons: ToolbarButton[],
): void {
    buttons.forEach((button) => {
        editor.ui.registry.addButton(button.name, {
            text: button.text,
            icon: button.icon,
            onAction: () => button.onAction(editor),
        });
    });
}

/**
 * Names the editing area after the visible label, for screen readers inside the iframe.
 */
export function labelEditorBody(
    editor: TinyMCEInstance,
    labelId: string,
): void {
    const label = document.getElementById(labelId)?.textContent;

    if (label) {
        editor.getBody().setAttribute('aria-label', label);
    }
}
