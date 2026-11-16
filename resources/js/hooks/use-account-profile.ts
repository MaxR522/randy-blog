import type { ProfileField } from '@/helpers/account';
import { useAvatarForm } from '@/hooks/use-avatar-form';
import { useBiographyForm } from '@/hooks/use-biography-form';
import { useDisplayNameForm } from '@/hooks/use-display-name-form';
import { useInlineEditing } from '@/hooks/use-inline-editing';
import { useLoginEmailForm } from '@/hooks/use-login-email-form';
import type { AccountProfile } from '@/types/admin';

/**
 * « Gestion du compte », Profile tab (spec §5.6.1): one form per field and one inline editor open at a time.
 */
export function useAccountProfile(profile: AccountProfile) {
    // Runs on save, after `editing` below is set.
    const done = (): void => editing.close();
    const forms = {
        avatar: useAvatarForm(profile.avatarCredit, done),
        displayName: useDisplayNameForm(profile.displayName ?? '', done),
        biography: useBiographyForm(profile.bio, done),
        email: useLoginEmailForm(done),
    };
    const editing = useInlineEditing<ProfileField>({
        isDirtyOf: (field) => forms[field].isDirty,
        onOpen: (field) => forms[field].start(),
    });

    return { ...editing, ...forms };
}

export type AccountProfileForms = ReturnType<typeof useAccountProfile>;
