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
import { validateTruck, type ValidationErrors } from '@/lib/validation';
import { AlertCircle, Info, Wrench, DollarSign, CheckCircle, Calendar } from 'lucide-react';
import { FormEventHandler, useEffect, useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Trucks',
        href: '/trucks',
    },
    {
        title: 'Edit',
        href: '#',
    },
];

interface VehicleType {
    id: number;
    name: string;
}

interface Truck {
    id: number;
    plate: string;
    vehicletype_id: number;
    chasisNumber?: string;
    engineNumber?: string;
    tyreSyze?: string;
    serviceIntervalKM?: number;
    purchasePrice?: number;
    productionDate?: string;
    serviceStartDate?: string;
    status: string;
}

interface TrucksEditProps {
    truck: Truck;
    vehicleTypes: VehicleType[];
}

export default function TrucksEdit({ truck, vehicleTypes }: TrucksEditProps) {
    const { data, setData, put, processing, errors } = useForm({
        plate: truck.plate,
        vehicletype_id: truck.vehicletype_id.toString(),
        chasisNumber: truck.chasisNumber || '',
        engineNumber: truck.engineNumber || '',
        tyreSyze: truck.tyreSyze || '',
        serviceIntervalKM: truck.serviceIntervalKM?.toString() || '',
        purchasePrice: truck.purchasePrice?.toString() || '',
        productionDate: truck.productionDate || '',
        serviceStartDate: truck.serviceStartDate || '',
        status: truck.status,
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

        put(`/trucks/${truck.id}`);
    };

    const hasErrors = Object.keys(errors).length > 0 || Object.keys(frontendErrors).length > 0;
    const getFieldError = (fieldName: string) => errors[fieldName as keyof typeof errors] || frontendErrors[fieldName] || '';

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit ${truck.plate}`} />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-hidden rounded-xl p-4">
                {/* Enhanced Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-foreground">Edit Truck</h1>
                        <p className="text-muted-foreground mt-1">
                            Update the truck information for <span className="font-semibold text-blue-600">{truck.plate}</span>
                        </p>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span>Fleet Management</span>
                    </div>
                </div>

                {/* Enhanced Progress Indicator */}
                <div className="bg-muted/30 rounded-lg p-4 mb-6">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold text-foreground">Update Progress</h3>
                        <span className="text-sm text-muted-foreground">Step 1 of 3</span>
                    </div>
                    <div className="flex-1 bg-muted rounded-full h-3">
                        <div className="bg-gradient-to-r from-green-500 to-green-600 h-3 rounded-full transition-all duration-500" style={{width: '33%'}}></div>
                    </div>
                    <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                        <span>Basic Information</span>
                        <span>Technical Details</span>
                        <span>Financial Information</span>
                    </div>
                </div>

                {/* Enhanced Form */}
                <Card className="shadow-lg border-0 bg-gradient-to-br from-background to-muted/20">
                    <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-b">
                        <CardTitle className="flex items-center gap-2 text-xl">
                            <Info className="h-5 w-5 text-green-600" />
                            Truck Details
                        </CardTitle>
                        <CardDescription className="text-base">
                            Update the comprehensive information for this truck
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={submit} className="space-y-6">
                            <Tabs defaultValue="basic" className="space-y-6">
                                <TabsList className="grid w-full grid-cols-3">
                                    <TabsTrigger value="basic" className="flex items-center gap-2">
                                        <Info className="h-4 w-4" />
                                        Basic Info
                                    </TabsTrigger>
                                    <TabsTrigger value="technical" className="flex items-center gap-2">
                                        <Wrench className="h-4 w-4" />
                                        Technical
                                    </TabsTrigger>
                                    <TabsTrigger value="financial" className="flex items-center gap-2">
                                        <DollarSign className="h-4 w-4" />
                                        Financial
                                    </TabsTrigger>
                                </TabsList>

                                <TabsContent value="basic" className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <Label htmlFor="plate">Plate Number <span className="text-red-500">*</span></Label>
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
                                            <Label htmlFor="vehicletype_id"><span className="text-red-500">*</span> Vehicle Type</Label>
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
                                            <Label htmlFor="status"><span className="text-red-500">*</span> Status</Label>
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
                                </TabsContent>

                                <TabsContent value="technical" className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                                    </div>
                                </TabsContent>

                                <TabsContent value="financial" className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                                            <Label htmlFor="productionDate" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                                                <span className="text-red-500">*</span> Production Date
                                            </Label>
                                            <div className="relative group">
                                                <Input
                                                    id="productionDate"
                                                    type="date"
                                                    value={data.productionDate}
                                                    onChange={(e) => handleFieldChange('productionDate', e.target.value)}
                                                    className={`pl-4 pr-10 py-2.5 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-3 [&::-webkit-calendar-picker-indicator]:w-4 [&::-webkit-calendar-picker-indicator]:h-4 [&::-webkit-calendar-picker-indicator]:cursor-pointer ${getFieldError('productionDate') ? 'border-red-500 focus:border-red-500' : ''}`}
                                                />
                                                <div
                                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 cursor-pointer z-20"
                                                    onClick={() => document.getElementById('productionDate')?.showPicker()}
                                                >
                                                    <Calendar className="h-4 w-4 text-slate-500 dark:text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors duration-200" />
                                                </div>
                                            </div>
                                            {getFieldError('productionDate') && (
                                                <p className="text-sm text-red-500">{getFieldError('productionDate')}</p>
                                            )}
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="serviceStartDate" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                                                <span className="text-red-500">*</span> Service Start Date
                                            </Label>
                                            <div className="relative group">
                                                <Input
                                                    id="serviceStartDate"
                                                    type="date"
                                                    value={data.serviceStartDate}
                                                    onChange={(e) => handleFieldChange('serviceStartDate', e.target.value)}
                                                    className={`pl-4 pr-10 py-2.5 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-3 [&::-webkit-calendar-picker-indicator]:w-4 [&::-webkit-calendar-picker-indicator]:h-4 [&::-webkit-calendar-picker-indicator]:cursor-pointer ${getFieldError('serviceStartDate') ? 'border-red-500 focus:border-red-500' : ''}`}
                                                />
                                                <div
                                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 cursor-pointer z-20"
                                                    onClick={() => document.getElementById('serviceStartDate')?.showPicker()}
                                                >
                                                    <Calendar className="h-4 w-4 text-slate-500 dark:text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors duration-200" />
                                                </div>
                                            </div>
                                            {getFieldError('serviceStartDate') && (
                                                <p className="text-sm text-red-500">{getFieldError('serviceStartDate')}</p>
                                            )}
                                        </div>
                                    </div>
                                </TabsContent>
                            </Tabs>

                            <div className="flex items-center justify-between pt-6 border-t bg-muted/30 -mx-6 px-6 -mb-6">
                                <div className="text-sm text-muted-foreground">
                                    All required fields must be completed
                                </div>
                                <div className="flex gap-3">
                                    <Button type="button" variant="outline" asChild className="hover:bg-muted">
                                        <a href="/trucks">Cancel</a>
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={processing || Object.keys(frontendErrors).length > 0}
                                        className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                                    >
                                        {processing ? (
                                            <>
                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                                Updating Truck...
                                            </>
                                        ) : (
                                            <>
                                                <CheckCircle className="h-4 w-4 mr-2" />
                                                Update Truck
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



