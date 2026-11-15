import { Send } from 'lucide-react';
import { Button } from '@/components/public/button';
import { adminLabels } from '@/lib/labels.admin.fr';

const text = adminLabels.newsletterEditor;

type SendButtonProps = {
    isDisabled: boolean;
    onClick: () => void;
};

/**
 * « Envoyer », in the header on wider screens and in the sticky bar on phones. It opens the confirmation.
 */
export function SendButton({ isDisabled, onClick }: SendButtonProps) {
    return (
        <Button disabled={isDisabled} onClick={onClick} className="w-full">
            <Send aria-hidden="true" className="size-4.5" strokeWidth={1.75} />
            {text.send}
        </Button>
    );
}
