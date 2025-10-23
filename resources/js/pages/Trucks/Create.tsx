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
import { AlertCircle, Info, Wrench, DollarSign, CheckCircle } from 'lucide-react';
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
            <div className="flex h-full flex-1 flex-col gap-6 overflow-hidden rounded-xl p-4">
                {/* Enhanced Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-foreground">Create New Truck</h1>
                        <p className="text-muted-foreground mt-1">
                            Add a new truck to your fleet with comprehensive details
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
                        <h3 className="font-semibold text-foreground">Setup Progress</h3>
                        <span className="text-sm text-muted-foreground">Step 1 of 3</span>
                    </div>
                    <div className="flex-1 bg-muted rounded-full h-3">
                        <div className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-500" style={{width: '33%'}}></div>
                    </div>
                    <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                        <span>Basic Information</span>
                        <span>Technical Details</span>
                        <span>Financial Information</span>
                    </div>
                </div>

                {/* Enhanced Form */}
                <Card className="shadow-lg border-0 bg-gradient-to-br from-background to-muted/20">
                    <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-b">
                        <CardTitle className="flex items-center gap-2 text-xl">
                            <Info className="h-5 w-5 text-blue-600" />
                            Truck Details
                        </CardTitle>
                        <CardDescription className="text-base">
                            Enter comprehensive information for the new truck
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-6">
                        <form onSubmit={submit} className="space-y-6">
                            <Tabs defaultValue="basic" className="space-y-6">
                                <TabsList className="grid w-full grid-cols-3 bg-muted/50 p-1 rounded-lg">
                                    <TabsTrigger value="basic" className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                                        <Info className="h-4 w-4" />
                                        Basic Info
                                    </TabsTrigger>
                                    <TabsTrigger value="technical" className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                                        <Wrench className="h-4 w-4" />
                                        Technical
                                    </TabsTrigger>
                                    <TabsTrigger value="financial" className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                                        <DollarSign className="h-4 w-4" />
                                        Financial
                                    </TabsTrigger>
                                </TabsList>

                                <TabsContent value="basic" className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <Label htmlFor="plate" className="text-sm font-semibold text-foreground">Plate Number <span className="text-red-500">*</span></Label>
                                            <Input
                                                id="plate"
                                                type="text"
                                                value={data.plate}
                                                onChange={(e) => handleFieldChange('plate', e.target.value.toUpperCase())}
                                                placeholder="e.g., AA-1234"
                                                className={`transition-all duration-200 ${getFieldError('plate') ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : 'focus:ring-blue-500/20 focus:border-blue-500'}`}
                                            />
                                            {getFieldError('plate') && (
                                                <p className="text-sm text-red-500 flex items-center gap-1">
                                                    <AlertCircle className="h-3 w-3" />
                                                    {getFieldError('plate')}
                                                </p>
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
                                            <p className="text-xs text-muted-foreground">Optional - Factory assigned identifier</p>
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
                                            <p className="text-xs text-muted-foreground">Optional - Engine identifier</p>
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
                                            <p className="text-xs text-muted-foreground">Optional - Standard tire specification</p>
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
                                        className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                                    >
                                        {processing ? (
                                            <>
                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                                Creating Truck...
                                            </>
                                        ) : (
                                            <>
                                                <CheckCircle className="h-4 w-4 mr-2" />
                                                Create Truck
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
