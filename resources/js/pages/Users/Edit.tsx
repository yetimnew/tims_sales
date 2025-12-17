import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useForm } from '@inertiajs/react';
import { AlertCircle, ArrowLeft, Eye, EyeOff, Lock, Mail, Shield, User } from 'lucide-react';

import { FormActionsBar } from '@/components/forms/form-actions-bar';
import { FormField } from '@/components/forms/form-field';
import { FormPageLayout } from '@/components/forms/form-page-layout';
import { FormSection } from '@/components/forms/form-section';
import { ScrollToTopFab } from '@/components/forms/scroll-to-top-fab';
import { UnsavedChangesBadge } from '@/components/forms/unsaved-changes-badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { evaluatePasswordStrength } from '@/lib/password-strength';
import { validateUser, type ValidationErrors } from '@/lib/validation';
import { type BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Users', href: '/users' },
    { title: 'Edit', href: '#' },
];

interface Role {
    id: number;
    name: string;
}

interface UserResource {
    id: number;
    name: string;
    email: string;
    roles?: Role[];
    email_verified_at?: string | null;
    created_at?: string;
    updated_at?: string;
}

interface UserFormData {
    name: string;
    email: string;
    password?: string;
    password_confirmation?: string;
    role: string;
}

interface UserEditProps {
    user: UserResource;
    roles: Role[];
}

const formatDate = (value?: string | null): string => {
    if (!value) {
        return 'Not available';
    }

    return new Date(value).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
};

export default function UsersEdit({ user, roles }: UserEditProps) {
    const { toast } = useToast();
    const [frontendErrors, setFrontendErrors] = useState<Record<string, string>>({});
    const formRef = useRef<HTMLFormElement | null>(null);
    const [showScrollTop, setShowScrollTop] = useState(false);
    const [isDirty, setIsDirty] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showPasswordConfirmation, setShowPasswordConfirmation] = useState(false);

    const { data, setData, put, processing, errors } = useForm<UserFormData>({
        name: user.name,
        email: user.email,
        password: '',
        password_confirmation: '',
        role: user.roles?.[0]?.name ?? '',
    });

    const passwordStrength = useMemo(() => evaluatePasswordStrength(data.password ?? ''), [data.password]);

    useEffect(() => {
        const container = formRef.current;
        if (!container) {
            return;
        }

        const handleScroll = () => {
            setShowScrollTop(container.scrollTop > 240);
        };

        handleScroll();
        container.addEventListener('scroll', handleScroll);

        return () => container.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        if (Object.keys(errors).length > 0) {
            toast({ title: 'Validation Error', description: 'Please fix the highlighted fields.', variant: 'destructive' });
        }
    }, [errors, toast]);

    const validateField = (field: keyof ValidationErrors, value: string) => {
        const validationData = { ...data, [field]: value };
        const fieldErrors = validateUser(validationData, true);
        const error = fieldErrors[field] || '';

        setFrontendErrors((previous) => {
            const next = { ...previous };
            if (error) {
                next[field] = error;
            } else {
                delete next[field];
            }
            return next;
        });
    };

    const handleFieldChange = (field: keyof UserFormData, value: string) => {
        setData(field, value);
        setIsDirty(true);
        validateField(field as keyof ValidationErrors, value);
    };

    const handleSubmit = (event: React.FormEvent) => {
        event.preventDefault();

        const validationErrors = validateUser(data, true);
        if (Object.keys(validationErrors).length > 0) {
            setFrontendErrors(validationErrors);
            toast({ title: 'Validation Error', description: 'Please resolve the form errors before saving.', variant: 'destructive' });
            return;
        }

        const payload: Pick<UserFormData, 'name' | 'email' | 'role'> & Partial<Pick<UserFormData, 'password' | 'password_confirmation'>> = {
            name: data.name,
            email: data.email,
            role: data.role,
        };

        if (data.password && data.password.trim() !== '') {
            payload.password = data.password;
            payload.password_confirmation = data.password_confirmation ?? '';
        }

        put(`/users/${user.id}`, payload, {
            onSuccess: () => {
                setIsDirty(false);
                toast({ title: 'User updated', description: 'Changes were saved successfully.', variant: 'success' });
            },
        });
    };

    const handleScrollToTop = () => {
        formRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const hasErrors = Object.keys(frontendErrors).length > 0 || Object.keys(errors).length > 0;
    const summaryRole = data.role || user.roles?.[0]?.name || 'Unassigned';
    const isVerified = Boolean(user.email_verified_at);

    return (
        <FormPageLayout
            title="Edit User"
            description="Refresh profile details, adjust access, and keep credentials secure."
            headTitle={`Edit ${user.name}`}
            breadcrumbs={breadcrumbs}
            icon={<User className="h-5 w-5" />}
            headerAside={
                <>
                    <Button variant="ghost" size="sm" asChild>
                        <Link href={`/users/${user.id}`}>
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to profile
                        </Link>
                    </Button>
                    {isDirty && <UnsavedChangesBadge />}
                </>
            }
        >
            <form
                ref={formRef}
                onSubmit={handleSubmit}
                className="flex flex-1 flex-col gap-6 overflow-y-auto p-4 lg:p-6 pb-32"
                style={{ minHeight: 0 }}
            >
                {hasErrors && (
                    <Alert variant="destructive" className="mb-2">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription className="text-sm">Please resolve the highlighted issues before saving.</AlertDescription>
                    </Alert>
                )}

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
                    <div className="space-y-4">
                        <FormSection
                            title="Profile & Contact"
                            description="Keep the name and email aligned with your directory."
                            icon={
                                <span className="rounded-lg bg-blue-100 p-2 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300">
                                    <User className="h-4 w-4" />
                                </span>
                            }
                            contentClassName="gap-6 md:grid-cols-2"
                        >
                            <FormField
                                id="name"
                                label="Full name"
                                required
                                error={frontendErrors.name || errors.name}
                            >
                                <div className="relative">
                                    <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                    <Input
                                        id="name"
                                        value={data.name}
                                        onChange={(event) => handleFieldChange('name', event.target.value)}
                                        placeholder="e.g. Jane Smith"
                                        className={frontendErrors.name || errors.name ? 'pl-10 focus:border-red-500 focus-visible:ring-red-500/20' : 'pl-10'}
                                    />
                                </div>
                            </FormField>
                            <FormField
                                id="email"
                                label="Email address"
                                required
                                error={frontendErrors.email || errors.email}
                            >
                                <div className="relative">
                                    <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                    <Input
                                        id="email"
                                        type="email"
                                        value={data.email}
                                        onChange={(event) => handleFieldChange('email', event.target.value)}
                                        placeholder="person@company.com"
                                        className={frontendErrors.email || errors.email ? 'pl-10 focus:border-red-500 focus-visible:ring-red-500/20' : 'pl-10'}
                                    />
                                </div>
                            </FormField>
                        </FormSection>

                        <FormSection
                            title="Access & Security"
                            description="Adjust the user's role or rotate their credentials when needed."
                            icon={
                                <span className="rounded-lg bg-purple-100 p-2 text-purple-600 dark:bg-purple-900/30 dark:text-purple-300">
                                    <Shield className="h-4 w-4" />
                                </span>
                            }
                            contentClassName="grid-cols-1 gap-6"
                        >
                            <FormField
                                id="role"
                                label="Primary role"
                                required
                                helperText="Roles define which areas of the platform this teammate can access."
                                error={frontendErrors.role || errors.role}
                            >
                                <Select value={data.role} onValueChange={(value) => handleFieldChange('role', value)}>
                                    <SelectTrigger className={frontendErrors.role || errors.role ? 'focus:border-red-500 focus-visible:ring-red-500/20' : ''}>
                                        <SelectValue placeholder="Select a role" />
                                    </SelectTrigger>
                                    <SelectContent className="z-50 max-h-64">
                                        {roles.map((role) => (
                                            <SelectItem key={role.id} value={role.name} className="capitalize">
                                                {role.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </FormField>

                            <div className="grid gap-6 md:grid-cols-2">
                                <FormField
                                    id="password"
                                    label="New password"
                                    helperText="Leave blank to keep the current password."
                                    error={frontendErrors.password || errors.password}
                                >
                                    <div className="relative">
                                        <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                        <Input
                                            id="password"
                                            type={showPassword ? 'text' : 'password'}
                                            value={data.password}
                                            onChange={(event) => handleFieldChange('password', event.target.value)}
                                            placeholder="Generate a stronger secret"
                                            className={frontendErrors.password || errors.password ? 'pl-10 pr-12 focus:border-red-500 focus-visible:ring-red-500/20' : 'pl-10 pr-12'}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword((previous) => !previous)}
                                            className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-500 transition hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                                            aria-label={showPassword ? 'Hide password' : 'Show password'}
                                        >
                                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </button>
                                    </div>
                                    {data.password && (
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
                                                <span>Password strength</span>
                                                <span className={passwordStrength.textClass}>{passwordStrength.label}</span>
                                            </div>
                                            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200/80 dark:bg-slate-800">
                                                <div
                                                    className={`h-full rounded-full transition-all duration-300 ${passwordStrength.barClass}`}
                                                    style={{ width: `${passwordStrength.progress}%` }}
                                                />
                                            </div>
                                            <p className="text-xs text-muted-foreground">{passwordStrength.hint}</p>
                                        </div>
                                    )}
                                </FormField>

                                <FormField
                                    id="password_confirmation"
                                    label="Confirm password"
                                    error={frontendErrors.password_confirmation || errors.password_confirmation}
                                >
                                    <div className="relative">
                                        <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                        <Input
                                            id="password_confirmation"
                                            type={showPasswordConfirmation ? 'text' : 'password'}
                                            value={data.password_confirmation}
                                            onChange={(event) => handleFieldChange('password_confirmation', event.target.value)}
                                            placeholder="Repeat the new password"
                                            className={frontendErrors.password_confirmation || errors.password_confirmation ? 'pl-10 pr-12 focus:border-red-500 focus-visible:ring-red-500/20' : 'pl-10 pr-12'}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPasswordConfirmation((previous) => !previous)}
                                            className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-500 transition hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                                            aria-label={showPasswordConfirmation ? 'Hide password confirmation' : 'Show password confirmation'}
                                        >
                                            {showPasswordConfirmation ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </button>
                                    </div>
                                </FormField>
                            </div>
                        </FormSection>
                    </div>

                    <aside className="space-y-4 lg:sticky lg:top-24">
                        <div className="rounded-lg border border-slate-200/60 bg-white/90 p-4 shadow-sm dark:border-slate-700/60 dark:bg-slate-900/50">
                            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Account snapshot</h3>
                            <p className="mt-0.5 text-xs text-muted-foreground">Quickly confirm the essentials before saving.</p>
                            <dl className="mt-5 space-y-4 text-sm">
                                <div className="flex items-center justify-between">
                                    <dt className="flex items-center gap-2 text-muted-foreground">
                                        <User className="h-4 w-4" />
                                        User ID
                                    </dt>
                                    <dd className="font-medium text-slate-900 dark:text-slate-100">#{user.id}</dd>
                                </div>
                                <div className="flex items-center justify-between">
                                    <dt className="flex items-center gap-2 text-muted-foreground">
                                        <Mail className="h-4 w-4" />
                                        Email
                                    </dt>
                                    <dd className="font-medium text-slate-900 dark:text-slate-100" title={data.email}>
                                        {data.email}
                                    </dd>
                                </div>
                                <div className="flex items-center justify-between">
                                    <dt className="flex items-center gap-2 text-muted-foreground">
                                        <Shield className="h-4 w-4" />
                                        Assigned role
                                    </dt>
                                    <dd className="font-medium capitalize text-slate-900 dark:text-slate-100">{summaryRole || 'Unassigned'}</dd>
                                </div>
                                <div className="flex items-center justify-between">
                                    <dt className="flex items-center gap-2 text-muted-foreground">
                                        <Lock className="h-4 w-4" />
                                        Verification
                                    </dt>
                                    <dd>
                                        <Badge variant={isVerified ? 'default' : 'secondary'}>
                                            {isVerified ? 'Verified' : 'Pending'}
                                        </Badge>
                                    </dd>
                                </div>
                                <div className="flex items-center justify-between">
                                    <dt className="flex items-center gap-2 text-muted-foreground">
                                        <AlertCircle className="h-4 w-4" />
                                        Member since
                                    </dt>
                                    <dd className="font-medium text-slate-900 dark:text-slate-100">{formatDate(user.created_at)}</dd>
                                </div>
                            </dl>
                        </div>

                        <div className="rounded-lg border border-dashed border-slate-200/60 bg-slate-50/70 p-3 text-xs text-muted-foreground dark:border-slate-700/60 dark:bg-slate-900/40">
                            <p className="font-medium text-slate-700 dark:text-slate-200">Tip</p>
                            <p className="mt-1 leading-relaxed">
                                If you rotate credentials, let the teammate know so they can sign in with the updated password immediately.
                            </p>
                        </div>
                    </aside>
                </div>

                <FormActionsBar
                    left={
                        <>
                            <span className="text-red-500">*</span>
                            <span>Required fields</span>
                        </>
                    }
                    right={
                        <>
                            <Button type="button" variant="outline" asChild>
                                <Link href={`/users/${user.id}`}>Cancel</Link>
                            </Button>
                            <Button type="submit" disabled={processing}>
                                {processing ? 'Saving…' : 'Save changes'}
                            </Button>
                        </>
                    }
                />
            </form>
            <ScrollToTopFab visible={showScrollTop} onClick={handleScrollToTop} />
        </FormPageLayout>
    );
}

