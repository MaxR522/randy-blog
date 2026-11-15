import { TriangleAlert } from 'lucide-react';
import { adminLabels } from '@/lib/labels.admin.fr';

const text = adminLabels.accessibilityWarnings;

type AccessibilityWarningsProps = {
    warnings: string[];
};

/**
 * Accessibility problems the server found in the saved article; they do not block saving.
 */
export function AccessibilityWarnings({
    warnings,
}: AccessibilityWarningsProps) {
    if (warnings.length === 0) {
        return null;
    }

    return (
        <div
            role="status"
            className="text-body-small mb-6 rounded-md border border-yellow-600 bg-yellow-50 px-4 py-3.5 text-yellow-800"
        >
            <p className="flex gap-2 font-semibold">
                <TriangleAlert
                    aria-hidden="true"
                    className="mt-0.5 size-4 flex-none"
                    strokeWidth={2}
                />
                {text.title}
            </p>
            <ul className="mt-2 flex list-disc flex-col gap-1.5 pl-10.5 font-medium">
                {warnings.map((warning) => (
                    <li key={warning}>{warning}</li>
                ))}
            </ul>
            <p className="mt-2.5 pl-6">{text.note}</p>
        </div>
    );
}
