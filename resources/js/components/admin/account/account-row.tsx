import type { ReactNode } from 'react';
import { Button } from '@/components/public/button';
import { adminLabels } from '@/lib/labels.admin.fr';

const text = adminLabels.account;

type AccountRowProps = {
    label: string;
    isEditing: boolean;
    isLocked: boolean;
    onEdit: () => void;
    editButtonRef: (button: HTMLButtonElement | null) => void;
    children: ReactNode;
};

/**
 * One field: label, value or editor, « Modifier ». Label and button share a line on phone, the value goes below;
 * from tablet the three sit in columns.
 */
export function AccountRow({
    label,
    isEditing,
    isLocked,
    onEdit,
    editButtonRef,
    children,
}: AccountRowProps) {
    return (
        <section
            aria-label={label}
            className="border-grey-light tablet:grid-cols-[13.75rem_minmax(0,1fr)_auto] tablet:gap-x-6 tablet:py-6 grid grid-cols-[minmax(0,1fr)_auto] items-start gap-x-3 gap-y-3 border-b py-5"
        >
            <h2 className="tablet:leading-6 tablet:min-h-0 flex min-h-11 items-center text-[0.9375rem] font-semibold">
                {label}
            </h2>
            <div className="tablet:col-span-1 tablet:col-start-2 tablet:row-start-1 col-span-2 min-w-0">
                {children}
            </div>
            {!isEditing && (
                <Button
                    ref={editButtonRef}
                    variant="secondary"
                    onClick={onEdit}
                    disabled={isLocked}
                    title={isLocked ? text.locked : undefined}
                    className="tablet:col-start-3 tablet:row-start-1 col-start-2 row-start-1 px-4"
                >
                    {text.edit}
                    <span className="sr-only"> : {label.toLowerCase()}</span>
                </Button>
            )}
        </section>
    );
}
