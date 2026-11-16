import { Button } from '@/components/public/button';
import { adminLabels } from '@/lib/labels.admin.fr';

const text = adminLabels.account;

type EditorActionsProps = {
    isBusy: boolean;
    onCancel: () => void;
};

/**
 * « Annuler » and « Enregistrer » of an inline editor: side by side, full width on phone.
 */
export function EditorActions({ isBusy, onCancel }: EditorActionsProps) {
    return (
        <div className="tablet:flex tablet:justify-end grid grid-cols-2 gap-2">
            <Button
                variant="secondary"
                onClick={onCancel}
                disabled={isBusy}
                className="tablet:h-11 h-12"
            >
                {text.cancel}
            </Button>
            <Button
                type="submit"
                isLoading={isBusy}
                disabled={isBusy}
                className="tablet:h-11 h-12"
            >
                {text.save}
            </Button>
        </div>
    );
}
