import type { ReactNode } from 'react';
import { adminLabels } from '@/lib/labels.admin.fr';

const text = adminLabels.account;

type FieldValueProps = {
    value: string | null;
    /** Shown after the value, such as a status badge. */
    children?: ReactNode;
};

/**
 * The read-only value of an account field, or « Non renseigné » when it is empty.
 */
export function FieldValue({ value, children }: FieldValueProps) {
    return value ? (
        <p className="tablet:text-base flex flex-wrap items-center gap-x-2 gap-y-1 text-[0.9375rem] leading-6 wrap-anywhere">
            {value}
            {children}
        </p>
    ) : (
        <p className="text-grey-dark tablet:text-base text-[0.9375rem] leading-6">
            {text.empty}
        </p>
    );
}
