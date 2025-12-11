import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import AuthLayout from '@/layouts/auth-layout';
import { store } from '@/routes/login';
import { request } from '@/routes/password';
import { Form, Head } from '@inertiajs/react';
import { Eye, EyeOff, ShieldCheck, Truck } from 'lucide-react';
import { useMemo, useState } from 'react';

interface LoginProps {
    status?: string;
    canResetPassword: boolean;
    canRegister: boolean;
}

const SUPPORT_CHANNELS = [
    {
        label: 'Control tower hotline',
        value: '0929 102 926',
        href: 'tel:0929102926',
    },
    {
        label: 'Operations desk',
        value: '0916 666 254',
        href: 'tel:0916666254',
    },
    {
        label: 'Email support',
        value: 'yetimnew@gmail.com',
        href: 'mailto:yetimnew@gmail.com',
    },
];

export default function Login({ status, canResetPassword, canRegister }: LoginProps) {
    const [showPassword, setShowPassword] = useState(false);
    const formattedStatus = useMemo(() => status?.trim(), [status]);

    return (
        <AuthLayout
            title="Access the TIMS control tower"
            description="Authenticate with your fleet credentials to continue orchestrating dispatch, compliance, and performance workflows."
        >
            <Head title="Log in" />

            <Form
                {...store.form()}
                resetOnSuccess={['password']}
                className="flex flex-col gap-6"
            >
                {({ processing, errors }) => (
                    <>
                        {formattedStatus && (
                            <div className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 p-3 text-sm text-emerald-200">
                                {formattedStatus}
                            </div>
                        )}
                        <div className="grid gap-6">
                            <div className="grid gap-2">
                                <Label htmlFor="email">Email address</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    name="email"
                                    required
                                    autoFocus
                                    tabIndex={1}
                                    autoComplete="email"
                                    placeholder="email@example.com"
                                />
                                <InputError message={errors.email} />
                            </div>

                            <div className="grid gap-2">
                                <div className="flex items-center">
                                    <Label htmlFor="password">Password</Label>
                                    {canResetPassword && (
                                        <TextLink
                                            href={request()}
                                            className="ml-auto text-sm"
                                            tabIndex={5}
                                        >
                                            Forgot password?
                                        </TextLink>
                                    )}
                                </div>
                                <div className="relative">
                                    <Input
                                        id="password"
                                        type={showPassword ? 'text' : 'password'}
                                        name="password"
                                        required
                                        tabIndex={2}
                                        autoComplete="current-password"
                                        placeholder="Password"
                                        className="pr-10"
                                    />
                                    <button
                                        type="button"
                                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                                        onClick={() => setShowPassword(prev => !prev)}
                                        className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground"
                                        tabIndex={2}
                                    >
                                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                                <InputError message={errors.password} />
                            </div>

                            <div className="flex items-center space-x-3">
                                <Checkbox
                                    id="remember"
                                    name="remember"
                                    tabIndex={3}
                                />
                                <Label htmlFor="remember">Remember me</Label>
                            </div>

                            <Button
                                type="submit"
                                className="mt-4 w-full"
                                tabIndex={4}
                                disabled={processing}
                                data-test="login-button"
                            >
                                {processing && <Spinner />}
                                Log in
                            </Button>
                        </div>

                        {canRegister && (
                            <div className="text-center text-sm text-muted-foreground">
                                Don't have an account?{' '}
                                <TextLink href="#" tabIndex={5}>
                                    Contact administrator
                                </TextLink>
                            </div>
                        )}
                        <div className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-slate-200">
                            <div className="flex items-start gap-3">
                                <ShieldCheck className="mt-1 size-5 text-emerald-300" />
                                <div className="space-y-1">
                                    <p className="font-medium text-white">Security first</p>
                                    <p className="text-xs text-slate-300">
                                        All TIMS sessions are monitored and protected. If you suspect any suspicious activity, alert the control tower immediately.
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <Truck className="mt-1 size-5 text-sky-300" />
                                <div className="space-y-1">
                                    <p className="font-medium text-white">Need assistance?</p>
                                    <ul className="space-y-1 text-xs text-slate-300">
                                        {SUPPORT_CHANNELS.map(channel => (
                                            <li key={channel.label} className="flex items-center justify-between gap-3">
                                                <span className="uppercase tracking-[0.3em] text-slate-400">{channel.label}</span>
                                                <a className="text-sky-300 hover:text-sky-200" href={channel.href}>
                                                    {channel.value}
                                                </a>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </Form>
        </AuthLayout>
    );
}
