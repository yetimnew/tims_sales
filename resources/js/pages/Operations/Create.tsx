import { useEffect, useMemo, useRef, useState, useCallback, type FormEventHandler } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { validateOperation, type ValidationErrors } from '@/lib/validation';
import { toast } from '@/hooks/use-toast';
import {
    AlertCircle,
    ArrowLeft,
    ArrowUp,
    Calendar,
    ClipboardList,
    Rocket,
    Save,
    CheckCircle,
} from 'lucide-react';

interface Customer {
    id: number;
    name: string;
}

interface Region {
    id: number;
    name: string;
}

interface Zone {
    id: number;
    name: string;
    region_id: number;
    status?: string | null;
}

interface Woreda {
    id: number;
    name: string;
    zone_id: number;
    status?: string | null;
}

interface Place {
    id: number;
    name: string;
    woreda_id: number;
    status?: string | null;
}

interface DestinationScopeOption {
    value: OperationFormData['destination_scope'];
    label: string;
}

interface CargoTypeOption {
    id: number;
    name: string;
    category?: string | null;
}

interface CargoServiceTypeOption {
    value: OperationFormData['cargo_service_type'];
    label: string;
}

interface OperationsCreateProps {
    customers: Customer[];
    regions: Region[];
    zones: Zone[];
    woredas: Woreda[];
    places: Place[];
    destinationScopes: DestinationScopeOption[];
    cargoTypes: CargoTypeOption[];
    cargoServiceTypes: CargoServiceTypeOption[];
}

type OperationFormData = {
    operationid: string;
    customer_id: string;
    startdate: string;
    volume: string;
    cargo_type_id: string;
    cargo_service_type: 'relief' | 'commercial';
    km: string;
    tariff: string;
    remark: string;
    status: 'active' | 'inactive';
    destination_scope: 'region' | 'zone' | 'woreda' | 'place';
    destination_id: string;
};

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Operations',
        href: '/operations',
    },
    {
        title: 'Create',
        href: '/operations/create',
    },
];

type RecentSelections = {
    customers: string[];
    cargoTypes: string[];
};

const RECENT_SELECTIONS_KEY = 'operations_recent_selections';

export default function OperationsCreate({ customers, regions, zones, woredas, places, destinationScopes, cargoTypes, cargoServiceTypes }: OperationsCreateProps) {
    const { data, setData, post, processing, errors, reset } = useForm<OperationFormData>({
        operationid: '',
        customer_id: '',
        startdate: '',
        volume: '',
        cargo_type_id: '',
        cargo_service_type: 'commercial',
        km: '',
        tariff: '',
        remark: '',
        status: 'active',
        destination_scope: 'region',
        destination_id: '',
    });

    const [frontendErrors, setFrontendErrors] = useState<ValidationErrors>({});
    const [isDirty, setIsDirty] = useState(false);
    const [showScrollTop, setShowScrollTop] = useState(false);
    const [recentCustomers, setRecentCustomers] = useState<string[]>([]);
    const [recentCargoTypes, setRecentCargoTypes] = useState<string[]>([]);
    const scrollContainerRef = useRef<HTMLFormElement | null>(null);

    const hasErrors = useMemo(() => Object.keys(errors).length > 0 || Object.keys(frontendErrors).length > 0, [errors, frontendErrors]);

    useEffect(() => {
        const errorMessages = Object.values(errors)
            .flatMap(message => (Array.isArray(message) ? message : message ? [message] : []))
            .filter((message): message is string => Boolean(message))
            .map(message => (typeof message === 'string' ? message : String(message)));

        if (errorMessages.length > 0) {
            toast({
                title: '⚠️ Validation Error',
                description: errorMessages.join(', '),
                variant: 'destructive',
            });
        }
    }, [errors]);

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

    const loadRecentSelections = useCallback(() => {
        if (typeof window === 'undefined') {
            return;
        }

        try {
            const storedValue = window.localStorage.getItem(RECENT_SELECTIONS_KEY);

            if (!storedValue) {
                return;
            }

            const parsed: RecentSelections = JSON.parse(storedValue);

            if (Array.isArray(parsed.customers)) {
                setRecentCustomers(parsed.customers.slice(0, 5));
            }

            if (Array.isArray(parsed.cargoTypes)) {
                setRecentCargoTypes(parsed.cargoTypes.slice(0, 5));
            }
        } catch (error) {
            console.error('Failed to load recent selections', error);
        }
    }, []);

    useEffect(() => {
        loadRecentSelections();
    }, [loadRecentSelections]);

    const persistRecentSelections = useCallback((next: RecentSelections) => {
        if (typeof window === 'undefined') {
            return;
        }

        try {
            window.localStorage.setItem(RECENT_SELECTIONS_KEY, JSON.stringify(next));
        } catch (error) {
            console.error('Failed to persist recent selections', error);
        }
    }, []);

    const updateRecentSelection = useCallback((field: 'customer' | 'cargoType', value: string) => {
        if (!value) {
            return;
        }

        if (field === 'customer') {
            setRecentCustomers(prev => {
                const next = [value, ...prev.filter(existing => existing !== value)].slice(0, 5);
                persistRecentSelections({ customers: next, cargoTypes: recentCargoTypes });
                return next;
            });
        } else {
            setRecentCargoTypes(prev => {
                const next = [value, ...prev.filter(existing => existing !== value)].slice(0, 5);
                persistRecentSelections({ customers: recentCustomers, cargoTypes: next });
                return next;
            });
        }
    }, [persistRecentSelections, recentCargoTypes, recentCustomers]);

    const handleScrollToTop = () => {
        scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const setFieldError = (field: keyof OperationFormData, message: string) => {
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

    const validateField = (field: keyof OperationFormData, value: string) => {
        const nextValues: OperationFormData = { ...data, [field]: value } as OperationFormData;
        const fieldErrors = validateOperation(nextValues);
        setFieldError(field, fieldErrors[field] ?? '');
    };

    const handleFieldChange = (field: keyof OperationFormData, value: string) => {
        if (field === 'destination_scope') {
            setData('destination_scope', value as OperationFormData['destination_scope']);
            setData('destination_id', '');
            setFieldError('destination_id', '');
            validateField(field, value);
            setIsDirty(true);
            return;
        }

        setData(field, value as OperationFormData[keyof OperationFormData]);
        validateField(field, value);
        setIsDirty(true);

        if (field === 'customer_id') {
            updateRecentSelection('customer', value);
        }

        if (field === 'cargo_type_id') {
            updateRecentSelection('cargoType', value);
        }
    };

    const submit: FormEventHandler = event => {
        event.preventDefault();

        const validationResults = validateOperation(data);
        if (Object.keys(validationResults).length > 0) {
            setFrontendErrors(validationResults);
            return;
        }

        post('/operations', {
            preserveScroll: true,
            onSuccess: () => {
                setFrontendErrors({});
                setIsDirty(false);
                reset();
                setData('status', 'active');
                setData('cargo_type_id', '');
                setData('cargo_service_type', 'commercial');
                setData('destination_scope', 'region');
                setData('destination_id', '');
                setFieldError('destination_id', '');
                toast({
                    title: '✅ Operation Created',
                    description: 'The operation has been registered successfully.',
                });
            },
        });
    };

    const getFieldError = (field: keyof OperationFormData) => {
        return errors[field] || frontendErrors[field] || '';
                                <div className="flex items-center gap-2.5 text-sm">
                                    <div className="rounded-md bg-sky-100 p-1.5 text-sky-600 dark:bg-sky-900/30 dark:text-sky-400">
                                        <Calendar className="h-4 w-4" />
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">Scheduling &amp; Cargo Profile</h2>
                                        <p className="text-xs text-muted-foreground">Define timelines, service type, and planned throughput for this engagement.</p>
                                    </div>
                                </div>

    };

    const safeCustomers = useMemo(() => (Array.isArray(customers) ? customers : []), [customers]);
    const safeRegions = useMemo(() => (Array.isArray(regions) ? regions : []), [regions]);
    const safeZones = useMemo(() => (Array.isArray(zones) ? zones : []), [zones]);
    const safeWoredas = useMemo(() => (Array.isArray(woredas) ? woredas : []), [woredas]);
    const safePlaces = useMemo(() => (Array.isArray(places) ? places : []), [places]);
    const safeCargoTypes = useMemo(() => (Array.isArray(cargoTypes) ? cargoTypes : []), [cargoTypes]);
    const safeCargoServiceTypes = useMemo(
        () => (Array.isArray(cargoServiceTypes) ? cargoServiceTypes : []),
        [cargoServiceTypes]
    );
    const destinationScopeOptions = useMemo(
        () => (Array.isArray(destinationScopes) ? destinationScopes : []),
        [destinationScopes]
    );

    const destinationOptions = useMemo(() => {
        switch (data.destination_scope) {
            case 'region':
                return safeRegions.map(region => ({ value: region.id.toString(), label: region.name }));
            case 'zone':
                return safeZones.map(zone => ({ value: zone.id.toString(), label: zone.name }));
            case 'woreda':
                return safeWoredas.map(woreda => ({ value: woreda.id.toString(), label: woreda.name }));
            case 'place':
                return safePlaces.map(place => ({ value: place.id.toString(), label: place.name }));
            default:
                return [];
        }
    }, [data.destination_scope, safeRegions, safeZones, safeWoredas, safePlaces]);

    const selectedDestinationScopeLabel = useMemo(
        () => destinationScopeOptions.find(option => option.value === data.destination_scope)?.label ?? null,
        [destinationScopeOptions, data.destination_scope]
    );

    useEffect(() => {
        if (!data.destination_id) {
            return;
        }

        const stillValid = destinationOptions.some(option => option.value === data.destination_id);

        if (!stillValid) {
            setData('destination_id', '');
            setFieldError('destination_id', 'Destination selection is required');
        }
    }, [destinationOptions, data.destination_id, setData]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Create Operation" />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-hidden rounded-xl p-4">
                <Card className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-slate-200/70 bg-white/95 text-card-foreground shadow-xl backdrop-blur-lg dark:border-slate-800/60 dark:bg-slate-900/70">
                    <CardHeader className="px-6 pb-0">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                            <div className="flex items-start gap-4">
                                <div className="rounded-xl bg-indigo-100 p-2 text-indigo-600 shadow-sm dark:bg-indigo-900/30 dark:text-indigo-400">
                                    <ClipboardList className="h-5 w-5" />
                                </div>
                                <div>
                                    <CardTitle className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
                                        Register New Operation
                                    </CardTitle>
                                    <CardDescription className="text-sm text-slate-600 dark:text-slate-400">
                                        Configure a customer engagement, logistics scope, and commercial profile in a single workflow.
                                    </CardDescription>
                                </div>
                            </div>
                            <div className="flex flex-wrap items-center gap-3">
                                <Button variant="ghost" size="sm" asChild>
                                    <Link href="/operations">
                                        <ArrowLeft className="mr-2 h-4 w-4" />
                                        Back to Operations
                                    </Link>
                                </Button>
                                {isDirty && (
                                    <div className="flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1.5 text-sm font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                                        <Save className="h-3 w-3" />
                                        Unsaved Changes
                                    </div>
                                )}
                                <div className="flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1.5 text-sm font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                                    <div className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
                                    Operations Control
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
                            {hasErrors && (
                                <div className="flex items-start gap-3 rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-destructive">
                                    <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0" />
                                    <div>
                                        <h3 className="font-semibold">Please review the highlighted fields</h3>
                                        <p className="text-sm opacity-80">
                                            Correct the validation errors before submitting the operation.
                                        </p>
                                    </div>
                                </div>
                            )}

                            <section className="space-y-4 rounded-xl border border-slate-200/60 bg-white/75 p-5 shadow-sm dark:border-slate-800/70 dark:bg-slate-900/35">
                                <div className="flex items-center gap-2.5 text-sm">
                                    <div className="rounded-md bg-indigo-100 p-1.5 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400">
                                        <Rocket className="h-4 w-4" />
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">Operation Overview</h2>
                                        <p className="text-xs text-muted-foreground">Identify the operation and connect it to the customer ecosystem.</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="operationid">Operation ID <span className="text-red-500">*</span></Label>
                                        <Input
                                            id="operationid"
                                            type="text"
                                            value={data.operationid}
                                            onChange={event => handleFieldChange('operationid', event.target.value)}
                                            placeholder="e.g., OP-2025-0042"
                                            className={getFieldError('operationid') ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}
                                        />
                                        {getFieldError('operationid') && (
                                            <p className="flex items-center gap-1 text-sm text-red-500">
                                                <AlertCircle className="h-3 w-3" />
                                                {getFieldError('operationid')}
                                            </p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="customer_id">Customer <span className="text-red-500">*</span></Label>
                                        <Select
                                            value={data.customer_id}
                                            onValueChange={value => handleFieldChange('customer_id', value)}
                                        >
                                            <SelectTrigger className={getFieldError('customer_id') ? 'border-red-500 focus:ring-red-500/20' : ''}>
                                                <SelectValue placeholder="Select a customer" />
                                            </SelectTrigger>
                                            <SelectContent className="max-h-72">
                                                {safeCustomers.map(customer => (
                                                    <SelectItem key={customer.id} value={customer.id.toString()}>
                                                        {customer.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {getFieldError('customer_id') && (
                                            <p className="flex items-center gap-1 text-sm text-red-500">
                                                <AlertCircle className="h-3 w-3" />
                                                {getFieldError('customer_id')}
                                            </p>
                                        )}
                                        {!getFieldError('customer_id') && recentCustomers.length > 0 && (
                                            <div className="flex flex-wrap gap-2 pt-1">
                                                <p className="text-xs text-muted-foreground">Recent:</p>
                                                {recentCustomers
                                                    .map(customerId => safeCustomers.find(customer => customer.id.toString() === customerId))
                                                    .filter((customer): customer is Customer => Boolean(customer))
                                                    .map(customer => (
                                                        <Button
                                                            key={customer.id}
                                                            type="button"
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-7 px-2 text-xs"
                                                            onClick={() => handleFieldChange('customer_id', customer.id.toString())}
                                                        >
                                                            {customer.name}
                                                        </Button>
                                                    ))}
                                            </div>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="status">Status <span className="text-red-500">*</span></Label>
                                        <Select
                                            value={data.status}
                                            onValueChange={value => handleFieldChange('status', value)}
                                        >
                                            <SelectTrigger className={getFieldError('status') ? 'border-red-500 focus:ring-red-500/20' : ''}>
                                                <SelectValue placeholder="Select status" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="active">Active</SelectItem>
                                                <SelectItem value="inactive">Inactive</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        {getFieldError('status') && (
                                            <p className="flex items-center gap-1 text-sm text-red-500">
                                                <AlertCircle className="h-3 w-3" />
                                                {getFieldError('status')}
                                            </p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="destination_scope">Destination Scope <span className="text-red-500">*</span></Label>
                                        <Select
                                            value={data.destination_scope}
                                            onValueChange={value => handleFieldChange('destination_scope', value)}
                                        >
                                            <SelectTrigger className={getFieldError('destination_scope') ? 'border-red-500 focus:ring-red-500/20' : ''}>
                                                <SelectValue placeholder="Select scope" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {destinationScopeOptions.map(scope => (
                                                    <SelectItem key={scope.value} value={scope.value}>
                                                        {scope.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {getFieldError('destination_scope') && (
                                            <p className="flex items-center gap-1 text-sm text-red-500">
                                                <AlertCircle className="h-3 w-3" />
                                                {getFieldError('destination_scope')}
                                            </p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="destination_id">Destination <span className="text-red-500">*</span></Label>
                                        <Select
                                            value={data.destination_id}
                                            onValueChange={value => handleFieldChange('destination_id', value)}
                                            disabled={destinationOptions.length === 0}
                                        >
                                            <SelectTrigger className={getFieldError('destination_id') ? 'border-red-500 focus:ring-red-500/20' : ''}>
                                                <SelectValue placeholder="Select destination" />
                                            </SelectTrigger>
                                            <SelectContent className="max-h-72">
                                                {destinationOptions.length > 0 ? (
                                                    destinationOptions.map(option => (
                                                        <SelectItem key={option.value} value={option.value}>
                                                            {option.label}
                                                        </SelectItem>
                                                    ))
                                                ) : (
                                                    <SelectItem value="__empty" disabled>
                                                        No options available
                                                    </SelectItem>
                                                )}
                                            </SelectContent>
                                        </Select>
                                        {getFieldError('destination_id') && (
                                            <p className="flex items-center gap-1 text-sm text-red-500">
                                                <AlertCircle className="h-3 w-3" />
                                                {getFieldError('destination_id')}
                                            </p>
                                        )}
                                        <p className="text-xs text-muted-foreground">
                                            {selectedDestinationScopeLabel
                                                ? `Showing ${selectedDestinationScopeLabel.toLowerCase()} destinations.`
                                                : 'Select a destination scope to populate options.'}
                                        </p>
                                    </div>
                                </div>
                            </section>

                            <section className="space-y-4 rounded-xl border border-slate-200/60 bg-white/75 p-5 shadow-sm dark:border-slate-800/70 dark:bg-slate-900/35">
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="startdate">Start Date <span className="text-red-500">*</span></Label>
                                        <div className="group relative">
                                            <Input
                                                id="startdate"
                                                type="date"
                                                value={data.startdate}
                                                onChange={event => handleFieldChange('startdate', event.target.value)}
                                                className={`pl-4 pr-10 py-2.5 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-3 [&::-webkit-calendar-picker-indicator]:h-4 [&::-webkit-calendar-picker-indicator]:w-4 [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0 ${getFieldError('startdate') ? 'border-red-500 focus:border-red-500' : ''}`}
                                            />
                                            <div
                                                className="absolute right-3 top-1/2 z-20 -translate-y-1/2 cursor-pointer"
                                                onClick={() => {
                                                    const input = document.getElementById('startdate') as HTMLInputElement | null;
                                                    input?.showPicker?.();
                                                }}
                                            >
                                                <Calendar className="h-4 w-4 text-slate-500 transition-colors duration-200 group-hover:text-slate-600 dark:text-slate-400 dark:group-hover:text-slate-300" />
                                            </div>
                                        </div>
                                        {getFieldError('startdate') && (
                                            <p className="flex items-center gap-1 text-sm text-red-500">
                                                <AlertCircle className="h-3 w-3" />
                                                {getFieldError('startdate')}
                                            </p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="cargo_service_type">Cargo Service Type <span className="text-red-500">*</span></Label>
                                        <Select
                                            value={data.cargo_service_type}
                                            onValueChange={value => handleFieldChange('cargo_service_type', value)}
                                        >
                                            <SelectTrigger className={getFieldError('cargo_service_type') ? 'border-red-500 focus:ring-red-500/20' : ''}>
                                                <SelectValue placeholder="Select service type" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {safeCargoServiceTypes.map(service => (
                                                    <SelectItem key={service.value} value={service.value}>
                                                        {service.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {getFieldError('cargo_service_type') && (
                                            <p className="flex items-center gap-1 text-sm text-red-500">
                                                <AlertCircle className="h-3 w-3" />
                                                {getFieldError('cargo_service_type')}
                                            </p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="cargo_type_id">Cargo Type <span className="text-red-500">*</span></Label>
                                        <Select
                                            value={data.cargo_type_id}
                                            onValueChange={value => handleFieldChange('cargo_type_id', value)}
                                        >
                                            <SelectTrigger className={getFieldError('cargo_type_id') ? 'border-red-500 focus:ring-red-500/20' : ''}>
                                                <SelectValue placeholder="Select cargo type" />
                                            </SelectTrigger>
                                            <SelectContent className="max-h-72">
                                                {safeCargoTypes.map(type => (
                                                    <SelectItem key={type.id} value={type.id.toString()}>
                                                        {type.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {getFieldError('cargo_type_id') && (
                                            <p className="flex items-center gap-1 text-sm text-red-500">
                                                <AlertCircle className="h-3 w-3" />
                                                {getFieldError('cargo_type_id')}
                                            </p>
                                        )}
                                        {recentCargoTypes.length > 0 && (
                                            <div className="flex flex-wrap items-center gap-2 pt-1">
                                                <p className="text-xs text-muted-foreground">Recent:</p>
                                                {recentCargoTypes
                                                    .map(typeId => safeCargoTypes.find(type => type.id.toString() === typeId))
                                                    .filter((type): type is CargoTypeOption => Boolean(type))
                                                    .map(type => (
                                                        <Button
                                                            key={type.id}
                                                            type="button"
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-7 px-2 text-xs"
                                                            onClick={() => handleFieldChange('cargo_type_id', type.id.toString())}
                                                        >
                                                            {type.name}
                                                        </Button>
                                                    ))}
                                            </div>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="volume">Planned Volume (MT) <span className="text-red-500">*</span></Label>
                                        <Input
                                            id="volume"
                                            type="number"
                                            step="0.01"
                                            value={data.volume}
                                            onChange={event => handleFieldChange('volume', event.target.value)}
                                            placeholder="e.g., 1200"
                                            className={getFieldError('volume') ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}
                                        />
                                        {getFieldError('volume') && (
                                            <p className="flex items-center gap-1 text-sm text-red-500">
                                                <AlertCircle className="h-3 w-3" />
                                                {getFieldError('volume')}
                                            </p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="km">Distance (KM) <span className="text-red-500">*</span></Label>
                                        <Input
                                            id="km"
                                            type="number"
                                            step="0.01"
                                            value={data.km}
                                            onChange={event => handleFieldChange('km', event.target.value)}
                                            placeholder="e.g., 520"
                                            className={getFieldError('km') ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}
                                        />
                                        {getFieldError('km') && (
                                            <p className="flex items-center gap-1 text-sm text-red-500">
                                                <AlertCircle className="h-3 w-3" />
                                                {getFieldError('km')}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </section>

                            <section className="space-y-4 rounded-xl border border-slate-200/60 bg-white/75 p-5 shadow-sm dark:border-slate-800/70 dark:bg-slate-900/35">
                                <div className="flex items-center gap-2.5 text-sm">
                                    <div className="rounded-md bg-emerald-100 p-1.5 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
                                        <CheckCircle className="h-4 w-4" />
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">Commercial Parameters</h2>
                                        <p className="text-xs text-muted-foreground">Set tariff assumptions and capture supporting notes for the ops &amp; finance teams.</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="tariff">Tariff (per ton-km) <span className="text-red-500">*</span></Label>
                                        <Input
                                            id="tariff"
                                            type="number"
                                            step="0.01"
                                            value={data.tariff}
                                            onChange={event => handleFieldChange('tariff', event.target.value)}
                                            placeholder="e.g., 2.75"
                                            className={getFieldError('tariff') ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}
                                        />
                                        {getFieldError('tariff') && (
                                            <p className="flex items-center gap-1 text-sm text-red-500">
                                                <AlertCircle className="h-3 w-3" />
                                                {getFieldError('tariff')}
                                            </p>
                                        )}
                                    </div>

                                    <div className="space-y-2 md:col-span-2">
                                        <Label htmlFor="remark">Description / Notes</Label>
                                        <Textarea
                                            id="remark"
                                            value={data.remark}
                                            onChange={event => handleFieldChange('remark', event.target.value)}
                                            placeholder="Add any commercial clauses, delivery SLAs, or operational reminders"
                                            className="min-h-[120px]"
                                        />
                                        {getFieldError('remark') && (
                                            <p className="flex items-center gap-1 text-sm text-red-500">
                                                <AlertCircle className="h-3 w-3" />
                                                {getFieldError('remark')}
                                            </p>
                                        )}
                                    </div>
                                </div>


                            </section>
                            <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200/70 bg-white/80 px-6 py-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/40">
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                                        <span className="text-red-500">*</span>
                                        <span>All required fields must be completed</span>
                                    </div>
                                    {isDirty && (
                                        <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400">
                                            <Save className="h-3 w-3" />
                                            <span>You have unsaved changes</span>
                                        </div>
                                    )}
                                </div>
                                <div className="flex gap-3">
                                    <Button type="button" variant="outline" asChild className="border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700">
                                        <Link href="/operations">Cancel</Link>
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={
                                            processing
                                            || Object.keys(frontendErrors).length > 0
                                            || !data.destination_id
                                            || !data.cargo_type_id
                                        }
                                        className="min-w-[160px] bg-gradient-to-r from-indigo-600 to-indigo-700 px-6 text-white shadow-lg transition-all duration-200 hover:from-indigo-700 hover:to-indigo-800 hover:shadow-xl"
                                    >
                                        {processing ? (
                                            <>
                                                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-white" />
                                                Creating...
                                            </>
                                        ) : (
                                            <>
                                                <CheckCircle className="mr-2 h-4 w-4" />
                                                Create Operation
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
