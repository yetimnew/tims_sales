import { FormActionsBar } from '@/components/forms/form-actions-bar';
import { FormField } from '@/components/forms/form-field';
import { FormPageLayout } from '@/components/forms/form-page-layout';
import { FormSection } from '@/components/forms/form-section';
import { ScrollToTopFab } from '@/components/forms/scroll-to-top-fab';
import { UnsavedChangesBadge } from '@/components/forms/unsaved-changes-badge';
import { Button } from '@/components/ui/button';
import { CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { DatePicker } from '@/components/ui/date-picker';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { validateDriverSafety } from '@/lib/validation';
import { cn } from '@/lib/utils';
import { type BreadcrumbItem } from '@/types';
import { Link, useForm } from '@inertiajs/react';
import type { LucideIcon } from 'lucide-react';
import {
    AlertCircle,
    AlertTriangle,
    ArrowLeft,
    ClipboardList,
    MapPin,
    NotebookPen,
    Shield,
    ShieldAlert,
    ShieldCheck,
    Users,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState, type FormEventHandler } from 'react';

interface DriverSafetyCreateProps {
    drivers: Array<{ id: number; name: string }>;
}

interface IncidentOption {
    value: string;
    label: string;
    description: string;
    icon: LucideIcon;
}

interface SeverityOption {
    value: string;
    label: string;
    description: string;
    tone: string;
    icon: LucideIcon;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Driver Safety', href: '/driver-safety' },
    { title: 'Create', href: '/driver-safety/create' },
];

const incidentTypes: IncidentOption[] = [
    {
        value: 'accident',
        label: 'Accident',
        description: 'Collision, rollover, or damage event requiring investigation.',
        icon: ShieldAlert,
    },
    {
        value: 'violation',
        label: 'Violation',
        description: 'Traffic or safety policy breach recorded against the driver.',
        icon: AlertTriangle,
    },
    {
        value: 'warning',
        label: 'Warning',
        description: 'Behaviour flagged for coaching or future follow-up.',
        icon: ClipboardList,
    },
];

const severityLevels: SeverityOption[] = [
    {
        value: 'minor',
        label: 'Minor',
        description: 'Monitor the driver and document corrective actions.',
        tone: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400',
        icon: ShieldCheck,
    },
    {
        value: 'major',
        label: 'Major',
        description: 'Significant disruption with recommended coaching and review.',
        tone: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400',
        icon: AlertTriangle,
    },
    {
        value: 'critical',
        label: 'Critical',
        description: 'Immediate escalation required to protect drivers and assets.',
        tone: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400',
        icon: ShieldAlert,
    },
];

type DriverSafetyFormData = {
    driver_id: string;
    incident_date: string;
    incident_type: string;
    severity: string;
    description: string;
    damage_cost: string;
    location: string;
    resolution: string;
};

type DriverSafetyFormField = keyof DriverSafetyFormData;

export default function DriverSafetyCreate({ drivers }: DriverSafetyCreateProps) {
    const { data, setData, post, processing, errors, clearErrors, reset } = useForm<DriverSafetyFormData>({
        driver_id: '',
        incident_date: new Date().toISOString().split('T')[0],
        incident_type: incidentTypes[0]?.value ?? 'accident',
        severity: severityLevels[0]?.value ?? 'minor',
        description: '',
        damage_cost: '',
        location: '',
        resolution: '',
    });

    const [frontendErrors, setFrontendErrors] = useState<Partial<Record<DriverSafetyFormField, string>>>({});
    const [isDirty, setIsDirty] = useState(false);
    const [showScrollTop, setShowScrollTop] = useState(false);
    const formRef = useRef<HTMLFormElement | null>(null);
    const lastErrorToast = useRef<string | null>(null);

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
        const errorMessages = Object.values(errors)
            .map((message) => (typeof message === 'string' ? message : String(message)))
            .filter(Boolean);

        if (errorMessages.length === 0) {
            lastErrorToast.current = null;
            return;
        }

        const combinedMessage = errorMessages.join(', ');
        if (combinedMessage === lastErrorToast.current) {
            return;
        }

        lastErrorToast.current = combinedMessage;
        toast({
            title: '⚠️ Validation Error',
            description: combinedMessage,
            variant: 'destructive',
        });
    }, [errors]);

    const backendErrors = useMemo(
        () =>
            Object.entries(errors).reduce<Partial<Record<DriverSafetyFormField, string>>>((acc, [key, value]) => {
                const message = typeof value === 'string' ? value : value ? String(value) : '';
                if (message) {
                    acc[key as DriverSafetyFormField] = message;
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

    const selectedIncident = useMemo(() => incidentTypes.find((item) => item.value === data.incident_type), [data.incident_type]);
    const selectedSeverity = useMemo(() => severityLevels.find((item) => item.value === data.severity), [data.severity]);
    const IncidentIcon = selectedIncident?.icon ?? ShieldAlert;
    const SeverityIcon = selectedSeverity?.icon ?? ShieldCheck;

    const estimatedDamageCost = useMemo(() => {
        if (!data.damage_cost) {
            return null;
        }
        const value = Number.parseFloat(data.damage_cost);
        return Number.isFinite(value) ? value : null;
    }, [data.damage_cost]);

    const handleScrollToTop = () => {
        formRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const validateField = (field: DriverSafetyFormField, value: string) => {
        const result = validateDriverSafety({ ...data, [field]: value });
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

    const handleFieldChange = (field: DriverSafetyFormField, value: string, options?: { validate?: boolean }) => {
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

    const handleSubmit: FormEventHandler<HTMLFormElement> = (event) => {
        event.preventDefault();

        const validationResult = validateDriverSafety(data);
        if (Object.keys(validationResult).length > 0) {
            setFrontendErrors(validationResult as Partial<Record<DriverSafetyFormField, string>>);
            toast({
                title: '⚠️ Validation Error',
                description: 'Please resolve the highlighted issues before saving.',
                variant: 'destructive',
            });
            return;
        }

        post('/driver-safety', {
            preserveScroll: true,
            onSuccess: () => {
                setFrontendErrors({});
                setIsDirty(false);
                clearErrors();
                toast({
                    title: '✅ Safety Record Created',
                    description: 'The driver safety incident has been recorded.',
                });
                reset();
                formRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
            },
            onError: (pageErrors) => {
                setFrontendErrors((prev) => ({ ...prev, ...(pageErrors as Partial<Record<DriverSafetyFormField, string>>) }));
            },
        });
    };

    const getFieldError = (field: DriverSafetyFormField): string => fieldErrors[field] ?? '';
    const hasErrors = Object.values(fieldErrors).some(Boolean);

    return (
        <FormPageLayout
            title="Record Driver Safety Incident"
            headTitle="Record Safety Incident"
            description="Document incidents to monitor risk trends and coordinate targeted coaching."
            breadcrumbs={breadcrumbs}
            icon={<ShieldAlert className="h-5 w-5" />}
            headerAside={
                <>
                    <Button variant="ghost" size="sm" asChild>
                        <Link href="/driver-safety">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Safety Log
                        </Link>
                    </Button>
                    {isDirty && <UnsavedChangesBadge />}
                    {selectedSeverity && (
                        <div className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium ${selectedSeverity.tone}`}>
                            <SeverityIcon className="h-3 w-3" />
                            {selectedSeverity.label} Severity
                        </div>
                    )}
                </>
            }
        >
            {hasErrors && (
                <div className="px-6 pt-6">
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
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
                    title="Incident Overview"
                    description="Confirm who was involved and the key incident attributes."
                    icon={
                        <div className="rounded-lg bg-rose-100 p-2 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300">
                            <Shield className="h-4 w-4" />
                        </div>
                    }
                    contentClassName="gap-6 md:grid-cols-2"
                >
                    <FormField
                        id="driver_id"
                        label="Driver"
                        required
                        helperText="Only active drivers are listed."
                        error={getFieldError('driver_id')}
                    >
                        <Select value={data.driver_id} onValueChange={(value) => handleFieldChange('driver_id', value)}>
                            <SelectTrigger
                                id="driver_id"
                                className={`border-slate-300 focus:border-rose-500 focus:ring-rose-500/20 dark:border-slate-700 dark:focus:border-rose-400 ${getFieldError('driver_id') ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20 dark:border-red-500' : ''}`}
                            >
                                <SelectValue placeholder="Select driver" />
                            </SelectTrigger>
                            <SelectContent>
                                {drivers.map((driver) => (
                                    <SelectItem key={driver.id} value={String(driver.id)}>
                                        <div className="flex items-center gap-2">
                                            <Users className="h-3.5 w-3.5 text-slate-500" />
                                            <span>{driver.name}</span>
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </FormField>

                    <FormField id="incident_date" label="Incident Date" required error={getFieldError('incident_date')}>
                        <DatePicker
                            value={data.incident_date}
                            onChange={(next) => handleFieldChange('incident_date', next ?? '')}
                            className={cn(
                                'w-full justify-start text-left h-11 border-slate-300 focus-visible:border-rose-500 focus-visible:ring-rose-500/20 dark:border-slate-700 dark:focus-visible:border-rose-400',
                                getFieldError('incident_date')
                                    ? 'border-red-500 focus-visible:border-red-500 focus-visible:ring-red-500/20'
                                    : undefined,
                            )}
                        />
                    </FormField>

                    <FormField id="incident_type" label="Incident Type" required error={getFieldError('incident_type')}>
                        <Select value={data.incident_type} onValueChange={(value) => handleFieldChange('incident_type', value)}>
                            <SelectTrigger
                                id="incident_type"
                                className={`border-slate-300 focus:border-rose-500 focus:ring-rose-500/20 dark:border-slate-700 dark:focus:border-rose-400 ${getFieldError('incident_type') ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20 dark:border-red-500' : ''}`}
                            >
                                <SelectValue placeholder="Select incident type" />
                            </SelectTrigger>
                            <SelectContent className="max-h-60">
                                {incidentTypes.map((item) => (
                                    <SelectItem key={item.value} value={item.value} className="py-2">
                                        <div className="flex items-start gap-3 text-left">
                                            <item.icon className="mt-0.5 h-4 w-4 text-slate-500" />
                                            <div>
                                                <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{item.label}</span>
                                                <CardDescription className="text-xs text-muted-foreground">{item.description}</CardDescription>
                                            </div>
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </FormField>

                    <FormField id="severity" label="Severity" required error={getFieldError('severity')}>
                        <Select value={data.severity} onValueChange={(value) => handleFieldChange('severity', value)}>
                            <SelectTrigger
                                id="severity"
                                className={`border-slate-300 focus:border-rose-500 focus:ring-rose-500/20 dark:border-slate-700 dark:focus:border-rose-400 ${getFieldError('severity') ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20 dark:border-red-500' : ''}`}
                            >
                                <SelectValue placeholder="Select severity" />
                            </SelectTrigger>
                            <SelectContent className="max-h-56">
                                {severityLevels.map((item) => (
                                    <SelectItem key={item.value} value={item.value} className="py-2">
                                        <div className="flex items-start gap-3 text-left">
                                            <item.icon className="mt-0.5 h-4 w-4 text-slate-500" />
                                            <div>
                                                <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{item.label}</span>
                                                <CardDescription className="text-xs text-muted-foreground">{item.description}</CardDescription>
                                            </div>
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </FormField>
                </FormSection>

                <FormSection
                    title="Impact & Context"
                    description="Capture financial implications and where the incident occurred."
                    icon={
                        <div className="rounded-lg bg-amber-100 p-2 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                            <ClipboardList className="h-4 w-4" />
                        </div>
                    }
                    contentClassName="gap-6 md:grid-cols-2"
                >
                    <FormField
                        id="damage_cost"
                        label="Estimated Damage Cost"
                        helperText="Leave blank if no financial impact is recorded."
                        error={getFieldError('damage_cost')}
                    >
                        <Input
                            id="damage_cost"
                            name="damage_cost"
                            type="number"
                            inputMode="decimal"
                            step="0.01"
                            value={data.damage_cost}
                            onChange={(event) => handleFieldChange('damage_cost', event.target.value)}
                            placeholder="0.00"
                            className={`border-slate-300 focus:border-rose-500 focus:ring-rose-500/20 dark:border-slate-700 dark:focus:border-rose-400 ${getFieldError('damage_cost') ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20 dark:border-red-500' : ''}`}
                        />
                    </FormField>

                    <FormField
                        id="location"
                        label="Location"
                        helperText="Optional. Max 255 characters."
                        error={getFieldError('location')}
                    >
                        <div className="relative">
                            <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <Input
                                id="location"
                                name="location"
                                type="text"
                                value={data.location}
                                onChange={(event) => handleFieldChange('location', event.target.value, { validate: false })}
                                onBlur={() => validateField('location', data.location)}
                                placeholder="e.g. Addis Ababa – Ring Road"
                                className={`pl-10 border-slate-300 focus:border-rose-500 focus:ring-rose-500/20 dark:border-slate-700 dark:focus:border-rose-400 ${getFieldError('location') ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20 dark:border-red-500' : ''}`}
                            />
                        </div>
                    </FormField>

                    <div className="md:col-span-2">
                        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-dashed border-rose-300/60 bg-rose-50/70 p-4 dark:border-rose-500/40 dark:bg-rose-500/10">
                            <div className="flex items-center gap-3">
                                <div className="rounded-full bg-white/90 p-2 text-rose-600 shadow-sm dark:bg-white/10 dark:text-rose-300">
                                    <IncidentIcon className="h-4 w-4" />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-rose-700 dark:text-rose-200">Current Incident Snapshot</p>
                                    <p className="text-xs text-rose-700/80 dark:text-rose-200/80">
                                        {selectedIncident?.description ?? 'Choose an incident type to unlock tailored follow-up guidance.'}
                                    </p>
                                </div>
                            </div>
                            <div className="flex flex-wrap items-center gap-3 text-xs text-rose-700/80 dark:text-rose-200/80">
                                {selectedSeverity && (
                                    <Badge variant="secondary" className={`flex items-center gap-2 border-0 px-3 py-2 text-sm ${selectedSeverity.tone}`}>
                                        <SeverityIcon className="h-3 w-3" />
                                        {selectedSeverity.label} severity
                                    </Badge>
                                )}
                                {estimatedDamageCost !== null && (
                                    <Badge
                                        variant="outline"
                                        className="flex items-center gap-1 border-rose-200/80 bg-white/75 px-3 py-2 text-sm text-rose-700 dark:border-rose-400/50 dark:bg-transparent dark:text-rose-200"
                                    >
                                        Estimated cost&nbsp;
                                        {estimatedDamageCost.toLocaleString(undefined, {
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2,
                                        })}
                                    </Badge>
                                )}
                            </div>
                        </div>
                    </div>
                </FormSection>

                <FormSection
                    title="Documentation & Follow-up"
                    description="Provide the narrative and planned corrective actions for the safety team."
                    icon={
                        <div className="rounded-lg bg-slate-100 p-2 text-slate-600 dark:bg-slate-800/60 dark:text-slate-200">
                            <NotebookPen className="h-4 w-4" />
                        </div>
                    }
                    contentClassName="gap-6"
                >
                    <FormField
                        id="description"
                        label="Incident Description"
                        required
                        helperText="Describe what happened, contributing factors, and immediate impacts."
                        error={getFieldError('description')}
                        className="md:col-span-2"
                    >
                        <Textarea
                            id="description"
                            name="description"
                            value={data.description}
                            onChange={(event) => handleFieldChange('description', event.target.value)}
                            rows={5}
                            className={`resize-y border-slate-300 focus:border-rose-500 focus:ring-rose-500/20 dark:border-slate-700 dark:focus:border-rose-400 ${getFieldError('description') ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20 dark:border-red-500' : ''}`}
                            placeholder="Describe what happened, contributing factors, and immediate impacts."
                        />
                    </FormField>

                    <FormField
                        id="resolution"
                        label="Corrective Action"
                        helperText="Outline coaching, maintenance, or policy follow-up planned for this incident."
                        error={getFieldError('resolution')}
                        className="md:col-span-2"
                    >
                        <Textarea
                            id="resolution"
                            name="resolution"
                            value={data.resolution}
                            onChange={(event) => handleFieldChange('resolution', event.target.value, { validate: false })}
                            onBlur={() => validateField('resolution', data.resolution)}
                            rows={4}
                            className={`resize-y border-slate-300 focus:border-rose-500 focus:ring-rose-500/20 dark:border-slate-700 dark:focus:border-rose-400 ${getFieldError('resolution') ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20 dark:border-red-500' : ''}`}
                            placeholder="Outline coaching, maintenance, or policy follow-up planned for this incident."
                        />
                    </FormField>
                </FormSection>

                <FormActionsBar
                    left={
                        <>
                            <span className="flex items-center gap-2 text-sm">
                                <span className="text-red-500">*</span>
                                Required fields must be completed before saving.
                            </span>
                            <span className="flex items-center gap-2 text-xs text-muted-foreground">
                                <ClipboardList className="h-3 w-3" />
                                Complete records enable targeted safety coaching.
                            </span>
                        </>
                    }
                    right={
                        <>
                            <Button type="button" variant="outline" asChild className="border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800">
                                <Link href="/driver-safety">Cancel</Link>
                            </Button>
                            <Button
                                type="submit"
                                disabled={processing || hasErrors}
                                className="min-w-[180px] bg-gradient-to-r from-rose-600 to-rose-700 text-white shadow-lg transition hover:from-rose-700 hover:to-rose-800"
                            >
                                {processing ? (
                                    <>
                                        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-white" />
                                        Recording...
                                    </>
                                ) : (
                                    <>
                                        <ShieldCheck className="mr-2 h-4 w-4" />
                                        Save Safety Record
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
