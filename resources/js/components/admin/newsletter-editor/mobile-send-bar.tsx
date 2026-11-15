import { SendButton } from '@/components/admin/newsletter-editor/send-button';
import { adminLabels } from '@/lib/labels.admin.fr';

const text = adminLabels.newsletterEditor;

type MobileSendBarProps = {
    recipientCount: number;
    canSend: boolean;
    onSend: () => void;
};

/**
 * The bar stuck to the bottom on phones: the recipient total and « Envoyer ».
 */
export function MobileSendBar({
    recipientCount,
    canSend,
    onSend,
}: MobileSendBarProps) {
    return (
        <div className="tablet:hidden -mx-gutter border-grey-light px-gutter sticky bottom-0 z-10 mt-6 flex flex-col gap-2 border-t bg-white py-3 shadow-[0_-8px_16px_-12px_rgba(0,0,0,0.15)]">
            <p className="text-caption text-grey-dark text-center">
                {text.recipientTotal(recipientCount)}
            </p>
            <SendButton isDisabled={!canSend} onClick={onSend} />
        </div>
    );
}
