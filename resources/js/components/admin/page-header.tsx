import type { ReactNode } from 'react';

type PageHeaderProps = {
    title: string;
    action?: ReactNode;
};

/**
 * Title on the left, primary action on the right; the action stacks under the title on phones (ADM-COM-4).
 */
export function PageHeader({ title, action }: PageHeaderProps) {
    return (
        <div className="tablet:mb-6 tablet:flex-row tablet:items-center tablet:justify-between mb-4 flex flex-col gap-4">
            <h1 className="text-h2">{title}</h1>
            {action}
        </div>
    );
}
