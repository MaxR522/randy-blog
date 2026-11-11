import { Link, router } from '@inertiajs/react';
import type { ReactNode } from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ConfirmModal } from '@/components/admin/confirm-modal';
import { Button } from '@/components/public/button';
import { adminLabels } from '@/lib/labels.admin.fr';
import { useUnsavedChangesGuard } from '@/lib/unsaved-changes';
import { cn } from '@/lib/utils';
import { account } from '@/routes/admin';
import { security } from '@/routes/admin/account';

const text = adminLabels.account;

export type EditorProps = {
    onDirtyChange: (isDirty: boolean) => void;
    onDone: () => void;
};

/**
 * One inline editor open at a time on a « Gestion du compte » tab, with the unsaved-changes guard and the focus
 * returned to the « Modifier » button that opened it.
 */
export function useInlineEditing<Field extends string>() {
    const [editing, setEditing] = useState<Field | null>(null);
    const [isDirty, setIsDirty] = useState(false);
    const [leavingUrl, setLeavingUrl] = useState<string | null>(null);
    const isLeavingRef = useRef(false);
    const editButtons = useRef(new Map<Field, HTMLButtonElement>());

    useUnsavedChangesGuard(isDirty, isLeavingRef, setLeavingUrl);

    const close = useCallback(() => {
        const field = editing;
        setEditing(null);
        setIsDirty(false);
        // Back on the button that opened the editor, once it is enabled again.
        requestAnimationFrame(
            () => field && editButtons.current.get(field)?.focus(),
        );
    }, [editing]);

    function rowProps(field: Field) {
        const isEditing = editing === field;

        return {
            isEditing,
            isLocked: editing !== null && !isEditing,
            onEdit: () => setEditing(field),
            editButtonRef: (button: HTMLButtonElement | null) => {
                if (button) {
                    editButtons.current.set(field, button);
                }
            },
        };
    }

    const leaveModal = (
        <ConfirmModal
            isOpen={leavingUrl !== null}
            onClose={() => setLeavingUrl(null)}
            onConfirm={() => {
                isLeavingRef.current = true;

                if (leavingUrl) {
                    router.visit(leavingUrl);
                }
            }}
            title={text.leaveTitle}
            description={text.leaveDescription}
            confirmLabel={text.leaveConfirm}
        />
    );

    return { editing, rowProps, close, setIsDirty, leaveModal };
}

/**
 * « Profil » and « Sécurité »: two pages, so links marked with `aria-current` rather than ARIA tabs.
 */
export function AccountTabs({ current }: { current: 'profile' | 'security' }) {
    const tabs = [
        { key: 'profile', label: text.profileTab, href: account.url() },
        { key: 'security', label: text.securityTab, href: security.url() },
    ] as const;

    return (
        <nav
            aria-label={text.tabs}
            className="border-grey-light tablet:gap-7 flex border-b"
        >
            {tabs.map((tab) => {
                const isCurrent = tab.key === current;

                return (
                    <Link
                        key={tab.key}
                        href={tab.href}
                        aria-current={isCurrent ? 'page' : undefined}
                        className={cn(
                            'tablet:flex-none -mb-px flex h-11 flex-1 items-center justify-center border-b-2 text-[0.9375rem]',
                            isCurrent
                                ? 'border-primary text-primary font-semibold'
                                : 'text-grey-dark hover:text-primary border-transparent font-medium',
                        )}
                    >
                        {tab.label}
                    </Link>
                );
            })}
        </nav>
    );
}

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

export function FieldValue({
    value,
    children,
}: {
    value: string | null;
    /** Shown after the value, such as a status badge. */
    children?: ReactNode;
}) {
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

/**
 * Focus the first field when an inline editor opens.
 */
export function useFocusOnOpen() {
    const containerRef = useRef<HTMLFormElement>(null);

    useEffect(() => {
        containerRef.current
            ?.querySelector<HTMLElement>('input, [contenteditable], iframe')
            ?.focus();
    }, []);

    return containerRef;
}
