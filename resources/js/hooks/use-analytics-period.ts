import { router } from '@inertiajs/react';
import { useState } from 'react';
import { index as analyticsIndex } from '@/routes/admin';

/**
 * The period picker of « Analytique » (ADM-ANA-2): the period just picked shows at once while the page for it is
 * still loading.
 */
export function useAnalyticsPeriod(period: number) {
    const [pendingPeriod, setPendingPeriod] = useState<number | null>(null);

    function choose(days: number): void {
        router.get(
            analyticsIndex.url({ query: { periode: days } }),
            {},
            {
                preserveScroll: true,
                onStart: () => setPendingPeriod(days),
                onFinish: () => setPendingPeriod(null),
            },
        );
    }

    return {
        shownPeriod: pendingPeriod ?? period,
        isLoading: pendingPeriod !== null,
        choose,
    };
}

export type AnalyticsPeriodPicker = ReturnType<typeof useAnalyticsPeriod>;
