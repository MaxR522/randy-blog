import { LoaderCircle } from 'lucide-react';
import { adminLabels } from '@/lib/labels.admin.fr';

const text = adminLabels.analytics;

/**
 * Pulsing stand-in while the GA4 figures load.
 */
export function AnalyticsSkeleton() {
    return (
        <div role="status" aria-busy="true" className="flex flex-col gap-6">
            <p className="text-body-small text-grey-dark flex items-center gap-2 font-medium">
                <LoaderCircle
                    aria-hidden="true"
                    className="size-4.5 animate-spin motion-reduce:animate-none"
                    strokeWidth={1.75}
                />
                {text.loading}
            </p>
            <div className="tablet:grid-cols-4 grid grid-cols-2 gap-4">
                {[0, 1, 2, 3].map((index) => (
                    <div
                        key={index}
                        className="bg-grey-subtle h-28 animate-pulse rounded-md motion-reduce:animate-none"
                    />
                ))}
            </div>
            <div className="bg-grey-subtle h-72 animate-pulse rounded-md motion-reduce:animate-none" />
        </div>
    );
}
