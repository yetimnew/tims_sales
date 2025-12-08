import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import AppLayout from '@/layouts/app-layout';
import { Head, Link, router } from '@inertiajs/react';
import { type BreadcrumbItem } from '@/types';
import {
    Activity,
    AlertTriangle,
    ArrowLeft,
    CalendarDays,
    Clock,
    DollarSign,
    FileText,
    MapPin,
    NotebookPen,
    Shield,
    ShieldAlert,
    ShieldCheck,
    SquarePen,
    Trash2,
    Users,
} from 'lucide-react';
import { usePermissions } from '@/hooks/use-permissions';
import { useMemo, useState } from 'react';
import { DeleteConfirmationDialog } from '@/components/delete-confirmation-dialog';
import { useToast } from '@/hooks/use-toast';
import { ActivityLogTable } from '@/components/activity-log-table';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Driver Safety',
        href: '/driver-safety',
    },
    {
        title: 'View',
        href: '#',
    },
];

interface Driver {
    id: number;
    name: string;
}

interface User {
    id: number;
    name: string;
}

interface ActivityLog {
    id: number;
    description: string;
    event: string;
    created_at: string;
    causer?: User;
    properties?: {
        old?: Record<string, unknown>;
        attributes?: Record<string, unknown>;
        [key: string]: unknown;
    } | null;
}

interface SafetyRecord {
    id: number;
    driver_id: number;
    driver?: Driver;
    incident_date: string;
    incident_type: string;
    severity: string;
    description: string;
    damage_cost?: number;
    location?: string;
    resolution?: string;
    created_at: string;
    updated_at: string;
}

interface DriverSafetyShowProps {
    driverSafety: SafetyRecord;
    activityLogs?: ActivityLog[];
}

const formatDate = (value?: string | null) => {
    if (!value) {
        return 'Not recorded';
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return 'Not recorded';
    }

    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
};

const formatDateTime = (value?: string | null) => {
    if (!value) {
        return 'Not recorded';
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return 'Not recorded';
    }

    return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
};

const formatCurrency = (value?: number | null) => {
    if (typeof value !== 'number' || Number.isNaN(value)) {
        return 'ETB 0.00';
    }

    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'ETB',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(value);
};

const getSeverityBadgeClass = (severity: string) => {
    const normalized = severity.toLowerCase();
    if (normalized === 'critical') {
        return 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300';
    }
    if (normalized === 'major') {
        return 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300';
    }
    if (normalized === 'minor') {
        return 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300';
    }
    return 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800/40 dark:text-slate-300';
};

const getIncidentTypeBadgeClass = (incidentType: string) => {
    const normalized = incidentType.toLowerCase();
    if (normalized === 'accident') {
        return 'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-300';
    }
    if (normalized === 'violation') {
        return 'bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300';
    }
    if (normalized === 'warning') {
        return 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300';
    }
    return 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800/40 dark:text-slate-300';
};

export default function DriverSafetyShow({ driverSafety, activityLogs = [] }: DriverSafetyShowProps) {
    const { hasPermission } = usePermissions();
    const { toast } = useToast();
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const severityLabel = driverSafety.severity
        ? driverSafety.severity.charAt(0).toUpperCase() + driverSafety.severity.slice(1)
        : 'Unknown';
    const incidentLabel = driverSafety.incident_type
        ? driverSafety.incident_type.charAt(0).toUpperCase() + driverSafety.incident_type.slice(1)
        : 'Unknown';

    const activityLogRows = useMemo(() => {
        return (activityLogs ?? []).map((log) => ({
            id: log.id,
            action: log.event ?? 'updated',
            description: log.description,
            user: {
                name: log.causer?.name ?? 'System',
            },
            created_at: log.created_at,
            old_values: log.properties?.old,
            new_values: log.properties?.attributes,
        }));
    }, [activityLogs]);

    const handleDelete = () => {
        setIsDeleting(true);
        router.delete(`/driver-safety/${driverSafety.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                setDeleteDialogOpen(false);
                setIsDeleting(false);
                toast({
                    title: 'Safety record deleted',
                    description: 'The incident has been removed successfully.',
                });
            },
            onError: (errors) => {
                setIsDeleting(false);
                const description = errors && typeof errors === 'object'
                    ? Object.values(errors as Record<string, unknown>)
                        .flatMap((value) => (Array.isArray(value) ? value : [value]))
                        .filter((value): value is string => typeof value === 'string')
                        .join('\n')
                    : 'We could not delete this safety record. Please review any blockers and try again.';
                toast({
                    title: 'Delete failed',
                    description,
                    variant: 'destructive',
                });
            },
        });
    };

    const detailTiles = [
        {
            title: 'Incident Type',
            icon: <AlertTriangle className="h-4 w-4 text-rose-600" />,
            content: (
                <Badge className={`border ${getIncidentTypeBadgeClass(driverSafety.incident_type ?? '')}`}>
                    {incidentLabel}
                </Badge>
            ),
        },
        {
            title: 'Severity',
            icon: <ShieldAlert className="h-4 w-4 text-amber-600" />,
            content: (
                <Badge className={`border ${getSeverityBadgeClass(driverSafety.severity ?? '')}`}>
                    {severityLabel}
                </Badge>
            ),
        },
        {
            title: 'Damage Cost',
            icon: <DollarSign className="h-4 w-4 text-purple-600" />,
            content: <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">{formatCurrency(driverSafety.damage_cost)}</span>,
        },
        {
            title: 'Recorded On',
            icon: <CalendarDays className="h-4 w-4 text-blue-600" />,
            content: <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">{formatDate(driverSafety.incident_date)}</span>,
        },
    ];

    const metadata = [
        {
            label: 'Driver',
            value: driverSafety.driver?.name ?? 'Not assigned',
            icon: Users,
        },
        {
            label: 'Incident Location',
            value: driverSafety.location ?? 'Not specified',
            icon: MapPin,
        },
        {
            label: 'Created at',
            value: formatDateTime(driverSafety.created_at),
            icon: Clock,
        },
        {
            label: 'Last updated',
            value: formatDateTime(driverSafety.updated_at),
            icon: ShieldCheck,
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Safety Record #${driverSafety.id}`} />
            <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-hidden rounded-xl p-4">
                <div className="rounded-2xl border border-slate-200/70 bg-gradient-to-r from-slate-50 via-white to-rose-50/60 p-6 shadow-sm dark:border-slate-800/70 dark:from-slate-900 dark:via-slate-950 dark:to-rose-950/20">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => router.get('/driver-safety')}
                                className="w-fit gap-2 border border-slate-200 bg-white/80 px-3 py-1.5 text-sm text-slate-600 shadow-sm transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-300 dark:hover:bg-slate-800"
                            >
                                <ArrowLeft className="h-4 w-4" />
                                Back to Safety Log
                            </Button>
                            <div className="flex items-center gap-3">
                                <div className="rounded-xl bg-rose-100 p-3 text-rose-600 shadow-sm dark:bg-rose-900/30 dark:text-rose-300">
                                    <Shield className="h-6 w-6" />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
                                        Safety Record #{driverSafety.id}
                                    </h1>
                                    <p className="text-sm text-slate-600 dark:text-slate-400">
                                        Comprehensive view of the incident involving {driverSafety.driver?.name ?? 'an unassigned driver'}.
                                    </p>
                                </div>
                            </div>
                        </div>
                        {(hasPermission('driver-safety.edit') || hasPermission('driver-safety.destroy')) && (
                            <div className="flex flex-wrap items-center gap-2">
                                {hasPermission('driver-safety.edit') && (
                                    <Button asChild variant="outline" className="gap-2 border-blue-200 text-blue-600 hover:bg-blue-50 dark:border-blue-800 dark:text-blue-200 dark:hover:bg-blue-950/40">
                                        <Link href={`/driver-safety/${driverSafety.id}/edit`}>
                                            <SquarePen className="h-4 w-4" />
                                            Edit Record
                                        </Link>
                                    </Button>
                                )}
                                {hasPermission('driver-safety.destroy') && (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setDeleteDialogOpen(true)}
                                        className="gap-2 border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-300 dark:hover:bg-red-950/40"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                        Delete Record
                                    </Button>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    {detailTiles.map((tile) => (
                        <Card key={tile.title} className="border border-slate-200/70 shadow-sm transition hover:border-rose-200 hover:shadow-md dark:border-slate-800/70 dark:hover:border-rose-700/60">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 px-4 py-3">
                                <CardTitle className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                    {tile.title}
                                </CardTitle>
                                {tile.icon}
                            </CardHeader>
                            <CardContent className="px-4 pb-4 pt-0">
                                {tile.content}
                            </CardContent>
                        </Card>
                    ))}
                </div>

                <div className="grid gap-6 lg:grid-cols-3">
                    <Card className="lg:col-span-2 border border-slate-200/70 shadow-sm dark:border-slate-800/70">
                        <CardHeader className="border-b border-slate-200/70 bg-slate-50/70 dark:border-slate-800/60 dark:bg-slate-900/40">
                            <div className="flex items-center gap-2">
                                <FileText className="h-4 w-4 text-rose-600" />
                                <CardTitle className="text-lg">Incident Narrative</CardTitle>
                            </div>
                            <CardDescription>Detailed context describing what occurred</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6 py-6 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                            <div>
                                <h3 className="mb-2 text-sm font-semibold text-slate-800 dark:text-slate-200">Description</h3>
                                <p className="whitespace-pre-wrap rounded-lg border border-slate-200/60 bg-white/80 p-4 text-sm shadow-sm dark:border-slate-800/60 dark:bg-slate-900/50">
                                    {driverSafety.description || 'No description provided.'}
                                </p>
                            </div>
                            <div>
                                <h3 className="mb-2 text-sm font-semibold text-slate-800 dark:text-slate-200">Resolution &amp; Follow-up</h3>
                                <p className="whitespace-pre-wrap rounded-lg border border-slate-200/60 bg-white/80 p-4 text-sm shadow-sm dark:border-slate-800/60 dark:bg-slate-900/50">
                                    {driverSafety.resolution || 'No corrective action has been documented yet.'}
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border border-slate-200/70 shadow-sm dark:border-slate-800/70">
                        <CardHeader className="border-b border-slate-200/70 bg-slate-50/70 dark:border-slate-800/60 dark:bg-slate-900/40">
                            <div className="flex items-center gap-2">
                                <NotebookPen className="h-4 w-4 text-blue-600" />
                                <CardTitle className="text-lg">Quick Reference</CardTitle>
                            </div>
                            <CardDescription>Key attributes for this safety incident</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4 py-6">
                            {metadata.map((item) => (
                                <div key={item.label} className="flex items-start gap-3 rounded-lg border border-slate-200/60 bg-white/80 p-3 shadow-sm dark:border-slate-800/60 dark:bg-slate-900/50">
                                    <item.icon className="mt-0.5 h-4 w-4 text-slate-500 dark:text-slate-400" />
                                    <div>
                                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                            {item.label}
                                        </p>
                                        <p className="text-sm font-medium text-slate-900 dark:text-slate-200">
                                            {item.value}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </div>

                {activityLogRows.length > 0 && (
                    <Card className="border border-slate-200/70 shadow-sm dark:border-slate-800/70">
                        <CardHeader className="border-b border-slate-200/70 bg-slate-50/70 dark:border-slate-800/60 dark:bg-slate-900/40">
                            <div className="flex items-center gap-2">
                                <Activity className="h-4 w-4 text-slate-600" />
                                <CardTitle className="text-lg">Activity Log</CardTitle>
                            </div>
                            <CardDescription>Recent actions and updates for this record</CardDescription>
                        </CardHeader>
                        <CardContent className="p-4">
                            <ActivityLogTable logs={activityLogRows} />
                        </CardContent>
                    </Card>
                )}
            </div>

            <DeleteConfirmationDialog
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
                title="Delete Safety Record"
                description={`Are you sure you want to delete this safety record for ${driverSafety.driver?.name ?? 'this driver'}? This action cannot be undone.`}
                itemName={`Safety Record #${driverSafety.id}`}
                onConfirm={handleDelete}
                isLoading={isDeleting}
            />
        </AppLayout>
    );
}

