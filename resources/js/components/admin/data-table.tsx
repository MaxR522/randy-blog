import { Link } from '@inertiajs/react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import type { ReactNode } from 'react';
import { listVisitOptions } from '@/lib/list-url';
import { cn } from '@/lib/utils';
import type { SortDirection } from '@/types/admin';

export type DataTableColumn<Row> = {
    key: string;
    header: string;
    isNumeric?: boolean;
    /** Aligned right, as the row actions and the counts are. */
    alignEnd?: boolean;
    cellClassName?: string;
    sort?: {
        /** Where a click on the header goes. */
        href: string;
        /** Set on the column the list is sorted by. */
        direction: SortDirection | null;
    };
    render: (row: Row) => ReactNode;
};

type DataTableProps<Row> = {
    caption: string;
    columns: DataTableColumn<Row>[];
    rows: Row[];
    rowKey: (row: Row) => string | number;
    /** The same row under 768 px, as a card or a hairline row. */
    renderMobileItem: (row: Row) => ReactNode;
    /** Replaces the top rule of the phone list, for items that are cards with their own border. */
    mobileListClassName?: string;
};

const ariaSort = { asc: 'ascending', desc: 'descending' } as const;

/**
 * Table from 768 px, list below. Both are in the markup and CSS picks one, so the first paint is right.
 */
export function DataTable<Row>({
    caption,
    columns,
    rows,
    rowKey,
    renderMobileItem,
    mobileListClassName = 'border-primary border-t',
}: DataTableProps<Row>) {
    return (
        <>
            <table className="tablet:table hidden w-full border-collapse">
                <caption className="sr-only">{caption}</caption>
                <thead>
                    <tr>
                        {columns.map((column) => (
                            <HeaderCell key={column.key} column={column} />
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {rows.map((row) => (
                        <tr key={rowKey(row)}>
                            {columns.map((column) => (
                                <td
                                    key={column.key}
                                    className={cn(
                                        'border-grey-light h-11 border-b px-4 py-2 align-middle text-sm leading-5',
                                        column.alignEnd && 'text-right',
                                        column.isNumeric && 'tabular-nums',
                                        column.cellClassName,
                                    )}
                                >
                                    {column.render(row)}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
            <ul className={cn('tablet:hidden', mobileListClassName)}>
                {rows.map((row) => (
                    <li key={rowKey(row)}>{renderMobileItem(row)}</li>
                ))}
            </ul>
        </>
    );
}

function HeaderCell<Row>({ column }: { column: DataTableColumn<Row> }) {
    const direction = column.sort?.direction ?? null;
    const SortIcon = direction === 'desc' ? ChevronDown : ChevronUp;

    return (
        <th
            scope="col"
            aria-sort={direction ? ariaSort[direction] : undefined}
            className={cn(
                'border-primary text-grey-dark border-b px-4 py-3 text-xs leading-4 font-semibold tracking-[0.06em] whitespace-nowrap uppercase',
                column.alignEnd ? 'text-right' : 'text-left',
            )}
        >
            {column.sort ? (
                <Link
                    href={column.sort.href}
                    {...listVisitOptions}
                    className={cn(
                        'inline-flex items-center gap-1 hover:underline',
                        direction && 'text-primary',
                    )}
                >
                    {column.header}
                    {direction && (
                        <SortIcon
                            aria-hidden="true"
                            className="size-3.5"
                            strokeWidth={2}
                        />
                    )}
                </Link>
            ) : (
                column.header
            )}
        </th>
    );
}
