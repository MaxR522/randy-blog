import type { ReactNode } from 'react';

/**
 * A bordered block of « Analytique » with its heading.
 */
export function Panel({
    title,
    children,
}: {
    title: string;
    children: ReactNode;
}) {
    return (
        <section className="border-grey-light tablet:px-6 rounded-md border px-5 py-5">
            <h2 className="text-h4 mb-4">{title}</h2>
            {children}
        </section>
    );
}
