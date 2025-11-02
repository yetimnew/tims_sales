import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AppLayout from '@/layouts/app-layout';
import { Head, useForm } from '@inertiajs/react';
import { type BreadcrumbItem } from '@/types';
import { toast } from '@/hooks/use-toast';
import { AlertCircle, CheckCircle, Activity, TrendingUp, DollarSign, Zap } from 'lucide-react';
import { FormEventHandler, useEffect, useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Performances',
        href: '/performances',
    },
    {
        title: 'Create',
        href: '/performances/create',
    },
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
    const [originSearch, setOriginSearch] = useState('');
    const [destinationSearch, setDestinationSearch] = useState('');

    // Validate field
    const validateField = (field: string, value: string) => {
        const errors: Record<string, string> = {};

        if (['trip', 'FOnumber'].includes(field) && !value.trim()) {
            errors[field] = `${field === 'trip' ? 'Trip Name' : 'FO Number'} is required`;
        }

        if (['operation_id', 'driver_truck_id', 'orgion_id', 'destination_id'].includes(field) && !value) {
            errors[field] = 'This field is required';
        }

        setFrontendErrors(prev => ({ ...prev, [field]: errors[field] || '' }));
    };

    // Handle field change with validation
    const handleFieldChange = (field: string, value: string) => {
        setData(field as any, value);
        validateField(field, value);

        // Auto-fill distance when origin and destination are selected
        if ((field === 'orgion_id' || field === 'destination_id') && data.orgion_id && data.destination_id) {
            handleDistanceAutoFill(field === 'orgion_id' ? value : data.orgion_id, field === 'destination_id' ? value : data.destination_id);
        }

        // Recalculate when cargo or distance changes
        if (['DistanceWCargo', 'CargoVolumMT', 'DistanceWOCargo', 'fuelInBirr', 'perdiem', 'other'].includes(field)) {
            recalculateFields({ ...data, [field]: value });
        }
    };

    // Auto-fill distance from distance table
    const handleDistanceAutoFill = async (originId: string, destinationId: string) => {
        if (!originId || !destinationId) return;

        try {
            const response = await fetch('/performances/ajax-distance', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '' },
                body: JSON.stringify({ from_place_id: originId, to_place_id: destinationId }),
            });

            const result = await response.json();
            if (result.distance) {
                setData('DistanceWCargo', result.distance.toString());
                recalculateFields({ ...data, DistanceWCargo: result.distance.toString() });
                toast({ title: 'Success', description: 'Distance auto-filled from database', variant: 'default' });
            }
        } catch (error) {
            console.error('Distance auto-fill failed:', error);
        }
    };

    // Recalculate TonKM and Total Cost
    const recalculateFields = (currentData: any) => {
        const distanceCargo = parseFloat(currentData.DistanceWCargo) || 0;
        const distanceNoCargo = parseFloat(currentData.DistanceWOCargo) || 0;
        const cargo = parseFloat(currentData.CargoVolumMT) || 0;
        const fuel = parseFloat(currentData.fuelInBirr) || 0;
        const perdiem = parseFloat(currentData.perdiem) || 0;
        const other = parseFloat(currentData.other) || 0;

        const totalKm = distanceCargo + distanceNoCargo;
        const tonKm = distanceCargo * cargo;
        const totalCost = fuel + perdiem + other;

        setCalculatedFields({ totalKm, tonKm, totalCost });
        setData('tonkm', tonKm.toString());
    };

    // Filter places by search term
    const filteredOriginPlaces = places.filter(place =>
        place.name.toLowerCase().includes(originSearch.toLowerCase())
    );

    const filteredDestinationPlaces = places.filter(place =>
        place.name.toLowerCase().includes(destinationSearch.toLowerCase())
    );

    const getFieldError = (fieldName: string) => errors[fieldName as keyof typeof errors] || frontendErrors[fieldName] || '';

    const handleSubmit: FormEventHandler = (e) => {
        e.preventDefault();

        // Validate required fields
        const requiredFields = ['trip', 'FOnumber', 'operation_id', 'driver_truck_id', 'orgion_id', 'destination_id', 'DateDispach'];
        let hasErrors = false;

        requiredFields.forEach(field => {
            if (!data[field as keyof typeof data]) {
                setFrontendErrors(prev => ({ ...prev, [field]: 'This field is required' }));
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
    }, []);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Create Performance" />
            <div className="flex h-full flex-1 flex-col gap-3 overflow-hidden rounded-xl p-4">
                {/* Enhanced Header */}
                <div className="flex items-center justify-between gap-4">
                    <div>
                        <h1 className="text-lg font-bold text-foreground">Performance Record</h1>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground flex-shrink-0">
                        <Activity className="h-3 w-3 text-blue-600" />
                        <span>Ops</span>
                    </div>
                </div>

                {/* Minimalist Progress Indicator */}
                <div className="bg-muted/20 rounded-lg p-1.5">
                    <div className="flex-1 bg-muted rounded-full h-1.5">
                        <div className="bg-gradient-to-r from-blue-500 to-blue-600 h-1.5 rounded-full transition-all duration-500" style={{width: '33%'}}></div>
                    </div>
                </div>

                {/* Enhanced Form */}
                <Card className="shadow-lg border-0 bg-gradient-to-br from-background to-muted/20 flex-1 flex flex-col overflow-hidden">
                    <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-b flex-shrink-0 p-2">
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

                                {/* TAB 1: TRIP INFORMATION */}
                                <TabsContent value="basic" className="space-y-6 flex-1 overflow-y-auto">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {/* Trip Name */}
                                        <div className="space-y-2">
                                            <Label htmlFor="trip" className="text-sm font-semibold text-foreground">
                                                Trip Name <span className="text-red-500">*</span>
                                            </Label>
                                            <Input
                                                id="trip"
                                                type="text"
                                                value={data.trip}
                                                onChange={(e) => handleFieldChange('trip', e.target.value)}
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

                                        {/* FO Number */}
                                        <div className="space-y-2">
                                            <Label htmlFor="FOnumber" className="text-sm font-semibold text-foreground">
                                                FO Number <span className="text-red-500">*</span>
                                            </Label>
                                            <Input
                                                id="FOnumber"
                                                type="text"
                                                value={data.FOnumber}
                                                onChange={(e) => handleFieldChange('FOnumber', e.target.value)}
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

                                        {/* Dispatch Date */}
                                        <div className="space-y-2">
                                            <Label htmlFor="DateDispach" className="text-sm font-semibold text-foreground">
                                                Dispatch Date <span className="text-red-500">*</span>
                                            </Label>
                                            <Input
                                                id="DateDispach"
                                                type="date"
                                                value={data.DateDispach}
                                                onChange={(e) => handleFieldChange('DateDispach', e.target.value)}
                                                className="px-4 py-2.5 bg-background border-2 border-gray-200 hover:border-gray-300 rounded-lg focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                                            />
                                            {getFieldError('DateDispach') && (
                                                <p className="text-sm text-red-500">{getFieldError('DateDispach')}</p>
                                            )}
                                        </div>

                                        {/* Load Type */}
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

                                        {/* Operation */}
                                        <div className="space-y-2">
                                            <Label htmlFor="operation_id" className="text-sm font-semibold text-foreground">
                                                Operation <span className="text-red-500">*</span>
                                            </Label>
                                            <Select value={data.operation_id} onValueChange={(value) => handleFieldChange('operation_id', value)}>
                                                <SelectTrigger className={getFieldError('operation_id') ? 'border-red-500' : ''}>
                                                    <SelectValue placeholder="Select operation" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {operations.map((op) => (
                                                        <SelectItem key={op.id} value={op.id.toString()}>
                                                            {op.operationid} - {op.customer.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            {getFieldError('operation_id') && (
                                                <p className="text-sm text-red-500">{getFieldError('operation_id')}</p>
                                            )}
                                        </div>

                                        {/* Driver-Truck Assignment */}
                                        <div className="space-y-2">
                                            <Label htmlFor="driver_truck_id" className="text-sm font-semibold text-foreground">
                                                Driver & Truck <span className="text-red-500">*</span>
                                            </Label>
                                            <Select value={data.driver_truck_id} onValueChange={(value) => handleFieldChange('driver_truck_id', value)}>
                                                <SelectTrigger className={getFieldError('driver_truck_id') ? 'border-red-500' : ''}>
                                                    <SelectValue placeholder="Select driver-truck assignment" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {driverTrucks.map((dt) => (
                                                        <SelectItem key={dt.id} value={dt.id.toString()}>
                                                            {dt.driver.name} - {dt.truck.plate}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            {getFieldError('driver_truck_id') && (
                                                <p className="text-sm text-red-500">{getFieldError('driver_truck_id')}</p>
                                            )}
                                </div>

                                        {/* Status */}
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

                                        {/* Comments */}
                                        <div className="md:col-span-2 space-y-2">
                                            <Label htmlFor="comment" className="text-sm font-semibold text-foreground">
                                                Comments
                                            </Label>
                                            <textarea
                                                id="comment"
                                                value={data.comment}
                                                onChange={(e) => setData('comment', e.target.value)}
                                                placeholder="Additional notes about the trip..."
                                                rows={3}
                                                className="w-full px-4 py-2.5 bg-background border-2 border-gray-200 hover:border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 resize-none"
                                            />
                                </div>
                                </div>
                                </TabsContent>

                                {/* TAB 2: DISTANCE & CARGO */}
                                <TabsContent value="distances" className="space-y-6 flex-1 overflow-visible">
                                    <div className="overflow-y-auto max-h-[60vh]">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {/* Origin */}
                                        <div className="space-y-2">
                                            <Label htmlFor="orgion_id" className="text-sm font-semibold text-foreground flex items-center gap-2">
                                                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                                </svg>
                                                Origin Place <span className="text-red-500">*</span>
                                            </Label>
                                            <div className="relative overflow-visible">
                                                <Input
                                                    id="origin_search"
                                                    type="text"
                                                    placeholder="Search or select origin place..."
                                                    value={originSearch}
                                                    onChange={(e) => setOriginSearch(e.target.value)}
                                                    className="px-4 py-2.5 bg-background border-2 border-gray-200 hover:border-gray-300 rounded-lg focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                                                />
                                                {filteredOriginPlaces.length > 0 && originSearch && (
                                                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border-2 border-gray-200 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto pointer-events-auto">
                                                        {filteredOriginPlaces.map((place) => (
                                                            <div
                                                                key={place.id}
                                                                onClick={() => {
                                                                    setData('orgion_id', place.id.toString());
                                                                    setOriginSearch(place.name);
                                                                    handleFieldChange('orgion_id', place.id.toString());
                                                                }}
                                                                className="px-4 py-2.5 hover:bg-purple-50 cursor-pointer border-b last:border-b-0 transition-colors"
                                                            >
                                                                {place.name}
                                </div>
                                                        ))}
                                </div>
                                                )}
                                </div>
                                            {getFieldError('orgion_id') && (
                                                <p className="text-sm text-red-500">{getFieldError('orgion_id')}</p>
                                            )}
                                </div>

                                        {/* Destination */}
                                        <div className="space-y-2">
                                            <Label htmlFor="destination_id" className="text-sm font-semibold text-foreground flex items-center gap-2">
                                                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                                </svg>
                                                Destination Place <span className="text-red-500">*</span>
                                            </Label>
                                            <div className="relative overflow-visible">
                                                <Input
                                                    id="destination_search"
                                                    type="text"
                                                    placeholder="Search or select destination place..."
                                                    value={destinationSearch}
                                                    onChange={(e) => setDestinationSearch(e.target.value)}
                                                    className="px-4 py-2.5 bg-background border-2 border-gray-200 hover:border-gray-300 rounded-lg focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                                                />
                                                {filteredDestinationPlaces.length > 0 && destinationSearch && (
                                                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border-2 border-gray-200 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
                                                        {filteredDestinationPlaces.map((place) => (
                                                            <div
                                                                key={place.id}
                                                                onClick={() => {
                                                                    setData('destination_id', place.id.toString());
                                                                    setDestinationSearch(place.name);
                                                                    handleFieldChange('destination_id', place.id.toString());
                                                                }}
                                                                className="px-4 py-2.5 hover:bg-purple-50 cursor-pointer border-b last:border-b-0 transition-colors"
                                                            >
                                                                {place.name}
                                </div>
                                                        ))}
                                </div>
                                                )}
                                </div>
                                            {getFieldError('destination_id') && (
                                                <p className="text-sm text-red-500">{getFieldError('destination_id')}</p>
                                            )}
                                </div>

                                        {/* Distance with Cargo */}
                                        <div className="space-y-2">
                                            <Label htmlFor="DistanceWCargo" className="text-sm font-semibold text-foreground">
                                                Distance with Cargo (km)
                                            </Label>
                                            <Input
                                                id="DistanceWCargo"
                                                type="number"
                                                step="0.01"
                                                value={data.DistanceWCargo}
                                                onChange={(e) => handleFieldChange('DistanceWCargo', e.target.value)}
                                                placeholder="Auto-filled from distance table"
                                                className="px-4 py-2.5 bg-background border-2 border-gray-200 hover:border-gray-300 rounded-lg focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                                            />
                                </div>

                                        {/* Distance without Cargo */}
                                        <div className="space-y-2">
                                            <Label htmlFor="DistanceWOCargo" className="text-sm font-semibold text-foreground">
                                                Distance without Cargo (km)
                                            </Label>
                                            <Input
                                                id="DistanceWOCargo"
                                                type="number"
                                                step="0.01"
                                                value={data.DistanceWOCargo}
                                                onChange={(e) => handleFieldChange('DistanceWOCargo', e.target.value)}
                                                placeholder="Return trip distance"
                                                className="px-4 py-2.5 bg-background border-2 border-gray-200 hover:border-gray-300 rounded-lg focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                                            />
                                </div>

                                        {/* Cargo Volume */}
                                        <div className="space-y-2">
                                            <Label htmlFor="CargoVolumMT" className="text-sm font-semibold text-foreground">
                                                Cargo Volume (MT)
                                            </Label>
                                            <Input
                                                id="CargoVolumMT"
                                                type="number"
                                                step="0.01"
                                                value={data.CargoVolumMT}
                                                onChange={(e) => handleFieldChange('CargoVolumMT', e.target.value)}
                                                placeholder="e.g., 10.50"
                                                className="px-4 py-2.5 bg-background border-2 border-gray-200 hover:border-gray-300 rounded-lg focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                                            />
                                </div>
                                </div>

                                    {/* Calculated Fields - Total KM */}
                                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                                        <div className="flex items-center justify-between">
                                <div>
                                                <p className="text-sm font-medium text-muted-foreground">Total Distance</p>
                                                <p className="text-2xl font-bold text-purple-600">{calculatedFields.totalKm.toFixed(2)} KM</p>
                                </div>
                                            <TrendingUp className="h-8 w-8 text-purple-500" />
                                </div>
                            </div>

                                    {/* Calculated Fields - Ton-KM */}
                                    <div className="bg-cyan-50 border border-cyan-200 rounded-lg p-4">
                                        <div className="flex items-center justify-between">
                                <div>
                                                <p className="text-sm font-medium text-muted-foreground">Efficiency Metric (Ton-KM)</p>
                                                <p className="text-2xl font-bold text-cyan-600">{calculatedFields.tonKm.toFixed(2)} ton-km</p>
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    {parseFloat(data.CargoVolumMT || '0').toFixed(2)} MT × {parseFloat(data.DistanceWCargo || '0').toFixed(2)} KM
                                                </p>
                                </div>
                                            <Zap className="h-8 w-8 text-cyan-500" />
                                </div>
                                </div>
                                    </div>
                                </TabsContent>

                                {/* TAB 3: FINANCIAL */}
                                <TabsContent value="financial" className="space-y-6 flex-1 overflow-y-auto">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {/* Fuel in Litters */}
                                        <div className="space-y-2">
                                            <Label htmlFor="fuelInLitter" className="text-sm font-semibold text-foreground">
                                                Fuel Consumed (Liters)
                                            </Label>
                                            <Input
                                                id="fuelInLitter"
                                                type="number"
                                                step="0.01"
                                                value={data.fuelInLitter}
                                                onChange={(e) => handleFieldChange('fuelInLitter', e.target.value)}
                                                placeholder="e.g., 150.50"
                                                className="px-4 py-2.5 bg-background border-2 border-gray-200 hover:border-gray-300 rounded-lg focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                                            />
                                </div>

                                        {/* Fuel Cost */}
                                        <div className="space-y-2">
                                            <Label htmlFor="fuelInBirr" className="text-sm font-semibold text-foreground">
                                                Fuel Cost (Birr)
                                            </Label>
                                            <Input
                                                id="fuelInBirr"
                                                type="number"
                                                step="0.01"
                                                value={data.fuelInBirr}
                                                onChange={(e) => handleFieldChange('fuelInBirr', e.target.value)}
                                                placeholder="e.g., 15000.00"
                                                className="px-4 py-2.5 bg-background border-2 border-gray-200 hover:border-gray-300 rounded-lg focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                                            />
                                </div>

                                        {/* Per Diem */}
                                        <div className="space-y-2">
                                            <Label htmlFor="perdiem" className="text-sm font-semibold text-foreground">
                                                Per Diem (Birr)
                                            </Label>
                                            <Input
                                                id="perdiem"
                                                type="number"
                                                step="0.01"
                                                value={data.perdiem}
                                                onChange={(e) => handleFieldChange('perdiem', e.target.value)}
                                                placeholder="Driver allowance"
                                                className="px-4 py-2.5 bg-background border-2 border-gray-200 hover:border-gray-300 rounded-lg focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                                            />
                                </div>

                                        {/* Other Costs */}
                                        <div className="space-y-2">
                                            <Label htmlFor="other" className="text-sm font-semibold text-foreground">
                                                Other Costs (Birr)
                                            </Label>
                                            <Input
                                                id="other"
                                                type="number"
                                                step="0.01"
                                                value={data.other}
                                                onChange={(e) => handleFieldChange('other', e.target.value)}
                                                placeholder="Tolls, maintenance, etc."
                                                className="px-4 py-2.5 bg-background border-2 border-gray-200 hover:border-gray-300 rounded-lg focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                                            />
                                </div>

                                        {/* Is Returned */}
                                        <div className="space-y-2">
                                            <label className="flex items-center gap-2 text-sm font-semibold text-foreground">
                                                <input
                                                    type="checkbox"
                                                    checked={data.is_returned}
                                                    onChange={(e) => setData('is_returned', e.target.checked)}
                                                    className="rounded"
                                                />
                                                Truck has been returned?
                                            </label>
                                </div>

                                        {/* Returned Date */}
                                        {data.is_returned && (
                                            <div className="space-y-2">
                                                <Label htmlFor="returned_date" className="text-sm font-semibold text-foreground">
                                                    Returned Date
                                                </Label>
                                                <Input
                                                    id="returned_date"
                                                    type="date"
                                                    value={data.returned_date}
                                                    onChange={(e) => setData('returned_date', e.target.value)}
                                                    className="focus:ring-blue-500/20 focus:border-blue-500"
                                                />
                                </div>
                                        )}
                                </div>

                                    {/* Calculated Fields - Total Cost */}
                                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                                        <div className="flex items-center justify-between">
                                <div>
                                                <p className="text-sm font-medium text-muted-foreground">Total Trip Cost</p>
                                                <p className="text-2xl font-bold text-purple-600">{calculatedFields.totalCost.toFixed(2)} Birr</p>
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    Fuel ({parseFloat(data.fuelInBirr || '0').toFixed(2)}) + Perdiem ({parseFloat(data.perdiem || '0').toFixed(2)}) + Other ({parseFloat(data.other || '0').toFixed(2)})
                                                </p>
                                </div>
                                            <DollarSign className="h-8 w-8 text-purple-500" />
                                </div>
                            </div>
                                </TabsContent>
                            </Tabs>

                            {/* Submit Section */}
                            <div className="space-y-4 flex-shrink-0 border-t pt-6 mt-auto">
                                <p className="text-sm text-muted-foreground">
                                    Fields marked with <span className="text-red-500 font-semibold">*</span> are required
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

