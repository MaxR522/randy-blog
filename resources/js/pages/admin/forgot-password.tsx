import { Form, Link } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import { Alert } from '@/components/admin/alert';
import { TextField } from '@/components/admin/text-field';
import { Button } from '@/components/public/button';
import AdminAuthLayout from '@/layouts/admin-auth-layout';
import { adminLabels } from '@/lib/labels.admin.fr';
import { cn } from '@/lib/utils';
import { login } from '@/routes';
import { email } from '@/routes/password';

type ForgotPasswordProps = {
    status?: string | null;
};

function BackLink({ className }: { className: string }) {
    return (
        <Link
            href={login()}
            className={cn(
                'text-body-small text-primary min-h-11 items-center gap-1.5 font-medium',
                className,
            )}
        >
            <ArrowLeft aria-hidden="true" className="size-4" strokeWidth={2} />
            {adminLabels.forgotPassword.back}
        </Link>
    );
}

export default function ForgotPassword({ status }: ForgotPasswordProps) {
    const text = adminLabels.forgotPassword;

    return (
        <AdminAuthLayout
            title={text.title}
            before={
                <BackLink className="tablet:inline-flex -mt-3 -mb-2 hidden" />
            }
        >
            <p className="text-grey-dark text-[0.9375rem] leading-[1.55]">
                {text.intro}
            </p>
            <Form {...email.form()} className="flex flex-col gap-5">
                {({ errors, processing }) => (
                    <>
                        <TextField
                            label={adminLabels.fields.email}
                            name="email"
                            type="email"
                            autoComplete="username"
                            required
                            error={errors.email}
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
            {status && <Alert variant="success">{status}</Alert>}
            <BackLink className="tablet:hidden flex justify-center" />
        </AdminAuthLayout>
    );
}
