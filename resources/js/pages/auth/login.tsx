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
import { AlertTriangle, ArrowUpRight, Eye, EyeOff, ShieldCheck, Truck } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { ChangeEvent, FocusEvent, FormEvent, KeyboardEvent } from 'react';

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
    const [emailError, setEmailError] = useState<string | null>(null);
    const [capsLockActive, setCapsLockActive] = useState(false);
    const formattedStatus = useMemo(() => status?.trim(), [status]);

    const validateEmail = (value: string): string | null => {
        const trimmedValue = value.trim();

        if (!trimmedValue.length) {
            return 'Email is required.';
        }

        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailPattern.test(trimmedValue)) {
            return 'Enter a valid email address.';
        }

        return null;
    };

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        const form = event.currentTarget;
        const formData = new FormData(form);
        const value = String(formData.get('email') ?? '');
        const validationMessage = validateEmail(value);

        if (validationMessage) {
            event.preventDefault();
            event.stopPropagation();
            setEmailError(validationMessage);
            form.querySelector<HTMLInputElement>('input[name="email"]')?.focus();
            return;
        }

        setEmailError(null);
    };

    const handleEmailBlur = (event: FocusEvent<HTMLInputElement>) => {
        const validationMessage = validateEmail(event.target.value);
        setEmailError(validationMessage);
    };

    const handleEmailChange = (event: ChangeEvent<HTMLInputElement>) => {
        if (emailError) {
            setEmailError(null);
        }
        if (event.target.value.includes(' ')) {
            event.target.value = event.target.value.trim();
        }
    };

    const syncCapsLock = (event: KeyboardEvent<HTMLInputElement>) => {
        setCapsLockActive(event.getModifierState('CapsLock'));
    };

    const handlePasswordBlur = () => {
        setCapsLockActive(false);
    };

    return (
        <AuthLayout
            title="Access the TIMS control tower"
            description="Authenticate with your fleet credentials to continue orchestrating dispatch, compliance, and performance workflows."
        >
            <Head title="Log in" />

            <Form
                {...store.form()}
                resetOnSuccess={['password']}
                noValidate
                onSubmit={handleSubmit}
                className="relative flex flex-col gap-6 overflow-hidden rounded-3xl border border-slate-200/80 bg-white/80 p-8 shadow-lg shadow-slate-200/40 backdrop-blur lg:gap-8 lg:p-10 dark:border-white/10 dark:bg-slate-900/70 dark:shadow-none"
            >
                {({ processing, errors }) => (
                    <>
                        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-sky-100/70 via-transparent to-emerald-100/60 dark:from-sky-400/5 dark:to-emerald-400/5" />
                        <div className="relative flex flex-col gap-6 lg:gap-8">
                            {formattedStatus && (
                                <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-700 dark:text-emerald-200">
                                    {formattedStatus}
                                </div>
                            )}
                            <div className="grid gap-6">
                                <div className="grid gap-2">
                                    <Label htmlFor="email" className="text-sm font-medium text-slate-900 dark:text-slate-100">
                                        Email address
                                    </Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        name="email"
                                        required
                                        autoFocus
                                        tabIndex={1}
                                        autoComplete="email"
                                        placeholder="email@example.com"
                                        aria-invalid={Boolean(emailError ?? errors.email)}
                                        onBlur={handleEmailBlur}
                                        onChange={handleEmailChange}
                                        className="bg-white/90 text-slate-900 placeholder:text-slate-400 focus-visible:ring-sky-500 dark:bg-slate-900/80 dark:text-slate-100 dark:placeholder:text-slate-500"
                                    />
                                    <InputError message={emailError ?? errors.email} />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="password" className="text-sm font-medium text-slate-900 dark:text-slate-100">
                                        Password
                                    </Label>
                                    <div className="flex flex-col gap-3">
                                        <div className="flex items-center gap-3">
                                            <div className="relative flex-1">
                                                <Input
                                                    id="password"
                                                    type={showPassword ? 'text' : 'password'}
                                                    name="password"
                                                    required
                                                    tabIndex={2}
                                                    autoComplete="current-password"
                                                    placeholder="Password"
                                                    className="bg-white/90 pr-10 text-slate-900 placeholder:text-slate-400 focus-visible:ring-sky-500 dark:bg-slate-900/80 dark:text-slate-100 dark:placeholder:text-slate-500"
                                                    onBlur={handlePasswordBlur}
                                                    onKeyDown={syncCapsLock}
                                                    onKeyUp={syncCapsLock}
                                                />
                                                <button
                                                    type="button"
                                                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                                                    onClick={() => setShowPassword(prev => !prev)}
                                                    className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-500 transition hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
                                                    tabIndex={2}
                                                >
                                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                                </button>
                                            </div>
                                        </div>
                                        {capsLockActive && (
                                            <div className="flex items-center gap-2 rounded-lg border border-amber-300/60 bg-amber-200/70 px-3 py-2 text-xs text-amber-800 dark:border-amber-300/30 dark:bg-amber-400/10 dark:text-amber-200">
                                                <AlertTriangle className="size-4" />
                                                Caps Lock is on. Passwords are case-sensitive.
                                            </div>
                                        )}
                                        <InputError message={errors.password} />
                                    </div>
                                </div>

                                <div className="flex flex-wrap items-center gap-3 rounded-xl bg-slate-100/80 px-3 py-2 text-sm text-slate-600 shadow-sm dark:bg-white/5 dark:text-slate-300">
                                    <div className="flex items-center gap-3">
                                        <Checkbox id="remember" name="remember" tabIndex={3} />
                                        <Label htmlFor="remember" className="text-sm font-medium text-slate-700 dark:text-slate-200">
                                            Remember me
                                        </Label>
                                    </div>
                                    {canResetPassword && (
                                        <TextLink
                                            href={request()}
                                            className="ml-auto inline-flex items-center gap-2 rounded-full bg-sky-500/10 px-3 py-1.5 font-semibold text-sky-600 transition hover:bg-sky-500/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 dark:bg-sky-400/10 dark:text-sky-200"
                                            tabIndex={5}
                                        >
                                            Forgot password?
                                            <ArrowUpRight className="h-3.5 w-3.5" />
                                        </TextLink>
                                    )}
                                </div>

                                <Button
                                    type="submit"
                                    className="mt-2 w-full rounded-xl bg-sky-500 text-white shadow-md shadow-sky-200/60 transition hover:bg-sky-500/90 focus-visible:ring-sky-500 dark:bg-sky-500 dark:shadow-none"
                                    tabIndex={4}
                                    disabled={processing}
                                    data-test="login-button"
                                >
                                    {processing && <Spinner />}
                                    Log in
                                </Button>
                            </div>

                            {canRegister && (
                                <div className="rounded-xl border border-slate-200/80 bg-white/80 p-4 text-center text-sm text-slate-600 dark:border-white/10 dark:bg-slate-900/80 dark:text-slate-300">
                                    Don't have an account?{' '}
                                    <TextLink href="#" tabIndex={5} className="font-medium text-sky-600 hover:text-sky-500 dark:text-sky-300">
                                        Contact administrator
                                    </TextLink>
                                </div>
                            )}

                            <div className="grid gap-4 rounded-2xl border border-slate-200/80 bg-white/80 p-6 text-sm text-slate-700 dark:border-white/10 dark:bg-slate-900/80 dark:text-slate-200">
                                <div className="flex items-start gap-3">
                                    <ShieldCheck className="mt-1 size-5 text-emerald-600 dark:text-emerald-300" />
                                    <div className="space-y-1">
                                        <p className="font-medium text-slate-900 dark:text-white">Security first</p>
                                        <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                                            All TIMS sessions are monitored and protected. If you suspect any suspicious activity, alert the control tower immediately.
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <Truck className="mt-1 size-5 text-sky-600 dark:text-sky-300" />
                                    <div className="space-y-1">
                                        <p className="font-medium text-slate-900 dark:text-white">Need assistance?</p>
                                        <ul className="space-y-1 text-xs text-slate-600 dark:text-slate-300">
                                            {SUPPORT_CHANNELS.map(channel => (
                                                <li key={channel.label} className="flex items-center justify-between gap-3">
                                                    <span className="uppercase tracking-[0.3em] text-slate-400 dark:text-slate-500">{channel.label}</span>
                                                    <a className="font-medium text-sky-600 transition hover:text-sky-500 dark:text-sky-300" href={channel.href}>
                                                        {channel.value}
                                                    </a>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </Form>
        </AuthLayout>
    );
}
