import { FormPageLayout } from '@/components/forms/form-page-layout';
import { FormSection } from '@/components/forms/form-section';
import { FormField } from '@/components/forms/form-field';
import { FormActionsBar } from '@/components/forms/form-actions-bar';
import { UnsavedChangesBadge } from '@/components/forms/unsaved-changes-badge';
import { ScrollToTopFab } from '@/components/forms/scroll-to-top-fab';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { validateVehicleType } from '@/lib/validation';
import { type BreadcrumbItem } from '@/types';
import { Link, useForm } from '@inertiajs/react';
import { ArrowLeft, CheckCircle, Info, Package, Save, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { type FormEventHandler, useCallback, useEffect, useMemo, useRef, useState } from 'react';

interface VehicleType {
    id: number;
    name: string;
    description?: string;
}

interface VehicleTypesEditProps {
    vehicleType: VehicleType;
}

export default function VehicleTypesEdit({ vehicleType }: VehicleTypesEditProps) {
    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Vehicle Types',
            href: '/vehicletypes',
        },
        {
            title: 'Edit',
            href: `/vehicletypes/${vehicleType.id}/edit`,
        },
    ];

    const { data, setData, put, processing, errors, clearErrors } = useForm<VehicleTypeFormData>({
        name: vehicleType.name,
        description: vehicleType.description || '',
    });
    const [frontendErrors, setFrontendErrors] = useState<Partial<Record<VehicleTypeFormField, string>>>({});
    const [isDirty, setIsDirty] = useState(false);
    const [showScrollTop, setShowScrollTop] = useState(false);
    const scrollContainerRef = useRef<HTMLFormElement | null>(null);

    useEffect(() => {
        const errorMessages = Object.values(errors)
            .map((message) => (typeof message === 'string' ? message : String(message)))
            .filter(Boolean);

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
        scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const validateField = (field: VehicleTypeFormField, value: string) => {
        const nextState = { ...data, [field]: value } as VehicleTypeFormData;
        const message = validateVehicleType(nextState)[field];

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

    const handleFieldChange = (field: VehicleTypeFormField, value: string) => {
        setData(field, value);
        clearErrors(field);
        validateField(field, value);
        setIsDirty(true);
    };

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        const validationResult = validateVehicleType(data);
        if (Object.keys(validationResult).length > 0) {
            setFrontendErrors(validationResult as Partial<Record<VehicleTypeFormField, string>>);
            toast({
                title: '⚠️ Validation Error',
                description: 'Please fix the validation errors before submitting.',
                variant: 'destructive',
            });
            return;
        }

        put(`/vehicletypes/${vehicleType.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                setFrontendErrors({});
                setIsDirty(false);
                clearErrors();
            },
        });
    };

    const getFieldError = useCallback((field: VehicleTypeFormField): string => {
        const backendError = errors[field];
        if (backendError) {
            return typeof backendError === 'string' ? backendError : String(backendError);
        }

        return frontendErrors[field] ?? '';
    }, [errors, frontendErrors]);

    const nameError = useMemo(() => getFieldError('name'), [getFieldError]);
    const descriptionError = useMemo(() => getFieldError('description'), [getFieldError]);
    const hasErrors = Boolean(nameError || descriptionError);

    return (
        <FormPageLayout
            title="Edit Vehicle Type"
            headTitle={`Edit ${vehicleType.name}`}
            description="Update the vehicle classification details used across the fleet."
            breadcrumbs={breadcrumbs}
            icon={<Package className="h-5 w-5" />}
            headerAside={
                <>
                    <Button variant="ghost" size="sm" asChild>
                        <Link href="/vehicletypes">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Vehicle Types
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
            {(Object.keys(errors).length > 0 || Object.keys(frontendErrors).length > 0) && (
                <div className="px-6 pt-6">
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>Please resolve the highlighted fields before submitting the form.</AlertDescription>
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
                    title="Vehicle Type Details"
                    description="Edit the name or optional description to keep records accurate."
                    icon={
                        <div className="rounded-lg bg-blue-100 p-2 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                            <Info className="h-4 w-4" />
                        </div>
                    }
                    contentClassName="gap-6 md:grid-cols-2"
                >
                    <FormField id="name" label="Name" required tooltip="Use a descriptive name for the vehicle class." error={nameError}>
                        <Input
                            id="name"
                            type="text"
                            value={data.name}
                            onChange={(event) => handleFieldChange('name', event.target.value)}
                            placeholder="e.g. Heavy Truck, Light Truck"
                            className={`transition-all duration-200 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500 focus:ring-blue-500/20 focus:border-blue-500 ${nameError ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}`}
                            autoComplete="off"
                        />
                    </FormField>
                    <FormField
                        id="description"
                        label="Description"
                        error={descriptionError}
                        helperText="Optional. Helps others understand where this type should be used."
                        contentClassName="md:col-span-1"
                    >
                        <Textarea
                            id="description"
                            value={data.description}
                            onChange={(event) => handleFieldChange('description', event.target.value)}
                            placeholder="Optional description of the vehicle type"
                            rows={4}
                            className={`resize-none transition-all duration-200 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500 focus:ring-blue-500/20 focus:border-blue-500 ${descriptionError ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}`}
                        />
                    </FormField>
                </FormSection>

                <FormActionsBar
                    left={
                        <>
                            <span className="flex items-center gap-2">
                                <span className="text-red-500">*</span>
                                All required fields must be completed
                            </span>
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
                                <Link href="/vehicletypes">Cancel</Link>
                            </Button>
                            <Button
                                type="submit"
                                disabled={processing || hasErrors || !data.name.trim()}
                                className="min-w-[160px] bg-gradient-to-r from-blue-600 to-blue-700 px-6 text-white shadow-lg transition-all duration-200 hover:from-blue-700 hover:to-blue-800 hover:shadow-xl"
                            >
                                {processing ? (
                                    <>
                                        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-white"></div>
                                        Updating...
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle className="mr-2 h-4 w-4" />
                                        Update Vehicle Type
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

type VehicleTypeFormData = {
    name: string;
    description: string;
};

type VehicleTypeFormField = keyof VehicleTypeFormData;



