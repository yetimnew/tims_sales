import { FormActionsBar } from '@/components/forms/form-actions-bar';
import { FormField } from '@/components/forms/form-field';
import { FormPageLayout } from '@/components/forms/form-page-layout';
import { FormSection } from '@/components/forms/form-section';
import { ScrollToTopFab } from '@/components/forms/scroll-to-top-fab';
import { UnsavedChangesBadge } from '@/components/forms/unsaved-changes-badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { validateCargoType } from '@/lib/validation';
import { type BreadcrumbItem } from '@/types';
import { Link, useForm } from '@inertiajs/react';
import { useEffect, useMemo, useRef, useState, type FormEventHandler } from 'react';
import { AlertTriangle, Boxes, ClipboardCheck, Package, Shield, ShieldCheck, SquarePen } from 'lucide-react';

interface CargoCategoryOption {
    value: string;
    label: string;
}

interface CargoTypesEditProps {
    cargoType: {
        id: number;
        name: string;
        category: string | null;
        weight_per_cubic_meter?: number | null;
        handling_requirements?: string | null;
        safety_requirements?: string | null;
        requires_special_equipment: boolean;
    };
    categories: CargoCategoryOption[];
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

const breadcrumbs = (cargoType: CargoTypesEditProps['cargoType']): BreadcrumbItem[] => [
    { title: 'Cargo Types', href: '/cargo-types' },
    { title: cargoType.name, href: `/cargo-types/${cargoType.id}` },
    { title: 'Edit', href: `/cargo-types/${cargoType.id}/edit` },
];

const customValidationMessage = (field: CargoTypeFormField, value: string | boolean): string => {
    if ((field === 'handling_requirements' || field === 'safety_requirements') && typeof value === 'string' && value.length > 2000) {
        return 'Details cannot exceed 2,000 characters.';
    }

    return '';
};

export default function CargoTypesEdit({ cargoType, categories }: CargoTypesEditProps) {
    const categoryOptions = useMemo<CargoCategoryOption[]>(() => {
        if (!cargoType.category) {
            return categories;
        }

        if (categories.some((option) => option.value === cargoType.category)) {
            return categories;
        }

        return [
            {
                value: cargoType.category,
                label: cargoType.category,
            },
            ...categories,
        ];
    }, [cargoType.category, categories]);

    const initialValues = useMemo<CargoTypeFormData>(
        () => ({
            name: cargoType.name ?? '',
            category: cargoType.category ?? categoryOptions[0]?.value ?? '',
            weight_per_cubic_meter:
                cargoType.weight_per_cubic_meter !== null && cargoType.weight_per_cubic_meter !== undefined
                    ? String(cargoType.weight_per_cubic_meter)
                    : '',
            handling_requirements: cargoType.handling_requirements ?? '',
            safety_requirements: cargoType.safety_requirements ?? '',
            requires_special_equipment: Boolean(cargoType.requires_special_equipment),
        }),
        [cargoType, categoryOptions],
    );

    const initialValuesRef = useRef<CargoTypeFormData>(initialValues);
    const formRef = useRef<HTMLFormElement | null>(null);
    const { data, setData, put, processing, errors, clearErrors } = useForm<CargoTypeFormData>(initialValues);
    const [frontendErrors, setFrontendErrors] = useState<FieldErrorMap>({});
    const [isDirty, setIsDirty] = useState(false);
    const [showScrollTop, setShowScrollTop] = useState(false);

    useEffect(() => {
        setData(initialValues);
        initialValuesRef.current = initialValues;
        setFrontendErrors({});
        setIsDirty(false);
        clearErrors();
    }, [initialValues, setData, clearErrors]);

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
        if (!data.category && categoryOptions[0]) {
            setData('category', categoryOptions[0].value);
        }
    }, [data.category, categoryOptions, setData]);

    const backendErrors = useMemo<FieldErrorMap>(() => {
        const typedErrors = errors as Partial<Record<CargoTypeFormField, string | string[] | null | undefined>>;

        return Object.entries(typedErrors).reduce<FieldErrorMap>((acc, [field, value]) => {
            if (!value) {
                return acc;
            }

            const message = Array.isArray(value)
                ? value.filter((entry): entry is string => typeof entry === 'string' && entry.trim().length > 0).join(', ')
                : value;

            if (message) {
                acc[field as CargoTypeFormField] = message;
            }

            return acc;
        }, {});
    }, [errors]);

    const fieldErrors = useMemo<FieldErrorMap>(
        () => ({
            ...backendErrors,
            ...frontendErrors,
        }),
        [backendErrors, frontendErrors],
    );

    const hasErrors = useMemo(() => Object.values(fieldErrors).some(Boolean), [fieldErrors]);
    const hasCategories = categoryOptions.length > 0;

    const computeDirtyState = (nextData: CargoTypeFormData): boolean =>
        JSON.stringify(nextData) !== JSON.stringify(initialValuesRef.current);

    const getFieldError = (field: CargoTypeFormField): string => fieldErrors[field] ?? '';

    const densityInsight = useMemo(() => {
        const value = Number.parseFloat(data.weight_per_cubic_meter);
        if (!Number.isFinite(value) || value <= 0) {
            return null;
        }

        if (value >= 1200) {
            return { label: 'Heavy Density', tone: 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900' };
        }

        if (value >= 600) {
            return { label: 'Medium Density', tone: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-200' };
        }

        return { label: 'Light Density', tone: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' };
    }, [data.weight_per_cubic_meter]);

    const handleScrollToTop = () => {
        formRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const validateField = (field: CargoTypeFormField, value: string | boolean) => {
        const validationResult = validateCargoType({ ...data, [field]: value }) as FieldErrorMap;
        const message = validationResult[field] ?? customValidationMessage(field, value);

        setFrontendErrors((previous) => {
            const next = { ...previous };
            if (message) {
                next[field] = message;
            } else {
                delete next[field];
            }
            return next;
        });
    };

    const handleFieldChange = (field: CargoTypeFormField, value: string, options?: { validate?: boolean }) => {
        const nextData = { ...data, [field]: value };
        setData(field, value);
        clearErrors(field);

        if (options?.validate ?? true) {
            validateField(field, value);
        } else {
            setFrontendErrors((previous) => {
                const next = { ...previous };
                delete next[field];
                return next;
            });
        }

        setIsDirty(computeDirtyState(nextData));
    };

    const handleCheckboxChange = (checked: boolean | 'indeterminate') => {
        const value = Boolean(checked);
        const nextData = { ...data, requires_special_equipment: value };
        setData('requires_special_equipment', value);
        clearErrors('requires_special_equipment');
        validateField('requires_special_equipment', value);
        setIsDirty(computeDirtyState(nextData));
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

        put(`/cargo-types/${cargoType.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                initialValuesRef.current = { ...data };
                setFrontendErrors({});
                setIsDirty(false);
            },
            onError: (pageErrors) => {
                setFrontendErrors((previous) => ({ ...previous, ...(pageErrors as FieldErrorMap) }));
            },
        });
    };

    return (
        <FormPageLayout
            title="Update Cargo Type"
            headTitle={`Edit Cargo Type: ${cargoType.name}`}
            description="Keep cargo classifications aligned with the latest handling procedures and compliance guidance."
            breadcrumbs={breadcrumbs(cargoType)}
            icon={<SquarePen className="h-5 w-5" />}
            headerAside={
                <>
                    <Button variant="ghost" size="sm" asChild>
                        <Link href={`/cargo-types/${cargoType.id}`}>Back to Details</Link>
                    </Button>
                    {isDirty && <UnsavedChangesBadge />}
                    <Badge
                        className={`border-0 ${
                            data.requires_special_equipment
                                ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-200'
                                : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                        }`}
                    >
                        {data.requires_special_equipment ? 'Special Handling' : 'Standard Handling'}
                    </Badge>
                </>
            }
        >
            {hasErrors && (
                <div className="px-6 pt-6">
                    <Alert variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>Please resolve the highlighted fields before submitting the form.</AlertDescription>
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
                    title="Cargo Overview"
                    description="Ensure naming and category assignments reflect the latest operating context."
                    icon={
                        <div className="rounded-lg bg-rose-100 p-2 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300">
                            <Boxes className="h-4 w-4" />
                        </div>
                    }
                    contentClassName="gap-6 md:grid-cols-2"
                >
                    <FormField id="name" label="Cargo Name" required helperText="Maximum 255 characters." error={getFieldError('name')}>
                        <Input
                            id="name"
                            name="name"
                            value={data.name}
                            onChange={(event) => handleFieldChange('name', event.target.value)}
                            maxLength={255}
                            placeholder="e.g. Bagged Cement"
                            className={`border-slate-300 focus:border-rose-500 focus:ring-rose-500/20 dark:border-slate-700 dark:focus:border-rose-400 ${
                                getFieldError('name') ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20 dark:border-red-500' : ''
                            }`}
                        />
                    </FormField>

                    <FormField
                        id="category"
                        label="Category"
                        required
                        helperText={
                            hasCategories
                                ? 'Choose the category that best fits this cargo.'
                                : 'No categories available. Please add one in the admin panel.'
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
                                className={`border-slate-300 focus:border-rose-500 focus:ring-rose-500/20 dark:border-slate-700 dark:focus:border-rose-400 ${
                                    getFieldError('category')
                                        ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20 dark:border-red-500'
                                        : ''
                                }`}
                            >
                                <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                            <SelectContent className="max-h-60">
                                {categoryOptions.map((option) => (
                                    <SelectItem key={option.value} value={option.value}>
                                        {option.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </FormField>

                    <FormField
                        id="requires_special_equipment"
                        label="Special Equipment"
                        helperText="Flag cargos that need forklifts, refrigeration, or dedicated containment."
                        error={getFieldError('requires_special_equipment')}
                        className="md:col-span-2"
                    >
                        <div className="flex flex-col gap-4 rounded-lg border border-dashed border-rose-300/60 bg-rose-50/70 p-4 dark:border-rose-500/40 dark:bg-rose-500/10 md:flex-row md:items-center md:justify-between">
                            <div className="flex items-start gap-3">
                                <div className="rounded-full bg-white/90 p-2 text-rose-600 shadow-sm dark:bg-white/10 dark:text-rose-300">
                                    <Package className="h-4 w-4" />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-rose-700 dark:text-rose-200">Requires special handling?</p>
                                    <p className="text-xs text-rose-700/80 dark:text-rose-200/80">
                                        Mark this to alert dispatch teams about extra preparation needs.
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
                                <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Requires special equipment</span>
                                <Badge
                                    variant="secondary"
                                    className={`border-0 ${
                                        data.requires_special_equipment
                                            ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-200'
                                            : 'bg-slate-100 text-slate-600 dark:bg-slate-800/60 dark:text-slate-300'
                                    }`}
                                >
                                    {data.requires_special_equipment ? 'Flagged' : 'Standard Handling'}
                                </Badge>
                            </div>
                        </div>
                    </FormField>
                </FormSection>

                <FormSection
                    title="Specifications"
                    description="Update the quantitative attributes that influence transport planning."
                    icon={
                        <div className="rounded-lg bg-blue-100 p-2 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300">
                            <ClipboardCheck className="h-4 w-4" />
                        </div>
                    }
                    contentClassName="gap-6 md:grid-cols-2"
                >
                    <FormField
                        id="weight_per_cubic_meter"
                        label="Weight per m³ (kg)"
                        helperText="Optional but improves stacking and load balancing recommendations."
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
                            placeholder="0.00"
                            className={`border-slate-300 focus:border-rose-500 focus:ring-rose-500/20 dark:border-slate-700 dark:focus:border-rose-400 ${
                                getFieldError('weight_per_cubic_meter')
                                    ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20 dark:border-red-500'
                                    : ''
                            }`}
                        />
                    </FormField>

                    <FormField
                        id="density_insight"
                        label="Density Insight"
                        helperText="Helps scheduling teams understand cargo stacking constraints."
                        className="md:col-span-1"
                    >
                        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-300">
                            {densityInsight ? (
                                <Badge
                                    className={`mb-2 inline-flex items-center gap-2 border-0 px-3 py-1.5 text-sm font-medium ${densityInsight.tone}`}
                                >
                                    <ShieldCheck className="h-3.5 w-3.5" />
                                    {densityInsight.label}
                                </Badge>
                            ) : (
                                <Badge variant="secondary" className="mb-2 border-0 bg-slate-100 text-slate-600 dark:bg-slate-800/60 dark:text-slate-300">
                                    Awaiting data
                                </Badge>
                            )}
                            <p className="text-xs text-muted-foreground">
                                Provide weight per cubic meter to unlock automated stacking and payload recommendations.
                            </p>
                        </div>
                    </FormField>
                </FormSection>

                <FormSection
                    title="Handling & Safety Guidance"
                    description="Document operational procedures and compliance instructions for your crews."
                    icon={
                        <div className="rounded-lg bg-slate-100 p-2 text-slate-600 dark:bg-slate-800/60 dark:text-slate-200">
                            <Shield className="h-4 w-4" />
                        </div>
                    }
                    contentClassName="gap-6 md:grid-cols-2"
                >
                    <FormField
                        id="handling_requirements"
                        label="Handling Requirements"
                        helperText="Optional. Share instructions that improve handling consistency."
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
                            className={`resize-y border-slate-300 focus:border-rose-500 focus:ring-rose-500/20 dark:border-slate-700 dark:focus:border-rose-400 ${
                                getFieldError('handling_requirements')
                                    ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20 dark:border-red-500'
                                    : ''
                            }`}
                            placeholder="Include palletisation, stacking, or temperature guidance."
                        />
                    </FormField>

                    <FormField
                        id="safety_requirements"
                        label="Safety Guidance"
                        helperText="Optional. Highlight protective equipment or risk mitigation steps."
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
                            className={`resize-y border-slate-300 focus:border-rose-500 focus:ring-rose-500/20 dark:border-slate-700 dark:focus:border-rose-400 ${
                                getFieldError('safety_requirements')
                                    ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20 dark:border-red-500'
                                    : ''
                            }`}
                            placeholder="Document PPE needs, hazard markings, or emergency contacts."
                        />
                    </FormField>
                </FormSection>

                <FormActionsBar
                    left={
                        <>
                            <span className="flex items-center gap-2 text-sm">
                                <span className="text-red-500">*</span>
                                Required fields keep cargo cataloging consistent across the fleet.
                            </span>
                            <span className="flex items-center gap-2 text-xs text-muted-foreground">
                                <ClipboardCheck className="h-3 w-3" />
                                Accurate specs unlock safer loading playbooks.
                            </span>
                        </>
                    }
                    right={
                        <>
                            <Button
                                type="button"
                                variant="outline"
                                asChild
                                className="border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
                            >
                                <Link href={`/cargo-types/${cargoType.id}`}>Cancel</Link>
                            </Button>
                            <Button
                                type="submit"
                                disabled={processing || hasErrors}
                                className="min-w-[180px] bg-gradient-to-r from-rose-600 to-rose-700 text-white shadow-lg transition hover:from-rose-700 hover:to-rose-800"
                            >
                                {processing ? 'Saving…' : 'Save Changes'}
                            </Button>
                        </>
                    }
                />
            </form>

            <ScrollToTopFab visible={showScrollTop} onClick={handleScrollToTop} />
        </FormPageLayout>
    );
}

