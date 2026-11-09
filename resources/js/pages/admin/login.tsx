import { Form, Link, usePage } from '@inertiajs/react';
import { Alert } from '@/components/admin/alert';
import { PasswordField } from '@/components/admin/password-field';
import { TextField } from '@/components/admin/text-field';
import { Button } from '@/components/public/button';
import AdminAuthLayout from '@/layouts/admin-auth-layout';
import { adminLabels } from '@/lib/labels.admin.fr';
import { frenchTypography } from '@/lib/typography';
import { store } from '@/routes/login';
import { request } from '@/routes/password';

type LoginProps = {
    status?: string | null;
};

const FORM_ERROR_ID = 'connexion-erreur';

const linkClasses =
    'text-body-small text-accent-600 hover:text-accent-800 font-medium underline underline-offset-3';

export default function Login({ status }: LoginProps) {
    const text = adminLabels.login;
    const forgotPassword = frenchTypography(text.forgotPassword);
    const emailError = usePage().props.errors.email;

    return (
        <AdminAuthLayout
            title={text.title}
            after={
                emailError && (
                    <Alert
                        variant="error"
                        id={FORM_ERROR_ID}
                        className="tablet:mx-0 mx-4 mt-4 mb-6"
                    >
                        {emailError}
                    </Alert>
                )
            }
        >
            {status && <Alert variant="success">{status}</Alert>}
            <Form
                {...store.form()}
                resetOnError={['password']}
                className="flex flex-col gap-5"
            >
                {({ errors, processing }) => (
                    <>
                        <TextField
                            label={adminLabels.fields.email}
                            name="email"
                            type="email"
                            autoComplete="username"
                            required
                            aria-invalid={emailError ? true : undefined}
                            aria-describedby={
                                emailError ? FORM_ERROR_ID : undefined
                            }
                        />
                        <PasswordField
                            label={adminLabels.fields.password}
                            name="password"
                            autoComplete="current-password"
                            required
                            error={errors.password}
                            labelAction={
                                <Link
                                    href={request()}
                                    className={`${linkClasses} tablet:inline hidden`}
                                >
                                    {forgotPassword}
                                </Link>
                            }
                        />
                        <label className="text-button flex min-h-11 items-center gap-3 font-normal">
                            <input
                                type="checkbox"
                                name="remember"
                                value="1"
                                className="accent-primary m-0 size-5"
                            />
                            {text.remember}
                        </label>
                        <Button
                            type="submit"
                            className="h-12 w-full"
                            isLoading={processing}
                            disabled={processing}
                        >
                            {text.submit}
                        </Button>
                        <Link
                            href={request()}
                            className={`${linkClasses} tablet:hidden flex min-h-11 items-center justify-center`}
                        >
                            {forgotPassword}
                        </Link>
                    </>
                )}
            </Form>
        </AdminAuthLayout>
    );
}
