import { FileText } from 'lucide-react';
import type { ReactNode } from 'react';
import { wordFileSize } from '@/helpers/word-import';
import { adminLabels } from '@/lib/labels.admin.fr';

const text = adminLabels.wordImport;

type WordFileRowProps = {
    file: File;
    inputId: string;
    /** The file input, inside « Changer ». */
    input: ReactNode;
    /** « Changer » is hidden while the file is being checked. */
    canChange: boolean;
};

/**
 * The picked document: its name and size, and « Changer » to pick another one.
 */
export function WordFileRow({
    file,
    inputId,
    input,
    canChange,
}: WordFileRowProps) {
    return (
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
                {wordFileSize(file.size)}
            </span>
            {canChange && (
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
    );
}
