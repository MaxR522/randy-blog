import type { ChangeEvent } from 'react';
import { useRef, useState } from 'react';
import { ACCEPTED_IMAGE_TYPES, MAX_IMAGE_BYTES } from '@/helpers/media-upload';
import { useFileDrop } from '@/hooks/use-file-drop';
import { useObjectUrl } from '@/hooks/use-object-url';
import { adminLabels } from '@/lib/labels.admin.fr';

const text = adminLabels.imageUploader;

type Dimensions = { width: number; height: number };

type ImageUploadOptions = {
    value: File | null;
    existingUrl: string | null;
    onChange: (file: File | null) => void;
};

/**
 * Behaviour of an image field: the local preview, the picked image's size in pixels, the quick type and size check,
 * drag and drop, « Retirer ».
 */
export function useImageUpload({
    value,
    existingUrl,
    onChange,
}: ImageUploadOptions) {
    const inputRef = useRef<HTMLInputElement>(null);
    const fileUrl = useObjectUrl(value);
    const [dimensions, setDimensions] = useState<Dimensions | null>(null);
    const [localError, setLocalError] = useState<string | null>(null);

    function pick(file: File | undefined): void {
        if (!file) {
            return;
        }

        if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
            setLocalError(text.invalidType);

            return;
        }

        if (file.size > MAX_IMAGE_BYTES) {
            setLocalError(text.tooLarge);

            return;
        }

        setLocalError(null);
        setDimensions(null);
        onChange(file);
    }

    const drop = useFileDrop(pick);

    function changeFile(event: ChangeEvent<HTMLInputElement>): void {
        pick(event.target.files?.[0]);
        // Picking the same file again after « Retirer » must fire a change.
        event.target.value = '';
    }

    function remove(): void {
        setLocalError(null);
        setDimensions(null);
        onChange(null);
        inputRef.current?.focus();
    }

    /** Reads the picked image's size once its preview has loaded; the saved image shows no size. */
    function readDimensions(image: HTMLImageElement): void {
        if (value) {
            setDimensions({
                width: image.naturalWidth,
                height: image.naturalHeight,
            });
        }
    }

    return {
        inputRef,
        previewUrl: fileUrl ?? existingUrl,
        dimensions,
        localError,
        isDragging: drop.isDragging,
        dropZoneProps: drop.dropZoneProps,
        changeFile,
        remove,
        readDimensions,
    };
}
