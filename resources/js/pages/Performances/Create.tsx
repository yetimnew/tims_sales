import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import AppLayout from '@/layouts/app-layout';
import { Head, Link, useForm } from '@inertiajs/react';
import { type BreadcrumbItem } from '@/types';
import { toast } from '@/hooks/use-toast';
import { AlertCircle, Activity, TrendingUp, DollarSign, Zap, CheckCircle, Loader2 } from 'lucide-react';
import { FormEventHandler, useEffect, useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Performances', href: '/performances' },
    { title: 'Create', href: '/performances/create' },
];

interface Operation {
    id: number;
    operationid: string;
    customer: { id: number; name: string };
}

interface DriverTruck {
    id: number;
    driver: { id: number; name: string };
    truck: { id: number; plate: string };
}

interface Place {
    id: number;
    name: string;
}

interface PerformancesCreateProps {
    operations: Operation[];
    driverTrucks: DriverTruck[];
    places: Place[];
}

export default function PerformancesCreate({ operations, driverTrucks, places }: PerformancesCreateProps) {
    const { data, setData, post, processing, errors } = useForm({
        trip: '',
        LoadType: 'main',
        FOnumber: '',
        operation_id: '',
        driver_truck_id: '',
        DateDispach: new Date().toISOString().split('T')[0],
        orgion_id: '',
        destination_id: '',
        DistanceWCargo: '',
        DistanceWOCargo: '',
        tonkm: '',
        CargoVolumMT: '',
        fuelInLitter: '',
        fuelInBirr: '',
        perdiem: '',
        other: '',
        comment: '',
        satus: 'active',
        is_returned: false,
        returned_date: '',
    });

    const [frontendErrors, setFrontendErrors] = useState<Record<string, string>>({});
    const [calculatedFields, setCalculatedFields] = useState({
        totalKm: 0,
        tonKm: 0,
        totalCost: 0,
    });
    const [distanceStatus, setDistanceStatus] = useState<{ found: boolean; message: string } | null>(null);
    const [distanceLoading, setDistanceLoading] = useState(false);

    const validateField = (field: keyof typeof data, value: string) => {
        const fieldName = String(field);
        let message = '';

        if ((fieldName === 'trip' || fieldName === 'FOnumber') && !value.trim()) {
            message = fieldName === 'trip' ? 'Trip Name is required' : 'FO Number is required';
        }

        if (
            ['operation_id', 'driver_truck_id', 'orgion_id', 'destination_id', 'LoadType', 'DateDispach'].includes(fieldName) &&
            !value
        ) {
            message = 'This field is required';
        }

        setFrontendErrors(prev => ({ ...prev, [fieldName]: message }));
    };

    const recalculateFields = (currentData: typeof data) => {
        const distanceCargo = parseFloat(currentData.DistanceWCargo || '0') || 0;
        const distanceNoCargo = parseFloat(currentData.DistanceWOCargo || '0') || 0;
        const cargo = parseFloat(currentData.CargoVolumMT || '0') || 0;
        const fuel = parseFloat(currentData.fuelInBirr || '0') || 0;
        const perdiem = parseFloat(currentData.perdiem || '0') || 0;
        const other = parseFloat(currentData.other || '0') || 0;

        const totalKmRaw = distanceCargo + distanceNoCargo;
        const tonKmRaw = distanceCargo * cargo;
        const totalCostRaw = fuel + perdiem + other;

        const totalKm = Number.isFinite(totalKmRaw) ? Number(totalKmRaw.toFixed(2)) : 0;
        const tonKm = Number.isFinite(tonKmRaw) ? Number(tonKmRaw.toFixed(2)) : 0;
        const totalCost = Number.isFinite(totalCostRaw) ? Number(totalCostRaw.toFixed(2)) : 0;

        setCalculatedFields({ totalKm, tonKm, totalCost });
        setData('tonkm', tonKm.toFixed(2));
    };

    const handleDistanceAutoFill = async (formState: typeof data) => {
        const originId = formState.orgion_id;
        const destinationId = formState.destination_id;

        if (!originId || !destinationId) {
            return;
        }

        setDistanceLoading(true);

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

            const result = await response.json();
            const numericDistance = typeof result.distance === 'number'
                ? result.distance
                : parseFloat(result.distance ?? '0');
            const safeDistance = Number.isFinite(numericDistance) ? numericDistance : 0;
            const formattedDistance = safeDistance.toFixed(2);

            if (result.found) {
                const nextState = {
                    ...formState,
                    DistanceWCargo: formattedDistance,
                    DistanceWOCargo: formattedDistance,
                };
                setData('DistanceWCargo', formattedDistance);
                setData('DistanceWOCargo', formattedDistance);
                recalculateFields(nextState);
                setDistanceStatus({
                    found: true,
                    message: 'Distance auto-filled from the registered route.',
                });
            } else {
                const nextState = {
                    ...formState,
                    DistanceWCargo: '0.00',
                    DistanceWOCargo: '0.00',
                };
                setData('DistanceWCargo', '0.00');
                setData('DistanceWOCargo', '0.00');
                recalculateFields(nextState);
                setDistanceStatus({
                    found: false,
                    message: result.note ?? 'Distance for this origin/destination is not registered yet.',
                });
            }
        } catch (error) {
            console.error('Distance auto-fill failed:', error);
            const fallbackState = {
                ...formState,
                DistanceWCargo: '0.00',
                DistanceWOCargo: '0.00',
            };
            setData('DistanceWCargo', '0.00');
            setData('DistanceWOCargo', '0.00');
            recalculateFields(fallbackState);
            setDistanceStatus({
                found: false,
                message: 'Unable to resolve distance. Distance was set to 0 km.',
            });
        } finally {
            setDistanceLoading(false);
        }
    };

    const handleFieldChange = (field: keyof typeof data, value: string) => {
        const nextState = { ...data, [field]: value };

        setData(field, value);
        validateField(field, value);

        if (field === 'orgion_id' || field === 'destination_id') {
            setDistanceStatus(null);

            if (nextState.orgion_id && nextState.destination_id) {
                void handleDistanceAutoFill(nextState);
            } else {
                setDistanceLoading(false);
                const clearedState = { ...nextState, DistanceWCargo: '', DistanceWOCargo: '' };
                setData('DistanceWCargo', '');
                setData('DistanceWOCargo', '');
                recalculateFields(clearedState);
            }
        }

        if (
            field === 'DistanceWCargo' ||
            field === 'CargoVolumMT' ||
            field === 'DistanceWOCargo' ||
            field === 'fuelInBirr' ||
            field === 'perdiem' ||
            field === 'other'
        ) {
            recalculateFields(nextState);
        }
    };

    const getFieldError = (fieldName: keyof typeof data) =>
        errors[fieldName] || frontendErrors[String(fieldName)] || '';

    const handleSubmit: FormEventHandler = (event) => {
        event.preventDefault();

        const requiredFields: Array<keyof typeof data> = [
            'trip',
            'FOnumber',
            'operation_id',
            'driver_truck_id',
            'orgion_id',
            'destination_id',
            'DateDispach',
        ];

        let hasErrors = false;

        requiredFields.forEach(field => {
            const value = data[field];
            if (!value) {
                setFrontendErrors(prev => ({ ...prev, [String(field)]: 'This field is required' }));
                hasErrors = true;
            }
        });

        if (hasErrors) {
            toast({ title: 'Validation Error', description: 'Please fill all required fields', variant: 'destructive' });
            return;
        }

        post('/performances');
    };

    useEffect(() => {
        recalculateFields(data);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Create Performance" />
            <div className="flex h-full flex-1 flex-col gap-3 overflow-hidden rounded-xl p-4">
                <div className="flex items-center justify-between gap-4">
                    <div>
                        <h1 className="text-lg font-bold text-foreground">Performance Record</h1>
                        <p className="text-xs text-muted-foreground">Add a new operational performance entry.</p>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground flex-shrink-0">
                        <Activity className="h-3 w-3 text-blue-600" />
                        <span>Ops</span>
                    </div>
                </div>

                <div className="bg-muted/20 rounded-lg p-1.5">
                    <div className="flex-1 bg-muted rounded-full h-1.5">
                        <div className="bg-gradient-to-r from-blue-500 to-blue-600 h-1.5 rounded-full transition-all duration-500" style={{ width: '33%' }}></div>
                    </div>
                </div>

                <Card className="shadow-lg border-0 bg-gradient-to-br from-background to-muted/20 flex-1 flex flex-col overflow-hidden">
                    <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-b flex-shrink-0 p-3">
                        <CardTitle className="flex items-center gap-2 text-base">
                            <Activity className="h-3 w-3 text-blue-600" />
                            Performance Details
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 flex-1 flex flex-col overflow-hidden">
                        <form onSubmit={handleSubmit} className="space-y-6 flex flex-col h-full overflow-hidden">
                            <Tabs defaultValue="basic" className="flex-1 flex flex-col overflow-hidden">
                                <TabsList className="grid w-full grid-cols-3 bg-muted/50 p-1 rounded-lg flex-shrink-0">
                                    <TabsTrigger value="basic" className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                                        <Activity className="h-4 w-4" />
                                        Trip Info
                                    </TabsTrigger>
                                    <TabsTrigger value="distances" className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                                        <TrendingUp className="h-4 w-4" />
                                        Distance & Cargo
                                    </TabsTrigger>
                                    <TabsTrigger value="financial" className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                                        <DollarSign className="h-4 w-4" />
                                        Financial
                                    </TabsTrigger>
                                </TabsList>

                                <TabsContent value="basic" className="space-y-6 flex-1 overflow-y-auto">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <Label htmlFor="trip" className="text-sm font-semibold text-foreground">
                                                Trip Name <span className="text-red-500">*</span>
                                            </Label>
                                            <Input
                                                id="trip"
                                                type="text"
                                                value={data.trip}
                                                onChange={(event) => handleFieldChange('trip', event.target.value)}
                                                placeholder="e.g., TRIP-001"
                                                className={`px-4 py-2.5 bg-background border-2 rounded-lg transition-all duration-200 ${getFieldError('trip') ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : 'border-gray-200 hover:border-gray-300 focus:ring-blue-500/20 focus:border-blue-500'}`}
                                            />
                                            {getFieldError('trip') && (
                                                <p className="text-sm text-red-500 flex items-center gap-1">
                                                    <AlertCircle className="h-3 w-3" />
                                                    {getFieldError('trip')}
                                                </p>
                                            )}
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="FOnumber" className="text-sm font-semibold text-foreground">
                                                FO Number <span className="text-red-500">*</span>
                                            </Label>
                                            <Input
                                                id="FOnumber"
                                                type="text"
                                                value={data.FOnumber}
                                                onChange={(event) => handleFieldChange('FOnumber', event.target.value)}
                                                placeholder="Freight Order number"
                                                className={`px-4 py-2.5 bg-background border-2 rounded-lg transition-all duration-200 ${getFieldError('FOnumber') ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : 'border-gray-200 hover:border-gray-300 focus:ring-blue-500/20 focus:border-blue-500'}`}
                                            />
                                            {getFieldError('FOnumber') && (
                                                <p className="text-sm text-red-500 flex items-center gap-1">
                                                    <AlertCircle className="h-3 w-3" />
                                                    {getFieldError('FOnumber')}
                                                </p>
                                            )}
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="DateDispach" className="text-sm font-semibold text-foreground">
                                                Dispatch Date <span className="text-red-500">*</span>
                                            </Label>
                                            <Input
                                                id="DateDispach"
                                                type="date"
                                                value={data.DateDispach}
                                                onChange={(event) => handleFieldChange('DateDispach', event.target.value)}
                                                className={`px-4 py-2.5 bg-background border-2 rounded-lg transition-all duration-200 ${getFieldError('DateDispach') ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : 'border-gray-200 hover:border-gray-300 focus:ring-blue-500/20 focus:border-blue-500'}`}
                                            />
                                            {getFieldError('DateDispach') && (
                                                <p className="text-sm text-red-500">{getFieldError('DateDispach')}</p>
                                            )}
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="LoadType" className="text-sm font-semibold text-foreground">
                                                Load Type <span className="text-red-500">*</span>
                                            </Label>
                                            <Select value={data.LoadType} onValueChange={(value) => handleFieldChange('LoadType', value)}>
                                                <SelectTrigger className={getFieldError('LoadType') ? 'border-red-500' : ''}>
                                                    <SelectValue placeholder="Select load type" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="main">Main (Loaded)</SelectItem>
                                                    <SelectItem value="return">Return (Empty)</SelectItem>
                                                    <SelectItem value="empty">Empty</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            {getFieldError('LoadType') && (
                                                <p className="text-sm text-red-500">{getFieldError('LoadType')}</p>
                                            )}
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="operation_id" className="text-sm font-semibold text-foreground">
                                                Operation <span className="text-red-500">*</span>
                                            </Label>
                                            <Select value={data.operation_id} onValueChange={(value) => handleFieldChange('operation_id', value)}>
                                                <SelectTrigger className={getFieldError('operation_id') ? 'border-red-500' : ''}>
                                                    <SelectValue placeholder="Select operation" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {operations.map((operation) => (
                                                        <SelectItem key={operation.id} value={operation.id.toString()}>
                                                            {operation.operationid} - {operation.customer.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            {getFieldError('operation_id') && (
                                                <p className="text-sm text-red-500">{getFieldError('operation_id')}</p>
                                            )}
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="driver_truck_id" className="text-sm font-semibold text-foreground">
                                                Driver & Truck <span className="text-red-500">*</span>
                                            </Label>
                                            <Select value={data.driver_truck_id} onValueChange={(value) => handleFieldChange('driver_truck_id', value)}>
                                                <SelectTrigger className={getFieldError('driver_truck_id') ? 'border-red-500' : ''}>
                                                    <SelectValue placeholder="Select driver-truck assignment" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {driverTrucks.map((driverTruck) => (
                                                        <SelectItem key={driverTruck.id} value={driverTruck.id.toString()}>
                                                            {driverTruck.driver.name} - {driverTruck.truck.plate}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            {getFieldError('driver_truck_id') && (
                                                <p className="text-sm text-red-500">{getFieldError('driver_truck_id')}</p>
                                            )}
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="satus" className="text-sm font-semibold text-foreground">
                                                Status <span className="text-red-500">*</span>
                                            </Label>
                                            <Select value={data.satus} onValueChange={(value) => handleFieldChange('satus', value)}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select status" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="active">Active</SelectItem>
                                                    <SelectItem value="inactive">Inactive</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="md:col-span-2 space-y-2">
                                            <Label htmlFor="comment" className="text-sm font-semibold text-foreground">
                                                Comments
                                            </Label>
                                            <textarea
                                                id="comment"
                                                value={data.comment}
                                                onChange={(event) => setData('comment', event.target.value)}
                                                placeholder="Additional notes about the trip..."
                                                rows={3}
                                                className="w-full px-4 py-2.5 bg-background border-2 border-gray-200 hover:border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 resize-none"
                                            />
                                        </div>
                                    </div>
                                </TabsContent>

                                <TabsContent value="distances" className="space-y-6 flex-1 overflow-y-auto">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <Label htmlFor="orgion_id" className="text-sm font-semibold text-foreground flex items-center gap-2">
                                                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                                </svg>
                                                Origin Place <span className="text-red-500">*</span>
                                            </Label>
                                            <Select value={data.orgion_id || undefined} onValueChange={(value) => handleFieldChange('orgion_id', value)}>
                                                <SelectTrigger id="orgion_id" className={getFieldError('orgion_id') ? 'border-red-500' : ''}>
                                                    <SelectValue placeholder="Select origin place" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {places.map((place) => (
                                                        <SelectItem key={place.id} value={place.id.toString()}>
                                                            {place.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            {getFieldError('orgion_id') && (
                                                <p className="text-sm text-red-500">{getFieldError('orgion_id')}</p>
                                            )}
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="destination_id" className="text-sm font-semibold text-foreground flex items-center gap-2">
                                                <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h18M9 7h6M4 11h16M9 15h6M3 19h18" />
                                                </svg>
                                                Destination Place <span className="text-red-500">*</span>
                                            </Label>
                                            <Select value={data.destination_id || undefined} onValueChange={(value) => handleFieldChange('destination_id', value)}>
                                                <SelectTrigger id="destination_id" className={getFieldError('destination_id') ? 'border-red-500' : ''}>
                                                    <SelectValue placeholder="Select destination place" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {places.map((place) => (
                                                        <SelectItem key={place.id} value={place.id.toString()}>
                                                            {place.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            {getFieldError('destination_id') && (
                                                <p className="text-sm text-red-500">{getFieldError('destination_id')}</p>
                                            )}
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="DistanceWCargo" className="text-sm font-semibold text-foreground">
                                                Distance with Cargo (km)
                                            </Label>
                                            <Input
                                                id="DistanceWCargo"
                                                type="number"
                                                step="0.01"
                                                value={data.DistanceWCargo}
                                                readOnly
                                                placeholder="Auto-filled from distance table"
                                                className="px-4 py-2.5 bg-muted/60 border-2 border-gray-200 rounded-lg text-muted-foreground focus-visible:ring-0 focus-visible:border-gray-300 cursor-not-allowed"
                                            />
                                            {distanceLoading && (
                                                <p className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                                                    <Loader2 className="h-3 w-3 animate-spin" />
                                                    Checking registered distance...
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
                                                    <AlertDescription>
                                                        {distanceStatus.message}
                                                        {!distanceStatus.found && (
                                                            <span className="flex items-center gap-1">
                                                                <Link href="/distances/create" className="font-medium text-primary underline">
                                                                    Register this route in Distances
                                                                </Link>
                                                            </span>
                                                        )}
                                                    </AlertDescription>
                                                </Alert>
                                            )}
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="DistanceWOCargo" className="text-sm font-semibold text-foreground">
                                                Distance without Cargo (km)
                                            </Label>
                                            <Input
                                                id="DistanceWOCargo"
                                                type="number"
                                                step="0.01"
                                                value={data.DistanceWOCargo}
                                                onChange={(event) => handleFieldChange('DistanceWOCargo', event.target.value)}
                                                placeholder="Return trip distance"
                                                className="px-4 py-2.5 bg-background border-2 border-gray-200 hover:border-gray-300 rounded-lg focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="CargoVolumMT" className="text-sm font-semibold text-foreground">
                                                Cargo Volume (MT)
                                            </Label>
                                            <Input
                                                id="CargoVolumMT"
                                                type="number"
                                                step="0.01"
                                                value={data.CargoVolumMT}
                                                onChange={(event) => handleFieldChange('CargoVolumMT', event.target.value)}
                                                placeholder="e.g., 10.50"
                                                className="px-4 py-2.5 bg-background border-2 border-gray-200 hover:border-gray-300 rounded-lg focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="fuelInLitter" className="text-sm font-semibold text-foreground">
                                                Fuel Consumed (L)
                                            </Label>
                                            <Input
                                                id="fuelInLitter"
                                                type="number"
                                                step="0.01"
                                                value={data.fuelInLitter}
                                                onChange={(event) => handleFieldChange('fuelInLitter', event.target.value)}
                                                placeholder="e.g., 150.50"
                                                className="px-4 py-2.5 bg-background border-2 border-gray-200 hover:border-gray-300 rounded-lg focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-sm font-medium text-muted-foreground">Total Distance</p>
                                                    <p className="text-2xl font-bold text-purple-600">{calculatedFields.totalKm.toFixed(2)} km</p>
                                                </div>
                                                <TrendingUp className="h-8 w-8 text-purple-500" />
                                            </div>
                                        </div>
                                        <div className="bg-cyan-50 border border-cyan-200 rounded-lg p-4">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-sm font-medium text-muted-foreground">Ton-Km</p>
                                                    <p className="text-2xl font-bold text-cyan-600">{calculatedFields.tonKm.toFixed(2)}</p>
                                                    <p className="text-xs text-muted-foreground mt-1">
                                                        {parseFloat(data.CargoVolumMT || '0').toFixed(2)} MT × {parseFloat(data.DistanceWCargo || '0').toFixed(2)} km
                                                    </p>
                                                </div>
                                                <Zap className="h-8 w-8 text-cyan-500" />
                                            </div>
                                        </div>
                                        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-sm font-medium text-muted-foreground">Estimated Cost</p>
                                                    <p className="text-2xl font-bold text-emerald-600">{calculatedFields.totalCost.toFixed(2)} Birr</p>
                                                </div>
                                                <DollarSign className="h-8 w-8 text-emerald-500" />
                                            </div>
                                        </div>
                                    </div>
                                </TabsContent>

                                <TabsContent value="financial" className="space-y-6 flex-1 overflow-y-auto">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <Label htmlFor="fuelInBirr" className="text-sm font-semibold text-foreground">
                                                Fuel Cost (Birr)
                                            </Label>
                                            <Input
                                                id="fuelInBirr"
                                                type="number"
                                                step="0.01"
                                                value={data.fuelInBirr}
                                                onChange={(event) => handleFieldChange('fuelInBirr', event.target.value)}
                                                placeholder="e.g., 15000.00"
                                                className="px-4 py-2.5 bg-background border-2 border-gray-200 hover:border-gray-300 rounded-lg focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="perdiem" className="text-sm font-semibold text-foreground">
                                                Per Diem (Birr)
                                            </Label>
                                            <Input
                                                id="perdiem"
                                                type="number"
                                                step="0.01"
                                                value={data.perdiem}
                                                onChange={(event) => handleFieldChange('perdiem', event.target.value)}
                                                placeholder="Driver allowance"
                                                className="px-4 py-2.5 bg-background border-2 border-gray-200 hover:border-gray-300 rounded-lg focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="other" className="text-sm font-semibold text-foreground">
                                                Other Costs (Birr)
                                            </Label>
                                            <Input
                                                id="other"
                                                type="number"
                                                step="0.01"
                                                value={data.other}
                                                onChange={(event) => handleFieldChange('other', event.target.value)}
                                                placeholder="Tolls, maintenance, etc."
                                                className="px-4 py-2.5 bg-background border-2 border-gray-200 hover:border-gray-300 rounded-lg focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <label className="flex items-center gap-2 text-sm font-semibold text-foreground">
                                                <input
                                                    type="checkbox"
                                                    checked={data.is_returned}
                                                    onChange={(event) => setData('is_returned', event.target.checked)}
                                                    className="rounded border-gray-300"
                                                />
                                                Truck returned to hub?
                                            </label>
                                            {data.is_returned && (
                                                <div className="space-y-2">
                                                    <Label htmlFor="returned_date" className="text-sm font-semibold text-foreground">
                                                        Returned Date
                                                    </Label>
                                                    <Input
                                                        id="returned_date"
                                                        type="date"
                                                        value={data.returned_date}
                                                        onChange={(event) => setData('returned_date', event.target.value)}
                                                        className="px-4 py-2.5 bg-background border-2 border-gray-200 hover:border-gray-300 rounded-lg focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </TabsContent>
                            </Tabs>

                            <div className="space-y-4 flex-shrink-0 border-t pt-6 mt-auto">
                                <p className="text-sm text-muted-foreground">
                                    Fields marked with <span className="text-red-500 font-semibold">*</span> are required.
                                </p>
                                <div className="flex gap-3">
                                    <Button type="submit" disabled={processing} className="flex-1">
                                        {processing ? 'Creating...' : 'Create Performance'}
                                    </Button>
                                    <Button type="button" variant="outline" onClick={() => window.history.back()}>
                                        Cancel
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

