import { useCallback, useMemo, useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ReportSummaryGrid, type ReportSummaryItem } from '@/components/reports/report-summary-grid';
import { formatDecimal, formatInteger, formatPercentage } from '@/components/reports/formatters';
import { RefreshCcw, Package, TrendingUp, Route, BarChart3, Gauge, Truck } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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

interface UtilizationRow {
    label: string;
    truck_id: number | null;
    driver_id: number | null;
    origin_id: number | null;
    destination_id: number | null;
    trips: number;
    distance_loaded: number;
    distance_empty: number;
    distance_total: number;
    tonnage: number;
    ton_km: number;
    load_factor_percent: number;
    empty_miles_percent: number;
    deadhead_ratio: number;
    avg_distance_per_trip: number;
    avg_tonnage_per_trip: number;
    utilization_rate: number;
}

interface Summary {
    total_trips: number;
    total_distance_loaded: number;
    total_distance_empty: number;
    total_distance: number;
    total_tonnage: number;
    total_ton_km: number;
    overall_load_factor_percent: number;
    overall_empty_miles_percent: number;
    overall_deadhead_ratio: number;
    overall_utilization_rate: number;
}

interface Filters {
    from?: string | null;
    to?: string | null;
    truck_ids?: number[];
    driver_ids?: number[];
    group_by?: string;
}

interface LoadFactorUtilizationProps {
    filters: Filters;
    rows: UtilizationRow[];
    summary: Summary;
    options: {
        trucks: TruckOption[];
        drivers: DriverOption[];
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Reports', href: '/reports/load-factor-utilization' },
    { title: 'Load Factor & Utilization Analysis', href: '/reports/load-factor-utilization' },
];

export default function LoadFactorUtilization({ filters, rows = [], summary, options }: LoadFactorUtilizationProps) {
    const [from, setFrom] = useState(filters?.from ?? '');
    const [to, setTo] = useState(filters?.to ?? '');
    const [groupBy, setGroupBy] = useState(filters?.group_by ?? 'overall');
    const [dateError, setDateError] = useState<string | null>(null);

    const safeRows = useMemo<UtilizationRow[]>(() => (Array.isArray(rows) ? rows : []), [rows]);

    const validateDateRange = useCallback(
        (fromValue: string, toValue: string) => {
            if (!fromValue || !toValue) {
                setDateError(null);
                return true;
            }

            const fromDate = new Date(fromValue);
            const toDate = new Date(toValue);

            if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
                setDateError(null);
                return true;
            }

            if (fromDate > toDate) {
                setDateError('Start date must be before or equal to end date.');
                return false;
            }

            setDateError(null);
            return true;
        },
        [],
    );

    const handleApplyFilters = () => {
        if (!validateDateRange(from, to)) {
            return;
        }

        const params: Record<string, unknown> = {
            from,
            to,
            group_by: groupBy,
        };

        router.get('/reports/load-factor-utilization', params, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleReset = () => {
        setFrom(filters?.from ?? '');
        setTo(filters?.to ?? '');
        setGroupBy(filters?.group_by ?? 'overall');
        setDateError(null);
        router.get('/reports/load-factor-utilization', {}, { preserveState: false, preserveScroll: true });
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

    const summaryItems = useMemo<ReportSummaryItem[]>(
        () => [
            {
                label: 'Total Trips',
                value: formatInteger(summary?.total_trips ?? 0),
                icon: BarChart3,
                tone: 'bg-violet-100 text-violet-600 dark:bg-violet-500/20 dark:text-violet-200',
            },
            {
                label: 'Load Factor',
                value: formatPercentage(summary?.overall_load_factor_percent ?? 0),
                icon: Gauge,
                tone: summary?.overall_load_factor_percent && summary.overall_load_factor_percent >= 70
                    ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-200'
                    : summary?.overall_load_factor_percent && summary.overall_load_factor_percent >= 50
                    ? 'bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-200'
                    : 'bg-rose-100 text-rose-600 dark:bg-rose-500/20 dark:text-rose-200',
            },
            {
                label: 'Empty Miles %',
                value: formatPercentage(summary?.overall_empty_miles_percent ?? 0),
                icon: Route,
                tone: summary?.overall_empty_miles_percent && summary.overall_empty_miles_percent <= 30
                    ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-200'
                    : summary?.overall_empty_miles_percent && summary.overall_empty_miles_percent <= 50
                    ? 'bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-200'
                    : 'bg-rose-100 text-rose-600 dark:bg-rose-500/20 dark:text-rose-200',
            },
            {
                label: 'Deadhead Ratio',
                value: summary?.overall_deadhead_ratio !== undefined ? summary.overall_deadhead_ratio.toFixed(2) : '0.00',
                icon: TrendingUp,
                tone: summary?.overall_deadhead_ratio && summary.overall_deadhead_ratio <= 0.5
                    ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-200'
                    : summary?.overall_deadhead_ratio && summary.overall_deadhead_ratio <= 1.0
                    ? 'bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-200'
                    : 'bg-rose-100 text-rose-600 dark:bg-rose-500/20 dark:text-rose-200',
            },
            {
                label: 'Utilization Rate',
                value: formatPercentage(summary?.overall_utilization_rate ?? 0),
                icon: Package,
                tone: summary?.overall_utilization_rate && summary.overall_utilization_rate >= 70
                    ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-200'
                    : summary?.overall_utilization_rate && summary.overall_utilization_rate >= 50
                    ? 'bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-200'
                    : 'bg-rose-100 text-rose-600 dark:bg-rose-500/20 dark:text-rose-200',
            },
            {
                label: 'Total Distance',
                value: `${formatDecimal(summary?.total_distance ?? 0)} KM`,
                icon: Truck,
                tone: 'bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-200',
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

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Load Factor & Utilization Analysis" />
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-slate-100/60 dark:bg-slate-900/40">
                <div className="flex flex-1 flex-col gap-6 overflow-y-auto p-4 pb-10 sm:p-6 lg:p-10">
                    <header className="rounded-2xl border border-slate-200 bg-white/95 px-6 py-6 shadow-sm backdrop-blur dark:border-slate-800/70 dark:bg-slate-900/70">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                            <div className="space-y-2">
                                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500 dark:text-slate-400">Utilization Intelligence</p>
                                <h1 className="text-3xl font-semibold text-slate-900 dark:text-slate-50">Load Factor & Utilization Analysis</h1>
                                <p className="max-w-3xl text-sm text-slate-600 dark:text-slate-300">
                                    Analyse capacity utilization, empty miles, and deadhead ratios. Identify opportunities to reduce empty runs and improve fleet efficiency.
                                </p>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-medium text-slate-600 dark:text-slate-400">From</span>
                                    <input
                                        type="date"
                                        value={from}
                                        onChange={(e) => handleDateChange('from', e.target.value)}
                                        className="h-9 rounded-md border border-slate-300 bg-white px-3 text-sm dark:border-slate-600 dark:bg-slate-800"
                                    />
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-medium text-slate-600 dark:text-slate-400">To</span>
                                    <input
                                        type="date"
                                        value={to}
                                        onChange={(e) => handleDateChange('to', e.target.value)}
                                        className="h-9 rounded-md border border-slate-300 bg-white px-3 text-sm dark:border-slate-600 dark:bg-slate-800"
                                    />
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Group By</span>
                                    <Select value={groupBy} onValueChange={setGroupBy}>
                                        <SelectTrigger className="h-9 w-40">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="overall">Overall</SelectItem>
                                            <SelectItem value="truck">Truck</SelectItem>
                                            <SelectItem value="driver">Driver</SelectItem>
                                            <SelectItem value="route">Route</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                {dateError && (
                                    <span className="text-xs text-rose-600 dark:text-rose-400">{dateError}</span>
                                )}
                                <Button type="button" variant="outline" className="gap-2" onClick={handleReset}>
                                    <RefreshCcw className="h-4 w-4" />
                                    Reset
                                </Button>
                                <Button type="button" className="gap-2" onClick={handleApplyFilters}>
                                    Generate report
                                </Button>
                            </div>
                        </div>
                    </header>

                    <ReportSummaryGrid items={summaryItems} />

                    <Card className="border border-slate-200 bg-white/95 shadow-sm dark:border-slate-800/70 dark:bg-slate-900/70">
                        <CardHeader className="space-y-3 border-b border-slate-200/60 pb-5 dark:border-slate-700/60">
                            <div className="space-y-1">
                                <CardTitle className="text-lg font-semibold text-slate-900 dark:text-slate-50">Utilization Analysis ({groupByLabel})</CardTitle>
                                <CardDescription className="text-sm">Load factor, empty miles, and deadhead metrics grouped by {groupByLabel.toLowerCase()}.</CardDescription>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader className="bg-slate-50/60 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-900/60 dark:text-slate-400">
                                        <TableRow className="divide-x divide-slate-200/40 dark:divide-slate-800/50">
                                            <TableHead className="whitespace-nowrap">{groupByLabel}</TableHead>
                                            <TableHead className="whitespace-nowrap text-right">Trips</TableHead>
                                            <TableHead className="whitespace-nowrap text-right">Loaded (KM)</TableHead>
                                            <TableHead className="whitespace-nowrap text-right">Empty (KM)</TableHead>
                                            <TableHead className="whitespace-nowrap text-right">Total (KM)</TableHead>
                                            <TableHead className="whitespace-nowrap text-right">Tonnage</TableHead>
                                            <TableHead className="whitespace-nowrap text-right">Load Factor %</TableHead>
                                            <TableHead className="whitespace-nowrap text-right">Empty Miles %</TableHead>
                                            <TableHead className="whitespace-nowrap text-right">Deadhead Ratio</TableHead>
                                            <TableHead className="whitespace-nowrap text-right">Utilization Rate</TableHead>
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
                                                        {formatDecimal(row.distance_loaded)}
                                                    </TableCell>
                                                    <TableCell className="whitespace-nowrap text-right text-slate-600 dark:text-slate-400">
                                                        {formatDecimal(row.distance_empty)}
                                                    </TableCell>
                                                    <TableCell className="whitespace-nowrap text-right text-slate-600 dark:text-slate-400">
                                                        {formatDecimal(row.distance_total)}
                                                    </TableCell>
                                                    <TableCell className="whitespace-nowrap text-right text-slate-600 dark:text-slate-400">
                                                        {formatDecimal(row.tonnage)}
                                                    </TableCell>
                                                    <TableCell className="whitespace-nowrap text-right">
                                                        <Badge
                                                            className={
                                                                row.load_factor_percent >= 70
                                                                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200'
                                                                    : row.load_factor_percent >= 50
                                                                    ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-200'
                                                                    : 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-200'
                                                            }
                                                        >
                                                            {formatPercentage(row.load_factor_percent)}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="whitespace-nowrap text-right">
                                                        <Badge
                                                            className={
                                                                row.empty_miles_percent <= 30
                                                                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200'
                                                                    : row.empty_miles_percent <= 50
                                                                    ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-200'
                                                                    : 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-200'
                                                            }
                                                        >
                                                            {formatPercentage(row.empty_miles_percent)}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="whitespace-nowrap text-right text-slate-600 dark:text-slate-400">
                                                        {row.deadhead_ratio.toFixed(2)}
                                                    </TableCell>
                                                    <TableCell className="whitespace-nowrap text-right">
                                                        <Badge
                                                            className={
                                                                row.utilization_rate >= 70
                                                                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200'
                                                                    : row.utilization_rate >= 50
                                                                    ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-200'
                                                                    : 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-200'
                                                            }
                                                        >
                                                            {formatPercentage(row.utilization_rate)}
                                                        </Badge>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        ) : (
                                            <TableRow>
                                                <TableCell colSpan={10} className="py-10 text-center text-sm text-muted-foreground">
                                                    No utilization data available for the selected period. Adjust your filters and generate the report again.
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}

