import { useCallback, useMemo, useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ReportSummaryGrid, type ReportSummaryItem } from '@/components/reports/report-summary-grid';
import { formatCurrency, formatDecimal, formatInteger, formatPercentage, getMarginChipClass } from '@/components/reports/formatters';
import { RefreshCcw, Route, TrendingUp, TrendingDown, MapPin, Package, DollarSign, BarChart3 } from 'lucide-react';
import { usePermissions } from '@/hooks/use-permissions';

interface PlaceOption {
    id: number;
    name: string;
    code?: string | null;
}

interface RouteRow {
    origin_id: number | null;
    origin_name: string;
    destination_id: number | null;
    destination_name: string;
    route_key: string;
    trips: number;
    tonnage: number;
    ton_km: number;
    distance_wc: number;
    distance_wo: number;
    distance_total: number;
    avg_distance: number;
    avg_tonnage: number;
    fuel_cost: number;
    perdiem: number;
    work_on_going: number;
    other_cost: number;
    expense: number;
    revenue: number;
    profit: number;
    margin_percent: number | null;
    revenue_per_km: number;
    cost_per_km: number;
    profit_per_km: number;
}

interface Summary {
    total_routes: number;
    total_trips: number;
    total_tonnage: number;
    total_ton_km: number;
    total_distance: number;
    total_revenue: number;
    total_expense: number;
    total_profit: number;
    overall_margin_percent: number | null;
    avg_revenue_per_route: number;
    avg_profit_per_route: number;
}

interface Filters {
    from?: string | null;
    to?: string | null;
    origin_ids?: number[];
    destination_ids?: number[];
}

interface RouteProfitabilityProps {
    filters: Filters;
    rows: RouteRow[];
    summary: Summary;
    options: {
        places: PlaceOption[];
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Reports', href: '/reports/route-profitability' },
    { title: 'Route Profitability Matrix', href: '/reports/route-profitability' },
];

const toParamsArray = (key: string, values: number[], params: URLSearchParams) => {
    values.forEach((value) => params.append(`${key}[]`, String(value)));
};

export default function RouteProfitability({ filters, rows = [], summary, options }: RouteProfitabilityProps) {
    const { hasPermission } = usePermissions();
    const [filtersOpen, setFiltersOpen] = useState(false);
    const [from, setFrom] = useState(filters?.from ?? '');
    const [to, setTo] = useState(filters?.to ?? '');
    const [selectedOrigins, setSelectedOrigins] = useState<number[]>(filters?.origin_ids ?? []);
    const [selectedDestinations, setSelectedDestinations] = useState<number[]>(filters?.destination_ids ?? []);
    const [dateError, setDateError] = useState<string | null>(null);

    const placeSource = options?.places;
    const placeOptions = useMemo<PlaceOption[]>(() => (Array.isArray(placeSource) ? placeSource : []), [placeSource]);

    const safeRows = useMemo<RouteRow[]>(() => (Array.isArray(rows) ? rows : []), [rows]);

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
            setFiltersOpen(true);
            return;
        }

        setFiltersOpen(false);

        const params: Record<string, unknown> = {
            from,
            to,
        };

        if (selectedOrigins.length > 0) params.origin_ids = selectedOrigins;
        if (selectedDestinations.length > 0) params.destination_ids = selectedDestinations;

        router.get('/reports/route-profitability', params, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleReset = () => {
        setFrom(filters?.from ?? '');
        setTo(filters?.to ?? '');
        setSelectedOrigins(filters?.origin_ids ?? []);
        setSelectedDestinations(filters?.destination_ids ?? []);
        setFiltersOpen(false);
        setDateError(null);
        router.get('/reports/route-profitability', {}, { preserveState: false, preserveScroll: true });
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
                label: 'Total Routes',
                value: formatInteger(summary?.total_routes ?? 0),
                icon: Route,
                tone: 'bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-200',
            },
            {
                label: 'Total Trips',
                value: formatInteger(summary?.total_trips ?? 0),
                icon: BarChart3,
                tone: 'bg-violet-100 text-violet-600 dark:bg-violet-500/20 dark:text-violet-200',
            },
            {
                label: 'Total Revenue',
                value: formatCurrency(summary?.total_revenue ?? 0),
                icon: DollarSign,
                tone: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-200',
            },
            {
                label: 'Total Profit',
                value: formatCurrency(summary?.total_profit ?? 0),
                icon: TrendingUp,
                tone: summary?.total_profit && summary.total_profit >= 0
                    ? 'bg-cyan-100 text-cyan-600 dark:bg-cyan-500/20 dark:text-cyan-200'
                    : 'bg-rose-100 text-rose-600 dark:bg-rose-500/20 dark:text-rose-200',
            },
            {
                label: 'Overall Margin',
                value: formatPercentage(summary?.overall_margin_percent),
                icon: TrendingDown,
                tone: summary?.overall_margin_percent && summary.overall_margin_percent >= 0
                    ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-200'
                    : 'bg-rose-100 text-rose-600 dark:bg-rose-500/20 dark:text-rose-200',
            },
            {
                label: 'Avg Profit/Route',
                value: formatCurrency(summary?.avg_profit_per_route ?? 0),
                icon: Package,
                tone: summary?.avg_profit_per_route && summary.avg_profit_per_route >= 0
                    ? 'bg-sky-100 text-sky-600 dark:bg-sky-500/20 dark:text-sky-200'
                    : 'bg-slate-100 text-slate-600 dark:bg-slate-500/20 dark:text-slate-200',
            },
        ],
        [summary],
    );

    const activeFilterCount = useMemo(() => {
        let count = 0;
        if (selectedOrigins.length > 0) count++;
        if (selectedDestinations.length > 0) count++;
        return count;
    }, [selectedOrigins.length, selectedDestinations.length]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Route Profitability Matrix" />
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-slate-100/60 dark:bg-slate-900/40">
                <div className="flex flex-1 flex-col gap-6 overflow-y-auto p-4 pb-10 sm:p-6 lg:p-10">
                    <header className="rounded-2xl border border-slate-200 bg-white/95 px-6 py-6 shadow-sm backdrop-blur dark:border-slate-800/70 dark:bg-slate-900/70">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                            <div className="space-y-2">
                                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500 dark:text-slate-400">Route Intelligence</p>
                                <h1 className="text-3xl font-semibold text-slate-900 dark:text-slate-50">Route Profitability Matrix</h1>
                                <p className="max-w-3xl text-sm text-slate-600 dark:text-slate-300">
                                    Analyse profitability by origin-destination route pairs. Identify high-performing routes, optimize pricing, and discover opportunities to improve underperforming corridors.
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
                                <CardTitle className="text-lg font-semibold text-slate-900 dark:text-slate-50">Route Performance Matrix</CardTitle>
                                <CardDescription className="text-sm">Profitability metrics grouped by origin-destination pairs, sorted by profit.</CardDescription>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader className="bg-slate-50/60 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-900/60 dark:text-slate-400">
                                        <TableRow className="divide-x divide-slate-200/40 dark:divide-slate-800/50">
                                            <TableHead className="whitespace-nowrap">Route</TableHead>
                                            <TableHead className="whitespace-nowrap text-right">Trips</TableHead>
                                            <TableHead className="whitespace-nowrap text-right">Tonnage</TableHead>
                                            <TableHead className="whitespace-nowrap text-right">Ton-KM</TableHead>
                                            <TableHead className="whitespace-nowrap text-right">Distance (KM)</TableHead>
                                            <TableHead className="whitespace-nowrap text-right">Avg Distance</TableHead>
                                            <TableHead className="whitespace-nowrap text-right">Revenue</TableHead>
                                            <TableHead className="whitespace-nowrap text-right">Expense</TableHead>
                                            <TableHead className="whitespace-nowrap text-right">Profit</TableHead>
                                            <TableHead className="whitespace-nowrap text-right">Margin %</TableHead>
                                            <TableHead className="whitespace-nowrap text-right">Revenue/KM</TableHead>
                                            <TableHead className="whitespace-nowrap text-right">Cost/KM</TableHead>
                                            <TableHead className="whitespace-nowrap text-right">Profit/KM</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {safeRows.length > 0 ? (
                                            safeRows.map((route) => (
                                                <TableRow key={route.route_key} className="divide-x divide-slate-100 hover:bg-slate-50/70 dark:divide-slate-800/50 dark:hover:bg-slate-900/50">
                                                    <TableCell className="whitespace-nowrap">
                                                        <div className="space-y-0.5">
                                                            <div className="font-medium text-slate-900 dark:text-slate-100">
                                                                <MapPin className="mr-1 inline h-3.5 w-3.5 text-slate-400" />
                                                                {route.origin_name}
                                                            </div>
                                                            <div className="text-xs text-slate-500 dark:text-slate-400">
                                                                → {route.destination_name}
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="whitespace-nowrap text-right font-medium text-slate-900 dark:text-slate-100">
                                                        {formatInteger(route.trips)}
                                                    </TableCell>
                                                    <TableCell className="whitespace-nowrap text-right text-slate-600 dark:text-slate-400">
                                                        {formatDecimal(route.tonnage)}
                                                    </TableCell>
                                                    <TableCell className="whitespace-nowrap text-right text-slate-600 dark:text-slate-400">
                                                        {formatDecimal(route.ton_km)}
                                                    </TableCell>
                                                    <TableCell className="whitespace-nowrap text-right text-slate-600 dark:text-slate-400">
                                                        {formatDecimal(route.distance_total)}
                                                    </TableCell>
                                                    <TableCell className="whitespace-nowrap text-right text-slate-600 dark:text-slate-400">
                                                        {formatDecimal(route.avg_distance)}
                                                    </TableCell>
                                                    <TableCell className="whitespace-nowrap text-right font-medium text-slate-900 dark:text-slate-100">
                                                        {formatCurrency(route.revenue)}
                                                    </TableCell>
                                                    <TableCell className="whitespace-nowrap text-right text-slate-600 dark:text-slate-400">
                                                        {formatCurrency(route.expense)}
                                                    </TableCell>
                                                    <TableCell className="whitespace-nowrap text-right font-semibold">
                                                        <span className={route.profit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}>
                                                            {formatCurrency(route.profit)}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell className="whitespace-nowrap text-right">
                                                        {route.margin_percent !== null ? (
                                                            <Badge className={getMarginChipClass(route.margin_percent)}>
                                                                {formatPercentage(route.margin_percent)}
                                                            </Badge>
                                                        ) : (
                                                            <span className="text-slate-400">—</span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="whitespace-nowrap text-right text-slate-600 dark:text-slate-400">
                                                        {formatCurrency(route.revenue_per_km)}
                                                    </TableCell>
                                                    <TableCell className="whitespace-nowrap text-right text-slate-600 dark:text-slate-400">
                                                        {formatCurrency(route.cost_per_km)}
                                                    </TableCell>
                                                    <TableCell className="whitespace-nowrap text-right font-medium">
                                                        <span className={route.profit_per_km >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}>
                                                            {formatCurrency(route.profit_per_km)}
                                                        </span>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        ) : (
                                            <TableRow>
                                                <TableCell colSpan={13} className="py-10 text-center text-sm text-muted-foreground">
                                                    No route data available for the selected period. Adjust your filters and generate the report again.
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

