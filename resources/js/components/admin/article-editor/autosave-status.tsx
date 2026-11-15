import { frenchTime } from '@/lib/article-autosave';
import { adminLabels } from '@/lib/labels.admin.fr';

const text = adminLabels.editor;

type AutosaveStatusProps = {
    savedAt: Date | null;
};

/**
 * Time of the last copy kept in the browser, announced politely when it changes.
 */
export function AutosaveStatus({ savedAt }: AutosaveStatusProps) {
    return (
        <p
            className="text-caption text-grey-dark mb-6 min-h-4.5"
            aria-live="polite"
        >
            {savedAt && text.autosavedAt(frenchTime(savedAt))}
        </p>
    );
}
