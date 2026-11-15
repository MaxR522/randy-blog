import { Button } from '@/components/public/button';
import { frenchTime } from '@/lib/article-autosave';
import { adminLabels } from '@/lib/labels.admin.fr';

const text = adminLabels.editor;

type RestoreAutosaveBannerProps = {
    savedAt: Date;
    onDiscard: () => void;
    onRestore: () => void;
};

/**
 * Offers the copy an earlier visit left in the browser.
 */
export function RestoreAutosaveBanner({
    savedAt,
    onDiscard,
    onRestore,
}: RestoreAutosaveBannerProps) {
    return (
        <div
            role="status"
            className="border-accent-200 bg-accent-50 text-body-small tablet:flex-row tablet:items-center tablet:justify-between mb-6 flex flex-col gap-3 rounded-md border px-4 py-3"
        >
            <p>
                {text.restoreTitle(frenchTime(savedAt))} {text.restoreCoverNote}
            </p>
            <div className="flex flex-none gap-2">
                <Button variant="secondary" onClick={onDiscard}>
                    {text.discard}
                </Button>
                <Button onClick={onRestore}>{text.restore}</Button>
            </div>
        </div>
    );
}
