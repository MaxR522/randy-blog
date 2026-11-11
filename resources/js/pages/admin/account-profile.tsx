import { useForm } from '@inertiajs/react';
import type { FormEvent, ReactNode } from 'react';
import { useEffect, useState } from 'react';
import type { EditorProps } from '@/components/admin/account-row';
import {
    AccountRow,
    AccountTabs,
    FieldValue,
    useFocusOnOpen,
    useInlineEditing,
} from '@/components/admin/account-row';
import { AdminHead } from '@/components/admin/admin-head';
import {
    AvatarEditor,
    AvatarPlaceholder,
    EditorActions,
} from '@/components/admin/avatar-editor';
import { PasswordField } from '@/components/admin/password-field';
import { RichTextEditor } from '@/components/admin/rich-text-editor';
import { TextField } from '@/components/admin/text-field';
import { Button } from '@/components/public/button';
import AdminLayout from '@/layouts/admin-layout';
import { adminLabels } from '@/lib/labels.admin.fr';
import {
    biography,
    displayName,
    email as emailRoute,
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
    const { rowProps, close, setIsDirty, leaveModal } =
        useInlineEditing<Field>();

    function row(
        field: Field,
        label: string,
        display: ReactNode,
        editor: ReactNode,
        help?: ReactNode,
    ) {
        const props = rowProps(field);

        return (
            <AccountRow label={label} {...props}>
                {props.isEditing ? editor : display}
                {!props.isEditing && help}
            </AccountRow>
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

            {leaveModal}
        </>
    );
}

AccountProfilePage.layout = (page: ReactNode) => (
    <AdminLayout>{page}</AdminLayout>
);

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
