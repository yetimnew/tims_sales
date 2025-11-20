import { useEffect, useMemo, useRef, useState, type FormEventHandler } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { validateDriverSafety, type ValidationErrors } from '@/lib/validation';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
    ShieldAlert,
    ShieldCheck,
    AlertCircle,
    AlertTriangle,
    ClipboardList,
    Users,
    MapPin,
    NotebookPen,
    Save,
    Shield,
    ArrowUp,
    ArrowLeft,
    SquarePen,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Driver Safety',
        href: '/driver-safety',
    },
    {
        title: 'Edit',
        href: '#',
    },
];

interface Driver {
    id: number;
    name: string;
}

interface SafetyRecord {
    id: number;
    driver_id: number;
    incident_date: string;
    incident_type: string;
    description: string;
    severity: string;
    damage_cost?: number;
    location?: string;
    resolution?: string;
}

interface DriverSafetyEditProps {
    driverSafety: SafetyRecord;
    drivers: Driver[];
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

const incidentTypes: IncidentOption[] = [
    {
        value: 'accident',
        label: 'Accident',
        description: 'Collision, rollover, or material damage event.',
        icon: ShieldAlert,
    },
    {
        value: 'violation',
        label: 'Violation',
        description: 'Traffic or policy breach recorded against the driver.',
        icon: AlertTriangle,
    },
    {
        value: 'warning',
        label: 'Warning',
        description: 'Behaviour flagged for monitoring or coaching.',
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
        description: 'Significant disruption with coaching recommended.',
        tone: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400',
        icon: AlertTriangle,
    },
    {
        value: 'critical',
        label: 'Critical',
        description: 'Immediate escalation required to protect assets.',
        tone: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400',
        icon: ShieldAlert,
    },
];

export default function DriverSafetyEdit({ driverSafety, drivers }: DriverSafetyEditProps) {
    const initialValues = useMemo(() => ({
        driver_id: driverSafety.driver_id ? String(driverSafety.driver_id) : '',
        incident_date: driverSafety.incident_date,
        incident_type: driverSafety.incident_type,
        severity: driverSafety.severity,
        description: driverSafety.description ?? '',
        damage_cost: driverSafety.damage_cost !== undefined && driverSafety.damage_cost !== null
            ? String(driverSafety.damage_cost)
            : '',
        location: driverSafety.location ?? '',
        resolution: driverSafety.resolution ?? '',
    }), [driverSafety]);

    const { data, setData, put, processing, errors } = useForm({ ...initialValues });
    const { toast } = useToast();
    const [frontendErrors, setFrontendErrors] = useState<ValidationErrors>({});
    const [showScrollTop, setShowScrollTop] = useState(false);
    const [isDirty, setIsDirty] = useState(false);
    const scrollContainerRef = useRef<HTMLFormElement | null>(null);

    const mergedErrors = { ...frontendErrors, ...errors } as Record<string, string | string[]>;

    const selectedIncident = useMemo(
        () => incidentTypes.find((item) => item.value === data.incident_type),
        [data.incident_type],
    );

    const selectedSeverity = useMemo(
        () => severityLevels.find((item) => item.value === data.severity),
        [data.severity],
    );

    const IncidentIcon = selectedIncident?.icon ?? ShieldAlert;
    const SeverityIcon = selectedSeverity?.icon ?? ShieldCheck;

    const estimatedDamageCost = useMemo(() => {
        if (!data.damage_cost) {
            return null;
        }
        const value = Number.parseFloat(data.damage_cost);
        if (Number.isNaN(value) || !Number.isFinite(value)) {
            return null;
        }
        return value;
    }, [data.damage_cost]);

    useEffect(() => {
        if (Object.keys(errors).length === 0) {
            return;
        }
        const message = Object.values(errors)
            .map((value) => (Array.isArray(value) ? value.join(', ') : value))
            .filter(Boolean)
            .join(', ');

        toast({
            variant: 'destructive',
            title: 'Validation error',
            description: message || 'Please address the highlighted fields before saving.',
        });
    }, [errors, toast]);

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
        scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const validateField = (fieldName: keyof typeof data, value: string) => {
        const payload = { ...data, [fieldName]: value };
        const validationErrors = validateDriverSafety(payload);
        const fieldError = validationErrors[fieldName];

        setFrontendErrors((prev) => {
            const next = { ...prev };
            if (fieldError) {
                next[fieldName] = fieldError;
            } else {
                delete next[fieldName];
            }
            return next;
        });
    };

    const handleFieldChange = (fieldName: keyof typeof data, value: string, shouldValidate = true) => {
        const updated = { ...data, [fieldName]: value };
        setData(fieldName, value);
        setIsDirty(Object.entries(initialValues).some(([key, initialValue]) => updated[key as keyof typeof updated] !== initialValue));

        if (shouldValidate) {
            validateField(fieldName, value);
        } else {
            setFrontendErrors((prev) => {
                const next = { ...prev };
                delete next[fieldName];
                return next;
            });
        }
    };

    const submit: FormEventHandler = (event) => {
        event.preventDefault();

        const validationResult = validateDriverSafety({ ...data });
        if (Object.keys(validationResult).length > 0) {
            setFrontendErrors(validationResult);
            toast({
                variant: 'destructive',
                title: 'Validation error',
                description: 'Please resolve the highlighted issues before saving.',
            });
            return;
        }

        put(`/driver-safety/${driverSafety.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                setFrontendErrors({});
                setIsDirty(false);
                toast({
                    title: 'Safety record updated',
                    description: 'The incident details were saved successfully.',
                });
            },
        });
    };

    const getFieldError = (fieldName: keyof typeof data) => {
        const value = mergedErrors[fieldName];
        if (!value) {
            return '';
        }
        return Array.isArray(value) ? value.join(', ') : value;
    };

    const hasErrors = Object.keys(mergedErrors).length > 0;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit Safety Record #${driverSafety.id}`} />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-hidden rounded-xl p-4">
                <Card className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-slate-200/70 bg-white/95 text-card-foreground shadow-xl backdrop-blur-lg dark:border-slate-800/60 dark:bg-slate-900/70">
                    <CardHeader className="px-6 pb-0">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                            <div className="flex items-start gap-4">
                                <div className="rounded-xl bg-rose-100 p-2 text-rose-600 shadow-sm dark:bg-rose-900/30 dark:text-rose-300">
                                    <SquarePen className="h-5 w-5" />
                                </div>
                                <div>
                                    <CardTitle className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
                                        Update Driver Safety Incident
                                    </CardTitle>
                                    <CardDescription className="text-sm text-slate-600 dark:text-slate-400">
                                        Refine the documented details to keep your safety insights accurate and actionable.
                                    </CardDescription>
                                </div>
                            </div>
                            <div className="flex flex-wrap items-center gap-3">
                                <Button type="button" variant="ghost" size="sm" asChild>
                                    <Link href={`/driver-safety/${driverSafety.id}`}>
                                        <ArrowLeft className="mr-2 h-4 w-4" />
                                        Back to Record
                                    </Link>
                                </Button>
                                {isDirty && (
                                    <div className="flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1.5 text-sm font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                                        <Save className="h-3 w-3" />
                                        Unsaved Changes
                                    </div>
                                )}
                                {selectedSeverity && (
                                    <div className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium ${selectedSeverity.tone}`}>
                                        <SeverityIcon className="h-3 w-3" />
                                        {selectedSeverity.label} Severity
                                    </div>
                                )}
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="flex flex-1 flex-col overflow-hidden p-0">
                        {hasErrors && (
                            <div className="mx-6 mt-6">
                                <Alert variant="destructive" className="border-red-500/50">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertDescription>Please resolve the highlighted fields before submitting the form.</AlertDescription>
                                </Alert>
                            </div>
                        )}

                        <form
                            ref={scrollContainerRef}
                            onSubmit={submit}
                            className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto px-6 py-6"
                        >
                            <section className="space-y-5 rounded-xl border border-slate-200/70 bg-white/80 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/40">
                                <div className="flex items-center gap-3">
                                    <div className="rounded-lg bg-rose-100 p-2 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300">
                                        <Shield className="h-4 w-4" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Incident Overview</h2>
                                        <p className="text-sm text-muted-foreground">Confirm who was involved and the essential context for the record.</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="driver_id" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                                            Driver <span className="text-red-500">*</span>
                                        </Label>
                                        <Select value={data.driver_id} onValueChange={(value) => handleFieldChange('driver_id', value)}>
                                            <SelectTrigger
                                                id="driver_id"
                                                className={`bg-white transition-all duration-200 hover:border-slate-400 focus:border-rose-500 focus:ring-rose-500/20 dark:bg-slate-800 dark:hover:border-slate-500 ${getFieldError('driver_id') ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20 dark:border-red-500' : 'border-slate-300 dark:border-slate-600'}`}
                                            >
                                                <SelectValue placeholder="Select driver" />
                                            </SelectTrigger>
                                            <SelectContent className="bg-white shadow-lg dark:bg-slate-800">
                                                {drivers.map((driver) => (
                                                    <SelectItem
                                                        key={driver.id}
                                                        value={driver.id.toString()}
                                                        className="flex items-center gap-2 hover:bg-slate-100 focus:bg-slate-100 dark:hover:bg-slate-700 dark:focus:bg-slate-700"
                                                    >
                                                        <div className="flex items-center gap-2">
                                                            <Users className="h-3.5 w-3.5 text-slate-500" />
                                                            <span>{driver.name}</span>
                                                        </div>
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {getFieldError('driver_id') && (
                                            <p className="flex items-center gap-1 text-sm text-red-500">
                                                <AlertCircle className="h-3 w-3" />
                                                {getFieldError('driver_id')}
                                            </p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="incident_date" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                                            Incident Date <span className="text-red-500">*</span>
                                        </Label>
                                        <Input
                                            id="incident_date"
                                            type="date"
                                            value={data.incident_date}
                                            onChange={(event) => handleFieldChange('incident_date', event.target.value)}
                                            className={`bg-white transition-all duration-200 focus:border-rose-500 focus:ring-rose-500/20 dark:bg-slate-800 ${getFieldError('incident_date') ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20 dark:border-red-500' : 'border-slate-300 hover:border-slate-400 dark:border-slate-600 dark:hover:border-slate-500'}`}
                                        />
                                        {getFieldError('incident_date') && (
                                            <p className="flex items-center gap-1 text-sm text-red-500">
                                                <AlertCircle className="h-3 w-3" />
                                                {getFieldError('incident_date')}
                                            </p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="incident_type" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                                            Incident Type <span className="text-red-500">*</span>
                                        </Label>
                                        <Select value={data.incident_type} onValueChange={(value) => handleFieldChange('incident_type', value)}>
                                            <SelectTrigger
                                                id="incident_type"
                                                className={`bg-white transition-all duration-200 hover:border-slate-400 focus:border-rose-500 focus:ring-rose-500/20 dark:bg-slate-800 dark:hover:border-slate-500 ${getFieldError('incident_type') ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20 dark:border-red-500' : 'border-slate-300 dark:border-slate-600'}`}
                                            >
                                                <SelectValue placeholder="Select incident type" />
                                            </SelectTrigger>
                                            <SelectContent className="max-h-60 bg-white shadow-lg dark:bg-slate-800">
                                                {incidentTypes.map((item) => (
                                                    <SelectItem
                                                        key={item.value}
                                                        value={item.value}
                                                        className="gap-2 py-2 hover:bg-slate-100 focus:bg-slate-100 dark:hover:bg-slate-700 dark:focus:bg-slate-700"
                                                    >
                                                        <div className="flex items-start gap-3">
                                                            <item.icon className="mt-0.5 h-4 w-4 text-slate-500" />
                                                            <div className="flex flex-col">
                                                                <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{item.label}</span>
                                                                <span className="text-xs text-muted-foreground">{item.description}</span>
                                                            </div>
                                                        </div>
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {getFieldError('incident_type') && (
                                            <p className="flex items-center gap-1 text-sm text-red-500">
                                                <AlertCircle className="h-3 w-3" />
                                                {getFieldError('incident_type')}
                                            </p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="severity" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                                            Severity <span className="text-red-500">*</span>
                                        </Label>
                                        <Select value={data.severity} onValueChange={(value) => handleFieldChange('severity', value)}>
                                            <SelectTrigger
                                                id="severity"
                                                className={`bg-white transition-all duration-200 hover:border-slate-400 focus:border-rose-500 focus:ring-rose-500/20 dark:bg-slate-800 dark:hover:border-slate-500 ${getFieldError('severity') ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20 dark:border-red-500' : 'border-slate-300 dark:border-slate-600'}`}
                                            >
                                                <SelectValue placeholder="Select severity" />
                                            </SelectTrigger>
                                            <SelectContent className="max-h-56 bg-white shadow-lg dark:bg-slate-800">
                                                {severityLevels.map((item) => (
                                                    <SelectItem
                                                        key={item.value}
                                                        value={item.value}
                                                        className="gap-2 py-2 hover:bg-slate-100 focus:bg-slate-100 dark:hover:bg-slate-700 dark:focus:bg-slate-700"
                                                    >
                                                        <div className="flex items-start gap-3">
                                                            <item.icon className="mt-0.5 h-4 w-4 text-slate-500" />
                                                            <div className="flex flex-col text-left">
                                                                <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{item.label}</span>
                                                                <span className="text-xs text-muted-foreground">{item.description}</span>
                                                            </div>
                                                        </div>
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {getFieldError('severity') && (
                                            <p className="flex items-center gap-1 text-sm text-red-500">
                                                <AlertCircle className="h-3 w-3" />
                                                {getFieldError('severity')}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </section>

                            <section className="space-y-5 rounded-xl border border-slate-200/70 bg-white/80 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/40">
                                <div className="flex items-center gap-3">
                                    <div className="rounded-lg bg-amber-100 p-2 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                                        <ClipboardList className="h-4 w-4" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Impact &amp; Context</h2>
                                        <p className="text-sm text-muted-foreground">Capture financial implications and where the incident occurred.</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="damage_cost" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                                            Estimated Damage Cost
                                        </Label>
                                        <Input
                                            id="damage_cost"
                                            type="number"
                                            inputMode="decimal"
                                            step="0.01"
                                            value={data.damage_cost}
                                            onChange={(event) => handleFieldChange('damage_cost', event.target.value)}
                                            placeholder="0.00"
                                            className={`bg-white transition-all duration-200 focus:border-rose-500 focus:ring-rose-500/20 dark:bg-slate-800 ${getFieldError('damage_cost') ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20 dark:border-red-500' : 'border-slate-300 hover:border-slate-400 dark:border-slate-600 dark:hover:border-slate-500'}`}
                                        />
                                        {getFieldError('damage_cost') && (
                                            <p className="flex items-center gap-1 text-sm text-red-500">
                                                <AlertCircle className="h-3 w-3" />
                                                {getFieldError('damage_cost')}
                                            </p>
                                        )}
                                        <p className="text-xs text-muted-foreground">Leave blank if no financial impact is recorded.</p>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="location" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                                            Location
                                        </Label>
                                        <div className="relative">
                                            <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                            <Input
                                                id="location"
                                                type="text"
                                                value={data.location}
                                                onChange={(event) => handleFieldChange('location', event.target.value, false)}
                                                placeholder="e.g., Addis Ababa - Ring Road"
                                                className={`bg-white pl-10 transition-all duration-200 focus:border-rose-500 focus:ring-rose-500/20 dark:bg-slate-800 ${getFieldError('location') ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20 dark:border-red-500' : 'border-slate-300 hover:border-slate-400 dark:border-slate-600 dark:hover:border-slate-500'}`}
                                            />
                                        </div>
                                        {getFieldError('location') && (
                                            <p className="flex items-center gap-1 text-sm text-red-500">
                                                <AlertCircle className="h-3 w-3" />
                                                {getFieldError('location')}
                                            </p>
                                        )}
                                    </div>

                                    <div className="space-y-3 md:col-span-2">
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
                                </div>
                            </section>

                            <section className="space-y-5 rounded-xl border border-slate-200/70 bg-white/80 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/40">
                                <div className="flex items-center gap-3">
                                    <div className="rounded-lg bg-slate-100 p-2 text-slate-600 dark:bg-slate-800/60 dark:text-slate-200">
                                        <NotebookPen className="h-4 w-4" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Documentation &amp; Follow-up</h2>
                                        <p className="text-sm text-muted-foreground">Provide the narrative and corrective actions planned for this incident.</p>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="description" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                                        Incident Description <span className="text-red-500">*</span>
                                    </Label>
                                    <Textarea
                                        id="description"
                                        value={data.description}
                                        onChange={(event) => handleFieldChange('description', event.target.value)}
                                        placeholder="Describe what happened, contributing factors, and immediate impacts."
                                        rows={5}
                                        className={`bg-white transition-all duration-200 focus:border-rose-500 focus:ring-rose-500/20 dark:bg-slate-800 ${getFieldError('description') ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20 dark:border-red-500' : 'border-slate-300 hover:border-slate-400 dark:border-slate-600 dark:hover:border-slate-500'}`}
                                    />
                                    {getFieldError('description') && (
                                        <p className="flex items-center gap-1 text-sm text-red-500">
                                            <AlertCircle className="h-3 w-3" />
                                            {getFieldError('description')}
                                        </p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="resolution" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                                        Corrective Action
                                    </Label>
                                    <Textarea
                                        id="resolution"
                                        value={data.resolution}
                                        onChange={(event) => handleFieldChange('resolution', event.target.value, false)}
                                        placeholder="Outline coaching, maintenance, or policy follow-up planned for this incident."
                                        rows={4}
                                        className={`bg-white transition-all duration-200 focus:border-rose-500 focus:ring-rose-500/20 dark:bg-slate-800 ${getFieldError('resolution') ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20 dark:border-red-500' : 'border-slate-300 hover:border-slate-400 dark:border-slate-600 dark:hover:border-slate-500'}`}
                                    />
                                    {getFieldError('resolution') && (
                                        <p className="flex items-center gap-1 text-sm text-red-500">
                                            <AlertCircle className="h-3 w-3" />
                                            {getFieldError('resolution')}
                                        </p>
                                    )}
                                </div>
                            </section>

                            <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200/70 bg-white/80 px-6 py-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/40">
                                <div className="flex flex-col gap-2 text-sm text-slate-600 dark:text-slate-400 md:flex-row md:items-center md:gap-4">
                                    <div className="flex items-center gap-2">
                                        <span className="text-red-500">*</span>
                                        <span>Required fields</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <ClipboardList className="h-3 w-3" />
                                        <span>Complete data enables proactive safety coaching and reporting.</span>
                                    </div>
                                </div>
                                <div className="flex gap-3">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        asChild
                                        className="border-slate-300 hover:bg-slate-100 dark:border-slate-600 dark:hover:bg-slate-700"
                                    >
                                        <Link href={`/driver-safety/${driverSafety.id}`}>Cancel</Link>
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={processing || hasErrors}
                                        className="bg-gradient-to-r from-rose-600 to-rose-700 px-6 text-white shadow-lg transition-all duration-200 hover:from-rose-700 hover:to-rose-800 hover:shadow-xl"
                                    >
                                        {processing ? (
                                            <>
                                                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-white" />
                                                Updating...
                                            </>
                                        ) : (
                                            <>
                                                <ShieldCheck className="mr-2 h-4 w-4" />
                                                Save Changes
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </form>
                    </CardContent>
                </Card>

                {showScrollTop && (
                    <Button
                        type="button"
                        onClick={handleScrollToTop}
                        className="fixed bottom-6 right-6 z-50 shadow-lg"
                        variant="secondary"
                        aria-label="Scroll to top"
                    >
                        <ArrowUp className="h-4 w-4" />
                    </Button>
                )}
            </div>
        </AppLayout>
    );
}

