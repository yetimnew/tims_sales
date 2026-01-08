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
    Route,
    Navigation,
    MapPin,
    TrendingDown,
    TrendingUp,
    DollarSign,
    ArrowRightLeft,
    Target,
    Lightbulb,
    AlertCircle,
    CheckCircle2,
    Map,
    Repeat
} from 'lucide-react';
import { usePermissions } from '@/hooks/use-permissions';
import { REPORT_DATE_RANGE_DESCRIPTION, useReportDateRange } from '@/components/reports/use-report-date-range';
import { ReportPageLayout } from '@/components/report/report-page-layout';

type QueryParamValue = string | number | boolean | null | undefined | Array<string | number | boolean>;

interface EmptyMilesAnalysis {
    total_miles: number;
    total_loaded_miles: number;
    total_empty_miles: number;
    empty_miles_ratio: number;
    loaded_miles_ratio: number;
    total_trips: number;
    trips_with_empty_miles: number;
    trips_without_empty_miles: number;
    avg_empty_miles_per_trip: number;
    avg_loaded_miles_per_trip: number;
    industry_benchmark: number;
    performance_vs_benchmark: number;
}

interface BackhaulOpportunity {
    destination_id: number;
    destination_name: string;
    outbound_trips: number;
    backhaul_trips: number;
    backhaul_utilization: number;
    backhaul_gap: number;
    total_empty_miles: number;
    avg_empty_miles: number;
}

interface LaneAnalysis {
    origin_id: number;
    destination_id: number;
    origin_name: string;
    destination_name: string;
    trip_count: number;
    reverse_trip_count: number;
    total_distance: number;
    loaded_distance: number;
    empty_distance: number;
    tonnage: number;
    avg_distance: number;
    empty_ratio: number;
    lane_balance: number;
}

interface RouteBalance {
    location_id: number;
    location_name: string;
    outbound_trips: number;
    inbound_trips: number;
    total_trips: number;
    net_flow: number;
    balance_ratio: number;
    flow_type: 'source' | 'sink' | 'balanced';
}

interface DeadheadCostAnalysis {
    total_empty_miles: number;
    cost_per_km: number;
    deadhead_fuel_cost: number;
    deadhead_maintenance_cost: number;
    total_deadhead_cost: number;
    avg_deadhead_cost_per_trip: number;
    trips_with_empty_miles: number;
}

interface BackhaulRevenueOpportunity {
    avg_revenue_per_loaded_km: number;
    total_empty_miles: number;
    convertible_empty_miles: number;
    potential_backhaul_revenue: number;
    high_potential_lanes: LaneAnalysis[];
    potential_revenue_from_top_lanes: number;
}

interface Recommendation {
    priority: 'high' | 'medium' | 'low';
    category: string;
    title: string;
    description: string;
    potential_savings?: number;
    potential_revenue?: number;
}

interface Filters {
    from: string;
    to: string;
}

interface Props {
    filters: Filters;
    resolved_from: string;
    resolved_to: string;
    empty_miles_analysis: EmptyMilesAnalysis;
    backhaul_opportunities: {
        opportunities: BackhaulOpportunity[];
        total_opportunities: number;
        total_backhaul_gap: number;
        avg_backhaul_utilization: number;
    };
    lane_analysis: LaneAnalysis[];
    route_balance: RouteBalance[];
    deadhead_cost_analysis: DeadheadCostAnalysis;
    backhaul_revenue_opportunity: BackhaulRevenueOpportunity;
    recommendations: Recommendation[];
    top_imbalanced_lanes: LaneAnalysis[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Reports', href: '/reports/network-optimization' },
    { title: 'Network Optimization', href: '/reports/network-optimization' },
];

export default function NetworkOptimization({
    filters,
    empty_miles_analysis,
    backhaul_opportunities,
    lane_analysis: _lane_analysis = [],
    route_balance = [],
    deadhead_cost_analysis,
    backhaul_revenue_opportunity,
    recommendations = [],
    top_imbalanced_lanes = [],
}: Props) {
    const { hasPermission } = usePermissions();
    const canExport = hasPermission('reports.network-optimization.export');

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

        const params: Record<string, QueryParamValue> = {};

        if (from) params.from = from;
        if (to) params.to = to;

        router.get('/reports/network-optimization', params, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleReset = () => {
        resetDateRange(filters?.from ?? '', filters?.to ?? '');
        setFiltersOpen(false);
        router.get('/reports/network-optimization', undefined, { preserveState: false, preserveScroll: true });
    };

    const handleExport = (format: 'csv' | 'xlsx' | 'pdf') => {
        if (!validateDateRange(from, to)) {
            setFiltersOpen(true);
            return;
        }

        if (!canExport) return;

        const params = new URLSearchParams();
        if (from) params.set('from', from);
        if (to) params.set('to', to);

        const query = params.toString();
        const url = `/reports/network-optimization/export/${format}${query ? `?${query}` : ''}`;
        window.location.href = url;
    };

    const appliedFrom = filters?.from ?? '';
    const appliedTo = filters?.to ?? '';

    const filterBadges = useMemo(() => [`From ${appliedFrom || '—'}`, `To ${appliedTo || '—'}`], [appliedFrom, appliedTo]);

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

    const getFlowTypeIcon = (flowType: string) => {
        switch (flowType) {
            case 'source':
                return <TrendingUp className="h-4 w-4 text-blue-500" />;
            case 'sink':
                return <TrendingDown className="h-4 w-4 text-purple-500" />;
            default:
                return <ArrowRightLeft className="h-4 w-4 text-emerald-500" />;
        }
    };

    const getEmptyRatioColor = (ratio: number) => {
        if (ratio > 30) return 'text-rose-600 dark:text-rose-400';
        if (ratio > 20) return 'text-amber-600 dark:text-amber-400';
        return 'text-emerald-600 dark:text-emerald-400';
    };

    const emptyRatioColor = getEmptyRatioColor(empty_miles_analysis.empty_miles_ratio);
    const benchmarkColor = empty_miles_analysis.performance_vs_benchmark > 0
        ? 'text-rose-600 dark:text-rose-400'
        : 'text-emerald-600 dark:text-emerald-400';

    return (
        <ReportPageLayout
            title="Network Optimization & Backhaul"
            breadcrumbs={breadcrumbs}
            icon={<Navigation className="h-6 w-6" />}
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
                    title="Filter network optimization"
                    description="Adjust the reporting period to analyze network optimization metrics."
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
                {/* Active Filters */}
                {filterBadges.length > 0 && (
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
                )}

                {/* Key Metrics Cards */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <Card className="border-slate-200 dark:border-slate-800">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Empty Miles Ratio</CardTitle>
                                <Navigation className="h-4 w-4 text-rose-500" />
                            </CardHeader>
                            <CardContent>
                                <div className={`text-2xl font-bold ${emptyRatioColor}`}>
                                    {formatPercentage(empty_miles_analysis.empty_miles_ratio)}
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Benchmark: {formatPercentage(empty_miles_analysis.industry_benchmark)} |
                                    <span className={benchmarkColor}>
                                        {' '}{empty_miles_analysis.performance_vs_benchmark >= 0 ? '+' : ''}
                                        {formatPercentage(Math.abs(empty_miles_analysis.performance_vs_benchmark))}
                                    </span>
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="border-slate-200 dark:border-slate-800">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Deadhead Cost</CardTitle>
                                <DollarSign className="h-4 w-4 text-amber-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-rose-600 dark:text-rose-400">
                                    {formatCurrency(deadhead_cost_analysis.total_deadhead_cost)}
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                    {formatDecimal(deadhead_cost_analysis.total_empty_miles)} km empty miles
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="border-slate-200 dark:border-slate-800">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Backhaul Revenue Potential</CardTitle>
                                <Target className="h-4 w-4 text-emerald-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                                    {formatCurrency(backhaul_revenue_opportunity.potential_backhaul_revenue)}
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                    From {formatDecimal(backhaul_revenue_opportunity.convertible_empty_miles)} convertible km
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="border-slate-200 dark:border-slate-800">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Backhaul Utilization</CardTitle>
                                <Repeat className="h-4 w-4 text-blue-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {formatPercentage(backhaul_opportunities.avg_backhaul_utilization)}
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                    {backhaul_opportunities.total_backhaul_gap} backhaul gaps identified
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
                                    Network Optimization Recommendations
                                </CardTitle>
                                <CardDescription>Data-driven strategies to reduce empty miles and capture backhaul revenue</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {recommendations.map((rec, index) => (
                                    <div
                                        key={index}
                                        className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/50"
                                    >
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
                                                    <Badge className={getPriorityBadgeClass(rec.priority)}>
                                                        {rec.priority.toUpperCase()}
                                                    </Badge>
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
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    )}

                    {/* Empty Miles & Deadhead Analysis */}
                    <div className="grid gap-4 lg:grid-cols-2">
                        <Card className="border-slate-200 dark:border-slate-800">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Route className="h-5 w-5 text-indigo-500" />
                                    Empty Miles Breakdown
                                </CardTitle>
                                <CardDescription>Understanding loaded vs empty miles performance</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm text-slate-600 dark:text-slate-400">Total Miles</p>
                                        <p className="text-2xl font-bold">{formatDecimal(empty_miles_analysis.total_miles)} km</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-slate-600 dark:text-slate-400">Empty Miles</p>
                                        <p className={`text-2xl font-bold ${emptyRatioColor}`}>
                                            {formatDecimal(empty_miles_analysis.total_empty_miles)} km
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-slate-600 dark:text-slate-400">Loaded Miles</p>
                                        <p className="text-2xl font-bold text-emerald-600">
                                            {formatDecimal(empty_miles_analysis.total_loaded_miles)} km
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-slate-600 dark:text-slate-400">Trips with Empty Miles</p>
                                        <p className="text-2xl font-bold">{empty_miles_analysis.trips_with_empty_miles}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-slate-200 dark:border-slate-800">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <DollarSign className="h-5 w-5 text-amber-500" />
                                    Deadhead Cost Analysis
                                </CardTitle>
                                <CardDescription>Financial impact of empty miles</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm text-slate-600 dark:text-slate-400">Fuel Cost</p>
                                        <p className="text-2xl font-bold text-rose-600">
                                            {formatCurrency(deadhead_cost_analysis.deadhead_fuel_cost)}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-slate-600 dark:text-slate-400">Maintenance Cost</p>
                                        <p className="text-2xl font-bold text-orange-600">
                                            {formatCurrency(deadhead_cost_analysis.deadhead_maintenance_cost)}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-slate-600 dark:text-slate-400">Avg Cost per Trip</p>
                                        <p className="text-2xl font-bold">{formatCurrency(deadhead_cost_analysis.avg_deadhead_cost_per_trip)}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-slate-600 dark:text-slate-400">Cost per KM</p>
                                        <p className="text-2xl font-bold">{formatCurrency(deadhead_cost_analysis.cost_per_km)}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Backhaul Opportunities */}
                    {backhaul_opportunities.opportunities.length > 0 && (
                        <Card className="border-slate-200 dark:border-slate-800">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Target className="h-5 w-5 text-green-500" />
                                    Top Backhaul Opportunities
                                </CardTitle>
                                <CardDescription>Locations with highest backhaul potential (showing top 10)</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Destination</TableHead>
                                                <TableHead className="text-right">Outbound</TableHead>
                                                <TableHead className="text-right">Backhaul</TableHead>
                                                <TableHead className="text-right">Utilization</TableHead>
                                                <TableHead className="text-right">Backhaul Gap</TableHead>
                                                <TableHead className="text-right">Empty Miles</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {backhaul_opportunities.opportunities.slice(0, 10).map((opp, index) => (
                                                <TableRow key={index}>
                                                    <TableCell className="font-medium">{opp.destination_name}</TableCell>
                                                    <TableCell className="text-right">{opp.outbound_trips}</TableCell>
                                                    <TableCell className="text-right">{opp.backhaul_trips}</TableCell>
                                                    <TableCell className="text-right font-bold">
                                                        {formatPercentage(opp.backhaul_utilization)}
                                                    </TableCell>
                                                    <TableCell className="text-right font-bold text-rose-600">
                                                        {opp.backhaul_gap}
                                                    </TableCell>
                                                    <TableCell className="text-right font-mono text-sm">
                                                        {formatDecimal(opp.total_empty_miles)} km
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Top Imbalanced Lanes */}
                    {top_imbalanced_lanes.length > 0 && (
                        <Card className="border-slate-200 dark:border-slate-800">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <MapPin className="h-5 w-5 text-purple-500" />
                                    Top Imbalanced Lanes
                                </CardTitle>
                                <CardDescription>High-volume lanes with poor balance (&lt;50%)</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Origin</TableHead>
                                                <TableHead>Destination</TableHead>
                                                <TableHead className="text-right">Forward Trips</TableHead>
                                                <TableHead className="text-right">Return Trips</TableHead>
                                                <TableHead className="text-right">Balance</TableHead>
                                                <TableHead className="text-right">Empty Ratio</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {top_imbalanced_lanes.slice(0, 10).map((lane, index) => (
                                                <TableRow key={index}>
                                                    <TableCell className="font-medium">{lane.origin_name}</TableCell>
                                                    <TableCell>{lane.destination_name}</TableCell>
                                                    <TableCell className="text-right">{lane.trip_count}</TableCell>
                                                    <TableCell className="text-right">{lane.reverse_trip_count}</TableCell>
                                                    <TableCell className="text-right font-bold text-amber-600">
                                                        {formatPercentage(lane.lane_balance)}
                                                    </TableCell>
                                                    <TableCell className={`text-right font-bold ${getEmptyRatioColor(lane.empty_ratio)}`}>
                                                        {formatPercentage(lane.empty_ratio)}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Route Balance */}
                    {route_balance.length > 0 && (
                        <Card className="border-slate-200 dark:border-slate-800">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Map className="h-5 w-5 text-cyan-500" />
                                    Route Balance by Location
                                </CardTitle>
                                <CardDescription>Inbound vs outbound flow for each location (showing top 15)</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Location</TableHead>
                                                <TableHead className="text-right">Outbound</TableHead>
                                                <TableHead className="text-right">Inbound</TableHead>
                                                <TableHead className="text-right">Net Flow</TableHead>
                                                <TableHead className="text-right">Balance</TableHead>
                                                <TableHead>Flow Type</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {route_balance.slice(0, 15).map((location, index) => (
                                                <TableRow key={index}>
                                                    <TableCell className="font-medium">{location.location_name}</TableCell>
                                                    <TableCell className="text-right">{location.outbound_trips}</TableCell>
                                                    <TableCell className="text-right">{location.inbound_trips}</TableCell>
                                                    <TableCell className="text-right font-bold">
                                                        {location.net_flow > 0 ? '+' : ''}
                                                        {location.net_flow}
                                                    </TableCell>
                                                    <TableCell className="text-right">{formatPercentage(location.balance_ratio)}</TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-2">
                                                            {getFlowTypeIcon(location.flow_type)}
                                                            <span className="capitalize">{location.flow_type}</span>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </CardContent>
                        </Card>
                    )}
            </div>
        </ReportPageLayout>
    );
}

