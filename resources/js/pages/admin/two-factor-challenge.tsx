import { Form, Link } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import { useState } from 'react';
import { TextField } from '@/components/admin/text-field';
import { Button } from '@/components/public/button';
import AdminAuthLayout from '@/layouts/admin-auth-layout';
import { adminLabels } from '@/lib/labels.admin.fr';
import { login } from '@/routes';
import { store } from '@/routes/two-factor/login';

const linkClasses =
    'text-body-small text-accent-600 hover:text-accent-800 flex min-h-11 items-center justify-center font-medium underline underline-offset-3';

/**
 * « Vérification en deux étapes » (ADM-SEC-4), after the password of an account with 2FA: the app's code, or one of
 * the recovery codes.
 */
export default function TwoFactorChallenge() {
    const text = adminLabels.twoFactorChallenge;
    const [isRecovery, setIsRecovery] = useState(false);

    return (
        <AdminAuthLayout title={text.title}>
            <p className="text-grey-dark text-[0.9375rem] leading-[1.55]">
                {isRecovery ? text.recoveryIntro : text.intro}
            </p>
            <Form
                {...store.form()}
                resetOnError
                className="flex flex-col gap-5"
            >
                {({ errors, processing }) => (
                    <>
                        {isRecovery ? (
                            <TextField
                                key="recovery_code"
                                label={text.recoveryCode}
                                name="recovery_code"
                                autoComplete="off"
                                autoCapitalize="off"
                                spellCheck={false}
                                required
                                autoFocus
                                error={errors.recovery_code}
                                className="h-14 text-center font-mono text-lg"
                            />
                        ) : (
                            <TextField
                                key="code"
                                label={text.code}
                                name="code"
                                inputMode="numeric"
                                autoComplete="one-time-code"
                                maxLength={7}
                                required
                                autoFocus
                                error={errors.code}
                                className="h-14 text-center text-2xl tracking-[0.3em] tabular-nums"
                            />
                        )}
                        <Button
                            type="submit"
                            className="h-12 w-full"
                            isLoading={processing}
                            disabled={processing}
                        >
                            {text.submit}
                        </Button>
                    </>
                )}
            </Form>
            <button
                type="button"
                onClick={() => setIsRecovery((value) => !value)}
                className={linkClasses}
            >
                {isRecovery ? text.useAppCode : text.useRecoveryCode}
            </button>
            <Link
                href={login()}
                className="text-body-small text-primary -mt-3 flex min-h-11 items-center justify-center gap-1.5 font-medium"
            >
                <ArrowLeft
                    aria-hidden="true"
                    className="size-4"
                    strokeWidth={2}
                />
                {adminLabels.forgotPassword.back}
            </Link>
        </AdminAuthLayout>
    );
}
