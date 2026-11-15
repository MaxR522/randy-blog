import { ImageUp } from 'lucide-react';
import { useId } from 'react';
import { FileDropZone } from '@/components/admin/file-drop-zone';
import { FieldError } from '@/components/admin/text-field';
import { Button } from '@/components/public/button';
import { ACCEPTED_IMAGE_TYPES, formatSize } from '@/helpers/media-upload';
import { useImageUpload } from '@/hooks/use-image-upload';
import { adminLabels } from '@/lib/labels.admin.fr';
import { cn } from '@/lib/utils';

const text = adminLabels.imageUploader;

type ImageUploaderProps = {
    label: string;
    /** The picked file, sent with the form on save, which uploads it and deletes the image it replaces. */
    value: File | null;
    /** The image already saved, shown while no file is picked. */
    existingUrl?: string | null;
    /** A file, or `null` when the author removes the image (the parent also forgets `existingUrl`). */
    onChange: (file: File | null) => void;
    error?: string;
    aspect?: 'cover' | 'avatar';
};

/**
 * Image field with a local preview: drop zone when empty, preview with « Remplacer » and « Retirer » once filled.
 * The type and size are checked here for quick feedback; the server checks them again.
 */
export function ImageUploader({
    label,
    value,
    existingUrl = null,
    onChange,
    error,
    aspect = 'cover',
}: ImageUploaderProps) {
    const id = useId();
    const upload = useImageUpload({ value, existingUrl, onChange });
    const { previewUrl, dimensions } = upload;
    const shownError = upload.localError ?? error;
    const errorId = `${id}-erreur`;
    const helpId = `${id}-aide`;
    const describedBy = [helpId, shownError ? errorId : null]
        .filter(Boolean)
        .join(' ');

    const meta = value
        ? [
              value.name,
              dimensions && `${dimensions.width} × ${dimensions.height}`,
              formatSize(value.size),
          ]
              .filter(Boolean)
              .join(' · ')
        : text.currentImage;

    const input = (
        <input
            ref={upload.inputRef}
            id={id}
            type="file"
            accept={ACCEPTED_IMAGE_TYPES.join(',')}
            aria-describedby={describedBy}
            aria-invalid={shownError ? true : undefined}
            className="sr-only"
            onChange={upload.changeFile}
        />
    );

    return (
        <div className="flex flex-col gap-2">
            {previewUrl ? (
                <>
                    <span className="text-body-small text-primary font-semibold">
                        {label}
                    </span>
                    <div
                        className={cn(
                            'tablet:items-center grid gap-5',
                            aspect === 'cover'
                                ? 'tablet:grid-cols-[20rem_1fr]'
                                : 'tablet:grid-cols-[10rem_1fr]',
                        )}
                    >
                        <img
                            src={previewUrl}
                            alt={text.preview(label)}
                            onLoad={(event) =>
                                upload.readDimensions(event.currentTarget)
                            }
                            className={cn(
                                'bg-grey-subtle w-full rounded-sm object-cover',
                                aspect === 'cover'
                                    ? 'aspect-cover'
                                    : 'aspect-avatar max-w-40',
                            )}
                        />
                        <div className="flex min-w-0 flex-col items-start gap-2.5">
                            <p className="text-body-small font-medium break-all">
                                {meta}
                            </p>
                            <div className="flex flex-wrap gap-2">
                                <label
                                    htmlFor={id}
                                    className="border-primary text-button text-primary hover:bg-grey-subtle has-focus-visible:outline-accent-600 inline-flex h-11 cursor-pointer items-center rounded-md border bg-white px-5 font-semibold has-focus-visible:outline-2 has-focus-visible:outline-offset-2"
                                >
                                    {text.replace}
                                    <span className="sr-only">
                                        {' '}
                                        : {label.toLowerCase()}
                                    </span>
                                    {input}
                                </label>
                                <Button
                                    variant="ghost"
                                    className="text-red-700"
                                    onClick={upload.remove}
                                >
                                    {text.remove}
                                    <span className="sr-only">
                                        {' '}
                                        : {label.toLowerCase()}
                                    </span>
                                </Button>
                            </div>
                            <p
                                id={helpId}
                                className="text-caption text-grey-dark"
                            >
                                {text.help}
                            </p>
                        </div>
                    </div>
                </>
            ) : (
                <>
                    <label
                        htmlFor={id}
                        className="text-body-small text-primary font-semibold"
                    >
                        {label}
                    </label>
                    <FileDropZone
                        htmlFor={id}
                        icon={ImageUp}
                        text={text.drop}
                        isDragging={upload.isDragging}
                        hasError={Boolean(shownError)}
                        dropZoneProps={upload.dropZoneProps}
                    >
                        {input}
                    </FileDropZone>
                    <p id={helpId} className="text-caption text-grey-dark">
                        {text.help}
                    </p>
                </>
            )}
            {shownError && <FieldError id={errorId}>{shownError}</FieldError>}
        </div>
    );
}
