import { useForm } from '@inertiajs/react';
import { UserRound } from 'lucide-react';
import type { ChangeEvent, FormEvent } from 'react';
import { useEffect, useId, useRef, useState } from 'react';
import { ACCEPTED_TYPES, formatSize } from '@/components/admin/image-uploader';
import type { SquareCropperHandle } from '@/components/admin/square-cropper';
import { SquareCropper } from '@/components/admin/square-cropper';
import { FieldError, TextField } from '@/components/admin/text-field';
import { Button } from '@/components/public/button';
import { adminLabels } from '@/lib/labels.admin.fr';
import { cn } from '@/lib/utils';
import { avatar as avatarRoute } from '@/routes/admin/account';

const text = adminLabels.account;

const MAX_BYTES = 2 * 1024 * 1024;

type AvatarEditorProps = {
    currentUrl: string | null;
    currentCredit: string | null;
    onDirtyChange: (isDirty: boolean) => void;
    onDone: () => void;
};

/**
 * Inline editor of the avatar (ADM-ACC-1): pick an image, crop it square, set the credit. The cropped square is
 * what gets uploaded; the server deletes the previous image once the new one is saved.
 */
export function AvatarEditor({
    currentUrl,
    currentCredit,
    onDirtyChange,
    onDone,
}: AvatarEditorProps) {
    const inputId = useId();
    const helpId = `${inputId}-aide`;
    const errorId = `${inputId}-erreur`;
    const cropperRef = useRef<SquareCropperHandle>(null);
    const [pickedFile, setPickedFile] = useState<File | null>(null);
    const [localError, setLocalError] = useState<string | null>(null);
    const [isExporting, setIsExporting] = useState(false);
    const form = useForm<{ avatar: File | null; avatar_credit: string }>({
        avatar: null,
        avatar_credit: currentCredit ?? '',
    });

    const isDirty = pickedFile !== null || form.isDirty;
    const shownError = localError ?? form.errors.avatar;
    const isBusy = form.processing || isExporting;

    useEffect(() => onDirtyChange(isDirty), [isDirty, onDirtyChange]);

    // The editor opens on its first control.
    useEffect(() => document.getElementById(inputId)?.focus(), [inputId]);

    function pick(event: ChangeEvent<HTMLInputElement>): void {
        const file = event.target.files?.[0];
        // Picking the same file again must fire a change.
        event.target.value = '';

        if (!file) {
            return;
        }

        if (!ACCEPTED_TYPES.includes(file.type)) {
            setLocalError(text.avatarInvalidType);

            return;
        }

        if (file.size > MAX_BYTES) {
            setLocalError(text.avatarTooLarge);

            return;
        }

        setLocalError(null);
        form.clearErrors('avatar');
        setPickedFile(file);
    }

    async function submit(event: FormEvent<HTMLFormElement>): Promise<void> {
        event.preventDefault();
        let cropped: File | null = null;

        if (pickedFile) {
            setIsExporting(true);

            try {
                cropped = (await cropperRef.current?.exportFile()) ?? null;
            } catch {
                setLocalError(text.avatarUnreadable);

                return;
            } finally {
                setIsExporting(false);
            }
        }

        form.transform((data) => ({
            avatar_credit: data.avatar_credit,
            ...(cropped ? { avatar: cropped } : {}),
        }));
        form.post(avatarRoute.url(), {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: onDone,
        });
    }

    return (
        <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
            <div className="tablet:flex-row tablet:items-start tablet:gap-6 flex flex-col gap-3.5">
                <div className="tablet:w-50 w-full flex-none">
                    {pickedFile ? (
                        <SquareCropper
                            ref={cropperRef}
                            file={pickedFile}
                            onError={() => {
                                setPickedFile(null);
                                setLocalError(text.avatarUnreadable);
                            }}
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
                    {pickedFile && (
                        <p className="text-body-small font-medium break-all">
                            {pickedFile.name} · {formatSize(pickedFile.size)}
                        </p>
                    )}
                    <label
                        htmlFor={inputId}
                        className="border-primary text-button text-primary hover:bg-grey-subtle has-focus-visible:outline-accent-600 tablet:w-auto inline-flex h-11 w-full cursor-pointer items-center justify-center rounded-md border bg-white px-5 font-semibold has-focus-visible:outline-2 has-focus-visible:outline-offset-2"
                    >
                        {pickedFile || currentUrl
                            ? text.pickOtherImage
                            : text.pickImage}
                        <input
                            id={inputId}
                            type="file"
                            accept={ACCEPTED_TYPES.join(',')}
                            aria-describedby={[
                                helpId,
                                shownError ? errorId : null,
                            ]
                                .filter(Boolean)
                                .join(' ')}
                            aria-invalid={shownError ? true : undefined}
                            onChange={pick}
                            className="sr-only"
                        />
                    </label>
                    <p id={helpId} className="text-caption text-grey-dark">
                        {text.avatarHelp}
                    </p>
                    {shownError && (
                        <FieldError id={errorId}>{shownError}</FieldError>
                    )}
                </div>
            </div>
            <TextField
                label={text.credit}
                name="avatar_credit"
                value={form.data.avatar_credit}
                onChange={(event) =>
                    form.setData('avatar_credit', event.target.value)
                }
                error={form.errors.avatar_credit}
                maxLength={255}
            />
            <EditorActions isBusy={isBusy} onCancel={onDone} />
        </form>
    );
}

type EditorActionsProps = {
    isBusy: boolean;
    onCancel: () => void;
};

/**
 * « Annuler » and « Enregistrer » of an inline editor: side by side, full width on phone.
 */
export function EditorActions({ isBusy, onCancel }: EditorActionsProps) {
    return (
        <div className="tablet:flex tablet:justify-end grid grid-cols-2 gap-2">
            <Button
                variant="secondary"
                onClick={onCancel}
                disabled={isBusy}
                className="tablet:h-11 h-12"
            >
                {text.cancel}
            </Button>
            <Button
                type="submit"
                isLoading={isBusy}
                disabled={isBusy}
                className="tablet:h-11 h-12"
            >
                {text.save}
            </Button>
        </div>
    );
}

/**
 * Square stand-in when no avatar is set.
 */
export function AvatarPlaceholder({ className }: { className?: string }) {
    return (
        <span
            role="img"
            aria-label={text.noAvatar}
            className={cn(
                'aspect-avatar bg-grey-subtle text-grey-medium flex items-center justify-center rounded-sm',
                className,
            )}
        >
            <UserRound
                aria-hidden="true"
                className="size-1/3"
                strokeWidth={1.25}
            />
        </span>
    );
}
