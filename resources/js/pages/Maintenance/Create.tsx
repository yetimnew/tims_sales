import { useMemo, useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, CalendarCheck, ClipboardCheck, CircleAlert } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import type { BreadcrumbItem } from '@/types';
import { maintenanceValidation } from '@/lib/validation';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Maintenance', href: '/maintenance' },
    { title: 'Schedule', href: '/maintenance/create' },
];

interface MaintenanceCreateProps {
    trucks: Array<{ id: number; plate: string }>;
    maintenanceTypes: Array<{ id: number; name: string }>;
}

type MaintenanceField = 'truck_id' | 'maintenance_type_id' | 'scheduled_date';

export default function MaintenanceCreate({ trucks, maintenanceTypes }: MaintenanceCreateProps) {
    const { toast } = useToast();
    const { data, setData, post, processing, errors, reset } = useForm({
        truck_id: '',
        maintenance_type_id: '',
        scheduled_date: '',
        description: '',
        assigned_mechanic_id: '',
    });

    const [frontendErrors, setFrontendErrors] = useState<Record<string, string>>({});

    const totalActiveTrucks = useMemo(() => trucks.length, [trucks]);
    const maintenanceCatalogSize = useMemo(() => maintenanceTypes.length, [maintenanceTypes]);
    const selectedDateLabel = data.scheduled_date
        ? new Date(data.scheduled_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
        : 'Not yet scheduled';

    const validators: Record<MaintenanceField, (value: string) => string> = {
        truck_id: maintenanceValidation.truck_id,
        maintenance_type_id: maintenanceValidation.maintenance_type_id,
        scheduled_date: maintenanceValidation.scheduled_date,
    };

    const getFieldError = (field: keyof typeof data) => frontendErrors[field] || (errors[field] as string | undefined);
    const hasErrors = Object.keys(frontendErrors).length > 0 || Object.keys(errors).length > 0;

    const applyValidation = (field: MaintenanceField, value: string) => {
        setFrontendErrors(prev => {
            const next = { ...prev };
            const message = validators[field](value);
            if (message) {
                next[field] = message;
            } else {
                delete next[field];
            }
            return next;
        });
    };

    const handleSelectChange = (field: MaintenanceField, value: string) => {
        setData(field, value);
        applyValidation(field, value);
    };

    const handleDateChange = (value: string) => {
        setData('scheduled_date', value);
        applyValidation('scheduled_date', value);
    };

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const pendingErrors: Record<string, string> = {};
        (Object.keys(validators) as MaintenanceField[]).forEach(field => {
            const message = validators[field](data[field]);
            if (message) pendingErrors[field] = message;
        });

        if (Object.keys(pendingErrors).length > 0) {
            setFrontendErrors(prev => ({ ...prev, ...pendingErrors }));
            toast({
                title: 'Validation error',
                description: 'Please resolve the highlighted fields before saving.',
                variant: 'destructive',
            });
            return;
        }

        post('/maintenance', {
            preserveScroll: true,
            onSuccess: () => {
                toast({
                    title: 'Maintenance scheduled',
                    description: 'The maintenance task has been created successfully.',
                });
                reset();
                setFrontendErrors({});
            },
            onError: () => {
                toast({
                    title: 'Schedule failed',
                    description: 'Unable to save maintenance. Review the errors and retry.',
                    variant: 'destructive',
                });
            },
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Schedule Maintenance" />
            <div className="space-y-6 rounded-xl p-4">
                <div className="rounded-lg border border-slate-200 bg-gradient-to-r from-slate-50 to-amber-50 p-6 shadow-sm dark:border-slate-700 dark:from-slate-900 dark:to-amber-950/30">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="flex flex-wrap items-center gap-4">
                            <Button variant="outline" size="sm" asChild className="flex items-center gap-2">
                                <Link href="/maintenance">
                                    <ArrowLeft className="h-4 w-4" />
                                    Back to maintenance
                                </Link>
                            </Button>
                            <div className="flex items-center gap-4">
                                <div className="rounded-xl bg-amber-100 p-3 dark:bg-amber-900/40">
                                    <ClipboardCheck className="h-6 w-6 text-amber-700 dark:text-amber-200" />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Schedule Maintenance</h1>
                                    <p className="text-sm text-slate-600 dark:text-slate-400">
                                        Assign preventative work before issues escalate.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="mt-4 grid gap-4 sm:grid-cols-3">
                        <div className="rounded-lg border border-amber-200 bg-white/90 p-4 shadow-sm dark:border-amber-900/40 dark:bg-amber-950/20">
                            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Active trucks</p>
                            <p className="mt-1 text-lg font-semibold text-amber-700 dark:text-amber-200">{totalActiveTrucks}</p>
                            <p className="text-xs text-muted-foreground">Available for scheduling</p>
                        </div>
                        <div className="rounded-lg border border-slate-200 bg-white/90 p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900/40">
                            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Maintenance catalog</p>
                            <p className="mt-1 text-lg font-semibold text-slate-900 dark:text-slate-100">{maintenanceCatalogSize} types</p>
                            <p className="text-xs text-muted-foreground">Standardized service templates</p>
                        </div>
                        <div className="rounded-lg border border-blue-200 bg-white/90 p-4 shadow-sm dark:border-blue-900/40 dark:bg-blue-950/30">
                            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Target date</p>
                            <p className="mt-1 flex items-center gap-2 text-lg font-semibold text-blue-700 dark:text-blue-200">
                                <CalendarCheck className="h-4 w-4" />
                                {selectedDateLabel}
                            </p>
                            <p className="text-xs text-muted-foreground">Adjust when required</p>
                        </div>
                    </div>
                </div>

                {hasErrors && (
                    <Alert variant="destructive" className="border border-destructive/40 bg-destructive/10">
                        <div className="flex items-start gap-3">
                            <CircleAlert className="mt-0.5 h-5 w-5 flex-shrink-0" />
                            <AlertDescription className="text-sm">
                                Resolve the highlighted fields to schedule this maintenance task.
                            </AlertDescription>
                        </div>
                    </Alert>
                )}

                <Card className="border-0 shadow-lg">
                    <CardHeader>
                        <CardTitle>Maintenance details</CardTitle>
                        <CardDescription>Select the asset and the maintenance template.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="truck_id">Truck *</Label>
                                    <Select value={data.truck_id} onValueChange={value => handleSelectChange('truck_id', value)}>
                                        <SelectTrigger id="truck_id" className={getFieldError('truck_id') ? 'border-red-500' : ''}>
                                            <SelectValue placeholder="Select truck" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {trucks.length > 0 ? (
                                                trucks.map(truck => (
                                                    <SelectItem key={truck.id} value={truck.id.toString()}>
                                                        {truck.plate}
                                                    </SelectItem>
                                                ))
                                            ) : (
                                                <SelectItem value="" disabled>
                                                    No active trucks available
                                                </SelectItem>
                                            )}
                                        </SelectContent>
                                    </Select>
                                    {getFieldError('truck_id') && (
                                        <p className="text-sm text-destructive">{getFieldError('truck_id')}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="maintenance_type_id">Maintenance type *</Label>
                                    <Select
                                        value={data.maintenance_type_id}
                                        onValueChange={value => handleSelectChange('maintenance_type_id', value)}
                                    >
                                        <SelectTrigger
                                            id="maintenance_type_id"
                                            className={getFieldError('maintenance_type_id') ? 'border-red-500' : ''}
                                        >
                                            <SelectValue placeholder="Select maintenance type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {maintenanceTypes.length > 0 ? (
                                                maintenanceTypes.map(type => (
                                                    <SelectItem key={type.id} value={type.id.toString()}>
                                                        {type.name}
                                                    </SelectItem>
                                                ))
                                            ) : (
                                                <SelectItem value="" disabled>
                                                    No maintenance templates configured
                                                </SelectItem>
                                            )}
                                        </SelectContent>
                                    </Select>
                                    {getFieldError('maintenance_type_id') && (
                                        <p className="text-sm text-destructive">{getFieldError('maintenance_type_id')}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="scheduled_date">Scheduled date *</Label>
                                    <Input
                                        id="scheduled_date"
                                        type="date"
                                        value={data.scheduled_date}
                                        onChange={event => handleDateChange(event.target.value)}
                                        className={getFieldError('scheduled_date') ? 'border-red-500' : ''}
                                    />
                                    {getFieldError('scheduled_date') && (
                                        <p className="text-sm text-destructive">{getFieldError('scheduled_date')}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="assigned_mechanic_id">Assigned mechanic (optional)</Label>
                                    <Input
                                        id="assigned_mechanic_id"
                                        type="text"
                                        value={data.assigned_mechanic_id}
                                        onChange={event => setData('assigned_mechanic_id', event.target.value)}
                                        placeholder="Mechanic user ID"
                                    />
                                    <p className="text-xs text-muted-foreground">Leave blank to assign later.</p>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description">Work notes</Label>
                                <Textarea
                                    id="description"
                                    value={data.description}
                                    onChange={event => setData('description', event.target.value)}
                                    placeholder="Outline the symptoms or planned tasks."
                                    rows={4}
                                />
                            </div>

                            <div className="flex flex-wrap items-center gap-3">
                                <Button type="submit" disabled={processing}>
                                    {processing ? 'Scheduling...' : 'Schedule maintenance'}
                                </Button>
                                <Button type="button" variant="outline" asChild>
                                    <Link href="/maintenance">Cancel</Link>
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
