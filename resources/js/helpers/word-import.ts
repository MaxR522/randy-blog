import type { WordImportResult } from '@/types/admin';

/** Same limit as the server rule on the Word import. */
export const WORD_MAX_BYTES = 20 * 1024 * 1024;

export const WORD_TEMPLATE_URL = '/modeles/modele-article.docx';

/**
 * Word heading styles become the article's heading levels (h1 is the page title); underline is kept.
 * Mammoth matches style names regardless of case, so French Word's « heading 1 » matches too.
 */
const STYLE_MAP = [
    "p[style-name='Title'] => p:fresh",
    "p[style-name='Subtitle'] => p:fresh",
    "p[style-name='Heading 1'] => h2:fresh",
    "p[style-name='Heading 2'] => h3:fresh",
    "p[style-name='Heading 3'] => h4:fresh",
    'u => u',
];

/** Where the import stands: nothing picked, the file being checked, a file error, or the server's report. */
export type WordImportStep =
    | { name: 'empty' }
    | { name: 'checking'; file: File }
    | { name: 'fileError'; file: File | null; message: string }
    | { name: 'checked'; file: File; result: WordImportResult };

/**
 * Whether the file is a .docx: its name, then the ZIP signature every .docx starts with.
 */
export async function isDocx(file: File): Promise<boolean> {
    if (!file.name.toLowerCase().endsWith('.docx')) {
        return false;
    }

    const signature = new Uint8Array(await file.slice(0, 4).arrayBuffer());

    return (
        signature[0] === 0x50 &&
        signature[1] === 0x4b &&
        signature[2] === 0x03 &&
        signature[3] === 0x04
    );
}

/**
 * HTML of the document, converted in the browser. Images keep an empty source: the server only counts them.
 */
export async function documentHtml(file: File): Promise<string> {
    const { default: mammoth } = await import('mammoth');
    const result = await mammoth.convertToHtml(
        { arrayBuffer: await file.arrayBuffer() },
        {
            styleMap: STYLE_MAP,
            convertImage: mammoth.images.imgElement(() =>
                Promise.resolve({ src: '' }),
            ),
        },
    );

    return result.value;
}

/**
 * Size of the picked document, « 820 Ko » or « 1,5 Mo » (always one decimal, unlike `formatSize`).
 */
export function wordFileSize(bytes: number): string {
    return bytes < 1024 * 1024
        ? `${Math.max(1, Math.round(bytes / 1024))} Ko`
        : `${(bytes / 1024 / 1024).toFixed(1).replace('.', ',')} Mo`;
}
