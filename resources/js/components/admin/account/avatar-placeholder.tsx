import { UserRound } from 'lucide-react';
import { adminLabels } from '@/lib/labels.admin.fr';
import { cn } from '@/lib/utils';

const text = adminLabels.account;

/**
 * Square stand-in when no avatar is set.
 */
export function AvatarPlaceholder({ className }: { className?: string }) {
    return (
        <span
            role="img"
            aria-label={text.noAvatar}
            className={cn(
                'aspect-avatar bg-grey-subtle text-grey-medium flex items-center justify-center rounded-sm',
                className,
            )}
        >
            <UserRound
                aria-hidden="true"
                className="size-1/3"
                strokeWidth={1.25}
            />
        </span>
    );
}
