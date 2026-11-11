import type { ReactNode } from 'react';
import {
    AccountRow,
    AccountTabs,
    FieldValue,
    useInlineEditing,
} from '@/components/admin/account-row';
import { AdminHead } from '@/components/admin/admin-head';
import { ConnectedDevices } from '@/components/admin/connected-devices';
import { LoginHistory } from '@/components/admin/login-history';
import { PasswordEditor } from '@/components/admin/password-editor';
import { RecoveryEmailEditor } from '@/components/admin/recovery-email-editor';
import { RecoveryPhoneEditor } from '@/components/admin/recovery-phone-editor';
import { StatusBadge } from '@/components/admin/status-badge';
import { TwoFactorEditor } from '@/components/admin/two-factor-editor';
import AdminLayout from '@/layouts/admin-layout';
import { adminLabels } from '@/lib/labels.admin.fr';
import { formatPhone } from '@/lib/phone';
import type { AccountSecurity } from '@/types/admin';

const text = adminLabels.security;

type Field = 'recoveryEmail' | 'recoveryPhone' | 'password' | 'twoFactor';

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
    const { rowProps, close, setIsDirty, leaveModal } =
        useInlineEditing<Field>();
    const recoveryEmailRow = rowProps('recoveryEmail');
    const recoveryPhoneRow = rowProps('recoveryPhone');
    const passwordRow = rowProps('password');
    const twoFactorRow = rowProps('twoFactor');
    const { twoFactor } = security;

    return (
        <>
            <AdminHead title={adminLabels.account.title} />
            <div className="max-w-250">
                <h1 className="text-section tablet:mb-4 mb-3">
                    {adminLabels.account.title}
                </h1>
                <AccountTabs current="security" />

                <AccountRow label={text.recoveryEmail} {...recoveryEmailRow}>
                    {recoveryEmailRow.isEditing ? (
                        <RecoveryEmailEditor
                            value={security.recoveryEmail}
                            onDirtyChange={setIsDirty}
                            onDone={close}
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
                            value={security.recoveryPhone}
                            onDirtyChange={setIsDirty}
                            onDone={close}
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
                            onDirtyChange={setIsDirty}
                            onDone={close}
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
                            onDirtyChange={setIsDirty}
                            onDone={close}
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

                <ConnectedDevices devices={security.devices} />
                <LoginHistory events={security.loginEvents} />
            </div>

            {leaveModal}
        </>
    );
}

AccountSecurityPage.layout = (page: ReactNode) => (
    <AdminLayout>{page}</AdminLayout>
);
