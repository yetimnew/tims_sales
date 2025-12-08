import { useMemo, useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DeleteConfirmationDialog } from '@/components/delete-confirmation-dialog';
import { Separator } from '@/components/ui/separator';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
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
    Gauge,
    MapPin,
    Navigation,
    Package,
    Percent,
    Target,
    Trash2,
    TrendingUp,
    User,
} from 'lucide-react';
import {
    Area,
    AreaChart,
    CartesianGrid,
    Cell,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip as RechartsTooltip,
    XAxis,
} from 'recharts';

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
    cost_per_km: number | null;
    cost_per_tonkm: number | null;
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
    vendorCompletedTrips: number;
    vendorActiveTrips: number;
    vendorCancelledTrips: number;
    vendorTotalDistance: number;
    vendorTotalCargo: number;
    vendorTotalTonKm: number;
    vendorTotalCost: number;
    vendorAverageTonKm: number | null;
    vendorAverageCost: number | null;
}

interface RecentTrip {
    id: number;
    trip_number: string;
    dispatch_date: string | null;
    distance_km: number | null;
    cargo_volume_mt: number | null;
    tonkm: number | null;
    cost: number | null;
    status: string | null;
    highlight: boolean;
}

interface StatusSlice {
    label: string;
    value: number;
}

interface VendorInsights {
    share: {
        distance: number | null;
        cargo: number | null;
        tonkm: number | null;
        cost: number | null;
    };
    statusBreakdown: StatusSlice[];
    averages: {
        costPerKm: number | null;
        costPerTonKm: number | null;
        avgTonKmPerTrip: number | null;
        avgCostPerTrip: number | null;
    };
    totals: {
        trips: number;
        distance: number;
        cargo: number;
        tonkm: number;
        cost: number;
    };
    tripCounts: {
        completed: number;
        active: number;
        cancelled: number;
    };
}

interface OutsourcePerformancesShowProps {
    performance: PerformanceResource;
    metrics: VendorMetrics;
    recentTrips: RecentTrip[];
    insights?: VendorInsights | null;
}

const buildBreadcrumbs = (tripNumber: string, performanceId: number): BreadcrumbItem[] => [
    { title: 'Outsource Performances', href: '/outsource-performances' },
    { title: `Trip ${tripNumber}`, href: `/outsource-performances/${performanceId}` },
];

const formatNumber = (value: number | null | undefined, suffix = '', fractionDigits = 2): string => {
    if (value === null || value === undefined || Number.isNaN(Number(value))) {
        return '—';
    }

    return `${Number(value).toLocaleString('en-US', {
        minimumFractionDigits: fractionDigits,
        maximumFractionDigits: fractionDigits,
    })}${suffix}`;
};

const formatCurrency = (value: number | null | undefined): string => {
    if (value === null || value === undefined || Number.isNaN(Number(value))) {
        return '—';
    }

    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'ETB',
        maximumFractionDigits: 2,
    }).format(Number(value));
};

const formatPercent = (value: number | null | undefined): string => {
    if (value === null || value === undefined || Number.isNaN(Number(value))) {
        return '—';
    }

    return `${Number(value).toFixed(1)}%`;
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

const formatShortDate = (value: string | null | undefined): string => {
    if (!value) {
        return '';
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return '';
    }

    return date.toLocaleDateString('en-US', {
        month: 'short',
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

const chartPalette = ['#6366f1', '#22c55e', '#f97316'];

export default function OutsourcePerformancesShow({ performance, metrics, recentTrips, insights }: OutsourcePerformancesShowProps) {
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

    const vendorChips = useMemo(() => ([
        {
            label: 'Vendor trips',
            value: metrics.vendorTripCount,
            icon: Activity,
        },
        {
            label: 'Completed',
            value: metrics.vendorCompletedTrips,
            icon: TrendingUp,
        },
        {
            label: 'Active',
            value: metrics.vendorActiveTrips,
            icon: Target,
        },
        {
            label: 'Cancelled',
            value: metrics.vendorCancelledTrips,
            icon: BarChart3,
        },
    ]), [
        metrics.vendorTripCount,
        metrics.vendorCompletedTrips,
        metrics.vendorActiveTrips,
        metrics.vendorCancelledTrips,
    ]);

    const tripSnapshotCards = useMemo(() => ([
        {
            title: 'Distance',
            value: distanceLabel,
            hint: 'Kilometres travelled for this dispatch',
            icon: Navigation,
            tone: 'text-blue-600',
            badge: 'bg-blue-100 dark:bg-blue-900/30',
        },
        {
            title: 'Cargo Volume',
            value: cargoLabel,
            hint: 'Total freight moved in metric tons',
            icon: Package,
            tone: 'text-emerald-600',
            badge: 'bg-emerald-100 dark:bg-emerald-900/30',
        },
        {
            title: 'Ton-Kilometres',
            value: tonKmLabel,
            hint: 'Productive output based on tonnage × distance',
            icon: Activity,
            tone: 'text-indigo-600',
            badge: 'bg-indigo-100 dark:bg-indigo-900/30',
        },
        {
            title: 'Trip Cost',
            value: costLabel,
            hint: 'Total spend captured for this trip',
            icon: Coins,
            tone: 'text-amber-600',
            badge: 'bg-amber-100 dark:bg-amber-900/30',
        },
    ]), [cargoLabel, costLabel, distanceLabel, tonKmLabel]);

    const share = insights?.share;
    const shareCards = useMemo(() => ([
        {
            title: 'Distance share',
            value: formatPercent(share?.distance),
            description: 'Contribution to vendor distance portfolio',
            icon: Navigation,
        },
        {
            title: 'Cargo share',
            value: formatPercent(share?.cargo),
            description: 'Portion of cargo moved by this trip',
            icon: Package,
        },
        {
            title: 'Ton-km share',
            value: formatPercent(share?.tonkm),
            description: 'Share of productivity within vendor history',
            icon: TrendingUp,
        },
        {
            title: 'Cost share',
            value: formatPercent(share?.cost),
            description: 'Percentage of vendor spend tied to this run',
            icon: Coins,
        },
    ]), [share?.cargo, share?.cost, share?.distance, share?.tonkm]);

    const efficiencyCards = useMemo(() => {
        const avgTonKm = insights?.averages.avgTonKmPerTrip ?? metrics.vendorAverageTonKm;
        const avgCost = insights?.averages.avgCostPerTrip ?? metrics.vendorAverageCost;

        return [
            {
                title: 'Cost per km',
                value: formatNumber(performance.cost_per_km, ' Birr/km'),
                detail: 'Spend required for every kilometre travelled.',
                icon: Gauge,
            },
            {
                title: 'Cost per ton-km',
                value: formatNumber(performance.cost_per_tonkm, ' Birr/ton-km'),
                detail: 'Efficiency of spend across tonnage delivered.',
                icon: Percent,
            },
            {
                title: 'Vendor avg ton-km',
                value: avgTonKm !== null && avgTonKm !== undefined ? formatNumber(avgTonKm, ' ton-km') : '—',
                detail: 'Mean productivity per vendor dispatch.',
                icon: Activity,
            },
            {
                title: 'Vendor avg cost',
                value: avgCost !== null && avgCost !== undefined ? formatCurrency(avgCost) : '—',
                detail: 'Average payout per vendor assignment.',
                icon: Coins,
            },
        ];
    }, [
        insights?.averages.avgCostPerTrip,
        insights?.averages.avgTonKmPerTrip,
        metrics.vendorAverageCost,
        metrics.vendorAverageTonKm,
        performance.cost_per_km,
        performance.cost_per_tonkm,
    ]);

    const statusData = insights?.statusBreakdown ?? [];
    const hasStatusData = statusData.some(slice => slice.value > 0);

    const timelineData = useMemo(() => {
        if (!recentTrips || recentTrips.length === 0) {
            return [] as Array<{ name: string; cost: number }>;
        }

        return recentTrips
            .slice()
            .reverse()
            .map(trip => ({
                name: formatShortDate(trip.dispatch_date) || trip.trip_number,
                cost: trip.cost ?? 0,
            }));
    }, [recentTrips]);

    const vendorTotals = insights?.totals;

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
                            <Separator />
                            <div className="flex flex-wrap gap-2">
                                {vendorChips.map(chip => (
                                    <Badge
                                        key={chip.label}
                                        variant="outline"
                                        className="flex items-center gap-2 border-slate-200 bg-slate-100/70 px-3 py-1 text-xs font-medium text-slate-600 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-300"
                                    >
                                        <chip.icon className="h-3.5 w-3.5" />
                                        {chip.label}: {formatNumber(chip.value, '', 0)}
                                    </Badge>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    <div className="grid gap-4 lg:grid-cols-2">
                        <Card className="border border-slate-200/60 dark:border-slate-800/60">
                            <CardHeader>
                                <CardTitle>Trip Snapshot</CardTitle>
                                <CardDescription>Key operational figures for this outsource dispatch.</CardDescription>
                            </CardHeader>
                            <CardContent className="grid gap-4 sm:grid-cols-2">
                                {tripSnapshotCards.map(metric => (
                                    <div key={metric.title} className="flex items-center gap-3">
                                        <div className={`rounded-full p-2 ${metric.badge}`}>
                                            <metric.icon className={`h-4 w-4 ${metric.tone}`} />
                                        </div>
                                        <div>
                                            <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                                                {metric.title}
                                            </p>
                                            <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                                                {metric.value}
                                            </p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">{metric.hint}</p>
                                        </div>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>

                        <Card className="border border-slate-200/60 dark:border-slate-800/60">
                            <CardHeader>
                                <CardTitle>Vendor Impact &amp; Efficiency</CardTitle>
                                <CardDescription>How this trip stacks against vendor history.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid gap-4 sm:grid-cols-2">
                                    {efficiencyCards.map(card => (
                                        <div key={card.title} className="space-y-1 rounded-lg border border-slate-200/70 bg-slate-50/60 p-4 dark:border-slate-800/60 dark:bg-slate-900/40">
                                            <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                                                <card.icon className="h-4 w-4" />
                                                {card.title}
                                            </div>
                                            <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">{card.value}</p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">{card.detail}</p>
                                        </div>
                                    ))}
                                </div>
                                <Separator />
                                <div className="grid gap-4 sm:grid-cols-2">
                                    {shareCards.map(card => (
                                        <div key={card.title} className="rounded-lg border border-slate-200/70 bg-white/70 p-4 dark:border-slate-800/60 dark:bg-slate-950/40">
                                            <div className="flex items-center justify-between">
                                                <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                                                    {card.title}
                                                </p>
                                                <card.icon className="h-4 w-4 text-slate-500" />
                                            </div>
                                            <p className="mt-2 text-lg font-semibold text-slate-900 dark:text-slate-100">{card.value}</p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">{card.description}</p>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="grid gap-4 xl:grid-cols-3">
                        <Card className="border border-slate-200/60 dark:border-slate-800/60 xl:col-span-2">
                            <CardHeader>
                                <CardTitle>Route &amp; Operational Context</CardTitle>
                                <CardDescription>Logistical details that frame this vendor dispatch.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2 text-xs font-medium uppercase text-slate-500 dark:text-slate-400">
                                            <MapPin className="h-4 w-4 text-slate-500" />
                                            Route
                                        </div>
                                        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{routeLabel}</p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">{distanceLabel} recorded for this vendor run.</p>
                                    </div>
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2 text-xs font-medium uppercase text-slate-500 dark:text-slate-400">
                                            <Calendar className="h-4 w-4 text-slate-500" />
                                            Dispatch date
                                        </div>
                                        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{dispatchDateLabel}</p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">Execution window for the outsourcing engagement.</p>
                                    </div>
                                </div>
                                <Separator />
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2 text-xs font-medium uppercase text-slate-500 dark:text-slate-400">
                                            <FileText className="h-4 w-4 text-slate-500" />
                                            Operation reference
                                        </div>
                                        {performance.operation ? (
                                            <Link
                                                href={`/operations/${performance.operation.id}`}
                                                className="text-sm font-semibold text-indigo-600 hover:underline dark:text-indigo-300"
                                            >
                                                {operationLabel}
                                            </Link>
                                        ) : (
                                            <p className="text-sm font-semibold text-slate-500">Operation not linked</p>
                                        )}
                                        {customerLabel ? (
                                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                                <span className="inline-flex items-center gap-1">
                                                    <Building2 className="h-3.5 w-3.5" />
                                                    {customerLabel}
                                                </span>
                                            </p>
                                        ) : null}
                                    </div>
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2 text-xs font-medium uppercase text-slate-500 dark:text-slate-400">
                                            <ClipboardList className="h-4 w-4 text-slate-500" />
                                            Vendor
                                        </div>
                                        {performance.outsource ? (
                                            <Link
                                                href={`/outsources/${performance.outsource.id}`}
                                                className="text-sm font-semibold text-indigo-600 hover:underline dark:text-indigo-300"
                                            >
                                                {vendorLabel}
                                            </Link>
                                        ) : (
                                            <p className="text-sm font-semibold text-slate-500">Vendor not linked</p>
                                        )}
                                        <p className="text-xs text-slate-500 dark:text-slate-400">Captured by {authorLabel}</p>
                                    </div>
                                </div>
                                <Separator />
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2 text-xs font-medium uppercase text-slate-500 dark:text-slate-400">
                                            <User className="h-4 w-4 text-slate-500" />
                                            Created
                                        </div>
                                        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{createdLabel}</p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">Initial capture for this vendor activity.</p>
                                    </div>
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2 text-xs font-medium uppercase text-slate-500 dark:text-slate-400">
                                            <BarChart3 className="h-4 w-4 text-slate-500" />
                                            Last updated
                                        </div>
                                        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{updatedLabel}</p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">Reflects the latest adjustments made to this record.</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border border-slate-200/60 dark:border-slate-800/60">
                            <CardHeader>
                                <CardTitle>Recent Vendor Trends</CardTitle>
                                <CardDescription>Cost trajectory across the latest outsource runs.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="h-44 w-full">
                                    {timelineData.length > 0 ? (
                                        <ResponsiveContainer>
                                            <AreaChart data={timelineData}>
                                                <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-800" />
                                                <XAxis dataKey="name" stroke="currentColor" className="text-xs text-slate-500 dark:text-slate-400" />
                                                <RechartsTooltip formatter={(value) => formatCurrency(Number(value))} />
                                                <Area type="monotone" dataKey="cost" stroke="#6366f1" fill="#6366f1" fillOpacity={0.2} />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <div className="flex h-full items-center justify-center rounded-md border border-dashed border-slate-200 text-sm text-slate-500 dark:border-slate-800 dark:text-slate-400">
                                            No trend data available yet.
                                        </div>
                                    )}
                                </div>
                                <div className="rounded-lg border border-slate-200/70 dark:border-slate-800/60">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Trip</TableHead>
                                                <TableHead className="hidden sm:table-cell">Date</TableHead>
                                                <TableHead className="hidden sm:table-cell">Distance</TableHead>
                                                <TableHead className="hidden lg:table-cell">Cargo</TableHead>
                                                <TableHead className="hidden lg:table-cell">Ton-km</TableHead>
                                                <TableHead className="text-right">Cost</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {recentTrips && recentTrips.length > 0 ? (
                                                recentTrips.map(trip => (
                                                    <TableRow key={trip.id} className={trip.highlight ? 'bg-indigo-50/60 dark:bg-indigo-900/20' : undefined}>
                                                        <TableCell className="font-medium">{trip.trip_number}</TableCell>
                                                        <TableCell className="hidden text-xs sm:table-cell">{formatDate(trip.dispatch_date)}</TableCell>
                                                        <TableCell className="hidden text-xs sm:table-cell">{formatNumber(trip.distance_km, ' km')}</TableCell>
                                                        <TableCell className="hidden text-xs lg:table-cell">{formatNumber(trip.cargo_volume_mt, ' MT')}</TableCell>
                                                        <TableCell className="hidden text-xs lg:table-cell">{formatNumber(trip.tonkm, ' ton-km')}</TableCell>
                                                        <TableCell className="text-right text-xs font-semibold">{formatCurrency(trip.cost)}</TableCell>
                                                    </TableRow>
                                                ))
                                            ) : (
                                                <TableRow>
                                                    <TableCell colSpan={6} className="py-6 text-center text-sm text-slate-500 dark:text-slate-400">
                                                        No recent trips recorded for this vendor.
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="grid gap-4 xl:grid-cols-3">
                        <Card className="border border-slate-200/60 dark:border-slate-800/60 xl:col-span-2">
                            <CardHeader>
                                <CardTitle>Trip Notes</CardTitle>
                                <CardDescription>Context or special handling instructions captured for this dispatch.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {performance.remarks ? (
                                    <p className="whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-300">{performance.remarks}</p>
                                ) : (
                                    <p className="text-sm text-slate-500 dark:text-slate-400">No additional remarks recorded.</p>
                                )}
                            </CardContent>
                        </Card>

                        <Card className="border border-slate-200/60 dark:border-slate-800/60">
                            <CardHeader>
                                <CardTitle>Status Distribution</CardTitle>
                                <CardDescription>Snapshot of this vendor&apos;s assignment lifecycle.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {hasStatusData ? (
                                    <div className="h-48">
                                        <ResponsiveContainer>
                                            <PieChart>
                                                <Pie data={statusData} dataKey="value" nameKey="label" innerRadius={45} outerRadius={75} paddingAngle={4}>
                                                    {statusData.map((_, index) => (
                                                        <Cell key={index} fill={chartPalette[index % chartPalette.length]} />
                                                    ))}
                                                </Pie>
                                                <RechartsTooltip
                                                    formatter={(value, name) => [
                                                        `${Number(value)}`,
                                                        formatStatus(typeof name === 'string' ? name : String(name)),
                                                    ]}
                                                />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                ) : (
                                    <div className="flex h-36 items-center justify-center rounded-md border border-dashed border-slate-200 text-sm text-slate-500 dark:border-slate-800 dark:text-slate-400">
                                        No status data available.
                                    </div>
                                )}
                                <div className="space-y-2">
                                    <p className="text-xs font-medium uppercase text-slate-500 dark:text-slate-400">Totals</p>
                                    <div className="space-y-1 text-sm text-slate-600 dark:text-slate-300">
                                        <p>Trips: {formatNumber(vendorTotals?.trips ?? metrics.vendorTripCount, '', 0)}</p>
                                        <p>Distance: {formatNumber(vendorTotals?.distance ?? metrics.vendorTotalDistance, ' km')}</p>
                                        <p>Cargo: {formatNumber(vendorTotals?.cargo ?? metrics.vendorTotalCargo, ' MT')}</p>
                                        <p>Ton-km: {formatNumber(vendorTotals?.tonkm ?? metrics.vendorTotalTonKm, ' ton-km')}</p>
                                        <p>Cost: {formatCurrency(vendorTotals?.cost ?? metrics.vendorTotalCost)}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
            <DeleteConfirmationDialog
                title="Delete outsource performance"
                description="This action will permanently remove the outsource performance record."
                confirmLabel="Delete"
                confirmVariant="destructive"
                loading={isDeleting}
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
                onConfirm={handleDeleteConfirm}
            />
        </AppLayout>
    );
}
