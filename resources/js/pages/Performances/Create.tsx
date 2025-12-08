import { FormActionsBar } from '@/components/forms/form-actions-bar';
import { FormField } from '@/components/forms/form-field';
import { FormPageLayout } from '@/components/forms/form-page-layout';
import { FormSection } from '@/components/forms/form-section';
import { ScrollToTopFab } from '@/components/forms/scroll-to-top-fab';
import { UnsavedChangesBadge } from '@/components/forms/unsaved-changes-badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { SearchableEntityCombobox } from '@/components/searchable-entity-combobox';
import { PlaceCombobox } from '@/components/place-combobox';
import { toast } from '@/hooks/use-toast';
import { useRemoteLookup } from '@/hooks/use-remote-lookup';
import { search as operationsSearch } from '@/routes/operations';
import { type BreadcrumbItem } from '@/types';
import { Link, useForm } from '@inertiajs/react';
import { useCallback, useEffect, useMemo, useRef, useState, type FormEventHandler } from 'react';
import { AlertCircle, ArrowLeft, CheckCircle, ClipboardList, Loader2 } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Performances', href: '/performances' },
    { title: 'Create', href: '/performances/create' },
];

interface Customer {
    id: number;
    name: string;
}

interface Operation {
    id: number;
    operationid: string;
    customer?: Customer | null;
}

interface Driver {
    id: number;
    name: string;
}

interface Truck {
    id: number;
    plate?: string | null;
    model?: string | null;
    code?: string | null;
}

interface DriverTruck {
    id: number;
    driver?: Driver | null;
    truck?: Truck | null;
}

interface Place {
    id: number;
    name: string;
}

interface PerformancesCreateProps {
    driverTrucks: DriverTruck[];
    places: Place[];
}

interface PerformanceFormData {
    load_phase: '' | 'main' | 'return';
    load_completion: '' | 'full' | 'partial';
    FOnumber: string;
    operation_id: string;
    driver_truck_id: string;
    DateDispach: string;
    orgion_id: string;
    destination_id: string;
    DistanceWCargo: string;
    DistanceWOCargo: string;
    CargoVolumMT: string;
    fuelInLitter: string;
    fuelInBirr: string;
    perdiem: string;
    other: string;
    comment: string;
    satus: 'active' | 'inactive';
    is_returned: boolean;
    returned_date: string;
    tonkm: string;
}

type PerformanceFormField = keyof PerformanceFormData;
type FieldErrorMap = Partial<Record<PerformanceFormField, string>>;

const RECENT_PERFORMANCE_KEY = 'performance_recent_selections';

interface RecentSelections {
    operations: string[];
    driverTrucks: string[];
}

const createDefaultForm = (): PerformanceFormData => ({
    load_phase: '',
    load_completion: '',
    FOnumber: '',
    operation_id: '',
    driver_truck_id: '',
    DateDispach: '',
    orgion_id: '',
    destination_id: '',
    DistanceWCargo: '',
    DistanceWOCargo: '',
    CargoVolumMT: '',
    fuelInLitter: '',
    fuelInBirr: '',
    perdiem: '',
    other: '',
    comment: '',
    satus: 'active',
    is_returned: false,
    returned_date: '',
    tonkm: '0.00',
});

const areFormValuesEqual = (left: PerformanceFormData, right: PerformanceFormData): boolean =>
    JSON.stringify(left) === JSON.stringify(right);

export default function PerformancesCreate({ driverTrucks, places }: PerformancesCreateProps) {
    const initialFormData = useMemo<PerformanceFormData>(() => createDefaultForm(), []);
    const initialDataRef = useRef<PerformanceFormData>(initialFormData);
    const formRef = useRef<HTMLFormElement | null>(null);

    const { data, setData, post, processing, errors, clearErrors, reset, setDefaults } = useForm<PerformanceFormData>(
        initialFormData,
    );

    const [recent, setRecent] = useState<RecentSelections>({ operations: [], driverTrucks: [] });

    const operationSelectedIds = useMemo(() => {
        const ids = new Set<string>();
        if (data.operation_id) {
            ids.add(data.operation_id);
        }
        recent.operations.forEach(id => {
            if (id) {
                ids.add(id);
            }
        });
        return Array.from(ids);
    }, [data.operation_id, recent.operations]);

    const operationsLookup = useRemoteLookup<Operation>({
        endpoint: operationsSearch.url(),
        getId: operation => operation.id,
        selectedIds: operationSelectedIds,
        limit: 20,
    });

    const [frontendErrors, setFrontendErrors] = useState<FieldErrorMap>({});
    const [distanceStatus, setDistanceStatus] = useState<{ found: boolean; message: string } | null>(null);
    const [distanceLoading, setDistanceLoading] = useState(false);
    const [isDirty, setIsDirty] = useState(false);
    const [showScrollTop, setShowScrollTop] = useState(false);

    useEffect(() => {
        const container = formRef.current;
        if (!container) {
            return;
        }

        const handleScroll = () => setShowScrollTop(container.scrollTop > 240);
        handleScroll();
        container.addEventListener('scroll', handleScroll);
        return () => container.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        try {
            const raw = localStorage.getItem(RECENT_PERFORMANCE_KEY);
            if (!raw) {
                return;
            }

            const parsed = JSON.parse(raw) as RecentSelections;
            setRecent({
                operations: Array.isArray(parsed.operations) ? parsed.operations.slice(0, 6) : [],
                driverTrucks: Array.isArray(parsed.driverTrucks) ? parsed.driverTrucks.slice(0, 6) : [],
            });
        } catch (_) {
            // Intentionally swallow JSON parsing errors.
        }
    }, []);

    useEffect(() => {
        const errorMessages = Object.values(errors)
            .map(message => (typeof message === 'string' ? message : message ? String(message) : ''))
            .filter(Boolean);

        if (errorMessages.length > 0) {
            toast({
                title: '⚠️ Validation Error',
                description: errorMessages.join(', '),
                variant: 'destructive',
            });
        }
    }, [errors]);

    const backendErrors = useMemo(
        () =>
            Object.entries(errors).reduce<FieldErrorMap>((acc, [key, value]) => {
                const message = typeof value === 'string' ? value : value ? String(value) : '';
                if (message) {
                    acc[key as PerformanceFormField] = message;
                }
                return acc;
            }, {}),
        [errors],
    );

    const fieldErrors = useMemo(
        () => ({
            ...frontendErrors,
            ...backendErrors,
        }),
        [frontendErrors, backendErrors],
    );

    const getFieldError = useCallback(
        (field: PerformanceFormField): string => fieldErrors[field] ?? '',
        [fieldErrors],
    );

    const hasErrors = useMemo(() => Object.values(fieldErrors).some(Boolean), [fieldErrors]);

    useEffect(() => {
        setIsDirty(!areFormValuesEqual(data, initialDataRef.current));
    }, [data]);

    const computeTonKilometers = useCallback((distanceWithCargo: string, cargoVolume: string): string => {
        const distanceValue = Number.parseFloat(distanceWithCargo || '0');
        const cargoValue = Number.parseFloat(cargoVolume || '0');

        if (!Number.isFinite(distanceValue) || !Number.isFinite(cargoValue)) {
            return '0.00';
        }

        const tonKm = distanceValue * cargoValue;
        if (tonKm <= 0) {
            return '0.00';
        }

        return tonKm.toFixed(2);
    }, []);

    const pushRecent = useCallback((type: keyof RecentSelections, value: string) => {
        setRecent(prev => {
            const nextList = [value, ...prev[type].filter(item => item !== value)].slice(0, 6);
            const next = { ...prev, [type]: nextList };
            try {
                localStorage.setItem(RECENT_PERFORMANCE_KEY, JSON.stringify(next));
            } catch (_) {
                // Ignore quota or serialization errors.
            }
            return next;
        });
    }, []);

    const handleDistanceAutoFill = useCallback(
        async (originId: string, destinationId: string, cargoVolume: string) => {
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

                const result = (await response.json()) as { distance?: number | string; found?: boolean; note?: string };
                const numericDistance =
                    typeof result.distance === 'number' ? result.distance : Number.parseFloat(result.distance ?? '0');
                const safeDistance = Number.isFinite(numericDistance) ? numericDistance : 0;
                const formattedDistance = safeDistance.toFixed(2);

                if (result.found) {
                    setData('DistanceWCargo', formattedDistance);
                    setData('DistanceWOCargo', formattedDistance);
                    setData('tonkm', computeTonKilometers(formattedDistance, cargoVolume));
                    setDistanceStatus({
                        found: true,
                        message: `Distance auto-filled from registered route (${formattedDistance} km).`,
                    });
                } else {
                    setData('DistanceWCargo', '0.00');
                    setData('DistanceWOCargo', '0.00');
                    setData('tonkm', computeTonKilometers('0.00', cargoVolume));
                    setDistanceStatus({
                        found: false,
                        message:
                            result.note ??
                            'Distance for this origin and destination is not registered yet. Values defaulted to 0 km.',
                    });
                }
            } catch (error) {
                console.error('Distance auto-fill failed:', error);
                setData('DistanceWCargo', '0.00');
                setData('DistanceWOCargo', '0.00');
                setData('tonkm', computeTonKilometers('0.00', cargoVolume));
                setDistanceStatus({
                    found: false,
                    message: 'Unable to resolve distance. Distance was set to 0 km.',
                });
            } finally {
                setDistanceLoading(false);
            }
        },
        [computeTonKilometers, setData],
    );

    const handleFieldChange = <K extends PerformanceFormField>(field: K, value: PerformanceFormData[K]) => {
        const nextState: PerformanceFormData = { ...data, [field]: value } as PerformanceFormData;
        setData(field, value as any);
        clearErrors(field);

        setFrontendErrors(prev => {
            const next = { ...prev };
            delete next[field];
            if (field === 'is_returned' && value === false) {
                delete next.returned_date;
            }
            return next;
        });

        if (field === 'CargoVolumMT') {
            setData('tonkm', computeTonKilometers(nextState.DistanceWCargo, String(value)));
        }

        if (field === 'orgion_id' || field === 'destination_id') {
            setDistanceStatus(null);
            if (!nextState.orgion_id || !nextState.destination_id) {
                setDistanceLoading(false);
                setData('DistanceWCargo', '');
                if (!nextState.DistanceWOCargo) {
                    setData('DistanceWOCargo', '');
                }
                setData('tonkm', computeTonKilometers('', nextState.CargoVolumMT));
            } else {
                void handleDistanceAutoFill(nextState.orgion_id, nextState.destination_id, nextState.CargoVolumMT);
            }
        }

        if (field === 'is_returned' && value === false) {
            setData('returned_date', '');
            clearErrors('returned_date');
        }
    };

    const handleCheckboxChange = (checked: boolean | 'indeterminate') => {
        handleFieldChange('is_returned', Boolean(checked));
    };

    const validateForm = (): FieldErrorMap => {
        const requiredFields: PerformanceFormField[] = [
            'load_phase',
            'load_completion',
            'FOnumber',
            'operation_id',
            'driver_truck_id',
            'DateDispach',
            'orgion_id',
            'destination_id',
            'satus',
        ];

        const validationErrors: FieldErrorMap = {};

        requiredFields.forEach(field => {
            const value = data[field];
            if (typeof value === 'string' && value.trim().length === 0) {
                validationErrors[field] = 'This field is required.';
            }
        });

        if (data.is_returned && data.returned_date.trim().length === 0) {
            validationErrors.returned_date = 'Returned date is required when the trip is marked as returned.';
        }

        return validationErrors;
    };

    const handleSubmit: FormEventHandler<HTMLFormElement> = event => {
        event.preventDefault();

        const clientValidation = validateForm();
        if (Object.values(clientValidation).some(Boolean)) {
            setFrontendErrors(clientValidation);
            toast({
                title: '⚠️ Validation Error',
                description: 'Please resolve the highlighted fields before saving.',
                variant: 'destructive',
            });
            return;
        }

        post('/performances', {
            preserveScroll: true,
            onSuccess: () => {
                const nextDefaults = createDefaultForm();
                initialDataRef.current = nextDefaults;
                setDefaults(nextDefaults);
                reset(nextDefaults);
                setFrontendErrors({});
                clearErrors();
                setDistanceStatus(null);
                setDistanceLoading(false);
                toast({
                    title: '✅ Performance Recorded',
                    description: 'The trip metrics have been saved successfully.',
                });
                formRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
            },
            onError: pageErrors => {
                setFrontendErrors(prev => ({ ...prev, ...(pageErrors as FieldErrorMap) }));
            },
        });
    };

    const handleScrollToTop = () => {
        formRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <FormPageLayout
            title="Record Performance"
            headTitle="Create Performance"
            description="Log a trip’s operational metrics with quick favorites and inline validation."
            breadcrumbs={breadcrumbs}
            icon={<CheckCircle className="h-5 w-5" />}
            headerAside={
                <>
                    <Button variant="ghost" size="sm" asChild>
                        <Link href="/performances">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Performances
                        </Link>
                    </Button>
                    {isDirty && <UnsavedChangesBadge />}
                    <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                        Performance Control
                    </Badge>
                </>
            }
        >
            {hasErrors && (
                <div className="px-6 pt-6">
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>Please resolve the highlighted fields before submitting the form.</AlertDescription>
                    </Alert>
                </div>
            )}

            <form
                ref={formRef}
                onSubmit={handleSubmit}
                className="flex flex-1 flex-col gap-8 overflow-y-auto p-6 pb-24"
                style={{ minHeight: 0 }}
            >
                <FormSection
                    title="Trip Overview"
                    description="Identify the trip and link operational actors."
                    icon={
                        <div className="rounded-lg bg-indigo-100 p-2 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400">
                            <ClipboardList className="h-4 w-4" />
                        </div>
                    }
                    contentClassName="gap-6 md:grid-cols-3"
                >
                    <FormField id="load_phase" label="Load Phase" required error={getFieldError('load_phase')}>
                        <Select
                            value={data.load_phase}
                            onValueChange={value => handleFieldChange('load_phase', value as PerformanceFormData['load_phase'])}
                        >
                            <SelectTrigger
                                id="load_phase"
                                aria-required
                                className={getFieldError('load_phase') ? 'border-red-500 focus-visible:border-red-500 focus-visible:ring-red-200' : ''}
                            >
                                <SelectValue placeholder="Select phase" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="main">Main Load</SelectItem>
                                <SelectItem value="return">Return Load</SelectItem>
                            </SelectContent>
                        </Select>
                    </FormField>

                    <FormField id="load_completion" label="Load Completion" required error={getFieldError('load_completion')}>
                        <Select
                            value={data.load_completion}
                            onValueChange={value => handleFieldChange('load_completion', value as PerformanceFormData['load_completion'])}
                        >
                            <SelectTrigger
                                id="load_completion"
                                aria-required
                                className={
                                    getFieldError('load_completion')
                                        ? 'border-red-500 focus-visible:border-red-500 focus-visible:ring-red-200'
                                        : ''
                                }
                            >
                                <SelectValue placeholder="Select completion" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="full">Full Load</SelectItem>
                                <SelectItem value="partial">Partial Load</SelectItem>
                            </SelectContent>
                        </Select>
                    </FormField>

                    <FormField id="FOnumber" label="FO Number" required error={getFieldError('FOnumber')}>
                        <Input
                            id="FOnumber"
                            value={data.FOnumber}
                            onChange={event => handleFieldChange('FOnumber', event.target.value)}
                            placeholder="Enter FO number"
                            className={getFieldError('FOnumber') ? 'border-red-500 focus-visible:border-red-500 focus-visible:ring-red-200' : ''}
                        />
                    </FormField>

                    <FormField id="operation_id" label="Operation" required error={getFieldError('operation_id')}>
                        <SearchableEntityCombobox
                            id="operation_id"
                            required
                            value={data.operation_id}
                            items={operationsLookup.items}
                            getValue={operation => operation.id}
                            getLabel={operation => operation.operationid}
                            getDescription={operation => operation.customer?.name}
                            getKeywords={operation => [operation.operationid, operation.customer?.name]}
                            placeholder="Search operations..."
                            searchPlaceholder="Search operations..."
                            searchValue={operationsLookup.query}
                            onSearchChange={operationsLookup.setQuery}
                            isLoading={operationsLookup.isLoading}
                            loadingMessage="Searching operations..."
                            onSelect={selectedValue => {
                                handleFieldChange('operation_id', selectedValue);
                                pushRecent('operations', selectedValue);
                                operationsLookup.setQuery('');
                            }}
                            error={getFieldError('operation_id')}
                            showErrorMessage={false}
                        />
                        {recent.operations.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                                {recent.operations.map(id => {
                                    const operation = operationsLookup.getCachedItem(id);
                                    if (!operation) {
                                        return null;
                                    }

                                    const isActive = data.operation_id === id;

                                    return (
                                        <button
                                            type="button"
                                            key={id}
                                            onClick={() => handleFieldChange('operation_id', id)}
                                            className={`rounded-full border px-3 py-1 text-xs transition ${
                                                isActive
                                                    ? 'border-indigo-600 bg-indigo-600 text-white'
                                                    : 'border-indigo-200 bg-indigo-50 text-indigo-700 hover:border-indigo-300 hover:bg-indigo-100'
                                            }`}
                                        >
                                            {operation.operationid}
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </FormField>

                    <FormField id="driver_truck_id" label="Driver & Truck" required error={getFieldError('driver_truck_id')}>
                        <SearchableEntityCombobox
                            id="driver_truck_id"
                            required
                            value={data.driver_truck_id}
                            items={driverTrucks}
                            getValue={driverTruck => driverTruck.id}
                            getLabel={driverTruck => driverTruck.driver?.name?.trim() || 'Driver unknown'}
                            getDescription={driverTruck => {
                                const segments = [
                                    driverTruck.truck?.plate,
                                    driverTruck.truck?.model,
                                    driverTruck.truck?.code,
                                ].filter(Boolean);
                                return segments.length ? segments.join(' • ') : null;
                            }}
                            getKeywords={driverTruck => [
                                driverTruck.driver?.name,
                                driverTruck.truck?.plate,
                                driverTruck.truck?.model,
                                driverTruck.truck?.code,
                            ]}
                            placeholder="Search driver or truck..."
                            searchPlaceholder="Search driver or truck..."
                            onSelect={selectedValue => {
                                handleFieldChange('driver_truck_id', selectedValue);
                                pushRecent('driverTrucks', selectedValue);
                            }}
                            error={getFieldError('driver_truck_id')}
                            showErrorMessage={false}
                            renderDisplay={selected => {
                                if (!selected) {
                                    return <span className="text-sm text-muted-foreground">Search driver or truck...</span>;
                                }

                                return (
                                    <div className="flex min-w-0 flex-col items-start">
                                        <span className="line-clamp-1 text-sm font-medium text-foreground">{selected.label}</span>
                                        {selected.description && (
                                            <span className="line-clamp-1 text-xs text-muted-foreground">{selected.description}</span>
                                        )}
                                    </div>
                                );
                            }}
                        />
                        {recent.driverTrucks.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                                {recent.driverTrucks.map(id => {
                                    const driverTruck = driverTrucks.find(item => item.id.toString() === id);
                                    if (!driverTruck) {
                                        return null;
                                    }

                                    const isActive = data.driver_truck_id === id;

                                    return (
                                        <button
                                            type="button"
                                            key={id}
                                            onClick={() => handleFieldChange('driver_truck_id', id)}
                                            className={`rounded-full border px-3 py-1 text-xs transition ${
                                                isActive
                                                    ? 'border-emerald-600 bg-emerald-600 text-white'
                                                    : 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:border-emerald-300 hover:bg-emerald-100'
                                            }`}
                                        >
                                            {driverTruck.driver?.name?.split(' ')[0] ?? 'Driver'}
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </FormField>

                    <FormField id="DateDispach" label="Dispatch Date" required error={getFieldError('DateDispach')}>
                        <Input
                            id="DateDispach"
                            type="date"
                            value={data.DateDispach}
                            onChange={event => handleFieldChange('DateDispach', event.target.value)}
                            className={getFieldError('DateDispach') ? 'border-red-500 focus-visible:border-red-500 focus-visible:ring-red-200' : ''}
                        />
                    </FormField>

                    <FormField id="orgion_id" label="Origin" required error={getFieldError('orgion_id')}>
                        <PlaceCombobox
                            id="orgion_id"
                            required
                            value={data.orgion_id}
                            places={places}
                            placeholder="Select origin"
                            onSelect={value => handleFieldChange('orgion_id', value)}
                            error={getFieldError('orgion_id')}
                        />
                    </FormField>

                    <FormField id="destination_id" label="Destination" required error={getFieldError('destination_id')}>
                        <PlaceCombobox
                            id="destination_id"
                            required
                            value={data.destination_id}
                            places={places}
                            placeholder="Select destination"
                            onSelect={value => handleFieldChange('destination_id', value)}
                            error={getFieldError('destination_id')}
                        />
                    </FormField>
                </FormSection>

                <FormSection
                    title="Costs & Metrics"
                    description="Capture distance, tonnage, and cost elements."
                    icon={
                        <div className="rounded-lg bg-indigo-100 p-2 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400">
                            <ClipboardList className="h-4 w-4" />
                        </div>
                    }
                    contentClassName="gap-6 md:grid-cols-3"
                >
                    <FormField
                        id="DistanceWCargo"
                        label="Distance with Cargo (km)"
                        helperText="Auto-filled when the route distance is registered."
                    >
                        <Input
                            id="DistanceWCargo"
                            type="number"
                            step="0.01"
                            value={data.DistanceWCargo}
                            readOnly
                            placeholder="Auto-filled from distance table"
                            className="cursor-not-allowed bg-muted/50"
                        />
                        {distanceLoading && (
                            <p className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Loader2 className="h-3 w-3 animate-spin" />
                                Resolving distance…
                            </p>
                        )}
                        {distanceStatus && (
                            <Alert variant={distanceStatus.found ? 'default' : 'destructive'} className="mt-2">
                                {distanceStatus.found ? (
                                    <CheckCircle className="h-4 w-4 text-emerald-500" />
                                ) : (
                                    <AlertCircle className="h-4 w-4 text-destructive" />
                                )}
                                <AlertTitle>{distanceStatus.found ? 'Distance applied' : 'Distance missing'}</AlertTitle>
                                <AlertDescription>{distanceStatus.message}</AlertDescription>
                            </Alert>
                        )}
                    </FormField>

                    <FormField id="DistanceWOCargo" label="Distance Empty (km)">
                        <Input
                            id="DistanceWOCargo"
                            type="number"
                            step="0.01"
                            value={data.DistanceWOCargo}
                            onChange={event => handleFieldChange('DistanceWOCargo', event.target.value)}
                        />
                    </FormField>

                    <FormField id="CargoVolumMT" label="Cargo Volume (MT)">
                        <Input
                            id="CargoVolumMT"
                            type="number"
                            step="0.01"
                            value={data.CargoVolumMT}
                            onChange={event => handleFieldChange('CargoVolumMT', event.target.value)}
                        />
                    </FormField>

                    <FormField id="tonkm" label="Ton-Km">
                        <Input id="tonkm" value={data.tonkm} readOnly className="cursor-not-allowed bg-muted/50" />
                    </FormField>

                    <FormField id="fuelInLitter" label="Fuel (L)">
                        <Input
                            id="fuelInLitter"
                            type="number"
                            step="0.01"
                            value={data.fuelInLitter}
                            onChange={event => handleFieldChange('fuelInLitter', event.target.value)}
                        />
                    </FormField>

                    <FormField id="fuelInBirr" label="Fuel Cost (Birr)">
                        <Input
                            id="fuelInBirr"
                            type="number"
                            step="0.01"
                            value={data.fuelInBirr}
                            onChange={event => handleFieldChange('fuelInBirr', event.target.value)}
                        />
                    </FormField>

                    <FormField id="perdiem" label="Per Diem (Birr)">
                        <Input
                            id="perdiem"
                            type="number"
                            step="0.01"
                            value={data.perdiem}
                            onChange={event => handleFieldChange('perdiem', event.target.value)}
                        />
                    </FormField>

                    <FormField id="other" label="Other Cost (Birr)">
                        <Input
                            id="other"
                            type="number"
                            step="0.01"
                            value={data.other}
                            onChange={event => handleFieldChange('other', event.target.value)}
                        />
                    </FormField>
                </FormSection>

                <FormSection
                    title="Status & Return"
                    description="Update lifecycle state and return info."
                    icon={
                        <div className="rounded-lg bg-indigo-100 p-2 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400">
                            <ClipboardList className="h-4 w-4" />
                        </div>
                    }
                    contentClassName="gap-6 md:grid-cols-3"
                >
                    <FormField id="satus" label="Status" required error={getFieldError('satus')}>
                        <Select value={data.satus} onValueChange={value => handleFieldChange('satus', value as 'active' | 'inactive')}>
                            <SelectTrigger
                                id="satus"
                                aria-required
                                className={getFieldError('satus') ? 'border-red-500 focus-visible:border-red-500 focus-visible:ring-red-200' : ''}
                            >
                                <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="active">Active</SelectItem>
                                <SelectItem value="inactive">Inactive</SelectItem>
                            </SelectContent>
                        </Select>
                    </FormField>

                    <FormField id="is_returned" label="Returned?">
                        <div className="flex items-center gap-3 rounded-lg border border-dashed border-slate-200 px-4 py-3 dark:border-slate-700">
                            <Checkbox
                                id="is_returned"
                                checked={data.is_returned}
                                onCheckedChange={handleCheckboxChange}
                                className="border-slate-300 text-indigo-600 focus-visible:ring-indigo-500 dark:border-slate-600"
                            />
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Trip returned to origin</span>
                        </div>
                    </FormField>

                    {data.is_returned && (
                        <FormField id="returned_date" label="Returned Date" required error={getFieldError('returned_date')}>
                            <Input
                                id="returned_date"
                                type="date"
                                value={data.returned_date}
                                onChange={event => handleFieldChange('returned_date', event.target.value)}
                                className={
                                    getFieldError('returned_date')
                                        ? 'border-red-500 focus-visible:border-red-500 focus-visible:ring-red-200'
                                        : ''
                                }
                            />
                        </FormField>
                    )}

                    <FormField id="comment" label="Comment / Notes" className="md:col-span-3">
                        <Textarea
                            id="comment"
                            value={data.comment}
                            onChange={event => handleFieldChange('comment', event.target.value)}
                            placeholder="Add any observations, delays, or unexpected events."
                            className="min-h-[120px] resize-y"
                        />
                    </FormField>
                </FormSection>

                <FormActionsBar
                    left={
                        <>
                            <span className="flex items-center gap-2 text-sm">
                                <span className="text-red-500">*</span>
                                All required fields must be completed before submission.
                            </span>
                            <span className="flex items-center gap-2 text-xs text-muted-foreground">
                                <ClipboardList className="h-3 w-3" />
                                Accurate logs keep fleet performance insights reliable.
                            </span>
                        </>
                    }
                    right={
                        <>
                            <Button
                                type="button"
                                variant="outline"
                                asChild
                                className="border-slate-300 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                            >
                                <Link href="/performances">Cancel</Link>
                            </Button>
                            <Button
                                type="submit"
                                disabled={processing || hasErrors}
                                className="min-w-[180px] bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-lg transition hover:from-indigo-700 hover:to-indigo-800"
                            >
                                {processing ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Saving…
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle className="mr-2 h-4 w-4" />
                                        Save Performance
                                    </>
                                )}
                            </Button>
                        </>
                    }
                />
            </form>
            <ScrollToTopFab visible={showScrollTop} onClick={handleScrollToTop} />
        </FormPageLayout>
    );
}
