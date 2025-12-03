import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { Head, Link, useForm } from '@inertiajs/react';
import { type BreadcrumbItem } from '@/types';
import { toast } from '@/hooks/use-toast';
import { validateTruck, truckValidation, type ValidationErrors } from '@/lib/validation';
import { AlertCircle, Info, Wrench, DollarSign, CheckCircle, Calendar, ArrowUp, ArrowLeft, Save, Truck, Hash } from 'lucide-react';
import { FormEventHandler, useEffect, useRef, useState } from 'react';

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
    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Trucks',
            href: '/trucks',
        },
        {
            title: truck.plate,
            href: `/trucks/${truck.id}`,
        },
        {
            title: 'Edit',
            href: `/trucks/${truck.id}/edit`,
        },
    ];

    const { data, setData, put, processing, errors, clearErrors } = useForm({
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
    const [showScrollTop, setShowScrollTop] = useState(false);
    const scrollContainerRef = useRef<HTMLFormElement | null>(null);
    const [isDirty, setIsDirty] = useState(false);

    const validateField = (field: string, value: string) => {
        const fieldErrors = { ...frontendErrors };

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
            delete fieldErrors.productionDate;
        } else if (field === 'serviceStartDate') {
            delete fieldErrors.serviceStartDate;
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

    useEffect(() => {
        const container = scrollContainerRef.current;
        if (!container) {
            return;
        }

        const handleScroll = () => {
            setShowScrollTop(container.scrollTop > 240);
        };

        handleScroll();
        container.addEventListener('scroll', handleScroll);

        return () => {
            container.removeEventListener('scroll', handleScroll);
        };
    }, []);

    const handleScrollToTop = () => {
        const container = scrollContainerRef.current;
        container?.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleFieldChange = (field: string, value: string) => {
        setData(field as any, value);
        validateField(field, value);
        clearErrors(field);
        setIsDirty(true);
    };

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        // Check frontend validation
        const allErrors = validateTruck(data);
        delete allErrors.productionDate;
        delete allErrors.serviceStartDate;
        if (Object.keys(allErrors).length > 0) {
            setFrontendErrors(allErrors);
            toast({
                title: '⚠️ Validation Error',
                description: 'Please fix the validation errors before submitting',
                variant: 'destructive',
            });
            return;
        }

        put(`/trucks/${truck.id}`, {
            onSuccess: () => {
                setFrontendErrors({});
                setIsDirty(false);
                toast({
                    title: '✅ Truck Updated',
                    description: `${truck.plate} was updated successfully.`,
                    variant: 'success',
                });
            },
        });
    };

    const getFieldError = (fieldName: string) => errors[fieldName as keyof typeof errors] || frontendErrors[fieldName] || '';

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit ${truck.plate}`} />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-hidden rounded-xl p-4">
                <Card className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-slate-200/70 bg-white/95 text-card-foreground shadow-xl backdrop-blur-lg dark:border-slate-800/60 dark:bg-slate-900/70">
                    <CardHeader className="px-6 pb-0">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                            <div className="flex items-start gap-4">
                                <div className="rounded-xl bg-emerald-100 p-2 text-emerald-600 shadow-sm dark:bg-emerald-900/30 dark:text-emerald-400">
                                    <Truck className="h-5 w-5" />
                                </div>
                                <div>
                                    <CardTitle className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
                                        Update Truck
                                    </CardTitle>
                                    <CardDescription className="text-sm text-slate-600 dark:text-slate-400">
                                        Make adjustments to identification, technical specifications, or financial milestones.
                                    </CardDescription>
                                </div>
                            </div>
                            <div className="flex flex-wrap items-center gap-3">
                                <Button variant="ghost" size="sm" asChild>
                                    <Link href={`/trucks/${truck.id}`}>
                                        <ArrowLeft className="mr-2 h-4 w-4" />
                                        Back to Truck
                                    </Link>
                                </Button>
                                {isDirty && (
                                    <div className="flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1.5 text-sm font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                                        <Save className="h-3 w-3" />
                                        Unsaved Changes
                                    </div>
                                )}
                                <div className="flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1.5 text-sm font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                                    <div className="h-2 w-2 animate-pulse rounded-full bg-emerald-500"></div>
                                    Fleet Operations
                                </div>
                            </div>
                        </div>
                    </CardHeader>

                    <CardContent className="flex flex-1 flex-col overflow-hidden p-0">
                        <form
                            ref={scrollContainerRef}
                            onSubmit={submit}
                            className="flex flex-1 flex-col gap-8 overflow-y-auto p-6 pb-24"
                            style={{ minHeight: 0 }}
                        >
                            <section className="space-y-5 rounded-xl border border-slate-200/70 bg-white/80 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/40">
                                <div className="flex items-center gap-3">
                                    <div className="rounded-lg bg-blue-100 p-2 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                                        <Info className="h-4 w-4" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">General Details</h2>
                                        <p className="text-sm text-muted-foreground">Primary identification and status information.</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                            <Label htmlFor="plate" className="text-sm font-semibold text-slate-700 dark:text-slate-300">Plate Number <span className="text-red-500">*</span></Label>
                                            <div className="group relative">
                                                <Hash className="h-4 w-4 cursor-help text-slate-400" />
                                                <div className="absolute bottom-full left-1/2 z-10 mb-2 -translate-x-1/2 rounded-lg bg-slate-900 px-3 py-2 text-xs text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                                                    Official license plate number
                                                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900"></div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="relative">
                                            <Hash className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
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
                                            <p className="flex items-center gap-1 text-sm text-red-500">
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
                                            <SelectTrigger className={`transition-all duration-200 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500 focus:ring-blue-500/20 focus:border-blue-500 ${getFieldError('vehicletype_id') ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}`}>
                                                <SelectValue placeholder="Select vehicle type" />
                                            </SelectTrigger>
                                            <SelectContent className="z-50 bg-white shadow-lg dark:bg-slate-800">
                                                {vehicleTypes.map((type) => (
                                                    <SelectItem
                                                        key={type.id}
                                                        value={type.id.toString()}
                                                        className="hover:bg-slate-100 focus:bg-slate-100 dark:hover:bg-slate-700 dark:focus:bg-slate-700"
                                                    >
                                                        {type.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {getFieldError('vehicletype_id') && (
                                            <p className="flex items-center gap-1 text-sm text-red-500">
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
                                            <SelectTrigger className={`transition-all duration-200 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500 focus:ring-blue-500/20 focus:border-blue-500 ${getFieldError('status') ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}`}>
                                                <SelectValue placeholder="Select status" />
                                            </SelectTrigger>
                                            <SelectContent className="z-50 bg-white shadow-lg dark:bg-slate-800">
                                                <SelectItem value="active" className="hover:bg-slate-100 focus:bg-slate-100 dark:hover:bg-slate-700 dark:focus:bg-slate-700">Active</SelectItem>
                                                <SelectItem value="maintenance" className="hover:bg-slate-100 focus:bg-slate-100 dark:hover:bg-slate-700 dark:focus:bg-slate-700">Maintenance</SelectItem>
                                                <SelectItem value="inactive" className="hover:bg-slate-100 focus:bg-slate-100 dark:hover:bg-slate-700 dark:focus:bg-slate-700">Inactive</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        {getFieldError('status') && (
                                            <p className="flex items-center gap-1 text-sm text-red-500">
                                                <AlertCircle className="h-3 w-3" />
                                                {getFieldError('status')}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </section>

                            <section className="space-y-5 rounded-xl border border-slate-200/70 bg-white/80 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/40">
                                <div className="flex items-center gap-3">
                                    <div className="rounded-lg bg-amber-100 p-2 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
                                        <Wrench className="h-4 w-4" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Technical Specifications</h2>
                                        <p className="text-sm text-muted-foreground">Detailed build and maintenance metadata.</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="chasisNumber">Chassis Number</Label>
                                        <Input
                                            id="chasisNumber"
                                            type="text"
                                            value={data.chasisNumber}
                                            onChange={(e) => handleFieldChange('chasisNumber', e.target.value)}
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
                                            onChange={(e) => handleFieldChange('engineNumber', e.target.value)}
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
                                            onChange={(e) => handleFieldChange('tyreSyze', e.target.value)}
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
                            </section>

                            <section className="space-y-5 rounded-xl border border-slate-200/70 bg-white/80 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/40">
                                <div className="flex items-center gap-3">
                                    <div className="rounded-lg bg-emerald-100 p-2 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
                                        <DollarSign className="h-4 w-4" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Operational & Financial</h2>
                                        <p className="text-sm text-muted-foreground">Track lifecycle dates and investment values.</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="purchasePrice">Purchase Price</Label>
                                        <Input
                                            id="purchasePrice"
                                            type="number"
                                            step="1"
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
                                            Production Date
                                        </Label>
                                        <div className="group relative">
                                            <Input
                                                id="productionDate"
                                                type="date"
                                                value={data.productionDate}
                                                onChange={(e) => handleFieldChange('productionDate', e.target.value)}
                                                className={`pl-4 pr-10 py-2.5 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-3 [&::-webkit-calendar-picker-indicator]:h-4 [&::-webkit-calendar-picker-indicator]:w-4 [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0 ${getFieldError('productionDate') ? 'border-red-500 focus:border-red-500' : ''}`}
                                            />
                                            <div
                                                className="absolute right-3 top-1/2 z-20 -translate-y-1/2 cursor-pointer"
                                                onClick={() => {
                                                    const input = document.getElementById('productionDate') as HTMLInputElement | null;
                                                    input?.showPicker?.();
                                                }}
                                            >
                                                <Calendar className="h-4 w-4 text-slate-500 transition-colors duration-200 group-hover:text-slate-600 dark:text-slate-400 dark:group-hover:text-slate-300" />
                                            </div>
                                        </div>
                                        {getFieldError('productionDate') && (
                                            <p className="text-sm text-red-500">{getFieldError('productionDate')}</p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="serviceStartDate" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                                            Service Start Date
                                        </Label>
                                        <div className="group relative">
                                            <Input
                                                id="serviceStartDate"
                                                type="date"
                                                value={data.serviceStartDate}
                                                onChange={(e) => handleFieldChange('serviceStartDate', e.target.value)}
                                                className={`pl-4 pr-10 py-2.5 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-3 [&::-webkit-calendar-picker-indicator]:h-4 [&::-webkit-calendar-picker-indicator]:w-4 [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0 ${getFieldError('serviceStartDate') ? 'border-red-500 focus:border-red-500' : ''}`}
                                            />
                                            <div
                                                className="absolute right-3 top-1/2 z-20 -translate-y-1/2 cursor-pointer"
                                                onClick={() => {
                                                    const input = document.getElementById('serviceStartDate') as HTMLInputElement | null;
                                                    input?.showPicker?.();
                                                }}
                                            >
                                                <Calendar className="h-4 w-4 text-slate-500 transition-colors duration-200 group-hover:text-slate-600 dark:text-slate-400 dark:group-hover:text-slate-300" />
                                            </div>
                                        </div>
                                        {getFieldError('serviceStartDate') && (
                                            <p className="text-sm text-red-500">{getFieldError('serviceStartDate')}</p>
                                        )}
                                    </div>
                                </div>
                            </section>

                            <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200/70 bg-white/80 px-6 py-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/40">
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                                        <span className="text-red-500">*</span>
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
                                    <Button type="button" variant="outline" asChild className="border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700">
                                        <Link href={`/trucks/${truck.id}`}>Cancel</Link>
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={processing || Object.keys(frontendErrors).length > 0}
                                        className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white shadow-lg hover:shadow-xl transition-all duration-200 px-6 min-w-[160px]"
                                    >
                                        {processing ? (
                                            <>
                                                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-white"></div>
                                                Updating...
                                            </>
                                        ) : (
                                            <>
                                                <CheckCircle className="mr-2 h-4 w-4" />
                                                Update Truck
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </form>
                    </CardContent>
                </Card>

                {showScrollTop && (
                    <Button
                        type="button"
                        onClick={handleScrollToTop}
                        className="fixed bottom-6 right-6 z-50 shadow-lg"
                        variant="secondary"
                        aria-label="Scroll to top"
                    >
                        <ArrowUp className="h-4 w-4" />
                    </Button>
                )}
            </div>
        </AppLayout>
    );
}



