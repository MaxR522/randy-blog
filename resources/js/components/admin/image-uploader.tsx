import { ImageUp } from 'lucide-react';
import type { ChangeEvent, DragEvent } from 'react';
import { useEffect, useId, useRef, useState } from 'react';
import { FieldError } from '@/components/admin/text-field';
import { Button } from '@/components/public/button';
import { adminLabels } from '@/lib/labels.admin.fr';
import { cn } from '@/lib/utils';

const text = adminLabels.imageUploader;

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const MAX_BYTES = 10 * 1024 * 1024;

const sizeFormatter = new Intl.NumberFormat('fr-FR', {
    maximumFractionDigits: 1,
});

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

type Dimensions = { width: number; height: number };

function formatSize(bytes: number): string {
    return bytes >= 1024 * 1024
        ? `${sizeFormatter.format(bytes / (1024 * 1024))} Mo`
        : `${Math.max(1, Math.round(bytes / 1024))} Ko`;
}

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
    const inputRef = useRef<HTMLInputElement>(null);
    const [fileUrl, setFileUrl] = useState<string | null>(null);
    const [dimensions, setDimensions] = useState<Dimensions | null>(null);
    const [localError, setLocalError] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);

    useEffect(() => {
        if (!value) {
            setFileUrl(null);

            return;
        }

        const url = URL.createObjectURL(value);
        setFileUrl(url);

        return () => URL.revokeObjectURL(url);
    }, [value]);

    const previewUrl = fileUrl ?? existingUrl;
    const shownError = localError ?? error;
    const errorId = `${id}-erreur`;
    const helpId = `${id}-aide`;
    const describedBy = [helpId, shownError ? errorId : null]
        .filter(Boolean)
        .join(' ');

    function pick(file: File | undefined) {
        if (!file) {
            return;
        }

        if (!ACCEPTED_TYPES.includes(file.type)) {
            setLocalError(text.invalidType);

            return;
        }

        if (file.size > MAX_BYTES) {
            setLocalError(text.tooLarge);

            return;
        }

        setLocalError(null);
        setDimensions(null);
        onChange(file);
    }

    function handleChange(event: ChangeEvent<HTMLInputElement>) {
        pick(event.target.files?.[0]);
        // Picking the same file again after « Retirer » must fire a change.
        event.target.value = '';
    }

    function handleDrop(event: DragEvent<HTMLLabelElement>) {
        event.preventDefault();
        setIsDragging(false);
        pick(event.dataTransfer.files[0]);
    }

    function handleRemove() {
        setLocalError(null);
        setDimensions(null);
        onChange(null);
        inputRef.current?.focus();
    }

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
            ref={inputRef}
            id={id}
            type="file"
            accept={ACCEPTED_TYPES.join(',')}
            aria-describedby={describedBy}
            aria-invalid={shownError ? true : undefined}
            className="sr-only"
            onChange={handleChange}
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
                                value &&
                                setDimensions({
                                    width: event.currentTarget.naturalWidth,
                                    height: event.currentTarget.naturalHeight,
                                })
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
                                    onClick={handleRemove}
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
                    {/* The drop zone is a second label of the same input: a click opens the file picker. */}
                    <label
                        htmlFor={id}
                        onDragOver={(event) => {
                            event.preventDefault();
                            setIsDragging(true);
                        }}
                        onDragLeave={() => setIsDragging(false)}
                        onDrop={handleDrop}
                        className={cn(
                            'text-body-small has-focus-visible:outline-accent-600 flex cursor-pointer flex-col items-center gap-2.5 rounded-md border border-dashed px-6 py-7 text-center transition-colors duration-(--duration-fast) has-focus-visible:outline-2 has-focus-visible:outline-offset-2',
                            isDragging
                                ? 'border-primary bg-grey-subtle'
                                : 'border-grey-medium hover:bg-grey-subtle',
                            shownError && 'border-red-600',
                        )}
                    >
                        <ImageUp
                            aria-hidden="true"
                            className="text-primary size-7"
                            strokeWidth={1.75}
                        />
                        <span className="font-medium">{text.drop}</span>
                        {input}
                    </label>
                    <p id={helpId} className="text-caption text-grey-dark">
                        {text.help}
                    </p>
                </>
            )}
            {shownError && <FieldError id={errorId}>{shownError}</FieldError>}
        </div>
    );
}
