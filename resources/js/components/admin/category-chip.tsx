import { X } from 'lucide-react';
import { adminLabels } from '@/lib/labels.admin.fr';

const text = adminLabels.editor;

type CategoryChipProps = {
    name: string;
    onRemove: () => void;
};

/**
 * A chosen category in the picker, with its remove button.
 */
export function CategoryChip({ name, onRemove }: CategoryChipProps) {
    return (
        <span className="border-accent-200 bg-accent-50 text-accent-700 inline-flex h-7 items-center gap-0.5 rounded-sm border pl-2 text-xs font-semibold">
            {name}
            <button
                type="button"
                onClick={onRemove}
                aria-label={text.removeCategory(name)}
                className="hover:bg-accent-100 relative inline-flex size-7 items-center justify-center rounded-sm after:absolute after:-inset-2"
            >
                <X className="size-3.5" aria-hidden="true" />
            </button>
        </span>
    );
}
