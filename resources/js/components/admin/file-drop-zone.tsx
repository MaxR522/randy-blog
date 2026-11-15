import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import type { FileDrop } from '@/hooks/use-file-drop';
import { cn } from '@/lib/utils';

type FileDropZoneProps = {
    /** Id of the file input it labels. */
    htmlFor: string;
    icon: LucideIcon;
    text: string;
    isDragging: boolean;
    hasError: boolean;
    dropZoneProps: FileDrop['dropZoneProps'];
    /** The file input, inside the zone. */
    children: ReactNode;
};

/**
 * Dashed drop zone of an empty file field. It is a second label of the same input: a click opens the file picker.
 */
export function FileDropZone({
    htmlFor,
    icon: Icon,
    text,
    isDragging,
    hasError,
    dropZoneProps,
    children,
}: FileDropZoneProps) {
    return (
        <label
            htmlFor={htmlFor}
            {...dropZoneProps}
            className={cn(
                'text-body-small has-focus-visible:outline-accent-600 flex cursor-pointer flex-col items-center gap-2.5 rounded-md border border-dashed px-6 py-7 text-center transition-colors duration-(--duration-fast) has-focus-visible:outline-2 has-focus-visible:outline-offset-2',
                isDragging
                    ? 'border-primary bg-grey-subtle'
                    : 'border-grey-medium hover:bg-grey-subtle',
                hasError && 'border-red-600',
            )}
        >
            <Icon
                aria-hidden="true"
                className="text-primary size-7"
                strokeWidth={1.75}
            />
            <span className="font-medium">{text}</span>
            {children}
        </label>
    );
}
