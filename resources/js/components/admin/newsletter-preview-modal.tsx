import { X } from 'lucide-react';
import { useId } from 'react';
import type { PreviewFormat } from '@/helpers/newsletter-preview';
import { previewFormats } from '@/helpers/newsletter-preview';
import { useModalDialog } from '@/hooks/use-modal-dialog';
import type { NewsletterPreview } from '@/hooks/use-newsletter-preview';
import { adminLabels } from '@/lib/labels.admin.fr';
import { cn } from '@/lib/utils';

const text = adminLabels.newsletterPreview;

type NewsletterPreviewModalProps = {
    preview: NewsletterPreview;
};

const frameWidths: Record<PreviewFormat, string> = {
    desktop: 'w-160',
    mobile: 'w-90',
};

/**
 * « Aperçu » (ADM-SUB-23): the final email, rendered by the server, in a desktop or a phone width. Full screen on phones.
 * The email sits in a sandboxed iframe, so its styles and links stay out of the admin.
 */
export function NewsletterPreviewModal({
    preview,
}: NewsletterPreviewModalProps) {
    const titleId = useId();
    const { dialogRef, closeOnVeilClick } = useModalDialog(
        preview.isOpen,
        preview.close,
    );

    return (
        <dialog
            ref={dialogRef}
            aria-labelledby={titleId}
            onClose={preview.close}
            onClick={closeOnVeilClick}
            className="backdrop:bg-primary/50 text-primary tablet:m-auto tablet:h-[calc(100dvh-4rem)] tablet:w-[calc(100%-4rem)] tablet:max-w-5xl tablet:rounded-lg m-0 h-dvh max-h-none w-full max-w-none bg-white p-0"
        >
            {preview.isOpen && (
                <PreviewContent titleId={titleId} preview={preview} />
            )}
        </dialog>
    );
}

function PreviewContent({
    titleId,
    preview,
}: {
    titleId: string;
    preview: NewsletterPreview;
}) {
    const { format, html, hasFailed } = preview;

    return (
        <div className="flex h-full flex-col">
            <div className="border-grey-light tablet:px-4 flex h-14 flex-none items-center gap-3 border-b px-1">
                <h2
                    id={titleId}
                    className="tablet:text-xl tablet:pl-0 flex-1 pl-3 text-[1.0625rem] font-semibold"
                >
                    {text.title}
                </h2>
                <div
                    role="group"
                    aria-label={text.format}
                    className="border-grey-medium flex h-10 overflow-hidden rounded-md border"
                >
                    {previewFormats.map((value) => (
                        <button
                            key={value}
                            type="button"
                            aria-pressed={format === value}
                            onClick={() => preview.changeFormat(value)}
                            className={cn(
                                'border-grey-light cursor-pointer px-3.5 text-sm not-first:border-l',
                                format === value
                                    ? 'bg-primary font-semibold text-white'
                                    : 'text-primary bg-white font-medium',
                            )}
                        >
                            {text[value]}
                        </button>
                    ))}
                </div>
                <button
                    type="button"
                    onClick={preview.close}
                    aria-label={text.close}
                    className="text-primary flex size-11 flex-none cursor-pointer items-center justify-center rounded-md"
                >
                    <X
                        aria-hidden="true"
                        className="size-5.5"
                        strokeWidth={1.75}
                    />
                </button>
            </div>
            <div className="bg-grey-subtle flex min-h-0 flex-1 justify-center overflow-auto">
                {html !== null ? (
                    <iframe
                        title={text.frameTitle}
                        sandbox=""
                        srcDoc={html}
                        className={cn(
                            'h-full max-w-full flex-none border-0 bg-white',
                            frameWidths[format],
                        )}
                    />
                ) : (
                    <p
                        role="status"
                        className="text-body-small text-grey-dark self-center"
                    >
                        {hasFailed ? text.failed : text.loading}
                    </p>
                )}
            </div>
        </div>
    );
}
