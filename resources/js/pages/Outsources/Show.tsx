import { useMemo, useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { DeleteConfirmationDialog } from '@/components/delete-confirmation-dialog';
import { usePermissions } from '@/hooks/use-permissions';
import {
    Activity,
    ArrowLeft,
    BarChart3,
    Building2,
    CalendarClock,
    CheckCircle,
    CircleDot,
    DollarSign,
    Edit,
    Mail,
    MapPin,
    Phone,
    Route,
    Trash2,
    UserRound,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface OutsourceResource {
    id: number;
    name: string;
    contact_person: string | null;
    phone: string | null;
    email: string | null;
    address: string | null;
    service_type: string | null;
    status: string | null;
    outsource_performances_count: number | null;
    created_at: string | null;
    updated_at: string | null;
}

interface OutsourceMetrics {
    totalTrips: number;
    activeTrips: number;
    totalDistance: number;
    totalCost: number;
}

interface RecentPerformance {
    id: number;
    trip_number: string | null;
    dispatch_date: string | null;
    status: string | null;
    distance_km: number | null;
    cargo_volume_mt: number | null;
    cost: number | null;
    from_place: string | null;
    to_place: string | null;
}

interface OutsourcesShowProps {
    outsource: OutsourceResource;
    metrics: OutsourceMetrics;
    recentPerformances: RecentPerformance[];
}

const formatCurrency = (value: number | null | undefined) => {
    if (value === null || value === undefined || Number.isNaN(value)) {
        return '—';
    }

    return new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 2,
    }).format(value);
};

const formatDistance = (value: number | null | undefined) => {
    if (value === null || value === undefined || Number.isNaN(value)) {
        return '—';
    }

    return `${Number(value).toLocaleString(undefined, { maximumFractionDigits: 1 })} km`;
};

const formatVolume = (value: number | null | undefined) => {
    if (value === null || value === undefined || Number.isNaN(value)) {
        return '—';
    }

    return `${Number(value).toLocaleString(undefined, { maximumFractionDigits: 1 })} MT`;
};

const formatDate = (value: string | null | undefined) => {
    if (!value) {
        return '—';
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return '—';
    }

    return date.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
};

const formatDateTime = (value: string | null | undefined) => {
    if (!value) {
        return '—';
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return '—';
    }

    return date.toLocaleString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
};

const formatStatus = (status: string | null | undefined) => {
    if (!status) {
        return 'Unknown';
    }

    return status
        .replace(/_/g, ' ')
        .toLowerCase()
        .split(' ')
        .map(chunk => chunk.charAt(0).toUpperCase() + chunk.slice(1))
        .join(' ');
};

const getStatusBadgeClasses = (status: string | null | undefined) => {
    switch (status) {
        case 'active':
            return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300';
        case 'inactive':
            return 'bg-slate-200 text-slate-700 dark:bg-slate-800/50 dark:text-slate-300';
        default:
            return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
    }
};

const getTripStatusClasses = (status: string | null | undefined) => {
    switch (status) {
        case 'completed':
            return 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300';
        case 'active':
        case 'in-progress':
            return 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300';
        case 'cancelled':
        case 'cancelled_by_vendor':
            return 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300';
        default:
            return 'bg-slate-200 text-slate-700 dark:bg-slate-800/50 dark:text-slate-300';
    }
};

export default function OutsourcesShow({ outsource, metrics, recentPerformances }: OutsourcesShowProps) {
    const breadcrumbs = useMemo<BreadcrumbItem[]>(
        () => [
            { title: 'Outsourcing', href: '/outsources' },
            { title: outsource.name || `Vendor ${outsource.id}`, href: `/outsources/${outsource.id}` },
        ],
        [outsource.id, outsource.name],
    );
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const { hasPermission } = usePermissions();

    type StatCard = {
        title: string;
        value: number | string;
        icon: LucideIcon;
        description: string;
    };

    const statCards = useMemo(
        () => [
            {
                title: 'Total Trips',
                value: metrics.totalTrips,
                icon: Route,
                description: 'Cumulative trips executed with this partner.',
            },
            {
                title: 'Active Trips',
                value: metrics.activeTrips,
                icon: Activity,
                description: 'Currently monitored trips in progress.',
            },
            {
                title: 'Distance Covered',
                value: formatDistance(metrics.totalDistance),
                icon: BarChart3,
                description: 'Kilometers logged across dispatches.',
            },
            {
                title: 'Total Spend',
                value: formatCurrency(metrics.totalCost),
                icon: DollarSign,
                description: 'Aggregate cost allocation to this vendor.',
            },
        ] satisfies StatCard[],
        [metrics.totalTrips, metrics.activeTrips, metrics.totalDistance, metrics.totalCost]
    );

    const canUpdate = hasPermission('outsources.update');
    const canDelete = hasPermission('outsources.destroy');

    const handleDeleteConfirm = () => {
        setIsDeleting(true);
        router.delete(`/outsources/${outsource.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                setDeleteDialogOpen(false);
            },
            onFinish: () => {
                setIsDeleting(false);
            },
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Vendor Overview - ${outsource.name}`} />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-y-auto rounded-xl p-4">
                <div className="flex flex-col gap-6 rounded-2xl border border-slate-200/70 bg-white/95 p-6 shadow-lg backdrop-blur dark:border-slate-800/60 dark:bg-slate-900/75">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex flex-col gap-4">
                            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                                <Button variant="ghost" size="sm" asChild className="px-2">
                                    <Link href="/outsources" className="flex items-center gap-2">
                                        <ArrowLeft className="h-4 w-4" />
                                        Back to Vendors
                                    </Link>
                                </Button>
                                <span className="hidden text-slate-400 lg:inline">/</span>
                                <span>Vendor dossier & performance insight</span>
                            </div>
                            <div className="flex flex-wrap items-center gap-4">
                                <div className="flex items-center gap-3">
                                    <div className="rounded-xl bg-emerald-100 p-2 text-emerald-600 shadow-sm dark:bg-emerald-900/30 dark:text-emerald-400">
                                        <Building2 className="h-6 w-6" />
                                    </div>
                                    <div className="space-y-1">
                                        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">{outsource.name}</h1>
                                        <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                                            <Badge className={`${getStatusBadgeClasses(outsource.status)} capitalize`}>{formatStatus(outsource.status)}</Badge>
                                            {outsource.service_type && (
                                                <Badge variant="outline" className="border-emerald-400/50 bg-emerald-400/10 text-emerald-700 dark:border-emerald-400/30 dark:text-emerald-300">
                                                    {outsource.service_type}
                                                </Badge>
                                            )}
                                            <Badge variant="outline" className="border-slate-300 bg-slate-100/70 text-slate-700 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-300">
                                                {outsource.outsource_performances_count ?? 0} recorded trips
                                            </Badge>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-3">
                            {canUpdate && (
                                <Button variant="outline" asChild className="border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800">
                                    <Link href={`/outsources/${outsource.id}/edit`} className="flex items-center gap-2">
                                        <Edit className="h-4 w-4" />
                                        Edit Vendor
                                    </Link>
                                </Button>
                            )}
                            {canDelete && (
                                <Button
                                    variant="destructive"
                                    className="flex items-center gap-2"
                                    onClick={() => setDeleteDialogOpen(true)}
                                >
                                    <Trash2 className="h-4 w-4" />
                                    Delete
                                </Button>
                            )}
                        </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                        {statCards.map(card => (
                            <Card
                                key={card.title}
                                className="border border-slate-200/70 bg-white/80 shadow-sm backdrop-blur dark:border-slate-800/70 dark:bg-slate-900/60"
                            >
                                <CardHeader className="flex flex-row items-center justify-between gap-4 pb-2">
                                    <div className="space-y-1">
                                        <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-300">{card.title}</CardTitle>
                                        <p className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
                                            {typeof card.value === 'number' ? card.value.toLocaleString() : card.value}
                                        </p>
                                    </div>
                                    <div className="rounded-lg bg-emerald-100 p-2 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-300">
                                        <card.icon className="h-5 w-5" />
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-muted-foreground">{card.description}</p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-3">
                    <Card className="order-2 border border-slate-200/70 bg-white/90 shadow-sm backdrop-blur dark:border-slate-800/60 dark:bg-slate-900/60 lg:order-1 lg:col-span-2">
                        <CardHeader className="flex flex-col gap-2 pb-4">
                            <div className="flex items-center gap-3 text-sm font-medium text-slate-600 dark:text-slate-300">
                                <BarChart3 className="h-4 w-4" />
                                Recent Performance
                            </div>
                            <CardTitle className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                                Dispatch history snapshot
                            </CardTitle>
                            <CardDescription className="text-sm text-muted-foreground">
                                Track the five most recent assignments and their operational outcomes.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {recentPerformances.length === 0 ? (
                                <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300/70 bg-slate-50/70 p-10 text-center dark:border-slate-700/70 dark:bg-slate-900/40">
                                    <CircleDot className="mb-3 h-10 w-10 text-slate-300 dark:text-slate-600" />
                                    <p className="text-base font-medium text-slate-700 dark:text-slate-300">No dispatches logged yet</p>
                                    <p className="mt-1 text-sm text-muted-foreground">
                                        Once operations are recorded, they&apos;ll appear here for rapid assessment.
                                    </p>
                                </div>
                            ) : (
                                <div className="overflow-hidden rounded-xl border border-slate-200/70 dark:border-slate-800/60">
                                    <Table>
                                        <TableHeader className="bg-slate-100/70 dark:bg-slate-900/60">
                                            <TableRow className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                                                <TableHead className="whitespace-nowrap">Trip #</TableHead>
                                                <TableHead>Route</TableHead>
                                                <TableHead className="whitespace-nowrap">Dispatch Date</TableHead>
                                                <TableHead className="text-right">Distance</TableHead>
                                                <TableHead className="text-right">Cargo</TableHead>
                                                <TableHead className="text-right">Cost</TableHead>
                                                <TableHead className="whitespace-nowrap text-right">Status</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {recentPerformances.map(performance => (
                                                <TableRow key={performance.id} className="text-sm">
                                                    <TableCell className="font-medium text-slate-800 dark:text-slate-200">
                                                        {performance.trip_number ?? '—'}
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex flex-col text-xs text-muted-foreground">
                                                            <span className="font-medium text-slate-700 dark:text-slate-200">
                                                                {performance.from_place ?? '—'}
                                                                <span className="mx-1 text-slate-400">→</span>
                                                                {performance.to_place ?? '—'}
                                                            </span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>{formatDate(performance.dispatch_date)}</TableCell>
                                                    <TableCell className="text-right">{formatDistance(performance.distance_km)}</TableCell>
                                                    <TableCell className="text-right">{formatVolume(performance.cargo_volume_mt)}</TableCell>
                                                    <TableCell className="text-right">{formatCurrency(performance.cost)}</TableCell>
                                                    <TableCell className="text-right">
                                                        <Badge className={`${getTripStatusClasses(performance.status)} capitalize`}>
                                                            {formatStatus(performance.status)}
                                                        </Badge>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <div className="order-1 flex flex-col gap-6 lg:order-2">
                        <Card className="border border-slate-200/70 bg-white/90 shadow-sm backdrop-blur dark:border-slate-800/60 dark:bg-slate-900/60">
                            <CardHeader className="pb-4">
                                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                                    <UserRound className="h-4 w-4" />
                                    Contact Information
                                </div>
                                <CardTitle className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                                    Coordination details
                                </CardTitle>
                                <CardDescription className="text-sm text-muted-foreground">
                                    Keep these aligned to guarantee smooth dispatch communication.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4 text-sm">
                                <div className="space-y-1">
                                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Primary Contact</p>
                                    <p className="text-base font-medium text-slate-900 dark:text-slate-100">
                                        {outsource.contact_person ?? '—'}
                                    </p>
                                </div>
                                <Separator className="bg-slate-200 dark:bg-slate-800" />
                                <div className="flex items-start gap-3">
                                    <Phone className="mt-0.5 h-4 w-4 text-slate-400" />
                                    <div>
                                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Phone</p>
                                        <p className="text-sm text-slate-800 dark:text-slate-200">
                                            {outsource.phone ?? 'No phone on record'}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <Mail className="mt-0.5 h-4 w-4 text-slate-400" />
                                    <div>
                                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Email</p>
                                        <p className="break-all text-sm text-slate-800 dark:text-slate-200">
                                            {outsource.email ?? 'No email on record'}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <MapPin className="mt-0.5 h-4 w-4 text-slate-400" />
                                    <div>
                                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Dispatch Hub</p>
                                        <p className="text-sm text-slate-800 dark:text-slate-200">
                                            {outsource.address ?? 'No address provided'}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border border-slate-200/70 bg-white/90 shadow-sm backdrop-blur dark:border-slate-800/60 dark:bg-slate-900/60">
                            <CardHeader className="pb-4">
                                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                                    <CalendarClock className="h-4 w-4" />
                                    Record Timeline
                                </div>
                                <CardTitle className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                                    System metadata
                                </CardTitle>
                                <CardDescription className="text-sm text-muted-foreground">
                                    Audit checkpoints for this outsource vendor.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-3 text-sm">
                                <div className="flex items-start gap-3 rounded-lg border border-slate-200/70 bg-slate-50/70 p-3 dark:border-slate-800/60 dark:bg-slate-900/40">
                                    <CheckCircle className="mt-0.5 h-4 w-4 text-emerald-500" />
                                    <div>
                                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Created</p>
                                        <p className="text-sm text-slate-900 dark:text-slate-100">{formatDateTime(outsource.created_at)}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3 rounded-lg border border-slate-200/70 bg-slate-50/70 p-3 dark:border-slate-800/60 dark:bg-slate-900/40">
                                    <Activity className="mt-0.5 h-4 w-4 text-blue-500" />
                                    <div>
                                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Last Updated</p>
                                        <p className="text-sm text-slate-900 dark:text-slate-100">{formatDateTime(outsource.updated_at)}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>

            <DeleteConfirmationDialog
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
                title="Delete vendor?"
                description="This will permanently remove the vendor profile. Linked dispatch history will remain for auditing purposes."
                onConfirm={handleDeleteConfirm}
                isLoading={isDeleting}
            />
        </AppLayout>
    );
}
