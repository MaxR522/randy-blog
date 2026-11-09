import type { ReactNode } from 'react';
import { AdminHead } from '@/components/admin/admin-head';
import AdminLayout from '@/layouts/admin-layout';
import { adminLabels } from '@/lib/labels.admin.fr';

type PlaceholderProps = {
    title: string;
};

/**
 * Stands in for a section until its roadmap session replaces it.
 */
export default function Placeholder({ title }: PlaceholderProps) {
    return (
        <>
            <AdminHead title={title} />
            <h1 className="text-section">{title}</h1>
            <p className="text-body text-grey-dark mt-3">
                {adminLabels.placeholder}
            </p>
        </>
    );
}

Placeholder.layout = (page: ReactNode) => <AdminLayout>{page}</AdminLayout>;
