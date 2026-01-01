import { useMemo, useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ReportFiltersDialog } from '@/components/reports/report-filters-dialog';
import { formatCurrency, formatDecimal, formatPercentage } from '@/components/reports/formatters';
import { 
    CircleDollarSign, 
    Download, 
    FileDigit, 
    FileSpreadsheet, 
    RefreshCcw, 
    TrendingUp,
    TrendingDown,
    DollarSign,
    Coins,
    PiggyBank,
    Wallet,
    ArrowUpRight,
    ArrowDownRight,
    Activity,
    Target,
    BarChart3,
    Building2,
    Percent
} from 'lucide-react';
import { usePermissions } from '@/hooks/use-permissions';
import { REPORT_DATE_RANGE_DESCRIPTION, useReportDateRange } from '@/components/reports/use-report-date-range';

interface Profitability {
    total_revenue: number;
    total_cost: number;
    gross_profit: number;
    gross_profit_margin: number | null;
    admin_overhead: number;
    ebitda: number;
    ebitda_margin: number | null;
    depreciation: number;
    ebit: number;
    ebit_margin: number | null;
    interest_expense: number;
    net_profit: number;
    net_profit_margin: number | null;
    roi: number | null;
    roic: number | null;
}

interface Revenue {
    total_revenue: number;
    revenue_per_truck_per_month: number | null;
    revenue_per_km: number | null;
    revenue_per_ton_km: number | null;
    revenue_growth_rate: number | null;
    internal_revenue: number;
    outsource_revenue: number;
    internal_revenue_percent: number | null;
    outsource_revenue_percent: number | null;
}

interface Costs {
    fuel_cost: number;
    labor_cost: number;
    maintenance_cost: number;
    admin_cost: number;
    other_operational_cost: number;
    outsource_cost: number;
    variable_cost: number;
    fixed_cost: number;
    total_cost: number;
    fuel_cost_per_km: number | null;
    labor_cost_per_km: number | null;
    maintenance_cost_per_km: number | null;
    total_cost_per_km: number | null;
    fuel_cost_percent: number | null;
    labor_cost_percent: number | null;
    maintenance_cost_percent: number | null;
    admin_cost_percent: number | null;
    variable_percent: number | null;
    fixed_percent: number | null;
}

interface CashFlow {
    operating_cash_flow: number;
    free_cash_flow: number;
    working_capital_needs: number;
    days_sales_outstanding: number;
    days_payable_outstanding: number;
    cash_conversion_cycle: number;
    estimated_capex: number;
}

interface CapitalEfficiency {
    fleet_value: number;
    active_truck_count: number;
    fleet_utilization: number | null;
    asset_turnover_ratio: number | null;
    revenue_per_asset_birr: number | null;
    total_distance_km: number;
}

interface TrendPoint {
    month: string;
    year: number;
    month_num: number;
    revenue: number;
    cost: number;
    profit: number;
    margin: number | null;
}

interface BreakdownPoint {
    month: string;
    year: number;
    month_num: number;
    revenue: number;
    cost: number;
    profit: number;
    margin: number | null;
    trips: number;
    distance_km: number;
    revenue_per_km: number | null;
    cost_per_km: number | null;
}

interface Filters {
    from: string;
    to: string;
}

interface Props {
    filters: Filters;
    resolved_from: string;
    resolved_to: string;
    profitability: Profitability;
    revenue: Revenue;
    costs: Costs;
    cash_flow: CashFlow;
    capital_efficiency: CapitalEfficiency;
    trends: TrendPoint[];
    breakdown: BreakdownPoint[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Reports', href: '/reports/fleet-financial' },
    { title: 'Fleet Financial Dashboard', href: '/reports/fleet-financial' },
];

const formatOptionalCurrency = (value: number | null) => (value === null ? '—' : formatCurrency(value));
const formatOptionalPercentage = (value: number | null) => (value === null ? '—' : formatPercentage(value));
const formatOptionalDecimal = (value: number | null) => (value === null ? '—' : formatDecimal(value));

export default function FleetFinancial({ 
    filters, 
    resolved_from,
    resolved_to,
    profitability, 
    revenue, 
    costs, 
    cash_flow, 
    capital_efficiency, 
    trends = [], 
    breakdown = [] 
}: Props) {
    const { hasPermission } = usePermissions();
    const canExport = hasPermission('reports.fleet-financial.export');

    const { from, to, dateError, handleDateChange, validateDateRange, resetDateRange } = useReportDateRange(filters?.from ?? '', filters?.to ?? '');
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

        router.get('/reports/fleet-financial', params, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleReset = () => {
        resetDateRange(filters?.from ?? '', filters?.to ?? '');
        setFiltersOpen(false);
        router.get('/reports/fleet-financial', {}, { preserveState: false, preserveScroll: true });
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
        const url = `/reports/fleet-financial/export/${format}${query ? `?${query}` : ''}`;
        window.location.href = url;
    };

    const appliedFrom = filters?.from ?? '';
    const appliedTo = filters?.to ?? '';

    const filterBadges = useMemo(
        () => [
            `From ${appliedFrom || '—'}`,
            `To ${appliedTo || '—'}`,
        ],
        [appliedFrom, appliedTo],
    );

    const getFinancialTone = (value: number | null) => {
        if (value === null) return 'text-slate-600 dark:text-slate-400';
        if (value >= 0) return 'text-emerald-600 dark:text-emerald-400';
        return 'text-rose-600 dark:text-rose-400';
    };

    const getMarginTone = (value: number | null) => {
        if (value === null) return 'text-slate-600 dark:text-slate-400';
        if (value >= 20) return 'text-emerald-600 dark:text-emerald-400';
        if (value >= 10) return 'text-amber-600 dark:text-amber-400';
        return 'text-rose-600 dark:text-rose-400';
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Fleet Financial Dashboard" />
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-slate-100/60 dark:bg-slate-900/40">
                <div className="flex flex-1 flex-col gap-6 overflow-y-auto p-4 pb-10 sm:p-6 lg:p-10">
                    {/* Header */}
                    <header className="rounded-2xl border border-slate-200 bg-white/95 px-6 py-6 shadow-sm backdrop-blur dark:border-slate-800/70 dark:bg-slate-900/70">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                            <div className="space-y-2">
                                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500 dark:text-slate-400">Executive Dashboard</p>
                                <h1 className="text-3xl font-semibold text-slate-900 dark:text-slate-50">Fleet Financial Dashboard</h1>
                                <p className="max-w-3xl text-sm text-slate-600 dark:text-slate-300">
                                    Strategic financial KPIs and performance metrics for executive decision-making. Comprehensive view of profitability, cash flow, and capital efficiency.
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
                                    title="Filter financial dashboard"
                                    description="Adjust the reporting period to view financial metrics for a specific time range."
                                />
                                {canExport ? (
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button type="button" variant="secondary" className="gap-2">
                                                <Download className="h-4 w-4" />
                                                Export
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="w-44">
                                            <DropdownMenuItem onSelect={() => handleExport('csv')} className="gap-2">
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

                    {/* Executive Summary Cards */}
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <Card className="border-slate-200 dark:border-slate-800">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                                <CircleDollarSign className="h-4 w-4 text-emerald-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{formatCurrency(profitability.total_revenue)}</div>
                                {revenue.revenue_growth_rate !== null && (
                                    <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                                        {revenue.revenue_growth_rate >= 0 ? (
                                            <ArrowUpRight className="h-3 w-3 text-emerald-500" />
                                        ) : (
                                            <ArrowDownRight className="h-3 w-3 text-rose-500" />
                                        )}
                                        <span className={revenue.revenue_growth_rate >= 0 ? 'text-emerald-600' : 'text-rose-600'}>
                                            {formatPercentage(Math.abs(revenue.revenue_growth_rate))} vs previous period
                                        </span>
                                    </p>
                                )}
                            </CardContent>
                        </Card>

                        <Card className="border-slate-200 dark:border-slate-800">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
                                <PiggyBank className="h-4 w-4 text-violet-500" />
                            </CardHeader>
                            <CardContent>
                                <div className={`text-2xl font-bold ${getFinancialTone(profitability.net_profit)}`}>
                                    {formatCurrency(profitability.net_profit)}
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                    <span className={getMarginTone(profitability.net_profit_margin)}>
                                        {formatOptionalPercentage(profitability.net_profit_margin)} margin
                                    </span>
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="border-slate-200 dark:border-slate-800">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">EBITDA</CardTitle>
                                <Activity className="h-4 w-4 text-blue-500" />
                            </CardHeader>
                            <CardContent>
                                <div className={`text-2xl font-bold ${getFinancialTone(profitability.ebitda)}`}>
                                    {formatCurrency(profitability.ebitda)}
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                    <span className={getMarginTone(profitability.ebitda_margin)}>
                                        {formatOptionalPercentage(profitability.ebitda_margin)} margin
                                    </span>
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="border-slate-200 dark:border-slate-800">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">ROI</CardTitle>
                                <Target className="h-4 w-4 text-amber-500" />
                            </CardHeader>
                            <CardContent>
                                <div className={`text-2xl font-bold ${getFinancialTone(profitability.roi)}`}>
                                    {formatOptionalPercentage(profitability.roi)}
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Return on Investment
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Profitability Metrics */}
                    <Card className="border-slate-200 dark:border-slate-800">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <DollarSign className="h-5 w-5 text-emerald-500" />
                                Profitability Analysis
                            </CardTitle>
                            <CardDescription>Comprehensive P&L breakdown with key profitability indicators</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                <div className="space-y-2">
                                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Gross Profit</p>
                                    <p className={`text-xl font-bold ${getFinancialTone(profitability.gross_profit)}`}>
                                        {formatCurrency(profitability.gross_profit)}
                                    </p>
                                    <p className={`text-xs ${getMarginTone(profitability.gross_profit_margin)}`}>
                                        {formatOptionalPercentage(profitability.gross_profit_margin)} margin
                                    </p>
                                </div>
                                <div className="space-y-2">
                                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400">EBIT (Operating Profit)</p>
                                    <p className={`text-xl font-bold ${getFinancialTone(profitability.ebit)}`}>
                                        {formatCurrency(profitability.ebit)}
                                    </p>
                                    <p className={`text-xs ${getMarginTone(profitability.ebit_margin)}`}>
                                        {formatOptionalPercentage(profitability.ebit_margin)} margin
                                    </p>
                                </div>
                                <div className="space-y-2">
                                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400">ROIC</p>
                                    <p className={`text-xl font-bold ${getFinancialTone(profitability.roic)}`}>
                                        {formatOptionalPercentage(profitability.roic)}
                                    </p>
                                    <p className="text-xs text-slate-500">Return on Invested Capital</p>
                                </div>
                                <div className="space-y-2">
                                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Admin Overhead</p>
                                    <p className="text-xl font-bold text-slate-900 dark:text-slate-100">
                                        {formatCurrency(profitability.admin_overhead)}
                                    </p>
                                    <p className="text-xs text-slate-500">Administrative costs</p>
                                </div>
                                <div className="space-y-2">
                                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Depreciation</p>
                                    <p className="text-xl font-bold text-slate-900 dark:text-slate-100">
                                        {formatCurrency(profitability.depreciation)}
                                    </p>
                                    <p className="text-xs text-slate-500">Asset depreciation</p>
                                </div>
                                <div className="space-y-2">
                                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Interest Expense</p>
                                    <p className="text-xl font-bold text-slate-900 dark:text-slate-100">
                                        {formatCurrency(profitability.interest_expense)}
                                    </p>
                                    <p className="text-xs text-slate-500">Financing costs</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Revenue & Cost Structure */}
                    <div className="grid gap-4 lg:grid-cols-2">
                        <Card className="border-slate-200 dark:border-slate-800">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <BarChart3 className="h-5 w-5 text-blue-500" />
                                    Revenue Breakdown
                                </CardTitle>
                                <CardDescription>Revenue sources and efficiency metrics</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <span className="text-sm font-medium">Internal Revenue</span>
                                        <span className="text-sm font-bold">{formatCurrency(revenue.internal_revenue)}</span>
                                    </div>
                                    <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400">
                                        <span>Share of total</span>
                                        <span>{formatOptionalPercentage(revenue.internal_revenue_percent)}</span>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <span className="text-sm font-medium">Outsource Revenue</span>
                                        <span className="text-sm font-bold">{formatCurrency(revenue.outsource_revenue)}</span>
                                    </div>
                                    <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400">
                                        <span>Share of total</span>
                                        <span>{formatOptionalPercentage(revenue.outsource_revenue_percent)}</span>
                                    </div>
                                </div>
                                <hr className="border-slate-200 dark:border-slate-700" />
                                <div className="space-y-2">
                                    <div className="flex justify-between text-xs">
                                        <span className="text-slate-600 dark:text-slate-400">Revenue per Truck/Month</span>
                                        <span className="font-medium">{formatOptionalCurrency(revenue.revenue_per_truck_per_month)}</span>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                        <span className="text-slate-600 dark:text-slate-400">Revenue per KM</span>
                                        <span className="font-medium">{formatOptionalCurrency(revenue.revenue_per_km)}</span>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                        <span className="text-slate-600 dark:text-slate-400">Revenue per Ton-KM</span>
                                        <span className="font-medium">{formatOptionalCurrency(revenue.revenue_per_ton_km)}</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-slate-200 dark:border-slate-800">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Coins className="h-5 w-5 text-amber-500" />
                                    Cost Structure
                                </CardTitle>
                                <CardDescription>Cost breakdown and efficiency ratios</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <p className="text-xs text-slate-600 dark:text-slate-400">Fuel</p>
                                        <p className="text-sm font-bold">{formatCurrency(costs.fuel_cost)}</p>
                                        <p className="text-xs text-slate-500">{formatOptionalPercentage(costs.fuel_cost_percent)}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-xs text-slate-600 dark:text-slate-400">Labor</p>
                                        <p className="text-sm font-bold">{formatCurrency(costs.labor_cost)}</p>
                                        <p className="text-xs text-slate-500">{formatOptionalPercentage(costs.labor_cost_percent)}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-xs text-slate-600 dark:text-slate-400">Maintenance</p>
                                        <p className="text-sm font-bold">{formatCurrency(costs.maintenance_cost)}</p>
                                        <p className="text-xs text-slate-500">{formatOptionalPercentage(costs.maintenance_cost_percent)}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-xs text-slate-600 dark:text-slate-400">Admin</p>
                                        <p className="text-sm font-bold">{formatCurrency(costs.admin_cost)}</p>
                                        <p className="text-xs text-slate-500">{formatOptionalPercentage(costs.admin_cost_percent)}</p>
                                    </div>
                                </div>
                                <hr className="border-slate-200 dark:border-slate-700" />
                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <span className="text-sm font-medium">Variable Costs</span>
                                        <span className="text-sm font-bold">{formatCurrency(costs.variable_cost)}</span>
                                    </div>
                                    <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400">
                                        <span>Share of total</span>
                                        <span>{formatOptionalPercentage(costs.variable_percent)}</span>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <span className="text-sm font-medium">Fixed Costs</span>
                                        <span className="text-sm font-bold">{formatCurrency(costs.fixed_cost)}</span>
                                    </div>
                                    <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400">
                                        <span>Share of total</span>
                                        <span>{formatOptionalPercentage(costs.fixed_percent)}</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Cash Flow & Capital Efficiency */}
                    <div className="grid gap-4 lg:grid-cols-2">
                        <Card className="border-slate-200 dark:border-slate-800">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Wallet className="h-5 w-5 text-green-500" />
                                    Cash Flow Management
                                </CardTitle>
                                <CardDescription>Working capital and liquidity metrics</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <span className="text-sm font-medium">Operating Cash Flow</span>
                                        <span className={`text-sm font-bold ${getFinancialTone(cash_flow.operating_cash_flow)}`}>
                                            {formatCurrency(cash_flow.operating_cash_flow)}
                                        </span>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <span className="text-sm font-medium">Free Cash Flow</span>
                                        <span className={`text-sm font-bold ${getFinancialTone(cash_flow.free_cash_flow)}`}>
                                            {formatCurrency(cash_flow.free_cash_flow)}
                                        </span>
                                    </div>
                                    <p className="text-xs text-slate-500">After estimated capex</p>
                                </div>
                                <hr className="border-slate-200 dark:border-slate-700" />
                                <div className="space-y-2">
                                    <div className="flex justify-between text-xs">
                                        <span className="text-slate-600 dark:text-slate-400">Working Capital Needs</span>
                                        <span className="font-medium">{formatCurrency(cash_flow.working_capital_needs)}</span>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                        <span className="text-slate-600 dark:text-slate-400">Days Sales Outstanding</span>
                                        <span className="font-medium">{cash_flow.days_sales_outstanding} days</span>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                        <span className="text-slate-600 dark:text-slate-400">Cash Conversion Cycle</span>
                                        <span className="font-medium">{cash_flow.cash_conversion_cycle} days</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-slate-200 dark:border-slate-800">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Building2 className="h-5 w-5 text-indigo-500" />
                                    Capital Efficiency
                                </CardTitle>
                                <CardDescription>Asset utilization and productivity</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <span className="text-sm font-medium">Fleet Value</span>
                                        <span className="text-sm font-bold">{formatCurrency(capital_efficiency.fleet_value)}</span>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <span className="text-sm font-medium">Active Trucks</span>
                                        <span className="text-sm font-bold">{capital_efficiency.active_truck_count}</span>
                                    </div>
                                </div>
                                <hr className="border-slate-200 dark:border-slate-700" />
                                <div className="space-y-2">
                                    <div className="flex justify-between text-xs">
                                        <span className="text-slate-600 dark:text-slate-400">Fleet Utilization</span>
                                        <span className="font-medium">{formatOptionalPercentage(capital_efficiency.fleet_utilization)}</span>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                        <span className="text-slate-600 dark:text-slate-400">Asset Turnover Ratio</span>
                                        <span className="font-medium">{formatOptionalDecimal(capital_efficiency.asset_turnover_ratio)}</span>
                                    </div>
                                    <div className="flex justify-between text-xs">
                                        <span className="text-slate-600 dark:text-slate-400">Total Distance</span>
                                        <span className="font-medium">{formatDecimal(capital_efficiency.total_distance_km)} km</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Monthly Breakdown Table */}
                    {breakdown.length > 0 && (
                        <Card className="border-slate-200 dark:border-slate-800">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Activity className="h-5 w-5 text-purple-500" />
                                    Monthly Performance Breakdown
                                </CardTitle>
                                <CardDescription>Period-by-period financial and operational metrics</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead className="whitespace-nowrap">Month</TableHead>
                                                <TableHead className="whitespace-nowrap text-right">Revenue</TableHead>
                                                <TableHead className="whitespace-nowrap text-right">Cost</TableHead>
                                                <TableHead className="whitespace-nowrap text-right">Profit</TableHead>
                                                <TableHead className="whitespace-nowrap text-right">Margin %</TableHead>
                                                <TableHead className="whitespace-nowrap text-right">Trips</TableHead>
                                                <TableHead className="whitespace-nowrap text-right">Distance (KM)</TableHead>
                                                <TableHead className="whitespace-nowrap text-right">Rev/KM</TableHead>
                                                <TableHead className="whitespace-nowrap text-right">Cost/KM</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {breakdown.map((row, index) => (
                                                <TableRow key={index}>
                                                    <TableCell className="font-medium">{row.month}</TableCell>
                                                    <TableCell className="text-right font-mono text-sm">{formatCurrency(row.revenue)}</TableCell>
                                                    <TableCell className="text-right font-mono text-sm">{formatCurrency(row.cost)}</TableCell>
                                                    <TableCell className={`text-right font-mono text-sm ${getFinancialTone(row.profit)}`}>
                                                        {formatCurrency(row.profit)}
                                                    </TableCell>
                                                    <TableCell className={`text-right font-mono text-sm ${getMarginTone(row.margin)}`}>
                                                        {formatOptionalPercentage(row.margin)}
                                                    </TableCell>
                                                    <TableCell className="text-right font-mono text-sm">{row.trips}</TableCell>
                                                    <TableCell className="text-right font-mono text-sm">{formatDecimal(row.distance_km)}</TableCell>
                                                    <TableCell className="text-right font-mono text-sm">{formatOptionalCurrency(row.revenue_per_km)}</TableCell>
                                                    <TableCell className="text-right font-mono text-sm">{formatOptionalCurrency(row.cost_per_km)}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* 12-Month Trend */}
                    {trends.length > 0 && (
                        <Card className="border-slate-200 dark:border-slate-800">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <TrendingUp className="h-5 w-5 text-cyan-500" />
                                    12-Month Financial Trend
                                </CardTitle>
                                <CardDescription>Rolling 12-month revenue, cost, and profitability trends</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Month</TableHead>
                                                <TableHead className="text-right">Revenue</TableHead>
                                                <TableHead className="text-right">Cost</TableHead>
                                                <TableHead className="text-right">Profit</TableHead>
                                                <TableHead className="text-right">Margin %</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {trends.map((row, index) => (
                                                <TableRow key={index}>
                                                    <TableCell className="font-medium">{row.month}</TableCell>
                                                    <TableCell className="text-right font-mono text-sm">{formatCurrency(row.revenue)}</TableCell>
                                                    <TableCell className="text-right font-mono text-sm">{formatCurrency(row.cost)}</TableCell>
                                                    <TableCell className={`text-right font-mono text-sm ${getFinancialTone(row.profit)}`}>
                                                        {formatCurrency(row.profit)}
                                                    </TableCell>
                                                    <TableCell className={`text-right font-mono text-sm ${getMarginTone(row.margin)}`}>
                                                        {formatOptionalPercentage(row.margin)}
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
            </div>
        </AppLayout>
    );
}

