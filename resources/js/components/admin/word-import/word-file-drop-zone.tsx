import { Download, Upload } from 'lucide-react';
import type { ReactNode } from 'react';
import { WORD_TEMPLATE_URL } from '@/helpers/word-import';
import { useFileDrop } from '@/hooks/use-file-drop';
import { adminLabels } from '@/lib/labels.admin.fr';
import { cn } from '@/lib/utils';

const text = adminLabels.wordImport;

type WordFileDropZoneProps = {
    inputId: string;
    /** The file input, inside the zone. */
    input: ReactNode;
    onFile: (file: File | undefined) => void;
};

/**
 * Before a file is picked: the template download, the drop zone that labels the file input, and the note on images.
 */
export function WordFileDropZone({
    inputId,
    input,
    onFile,
}: WordFileDropZoneProps) {
    const { isDragging, dropZoneProps } = useFileDrop(onFile);

    return (
        <>
            <div className="bg-grey-subtle rounded-md px-3.5 pt-3.5 pb-1.5">
                <p className="text-body-small">{text.templateIntro}</p>
                <a
                    href={WORD_TEMPLATE_URL}
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
                {...dropZoneProps}
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
            <p className="text-caption text-grey-dark">{text.imagesNote}</p>
        </>
    );
}
