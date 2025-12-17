import { useCallback, useMemo, useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableFooter,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    CircleDollarSign,
    Droplet,
    Gauge,
    TrendingDown,
    TrendingUp,
} from 'lucide-react';
import { ReportFiltersDialog } from '@/components/reports/report-filters-dialog';
import { ReportSummaryGrid, type ReportSummaryItem } from '@/components/reports/report-summary-grid';
import type { ReportSelectionOption } from '@/components/reports/types';

interface TruckOption {
    id: number;
    plate: string;
    status?: string | null;
}

interface FuelEfficiencyFilters {
    from?: string | null;
    to?: string | null;
    truck_ids?: number[];
}

interface FuelEfficiencyTotals {
    total_liters: number;
    total_cost: number;
    total_distance_km: number;
    refuel_events: number;
    truck_count: number;
}

interface FuelEfficiencySummary {
    fleet_efficiency_km_per_liter: number | null;
    fleet_cost_per_km: number | null;
    average_cost_per_liter: number | null;
    average_liters_per_event: number | null;
    average_cost_per_event: number | null;
    average_distance_per_event: number | null;
}

interface FuelEfficiencyBreakdownRow {
    truck_id: number;
    plate: string;
    status?: string | null;
    refuel_events: number;
    total_liters: number;
    total_cost: number;
    distance_km: number | null;
    efficiency_km_per_liter: number | null;
    cost_per_km: number | null;
    cost_per_liter: number | null;
    avg_liters_per_event: number | null;
    avg_cost_per_event: number | null;
    first_fill_on: string | null;
    last_fill_on: string | null;
    has_distance: boolean;
}

interface FuelEfficiencyTrendRow {
    period: string;
    total_liters: number;
    total_cost: number;
    average_price_per_liter: number | null;
    refuel_events: number;
    average_liters_per_event: number | null;
}

interface FuelEfficiencyHighlights {
    best_efficiency: FuelEfficiencyBreakdownRow[];
    highest_cost_per_km: FuelEfficiencyBreakdownRow[];
}

interface FuelEfficiencyProps {
    filters: FuelEfficiencyFilters;
    totals: FuelEfficiencyTotals;
    summary: FuelEfficiencySummary;
    breakdown: FuelEfficiencyBreakdownRow[];
    trend: FuelEfficiencyTrendRow[];
    highlights: FuelEfficiencyHighlights;
    trucks: TruckOption[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Reports', href: '/reports/fuel-efficiency' },
    { title: 'Fuel Efficiency & Cost', href: '/reports/fuel-efficiency' },
];

const formatNumber = (value: number) => value.toLocaleString();

const formatDecimal = (value: number) =>
    value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const formatCurrency = (value: number) =>
    new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
    }).format(value);

const formatOptionalDecimal = (value: number | null, unit?: string) =>
    value === null ? '—' : `${formatDecimal(value)}${unit ?? ''}`;

const formatOptionalCurrency = (value: number | null, suffix?: string) =>
    value === null ? '—' : `${formatCurrency(value)}${suffix ?? ''}`;

export default function FuelEfficiency({
    filters,
    totals,
    summary,
    breakdown = [],
    trend = [],
    highlights,
    trucks = [],
}: FuelEfficiencyProps) {
    const truckOptions = useMemo<TruckOption[]>(() => (Array.isArray(trucks) ? trucks : []), [trucks]);
    const truckSelectionOptions = useMemo<ReportSelectionOption[]>(
        () =>
            truckOptions.map((option) => ({
                id: option.id,
                label: option.plate ?? '—',
                badge: option.status ?? undefined,
            })),
        [truckOptions],
    );

    const safeBreakdown = useMemo<FuelEfficiencyBreakdownRow[]>(() => (Array.isArray(breakdown) ? breakdown : []), [breakdown]);
    const safeTrend = useMemo<FuelEfficiencyTrendRow[]>(() => (Array.isArray(trend) ? trend : []), [trend]);
    const highlightData = useMemo<FuelEfficiencyHighlights>(() => ({
        best_efficiency: Array.isArray(highlights?.best_efficiency) ? highlights.best_efficiency : [],
        highest_cost_per_km: Array.isArray(highlights?.highest_cost_per_km) ? highlights.highest_cost_per_km : [],
    }), [highlights]);

    const [from, setFrom] = useState(filters?.from ?? '');
    const [to, setTo] = useState(filters?.to ?? '');
    const [selectedTrucks, setSelectedTrucks] = useState<number[]>(filters?.truck_ids ?? []);
    const [filtersOpen, setFiltersOpen] = useState(false);
    const [dateError, setDateError] = useState<string | null>(null);

    const appliedFrom = filters?.from ?? '';
    const appliedTo = filters?.to ?? '';
    const appliedTruckCount = filters?.truck_ids?.length ?? 0;

    const filterBadges = useMemo(
        () => [
            `From ${appliedFrom || '—'}`,
            `To ${appliedTo || '—'}`,
            appliedTruckCount > 0 ? `${appliedTruckCount} truck${appliedTruckCount > 1 ? 's' : ''}` : 'All trucks',
        ],
        [appliedFrom, appliedTo, appliedTruckCount],
    );

    const summaryItems = useMemo<ReportSummaryItem[]>(
        () => [
            {
                label: 'Total Cost',
                value: formatCurrency(totals?.total_cost ?? 0),
                icon: CircleDollarSign,
                tone: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-200',
            },
            {
                label: 'Total Liters',
                value: `${formatDecimal(totals?.total_liters ?? 0)} L`,
                icon: Droplet,
                tone: 'bg-sky-100 text-sky-600 dark:bg-sky-500/20 dark:text-sky-200',
            },
            {
                label: 'Total Distance',
                value: `${formatDecimal(totals?.total_distance_km ?? 0)} km`,
                icon: Gauge,
                tone: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-200',
            },
            {
                label: 'Fleet Km / L',
                value: formatOptionalDecimal(summary?.fleet_efficiency_km_per_liter, ' km/L'),
                icon: TrendingUp,
                tone: 'bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-200',
            },
            {
                label: 'Cost / Km',
                value: formatOptionalCurrency(summary?.fleet_cost_per_km, ' / km'),
                icon: TrendingDown,
                tone: 'bg-rose-100 text-rose-600 dark:bg-rose-500/20 dark:text-rose-200',
            },
            {
                label: 'Avg Cost / L',
                value: formatOptionalCurrency(summary?.average_cost_per_liter, ' / L'),
                icon: CircleDollarSign,
                tone: 'bg-slate-100 text-slate-600 dark:bg-slate-500/20 dark:text-slate-200',
            },
        ],
        [summary?.average_cost_per_liter, summary?.fleet_cost_per_km, summary?.fleet_efficiency_km_per_liter, totals?.total_cost, totals?.total_distance_km, totals?.total_liters],
    );

    const activeFilterCount = useMemo(() => {
        let count = 0;

        if (from && from !== appliedFrom) count += 1;
        if (to && to !== appliedTo) count += 1;
        if (selectedTrucks.length > 0) count += 1;

        return count;
    }, [from, to, selectedTrucks, appliedFrom, appliedTo]);

    const validateDateRange = useCallback(
        (nextFrom: string, nextTo: string) => {
            if (nextFrom && nextTo) {
                const fromTimestamp = Date.parse(nextFrom);
                const toTimestamp = Date.parse(nextTo);

                if (!Number.isNaN(fromTimestamp) && !Number.isNaN(toTimestamp) && fromTimestamp > toTimestamp) {
                    setDateError('Start date must be before or equal to the end date.');

                    return false;
                }
            }

            setDateError(null);

            return true;
        },
        [],
    );

    const handleApplyFilters = () => {
        if (!validateDateRange(from, to)) {
            setFiltersOpen(true);

            return;
        }

        setFiltersOpen(false);

        const params: Record<string, unknown> = {};

        if (from) params.from = from;
        if (to) params.to = to;
        if (selectedTrucks.length > 0) params.truck_ids = selectedTrucks;

        router.get('/reports/fuel-efficiency', params, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleReset = () => {
        setFrom(filters?.from ?? '');
        setTo(filters?.to ?? '');
        setSelectedTrucks(filters?.truck_ids ?? []);
        setFiltersOpen(false);
        setDateError(null);

        router.get('/reports/fuel-efficiency', {}, { preserveState: false, preserveScroll: true });
    };

    const handleDateChange = (field: 'from' | 'to', value: string) => {
        if (field === 'from') {
            setFrom(value);
            validateDateRange(value, to);
            return;
        }

        setTo(value);
        validateDateRange(from, value);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Fuel Efficiency & Cost" />
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-slate-100/60 dark:bg-slate-900/40">
                <div className="flex flex-1 flex-col gap-6 overflow-y-auto p-4 pb-10 sm:p-6 lg:p-10">
                    <header className="rounded-2xl border border-slate-200 bg-white/95 px-6 py-6 shadow-sm backdrop-blur dark:border-slate-800/70 dark:bg-slate-900/70">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                            <div className="space-y-2">
                                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500 dark:text-slate-400">Fuel Lens</p>
                                <h1 className="text-3xl font-semibold text-slate-900 dark:text-slate-50">Fuel Efficiency &amp; Cost</h1>
                                <p className="max-w-3xl text-sm text-slate-600 dark:text-slate-300">
                                    Benchmark trucks by consumption, spend, and distance covered. Combine refuelling data with odometer readings to surface outliers and opportunities to optimise routes or driver habits.
                                </p>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                                <ReportFiltersDialog
                                    open={filtersOpen}
                                    onOpenChange={setFiltersOpen}
                                    activeFilterCount={activeFilterCount}
                                    from={from}
                                    to={to}
                                    onDateChange={handleDateChange}
                                    onReset={handleReset}
                                    onApply={handleApplyFilters}
                                    truckOptions={truckSelectionOptions}
                                    selectedTrucks={selectedTrucks}
                                    onTrucksChange={setSelectedTrucks}
                                    dateError={dateError}
                                />
                                <Button type="button" variant="outline" className="gap-2" onClick={handleReset}>
                                    Reset
                                </Button>
                            </div>
                        </div>
                    </header>

                    <ReportSummaryGrid items={summaryItems} />

                    <section className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
                        <Card className="border border-slate-200 bg-white/95 shadow-sm dark:border-slate-800/70 dark:bg-slate-900/70">
                            <CardHeader className="space-y-3 border-b border-slate-200/60 pb-4 dark:border-slate-700/60">
                                <div className="space-y-1">
                                    <CardTitle className="text-lg font-semibold text-slate-900 dark:text-slate-50">Per-truck efficiency</CardTitle>
                                    <CardDescription className="text-sm">Detailed consumption, spend, and efficiency by truck.</CardDescription>
                                </div>
                                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                                    {filterBadges.map((badge) => (
                                        <Badge key={badge} variant="outline">
                                            {badge}
                                        </Badge>
                                    ))}
                                </div>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader className="bg-slate-50/60 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-900/60 dark:text-slate-400">
                                            <TableRow className="divide-x divide-slate-200/40 dark:divide-slate-800/50">
                                                <TableHead className="whitespace-nowrap">Truck</TableHead>
                                                <TableHead className="whitespace-nowrap">Status</TableHead>
                                                <TableHead className="whitespace-nowrap text-right">Refuels</TableHead>
                                                <TableHead className="whitespace-nowrap text-right">Liters</TableHead>
                                                <TableHead className="whitespace-nowrap text-right">Total Cost</TableHead>
                                                <TableHead className="whitespace-nowrap text-right">Distance (km)</TableHead>
                                                <TableHead className="whitespace-nowrap text-right">Km / L</TableHead>
                                                <TableHead className="whitespace-nowrap text-right">Cost / Km</TableHead>
                                                <TableHead className="whitespace-nowrap text-right">Cost / L</TableHead>
                                                <TableHead className="whitespace-nowrap text-right">Avg L / Refuel</TableHead>
                                                <TableHead className="whitespace-nowrap text-right">Avg Cost / Refuel</TableHead>
                                                <TableHead className="whitespace-nowrap text-right">Last Refuel</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {safeBreakdown.length === 0 && (
                                                <TableRow>
                                                    <TableCell colSpan={12} className="py-6 text-center text-sm text-muted-foreground">
                                                        No data available for the selected filters.
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                            {safeBreakdown.map((row) => (
                                                <TableRow key={row.truck_id} className="divide-x divide-slate-100/60 dark:divide-slate-800/60">
                                                    <TableCell className="whitespace-nowrap font-medium text-slate-900 dark:text-slate-50">
                                                        {row.plate}
                                                    </TableCell>
                                                    <TableCell className="whitespace-nowrap capitalize text-slate-600 dark:text-slate-300">
                                                        {row.status ?? '—'}
                                                    </TableCell>
                                                    <TableCell className="whitespace-nowrap text-right">{formatNumber(row.refuel_events)}</TableCell>
                                                    <TableCell className="whitespace-nowrap text-right">{formatDecimal(row.total_liters)}</TableCell>
                                                    <TableCell className="whitespace-nowrap text-right">{formatCurrency(row.total_cost)}</TableCell>
                                                    <TableCell className="whitespace-nowrap text-right">{formatOptionalDecimal(row.distance_km, ' km')}</TableCell>
                                                    <TableCell className="whitespace-nowrap text-right">{formatOptionalDecimal(row.efficiency_km_per_liter, ' km/L')}</TableCell>
                                                    <TableCell className="whitespace-nowrap text-right">{formatOptionalCurrency(row.cost_per_km, ' / km')}</TableCell>
                                                    <TableCell className="whitespace-nowrap text-right">{formatOptionalCurrency(row.cost_per_liter, ' / L')}</TableCell>
                                                    <TableCell className="whitespace-nowrap text-right">{formatOptionalDecimal(row.avg_liters_per_event, ' L')}</TableCell>
                                                    <TableCell className="whitespace-nowrap text-right">{formatOptionalCurrency(row.avg_cost_per_event)}</TableCell>
                                                    <TableCell className="whitespace-nowrap text-right">{row.last_fill_on ?? '—'}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                        {safeBreakdown.length > 0 && (
                                            <TableFooter>
                                                <TableRow className="divide-x divide-slate-200/40 bg-slate-50/70 font-semibold dark:divide-slate-800/60 dark:bg-slate-900/70">
                                                    <TableCell colSpan={2}>
                                                        Totals ({formatNumber(totals?.truck_count ?? 0)} trucks)
                                                    </TableCell>
                                                    <TableCell className="text-right">{formatNumber(totals?.refuel_events ?? 0)}</TableCell>
                                                    <TableCell className="text-right">{formatDecimal(totals?.total_liters ?? 0)}</TableCell>
                                                    <TableCell className="text-right">{formatCurrency(totals?.total_cost ?? 0)}</TableCell>
                                                    <TableCell className="text-right">{formatDecimal(totals?.total_distance_km ?? 0)} km</TableCell>
                                                    <TableCell className="text-right">{formatOptionalDecimal(summary?.fleet_efficiency_km_per_liter, ' km/L')}</TableCell>
                                                    <TableCell className="text-right">{formatOptionalCurrency(summary?.fleet_cost_per_km, ' / km')}</TableCell>
                                                    <TableCell className="text-right">{formatOptionalCurrency(summary?.average_cost_per_liter, ' / L')}</TableCell>
                                                    <TableCell className="text-right">{formatOptionalDecimal(summary?.average_liters_per_event, ' L')}</TableCell>
                                                    <TableCell className="text-right">{formatOptionalCurrency(summary?.average_cost_per_event)}</TableCell>
                                                    <TableCell className="text-right">{formatOptionalDecimal(summary?.average_distance_per_event, ' km')}</TableCell>
                                                </TableRow>
                                            </TableFooter>
                                        )}
                                    </Table>
                                </div>
                            </CardContent>
                        </Card>

                        <div className="grid gap-6">
                            <Card className="border border-slate-200 bg-white/95 shadow-sm dark:border-slate-800/70 dark:bg-slate-900/70">
                                <CardHeader className="space-y-2 border-b border-slate-200/60 pb-4 dark:border-slate-700/60">
                                    <CardTitle className="text-lg font-semibold text-slate-900 dark:text-slate-50">Highlights</CardTitle>
                                    <CardDescription className="text-sm">Top performers and cost hotspots.</CardDescription>
                                </CardHeader>
                                <CardContent className="grid gap-6 md:grid-cols-2">
                                    <div className="space-y-3">
                                        <div className="text-sm font-semibold text-slate-700 dark:text-slate-200">Best efficiency</div>
                                        {highlightData.best_efficiency.length === 0 && (
                                            <p className="text-sm text-muted-foreground">No efficiency winners yet.</p>
                                        )}
                                        {highlightData.best_efficiency.length > 0 && (
                                            <ol className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
                                                {highlightData.best_efficiency.map((row, index) => (
                                                    <li key={row.truck_id} className="flex items-center justify-between rounded-lg border border-slate-200/70 bg-slate-50/60 px-3 py-2 dark:border-slate-800/60 dark:bg-slate-900/60">
                                                        <span className="font-medium text-slate-900 dark:text-slate-50">
                                                            {index + 1}. {row.plate}
                                                        </span>
                                                        <span>{formatOptionalDecimal(row.efficiency_km_per_liter, ' km/L')}</span>
                                                    </li>
                                                ))}
                                            </ol>
                                        )}
                                    </div>
                                    <div className="space-y-3">
                                        <div className="text-sm font-semibold text-slate-700 dark:text-slate-200">Highest cost per km</div>
                                        {highlightData.highest_cost_per_km.length === 0 && (
                                            <p className="text-sm text-muted-foreground">No costly outliers detected.</p>
                                        )}
                                        {highlightData.highest_cost_per_km.length > 0 && (
                                            <ol className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
                                                {highlightData.highest_cost_per_km.map((row, index) => (
                                                    <li key={row.truck_id} className="flex items-center justify-between rounded-lg border border-slate-200/70 bg-rose-50/60 px-3 py-2 dark:border-rose-900/40 dark:bg-rose-950/30">
                                                        <span className="font-medium text-slate-900 dark:text-slate-50">
                                                            {index + 1}. {row.plate}
                                                        </span>
                                                        <span>{formatOptionalCurrency(row.cost_per_km, ' / km')}</span>
                                                    </li>
                                                ))}
                                            </ol>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="border border-slate-200 bg-white/95 shadow-sm dark:border-slate-800/70 dark:bg-slate-900/70">
                                <CardHeader className="space-y-2 border-b border-slate-200/60 pb-4 dark:border-slate-700/60">
                                    <CardTitle className="text-lg font-semibold text-slate-900 dark:text-slate-50">Refuel trend</CardTitle>
                                    <CardDescription className="text-sm">Month-over-month litres and cost.</CardDescription>
                                </CardHeader>
                                <CardContent className="p-0">
                                    <div className="max-h-[320px] overflow-auto">
                                        <Table>
                                            <TableHeader className="bg-slate-50/60 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-900/60 dark:text-slate-400">
                                                <TableRow>
                                                    <TableHead>Period</TableHead>
                                                    <TableHead className="text-right">Refuels</TableHead>
                                                    <TableHead className="text-right">Liters</TableHead>
                                                    <TableHead className="text-right">Liters / Refuel</TableHead>
                                                    <TableHead className="text-right">Total Cost</TableHead>
                                                    <TableHead className="text-right">Avg Price / L</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {safeTrend.length === 0 && (
                                                    <TableRow>
                                                        <TableCell colSpan={6} className="py-6 text-center text-sm text-muted-foreground">
                                                            No trend data available for the selected filters.
                                                        </TableCell>
                                                    </TableRow>
                                                )}
                                                {safeTrend.map((row) => (
                                                    <TableRow key={row.period}>
                                                        <TableCell>{row.period}</TableCell>
                                                        <TableCell className="text-right">{formatNumber(row.refuel_events)}</TableCell>
                                                        <TableCell className="text-right">{formatDecimal(row.total_liters)}</TableCell>
                                                        <TableCell className="text-right">{formatOptionalDecimal(row.average_liters_per_event, ' L')}</TableCell>
                                                        <TableCell className="text-right">{formatCurrency(row.total_cost)}</TableCell>
                                                        <TableCell className="text-right">{formatOptionalCurrency(row.average_price_per_liter, ' / L')}</TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </section>
                </div>
            </div>
        </AppLayout>
    );
}


