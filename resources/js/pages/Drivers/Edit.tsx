import { FormPageLayout } from '@/components/forms/form-page-layout';
import { FormSection } from '@/components/forms/form-section';
import { FormField } from '@/components/forms/form-field';
import { FormActionsBar } from '@/components/forms/form-actions-bar';
import { UnsavedChangesBadge } from '@/components/forms/unsaved-changes-badge';
import { ScrollToTopFab } from '@/components/forms/scroll-to-top-fab';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Link, useForm } from '@inertiajs/react';
import { FormEventHandler, useEffect, useRef, useState } from 'react';
import { toast } from '@/hooks/use-toast';
import { validateDriver } from '@/lib/validation';
import { Info, User, MapPin, Calendar, CheckCircle, Save, User as UserIcon, Hash, ArrowLeft } from 'lucide-react';
import { type BreadcrumbItem } from '@/types';

interface Driver {
    id: number;
    driverid: string;
    name: string;
    sex: string;
    birthdate?: string | null;
    zone?: string | null;
    woreda?: string | null;
    kebele?: string | null;
    housenumber?: string | null;
    mobile?: string | null;
    hireddate?: string | null;
    status: string;
}

interface DriversEditProps {
    driver: Driver;
}

type DriverFormData = {
    driverid: string;
    name: string;
    sex: string;
    birthdate: string;
    zone: string;
    woreda: string;
    kebele: string;
    housenumber: string;
    mobile: string;
    hireddate: string;
    status: string;
};

type DriverFormField = keyof DriverFormData;

export default function DriversEdit({ driver }: DriversEditProps) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Drivers', href: '/drivers' },
        { title: driver.name || driver.driverid || 'Driver', href: `/drivers/${driver.id}` },
        { title: 'Edit', href: `/drivers/${driver.id}/edit` },
    ];

    const { data, setData, put, processing, errors, clearErrors } = useForm<DriverFormData>({
        driverid: driver.driverid ?? '',
        name: driver.name ?? '',
        sex: driver.sex ?? '',
        birthdate: driver.birthdate ?? '',
        zone: driver.zone ?? '',
        woreda: driver.woreda ?? '',
        kebele: driver.kebele ?? '',
        housenumber: driver.housenumber ?? '',
        mobile: driver.mobile ?? '',
        hireddate: driver.hireddate ?? '',
        status: driver.status ?? 'active',
    });

    const [frontendErrors, setFrontendErrors] = useState<Partial<Record<DriverFormField, string>>>({});
    const [showScrollTop, setShowScrollTop] = useState(false);
    const scrollContainerRef = useRef<HTMLFormElement | null>(null);
    const [isDirty, setIsDirty] = useState(false);

    const validateField = (field: DriverFormField, nextState: DriverFormData) => {
        const result = validateDriver(nextState);

        setFrontendErrors((prev) => {
            const nextErrors = { ...prev };
            const message = result[field];

            if (message) {
                nextErrors[field] = message;
            } else {
                delete nextErrors[field];
            }

            return nextErrors;
        });
    };

    useEffect(() => {
        const errorMessages = Object.entries(errors).map(([_, message]) =>
            typeof message === 'string' ? message : String(message),
        );

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

        const handleScroll = () => setShowScrollTop(container.scrollTop > 240);
        handleScroll();
        container.addEventListener('scroll', handleScroll);

        return () => container.removeEventListener('scroll', handleScroll);
    }, []);

    const handleScrollToTop = () => {
        const container = scrollContainerRef.current;
        container?.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleFieldChange = (field: DriverFormField, value: string) => {
        let nextValue = value;

        if (field === 'driverid') {
            nextValue = value.toUpperCase().slice(0, 255);
        } else if (field === 'mobile') {
            nextValue = value.slice(0, 20);
        }

        const nextState = { ...data, [field]: nextValue } as DriverFormData;

        setData(field, nextValue);
        clearErrors(field);
        validateField(field, nextState);
        setIsDirty(true);
    };

    const submit: FormEventHandler = (event) => {
        event.preventDefault();

        const allErrors = validateDriver(data);
        if (Object.keys(allErrors).length > 0) {
            setFrontendErrors(allErrors);
            toast({
                title: '⚠️ Validation Error',
                description: 'Please fix the validation errors before submitting',
                variant: 'destructive',
            });
            return;
        }

        put(`/drivers/${driver.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                clearErrors();
                setFrontendErrors({});
                setIsDirty(false);
                toast({
                    title: '✅ Driver Updated',
                    description: `${data.name || data.driverid || driver.name || driver.driverid} has been updated successfully.`,
                });
            },
        });
    };

    const getFieldError = (fieldName: DriverFormField): string =>
        (errors[fieldName] as string | undefined) || frontendErrors[fieldName] || '';

    return (
        <FormPageLayout
            title="Update Driver"
            description={`Modify identification, employment, and contact details for ${driver.name}.`}
            headTitle={`Edit ${driver.name}`}
            breadcrumbs={breadcrumbs}
            icon={<UserIcon className="h-5 w-5" />}
            headerAside={
                <>
                    <Button variant="ghost" size="sm" asChild>
                        <Link href="/drivers">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Drivers
                        </Link>
                    </Button>
                    {isDirty && <UnsavedChangesBadge />}
                    <div className="flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1.5 text-sm font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                        <div className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
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
                    description="Core identification and status information for the driver."
                    icon={
                        <div className="rounded-lg bg-blue-100 p-2 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                            <Info className="h-4 w-4" />
                        </div>
                    }
                >
                    <FormField
                        id="driverid"
                        label="Driver ID"
                        required
                        tooltip="Unique identifier for the driver"
                        error={getFieldError('driverid')}
                    >
                        <div className="relative">
                            <Hash className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <Input
                                id="driverid"
                                type="text"
                                value={data.driverid}
                                onChange={(event) => handleFieldChange('driverid', event.target.value)}
                                placeholder="e.g., DRV001"
                                maxLength={255}
                                className={`pl-10 transition-all duration-200 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 ${getFieldError('driverid') ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : 'focus:ring-blue-500/20 focus:border-blue-500 hover:border-slate-400 dark:hover:border-slate-500'}`}
                            />
                        </div>
                    </FormField>
                    <FormField id="name" label="Full Name" required error={getFieldError('name')}>
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <Input
                                id="name"
                                type="text"
                                value={data.name}
                                onChange={(event) => handleFieldChange('name', event.target.value)}
                                placeholder="Enter full name"
                                maxLength={255}
                                className={`pl-10 transition-all duration-200 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 ${getFieldError('name') ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : 'focus:ring-blue-500/20 focus:border-blue-500 hover:border-slate-400 dark:hover:border-slate-500'}`}
                            />
                        </div>
                    </FormField>
                    <FormField id="sex" label="Gender" required error={getFieldError('sex')}>
                        <Select value={data.sex} onValueChange={(value) => handleFieldChange('sex', value)}>
                            <SelectTrigger className={`transition-all duration-200 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500 focus:ring-blue-500/20 focus:border-blue-500 ${getFieldError('sex') ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}`}>
                                <SelectValue placeholder="Select gender" />
                            </SelectTrigger>
                            <SelectContent className="z-50 bg-white shadow-lg dark:bg-slate-800">
                                <SelectItem value="male" className="hover:bg-slate-100 focus:bg-slate-100 dark:hover:bg-slate-700 dark:focus:bg-slate-700">
                                    Male
                                </SelectItem>
                                <SelectItem value="female" className="hover:bg-slate-100 focus:bg-slate-100 dark:hover:bg-slate-700 dark:focus:bg-slate-700">
                                    Female
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </FormField>
                    <FormField id="status" label="Status" required error={getFieldError('status')}>
                        <Select value={data.status} onValueChange={(value) => handleFieldChange('status', value)}>
                            <SelectTrigger className={`transition-all duration-200 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500 focus:ring-blue-500/20 focus:border-blue-500 ${getFieldError('status') ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}`}>
                                <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent className="z-50 bg-white shadow-lg dark:bg-slate-800">
                                <SelectItem value="active" className="hover:bg-slate-100 focus:bg-slate-100 dark:hover:bg-slate-700 dark:focus:bg-slate-700">
                                    Active
                                </SelectItem>
                                <SelectItem value="inactive" className="hover:bg-slate-100 focus:bg-slate-100 dark:hover:bg-slate-700 dark:focus:bg-slate-700">
                                    Inactive
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </FormField>
                </FormSection>

                <FormSection
                    title="Personal Details"
                    description="Capture birth and employment lifecycle information."
                    icon={
                        <div className="rounded-lg bg-amber-100 p-2 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
                            <User className="h-4 w-4" />
                        </div>
                    }
                    contentClassName="grid-cols-1 gap-4 md:grid-cols-2"
                >
                    <FormField id="birthdate" label="Date of Birth" error={getFieldError('birthdate')}>
                        <div className="group relative">
                            <Input
                                id="birthdate"
                                type="date"
                                value={data.birthdate}
                                onChange={(event) => handleFieldChange('birthdate', event.target.value)}
                                className={`pl-4 pr-10 py-2.5 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-3 [&::-webkit-calendar-picker-indicator]:h-4 [&::-webkit-calendar-picker-indicator]:w-4 [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0 ${getFieldError('birthdate') ? 'border-red-500 focus:border-red-500' : ''}`}
                            />
                            <div
                                className="absolute right-3 top-1/2 z-20 -translate-y-1/2 cursor-pointer"
                                onClick={() => {
                                    const input = document.getElementById('birthdate') as HTMLInputElement | null;
                                    input?.showPicker?.();
                                }}
                            >
                                <Calendar className="h-4 w-4 text-slate-500 transition-colors duration-200 group-hover:text-slate-600 dark:text-slate-400 dark:group-hover:text-slate-300" />
                            </div>
                        </div>
                    </FormField>
                    <FormField id="hireddate" label="Hire Date" error={getFieldError('hireddate')}>
                        <div className="group relative">
                            <Input
                                id="hireddate"
                                type="date"
                                value={data.hireddate}
                                onChange={(event) => handleFieldChange('hireddate', event.target.value)}
                                className={`pl-4 pr-10 py-2.5 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-3 [&::-webkit-calendar-picker-indicator]:h-4 [&::-webkit-calendar-picker-indicator]:w-4 [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0 ${getFieldError('hireddate') ? 'border-red-500 focus:border-red-500' : ''}`}
                            />
                            <div
                                className="absolute right-3 top-1/2 z-20 -translate-y-1/2 cursor-pointer"
                                onClick={() => {
                                    const input = document.getElementById('hireddate') as HTMLInputElement | null;
                                    input?.showPicker?.();
                                }}
                            >
                                <Calendar className="h-4 w-4 text-slate-500 transition-colors duration-200 group-hover:text-slate-600 dark:text-slate-400 dark:group-hover:text-slate-300" />
                            </div>
                        </div>
                    </FormField>
                </FormSection>

                <FormSection
                    title="Contact & Address"
                    description="Ensure we can reach the driver and locate their residence."
                    icon={
                        <div className="rounded-lg bg-emerald-100 p-2 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
                            <MapPin className="h-4 w-4" />
                        </div>
                    }
                    contentClassName="grid-cols-1 gap-4 md:grid-cols-2"
                >
                    <FormField id="mobile" label="Mobile Number" error={getFieldError('mobile')}>
                        <Input
                            id="mobile"
                            type="tel"
                            value={data.mobile}
                            onChange={(event) => handleFieldChange('mobile', event.target.value)}
                            placeholder="e.g., +251911123456"
                            maxLength={20}
                            className={`transition-all duration-200 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 ${getFieldError('mobile') ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : 'focus:ring-blue-500/20 focus:border-blue-500 hover:border-slate-400 dark:hover:border-slate-500'}`}
                        />
                    </FormField>
                    <FormField id="zone" label="Zone" helperText="Optional - Administrative zone" error={getFieldError('zone')}>
                        <Input
                            id="zone"
                            type="text"
                            value={data.zone}
                            onChange={(event) => handleFieldChange('zone', event.target.value)}
                            placeholder="Zone/District"
                            maxLength={255}
                            className="transition-all duration-200 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500 focus:ring-blue-500/20 focus:border-blue-500"
                        />
                    </FormField>
                    <FormField id="woreda" label="Woreda" helperText="Optional - Sub-district" error={getFieldError('woreda')}>
                        <Input
                            id="woreda"
                            type="text"
                            value={data.woreda}
                            onChange={(event) => handleFieldChange('woreda', event.target.value)}
                            placeholder="Woreda/Sub-district"
                            maxLength={255}
                            className="transition-all duration-200 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500 focus:ring-blue-500/20 focus:border-blue-500"
                        />
                    </FormField>
                    <FormField id="kebele" label="Kebele" helperText="Optional - Neighborhood" error={getFieldError('kebele')}>
                        <Input
                            id="kebele"
                            type="text"
                            value={data.kebele}
                            onChange={(event) => handleFieldChange('kebele', event.target.value)}
                            placeholder="Kebele/Neighborhood"
                            maxLength={255}
                            className="transition-all duration-200 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500 focus:ring-blue-500/20 focus:border-blue-500"
                        />
                    </FormField>
                    <FormField
                        id="housenumber"
                        label="House Number"
                        helperText="Optional - House/building number"
                        error={getFieldError('housenumber')}
                    >
                        <Input
                            id="housenumber"
                            type="text"
                            value={data.housenumber}
                            onChange={(event) => handleFieldChange('housenumber', event.target.value)}
                            placeholder="House number"
                            maxLength={255}
                            className="transition-all duration-200 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500 focus:ring-blue-500/20 focus:border-blue-500"
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
                            <Button
                                type="button"
                                variant="outline"
                                asChild
                                className="border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700"
                            >
                                <Link href="/drivers">Cancel</Link>
                            </Button>
                            <Button
                                type="submit"
                                disabled={processing || Object.keys(frontendErrors).length > 0}
                                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl transition-all duration-200 px-6 min-w-[140px]"
                            >
                                {processing ? (
                                    <>
                                        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-white" />
                                        Updating...
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle className="mr-2 h-4 w-4" />
                                        Update Driver
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

