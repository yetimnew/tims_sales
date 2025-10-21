import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import AppLayout from '@/layouts/app-layout';
import { Head, useForm } from '@inertiajs/react';
import { type BreadcrumbItem } from '@/types';
import { FormEventHandler, useEffect, useState } from 'react';
import { validateFuel, type ValidationErrors } from '@/lib/validation';
import { useToast } from '@/hooks/use-toast';
import { CircleAlert } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Fuel',
        href: '/fuel',
    },
    {
        title: 'Edit',
        href: '#',
    },
];

interface FuelRecord {
    id: number;
    truck_id: number;
    driver_id: number;
    fuel_date: string;
    fuel_quantity_liters: number;
    fuel_price_per_liter: number;
    fuel_type: string;
    fuel_station?: string;
    odometer_reading?: number;
    receipt_number?: string;
    notes?: string;
}

interface FuelEditProps {
    fuel: FuelRecord;
    trucks: Array<{ id: number; plate: string }>;
    drivers: Array<{ id: number; name: string }>;
}

export default function FuelEdit({ fuel, trucks, drivers }: FuelEditProps) {
    const { data, setData, put, processing, errors } = useForm({
        truck_id: fuel.truck_id.toString(),
        driver_id: fuel.driver_id.toString(),
        fuel_date: fuel.fuel_date,
        fuel_quantity_liters: fuel.fuel_quantity_liters.toString(),
        fuel_price_per_liter: fuel.fuel_price_per_liter.toString(),
        fuel_type: fuel.fuel_type,
        fuel_station: fuel.fuel_station || '',
        odometer_reading: fuel.odometer_reading?.toString() || '',
        receipt_number: fuel.receipt_number || '',
        notes: fuel.notes || '',
    });

    const { toast } = useToast();
    const [frontendErrors, setFrontendErrors] = useState<ValidationErrors>({});

    useEffect(() => {
        if (Object.keys(errors).length > 0) {
            toast({
                variant: 'destructive',
                title: 'Validation Error',
                description: 'Please fix the errors below',
            });
        }
    }, [errors, toast]);

    const validateField = (fieldName: string, value: string) => {
        const validationData = {
            truck_id: data.truck_id,
            driver_id: data.driver_id,
            fuel_date: data.fuel_date,
            fuel_quantity_liters: data.fuel_quantity_liters,
            fuel_price_per_liter: data.fuel_price_per_liter,
            fuel_type: data.fuel_type,
            [fieldName]: value,
        };

        const allErrors = validateFuel(validationData);
        const fieldError = allErrors[fieldName] || '';

        setFrontendErrors(prev => {
            const updated = { ...prev };
            if (fieldError) {
                updated[fieldName] = fieldError;
            } else {
                delete updated[fieldName];
            }
            return updated;
        });
    };

    const handleFieldChange = (fieldName: string, value: string) => {
        setData(fieldName as any, value);
        validateField(fieldName, value);
    };

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        // Run full validation
        const allErrors = validateFuel({
            truck_id: data.truck_id,
            driver_id: data.driver_id,
            fuel_date: data.fuel_date,
            fuel_quantity_liters: data.fuel_quantity_liters,
            fuel_price_per_liter: data.fuel_price_per_liter,
            fuel_type: data.fuel_type,
        });

        if (Object.keys(allErrors).length > 0) {
            setFrontendErrors(allErrors);
            toast({
                variant: 'destructive',
                title: 'Validation Error',
                description: 'Please fix all errors before submitting',
            });
            return;
        }

        put(`/fuel/${fuel.id}`);
    };

    const hasErrors = Object.keys(errors).length > 0 || Object.keys(frontendErrors).length > 0;
    const allErrors = { ...frontendErrors, ...errors };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Edit Fuel Record" />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl p-4">
                {/* Header */}
                <div>
                    <h1 className="text-2xl font-bold">Edit Fuel Record</h1>
                    <p className="text-muted-foreground">
                        Update the fuel consumption information
                    </p>
                </div>

                {hasErrors && (
                    <Alert variant="destructive">
                        <CircleAlert className="h-4 w-4" />
                        <AlertDescription>
                            Please fix the errors below before submitting the form
                        </AlertDescription>
                    </Alert>
                )}

                {/* Form */}
                <Card>
                    <CardHeader>
                        <CardTitle>Fuel Record Details</CardTitle>
                        <CardDescription>
                            Update the fuel consumption information
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={submit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="truck_id">Truck *</Label>
                                    <Select
                                        value={data.truck_id}
                                        onValueChange={(value) => handleFieldChange('truck_id', value)}
                                    >
                                        <SelectTrigger className={allErrors.truck_id ? 'border-red-500' : ''}>
                                            <SelectValue placeholder="Select truck" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {trucks.map(truck => (
                                                <SelectItem key={truck.id} value={truck.id.toString()}>
                                                    {truck.plate}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {allErrors.truck_id && (
                                        <p className="text-sm text-red-500">{allErrors.truck_id}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="driver_id">Driver *</Label>
                                    <Select
                                        value={data.driver_id}
                                        onValueChange={(value) => handleFieldChange('driver_id', value)}
                                    >
                                        <SelectTrigger className={allErrors.driver_id ? 'border-red-500' : ''}>
                                            <SelectValue placeholder="Select driver" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {drivers.map(driver => (
                                                <SelectItem key={driver.id} value={driver.id.toString()}>
                                                    {driver.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {allErrors.driver_id && (
                                        <p className="text-sm text-red-500">{allErrors.driver_id}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="fuel_date">Fuel Date *</Label>
                                    <Input
                                        id="fuel_date"
                                        type="date"
                                        value={data.fuel_date}
                                        onChange={(e) => handleFieldChange('fuel_date', e.target.value)}
                                        className={allErrors.fuel_date ? 'border-red-500' : ''}
                                    />
                                    {allErrors.fuel_date && (
                                        <p className="text-sm text-red-500">{allErrors.fuel_date}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="fuel_type">Fuel Type *</Label>
                                    <Select
                                        value={data.fuel_type}
                                        onValueChange={(value) => handleFieldChange('fuel_type', value)}
                                    >
                                        <SelectTrigger className={allErrors.fuel_type ? 'border-red-500' : ''}>
                                            <SelectValue placeholder="Select fuel type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="diesel">Diesel</SelectItem>
                                            <SelectItem value="petrol">Petrol</SelectItem>
                                            <SelectItem value="gas">Gas</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    {allErrors.fuel_type && (
                                        <p className="text-sm text-red-500">{allErrors.fuel_type}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="fuel_quantity_liters">Quantity (Liters) *</Label>
                                    <Input
                                        id="fuel_quantity_liters"
                                        type="number"
                                        step="0.01"
                                        value={data.fuel_quantity_liters}
                                        onChange={(e) => handleFieldChange('fuel_quantity_liters', e.target.value)}
                                        placeholder="0.00"
                                        className={allErrors.fuel_quantity_liters ? 'border-red-500' : ''}
                                    />
                                    {allErrors.fuel_quantity_liters && (
                                        <p className="text-sm text-red-500">{allErrors.fuel_quantity_liters}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="fuel_price_per_liter">Price per Liter *</Label>
                                    <Input
                                        id="fuel_price_per_liter"
                                        type="number"
                                        step="0.01"
                                        value={data.fuel_price_per_liter}
                                        onChange={(e) => handleFieldChange('fuel_price_per_liter', e.target.value)}
                                        placeholder="0.00"
                                        className={allErrors.fuel_price_per_liter ? 'border-red-500' : ''}
                                    />
                                    {allErrors.fuel_price_per_liter && (
                                        <p className="text-sm text-red-500">{allErrors.fuel_price_per_liter}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="fuel_station">Fuel Station</Label>
                                    <Input
                                        id="fuel_station"
                                        type="text"
                                        value={data.fuel_station}
                                        onChange={(e) => setData('fuel_station', e.target.value)}
                                        placeholder="e.g., Shell, Mobil"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="odometer_reading">Odometer Reading</Label>
                                    <Input
                                        id="odometer_reading"
                                        type="number"
                                        value={data.odometer_reading}
                                        onChange={(e) => setData('odometer_reading', e.target.value)}
                                        placeholder="0"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="receipt_number">Receipt Number</Label>
                                    <Input
                                        id="receipt_number"
                                        type="text"
                                        value={data.receipt_number}
                                        onChange={(e) => setData('receipt_number', e.target.value)}
                                        placeholder="e.g., RCP-12345"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="notes">Notes</Label>
                                <Textarea
                                    id="notes"
                                    value={data.notes}
                                    onChange={(e) => setData('notes', e.target.value)}
                                    placeholder="Additional notes..."
                                    rows={3}
                                />
                            </div>

                            <div className="flex gap-2">
                                <Button type="submit" disabled={processing || hasErrors}>
                                    {processing ? 'Updating...' : 'Update Fuel Record'}
                                </Button>
                                <Button type="button" variant="outline" asChild>
                                    <a href="/fuel">Cancel</a>
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
