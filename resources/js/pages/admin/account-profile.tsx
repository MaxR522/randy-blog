import { Link, router, useForm } from '@inertiajs/react';
import type { FormEvent, ReactNode } from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AdminHead } from '@/components/admin/admin-head';
import {
    AvatarEditor,
    AvatarPlaceholder,
    EditorActions,
} from '@/components/admin/avatar-editor';
import { ConfirmModal } from '@/components/admin/confirm-modal';
import { PasswordField } from '@/components/admin/password-field';
import { RichTextEditor } from '@/components/admin/rich-text-editor';
import { TextField } from '@/components/admin/text-field';
import { Button } from '@/components/public/button';
import AdminLayout from '@/layouts/admin-layout';
import { adminLabels } from '@/lib/labels.admin.fr';
import { useUnsavedChangesGuard } from '@/lib/unsaved-changes';
import { cn } from '@/lib/utils';
import { account } from '@/routes/admin';
import {
    biography,
    displayName,
    email as emailRoute,
    security,
} from '@/routes/admin/account';
import type { AccountProfile } from '@/types/admin';

const text = adminLabels.account;

type Field = 'avatar' | 'displayName' | 'biography' | 'email';

type AccountProfileProps = {
    profile: AccountProfile;
};

/**
 * « Gestion du compte », Profile tab (spec §5.6.1): every field is read-only with « Modifier »; one inline editor
 * at a time, the other « Modifier » buttons being disabled meanwhile.
 */
export default function AccountProfilePage({ profile }: AccountProfileProps) {
    const [editing, setEditing] = useState<Field | null>(null);
    const [isDirty, setIsDirty] = useState(false);
    const [leavingUrl, setLeavingUrl] = useState<string | null>(null);
    const isLeavingRef = useRef(false);
    const editButtons = useRef(new Map<Field, HTMLButtonElement>());

    useUnsavedChangesGuard(isDirty, isLeavingRef, setLeavingUrl);

    const close = useCallback(() => {
        const field = editing;
        setEditing(null);
        setIsDirty(false);
        // Back on the button that opened the editor, once it is enabled again.
        requestAnimationFrame(
            () => field && editButtons.current.get(field)?.focus(),
        );
    }, [editing]);

    function row(
        field: Field,
        label: string,
        display: ReactNode,
        editor: ReactNode,
        help?: ReactNode,
    ) {
        const isEditing = editing === field;

        return (
            <ProfileRow
                label={label}
                isEditing={isEditing}
                isLocked={editing !== null && !isEditing}
                onEdit={() => setEditing(field)}
                editButtonRef={(button) => {
                    if (button) {
                        editButtons.current.set(field, button);
                    }
                }}
            >
                {isEditing ? editor : display}
                {!isEditing && help}
            </ProfileRow>
        );
    }

    return (
        <>
            <AdminHead title={text.title} />
            <div className="max-w-240">
                <h1 className="text-section tablet:mb-4 mb-3">{text.title}</h1>
                <AccountTabs current="profile" />

                {row(
                    'avatar',
                    text.avatar,
                    <div className="tablet:gap-4 flex items-center gap-3.5">
                        {profile.avatar ? (
                            <img
                                src={profile.avatar}
                                alt={text.avatarAlt}
                                className="aspect-avatar bg-grey-subtle w-24 flex-none rounded-sm object-cover"
                            />
                        ) : (
                            <AvatarPlaceholder className="w-24 flex-none" />
                        )}
                        {profile.avatarCredit && (
                            <p className="text-caption text-grey-dark">
                                {text.avatarCredit(profile.avatarCredit)}
                            </p>
                        )}
                    </div>,
                    <AvatarEditor
                        currentUrl={profile.avatar}
                        currentCredit={profile.avatarCredit}
                        onDirtyChange={setIsDirty}
                        onDone={close}
                    />,
                )}

                {row(
                    'displayName',
                    text.displayName,
                    <FieldValue value={profile.displayName} />,
                    <DisplayNameEditor
                        value={profile.displayName ?? ''}
                        onDirtyChange={setIsDirty}
                        onDone={close}
                    />,
                )}

                {row(
                    'biography',
                    text.biography,
                    profile.bioHtml ? (
                        <div
                            className="article-body tablet:text-base m-0 max-w-150 p-0 text-[0.9375rem] *:last:mb-0"
                            dangerouslySetInnerHTML={{
                                __html: profile.bioHtml,
                            }}
                        />
                    ) : (
                        <FieldValue value={null} />
                    ),
                    <BiographyEditor
                        value={profile.bio}
                        onDirtyChange={setIsDirty}
                        onDone={close}
                    />,
                )}

                {row(
                    'email',
                    text.loginEmail,
                    <FieldValue value={profile.email} />,
                    <LoginEmailEditor
                        onDirtyChange={setIsDirty}
                        onDone={close}
                    />,
                    <p className="text-caption text-grey-dark tablet:block mt-1 hidden">
                        {text.loginEmailHelp}
                    </p>,
                )}
            </div>

            <ConfirmModal
                isOpen={leavingUrl !== null}
                onClose={() => setLeavingUrl(null)}
                onConfirm={() => {
                    isLeavingRef.current = true;

                    if (leavingUrl) {
                        router.visit(leavingUrl);
                    }
                }}
                title={text.leaveTitle}
                description={text.leaveDescription}
                confirmLabel={text.leaveConfirm}
            />
        </>
    );
}

AccountProfilePage.layout = (page: ReactNode) => (
    <AdminLayout>{page}</AdminLayout>
);

/**
 * « Profil » and « Sécurité »: two pages, so links marked with `aria-current` rather than ARIA tabs.
 */
export function AccountTabs({ current }: { current: 'profile' | 'security' }) {
    const tabs = [
        { key: 'profile', label: text.profileTab, href: account.url() },
        { key: 'security', label: text.securityTab, href: security.url() },
    ] as const;

    return (
        <nav
            aria-label={text.tabs}
            className="border-grey-light tablet:gap-7 flex border-b"
        >
            {tabs.map((tab) => {
                const isCurrent = tab.key === current;

                return (
                    <Link
                        key={tab.key}
                        href={tab.href}
                        aria-current={isCurrent ? 'page' : undefined}
                        className={cn(
                            'tablet:flex-none -mb-px flex h-11 flex-1 items-center justify-center border-b-2 text-[0.9375rem]',
                            isCurrent
                                ? 'border-primary text-primary font-semibold'
                                : 'text-grey-dark hover:text-primary border-transparent font-medium',
                        )}
                    >
                        {tab.label}
                    </Link>
                );
            })}
        </nav>
    );
}

type ProfileRowProps = {
    label: string;
    isEditing: boolean;
    isLocked: boolean;
    onEdit: () => void;
    editButtonRef: (button: HTMLButtonElement | null) => void;
    children: ReactNode;
};

/**
 * One field: label, value or editor, « Modifier ». Label and button share a line on phone, the value goes below;
 * from tablet the three sit in columns.
 */
function ProfileRow({
    label,
    isEditing,
    isLocked,
    onEdit,
    editButtonRef,
    children,
}: ProfileRowProps) {
    return (
        <section
            aria-label={label}
            className="border-grey-light tablet:grid-cols-[13.75rem_minmax(0,1fr)_auto] tablet:gap-x-6 tablet:py-6 grid grid-cols-[minmax(0,1fr)_auto] items-start gap-x-3 gap-y-3 border-b py-5"
        >
            <h2 className="tablet:leading-6 tablet:min-h-0 flex min-h-11 items-center text-[0.9375rem] font-semibold">
                {label}
            </h2>
            <div className="tablet:col-span-1 tablet:col-start-2 tablet:row-start-1 col-span-2 min-w-0">
                {children}
            </div>
            {!isEditing && (
                <Button
                    ref={editButtonRef}
                    variant="secondary"
                    onClick={onEdit}
                    disabled={isLocked}
                    title={isLocked ? text.locked : undefined}
                    className="tablet:col-start-3 tablet:row-start-1 col-start-2 row-start-1 px-4"
                >
                    {text.edit}
                    <span className="sr-only"> : {label.toLowerCase()}</span>
                </Button>
            )}
        </section>
    );
}

function FieldValue({ value }: { value: string | null }) {
    return value ? (
        <p className="tablet:text-base text-[0.9375rem] leading-6 wrap-anywhere">
            {value}
        </p>
    ) : (
        <p className="text-grey-dark tablet:text-base text-[0.9375rem] leading-6">
            {text.empty}
        </p>
    );
}

type EditorProps = {
    onDirtyChange: (isDirty: boolean) => void;
    onDone: () => void;
};

/**
 * Focus the first field when an inline editor opens.
 */
function useFocusOnOpen() {
    const containerRef = useRef<HTMLFormElement>(null);

    useEffect(() => {
        containerRef.current
            ?.querySelector<HTMLElement>('input, [contenteditable], iframe')
            ?.focus();
    }, []);

    return containerRef;
}

function DisplayNameEditor({
    value,
    onDirtyChange,
    onDone,
}: EditorProps & { value: string }) {
    const form = useForm({ display_name: value });
    const formRef = useFocusOnOpen();

    useEffect(() => onDirtyChange(form.isDirty), [form.isDirty, onDirtyChange]);

    function submit(event: FormEvent<HTMLFormElement>): void {
        event.preventDefault();
        form.patch(displayName.url(), {
            preserveScroll: true,
            onSuccess: onDone,
        });
    }

    return (
        <form
            ref={formRef}
            onSubmit={submit}
            className="flex flex-col gap-4"
            noValidate
        >
            <TextField
                label={text.displayName}
                name="display_name"
                value={form.data.display_name}
                onChange={(event) =>
                    form.setData('display_name', event.target.value)
                }
                error={form.errors.display_name}
                help={text.displayNameHelp}
                isLabelHidden
                maxLength={100}
                required
            />
            <EditorActions isBusy={form.processing} onCancel={onDone} />
        </form>
    );
}

function BiographyEditor({
    value,
    onDirtyChange,
    onDone,
}: EditorProps & { value: string }) {
    const form = useForm({ bio: value });
    const [isChanged, setIsChanged] = useState(false);

    // TinyMCE normalises the HTML when it loads, so only a change made by the author counts as dirty.
    useEffect(() => onDirtyChange(isChanged), [isChanged, onDirtyChange]);

    function submit(event: FormEvent<HTMLFormElement>): void {
        event.preventDefault();
        form.patch(biography.url(), {
            preserveScroll: true,
            onSuccess: onDone,
        });
    }

    return (
        <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
            <RichTextEditor
                label={text.biography}
                config="minimal"
                isLabelHidden
                value={form.data.bio}
                onChange={(html) => {
                    if (html !== form.data.bio) {
                        setIsChanged(true);
                    }

                    form.setData('bio', html);
                }}
                error={form.errors.bio}
            />
            <EditorActions isBusy={form.processing} onCancel={onDone} />
        </form>
    );
}

function LoginEmailEditor({ onDirtyChange, onDone }: EditorProps) {
    const form = useForm({ email: '', password: '' });
    const formRef = useFocusOnOpen();

    useEffect(() => onDirtyChange(form.isDirty), [form.isDirty, onDirtyChange]);

    function submit(event: FormEvent<HTMLFormElement>): void {
        event.preventDefault();
        form.post(emailRoute.url(), {
            preserveScroll: true,
            onSuccess: onDone,
            onError: () => form.reset('password'),
        });
    }

    return (
        <form
            ref={formRef}
            onSubmit={submit}
            className="flex flex-col gap-4"
            noValidate
        >
            <p className="text-caption text-grey-dark">{text.loginEmailHelp}</p>
            <TextField
                label={text.newEmail}
                name="email"
                type="email"
                autoComplete="email"
                value={form.data.email}
                onChange={(event) => form.setData('email', event.target.value)}
                error={form.errors.email}
                required
            />
            <PasswordField
                label={text.currentPassword}
                name="password"
                autoComplete="current-password"
                value={form.data.password}
                onChange={(event) =>
                    form.setData('password', event.target.value)
                }
                error={form.errors.password}
                required
            />
            <div className="tablet:flex tablet:justify-end grid grid-cols-2 gap-2">
                <Button
                    variant="secondary"
                    onClick={onDone}
                    disabled={form.processing}
                    className="tablet:h-11 h-12"
                >
                    {text.cancel}
                </Button>
                <Button
                    type="submit"
                    isLoading={form.processing}
                    disabled={form.processing}
                    className="tablet:h-11 h-12 px-4"
                >
                    {text.sendLink}
                </Button>
            </div>
        </form>
    );
}
