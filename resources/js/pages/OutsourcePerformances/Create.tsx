import { useCallback, useEffect, useMemo, useRef, useState, type FormEventHandler } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { PlaceCombobox } from '@/components/place-combobox';
import { useToast } from '@/hooks/use-toast';
import { validateOutsourcePerformance, type ValidationErrors } from '@/lib/validation';
import type { BreadcrumbItem } from '@/types';
import {
    AlertCircle,
    ArrowLeft,
    CheckCircle,
    ClipboardList,
    Loader2,
    MapPin,
    Package,
    Save,
    Wallet,
} from 'lucide-react';

interface OutsourceOption {
    id: number;
    name: string;
}

interface OperationOption {
    id: number;
    label: string;
    customer?: {
        id: number;
        name: string;
    } | null;
}

interface PlaceOption {
    id: number;
    name: string;
}

interface StatusOption {
    label: string;
    value: string;
}

interface OutsourcePerformancesCreateProps {
    outsources: OutsourceOption[];
    operations: OperationOption[];
    places: PlaceOption[];
    statusOptions: StatusOption[];
}

type OutsourcePerformanceFormData = {
    outsource_id: string;
    operation_id: string;
    trip_number: string;
    dispatch_date: string;
    from_place_id: string;
    to_place_id: string;
    distance_km: string;
    cargo_volume_mt: string;
    tonkm: string;
    cost: string;
    remarks: string;
    status: string;
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Outsource Performances', href: '/outsource-performances' },
    { title: 'Create', href: '/outsource-performances/create' },
];

type DistanceStatus = {
    found: boolean;
    message: string;
} | null;

const RECENT_OUTSOURCE_PERFORMANCE_KEY = 'outsource_performance_recent_selections';

interface RecentSelections {
    outsources: string[];
    operations: string[];
}

const computeTonKilometers = (distance: string, cargo: string): string => {
    const distanceValue = Number(distance || 0);
    const cargoValue = Number(cargo || 0);

    if (!Number.isFinite(distanceValue) || !Number.isFinite(cargoValue)) {
        return '0.00';
    }

    const tonKm = distanceValue * cargoValue;
    if (tonKm <= 0) {
        return '0.00';
    }

    return tonKm.toFixed(2);
};

export default function OutsourcePerformancesCreate({ outsources, operations, places, statusOptions }: OutsourcePerformancesCreateProps) {
    const { toast } = useToast();
    const defaultStatus = statusOptions[0]?.value ?? 'active';

    const initialFormState: OutsourcePerformanceFormData = {
        outsource_id: '',
        operation_id: '',
        trip_number: '',
        dispatch_date: '',
        from_place_id: '',
        to_place_id: '',
        distance_km: '',
        cargo_volume_mt: '',
        tonkm: '0.00',
        cost: '',
        remarks: '',
        status: defaultStatus,
    };

    const initialValuesRef = useRef<OutsourcePerformanceFormData>(initialFormState);

    const {
        data,
        setData,
        post,
        processing,
        errors,
        reset,
        transform,
    } = useForm<OutsourcePerformanceFormData>({ ...initialValuesRef.current });

    const [clientErrors, setClientErrors] = useState<ValidationErrors>({});
    const [distanceStatus, setDistanceStatus] = useState<DistanceStatus>(null);
    const [isDirty, setIsDirty] = useState(false);
    const [distanceLoading, setDistanceLoading] = useState(false);
    const [recent, setRecent] = useState<RecentSelections>({ outsources: [], operations: [] });

    const statusOptionValues = useMemo(() => (statusOptions.length ? statusOptions : [{ label: 'Active', value: 'active' }]), [statusOptions]);

    useEffect(() => {
        try {
            const raw = localStorage.getItem(RECENT_OUTSOURCE_PERFORMANCE_KEY);
            if (raw) {
                const parsed = JSON.parse(raw) as RecentSelections;
                setRecent({
                    outsources: Array.isArray(parsed.outsources) ? parsed.outsources.slice(0, 6) : [],
                    operations: Array.isArray(parsed.operations) ? parsed.operations.slice(0, 6) : [],
                });
            }
        } catch (error) {
            console.warn('Unable to load recent selections:', error);
        }
    }, []);

    useEffect(() => {
        if (Object.keys(errors).length === 0) {
            return;
        }

        const backendMessages = Object.values(errors)
            .flat()
            .map(message => (Array.isArray(message) ? message.join(', ') : String(message)));

        if (backendMessages.length > 0) {
            toast({
                variant: 'destructive',
                title: 'Validation error',
                description: backendMessages.join('\n'),
            });
        }
    }, [errors, toast]);

    const updateTonKilometers = useCallback((nextState: OutsourcePerformanceFormData) => {
        const computed = computeTonKilometers(nextState.distance_km, nextState.cargo_volume_mt);
        setData('tonkm', computed);
    }, [setData]);

    const handleDistanceAutoFill = useCallback(async (originId: string, destinationId: string, nextState: OutsourcePerformanceFormData) => {
        if (!originId || !destinationId) {
            return;
        }

        setDistanceLoading(true);
        setDistanceStatus(null);

        try {
            const params = new URLSearchParams({
                from_place_id: originId,
                to_place_id: destinationId,
            });

            const response = await fetch(`/performances/calculate-distance?${params.toString()}`, {
                method: 'GET',
                headers: {
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
                credentials: 'same-origin',
            });

            if (!response.ok) {
                throw new Error(`Distance lookup failed with status ${response.status}`);
            }

            const result = await response.json() as { distance?: number | string; found?: boolean; note?: string };
            const numericDistance = typeof result.distance === 'number'
                ? result.distance
                : Number(result.distance ?? 0);

            const safeDistance = Number.isFinite(numericDistance) ? numericDistance : 0;
            const formattedDistance = safeDistance.toFixed(2);

            setData('distance_km', formattedDistance);

            const tonKm = computeTonKilometers(formattedDistance, nextState.cargo_volume_mt);
            setData('tonkm', tonKm);

            setDistanceStatus({
                found: Boolean(result.found),
                message: result.found
                    ? `Distance auto-filled from registered route (${formattedDistance} km).`
                    : result.note ?? 'Distance for this route is not registered yet. Value set to 0 km.',
            });
        } catch (error) {
            console.error('Distance auto-fill failed:', error);
            setData('distance_km', '0.00');
            const tonKm = computeTonKilometers('0.00', nextState.cargo_volume_mt);
            setData('tonkm', tonKm);
            setDistanceStatus({
                found: false,
                message: 'Unable to resolve distance. Distance was set to 0 km.',
            });
        }
        finally {
            setDistanceLoading(false);
        }
    }, [setData]);

    const setFieldError = useCallback((field: keyof OutsourcePerformanceFormData, message: string | undefined) => {
        setClientErrors(previous => {
            const next = { ...previous };
            if (message) {
                next[field] = message;
            } else {
                delete next[field];
            }
            return next;
        });
    }, []);

    const handleFieldChange = useCallback(<K extends keyof OutsourcePerformanceFormData>(field: K, value: OutsourcePerformanceFormData[K]) => {
        const nextState: OutsourcePerformanceFormData = { ...data, [field]: value } as OutsourcePerformanceFormData;
        setData(field, value);
        setIsDirty(true);

        if (clientErrors[field]) {
            setFieldError(field, undefined);
        }

        if (field === 'distance_km' || field === 'cargo_volume_mt') {
            updateTonKilometers(nextState);
        }

        if (field === 'outsource_id' && typeof value === 'string') {
            setRecent(previous => {
                const nextOutsources = [value, ...previous.outsources.filter(item => item !== value)].slice(0, 6);
                const updated = { ...previous, outsources: nextOutsources };
                try {
                    localStorage.setItem(RECENT_OUTSOURCE_PERFORMANCE_KEY, JSON.stringify(updated));
                } catch (error) {
                    console.warn('Unable to persist recent selections:', error);
                }
                return updated;
            });
        }

        if (field === 'operation_id' && typeof value === 'string') {
            setRecent(previous => {
                const nextOperations = [value, ...previous.operations.filter(item => item !== value)].slice(0, 6);
                const updated = { ...previous, operations: nextOperations };
                try {
                    localStorage.setItem(RECENT_OUTSOURCE_PERFORMANCE_KEY, JSON.stringify(updated));
                } catch (error) {
                    console.warn('Unable to persist recent selections:', error);
                }
                return updated;
            });
        }

        if (field === 'from_place_id' || field === 'to_place_id') {
            if (!nextState.from_place_id || !nextState.to_place_id) {
                setDistanceStatus(null);
                setDistanceLoading(false);
                setData('distance_km', '');
                updateTonKilometers({ ...nextState, distance_km: '' });
                return;
            }

            void handleDistanceAutoFill(nextState.from_place_id, nextState.to_place_id, nextState);
        }
    }, [clientErrors, data, handleDistanceAutoFill, setData, setFieldError, updateTonKilometers]);

    const validateClient = useCallback((payload: OutsourcePerformanceFormData) => {
        const results = validateOutsourcePerformance(payload);
        setClientErrors(results);
        return Object.keys(results).length === 0;
    }, []);

    const submit: FormEventHandler = event => {
        event.preventDefault();

        const trimmed: OutsourcePerformanceFormData = {
            outsource_id: data.outsource_id.trim(),
            operation_id: data.operation_id.trim(),
            trip_number: data.trip_number.trim(),
            dispatch_date: data.dispatch_date.trim(),
            from_place_id: data.from_place_id.trim(),
            to_place_id: data.to_place_id.trim(),
            distance_km: data.distance_km.trim(),
            cargo_volume_mt: data.cargo_volume_mt.trim(),
            tonkm: data.tonkm.trim(),
            cost: data.cost.trim(),
            remarks: data.remarks.trim(),
            status: data.status.trim(),
        };

        if (!validateClient(trimmed)) {
            toast({
                variant: 'destructive',
                title: 'Please review the form',
                description: 'Some fields need your attention before submission.',
            });
            return;
        }

        transform(() => ({
            ...trimmed,
            distance_km: trimmed.distance_km || null,
            cargo_volume_mt: trimmed.cargo_volume_mt || null,
            tonkm: trimmed.tonkm || null,
            cost: trimmed.cost || null,
            remarks: trimmed.remarks || null,
        }));

        post('/outsource-performances', {
            preserveScroll: true,
            onSuccess: () => {
                toast({
                    title: 'Trip logged',
                    description: 'The outsource performance record has been saved successfully.',
                });
                setClientErrors({});
                setDistanceStatus(null);
                setIsDirty(false);
                reset(initialValuesRef.current);
            },
            onError: () => {
                transform(data => data);
            },
            onFinish: () => {
                transform(data => data);
            },
        });
    };

    useEffect(() => {
        const initial = initialValuesRef.current;
        const dirty = (Object.keys(initial) as Array<keyof OutsourcePerformanceFormData>).some(key => data[key] !== initial[key]);
        setIsDirty(dirty);
    }, [data]);

    const generalError = errors.error ? String(errors.error) : '';

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Log Outsource Trip" />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-hidden rounded-xl p-4">
                <Card className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-slate-200/70 bg-white/95 text-card-foreground shadow-xl backdrop-blur-lg dark:border-slate-800/60 dark:bg-slate-900/70">
                    <CardHeader className="px-6 pb-0">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                            <div className="flex items-start gap-4">
                                <div className="rounded-xl bg-indigo-100 p-2 text-indigo-600 shadow-sm dark:bg-indigo-900/30 dark:text-indigo-300">
                                    <CheckCircle className="h-5 w-5" />
                                </div>
                                <div>
                                    <CardTitle className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Log Outsource Trip</CardTitle>
                                    <CardDescription className="text-sm text-slate-600 dark:text-slate-400">
                                        Capture vendor dispatch metrics, route details, and cost insights in one streamlined form.
                                    </CardDescription>
                                </div>
                            </div>
                            <div className="flex flex-wrap items-center gap-3">
                                <Button variant="ghost" size="sm" asChild>
                                    <Link href="/outsource-performances">
                                        <ArrowLeft className="mr-2 h-4 w-4" />
                                        Back to Trips
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
                                    Vendor Performance Control
                                </div>
                            </div>
                        </div>
                    </CardHeader>

                    <CardContent className="flex flex-1 flex-col overflow-hidden p-0">
                        <form onSubmit={submit} className="flex flex-1 flex-col gap-8 overflow-y-auto p-6 pb-24" noValidate>
                            {generalError && (
                                <Alert variant="destructive">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertDescription>{generalError}</AlertDescription>
                                </Alert>
                            )}

                            <section className="space-y-4 rounded-xl border border-slate-200/60 bg-white/75 p-5 shadow-sm dark:border-slate-800/70 dark:bg-slate-900/35">
                                <div className="flex items-center gap-2.5 text-sm">
                                    <div className="rounded-md bg-emerald-100 p-1.5 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
                                        <ClipboardList className="h-4 w-4" />
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">Trip Overview</h2>
                                        <p className="text-xs text-muted-foreground">Link the vendor, operation, and trip identifiers.</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                                    <div className="space-y-2">
                                        <Label htmlFor="outsource_id">
                                            Vendor <span className="text-red-500">*</span>
                                        </Label>
                                        <Select value={data.outsource_id} onValueChange={value => handleFieldChange('outsource_id', value)}>
                                            <SelectTrigger id="outsource_id" className={clientErrors.outsource_id ? 'border-red-500 focus-visible:ring-red-500/20' : ''}>
                                                <SelectValue placeholder="Select vendor" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {outsources.map(option => (
                                                    <SelectItem key={option.id} value={option.id.toString()}>
                                                        {option.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {clientErrors.outsource_id && (
                                            <p className="flex items-center gap-1 text-xs text-red-500">
                                                <AlertCircle className="h-3 w-3" />
                                                {clientErrors.outsource_id}
                                            </p>
                                        )}
                                        {recent.outsources.length > 0 && (
                                            <div className="flex flex-wrap gap-1 pt-1">
                                                {recent.outsources.map(id => {
                                                    const option = outsources.find(outsource => outsource.id.toString() === id);
                                                    if (!option) {
                                                        return null;
                                                    }

                                                    const isActive = data.outsource_id === id;
                                                    return (
                                                        <button
                                                            type="button"
                                                            key={id}
                                                            onClick={() => handleFieldChange('outsource_id', id)}
                                                            className={`rounded px-2 py-0.5 text-xs transition ${
                                                                isActive
                                                                    ? 'border-indigo-600 bg-indigo-600 text-white shadow-sm'
                                                                    : 'border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                                                            }`}
                                                        >
                                                            {option.name}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="operation_id">
                                            Operation <span className="text-red-500">*</span>
                                        </Label>
                                        <Select value={data.operation_id} onValueChange={value => handleFieldChange('operation_id', value)}>
                                            <SelectTrigger id="operation_id" className={clientErrors.operation_id ? 'border-red-500 focus-visible:ring-red-500/20' : ''}>
                                                <SelectValue placeholder="Select operation" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {operations.map(operation => (
                                                    <SelectItem key={operation.id} value={operation.id.toString()}>
                                                        {operation.label}
                                                        {operation.customer?.name ? ` — ${operation.customer.name}` : ''}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {clientErrors.operation_id && (
                                            <p className="flex items-center gap-1 text-xs text-red-500">
                                                <AlertCircle className="h-3 w-3" />
                                                {clientErrors.operation_id}
                                            </p>
                                        )}
                                        {recent.operations.length > 0 && (
                                            <div className="flex flex-wrap gap-1 pt-1">
                                                {recent.operations.map(id => {
                                                    const option = operations.find(operation => operation.id.toString() === id);
                                                    if (!option) {
                                                        return null;
                                                    }

                                                    const label = option.customer?.name
                                                        ? `${option.label} — ${option.customer.name}`
                                                        : option.label;

                                                    const isActive = data.operation_id === id;
                                                    return (
                                                        <button
                                                            type="button"
                                                            key={id}
                                                            onClick={() => handleFieldChange('operation_id', id)}
                                                            className={`rounded px-2 py-0.5 text-xs transition ${
                                                                isActive
                                                                    ? 'border-emerald-600 bg-emerald-600 text-white shadow-sm'
                                                                    : 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                                                            }`}
                                                        >
                                                            {label}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="trip_number">
                                            Trip Number <span className="text-red-500">*</span>
                                        </Label>
                                        <Input
                                            id="trip_number"
                                            value={data.trip_number}
                                            onChange={event => handleFieldChange('trip_number', event.target.value)}
                                            placeholder="e.g., OUT-TRIP-2309"
                                            className={clientErrors.trip_number ? 'border-red-500 focus-visible:ring-red-500/20' : ''}
                                        />
                                        {clientErrors.trip_number && (
                                            <p className="flex items-center gap-1 text-xs text-red-500">
                                                <AlertCircle className="h-3 w-3" />
                                                {clientErrors.trip_number}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                                    <div className="space-y-2">
                                        <Label htmlFor="dispatch_date">
                                            Dispatch Date <span className="text-red-500">*</span>
                                        </Label>
                                        <Input
                                            id="dispatch_date"
                                            type="date"
                                            value={data.dispatch_date}
                                            onChange={event => handleFieldChange('dispatch_date', event.target.value)}
                                            className={clientErrors.dispatch_date ? 'border-red-500 focus-visible:ring-red-500/20' : ''}
                                        />
                                        {clientErrors.dispatch_date && (
                                            <p className="flex items-center gap-1 text-xs text-red-500">
                                                <AlertCircle className="h-3 w-3" />
                                                {clientErrors.dispatch_date}
                                            </p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="status">
                                            Trip Status <span className="text-red-500">*</span>
                                        </Label>
                                        <Select value={data.status} onValueChange={value => handleFieldChange('status', value)}>
                                            <SelectTrigger id="status" className={clientErrors.status ? 'border-red-500 focus-visible:ring-red-500/20' : ''}>
                                                <SelectValue placeholder="Select status" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {statusOptionValues.map(option => (
                                                    <SelectItem key={option.value} value={option.value}>
                                                        {option.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {clientErrors.status && (
                                            <p className="flex items-center gap-1 text-xs text-red-500">
                                                <AlertCircle className="h-3 w-3" />
                                                {clientErrors.status}
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
                                        <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">Route & Distance</h2>
                                        <p className="text-xs text-muted-foreground">Select the origin and destination to auto-resolve registered distances.</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    <PlaceCombobox
                                        id="from_place_id"
                                        label="Origin"
                                        required
                                        value={data.from_place_id}
                                        places={places}
                                        placeholder="Search origin..."
                                        onSelect={value => handleFieldChange('from_place_id', value)}
                                        error={clientErrors.from_place_id}
                                    />
                                    <PlaceCombobox
                                        id="to_place_id"
                                        label="Destination"
                                        required
                                        value={data.to_place_id}
                                        places={places}
                                        placeholder="Search destination..."
                                        onSelect={value => handleFieldChange('to_place_id', value)}
                                        error={clientErrors.to_place_id}
                                    />
                                </div>

                                {distanceLoading && (
                                    <p className="flex items-center gap-2 rounded-lg border border-dashed border-slate-200/80 bg-slate-50/80 px-3 py-2 text-xs text-slate-600 dark:border-slate-700/70 dark:bg-slate-900/30 dark:text-slate-300">
                                        <Loader2 className="h-3 w-3 animate-spin" />
                                        Resolving registered distance...
                                    </p>
                                )}

                                {distanceStatus && (
                                    <Alert variant={distanceStatus.found ? 'default' : 'destructive'}>
                                        {distanceStatus.found ? (
                                            <CheckCircle className="h-4 w-4 text-emerald-500" />
                                        ) : (
                                            <AlertCircle className="h-4 w-4" />
                                        )}
                                        <AlertTitle>{distanceStatus.found ? 'Distance applied' : 'Distance missing'}</AlertTitle>
                                        <AlertDescription>{distanceStatus.message}</AlertDescription>
                                    </Alert>
                                )}

                                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                    <div className="space-y-2">
                                        <Label htmlFor="distance_km">Distance (km)</Label>
                                        <Input
                                            id="distance_km"
                                            value={data.distance_km}
                                            onChange={event => handleFieldChange('distance_km', event.target.value)}
                                            placeholder="e.g., 540"
                                            className={clientErrors.distance_km ? 'border-red-500 focus-visible:ring-red-500/20' : ''}
                                        />
                                        {clientErrors.distance_km && (
                                            <p className="flex items-center gap-1 text-xs text-red-500">
                                                <AlertCircle className="h-3 w-3" />
                                                {clientErrors.distance_km}
                                            </p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="cargo_volume_mt">Cargo Volume (MT)</Label>
                                        <Input
                                            id="cargo_volume_mt"
                                            value={data.cargo_volume_mt}
                                            onChange={event => handleFieldChange('cargo_volume_mt', event.target.value)}
                                            placeholder="e.g., 32.5"
                                            className={clientErrors.cargo_volume_mt ? 'border-red-500 focus-visible:ring-red-500/20' : ''}
                                        />
                                        {clientErrors.cargo_volume_mt && (
                                            <p className="flex items-center gap-1 text-xs text-red-500">
                                                <AlertCircle className="h-3 w-3" />
                                                {clientErrors.cargo_volume_mt}
                                            </p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="tonkm">Ton-Kilometres</Label>
                                        <Input
                                            id="tonkm"
                                            value={data.tonkm}
                                            readOnly
                                            className="bg-slate-50 text-slate-700 dark:bg-slate-900/40 dark:text-slate-200"
                                        />
                                    </div>
                                </div>
                            </section>

                            <section className="space-y-4 rounded-xl border border-slate-200/60 bg-white/75 p-5 shadow-sm dark:border-slate-800/70 dark:bg-slate-900/35">
                                <div className="flex items-center gap-2.5 text-sm">
                                    <div className="rounded-md bg-emerald-100 p-1.5 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
                                        <Wallet className="h-4 w-4" />
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">Cost & Notes</h2>
                                        <p className="text-xs text-muted-foreground">Record spend and supporting remarks for context.</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="cost">Trip Cost</Label>
                                        <Input
                                            id="cost"
                                            value={data.cost}
                                            onChange={event => handleFieldChange('cost', event.target.value)}
                                            placeholder="e.g., 125000"
                                            className={clientErrors.cost ? 'border-red-500 focus-visible:ring-red-500/20' : ''}
                                        />
                                        {clientErrors.cost && (
                                            <p className="flex items-center gap-1 text-xs text-red-500">
                                                <AlertCircle className="h-3 w-3" />
                                                {clientErrors.cost}
                                            </p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="remarks">Remarks</Label>
                                        <Textarea
                                            id="remarks"
                                            value={data.remarks}
                                            onChange={event => handleFieldChange('remarks', event.target.value)}
                                            placeholder="Add optional context such as special conditions or vendor notes"
                                            className={`min-h-[112px] ${clientErrors.remarks ? 'border-red-500 focus-visible:ring-red-500/20' : ''}`}
                                        />
                                        {clientErrors.remarks && (
                                            <p className="flex items-center gap-1 text-xs text-red-500">
                                                <AlertCircle className="h-3 w-3" />
                                                {clientErrors.remarks}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </section>

                            <section className="space-y-4 rounded-xl border border-dashed border-slate-300/70 bg-slate-50/70 p-5 text-sm text-muted-foreground dark:border-slate-700/70 dark:bg-slate-900/40">
                                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                                    <Package className="h-4 w-4" />
                                    <span>Tip: leave cost and cargo fields blank if they are not yet confirmed. You can update them after the trip closes.</span>
                                </div>
                            </section>

                            <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200/70 bg-white/80 px-6 py-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/40">
                                <div className="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-400">
                                    <span className="text-red-500">*</span>
                                    <span>Required fields must be completed</span>
                                </div>
                                <div className="flex gap-3">
                                    <Button type="button" variant="outline" asChild className="border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800">
                                        <Link href="/outsource-performances">Cancel</Link>
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={processing}
                                        className="min-w-[160px] bg-gradient-to-r from-indigo-600 to-indigo-700 px-6 text-white shadow-lg transition-all duration-200 hover:from-indigo-700 hover:to-indigo-800 hover:shadow-xl disabled:cursor-not-allowed"
                                    >
                                        {processing ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Saving...
                                            </>
                                        ) : (
                                            <>
                                                <Save className="mr-2 h-4 w-4" />
                                                Save Trip
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
