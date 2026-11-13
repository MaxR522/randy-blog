import { useHttp } from '@inertiajs/react';
import { X } from 'lucide-react';
import { useEffect, useId, useState } from 'react';
import { preview } from '@/actions/App/Http/Controllers/Admin/NewsletterController';
import { useModalDialog } from '@/components/admin/modal';
import { adminLabels } from '@/lib/labels.admin.fr';
import { cn } from '@/lib/utils';

const text = adminLabels.newsletterPreview;

type PreviewFields = { subject: string; preheader: string; content: string };

type NewsletterPreviewModalProps = {
    isOpen: boolean;
    onClose: () => void;
    /** The composer's current fields, unsaved ones included. */
    fields: PreviewFields;
};

type Format = 'desktop' | 'mobile';

const frameWidths: Record<Format, string> = {
    desktop: 'w-160',
    mobile: 'w-90',
};

/**
 * « Aperçu » (ADM-SUB-23): the final email, rendered by the server, in a desktop or a phone width. Full screen on phones.
 * The email sits in a sandboxed iframe, so its styles and links stay out of the admin.
 */
export function NewsletterPreviewModal({
    isOpen,
    onClose,
    fields,
}: NewsletterPreviewModalProps) {
    const titleId = useId();
    const { dialogRef, closeOnVeilClick } = useModalDialog(isOpen, onClose);

    return (
        <dialog
            ref={dialogRef}
            aria-labelledby={titleId}
            onClose={onClose}
            onClick={closeOnVeilClick}
            className="backdrop:bg-primary/50 text-primary tablet:m-auto tablet:h-[calc(100dvh-4rem)] tablet:w-[calc(100%-4rem)] tablet:max-w-5xl tablet:rounded-lg m-0 h-dvh max-h-none w-full max-w-none bg-white p-0"
        >
            {isOpen && (
                <PreviewContent
                    titleId={titleId}
                    onClose={onClose}
                    fields={fields}
                />
            )}
        </dialog>
    );
}

function PreviewContent({
    titleId,
    onClose,
    fields,
}: {
    titleId: string;
    onClose: () => void;
    fields: PreviewFields;
}) {
    const [format, setFormat] = useState<Format>('desktop');
    const [html, setHtml] = useState<string | null>(null);
    const [hasFailed, setHasFailed] = useState(false);
    const http = useHttp<PreviewFields, { html: string }>(fields);

    useEffect(() => {
        http.post(preview.url(), {
            onSuccess: (response) => setHtml(response.html),
            onError: () => setHasFailed(true),
            onHttpException: () => {
                setHasFailed(true);

                return false;
            },
            onNetworkError: () => {
                setHasFailed(true);

                return false;
            },
        }).catch(() => undefined);
    }, []);

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
                    {(['desktop', 'mobile'] as const).map((value) => (
                        <button
                            key={value}
                            type="button"
                            aria-pressed={format === value}
                            onClick={() => setFormat(value)}
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
                    onClick={onClose}
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
