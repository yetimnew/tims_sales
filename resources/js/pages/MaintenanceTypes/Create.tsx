import { FormEventHandler, useEffect, useRef, useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertCircle, ArrowUp, CheckCircle2, ClipboardList, DollarSign, Info, Settings, SlidersHorizontal } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { validateMaintenanceType, type ValidationErrors } from '@/lib/validation';

type MaintenanceTypeFormData = {
    name: string;
    category: string;
    interval_km: string;
    interval_months: string;
    estimated_cost: string;
    description: string;
    is_active: boolean;
};

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Maintenance Types',
        href: '/maintenance-types',
    },
    {
        title: 'Create',
        href: '/maintenance-types/create',
    },
];

const categoryOptions = ['Preventive', 'Corrective', 'Emergency'] as const;

export default function MaintenanceTypesCreate() {
    const { data, setData, post, processing, errors } = useForm<MaintenanceTypeFormData>({
        name: '',
        category: '',
        interval_km: '',
        interval_months: '',
        estimated_cost: '',
        description: '',
        is_active: true,
    });

    const [frontendErrors, setFrontendErrors] = useState<ValidationErrors>({});
    const [isDirty, setIsDirty] = useState(false);
    const [showScrollTop, setShowScrollTop] = useState(false);
    const scrollContainerRef = useRef<HTMLFormElement | null>(null);

    useEffect(() => {
        const backendMessages = Object.values(errors).filter((message): message is string => Boolean(message));
        if (backendMessages.length) {
            toast({
                title: '⚠️ Validation Error',
                description: backendMessages.join(', '),
                variant: 'destructive',
            });
            setFrontendErrors(prev => ({ ...prev, ...errors }));
        }
    }, [errors]);

    useEffect(() => {
        const container = scrollContainerRef.current;
        if (!container) return;
        const handleScroll = () => setShowScrollTop(container.scrollTop > 240);
        handleScroll();
        container.addEventListener('scroll', handleScroll);
        return () => container.removeEventListener('scroll', handleScroll);
    }, []);

    const syncValidation = (draft: MaintenanceTypeFormData) => {
        const nextErrors = validateMaintenanceType(draft);
        setFrontendErrors(nextErrors);
    };

    const sanitizeValue = <K extends keyof MaintenanceTypeFormData>(field: K, value: MaintenanceTypeFormData[K] | string): MaintenanceTypeFormData[K] => {
        if (typeof value !== 'string') {
            return value as MaintenanceTypeFormData[K];
        }
        let sanitized = value;
        if (field === 'interval_km' || field === 'interval_months') {
            sanitized = value.replace(/[^0-9]/g, '');
        } else if (field === 'estimated_cost') {
            sanitized = value.replace(/[^0-9.]/g, '');
        }
        return sanitized as MaintenanceTypeFormData[K];
    };

    const handleFieldChange = <K extends keyof MaintenanceTypeFormData>(field: K, value: MaintenanceTypeFormData[K] | string) => {
        const sanitized = sanitizeValue(field, value);
    setData(field, sanitized as any);
        const draft = { ...data, [field]: sanitized } as MaintenanceTypeFormData;
        syncValidation(draft);
        setIsDirty(true);
    };

    const submit: FormEventHandler = event => {
        event.preventDefault();
        const allErrors = validateMaintenanceType(data);
        if (Object.keys(allErrors).length) {
            setFrontendErrors(allErrors);
            toast({
                title: '⚠️ Validation Error',
                description: 'Please resolve the highlighted fields before continuing.',
                variant: 'destructive',
            });
            return;
        }

        post('/maintenance-types', {
            preserveScroll: true,
            onSuccess: () => {
                toast({
                    title: 'Maintenance Type Created',
                    description: 'The maintenance type has been saved successfully.',
                });
                setFrontendErrors({});
                setIsDirty(false);
            },
            onError: (serverErrors) => {
                setFrontendErrors(prev => ({ ...prev, ...serverErrors }));
            },
        });
    };

    const getFieldError = (field: keyof MaintenanceTypeFormData) => {
        const frontendError = frontendErrors[field];
        const backendError = errors[field];
        return (typeof frontendError === 'string' && frontendError) || (typeof backendError === 'string' && backendError) || '';
    };

    const hasErrors = Object.values(frontendErrors).some(Boolean) || Object.values(errors).some(Boolean);

    const handleScrollToTop = () => {
        scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Create Maintenance Type" />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-hidden rounded-xl p-4">
                <Card className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-slate-200/70 bg-white/95 text-card-foreground shadow-xl backdrop-blur-lg dark:border-slate-800/60 dark:bg-slate-900/70">
                    <CardHeader className="px-6 pb-0">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                            <div className="flex items-start gap-4">
                                <div className="rounded-xl bg-blue-100 p-2 text-blue-600 shadow-sm dark:bg-blue-900/30 dark:text-blue-400">
                                    <ClipboardList className="h-5 w-5" />
                                </div>
                                <div>
                                    <CardTitle className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Create Maintenance Type</CardTitle>
                                    <CardDescription className="text-sm text-slate-600 dark:text-slate-400">
                                        Match the truck workflow by validating fields as you type and keeping users informed.
                                    </CardDescription>
                                </div>
                            </div>
                            <div className="flex flex-wrap items-center gap-3">
                                {isDirty && (
                                    <div className="flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1.5 text-sm font-medium text-amber-700 dark:bg-amber-900/40 dark:text-amber-400">
                                        <SlidersHorizontal className="h-3 w-3" />
                                        Unsaved Changes
                                    </div>
                                )}
                                <div className="flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1.5 text-sm font-medium text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400">
                                    <div className="h-2 w-2 animate-pulse rounded-full bg-emerald-500"></div>
                                    Maintenance Catalog
                                </div>
                            </div>
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
                            <section className="space-y-5 rounded-xl border border-slate-200/70 bg-white/80 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/40">
                                <div className="flex items-center gap-3">
                                    <div className="rounded-lg bg-blue-100 p-2 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                                        <Info className="h-4 w-4" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Maintenance Type Details</h2>
                                        <p className="text-sm text-muted-foreground">Name and category are required. Remaining fields are optional but help scheduling.</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="name" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                                            <span className="text-red-500">*</span> Name
                                        </Label>
                                        <Input
                                            id="name"
                                            type="text"
                                            value={data.name}
                                            onChange={event => handleFieldChange('name', event.target.value)}
                                            placeholder="e.g. Oil Change, Brake Inspection"
                                            className={`transition-all duration-200 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500 focus:ring-blue-500/20 focus:border-blue-500 ${getFieldError('name') ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}`}
                                        />
                                        {getFieldError('name') && (
                                            <p className="flex items-center gap-1 text-sm text-red-500">
                                                <AlertCircle className="h-3 w-3" />
                                                {getFieldError('name')}
                                            </p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="category" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                                            <span className="text-red-500">*</span> Category
                                        </Label>
                                        <Select
                                            value={data.category}
                                            onValueChange={value => handleFieldChange('category', value)}
                                        >
                                            <SelectTrigger className={`transition-all duration-200 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500 focus:ring-blue-500/20 focus:border-blue-500 ${getFieldError('category') ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}`}>
                                                <SelectValue placeholder="Select category" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {categoryOptions.map(option => (
                                                    <SelectItem key={option} value={option}>
                                                        {option}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {getFieldError('category') && (
                                            <p className="flex items-center gap-1 text-sm text-red-500">
                                                <AlertCircle className="h-3 w-3" />
                                                {getFieldError('category')}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                                    <div className="space-y-2">
                                        <Label htmlFor="interval_km" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                                            Interval (KM)
                                        </Label>
                                        <Input
                                            id="interval_km"
                                            inputMode="numeric"
                                            value={data.interval_km}
                                            onChange={event => handleFieldChange('interval_km', event.target.value)}
                                            placeholder="e.g. 5000"
                                            className={`transition-all duration-200 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500 focus:ring-blue-500/20 focus:border-blue-500 ${getFieldError('interval_km') ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}`}
                                        />
                                        {getFieldError('interval_km') && (
                                            <p className="flex items-center gap-1 text-sm text-red-500">
                                                <AlertCircle className="h-3 w-3" />
                                                {getFieldError('interval_km')}
                                            </p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="interval_months" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                                            Interval (Months)
                                        </Label>
                                        <Input
                                            id="interval_months"
                                            inputMode="numeric"
                                            value={data.interval_months}
                                            onChange={event => handleFieldChange('interval_months', event.target.value)}
                                            placeholder="e.g. 6"
                                            className={`transition-all duration-200 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500 focus:ring-blue-500/20 focus:border-blue-500 ${getFieldError('interval_months') ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}`}
                                        />
                                        {getFieldError('interval_months') && (
                                            <p className="flex items-center gap-1 text-sm text-red-500">
                                                <AlertCircle className="h-3 w-3" />
                                                {getFieldError('interval_months')}
                                            </p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="estimated_cost" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                                            Estimated Cost
                                        </Label>
                                        <Input
                                            id="estimated_cost"
                                            inputMode="decimal"
                                            value={data.estimated_cost}
                                            onChange={event => handleFieldChange('estimated_cost', event.target.value)}
                                            placeholder="e.g. 150.00"
                                            className={`transition-all duration-200 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500 focus:ring-blue-500/20 focus:border-blue-500 ${getFieldError('estimated_cost') ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}`}
                                        />
                                        {getFieldError('estimated_cost') && (
                                            <p className="flex items-center gap-1 text-sm text-red-500">
                                                <AlertCircle className="h-3 w-3" />
                                                {getFieldError('estimated_cost')}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="description" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                                            Description
                                        </Label>
                                        <Textarea
                                            id="description"
                                            value={data.description}
                                            onChange={event => handleFieldChange('description', event.target.value)}
                                            placeholder="Add procedure highlights and parts covered."
                                            rows={4}
                                            className={`resize-none transition-all duration-200 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500 focus:ring-blue-500/20 focus:border-blue-500 ${getFieldError('description') ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}`}
                                        />
                                        {getFieldError('description') && (
                                            <p className="flex items-center gap-1 text-sm text-red-500">
                                                <AlertCircle className="h-3 w-3" />
                                                {getFieldError('description')}
                                            </p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="is_active" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                                            Status
                                        </Label>
                                        <Select
                                            value={String(data.is_active)}
                                            onValueChange={value => handleFieldChange('is_active', value === 'true')}
                                        >
                                            <SelectTrigger className={`transition-all duration-200 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500 focus:ring-blue-500/20 focus:border-blue-500 ${getFieldError('is_active') ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}`}>
                                                <SelectValue placeholder="Select status" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="true">Active</SelectItem>
                                                <SelectItem value="false">Inactive</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        {getFieldError('is_active') && (
                                            <p className="flex items-center gap-1 text-sm text-red-500">
                                                <AlertCircle className="h-3 w-3" />
                                                {getFieldError('is_active')}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </section>

                            <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200/70 bg-white/80 px-6 py-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/40">
                                <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
                                    <Settings className="h-4 w-4" />
                                    <span>Fields marked with <span className="text-red-500">*</span> are required.</span>
                                </div>
                                <div className="flex gap-3">
                                    <Button type="button" variant="outline" asChild className="border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700">
                                        <Link href="/maintenance-types">Cancel</Link>
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={processing || hasErrors}
                                        className="min-w-[170px] bg-gradient-to-r from-blue-600 to-blue-700 px-6 text-white shadow-lg transition-all duration-200 hover:from-blue-700 hover:to-blue-800 hover:shadow-xl disabled:opacity-60"
                                    >
                                        {processing ? (
                                            <>
                                                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-white"></div>
                                                Saving...
                                            </>
                                        ) : (
                                            <>
                                                <CheckCircle2 className="mr-2 h-4 w-4" />
                                                Create Maintenance Type
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
        </AppLayout>
    );
}
