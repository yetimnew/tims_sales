import { useMemo, useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { ArrowLeft, BadgeCheck, CalendarClock, CircleAlert } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Maintenance', href: '/maintenance' },
    { title: 'Edit', href: '#' },
];

interface MaintenanceRecord {
    id: number;
    truck_id: number;
    maintenance_type_id: number;
    scheduled_date: string;
    completed_date?: string | null;
    odometer_reading?: number | null;
    cost?: string | number | null;
    description?: string | null;
    work_performed?: string | null;
    parts_replaced?: string | null;
    service_provider?: string | null;
    assigned_mechanic_id?: number | string | null;
    status: 'scheduled' | 'in_progress' | 'completed' | 'overdue';
}

interface MaintenanceEditProps {
    maintenance: MaintenanceRecord;
    trucks: Array<{ id: number; plate: string }>;
    maintenanceTypes: Array<{ id: number; name: string }>;
}

type EditableField =
    | 'truck_id'
    | 'maintenance_type_id'
    | 'scheduled_date'
    | 'completed_date'
    | 'odometer_reading'
    | 'cost'
    | 'status';

export default function MaintenanceEdit({ maintenance, trucks, maintenanceTypes }: MaintenanceEditProps) {
    const { toast } = useToast();
    const { data, setData, put, processing, errors } = useForm({
        truck_id: maintenance.truck_id.toString(),
        maintenance_type_id: maintenance.maintenance_type_id.toString(),
        scheduled_date: maintenance.scheduled_date ?? '',
        completed_date: maintenance.completed_date ?? '',
        odometer_reading: maintenance.odometer_reading ? maintenance.odometer_reading.toString() : '',
        cost: maintenance.cost ? maintenance.cost.toString() : '',
        description: maintenance.description ?? '',
        work_performed: maintenance.work_performed ?? '',
        parts_replaced: maintenance.parts_replaced ?? '',
        service_provider: maintenance.service_provider ?? '',
        assigned_mechanic_id: maintenance.assigned_mechanic_id ? maintenance.assigned_mechanic_id.toString() : '',
        status: maintenance.status,
    });

    const [frontendErrors, setFrontendErrors] = useState<Record<string, string>>({});

    const scheduledDateLabel = data.scheduled_date
        ? new Date(data.scheduled_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
        : 'Not scheduled';
    const completedDateLabel = data.completed_date
        ? new Date(data.completed_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
        : 'Pending completion';

    const activeTruckPlate = useMemo(() => {
        const truck = trucks.find(item => item.id.toString() === data.truck_id);
        return truck ? truck.plate : 'Unknown truck';
    }, [data.truck_id, trucks]);

        const getValidationMessage = (field: EditableField, value: string): string => {
            switch (field) {
                case 'truck_id':
                    return value ? '' : 'Truck is required';
                case 'maintenance_type_id':
                    return value ? '' : 'Maintenance type is required';
                case 'scheduled_date':
                    return value ? '' : 'Scheduled date is required';
                case 'completed_date':
                    if (!value) {
                        return data.status === 'completed' ? 'Completion date required when status is completed' : '';
                    }
                    if (data.scheduled_date) {
                        const scheduled = new Date(data.scheduled_date);
                        const completed = new Date(value);
                        if (completed < scheduled) {
                            return 'Completion cannot precede the scheduled date';
                        }
                    }
                    return '';
                case 'odometer_reading':
                    if (!value) return '';
                    return Number.isNaN(Number(value)) || Number(value) < 0 ? 'Odometer reading must be zero or positive' : '';
                case 'cost':
                    if (!value) return '';
                    return Number.isNaN(Number(value)) || Number(value) < 0 ? 'Cost must be zero or positive' : '';
                case 'status':
                    return ['scheduled', 'in_progress', 'completed', 'overdue'].includes(value) ? '' : 'Select a valid status';
                default:
                    return '';
            }
        };

        const getFieldError = (field: keyof typeof data) => frontendErrors[field] || (errors[field] as string | undefined);
        const hasErrors = Object.keys(frontendErrors).length > 0 || Object.keys(errors).length > 0;

        const updateFrontendError = (field: EditableField, value: string) => {
            const message = getValidationMessage(field, value);
            setFrontendErrors(prev => {
                const next = { ...prev };
                if (message) {
                    next[field] = message;
                } else {
                    delete next[field];
                }
                return next;
            });
            return message;
        };

        const handleChange = (field: EditableField, value: string) => {
            setData(field, value);
            updateFrontendError(field, value);
        };

        const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
            event.preventDefault();

            const pendingErrors: Record<string, string> = {};
            const fieldsToValidate: EditableField[] = ['truck_id', 'maintenance_type_id', 'scheduled_date', 'status', 'completed_date', 'odometer_reading', 'cost'];

            fieldsToValidate.forEach(field => {
                const value = data[field as keyof typeof data] as string;
                const message = getValidationMessage(field, value);
                if (message) {
                    pendingErrors[field] = message;
                }
            });

                if (Object.keys(pendingErrors).length > 0) {
                    setFrontendErrors(pendingErrors);
                toast({
                    title: 'Validation error',
                    description: 'Resolve highlighted fields before saving updates.',
                    variant: 'destructive',
                });
                return;
            }

                setFrontendErrors({});

            put(`/maintenance/${maintenance.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                toast({
                    title: 'Maintenance updated',
                    description: 'The maintenance record has been updated.',
                });
            },
            onError: () => {
                toast({
                    title: 'Update failed',
                    description: 'Could not update maintenance record. Review and try again.',
                    variant: 'destructive',
                });
            },
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Edit Maintenance" />
            <form onSubmit={handleSubmit} className="space-y-6 rounded-xl p-4">
                <div className="rounded-lg border border-slate-200 bg-gradient-to-r from-slate-50 to-sky-50 p-6 shadow-sm dark:border-slate-700 dark:from-slate-900 dark:to-sky-950/30">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="flex flex-wrap items-center gap-4">
                            <Button variant="outline" size="sm" asChild className="flex items-center gap-2">
                                <Link href="/maintenance">
                                    <ArrowLeft className="h-4 w-4" />
                                    Back to maintenance
                                </Link>
                            </Button>
                            <div className="flex items-center gap-4">
                                <div className="rounded-xl bg-sky-100 p-3 dark:bg-sky-900/40">
                                    <BadgeCheck className="h-6 w-6 text-sky-700 dark:text-sky-200" />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Update Maintenance</h1>
                                    <p className="text-sm text-slate-600 dark:text-slate-400">Keep service history accurate for {activeTruckPlate}.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="mt-4 grid gap-4 sm:grid-cols-3">
                        <div className="rounded-lg border border-sky-200 bg-white/90 p-4 shadow-sm dark:border-sky-900/40 dark:bg-sky-950/20">
                            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Scheduled</p>
                            <p className="mt-1 flex items-center gap-2 text-lg font-semibold text-sky-700 dark:text-sky-200">
                                <CalendarClock className="h-4 w-4" />
                                {scheduledDateLabel}
                            </p>
                            <p className="text-xs text-muted-foreground">Original target date</p>
                        </div>
                        <div className="rounded-lg border border-emerald-200 bg-white/90 p-4 shadow-sm dark:border-emerald-900/40 dark:bg-emerald-950/20">
                            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Completion</p>
                            <p className="mt-1 text-lg font-semibold text-emerald-700 dark:text-emerald-200">{completedDateLabel}</p>
                            <p className="text-xs text-muted-foreground">Update when work is finished</p>
                        </div>
                        <div className="rounded-lg border border-slate-200 bg-white/90 p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900/40">
                            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Current status</p>
                            <p className="mt-1 text-lg font-semibold capitalize text-slate-900 dark:text-slate-100">{data.status.replace('_', ' ')}</p>
                            <p className="text-xs text-muted-foreground">Adjust as work progresses</p>
                        </div>
                    </div>
                </div>

                {hasErrors && (
                    <Alert variant="destructive" className="border border-destructive/40 bg-destructive/10">
                        <div className="flex items-start gap-3">
                            <CircleAlert className="mt-0.5 h-5 w-5 flex-shrink-0" />
                            <AlertDescription className="text-sm">
                                Resolve the highlighted fields before saving the maintenance record.
                            </AlertDescription>
                        </div>
                    </Alert>
                )}

                <Card className="border-0 shadow-lg">
                    <CardHeader>
                        <CardTitle>Scheduled details</CardTitle>
                        <CardDescription>Update planning information and assignments.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="truck_id">Truck *</Label>
                                <Select value={data.truck_id} onValueChange={value => handleChange('truck_id', value)}>
                                    <SelectTrigger id="truck_id" className={getFieldError('truck_id') ? 'border-red-500' : ''}>
                                        <SelectValue placeholder="Select truck" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {trucks.map(truck => (
                                            <SelectItem key={truck.id} value={truck.id.toString()}>
                                                {truck.plate}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {getFieldError('truck_id') && <p className="text-sm text-destructive">{getFieldError('truck_id')}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="maintenance_type_id">Maintenance type *</Label>
                                <Select
                                    value={data.maintenance_type_id}
                                    onValueChange={value => handleChange('maintenance_type_id', value)}
                                >
                                    <SelectTrigger
                                        id="maintenance_type_id"
                                        className={getFieldError('maintenance_type_id') ? 'border-red-500' : ''}
                                    >
                                        <SelectValue placeholder="Select maintenance type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {maintenanceTypes.map(type => (
                                            <SelectItem key={type.id} value={type.id.toString()}>
                                                {type.name}
                                            </SelectItem>
                                        ))}
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
                                    onChange={event => handleChange('scheduled_date', event.target.value)}
                                    className={getFieldError('scheduled_date') ? 'border-red-500' : ''}
                                />
                                {getFieldError('scheduled_date') && (
                                    <p className="text-sm text-destructive">{getFieldError('scheduled_date')}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="status">Status *</Label>
                                <Select value={data.status} onValueChange={value => handleChange('status', value)}>
                                    <SelectTrigger id="status" className={getFieldError('status') ? 'border-red-500' : ''}>
                                        <SelectValue placeholder="Select status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="scheduled">Scheduled</SelectItem>
                                        <SelectItem value="in_progress">In progress</SelectItem>
                                        <SelectItem value="completed">Completed</SelectItem>
                                        <SelectItem value="overdue">Overdue</SelectItem>
                                    </SelectContent>
                                </Select>
                                {getFieldError('status') && <p className="text-sm text-destructive">{getFieldError('status')}</p>}
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
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="service_provider">Service provider (optional)</Label>
                                <Input
                                    id="service_provider"
                                    value={data.service_provider}
                                    onChange={event => setData('service_provider', event.target.value)}
                                    placeholder="External workshop"
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-lg">
                    <CardHeader>
                        <CardTitle>Completion & cost</CardTitle>
                        <CardDescription>Capture executed work details for audit history.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="completed_date">Completed date</Label>
                                <Input
                                    id="completed_date"
                                    type="date"
                                    value={data.completed_date}
                                    onChange={event => handleChange('completed_date', event.target.value)}
                                    className={getFieldError('completed_date') ? 'border-red-500' : ''}
                                />
                                {getFieldError('completed_date') && (
                                    <p className="text-sm text-destructive">{getFieldError('completed_date')}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="odometer_reading">Odometer reading (km)</Label>
                                <Input
                                    id="odometer_reading"
                                    type="number"
                                    min="0"
                                    value={data.odometer_reading}
                                    onChange={event => handleChange('odometer_reading', event.target.value)}
                                    className={getFieldError('odometer_reading') ? 'border-red-500' : ''}
                                />
                                {getFieldError('odometer_reading') && (
                                    <p className="text-sm text-destructive">{getFieldError('odometer_reading')}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="cost">Cost (ETB)</Label>
                                <Input
                                    id="cost"
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={data.cost}
                                    onChange={event => handleChange('cost', event.target.value)}
                                    className={getFieldError('cost') ? 'border-red-500' : ''}
                                />
                                {getFieldError('cost') && <p className="text-sm text-destructive">{getFieldError('cost')}</p>}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="work_performed">Work performed</Label>
                            <Textarea
                                id="work_performed"
                                rows={3}
                                value={data.work_performed}
                                onChange={event => setData('work_performed', event.target.value)}
                                placeholder="Summarize the maintenance tasks completed."
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="parts_replaced">Parts replaced</Label>
                            <Textarea
                                id="parts_replaced"
                                rows={3}
                                value={data.parts_replaced}
                                onChange={event => setData('parts_replaced', event.target.value)}
                                placeholder="List parts or consumables used."
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Notes</Label>
                            <Textarea
                                id="description"
                                rows={4}
                                value={data.description}
                                onChange={event => setData('description', event.target.value)}
                                placeholder="Diagnostics, follow-up actions, or additional notes."
                            />
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                            <Button type="submit" disabled={processing}>
                                {processing ? 'Updating...' : 'Update maintenance'}
                            </Button>
                            <Button type="button" variant="outline" asChild>
                                <Link href="/maintenance">Cancel</Link>
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </form>
        </AppLayout>
    );
}
