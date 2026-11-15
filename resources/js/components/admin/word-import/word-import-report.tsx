import {
    CircleAlert,
    CircleCheck,
    LoaderCircle,
    TriangleAlert,
} from 'lucide-react';
import type { WordImportStep } from '@/helpers/word-import';
import { adminLabels } from '@/lib/labels.admin.fr';

const text = adminLabels.wordImport;

type WordImportReportProps = {
    step: WordImportStep;
    /** Whether the form already has a title, chapô or content, which the import replaces (ADM-ART-42). */
    hasContent: boolean;
};

/**
 * Where the check stands: in progress, a file error, the template errors, or the summary of what will be imported
 * with its warnings and the replace notice.
 */
export function WordImportReport({ step, hasContent }: WordImportReportProps) {
    const result = step.name === 'checked' ? step.result : null;
    const isReady = result !== null && result.errors.length === 0;

    return (
        <>
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
                            {text.summaryChapo(result.summary.leadParagraphs)}
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
        </>
    );
}
