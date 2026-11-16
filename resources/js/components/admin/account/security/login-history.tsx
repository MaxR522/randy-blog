import { useState } from 'react';
import type { DataTableColumn } from '@/components/admin/data-table';
import { DataTable } from '@/components/admin/data-table';
import { StatusBadge } from '@/components/admin/status-badge';
import { Button } from '@/components/public/button';
import { adminLabels } from '@/lib/labels.admin.fr';
import type { AccountLoginEvent } from '@/types/admin';

const text = adminLabels.security;

/** History items shown on phones before « Afficher plus ». */
const PhoneHistoryLength = 10;

/**
 * « Historique des connexions » (ADM-SEC-6): all 50 in the table; the first 10 on phones, then « Afficher plus ».
 */
export function LoginHistory({ events }: { events: AccountLoginEvent[] }) {
    const [isExpanded, setIsExpanded] = useState(false);
    const phoneEvents = isExpanded
        ? events
        : events.slice(0, PhoneHistoryLength);

    function resultBadge(event: AccountLoginEvent) {
        return (
            <StatusBadge variant={event.succeeded ? 'ok' : 'bad'}>
                {event.succeeded ? text.succeeded : text.failed}
            </StatusBadge>
        );
    }

    const columns: DataTableColumn<AccountLoginEvent>[] = [
        {
            key: 'date',
            header: text.date,
            render: (event) => event.date,
        },
        {
            key: 'device',
            header: text.device,
            cellClassName: 'text-grey-dark',
            render: (event) => event.device,
        },
        {
            key: 'ip',
            header: text.ip,
            cellClassName: 'text-grey-dark',
            render: (event) => event.ip ?? text.notApplicable,
        },
        {
            key: 'result',
            header: text.result,
            render: resultBadge,
        },
        {
            key: 'twoFactor',
            header: text.twoFactor,
            cellClassName: 'text-grey-dark',
            // A failure with 2FA means the password was right and the code wrong: worth telling apart.
            render: (event) =>
                event.twoFactorUsed
                    ? text.yes
                    : event.succeeded
                      ? text.no
                      : text.notApplicable,
        },
    ];

    return (
        <section
            aria-labelledby="historique-connexions"
            className="tablet:py-6 py-5"
        >
            <h2
                id="historique-connexions"
                className="mb-3 text-[0.9375rem] font-semibold"
            >
                {text.history}
            </h2>
            {events.length === 0 ? (
                <p className="text-caption text-grey-dark">{text.noHistory}</p>
            ) : (
                <>
                    <DataTable
                        caption={text.historyCaption}
                        columns={columns}
                        rows={events}
                        mobileRows={phoneEvents}
                        rowKey={(event) => event.id}
                        renderMobileItem={(event) => (
                            <div className="border-grey-light flex items-center gap-2 border-b py-3">
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-medium">
                                        {event.shortDate}
                                    </p>
                                    <p className="text-caption text-grey-dark mt-0.5">
                                        {[event.device, event.ip]
                                            .filter(Boolean)
                                            .join(' · ')}
                                    </p>
                                </div>
                                {resultBadge(event)}
                            </div>
                        )}
                    />
                    {!isExpanded && events.length > PhoneHistoryLength && (
                        <Button
                            variant="secondary"
                            onClick={() => setIsExpanded(true)}
                            className="tablet:hidden mt-3 w-full"
                        >
                            {text.showMore}
                        </Button>
                    )}
                </>
            )}
            <p className="text-caption text-grey-dark mt-3">
                {text.historyHelp}
            </p>
        </section>
    );
}
