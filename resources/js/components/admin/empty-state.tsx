import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

type EmptyStateProps = {
    icon: LucideIcon;
    message: string;
    action?: ReactNode;
};

export function EmptyState({ icon: Icon, message, action }: EmptyStateProps) {
    return (
        <div
            role="status"
            className="border-grey-light flex flex-col items-center gap-3.5 rounded-md border px-6 py-10 text-center"
        >
            <Icon
                aria-hidden="true"
                className="text-grey-medium size-8"
                strokeWidth={1.75}
            />
            <p className="text-xl leading-[1.3] font-semibold">{message}</p>
            {action}
        </div>
    );
}
