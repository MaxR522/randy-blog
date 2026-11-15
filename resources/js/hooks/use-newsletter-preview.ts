import { useHttp } from '@inertiajs/react';
import { useRef, useState } from 'react';
import { preview } from '@/actions/App/Http/Controllers/Admin/NewsletterController';
import type {
    NewsletterPreviewFields,
    PreviewFormat,
} from '@/helpers/newsletter-preview';

/**
 * « Aperçu » (ADM-SUB-23): the modal's opening, the email rendered by the server from the composer's current
 * fields, unsaved ones included, and the desktop or phone width. A response that arrives after `close()` is ignored.
 */
export function useNewsletterPreview() {
    const [isOpen, setIsOpen] = useState(false);
    const [format, setFormat] = useState<PreviewFormat>('desktop');
    const [html, setHtml] = useState<string | null>(null);
    const [hasFailed, setHasFailed] = useState(false);
    const generation = useRef(0);
    const http = useHttp<NewsletterPreviewFields, { html: string }>({
        subject: '',
        preheader: '',
        content: '',
    });

    function open(fields: NewsletterPreviewFields): void {
        const current = ++generation.current;

        function fail(): false {
            if (current === generation.current) {
                setHasFailed(true);
            }

            return false;
        }

        setFormat('desktop');
        setHtml(null);
        setHasFailed(false);
        setIsOpen(true);
        http.transform(() => fields);
        http.post(preview.url(), {
            onSuccess: (response) => {
                if (current === generation.current) {
                    setHtml(response.html);
                }
            },
            onError: () => fail(),
            onHttpException: fail,
            onNetworkError: fail,
        }).catch(() => undefined);
    }

    function close(): void {
        generation.current++;
        setIsOpen(false);
    }

    return {
        isOpen,
        format,
        html,
        hasFailed,
        open,
        close,
        changeFormat: setFormat,
    };
}

export type NewsletterPreview = ReturnType<typeof useNewsletterPreview>;
