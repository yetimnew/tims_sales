import { useCallback, useMemo, useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ReportSummaryGrid, type ReportSummaryItem } from '@/components/reports/report-summary-grid';
import { formatCurrency, formatDecimal, formatInteger, formatPercentage } from '@/components/reports/formatters';
import { RefreshCcw, DollarSign, TrendingDown, Route, BarChart3, Fuel, User, Wrench } from 'lucide-react';
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
}

interface CostPerKilometerProps {
    filters: Filters;
    rows: CostPerKmRow[];
    summary: Summary;
    options: {
        trucks: TruckOption[];
        drivers: DriverOption[];
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Reports', href: '/reports/cost-per-kilometer' },
    { title: 'Cost Per Kilometer Analysis', href: '/reports/cost-per-kilometer' },
];

export default function CostPerKilometer({ filters, rows = [], summary, options }: CostPerKilometerProps) {
    const [from, setFrom] = useState(filters?.from ?? '');
    const [to, setTo] = useState(filters?.to ?? '');
    const [groupBy, setGroupBy] = useState(filters?.group_by ?? 'overall');
    const [dateError, setDateError] = useState<string | null>(null);

    const safeRows = useMemo<CostPerKmRow[]>(() => (Array.isArray(rows) ? rows : []), [rows]);

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

        router.get('/reports/cost-per-kilometer', params, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleReset = () => {
        setFrom(filters?.from ?? '');
        setTo(filters?.to ?? '');
        setGroupBy(filters?.group_by ?? 'overall');
        setDateError(null);
        router.get('/reports/cost-per-kilometer', {}, { preserveState: false, preserveScroll: true });
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

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Cost Per Kilometer Analysis" />
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-slate-100/60 dark:bg-slate-900/40">
                <div className="flex flex-1 flex-col gap-6 overflow-y-auto p-4 pb-10 sm:p-6 lg:p-10">
                    <header className="rounded-2xl border border-slate-200 bg-white/95 px-6 py-6 shadow-sm backdrop-blur dark:border-slate-800/70 dark:bg-slate-900/70">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                            <div className="space-y-2">
                                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500 dark:text-slate-400">Cost Intelligence</p>
                                <h1 className="text-3xl font-semibold text-slate-900 dark:text-slate-50">Cost Per Kilometer Analysis</h1>
                                <p className="max-w-3xl text-sm text-slate-600 dark:text-slate-300">
                                    Analyse cost efficiency by breaking down expenses per kilometer. Identify cost drivers and optimize operational expenses across your fleet.
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
            </div>
        </AppLayout>
    );
}

