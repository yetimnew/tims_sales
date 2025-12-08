import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import AppLayout from '@/layouts/app-layout';
import { Head, Link, router } from '@inertiajs/react';
import { type BreadcrumbItem } from '@/types';
import {
    Edit,
    Trash2,
    ArrowLeft,
    Wrench,
    Calendar,
    CalendarCheck,
    Clock,
    DollarSign,
    ClipboardList,
    User,
    AlertTriangle,
    FileText,
    Lightbulb,
} from 'lucide-react';
import { DeleteConfirmationDialog } from '@/components/delete-confirmation-dialog';
import { ActivityLogTable } from '@/components/activity-log-table';
import { useState, type ReactNode } from 'react';

interface ActivityLog {
    id: number;
    action: 'created' | 'updated' | 'deleted';
    description: string;
    user?: {
        name: string;
    };
    created_at: string;
    old_values?: Record<string, unknown>;
    new_values?: Record<string, unknown>;
}

interface Truck {
    id: number;
    plate: string;
}

interface MaintenanceType {
    id: number;
    name: string;
    category: string;
}

interface MaintenanceRecord {
    id: number;
    truck_id: number;
    maintenance_type_id: number;
    scheduled_date: string;
    completed_date?: string;
    odometer_reading?: number;
    cost?: number;
    description?: string;
    work_performed?: string;
    parts_replaced?: string;
    service_provider?: string;
    status: string;
    created_at?: string;
    updated_at?: string;
    truck?: Truck;
    maintenanceType?: MaintenanceType;
    assignedMechanic?: {
        id?: number | null;
        name?: string | null;
        email?: string | null;
    } | null;
}

interface MaintenanceShowProps {
    maintenance: MaintenanceRecord;
    activityLogs?: ActivityLog[];
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Maintenance',
        href: '/maintenance',
    },
];

export default function MaintenanceShow({ maintenance, activityLogs = [] }: MaintenanceShowProps) {
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDeleteConfirm = () => {
        setIsDeleting(true);
        router.delete(`/maintenance/${maintenance.id}`, {
            onSuccess: () => {
                setDeleteDialogOpen(false);
                setIsDeleting(false);
            },
            onError: () => {
                setIsDeleting(false);
            },
        });
    };

    const formatDate = (date?: string | null) => {
        if (!date) {
            return 'N/A';
        }

        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    const formatCurrency = (value?: number | null) => {
        if (value === null || value === undefined) {
            return 'N/A';
        }

        return `$${Number(value).toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        })}`;
    };

    const statusMeta: Record<string, { label: string; badgeClass: string; icon: ReactNode | null }> = {
        scheduled: {
            label: 'Scheduled',
            badgeClass: 'border border-blue-200 bg-blue-100 text-blue-800 hover:bg-blue-200 dark:border-blue-800 dark:bg-blue-900/40 dark:text-blue-200',
            icon: <Calendar className="h-3 w-3" />,
        },
        in_progress: {
            label: 'In Progress',
            badgeClass: 'border border-amber-200 bg-amber-100 text-amber-800 hover:bg-amber-200 dark:border-amber-800 dark:bg-amber-900/40 dark:text-amber-200',
            icon: <Wrench className="h-3 w-3" />,
        },
        completed: {
            label: 'Completed',
            badgeClass: 'border border-emerald-200 bg-emerald-100 text-emerald-800 hover:bg-emerald-200 dark:border-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200',
            icon: <ClipboardList className="h-3 w-3" />,
        },
        overdue: {
            label: 'Overdue',
            badgeClass: 'border border-red-200 bg-red-100 text-red-800 hover:bg-red-200 dark:border-red-800 dark:bg-red-900/40 dark:text-red-200',
            icon: <AlertTriangle className="h-3 w-3" />,
        },
    };

    const resolvedStatusMeta = statusMeta[maintenance.status as keyof typeof statusMeta] ?? {
        label: maintenance.status,
        badgeClass: 'border border-slate-200 bg-slate-100 text-slate-700 hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-200',
        icon: null,
    };

    const assignedMechanicName = maintenance.assignedMechanic?.name ?? 'Unassigned';

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Maintenance - ${maintenance.truck?.plate || 'Record'}`} />
            <div className="flex flex-1 min-h-0 flex-col overflow-hidden rounded-xl">
                <div className="flex-1 space-y-6 overflow-y-auto p-4">
                    <div className="rounded-lg border border-slate-200 bg-gradient-to-r from-amber-50 via-white to-blue-50 p-6 shadow-sm dark:border-slate-800 dark:from-amber-900/20 dark:via-slate-900 dark:to-blue-900/20">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => router.get('/maintenance')}
                                className="flex items-center gap-2 border-slate-300 hover:border-slate-400 hover:bg-slate-100 dark:border-slate-600 dark:hover:border-slate-500 dark:hover:bg-slate-800"
                            >
                                <ArrowLeft className="h-4 w-4" />
                                Back to Maintenance
                            </Button>
                            <div className="flex items-start gap-4">
                                <div className="rounded-xl bg-amber-100 p-3 text-amber-600 shadow-sm dark:bg-amber-900/40 dark:text-amber-300">
                                    <Wrench className="h-6 w-6" />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
                                        {maintenance.maintenanceType?.name || 'Maintenance Record'}
                                    </h1>
                                    <p className="text-sm text-muted-foreground">
                                        Linked truck: {maintenance.truck?.plate ?? 'N/A'}
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-3">
                            <Badge className={`flex items-center gap-2 px-3 py-1 text-sm font-medium ${resolvedStatusMeta.badgeClass}`}>
                                {resolvedStatusMeta.icon}
                                {resolvedStatusMeta.label}
                            </Badge>
                            <div className="flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1.5 text-sm font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                                <div className="h-2 w-2 animate-pulse rounded-full bg-emerald-500"></div>
                                Maintenance Oversight
                            </div>
                            <div className="flex gap-2">
                                <Button variant="outline" asChild className="border-slate-300 dark:border-slate-600 hover:border-blue-300 hover:bg-blue-50 dark:hover:border-blue-500 dark:hover:bg-blue-900/30">
                                    <Link href={`/maintenance/${maintenance.id}/edit`}>
                                        <Edit className="mr-2 h-4 w-4" />
                                        Edit Record
                                    </Link>
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={() => setDeleteDialogOpen(true)}
                                    className="border-red-200 text-red-600 hover:border-red-300 hover:bg-red-50 dark:border-red-800 dark:text-red-300 dark:hover:border-red-600 dark:hover:bg-red-900/20"
                                >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete
                                </Button>
                            </div>
                        </div>
                    </div>

                    <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                        <Card className="border border-amber-200/70 bg-white/80 shadow-sm backdrop-blur-sm dark:border-amber-900/50 dark:bg-amber-950/20">
                            <CardHeader className="p-3 pb-1">
                                <CardTitle className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                    Scheduled Date
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="px-3 pb-3">
                                <div className="flex items-center gap-2 text-sm font-semibold text-amber-700 dark:text-amber-200">
                                    <CalendarCheck className="h-4 w-4" />
                                    {formatDate(maintenance.scheduled_date)}
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="border border-emerald-200/70 bg-white/80 shadow-sm backdrop-blur-sm dark:border-emerald-900/40 dark:bg-emerald-950/20">
                            <CardHeader className="p-3 pb-1">
                                <CardTitle className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                    Completed Date
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="px-3 pb-3">
                                <div className="flex items-center gap-2 text-sm font-semibold text-emerald-700 dark:text-emerald-200">
                                    <Clock className="h-4 w-4" />
                                    {formatDate(maintenance.completed_date)}
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="border border-blue-200/70 bg-white/80 shadow-sm backdrop-blur-sm dark:border-blue-900/40 dark:bg-blue-950/20">
                            <CardHeader className="p-3 pb-1">
                                <CardTitle className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                    Odometer Reading
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="px-3 pb-3">
                                <div className="flex items-center gap-2 text-sm font-semibold text-blue-700 dark:text-blue-200">
                                    <span>{maintenance.odometer_reading ? `${maintenance.odometer_reading.toLocaleString()} km` : 'N/A'}</span>
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="border border-purple-200/70 bg-white/80 shadow-sm backdrop-blur-sm dark:border-purple-900/50 dark:bg-purple-950/20">
                            <CardHeader className="p-3 pb-1">
                                <CardTitle className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                    Estimated Cost
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="px-3 pb-3">
                                <div className="flex items-center gap-2 text-sm font-semibold text-purple-700 dark:text-purple-200">
                                    <DollarSign className="h-4 w-4" />
                                    {formatCurrency(maintenance.cost)}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                    <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
                    <div className="space-y-6">
                        <Card className="border-0 bg-gradient-to-br from-white via-slate-50 to-slate-100 shadow-lg dark:from-slate-900 dark:via-slate-900/60 dark:to-slate-950">
                            <CardHeader className="border-b border-slate-200/70 bg-gradient-to-r from-blue-50 via-white to-blue-100 dark:border-slate-800/70 dark:from-blue-950/20 dark:via-slate-900 dark:to-blue-900/30">
                                <CardTitle className="flex items-center gap-2 text-xl">
                                    <ClipboardList className="h-5 w-5 text-blue-600" />
                                    Maintenance Overview
                                </CardTitle>
                                <CardDescription>
                                    Schedule and categorisation details for this maintenance order
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6 p-6">
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">Status</p>
                                        <Badge className={`mt-2 flex w-fit items-center gap-2 text-sm font-medium ${resolvedStatusMeta.badgeClass}`}>
                                            {resolvedStatusMeta.icon}
                                            {resolvedStatusMeta.label}
                                        </Badge>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">Maintenance Category</p>
                                        <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
                                            {maintenance.maintenanceType?.category || 'N/A'}
                                        </p>
                                    </div>
                                </div>

                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="rounded-lg border border-slate-200 bg-white/80 p-4 text-sm shadow-sm dark:border-slate-700 dark:bg-slate-900/40">
                                        <p className="font-medium text-muted-foreground">Scheduled Date</p>
                                        <p className="mt-1 font-semibold text-slate-900 dark:text-slate-100">{formatDate(maintenance.scheduled_date)}</p>
                                    </div>
                                    <div className="rounded-lg border border-slate-200 bg-white/80 p-4 text-sm shadow-sm dark:border-slate-700 dark:bg-slate-900/40">
                                        <p className="font-medium text-muted-foreground">Completed Date</p>
                                        <p className="mt-1 font-semibold text-slate-900 dark:text-slate-100">{formatDate(maintenance.completed_date)}</p>
                                    </div>
                                </div>

                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Narrative</p>
                                    <p className="mt-2 rounded-lg border border-dashed border-amber-200 bg-amber-50/60 p-4 text-sm leading-relaxed text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-100">
                                        {maintenance.description || 'No description provided for this maintenance order.'}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-0 bg-gradient-to-br from-white via-emerald-50 to-white shadow-lg dark:from-slate-900 dark:via-emerald-900/30 dark:to-slate-950">
                            <CardHeader className="border-b border-emerald-200/70 bg-gradient-to-r from-emerald-50 via-white to-emerald-100 dark:border-emerald-900/60 dark:from-emerald-950/30 dark:via-slate-900 dark:to-emerald-900/20">
                                <CardTitle className="flex items-center gap-2 text-xl">
                                    <Wrench className="h-5 w-5 text-emerald-600" />
                                    Work Summary
                                </CardTitle>
                                <CardDescription>
                                    Breakdown of work performed and supporting notes
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6 p-6">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Work Performed</p>
                                    <p className="mt-2 rounded-lg border border-emerald-200 bg-white/80 p-4 text-sm leading-relaxed shadow-sm dark:border-emerald-900/50 dark:bg-emerald-950/20 dark:text-emerald-100">
                                        {maintenance.work_performed || 'No work details recorded.'}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Parts Replaced</p>
                                    <p className="mt-2 rounded-lg border border-emerald-200 bg-white/80 p-4 text-sm leading-relaxed shadow-sm dark:border-emerald-900/50 dark:bg-emerald-950/20 dark:text-emerald-100">
                                        {maintenance.parts_replaced || 'No parts information captured.'}
                                    </p>
                                </div>
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="rounded-lg border border-emerald-200 bg-white/80 p-4 text-sm shadow-sm dark:border-emerald-900/50 dark:bg-emerald-950/20">
                                        <p className="font-medium text-muted-foreground">Service Provider</p>
                                        <p className="mt-2 font-semibold text-slate-900 dark:text-slate-100">
                                            {maintenance.service_provider || 'Internal Workshop'}
                                        </p>
                                    </div>
                                    <div className="rounded-lg border border-emerald-200 bg-white/80 p-4 text-sm shadow-sm dark:border-emerald-900/50 dark:bg-emerald-950/20">
                                        <p className="font-medium text-muted-foreground">Assigned Mechanic</p>
                                        <p className="mt-2 flex items-center gap-2 font-semibold text-slate-900 dark:text-slate-100">
                                            <User className="h-4 w-4 text-muted-foreground" />
                                            {assignedMechanicName}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-0 bg-gradient-to-br from-white via-purple-50 to-white shadow-lg dark:from-slate-900 dark:via-purple-900/30 dark:to-slate-950">
                            <CardHeader className="border-b border-purple-200/70 bg-gradient-to-r from-purple-50 via-white to-purple-100 dark:border-purple-900/60 dark:from-purple-950/30 dark:via-slate-900 dark:to-purple-900/20">
                                <CardTitle className="flex items-center gap-2 text-xl">
                                    <DollarSign className="h-5 w-5 text-purple-600" />
                                    Financial Snapshot
                                </CardTitle>
                                <CardDescription>
                                    Cost insights and mileage tracking
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="grid gap-4 p-6 sm:grid-cols-2">
                                <div className="rounded-lg border border-purple-200 bg-white/80 p-4 text-sm shadow-sm dark:border-purple-900/60 dark:bg-purple-950/20">
                                    <p className="font-medium text-muted-foreground">Recorded Cost</p>
                                    <p className="mt-2 text-xl font-bold text-purple-700 dark:text-purple-200">{formatCurrency(maintenance.cost)}</p>
                                </div>
                                <div className="rounded-lg border border-purple-200 bg-white/80 p-4 text-sm shadow-sm dark:border-purple-900/60 dark:bg-purple-950/20">
                                    <p className="font-medium text-muted-foreground">Odometer at Service</p>
                                    <p className="mt-2 text-xl font-bold text-purple-700 dark:text-purple-200">
                                        {maintenance.odometer_reading ? `${maintenance.odometer_reading.toLocaleString()} km` : 'N/A'}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Record Information</CardTitle>
                                <CardDescription>System-generated metadata</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid gap-4 text-sm">
                                    <div>
                                        <p className="font-medium text-muted-foreground">Created</p>
                                        <p className="mt-1">{formatDate(maintenance.created_at)}</p>
                                    </div>
                                    <div>
                                        <p className="font-medium text-muted-foreground">Last Updated</p>
                                        <p className="mt-1">{formatDate(maintenance.updated_at)}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="space-y-6">
                        <Card className="border-0 bg-gradient-to-br from-white via-slate-50 to-slate-100 shadow-lg dark:from-slate-900 dark:via-slate-900/60 dark:to-slate-950">
                            <CardHeader className="border-b border-slate-200/70 bg-gradient-to-r from-slate-50 via-white to-slate-100 dark:border-slate-800/70 dark:from-slate-950/30 dark:via-slate-900 dark:to-slate-900/20">
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <FileText className="h-4 w-4 text-slate-600" />
                                    Quick Reference
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4 p-5 text-sm">
                                <div className="rounded-lg border border-slate-200 bg-white/90 p-4 dark:border-slate-700 dark:bg-slate-900/40">
                                    <p className="font-medium text-muted-foreground">Linked Truck</p>
                                    <Link
                                        href={`/trucks/${maintenance.truck_id}`}
                                        className="mt-2 inline-flex items-center gap-2 text-lg font-mono font-semibold text-blue-600 hover:underline dark:text-blue-400"
                                    >
                                        <Wrench className="h-4 w-4 text-muted-foreground" />
                                        {maintenance.truck?.plate || 'N/A'}
                                    </Link>
                                </div>
                                <div className="rounded-lg border border-slate-200 bg-white/90 p-4 dark:border-slate-700 dark:bg-slate-900/40">
                                    <p className="font-medium text-muted-foreground">Maintenance Type</p>
                                    <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
                                        {maintenance.maintenanceType?.name || 'N/A'}
                                    </p>
                                </div>
                                <div className="rounded-lg border border-slate-200 bg-white/90 p-4 dark:border-slate-700 dark:bg-slate-900/40">
                                    <p className="font-medium text-muted-foreground">Created</p>
                                    <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
                                        {formatDate(maintenance.created_at)}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-0 bg-gradient-to-br from-white via-blue-50 to-white shadow-lg dark:from-slate-900 dark:via-blue-900/30 dark:to-slate-950">
                            <CardHeader className="border-b border-blue-200/70 bg-gradient-to-r from-blue-50 via-white to-blue-100 dark:border-blue-900/60 dark:from-blue-950/30 dark:via-slate-900 dark:to-blue-900/20">
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <Lightbulb className="h-4 w-4 text-blue-600" />
                                    Next Actions
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3 p-5 text-sm">
                                <p className="rounded-lg border border-blue-200 bg-white/80 p-4 dark:border-blue-900/60 dark:bg-blue-950/20">
                                    - Review upcoming preventative maintenance for this truck.
                                </p>
                                <p className="rounded-lg border border-blue-200 bg-white/80 p-4 dark:border-blue-900/60 dark:bg-blue-950/20">
                                    - Confirm parts availability for the next service interval.
                                </p>
                                <p className="rounded-lg border border-blue-200 bg-white/80 p-4 dark:border-blue-900/60 dark:bg-blue-950/20">
                                    - Capture photo or documentation evidence if applicable.
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                    <Card>
                        <CardHeader>
                            <CardTitle>Activity History</CardTitle>
                            <CardDescription>Audit trail for this maintenance record</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {activityLogs && activityLogs.length > 0 ? (
                                <ActivityLogTable logs={activityLogs} />
                            ) : (
                                <div className="py-8 text-center text-sm text-muted-foreground">
                                    No activity recorded for this maintenance item yet.
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Delete Confirmation Dialog */}
            <DeleteConfirmationDialog
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
                title="Delete Maintenance Record"
                description="Are you sure you want to delete this maintenance record? This action cannot be undone."
                itemName={`${maintenance.maintenanceType?.name || 'Record'} for ${maintenance.truck?.plate || 'Truck'}`}
                onConfirm={handleDeleteConfirm}
                isLoading={isDeleting}
            />
        </AppLayout>
    );
}
