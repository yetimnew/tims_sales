import { useMemo, useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { DeleteConfirmationDialog } from '@/components/delete-confirmation-dialog';
import { usePermissions } from '@/hooks/use-permissions';
import { useToast } from '@/hooks/use-toast';
import {
    Activity,
    ArrowLeft,
    BarChart3,
    Calendar,
    ClipboardList,
    Coins,
    Edit,
    FileText,
    MapPin,
    Navigation,
    Package,
    Trash2,
    TrendingUp,
    User,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface SimpleReference {
    id: number;
    name: string;
}

interface PerformanceResource {
    id: number;
    trip_number: string;
    dispatch_date: string | null;
    distance_km: number | null;
    cargo_volume_mt: number | null;
    tonkm: number | null;
    cost: number | null;
    remarks: string | null;
    status: string | null;
    created_at: string | null;
    updated_at: string | null;
    outsource?: SimpleReference | null;
    operation?: {
        id: number;
        label: string;
        customer?: SimpleReference | null;
    } | null;
    from_place?: SimpleReference | null;
    to_place?: SimpleReference | null;
    author?: SimpleReference | null;
}

interface VendorMetrics {
    vendorTripCount: number;
    vendorTotalDistance: number;
    vendorTotalCargo: number;
    vendorTotalTonKm: number;
    vendorTotalCost: number;
    vendorAverageTonKm: number;
    vendorAverageCost: number;
}

interface RecentTrip {
    id: number;
    trip_number: string;
    dispatch_date: string | null;
    distance_km: number | null;
    cargo_volume_mt: number | null;
    cost: number | null;
    status: string | null;
    highlight: boolean;
}

interface OutsourcePerformancesShowProps {
    performance: PerformanceResource;
    metrics: VendorMetrics;
    recentTrips: RecentTrip[];
}

const buildBreadcrumbs = (tripNumber: string, performanceId: number): BreadcrumbItem[] => [
    { title: 'Outsource Performances', href: '/outsource-performances' },
    { title: `Trip ${tripNumber}`, href: `/outsource-performances/${performanceId}` },
];

const formatNumber = (value: number | null | undefined, suffix = '', fractionDigits = 2): string => {
    if (value === null || value === undefined || Number.isNaN(value)) {
        return '—';
    }

    return `${Number(value).toLocaleString('en-US', {
        minimumFractionDigits: fractionDigits,
        maximumFractionDigits: fractionDigits,
    })}${suffix}`;
};

const formatInteger = (value: number | null | undefined): string => {
    if (value === null || value === undefined || Number.isNaN(value)) {
        return '0';
    }

    return Number(value).toLocaleString('en-US');
};

const formatCurrency = (value: number | null | undefined): string => {
    if (value === null || value === undefined || Number.isNaN(value)) {
        return '—';
    }

    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'ETB',
        maximumFractionDigits: 2,
    }).format(Number(value));
};

const formatDate = (value: string | null | undefined): string => {
    if (!value) {
        return '—';
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return '—';
    }

    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
};

const formatDateTime = (value: string | null | undefined): string => {
    if (!value) {
        return '—';
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return '—';
    }

    return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
};

const formatStatus = (status: string | null | undefined): string => {
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

const getStatusBadgeClasses = (status: string | null | undefined): string => {
    switch (status) {
        case 'completed':
            return 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-600/40';
        case 'in_transit':
        case 'active':
            return 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700/40';
        case 'cancelled':
            return 'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-300 dark:border-rose-700/40';
        default:
            return 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800/50 dark:text-slate-300 dark:border-slate-700/50';
    }
};

const getTripStatusClasses = (status: string | null | undefined): string => {
    switch (status) {
        case 'completed':
            return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300';
        case 'in_transit':
        case 'active':
            return 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300';
        case 'cancelled':
            return 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300';
        default:
            return 'bg-slate-200 text-slate-700 dark:bg-slate-800/50 dark:text-slate-300';
    }
};

export default function OutsourcePerformancesShow({ performance, metrics, recentTrips }: OutsourcePerformancesShowProps) {
    const { hasPermission } = usePermissions();
    const { toast } = useToast();

    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const canEdit = hasPermission('outsource-performances.edit');
    const canDelete = hasPermission('outsource-performances.destroy');

    const breadcrumbs = useMemo(
        () => buildBreadcrumbs(performance.trip_number, performance.id),
        [performance.trip_number, performance.id],
    );

    const dispatchDateLabel = formatDate(performance.dispatch_date);
    const distanceLabel = formatNumber(performance.distance_km, ' km');
    const cargoLabel = formatNumber(performance.cargo_volume_mt, ' MT');
    const tonKmLabel = formatNumber(performance.tonkm, ' ton-km');
    const costLabel = formatCurrency(performance.cost);
    const statusLabel = formatStatus(performance.status);
    const statusClasses = getStatusBadgeClasses(performance.status);
    const routeLabel = [performance.from_place?.name, performance.to_place?.name]
        .filter(Boolean)
        .join(' → ') || 'Route not specified';
    const vendorLabel = performance.outsource?.name ?? 'Vendor not linked';
    const operationLabel = performance.operation?.label ?? 'Operation not linked';
    const customerLabel = performance.operation?.customer?.name ?? null;
    const authorLabel = performance.author?.name ?? 'System';
    const createdLabel = formatDateTime(performance.created_at);
    const updatedLabel = formatDateTime(performance.updated_at);

    type MetricCard = {
        title: string;
        value: string;
        description: string;
        icon: LucideIcon;
    };

    const metricCards = useMemo(() => {
        const resolved = metrics ?? {
            vendorTripCount: 0,
            vendorTotalDistance: 0,
            vendorTotalCargo: 0,
            vendorTotalTonKm: 0,
            vendorTotalCost: 0,
            vendorAverageTonKm: 0,
            vendorAverageCost: 0,
        } as VendorMetrics;

        return [
            {
                title: 'Vendor Trips',
                value: formatInteger(resolved.vendorTripCount),
                description: 'Total outsource runs recorded for this vendor.',
                icon: Activity,
            },
            {
                title: 'Distance Logged',
                value: formatNumber(resolved.vendorTotalDistance, ' km'),
                description: 'Kilometres travelled across all vendor assignments.',
                icon: Navigation,
            },
            {
                title: 'Cargo Moved',
                value: formatNumber(resolved.vendorTotalCargo, ' MT'),
                description: 'Aggregate tonnage delivered via this vendor.',
                icon: Package,
            },
            {
                title: 'Average Ton-Km',
                value: formatNumber(resolved.vendorAverageTonKm, ' ton-km'),
                description: 'Mean productivity per logged trip.',
                icon: TrendingUp,
            },
            {
                title: 'Total Spend',
                value: formatCurrency(resolved.vendorTotalCost),
                description: 'Cumulative payout made to the vendor.',
                icon: Coins,
            },
            {
                title: 'Average Cost',
                value: formatCurrency(resolved.vendorAverageCost),
                description: 'Typical Birr outlay per trip across history.',
                icon: BarChart3,
            },
        ] satisfies MetricCard[];
    }, [metrics]);

    const hasRecentTrips = Array.isArray(recentTrips) && recentTrips.length > 0;

    const handleDeleteConfirm = () => {
        setIsDeleting(true);
        router.delete(`/outsource-performances/${performance.id}`, {
            onSuccess: () => {
                setDeleteDialogOpen(false);
                setIsDeleting(false);
            },
            onError: (errors) => {
                setIsDeleting(false);
                if (errors && typeof errors === 'object') {
                    const message = Object.values(errors).flat().join('\n');
                    if (message) {
                        toast({
                            title: 'Delete failed',
                            description: message,
                            variant: 'destructive',
                        });
                    }
                }
            },
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Outsource Trip ${performance.trip_number}`} />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-hidden rounded-xl p-4">
                <Card className="border border-slate-200/70 bg-white/95 shadow-xl backdrop-blur dark:border-slate-800/60 dark:bg-slate-900/80">
                    <CardHeader className="flex flex-col gap-4 pb-4">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                            <div className="flex flex-col gap-3">
                                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                    <Button variant="ghost" size="sm" asChild className="px-2">
                                        <Link href="/outsource-performances" className="flex items-center gap-2">
                                            <ArrowLeft className="h-4 w-4" />
                                            Back to Trips
                                        </Link>
                                    </Button>
                                    <span className="hidden text-slate-400 lg:inline">/</span>
                                    <span>Trip detail and vendor performance context</span>
                                </div>
                                <div className="flex items-start gap-4">
                                    <div className="hidden rounded-2xl bg-blue-100 p-3 text-blue-600 shadow-sm dark:bg-blue-900/30 dark:text-blue-300 sm:block">
                                        <ClipboardList className="h-6 w-6" />
                                    </div>
                                    <div className="space-y-2">
                                        <CardTitle className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
                                            Trip {performance.trip_number}
                                        </CardTitle>
                                        <CardDescription className="text-sm text-slate-600 dark:text-slate-400">
                                            {vendorLabel} • {operationLabel}{customerLabel ? ` — ${customerLabel}` : ''}
                                        </CardDescription>
                                        <div className="flex flex-wrap items-center gap-2">
                                            <Badge variant="outline" className={`border px-3 py-1 text-xs font-semibold uppercase ${statusClasses}`}>
                                                {statusLabel}
                                            </Badge>
                                            <Badge variant="outline" className="flex items-center gap-1 border-slate-300 bg-slate-100/70 text-slate-700 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-200">
                                                <Calendar className="h-3.5 w-3.5" />
                                                {dispatchDateLabel}
                                            </Badge>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="flex flex-wrap items-center gap-3">
                                {canEdit && (
                                    <Button variant="outline" asChild className="border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800">
                                        <Link href={`/outsource-performances/${performance.id}/edit`} className="flex items-center gap-2">
                                            <Edit className="h-4 w-4" />
                                            Edit Trip
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
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid gap-6 md:grid-cols-2">
                            <div className="space-y-4">
                                <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Trip Snapshot</h2>
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="rounded-xl border border-slate-200/70 bg-white/70 p-4 shadow-sm dark:border-slate-800/60 dark:bg-slate-900/50">
                                        <div className="flex items-center gap-3">
                                            <div className="rounded-lg bg-blue-100 p-2 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300">
                                                <Navigation className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Distance</p>
                                                <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">{distanceLabel}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="rounded-xl border border-slate-200/70 bg-white/70 p-4 shadow-sm dark:border-slate-800/60 dark:bg-slate-900/50">
                                        <div className="flex items-center gap-3">
                                            <div className="rounded-lg bg-emerald-100 p-2 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-300">
                                                <Package className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Cargo Volume</p>
                                                <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">{cargoLabel}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="rounded-xl border border-slate-200/70 bg-white/70 p-4 shadow-sm dark:border-slate-800/60 dark:bg-slate-900/50">
                                        <div className="flex items-center gap-3">
                                            <div className="rounded-lg bg-indigo-100 p-2 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-300">
                                                <Activity className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Ton-Kilometres</p>
                                                <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">{tonKmLabel}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="rounded-xl border border-slate-200/70 bg-white/70 p-4 shadow-sm dark:border-slate-800/60 dark:bg-slate-900/50">
                                        <div className="flex items-center gap-3">
                                            <div className="rounded-lg bg-amber-100 p-2 text-amber-600 dark:bg-amber-900/30 dark:text-amber-300">
                                                <Coins className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Trip Cost</p>
                                                <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">{costLabel}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Operational Context</h2>
                                <div className="space-y-4 rounded-xl border border-slate-200/70 bg-white/70 p-5 shadow-sm dark:border-slate-800/60 dark:bg-slate-900/50">
                                    <div className="flex items-start gap-3">
                                        <div className="rounded-md bg-blue-100 p-1.5 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300">
                                            <MapPin className="h-4 w-4" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Route</p>
                                            <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{routeLabel}</p>
                                        </div>
                                    </div>
                                    <Separator className="bg-slate-200 dark:bg-slate-800" />
                                    <div className="space-y-3 text-sm text-slate-600 dark:text-slate-300">
                                        <div className="flex flex-col gap-0.5">
                                            <span className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Vendor</span>
                                            <span className="font-medium text-slate-900 dark:text-slate-100">{vendorLabel}</span>
                                        </div>
                                        <div className="flex flex-col gap-0.5">
                                            <span className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Operation</span>
                                            <span className="font-medium text-slate-900 dark:text-slate-100">{operationLabel}</span>
                                            {customerLabel && (
                                                <span className="text-xs text-muted-foreground">Customer • {customerLabel}</span>
                                            )}
                                        </div>
                                        <div className="flex flex-col gap-0.5">
                                            <span className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Recorded By</span>
                                            <span className="font-medium text-slate-900 dark:text-slate-100">{authorLabel}</span>
                                            <span className="text-xs text-muted-foreground">Last updated {updatedLabel}</span>
                                        </div>
                                        <div className="flex flex-col gap-0.5">
                                            <span className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Created</span>
                                            <span className="font-medium text-slate-900 dark:text-slate-100">{createdLabel}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <div className="grid gap-6 xl:grid-cols-3">
                    <Card className="border border-slate-200/70 bg-white/95 shadow-lg backdrop-blur dark:border-slate-800/60 dark:bg-slate-900/80 xl:col-span-2">
                        <CardHeader className="flex flex-col gap-2 pb-4">
                            <div className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300">
                                <BarChart3 className="h-4 w-4" />
                                Vendor Performance Metrics
                            </div>
                            <CardTitle className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                                Historical benchmarks for this outsourcing partner
                            </CardTitle>
                            <CardDescription className="text-sm text-muted-foreground">
                                Use these aggregates to gauge cost, productivity, and distance trends compared to this trip.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                                {metricCards.map(card => (
                                    <Card
                                        key={card.title}
                                        className="border border-slate-200/70 bg-white/80 shadow-sm backdrop-blur dark:border-slate-800/60 dark:bg-slate-900/60"
                                    >
                                        <CardHeader className="flex flex-row items-center justify-between gap-4 pb-2">
                                            <div className="space-y-1.5">
                                                <CardTitle className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                                                    {card.title}
                                                </CardTitle>
                                                <p className="text-xl font-semibold text-slate-900 dark:text-slate-100">{card.value}</p>
                                            </div>
                                            <div className="rounded-lg bg-slate-100 p-2 text-slate-600 dark:bg-slate-800/70 dark:text-slate-300">
                                                <card.icon className="h-5 w-5" />
                                            </div>
                                        </CardHeader>
                                        <CardContent className="pt-0">
                                            <p className="text-xs text-muted-foreground">{card.description}</p>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border border-slate-200/70 bg-white/95 shadow-lg backdrop-blur dark:border-slate-800/60 dark:bg-slate-900/80">
                        <CardHeader className="flex flex-col gap-2 pb-4">
                            <div className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300">
                                <User className="h-4 w-4" />
                                Recent Trips with This Vendor
                            </div>
                            <CardTitle className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                                Vendor activity timeline
                            </CardTitle>
                            <CardDescription className="text-sm text-muted-foreground">
                                Compare this dispatch to the most recent entries logged for the same outsource partner.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {!hasRecentTrips ? (
                                <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-slate-300/70 bg-slate-50/70 p-10 text-center dark:border-slate-700/60 dark:bg-slate-900/40">
                                    <ClipboardList className="h-10 w-10 text-slate-300 dark:text-slate-600" />
                                    <p className="text-base font-medium text-slate-700 dark:text-slate-300">No historical trips yet</p>
                                    <p className="text-sm text-muted-foreground">New outsource trips will appear here as you log them.</p>
                                </div>
                            ) : (
                                <div className="overflow-hidden rounded-xl border border-slate-200/70 dark:border-slate-800/60">
                                    <Table>
                                        <TableHeader className="bg-slate-100/70 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-900/60 dark:text-slate-400">
                                            <TableRow>
                                                <TableHead className="whitespace-nowrap">Trip #</TableHead>
                                                <TableHead className="whitespace-nowrap">Dispatch Date</TableHead>
                                                <TableHead className="text-right">Distance</TableHead>
                                                <TableHead className="text-right">Cargo</TableHead>
                                                <TableHead className="text-right">Cost</TableHead>
                                                <TableHead className="text-right">Status</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {recentTrips.map(trip => {
                                                const tripDistance = formatNumber(trip.distance_km, ' km');
                                                const tripCargo = formatNumber(trip.cargo_volume_mt, ' MT');
                                                const tripCost = formatCurrency(trip.cost);
                                                const rowClasses = trip.highlight
                                                    ? 'bg-indigo-50/70 dark:bg-indigo-900/20'
                                                    : '';

                                                return (
                                                    <TableRow key={trip.id} className={`text-sm ${rowClasses}`}>
                                                        <TableCell className="font-medium text-slate-800 dark:text-slate-200">
                                                            <Link
                                                                href={`/outsource-performances/${trip.id}`}
                                                                className="text-indigo-600 hover:underline dark:text-indigo-300"
                                                            >
                                                                {trip.trip_number}
                                                            </Link>
                                                            {trip.highlight && (
                                                                <Badge className="ml-2 bg-indigo-600 text-white hover:bg-indigo-600/90 dark:bg-indigo-500">
                                                                    Current
                                                                </Badge>
                                                            )}
                                                        </TableCell>
                                                        <TableCell>{formatDate(trip.dispatch_date)}</TableCell>
                                                        <TableCell className="text-right">{tripDistance}</TableCell>
                                                        <TableCell className="text-right">{tripCargo}</TableCell>
                                                        <TableCell className="text-right">{tripCost}</TableCell>
                                                        <TableCell className="text-right">
                                                            <Badge className={`${getTripStatusClasses(trip.status)} capitalize`}>
                                                                {formatStatus(trip.status)}
                                                            </Badge>
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })}
                                        </TableBody>
                                    </Table>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                <Card className="border border-slate-200/70 bg-white/95 shadow-lg backdrop-blur dark:border-slate-800/60 dark:bg-slate-900/80">
                    <CardHeader className="flex items-center gap-2 pb-4">
                        <FileText className="h-5 w-5 text-slate-500 dark:text-slate-300" />
                        <div>
                            <CardTitle className="text-lg font-semibold text-slate-900 dark:text-slate-100">Trip Notes</CardTitle>
                            <CardDescription className="text-sm text-muted-foreground">
                                Additional remarks captured while logging this outsourcing run.
                            </CardDescription>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {performance.remarks ? (
                            <p className="whitespace-pre-line text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                                {performance.remarks}
                            </p>
                        ) : (
                            <div className="flex items-center justify-between rounded-xl border border-dashed border-slate-300/70 bg-slate-50/70 px-4 py-6 text-sm text-muted-foreground dark:border-slate-700/70 dark:bg-slate-900/40">
                                <span>No supplementary notes were provided for this trip.</span>
                                {canEdit && (
                                    <Button asChild variant="outline" size="sm" className="border-slate-300 dark:border-slate-700">
                                        <Link href={`/outsource-performances/${performance.id}/edit`}>
                                            Add note
                                        </Link>
                                    </Button>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            <DeleteConfirmationDialog
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
                title="Delete outsource trip?"
                description="This will permanently remove the outsource performance record. Historical analytics will exclude this trip."
                itemName={performance.trip_number}
                onConfirm={handleDeleteConfirm}
                isLoading={isDeleting}
            />
        </AppLayout>
    );
}
