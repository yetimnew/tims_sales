import { useEffect, useMemo, useRef, useState, useTransition, type FormEventHandler } from 'react';
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
    RefreshCcw,
    Save,
    Sparkles,
    Truck,
    Wrench,
} from 'lucide-react';

const UNASSIGNED_MECHANIC_VALUE = '__unassigned__';

type MaintenanceStatus = 'scheduled' | 'in_progress' | 'completed' | 'overdue';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Maintenance', href: '/maintenance' },
    { title: 'Edit', href: '#' },
];

interface TruckOption {
    id: number;
    plate: string;
}

interface MaintenanceTypeOption {
    id: number;
    name: string;
    category?: string | null;
}

interface MechanicOption {
    id: number;
    name: string;
    email?: string | null;
}

interface StatusOption {
    value: MaintenanceStatus;
    label: string;
}

interface MaintenanceRecord {
    id: number;
    truck_id: number;
    maintenance_type_id: number;
    scheduled_date: string;
    completed_date?: string | null;
    status: MaintenanceStatus;
    odometer_reading?: number | null;
    cost?: number | string | null;
    description?: string | null;
    work_performed?: string | null;
    parts_replaced?: string | null;
    service_provider?: string | null;
    assigned_mechanic_id?: number | string | null;
}

interface MaintenanceEditProps {
    maintenance: MaintenanceRecord;
    trucks: TruckOption[];
    maintenanceTypes: MaintenanceTypeOption[];
    mechanics: MechanicOption[];
    statusOptions: StatusOption[];
}

const fallbackStatusOptions: StatusOption[] = [
    { value: 'scheduled', label: 'Scheduled' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'completed', label: 'Completed' },
    { value: 'overdue', label: 'Overdue' },
];

type MaintenanceField = 'truck_id' | 'maintenance_type_id' | 'scheduled_date' | 'status';

const buildFormState = (record: MaintenanceRecord) => ({
    truck_id: record.truck_id ? record.truck_id.toString() : '',
    maintenance_type_id: record.maintenance_type_id ? record.maintenance_type_id.toString() : '',
    scheduled_date: record.scheduled_date ?? '',
    completed_date: record.completed_date ?? '',
    status: record.status,
    odometer_reading: record.odometer_reading ? record.odometer_reading.toString() : '',
    cost: record.cost !== null && record.cost !== undefined ? record.cost.toString() : '',
    description: record.description ?? '',
    work_performed: record.work_performed ?? '',
    parts_replaced: record.parts_replaced ?? '',
    service_provider: record.service_provider ?? '',
    assigned_mechanic_id: record.assigned_mechanic_id ? record.assigned_mechanic_id.toString() : '',
});

const completedDateMessage = (
    value: string,
    scheduledDate: string,
    status: MaintenanceStatus,
): string => {
    if (!value) {
        return status === 'completed' ? 'Completion date is required for completed maintenance.' : '';
    }

    if (scheduledDate) {
        const scheduled = new Date(scheduledDate);
        const completed = new Date(value);
        if (Number.isNaN(completed.getTime())) {
            return 'Completion date must be a valid date';
        }
        if (completed < scheduled) {
            return 'Completion date cannot precede the scheduled date';
        }
    }

    return '';
};

export default function MaintenanceEdit({ maintenance, trucks, maintenanceTypes, mechanics, statusOptions }: MaintenanceEditProps) {
    const { toast } = useToast();
    const formDefaults = useMemo(() => buildFormState(maintenance), [maintenance]);
    const [, startTransition] = useTransition();
    const {
        data,
        setData,
        setDefaults,
        put,
        processing,
        errors,
    } = useForm(formDefaults);

    const [frontendErrors, setFrontendErrors] = useState<Record<string, string>>({});
    const [isDirty, setIsDirty] = useState(false);
    const [showScrollTop, setShowScrollTop] = useState(false);
    const [truckSearch, setTruckSearch] = useState('');
    const [typeSearch, setTypeSearch] = useState('');
    const scrollContainerRef = useRef<HTMLFormElement | null>(null);

    const safeTrucks = useMemo(() => (Array.isArray(trucks) ? trucks : []), [trucks]);
    const safeTypes = useMemo(() => (Array.isArray(maintenanceTypes) ? maintenanceTypes : []), [maintenanceTypes]);
    const safeMechanics = useMemo(() => (Array.isArray(mechanics) ? mechanics : []), [mechanics]);
    const safeStatusOptions = useMemo(() => (
        Array.isArray(statusOptions) && statusOptions.length ? statusOptions : fallbackStatusOptions
    ), [statusOptions]);

    const validators: Record<MaintenanceField, (value: string) => string> = useMemo(
        () => ({
            truck_id: maintenanceValidation.truck_id,
            maintenance_type_id: maintenanceValidation.maintenance_type_id,
            scheduled_date: (value: string) => {
                if (!value) return 'Scheduled date is required';
                return '';
            },
            status: maintenanceValidation.status,
        }),
        [],
    );

    const optionalValidators: Partial<Record<keyof typeof data, (value: string) => string>> = useMemo(
        () => ({
            cost: maintenanceValidation.cost,
            odometer_reading: maintenanceValidation.odometer_reading,
            assigned_mechanic_id: maintenanceValidation.assigned_mechanic_id,
            service_provider: maintenanceValidation.service_provider,
            work_performed: maintenanceValidation.work_performed,
            parts_replaced: maintenanceValidation.parts_replaced,
        }),
        [],
    );

    useEffect(() => {
        startTransition(() => {
            setData(formDefaults);
            setDefaults(formDefaults);
            setFrontendErrors({});
            setIsDirty(false);
        });
    }, [formDefaults, setData, setDefaults, startTransition]);

    useEffect(() => {
        const backendErrors = Object.values(errors)
            .filter(Boolean)
            .map(message => String(message));

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

        return () => {
            container.removeEventListener('scroll', handleScroll);
        };
    }, []);

    const setFieldErrorMessage = (field: keyof typeof data, message: string) => {
        setFrontendErrors(prev => {
            const next = { ...prev };
            if (message) {
                next[field] = message;
            } else {
                delete next[field];
            }
            return next;
        });
    };

    const validateField = (field: MaintenanceField, value: string) => {
        const message = validators[field](value);
        setFieldErrorMessage(field, message);
        return message;
    };

    const validateOptionalField = (field: keyof typeof data, value: string) => {
        const validator = optionalValidators[field];
        if (!validator) {
            setFieldErrorMessage(field, '');
            return '';
        }

        const message = validator(value);
        setFieldErrorMessage(field, message);
        return message;
    };

    const handleSelectChange = (field: MaintenanceField, value: string) => {
        setData(field, value);
        setIsDirty(true);
        validateField(field, value);

        if (field === 'status') {
            const resolvedMessage = completedDateMessage(data.completed_date, data.scheduled_date, value as MaintenanceStatus);
            setFieldErrorMessage('completed_date', resolvedMessage);
        }
    };

    const handleDateChange = (value: string) => {
        setData('scheduled_date', value);
        setIsDirty(true);
        validateField('scheduled_date', value);
        const resolvedMessage = completedDateMessage(data.completed_date, value, data.status);
        setFieldErrorMessage('completed_date', resolvedMessage);
    };

    const handleCompletedDateChange = (value: string) => {
        setData('completed_date', value);
        setIsDirty(true);
        const message = completedDateMessage(value, data.scheduled_date, data.status);
        setFieldErrorMessage('completed_date', message);
    };

    const handleInputChange = (field: keyof typeof data, value: string) => {
        setData(field, value);
        setIsDirty(true);
        validateOptionalField(field, value);
    };

    const filteredTrucks = useMemo(() => {
        if (!truckSearch.trim()) return safeTrucks;
        const query = truckSearch.toLowerCase();
        return safeTrucks.filter(truck => truck.plate?.toLowerCase().includes(query));
    }, [safeTrucks, truckSearch]);

    const filteredTypes = useMemo(() => {
        if (!typeSearch.trim()) return safeTypes;
        const query = typeSearch.toLowerCase();
        return safeTypes.filter(type => {
            const nameMatch = type.name?.toLowerCase().includes(query);
            const categoryMatch = type.category?.toLowerCase().includes(query) ?? false;
            return Boolean(nameMatch || categoryMatch);
        });
    }, [safeTypes, typeSearch]);

    const selectedTruck = useMemo(
        () => safeTrucks.find(truck => truck.id.toString() === data.truck_id) ?? null,
        [safeTrucks, data.truck_id],
    );

    const selectedType = useMemo(
        () => safeTypes.find(type => type.id.toString() === data.maintenance_type_id) ?? null,
        [safeTypes, data.maintenance_type_id],
    );

    const selectedMechanic = useMemo(
        () => safeMechanics.find(mechanic => mechanic.id.toString() === data.assigned_mechanic_id) ?? null,
        [safeMechanics, data.assigned_mechanic_id],
    );

    const statusLabel = useMemo(
        () => safeStatusOptions.find(option => option.value === data.status)?.label ?? data.status,
        [safeStatusOptions, data.status],
    );

    const scheduledDateLabel = useMemo(() => (
        data.scheduled_date
            ? new Date(data.scheduled_date).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
              })
            : 'Not yet scheduled'
    ), [data.scheduled_date]);

    const hasFrontendErrors = Boolean(Object.keys(frontendErrors).length);
    const hasBackendErrors = Boolean(Object.keys(errors).length);
    const showValidationBanner = hasFrontendErrors || hasBackendErrors;

    const getFieldError = (field: keyof typeof data) => frontendErrors[field] || (errors[field] as string | undefined) || '';

    const submit: FormEventHandler<HTMLFormElement> = event => {
        event.preventDefault();

        const pendingErrors: Record<string, string> = {};

        (Object.keys(validators) as MaintenanceField[]).forEach(field => {
            const value = data[field];
            const message = validators[field](value);
            if (message) {
                pendingErrors[field] = message;
            }
        });

        Object.keys(optionalValidators).forEach(key => {
            const field = key as keyof typeof data;
            const validator = optionalValidators[field];
            if (!validator) return;
            const value = (data[field] ?? '') as string;
            const message = validator(value);
            if (message) {
                pendingErrors[field] = message;
            }
        });

        const completedMessageValue = completedDateMessage(data.completed_date, data.scheduled_date, data.status);
        if (completedMessageValue) {
            pendingErrors.completed_date = completedMessageValue;
        }

        if (Object.keys(pendingErrors).length) {
            setFrontendErrors(pendingErrors);
            toast({
                title: '⚠️ Validation Error',
                description: 'Please fix the highlighted fields before saving your changes.',
                variant: 'destructive',
            });
            return;
        }

        put(`/maintenance/${maintenance.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                setFrontendErrors({});
                setIsDirty(false);
            },
        });
    };

    const handleScrollToTop = () => {
        scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Update Maintenance" />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-hidden rounded-xl p-4">
                <Card className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-slate-200/70 bg-white/95 text-card-foreground shadow-xl backdrop-blur-lg dark:border-slate-800/60 dark:bg-slate-900/70">
                    <CardHeader className="px-6 pb-0">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                            <div className="flex items-start gap-4">
                                <div className="rounded-xl bg-blue-100 p-2 text-blue-600 shadow-sm dark:bg-blue-900/40 dark:text-blue-300">
                                    <Wrench className="h-5 w-5" />
                                </div>
                                <div>
                                    <CardTitle className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
                                        Update Maintenance
                                    </CardTitle>
                                    <CardDescription className="text-sm text-slate-600 dark:text-slate-400">
                                        Refresh service details, assignments, and completion notes for this record.
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
                                <div className="flex items-center gap-2 rounded-full bg-blue-100 px-3 py-1.5 text-sm font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                                    <RefreshCcw className="h-3 w-3" />
                                    Record #{maintenance.id}
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                            <div className="rounded-xl border border-blue-200/60 bg-white/80 p-4 shadow-sm dark:border-blue-900/50 dark:bg-blue-950/30">
                                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Selected Truck</p>
                                <p className="mt-2 flex items-center gap-2 text-sm font-semibold text-blue-700 dark:text-blue-200">
                                    <Truck className="h-4 w-4" />
                                    {selectedTruck?.plate ?? 'Choose a truck'}
                                </p>
                                <p className="text-xs text-muted-foreground">Asset tied to this maintenance</p>
                            </div>
                            <div className="rounded-xl border border-slate-200/70 bg-white/80 p-4 shadow-sm dark:border-slate-700/70 dark:bg-slate-900/40">
                                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Maintenance Type</p>
                                <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
                                    {selectedType?.name ?? 'Select a template'}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    {selectedType?.category ? `Category: ${selectedType.category}` : 'Awaiting selection'}
                                </p>
                            </div>
                            <div className="rounded-xl border border-blue-200/60 bg-white/80 p-4 shadow-sm dark:border-blue-900/50 dark:bg-blue-950/30">
                                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Scheduled Date</p>
                                <p className="mt-2 flex items-center gap-2 text-xl font-semibold text-blue-700 dark:text-blue-200">
                                    <CalendarCheck className="h-4 w-4" />
                                    {scheduledDateLabel}
                                </p>
                                <p className="text-xs text-muted-foreground">Adjust if timelines shifted</p>
                            </div>
                            <div className="rounded-xl border border-emerald-200/70 bg-white/80 p-4 shadow-sm dark:border-emerald-900/40 dark:bg-emerald-950/20">
                                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Status</p>
                                <p className="mt-2 flex items-center gap-2 text-sm font-medium text-emerald-700 dark:text-emerald-200">
                                    <Sparkles className="h-4 w-4" />
                                    {statusLabel}
                                </p>
                                <p className="text-xs text-muted-foreground">Keep stakeholders informed</p>
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
                                            Resolve the highlighted fields to save the maintenance record.
                                        </AlertDescription>
                                    </div>
                                </Alert>
                            )}

                            <section className="space-y-5 rounded-xl border border-slate-200/70 bg-white/80 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/40">
                                <div className="flex items-center gap-3">
                                    <div className="rounded-lg bg-blue-100 p-2 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300">
                                        <ClipboardList className="h-4 w-4" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Asset & Template</h2>
                                        <p className="text-sm text-muted-foreground">
                                            Update the associated truck and maintenance template. Inline search helps you filter long lists quickly.
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
                                            onValueChange={value => handleSelectChange('truck_id', value)}
                                            onOpenChange={open => {
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
                                                        onChange={event => setTruckSearch(event.target.value)}
                                                        placeholder="Search trucks by plate..."
                                                        className="h-9 w-full border-slate-200 bg-slate-50 text-sm focus-visible:ring-1 focus-visible:ring-blue-500 dark:border-slate-700 dark:bg-slate-900"
                                                    />
                                                </div>
                                                {filteredTrucks.length ? (
                                                    filteredTrucks.map(truck => (
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
                                            <div className="rounded-lg border border-blue-200/60 bg-blue-50/80 p-4 text-sm shadow-sm dark:border-blue-900/40 dark:bg-blue-900/30">
                                                <h4 className="mb-2 font-semibold text-blue-900 dark:text-blue-100">Selected Truck</h4>
                                                <p className="text-blue-900 dark:text-blue-100">
                                                    <strong>Plate:</strong> {selectedTruck.plate}
                                                </p>
                                                <p className="mt-2 text-xs text-blue-800/80 dark:text-blue-200/80">
                                                    Service history stays linked automatically.
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
                                            onValueChange={value => handleSelectChange('maintenance_type_id', value)}
                                            onOpenChange={open => {
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
                                                        onChange={event => setTypeSearch(event.target.value)}
                                                        placeholder="Search by name or category..."
                                                        className="h-9 w-full border-slate-200 bg-slate-50 text-sm focus-visible:ring-1 focus-visible:ring-blue-500 dark:border-slate-700 dark:bg-slate-900"
                                                    />
                                                </div>
                                                {filteredTypes.length ? (
                                                    filteredTypes.map(type => (
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
                                            <div className="rounded-lg border border-emerald-200/70 bg-emerald-50/70 p-4 text-sm shadow-sm dark:border-emerald-900/40 dark:bg-emerald-900/20">
                                                <h4 className="mb-2 font-semibold text-emerald-800 dark:text-emerald-200">Template Insight</h4>
                                                <p className="text-emerald-800 dark:text-emerald-100">{selectedType.name}</p>
                                                <p className="mt-2 text-xs text-emerald-700/80 dark:text-emerald-200/70">
                                                    Category: {selectedType.category || '—'}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </section>

                            <section className="space-y-5 rounded-xl border border-slate-200/70 bg-white/80 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/40">
                                <div className="flex items-center gap-3">
                                    <div className="rounded-lg bg-amber-100 p-2 text-amber-600 dark:bg-amber-900/30 dark:text-amber-300">
                                        <Info className="h-4 w-4" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Scheduling & Notes</h2>
                                        <p className="text-sm text-muted-foreground">
                                            Adjust timing, assignments, and any diagnostics captured during execution.
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
                                            onChange={event => handleDateChange(event.target.value)}
                                            className={`bg-white dark:bg-slate-800 transition-all duration-200 border-slate-300 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500 focus:ring-blue-500/20 focus:border-blue-500 ${getFieldError('scheduled_date') ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}`}
                                        />
                                        {getFieldError('scheduled_date') && (
                                            <p className="flex items-center gap-1 text-sm text-red-500">
                                                <AlertCircle className="h-3 w-3" />
                                                {getFieldError('scheduled_date')}
                                            </p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="status" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                                            <span className="text-red-500">*</span> Status
                                        </Label>
                                        <Select value={data.status} onValueChange={value => handleSelectChange('status', value)}>
                                            <SelectTrigger
                                                id="status"
                                                className={`transition-all duration-200 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500 focus:ring-blue-500/20 focus:border-blue-500 ${getFieldError('status') ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}`}
                                            >
                                                <SelectValue placeholder="Select status" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {safeStatusOptions.map(option => (
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
                                        <p className="text-xs text-muted-foreground">Mark progress as the work advances.</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="assigned_mechanic_id" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                                            Assigned Mechanic (optional)
                                        </Label>
                                        <Select
                                            value={
                                                data.assigned_mechanic_id === ''
                                                    ? UNASSIGNED_MECHANIC_VALUE
                                                    : data.assigned_mechanic_id
                                            }
                                            onValueChange={value => {
                                                const nextValue = value === UNASSIGNED_MECHANIC_VALUE ? '' : value;
                                                handleInputChange('assigned_mechanic_id', nextValue);
                                            }}
                                        >
                                            <SelectTrigger
                                                id="assigned_mechanic_id"
                                                className={`transition-all duration-200 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500 focus:ring-blue-500/20 focus:border-blue-500 ${getFieldError('assigned_mechanic_id') ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}`}
                                            >
                                                <SelectValue placeholder="Assign mechanic" />
                                            </SelectTrigger>
                                            <SelectContent className="max-h-72">
                                                <SelectItem value={UNASSIGNED_MECHANIC_VALUE}>Unassigned</SelectItem>
                                                {safeMechanics.map(mechanic => (
                                                    <SelectItem key={mechanic.id} value={mechanic.id.toString()}>
                                                        <div className="flex flex-col">
                                                            <span>{mechanic.name}</span>
                                                            {mechanic.email && (
                                                                <span className="text-xs text-muted-foreground">{mechanic.email}</span>
                                                            )}
                                                        </div>
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {getFieldError('assigned_mechanic_id') && (
                                            <p className="flex items-center gap-1 text-sm text-red-500">
                                                <AlertCircle className="h-3 w-3" />
                                                {getFieldError('assigned_mechanic_id')}
                                            </p>
                                        )}
                                        <p className="text-xs text-muted-foreground">Leave blank to decide later.</p>

                                        {selectedMechanic && (
                                            <div className="rounded-lg border border-emerald-200/70 bg-emerald-50/70 p-4 text-sm shadow-sm dark:border-emerald-900/40 dark:bg-emerald-900/20">
                                                <h4 className="mb-1 font-semibold text-emerald-800 dark:text-emerald-200">Selected Mechanic</h4>
                                                <p className="text-emerald-800 dark:text-emerald-100">{selectedMechanic.name}</p>
                                                {selectedMechanic.email && (
                                                    <p className="text-xs text-emerald-700/80 dark:text-emerald-200/70">{selectedMechanic.email}</p>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="service_provider" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                                            Service Provider (optional)
                                        </Label>
                                        <Input
                                            id="service_provider"
                                            value={data.service_provider}
                                            onChange={event => handleInputChange('service_provider', event.target.value)}
                                            placeholder="External workshop or vendor"
                                            className="bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500 focus:ring-blue-500/20 focus:border-blue-500"
                                        />
                                        {getFieldError('service_provider') && (
                                            <p className="flex items-center gap-1 text-sm text-red-500">
                                                <AlertCircle className="h-3 w-3" />
                                                {getFieldError('service_provider')}
                                            </p>
                                        )}
                                        <p className="text-xs text-muted-foreground">Document where the work occurs.</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                                    <div className="space-y-2">
                                        <Label htmlFor="completed_date" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                                            Completion Date (optional)
                                        </Label>
                                        <Input
                                            id="completed_date"
                                            type="date"
                                            value={data.completed_date}
                                            onChange={event => handleCompletedDateChange(event.target.value)}
                                            className={`bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500 focus:ring-blue-500/20 focus:border-blue-500 ${getFieldError('completed_date') ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}`}
                                        />
                                        {getFieldError('completed_date') && (
                                            <p className="flex items-center gap-1 text-sm text-red-500">
                                                <AlertCircle className="h-3 w-3" />
                                                {getFieldError('completed_date')}
                                            </p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="odometer_reading" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                                            Odometer Reading (km)
                                        </Label>
                                        <Input
                                            id="odometer_reading"
                                            type="number"
                                            min="0"
                                            value={data.odometer_reading}
                                            onChange={event => handleInputChange('odometer_reading', event.target.value)}
                                            className={`bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500 focus:ring-blue-500/20 focus:border-blue-500 ${getFieldError('odometer_reading') ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}`}
                                        />
                                        {getFieldError('odometer_reading') && (
                                            <p className="flex items-center gap-1 text-sm text-red-500">
                                                <AlertCircle className="h-3 w-3" />
                                                {getFieldError('odometer_reading')}
                                            </p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="cost" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                                            Actual Cost (optional)
                                        </Label>
                                        <Input
                                            id="cost"
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            value={data.cost}
                                            onChange={event => handleInputChange('cost', event.target.value)}
                                            className={`bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500 focus:ring-blue-500/20 focus:border-blue-500 ${getFieldError('cost') ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}`}
                                        />
                                        {getFieldError('cost') && (
                                            <p className="flex items-center gap-1 text-sm text-red-500">
                                                <AlertCircle className="h-3 w-3" />
                                                {getFieldError('cost')}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="description" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                                        Work Notes
                                    </Label>
                                    <Textarea
                                        id="description"
                                        value={data.description}
                                        onChange={event => handleInputChange('description', event.target.value)}
                                        placeholder="Diagnostics, follow-up actions, or additional notes."
                                        rows={4}
                                        className="resize-y bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500 focus:ring-blue-500/20 focus:border-blue-500"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="work_performed" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                                        Work Performed (optional)
                                    </Label>
                                    <Textarea
                                        id="work_performed"
                                        rows={3}
                                        value={data.work_performed}
                                        onChange={event => handleInputChange('work_performed', event.target.value)}
                                        placeholder="Summarize maintenance tasks completed."
                                        className="resize-y bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500 focus:ring-blue-500/20 focus:border-blue-500"
                                    />
                                    {getFieldError('work_performed') && (
                                        <p className="flex items-center gap-1 text-sm text-red-500">
                                            <AlertCircle className="h-3 w-3" />
                                            {getFieldError('work_performed')}
                                        </p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="parts_replaced" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                                        Parts Replaced (optional)
                                    </Label>
                                    <Textarea
                                        id="parts_replaced"
                                        rows={3}
                                        value={data.parts_replaced}
                                        onChange={event => handleInputChange('parts_replaced', event.target.value)}
                                        placeholder="List parts or consumables used."
                                        className="resize-y bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500 focus:ring-blue-500/20 focus:border-blue-500"
                                    />
                                    {getFieldError('parts_replaced') && (
                                        <p className="flex items-center gap-1 text-sm text-red-500">
                                            <AlertCircle className="h-3 w-3" />
                                            {getFieldError('parts_replaced')}
                                        </p>
                                    )}
                                </div>

                                <div className="rounded-lg border border-dashed border-blue-300/70 bg-blue-50/60 p-4 text-sm text-blue-900 shadow-sm dark:border-blue-800/60 dark:bg-blue-900/20 dark:text-blue-100">
                                    <div className="flex items-center gap-2 font-medium">
                                        <Sparkles className="h-4 w-4" />
                                        Predictive scheduling insights
                                    </div>
                                    <p className="mt-2 text-xs leading-relaxed">
                                        Interval-based suggestions will surface here once maintenance types include interval settings. Configure them to unlock proactive reminders and forecasting.
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
                                    <Button
                                        type="button"
                                        variant="outline"
                                        asChild
                                        className="border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700"
                                    >
                                        <Link href="/maintenance">Cancel</Link>
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={
                                            processing ||
                                            hasFrontendErrors ||
                                            !data.truck_id ||
                                            !data.maintenance_type_id ||
                                            !data.scheduled_date ||
                                            !data.status
                                        }
                                        className="min-w-[170px] bg-gradient-to-r from-blue-500 to-blue-600 px-6 text-white shadow-lg transition-all duration-200 hover:from-blue-600 hover:to-blue-700 hover:shadow-xl"
                                    >
                                        {processing ? (
                                            <>
                                                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-white"></div>
                                                Saving...
                                            </>
                                        ) : (
                                            <>
                                                <ClipboardList className="mr-2 h-4 w-4" />
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
        </AppLayout>
    );
}
