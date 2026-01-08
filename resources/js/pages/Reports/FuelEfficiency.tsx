import { useEffect, useMemo, useState } from 'react';
import { router } from '@inertiajs/react';
import { type BreadcrumbItem } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ListingPaginationFooter, type ListingPaginationLink } from '@/components/listing/pagination-footer';
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CircleDollarSign, Download, Droplet, FileDigit, FileSpreadsheet, FileType2, Gauge, RefreshCcw, Route, TrendingDown, Waypoints } from 'lucide-react';
import { ReportFiltersDialog } from '@/components/reports/report-filters-dialog';
import { ReportSummaryGrid, type ReportSummaryItem } from '@/components/reports/report-summary-grid';
import type { ReportSelectionOption } from '@/components/reports/types';
import { usePermissions } from '@/hooks/use-permissions';
import { REPORT_DATE_RANGE_DESCRIPTION, useReportDateRange } from '@/components/reports/use-report-date-range';
import { ReportPageLayout } from '@/components/report/report-page-layout';

type QueryParamValue = string | number | boolean | null | undefined | Array<string | number | boolean>;

interface TruckOption {
    id: number;
    plate: string;
    status?: string | null;
}

interface FuelEfficiencyFilters {
    from?: string | null;
    to?: string | null;
    truck_ids?: number[];
    per_page?: number | null;
    page?: number | null;
}

interface FuelEfficiencyTotals {
    total_liters: number;
    total_cost: number;
    total_loaded_distance_km: number;
    total_empty_distance_km: number;
    total_distance_km: number;
    trip_count: number;
    truck_count: number;
}

interface FuelEfficiencySummary {
    fleet_efficiency_km_per_liter: number | null;
    fleet_cost_per_km: number | null;
    average_cost_per_liter: number | null;
    average_liters_per_trip: number | null;
    average_cost_per_trip: number | null;
    average_loaded_distance_per_trip: number | null;
    average_empty_distance_per_trip: number | null;
    loaded_distance_share_percent: number | null;
    empty_distance_share_percent: number | null;
}

interface FuelEfficiencyBreakdownRow {
    truck_id: number;
    plate: string;
    status?: string | null;
    trip_count: number;
    total_liters: number;
    total_cost: number;
    distance_loaded_km: number;
    distance_empty_km: number;
    distance_total_km: number;
    efficiency_km_per_liter: number | null;
    cost_per_km: number | null;
    cost_per_liter: number | null;
    avg_liters_per_trip: number | null;
    avg_cost_per_trip: number | null;
    first_activity_on: string | null;
    last_activity_on: string | null;
    drivers: { id: number; name: string; status?: string | null }[];
    driver_names: string[];
    loaded_distance_share_percent: number | null;
    empty_distance_share_percent: number | null;
    has_distance: boolean;
}

interface FuelEfficiencyTrendRow {
    period: string;
    trip_count: number;
    total_liters: number;
    total_cost: number;
    distance_loaded_km: number;
    distance_empty_km: number;
    distance_total_km: number;
    average_liters_per_trip: number | null;
    average_cost_per_trip: number | null;
    fleet_efficiency_km_per_liter: number | null;
    fleet_cost_per_km: number | null;
}

interface FuelEfficiencyHighlights {
    best_efficiency: FuelEfficiencyBreakdownRow[];
    highest_cost_per_km: FuelEfficiencyBreakdownRow[];
    highest_empty_distance_share: FuelEfficiencyBreakdownRow[];
}

interface FuelEfficiencyPaginationMeta {
    current_page?: number | null;
    last_page?: number | null;
    per_page?: number | null;
    total?: number | null;
    from?: number | null;
    to?: number | null;
}

interface FuelEfficiencyPagination {
    meta?: FuelEfficiencyPaginationMeta | null;
    links?: Array<{ url: string | null; label: string; active?: boolean }>;
}

interface FuelEfficiencyProps {
    filters: FuelEfficiencyFilters;
    totals: FuelEfficiencyTotals;
    summary: FuelEfficiencySummary;
    breakdown: FuelEfficiencyBreakdownRow[];
    breakdown_paginator?: FuelEfficiencyPagination | null;
    per_page_options?: number[];
    trend: FuelEfficiencyTrendRow[];
    highlights: FuelEfficiencyHighlights;
    trucks: TruckOption[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Reports', href: '/reports/fuel-efficiency' },
    { title: 'Fuel Efficiency & Cost', href: '/reports/fuel-efficiency' },
];

const toParamsArray = (key: string, values: number[], params: URLSearchParams) => {
    values.forEach((value, index) => {
        params.append(`${key}[${index}]`, String(value));
    });
};

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

const formatPercentage = (value: number | null, fractionDigits = 1) =>
    value === null
        ? '—'
        : `${value.toLocaleString(undefined, {
              minimumFractionDigits: fractionDigits,
              maximumFractionDigits: fractionDigits,
          })}%`;

export default function FuelEfficiency({
    filters,
    totals,
    summary,
    breakdown = [],
    breakdown_paginator: breakdownPaginator = null,
    per_page_options: perPageOptionsProp = [],
    trend = [],
    highlights,
    trucks = [],
}: FuelEfficiencyProps) {
    const { hasPermission } = usePermissions();
    const canExport = hasPermission('reports.fuel-efficiency.export');

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
        highest_empty_distance_share: Array.isArray(highlights?.highest_empty_distance_share)
            ? highlights.highest_empty_distance_share
            : [],
    }), [highlights]);

    const { from, to, dateError, handleDateChange, validateDateRange, resetDateRange } = useReportDateRange(filters?.from ?? '', filters?.to ?? '');
    const [selectedTrucks, setSelectedTrucks] = useState<number[]>(filters?.truck_ids ?? []);
    const [filtersOpen, setFiltersOpen] = useState(false);

    const breakdownPaginatorMeta = useMemo<FuelEfficiencyPaginationMeta | null>(
        () => (breakdownPaginator && typeof breakdownPaginator === 'object' ? breakdownPaginator.meta ?? null : null),
        [breakdownPaginator],
    );

    const breakdownPaginationLinks = useMemo<ListingPaginationLink[]>(
        () =>
            (breakdownPaginator && Array.isArray(breakdownPaginator.links) ? breakdownPaginator.links : []).map((link) => ({
                url: typeof link.url === 'string' ? link.url : null,
                label: typeof link.label === 'string' ? link.label : String(link.label ?? ''),
                active: Boolean(link.active),
            })),
        [breakdownPaginator],
    );

    const perPageOptionsList = useMemo<number[]>(
        () => (Array.isArray(perPageOptionsProp) && perPageOptionsProp.length > 0 ? perPageOptionsProp : [10, 25, 50, 100]),
        [perPageOptionsProp],
    );

    const resolvedPerPage = useMemo<number>(() => {
        const candidate = filters?.per_page ?? breakdownPaginatorMeta?.per_page ?? perPageOptionsList[1] ?? perPageOptionsList[0] ?? 25;

        if (typeof candidate === 'number' && perPageOptionsList.includes(candidate)) {
            return candidate;
        }

        return perPageOptionsList[0] ?? 25;
    }, [filters?.per_page, breakdownPaginatorMeta?.per_page, perPageOptionsList]);

    const [perPage, setPerPage] = useState<number>(resolvedPerPage);

    useEffect(() => {
        setPerPage(resolvedPerPage);
    }, [resolvedPerPage]);

    const totalRows = breakdownPaginatorMeta?.total ?? safeBreakdown.length;
    const pageRangeStart = breakdownPaginatorMeta?.from ?? (safeBreakdown.length > 0 ? 1 : 0);
    const pageRangeEnd = breakdownPaginatorMeta?.to ?? safeBreakdown.length;
    const currentPage = breakdownPaginatorMeta?.current_page ?? 1;
    const totalPages = breakdownPaginatorMeta?.last_page ?? 1;
    const safeTotalPages = Math.max(totalPages, 1);
    const safeCurrentPage = totalRows > 0 ? Math.min(Math.max(currentPage, 1), safeTotalPages) : 1;
    const paginationExtra = totalRows > 0 ? (
        <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Page {safeCurrentPage} of {safeTotalPages}
        </span>
    ) : null;

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
                label: 'Loaded Distance',
                value: `${formatDecimal(totals?.total_loaded_distance_km ?? 0)} km`,
                icon: Route,
                tone: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-200',
            },
            {
                label: 'Empty Distance',
                value: `${formatDecimal(totals?.total_empty_distance_km ?? 0)} km`,
                icon: Waypoints,
                tone: 'bg-violet-100 text-violet-600 dark:bg-violet-500/20 dark:text-violet-200',
            },
            {
                label: 'Fleet Km / L',
                value: formatOptionalDecimal(summary?.fleet_efficiency_km_per_liter, ' km/L'),
                icon: Gauge,
                tone: 'bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-200',
            },
            {
                label: 'Cost / Km',
                value: formatOptionalCurrency(summary?.fleet_cost_per_km, ' / km'),
                icon: TrendingDown,
                tone: 'bg-rose-100 text-rose-600 dark:bg-rose-500/20 dark:text-rose-200',
            },
        ],
        [summary?.fleet_cost_per_km, summary?.fleet_efficiency_km_per_liter, totals?.total_cost, totals?.total_empty_distance_km, totals?.total_loaded_distance_km, totals?.total_liters],
    );

    const handlePerPageChange = (value: string) => {
        const parsed = Number(value);

        if (Number.isNaN(parsed) || parsed <= 0 || parsed === perPage) {
            return;
        }

        setPerPage(parsed);

        const params: Record<string, QueryParamValue> = {};

        if (from) params.from = from;
        if (to) params.to = to;
        if (selectedTrucks.length > 0) params.truck_ids = selectedTrucks;
        params.per_page = parsed;
        params.page = 1;

        router.get('/reports/fuel-efficiency', params, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const activeFilterCount = useMemo(() => {
        let count = 0;

        if (from && from !== appliedFrom) count += 1;
        if (to && to !== appliedTo) count += 1;
        if (selectedTrucks.length > 0) count += 1;

        return count;
    }, [from, to, selectedTrucks, appliedFrom, appliedTo]);

    const handleApplyFilters = () => {
        if (!validateDateRange(from, to)) {
            setFiltersOpen(true);

            return;
        }

        setFiltersOpen(false);

        const params: Record<string, QueryParamValue> = {};

        if (from) params.from = from;
        if (to) params.to = to;
        if (selectedTrucks.length > 0) params.truck_ids = selectedTrucks;

        router.get('/reports/fuel-efficiency', params, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleReset = () => {
        resetDateRange(filters?.from ?? '', filters?.to ?? '');
        setSelectedTrucks(filters?.truck_ids ?? []);
        setFiltersOpen(false);

        router.get('/reports/fuel-efficiency', {}, { preserveState: false, preserveScroll: true });
    };

    const handleExport = (format: 'csv' | 'xlsx' | 'pdf') => {
        if (!validateDateRange(from, to)) {
            setFiltersOpen(true);

            return;
        }

        if (!canExport) {
            return;
        }

        const params = new URLSearchParams();

        if (from) params.set('from', from);
        if (to) params.set('to', to);
        if (selectedTrucks.length > 0) toParamsArray('truck_ids', selectedTrucks, params);

        const query = params.toString();
        const url = `/reports/fuel-efficiency/export/${format}${query ? `?${query}` : ''}`;
        window.location.href = url;
    };

    return (
        <ReportPageLayout
            title="Fuel Efficiency & Cost"
            breadcrumbs={breadcrumbs}
            icon={<Droplet className="h-6 w-6" />}
            filters={
                <ReportFiltersDialog
                    open={filtersOpen}
                    onOpenChange={setFiltersOpen}
                    activeFilterCount={activeFilterCount}
                    from={from}
                    to={to}
                    onDateChange={handleDateChange}
                    dateRangeDescription={REPORT_DATE_RANGE_DESCRIPTION}
                    onReset={handleReset}
                    onApply={handleApplyFilters}
                    truckOptions={truckSelectionOptions}
                    selectedTrucks={selectedTrucks}
                    onTrucksChange={setSelectedTrucks}
                    dateError={dateError}
                />
            }
            summarySection={<ReportSummaryGrid items={summaryItems} />}
            onRefresh={handleReset}
            onExportPdf={() => handleExport('pdf')}
            onExportExcel={() => handleExport('xlsx')}
            onExportCsv={() => handleExport('csv')}
            canExport={canExport}
            contentClassName="p-0"
        >
            <div className="space-y-6 p-6">
                {/* <ReportSummaryGrid items={summaryItems} /> */}

                    <Card className="border border-slate-200 bg-white/95 shadow-sm dark:border-slate-800/70 dark:bg-slate-900/70">
                        <CardHeader className="space-y-4 border-b border-slate-200/60 pb-4 dark:border-slate-700/60">
                            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                                <div className="space-y-1">
                                    <CardTitle className="text-lg font-semibold text-slate-900 dark:text-slate-50">Per-truck efficiency</CardTitle>
                                    <CardDescription className="text-sm">Detailed consumption, spend, and efficiency by truck.</CardDescription>
                                </div>
                                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                    <span>Rows per page</span>
                                    <Select value={String(perPage)} onValueChange={handlePerPageChange}>
                                        <SelectTrigger className="h-8 w-[140px]">
                                            <SelectValue placeholder={`${perPage} / page`} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {perPageOptionsList.map((option) => (
                                                <SelectItem key={option} value={String(option)}>
                                                    {option} / page
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                                {filterBadges.map((badge) => (
                                    <Badge key={badge} variant="outline">
                                        {badge}
                                    </Badge>
                                ))}
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4 p-0">
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader className="bg-slate-50/60 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-900/60 dark:text-slate-400">
                                        <TableRow className="divide-x divide-slate-200/40 dark:divide-slate-800/50">
                                            <TableHead className="whitespace-nowrap">Truck</TableHead>
                                            <TableHead className="whitespace-nowrap">Drivers</TableHead>
                                            <TableHead className="whitespace-nowrap">Status</TableHead>
                                            <TableHead className="whitespace-nowrap text-right">Trips</TableHead>
                                            <TableHead className="whitespace-nowrap text-right">Liters</TableHead>
                                            <TableHead className="whitespace-nowrap text-right">Total Cost</TableHead>
                                            <TableHead className="whitespace-nowrap text-right">Loaded (km)</TableHead>
                                            <TableHead className="whitespace-nowrap text-right">Empty (km)</TableHead>
                                            <TableHead className="whitespace-nowrap text-right">Total (km)</TableHead>
                                            <TableHead className="whitespace-nowrap text-right">Km / L</TableHead>
                                            <TableHead className="whitespace-nowrap text-right">Cost / Km</TableHead>
                                            <TableHead className="whitespace-nowrap text-right">Cost / L</TableHead>
                                            <TableHead className="whitespace-nowrap text-right">Avg L / Trip</TableHead>
                                            <TableHead className="whitespace-nowrap text-right">Avg Cost / Trip</TableHead>
                                            <TableHead className="whitespace-nowrap text-right">Empty Share</TableHead>
                                            <TableHead className="whitespace-nowrap text-right">Last Activity</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {totalRows === 0 && (
                                            <TableRow>
                                                <TableCell colSpan={16} className="py-6 text-center text-sm text-muted-foreground">
                                                    No data available for the selected filters.
                                                </TableCell>
                                            </TableRow>
                                        )}
                                        {safeBreakdown.map((row) => (
                                            <TableRow key={row.truck_id} className="divide-x divide-slate-100/60 dark:divide-slate-800/60">
                                                <TableCell className="whitespace-nowrap font-medium text-slate-900 dark:text-slate-50">
                                                    {row.plate}
                                                </TableCell>
                                                <TableCell className="max-w-[220px] whitespace-nowrap text-slate-600 dark:text-slate-300">
                                                    {row.driver_names?.length > 0 ? row.driver_names.join(', ') : '—'}
                                                </TableCell>
                                                <TableCell className="whitespace-nowrap capitalize text-slate-600 dark:text-slate-300">
                                                    {row.status ?? '—'}
                                                </TableCell>
                                                <TableCell className="whitespace-nowrap text-right">{formatNumber(row.trip_count)}</TableCell>
                                                <TableCell className="whitespace-nowrap text-right">{formatDecimal(row.total_liters)}</TableCell>
                                                <TableCell className="whitespace-nowrap text-right">{formatCurrency(row.total_cost)}</TableCell>
                                                <TableCell className="whitespace-nowrap text-right">{formatDecimal(row.distance_loaded_km)} km</TableCell>
                                                <TableCell className="whitespace-nowrap text-right">{formatDecimal(row.distance_empty_km)} km</TableCell>
                                                <TableCell className="whitespace-nowrap text-right">{formatDecimal(row.distance_total_km)} km</TableCell>
                                                <TableCell className="whitespace-nowrap text-right">{formatOptionalDecimal(row.efficiency_km_per_liter, ' km/L')}</TableCell>
                                                <TableCell className="whitespace-nowrap text-right">{formatOptionalCurrency(row.cost_per_km, ' / km')}</TableCell>
                                                <TableCell className="whitespace-nowrap text-right">{formatOptionalCurrency(row.cost_per_liter, ' / L')}</TableCell>
                                                <TableCell className="whitespace-nowrap text-right">{formatOptionalDecimal(row.avg_liters_per_trip, ' L')}</TableCell>
                                                <TableCell className="whitespace-nowrap text-right">{formatOptionalCurrency(row.avg_cost_per_trip)}</TableCell>
                                                <TableCell className="whitespace-nowrap text-right">{formatPercentage(row.empty_distance_share_percent)}</TableCell>
                                                <TableCell className="whitespace-nowrap text-right">{row.last_activity_on ?? '—'}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                    {safeBreakdown.length > 0 && (
                                        <TableFooter>
                                            <TableRow className="divide-x divide-slate-200/40 bg-slate-50/70 font-semibold dark:divide-slate-800/60 dark:bg-slate-900/70">
                                                <TableCell colSpan={3}>
                                                    Totals ({formatNumber(totals?.truck_count ?? 0)} trucks)
                                                </TableCell>
                                                <TableCell className="text-right">{formatNumber(totals?.trip_count ?? 0)}</TableCell>
                                                <TableCell className="text-right">{formatDecimal(totals?.total_liters ?? 0)}</TableCell>
                                                <TableCell className="text-right">{formatCurrency(totals?.total_cost ?? 0)}</TableCell>
                                                <TableCell className="text-right">{formatDecimal(totals?.total_loaded_distance_km ?? 0)} km</TableCell>
                                                <TableCell className="text-right">{formatDecimal(totals?.total_empty_distance_km ?? 0)} km</TableCell>
                                                <TableCell className="text-right">{formatDecimal(totals?.total_distance_km ?? 0)} km</TableCell>
                                                <TableCell className="text-right">{formatOptionalDecimal(summary?.fleet_efficiency_km_per_liter, ' km/L')}</TableCell>
                                                <TableCell className="text-right">{formatOptionalCurrency(summary?.fleet_cost_per_km, ' / km')}</TableCell>
                                                <TableCell className="text-right">{formatOptionalCurrency(summary?.average_cost_per_liter, ' / L')}</TableCell>
                                                <TableCell className="text-right">{formatOptionalDecimal(summary?.average_liters_per_trip, ' L')}</TableCell>
                                                <TableCell className="text-right">{formatOptionalCurrency(summary?.average_cost_per_trip)}</TableCell>
                                                <TableCell className="text-right">{formatPercentage(summary?.empty_distance_share_percent)}</TableCell>
                                                <TableCell className="text-right">—</TableCell>
                                            </TableRow>
                                        </TableFooter>
                                    )}
                                </Table>
                            </div>
                            <ListingPaginationFooter
                                from={pageRangeStart}
                                to={pageRangeEnd}
                                total={totalRows}
                                links={breakdownPaginationLinks}
                                extra={paginationExtra}
                                className="px-4"
                            />
                        </CardContent>
                    </Card>

                    <section className="grid gap-6 lg:grid-cols-2">
                        <Card className="border border-slate-200 bg-white/95 shadow-sm dark:border-slate-800/70 dark:bg-slate-900/70">
                            <CardHeader>
                                <CardTitle className="text-base font-semibold text-slate-900 dark:text-slate-50">Highlights</CardTitle>
                                <CardDescription className="text-sm">Top performers and cost hotspots.</CardDescription>
                            </CardHeader>
                            <CardContent className="grid gap-4 text-sm md:grid-cols-3">
                                <div className="space-y-2">
                                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Best efficiency</p>
                                    {highlightData.best_efficiency.length === 0 && (
                                        <p className="text-muted-foreground">No efficiency winners yet.</p>
                                    )}
                                    {highlightData.best_efficiency.length > 0 && (
                                        <ol className="space-y-2 text-slate-600 dark:text-slate-300">
                                            {highlightData.best_efficiency.map((row, index) => (
                                                <li key={row.truck_id} className="flex items-center justify-between rounded-lg border border-slate-200/70 px-3 py-2 dark:border-slate-800/60">
                                                    <span className="font-semibold text-slate-900 dark:text-slate-50">
                                                        {index + 1}. {row.plate}
                                                    </span>
                                                    <span>{formatOptionalDecimal(row.efficiency_km_per_liter, ' km/L')}</span>
                                                </li>
                                            ))}
                                        </ol>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Highest cost per km</p>
                                    {highlightData.highest_cost_per_km.length === 0 && (
                                        <p className="text-muted-foreground">No costly outliers detected.</p>
                                    )}
                                    {highlightData.highest_cost_per_km.length > 0 && (
                                        <ol className="space-y-2 text-slate-600 dark:text-slate-300">
                                            {highlightData.highest_cost_per_km.map((row, index) => (
                                                <li key={row.truck_id} className="flex items-center justify-between rounded-lg border border-slate-200/70 px-3 py-2 dark:border-rose-900/40 dark:bg-rose-950/20">
                                                    <span className="font-semibold text-slate-900 dark:text-slate-50">
                                                        {index + 1}. {row.plate}
                                                    </span>
                                                    <span>{formatOptionalCurrency(row.cost_per_km, ' / km')}</span>
                                                </li>
                                            ))}
                                        </ol>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Highest empty share</p>
                                    {highlightData.highest_empty_distance_share.length === 0 && (
                                        <p className="text-muted-foreground">No empty mileage spikes detected.</p>
                                    )}
                                    {highlightData.highest_empty_distance_share.length > 0 && (
                                        <ol className="space-y-2 text-slate-600 dark:text-slate-300">
                                            {highlightData.highest_empty_distance_share.map((row, index) => (
                                                <li key={row.truck_id} className="flex items-center justify-between rounded-lg border border-slate-200/70 px-3 py-2 dark:border-slate-800/60">
                                                    <span className="font-semibold text-slate-900 dark:text-slate-50">
                                                        {index + 1}. {row.plate}
                                                    </span>
                                                    <span>{formatPercentage(row.empty_distance_share_percent)}</span>
                                                </li>
                                            ))}
                                        </ol>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border border-slate-200 bg-white/95 shadow-sm dark:border-slate-800/70 dark:bg-slate-900/70">
                            <CardHeader>
                                <CardTitle className="text-base font-semibold text-slate-900 dark:text-slate-50">Trip &amp; fuel trend</CardTitle>
                                <CardDescription className="text-sm">Month-over-month trip mix, fuel usage, and distance.</CardDescription>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="max-h-[320px] overflow-auto">
                                    <Table>
                                        <TableHeader className="bg-slate-50/60 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-900/60 dark:text-slate-400">
                                            <TableRow>
                                                <TableHead>Period</TableHead>
                                                <TableHead className="text-right">Trips</TableHead>
                                                <TableHead className="text-right">Liters</TableHead>
                                                <TableHead className="text-right">Total Cost</TableHead>
                                                <TableHead className="text-right">Loaded (km)</TableHead>
                                                <TableHead className="text-right">Empty (km)</TableHead>
                                                <TableHead className="text-right">Total (km)</TableHead>
                                                <TableHead className="text-right">Km / L</TableHead>
                                                <TableHead className="text-right">Cost / Km</TableHead>
                                                <TableHead className="text-right">Avg L / Trip</TableHead>
                                                <TableHead className="text-right">Avg Cost / Trip</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {safeTrend.length === 0 && (
                                                <TableRow>
                                                    <TableCell colSpan={11} className="py-6 text-center text-sm text-muted-foreground">
                                                        No trend data available for the selected filters.
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                            {safeTrend.map((row) => (
                                                <TableRow key={row.period}>
                                                    <TableCell>{row.period}</TableCell>
                                                    <TableCell className="text-right">{formatNumber(row.trip_count)}</TableCell>
                                                    <TableCell className="text-right">{formatDecimal(row.total_liters)}</TableCell>
                                                    <TableCell className="text-right">{formatCurrency(row.total_cost)}</TableCell>
                                                    <TableCell className="text-right">{formatDecimal(row.distance_loaded_km)} km</TableCell>
                                                    <TableCell className="text-right">{formatDecimal(row.distance_empty_km)} km</TableCell>
                                                    <TableCell className="text-right">{formatDecimal(row.distance_total_km)} km</TableCell>
                                                    <TableCell className="text-right">{formatOptionalDecimal(row.fleet_efficiency_km_per_liter, ' km/L')}</TableCell>
                                                    <TableCell className="text-right">{formatOptionalCurrency(row.fleet_cost_per_km, ' / km')}</TableCell>
                                                    <TableCell className="text-right">{formatOptionalDecimal(row.average_liters_per_trip, ' L')}</TableCell>
                                                    <TableCell className="text-right">{formatOptionalCurrency(row.average_cost_per_trip)}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </CardContent>
                        </Card>
                    </section>
            </div>
        </ReportPageLayout>
    );
}


