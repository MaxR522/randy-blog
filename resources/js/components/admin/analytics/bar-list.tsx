import { adminLabels } from '@/lib/labels.admin.fr';
import type { AnalyticsShare } from '@/types/admin';

type BarListProps = {
    title: string;
    items: AnalyticsShare[];
};

/**
 * Share of each value in the total (traffic sources, devices, countries). One colour for every bar: the label and the
 * percentage carry the identity, and the bars only show the proportion.
 */
export function BarList({ title, items }: BarListProps) {
    return (
        <section className="border-grey-light rounded-md border px-5 py-5">
            <h2 className="text-h4 mb-4">{title}</h2>
            {items.length === 0 ? (
                <p className="text-body-small text-grey-dark">
                    {adminLabels.analytics.noData}
                </p>
            ) : (
                <ul className="flex flex-col gap-1">
                    {items.map(({ label, share }) => (
                        <li
                            key={label}
                            className="text-body-small tablet:grid-cols-[9rem_1fr_3.5rem] grid min-h-8 grid-cols-[7rem_1fr_3rem] items-center gap-3"
                        >
                            <span className="truncate">{label}</span>
                            <span
                                aria-hidden="true"
                                className="bg-grey-subtle block h-2 rounded-r-md"
                            >
                                <span
                                    className="bg-accent-600 block h-2 rounded-r-md"
                                    style={{ width: `${share}%` }}
                                />
                            </span>
                            <span className="text-right font-medium">
                                {share} %
                            </span>
                        </li>
                    ))}
                </ul>
            )}
        </section>
    );
}
