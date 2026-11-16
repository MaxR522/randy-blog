import { ConfirmModal } from '@/components/admin/confirm-modal';
import type { DataTableColumn } from '@/components/admin/data-table';
import { DataTable } from '@/components/admin/data-table';
import { StatusBadge } from '@/components/admin/status-badge';
import { Button } from '@/components/public/button';
import type { DeviceSignOut } from '@/hooks/use-device-sign-out';
import { adminLabels } from '@/lib/labels.admin.fr';
import type { AccountDevice } from '@/types/admin';

const text = adminLabels.security;

type ConnectedDevicesProps = {
    devices: AccountDevice[];
    signOut: DeviceSignOut;
};

/**
 * « Appareils connectés » (ADM-SEC-5): both logouts ask for confirmation (ADM-COM-6); the requests live in
 * `useDeviceSignOut`.
 */
export function ConnectedDevices({ devices, signOut }: ConnectedDevicesProps) {
    const { target } = signOut;
    const hasOtherDevices = devices.some((device) => !device.isCurrent);

    function logOutButton(device: AccountDevice, className: string) {
        return (
            <Button
                variant="ghost"
                onClick={() => signOut.ask(device)}
                aria-label={text.logOutDeviceLabel(device.device)}
                className={className}
            >
                {text.logOutDevice}
            </Button>
        );
    }

    const columns: DataTableColumn<AccountDevice>[] = [
        {
            key: 'device',
            header: text.device,
            cellClassName: 'font-medium',
            render: (device) => (
                <span className="inline-flex flex-wrap items-center gap-x-1.5 gap-y-1">
                    {device.device}
                    {device.isCurrent && (
                        <StatusBadge variant="info">
                            {text.thisDevice}
                        </StatusBadge>
                    )}
                </span>
            ),
        },
        {
            key: 'ip',
            header: text.ip,
            cellClassName: 'text-grey-dark',
            render: (device) => device.ip ?? text.notApplicable,
        },
        {
            key: 'lastActivity',
            header: text.lastActivity,
            cellClassName: 'text-grey-dark',
            render: (device) => device.lastActivity,
        },
        {
            key: 'action',
            header: text.action,
            alignEnd: true,
            render: (device) =>
                !device.isCurrent && logOutButton(device, 'h-10 px-3 text-sm'),
        },
    ];

    return (
        <section
            aria-labelledby="appareils-connectes"
            className="border-grey-light tablet:py-6 border-b py-5"
        >
            <div className="tablet:mb-3 mb-3 flex items-center justify-between gap-4">
                <h2
                    id="appareils-connectes"
                    className="text-[0.9375rem] font-semibold"
                >
                    {text.devices}
                </h2>
                {hasOtherDevices && (
                    <Button
                        variant="secondary"
                        onClick={() => signOut.ask('others')}
                        className="tablet:inline-flex hidden"
                    >
                        {text.logOutOthers}
                    </Button>
                )}
            </div>
            <DataTable
                caption={text.devicesCaption}
                columns={columns}
                rows={devices}
                rowKey={(device) => device.key}
                renderMobileItem={(device) => (
                    <div className="border-grey-light flex items-center gap-2 border-b py-3">
                        <div className="min-w-0 flex-1">
                            <p className="text-[0.9375rem] font-medium">
                                {device.shortDevice}
                            </p>
                            <p className="text-caption text-grey-dark mt-0.5">
                                {[device.ip, device.lastActivity.toLowerCase()]
                                    .filter(Boolean)
                                    .join(' · ')}
                            </p>
                            {device.isCurrent && (
                                <StatusBadge variant="info" className="mt-1.5">
                                    {text.thisDevice}
                                </StatusBadge>
                            )}
                        </div>
                        {!device.isCurrent &&
                            logOutButton(
                                device,
                                'border-primary h-10 px-4 text-sm',
                            )}
                    </div>
                )}
            />
            {hasOtherDevices ? (
                <Button
                    variant="secondary"
                    onClick={() => signOut.ask('others')}
                    className="tablet:hidden mt-3 w-full"
                >
                    {text.logOutOthers}
                </Button>
            ) : (
                <p className="text-caption text-grey-dark mt-3">
                    {text.noOtherDevice}
                </p>
            )}

            <ConfirmModal
                isOpen={target !== null}
                onClose={signOut.cancel}
                onConfirm={signOut.confirm}
                isConfirming={signOut.isConfirming}
                title={
                    target === 'others'
                        ? text.logOutOthersTitle
                        : text.logOutDeviceTitle
                }
                description={
                    target === 'others'
                        ? text.logOutOthersDescription
                        : target
                          ? text.logOutDeviceDescription(target.device)
                          : undefined
                }
                confirmLabel={
                    target === 'others' ? text.logOutOthers : text.logOutDevice
                }
            />
        </section>
    );
}
