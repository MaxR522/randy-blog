import { Link } from '@inertiajs/react';
import { listUrl, listVisitOptions } from '@/lib/list-url';
import { cn } from '@/lib/utils';

export type StatusFilterOption<Value extends string> = {
    value: Value | null;
    label: string;
};

type StatusFiltersProps<Value extends string> = {
    label: string;
    options: StatusFilterOption<Value>[];
    current: Value | null;
    url: string;
};

/**
 * Status filter of a list, bound to `?status=`: segmented control from 768 px, a row of chips
 * scrolling inside its own box below.
 */
export function StatusFilters<Value extends string>({
    label,
    options,
    current,
    url,
}: StatusFiltersProps<Value>) {
    return (
        <div
            role="group"
            aria-label={label}
            className="tablet:mx-0 tablet:gap-0 tablet:overflow-hidden tablet:rounded-md tablet:border tablet:border-grey-medium tablet:px-0 -mx-4 flex gap-2 overflow-x-auto px-4"
        >
            {options.map((option, index) => {
                const isCurrent = option.value === current;

                return (
                    <Link
                        key={option.label}
                        href={listUrl(url, { status: option.value })}
                        {...listVisitOptions}
                        aria-current={isCurrent ? 'true' : undefined}
                        className={cn(
                            'tablet:h-12 tablet:rounded-none tablet:border-0 tablet:px-4 flex h-10 flex-none items-center rounded-full border px-3.5 text-sm',
                            index > 0 &&
                                'tablet:border-l tablet:border-grey-light',
                            isCurrent
                                ? 'border-primary bg-primary font-semibold text-white'
                                : 'border-grey-medium text-primary hover:bg-grey-subtle bg-white font-medium',
                        )}
                    >
                        {option.label}
                    </Link>
                );
            })}
        </div>
    );
}
