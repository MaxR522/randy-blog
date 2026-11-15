import { Modal, ModalBody, ModalFooter } from '@/components/admin/modal';
import { TextField } from '@/components/admin/text-field';
import { Button } from '@/components/public/button';
import type { CategoryForm } from '@/hooks/use-category-form';
import { adminLabels } from '@/lib/labels.admin.fr';

const text = adminLabels.categories;

type CategoryFormModalProps = {
    isOpen: boolean;
    isEditing: boolean;
    form: CategoryForm;
    onClose: () => void;
    onSubmit: () => void;
};

/**
 * Creates or edits. No native `required`: the French inline message comes from the server (ADM-COM-7).
 */
export function CategoryFormModal({
    isOpen,
    isEditing,
    form,
    onClose,
    onSubmit,
}: CategoryFormModalProps) {
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={isEditing ? text.editTitle : text.create}
        >
            <form
                onSubmit={(event) => {
                    event.preventDefault();
                    onSubmit();
                }}
                className="tablet:flex-none flex min-h-0 flex-1 flex-col"
            >
                <ModalBody>
                    <TextField
                        label={text.nameField}
                        name="name"
                        value={form.name}
                        onChange={(event) =>
                            form.changeName(event.target.value)
                        }
                        autoComplete="off"
                        aria-required="true"
                        data-autofocus
                        error={form.error}
                    />
                </ModalBody>
                <ModalFooter>
                    <Button
                        variant="secondary"
                        onClick={onClose}
                        className="tablet:h-11 h-12"
                    >
                        {adminLabels.modal.cancel}
                    </Button>
                    <Button
                        type="submit"
                        isLoading={form.isSaving}
                        disabled={form.isSaving}
                        className="tablet:h-11 h-12"
                    >
                        {adminLabels.modal.save}
                    </Button>
                </ModalFooter>
            </form>
        </Modal>
    );
}
