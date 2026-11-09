import { Form } from '@inertiajs/react';
import { PasswordField } from '@/components/admin/password-field';
import { TextField } from '@/components/admin/text-field';
import { Button } from '@/components/public/button';
import AdminAuthLayout from '@/layouts/admin-auth-layout';
import { adminLabels } from '@/lib/labels.admin.fr';
import { update } from '@/routes/password';

type ResetPasswordProps = {
    token: string;
    email: string;
};

export default function ResetPassword({ token, email }: ResetPasswordProps) {
    const text = adminLabels.resetPassword;

    return (
        <AdminAuthLayout title={text.title}>
            <Form
                {...update.form()}
                resetOnError={['password', 'password_confirmation']}
                className="flex flex-col gap-5"
            >
                {({ errors, processing }) => (
                    <>
                        <input type="hidden" name="token" value={token} />
                        <TextField
                            label={adminLabels.fields.email}
                            name="email"
                            type="email"
                            autoComplete="username"
                            defaultValue={email}
                            readOnly
                            error={errors.email}
                        />
                        <PasswordField
                            label={text.password}
                            name="password"
                            autoComplete="new-password"
                            required
                            help={text.passwordHelp}
                            error={errors.password}
                        />
                        <PasswordField
                            label={text.confirmation}
                            name="password_confirmation"
                            autoComplete="new-password"
                            required
                        />
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
        </AdminAuthLayout>
    );
}
