import { useEffect, useId } from 'react';
import { AvatarPlaceholder } from '@/components/admin/account/avatar-placeholder';
import { EditorActions } from '@/components/admin/account/editor-actions';
import { SquareCropper } from '@/components/admin/account/square-cropper';
import { FieldError, TextField } from '@/components/admin/text-field';
import { ACCEPTED_IMAGE_TYPES, formatSize } from '@/helpers/media-upload';
import type { AvatarForm } from '@/hooks/use-avatar-form';
import { adminLabels } from '@/lib/labels.admin.fr';

const text = adminLabels.account;

type AvatarEditorProps = {
    form: AvatarForm;
    currentUrl: string | null;
    onCancel: () => void;
};

/**
 * Inline editor of the avatar (ADM-ACC-1): the current image or the square cropper, the file picker and the credit.
 */
export function AvatarEditor({
    form,
    currentUrl,
    onCancel,
}: AvatarEditorProps) {
    const inputId = useId();
    const helpId = `${inputId}-aide`;
    const errorId = `${inputId}-erreur`;

    // The editor opens on its first control.
    useEffect(() => document.getElementById(inputId)?.focus(), [inputId]);

    return (
        <form onSubmit={form.submit} className="flex flex-col gap-4" noValidate>
            <div className="tablet:flex-row tablet:items-start tablet:gap-6 flex flex-col gap-3.5">
                <div className="tablet:w-50 w-full flex-none">
                    {form.pickedFile ? (
                        <SquareCropper
                            ref={form.cropperRef}
                            file={form.pickedFile}
                            onError={form.failCrop}
                        />
                    ) : currentUrl ? (
                        <img
                            src={currentUrl}
                            alt={text.avatarAlt}
                            className="aspect-avatar bg-grey-subtle w-full rounded-sm object-cover"
                        />
                    ) : (
                        <AvatarPlaceholder className="w-full" />
                    )}
                </div>
                <div className="flex min-w-0 flex-1 flex-col items-start gap-2.5">
                    {form.pickedFile && (
                        <p className="text-body-small font-medium break-all">
                            {form.pickedFile.name} ·{' '}
                            {formatSize(form.pickedFile.size)}
                        </p>
                    )}
                    <label
                        htmlFor={inputId}
                        className="border-primary text-button text-primary hover:bg-grey-subtle has-focus-visible:outline-accent-600 tablet:w-auto inline-flex h-11 w-full cursor-pointer items-center justify-center rounded-md border bg-white px-5 font-semibold has-focus-visible:outline-2 has-focus-visible:outline-offset-2"
                    >
                        {form.pickedFile || currentUrl
                            ? text.pickOtherImage
                            : text.pickImage}
                        <input
                            id={inputId}
                            type="file"
                            accept={ACCEPTED_IMAGE_TYPES.join(',')}
                            aria-describedby={[
                                helpId,
                                form.error ? errorId : null,
                            ]
                                .filter(Boolean)
                                .join(' ')}
                            aria-invalid={form.error ? true : undefined}
                            onChange={form.pick}
                            className="sr-only"
                        />
                    </label>
                    <p id={helpId} className="text-caption text-grey-dark">
                        {text.avatarHelp}
                    </p>
                    {form.error && (
                        <FieldError id={errorId}>{form.error}</FieldError>
                    )}
                </div>
            </div>
            <TextField
                label={text.credit}
                name="avatar_credit"
                value={form.credit}
                onChange={(event) => form.changeCredit(event.target.value)}
                error={form.creditError}
                maxLength={255}
            />
            <EditorActions isBusy={form.isBusy} onCancel={onCancel} />
        </form>
    );
}
