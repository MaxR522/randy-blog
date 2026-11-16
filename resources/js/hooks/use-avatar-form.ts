import { useForm } from '@inertiajs/react';
import type { ChangeEvent, FormEvent } from 'react';
import { useRef, useState } from 'react';
import type { SquareCropperHandle } from '@/components/admin/account/square-cropper';
import { AVATAR_MAX_BYTES } from '@/helpers/account';
import { ACCEPTED_IMAGE_TYPES } from '@/helpers/media-upload';
import { adminLabels } from '@/lib/labels.admin.fr';
import { avatar as avatarRoute } from '@/routes/admin/account';

const text = adminLabels.account;

/**
 * Inline editor of the avatar (ADM-ACC-1): pick an image, crop it square, set the credit. The cropped square is
 * what gets uploaded; the server deletes the previous image once the new one is saved. `start()` empties it again
 * each time the editor opens.
 */
export function useAvatarForm(
    currentCredit: string | null,
    onDone: () => void,
) {
    const cropperRef = useRef<SquareCropperHandle>(null);
    const [pickedFile, setPickedFile] = useState<File | null>(null);
    const [localError, setLocalError] = useState<string | null>(null);
    const [isExporting, setIsExporting] = useState(false);
    const form = useForm<{ avatar: File | null; avatar_credit: string }>({
        avatar: null,
        avatar_credit: currentCredit ?? '',
    });

    function start(): void {
        const fields = { avatar: null, avatar_credit: currentCredit ?? '' };
        form.setDefaults(fields);
        form.setData(fields);
        form.clearErrors();
        setPickedFile(null);
        setLocalError(null);
        setIsExporting(false);
    }

    function pick(event: ChangeEvent<HTMLInputElement>): void {
        const file = event.target.files?.[0];
        // Picking the same file again must fire a change.
        event.target.value = '';

        if (!file) {
            return;
        }

        if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
            setLocalError(text.avatarInvalidType);

            return;
        }

        if (file.size > AVATAR_MAX_BYTES) {
            setLocalError(text.avatarTooLarge);

            return;
        }

        setLocalError(null);
        form.clearErrors('avatar');
        setPickedFile(file);
    }

    function failCrop(): void {
        setPickedFile(null);
        setLocalError(text.avatarUnreadable);
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

    return {
        cropperRef,
        pickedFile,
        credit: form.data.avatar_credit,
        creditError: form.errors.avatar_credit,
        error: localError ?? form.errors.avatar,
        isBusy: form.processing || isExporting,
        isDirty: pickedFile !== null || form.isDirty,
        changeCredit: (credit: string): void =>
            form.setData('avatar_credit', credit),
        start,
        pick,
        failCrop,
        submit,
    };
}

export type AvatarForm = ReturnType<typeof useAvatarForm>;
