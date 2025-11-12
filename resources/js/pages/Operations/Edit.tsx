import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { Head, useForm } from '@inertiajs/react';
import { type BreadcrumbItem } from '@/types';
import { toast } from '@/hooks/use-toast';
import { AlertCircle } from 'lucide-react';
import { FormEventHandler, useEffect, useMemo, useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Operations',
        href: '/operations',
    },
    {
        title: 'Edit',
        href: '#',
    },
];

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
    value: OperationFormState['destination_scope'];
    label: string;
}

interface CargoTypeOption {
    id: number;
    name: string;
    category?: string | null;
}

interface CargoServiceTypeOption {
    value: OperationFormState['cargo_service_type'];
    label: string;
}

interface Operation {
    id: number;
    operationid: string;
    customer_id: number;
    startdate: string;
    volume: number;
    cargo_type_id: number;
    cargo_service_type: string;
    cargo_type?: {
        id: number;
        name: string;
        category?: string | null;
    } | null;
    km: number;
    tariff: number;
    remark?: string;
    status: string;
    destination_scope?: string | null;
    destination_reference_id?: number | null;
    destination_name?: string | null;
}

interface OperationsEditProps {
    operation: Operation;
    customers: Customer[];
    regions: Region[];
    zones: Zone[];
    woredas: Woreda[];
    places: Place[];
    destinationScopes: DestinationScopeOption[];
    cargoTypes: CargoTypeOption[];
    cargoServiceTypes: CargoServiceTypeOption[];
}

type OperationFormState = {
    operationid: string;
    customer_id: string;
    startdate: string;
    volume: string;
    cargo_type_id: string;
    cargo_service_type: 'relief' | 'commercial';
    km: string;
    tariff: string;
    remark: string;
    status: string;
    destination_scope: 'region' | 'zone' | 'woreda' | 'place';
    destination_id: string;
};

export default function OperationsEdit({ operation, customers, regions, zones, woredas, places, destinationScopes, cargoTypes, cargoServiceTypes }: OperationsEditProps) {
    const allowedScopes: Array<OperationFormState['destination_scope']> = ['region', 'zone', 'woreda', 'place'];
    const initialDestinationScope = allowedScopes.includes((operation.destination_scope ?? '') as OperationFormState['destination_scope'])
        ? (operation.destination_scope as OperationFormState['destination_scope'])
        : 'region';
    const initialDestinationId = operation.destination_reference_id
        ? operation.destination_reference_id.toString()
        : '';

    const { data, setData, put, processing, errors } = useForm<OperationFormState>({
        operationid: operation.operationid,
        customer_id: operation.customer_id.toString(),
        startdate: operation.startdate,
        volume: operation.volume.toString(),
        cargo_type_id: operation.cargo_type_id ? operation.cargo_type_id.toString() : '',
        cargo_service_type: ['relief', 'commercial'].includes(operation.cargo_service_type as string)
            ? (operation.cargo_service_type as OperationFormState['cargo_service_type'])
            : 'commercial',
        km: operation.km.toString(),
        tariff: operation.tariff.toString(),
        remark: operation.remark || '',
        status: operation.status,
        destination_scope: initialDestinationScope,
        destination_id: initialDestinationId,
    });

    const [frontendErrors, setFrontendErrors] = useState<Record<string, string>>({});

    const safeCustomers = useMemo(() => (Array.isArray(customers) ? customers : []), [customers]);
    const safeRegions = useMemo(() => (Array.isArray(regions) ? regions : []), [regions]);
    const safeZones = useMemo(() => (Array.isArray(zones) ? zones : []), [zones]);
    const safeWoredas = useMemo(() => (Array.isArray(woredas) ? woredas : []), [woredas]);
    const safePlaces = useMemo(() => (Array.isArray(places) ? places : []), [places]);
    const destinationScopeOptions = useMemo(
        () => (Array.isArray(destinationScopes) ? destinationScopes : []),
        [destinationScopes]
    );
    const safeCargoTypes = useMemo(() => (Array.isArray(cargoTypes) ? cargoTypes : []), [cargoTypes]);
    const safeCargoServiceTypes = useMemo(
        () => (Array.isArray(cargoServiceTypes) ? cargoServiceTypes : []),
        [cargoServiceTypes]
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

    const setFieldError = (field: string, message: string) => {
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

    const validateField = (field: string, value: string) => {
        let message = '';

        if (field === 'operationid' && !value.trim()) {
            message = 'Operation ID is required';
        }
        if (field === 'customer_id' && !value) {
            message = 'Customer is required';
        }
        if (field === 'startdate' && !value) {
            message = 'Start date is required';
        }
        if (field === 'volume' && (!value || isNaN(Number(value)))) {
            message = 'Volume is required and must be a number';
        }
        if (field === 'cargo_service_type' && !value) {
            message = 'Cargo service type is required';
        }
        if (field === 'cargo_type_id' && !value) {
            message = 'Cargo type is required';
        }
        if (field === 'km' && (!value || isNaN(Number(value)))) {
            message = 'Distance is required and must be a number';
        }
        if (field === 'tariff' && (!value || isNaN(Number(value)))) {
            message = 'Tariff is required and must be a number';
        }
        if (field === 'status' && !value) {
            message = 'Status is required';
        }
        if (field === 'destination_scope' && !value) {
            message = 'Destination scope is required';
        }
        if (field === 'destination_id') {
            if (!value) {
                message = 'Destination selection is required';
            } else if (!destinationOptions.some(option => option.value === value)) {
                message = 'Please select a valid destination';
            }
        }

        setFieldError(field, message);
        return message;
    };

    const handleFieldChange = (field: string, value: string) => {
        if (field === 'destination_scope') {
            setData('destination_scope', value as OperationFormState['destination_scope']);
            setData('destination_id', '');
            setFieldError('destination_id', '');
            validateField(field, value);
            return;
        }

        setData(field as keyof typeof data, value);
        validateField(field, value);
    };

    useEffect(() => {
        if (!data.destination_id) {
            return;
        }

        const stillValid = destinationOptions.some(option => option.value === data.destination_id);

        if (!stillValid) {
            setData('destination_id', '');
            setFrontendErrors(prev => ({
                ...prev,
                destination_id: 'Destination selection is required',
            }));
        }
    }, [destinationOptions, data.destination_id, setData]);

    const submit: FormEventHandler = event => {
        event.preventDefault();

        const fieldsToValidate: Record<string, string> = {
            operationid: data.operationid,
            customer_id: data.customer_id,
            startdate: data.startdate,
            volume: data.volume,
            cargo_service_type: data.cargo_service_type,
            cargo_type_id: data.cargo_type_id,
            km: data.km,
            tariff: data.tariff,
            status: data.status,
            destination_scope: data.destination_scope,
            destination_id: data.destination_id,
        };

        const validationResults = Object.entries(fieldsToValidate).reduce<Record<string, string>>((acc, [field, value]) => {
            const message = validateField(field, value);
            if (message) {
                acc[field] = message;
            }
            return acc;
        }, {});

        if (Object.keys(validationResults).length > 0) {
            toast({
                title: '⚠️ Validation Error',
                description: 'Please fix the validation errors before submitting',
                variant: 'destructive',
            });
            return;
        }

        put(`/operations/${operation.id}`);
    };

    const hasErrors = Object.keys(errors).length > 0 || Object.keys(frontendErrors).length > 0;
    const getFieldError = (fieldName: string) => errors[fieldName as keyof typeof errors] || frontendErrors[fieldName] || '';

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit ${operation.operationid}`} />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl p-4">
                {/* Header */}
                <div>
                    <h1 className="text-2xl font-bold">Edit Operation</h1>
                    <p className="text-muted-foreground">
                        Update the operation information for {operation.operationid}
                    </p>
                </div>

                {/* Error Alert */}
                {hasErrors && (
                    <div className="flex gap-3 rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive">
                        <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                        <div>
                            <h3 className="font-semibold mb-1">Please fix the following errors:</h3>
                            <ul className="list-inside list-disc space-y-1 text-sm">
                                {Object.entries({ ...errors, ...frontendErrors }).map(([field, message]) => (
                                    <li key={field}>
                                        {typeof message === 'string' ? message : String(message)}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                )}

                {/* Form */}
                <Card>
                    <CardHeader>
                        <CardTitle>Operation Details</CardTitle>
                        <CardDescription>
                            Update the information for this operation
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={submit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="operationid">Operation ID *</Label>
                                    <Input
                                        id="operationid"
                                        type="text"
                                        value={data.operationid}
                                        onChange={(e) => handleFieldChange('operationid', e.target.value)}
                                        placeholder="e.g., OP-2024-001"
                                        className={getFieldError('operationid') ? 'border-red-500 focus:border-red-500' : ''}
                                    />
                                    {getFieldError('operationid') && (
                                        <p className="text-sm text-red-500">{getFieldError('operationid')}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="customer_id">Customer *</Label>
                                    <Select
                                        value={data.customer_id}
                                        onValueChange={(value) => handleFieldChange('customer_id', value)}
                                    >
                                        <SelectTrigger className={getFieldError('customer_id') ? 'border-red-500' : ''}>
                                            <SelectValue placeholder="Select customer" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {safeCustomers.map((customer) => (
                                                <SelectItem key={customer.id} value={customer.id.toString()}>
                                                    {customer.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {getFieldError('customer_id') && (
                                        <p className="text-sm text-red-500">{getFieldError('customer_id')}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="startdate">Start Date *</Label>
                                    <Input
                                        id="startdate"
                                        type="date"
                                        value={data.startdate}
                                        onChange={(e) => handleFieldChange('startdate', e.target.value)}
                                        className={getFieldError('startdate') ? 'border-red-500 focus:border-red-500' : ''}
                                    />
                                    {getFieldError('startdate') && (
                                        <p className="text-sm text-red-500">{getFieldError('startdate')}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="volume">Volume (MT) *</Label>
                                    <Input
                                        id="volume"
                                        type="number"
                                        step="0.01"
                                        value={data.volume}
                                        onChange={(e) => handleFieldChange('volume', e.target.value)}
                                        placeholder="Enter volume in metric tons"
                                        className={getFieldError('volume') ? 'border-red-500 focus:border-red-500' : ''}
                                    />
                                    {getFieldError('volume') && (
                                        <p className="text-sm text-red-500">{getFieldError('volume')}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="cargo_service_type">Cargo Service Type *</Label>
                                    <Select
                                        value={data.cargo_service_type}
                                        onValueChange={(value) => handleFieldChange('cargo_service_type', value)}
                                    >
                                        <SelectTrigger className={getFieldError('cargo_service_type') ? 'border-red-500' : ''}>
                                            <SelectValue placeholder="Select service type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {safeCargoServiceTypes.map((option) => (
                                                <SelectItem key={option.value} value={option.value}>
                                                    {option.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {getFieldError('cargo_service_type') && (
                                        <p className="text-sm text-red-500">{getFieldError('cargo_service_type')}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="cargo_type_id">Cargo Type *</Label>
                                    <Select
                                        value={data.cargo_type_id}
                                        onValueChange={(value) => handleFieldChange('cargo_type_id', value)}
                                    >
                                        <SelectTrigger className={getFieldError('cargo_type_id') ? 'border-red-500' : ''}>
                                            <SelectValue placeholder="Select cargo type" />
                                        </SelectTrigger>
                                        <SelectContent className="max-h-72">
                                            {safeCargoTypes.map((type) => (
                                                <SelectItem key={type.id} value={type.id.toString()}>
                                                    {type.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {getFieldError('cargo_type_id') && (
                                        <p className="text-sm text-red-500">{getFieldError('cargo_type_id')}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="km">Distance (KM) *</Label>
                                    <Input
                                        id="km"
                                        type="number"
                                        step="0.01"
                                        value={data.km}
                                        onChange={(e) => handleFieldChange('km', e.target.value)}
                                        placeholder="Enter distance in kilometers"
                                        className={getFieldError('km') ? 'border-red-500 focus:border-red-500' : ''}
                                    />
                                    {getFieldError('km') && (
                                        <p className="text-sm text-red-500">{getFieldError('km')}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="tariff">Tariff *</Label>
                                    <Input
                                        id="tariff"
                                        type="number"
                                        step="0.01"
                                        value={data.tariff}
                                        onChange={(e) => handleFieldChange('tariff', e.target.value)}
                                        placeholder="Enter tariff amount"
                                        className={getFieldError('tariff') ? 'border-red-500 focus:border-red-500' : ''}
                                    />
                                    {getFieldError('tariff') && (
                                        <p className="text-sm text-red-500">{getFieldError('tariff')}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="destination_scope">Destination Scope *</Label>
                                    <Select
                                        value={data.destination_scope}
                                        onValueChange={(value) => handleFieldChange('destination_scope', value)}
                                    >
                                        <SelectTrigger className={getFieldError('destination_scope') ? 'border-red-500' : ''}>
                                            <SelectValue placeholder="Select destination scope" />
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
                                        <p className="text-sm text-red-500">{getFieldError('destination_scope')}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="destination_id">Destination *</Label>
                                    <Select
                                        value={data.destination_id}
                                        onValueChange={(value) => handleFieldChange('destination_id', value)}
                                        disabled={destinationOptions.length === 0}
                                    >
                                        <SelectTrigger className={getFieldError('destination_id') ? 'border-red-500' : ''}>
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
                                        <p className="text-sm text-red-500">{getFieldError('destination_id')}</p>
                                    )}
                                    <p className="text-xs text-muted-foreground">
                                        {selectedDestinationScopeLabel
                                            ? `Showing ${selectedDestinationScopeLabel.toLowerCase()} options.`
                                            : 'Choose a destination scope to load relevant options.'}
                                    </p>
                                </div>

                                <div className="space-y-2 md:col-span-2">
                                    <Label htmlFor="remark">Description</Label>
                                    <Input
                                        id="remark"
                                        type="text"
                                        value={data.remark}
                                        onChange={(e) => setData('remark', e.target.value)}
                                        placeholder="Enter operation description"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="status">Status *</Label>
                                    <Select
                                        value={data.status}
                                        onValueChange={(value) => handleFieldChange('status', value)}
                                    >
                                        <SelectTrigger className={getFieldError('status') ? 'border-red-500' : ''}>
                                            <SelectValue placeholder="Select status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="active">Active</SelectItem>
                                            <SelectItem value="inactive">Inactive</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    {getFieldError('status') && (
                                        <p className="text-sm text-red-500">{getFieldError('status')}</p>
                                    )}
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <Button
                                    type="submit"
                                    disabled={
                                        processing
                                        || Object.keys(frontendErrors).length > 0
                                        || !data.cargo_type_id
                                    }
                                >
                                    {processing ? 'Updating...' : 'Update Operation'}
                                </Button>
                                <Button type="button" variant="outline" asChild>
                                    <a href="/operations">Cancel</a>
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
