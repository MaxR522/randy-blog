import { CircleAlert, WandSparkles } from 'lucide-react';
import { ConfirmModal } from '@/components/admin/confirm-modal';
import { Button } from '@/components/public/button';
import { adminLabels } from '@/lib/labels.admin.fr';

const text = adminLabels.suggestions;

type SeoSuggestionsProps = {
    processing: boolean;
    /** The message shown instead of the help text, or `null`. */
    error: string | null;
    /** Whether the confirmation to replace filled fields is open. */
    isConfirming: boolean;
    onStart: () => void;
    onConfirm: () => void;
    onCancel: () => void;
};

/**
 * « Générer avec l’IA »: the button, its help or error, and the confirmation before replacing filled fields.
 */
export function SeoSuggestions({
    processing,
    error,
    isConfirming,
    onStart,
    onConfirm,
    onCancel,
}: SeoSuggestionsProps) {
    return (
        <div className="flex flex-col gap-2">
            <Button
                variant="secondary"
                isLoading={processing}
                disabled={processing}
                onClick={onStart}
                className="self-start text-sm"
            >
                {!processing && (
                    <WandSparkles
                        aria-hidden="true"
                        className="size-4.5"
                        strokeWidth={1.75}
                    />
                )}
                {text.generate}
            </Button>
            {error ? (
                <p
                    role="alert"
                    className="text-body-small flex gap-2 font-medium text-red-700"
                >
                    <CircleAlert
                        aria-hidden="true"
                        className="mt-0.5 size-4 flex-none"
                        strokeWidth={2}
                    />
                    {error}
                </p>
            ) : (
                <p className="text-caption text-grey-dark">{text.help}</p>
            )}

            <ConfirmModal
                isOpen={isConfirming}
                onClose={onCancel}
                onConfirm={onConfirm}
                title={text.replaceTitle}
                description={text.replaceDescription}
                confirmLabel={text.replace}
                confirmVariant="primary"
            />
        </div>
    );
}
