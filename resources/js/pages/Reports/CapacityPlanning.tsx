import { useMemo, useState } from 'react';
import { router } from '@inertiajs/react';
import { type BreadcrumbItem } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ReportFiltersDialog } from '@/components/reports/report-filters-dialog';
import { formatCurrency, formatDecimal, formatPercentage } from '@/components/reports/formatters';
import {
    AlertTriangle,
    TrendingUp,
    TrendingDown,
    Truck,
    Target,
    Activity,
    AlertCircle,
    CheckCircle2,
    XCircle,
    Percent,
    Calendar,
    BarChart3,
    LineChart,
    Lightbulb
} from 'lucide-react';
import { usePermissions } from '@/hooks/use-permissions';
import { REPORT_DATE_RANGE_DESCRIPTION, useReportDateRange } from '@/components/reports/use-report-date-range';
import { ReportPageLayout } from '@/components/report/report-page-layout';

interface FleetOverview {
    total_trucks: number;
    active_trucks: number;
    maintenance_trucks: number;
    inactive_trucks: number;
    days_in_period: number;
    active_truck_days: number;
    total_possible_truck_days: number;
    utilization_rate: number;
    idle_truck_days: number;
    total_trips: number;
    total_revenue: number;
    avg_trips_per_truck: number | null;
    avg_revenue_per_truck: number | null;
}

interface UtilizationAnalysis {
    buckets: {
        high: number;
        optimal: number;
        moderate: number;
        low: number;
        very_low: number;
        unused: number;
    };
    average_utilization: number;
    high_utilization_count: number;
    optimal_utilization_count: number;
    underutilized_count: number;
    unused_count: number;
    truck_details: Array<{
        truck_id: number;
        plate: string;
        utilization: number;
        active_days: number;
        idle_days: number;
    }>;
}

interface DemandAnalysis {
    total_trips: number;
    internal_trips: number;
    outsource_trips: number;
    outsource_rate: number;
    total_tonnage: number;
    total_ton_km: number;
    total_distance: number;
    avg_trips_per_day: number;
    avg_tonnage_per_day: number;
    peak_daily_trips: number;
    min_daily_trips: number;
    demand_variability: number;
}

interface ProductivityMetrics {
    distance_per_truck_per_day: number;
    trips_per_truck_per_day: number;
    tonnage_per_truck_per_day: number;
    revenue_per_truck_per_day: number;
    avg_distance_per_trip: number;
    avg_tonnage_per_trip: number;
    avg_revenue_per_trip: number;
    total_distance: number;
    total_tonnage: number;
    total_trips: number;
}

interface IdleCapacity {
    total_possible_truck_days: number;
    active_truck_days: number;
    idle_truck_days: number;
    idle_rate: number;
    fixed_cost_per_truck_per_day: number;
    total_idle_cost: number;
    avg_revenue_per_truck_day: number;
    potential_revenue_from_idle: number;
    total_opportunity_cost: number;
    avg_truck_value: number;
}

interface TruckPerformance {
    truck_id: number;
    plate: string;
    vehicle_type: string;
    active_days: number;
    idle_days: number;
    utilization: number;
    trips: number;
    distance_km: number;
    tonnage: number;
    revenue: number;
    trips_per_day: number;
    revenue_per_day: number;
}

interface Recommendation {
    priority: 'high' | 'medium' | 'low';
    category: string;
    title: string;
    description: string;
    potential_savings?: number;
    potential_revenue?: number;
    optimal_fleet_size?: number;
    current_fleet_size?: number;
    expected_utilization?: number;
}

interface MonthlyTrend {
    month: string;
    year: number;
    month_num: number;
    utilization: number;
    active_truck_days: number;
    total_possible_truck_days: number;
    trips: number;
    avg_trips_per_day: number;
}

interface WeekdayPattern {
    day: string;
    total_trips: number;
    days_count: number;
    avg_trips_per_day: number;
}

interface Filters {
    from: string;
    to: string;
}

interface Props {
    filters: Filters;
    resolved_from: string;
    resolved_to: string;
    fleet_overview: FleetOverview;
    utilization_analysis: UtilizationAnalysis;
    demand_analysis: DemandAnalysis;
    productivity_metrics: ProductivityMetrics;
    idle_capacity: IdleCapacity;
    truck_performance: TruckPerformance[];
    recommendations: Recommendation[];
    monthly_trend: MonthlyTrend[];
    weekday_pattern: WeekdayPattern[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Reports', href: '/reports/capacity-planning' },
    { title: 'Capacity Planning', href: '/reports/capacity-planning' },
];

const formatOptionalCurrency = (value: number | null) => (value === null ? '—' : formatCurrency(value));
const formatOptionalPercentage = (value: number | null) => (value === null ? '—' : formatPercentage(value));
const formatOptionalDecimal = (value: number | null) => (value === null ? '—' : formatDecimal(value));

export default function CapacityPlanning({
    filters,
    resolved_from,
    resolved_to,
    fleet_overview,
    utilization_analysis,
    demand_analysis,
    productivity_metrics,
    idle_capacity,
    truck_performance = [],
    recommendations = [],
    monthly_trend = [],
    weekday_pattern = [],
}: Props) {
    const { hasPermission } = usePermissions();
    const canExport = hasPermission('reports.capacity-planning.export');

    const { from, to, dateError, handleDateChange, validateDateRange, resetDateRange } = useReportDateRange(
        filters?.from ?? '',
        filters?.to ?? ''
    );
    const [filtersOpen, setFiltersOpen] = useState(false);

    const activeFilterCount = useMemo(() => {
        let count = 0;
        if (from && from !== (filters?.from ?? '')) count += 1;
        if (to && to !== (filters?.to ?? '')) count += 1;
        return count;
    }, [from, to, filters?.from, filters?.to]);

    const handleApplyFilters = () => {
        if (!validateDateRange(from, to)) {
            setFiltersOpen(true);
            return;
        }

        setFiltersOpen(false);

        const params: Record<string, unknown> = { from, to };

        router.get('/reports/capacity-planning', params, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleReset = () => {
        resetDateRange(filters?.from ?? '', filters?.to ?? '');
        setFiltersOpen(false);
        router.get('/reports/capacity-planning', {}, { preserveState: false, preserveScroll: true });
    };

    const handleExport = (format: 'csv' | 'xlsx') => {
        if (!validateDateRange(from, to)) {
            setFiltersOpen(true);
            return;
        }

        if (!canExport) return;

        const params = new URLSearchParams();
        if (from) params.set('from', from);
        if (to) params.set('to', to);

        const query = params.toString();
        const url = `/reports/capacity-planning/export/${format}${query ? `?${query}` : ''}`;
        window.location.href = url;
    };

    const appliedFrom = filters?.from ?? '';
    const appliedTo = filters?.to ?? '';

    const filterBadges = useMemo(() => [`From ${appliedFrom || '—'}`, `To ${appliedTo || '—'}`], [appliedFrom, appliedTo]);

    const getUtilizationTone = (utilization: number) => {
        if (utilization >= 80) return 'text-rose-600 dark:text-rose-400';
        if (utilization >= 60) return 'text-emerald-600 dark:text-emerald-400';
        if (utilization >= 40) return 'text-amber-600 dark:text-amber-400';
        return 'text-slate-600 dark:text-slate-400';
    };

    const getPriorityBadgeClass = (priority: string) => {
        switch (priority) {
            case 'high':
                return 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-200';
            case 'medium':
                return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200';
            case 'low':
                return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200';
            default:
                return 'bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-200';
        }
    };

    const utilizationColor = fleet_overview.utilization_rate >= 60 && fleet_overview.utilization_rate <= 80 
        ? 'text-emerald-600 dark:text-emerald-400' 
        : 'text-amber-600 dark:text-amber-400';

    return (
        <ReportPageLayout
            title="Capacity Planning & Fleet Optimization"
            description="Analyze fleet utilization, identify overcapacity or undercapacity, and receive data-driven recommendations to right-size your fleet for optimal performance and cost efficiency."
            breadcrumbs={breadcrumbs}
            icon={<Target className="h-6 w-6" />}
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
                    showLimit={false}
                    showDriverFilter={false}
                    showTruckFilter={false}
                    showDestinationFilter={false}
                    showStatusFilter={false}
                    showOperationFilter={false}
                    dateError={dateError}
                    title="Filter capacity planning"
                    description="Adjust the reporting period to analyze capacity planning metrics."
                />
            }
            onRefresh={handleReset}
            onExportPdf={() => handleExport('pdf')}
            onExportExcel={() => handleExport('xlsx')}
            onExportCsv={() => handleExport('csv')}
            canExport={canExport}
            contentClassName="p-0"
        >
            <div className="space-y-6 p-6">
                                                <FileDigit className="h-4 w-4 text-amber-500" />
                                                CSV
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onSelect={() => handleExport('xlsx')} className="gap-2">
                                                <FileSpreadsheet className="h-4 w-4 text-emerald-500" />
                                                Excel
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                ) : null}
                                <Button type="button" variant="outline" className="gap-2" onClick={handleReset}>
                                    <RefreshCcw className="h-4 w-4" />
                                    Reset
                                </Button>
                            </div>
                        </div>
                    </header>

                    {/* Active Filters */}
                    {filterBadges.length > 0 ? (
                        <Card className="border-slate-200 dark:border-slate-800">
                            <CardContent className="flex flex-wrap gap-2 px-6 py-4">
                                <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Active Filters:</span>
                                {filterBadges.map((badge, index) => (
                                    <Badge key={index} variant="secondary" className="font-mono text-xs">
                                        {badge}
                                    </Badge>
                                ))}
                            </CardContent>
                        </Card>
                    ) : null}

                    {/* Key Metrics Cards */}
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <Card className="border-slate-200 dark:border-slate-800">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Fleet Utilization</CardTitle>
                                <Percent className="h-4 w-4 text-blue-500" />
                            </CardHeader>
                            <CardContent>
                                <div className={`text-2xl font-bold ${utilizationColor}`}>
                                    {formatPercentage(fleet_overview.utilization_rate)}
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                    {fleet_overview.active_truck_days} / {fleet_overview.total_possible_truck_days} truck-days active
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="border-slate-200 dark:border-slate-800">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Active Trucks</CardTitle>
                                <Truck className="h-4 w-4 text-emerald-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{fleet_overview.active_trucks}</div>
                                <p className="text-xs text-muted-foreground mt-1">
                                    {fleet_overview.maintenance_trucks} in maintenance, {fleet_overview.inactive_trucks} inactive
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="border-slate-200 dark:border-slate-800">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Idle Capacity Cost</CardTitle>
                                <AlertTriangle className="h-4 w-4 text-amber-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-rose-600 dark:text-rose-400">
                                    {formatCurrency(idle_capacity.total_opportunity_cost)}
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                    {idle_capacity.idle_truck_days} idle truck-days ({formatPercentage(idle_capacity.idle_rate)})
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="border-slate-200 dark:border-slate-800">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Outsource Rate</CardTitle>
                                <Target className="h-4 w-4 text-purple-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{formatPercentage(demand_analysis.outsource_rate)}</div>
                                <p className="text-xs text-muted-foreground mt-1">
                                    {demand_analysis.outsource_trips} / {demand_analysis.total_trips} trips outsourced
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Recommendations */}
                    {recommendations.length > 0 && (
                        <Card className="border-slate-200 dark:border-slate-800">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Lightbulb className="h-5 w-5 text-amber-500" />
                                    Optimization Recommendations
                                </CardTitle>
                                <CardDescription>Data-driven insights to improve fleet efficiency and profitability</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {recommendations.map((rec, index) => (
                                    <div key={index} className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/50">
                                        <div className="flex items-start gap-3">
                                            <div className="mt-1">
                                                {rec.priority === 'high' ? (
                                                    <AlertCircle className="h-5 w-5 text-rose-500" />
                                                ) : rec.priority === 'medium' ? (
                                                    <AlertTriangle className="h-5 w-5 text-amber-500" />
                                                ) : (
                                                    <CheckCircle2 className="h-5 w-5 text-blue-500" />
                                                )}
                                            </div>
                                            <div className="flex-1 space-y-2">
                                                <div className="flex items-center gap-2">
                                                    <Badge className={getPriorityBadgeClass(rec.priority)}>{rec.priority.toUpperCase()}</Badge>
                                                    <Badge variant="outline">{rec.category.replace('_', ' ')}</Badge>
                                                </div>
                                                <h4 className="font-semibold text-slate-900 dark:text-slate-50">{rec.title}</h4>
                                                <p className="text-sm text-slate-600 dark:text-slate-300">{rec.description}</p>
                                                {(rec.potential_savings || rec.potential_revenue) && (
                                                    <div className="flex gap-4 text-sm">
                                                        {rec.potential_savings && (
                                                            <span className="text-emerald-600 dark:text-emerald-400">
                                                                💰 Potential savings: {formatCurrency(rec.potential_savings)}
                                                            </span>
                                                        )}
                                                        {rec.potential_revenue && (
                                                            <span className="text-blue-600 dark:text-blue-400">
                                                                📈 Potential revenue: {formatCurrency(rec.potential_revenue)}
                                                            </span>
                                                        )}
                                                    </div>
                                                )}
                                                {rec.optimal_fleet_size && (
                                                    <div className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                                        Optimal fleet size: {rec.optimal_fleet_size} trucks (currently {rec.current_fleet_size}) →
                                                        Expected utilization: {formatPercentage(rec.expected_utilization ?? 0)}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    )}

                    {/* Utilization Distribution */}
                    <Card className="border-slate-200 dark:border-slate-800">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <BarChart3 className="h-5 w-5 text-indigo-500" />
                                Fleet Utilization Distribution
                            </CardTitle>
                            <CardDescription>How your trucks are distributed across utilization levels</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
                                <div className="text-center">
                                    <div className="text-3xl font-bold text-rose-600">{utilization_analysis.buckets.high}</div>
                                    <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">High (&gt;80%)</div>
                                    <div className="text-xs text-slate-500 mt-1">Potential overwork</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-3xl font-bold text-emerald-600">{utilization_analysis.buckets.optimal}</div>
                                    <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">Optimal (60-80%)</div>
                                    <div className="text-xs text-slate-500 mt-1">Ideal range</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-3xl font-bold text-amber-600">{utilization_analysis.buckets.moderate}</div>
                                    <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">Moderate (40-60%)</div>
                                    <div className="text-xs text-slate-500 mt-1">Room to improve</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-3xl font-bold text-orange-600">{utilization_analysis.buckets.low}</div>
                                    <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">Low (20-40%)</div>
                                    <div className="text-xs text-slate-500 mt-1">Underutilized</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-3xl font-bold text-rose-700">{utilization_analysis.buckets.very_low}</div>
                                    <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">Very Low (&lt;20%)</div>
                                    <div className="text-xs text-slate-500 mt-1">Rarely used</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-3xl font-bold text-slate-600">{utilization_analysis.buckets.unused}</div>
                                    <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">Unused (0%)</div>
                                    <div className="text-xs text-slate-500 mt-1">Not deployed</div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Demand & Productivity Analysis */}
                    <div className="grid gap-4 lg:grid-cols-2">
                        <Card className="border-slate-200 dark:border-slate-800">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Activity className="h-5 w-5 text-blue-500" />
                                    Demand Analysis
                                </CardTitle>
                                <CardDescription>Understanding demand patterns and variability</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm text-slate-600 dark:text-slate-400">Avg Trips/Day</p>
                                        <p className="text-2xl font-bold">{formatDecimal(demand_analysis.avg_trips_per_day)}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-slate-600 dark:text-slate-400">Peak Daily Trips</p>
                                        <p className="text-2xl font-bold">{demand_analysis.peak_daily_trips}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-slate-600 dark:text-slate-400">Demand Variability</p>
                                        <p className="text-2xl font-bold text-amber-600">{formatPercentage(demand_analysis.demand_variability)}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-slate-600 dark:text-slate-400">Total Tonnage</p>
                                        <p className="text-2xl font-bold">{formatDecimal(demand_analysis.total_tonnage)} MT</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-slate-200 dark:border-slate-800">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <TrendingUp className="h-5 w-5 text-green-500" />
                                    Productivity Metrics
                                </CardTitle>
                                <CardDescription>Average performance per truck per day</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm text-slate-600 dark:text-slate-400">Trips/Truck/Day</p>
                                        <p className="text-2xl font-bold">{formatDecimal(productivity_metrics.trips_per_truck_per_day)}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-slate-600 dark:text-slate-400">Distance/Truck/Day</p>
                                        <p className="text-2xl font-bold">{formatDecimal(productivity_metrics.distance_per_truck_per_day)} km</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-slate-600 dark:text-slate-400">Revenue/Truck/Day</p>
                                        <p className="text-2xl font-bold text-emerald-600">{formatCurrency(productivity_metrics.revenue_per_truck_per_day)}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-slate-600 dark:text-slate-400">Avg Revenue/Trip</p>
                                        <p className="text-2xl font-bold">{formatCurrency(productivity_metrics.avg_revenue_per_trip)}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Truck Performance Table */}
                    {truck_performance.length > 0 && (
                        <Card className="border-slate-200 dark:border-slate-800">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Truck className="h-5 w-5 text-cyan-500" />
                                    Individual Truck Performance
                                </CardTitle>
                                <CardDescription>Detailed utilization and productivity breakdown by truck</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Plate</TableHead>
                                                <TableHead>Type</TableHead>
                                                <TableHead className="text-right">Utilization</TableHead>
                                                <TableHead className="text-right">Active Days</TableHead>
                                                <TableHead className="text-right">Idle Days</TableHead>
                                                <TableHead className="text-right">Trips</TableHead>
                                                <TableHead className="text-right">Distance (KM)</TableHead>
                                                <TableHead className="text-right">Revenue</TableHead>
                                                <TableHead className="text-right">Revenue/Day</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {truck_performance.slice(0, 20).map((truck, index) => (
                                                <TableRow key={index}>
                                                    <TableCell className="font-medium">{truck.plate}</TableCell>
                                                    <TableCell>{truck.vehicle_type}</TableCell>
                                                    <TableCell className={`text-right font-bold ${getUtilizationTone(truck.utilization)}`}>
                                                        {formatPercentage(truck.utilization)}
                                                    </TableCell>
                                                    <TableCell className="text-right">{truck.active_days}</TableCell>
                                                    <TableCell className="text-right">{truck.idle_days}</TableCell>
                                                    <TableCell className="text-right">{truck.trips}</TableCell>
                                                    <TableCell className="text-right font-mono text-sm">{formatDecimal(truck.distance_km)}</TableCell>
                                                    <TableCell className="text-right font-mono text-sm">{formatCurrency(truck.revenue)}</TableCell>
                                                    <TableCell className="text-right font-mono text-sm">{formatCurrency(truck.revenue_per_day)}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                                {truck_performance.length > 20 && (
                                    <p className="text-sm text-slate-500 mt-4 text-center">
                                        Showing top 20 of {truck_performance.length} trucks. Export for full data.
                                    </p>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {/* Monthly Trend */}
                    {monthly_trend.length > 0 && (
                        <Card className="border-slate-200 dark:border-slate-800">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <LineChart className="h-5 w-5 text-purple-500" />
                                    Monthly Capacity Trend
                                </CardTitle>
                                <CardDescription>Track utilization and demand patterns over time</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Month</TableHead>
                                                <TableHead className="text-right">Utilization</TableHead>
                                                <TableHead className="text-right">Active Days</TableHead>
                                                <TableHead className="text-right">Total Possible</TableHead>
                                                <TableHead className="text-right">Trips</TableHead>
                                                <TableHead className="text-right">Avg Trips/Day</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {monthly_trend.map((trend, index) => (
                                                <TableRow key={index}>
                                                    <TableCell className="font-medium">{trend.month}</TableCell>
                                                    <TableCell className={`text-right font-bold ${getUtilizationTone(trend.utilization)}`}>
                                                        {formatPercentage(trend.utilization)}
                                                    </TableCell>
                                                    <TableCell className="text-right">{trend.active_truck_days}</TableCell>
                                                    <TableCell className="text-right">{trend.total_possible_truck_days}</TableCell>
                                                    <TableCell className="text-right">{trend.trips}</TableCell>
                                                    <TableCell className="text-right font-mono text-sm">{formatDecimal(trend.avg_trips_per_day)}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Weekday Pattern */}
                    {weekday_pattern.length > 0 && (
                        <Card className="border-slate-200 dark:border-slate-800">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Calendar className="h-5 w-5 text-pink-500" />
                                    Weekday Demand Pattern
                                </CardTitle>
                                <CardDescription>Understand which days have highest and lowest demand</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid gap-3 md:grid-cols-7">
                                    {weekday_pattern.map((day, index) => (
                                        <div key={index} className="text-center rounded-lg border border-slate-200 p-3 dark:border-slate-700">
                                            <div className="text-sm font-medium text-slate-600 dark:text-slate-400">{day.day}</div>
                                            <div className="text-2xl font-bold mt-2">{formatDecimal(day.avg_trips_per_day)}</div>
                                            <div className="text-xs text-slate-500 mt-1">avg trips/day</div>
                                            <div className="text-xs text-slate-400 mt-1">({day.total_trips} total)</div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}
            </div>
        </ReportPageLayout>
    );
}

