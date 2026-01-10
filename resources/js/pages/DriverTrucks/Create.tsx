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
import { toast } from '@/hooks/use-toast';
import { validateDriverTruck } from '@/lib/validation';
import { type BreadcrumbItem } from '@/types';
import { Link, useForm } from '@inertiajs/react';
import { cn } from '@/lib/utils';
import { ArrowLeft, Calendar, CheckCircle, Info, Save, Share2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { type FormEventHandler } from 'react';
import { parseISO } from 'date-fns';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

interface Truck {
    id: number;
    plate: string;
    status: string;
}

interface Driver {
    id: number;
    name: string;
    driverid: string;
    status: string;
}

interface Props {
    trucks: Truck[];
    drivers: Driver[];
    error?: string;
}

type DriverTruckFormData = {
    truck_id: string;
    driver_id: string;
    date_recived: string;
};

type DriverTruckFormField = keyof DriverTruckFormData;

export default function DriverTrucksCreate({ trucks, drivers, error }: Props) {
    const { t } = useTranslation();
    const todayString = useMemo(() => toLocalDateString(new Date()), []);
    const minDateString = useMemo(() => {
        const base = new Date();
        base.setHours(0, 0, 0, 0);
        base.setDate(base.getDate() - 30);
        return toLocalDateString(base);
    }, []);

    const searchParams = useMemo(() => {
        if (typeof window === 'undefined') {
            return null;
        }

        return new URLSearchParams(window.location.search);
    }, []);

    const minDate = useMemo(() => parseISO(minDateString), [minDateString]);
    const maxDate = useMemo(() => parseISO(todayString), [todayString]);

    const defaultDriverId = searchParams?.get('driver_id')?.trim() ?? '';
    const defaultTruckId = searchParams?.get('truck_id')?.trim() ?? '';

    const { data, setData, post, processing, errors, clearErrors } = useForm<DriverTruckFormData>({
        truck_id: defaultTruckId,
        driver_id: defaultDriverId,
        date_recived: todayString,
    });

    const [frontendErrors, setFrontendErrors] = useState<Partial<Record<DriverTruckFormField, string>>>({});
    const [isDirty, setIsDirty] = useState(false);
    const [showScrollTop, setShowScrollTop] = useState(false);
    const [truckSearch, setTruckSearch] = useState('');
    const [driverSearch, setDriverSearch] = useState('');
    const scrollContainerRef = useRef<HTMLFormElement | null>(null);

    useEffect(() => {
        if (!error) {
            return;
        }

        toast({
            title: t('driverTrucks.form.validation.errorTitle'),
            description: error,
            variant: 'destructive',
        });
    }, [error, t]);

    useEffect(() => {
        const messages = Object.values(errors)
            .map((message) => (typeof message === 'string' ? message : String(message)))
            .filter(Boolean);

        if (messages.length === 0) {
            return;
        }

        toast({
            title: t('driverTrucks.form.validation.title'),
            description: messages.join(', '),
            variant: 'destructive',
        });
    }, [errors, t]);

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

    const validateField = (field: DriverTruckFormField, nextState: DriverTruckFormData) => {
        const result = validateDriverTruck(nextState);
        const message = result[field];

        setFrontendErrors((prev) => {
            const next = { ...prev };
            if (message) {
                next[field] = message;
            } else {
                delete next[field];
            }
            return next;
        });
    };

    const handleFieldChange = (field: DriverTruckFormField, value: string) => {
        let nextValue = value;

        if (field === 'date_recived') {
            nextValue = value.slice(0, 10);
        }

        const nextState = { ...data, [field]: nextValue } as DriverTruckFormData;

        setData(field, nextValue);
        clearErrors(field);
        validateField(field, nextState);
        setIsDirty(true);
    };

    const submit: FormEventHandler = (event) => {
        event.preventDefault();

        const validationResult = validateDriverTruck(data);
        if (Object.keys(validationResult).length > 0) {
            setFrontendErrors(validationResult as Partial<Record<DriverTruckFormField, string>>);
            toast({
                title: t('driverTrucks.form.validation.title'),
                description: t('driverTrucks.form.validation.fixErrors'),
                variant: 'destructive',
            });
            return;
        }

        post('/driver-trucks', {
            preserveScroll: true,
            onSuccess: () => {
                clearErrors();
                setFrontendErrors({});
                setIsDirty(false);
                toast({
                    title: t('driverTrucks.form.create.successTitle'),
                    description: t('driverTrucks.form.create.successDescription'),
                });
            },
        });
    };

    const getFieldError = (field: DriverTruckFormField): string => {
        const backendError = errors[field];
        if (backendError) {
            return typeof backendError === 'string' ? backendError : String(backendError);
        }

        return frontendErrors[field] ?? '';
    };

    const safeTrucks = useMemo(() => (Array.isArray(trucks) ? trucks : []), [trucks]);
    const safeDrivers = useMemo(() => (Array.isArray(drivers) ? drivers : []), [drivers]);

    const filteredTrucks = useMemo(() => {
        if (!truckSearch.trim()) {
            return safeTrucks;
        }

        const query = truckSearch.toLowerCase();
        return safeTrucks.filter((truck) => {
            const plateMatch = truck.plate?.toLowerCase().includes(query);
            const statusMatch = String(truck.status).includes(query);
            return Boolean(plateMatch || statusMatch);
        });
    }, [safeTrucks, truckSearch]);

    const filteredDrivers = useMemo(() => {
        if (!driverSearch.trim()) {
            return safeDrivers;
        }

        const query = driverSearch.toLowerCase();
        return safeDrivers.filter((driver) => {
            const nameMatch = driver.name?.toLowerCase().includes(query);
            const driverIdMatch = driver.driverid?.toLowerCase().includes(query);
            const statusMatch = String(driver.status).includes(query);
            return Boolean(nameMatch || driverIdMatch || statusMatch);
        });
    }, [safeDrivers, driverSearch]);

    const selectedTruck = safeTrucks.find((truck) => truck.id.toString() === data.truck_id);
    const selectedDriver = safeDrivers.find((driver) => driver.id.toString() === data.driver_id);
    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: t('driverTrucks.breadcrumb'),
            href: '/driver-trucks',
        },
        {
            title: t('driverTrucks.form.create.breadcrumb'),
            href: '/driver-trucks/create',
        },
    ];

    return (
        <FormPageLayout
            title={t('driverTrucks.form.create.title')}
            headTitle={t('driverTrucks.form.create.headTitle')}
            description={t('driverTrucks.form.create.description')}
            breadcrumbs={breadcrumbs}
            icon={<Share2 className="h-5 w-5" />}
            headerAside={
                <>
                    <Button variant="ghost" size="sm" asChild>
                        <Link href="/driver-trucks">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            {t('driverTrucks.form.create.backToList')}
                        </Link>
                    </Button>
                    {isDirty && <UnsavedChangesBadge />}
                    <div className="flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1.5 text-sm font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                        <div className="h-2 w-2 animate-pulse rounded-full bg-emerald-500"></div>
                        {t('driverTrucks.form.badge')}
                    </div>
                </>
            }
        >
            {(Object.keys(errors).length > 0 || Object.keys(frontendErrors).length > 0) && (
                <div className="px-6 pt-6">
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{t('driverTrucks.form.validation.resolve')}</AlertDescription>
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
                    title={t('driverTrucks.form.sections.selection.title')}
                    description={t('driverTrucks.form.sections.selection.description')}
                    icon={
                        <div className="rounded-lg bg-blue-100 p-2 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                            <Info className="h-4 w-4" />
                        </div>
                    }
                >
                    <FormField
                        id="truck_id"
                        label={t('driverTrucks.form.fields.truck.label')}
                        required
                        tooltip={t('driverTrucks.form.fields.truck.tooltip')}
                        error={getFieldError('truck_id')}
                    >
                        <Select
                            value={data.truck_id}
                            onValueChange={(value) => handleFieldChange('truck_id', value)}
                            onOpenChange={(open) => {
                                if (!open) {
                                    setTruckSearch('');
                                }
                            }}
                        >
                            <SelectTrigger
                                className={`transition-all duration-200 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500 focus:ring-blue-500/20 focus:border-blue-500 ${getFieldError('truck_id') ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}`}
                            >
                                <SelectValue placeholder={t('driverTrucks.form.fields.truck.placeholder')} />
                            </SelectTrigger>
                            <SelectContent className="z-50 bg-white shadow-lg dark:bg-slate-800">
                                <div className="sticky top-0 z-10 bg-white p-2 dark:bg-slate-800 dark:shadow-[0_1px_0_0_rgba(148,163,184,0.35)] shadow-[0_1px_0_0_rgba(148,163,184,0.35)]">
                                    <Input
                                        autoComplete="off"
                                        value={truckSearch}
                                        onChange={(event) => setTruckSearch(event.target.value)}
                                        placeholder={t('driverTrucks.form.fields.truck.searchPlaceholder')}
                                        className="h-9 w-full border-slate-200 bg-slate-50 text-sm focus-visible:ring-1 focus-visible:ring-blue-500 dark:border-slate-700 dark:bg-slate-900"
                                    />
                                </div>
                                {filteredTrucks.length > 0 ? (
                                    filteredTrucks.map((truck) => (
                                        <SelectItem
                                            key={truck.id}
                                            value={truck.id.toString()}
                                            className="hover:bg-slate-100 focus:bg-slate-100 dark:hover:bg-slate-700 dark:focus:bg-slate-700"
                                        >
                                            {truck.plate}
                                        </SelectItem>
                                    ))
                                ) : (
                                    <SelectItem value="no-trucks" disabled>
                                        {t('driverTrucks.form.fields.truck.empty')}
                                    </SelectItem>
                                )}
                            </SelectContent>
                        </Select>
                        {selectedTruck && (
                            <div className="rounded-lg border border-slate-200 bg-white/70 p-4 text-sm shadow-sm dark:border-slate-700 dark:bg-slate-900/50">
                                <h4 className="mb-2 font-semibold text-slate-800 dark:text-slate-200">{t('driverTrucks.form.selectedTruck.title')}</h4>
                                <p className="text-slate-600 dark:text-slate-400">
                                    <strong>{t('driverTrucks.form.selectedTruck.plate')}:</strong> {selectedTruck.plate}
                                </p>
                                <p className="text-slate-600 dark:text-slate-400">
                                    <strong>{t('driverTrucks.form.selectedTruck.status')}:</strong> {selectedTruck.status === 'active' ? t('driverTrucks.status.active') : t('driverTrucks.status.inactive')}
                                </p>
                            </div>
                        )}
                    </FormField>

                    <FormField
                        id="driver_id"
                        label={t('driverTrucks.form.fields.driver.label')}
                        required
                        tooltip={t('driverTrucks.form.fields.driver.tooltip')}
                        error={getFieldError('driver_id')}
                    >
                        <Select
                            value={data.driver_id}
                            onValueChange={(value) => handleFieldChange('driver_id', value)}
                            onOpenChange={(open) => {
                                if (!open) {
                                    setDriverSearch('');
                                }
                            }}
                        >
                            <SelectTrigger
                                className={`transition-all duration-200 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500 focus:ring-blue-500/20 focus:border-blue-500 ${getFieldError('driver_id') ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}`}
                            >
                                <SelectValue placeholder={t('driverTrucks.form.fields.driver.placeholder')} />
                            </SelectTrigger>
                            <SelectContent className="z-50 bg-white shadow-lg dark:bg-slate-800">
                                <div className="sticky top-0 z-10 bg-white p-2 dark:bg-slate-800 dark:shadow-[0_1px_0_0_rgba(148,163,184,0.35)] shadow-[0_1px_0_0_rgba(148,163,184,0.35)]">
                                    <Input
                                        autoComplete="off"
                                        value={driverSearch}
                                        onChange={(event) => setDriverSearch(event.target.value)}
                                        placeholder={t('driverTrucks.form.fields.driver.searchPlaceholder')}
                                        className="h-9 w-full border-slate-200 bg-slate-50 text-sm focus-visible:ring-1 focus-visible:ring-blue-500 dark:border-slate-700 dark:bg-slate-900"
                                    />
                                </div>
                                {filteredDrivers.length > 0 ? (
                                    filteredDrivers.map((driver) => (
                                        <SelectItem
                                            key={driver.id}
                                            value={driver.id.toString()}
                                            className="hover:bg-slate-100 focus:bg-slate-100 dark:hover:bg-slate-700 dark:focus:bg-slate-700"
                                        >
                                            {t('driverTrucks.form.fields.driver.optionLabel', { name: driver.name, id: driver.driverid })}
                                        </SelectItem>
                                    ))
                                ) : (
                                    <SelectItem value="no-drivers" disabled>
                                        {t('driverTrucks.form.fields.driver.empty')}
                                    </SelectItem>
                                )}
                            </SelectContent>
                        </Select>
                        {selectedDriver && (
                            <div className="rounded-lg border border-slate-200 bg-white/70 p-4 text-sm shadow-sm dark:border-slate-700 dark:bg-slate-900/50">
                                <h4 className="mb-2 font-semibold text-slate-800 dark:text-slate-200">{t('driverTrucks.form.selectedDriver.title')}</h4>
                                <p className="text-slate-600 dark:text-slate-400">
                                    <strong>{t('driverTrucks.form.selectedDriver.name')}:</strong> {selectedDriver.name}
                                </p>
                                <p className="text-slate-600 dark:text-slate-400">
                                    <strong>{t('driverTrucks.form.selectedDriver.driverId')}:</strong> {selectedDriver.driverid}
                                </p>
                                <p className="text-slate-600 dark:text-slate-400">
                                    <strong>{t('driverTrucks.form.selectedDriver.status')}:</strong> {selectedDriver.status === 'active' ? t('driverTrucks.status.active') : t('driverTrucks.status.inactive')}
                                </p>
                            </div>
                        )}
                    </FormField>
                </FormSection>

                <FormSection
                    title={t('driverTrucks.form.sections.details.title')}
                    description={t('driverTrucks.form.sections.details.description')}
                    icon={
                        <div className="rounded-lg bg-emerald-100 p-2 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
                            <Calendar className="h-4 w-4" />
                        </div>
                    }
                >
                    <FormField
                        id="date_recived"
                        label={t('driverTrucks.form.fields.date.label')}
                        required
                        helperText={t('driverTrucks.form.fields.date.helper')}
                        error={getFieldError('date_recived')}
                    >
                        <DatePicker
                            value={data.date_recived || ''}
                            onChange={(next) => handleFieldChange('date_recived', next ?? '')}
                            fromDate={minDate}
                            toDate={maxDate}
                            className={cn(
                                'w-full justify-start text-left h-11 border-slate-300 hover:border-slate-400 focus-visible:border-blue-500 focus-visible:ring-blue-500/20 dark:border-slate-600 dark:hover:border-slate-500',
                                getFieldError('date_recived') ? 'border-red-500 focus-visible:border-red-500' : undefined,
                            )}
                        />
                    </FormField>

                    {(selectedTruck || selectedDriver) && (
                        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm shadow-sm dark:border-blue-800/60 dark:bg-blue-900/40">
                            <h4 className="mb-3 font-semibold text-blue-900 dark:text-blue-200">{t('driverTrucks.form.summary.title')}</h4>
                            <div className="space-y-2 text-blue-900 dark:text-blue-100">
                                {selectedDriver && (
                                    <p>
                                        <strong>{t('driverTrucks.form.summary.driver')}:</strong> {selectedDriver.name} ({selectedDriver.driverid})
                                    </p>
                                )}
                                {selectedTruck && (
                                    <p>
                                        <strong>{t('driverTrucks.form.summary.truck')}:</strong> {selectedTruck.plate}
                                    </p>
                                )}
                                {data.date_recived && (
                                    <p>
                                        <strong>{t('driverTrucks.form.summary.date')}:</strong> {new Date(data.date_recived).toLocaleDateString()}
                                    </p>
                                )}
                                <p>
                                    <strong>{t('driverTrucks.form.summary.status')}:</strong> {t('driverTrucks.status.activeAssignment')}
                                </p>
                            </div>
                        </div>
                    )}
                </FormSection>

                <FormActionsBar
                    left={
                        <>
                            <span className="text-red-500">*</span>
                            <span>{t('driverTrucks.form.required')}</span>
                            {isDirty && (
                                <span className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                                    <Save className="h-3 w-3" />
                                    {t('driverTrucks.form.unsaved')}
                                </span>
                            )}
                        </>
                    }
                    right={
                        <>
                            <Button type="button" variant="outline" asChild className="border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700">
                                <Link href="/driver-trucks">{t('driverTrucks.actions.cancel')}</Link>
                            </Button>
                            <Button
                                type="submit"
                                disabled={
                                    processing ||
                                    Object.keys(frontendErrors).length > 0 ||
                                    !data.truck_id ||
                                    !data.driver_id ||
                                    !data.date_recived
                                }
                                className="min-w-[160px] bg-gradient-to-r from-blue-600 to-blue-700 px-6 text-white shadow-lg transition-all duration-200 hover:from-blue-700 hover:to-blue-800 hover:shadow-xl"
                            >
                                {processing ? (
                                    <>
                                        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-white"></div>
                                        {t('driverTrucks.form.create.submitting')}
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle className="mr-2 h-4 w-4" />
                                        {t('driverTrucks.form.create.submit')}
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

function toLocalDateString(date: Date) {
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
}
