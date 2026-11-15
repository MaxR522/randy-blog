import type { DragEvent } from 'react';
import { useState } from 'react';

/**
 * Drag and drop on a file drop zone: whether a file hovers it, and the handlers to spread on the zone.
 * The dropped file goes to `onFile`, like a file picked from the input.
 */
export function useFileDrop(onFile: (file: File | undefined) => void) {
    const [isDragging, setIsDragging] = useState(false);

    return {
        isDragging,
        dropZoneProps: {
            onDragOver: (event: DragEvent<HTMLLabelElement>): void => {
                event.preventDefault();
                setIsDragging(true);
            },
            onDragLeave: (): void => setIsDragging(false),
            onDrop: (event: DragEvent<HTMLLabelElement>): void => {
                event.preventDefault();
                setIsDragging(false);
                onFile(event.dataTransfer.files[0]);
            },
        },
    };
}

export type FileDrop = ReturnType<typeof useFileDrop>;
