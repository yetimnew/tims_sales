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
    Building2,
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

const statusToneClasses = (status: string | null | undefined): string => {
    switch (status) {
        case 'completed':
            return 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-900/30 dark:text-emerald-200';
        case 'in_transit':
        case 'active':
            return 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900/40 dark:bg-blue-900/30 dark:text-blue-200';
        case 'cancelled':
            return 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/40 dark:bg-rose-900/30 dark:text-rose-200';
        default:
            return 'border-slate-200 bg-slate-100 text-slate-700 dark:border-slate-800/60 dark:bg-slate-900/40 dark:text-slate-200';
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
        [performance.id, performance.trip_number],
    );

    const dispatchDateLabel = formatDate(performance.dispatch_date);
    const distanceLabel = formatNumber(performance.distance_km, ' km');
    const cargoLabel = formatNumber(performance.cargo_volume_mt, ' MT');
    const tonKmLabel = formatNumber(performance.tonkm, ' ton-km');
    const costLabel = formatCurrency(performance.cost);
    const statusLabel = formatStatus(performance.status);
    const statusClasses = statusToneClasses(performance.status);
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

    const vendorMetricCards = useMemo(() => {
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
                value: formatNumber(resolved.vendorTripCount, ''),
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

    const tripSnapshotCards = useMemo(() => (
        [
            {
                title: 'Distance',
                value: distanceLabel,
                hint: 'Registered kilometres for this dispatch',
                icon: Navigation,
                tone: 'text-blue-600',
                badge: 'bg-blue-100 dark:bg-blue-900/30',
            },
            {
                title: 'Cargo Volume',
                value: cargoLabel,
                hint: 'Tonnage committed for this trip',
                icon: Package,
                tone: 'text-emerald-600',
                badge: 'bg-emerald-100 dark:bg-emerald-900/30',
            },
            {
                title: 'Ton-Kilometres',
                value: tonKmLabel,
                hint: 'Productivity output based on cargo × distance',
                icon: Activity,
                tone: 'text-indigo-600',
                badge: 'bg-indigo-100 dark:bg-indigo-900/30',
            },
            {
                title: 'Trip Cost',
                value: costLabel,
                hint: 'Spend captured for this vendor dispatch',
                icon: Coins,
                tone: 'text-amber-600',
                badge: 'bg-amber-100 dark:bg-amber-900/30',
            },
        ]
    ), [cargoLabel, costLabel, distanceLabel, tonKmLabel]);

    const hasRecentTrips = Array.isArray(recentTrips) && recentTrips.length > 0;

    const handleDeleteConfirm = () => {
        setIsDeleting(true);
        router.delete(`/outsource-performances/${performance.id}`, {
            preserveScroll: true,
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
            <div className="flex flex-1 flex-col overflow-hidden p-4">
                <div className="flex flex-1 flex-col gap-6 overflow-y-auto pb-6 pr-1">
                    <Card className="border border-slate-200/70 bg-white/95 shadow-xl backdrop-blur dark:border-slate-800/60 dark:bg-slate-900/80">
                        <CardContent className="flex flex-col gap-6 p-6">
                            <div className="flex flex-wrap items-start justify-between gap-4">
                                <div className="flex items-start gap-3">
                                    <Link
                                        href="/outsource-performances"
                                        className="rounded-full bg-slate-100 p-2 text-slate-600 transition hover:bg-slate-200 dark:bg-slate-800/70 dark:text-slate-300 dark:hover:bg-slate-800"
                                    >
                                        <ArrowLeft className="h-4 w-4" />
                                    </Link>
                                    <div className="space-y-2">
                                        <div className="flex flex-wrap items-center gap-3">
                                            <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
                                                Trip {performance.trip_number}
                                            </h1>
                                            <Badge variant="outline" className={`flex items-center gap-1 px-3 py-1 text-xs font-semibold uppercase ${statusClasses}`}>
                                                {statusLabel}
                                            </Badge>
                                            <Badge variant="outline" className="flex items-center gap-1 border-slate-200 bg-slate-100/70 text-xs font-medium text-slate-600 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-300">
                                                <Calendar className="h-3.5 w-3.5" />
                                                {dispatchDateLabel}
                                            </Badge>
                                        </div>
                                        <p className="text-sm text-slate-600 dark:text-slate-400">
                                            {vendorLabel} • {operationLabel}{customerLabel ? ` — ${customerLabel}` : ''}
                                        </p>
                                        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                                            <span>Recorded by {authorLabel}</span>
                                            <span className="hidden text-slate-400 sm:inline">/</span>
                                            <span>Created {createdLabel}</span>
                                            <span className="hidden text-slate-400 sm:inline">/</span>
                                            <span>Updated {updatedLabel}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex flex-wrap items-center gap-3">
                                    {canEdit && (
                                        <Button
                                            variant="outline"
                                            asChild
                                            className="border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                                        >
                                            <Link href={`/outsource-performances/${performance.id}/edit`} className="flex items-center gap-2">
                                                <Edit className="h-4 w-4" />
                                                Edit Trip
                                            </Link>
                                        </Button>
                                    )}
                                    {canDelete && (
                                        <Button
                                            variant="outline"
                                            className="border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:border-rose-900/50 dark:hover:bg-rose-900/20"
                                            onClick={() => setDeleteDialogOpen(true)}
                                        >
                                            <Trash2 className="mr-2 h-4 w-4" />
                                            Delete
                                        </Button>
                                    )}
                                </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-slate-200/70 bg-slate-50/70 p-4 dark:border-slate-800/60 dark:bg-slate-900/40">
                                <div className="flex flex-1 min-w-[160px] items-center gap-3">
                                    <div className="rounded-xl bg-indigo-100 p-3 text-indigo-600 shadow-sm dark:bg-indigo-900/30 dark:text-indigo-300">
                                        <MapPin className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Origin</p>
                                        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                                            {performance.from_place?.name ?? 'Not specified'}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 text-indigo-500 dark:text-indigo-300">
                                    <div className="h-px w-12 bg-gradient-to-r from-indigo-400/60 to-emerald-400/60" />
                                    <Navigation className="h-5 w-5" />
                                    <div className="h-px w-12 bg-gradient-to-r from-indigo-400/60 to-emerald-400/60" />
                                </div>
                                <div className="flex flex-1 min-w-[160px] items-center justify-end gap-3">
                                    <div className="text-right">
                                        <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Destination</p>
                                        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                                            {performance.to_place?.name ?? 'Not specified'}
                                        </p>
                                    </div>
                                    <div className="rounded-xl bg-emerald-100 p-3 text-emerald-600 shadow-sm dark:bg-emerald-900/30 dark:text-emerald-300">
                                        <MapPin className="h-5 w-5" />
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.32fr)]">
                        <div className="space-y-6">
                            <Card className="border border-slate-200/70 bg-white/95 shadow-lg backdrop-blur dark:border-slate-800/60 dark:bg-slate-900/80">
                                <CardHeader className="border-b border-slate-200/60 bg-slate-50/70 dark:border-slate-800/60 dark:bg-slate-900/50">
                                    <CardTitle className="text-base font-semibold text-slate-900 dark:text-slate-100">
                                        Trip Snapshot
                                    </CardTitle>
                                    <CardDescription className="text-sm text-muted-foreground">
                                        Quick metrics that summarise this vendor dispatch.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="grid gap-3 p-6 sm:grid-cols-2 xl:grid-cols-4">
                                    {tripSnapshotCards.map(card => (
                                        <div
                                            key={card.title}
                                            className="rounded-xl border border-slate-200/70 bg-white/80 p-4 shadow-sm transition hover:shadow-md dark:border-slate-800/60 dark:bg-slate-900/50"
                                        >
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                                                        {card.title}
                                                    </p>
                                                    <p className={`mt-1 text-lg font-semibold ${card.tone}`}>{card.value}</p>
                                                </div>
                                                <div className={`rounded-lg ${card.badge} p-2`}>
                                                    <card.icon className="h-5 w-5" />
                                                </div>
                                            </div>
                                            <p className="mt-3 text-xs text-muted-foreground">{card.hint}</p>
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>

                            <Card className="border border-slate-200/70 bg-white/95 shadow-lg backdrop-blur dark:border-slate-800/60 dark:bg-slate-900/80">
                                <CardHeader className="border-b border-slate-200/60 bg-slate-50/70 dark:border-slate-800/60 dark:bg-slate-900/50">
                                    <CardTitle className="text-base font-semibold text-slate-900 dark:text-slate-100">
                                        Operational Context
                                    </CardTitle>
                                    <CardDescription className="text-sm text-muted-foreground">
                                        Reference details that position this trip within its operation.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-5 p-6 text-sm text-slate-700 dark:text-slate-300">
                                    <div className="flex items-start gap-3">
                                        <div className="rounded-lg bg-indigo-100 p-2 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-300">
                                            <Building2 className="h-4 w-4" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Operation</p>
                                            <p className="font-medium text-slate-900 dark:text-slate-100">{operationLabel}</p>
                                            {customerLabel && (
                                                <p className="text-xs text-muted-foreground">Customer • {customerLabel}</p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <div className="rounded-lg bg-emerald-100 p-2 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-300">
                                            <User className="h-4 w-4" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Vendor</p>
                                            <p className="font-medium text-slate-900 dark:text-slate-100">{vendorLabel}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <div className="rounded-lg bg-slate-200 p-2 text-slate-600 dark:bg-slate-800/60 dark:text-slate-300">
                                            <ClipboardList className="h-4 w-4" />
                                        </div>
                                        <div className="min-w-0 space-y-1">
                                            <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Route</p>
                                            <p className="font-medium text-slate-900 dark:text-slate-100">{routeLabel}</p>
                                            <p className="text-xs text-muted-foreground">Status {statusLabel}</p>
                                        </div>
                                    </div>
                                    <Separator className="bg-slate-200 dark:bg-slate-800" />
                                    <div className="grid gap-3 text-xs text-muted-foreground sm:grid-cols-2">
                                        <div className="rounded-lg border border-slate-200/70 bg-white/70 p-3 dark:border-slate-800/60 dark:bg-slate-900/40">
                                            <p className="font-semibold text-slate-900 dark:text-slate-100">{dispatchDateLabel}</p>
                                            <p className="mt-1 uppercase tracking-wide">Dispatch date</p>
                                        </div>
                                        <div className="rounded-lg border border-slate-200/70 bg-white/70 p-3 dark:border-slate-800/60 dark:bg-slate-900/40">
                                            <p className="font-semibold text-slate-900 dark:text-slate-100">{authorLabel}</p>
                                            <p className="mt-1 uppercase tracking-wide">Recorded by</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="border border-slate-200/70 bg-white/95 shadow-lg backdrop-blur dark:border-slate-800/60 dark:bg-slate-900/80">
                                <CardHeader className="border-b border-slate-200/60 bg-slate-50/70 dark:border-slate-800/60 dark:bg-slate-900/50">
                                    <CardTitle className="text-base font-semibold text-slate-900 dark:text-slate-100">
                                        Vendor Performance Benchmarks
                                    </CardTitle>
                                    <CardDescription className="text-sm text-muted-foreground">
                                        Aggregated insights across all historical trips for this vendor.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="grid gap-4 p-6 sm:grid-cols-2 xl:grid-cols-3">
                                    {vendorMetricCards.map(card => (
                                        <Card
                                            key={card.title}
                                            className="border border-slate-200/70 bg-white/80 shadow-sm backdrop-blur transition hover:shadow-md dark:border-slate-800/60 dark:bg-slate-900/60"
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
                                </CardContent>
                            </Card>

                            <Card className="border border-slate-200/70 bg-white/95 shadow-lg backdrop-blur dark:border-slate-800/60 dark:bg-slate-900/80">
                                <CardHeader className="flex items-center gap-2 pb-3">
                                    <FileText className="h-5 w-5 text-slate-500 dark:text-slate-300" />
                                    <div>
                                        <CardTitle className="text-base font-semibold text-slate-900 dark:text-slate-100">Trip Notes</CardTitle>
                                        <CardDescription className="text-sm text-muted-foreground">
                                            Additional remarks captured while logging this outsourcing run.
                                        </CardDescription>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-6">
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

                        <div className="space-y-6">
                            <Card className="border border-slate-200/70 bg-white/95 shadow-lg backdrop-blur dark:border-slate-800/60 dark:bg-slate-900/80">
                                <CardHeader className="border-b border-slate-200/60 bg-slate-50/70 dark:border-slate-800/60 dark:bg-slate-900/50">
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
                                <CardContent className="p-0">
                                    {!hasRecentTrips ? (
                                        <div className="m-6 flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-slate-300/70 bg-slate-50/70 p-10 text-center dark:border-slate-700/60 dark:bg-slate-900/40">
                                            <ClipboardList className="h-10 w-10 text-slate-300 dark:text-slate-600" />
                                            <p className="text-base font-medium text-slate-700 dark:text-slate-300">No historical trips yet</p>
                                            <p className="text-sm text-muted-foreground">New outsource trips will appear here as you log them.</p>
                                        </div>
                                    ) : (
                                        <div className="overflow-hidden rounded-b-xl">
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
                                                                    <Badge className={`${statusToneClasses(trip.status)} capitalize`}>
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
                    </div>
                </div>
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
