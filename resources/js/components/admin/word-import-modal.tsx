import { useHttp } from '@inertiajs/react';
import {
    CircleAlert,
    CircleCheck,
    Download,
    FileText,
    LoaderCircle,
    TriangleAlert,
    Upload,
} from 'lucide-react';
import type { ChangeEvent, DragEvent } from 'react';
import { useId, useState } from 'react';
import { Modal, ModalBody, ModalFooter } from '@/components/admin/modal';
import { Button } from '@/components/public/button';
import { adminLabels } from '@/lib/labels.admin.fr';
import { cn } from '@/lib/utils';
import { importWord } from '@/routes/admin/articles';
import type { WordImportResult } from '@/types/admin';

const text = adminLabels.wordImport;

const MAX_BYTES = 20 * 1024 * 1024;

const TEMPLATE_URL = '/modeles/modele-article.docx';

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

type Step =
    | { name: 'empty' }
    | { name: 'checking'; file: File }
    | { name: 'fileError'; file: File | null; message: string }
    | { name: 'checked'; file: File; result: WordImportResult };

type WordImportModalProps = {
    isOpen: boolean;
    onClose: () => void;
    /** Whether the form already has a title, chapô or content, which the import replaces (ADM-ART-42). */
    hasContent: boolean;
    onImport: (fields: WordImportResult['fields']) => void;
};

/**
 * Whether the file is a .docx: its name, then the ZIP signature every .docx starts with.
 */
async function isDocx(file: File): Promise<boolean> {
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
async function documentHtml(file: File): Promise<string> {
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

function fileSize(bytes: number): string {
    return bytes < 1024 * 1024
        ? `${Math.max(1, Math.round(bytes / 1024))} Ko`
        : `${(bytes / 1024 / 1024).toFixed(1).replace('.', ',')} Mo`;
}

/**
 * « Importer depuis Word » (ADM-ART-40…43): the .docx is converted in the browser, checked by the server against
 * the template's markers, and fills the form only once the author confirms. Nothing is saved.
 */
export function WordImportModal({
    isOpen,
    onClose,
    hasContent,
    onImport,
}: WordImportModalProps) {
    return (
        <Modal isOpen={isOpen} onClose={onClose} title={text.title}>
            <WordImportSteps
                onClose={onClose}
                hasContent={hasContent}
                onImport={onImport}
            />
        </Modal>
    );
}

function WordImportSteps({
    onClose,
    hasContent,
    onImport,
}: Omit<WordImportModalProps, 'isOpen'>) {
    const inputId = useId();
    const [step, setStep] = useState<Step>({ name: 'empty' });
    const [isDragging, setIsDragging] = useState(false);
    const http = useHttp<{ html: string }, WordImportResult>({ html: '' });

    async function check(file: File): Promise<void> {
        if (file.size > MAX_BYTES || !(await isDocx(file))) {
            setStep({ name: 'fileError', file, message: text.invalidFile });

            return;
        }

        setStep({ name: 'checking', file });

        let html: string;

        try {
            html = await documentHtml(file);
        } catch {
            setStep({ name: 'fileError', file, message: text.invalidFile });

            return;
        }

        http.transform(() => ({ html }));
        // The callbacks above handle every outcome; the returned promise only repeats them.
        http.post(importWord.url(), {
            onSuccess: (result) => setStep({ name: 'checked', file, result }),
            onError: (errors) =>
                setStep({
                    name: 'fileError',
                    file,
                    message: errors.html ?? text.invalidFile,
                }),
            onHttpException: () => {
                setStep({ name: 'fileError', file, message: text.checkFailed });

                return false;
            },
            onNetworkError: () => {
                setStep({ name: 'fileError', file, message: text.checkFailed });

                return false;
            },
        }).catch(() => undefined);
    }

    function chooseFile(event: ChangeEvent<HTMLInputElement>): void {
        const file = event.target.files?.[0];
        event.target.value = '';

        if (file) {
            void check(file);
        }
    }

    function dropFile(event: DragEvent<HTMLLabelElement>): void {
        event.preventDefault();
        setIsDragging(false);

        const file = event.dataTransfer.files[0];

        if (file) {
            void check(file);
        }
    }

    const file = step.name === 'empty' ? null : step.file;
    const result = step.name === 'checked' ? step.result : null;
    const isReady = result !== null && result.errors.length === 0;
    const input = (
        <input
            id={inputId}
            type="file"
            data-autofocus
            accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            className="sr-only"
            onChange={chooseFile}
        />
    );

    return (
        <>
            <ModalBody className="flex flex-col gap-4">
                <p className="text-grey-dark text-[0.9375rem] leading-[1.55]">
                    {text.intro}
                </p>

                {file === null ? (
                    <>
                        <div className="bg-grey-subtle rounded-md px-3.5 pt-3.5 pb-1.5">
                            <p className="text-body-small">
                                {text.templateIntro}
                            </p>
                            <a
                                href={TEMPLATE_URL}
                                download
                                className="text-body-small text-accent-600 inline-flex min-h-11 items-center gap-1.5 font-medium underline underline-offset-4"
                            >
                                <Download
                                    aria-hidden="true"
                                    className="size-4"
                                    strokeWidth={2}
                                />
                                {text.templateLink}
                            </a>
                        </div>
                        <label
                            htmlFor={inputId}
                            onDragOver={(event) => {
                                event.preventDefault();
                                setIsDragging(true);
                            }}
                            onDragLeave={() => setIsDragging(false)}
                            onDrop={dropFile}
                            className={cn(
                                'has-focus-visible:outline-accent-600 flex cursor-pointer flex-col items-center gap-2.5 rounded-md border border-dashed px-4 py-7 text-center has-focus-visible:outline-2 has-focus-visible:outline-offset-2',
                                isDragging
                                    ? 'border-primary bg-grey-subtle'
                                    : 'border-grey-medium',
                            )}
                        >
                            <Upload
                                aria-hidden="true"
                                className="size-7"
                                strokeWidth={1.75}
                            />
                            <span className="text-[0.9375rem] font-semibold">
                                {text.choose}
                            </span>
                            <span className="text-caption text-grey-dark">
                                {text.dropHint}
                            </span>
                            {input}
                        </label>
                        <p className="text-caption text-grey-dark">
                            {text.imagesNote}
                        </p>
                    </>
                ) : (
                    <div className="border-grey-light flex min-h-14 items-center gap-3 rounded-md border pr-1 pl-3.5">
                        <FileText
                            aria-hidden="true"
                            className="size-5.5 flex-none"
                            strokeWidth={1.75}
                        />
                        <span className="text-body-small min-w-0 flex-1 truncate font-medium">
                            {file.name}
                        </span>
                        <span className="text-caption text-grey-dark flex-none">
                            {fileSize(file.size)}
                        </span>
                        {step.name !== 'checking' && (
                            <label
                                htmlFor={inputId}
                                className="text-button text-primary has-focus-visible:outline-accent-600 inline-flex h-11 flex-none cursor-pointer items-center rounded-md px-3 text-sm font-semibold hover:underline has-focus-visible:outline-2 has-focus-visible:outline-offset-2"
                            >
                                <span aria-hidden="true">{text.change}</span>
                                <span className="sr-only">
                                    {text.changeLabel(file.name)}
                                </span>
                                {input}
                            </label>
                        )}
                    </div>
                )}

                {step.name === 'checking' && (
                    <p
                        role="status"
                        className="text-body-small text-grey-dark flex items-center gap-2 font-medium"
                    >
                        <LoaderCircle
                            aria-hidden="true"
                            className="size-4.5 animate-spin"
                            strokeWidth={2}
                        />
                        {text.checking}
                    </p>
                )}

                {step.name === 'fileError' && (
                    <p
                        role="alert"
                        className="text-body-small flex gap-2 font-medium text-red-700"
                    >
                        <CircleAlert
                            aria-hidden="true"
                            className="mt-0.5 size-4 flex-none"
                            strokeWidth={2}
                        />
                        {step.message}
                    </p>
                )}

                {result !== null && result.errors.length > 0 && (
                    <div
                        role="alert"
                        className="text-body-small rounded-md border border-red-600 bg-red-50 px-3.5 py-3 text-red-700"
                    >
                        <p className="flex gap-2 font-semibold">
                            <CircleAlert
                                aria-hidden="true"
                                className="mt-0.5 size-4 flex-none"
                                strokeWidth={2}
                            />
                            {text.errorsTitle}
                        </p>
                        <ul className="mt-2 flex list-disc flex-col gap-1.5 pl-10.5 font-medium">
                            {result.errors.map((error) => (
                                <li key={error}>{error}</li>
                            ))}
                        </ul>
                    </div>
                )}

                {isReady && (
                    <div
                        role="status"
                        className="text-body-small rounded-md border border-green-600 bg-green-50 px-3.5 py-3 text-green-700"
                    >
                        <p className="flex gap-2 font-semibold">
                            <CircleCheck
                                aria-hidden="true"
                                className="mt-0.5 size-4 flex-none"
                                strokeWidth={2}
                            />
                            {text.readyTitle}
                        </p>
                        <ul className="mt-2 flex list-disc flex-col gap-1 pl-10.5 font-medium">
                            <li>{text.summaryTitle(result.fields.title)}</li>
                            <li>
                                {text.summaryChapo(
                                    result.summary.leadParagraphs,
                                )}
                            </li>
                            <li>
                                {text.summaryContent(
                                    result.summary.words,
                                    result.summary.headings,
                                    result.summary.callouts,
                                )}
                            </li>
                        </ul>
                    </div>
                )}

                {isReady &&
                    result.warnings.map((warning) => (
                        <p
                            key={warning}
                            className="text-body-small flex gap-2 rounded-md border border-yellow-600 bg-yellow-50 px-3.5 py-3 font-medium text-yellow-800"
                        >
                            <TriangleAlert
                                aria-hidden="true"
                                className="mt-0.5 size-4 flex-none"
                                strokeWidth={2}
                            />
                            {warning}
                        </p>
                    ))}

                {isReady && hasContent && (
                    <p className="text-body-small rounded-md border border-yellow-600 bg-yellow-50 px-3.5 py-3 font-medium text-yellow-800">
                        {text.replaceNotice}
                    </p>
                )}
            </ModalBody>
            <ModalFooter>
                <Button variant="secondary" onClick={onClose}>
                    {adminLabels.modal.cancel}
                </Button>
                <Button
                    disabled={!isReady}
                    onClick={() => {
                        if (isReady) {
                            onImport(result.fields);
                        }
                    }}
                >
                    {isReady && hasContent ? text.replace : text.submit}
                </Button>
            </ModalFooter>
        </>
    );
}
