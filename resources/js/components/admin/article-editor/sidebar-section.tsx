import type { ReactNode } from 'react';

type SidebarSectionProps = {
    id: string;
    title: string;
    children: ReactNode;
};

/**
 * Titled block of the editor's side column, named by its heading.
 */
export function SidebarSection({ id, title, children }: SidebarSectionProps) {
    return (
        <section
            aria-labelledby={id}
            className="border-primary flex flex-col gap-5 border-t-2 pt-3"
        >
            <h2
                id={id}
                className="text-overline text-grey-dark font-semibold uppercase"
            >
                {title}
            </h2>
            {children}
        </section>
    );
}
