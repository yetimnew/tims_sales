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
import { validateTruck, type ValidationErrors, truckValidation } from '@/lib/validation';
import { AlertCircle, Info, Wrench, DollarSign, CheckCircle, HelpCircle, Save, Truck, Calendar, Hash } from 'lucide-react';
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
    const [activeTab, setActiveTab] = useState('basic');
    const [isDirty, setIsDirty] = useState(false);

    // Real-time frontend validation - only validate the specific field
    const validateField = (field: string, value: string) => {
        const fieldErrors = { ...frontendErrors };

        // Only validate the specific field being changed
        if (field === 'plate') {
            const error = truckValidation.plate(value);
            if (error) {
                fieldErrors.plate = error;
            } else {
                delete fieldErrors.plate;
            }
        } else if (field === 'vehicletype_id') {
            const error = truckValidation.vehicletype_id(value);
            if (error) {
                fieldErrors.vehicletype_id = error;
            } else {
                delete fieldErrors.vehicletype_id;
            }
        } else if (field === 'status') {
            const error = truckValidation.status(value);
            if (error) {
                fieldErrors.status = error;
            } else {
                delete fieldErrors.status;
            }
        } else if (field === 'serviceIntervalKM') {
            const error = truckValidation.serviceIntervalKM(value);
            if (error) {
                fieldErrors.serviceIntervalKM = error;
            } else {
                delete fieldErrors.serviceIntervalKM;
            }
        } else if (field === 'purchasePrice') {
            const error = truckValidation.purchasePrice(value);
            if (error) {
                fieldErrors.purchasePrice = error;
            } else {
                delete fieldErrors.purchasePrice;
            }
        } else if (field === 'productionDate') {
            const error = truckValidation.productionDate(value);
            if (error) {
                fieldErrors.productionDate = error;
            } else {
                delete fieldErrors.productionDate;
            }
        } else if (field === 'serviceStartDate') {
            const error = truckValidation.serviceStartDate(value);
            if (error) {
                fieldErrors.serviceStartDate = error;
            } else {
                delete fieldErrors.serviceStartDate;
            }
        }

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
        setIsDirty(true);
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
                {/* Enhanced Professional Header */}
                <div className="bg-gradient-to-r from-slate-50 to-blue-50 dark:from-slate-900 dark:to-blue-950/20 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-4">
                            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                                <Truck className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                                <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Create New Truck</h1>
                                <p className="text-sm text-slate-600 dark:text-slate-400">Add a new truck to your fleet with comprehensive details</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            {isDirty && (
                                <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-full text-sm font-medium">
                                    <Save className="h-3 w-3" />
                                    Unsaved Changes
                                </div>
                            )}
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-sm font-medium">
                                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                Fleet Management
                            </div>
                        </div>
                    </div>

                    {/* Progress Indicator */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
                            <span>Form Progress</span>
                            <span>{activeTab === 'basic' ? '1/3' : activeTab === 'technical' ? '2/3' : '3/3'}</span>
                        </div>
                        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                            <div
                                className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-500"
                                style={{width: activeTab === 'basic' ? '33%' : activeTab === 'technical' ? '66%' : '100%'}}
                            ></div>
                        </div>
                    </div>
                </div>

                {/* Professional Form */}
                <Card className="flex-1 shadow-xl border-0 bg-white dark:bg-slate-900/50 backdrop-blur-sm">
                    <CardHeader className="p-6 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-slate-50 to-blue-50 dark:from-slate-800 dark:to-blue-950/20">
                        <CardTitle className="flex items-center gap-3 text-lg font-semibold text-slate-900 dark:text-slate-100">
                            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                                <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                            </div>
                            Truck Details
                        </CardTitle>
                        <CardDescription className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                            Enter comprehensive information for the new truck
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-6">
                        <form onSubmit={submit} className="space-y-4">
                            <Tabs defaultValue="basic" className="space-y-4" onValueChange={setActiveTab}>
                                <TabsList className="grid w-full grid-cols-3 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
                                    <TabsTrigger value="basic" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:border data-[state=active]:border-slate-200 dark:data-[state=active]:bg-slate-700 dark:data-[state=active]:border-slate-600 rounded-lg transition-all duration-200">
                                        <Info className="h-4 w-4" />
                                        <span className="font-medium">Basic Info</span>
                                    </TabsTrigger>
                                    <TabsTrigger value="technical" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:border data-[state=active]:border-slate-200 dark:data-[state=active]:bg-slate-700 dark:data-[state=active]:border-slate-600 rounded-lg transition-all duration-200">
                                        <Wrench className="h-4 w-4" />
                                        <span className="font-medium">Technical</span>
                                    </TabsTrigger>
                                    <TabsTrigger value="financial" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:border data-[state=active]:border-slate-200 dark:data-[state=active]:bg-slate-700 dark:data-[state=active]:border-slate-600 rounded-lg transition-all duration-200">
                                        <DollarSign className="h-4 w-4" />
                                        <span className="font-medium">Financial</span>
                                    </TabsTrigger>
                                </TabsList>

                                <TabsContent value="basic" className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2">
                                                <Label htmlFor="plate" className="text-sm font-semibold text-slate-700 dark:text-slate-300">Plate Number <span className="text-red-500">*</span></Label>
                                                <div className="group relative">
                                                    <HelpCircle className="h-4 w-4 text-slate-400 hover:text-slate-600 cursor-help" />
                                                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-slate-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                                                        Official license plate number
                                                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-slate-900"></div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="relative">
                                                <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                                                <Input
                                                    id="plate"
                                                    type="text"
                                                    value={data.plate}
                                                    onChange={(e) => handleFieldChange('plate', e.target.value.toUpperCase())}
                                                    placeholder="e.g., AA-1234"
                                                    className={`pl-10 transition-all duration-200 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 ${getFieldError('plate') ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : 'focus:ring-blue-500/20 focus:border-blue-500 hover:border-slate-400 dark:hover:border-slate-500'}`}
                                                />
                                            </div>
                                            {getFieldError('plate') && (
                                                <p className="text-sm text-red-500 flex items-center gap-1">
                                                    <AlertCircle className="h-3 w-3" />
                                                    {getFieldError('plate')}
                                                </p>
                                            )}
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="vehicletype_id" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                                                <span className="text-red-500">*</span> Vehicle Type
                                            </Label>
                                            <Select
                                                value={data.vehicletype_id}
                                                onValueChange={(value) => handleFieldChange('vehicletype_id', value)}
                                            >
                                                <SelectTrigger className={`bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 ${getFieldError('vehicletype_id') ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}`}>
                                                    <SelectValue placeholder="Select vehicle type" />
                                                </SelectTrigger>
                                                <SelectContent className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-lg z-50">
                                                    {vehicleTypes.map((type) => (
                                                        <SelectItem
                                                            key={type.id}
                                                            value={type.id.toString()}
                                                            className="hover:bg-slate-100 dark:hover:bg-slate-700 focus:bg-slate-100 dark:focus:bg-slate-700"
                                                        >
                                                            {type.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            {getFieldError('vehicletype_id') && (
                                                <p className="text-sm text-red-500 flex items-center gap-1">
                                                    <AlertCircle className="h-3 w-3" />
                                                    {getFieldError('vehicletype_id')}
                                                </p>
                                            )}
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="status" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                                                <span className="text-red-500">*</span> Status
                                            </Label>
                                            <Select
                                                value={data.status}
                                                onValueChange={(value) => handleFieldChange('status', value)}
                                            >
                                                <SelectTrigger className={`bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 ${getFieldError('status') ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}`}>
                                                    <SelectValue placeholder="Select status" />
                                                </SelectTrigger>
                                                <SelectContent className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-lg z-50">
                                                    <SelectItem value="active" className="hover:bg-slate-100 dark:hover:bg-slate-700 focus:bg-slate-100 dark:focus:bg-slate-700">Active</SelectItem>
                                                    <SelectItem value="maintenance" className="hover:bg-slate-100 dark:hover:bg-slate-700 focus:bg-slate-100 dark:focus:bg-slate-700">Maintenance</SelectItem>
                                                    <SelectItem value="inactive" className="hover:bg-slate-100 dark:hover:bg-slate-700 focus:bg-slate-100 dark:focus:bg-slate-700">Inactive</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            {getFieldError('status') && (
                                                <p className="text-sm text-red-500 flex items-center gap-1">
                                                    <AlertCircle className="h-3 w-3" />
                                                    {getFieldError('status')}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </TabsContent>

                                <TabsContent value="technical" className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

                                <TabsContent value="financial" className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

                            <div className="flex items-center justify-between pt-6 border-t border-slate-200 dark:border-slate-700 bg-gradient-to-r from-slate-50 to-blue-50 dark:from-slate-800 dark:to-blue-950/20 -mx-6 px-6 -mb-6 rounded-b-lg">
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                        <span>All required fields must be completed</span>
                                    </div>
                                    {isDirty && (
                                        <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400">
                                            <Save className="h-3 w-3" />
                                            <span>You have unsaved changes</span>
                                        </div>
                                    )}
                                </div>
                                <div className="flex gap-3">
                                    <Button type="button" variant="outline" asChild className="hover:bg-slate-100 dark:hover:bg-slate-700 border-slate-300 dark:border-slate-600">
                                        <a href="/trucks">Cancel</a>
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={processing || Object.keys(frontendErrors).length > 0}
                                        className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl transition-all duration-200 px-6 min-w-[140px]"
                                    >
                                        {processing ? (
                                            <>
                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                                Creating...
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
