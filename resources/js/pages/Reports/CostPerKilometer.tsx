import { useMemo, useState } from 'react';
import { router } from '@inertiajs/react';
import { type BreadcrumbItem } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ReportSummaryGrid, type ReportSummaryItem } from '@/components/reports/report-summary-grid';
import { ReportFiltersDialog } from '@/components/reports/report-filters-dialog';
import type { ReportSelectionOption } from '@/components/reports/types';
import { formatCurrency, formatDecimal, formatInteger, formatPercentage } from '@/components/reports/formatters';
import { DollarSign, TrendingDown, Route, BarChart3, Fuel, User } from 'lucide-react';
import { usePermissions } from '@/hooks/use-permissions';
import { Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, ComposedChart } from 'recharts';
import type { PieLabelRenderProps } from 'recharts';
import { REPORT_DATE_RANGE_DESCRIPTION, useReportDateRange } from '@/components/reports/use-report-date-range';
import { ReportPageLayout } from '@/components/report/report-page-layout';

type QueryParamValue = string | number | boolean | null | undefined | Array<string | number | boolean>;

interface TruckOption {
    id: number;
    name: string;
    status?: string | null;
}

interface DriverOption {
    id: number;
    name: string;
    status?: string | null;
}

interface CostPerKmRow {
    label: string;
    truck_id: number | null;
    driver_id: number | null;
    origin_id: number | null;
    destination_id: number | null;
    trips: number;
    distance_loaded: number;
    distance_empty: number;
    distance_total: number;
    fuel_cost: number;
    perdiem: number;
    work_on_going: number;
    other_cost: number;
    total_cost: number;
    total_cpk: number;
    fuel_cpk: number;
    perdiem_cpk: number;
    work_on_going_cpk: number;
    other_cpk: number;
    fuel_cost_percent: number;
    perdiem_cost_percent: number;
    work_on_going_cost_percent: number;
    other_cost_percent: number;
}

interface Summary {
    total_trips: number;
    total_distance: number;
    total_fuel_cost: number;
    total_perdiem: number;
    total_work_on_going: number;
    total_other_cost: number;
    total_cost: number;
    overall_cpk: number;
    overall_fuel_cpk: number;
    overall_perdiem_cpk: number;
}

interface Filters {
    from?: string | null;
    to?: string | null;
    truck_ids?: number[];
    driver_ids?: number[];
    group_by?: string;
    compare_from?: string | null;
    compare_to?: string | null;
}

interface CostPerKilometerProps {
    filters: Filters;
    rows: CostPerKmRow[];
    summary: Summary;
    options: {
        trucks: TruckOption[];
        drivers: DriverOption[];
    };
    comparison?: {
        summary: Summary;
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Reports', href: '/reports/cost-per-kilometer' },
    { title: 'Cost Per Kilometer Analysis', href: '/reports/cost-per-kilometer' },
];

const toParamsArray = (key: string, values: number[], params: URLSearchParams) => {
    values.forEach((value) => params.append(`${key}[]`, String(value)));
};

export default function CostPerKilometer({ filters, rows = [], summary, options, comparison }: CostPerKilometerProps) {
    const { hasPermission } = usePermissions();
    const canExport = hasPermission('reports.cost-per-kilometer.export');

    const [filtersOpen, setFiltersOpen] = useState(false);
    const { from, to, dateError, handleDateChange, validateDateRange, resetDateRange } = useReportDateRange(filters?.from ?? '', filters?.to ?? '');
    const groupBy = filters?.group_by ?? 'overall';
    const [selectedTrucks, setSelectedTrucks] = useState<number[]>(filters?.truck_ids ?? []);
    const [selectedDrivers, setSelectedDrivers] = useState<number[]>(filters?.driver_ids ?? []);

    const truckSource = options?.trucks;
    const driverSource = options?.drivers;
    const truckOptions = useMemo<TruckOption[]>(() => (Array.isArray(truckSource) ? truckSource : []), [truckSource]);
    const driverOptions = useMemo<DriverOption[]>(() => (Array.isArray(driverSource) ? driverSource : []), [driverSource]);

    const safeRows = useMemo<CostPerKmRow[]>(() => (Array.isArray(rows) ? rows : []), [rows]);

    const truckSelectionOptions = useMemo<ReportSelectionOption[]>(
        () =>
            truckOptions.map((option) => ({
                id: option.id,
                label: option.name ?? '—',
                badge: option.status ?? undefined,
            })),
        [truckOptions],
    );

    const driverSelectionOptions = useMemo<ReportSelectionOption[]>(
        () =>
            driverOptions.map((option) => ({
                id: option.id,
                label: option.name ?? 'Unassigned',
                badge: option.status ?? undefined,
            })),
        [driverOptions],
    );

    const handleApplyFilters = () => {
        if (!validateDateRange(from, to)) {
            setFiltersOpen(true);
            return;
        }

        setFiltersOpen(false);

        const params: Record<string, QueryParamValue> = {};

        if (from) params.from = from;
        if (to) params.to = to;
        if (groupBy) params.group_by = groupBy;
        if (selectedTrucks.length > 0) params.truck_ids = selectedTrucks;
        if (selectedDrivers.length > 0) params.driver_ids = selectedDrivers;

        router.get('/reports/cost-per-kilometer', params, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleReset = () => {
        resetDateRange(filters?.from ?? '', filters?.to ?? '');
        setSelectedTrucks(filters?.truck_ids ?? []);
        setSelectedDrivers(filters?.driver_ids ?? []);
        setFiltersOpen(false);
        router.get('/reports/cost-per-kilometer', undefined, { preserveState: false, preserveScroll: true });
    };

    const handleExport = (format: 'csv' | 'xlsx' | 'pdf') => {
        if (!validateDateRange(from, to)) {
            return;
        }

        if (!canExport) {
            return;
        }

        const params = new URLSearchParams();

        if (from) params.set('from', from);
        if (to) params.set('to', to);
        if (groupBy) params.set('group_by', groupBy);

        if (selectedTrucks.length > 0) toParamsArray('truck_ids', selectedTrucks, params);
        if (selectedDrivers.length > 0) toParamsArray('driver_ids', selectedDrivers, params);

        const query = params.toString();
        const url = `/reports/cost-per-kilometer/export/${format}${query ? `?${query}` : ''}`;
        window.location.href = url;
    };

    const activeFilterCount = useMemo(() => {
        let count = 0;
        if (selectedTrucks.length > 0) count++;
        if (selectedDrivers.length > 0) count++;
        return count;
    }, [selectedTrucks.length, selectedDrivers.length]);

    const summaryItems = useMemo<ReportSummaryItem[]>(
        () => [
            {
                label: 'Total Trips',
                value: formatInteger(summary?.total_trips ?? 0),
                icon: BarChart3,
                tone: 'bg-violet-100 text-violet-600 dark:bg-violet-500/20 dark:text-violet-200',
            },
            {
                label: 'Total Distance',
                value: `${formatDecimal(summary?.total_distance ?? 0)} KM`,
                icon: Route,
                tone: 'bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-200',
            },
            {
                label: 'Total Cost',
                value: formatCurrency(summary?.total_cost ?? 0),
                icon: DollarSign,
                tone: 'bg-rose-100 text-rose-600 dark:bg-rose-500/20 dark:text-rose-200',
            },
            {
                label: 'Overall CPK',
                value: formatCurrency(summary?.overall_cpk ?? 0),
                icon: TrendingDown,
                tone: 'bg-cyan-100 text-cyan-600 dark:bg-cyan-500/20 dark:text-cyan-200',
            },
            {
                label: 'Fuel CPK',
                value: formatCurrency(summary?.overall_fuel_cpk ?? 0),
                icon: Fuel,
                tone: 'bg-orange-100 text-orange-600 dark:bg-orange-500/20 dark:text-orange-200',
            },
            {
                label: 'Perdiem CPK',
                value: formatCurrency(summary?.overall_perdiem_cpk ?? 0),
                icon: User,
                tone: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-200',
            },
        ],
        [summary],
    );

    const groupByLabel = useMemo(() => {
        switch (groupBy) {
            case 'truck':
                return 'Truck';
            case 'driver':
                return 'Driver';
            case 'route':
                return 'Route';
            default:
                return 'Overall';
        }
    }, [groupBy]);

    // Chart data
    const cpkChartData = useMemo(() => {
        if (safeRows.length === 0) return [];
        return safeRows.slice(0, 10).map((row) => ({
            name: row.label.length > 15 ? `${row.label.substring(0, 15)}...` : row.label,
            'Total CPK': row.total_cpk,
            'Fuel CPK': row.fuel_cpk,
            'Perdiem CPK': row.perdiem_cpk,
        }));
    }, [safeRows]);

    const costBreakdownPieData = useMemo(() => {
        if (!summary) return [];
        return [
            { name: 'Fuel', value: summary.total_fuel_cost, color: '#f97316' },
            { name: 'Perdiem', value: summary.total_perdiem, color: '#6366f1' },
            { name: 'Work Ongoing', value: summary.total_work_on_going, color: '#8b5cf6' },
            { name: 'Other', value: summary.total_other_cost, color: '#64748b' },
        ].filter((item) => item.value > 0);
    }, [summary]);

    const comparisonData = useMemo(() => {
        if (!comparison) return null;
        return {
            current: summary,
            previous: comparison.summary,
        };
    }, [comparison, summary]);

    return (
        <ReportPageLayout
            title="Cost Per Kilometer Analysis"
            description="Analyse cost efficiency by breaking down expenses per kilometer. Identify cost drivers and optimize operational expenses across your fleet."
            breadcrumbs={breadcrumbs}
            icon={<DollarSign className="h-6 w-6" />}
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
                    driverOptions={driverSelectionOptions}
                    truckOptions={truckSelectionOptions}
                    selectedDrivers={selectedDrivers}
                    selectedTrucks={selectedTrucks}
                    onDriversChange={setSelectedDrivers}
                    onTrucksChange={setSelectedTrucks}
                    showDriverFilter={true}
                    showTruckFilter={true}
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
                {comparisonData && (
                        <Card className="border border-slate-200 bg-white/95 shadow-sm dark:border-slate-800/70 dark:bg-slate-900/70">
                            <CardHeader>
                                <CardTitle className="text-lg font-semibold">Period Comparison</CardTitle>
                                <CardDescription>Comparing current period with previous period</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid gap-4 md:grid-cols-3">
                                    <div className="space-y-1">
                                        <p className="text-xs text-slate-500">Overall CPK</p>
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-lg font-semibold">{formatCurrency(comparisonData.current.overall_cpk)}</span>
                                            <span className="text-xs text-slate-400">vs {formatCurrency(comparisonData.previous.overall_cpk)}</span>
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-xs text-slate-500">Fuel CPK</p>
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-lg font-semibold">{formatCurrency(comparisonData.current.overall_fuel_cpk)}</span>
                                            <span className="text-xs text-slate-400">vs {formatCurrency(comparisonData.previous.overall_fuel_cpk)}</span>
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-xs text-slate-500">Total Cost</p>
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-lg font-semibold">{formatCurrency(comparisonData.current.total_cost)}</span>
                                            <span className="text-xs text-slate-400">vs {formatCurrency(comparisonData.previous.total_cost)}</span>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* <ReportSummaryGrid items={summaryItems} /> */}

                    {cpkChartData.length > 0 && (
                        <div className="grid gap-6 lg:grid-cols-2">
                            <Card className="border border-slate-200 bg-white/95 shadow-sm dark:border-slate-800/70 dark:bg-slate-900/70">
                                <CardHeader>
                                    <CardTitle className="text-lg font-semibold">Cost Per Kilometer Breakdown</CardTitle>
                                    <CardDescription>Top 10 {groupByLabel.toLowerCase()}s by total CPK</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <ResponsiveContainer width="100%" height={300}>
                                        <ComposedChart data={cpkChartData}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                                            <YAxis />
                                            <Tooltip formatter={(value: number) => formatCurrency(value)} />
                                            <Legend />
                                            <Bar dataKey="Total CPK" fill="#06b6d4" />
                                            <Bar dataKey="Fuel CPK" fill="#f97316" />
                                            <Bar dataKey="Perdiem CPK" fill="#6366f1" />
                                        </ComposedChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>

                            <Card className="border border-slate-200 bg-white/95 shadow-sm dark:border-slate-800/70 dark:bg-slate-900/70">
                                <CardHeader>
                                    <CardTitle className="text-lg font-semibold">Cost Breakdown</CardTitle>
                                    <CardDescription>Distribution of costs by category</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <ResponsiveContainer width="100%" height={300}>
                                        <PieChart>
                                            <Pie
                                                data={costBreakdownPieData}
                                                cx="50%"
                                                cy="50%"
                                                labelLine={false}
                                                label={(props: PieLabelRenderProps) => {
                                                    const name = typeof props?.name === 'string' ? props.name : String(props?.name ?? '');
                                                    const percent = typeof props?.percent === 'number' ? props.percent : 0;
                                                    return `${name} ${(percent * 100).toFixed(0)}%`;
                                                }}
                                                outerRadius={100}
                                                fill="#8884d8"
                                                dataKey="value"
                                            >
                                                {costBreakdownPieData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                ))}
                                            </Pie>
                                            <Tooltip formatter={(value: number) => formatCurrency(value)} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    <Card className="border border-slate-200 bg-white/95 shadow-sm dark:border-slate-800/70 dark:bg-slate-900/70">
                        <CardHeader className="space-y-3 border-b border-slate-200/60 pb-5 dark:border-slate-700/60">
                            <div className="space-y-1">
                                <CardTitle className="text-lg font-semibold text-slate-900 dark:text-slate-50">Cost Per Kilometer Breakdown ({groupByLabel})</CardTitle>
                                <CardDescription className="text-sm">Detailed cost breakdown per kilometer grouped by {groupByLabel.toLowerCase()}.</CardDescription>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader className="bg-slate-50/60 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-900/60 dark:text-slate-400">
                                        <TableRow className="divide-x divide-slate-200/40 dark:divide-slate-800/50">
                                            <TableHead className="whitespace-nowrap">{groupByLabel}</TableHead>
                                            <TableHead className="whitespace-nowrap text-right">Trips</TableHead>
                                            <TableHead className="whitespace-nowrap text-right">Distance (KM)</TableHead>
                                            <TableHead className="whitespace-nowrap text-right">Fuel Cost</TableHead>
                                            <TableHead className="whitespace-nowrap text-right">Perdiem</TableHead>
                                            <TableHead className="whitespace-nowrap text-right">Work Ongoing</TableHead>
                                            <TableHead className="whitespace-nowrap text-right">Other Cost</TableHead>
                                            <TableHead className="whitespace-nowrap text-right">Total Cost</TableHead>
                                            <TableHead className="whitespace-nowrap text-right">Total CPK</TableHead>
                                            <TableHead className="whitespace-nowrap text-right">Fuel CPK</TableHead>
                                            <TableHead className="whitespace-nowrap text-right">Perdiem CPK</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {safeRows.length > 0 ? (
                                            safeRows.map((row, index) => (
                                                <TableRow key={`${row.label}-${index}`} className="divide-x divide-slate-100 hover:bg-slate-50/70 dark:divide-slate-800/50 dark:hover:bg-slate-900/50">
                                                    <TableCell className="whitespace-nowrap font-medium text-slate-900 dark:text-slate-100">
                                                        {row.label}
                                                    </TableCell>
                                                    <TableCell className="whitespace-nowrap text-right font-medium text-slate-900 dark:text-slate-100">
                                                        {formatInteger(row.trips)}
                                                    </TableCell>
                                                    <TableCell className="whitespace-nowrap text-right text-slate-600 dark:text-slate-400">
                                                        {formatDecimal(row.distance_total)}
                                                    </TableCell>
                                                    <TableCell className="whitespace-nowrap text-right text-slate-600 dark:text-slate-400">
                                                        {formatCurrency(row.fuel_cost)}
                                                        <div className="text-xs text-slate-400">
                                                            {formatPercentage(row.fuel_cost_percent)}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="whitespace-nowrap text-right text-slate-600 dark:text-slate-400">
                                                        {formatCurrency(row.perdiem)}
                                                        <div className="text-xs text-slate-400">
                                                            {formatPercentage(row.perdiem_cost_percent)}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="whitespace-nowrap text-right text-slate-600 dark:text-slate-400">
                                                        {formatCurrency(row.work_on_going)}
                                                        <div className="text-xs text-slate-400">
                                                            {formatPercentage(row.work_on_going_cost_percent)}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="whitespace-nowrap text-right text-slate-600 dark:text-slate-400">
                                                        {formatCurrency(row.other_cost)}
                                                        <div className="text-xs text-slate-400">
                                                            {formatPercentage(row.other_cost_percent)}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="whitespace-nowrap text-right font-semibold text-slate-900 dark:text-slate-100">
                                                        {formatCurrency(row.total_cost)}
                                                    </TableCell>
                                                    <TableCell className="whitespace-nowrap text-right font-semibold">
                                                        <span className="text-cyan-600 dark:text-cyan-400">
                                                            {formatCurrency(row.total_cpk)}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell className="whitespace-nowrap text-right text-slate-600 dark:text-slate-400">
                                                        {formatCurrency(row.fuel_cpk)}
                                                    </TableCell>
                                                    <TableCell className="whitespace-nowrap text-right text-slate-600 dark:text-slate-400">
                                                        {formatCurrency(row.perdiem_cpk)}
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        ) : (
                                            <TableRow>
                                                <TableCell colSpan={11} className="py-10 text-center text-sm text-muted-foreground">
                                                    No cost data available for the selected period. Adjust your filters and generate the report again.
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
            </div>
        </ReportPageLayout>
    );
}
