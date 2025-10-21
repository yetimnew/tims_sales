import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { Head, useForm } from '@inertiajs/react';
import { type BreadcrumbItem } from '@/types';
import { toast } from '@/hooks/use-toast';
import { validateTruck, type ValidationErrors } from '@/lib/validation';
import { AlertCircle } from 'lucide-react';
import { FormEventHandler, useEffect, useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Trucks',
        href: '/trucks',
    },
    {
        title: 'Create',
        href: '/trucks/create',
    },
];

interface VehicleType {
    id: number;
    name: string;
}

interface TrucksCreateProps {
    vehicleTypes: VehicleType[];
}

export default function TrucksCreate({ vehicleTypes }: TrucksCreateProps) {
    const { data, setData, post, processing, errors } = useForm({
        plate: '',
        vehicletype_id: '',
        chasisNumber: '',
        engineNumber: '',
        tyreSyze: '',
        serviceIntervalKM: '',
        purchasePrice: '',
        productionDate: '',
        serviceStartDate: '',
        status: 'active',
    });

    const [frontendErrors, setFrontendErrors] = useState<ValidationErrors>({});

    // Real-time frontend validation
    const validateField = (field: string, value: string) => {
        const allData = { ...data, [field]: value };
        const fieldErrors = validateTruck(allData);
        setFrontendErrors(fieldErrors);
    };

    // Show validation errors as toast
    useEffect(() => {
        const errorMessages = Object.entries(errors).map(([field, message]) => {
            if (typeof message === 'string') return message;
            return String(message);
        });

        if (errorMessages.length > 0) {
            toast({
                title: '⚠️ Validation Error',
                description: errorMessages.join(', '),
                variant: 'destructive',
            });
        }
    }, [errors]);

    const handleFieldChange = (field: string, value: string) => {
        setData(field as any, value);
        validateField(field, value);
    };

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        // Check frontend validation
        const allErrors = validateTruck(data);
        if (Object.keys(allErrors).length > 0) {
            setFrontendErrors(allErrors);
            toast({
                title: '⚠️ Validation Error',
                description: 'Please fix the validation errors before submitting',
                variant: 'destructive',
            });
            return;
        }

        post('/trucks');
    };

    const hasErrors = Object.keys(errors).length > 0 || Object.keys(frontendErrors).length > 0;
    const getFieldError = (fieldName: string) => errors[fieldName as keyof typeof errors] || frontendErrors[fieldName] || '';

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Create Truck" />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl p-4">
                {/* Header */}
                <div>
                    <h1 className="text-2xl font-bold">Create Truck</h1>
                    <p className="text-muted-foreground">
                        Add a new truck to your fleet
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
                        <CardTitle>Truck Details</CardTitle>
                        <CardDescription>
                            Enter the information for the new truck
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={submit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="plate">Plate Number *</Label>
                                    <Input
                                        id="plate"
                                        type="text"
                                        value={data.plate}
                                        onChange={(e) => handleFieldChange('plate', e.target.value.toUpperCase())}
                                        placeholder="e.g., AA-1234"
                                        className={getFieldError('plate') ? 'border-red-500 focus:border-red-500' : ''}
                                    />
                                    {getFieldError('plate') && (
                                        <p className="text-sm text-red-500">{getFieldError('plate')}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="vehicletype_id">Vehicle Type *</Label>
                                    <Select
                                        value={data.vehicletype_id}
                                        onValueChange={(value) => handleFieldChange('vehicletype_id', value)}
                                    >
                                        <SelectTrigger className={getFieldError('vehicletype_id') ? 'border-red-500' : ''}>
                                            <SelectValue placeholder="Select vehicle type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {vehicleTypes.map((type) => (
                                                <SelectItem key={type.id} value={type.id.toString()}>
                                                    {type.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {getFieldError('vehicletype_id') && (
                                        <p className="text-sm text-red-500">{getFieldError('vehicletype_id')}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="chasisNumber">Chassis Number</Label>
                                    <Input
                                        id="chasisNumber"
                                        type="text"
                                        value={data.chasisNumber}
                                        onChange={(e) => setData('chasisNumber', e.target.value)}
                                        placeholder="Chassis number"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="engineNumber">Engine Number</Label>
                                    <Input
                                        id="engineNumber"
                                        type="text"
                                        value={data.engineNumber}
                                        onChange={(e) => setData('engineNumber', e.target.value)}
                                        placeholder="Engine number"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="tyreSyze">Tyre Size</Label>
                                    <Input
                                        id="tyreSyze"
                                        type="text"
                                        value={data.tyreSyze}
                                        onChange={(e) => setData('tyreSyze', e.target.value)}
                                        placeholder="e.g., 315/80R22.5"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="serviceIntervalKM">Service Interval (KM)</Label>
                                    <Input
                                        id="serviceIntervalKM"
                                        type="number"
                                        value={data.serviceIntervalKM}
                                        onChange={(e) => handleFieldChange('serviceIntervalKM', e.target.value)}
                                        placeholder="e.g., 10000"
                                        className={getFieldError('serviceIntervalKM') ? 'border-red-500 focus:border-red-500' : ''}
                                    />
                                    {getFieldError('serviceIntervalKM') && (
                                        <p className="text-sm text-red-500">{getFieldError('serviceIntervalKM')}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="purchasePrice">Purchase Price</Label>
                                    <Input
                                        id="purchasePrice"
                                        type="number"
                                        step="0.01"
                                        value={data.purchasePrice}
                                        onChange={(e) => handleFieldChange('purchasePrice', e.target.value)}
                                        placeholder="e.g., 2500000.00"
                                        className={getFieldError('purchasePrice') ? 'border-red-500 focus:border-red-500' : ''}
                                    />
                                    {getFieldError('purchasePrice') && (
                                        <p className="text-sm text-red-500">{getFieldError('purchasePrice')}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="productionDate">Production Date</Label>
                                    <Input
                                        id="productionDate"
                                        type="date"
                                        value={data.productionDate}
                                        onChange={(e) => handleFieldChange('productionDate', e.target.value)}
                                        className={getFieldError('productionDate') ? 'border-red-500 focus:border-red-500' : ''}
                                    />
                                    {getFieldError('productionDate') && (
                                        <p className="text-sm text-red-500">{getFieldError('productionDate')}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="serviceStartDate">Service Start Date</Label>
                                    <Input
                                        id="serviceStartDate"
                                        type="date"
                                        value={data.serviceStartDate}
                                        onChange={(e) => handleFieldChange('serviceStartDate', e.target.value)}
                                        className={getFieldError('serviceStartDate') ? 'border-red-500 focus:border-red-500' : ''}
                                    />
                                    {getFieldError('serviceStartDate') && (
                                        <p className="text-sm text-red-500">{getFieldError('serviceStartDate')}</p>
                                    )}
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
                                            <SelectItem value="maintenance">Maintenance</SelectItem>
                                            <SelectItem value="inactive">Inactive</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    {getFieldError('status') && (
                                        <p className="text-sm text-red-500">{getFieldError('status')}</p>
                                    )}
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <Button type="submit" disabled={processing || Object.keys(frontendErrors).length > 0}>
                                    {processing ? 'Creating...' : 'Create Truck'}
                                </Button>
                                <Button type="button" variant="outline" asChild>
                                    <a href="/trucks">Cancel</a>
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
