import { Button } from '@/components/public/button';
import { CODES_COPIED_MS, downloadText } from '@/helpers/two-factor';
import { useCopiedFlag } from '@/hooks/use-copied-flag';
import { adminLabels } from '@/lib/labels.admin.fr';

const text = adminLabels.security;

type RecoveryCodesProps = {
    codes: string[];
    onDone: () => void;
};

/**
 * The recovery codes, shown once after turning 2FA on or regenerating them, with « Copier » and « Télécharger ».
 */
export function RecoveryCodes({ codes, onDone }: RecoveryCodesProps) {
    const { isCopied, setIsCopied } = useCopiedFlag(CODES_COPIED_MS);
    const codesText = codes.join('\n');

    async function copy(): Promise<void> {
        await navigator.clipboard.writeText(codesText);
        setIsCopied(true);
    }

    return (
        <div className="flex flex-col gap-4">
            <div className="border-grey-light tablet:p-5 rounded-md border p-4">
                <h3 className="mb-1 text-[0.9375rem] font-semibold">
                    {text.recoveryCodes}
                </h3>
                <p className="text-caption text-grey-dark mb-3.5">
                    {text.recoveryCodesHelp}
                </p>
                <ul className="tablet:grid-cols-2 laptop:grid-cols-3 grid grid-cols-1 gap-x-4 gap-y-2 font-mono text-sm leading-5.5">
                    {codes.map((code) => (
                        <li key={code} className="break-all">
                            {code}
                        </li>
                    ))}
                </ul>
                <div className="mt-4 flex gap-2">
                    <Button variant="secondary" onClick={copy}>
                        {isCopied ? text.codesCopied : text.copyCodes}
                    </Button>
                    <Button
                        variant="secondary"
                        onClick={() =>
                            downloadText(`${codesText}\n`, text.codesFileName)
                        }
                    >
                        {text.downloadCodes}
                    </Button>
                </div>
                <p role="status" className="sr-only">
                    {isCopied ? text.codesCopied : ''}
                </p>
            </div>
            <div className="tablet:justify-end flex">
                <Button onClick={onDone} className="tablet:h-11 h-12">
                    {text.done}
                </Button>
            </div>
        </div>
    );
}
