import { FormPageLayout } from '@/components/forms/form-page-layout';
import { FormSection } from '@/components/forms/form-section';
import { FormField } from '@/components/forms/form-field';
import { FormActionsBar } from '@/components/forms/form-actions-bar';
import { UnsavedChangesBadge } from '@/components/forms/unsaved-changes-badge';
import { ScrollToTopFab } from '@/components/forms/scroll-to-top-fab';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DatePicker } from '@/components/ui/date-picker';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Link, useForm } from '@inertiajs/react';
import { type BreadcrumbItem } from '@/types';
import { toast } from '@/hooks/use-toast';
import { validateTruck, truckValidation, type ValidationErrors } from '@/lib/validation';
import { Info, Wrench, DollarSign, CheckCircle, ArrowLeft, Save, Truck, Hash } from 'lucide-react';
import { FormEventHandler, useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

interface VehicleType {
    id: number;
    name: string;
}

interface TruckModel {
    id: number;
    plate: string;
    vehicletype_id: number;
    chasisNumber?: string | null;
    engineNumber?: string | null;
    tyreSyze?: string | null;
    serviceIntervalKM?: number | null;
    purchasePrice?: number | null;
    productionDate?: string | null;
    serviceStartDate?: string | null;
    status: string;
}

interface TrucksEditProps {
    truck: TruckModel;
    vehicleTypes: VehicleType[];
}

export default function TrucksEdit({ truck, vehicleTypes }: TrucksEditProps) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Trucks', href: '/trucks' },
        { title: truck.plate, href: `/trucks/${truck.id}` },
        { title: 'Edit', href: `/trucks/${truck.id}/edit` },
    ];

    const { data, setData, put, processing, errors, clearErrors } = useForm({
        plate: truck.plate ?? '',
        vehicletype_id: truck.vehicletype_id ? String(truck.vehicletype_id) : '',
        chasisNumber: truck.chasisNumber ?? '',
        engineNumber: truck.engineNumber ?? '',
        tyreSyze: truck.tyreSyze ?? '',
        serviceIntervalKM: truck.serviceIntervalKM !== null && truck.serviceIntervalKM !== undefined ? String(truck.serviceIntervalKM) : '',
        purchasePrice: truck.purchasePrice !== null && truck.purchasePrice !== undefined ? String(truck.purchasePrice) : '',
        productionDate: truck.productionDate ?? '',
        serviceStartDate: truck.serviceStartDate ?? '',
        status: truck.status ?? 'active',
    });

    const [frontendErrors, setFrontendErrors] = useState<ValidationErrors>({});
    const [showScrollTop, setShowScrollTop] = useState(false);
    const scrollContainerRef = useRef<HTMLFormElement | null>(null);
    const [isDirty, setIsDirty] = useState(false);

    const validateField = (field: string, value: string) => {
        const fieldErrors = { ...frontendErrors };
        if (field === 'plate') {
            const error = truckValidation.plate(value);
            if (error) fieldErrors.plate = error; else delete fieldErrors.plate;
        } else if (field === 'vehicletype_id') {
            const error = truckValidation.vehicletype_id(value);
            if (error) fieldErrors.vehicletype_id = error; else delete fieldErrors.vehicletype_id;
        } else if (field === 'status') {
            const error = truckValidation.status(value);
            if (error) fieldErrors.status = error; else delete fieldErrors.status;
        } else if (field === 'serviceIntervalKM') {
            const error = truckValidation.serviceIntervalKM(value);
            if (error) fieldErrors.serviceIntervalKM = error; else delete fieldErrors.serviceIntervalKM;
        } else if (field === 'purchasePrice') {
            const error = truckValidation.purchasePrice(value);
            if (error) fieldErrors.purchasePrice = error; else delete fieldErrors.purchasePrice;
        } else if (field === 'productionDate') {
            delete fieldErrors.productionDate;
        } else if (field === 'serviceStartDate') {
            delete fieldErrors.serviceStartDate;
        }
        setFrontendErrors(fieldErrors);
    };

    useEffect(() => {
        const errorMessages = Object.entries(errors)
            .map(([field, message]) => typeof message === 'string' ? message : String(message));
        if (errorMessages.length > 0) {
            toast({ title: '⚠️ Validation Error', description: errorMessages.join(', '), variant: 'destructive' });
        }
    }, [errors]);

    useEffect(() => {
        const container = scrollContainerRef.current;
        if (!container) {
            return;
        }
        const handleScroll = () => setShowScrollTop(container.scrollTop > 240);
        handleScroll();
        container.addEventListener('scroll', handleScroll);
        return () => container.removeEventListener('scroll', handleScroll);
    }, []);

    const handleScrollToTop = () => {
        const container = scrollContainerRef.current;
        container?.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleFieldChange = (field: string, value: string) => {
        setData(field as never, value);
        clearErrors(field);
        validateField(field, value);
        setIsDirty(true);
    };

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
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
            preserveScroll: true,
            onSuccess: () => {
                clearErrors();
                setFrontendErrors({});
                setIsDirty(false);
                toast({
                    title: '✅ Truck Updated',
                    description: `${data.plate || truck.plate} has been updated successfully.`,
                });
            },
        });
    };

    const getFieldError = (fieldName: string) => errors[fieldName as keyof typeof errors] || frontendErrors[fieldName] || '';

    return (
        <FormPageLayout
            title="Update Truck"
            description="Make adjustments to identification, technical specifications, or financial milestones."
            headTitle={`Edit ${truck.plate}`}
            breadcrumbs={breadcrumbs}
            icon={
                <div className="rounded-xl bg-emerald-100 p-2 text-emerald-600 shadow-sm dark:bg-emerald-900/30 dark:text-emerald-400">
                    <Truck className="h-5 w-5" />
                </div>
            }
            headerAside={
                <>
                    <Button variant="ghost" size="sm" asChild>
                        <Link href={`/trucks/${truck.id}`}>
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Truck
                        </Link>
                    </Button>
                    {isDirty && <UnsavedChangesBadge />}
                    <div className="flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1.5 text-sm font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                        <div className="h-2 w-2 animate-pulse rounded-full bg-emerald-500"></div>
                        Fleet Operations
                    </div>
                </>
            }
        >
            <form
                ref={scrollContainerRef}
                onSubmit={submit}
                className="flex flex-1 flex-col gap-8 overflow-y-auto p-6 pb-24"
                style={{ minHeight: 0 }}
            >
                <FormSection
                    title="General Details"
                    description="Primary identification and status information."
                    icon={
                        <div className="rounded-lg bg-blue-100 p-2 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                            <Info className="h-4 w-4" />
                        </div>
                    }
                >
                    <FormField
                        id="plate"
                        label="Plate Number"
                        required
                        tooltip="Official license plate number"
                        error={getFieldError('plate')}
                    >
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
                    </FormField>
                    <FormField
                        id="vehicletype_id"
                        label="Vehicle Type"
                        required
                        error={getFieldError('vehicletype_id')}
                    >
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
                    </FormField>
                    <FormField
                        id="status"
                        label="Status"
                        required
                        error={getFieldError('status')}
                    >
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
                    </FormField>
                </FormSection>

                <FormSection
                    title="Technical Specifications"
                    description="Detailed build and maintenance metadata."
                    icon={
                        <div className="rounded-lg bg-amber-100 p-2 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
                            <Wrench className="h-4 w-4" />
                        </div>
                    }
                >
                    <FormField id="chasisNumber" label="Chassis Number" helperText="Optional - Factory assigned identifier">
                        <Input
                            id="chasisNumber"
                            type="text"
                            value={data.chasisNumber}
                            onChange={(e) => handleFieldChange('chasisNumber', e.target.value)}
                            placeholder="Chassis number"
                        />
                    </FormField>
                    <FormField id="engineNumber" label="Engine Number" helperText="Optional - Engine identifier">
                        <Input
                            id="engineNumber"
                            type="text"
                            value={data.engineNumber}
                            onChange={(e) => handleFieldChange('engineNumber', e.target.value)}
                            placeholder="Engine number"
                        />
                    </FormField>
                    <FormField id="tyreSyze" label="Tyre Size" helperText="Optional - Standard tire specification">
                        <Input
                            id="tyreSyze"
                            type="text"
                            value={data.tyreSyze}
                            onChange={(e) => handleFieldChange('tyreSyze', e.target.value)}
                            placeholder="e.g., 315/80R22.5"
                        />
                    </FormField>
                    <FormField id="serviceIntervalKM" label="Service Interval (KM)" error={getFieldError('serviceIntervalKM')}>
                        <Input
                            id="serviceIntervalKM"
                            type="number"
                            value={data.serviceIntervalKM}
                            onChange={(e) => handleFieldChange('serviceIntervalKM', e.target.value)}
                            placeholder="e.g., 10000"
                            className={getFieldError('serviceIntervalKM') ? 'border-red-500 focus:border-red-500' : ''}
                        />
                    </FormField>
                </FormSection>

                <FormSection
                    title="Operational & Financial"
                    description="Track lifecycle dates and investment values."
                    icon={
                        <div className="rounded-lg bg-emerald-100 p-2 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
                            <DollarSign className="h-4 w-4" />
                        </div>
                    }
                >
                    <FormField id="purchasePrice" label="Purchase Price" error={getFieldError('purchasePrice')}>
                        <Input
                            id="purchasePrice"
                            type="number"
                            step="1"
                            value={data.purchasePrice}
                            onChange={(e) => handleFieldChange('purchasePrice', e.target.value)}
                            placeholder="e.g., 2500000.00"
                            className={getFieldError('purchasePrice') ? 'border-red-500 focus:border-red-500' : ''}
                        />
                    </FormField>
                    <FormField id="productionDate" label="Production Date">
                        <DatePicker
                            fullWidth
                            value={data.productionDate ?? ''}
                            onChange={(next) => handleFieldChange('productionDate', next ?? '')}
                            fieldClassName={cn(
                                'h-11 border-slate-300 hover:border-slate-400 focus-within:border-blue-500 focus-within:ring-blue-500/20 dark:border-slate-600 dark:hover:border-slate-500',
                                getFieldError('productionDate') ? 'border-red-500 focus-within:border-red-500' : undefined,
                            )}
                        />
                    </FormField>
                    <FormField id="serviceStartDate" label="Service Start Date">
                        <DatePicker
                            fullWidth
                            value={data.serviceStartDate ?? ''}
                            onChange={(next) => handleFieldChange('serviceStartDate', next ?? '')}
                            isDisabled={!data.productionDate}
                            fieldClassName={cn(
                                'h-11 border-slate-300 hover:border-slate-400 focus-within:border-blue-500 focus-within:ring-blue-500/20 dark:border-slate-600 dark:hover:border-slate-500',
                                getFieldError('serviceStartDate') ? 'border-red-500 focus-within:border-red-500' : undefined,
                            )}
                        />
                    </FormField>
                </FormSection>

                <FormActionsBar
                    left={
                        <>
                            <span className="text-red-500">*</span>
                            <span>All required fields must be completed</span>
                            {isDirty && (
                                <span className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                                    <Save className="h-3 w-3" />
                                    You have unsaved changes
                                </span>
                            )}
                        </>
                    }
                    right={
                        <>
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
                        </>
                    }
                />
            </form>
            <ScrollToTopFab visible={showScrollTop} onClick={handleScrollToTop} />
        </FormPageLayout>
    );
}



