import { ArrowRight } from 'lucide-react';
import { labels } from '@/lib/labels.fr';
import { cn } from '@/lib/utils';

type SectionHeaderProps = {
    id: string;
    title: string;
    moreHref?: string;
    className?: string;
};

export function SectionHeader({
    id,
    title,
    moreHref,
    className,
}: SectionHeaderProps) {
    return (
        <div
            className={cn(
                'border-primary mb-6 flex min-h-11 items-center justify-between gap-4 border-t-2 pt-3',
                className,
            )}
        >
            <h2 id={id} className="text-section font-sans">
                {title}
            </h2>
            {moreHref && (
                <a
                    href={moreHref}
                    className="text-body-small text-primary inline-flex min-h-11 items-center gap-1.5 font-medium whitespace-nowrap"
                >
                    <span className="link">{labels.home.seeMore}</span>
                    <ArrowRight
                        aria-hidden="true"
                        className="size-4"
                        strokeWidth={2}
                    />
                </a>
            )}
        </div>
    );
}
