import { useCallback, useEffect, useMemo, useRef, useState, type FormEventHandler } from 'react';
import { Head, Link, router, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { DeleteConfirmationDialog } from '@/components/delete-confirmation-dialog';
import { validateOutsource, type ValidationErrors } from '@/lib/validation';
import {
    AlertCircle,
    ArrowLeft,
    ArrowUp,
    Building2,
    CheckCircle,
    MapPin,
    Phone,
    Save,
    Trash2,
    UserCircle2,
} from 'lucide-react';
import { usePermissions } from '@/hooks/use-permissions';

type Option = {
    label: string;
    value: string;
};

interface OutsourceResource {
    id: number;
    name: string;
    contact_person: string | null;
    phone: string | null;
    email: string | null;
    address: string | null;
    service_type: string | null;
    status: string | null;
}

interface OutsourcesEditProps {
    outsource: OutsourceResource;
    statusOptions?: Option[];
    serviceTypeOptions?: Option[];
}

type OutsourceFormData = {
    name: string;
    contact_person: string;
    phone: string;
    email: string;
    address: string;
    service_type: string;
    status: string;
};

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function OutsourcesEdit({ outsource, statusOptions, serviceTypeOptions }: OutsourcesEditProps) {
    const { hasPermission } = usePermissions();
    const breadcrumbs = useMemo<BreadcrumbItem[]>(
        () => [
            { title: 'Outsourcing', href: '/outsources' },
            { title: outsource.name || `Vendor ${outsource.id}`, href: `/outsources/${outsource.id}` },
            { title: 'Edit', href: `/outsources/${outsource.id}/edit` },
        ],
        [outsource.id, outsource.name],
    );

    const resolvedStatusOptions = useMemo<Option[]>(
        () =>
            statusOptions?.length
                ? statusOptions
                : [
                      { label: 'Active', value: 'active' },
                      { label: 'Inactive', value: 'inactive' },
                  ],
        [statusOptions]
    );

    const resolvedServiceTypes = useMemo<Option[]>(
        () => (serviceTypeOptions?.length ? serviceTypeOptions : []),
        [serviceTypeOptions]
    );

    const initialStatus = outsource.status ?? resolvedStatusOptions[0]?.value ?? 'active';

    const {
        data,
        setData,
        put,
        processing,
        errors,
        transform,
        reset,
        recentlySuccessful,
    } = useForm<OutsourceFormData>({
        name: outsource.name ?? '',
        contact_person: outsource.contact_person ?? '',
        phone: outsource.phone ?? '',
        email: outsource.email ?? '',
        address: outsource.address ?? '',
        service_type: outsource.service_type ?? '',
        status: initialStatus,
    });

    const [frontendErrors, setFrontendErrors] = useState<ValidationErrors>({});
    const [isDirty, setIsDirty] = useState(false);
    const [showScrollTop, setShowScrollTop] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const scrollContainerRef = useRef<HTMLFormElement | null>(null);

    useEffect(() => {
        const container = scrollContainerRef.current;
        if (!container) {
            return;
        }

        const handleScroll = () => {
            setShowScrollTop(container.scrollTop > 240);
        };

        handleScroll();
        container.addEventListener('scroll', handleScroll);

        return () => {
            container.removeEventListener('scroll', handleScroll);
        };
    }, []);

    const setFieldError = useCallback((field: keyof OutsourceFormData | 'email' | 'status', message: string) => {
        setFrontendErrors(previous => {
            const next = { ...previous };
            if (message) {
                next[field] = message;
            } else {
                delete next[field];
            }

            return next;
        });
    }, []);

    const validateField = useCallback(
        (field: keyof OutsourceFormData, value: string) => {
            const nextValues: OutsourceFormData = { ...data, [field]: value } as OutsourceFormData;
            const fieldErrors = validateOutsource(nextValues);

            if (field === 'email' && value && !emailRegex.test(value)) {
                fieldErrors.email = 'Please enter a valid email address.';
            }

            if (field === 'status' && !value) {
                fieldErrors.status = 'Status is required.';
            }

            if (field === 'service_type' && value.length > 255) {
                fieldErrors.service_type = 'Service type cannot exceed 255 characters.';
            }

            if (field === 'address' && value.length > 500) {
                fieldErrors.address = 'Address cannot exceed 500 characters.';
            }

            setFieldError(field, fieldErrors[field] ?? '');
        },
        [data, setFieldError]
    );

    const handleFieldChange = useCallback(
        (field: keyof OutsourceFormData, value: string) => {
            setData(field, value);
            validateField(field, value);
            setIsDirty(true);
        },
        [setData, validateField]
    );

    const submit: FormEventHandler = event => {
        event.preventDefault();

        const trimmedData: OutsourceFormData = {
            ...data,
            name: data.name.trim(),
            contact_person: data.contact_person.trim(),
            phone: data.phone.trim(),
            email: data.email.trim(),
            address: data.address.trim(),
            service_type: data.service_type.trim(),
            status: data.status.trim(),
        };

        const validationResults: ValidationErrors = validateOutsource(trimmedData);

        if (trimmedData.email && !emailRegex.test(trimmedData.email)) {
            validationResults.email = 'Please enter a valid email address.';
        }

        if (!trimmedData.status) {
            validationResults.status = 'Status is required.';
        }

        if (trimmedData.service_type && trimmedData.service_type.length > 255) {
            validationResults.service_type = 'Service type cannot exceed 255 characters.';
        }

        if (trimmedData.address && trimmedData.address.length > 500) {
            validationResults.address = 'Address cannot exceed 500 characters.';
        }

        if (Object.keys(validationResults).length > 0) {
            setFrontendErrors(validationResults);
            return;
        }

        transform(() => trimmedData);

        put(`/outsources/${outsource.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                setFrontendErrors({});
                setIsDirty(false);
            },
            onError: () => {
                transform(data => data);
            },
            onFinish: () => {
                transform(data => data);
            },
        });
    };

    const getFieldError = useCallback(
        (field: keyof OutsourceFormData | 'email' | 'status') => {
            return errors[field] || frontendErrors[field] || '';
        },
        [errors, frontendErrors]
    );

    const handleScrollToTop = () => {
        scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const generalErrorValue = (errors as Record<string, string | string[] | undefined>).error;
    const generalError = Array.isArray(generalErrorValue)
        ? generalErrorValue.join('\n')
        : generalErrorValue ?? '';

    const handleDeleteConfirm = () => {
        setIsDeleting(true);
        router.delete(`/outsources/${outsource.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                setDeleteDialogOpen(false);
            },
            onFinish: () => {
                setIsDeleting(false);
            },
        });
    };

    const resetForm = () => {
        reset();
        setFrontendErrors({});
        setIsDirty(false);
    };

    const canDelete = hasPermission('outsources.destroy');
    const canUpdate = hasPermission('outsources.update');

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit ${outsource.name}`} />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-hidden rounded-xl p-4">
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200/70 bg-white/95 px-6 py-4 shadow-lg backdrop-blur-lg dark:border-slate-800/60 dark:bg-slate-900/70">
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                            <Button variant="ghost" size="sm" asChild>
                                <Link href={`/outsources/${outsource.id}`}>
                                    <ArrowLeft className="mr-2 h-4 w-4" />
                                    Back to Vendor
                                </Link>
                            </Button>
                            <span className="hidden text-slate-400 lg:inline">/</span>
                            <span className="text-slate-600 dark:text-slate-400">Editing vendor profile</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <Building2 className="h-6 w-6 text-emerald-500" />
                            <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Edit {outsource.name}</h1>
                        </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        {canDelete && (
                            <Button
                                type="button"
                                variant="destructive"
                                onClick={() => setDeleteDialogOpen(true)}
                                className="flex items-center gap-2"
                            >
                                <Trash2 className="h-4 w-4" />
                                Delete
                            </Button>
                        )}
                        <Button
                            type="button"
                            variant="outline"
                            onClick={resetForm}
                            className="flex items-center gap-2"
                        >
                            <Save className="h-4 w-4" />
                            Reset
                        </Button>
                    </div>
                </div>

                <Card className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-slate-200/70 bg-white/95 text-card-foreground shadow-xl backdrop-blur-lg dark:border-slate-800/60 dark:bg-slate-900/70">
                    <CardHeader className="px-6 pb-0">
                        <div className="flex flex-col gap-2">
                            <CardTitle className="text-xl font-semibold text-slate-900 dark:text-slate-100">Vendor Details</CardTitle>
                            <CardDescription className="text-sm text-slate-600 dark:text-slate-400">
                                Update onboarding, contact, and service information for this outsource partner.
                            </CardDescription>
                        </div>
                    </CardHeader>

                    <CardContent className="flex flex-1 flex-col overflow-hidden p-0">
                        <form
                            ref={scrollContainerRef}
                            onSubmit={submit}
                            className="flex flex-1 flex-col gap-8 overflow-y-auto p-6 pb-24"
                            style={{ minHeight: 0 }}
                            noValidate
                        >
                            {generalError && (
                                <Alert variant="destructive">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertDescription>{generalError}</AlertDescription>
                                </Alert>
                            )}

                            <section className="space-y-4 rounded-xl border border-slate-200/60 bg-white/75 p-5 shadow-sm dark:border-slate-800/70 dark:bg-slate-900/35">
                                <div className="flex items-center gap-2.5 text-sm">
                                    <div className="rounded-md bg-emerald-100 p-1.5 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
                                        <UserCircle2 className="h-4 w-4" />
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">Vendor Identity</h2>
                                        <p className="text-xs text-muted-foreground">Keep these attributes current so dispatch analytics remain accurate.</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="name">
                                            Vendor Name <span className="text-red-500">*</span>
                                        </Label>
                                        <Input
                                            id="name"
                                            type="text"
                                            value={data.name}
                                            onChange={event => handleFieldChange('name', event.target.value)}
                                            placeholder="e.g., Horizon Freight PLC"
                                            className={getFieldError('name') ? 'border-red-500 focus-visible:ring-red-500/20' : ''}
                                        />
                                        {getFieldError('name') && (
                                            <p className="flex items-center gap-1 text-sm text-red-500">
                                                <AlertCircle className="h-3 w-3" />
                                                {getFieldError('name')}
                                            </p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="status">
                                            Status <span className="text-red-500">*</span>
                                        </Label>
                                        <Select value={data.status} onValueChange={value => handleFieldChange('status', value)}>
                                            <SelectTrigger className={getFieldError('status') ? 'border-red-500 focus-visible:ring-red-500/20' : ''}>
                                                <SelectValue placeholder="Select status" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {resolvedStatusOptions.map(option => (
                                                    <SelectItem key={option.value} value={option.value}>
                                                        {option.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {getFieldError('status') && (
                                            <p className="flex items-center gap-1 text-sm text-red-500">
                                                <AlertCircle className="h-3 w-3" />
                                                {getFieldError('status')}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="service_type">Service Type</Label>
                                    <Input
                                        id="service_type"
                                        type="text"
                                        value={data.service_type}
                                        onChange={event => handleFieldChange('service_type', event.target.value)}
                                        placeholder="e.g., Long-haul transport"
                                        className={getFieldError('service_type') ? 'border-red-500 focus-visible:ring-red-500/20' : ''}
                                    />
                                    {resolvedServiceTypes.length > 0 && (
                                        <div className="flex flex-wrap gap-2 pt-1">
                                            {resolvedServiceTypes.map(option => (
                                                <Badge
                                                    key={option.value}
                                                    variant={option.value === data.service_type ? 'default' : 'outline'}
                                                    className="cursor-pointer"
                                                    onClick={() => handleFieldChange('service_type', option.value)}
                                                >
                                                    {option.label}
                                                </Badge>
                                            ))}
                                        </div>
                                    )}
                                    {getFieldError('service_type') && (
                                        <p className="flex items-center gap-1 text-sm text-red-500">
                                            <AlertCircle className="h-3 w-3" />
                                            {getFieldError('service_type')}
                                        </p>
                                    )}
                                </div>
                            </section>

                            <section className="space-y-4 rounded-xl border border-slate-200/60 bg-white/75 p-5 shadow-sm dark:border-slate-800/70 dark:bg-slate-900/35">
                                <div className="flex items-center gap-2.5 text-sm">
                                    <div className="rounded-md bg-emerald-100 p-1.5 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
                                        <Phone className="h-4 w-4" />
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">Contact Details</h2>
                                        <p className="text-xs text-muted-foreground">Provide up-to-date contacts for coordination and escalation.</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="contact_person">
                                            Primary Contact <span className="text-red-500">*</span>
                                        </Label>
                                        <Input
                                            id="contact_person"
                                            type="text"
                                            value={data.contact_person}
                                            onChange={event => handleFieldChange('contact_person', event.target.value)}
                                            placeholder="e.g., Meron Bekele"
                                            className={getFieldError('contact_person') ? 'border-red-500 focus-visible:ring-red-500/20' : ''}
                                        />
                                        {getFieldError('contact_person') && (
                                            <p className="flex items-center gap-1 text-sm text-red-500">
                                                <AlertCircle className="h-3 w-3" />
                                                {getFieldError('contact_person')}
                                            </p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="phone">Phone Number</Label>
                                        <Input
                                            id="phone"
                                            type="tel"
                                            value={data.phone}
                                            onChange={event => handleFieldChange('phone', event.target.value)}
                                            placeholder="e.g., +251 911 123 456"
                                            className={getFieldError('phone') ? 'border-red-500 focus-visible:ring-red-500/20' : ''}
                                        />
                                        {getFieldError('phone') && (
                                            <p className="flex items-center gap-1 text-sm text-red-500">
                                                <AlertCircle className="h-3 w-3" />
                                                {getFieldError('phone')}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="email">Email</Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            value={data.email}
                                            onChange={event => handleFieldChange('email', event.target.value)}
                                            placeholder="e.g., ops@horizonfreight.com"
                                            className={getFieldError('email') ? 'border-red-500 focus-visible:ring-red-500/20' : ''}
                                        />
                                        {getFieldError('email') && (
                                            <p className="flex items-center gap-1 text-sm text-red-500">
                                                <AlertCircle className="h-3 w-3" />
                                                {getFieldError('email')}
                                            </p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="address">Head Office / Dispatch Address</Label>
                                        <Textarea
                                            id="address"
                                            value={data.address}
                                            onChange={event => handleFieldChange('address', event.target.value)}
                                            placeholder="Include key directions or branch details for field teams"
                                            className={`min-h-[96px] ${getFieldError('address') ? 'border-red-500 focus-visible:ring-red-500/20' : ''}`}
                                        />
                                        {getFieldError('address') && (
                                            <p className="flex items-center gap-1 text-sm text-red-500">
                                                <AlertCircle className="h-3 w-3" />
                                                {getFieldError('address')}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </section>

                            <section className="space-y-4 rounded-xl border border-slate-200/60 bg-white/75 p-5 shadow-sm dark:border-slate-800/70 dark:bg-slate-900/35">
                                <div className="flex items-center gap-2.5 text-sm">
                                    <div className="rounded-md bg-emerald-100 p-1.5 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
                                        <MapPin className="h-4 w-4" />
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">Quick Hints</h2>
                                        <p className="text-xs text-muted-foreground">Tap a chip above to reuse a common service category. Leave blank if the vendor is multi-service.</p>
                                    </div>
                                </div>

                                {resolvedServiceTypes.length === 0 ? (
                                    <p className="text-sm text-muted-foreground">
                                        Service categories will appear here automatically once at least one vendor shares them.
                                    </p>
                                ) : (
                                    <p className="text-sm text-muted-foreground">
                                        Matching service labels help align performance analytics and comparison dashboards.
                                    </p>
                                )}
                            </section>

                            <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200/70 bg-white/80 px-6 py-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/40">
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                                        <span className="text-red-500">*</span>
                                        <span>Required fields must be completed</span>
                                    </div>
                                    {isDirty && (
                                        <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400">
                                            <Save className="h-3 w-3" />
                                            <span>You have unsaved changes</span>
                                        </div>
                                    )}
                                    {recentlySuccessful && (
                                        <div className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400">
                                            <CheckCircle className="h-3 w-3" />
                                            <span>Vendor updated</span>
                                        </div>
                                    )}
                                </div>
                                <div className="flex gap-3">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        asChild
                                        className="border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700"
                                    >
                                        <Link href={`/outsources/${outsource.id}`}>Cancel</Link>
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={
                                            !canUpdate
                                            || processing
                                            || Object.keys(frontendErrors).length > 0
                                            || Boolean(Object.keys(errors).length > 0)
                                        }
                                        className="min-w-[160px] bg-gradient-to-r from-emerald-600 to-emerald-700 px-6 text-white shadow-lg transition-all duration-200 hover:from-emerald-700 hover:to-emerald-800 hover:shadow-xl disabled:cursor-not-allowed"
                                    >
                                        {processing ? (
                                            <>
                                                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-white" />
                                                Saving...
                                            </>
                                        ) : (
                                            <>
                                                <CheckCircle className="mr-2 h-4 w-4" />
                                                Save Changes
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </form>
                    </CardContent>
                </Card>

                {showScrollTop && (
                    <Button
                        type="button"
                        onClick={handleScrollToTop}
                        className="fixed bottom-6 right-6 z-50 shadow-lg"
                        variant="secondary"
                        aria-label="Scroll to top"
                    >
                        <ArrowUp className="h-4 w-4" />
                    </Button>
                )}
            </div>

            <DeleteConfirmationDialog
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
                title="Delete vendor?"
                description="This action will permanently remove the vendor and historical analytics will exclude it going forward."
                onConfirm={handleDeleteConfirm}
                isLoading={isDeleting}
            />
        </AppLayout>
    );
}
