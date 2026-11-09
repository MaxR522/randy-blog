import { Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import type { TextFieldProps } from '@/components/admin/text-field';
import { TextField } from '@/components/admin/text-field';
import { adminLabels } from '@/lib/labels.admin.fr';

/**
 * Password input with a show/hide button.
 */
export function PasswordField(
    props: Omit<TextFieldProps, 'type' | 'trailing'>,
) {
    const [isVisible, setIsVisible] = useState(false);
    const Icon = isVisible ? EyeOff : Eye;

    return (
        <TextField
            {...props}
            type={isVisible ? 'text' : 'password'}
            trailing={
                <button
                    type="button"
                    onClick={() => setIsVisible(!isVisible)}
                    aria-label={
                        isVisible
                            ? adminLabels.fields.hidePassword
                            : adminLabels.fields.showPassword
                    }
                    className="text-primary absolute top-0.5 right-0.5 flex size-11 cursor-pointer items-center justify-center"
                >
                    <Icon
                        aria-hidden="true"
                        className="size-5"
                        strokeWidth={1.75}
                    />
                </button>
            }
        />
    );
}
