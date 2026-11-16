import { ConfirmModal } from '@/components/admin/confirm-modal';
import { adminLabels } from '@/lib/labels.admin.fr';

const text = adminLabels.account;

type LeaveAccountModalProps = {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
};

/**
 * Confirms leaving a « Gestion du compte » tab while an inline editor holds unsaved changes.
 */
export function LeaveAccountModal({
    isOpen,
    onClose,
    onConfirm,
}: LeaveAccountModalProps) {
    return (
        <ConfirmModal
            isOpen={isOpen}
            onClose={onClose}
            onConfirm={onConfirm}
            title={text.leaveTitle}
            description={text.leaveDescription}
            confirmLabel={text.leaveConfirm}
        />
    );
}
