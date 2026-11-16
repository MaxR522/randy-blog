import { TriangleAlert } from 'lucide-react';
import { adminLabels } from '@/lib/labels.admin.fr';

const text = adminLabels.analytics;

/**
 * Warning shown when GA4 could not be reached.
 */
export function AnalyticsUnavailable() {
    return (
        <div
            role="status"
            className="text-body-small flex gap-2.5 rounded-md border border-yellow-600 bg-yellow-50 px-4 py-3 font-medium text-yellow-800"
        >
            <TriangleAlert
                aria-hidden="true"
                className="mt-px size-4.5 flex-none"
                strokeWidth={2}
            />
            <span>{text.unavailable}</span>
        </div>
    );
}
