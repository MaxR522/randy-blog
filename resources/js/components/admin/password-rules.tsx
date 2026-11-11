import { Check, Circle } from 'lucide-react';
import { adminLabels } from '@/lib/labels.admin.fr';
import { cn } from '@/lib/utils';

const text = adminLabels.security;

/**
 * The rules of ADM-SEC-3, ticked as the new password is typed. The breach check only runs on the server.
 */
export function PasswordRules({
    id,
    password,
}: {
    id: string;
    password: string;
}) {
    const rules = [
        { label: text.passwordRules.length, isMet: password.length >= 12 },
        {
            label: text.passwordRules.mixedCase,
            isMet: /\p{Ll}/u.test(password) && /\p{Lu}/u.test(password),
        },
        { label: text.passwordRules.number, isMet: /\p{N}/u.test(password) },
        {
            label: text.passwordRules.symbol,
            isMet: /[\p{Z}\p{S}\p{P}]/u.test(password),
        },
        { label: text.passwordRules.uncompromised, isMet: false },
    ];

    return (
        <ul id={id} className="flex flex-col gap-1">
            {rules.map((rule) => {
                const Icon = rule.isMet ? Check : Circle;

                return (
                    <li
                        key={rule.label}
                        className={cn(
                            'flex items-center gap-2 text-[0.8125rem] leading-5',
                            rule.isMet ? 'text-green-700' : 'text-grey-dark',
                        )}
                    >
                        <Icon
                            aria-hidden="true"
                            className="size-4 flex-none"
                            strokeWidth={2}
                        />
                        {rule.label}
                        {rule.label !== text.passwordRules.uncompromised && (
                            <span className="sr-only">
                                {' '}
                                :{' '}
                                {rule.isMet
                                    ? text.passwordRules.met
                                    : text.passwordRules.unmet}
                            </span>
                        )}
                    </li>
                );
            })}
        </ul>
    );
}
