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
import { validateTruck, truckValidation, type ValidationErrors } from '@/lib/validation';
import { Info, Wrench, DollarSign, CheckCircle, ArrowLeft, Save, Truck, Hash, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FormEventHandler, useEffect, useMemo, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

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

type TruckFormData = {
    plate: string;
    vehicletype_id: string;
    chasisNumber: string;
    engineNumber: string;
    tyreSyze: string;
    serviceIntervalKM: string;
    purchasePrice: string;
    productionDate: string;
    serviceStartDate: string;
    status: string;
};

type TruckFormField = keyof TruckFormData;

export default function TrucksEdit({ truck, vehicleTypes }: TrucksEditProps) {
    const { t } = useTranslation();
    const breadcrumbs: BreadcrumbItem[] = useMemo(
        () => [
            { title: t('trucks.breadcrumb'), href: '/trucks' },
            { title: truck.plate, href: `/trucks/${truck.id}` },
            { title: t('trucks.form.edit.breadcrumb'), href: `/trucks/${truck.id}/edit` },
        ],
        [t, truck.id, truck.plate],
    );

    const { data, setData, put, processing, errors, clearErrors } = useForm<TruckFormData>({
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

    const validateField = (field: TruckFormField, value: string) => {
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
            .map(([, message]) => typeof message === 'string' ? message : String(message));
        if (errorMessages.length > 0) {
            toast({
                title: t('trucks.form.validation.title'),
                description: errorMessages.join(', '),
                variant: 'destructive',
            });
        }
    }, [errors, t]);

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

    const handleFieldChange = (field: TruckFormField, value: string) => {
        setData(field, value);
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
                title: t('trucks.form.validation.title'),
                description: t('trucks.form.validation.fixErrors'),
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
            },
        });
    };

    const getFieldError = (fieldName: TruckFormField): string =>
        (errors[fieldName] as string | undefined) || frontendErrors[fieldName] || '';

    return (
        <FormPageLayout
            title={t('trucks.form.edit.title')}
            description={t('trucks.form.edit.description')}
            headTitle={t('trucks.form.edit.headTitle', { plate: truck.plate })}
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
                            {t('trucks.form.edit.backToTruck')}
                        </Link>
                    </Button>
                    {isDirty && <UnsavedChangesBadge />}
                    <div className="flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1.5 text-sm font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                        <div className="h-2 w-2 animate-pulse rounded-full bg-emerald-500"></div>
                        {t('trucks.form.badge')}
                    </div>
                </>
            }
        >
            {(Object.keys(errors).length > 0 || Object.keys(frontendErrors).length > 0) && (
                <div className="px-6 pt-6">
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{t('trucks.form.validation.resolve')}</AlertDescription>
                    </Alert>
                </div>
            )}

            <form
                ref={scrollContainerRef}
                onSubmit={submit}
                className="flex flex-1 flex-col gap-8 overflow-y-auto p-6 pb-24"
                style={{ minHeight: 0 }}
            >
                <FormSection
                    title={t('trucks.form.sections.general.title')}
                    description={t('trucks.form.sections.general.description')}
                    icon={
                        <div className="rounded-lg bg-blue-100 p-2 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                            <Info className="h-4 w-4" />
                        </div>
                    }
                >
                    <FormField
                        id="plate"
                        label={t('trucks.form.fields.plate.label')}
                        required
                        tooltip={t('trucks.form.fields.plate.tooltip')}
                        error={getFieldError('plate')}
                    >
                        <div className="relative">
                            <Hash className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <Input
                                id="plate"
                                type="text"
                                value={data.plate}
                                onChange={(e) => handleFieldChange('plate', e.target.value.toUpperCase())}
                                placeholder={t('trucks.form.fields.plate.placeholder')}
                                className={`pl-10 transition-all duration-200 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 ${getFieldError('plate') ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : 'focus:ring-blue-500/20 focus:border-blue-500 hover:border-slate-400 dark:hover:border-slate-500'}`}
                            />
                        </div>
                    </FormField>
                    <FormField
                        id="vehicletype_id"
                        label={t('trucks.form.fields.vehicleType.label')}
                        required
                        error={getFieldError('vehicletype_id')}
                    >
                        <Select
                            value={data.vehicletype_id}
                            onValueChange={(value) => handleFieldChange('vehicletype_id', value)}
                        >
                            <SelectTrigger className={`transition-all duration-200 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500 focus:ring-blue-500/20 focus:border-blue-500 ${getFieldError('vehicletype_id') ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}`}>
                                <SelectValue placeholder={t('trucks.form.fields.vehicleType.placeholder')} />
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
                        label={t('trucks.form.fields.status.label')}
                        required
                        error={getFieldError('status')}
                    >
                        <Select
                            value={data.status}
                            onValueChange={(value) => handleFieldChange('status', value)}
                        >
                            <SelectTrigger className={`transition-all duration-200 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500 focus:ring-blue-500/20 focus:border-blue-500 ${getFieldError('status') ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}`}>
                                <SelectValue placeholder={t('trucks.form.fields.status.placeholder')} />
                            </SelectTrigger>
                            <SelectContent className="z-50 bg-white shadow-lg dark:bg-slate-800">
                                <SelectItem value="active" className="hover:bg-slate-100 focus:bg-slate-100 dark:hover:bg-slate-700 dark:focus:bg-slate-700">
                                    {t('trucks.status.active')}
                                </SelectItem>
                                <SelectItem value="inactive" className="hover:bg-slate-100 focus:bg-slate-100 dark:hover:bg-slate-700 dark:focus:bg-slate-700">
                                    {t('trucks.status.inactive')}
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </FormField>
                </FormSection>

                <FormSection
                    title={t('trucks.form.sections.technical.title')}
                    description={t('trucks.form.sections.technical.description')}
                    icon={
                        <div className="rounded-lg bg-amber-100 p-2 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
                            <Wrench className="h-4 w-4" />
                        </div>
                    }
                >
                    <FormField
                        id="chasisNumber"
                        label={t('trucks.form.fields.chassis.label')}
                        helperText={t('trucks.form.fields.chassis.helper')}
                    >
                        <Input
                            id="chasisNumber"
                            type="text"
                            value={data.chasisNumber}
                            onChange={(e) => handleFieldChange('chasisNumber', e.target.value)}
                            placeholder={t('trucks.form.fields.chassis.placeholder')}
                        />
                    </FormField>
                    <FormField
                        id="engineNumber"
                        label={t('trucks.form.fields.engine.label')}
                        helperText={t('trucks.form.fields.engine.helper')}
                    >
                        <Input
                            id="engineNumber"
                            type="text"
                            value={data.engineNumber}
                            onChange={(e) => handleFieldChange('engineNumber', e.target.value)}
                            placeholder={t('trucks.form.fields.engine.placeholder')}
                        />
                    </FormField>
                    <FormField
                        id="tyreSyze"
                        label={t('trucks.form.fields.tyre.label')}
                        helperText={t('trucks.form.fields.tyre.helper')}
                    >
                        <Input
                            id="tyreSyze"
                            type="text"
                            value={data.tyreSyze}
                            onChange={(e) => handleFieldChange('tyreSyze', e.target.value)}
                            placeholder={t('trucks.form.fields.tyre.placeholder')}
                        />
                    </FormField>
                    <FormField
                        id="serviceIntervalKM"
                        label={t('trucks.form.fields.serviceInterval.label')}
                        error={getFieldError('serviceIntervalKM')}
                    >
                        <Input
                            id="serviceIntervalKM"
                            type="number"
                            value={data.serviceIntervalKM}
                            onChange={(e) => handleFieldChange('serviceIntervalKM', e.target.value)}
                            placeholder={t('trucks.form.fields.serviceInterval.placeholder')}
                            className={getFieldError('serviceIntervalKM') ? 'border-red-500 focus:border-red-500' : ''}
                        />
                    </FormField>
                </FormSection>

                <FormSection
                    title={t('trucks.form.sections.financial.title')}
                    description={t('trucks.form.sections.financial.description')}
                    icon={
                        <div className="rounded-lg bg-emerald-100 p-2 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
                            <DollarSign className="h-4 w-4" />
                        </div>
                    }
                >
                    <FormField
                        id="purchasePrice"
                        label={t('trucks.form.fields.purchasePrice.label')}
                        error={getFieldError('purchasePrice')}
                    >
                        <Input
                            id="purchasePrice"
                            type="number"
                            step="1"
                            value={data.purchasePrice}
                            onChange={(e) => handleFieldChange('purchasePrice', e.target.value)}
                            placeholder={t('trucks.form.fields.purchasePrice.placeholder')}
                            className={getFieldError('purchasePrice') ? 'border-red-500 focus:border-red-500' : ''}
                        />
                    </FormField>
                    <FormField id="productionDate" label={t('trucks.form.fields.productionDate.label')}>
                        <DatePicker
                            value={data.productionDate ?? ''}
                            onChange={(next) => handleFieldChange('productionDate', next ?? '')}
                            className={cn(
                                'w-full justify-start text-left h-11 border-slate-300 hover:border-slate-400 focus-visible:border-blue-500 focus-visible:ring-blue-500/20 dark:border-slate-600 dark:hover:border-slate-500',
                                getFieldError('productionDate') ? 'border-red-500 focus-visible:border-red-500 focus-visible:ring-red-500/20' : undefined,
                            )}
                        />
                    </FormField>
                    <FormField id="serviceStartDate" label={t('trucks.form.fields.serviceStartDate.label')}>
                        <DatePicker
                            value={data.serviceStartDate ?? ''}
                            onChange={(next) => handleFieldChange('serviceStartDate', next ?? '')}
                            disabled={!data.productionDate}
                            className={cn(
                                'w-full justify-start text-left h-11 border-slate-300 hover:border-slate-400 focus-visible:border-blue-500 focus-visible:ring-blue-500/20 dark:border-slate-600 dark:hover:border-slate-500',
                                getFieldError('serviceStartDate') ? 'border-red-500 focus-visible:border-red-500 focus-visible:ring-red-500/20' : undefined,
                            )}
                        />
                    </FormField>
                </FormSection>

                <FormActionsBar
                    left={
                        <>
                            <span className="text-red-500">*</span>
                            <span>{t('trucks.form.required')}</span>
                            {isDirty && (
                                <span className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                                    <Save className="h-3 w-3" />
                                    {t('trucks.form.unsaved')}
                                </span>
                            )}
                        </>
                    }
                    right={
                        <>
                            <Button type="button" variant="outline" asChild className="border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700">
                                <Link href={`/trucks/${truck.id}`}>{t('trucks.actions.cancel')}</Link>
                            </Button>
                            <Button
                                type="submit"
                                disabled={processing || Object.keys(frontendErrors).length > 0}
                                className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white shadow-lg hover:shadow-xl transition-all duration-200 px-6 min-w-[160px]"
                            >
                                {processing ? (
                                    <>
                                        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-white"></div>
                                        {t('trucks.form.edit.submitting')}
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle className="mr-2 h-4 w-4" />
                                        {t('trucks.form.edit.submit')}
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


