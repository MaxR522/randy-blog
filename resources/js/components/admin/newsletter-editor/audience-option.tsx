type AudienceOptionProps = {
    checked: boolean;
    onChange: () => void;
    label: string;
    help: string;
};

/**
 * A radio of the recipients fieldset, with its label and a help line.
 */
export function AudienceOption({
    checked,
    onChange,
    label,
    help,
}: AudienceOptionProps) {
    return (
        <label className="flex min-h-11 cursor-pointer items-start gap-3 text-[0.9375rem]">
            <input
                type="radio"
                name="audience"
                checked={checked}
                onChange={onChange}
                className="accent-primary mt-0.5 size-5 flex-none"
            />
            <span>
                <span className="block font-semibold">{label}</span>
                <span className="text-caption text-grey-dark">{help}</span>
            </span>
        </label>
    );
}
