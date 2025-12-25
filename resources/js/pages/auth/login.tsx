import AppLogoIcon from '@/components/app-logo-icon';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { home } from '@/routes';
import { store } from '@/routes/login';
import { request } from '@/routes/password';
import { type SharedData } from '@/types';
import { Form, Head, Link, usePage } from '@inertiajs/react';
import { Eye, EyeOff, Lock, Shield } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { ChangeEvent, FocusEvent, FormEvent } from 'react';

interface LoginProps {
    status?: string;
    canResetPassword: boolean;
    canRegister: boolean;
}

export default function Login({ status, canResetPassword }: LoginProps) {
    const { name } = usePage<SharedData>().props;
    const [showPassword, setShowPassword] = useState(false);
    const [isVisible, setIsVisible] = useState(false);
    
    // Form field states
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [emailError, setEmailError] = useState<string | null>(null);
    const [passwordError, setPasswordError] = useState<string | null>(null);
    const [touched, setTouched] = useState({ email: false, password: false });

    useEffect(() => {
        setIsVisible(true);
    }, []);

    const validateEmail = (value: string): string | null => {
        const trimmedValue = value.trim();
        if (!trimmedValue.length) return 'Email address is required';
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailPattern.test(trimmedValue)) return 'Please enter a valid email address';
        return null;
    };

    const validatePassword = (value: string): string | null => {
        if (!value.length) return 'Password is required';
        return null;
    };

    // Check if form is valid
    const isFormValid = () => {
        return (
            email.trim().length > 0 &&
            password.length > 0 &&
            validateEmail(email) === null &&
            validatePassword(password) === null
        );
    };

    const handleEmailChange = (event: ChangeEvent<HTMLInputElement>) => {
        const value = event.target.value;
        setEmail(value);
        
        // Validate on change if field was touched
        if (touched.email) {
            const error = validateEmail(value);
            setEmailError(error);
        }
    };

    const handleEmailBlur = (event: FocusEvent<HTMLInputElement>) => {
        setTouched(prev => ({ ...prev, email: true }));
        const error = validateEmail(event.target.value);
        setEmailError(error);
    };

    const handlePasswordChange = (event: ChangeEvent<HTMLInputElement>) => {
        const value = event.target.value;
        setPassword(value);
        
        // Validate on change if field was touched
        if (touched.password) {
            const error = validatePassword(value);
            setPasswordError(error);
        }
    };

    const handlePasswordBlur = (event: FocusEvent<HTMLInputElement>) => {
        setTouched(prev => ({ ...prev, password: true }));
        const error = validatePassword(event.target.value);
        setPasswordError(error);
    };

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        // Mark all fields as touched
        setTouched({ email: true, password: true });
        
        // Validate all fields
        const emailValidation = validateEmail(email);
        const passwordValidation = validatePassword(password);
        
        setEmailError(emailValidation);
        setPasswordError(passwordValidation);
        
        // Prevent submission if invalid
        if (emailValidation || passwordValidation) {
            event.preventDefault();
            event.stopPropagation();
            
            // Focus first invalid field
            const form = event.currentTarget;
            if (emailValidation) {
                form.querySelector<HTMLInputElement>('input[name="email"]')?.focus();
            } else if (passwordValidation) {
                form.querySelector<HTMLInputElement>('input[name="password"]')?.focus();
            }
            return;
        }
    };

    return (
        <div className="relative h-screen w-full overflow-hidden bg-slate-950">
            <Head title="Log in" />
            
            {/* Background */}
            <div className="absolute inset-0">
                <img
                    src="/black.png"
                    alt="TIMS Login"
                    className="h-full w-full object-cover opacity-30"
                />
                <div className="absolute inset-0 bg-gradient-to-br from-slate-950/98 via-slate-900/95 to-blue-950/98" />
            </div>

            {/* Animated Grid */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b15_1px,transparent_1px),linear-gradient(to_bottom,#1e293b15_1px,transparent_1px)] bg-[size:4rem_4rem]" />

            {/* Gradient Orbs */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-sky-500/20 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl" />

            {/* Content - Perfectly Centered */}
            <div className={`relative z-10 flex h-full items-center justify-center px-6 transition-all duration-1000 ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
                <div className="w-full max-w-md">
                    {/* Logo */}
                    <Link href={home()} className="flex justify-center mb-8 group">
                        <AppLogoIcon className="h-12 fill-current text-sky-400 transition-transform group-hover:scale-110 duration-300" />
                    </Link>

                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-sky-500/10 border border-sky-500/20 backdrop-blur-sm mb-4">
                            <Shield className="h-4 w-4 text-sky-400" />
                            <span className="text-xs font-semibold text-sky-300 uppercase tracking-wider">
                                Secure Access
                            </span>
                        </div>
                        <h1 className="text-3xl font-bold text-white mb-2">
                            Welcome Back
                        </h1>
                        <p className="text-slate-400">
                            Access the {name || 'TIMS'} control tower
                        </p>
                    </div>

                    {/* Login Form */}
                    <Form
                        {...store.form()}
                        resetOnSuccess={['password']}
                        noValidate
                        onSubmit={handleSubmit}
                        className="relative rounded-2xl border border-slate-700/50 bg-slate-900/80 backdrop-blur-xl p-8 shadow-2xl"
                    >
                        {({ processing, errors }) => (
                            <div className="space-y-6">
                                {status && (
                                    <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-300">
                                        {status}
                                    </div>
                                )}

                                {/* Email Field */}
                                <div className="space-y-2">
                                    <Label htmlFor="email" className="text-sm font-medium text-slate-200">
                                        Email Address <span className="text-red-400">*</span>
                                    </Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        name="email"
                                        value={email}
                                        required
                                        autoFocus
                                        autoComplete="email"
                                        placeholder="email@example.com"
                                        onBlur={handleEmailBlur}
                                        onChange={handleEmailChange}
                                        className={`h-12 bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-sky-500 focus:ring-sky-500/20 rounded-xl ${
                                            emailError ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''
                                        }`}
                                        aria-invalid={!!emailError}
                                        aria-describedby={emailError ? 'email-error' : undefined}
                                    />
                                    {emailError && (
                                        <p id="email-error" className="text-sm text-red-400 flex items-center gap-1">
                                            <span className="text-lg">⚠</span> {emailError}
                                        </p>
                                    )}
                                    <InputError message={errors.email} />
                                </div>

                                {/* Password Field */}
                                <div className="space-y-2">
                                    <Label htmlFor="password" className="text-sm font-medium text-slate-200">
                                        Password <span className="text-red-400">*</span>
                                    </Label>
                                    <div className="relative">
                                        <Input
                                            id="password"
                                            type={showPassword ? 'text' : 'password'}
                                            name="password"
                                            value={password}
                                            required
                                            autoComplete="current-password"
                                            placeholder="Enter your password"
                                            onBlur={handlePasswordBlur}
                                            onChange={handlePasswordChange}
                                            className={`h-12 pr-12 bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-sky-500 focus:ring-sky-500/20 rounded-xl ${
                                                passwordError ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''
                                            }`}
                                            aria-invalid={!!passwordError}
                                            aria-describedby={passwordError ? 'password-error' : undefined}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                                            tabIndex={-1}
                                        >
                                            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                        </button>
                                    </div>
                                    {passwordError && (
                                        <p id="password-error" className="text-sm text-red-400 flex items-center gap-1">
                                            <span className="text-lg">⚠</span> {passwordError}
                                        </p>
                                    )}
                                    <InputError message={errors.password} />
                                </div>

                                {/* Remember Me & Forgot Password */}
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Checkbox id="remember" name="remember" className="border-slate-600 data-[state=checked]:bg-sky-600" />
                                        <Label htmlFor="remember" className="text-sm text-slate-300 cursor-pointer">
                                            Remember me
                                        </Label>
                                    </div>
                                    {canResetPassword && (
                                        <Link
                                            href={request()}
                                            className="text-sm font-medium text-sky-400 hover:text-sky-300 transition-colors"
                                        >
                                            Forgot password?
                                        </Link>
                                    )}
                                </div>

                                {/* Submit Button */}
                                <Button
                                    type="submit"
                                    disabled={processing || !isFormValid()}
                                    className="w-full h-12 bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white font-semibold rounded-xl shadow-lg shadow-sky-500/30 transition-all duration-300 hover:scale-105 hover:shadow-sky-500/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                                >
                                    {processing ? (
                                        <Spinner className="mr-2" />
                                    ) : (
                                        <Lock className="h-4 w-4 mr-2" />
                                    )}
                                    {processing ? 'Authenticating...' : 'Sign In'}
                                </Button>
                                
                                {/* Validation Helper Text */}
                                {(!isFormValid() && (touched.email || touched.password)) && (
                                    <p className="text-xs text-center text-slate-400">
                                        Please fill in all required fields with valid information
                                    </p>
                                )}
                            </div>
                        )}
                    </Form>

                    {/* Footer */}
                    <p className="text-center text-sm text-slate-500 mt-6">
                        Protected by {name || 'TIMS'} • Enterprise Security
                    </p>
                </div>
            </div>
        </div>
    );
}
