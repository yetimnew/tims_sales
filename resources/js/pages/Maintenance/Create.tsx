import { useEffect, useMemo, useRef, useState, type FormEventHandler } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { maintenanceValidation } from '@/lib/validation';
import { type BreadcrumbItem } from '@/types';
import {
    AlertCircle,
    ArrowLeft,
    ArrowUp,
    CalendarCheck,
    ClipboardList,
    Info,
    Lightbulb,
    Save,
    Sparkles,
    Wrench,
} from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Maintenance', href: '/maintenance' },
    { title: 'Schedule', href: '/maintenance/create' },
];

interface MaintenanceCreateProps {
    trucks: Array<{ id: number; plate: string }>;
    maintenanceTypes: Array<{ id: number; name: string; category?: string | null }>;
}

type MaintenanceField = 'truck_id' | 'maintenance_type_id' | 'scheduled_date';

export default function MaintenanceCreate({ trucks, maintenanceTypes }: MaintenanceCreateProps) {
    const { toast } = useToast();
    const { data, setData, post, processing, errors, reset } = useForm({
        truck_id: '',
        maintenance_type_id: '',
        scheduled_date: '',
        description: '',
        assigned_mechanic_id: '',
    });

    const [frontendErrors, setFrontendErrors] = useState<Record<string, string>>({});
    const [isDirty, setIsDirty] = useState(false);
    const [showScrollTop, setShowScrollTop] = useState(false);
    const [truckSearch, setTruckSearch] = useState('');
    const [typeSearch, setTypeSearch] = useState('');
    const scrollContainerRef = useRef<HTMLFormElement | null>(null);

    const safeTrucks = useMemo(() => (Array.isArray(trucks) ? trucks : []), [trucks]);
    const safeTypes = useMemo(() => (Array.isArray(maintenanceTypes) ? maintenanceTypes : []), [maintenanceTypes]);

    const totalActiveTrucks = useMemo(() => safeTrucks.length, [safeTrucks]);
    const maintenanceCatalogSize = useMemo(() => safeTypes.length, [safeTypes]);
    const selectedDateLabel = data.scheduled_date
        ? new Date(data.scheduled_date).toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
          })
        : 'Not yet scheduled';

    const filteredTrucks = useMemo(() => {
        if (!truckSearch.trim()) return safeTrucks;
        const query = truckSearch.toLowerCase();
        return safeTrucks.filter((truck) => truck.plate?.toLowerCase().includes(query));
    }, [safeTrucks, truckSearch]);

    const filteredTypes = useMemo(() => {
        if (!typeSearch.trim()) return safeTypes;
        const query = typeSearch.toLowerCase();
        return safeTypes.filter((type) => {
            const nameMatch = type.name?.toLowerCase().includes(query);
            const categoryMatch = type.category?.toLowerCase().includes(query) ?? false;
            return Boolean(nameMatch || categoryMatch);
        });
    }, [safeTypes, typeSearch]);

    const selectedTruck = useMemo(
        () => safeTrucks.find((truck) => truck.id.toString() === data.truck_id) ?? null,
        [safeTrucks, data.truck_id],
    );

    const selectedType = useMemo(
        () => safeTypes.find((type) => type.id.toString() === data.maintenance_type_id) ?? null,
        [safeTypes, data.maintenance_type_id],
    );

    useEffect(() => {
        const backendErrors = Object.values(errors).filter(Boolean).map((message) => String(message));
        if (backendErrors.length) {
            toast({
                title: '⚠️ Validation Error',
                description: backendErrors.join(', '),
                variant: 'destructive',
            });
        }
    }, [errors, toast]);

    useEffect(() => {
        const container = scrollContainerRef.current;
        if (!container) return;
        const handleScroll = () => setShowScrollTop(container.scrollTop > 240);
        handleScroll();
        container.addEventListener('scroll', handleScroll);
        return () => container.removeEventListener('scroll', handleScroll);
    }, []);

    const validators: Record<MaintenanceField, (value: string) => string> = {
        truck_id: maintenanceValidation.truck_id,
        maintenance_type_id: maintenanceValidation.maintenance_type_id,
        scheduled_date: maintenanceValidation.scheduled_date,
    };

    const validateField = (field: MaintenanceField, value: string) => {
        const message = validators[field](value);
        setFrontendErrors((prev) => {
            const next = { ...prev };
            if (message) {
                next[field] = message;
            } else {
                delete next[field];
            }
            return next;
        });
        return message;
    };

    const getFieldError = (field: MaintenanceField | keyof typeof data) => {
        const key = field as keyof typeof data;
        return (errors[key] as string | undefined) || frontendErrors[key as string] || '';
    };

    const handleSelectChange = (field: MaintenanceField, value: string) => {
        setData(field, value);
        validateField(field, value);
        setIsDirty(true);
    };

    const handleDateChange = (value: string) => {
        setData('scheduled_date', value);
        validateField('scheduled_date', value);
        setIsDirty(true);
    };

    const handleInputChange = (field: 'assigned_mechanic_id' | 'description', value: string) => {
        setData(field, value);
        setIsDirty(true);
    };

    const submit: FormEventHandler = (event) => {
        event.preventDefault();
        const pendingErrors: Record<string, string> = {};
        (Object.keys(validators) as MaintenanceField[]).forEach((field) => {
            const value = data[field];
            const message = validators[field](value);
            if (message) {
                pendingErrors[field] = message;
            }
        });

        if (Object.keys(pendingErrors).length) {
            setFrontendErrors((prev) => ({ ...prev, ...pendingErrors }));
            toast({
                title: '⚠️ Validation Error',
                description: 'Please fix the highlighted fields before scheduling.',
                variant: 'destructive',
            });
            return;
        }

        post('/maintenance', {
            preserveScroll: true,
            onSuccess: () => {
                toast({
                    title: 'Maintenance scheduled',
                    description: 'The maintenance task has been created successfully.',
                });
                setFrontendErrors({});
                setIsDirty(false);
                reset();
            },
            onError: () => {
                toast({
                    title: 'Schedule failed',
                    description: 'Unable to save maintenance. Review the errors and retry.',
                    variant: 'destructive',
                });
            },
        });
    };

    const handleScrollToTop = () => {
        scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const hasFrontendErrors = Boolean(Object.keys(frontendErrors).length);
    const hasBackendErrors = Boolean(Object.keys(errors).length);
    const showValidationBanner = hasFrontendErrors || hasBackendErrors;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Schedule Maintenance" />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-hidden rounded-xl p-4">
                <Card className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-slate-200/70 bg-white/95 text-card-foreground shadow-xl backdrop-blur-lg dark:border-slate-800/60 dark:bg-slate-900/70">
                    <CardHeader className="px-6 pb-0">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                            <div className="flex items-start gap-4">
                                <div className="rounded-xl bg-amber-100 p-2 text-amber-600 shadow-sm dark:bg-amber-900/40 dark:text-amber-300">
                                    <Wrench className="h-5 w-5" />
                                </div>
                                <div>
                                    <CardTitle className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
                                        Schedule Maintenance
                                    </CardTitle>
                                    <CardDescription className="text-sm text-slate-600 dark:text-slate-400">
                                        Plan preventative or corrective work before issues escalate.
                                    </CardDescription>
                                </div>
                            </div>
                            <div className="flex flex-wrap items-center gap-3">
                                <Button variant="ghost" size="sm" asChild>
                                    <Link href="/maintenance">
                                        <ArrowLeft className="mr-2 h-4 w-4" />
                                        Back to Records
                                    </Link>
                                </Button>
                                {isDirty && (
                                    <div className="flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1.5 text-sm font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                                        <Save className="h-3 w-3" />
                                        Unsaved Changes
                                    </div>
                                )}
                                <div className="flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1.5 text-sm font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                                    <div className="h-2 w-2 animate-pulse rounded-full bg-emerald-500"></div>
                                    Asset Care
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                            <div className="rounded-xl border border-amber-200/60 bg-white/80 p-4 shadow-sm dark:border-amber-900/40 dark:bg-amber-950/20">
                                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Active Trucks</p>
                                <p className="mt-2 text-xl font-semibold text-amber-700 dark:text-amber-200">{totalActiveTrucks}</p>
                                <p className="text-xs text-muted-foreground">Ready for scheduling</p>
                            </div>
                            <div className="rounded-xl border border-slate-200/70 bg-white/80 p-4 shadow-sm dark:border-slate-700/70 dark:bg-slate-900/40">
                                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Maintenance Catalog</p>
                                <p className="mt-2 text-xl font-semibold text-slate-900 dark:text-slate-100">{maintenanceCatalogSize}</p>
                                <p className="text-xs text-muted-foreground">Templates available</p>
                            </div>
                            <div className="rounded-xl border border-blue-200/60 bg-white/80 p-4 shadow-sm dark:border-blue-900/50 dark:bg-blue-950/30">
                                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Target Date</p>
                                <p className="mt-2 flex items-center gap-2 text-xl font-semibold text-blue-700 dark:text-blue-200">
                                    <CalendarCheck className="h-4 w-4" />
                                    {selectedDateLabel}
                                </p>
                                <p className="text-xs text-muted-foreground">Adjust when required</p>
                            </div>
                            <div className="rounded-xl border border-emerald-200/70 bg-white/80 p-4 shadow-sm dark:border-emerald-900/40 dark:bg-emerald-950/20">
                                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Confidence</p>
                                <p className="mt-2 flex items-center gap-2 text-sm font-medium text-emerald-700 dark:text-emerald-200">
                                    <Sparkles className="h-4 w-4" />
                                    Live validation enabled
                                </p>
                                <p className="text-xs text-muted-foreground">Errors surface instantly</p>
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
                            {showValidationBanner && (
                                <Alert variant="destructive" className="border border-destructive/40 bg-destructive/10">
                                    <div className="flex items-start gap-3">
                                        <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0" />
                                        <AlertDescription className="text-sm">
                                            Resolve the highlighted fields to schedule this maintenance task.
                                        </AlertDescription>
                                    </div>
                                </Alert>
                            )}

                            <section className="space-y-5 rounded-xl border border-slate-200/70 bg-white/80 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/40">
                                <div className="flex items-center gap-3">
                                    <div className="rounded-lg bg-amber-100 p-2 text-amber-600 dark:bg-amber-900/30 dark:text-amber-300">
                                        <ClipboardList className="h-4 w-4" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Asset & Template</h2>
                                        <p className="text-sm text-muted-foreground">
                                            Select the truck and maintenance template. Use the inline search to filter large lists quickly.
                                        </p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="truck_id" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                                            <span className="text-red-500">*</span> Truck
                                        </Label>
                                        <Select
                                            value={data.truck_id}
                                            onValueChange={(value) => handleSelectChange('truck_id', value)}
                                            onOpenChange={(open) => {
                                                if (!open) setTruckSearch('');
                                            }}
                                        >
                                            <SelectTrigger
                                                id="truck_id"
                                                className={`transition-all duration-200 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500 focus:ring-blue-500/20 focus:border-blue-500 ${getFieldError('truck_id') ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}`}
                                            >
                                                <SelectValue placeholder="Select truck" />
                                            </SelectTrigger>
                                            <SelectContent className="z-50 max-h-72 bg-white shadow-lg dark:bg-slate-800">
                                                <div className="sticky top-0 z-10 bg-white p-2 shadow-[0_1px_0_0_rgba(148,163,184,0.35)] dark:bg-slate-800 dark:shadow-[0_1px_0_0_rgba(148,163,184,0.35)]">
                                                    <Input
                                                        autoComplete="off"
                                                        value={truckSearch}
                                                        onChange={(event) => setTruckSearch(event.target.value)}
                                                        placeholder="Search trucks by plate..."
                                                        className="h-9 w-full border-slate-200 bg-slate-50 text-sm focus-visible:ring-1 focus-visible:ring-blue-500 dark:border-slate-700 dark:bg-slate-900"
                                                    />
                                                </div>
                                                {filteredTrucks.length ? (
                                                    filteredTrucks.map((truck) => (
                                                        <SelectItem
                                                            key={truck.id}
                                                            value={truck.id.toString()}
                                                            className="hover:bg-slate-100 focus:bg-slate-100 dark:hover:bg-slate-700 dark:focus:bg-slate-700"
                                                        >
                                                            {truck.plate}
                                                        </SelectItem>
                                                    ))
                                                ) : (
                                                    <SelectItem value="no-trucks" disabled>
                                                        No matching trucks found
                                                    </SelectItem>
                                                )}
                                            </SelectContent>
                                        </Select>
                                        {getFieldError('truck_id') && (
                                            <p className="flex items-center gap-1 text-sm text-red-500">
                                                <AlertCircle className="h-3 w-3" />
                                                {getFieldError('truck_id')}
                                            </p>
                                        )}

                                        {selectedTruck && (
                                            <div className="rounded-lg border border-amber-200/70 bg-amber-50/80 p-4 text-sm shadow-sm dark:border-amber-900/40 dark:bg-amber-900/20">
                                                <h4 className="mb-2 font-semibold text-amber-800 dark:text-amber-200">Selected Truck</h4>
                                                <p className="text-amber-800 dark:text-amber-100">
                                                    <strong>Plate:</strong> {selectedTruck.plate}
                                                </p>
                                                <p className="text-xs text-amber-700/80 dark:text-amber-200/70 mt-2">
                                                    Service history will be linked automatically.
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="maintenance_type_id" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                                            <span className="text-red-500">*</span> Maintenance Type
                                        </Label>
                                        <Select
                                            value={data.maintenance_type_id}
                                            onValueChange={(value) => handleSelectChange('maintenance_type_id', value)}
                                            onOpenChange={(open) => {
                                                if (!open) setTypeSearch('');
                                            }}
                                        >
                                            <SelectTrigger
                                                id="maintenance_type_id"
                                                className={`transition-all duration-200 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500 focus:ring-blue-500/20 focus:border-blue-500 ${getFieldError('maintenance_type_id') ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}`}
                                            >
                                                <SelectValue placeholder="Select maintenance type" />
                                            </SelectTrigger>
                                            <SelectContent className="z-50 max-h-72 bg-white shadow-lg dark:bg-slate-800">
                                                <div className="sticky top-0 z-10 bg-white p-2 shadow-[0_1px_0_0_rgba(148,163,184,0.35)] dark:bg-slate-800 dark:shadow-[0_1px_0_0_rgba(148,163,184,0.35)]">
                                                    <Input
                                                        autoComplete="off"
                                                        value={typeSearch}
                                                        onChange={(event) => setTypeSearch(event.target.value)}
                                                        placeholder="Search by name or category..."
                                                        className="h-9 w-full border-slate-200 bg-slate-50 text-sm focus-visible:ring-1 focus-visible:ring-blue-500 dark:border-slate-700 dark:bg-slate-900"
                                                    />
                                                </div>
                                                {filteredTypes.length ? (
                                                    filteredTypes.map((type) => (
                                                        <SelectItem
                                                            key={type.id}
                                                            value={type.id.toString()}
                                                            className="hover:bg-slate-100 focus:bg-slate-100 dark:hover:bg-slate-700 dark:focus:bg-slate-700"
                                                        >
                                                            <div className="flex flex-col">
                                                                <span>{type.name}</span>
                                                                {type.category && (
                                                                    <span className="text-xs text-muted-foreground">{type.category}</span>
                                                                )}
                                                            </div>
                                                        </SelectItem>
                                                    ))
                                                ) : (
                                                    <SelectItem value="no-types" disabled>
                                                        No matching maintenance types
                                                    </SelectItem>
                                                )}
                                            </SelectContent>
                                        </Select>
                                        {getFieldError('maintenance_type_id') && (
                                            <p className="flex items-center gap-1 text-sm text-red-500">
                                                <AlertCircle className="h-3 w-3" />
                                                {getFieldError('maintenance_type_id')}
                                            </p>
                                        )}

                                        {selectedType && (
                                            <div className="rounded-lg border border-blue-200/60 bg-blue-50/80 p-4 text-sm shadow-sm dark:border-blue-900/40 dark:bg-blue-900/30">
                                                <h4 className="mb-2 font-semibold text-blue-900 dark:text-blue-100">Template Insight</h4>
                                                <p className="text-blue-900 dark:text-blue-100">
                                                    {selectedType.name}
                                                </p>
                                                <p className="text-xs text-blue-800/80 dark:text-blue-200/80 mt-2">
                                                    Category: {selectedType.category || '—'}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </section>

                            <section className="space-y-5 rounded-xl border border-slate-200/70 bg-white/80 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/40">
                                <div className="flex items-center gap-3">
                                    <div className="rounded-lg bg-blue-100 p-2 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300">
                                        <Info className="h-4 w-4" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Scheduling & Notes</h2>
                                        <p className="text-sm text-muted-foreground">
                                            Set the target date, assign a mechanic, and capture any early diagnostics.
                                        </p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="scheduled_date" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                                            <span className="text-red-500">*</span> Scheduled Date
                                        </Label>
                                        <Input
                                            id="scheduled_date"
                                            type="date"
                                            value={data.scheduled_date}
                                            onChange={(event) => handleDateChange(event.target.value)}
                                            className={`bg-white dark:bg-slate-800 transition-all duration-200 border-slate-300 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500 focus:ring-blue-500/20 focus:border-blue-500 ${getFieldError('scheduled_date') ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}`}
                                        />
                                        {getFieldError('scheduled_date') && (
                                            <p className="flex items-center gap-1 text-sm text-red-500">
                                                <AlertCircle className="h-3 w-3" />
                                                {getFieldError('scheduled_date')}
                                            </p>
                                        )}
                                        <p className="text-xs text-muted-foreground">Must be today or in the future.</p>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="assigned_mechanic_id" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                                            Assigned Mechanic (optional)
                                        </Label>
                                        <Input
                                            id="assigned_mechanic_id"
                                            type="text"
                                            value={data.assigned_mechanic_id}
                                            onChange={(event) => handleInputChange('assigned_mechanic_id', event.target.value)}
                                            placeholder="Mechanic user ID or name"
                                            className="bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500 focus:ring-blue-500/20 focus:border-blue-500"
                                        />
                                        <p className="text-xs text-muted-foreground">Leave blank to assign later.</p>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="description" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                                        Work Notes
                                    </Label>
                                    <Textarea
                                        id="description"
                                        value={data.description}
                                        onChange={(event) => handleInputChange('description', event.target.value)}
                                        placeholder="Outline the symptoms, planned checks, or parts to procure."
                                        rows={4}
                                        className="resize-y bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500 focus:ring-blue-500/20 focus:border-blue-500"
                                    />
                                </div>

                                <div className="rounded-lg border border-dashed border-blue-300/70 bg-blue-50/60 p-4 text-sm text-blue-900 shadow-sm dark:border-blue-800/60 dark:bg-blue-900/20 dark:text-blue-100">
                                    <div className="flex items-center gap-2 font-medium">
                                        <Lightbulb className="h-4 w-4" />
                                        Predictive scheduling insights
                                    </div>
                                    <p className="mt-2 text-xs leading-relaxed">
                                        Interval-based suggestions (next due date & odometer) will appear here once maintenance types include interval settings. Configure them to unlock proactive recommendations.
                                    </p>
                                </div>
                            </section>

                            <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200/70 bg-white/80 px-6 py-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/40">
                                <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600 dark:text-slate-400">
                                    <div className="flex items-center gap-2 text-sm">
                                        <span className="text-red-500">*</span>
                                        <span>Required field</span>
                                    </div>
                                    {isDirty && (
                                        <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                                            <Save className="h-3 w-3" />
                                            <span>Unsaved changes</span>
                                        </div>
                                    )}
                                </div>
                                <div className="flex gap-3">
                                    <Button type="button" variant="outline" asChild className="border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700">
                                        <Link href="/maintenance">Cancel</Link>
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={processing || hasFrontendErrors || !data.truck_id || !data.maintenance_type_id || !data.scheduled_date}
                                        className="min-w-[170px] bg-gradient-to-r from-amber-500 to-amber-600 px-6 text-white shadow-lg transition-all duration-200 hover:from-amber-600 hover:to-amber-700 hover:shadow-xl"
                                    >
                                        {processing ? (
                                            <>
                                                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-white"></div>
                                                Scheduling...
                                            </>
                                        ) : (
                                            <>
                                                <ClipboardList className="mr-2 h-4 w-4" />
                                                Schedule Maintenance
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
