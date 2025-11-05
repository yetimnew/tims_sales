import React from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, Fuel, Truck, User, MapPin, Calendar, DollarSign, FileText, Edit, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { useForm } from '@inertiajs/react';

interface FuelRecord {
    id: number;
    fuel_date: string;
    fuel_quantity_liters: number;
    fuel_price_per_liter: number;
    total_cost: number;
    fuel_station: string;
    fuel_type: string;
    odometer_reading?: number;
    receipt_number?: string;
    notes?: string;
    driver_truck_id: number;
    created_at: string;
    updated_at: string;
}

interface DriverTruck {
    id: number;
    truck_plate: string;
    truck_model: string;
    driver_name: string;
    driver_license: string;
    assigned_date: string;
}

interface FuelRecordsEditProps {
    fuelRecord: FuelRecord;
    driverTrucks: DriverTruck[];
}

const breadcrumbs = (fuelRecord: FuelRecord): BreadcrumbItem[] => [
    {
        title: 'Fuel Records',
        href: '/fuel-records',
    },
    {
        title: fuelRecord.fuel_station,
        href: `/fuel-records/${fuelRecord.id}`,
    },
    {
        title: 'Edit',
        href: `/fuel-records/${fuelRecord.id}/edit`,
    },
];

export default function FuelRecordsEdit({ fuelRecord, driverTrucks }: FuelRecordsEditProps) {
    const { data, setData, put, processing, errors, hasErrors } = useForm({
        driver_truck_id: fuelRecord.driver_truck_id.toString(),
        fuel_date: new Date(fuelRecord.fuel_date).toISOString().split('T')[0],
        fuel_quantity_liters: fuelRecord.fuel_quantity_liters.toString(),
        fuel_price_per_liter: fuelRecord.fuel_price_per_liter.toString(),
        total_cost: fuelRecord.total_cost.toString(),
        fuel_station: fuelRecord.fuel_station,
        fuel_type: fuelRecord.fuel_type,
        odometer_reading: fuelRecord.odometer_reading?.toString() || '',
        receipt_number: fuelRecord.receipt_number || '',
        notes: fuelRecord.notes || '',
    });

    const handleFieldChange = (field: string, value: string) => {
        setData(field, value);

        // Auto-calculate total cost when quantity or price changes
        if (field === 'fuel_quantity_liters' || field === 'fuel_price_per_liter') {
            const quantity = field === 'fuel_quantity_liters' ? parseFloat(value) || 0 : parseFloat(data.fuel_quantity_liters) || 0;
            const price = field === 'fuel_price_per_liter' ? parseFloat(value) || 0 : parseFloat(data.fuel_price_per_liter) || 0;
            if (quantity > 0 && price > 0) {
                setData('total_cost', (quantity * price).toString());
            }
        }
    };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        put(`/fuel-records/${fuelRecord.id}`);
    };

    const allErrors = { ...errors };

    return (
        <AppLayout breadcrumbs={breadcrumbs(fuelRecord)}>
            <Head title={`Edit Fuel Record - ${fuelRecord.fuel_station}`} />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-hidden rounded-xl p-4">
                {/* Enhanced Professional Header */}
                <div className="bg-gradient-to-r from-slate-50 to-orange-50 dark:from-slate-900 dark:to-orange-950/20 rounded-lg p-6 border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => window.history.back()}
                                className="flex items-center gap-2 hover:bg-slate-100 dark:hover:bg-slate-800 border-slate-300 dark:border-slate-600"
                            >
                                <ArrowLeft className="h-4 w-4" />
                                Back to Fuel Record
                            </Button>
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-xl">
                                    <Edit className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Edit Fuel Record</h1>
                                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Update fuel consumption record details</p>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 rounded-full text-sm font-medium">
                                <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                                Editing Mode
                            </div>
                        </div>
                    </div>
                </div>

                {hasErrors && (
                    <Alert variant="destructive" className="border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/20">
                        <Edit className="h-4 w-4" />
                        <AlertDescription className="text-red-800 dark:text-red-200">
                            Please fix the errors below before submitting the form
                        </AlertDescription>
                    </Alert>
                )}

                {/* Form */}
                <Card className="shadow-lg border-0 bg-gradient-to-br from-background to-muted/20">
                    <CardHeader className="bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20 border-b">
                        <CardTitle className="flex items-center gap-2 text-xl">
                            <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                                <Fuel className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                            </div>
                            Update Fuel Record Information
                        </CardTitle>
                        <CardDescription className="text-base">
                            Modify fuel consumption details for this record
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-6">
                        <form onSubmit={submit} className="space-y-8">
                            {/* Driver-Truck Assignment Selection */}
                            <div className="space-y-4">
                                <div className="rounded-lg bg-slate-50 dark:bg-slate-800/50 p-4 border border-slate-200 dark:border-slate-700">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="p-1.5 bg-slate-100 dark:bg-slate-900/30 rounded-lg">
                                            <Truck className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                                        </div>
                                        <div>
                                            <Label htmlFor="driver_truck_id" className="text-sm font-medium text-slate-700 dark:text-slate-300">Driver-Truck Assignment *</Label>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Required field - select the driver-truck assignment</p>
                                        </div>
                                    </div>
                                    <Select value={data.driver_truck_id} onValueChange={(value) => handleFieldChange('driver_truck_id', value)}>
                                        <SelectTrigger className={`transition-colors focus:ring-2 focus:ring-orange-500 ${allErrors.driver_truck_id ? 'border-red-500 focus:ring-red-500' : ''}`}>
                                            <SelectValue placeholder="Select driver-truck assignment" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {driverTrucks.map((assignment) => (
                                                <SelectItem key={assignment.id} value={assignment.id.toString()}>
                                                    {assignment.truck_plate} ({assignment.truck_model}) - {assignment.driver_name} (License: {assignment.driver_license})
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {allErrors.driver_truck_id && (
                                        <div className="flex items-center gap-2 mt-2 text-red-600 dark:text-red-400">
                                            <Edit className="h-4 w-4" />
                                            <p className="text-sm">{allErrors.driver_truck_id}</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Fuel Date and Station */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <div className="rounded-lg bg-slate-50 dark:bg-slate-800/50 p-4 border border-slate-200 dark:border-slate-700">
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="p-1.5 bg-slate-100 dark:bg-slate-900/30 rounded-lg">
                                                <Calendar className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                                            </div>
                                            <div>
                                                <Label htmlFor="fuel_date" className="text-sm font-medium text-slate-700 dark:text-slate-300">Fuel Date *</Label>
                                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Required field - date of fuel purchase</p>
                                            </div>
                                        </div>
                                        <Input
                                            id="fuel_date"
                                            type="date"
                                            value={data.fuel_date}
                                            onChange={(e) => handleFieldChange('fuel_date', e.target.value)}
                                            className={`transition-colors focus:ring-2 focus:ring-orange-500 ${allErrors.fuel_date ? 'border-red-500 focus:ring-red-500' : ''}`}
                                        />
                                        {allErrors.fuel_date && (
                                            <div className="flex items-center gap-2 mt-2 text-red-600 dark:text-red-400">
                                                <Edit className="h-4 w-4" />
                                                <p className="text-sm">{allErrors.fuel_date}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="rounded-lg bg-slate-50 dark:bg-slate-800/50 p-4 border border-slate-200 dark:border-slate-700">
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="p-1.5 bg-slate-100 dark:bg-slate-900/30 rounded-lg">
                                                <MapPin className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                                            </div>
                                            <div>
                                                <Label htmlFor="fuel_station" className="text-sm font-medium text-slate-700 dark:text-slate-300">Fuel Station *</Label>
                                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Required field - name of fuel station</p>
                                            </div>
                                        </div>
                                        <Input
                                            id="fuel_station"
                                            type="text"
                                            value={data.fuel_station}
                                            onChange={(e) => handleFieldChange('fuel_station', e.target.value)}
                                            placeholder="e.g., Total Station Bole, Shell Station Addis Ababa"
                                            className={`transition-colors focus:ring-2 focus:ring-orange-500 ${allErrors.fuel_station ? 'border-red-500 focus:ring-red-500' : ''}`}
                                        />
                                        {allErrors.fuel_station && (
                                            <div className="flex items-center gap-2 mt-2 text-red-600 dark:text-red-400">
                                                <Edit className="h-4 w-4" />
                                                <p className="text-sm">{allErrors.fuel_station}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Fuel Type and Quantity */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="space-y-4">
                                    <div className="rounded-lg bg-slate-50 dark:bg-slate-800/50 p-4 border border-slate-200 dark:border-slate-700">
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="p-1.5 bg-slate-100 dark:bg-slate-900/30 rounded-lg">
                                                <Fuel className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                                            </div>
                                            <div>
                                                <Label htmlFor="fuel_type" className="text-sm font-medium text-slate-700 dark:text-slate-300">Fuel Type *</Label>
                                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Required field - type of fuel</p>
                                            </div>
                                        </div>
                                        <Select value={data.fuel_type} onValueChange={(value) => handleFieldChange('fuel_type', value)}>
                                            <SelectTrigger className={`transition-colors focus:ring-2 focus:ring-orange-500 ${allErrors.fuel_type ? 'border-red-500 focus:ring-red-500' : ''}`}>
                                                <SelectValue placeholder="Select fuel type" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="diesel">Diesel</SelectItem>
                                                <SelectItem value="petrol">Petrol</SelectItem>
                                                <SelectItem value="gas">Gas</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        {allErrors.fuel_type && (
                                            <div className="flex items-center gap-2 mt-2 text-red-600 dark:text-red-400">
                                                <Edit className="h-4 w-4" />
                                                <p className="text-sm">{allErrors.fuel_type}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="rounded-lg bg-slate-50 dark:bg-slate-800/50 p-4 border border-slate-200 dark:border-slate-700">
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="p-1.5 bg-slate-100 dark:bg-slate-900/30 rounded-lg">
                                                <Fuel className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                                            </div>
                                            <div>
                                                <Label htmlFor="fuel_quantity_liters" className="text-sm font-medium text-slate-700 dark:text-slate-300">Quantity (Liters) *</Label>
                                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Required field - amount of fuel in liters</p>
                                            </div>
                                        </div>
                                        <Input
                                            id="fuel_quantity_liters"
                                            type="number"
                                            step="0.01"
                                            min="0.01"
                                            value={data.fuel_quantity_liters}
                                            onChange={(e) => handleFieldChange('fuel_quantity_liters', e.target.value)}
                                            placeholder="e.g., 50.00"
                                            className={`transition-colors focus:ring-2 focus:ring-orange-500 ${allErrors.fuel_quantity_liters ? 'border-red-500 focus:ring-red-500' : ''}`}
                                        />
                                        {allErrors.fuel_quantity_liters && (
                                            <div className="flex items-center gap-2 mt-2 text-red-600 dark:text-red-400">
                                                <Edit className="h-4 w-4" />
                                                <p className="text-sm">{allErrors.fuel_quantity_liters}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="rounded-lg bg-slate-50 dark:bg-slate-800/50 p-4 border border-slate-200 dark:border-slate-700">
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="p-1.5 bg-slate-100 dark:bg-slate-900/30 rounded-lg">
                                                <DollarSign className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                                            </div>
                                            <div>
                                                <Label htmlFor="fuel_price_per_liter" className="text-sm font-medium text-slate-700 dark:text-slate-300">Price per Liter *</Label>
                                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Required field - price per liter in ETB</p>
                                            </div>
                                        </div>
                                        <Input
                                            id="fuel_price_per_liter"
                                            type="number"
                                            step="0.01"
                                            min="0.01"
                                            value={data.fuel_price_per_liter}
                                            onChange={(e) => handleFieldChange('fuel_price_per_liter', e.target.value)}
                                            placeholder="e.g., 35.50"
                                            className={`transition-colors focus:ring-2 focus:ring-orange-500 ${allErrors.fuel_price_per_liter ? 'border-red-500 focus:ring-red-500' : ''}`}
                                        />
                                        {allErrors.fuel_price_per_liter && (
                                            <div className="flex items-center gap-2 mt-2 text-red-600 dark:text-red-400">
                                                <Edit className="h-4 w-4" />
                                                <p className="text-sm">{allErrors.fuel_price_per_liter}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Total Cost */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <div className="rounded-lg bg-green-50 dark:bg-green-950/20 p-4 border border-green-200 dark:border-green-800">
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="p-1.5 bg-green-100 dark:bg-green-900/30 rounded-lg">
                                                <DollarSign className="h-4 w-4 text-green-600 dark:text-green-400" />
                                            </div>
                                            <div>
                                                <Label htmlFor="total_cost" className="text-sm font-medium text-green-700 dark:text-green-300">Total Cost *</Label>
                                                <p className="text-xs text-green-600 dark:text-green-400 mt-1">Auto-calculated from quantity × price per liter</p>
                                            </div>
                                        </div>
                                        <Input
                                            id="total_cost"
                                            type="number"
                                            step="0.01"
                                            min="0.01"
                                            value={data.total_cost}
                                            onChange={(e) => handleFieldChange('total_cost', e.target.value)}
                                            placeholder="Auto-calculated"
                                            className={`transition-colors focus:ring-2 focus:ring-green-500 ${allErrors.total_cost ? 'border-red-500 focus:ring-red-500' : ''}`}
                                        />
                                        {allErrors.total_cost && (
                                            <div className="flex items-center gap-2 mt-2 text-red-600 dark:text-red-400">
                                                <Edit className="h-4 w-4" />
                                                <p className="text-sm">{allErrors.total_cost}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="rounded-lg bg-slate-50 dark:bg-slate-800/50 p-4 border border-slate-200 dark:border-slate-700">
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="p-1.5 bg-slate-100 dark:bg-slate-900/30 rounded-lg">
                                                <FileText className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                                            </div>
                                            <div>
                                                <Label htmlFor="receipt_number" className="text-sm font-medium text-slate-700 dark:text-slate-300">Receipt Number</Label>
                                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Optional - receipt number for reference</p>
                                            </div>
                                        </div>
                                        <Input
                                            id="receipt_number"
                                            type="text"
                                            value={data.receipt_number}
                                            onChange={(e) => handleFieldChange('receipt_number', e.target.value)}
                                            placeholder="e.g., RCP-001234"
                                            className={`transition-colors focus:ring-2 focus:ring-orange-500 ${allErrors.receipt_number ? 'border-red-500 focus:ring-red-500' : ''}`}
                                        />
                                        {allErrors.receipt_number && (
                                            <div className="flex items-center gap-2 mt-2 text-red-600 dark:text-red-400">
                                                <Edit className="h-4 w-4" />
                                                <p className="text-sm">{allErrors.receipt_number}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Odometer Reading and Notes */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <div className="rounded-lg bg-slate-50 dark:bg-slate-800/50 p-4 border border-slate-200 dark:border-slate-700">
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="p-1.5 bg-slate-100 dark:bg-slate-900/30 rounded-lg">
                                                <Fuel className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                                            </div>
                                            <div>
                                                <Label htmlFor="odometer_reading" className="text-sm font-medium text-slate-700 dark:text-slate-300">Odometer Reading</Label>
                                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Optional - vehicle mileage at time of fueling</p>
                                            </div>
                                        </div>
                                        <Input
                                            id="odometer_reading"
                                            type="number"
                                            min="0"
                                            value={data.odometer_reading}
                                            onChange={(e) => handleFieldChange('odometer_reading', e.target.value)}
                                            placeholder="e.g., 150000"
                                            className={`transition-colors focus:ring-2 focus:ring-orange-500 ${allErrors.odometer_reading ? 'border-red-500 focus:ring-red-500' : ''}`}
                                        />
                                        {allErrors.odometer_reading && (
                                            <div className="flex items-center gap-2 mt-2 text-red-600 dark:text-red-400">
                                                <Edit className="h-4 w-4" />
                                                <p className="text-sm">{allErrors.odometer_reading}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="rounded-lg bg-slate-50 dark:bg-slate-800/50 p-4 border border-slate-200 dark:border-slate-700">
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="p-1.5 bg-slate-100 dark:bg-slate-900/30 rounded-lg">
                                                <FileText className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                                            </div>
                                            <div>
                                                <Label htmlFor="notes" className="text-sm font-medium text-slate-700 dark:text-slate-300">Notes</Label>
                                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Optional - additional notes or comments</p>
                                            </div>
                                        </div>
                                        <Textarea
                                            id="notes"
                                            value={data.notes}
                                            onChange={(e) => handleFieldChange('notes', e.target.value)}
                                            placeholder="Any additional notes about this fuel purchase..."
                                            rows={3}
                                            className={`transition-colors focus:ring-2 focus:ring-orange-500 ${allErrors.notes ? 'border-red-500 focus:ring-red-500' : ''}`}
                                        />
                                        {allErrors.notes && (
                                            <div className="flex items-center gap-2 mt-2 text-red-600 dark:text-red-400">
                                                <Edit className="h-4 w-4" />
                                                <p className="text-sm">{allErrors.notes}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex items-center justify-between pt-6 border-t border-slate-200 dark:border-slate-700">
                                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                                    <Edit className="h-4 w-4" />
                                    <span>Fields marked with * are required</span>
                                </div>
                                <div className="flex gap-3">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => window.history.back()}
                                        className="hover:bg-slate-50 hover:border-slate-300"
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={processing || hasErrors}
                                        className="bg-orange-600 hover:bg-orange-700 text-white px-6"
                                    >
                                        <Save className="mr-2 h-4 w-4" />
                                        {processing ? 'Updating...' : 'Update Fuel Record'}
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
