import { FormPageLayout } from '@/components/forms/form-page-layout';
import { FormSection } from '@/components/forms/form-section';
import { FormField } from '@/components/forms/form-field';
import { FormActionsBar } from '@/components/forms/form-actions-bar';
import { UnsavedChangesBadge } from '@/components/forms/unsaved-changes-badge';
import { ScrollToTopFab } from '@/components/forms/scroll-to-top-fab';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { validateRegion, type ValidationErrors } from '@/lib/validation';
import { toast } from '@/hooks/use-toast';
import { type BreadcrumbItem } from '@/types';
import { Link, useForm } from '@inertiajs/react';
import { AlertCircle, ArrowLeft, Compass, Globe2, Layers, Map } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState, type FormEventHandler } from 'react';

type RegionFormData = {
    name: string;
    status: 'active' | 'inactive';
    code: string;
    capital: string;
    area_km2: string;
    population: string;
    latitude: string;
    longitude: string;
    elevation_m: string;
    accessibility_score: string;
    last_surveyed_at: string;
    description: string;
    infrastructure_notes: string;
    climate_profile: string;
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Regions', href: '/regions' },
    { title: 'Create', href: '/regions/create' },
];

export default function RegionsCreate() {
    const { data, setData, post, processing, errors, reset, clearErrors } = useForm<RegionFormData>({
        name: '',
        status: 'active',
        code: '',
        capital: '',
        area_km2: '',
        population: '',
        latitude: '',
        longitude: '',
        elevation_m: '',
        accessibility_score: '',
        last_surveyed_at: '',
        description: '',
        infrastructure_notes: '',
        climate_profile: '',
    });

    const [frontendErrors, setFrontendErrors] = useState<ValidationErrors>({});
    const [isDirty, setIsDirty] = useState(false);
    const [showScrollTop, setShowScrollTop] = useState(false);
    const scrollContainerRef = useRef<HTMLFormElement | null>(null);

    useEffect(() => {
        const errorMessages = Object.values(errors)
            .flatMap(message => (Array.isArray(message) ? message : message ? [message] : []))
            .filter((message): message is string => Boolean(message));

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
        if (!container) return;

        const handleScroll = () => setShowScrollTop(container.scrollTop > 240);
        handleScroll();
        container.addEventListener('scroll', handleScroll);

        return () => container.removeEventListener('scroll', handleScroll);
    }, []);

    const setFieldError = useCallback((field: keyof RegionFormData, message: string) => {
        setFrontendErrors(prev => {
            const next = { ...prev };
            if (message) {
                next[field] = message;
            } else {
                delete next[field];
            }
            return next;
        });
    }, []);

    const validateField = useCallback(
        (field: keyof RegionFormData, value: string) => {
            const nextValues: RegionFormData = { ...data, [field]: value } as RegionFormData;
            const fieldErrors = validateRegion(nextValues);
            setFieldError(field, fieldErrors[field] ?? '');
        },
        [data, setFieldError]
    );

    const handleFieldChange = useCallback(
        (field: keyof RegionFormData, value: string) => {
            setData(field, value as RegionFormData[keyof RegionFormData]);
            clearErrors(field);
            validateField(field, value);
            setIsDirty(true);
        },
        [setData, clearErrors, validateField]
    );

    const submit: FormEventHandler = event => {
        event.preventDefault();

        const validationResults = validateRegion(data);
        if (Object.keys(validationResults).length > 0) {
            setFrontendErrors(validationResults);
            toast({
                title: '⚠️ Validation Error',
                description: 'Please resolve the highlighted fields before submitting.',
                variant: 'destructive',
            });
            return;
        }

        post('/regions', {
            preserveScroll: true,
            onSuccess: () => {
                setFrontendErrors({});
                setIsDirty(false);
                reset();
                toast({
                    title: '✅ Region Created',
                    description: 'The region has been registered successfully.',
                });
            },
        });
    };

    const getFieldError = useCallback(
        (field: keyof RegionFormData) => {
            const backendError = errors[field];
            if (backendError) {
                return typeof backendError === 'string' ? backendError : String(backendError);
            }
            return frontendErrors[field] || '';
        },
        [errors, frontendErrors]
    );

    const handleScrollToTop = () => {
        scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const hasErrors = useMemo(
        () => Object.keys(errors).length > 0 || Object.keys(frontendErrors).length > 0,
        [errors, frontendErrors]
    );

    return (
        <FormPageLayout
            title="Register New Region"
            headTitle="Create Region"
            description="Capture administrative details, geospatial context, and logistics readiness for accurate planning."
            breadcrumbs={breadcrumbs}
            icon={<Map className="h-5 w-5" />}
            headerAside={
                <>
                    <Button variant="ghost" size="sm" asChild>
                        <Link href="/regions">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Regions
                        </Link>
                    </Button>
                    {isDirty && <UnsavedChangesBadge />}
                    <div className="flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1.5 text-sm font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                        <div className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
                        Regional Planning
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
                {hasErrors && (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                            Please correct the validation errors before submitting the form.
                        </AlertDescription>
                    </Alert>
                )}

                <FormSection
                    title="Region Identity"
                    description="Define how the region should appear across the platform."
                    icon={
                        <div className="rounded-lg bg-indigo-100 p-2 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400">
                            <Globe2 className="h-4 w-4" />
                        </div>
                    }
                    contentClassName="gap-6 md:grid-cols-2"
                >
                    <FormField
                        id="name"
                        label="Region Name"
                        required
                        error={getFieldError('name')}
                    >
                        <Input
                            id="name"
                            value={data.name}
                            onChange={event => handleFieldChange('name', event.target.value)}
                            placeholder="e.g., Oromia"
                            className={getFieldError('name') ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}
                        />
                    </FormField>

                    <FormField
                        id="code"
                        label="Region Code"
                        error={getFieldError('code')}
                    >
                        <Input
                            id="code"
                            value={data.code}
                            onChange={event => handleFieldChange('code', event.target.value)}
                            placeholder="e.g., OR-01"
                            className={getFieldError('code') ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}
                        />
                    </FormField>

                    <FormField
                        id="status"
                        label="Status"
                        required
                        error={getFieldError('status')}
                    >
                        <Select
                            value={data.status}
                            onValueChange={value => handleFieldChange('status', value)}
                        >
                            <SelectTrigger className={getFieldError('status') ? 'border-red-500 focus:ring-red-500/20' : ''}>
                                <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="active">Active</SelectItem>
                                <SelectItem value="inactive">Inactive</SelectItem>
                            </SelectContent>
                        </Select>
                    </FormField>

                    <FormField
                        id="capital"
                        label="Capital City"
                        error={getFieldError('capital')}
                    >
                        <Input
                            id="capital"
                            value={data.capital}
                            onChange={event => handleFieldChange('capital', event.target.value)}
                            placeholder="e.g., Adama"
                            className={getFieldError('capital') ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}
                        />
                    </FormField>
                </FormSection>

                <FormSection
                    title="Geographic Profile"
                    description="Provide the spatial footprint and demographics for analytics."
                    icon={
                        <div className="rounded-lg bg-indigo-100 p-2 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400">
                            <Compass className="h-4 w-4" />
                        </div>
                    }
                    contentClassName="gap-6 md:grid-cols-3"
                >
                    <FormField
                        id="area_km2"
                        label="Area (km²)"
                        error={getFieldError('area_km2')}
                    >
                        <Input
                            id="area_km2"
                            type="number"
                            step="0.01"
                            value={data.area_km2}
                            onChange={event => handleFieldChange('area_km2', event.target.value)}
                            placeholder="e.g., 35363"
                            className={getFieldError('area_km2') ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}
                        />
                    </FormField>

                    <FormField
                        id="population"
                        label="Population"
                        error={getFieldError('population')}
                    >
                        <Input
                            id="population"
                            type="number"
                            step="1"
                            value={data.population}
                            onChange={event => handleFieldChange('population', event.target.value)}
                            placeholder="e.g., 4800000"
                            className={getFieldError('population') ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}
                        />
                    </FormField>

                    <FormField
                        id="elevation_m"
                        label="Elevation (m)"
                        error={getFieldError('elevation_m')}
                    >
                        <Input
                            id="elevation_m"
                            type="number"
                            step="0.01"
                            value={data.elevation_m}
                            onChange={event => handleFieldChange('elevation_m', event.target.value)}
                            placeholder="e.g., 1325"
                            className={getFieldError('elevation_m') ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}
                        />
                    </FormField>

                    <FormField
                        id="latitude"
                        label="Latitude"
                        error={getFieldError('latitude')}
                        className="md:col-span-1"
                    >
                        <Input
                            id="latitude"
                            type="number"
                            step="0.000001"
                            value={data.latitude}
                            onChange={event => handleFieldChange('latitude', event.target.value)}
                            placeholder="e.g., 8.980603"
                            className={getFieldError('latitude') ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}
                        />
                    </FormField>

                    <FormField
                        id="longitude"
                        label="Longitude"
                        error={getFieldError('longitude')}
                        className="md:col-span-1"
                    >
                        <Input
                            id="longitude"
                            type="number"
                            step="0.000001"
                            value={data.longitude}
                            onChange={event => handleFieldChange('longitude', event.target.value)}
                            placeholder="e.g., 38.757761"
                            className={getFieldError('longitude') ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}
                        />
                    </FormField>
                </FormSection>

                <FormSection
                    title="Infrastructure & Climate"
                    description="Document readiness signals for logistics and service deployment."
                    icon={
                        <div className="rounded-lg bg-indigo-100 p-2 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400">
                            <Layers className="h-4 w-4" />
                        </div>
                    }
                    contentClassName="gap-6 md:grid-cols-2"
                >
                    <FormField
                        id="accessibility_score"
                        label="Accessibility Score"
                        error={getFieldError('accessibility_score')}
                    >
                        <Input
                            id="accessibility_score"
                            type="number"
                            step="0.01"
                            min="0"
                            max="100"
                            value={data.accessibility_score}
                            onChange={event => handleFieldChange('accessibility_score', event.target.value)}
                            placeholder="0 - 100"
                            className={getFieldError('accessibility_score') ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}
                        />
                    </FormField>

                    <FormField
                        id="last_surveyed_at"
                        label="Last Surveyed"
                        error={getFieldError('last_surveyed_at')}
                    >
                        <Input
                            id="last_surveyed_at"
                            type="date"
                            value={data.last_surveyed_at}
                            onChange={event => handleFieldChange('last_surveyed_at', event.target.value)}
                            className={getFieldError('last_surveyed_at') ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}
                        />
                    </FormField>

                    <FormField
                        id="description"
                        label="Description"
                        error={getFieldError('description')}
                        className="md:col-span-2"
                    >
                        <Textarea
                            id="description"
                            value={data.description}
                            onChange={event => handleFieldChange('description', event.target.value)}
                            placeholder="Regional overview, economic focus, or key logistics partners"
                            className={`min-h-[100px] ${getFieldError('description') ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}`}
                        />
                    </FormField>

                    <FormField
                        id="infrastructure_notes"
                        label="Infrastructure Notes"
                        error={getFieldError('infrastructure_notes')}
                        className="md:col-span-2"
                    >
                        <Textarea
                            id="infrastructure_notes"
                            value={data.infrastructure_notes}
                            onChange={event => handleFieldChange('infrastructure_notes', event.target.value)}
                            placeholder="Connectivity, utilities, telecom coverage, or known constraints"
                            className={`min-h-[120px] ${getFieldError('infrastructure_notes') ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}`}
                        />
                    </FormField>

                    <FormField
                        id="climate_profile"
                        label="Climate Profile"
                        error={getFieldError('climate_profile')}
                        className="md:col-span-2"
                    >
                        <Textarea
                            id="climate_profile"
                            value={data.climate_profile}
                            onChange={event => handleFieldChange('climate_profile', event.target.value)}
                            placeholder="Seasonal patterns, temperature ranges, or weather alerts"
                            className={`min-h-[120px] ${getFieldError('climate_profile') ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}`}
                        />
                    </FormField>
                </FormSection>

                <FormActionsBar
                    processing={processing}
                    disabled={processing || Object.keys(frontendErrors).length > 0}
                    cancelHref="/regions"
                    submitLabel="Create Region"
                    isDirty={isDirty}
                />
            </form>

            <ScrollToTopFab show={showScrollTop} onClick={handleScrollToTop} />
        </FormPageLayout>
    );
}
