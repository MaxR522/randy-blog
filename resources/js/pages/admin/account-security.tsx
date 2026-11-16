import type { ReactNode } from 'react';
import { AccountRow } from '@/components/admin/account/account-row';
import { AccountTabs } from '@/components/admin/account/account-tabs';
import { FieldValue } from '@/components/admin/account/field-value';
import { LeaveAccountModal } from '@/components/admin/account/leave-account-modal';
import { ConnectedDevices } from '@/components/admin/account/security/connected-devices';
import { LoginHistory } from '@/components/admin/account/security/login-history';
import { PasswordEditor } from '@/components/admin/account/security/password-editor';
import { RecoveryEmailEditor } from '@/components/admin/account/security/recovery-email-editor';
import { RecoveryPhoneEditor } from '@/components/admin/account/security/recovery-phone-editor';
import { AdminHead } from '@/components/admin/admin-head';
import { StatusBadge } from '@/components/admin/status-badge';
import { TwoFactorEditor } from '@/components/admin/two-factor-editor';
import AdminLayout from '@/layouts/admin-layout';
import { adminLabels } from '@/lib/labels.admin.fr';
import { formatPhone } from '@/helpers/phone';
import { useAccountSecurity } from '@/hooks/use-account-security';
import { account } from '@/routes/admin';
import { security as securityRoute } from '@/routes/admin/account';
import type { AccountSecurity } from '@/types/admin';

const text = adminLabels.security;

type AccountSecurityProps = {
    security: AccountSecurity;
};

/**
 * « Gestion du compte », Security tab (spec §5.6.2). The four fields follow the Profile tab: one inline editor at
 * a time.
 */
export default function AccountSecurityPage({
    security,
}: AccountSecurityProps) {
    const page = useAccountSecurity(security);
    const recoveryEmailRow = page.rowProps('recoveryEmail');
    const recoveryPhoneRow = page.rowProps('recoveryPhone');
    const passwordRow = page.rowProps('password');
    const twoFactorRow = page.rowProps('twoFactor');
    const { twoFactor } = security;

    return (
        <>
            <AdminHead title={adminLabels.account.title} />
            <div className="max-w-250">
                <h1 className="text-section tablet:mb-4 mb-3">
                    {adminLabels.account.title}
                </h1>
                <AccountTabs
                    current="security"
                    profileUrl={account.url()}
                    securityUrl={securityRoute.url()}
                />

                <AccountRow label={text.recoveryEmail} {...recoveryEmailRow}>
                    {recoveryEmailRow.isEditing ? (
                        <RecoveryEmailEditor
                            form={page.recoveryEmail}
                            onCancel={page.close}
                        />
                    ) : (
                        <>
                            <FieldValue value={security.recoveryEmail}>
                                {security.recoveryEmail && (
                                    <StatusBadge
                                        variant={
                                            security.recoveryEmailVerified
                                                ? 'ok'
                                                : 'muted'
                                        }
                                    >
                                        {security.recoveryEmailVerified
                                            ? text.verified
                                            : text.unverified}
                                    </StatusBadge>
                                )}
                            </FieldValue>
                            <p className="text-caption text-grey-dark tablet:block mt-1 hidden">
                                {text.recoveryEmailHelp}
                            </p>
                        </>
                    )}
                </AccountRow>

                <AccountRow label={text.recoveryPhone} {...recoveryPhoneRow}>
                    {recoveryPhoneRow.isEditing ? (
                        <RecoveryPhoneEditor
                            form={page.recoveryPhone}
                            onCancel={page.close}
                        />
                    ) : (
                        <>
                            <FieldValue
                                value={
                                    security.recoveryPhone &&
                                    formatPhone(security.recoveryPhone)
                                }
                            >
                                {security.recoveryPhone && (
                                    <StatusBadge variant="muted">
                                        {text.unverified}
                                    </StatusBadge>
                                )}
                            </FieldValue>
                            <p className="text-caption text-grey-dark mt-1">
                                <span className="tablet:inline hidden">
                                    {text.recoveryPhoneHelp}
                                </span>
                                <span className="tablet:hidden">
                                    {text.recoveryPhoneShortHelp}
                                </span>
                            </p>
                        </>
                    )}
                </AccountRow>

                <AccountRow label={text.password} {...passwordRow}>
                    {passwordRow.isEditing ? (
                        <PasswordEditor
                            form={page.password}
                            onCancel={page.close}
                        />
                    ) : (
                        <>
                            <p
                                aria-hidden="true"
                                className="tablet:text-base text-[0.9375rem] leading-6 tracking-widest"
                            >
                                {text.passwordMask}
                            </p>
                            <p className="text-caption text-grey-dark mt-1">
                                {text.otherDevicesLoggedOut}
                            </p>
                        </>
                    )}
                </AccountRow>

                <AccountRow label={text.twoFactorTitle} {...twoFactorRow}>
                    {twoFactorRow.isEditing ? (
                        <TwoFactorEditor
                            twoFactor={twoFactor}
                            onDirtyChange={page.setIsTwoFactorDirty}
                            onDone={page.close}
                        />
                    ) : (
                        <>
                            <p className="flex min-h-6 items-center">
                                <StatusBadge
                                    variant={twoFactor.enabled ? 'ok' : 'muted'}
                                >
                                    {twoFactor.enabled
                                        ? text.twoFactorEnabled
                                        : twoFactor.pending
                                          ? text.twoFactorPending
                                          : text.twoFactorDisabled}
                                </StatusBadge>
                            </p>
                            <p className="text-caption text-grey-dark mt-1">
                                {twoFactor.enabled
                                    ? text.twoFactorEnabledHelp
                                    : text.twoFactorHelp}
                            </p>
                        </>
                    )}
                </AccountRow>

                <ConnectedDevices
                    devices={security.devices}
                    signOut={page.signOut}
                />
                <LoginHistory events={security.loginEvents} />
            </div>

            <LeaveAccountModal
                isOpen={page.isLeaving}
                onClose={page.cancelLeave}
                onConfirm={page.confirmLeave}
            />
        </>
    );
}

AccountSecurityPage.layout = (page: ReactNode) => (
    <AdminLayout>{page}</AdminLayout>
);
