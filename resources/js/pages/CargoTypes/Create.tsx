import { FormActionsBar } from '@/components/forms/form-actions-bar';
import { FormField } from '@/components/forms/form-field';
import { FormPageLayout } from '@/components/forms/form-page-layout';
import { FormSection } from '@/components/forms/form-section';
import { ScrollToTopFab } from '@/components/forms/scroll-to-top-fab';
import { UnsavedChangesBadge } from '@/components/forms/unsaved-changes-badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { validateCargoType } from '@/lib/validation';
import { type BreadcrumbItem } from '@/types';
import { Link, useForm } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import { useEffect, useMemo, useRef, useState, type FormEventHandler } from 'react';
import {
    AlertTriangle,
    Boxes,
    ClipboardCheck,
    MapPin,
    Package,
    ShieldCheck,
} from 'lucide-react';

interface CargoTypeCreateProps {
    categories: Array<{ value: string; label: string }>;
}

type CargoTypeFormData = {
    name: string;
    category: string;
    weight_per_cubic_meter: string;
    handling_requirements: string;
    safety_requirements: string;
    requires_special_equipment: boolean;
};

type CargoTypeFormField = keyof CargoTypeFormData;

type FieldErrorMap = Partial<Record<CargoTypeFormField, string>>;

export default function CargoTypesCreate({ categories }: CargoTypeCreateProps) {
    const { t } = useTranslation();
    const defaultCategory = categories[0]?.value ?? '';
    const breadcrumbs: BreadcrumbItem[] = [
        { title: t('cargoTypes.breadcrumb'), href: '/cargo-types' },
        { title: t('cargoTypes.form.create.breadcrumb'), href: '/cargo-types/create' },
    ];
    const customValidationMessage = (field: CargoTypeFormField, value: string | boolean): string => {
        if (field === 'handling_requirements' || field === 'safety_requirements') {
            if (typeof value === 'string' && value.length > 2000) {
                return t('cargoTypes.form.validation.maxLength');
            }
        }

        return '';
    };

    const { data, setData, post, processing, errors, clearErrors, reset } = useForm<CargoTypeFormData>({
        name: '',
        category: defaultCategory,
        weight_per_cubic_meter: '',
        handling_requirements: '',
        safety_requirements: '',
        requires_special_equipment: false,
    });

    const [frontendErrors, setFrontendErrors] = useState<FieldErrorMap>({});
    const [isDirty, setIsDirty] = useState(false);
    const [showScrollTop, setShowScrollTop] = useState(false);
    const formRef = useRef<HTMLFormElement | null>(null);

    useEffect(() => {
        const container = formRef.current;
        if (!container) {
            return;
        }

        const handleScroll = () => setShowScrollTop(container.scrollTop > 240);
        handleScroll();
        container.addEventListener('scroll', handleScroll);
        return () => container.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        if (!data.category && defaultCategory) {
            setData('category', defaultCategory);
        }
    }, [defaultCategory, data.category, setData]);

    const backendErrors = useMemo(
        () =>
            Object.entries(errors).reduce<FieldErrorMap>((acc, [key, value]) => {
                const message = typeof value === 'string' ? value : value ? String(value) : '';
                if (message) {
                    acc[key as CargoTypeFormField] = message;
                }
                return acc;
            }, {}),
        [errors],
    );

    const fieldErrors = useMemo(
        () => ({
            ...frontendErrors,
            ...backendErrors,
        }),
        [frontendErrors, backendErrors],
    );

    const densityInsight = useMemo(() => {
        const value = Number.parseFloat(data.weight_per_cubic_meter);
        if (!Number.isFinite(value) || value <= 0) {
            return null;
        }

        if (value >= 1200) {
            return { label: t('cargoTypes.form.density.heavy'), tone: 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900' };
        }
        if (value >= 600) {
            return { label: t('cargoTypes.form.density.medium'), tone: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-200' };
        }
        return { label: t('cargoTypes.form.density.light'), tone: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' };
    }, [data.weight_per_cubic_meter, t]);

    const handleScrollToTop = () => {
        formRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const validateField = (field: CargoTypeFormField, value: string | boolean) => {
        const result = validateCargoType({ ...data, [field]: value });
        const message = (result as FieldErrorMap)[field] ?? customValidationMessage(field, value);

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

    const handleFieldChange = (field: CargoTypeFormField, value: string, options?: { validate?: boolean }) => {
        setData(field, value);
        clearErrors(field);

        if (options?.validate ?? true) {
            validateField(field, value);
        } else {
            setFrontendErrors((prev) => {
                const next = { ...prev };
                delete next[field];
                return next;
            });
        }

        setIsDirty(true);
    };

    const handleCheckboxChange = (checked: boolean | 'indeterminate') => {
        const value = Boolean(checked);
        setData('requires_special_equipment', value);
        clearErrors('requires_special_equipment');
        validateField('requires_special_equipment', value);
        setIsDirty(true);
    };

    const handleSubmit: FormEventHandler<HTMLFormElement> = (event) => {
        event.preventDefault();

        const validationResult = validateCargoType(data) as FieldErrorMap;
        const customResults = (['handling_requirements', 'safety_requirements'] as const).reduce<FieldErrorMap>((acc, key) => {
            const message = customValidationMessage(key, data[key]);
            if (message) {
                acc[key] = message;
            }
            return acc;
        }, {});

        const combinedErrors: FieldErrorMap = { ...validationResult, ...customResults };

        if (Object.values(combinedErrors).some(Boolean)) {
            setFrontendErrors(combinedErrors);
            return;
        }

        post('/cargo-types', {
            preserveScroll: true,
            onSuccess: () => {
                setFrontendErrors({});
                setIsDirty(false);
                clearErrors();
                reset();
                formRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
            },
            onError: (pageErrors) => {
                setFrontendErrors((prev) => ({ ...prev, ...(pageErrors as FieldErrorMap) }));
            },
        });
    };

    const getFieldError = (field: CargoTypeFormField): string => fieldErrors[field] ?? '';
    const hasErrors = Object.values(fieldErrors).some(Boolean);
    const hasCategories = categories.length > 0;

    return (
        <FormPageLayout
            title={t('cargoTypes.form.create.title')}
            headTitle={t('cargoTypes.form.create.headTitle')}
            description={t('cargoTypes.form.create.description')}
            breadcrumbs={breadcrumbs}
            icon={<Package className="h-5 w-5" />}
            headerAside={
                <>
                    <Button variant="ghost" size="sm" asChild>
                        <Link href="/cargo-types">{t('cargoTypes.form.create.backToList')}</Link>
                    </Button>
                    {isDirty && <UnsavedChangesBadge />}
                    <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                        {t('cargoTypes.form.badge')}
                    </Badge>
                </>
            }
        >
            {hasErrors && (
                <div className="px-6 pt-6">
                    <Alert variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>{t('cargoTypes.form.validation.resolve')}</AlertDescription>
                    </Alert>
                </div>
            )}

            <form
                ref={formRef}
                onSubmit={handleSubmit}
                className="flex flex-1 flex-col gap-8 overflow-y-auto p-6 pb-24"
                style={{ minHeight: 0 }}
            >
                <FormSection
                    title={t('cargoTypes.form.sections.overview.title')}
                    description={t('cargoTypes.form.sections.overview.description')}
                    icon={
                        <div className="rounded-lg bg-rose-100 p-2 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300">
                            <Boxes className="h-4 w-4" />
                        </div>
                    }
                    contentClassName="gap-6 md:grid-cols-2"
                >
                    <FormField
                        id="name"
                        label={t('cargoTypes.form.fields.name.label')}
                        required
                        helperText={t('cargoTypes.form.fields.name.helper')}
                        error={getFieldError('name')}
                    >
                        <Input
                            id="name"
                            name="name"
                            value={data.name}
                            onChange={(event) => handleFieldChange('name', event.target.value)}
                            placeholder={t('cargoTypes.form.fields.name.placeholder')}
                            maxLength={255}
                            className={`border-slate-300 focus:border-rose-500 focus:ring-rose-500/20 dark:border-slate-700 dark:focus:border-rose-400 ${getFieldError('name') ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20 dark:border-red-500' : ''}`}
                        />
                    </FormField>

                    <FormField
                        id="category"
                        label={t('cargoTypes.form.fields.category.label')}
                        required
                        helperText={
                            hasCategories
                                ? t('cargoTypes.form.fields.category.helper')
                                : t('cargoTypes.form.fields.category.noCategories')
                        }
                        error={getFieldError('category')}
                    >
                        <Select
                            value={data.category}
                            onValueChange={(value) => handleFieldChange('category', value)}
                            disabled={!hasCategories}
                        >
                            <SelectTrigger
                                id="category"
                                className={`border-slate-300 focus:border-rose-500 focus:ring-rose-500/20 dark:border-slate-700 dark:focus:border-rose-400 ${getFieldError('category') ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20 dark:border-red-500' : ''}`}
                            >
                                <SelectValue placeholder={t('cargoTypes.form.fields.category.placeholder')} />
                            </SelectTrigger>
                            <SelectContent className="max-h-60">
                                {categories.map((option) => (
                                    <SelectItem key={option.value} value={option.value}>
                                        {option.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </FormField>

                    <FormField
                        id="requires_special_equipment"
                        label={t('cargoTypes.form.fields.specialEquipment.label')}
                        helperText={t('cargoTypes.form.fields.specialEquipment.helper')}
                        error={getFieldError('requires_special_equipment')}
                        className="md:col-span-2"
                    >
                        <div className="flex flex-col gap-4 rounded-lg border border-dashed border-rose-300/60 bg-rose-50/70 p-4 dark:border-rose-500/40 dark:bg-rose-500/10 md:flex-row md:items-center md:justify-between">
                            <div className="flex items-start gap-3">
                                <div className="rounded-full bg-white/90 p-2 text-rose-600 shadow-sm dark:bg-white/10 dark:text-rose-300">
                                    <Package className="h-4 w-4" />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-rose-700 dark:text-rose-200">
                                        {t('cargoTypes.form.specialHandling.title')}
                                    </p>
                                    <p className="text-xs text-rose-700/80 dark:text-rose-200/80">
                                        {t('cargoTypes.form.specialHandling.description')}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <Checkbox
                                    id="requires_special_equipment"
                                    checked={data.requires_special_equipment}
                                    onCheckedChange={handleCheckboxChange}
                                    className="border-slate-300 text-rose-600 focus-visible:ring-rose-500 dark:border-slate-600"
                                />
                                <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                                    {t('cargoTypes.form.specialHandling.label')}
                                </span>
                                <Badge variant="secondary" className={`border-0 ${data.requires_special_equipment ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-200' : 'bg-slate-100 text-slate-600 dark:bg-slate-800/60 dark:text-slate-300'}`}>
                                    {data.requires_special_equipment
                                        ? t('cargoTypes.form.specialHandling.flagged')
                                        : t('cargoTypes.form.specialHandling.standard')}
                                </Badge>
                            </div>
                        </div>
                    </FormField>
                </FormSection>

                <FormSection
                    title={t('cargoTypes.form.sections.specifications.title')}
                    description={t('cargoTypes.form.sections.specifications.description')}
                    icon={
                        <div className="rounded-lg bg-blue-100 p-2 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300">
                            <ClipboardCheck className="h-4 w-4" />
                        </div>
                    }
                    contentClassName="gap-6 md:grid-cols-2"
                >
                    <FormField
                        id="weight_per_cubic_meter"
                        label={t('cargoTypes.form.fields.weight.label')}
                        helperText={t('cargoTypes.form.fields.weight.helper')}
                        error={getFieldError('weight_per_cubic_meter')}
                    >
                        <Input
                            id="weight_per_cubic_meter"
                            name="weight_per_cubic_meter"
                            type="number"
                            inputMode="decimal"
                            step="0.01"
                            value={data.weight_per_cubic_meter}
                            onChange={(event) => handleFieldChange('weight_per_cubic_meter', event.target.value)}
                            placeholder={t('cargoTypes.form.fields.weight.placeholder')}
                            className={`border-slate-300 focus:border-rose-500 focus:ring-rose-500/20 dark:border-slate-700 dark:focus:border-rose-400 ${getFieldError('weight_per_cubic_meter') ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20 dark:border-red-500' : ''}`}
                        />
                    </FormField>

                    <FormField
                        id="density_insight"
                        label={t('cargoTypes.form.fields.density.label')}
                        helperText={t('cargoTypes.form.fields.density.helper')}
                        className="md:col-span-1"
                    >
                        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-300">
                            {densityInsight ? (
                                <Badge className={`mb-2 inline-flex items-center gap-2 border-0 px-3 py-1.5 text-sm font-medium ${densityInsight.tone}`}>
                                    <ShieldCheck className="h-3.5 w-3.5" />
                                    {densityInsight.label}
                                </Badge>
                            ) : (
                                <Badge variant="secondary" className="mb-2 border-0 bg-slate-100 text-slate-600 dark:bg-slate-800/60 dark:text-slate-300">
                                    {t('cargoTypes.form.density.awaiting')}
                                </Badge>
                            )}
                            <p className="text-xs text-muted-foreground">
                                {t('cargoTypes.form.density.note')}
                            </p>
                        </div>
                    </FormField>
                </FormSection>

                <FormSection
                    title={t('cargoTypes.form.sections.handling.title')}
                    description={t('cargoTypes.form.sections.handling.description')}
                    icon={
                        <div className="rounded-lg bg-slate-100 p-2 text-slate-600 dark:bg-slate-800/60 dark:text-slate-200">
                            <MapPin className="h-4 w-4" />
                        </div>
                    }
                    contentClassName="gap-6"
                >
                    <FormField
                        id="handling_requirements"
                        label={t('cargoTypes.form.fields.handling.label')}
                        helperText={t('cargoTypes.form.fields.handling.helper')}
                        error={getFieldError('handling_requirements')}
                    >
                        <Textarea
                            id="handling_requirements"
                            name="handling_requirements"
                            value={data.handling_requirements}
                            onChange={(event) => handleFieldChange('handling_requirements', event.target.value, { validate: false })}
                            onBlur={() => validateField('handling_requirements', data.handling_requirements)}
                            rows={4}
                            maxLength={2000}
                            className={`resize-y border-slate-300 focus:border-rose-500 focus:ring-rose-500/20 dark:border-slate-700 dark:focus:border-rose-400 ${getFieldError('handling_requirements') ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20 dark:border-red-500' : ''}`}
                            placeholder={t('cargoTypes.form.fields.handling.placeholder')}
                        />
                    </FormField>

                    <FormField
                        id="safety_requirements"
                        label={t('cargoTypes.form.fields.safety.label')}
                        helperText={t('cargoTypes.form.fields.safety.helper')}
                        error={getFieldError('safety_requirements')}
                    >
                        <Textarea
                            id="safety_requirements"
                            name="safety_requirements"
                            value={data.safety_requirements}
                            onChange={(event) => handleFieldChange('safety_requirements', event.target.value, { validate: false })}
                            onBlur={() => validateField('safety_requirements', data.safety_requirements)}
                            rows={4}
                            maxLength={2000}
                            className={`resize-y border-slate-300 focus:border-rose-500 focus:ring-rose-500/20 dark:border-slate-700 dark:focus:border-rose-400 ${getFieldError('safety_requirements') ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20 dark:border-red-500' : ''}`}
                            placeholder={t('cargoTypes.form.fields.safety.placeholder')}
                        />
                    </FormField>
                </FormSection>

                <FormActionsBar
                    left={
                        <>
                            <span className="flex items-center gap-2 text-sm">
                                <span className="text-red-500">*</span>
                                {t('cargoTypes.form.required')}
                            </span>
                            <span className="flex items-center gap-2 text-xs text-muted-foreground">
                                <ClipboardCheck className="h-3 w-3" />
                                {t('cargoTypes.form.helperNote')}
                            </span>
                        </>
                    }
                    right={
                        <>
                            <Button type="button" variant="outline" asChild className="border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800">
                                <Link href="/cargo-types">{t('cargoTypes.actions.cancel')}</Link>
                            </Button>
                            <Button
                                type="submit"
                                disabled={processing || hasErrors}
                                className="min-w-[180px] bg-gradient-to-r from-rose-600 to-rose-700 text-white shadow-lg transition hover:from-rose-700 hover:to-rose-800"
                            >
                                {processing ? t('cargoTypes.form.create.submitting') : t('cargoTypes.form.create.submit')}
                            </Button>
                        </>
                    }
                />
            </form>
            <ScrollToTopFab visible={showScrollTop} onClick={handleScrollToTop} />
        </FormPageLayout>
    );
}
