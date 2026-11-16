import { PERIODS } from '@/helpers/analytics';
import { adminLabels } from '@/lib/labels.admin.fr';
import { cn } from '@/lib/utils';

const text = adminLabels.analytics;

type PeriodPickerProps = {
    shownPeriod: number;
    onChoose: (days: number) => void;
};

/**
 * « 7 jours », « 28 jours », « 90 jours »: toggle buttons, the shown one pressed.
 */
export function PeriodPicker({ shownPeriod, onChoose }: PeriodPickerProps) {
    return (
        <div
            role="group"
            aria-label={text.period}
            className="border-grey-medium inline-flex self-start overflow-hidden rounded-md border"
        >
            {PERIODS.map((days) => (
                <button
                    key={days}
                    type="button"
                    aria-pressed={days === shownPeriod}
                    onClick={() => onChoose(days)}
                    className={cn(
                        'text-body-small border-grey-medium tablet:px-4 h-11 cursor-pointer border-r px-3 font-medium last:border-r-0',
                        days === shownPeriod
                            ? 'bg-primary text-white'
                            : 'hover:bg-grey-subtle',
                    )}
                >
                    {text.periods[days]}
                </button>
            ))}
        </div>
    );
}
