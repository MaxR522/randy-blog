import { Eye } from 'lucide-react';
import { labels } from '@/lib/labels.fr';

/**
 * Above the navbar of an article preview, which only the logged-in author can open (PUB-ART-13).
 */
export function PreviewBanner({ isPublished }: { isPublished: boolean }) {
    return (
        <div className="border-b border-yellow-600 bg-yellow-50 text-yellow-800">
            <p className="px-gutter text-body-small mx-auto flex min-h-11 w-full max-w-7xl items-center gap-2 py-2 font-medium">
                <Eye
                    aria-hidden="true"
                    className="size-4.5 flex-none"
                    strokeWidth={1.75}
                />
                {isPublished
                    ? labels.article.previewPublished
                    : labels.article.preview}
            </p>
        </div>
    );
}
