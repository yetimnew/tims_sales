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
import { FormEventHandler, useEffect, useRef, useState } from 'react';
import { toast } from '@/hooks/use-toast';
import { validateDriver } from '@/lib/validation';
import { cn } from '@/lib/utils';
import { Globe, Info, User, MapPin, CheckCircle, Save, User as UserIcon, Hash, ArrowLeft, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { type BreadcrumbItem } from '@/types';
import { useTranslation } from 'react-i18next';
import { DRIVER_TRANSLATION_LOCALES, initializeDriverTranslations } from '@/lib/driver-translations';

interface Driver {
    id: number;
    user_id?: number | null;
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
    user?: {
        id: number;
        name: string;
        email: string;
    } | null;
}

interface AvailableUser {
    id: number;
    name: string;
    email: string;
}

interface DriversEditProps {
    driver: Driver;
    availableUsers?: AvailableUser[];
}

type DriverFormData = {
    user_id: string | null;
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
    name_translations: Record<string, string>;
};

type DriverFormField = keyof DriverFormData;

export default function DriversEdit({ driver, availableUsers = [] }: DriversEditProps) {
    const { t } = useTranslation();
    const driverDisplayName = driver.name || driver.driverid || t('drivers.form.edit.fallbackName');
    const breadcrumbs: BreadcrumbItem[] = [
        { title: t('drivers.breadcrumb'), href: '/drivers' },
        { title: driverDisplayName, href: `/drivers/${driver.id}` },
        { title: t('drivers.form.edit.breadcrumb'), href: `/drivers/${driver.id}/edit` },
    ];

    const { data, setData, put, processing, errors, clearErrors, transform } = useForm<DriverFormData>({
        user_id: driver.user_id?.toString() ?? null,
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
        name_translations: initializeDriverTranslations(driver.name_translations ?? null),
    });

    const [frontendErrors, setFrontendErrors] = useState<Record<string, string>>({});
    const [showScrollTop, setShowScrollTop] = useState(false);
    const scrollContainerRef = useRef<HTMLFormElement | null>(null);
    const [isDirty, setIsDirty] = useState(false);

    const validateField = (field: string, nextState: DriverFormData) => {
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
        const errorMessages = Object.entries(errors).map(([, message]) =>
            typeof message === 'string' ? message : String(message),
        );

        if (errorMessages.length > 0) {
            toast({
                title: t('drivers.form.validation.title'),
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

    const handleFieldChange = (field: DriverFormField, value: string | null) => {
        let nextValue: string | null = value;

        if (field === 'driverid') {
            nextValue = typeof value === 'string' ? value.toUpperCase().slice(0, 255) : null;
        } else if (field === 'mobile') {
            nextValue = typeof value === 'string' ? value.slice(0, 20) : null;
        } else if (field === 'user_id') {
            // user_id can be null or string - preserve null, convert __none__ to null
            nextValue = value === '__none__' ? null : value;
        }

        const nextState = { ...data, [field]: nextValue ?? '' } as DriverFormData;

        // For user_id, preserve null; for other fields, use empty string as fallback
        if (field === 'user_id') {
            setData(field, nextValue);
        } else {
            setData(field, nextValue ?? '');
        }
        clearErrors(field);
        if (field !== 'user_id') {
            validateField(field, nextState);
        }
        setIsDirty(true);
    };

    const handleTranslationChange = (locale: string, value: string) => {
        const nextValue = value.slice(0, 255);
        const nextTranslations = {
            ...data.name_translations,
            [locale]: nextValue,
        };

        setData('name_translations', nextTranslations);
        clearErrors(`name_translations.${locale}`);
        validateField(`name_translations.${locale}`, { ...data, name_translations: nextTranslations });
        setIsDirty(true);
    };

    const submit: FormEventHandler = (event) => {
        event.preventDefault();

        const allErrors = validateDriver(data);
        if (Object.keys(allErrors).length > 0) {
            setFrontendErrors(allErrors);
            toast({
                title: t('drivers.form.validation.title'),
                description: t('drivers.form.validation.fixErrors'),
                variant: 'destructive',
            });
            return;
        }

        // Transform data before submission - ensure user_id is null or valid number string
        transform((data) => ({
            ...data,
            user_id: data.user_id === null || data.user_id === '' || data.user_id === '__none__' ? null : data.user_id,
            name_translations: Object.fromEntries(
                Object.entries(data.name_translations ?? {})
                    .map(([locale, value]) => [locale, (value ?? '').trim()])
                    .filter(([, value]) => value !== ''),
            ),
        }));

        put(`/drivers/${driver.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                clearErrors();
                setFrontendErrors({});
                setIsDirty(false);
                toast({
                    title: t('drivers.form.edit.successTitle'),
                    description: t('drivers.form.edit.successDescription', { name: driverDisplayName }),
                });
            },
            onError: () => {
                transform((data) => data);
            },
            onFinish: () => {
                transform((data) => data);
            },
        });
    };

    const getFieldError = (fieldName: string): string =>
        (errors[fieldName] as string | undefined) || frontendErrors[fieldName] || '';

    return (
        <FormPageLayout
            title={t('drivers.form.edit.title')}
            description={t('drivers.form.edit.description', { name: driverDisplayName })}
            headTitle={t('drivers.form.edit.headTitle', { name: driverDisplayName })}
            breadcrumbs={breadcrumbs}
            icon={<UserIcon className="h-5 w-5" />}
            headerAside={
                <>
                    <Button variant="ghost" size="sm" asChild>
                        <Link href="/drivers">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            {t('drivers.form.edit.backToList')}
                        </Link>
                    </Button>
                    {isDirty && <UnsavedChangesBadge />}
                    <div className="flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1.5 text-sm font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                        <div className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
                        {t('drivers.form.badge')}
                    </div>
                </>
            }
        >
            {(Object.keys(errors).length > 0 || Object.keys(frontendErrors).length > 0) && (
                <div className="px-6 pt-6">
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{t('drivers.form.validation.resolve')}</AlertDescription>
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
                    title={t('drivers.form.sections.general.title')}
                    description={t('drivers.form.sections.general.description')}
                    icon={
                        <div className="rounded-lg bg-blue-100 p-2 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                            <Info className="h-4 w-4" />
                        </div>
                    }
                >
                    <FormField
                        id="driverid"
                        label={t('drivers.form.fields.driverId.label')}
                        required
                        tooltip={t('drivers.form.fields.driverId.tooltip')}
                        error={getFieldError('driverid')}
                    >
                        <div className="relative">
                            <Hash className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <Input
                                id="driverid"
                                type="text"
                                value={data.driverid}
                                onChange={(event) => handleFieldChange('driverid', event.target.value)}
                                placeholder={t('drivers.form.fields.driverId.placeholder')}
                                maxLength={255}
                                className={`pl-10 transition-all duration-200 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 ${getFieldError('driverid') ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : 'focus:ring-blue-500/20 focus:border-blue-500 hover:border-slate-400 dark:hover:border-slate-500'}`}
                            />
                        </div>
                    </FormField>
                    <FormField id="name" label={t('drivers.form.fields.name.label')} required error={getFieldError('name')}>
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <Input
                                id="name"
                                type="text"
                                value={data.name}
                                onChange={(event) => handleFieldChange('name', event.target.value)}
                                placeholder={t('drivers.form.fields.name.placeholder')}
                                maxLength={255}
                                className={`pl-10 transition-all duration-200 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 ${getFieldError('name') ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : 'focus:ring-blue-500/20 focus:border-blue-500 hover:border-slate-400 dark:hover:border-slate-500'}`}
                            />
                        </div>
                    </FormField>
                    <FormField id="sex" label={t('drivers.form.fields.gender.label')} required error={getFieldError('sex')}>
                        <Select value={data.sex} onValueChange={(value) => handleFieldChange('sex', value)}>
                            <SelectTrigger className={`transition-all duration-200 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500 focus:ring-blue-500/20 focus:border-blue-500 ${getFieldError('sex') ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}`}>
                                <SelectValue placeholder={t('drivers.form.fields.gender.placeholder')} />
                            </SelectTrigger>
                            <SelectContent className="z-50 bg-white shadow-lg dark:bg-slate-800">
                                <SelectItem value="male" className="hover:bg-slate-100 focus:bg-slate-100 dark:hover:bg-slate-700 dark:focus:bg-slate-700">
                                    {t('drivers.gender.male')}
                                </SelectItem>
                                <SelectItem value="female" className="hover:bg-slate-100 focus:bg-slate-100 dark:hover:bg-slate-700 dark:focus:bg-slate-700">
                                    {t('drivers.gender.female')}
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </FormField>
                    <FormField id="status" label={t('drivers.form.fields.status.label')} required error={getFieldError('status')}>
                        <Select value={data.status} onValueChange={(value) => handleFieldChange('status', value)}>
                            <SelectTrigger className={`transition-all duration-200 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500 focus:ring-blue-500/20 focus:border-blue-500 ${getFieldError('status') ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}`}>
                                <SelectValue placeholder={t('drivers.form.fields.status.placeholder')} />
                            </SelectTrigger>
                            <SelectContent className="z-50 bg-white shadow-lg dark:bg-slate-800">
                                <SelectItem value="active" className="hover:bg-slate-100 focus:bg-slate-100 dark:hover:bg-slate-700 dark:focus:bg-slate-700">
                                    {t('drivers.status.active')}
                                </SelectItem>
                                <SelectItem value="inactive" className="hover:bg-slate-100 focus:bg-slate-100 dark:hover:bg-slate-700 dark:focus:bg-slate-700">
                                    {t('drivers.status.inactive')}
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </FormField>
                    {availableUsers.length > 0 && (
                        <FormField
                            id="user_id"
                            label="Link User Account"
                            tooltip="Select a user account to link to this driver. This allows the user to access the mobile app as a driver."
                            error={getFieldError('user_id')}
                        >
                            <Select
                                value={data.user_id?.toString() || '__none__'}
                                onValueChange={(value) => handleFieldChange('user_id', value === '__none__' ? null : value)}
                            >
                                <SelectTrigger className={`transition-all duration-200 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500 focus:ring-blue-500/20 focus:border-blue-500 ${getFieldError('user_id') ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}`}>
                                    <SelectValue placeholder="Select a user (optional)" />
                                </SelectTrigger>
                                <SelectContent className="z-50 bg-white shadow-lg dark:bg-slate-800">
                                    <SelectItem value="__none__" className="hover:bg-slate-100 focus:bg-slate-100 dark:hover:bg-slate-700 dark:focus:bg-slate-700">
                                        None (No user linked)
                                    </SelectItem>
                                    {availableUsers.map((user) => (
                                        <SelectItem
                                            key={user.id}
                                            value={user.id.toString()}
                                            className="hover:bg-slate-100 focus:bg-slate-100 dark:hover:bg-slate-700 dark:focus:bg-slate-700"
                                        >
                                            {user.name} ({user.email})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </FormField>
                    )}
                </FormSection>

                {DRIVER_TRANSLATION_LOCALES.length > 0 && (
                    <FormSection
                        title={t('drivers.form.sections.translations.title')}
                        description={t('drivers.form.sections.translations.description')}
                        icon={
                            <div className="rounded-lg bg-sky-100 p-2 text-sky-600 dark:bg-sky-900/30 dark:text-sky-400">
                                <Globe className="h-4 w-4" />
                            </div>
                        }
                    >
                        <FormField
                            id="name_translations"
                            label={t('drivers.form.fields.nameTranslations.label')}
                            helperText={t('drivers.form.fields.nameTranslations.helper')}
                        >
                            <div className="grid gap-4 md:grid-cols-2">
                                {DRIVER_TRANSLATION_LOCALES.map((locale) => {
                                    const localeError = getFieldError(`name_translations.${locale.code}`);

                                    return (
                                        <div key={locale.code} className="space-y-1">
                                            <div className="flex items-center justify-between text-sm font-medium text-slate-600 dark:text-slate-300">
                                                <span>
                                                    {t('drivers.form.fields.nameTranslations.localeLabel', {
                                                        language: t(locale.labelKey),
                                                    })}
                                                </span>
                                                <span className="text-xs font-semibold uppercase text-slate-400">{locale.code}</span>
                                            </div>
                                            <Input
                                                id={`name_translations_${locale.code}`}
                                                type="text"
                                                value={data.name_translations[locale.code] ?? ''}
                                                onChange={(event) => handleTranslationChange(locale.code, event.target.value)}
                                                placeholder={t('drivers.form.fields.nameTranslations.placeholder', {
                                                    language: t(locale.labelKey),
                                                })}
                                                maxLength={255}
                                                className={`transition-all duration-200 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 ${
                                                    localeError
                                                        ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
                                                        : 'hover:border-slate-400 dark:hover:border-slate-500 focus:border-blue-500 focus:ring-blue-500/20'
                                                }`}
                                            />
                                            {localeError && <p className="text-xs font-medium text-rose-600">{localeError}</p>}
                                        </div>
                                    );
                                })}
                            </div>
                        </FormField>
                    </FormSection>
                )}

                <FormSection
                    title={t('drivers.form.sections.personal.title')}
                    description={t('drivers.form.sections.personal.description')}
                    icon={
                        <div className="rounded-lg bg-amber-100 p-2 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
                            <User className="h-4 w-4" />
                        </div>
                    }
                    contentClassName="grid-cols-1 gap-4 md:grid-cols-2"
                >
                    <FormField id="birthdate" label={t('drivers.form.fields.birthdate.label')} error={getFieldError('birthdate')}>
                        <DatePicker
                            value={data.birthdate || ''}
                            onChange={(next) => handleFieldChange('birthdate', next ?? '')}
                            className={cn(
                                'w-full justify-start text-left h-11 border-slate-300 hover:border-slate-400 focus-visible:border-blue-500 focus-visible:ring-blue-500/20 dark:border-slate-600 dark:hover:border-slate-500',
                                getFieldError('birthdate') ? 'border-red-500 focus-visible:border-red-500 focus-visible:ring-red-500/20' : undefined,
                            )}
                        />
                    </FormField>
                    <FormField id="hireddate" label={t('drivers.form.fields.hireddate.label')} error={getFieldError('hireddate')}>
                        <DatePicker
                            value={data.hireddate || ''}
                            onChange={(next) => handleFieldChange('hireddate', next ?? '')}
                            className={cn(
                                'w-full justify-start text-left h-11 border-slate-300 hover:border-slate-400 focus-visible:border-blue-500 focus-visible:ring-blue-500/20 dark:border-slate-600 dark:hover:border-slate-500',
                                getFieldError('hireddate') ? 'border-red-500 focus-visible:border-red-500 focus-visible:ring-red-500/20' : undefined,
                            )}
                        />
                    </FormField>
                </FormSection>

                <FormSection
                    title={t('drivers.form.sections.contact.title')}
                    description={t('drivers.form.sections.contact.description')}
                    icon={
                        <div className="rounded-lg bg-emerald-100 p-2 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
                            <MapPin className="h-4 w-4" />
                        </div>
                    }
                    contentClassName="grid-cols-1 gap-4 md:grid-cols-2"
                >
                    <FormField id="mobile" label={t('drivers.form.fields.mobile.label')} error={getFieldError('mobile')}>
                        <Input
                            id="mobile"
                            type="tel"
                            value={data.mobile}
                            onChange={(event) => handleFieldChange('mobile', event.target.value)}
                            placeholder={t('drivers.form.fields.mobile.placeholder')}
                            maxLength={20}
                            className={`transition-all duration-200 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 ${getFieldError('mobile') ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : 'focus:ring-blue-500/20 focus:border-blue-500 hover:border-slate-400 dark:hover:border-slate-500'}`}
                        />
                    </FormField>
                    <FormField
                        id="zone"
                        label={t('drivers.form.fields.zone.label')}
                        helperText={t('drivers.form.fields.zone.helper')}
                        error={getFieldError('zone')}
                    >
                        <Input
                            id="zone"
                            type="text"
                            value={data.zone}
                            onChange={(event) => handleFieldChange('zone', event.target.value)}
                            placeholder={t('drivers.form.fields.zone.placeholder')}
                            maxLength={255}
                            className="transition-all duration-200 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500 focus:ring-blue-500/20 focus:border-blue-500"
                        />
                    </FormField>
                    <FormField
                        id="woreda"
                        label={t('drivers.form.fields.woreda.label')}
                        helperText={t('drivers.form.fields.woreda.helper')}
                        error={getFieldError('woreda')}
                    >
                        <Input
                            id="woreda"
                            type="text"
                            value={data.woreda}
                            onChange={(event) => handleFieldChange('woreda', event.target.value)}
                            placeholder={t('drivers.form.fields.woreda.placeholder')}
                            maxLength={255}
                            className="transition-all duration-200 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500 focus:ring-blue-500/20 focus:border-blue-500"
                        />
                    </FormField>
                    <FormField
                        id="kebele"
                        label={t('drivers.form.fields.kebele.label')}
                        helperText={t('drivers.form.fields.kebele.helper')}
                        error={getFieldError('kebele')}
                    >
                        <Input
                            id="kebele"
                            type="text"
                            value={data.kebele}
                            onChange={(event) => handleFieldChange('kebele', event.target.value)}
                            placeholder={t('drivers.form.fields.kebele.placeholder')}
                            maxLength={255}
                            className="transition-all duration-200 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500 focus:ring-blue-500/20 focus:border-blue-500"
                        />
                    </FormField>
                    <FormField
                        id="housenumber"
                        label={t('drivers.form.fields.housenumber.label')}
                        helperText={t('drivers.form.fields.housenumber.helper')}
                        error={getFieldError('housenumber')}
                    >
                        <Input
                            id="housenumber"
                            type="text"
                            value={data.housenumber}
                            onChange={(event) => handleFieldChange('housenumber', event.target.value)}
                            placeholder={t('drivers.form.fields.housenumber.placeholder')}
                            maxLength={255}
                            className="transition-all duration-200 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500 focus:ring-blue-500/20 focus:border-blue-500"
                        />
                    </FormField>
                </FormSection>

                <FormActionsBar
                    left={
                        <>
                            <span className="text-red-500">*</span>
                            <span>{t('drivers.form.required')}</span>
                            {isDirty && (
                                <span className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                                    <Save className="h-3 w-3" />
                                    {t('drivers.form.unsaved')}
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
                                <Link href="/drivers">{t('drivers.actions.cancel')}</Link>
                            </Button>
                            <Button
                                type="submit"
                                disabled={processing || Object.keys(frontendErrors).length > 0}
                                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl transition-all duration-200 px-6 min-w-[140px]"
                            >
                                {processing ? (
                                    <>
                                        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-white" />
                                        {t('drivers.form.edit.submitting')}
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle className="mr-2 h-4 w-4" />
                                        {t('drivers.form.edit.submit')}
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
