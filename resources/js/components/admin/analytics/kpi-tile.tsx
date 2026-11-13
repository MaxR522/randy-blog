import { adminLabels } from '@/lib/labels.admin.fr';
import { cn } from '@/lib/utils';

const text = adminLabels.analytics;

type KpiTileProps = {
    label: string;
    value: string;
    /** Percentage against the previous period, `null` when there was nothing to compare with. */
    change?: number | null;
};

/**
 * Key figure with its change against the previous period (ADM-ANA-1, ADM-ANA-2). The arrow is never the only signal:
 * the percentage and a screen reader sentence say the same.
 */
export function KpiTile({ label, value, change }: KpiTileProps) {
    const trend =
        change === undefined || change === null
            ? null
            : change > 0
              ? 'up'
              : change < 0
                ? 'down'
                : 'stable';

    return (
        <div className="border-grey-light rounded-md border px-5 py-4">
            <p className="text-body-small text-grey-dark font-medium">
                {label}
            </p>
            <p className="text-h2 mt-1">{value}</p>
            <p
                className={cn(
                    'text-meta mt-1 font-semibold',
                    trend === 'up' && 'text-green-700',
                    trend === 'down' && 'text-red-700',
                    (trend === 'stable' || trend === null) && 'text-grey-dark',
                )}
            >
                {trend === null ? (
                    text.noComparison
                ) : (
                    <>
                        <span aria-hidden="true">
                            {trend === 'up'
                                ? '▲'
                                : trend === 'down'
                                  ? '▼'
                                  : '='}{' '}
                            {Math.abs(change ?? 0)} %
                        </span>
                        <span className="sr-only">
                            {text[trend]}
                            {trend === 'stable'
                                ? ''
                                : ` de ${Math.abs(change ?? 0)} %`}
                        </span>{' '}
                        <span className="text-grey-dark font-normal">
                            {text.versusPrevious}
                        </span>
                    </>
                )}
            </p>
        </div>
    );
}
