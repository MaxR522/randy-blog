import { Link } from '@inertiajs/react';
import { Fragment } from 'react';
import type { RowAction } from '@/helpers/row-actions-menu';
import { adminLabels } from '@/lib/labels.admin.fr';
import { cn } from '@/lib/utils';

type MenuItemsProps = {
    actions: RowAction[];
    onSelect: (action: RowAction) => void;
    itemClassName: string;
    /** Focus the first item on opening. */
    autoFocusFirst?: boolean;
};

/**
 * Items of a row actions menu: a new-tab link, an Inertia link or a button, the danger item after a hairline.
 */
export function MenuItems({
    actions,
    onSelect,
    itemClassName,
    autoFocusFirst = false,
}: MenuItemsProps) {
    return actions.map((action, index) => {
        const className = cn(
            itemClassName,
            action.isDanger ? 'text-red-700' : 'text-primary',
        );
        const focusProps =
            autoFocusFirst && index === 0 ? { 'data-autofocus': true } : {};
        let item;

        if (action.href && action.opensInNewTab) {
            item = (
                <a
                    href={action.href}
                    target="_blank"
                    rel="noopener"
                    role="menuitem"
                    onClick={() => onSelect(action)}
                    className={className}
                    {...focusProps}
                >
                    {action.label}
                    <span className="sr-only"> {adminLabels.shell.newTab}</span>
                </a>
            );
        } else if (action.href) {
            item = (
                <Link
                    href={action.href}
                    role="menuitem"
                    onClick={() => onSelect(action)}
                    className={className}
                    {...focusProps}
                >
                    {action.label}
                </Link>
            );
        } else {
            item = (
                <button
                    type="button"
                    role="menuitem"
                    onClick={() => onSelect(action)}
                    className={cn(className, 'w-full cursor-pointer text-left')}
                    {...focusProps}
                >
                    {action.label}
                </button>
            );
        }

        return (
            <Fragment key={action.key}>
                {action.isDanger && index > 0 && (
                    <div
                        role="separator"
                        className="border-grey-light my-1.5 border-t"
                    />
                )}
                {item}
            </Fragment>
        );
    });
}
