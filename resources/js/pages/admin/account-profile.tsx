import type { ReactNode } from 'react';
import { AccountRow } from '@/components/admin/account/account-row';
import { AccountTabs } from '@/components/admin/account/account-tabs';
import { AvatarPlaceholder } from '@/components/admin/account/avatar-placeholder';
import { FieldValue } from '@/components/admin/account/field-value';
import { LeaveAccountModal } from '@/components/admin/account/leave-account-modal';
import { AvatarEditor } from '@/components/admin/account/profile/avatar-editor';
import { BiographyEditor } from '@/components/admin/account/profile/biography-editor';
import { DisplayNameEditor } from '@/components/admin/account/profile/display-name-editor';
import { LoginEmailEditor } from '@/components/admin/account/profile/login-email-editor';
import { AdminHead } from '@/components/admin/admin-head';
import type { ProfileField } from '@/helpers/account';
import { useAccountProfile } from '@/hooks/use-account-profile';
import AdminLayout from '@/layouts/admin-layout';
import { adminLabels } from '@/lib/labels.admin.fr';
import { account } from '@/routes/admin';
import { security } from '@/routes/admin/account';
import type { AccountProfile } from '@/types/admin';

const text = adminLabels.account;

type AccountProfileProps = {
    profile: AccountProfile;
};

/**
 * « Gestion du compte », Profile tab (spec §5.6.1): every field is read-only with « Modifier »; one inline editor
 * at a time, the other « Modifier » buttons being disabled meanwhile.
 */
export default function AccountProfilePage({ profile }: AccountProfileProps) {
    const page = useAccountProfile(profile);

    function row(
        field: ProfileField,
        label: string,
        display: ReactNode,
        editor: ReactNode,
        help?: ReactNode,
    ) {
        const props = page.rowProps(field);

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
                <AccountTabs
                    current="profile"
                    profileUrl={account.url()}
                    securityUrl={security.url()}
                />

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
                        form={page.avatar}
                        currentUrl={profile.avatar}
                        onCancel={page.close}
                    />,
                )}

                {row(
                    'displayName',
                    text.displayName,
                    <FieldValue value={profile.displayName} />,
                    <DisplayNameEditor
                        form={page.displayName}
                        onCancel={page.close}
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
                        form={page.biography}
                        onCancel={page.close}
                    />,
                )}

                {row(
                    'email',
                    text.loginEmail,
                    <FieldValue value={profile.email} />,
                    <LoginEmailEditor
                        form={page.email}
                        onCancel={page.close}
                    />,
                    <p className="text-caption text-grey-dark tablet:block mt-1 hidden">
                        {text.loginEmailHelp}
                    </p>,
                )}
            </div>

            <LeaveAccountModal
                isOpen={page.isLeaving}
                onClose={page.cancelLeave}
                onConfirm={page.confirmLeave}
            />
        </>
    );
}

AccountProfilePage.layout = (page: ReactNode) => (
    <AdminLayout>{page}</AdminLayout>
);
