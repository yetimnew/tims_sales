import { useMemo, useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { ReportHero } from '@/components/reports/report-hero';
import { ReportPageShell } from '@/components/reports/report-page-shell';
import { ReportSectionCard } from '@/components/reports/report-section-card';
import { ReportSummaryGrid } from '@/components/reports/report-summary-grid';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useListingLoading } from '@/hooks/use-listing-loading';
import { BarChart3, Gauge, Package, Route, Truck } from 'lucide-react';

interface PerformanceByModelFilters {
    from: string;
    to: string;
}

interface PerformanceByModelRow {
    vehicletype_id: number;
    model: string;
    trips: number;
    tonnage: number;
    distance_wcargo: number;
    distance_wocargo: number;
    tonkm: number;
}

interface PerformanceByModelProps {
    filters: PerformanceByModelFilters;
    rows: PerformanceByModelRow[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Reports', href: '/reports/performance-by-model' },
    { title: 'Performance by Model', href: '/reports/performance-by-model' },
];

const SKELETON_FLAG_KEY = 'reports.performance-by-model.shouldShowSkeleton';

const formatNumber = (value: number): string => value.toLocaleString();

const formatDecimal = (value: number): string =>
    value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const formatOptionalDecimal = (value: number | null, suffix?: string): string => {
    if (value === null || Number.isNaN(value)) {
        return '—';
    }

    return `${formatDecimal(value)}${suffix ?? ''}`;
};

const formatOptionalPercent = (value: number | null): string => {
    if (value === null || Number.isNaN(value)) {
        return '—';
    }

    return `${formatDecimal(value)}%`;
};

export default function PerformanceByModel({ filters, rows = [] }: PerformanceByModelProps) {
    const [from, setFrom] = useState(filters?.from ?? '');
    const [to, setTo] = useState(filters?.to ?? '');

    const isDataReady = Array.isArray(rows);
    const { isLoading } = useListingLoading({
        storageKey: SKELETON_FLAG_KEY,
        isDataReady,
    });

    const totals = useMemo(() => {
        return rows.reduce(
            (acc, row) => {
                acc.trips += row.trips ?? 0;
                acc.tonnage += row.tonnage ?? 0;
                acc.tonkm += row.tonkm ?? 0;
                acc.distanceWithCargo += row.distance_wcargo ?? 0;
                acc.distanceWithoutCargo += row.distance_wocargo ?? 0;
                return acc;
            },
            { trips: 0, tonnage: 0, tonkm: 0, distanceWithCargo: 0, distanceWithoutCargo: 0 },
        );
    }, [rows]);

    const totalDistance = totals.distanceWithCargo + totals.distanceWithoutCargo;
    const averageTonKmPerTrip = totals.trips > 0 ? totals.tonkm / totals.trips : null;
    const averageDistancePerTrip = totals.trips > 0 ? totalDistance / totals.trips : null;
    const ladenDistanceShare = totalDistance > 0 ? (totals.distanceWithCargo / totalDistance) * 100 : null;

    const summaryItems = [
        {
            key: 'total-trips',
            label: 'Total trips',
            value: isLoading ? <Skeleton className="h-5 w-20" /> : formatNumber(totals.trips),
            helper: 'Completed dispatches for the selected period',
            icon: <Route className="h-3.5 w-3.5" />,
            iconWrapperClassName: 'bg-blue-50 text-blue-600 dark:bg-blue-500/20 dark:text-blue-200',
            valueClassName: isLoading ? undefined : 'text-blue-600 dark:text-blue-200',
        },
        {
            key: 'total-tonnage',
            label: 'Total tonnage (MT)',
            value: isLoading ? <Skeleton className="h-5 w-24" /> : formatDecimal(totals.tonnage),
            helper: 'Aggregate cargo moved by model',
            icon: <Package className="h-3.5 w-3.5" />,
            iconWrapperClassName: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-200',
            valueClassName: isLoading ? undefined : 'text-emerald-600 dark:text-emerald-200',
        },
        {
            key: 'total-tonkm',
            label: 'Total ton-km',
            value: isLoading ? <Skeleton className="h-5 w-28" /> : formatDecimal(totals.tonkm),
            helper: 'Distance-weighted cargo volume',
            icon: <BarChart3 className="h-3.5 w-3.5" />,
            iconWrapperClassName: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-200',
        },
        {
            key: 'avg-tonkm-trip',
            label: 'Ton-km per trip',
            value: isLoading ? <Skeleton className="h-5 w-24" /> : formatOptionalDecimal(averageTonKmPerTrip, ''),
            helper: 'Average carrying intensity per dispatch',
            icon: <Gauge className="h-3.5 w-3.5" />,
            iconWrapperClassName: 'bg-amber-50 text-amber-600 dark:bg-amber-500/20 dark:text-amber-200',
        },
        {
            key: 'laden-share',
            label: 'Laden distance share',
            value: isLoading ? <Skeleton className="h-5 w-20" /> : formatOptionalPercent(ladenDistanceShare),
            helper: 'Share of total distance driven under load',
            icon: <Truck className="h-3.5 w-3.5" />,
            iconWrapperClassName: 'bg-slate-100 text-slate-600 dark:bg-slate-800/60 dark:text-slate-200',
        },
        {
            key: 'avg-distance-trip',
            label: 'Distance per trip',
            value: isLoading ? <Skeleton className="h-5 w-24" /> : formatOptionalDecimal(averageDistancePerTrip, ' km'),
            helper: 'Average kilometres for each trip',
            icon: <Route className="h-3.5 w-3.5" />,
            iconWrapperClassName: 'bg-teal-50 text-teal-600 dark:bg-teal-500/20 dark:text-teal-200',
        },
    ];

    const topByTrips = useMemo(() => [...rows].sort((a, b) => b.trips - a.trips).slice(0, 3), [rows]);
    const topByTonnage = useMemo(() => [...rows].sort((a, b) => b.tonnage - a.tonnage).slice(0, 3), [rows]);
    const topByTonKm = useMemo(() => [...rows].sort((a, b) => b.tonkm - a.tonkm).slice(0, 3), [rows]);

    const detailBadgeItems = [
        { key: 'from', label: `From ${filters?.from || '—'}` },
        { key: 'to', label: `To ${filters?.to || '—'}` },
    ];

    const handleApplyFilters = () => {
        const params: Record<string, string> = {};

        if (from) {
            params.from = from;
        }

        if (to) {
            params.to = to;
        }

        router.get('/reports/performance-by-model', params, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleReset = () => {
        setFrom(filters?.from ?? '');
        setTo(filters?.to ?? '');

        router.get('/reports/performance-by-model', {}, {
            preserveState: false,
            preserveScroll: true,
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Performance by Model" />
            <ReportPageShell>
                <ReportHero
                    eyebrow="Fleet Mix"
                    title="Performance by model"
                    description="Compare utilisation, carrying power, and distance mix across vehicle models. Use the window controls to review model performance trends and spotlight high performing configurations."
                    actions={
                        <>
                            <Button type="button" variant="outline" onClick={handleReset}>
                                Reset
                            </Button>
                            <Button type="button" onClick={handleApplyFilters}>
                                Generate report
                            </Button>
                        </>
                    }
                />

                <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
                    <ReportSectionCard
                        title="Filters"
                        description="Adjust the reporting window before generating the model comparison."
                        contentClassName="flex flex-col gap-6 p-6"
                    >
                        <div className="space-y-2">
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Date range</span>
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                <Input type="date" value={from} onChange={(event) => setFrom(event.target.value)} />
                                <Input type="date" value={to} onChange={(event) => setTo(event.target.value)} />
                            </div>
                        </div>
                        <div className="flex flex-col gap-3 border-t border-slate-200/60 pt-6 sm:flex-row sm:justify-between dark:border-slate-700/60">
                            <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={handleReset}>
                                Reset
                            </Button>
                            <Button type="button" className="w-full sm:w-auto" onClick={handleApplyFilters}>
                                Apply filters
                            </Button>
                        </div>
                    </ReportSectionCard>

                    <ReportSectionCard
                        title="Fleet snapshot"
                        description="High level utilisation and tonnage indicators for the selected period."
                        contentClassName="p-6"
                    >
                        <ReportSummaryGrid items={summaryItems} className="gap-4 md:grid-cols-2 xl:grid-cols-3" />
                    </ReportSectionCard>
                </div>

                <ReportSectionCard
                    title="Model highlights"
                    description="Top performing models by key metrics to guide utilisation decisions."
                    badgeItems={[
                        { key: 'rows', label: `${rows.length} models analysed` },
                    ]}
                    contentClassName="grid gap-6 p-6 md:grid-cols-3"
                >
                    <div className="space-y-3">
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Most trips</p>
                        {isLoading && <Skeleton className="h-24 w-full" />}
                        {!isLoading && topByTrips.length === 0 && (
                            <p className="text-sm text-muted-foreground">No trip data for the selected period.</p>
                        )}
                        {!isLoading &&
                            topByTrips.map((model, index) => (
                                <div
                                    key={model.vehicletype_id}
                                    className="flex items-center justify-between rounded-lg border border-slate-200/70 px-3 py-2 dark:border-slate-800/70"
                                >
                                    <div>
                                        <p className="font-semibold text-slate-900 dark:text-slate-100">{model.model}</p>
                                        <p className="text-xs text-muted-foreground">{formatNumber(model.trips)} trips</p>
                                    </div>
                                    <Badge variant="secondary" className="min-w-[2rem] justify-center">#{index + 1}</Badge>
                                </div>
                            ))}
                    </div>

                    <div className="space-y-3">
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Highest tonnage</p>
                        {isLoading && <Skeleton className="h-24 w-full" />}
                        {!isLoading && topByTonnage.length === 0 && (
                            <p className="text-sm text-muted-foreground">No tonnage data recorded.</p>
                        )}
                        {!isLoading &&
                            topByTonnage.map((model, index) => (
                                <div
                                    key={model.vehicletype_id}
                                    className="flex items-center justify-between rounded-lg border border-slate-200/70 px-3 py-2 dark:border-slate-800/70"
                                >
                                    <div>
                                        <p className="font-semibold text-slate-900 dark:text-slate-100">{model.model}</p>
                                        <p className="text-xs text-muted-foreground">{formatDecimal(model.tonnage)} MT</p>
                                    </div>
                                    <Badge variant="secondary" className="min-w-[2rem] justify-center">#{index + 1}</Badge>
                                </div>
                            ))}
                    </div>

                    <div className="space-y-3">
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Highest ton-km</p>
                        {isLoading && <Skeleton className="h-24 w-full" />}
                        {!isLoading && topByTonKm.length === 0 && (
                            <p className="text-sm text-muted-foreground">No ton-km data recorded.</p>
                        )}
                        {!isLoading &&
                            topByTonKm.map((model, index) => (
                                <div
                                    key={model.vehicletype_id}
                                    className="flex items-center justify-between rounded-lg border border-slate-200/70 px-3 py-2 dark:border-slate-800/70"
                                >
                                    <div>
                                        <p className="font-semibold text-slate-900 dark:text-slate-100">{model.model}</p>
                                        <p className="text-xs text-muted-foreground">{formatDecimal(model.tonkm)} ton-km</p>
                                    </div>
                                    <Badge variant="secondary" className="min-w-[2rem] justify-center">#{index + 1}</Badge>
                                </div>
                            ))}
                    </div>
                </ReportSectionCard>

                <ReportSectionCard
                    title="Model breakdown"
                    description="Detailed utilisation metrics covering trips, tonnage, and distance split for each model."
                    badgeItems={detailBadgeItems}
                    contentClassName="p-0"
                >
                    {isLoading ? (
                        <div className="space-y-3 p-6">
                            {Array.from({ length: 6 }).map((_, index) => (
                                <Skeleton key={index} className="h-12 w-full" />
                            ))}
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader className="bg-slate-50/70 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-900/50 dark:text-slate-400">
                                    <TableRow className="divide-x divide-slate-200/50 dark:divide-slate-800/60">
                                        <TableHead className="whitespace-nowrap">Model</TableHead>
                                        <TableHead className="whitespace-nowrap text-right">Trips</TableHead>
                                        <TableHead className="whitespace-nowrap text-right">Tonnage (MT)</TableHead>
                                        <TableHead className="whitespace-nowrap text-right">Ton-km</TableHead>
                                        <TableHead className="whitespace-nowrap text-right">Distance with cargo (km)</TableHead>
                                        <TableHead className="whitespace-nowrap text-right">Distance without cargo (km)</TableHead>
                                        <TableHead className="whitespace-nowrap text-right">Total distance (km)</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {rows.length > 0 ? (
                                        rows.map((row) => {
                                            const distanceTotal = row.distance_wcargo + row.distance_wocargo;

                                            return (
                                                <TableRow
                                                    key={row.vehicletype_id}
                                                    className="divide-x divide-slate-100 hover:bg-slate-50/70 dark:divide-slate-800/60 dark:hover:bg-slate-900/50"
                                                >
                                                    <TableCell className="font-semibold text-slate-900 dark:text-slate-100">{row.model}</TableCell>
                                                    <TableCell className="text-right font-medium">{formatNumber(row.trips)}</TableCell>
                                                    <TableCell className="text-right">{formatDecimal(row.tonnage)}</TableCell>
                                                    <TableCell className="text-right">{formatDecimal(row.tonkm)}</TableCell>
                                                    <TableCell className="text-right">{formatDecimal(row.distance_wcargo)}</TableCell>
                                                    <TableCell className="text-right">{formatDecimal(row.distance_wocargo)}</TableCell>
                                                    <TableCell className="text-right">{formatDecimal(distanceTotal)}</TableCell>
                                                </TableRow>
                                            );
                                        })
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                                                No model performance data for the selected period.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    )}

                    <div className="flex flex-wrap items-center gap-4 border-t border-slate-200/80 bg-slate-50/60 px-4 py-3 text-sm dark:border-slate-800/70 dark:bg-slate-900/40">
                        <Badge variant="outline" className="bg-white/80 text-xs text-slate-600 dark:bg-slate-900/80 dark:text-slate-300">
                            Trips: {formatNumber(totals.trips)}
                        </Badge>
                        <Badge variant="outline" className="bg-white/80 text-xs text-slate-600 dark:bg-slate-900/80 dark:text-slate-300">
                            Tonnage: {formatDecimal(totals.tonnage)} MT
                        </Badge>
                        <Badge variant="outline" className="bg-white/80 text-xs text-slate-600 dark:bg-slate-900/80 dark:text-slate-300">
                            Ton-km: {formatDecimal(totals.tonkm)}
                        </Badge>
                        <Badge variant="outline" className="bg-white/80 text-xs text-slate-600 dark:bg-slate-900/80 dark:text-slate-300">
                            Distance (laden): {formatDecimal(totals.distanceWithCargo)} km
                        </Badge>
                        <Badge variant="outline" className="bg-white/80 text-xs text-slate-600 dark:bg-slate-900/80 dark:text-slate-300">
                            Distance (empty): {formatDecimal(totals.distanceWithoutCargo)} km
                        </Badge>
                    </div>
                </ReportSectionCard>
            </ReportPageShell>
        </AppLayout>
    );
}



