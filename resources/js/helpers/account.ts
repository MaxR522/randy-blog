import type { AccountDevice } from '@/types/admin';

/** Largest avatar the server accepts before cropping, in bytes (same rule as `AvatarRequest`). */
export const AVATAR_MAX_BYTES = 2 * 1024 * 1024;

/** The fields of the « Profil » tab, each with its own inline editor. */
export type ProfileField = 'avatar' | 'displayName' | 'biography' | 'email';

/** Callbacks an inline editor still gets from its page while it holds its own form (security tab, until it moves to hooks). */
export type EditorProps = {
    onDirtyChange: (isDirty: boolean) => void;
    onDone: () => void;
};

/** The fields of the « Sécurité » tab, each with its own inline editor. */
export type SecurityField =
    | 'recoveryEmail'
    | 'recoveryPhone'
    | 'password'
    | 'twoFactor';

/** What « Déconnecter » targets: one device, or every device but this one. */
export type DeviceSignOutTarget = AccountDevice | 'others';
