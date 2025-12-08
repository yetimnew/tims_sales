import { useCallback, useEffect, useMemo, useRef, useState, type FormEventHandler } from 'react';
import { Head, Link, router, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { SearchableEntityCombobox } from '@/components/searchable-entity-combobox';
import { PlaceCombobox } from '@/components/place-combobox';
import { DeleteConfirmationDialog } from '@/components/delete-confirmation-dialog';
import { useToast } from '@/hooks/use-toast';
import { usePermissions } from '@/hooks/use-permissions';
import { useRemoteLookup } from '@/hooks/use-remote-lookup';
import { search as operationsSearch } from '@/routes/operations';
import { validateOutsourcePerformance, type ValidationErrors } from '@/lib/validation';
import { DatePicker } from '@/components/ui/date-picker';
import { cn } from '@/lib/utils';
import type { BreadcrumbItem } from '@/types';
import {
    AlertCircle,
    ArrowLeft,
    CheckCircle,
    ClipboardList,
    MapPin,
    Package,
    Pencil,
    RefreshCcw,
    Save,
    Trash2,
    Wallet,
} from 'lucide-react';

interface OutsourceOption {
    id: number;
    name: string;
}

interface OperationOption {
    id: number;
    operationid: string;
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

interface OutsourcePerformanceResource {
    id: number;
    outsource_id: number;
    operation_id: number;
    trip_number: string;
    dispatch_date: string | null;
    from_place_id: number;
    to_place_id: number;
    distance_km: number | null;
    cargo_volume_mt: number | null;
    tonkm: number | null;
    cost: number | null;
    remarks: string | null;
    status: string | null;
    outsource?: OutsourceOption | null;
    operation?: OperationOption | null;
}

interface OutsourcePerformancesEditProps {
    outsourcePerformance: OutsourcePerformanceResource;
    outsources: OutsourceOption[];
    statusOptions: StatusOption[];
    places: PlaceOption[];
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

type DistanceStatus = {
    found: boolean;
    message: string;
} | null;

const breadcrumbs = (performanceId: number): BreadcrumbItem[] => [
    { title: 'Outsource Performances', href: '/outsource-performances' },
    { title: 'Show', href: `/outsource-performances/${performanceId}` },
    { title: 'Edit', href: `/outsource-performances/${performanceId}/edit` },
];

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

export default function OutsourcePerformancesEdit({ outsourcePerformance, outsources, statusOptions, places }: OutsourcePerformancesEditProps) {
    const { toast } = useToast();
    const { hasPermission } = usePermissions();

    const initialFormState: OutsourcePerformanceFormData = {
        outsource_id: outsourcePerformance.outsource_id?.toString() ?? '',
        operation_id: outsourcePerformance.operation_id?.toString() ?? '',
        trip_number: outsourcePerformance.trip_number ?? '',
        dispatch_date: outsourcePerformance.dispatch_date ?? '',
        from_place_id: outsourcePerformance.from_place_id?.toString() ?? '',
        to_place_id: outsourcePerformance.to_place_id?.toString() ?? '',
        distance_km: outsourcePerformance.distance_km !== null && outsourcePerformance.distance_km !== undefined
            ? Number(outsourcePerformance.distance_km).toFixed(2)
            : '',
        cargo_volume_mt: outsourcePerformance.cargo_volume_mt !== null && outsourcePerformance.cargo_volume_mt !== undefined
            ? Number(outsourcePerformance.cargo_volume_mt).toFixed(2)
            : '',
        tonkm: outsourcePerformance.tonkm !== null && outsourcePerformance.tonkm !== undefined
            ? Number(outsourcePerformance.tonkm).toFixed(2)
            : '0.00',
        cost: outsourcePerformance.cost !== null && outsourcePerformance.cost !== undefined
            ? Number(outsourcePerformance.cost).toFixed(2)
            : '',
        remarks: outsourcePerformance.remarks ?? '',
        status: outsourcePerformance.status ?? statusOptions[0]?.value ?? 'active',
    };

    const initialValuesRef = useRef<OutsourcePerformanceFormData>({ ...initialFormState });

    const {
        data,
        setData,
        put,
        errors,
        reset,
        transform,
        setDefaults,
    } = useForm<OutsourcePerformanceFormData>({ ...initialValuesRef.current });

    const [clientErrors, setClientErrors] = useState<ValidationErrors>({});
    const [distanceStatus, setDistanceStatus] = useState<DistanceStatus>(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isDirty, setIsDirty] = useState(false);

    const operationSelectedIds = useMemo(() => (data.operation_id ? [data.operation_id] : []), [data.operation_id]);

    const operationsLookup = useRemoteLookup<OperationOption>({
        endpoint: operationsSearch.url(),
        getId: operation => operation.id,
        selectedIds: operationSelectedIds,
        limit: 20,
    });


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

    const handleDistanceAutoFill = useCallback(async (originId: string, destinationId: string, nextState: OutsourcePerformanceFormData) => {
        if (!originId || !destinationId) {
            return;
        }

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

            const tonKm = computeTonKilometers(formattedDistance, nextState.cargo_volume_mt);
            setData(previous => ({
                ...previous,
                distance_km: formattedDistance,
                tonkm: tonKm,
            }));

            setDistanceStatus({
                found: Boolean(result.found),
                message: result.found
                    ? `Distance auto-filled from registered route (${formattedDistance} km).`
                    : result.note ?? 'Distance for this route is not registered yet. Value set to 0 km.',
            });
        } catch (error) {
            console.error('Distance auto-fill failed:', error);
            const tonKm = computeTonKilometers('0.00', nextState.cargo_volume_mt);
            setData(previous => ({
                ...previous,
                distance_km: '0.00',
                tonkm: tonKm,
            }));
            setDistanceStatus({
                found: false,
                message: 'Unable to resolve distance. Distance was set to 0 km.',
            });
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
        const nextState: OutsourcePerformanceFormData = {
            ...data,
            [field]: value,
        } as OutsourcePerformanceFormData;

        nextState.tonkm = computeTonKilometers(nextState.distance_km, nextState.cargo_volume_mt);

        setData(() => ({ ...nextState }));

        if (clientErrors[field]) {
            setFieldError(field, undefined);
        }

        if (field === 'from_place_id' || field === 'to_place_id') {
            if (!nextState.from_place_id || !nextState.to_place_id) {
                setDistanceStatus(null);
                setData(previous => ({
                    ...previous,
                    distance_km: '',
                    tonkm: computeTonKilometers('', nextState.cargo_volume_mt),
                }));
                return;
            }

            void handleDistanceAutoFill(nextState.from_place_id, nextState.to_place_id, nextState);
        }
    }, [clientErrors, data, handleDistanceAutoFill, setData, setFieldError]);

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

        put(`/outsource-performances/${outsourcePerformance.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                toast({
                    title: 'Trip updated',
                    description: 'The outsource performance record has been updated successfully.',
                });
                setClientErrors({});
                setDistanceStatus(null);
                initialValuesRef.current = { ...trimmed };
                setDefaults({ ...trimmed });
                reset();
                setData(() => ({ ...trimmed }));
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

    useEffect(() => {
        const initial = initialValuesRef.current;
        const dirty = (Object.keys(initial) as Array<keyof OutsourcePerformanceFormData>).some(key => data[key] !== initial[key]);
        setIsDirty(dirty);
    }, [data]);

    const resetForm = () => {
        reset();
        setData(() => ({ ...initialValuesRef.current }));
        setClientErrors({});
        setDistanceStatus(null);
        setIsDirty(false);
    };

    const handleDeleteConfirm = () => {
        setIsDeleting(true);
        router.delete(`/outsource-performances/${outsourcePerformance.id}`, {
            onSuccess: () => {
                setDeleteDialogOpen(false);
                setIsDeleting(false);
            },
            onError: () => {
                setIsDeleting(false);
            },
        });
    };

    const renderStatusAlert = () => {
        if (!distanceStatus) {
            return null;
        }

        const Icon = distanceStatus.found ? CheckCircle : AlertCircle;

        return (
            <Alert variant={distanceStatus.found ? 'default' : 'destructive'}>
                <Icon className="h-4 w-4" />
                <AlertDescription>{distanceStatus.message}</AlertDescription>
            </Alert>
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs(outsourcePerformance.id)}>
            <Head title={`Edit Trip ${outsourcePerformance.trip_number}`} />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-hidden rounded-xl p-4">
                <Card className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-slate-200/70 bg-white/95 text-card-foreground shadow-xl backdrop-blur-lg dark:border-slate-800/60 dark:bg-slate-900/70">
                    <CardHeader className="px-6 pb-0">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                            <div className="flex items-start gap-4">
                                <div className="rounded-xl bg-blue-100 p-2 text-blue-600 shadow-sm dark:bg-blue-900/30 dark:text-blue-400">
                                    <Pencil className="h-5 w-5" />
                                </div>
                                <div>
                                    <CardTitle className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Update Outsource Trip</CardTitle>
                                    <CardDescription className="text-sm text-slate-600 dark:text-slate-400">
                                        Adjust vendor dispatch metrics while keeping audit trails intact.
                                    </CardDescription>
                                </div>
                            </div>
                            <div className="flex flex-wrap items-center gap-3">
                                <Button variant="ghost" size="sm" asChild>
                                    <Link href={`/outsource-performances/${outsourcePerformance.id}`}>
                                        <ArrowLeft className="mr-2 h-4 w-4" />
                                        Back to Trip
                                    </Link>
                                </Button>
                                <Button variant="outline" size="sm" onClick={resetForm} className="border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800">
                                    <RefreshCcw className="mr-2 h-4 w-4" />
                                    Reset
                                </Button>
                                {isDirty && (
                                    <div className="flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1.5 text-sm font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                                        <Save className="h-3 w-3" />
                                        Unsaved Changes
                                    </div>
                                )}
                                {hasPermission('outsource-performances.destroy') && (
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
                            </div>
                        </div>
                    </CardHeader>

                    <CardContent className="flex flex-1 flex-col overflow-hidden p-0">
                        <form onSubmit={submit} className="flex flex-1 flex-col gap-8 overflow-y-auto p-6 pb-24" noValidate>
                            <section className="space-y-4 rounded-xl border border-slate-200/60 bg-white/75 p-5 shadow-sm dark:border-slate-800/70 dark:bg-slate-900/35">
                                <div className="flex items-center gap-2.5 text-sm">
                                    <div className="rounded-md bg-blue-100 p-1.5 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                                        <ClipboardList className="h-4 w-4" />
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">Trip Overview</h2>
                                        <p className="text-xs text-muted-foreground">Review vendor, operation, and schedule details.</p>
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
                                    </div>

                                    <div className="space-y-2">
                                        <SearchableEntityCombobox
                                            id="operation_id"
                                            label="Operation"
                                            required
                                            value={data.operation_id}
                                            items={operationsLookup.items}
                                            getValue={operation => operation.id}
                                            getLabel={operation => operation.operationid}
                                            getDescription={operation => operation.customer?.name}
                                            getKeywords={operation => [operation.operationid, operation.customer?.name]}
                                            placeholder="Search operation..."
                                            searchPlaceholder="Search operations..."
                                            searchValue={operationsLookup.query}
                                            onSearchChange={operationsLookup.setQuery}
                                            isLoading={operationsLookup.isLoading}
                                            loadingMessage="Searching operations..."
                                            onSelect={value => {
                                                handleFieldChange('operation_id', value);
                                                operationsLookup.setQuery('');
                                            }}
                                            error={typeof clientErrors.operation_id === 'string' ? clientErrors.operation_id : undefined}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="trip_number">
                                            Trip Number <span className="text-red-500">*</span>
                                        </Label>
                                        <Input
                                            id="trip_number"
                                            value={data.trip_number}
                                            onChange={event => handleFieldChange('trip_number', event.target.value)}
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
                                        <span className="flex items-center gap-1 text-sm font-medium text-slate-700 dark:text-slate-200">
                                            Dispatch Date <span className="text-red-500">*</span>
                                        </span>
                                        <DatePicker
                                            value={data.dispatch_date || ''}
                                            onChange={next => handleFieldChange('dispatch_date', next ?? '')}
                                            placeholder="Select dispatch date"
                                            className={cn(
                                                'w-full justify-start text-left h-11 border-slate-300 hover:border-slate-400 focus-visible:border-emerald-500 focus-visible:ring-emerald-500/20 dark:border-slate-600 dark:hover:border-slate-500',
                                                clientErrors.dispatch_date
                                                    ? 'border-red-500 focus-visible:border-red-500 focus-visible:ring-red-500/20'
                                                    : undefined,
                                            )}
                                        />
                                        {clientErrors.dispatch_date && (
                                            <p className="flex items-center gap-1 text-xs text-red-500">
                                                <AlertCircle className="h-3 w-3" />
                                                {clientErrors.dispatch_date}
                                            </p>
                                        )}
                                        <SearchableEntityCombobox
                                            id="operation_id"
                                            label="Operation"
                                            required
                                            value={data.operation_id}
                                            items={operationsLookup.items}
                                            getValue={operation => operation.id}
                                            getLabel={operation => operation.operationid}
                                            getDescription={operation => operation.customer?.name}
                                            getKeywords={operation => [operation.operationid, operation.customer?.name]}
                                            placeholder="Search operation..."
                                            searchPlaceholder="Search operations..."
                                            searchValue={operationsLookup.query}
                                            onSearchChange={operationsLookup.setQuery}
                                            isLoading={operationsLookup.isLoading}
                                            loadingMessage="Searching operations..."
                                            onSelect={value => {
                                                handleFieldChange('operation_id', value);
                                                operationsLookup.setQuery('');
                                            }}
                                            error={typeof clientErrors.operation_id === 'string' ? clientErrors.operation_id : undefined}
                                        />
                                    </div>
                                </div>
                            </section>

                            <section className="space-y-4 rounded-xl border border-slate-200/60 bg-white/75 p-5 shadow-sm dark:border-slate-800/70 dark:bg-slate-900/35">
                                <div className="flex items-center gap-2.5 text-sm">
                                    <div className="rounded-md bg-blue-100 p-1.5 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                                        <MapPin className="h-4 w-4" />
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">Route & Distance</h2>
                                        <p className="text-xs text-muted-foreground">Adjust the origin and destination to recalculate registered distances.</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    <PlaceCombobox
                                        id="from_place_id"
                                        label="Origin"
                                        required
                                        value={data.from_place_id}
                                        places={places}
                                        placeholder="Select origin"
                                        onSelect={value => handleFieldChange('from_place_id', value)}
                                        error={clientErrors.from_place_id}
                                    />
                                    <PlaceCombobox
                                        id="to_place_id"
                                        label="Destination"
                                        required
                                        value={data.to_place_id}
                                        places={places}
                                        placeholder="Select destination"
                                        onSelect={value => handleFieldChange('to_place_id', value)}
                                        error={clientErrors.to_place_id}
                                    />
                                </div>

                                {renderStatusAlert()}

                                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                    <div className="space-y-2">
                                        <Label htmlFor="distance_km">Distance (km)</Label>
                                        <Input
                                            id="distance_km"
                                            value={data.distance_km}
                                            onChange={event => handleFieldChange('distance_km', event.target.value)}
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
                                    <div className="rounded-md bg-blue-100 p-1.5 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                                        <Wallet className="h-4 w-4" />
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">Cost & Notes</h2>
                                        <p className="text-xs text-muted-foreground">Update spend and contextual remarks as the trip progresses.</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="cost">Trip Cost</Label>
                                        <Input
                                            id="cost"
                                            value={data.cost}
                                            onChange={event => handleFieldChange('cost', event.target.value)}
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
                                            placeholder="Add optional context such as transit challenges or vendor notes"
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
                                    <span>Tip: when actuals are unknown, leave numeric fields blank and update them once the vendor shares evidence.</span>
                                </div>
                            </section>

                            <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200/70 bg-white/80 px-6 py-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/40">
                                <div className="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-400">
                                    <span className="text-red-500">*</span>
                                    <span>Required fields must be completed</span>
                                </div>
                                <div className="space-y-2">
                                    <SearchableEntityCombobox
                                        id="operation_id"
                                        label="Operation"
                                        required
                                        value={data.operation_id}
                                        items={operationsLookup.items}
                                        getValue={operation => operation.id}
                                        getLabel={operation => operation.operationid}
                                        getDescription={operation => operation.customer?.name}
                                        getKeywords={operation => [operation.operationid, operation.customer?.name]}
                                        placeholder="Search operation..."
                                        searchPlaceholder="Search operations..."
                                        searchValue={operationsLookup.query}
                                        onSearchChange={operationsLookup.setQuery}
                                        isLoading={operationsLookup.isLoading}
                                        loadingMessage="Searching operations..."
                                        onSelect={value => {
                                            handleFieldChange('operation_id', value);
                                            operationsLookup.setQuery('');
                                        }}
                                        error={clientErrors.operation_id as string | undefined}
                                    />
                                </div>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>

            <DeleteConfirmationDialog
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
                title="Delete outsource trip?"
                description="This will permanently remove the outsource performance record. Historical analytics will exclude this trip."
                itemName={outsourcePerformance.trip_number}
                onConfirm={handleDeleteConfirm}
                isLoading={isDeleting}
            />
        </AppLayout>
    );
}
