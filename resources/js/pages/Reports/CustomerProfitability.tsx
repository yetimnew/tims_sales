import { useMemo, useState } from 'react';
import { router } from '@inertiajs/react';
import { type BreadcrumbItem } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ReportFiltersDialog } from '@/components/reports/report-filters-dialog';
import { ReportSummaryGrid, type ReportSummaryItem } from '@/components/reports/report-summary-grid';
import { formatCurrency, formatDecimal, formatInteger, formatPercentage, getFinancialTone, getMarginChipClass } from '@/components/reports/formatters';
import type { ReportSelectionOption } from '@/components/reports/types';
import { CircleDollarSign, ClipboardList, Coins, PiggyBank, TrendingUp, Users } from 'lucide-react';
import { usePermissions } from '@/hooks/use-permissions';
import { REPORT_DATE_RANGE_DESCRIPTION, useReportDateRange } from '@/components/reports/use-report-date-range';
import { ReportPageLayout } from '@/components/report/report-page-layout';

interface CustomerOption {
    id: number;
    name: string;
}

interface CustomerProfitabilityRow {
    customer_id: number;
    customer_name: string;
    operations: number;
    lanes_used: number;
    internal_trips: number;
    outsource_trips: number;
    total_trips: number;
    internal_tonnage: number;
    outsource_tonnage: number;
    total_tonnage: number;
    internal_ton_km: number;
    outsource_ton_km: number;
    total_ton_km: number;
    internal_distance: number;
    outsource_distance: number;
    total_distance: number;
    internal_expense: number;
    outsource_cost: number;
    total_cost: number;
    revenue: number;
    profit: number;
    margin_percent: number | null;
    average_km_per_trip: number | null;
    cost_per_km: number | null;
    revenue_per_ton_km: number | null;
    cost_per_ton_km: number | null;
    profit_per_ton_km: number | null;
    revenue_per_trip: number | null;
    cost_per_trip: number | null;
    tonnage_per_trip: number | null;
    empty_distance_ratio_percent: number | null;
    internal_fuel_cost_per_km: number | null;
    outsource_cost_per_km: number | null;
    outsource_trip_share_percent: number | null;
    outsource_tonnage_share_percent: number | null;
}

interface CustomerProfitabilitySummary {
    customer_count: number;
    operations: number;
    internal_trips: number;
    outsource_trips: number;
    total_trips: number;
    internal_tonnage: number;
    outsource_tonnage: number;
    total_tonnage: number;
    internal_ton_km: number;
    outsource_ton_km: number;
    total_ton_km: number;
    internal_distance: number;
    outsource_distance: number;
    total_distance: number;
    internal_expense: number;
    outsource_cost: number;
    total_cost: number;
    revenue: number;
    profit: number;
    margin_percent: number | null;
    average_km_per_trip: number | null;
    cost_per_km: number | null;
    revenue_per_ton_km: number | null;
    cost_per_ton_km: number | null;
    profit_per_ton_km: number | null;
    revenue_per_trip: number | null;
    cost_per_trip: number | null;
    tonnage_per_trip: number | null;
    outsource_trip_share_percent: number | null;
    outsource_tonnage_share_percent: number | null;
}

interface TrendPoint {
    month: string;
    revenue: number;
    cost: number;
    profit: number;
}

interface Filters {
    from: string;
    to: string;
    customer_ids?: number[];
}

interface Props {
    filters: Filters;
    rows: CustomerProfitabilityRow[];
    summary: CustomerProfitabilitySummary;
    trend: TrendPoint[];
    customers: CustomerOption[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Reports', href: '/reports/customer-profitability' },
    { title: 'Customer Profitability', href: '/reports/customer-profitability' },
];

const formatOptionalCurrency = (value: number | null) => (value === null ? '—' : formatCurrency(value));

const toParamsArray = (key: string, values: number[], params: URLSearchParams) => {
    values.forEach((value, index) => {
        params.append(`${key}[${index}]`, String(value));
    });
};

export default function CustomerProfitability({ filters, rows = [], summary, trend = [], customers = [] }: Props) {
    const { hasPermission } = usePermissions();
    const canExport = hasPermission('reports.customer-profitability.export');

    const customerOptions = useMemo(() => (Array.isArray(customers) ? customers : []), [customers]);
    const safeRows = useMemo(() => (Array.isArray(rows) ? rows : []), [rows]);
    const safeTrend = useMemo(() => (Array.isArray(trend) ? trend : []), [trend]);

    const { from, to, dateError, handleDateChange, validateDateRange, resetDateRange } = useReportDateRange(filters?.from ?? '', filters?.to ?? '');
    const [selectedCustomers, setSelectedCustomers] = useState<number[]>(filters?.customer_ids ?? []);
    const [filtersOpen, setFiltersOpen] = useState(false);

    const customerSelectionOptions = useMemo<ReportSelectionOption[]>(
        () => customerOptions.map((option) => ({ id: option.id, label: option.name })),
        [customerOptions],
    );

    const customerNameMap = useMemo(() => {
        const map = new Map<number, string>();
        customerOptions.forEach((option) => {
            map.set(option.id, option.name);
        });

        return map;
    }, [customerOptions]);

    const activeFilterCount = useMemo(() => {
        let count = 0;

        if (from && from !== (filters?.from ?? '')) count += 1;
        if (to && to !== (filters?.to ?? '')) count += 1;
        if (selectedCustomers.length > 0) count += 1;

        return count;
    }, [from, to, selectedCustomers, filters?.from, filters?.to]);

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

        if (selectedCustomers.length > 0) {
            params.customer_ids = selectedCustomers;
        }

        router.get('/reports/customer-profitability', params, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleReset = () => {
        resetDateRange(filters?.from ?? '', filters?.to ?? '');
        setSelectedCustomers(filters?.customer_ids ?? []);
        setFiltersOpen(false);
        router.get('/reports/customer-profitability', {}, { preserveState: false, preserveScroll: true });
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
        if (selectedCustomers.length > 0) toParamsArray('customer_ids', selectedCustomers, params);

        const query = params.toString();
        const url = `/reports/customer-profitability/export/${format}${query ? `?${query}` : ''}`;
        window.location.href = url;
    };

    const summaryItems = useMemo<ReportSummaryItem[]>(
        () => [
            {
                label: 'Customers',
                value: formatInteger(summary?.customer_count ?? safeRows.length),
                icon: Users,
                tone: 'bg-sky-100 text-sky-600 dark:bg-sky-500/20 dark:text-sky-200',
            },
            {
                label: 'Operations',
                value: formatInteger(summary?.operations ?? 0),
                icon: ClipboardList,
                tone: 'bg-violet-100 text-violet-600 dark:bg-violet-500/20 dark:text-violet-200',
            },
            {
                label: 'Total Revenue',
                value: formatCurrency(summary?.revenue ?? 0),
                icon: CircleDollarSign,
                tone: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-200',
            },
            {
                label: 'Total Cost',
                value: formatCurrency(summary?.total_cost ?? 0),
                icon: Coins,
                tone: 'bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-200',
            },
            {
                label: 'Profit · Margin',
                value: `${formatCurrency(summary?.profit ?? 0)} · ${formatPercentage(summary?.margin_percent ?? null)}`,
                icon: PiggyBank,
                tone: 'bg-rose-100 text-rose-600 dark:bg-rose-500/20 dark:text-rose-200',
            },
            {
                label: 'Tonnage (MT)',
                value: formatDecimal(summary?.total_tonnage ?? 0),
                icon: TrendingUp,
                tone: 'bg-cyan-100 text-cyan-600 dark:bg-cyan-500/20 dark:text-cyan-200',
            },
        ],
        [safeRows.length, summary],
    );

    const appliedFrom = filters?.from ?? '';
    const appliedTo = filters?.to ?? '';
    const appliedCustomerIds = filters?.customer_ids ?? [];
    const appliedCustomerCount = appliedCustomerIds.length;

    const appliedCustomerNames = useMemo(() => {
        if (appliedCustomerIds.length === 0) {
            return [] as string[];
        }

        return appliedCustomerIds
            .map((id) => customerNameMap.get(id) ?? `Customer #${id}`)
            .filter((name) => Boolean(name));
    }, [appliedCustomerIds, customerNameMap]);

    const customerBadgeLabel = useMemo(() => {
        if (appliedCustomerCount === 0) {
            return 'All customers';
        }

        if (appliedCustomerNames.length === 0) {
            return `${appliedCustomerCount} customer${appliedCustomerCount > 1 ? 's' : ''}`;
        }

        const visible = appliedCustomerNames.slice(0, 2).join(', ');
        const extra = appliedCustomerCount - Math.min(appliedCustomerCount, 2);

        return extra > 0 ? `${visible} +${extra}` : visible;
    }, [appliedCustomerCount, appliedCustomerNames]);

    const filterBadges = useMemo(
        () => [
            `From ${appliedFrom || '—'}`,
            `To ${appliedTo || '—'}`,
            customerBadgeLabel,
        ],
        [appliedFrom, appliedTo, customerBadgeLabel],
    );

    const summaryMargin = summary?.margin_percent ?? null;

    return (
        <ReportPageLayout
            title="Customer Profitability"
            description="Analyse profitability, tonnage mix, and utilisation across customers. Combine internal and outsourced execution to see who delivers the strongest contribution."
            breadcrumbs={breadcrumbs}
            icon={<Users className="h-6 w-6" />}
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
                    showOperationFilter
                    operationOptions={customerSelectionOptions}
                    selectedOperations={selectedCustomers}
                    onOperationsChange={setSelectedCustomers}
                    dateError={dateError}
                    title="Filter customer profitability"
                    description="Adjust the reporting window and focus on specific customers before generating the report."
                    operationFilterText={{
                        label: 'Customers',
                        triggerLabelWhenAll: 'All customers',
                        summaryLabelWhenAll: 'All customers included',
                        heading: 'Customers',
                        searchPlaceholder: 'Search customer...',
                        emptyMessage: 'No customers found.',
                        icon: Users,
                    }}
                />
            }
            summarySection={<ReportSummaryGrid items={summaryItems} />}
            onRefresh={handleReset}
            onExportPdf={canExport ? () => handleExport('pdf') : undefined}
            onExportExcel={canExport ? () => handleExport('xlsx') : undefined}
            onExportCsv={canExport ? () => handleExport('csv') : undefined}
            canExport={canExport}
            contentClassName="p-0"
        >
            <div className="space-y-4 p-6">
                <Card className="border border-slate-200 bg-slate-50/50 shadow-sm dark:border-slate-800 dark:bg-slate-800/50">
                        <CardHeader className="space-y-3 border-b border-slate-200/60 pb-5 dark:border-slate-700/60">
                            <div className="space-y-1">
                                <CardTitle className="text-lg font-semibold text-slate-900 dark:text-slate-50">Customer Contribution</CardTitle>
                                <CardDescription className="text-sm">Detailed profitability and utilisation by customer.</CardDescription>
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
                                            <TableHead className="whitespace-nowrap">Customer</TableHead>
                                            <TableHead className="whitespace-nowrap text-right">Operations</TableHead>
                                            <TableHead className="whitespace-nowrap text-right">Lanes</TableHead>
                                            <TableHead className="whitespace-nowrap text-right">Internal Trips</TableHead>
                                            <TableHead className="whitespace-nowrap text-right">Outsource Trips</TableHead>
                                            <TableHead className="whitespace-nowrap text-right">Total Trips</TableHead>
                                            <TableHead className="whitespace-nowrap text-right">Total Tonnage (MT)</TableHead>
                                            <TableHead className="whitespace-nowrap text-right">Revenue</TableHead>
                                            <TableHead className="whitespace-nowrap text-right">Total Cost</TableHead>
                                            <TableHead className="whitespace-nowrap text-right">Profit</TableHead>
                                            <TableHead className="whitespace-nowrap text-right">Margin %</TableHead>
                                            <TableHead className="whitespace-nowrap text-right">Revenue / Trip</TableHead>
                                            <TableHead className="whitespace-nowrap text-right">Cost / Trip</TableHead>
                                            <TableHead className="whitespace-nowrap text-right">Cost / Km</TableHead>
                                            <TableHead className="whitespace-nowrap text-right">Outsource Trip Share %</TableHead>
                                            <TableHead className="whitespace-nowrap text-right">Outsource Tonnage Share %</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {safeRows.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={16} className="py-6 text-center text-sm text-muted-foreground">
                                                    No data available for the selected filters.
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            safeRows.map((row) => (
                                                <TableRow
                                                    key={row.customer_id}
                                                    className="divide-x divide-slate-200/40 odd:bg-white even:bg-slate-50/40 hover:bg-slate-100/60 dark:divide-slate-800/50 dark:odd:bg-slate-900/40 dark:even:bg-slate-900/20 dark:hover:bg-slate-800/50"
                                                >
                                                    <TableCell className="whitespace-nowrap font-medium text-slate-900 dark:text-slate-50">{row.customer_name}</TableCell>
                                                    <TableCell className="whitespace-nowrap text-right text-sm text-slate-700 dark:text-slate-100">{formatInteger(row.operations)}</TableCell>
                                                    <TableCell className="whitespace-nowrap text-right text-sm text-slate-700 dark:text-slate-100">{formatInteger(row.lanes_used)}</TableCell>
                                                    <TableCell className="whitespace-nowrap text-right text-sm text-slate-700 dark:text-slate-100">{formatInteger(row.internal_trips)}</TableCell>
                                                    <TableCell className="whitespace-nowrap text-right text-sm text-slate-700 dark:text-slate-100">{formatInteger(row.outsource_trips)}</TableCell>
                                                    <TableCell className="whitespace-nowrap text-right text-sm text-slate-700 dark:text-slate-100">{formatInteger(row.total_trips)}</TableCell>
                                                    <TableCell className="whitespace-nowrap text-right text-sm text-slate-700 dark:text-slate-100">{formatDecimal(row.total_tonnage)}</TableCell>
                                                    <TableCell className="whitespace-nowrap text-right text-sm text-slate-700 dark:text-slate-100">{formatCurrency(row.revenue)}</TableCell>
                                                    <TableCell className="whitespace-nowrap text-right text-sm text-slate-700 dark:text-slate-100">{formatCurrency(row.total_cost)}</TableCell>
                                                    <TableCell className={`whitespace-nowrap text-right text-sm font-semibold ${getFinancialTone(row.profit)}`}>{formatCurrency(row.profit)}</TableCell>
                                                    <TableCell className="whitespace-nowrap text-right">
                                                        {row.margin_percent === null ? (
                                                            <span className="text-sm text-muted-foreground">—</span>
                                                        ) : (
                                                            <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold ${getMarginChipClass(row.margin_percent)}`}>
                                                                {formatPercentage(row.margin_percent)}
                                                            </span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="whitespace-nowrap text-right text-sm text-slate-700 dark:text-slate-100">{formatOptionalCurrency(row.revenue_per_trip)}</TableCell>
                                                    <TableCell className="whitespace-nowrap text-right text-sm text-slate-700 dark:text-slate-100">{formatOptionalCurrency(row.cost_per_trip)}</TableCell>
                                                    <TableCell className="whitespace-nowrap text-right text-sm text-slate-700 dark:text-slate-100">{formatOptionalCurrency(row.cost_per_km)}</TableCell>
                                                    <TableCell className="whitespace-nowrap text-right text-sm text-slate-700 dark:text-slate-100">{formatPercentage(row.outsource_trip_share_percent)}</TableCell>
                                                    <TableCell className="whitespace-nowrap text-right text-sm text-slate-700 dark:text-slate-100">{formatPercentage(row.outsource_tonnage_share_percent)}</TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                    <TableFooter>
                                        <TableRow className="divide-x divide-slate-200/60 bg-slate-100/80 text-sm font-semibold dark:divide-slate-800/50 dark:bg-slate-900/60">
                                            <TableCell className="whitespace-nowrap" colSpan={3}>
                                                Totals ({formatInteger(summary?.customer_count ?? 0)} customers)
                                            </TableCell>
                                            <TableCell className="whitespace-nowrap text-right">{formatInteger(summary?.internal_trips ?? 0)}</TableCell>
                                            <TableCell className="whitespace-nowrap text-right">{formatInteger(summary?.outsource_trips ?? 0)}</TableCell>
                                            <TableCell className="whitespace-nowrap text-right">{formatInteger(summary?.total_trips ?? 0)}</TableCell>
                                            <TableCell className="whitespace-nowrap text-right">{formatDecimal(summary?.total_tonnage ?? 0)}</TableCell>
                                            <TableCell className="whitespace-nowrap text-right">{formatCurrency(summary?.revenue ?? 0)}</TableCell>
                                            <TableCell className="whitespace-nowrap text-right">{formatCurrency(summary?.total_cost ?? 0)}</TableCell>
                                            <TableCell className={`whitespace-nowrap text-right ${getFinancialTone(summary?.profit ?? 0)}`}>{formatCurrency(summary?.profit ?? 0)}</TableCell>
                                            <TableCell className="whitespace-nowrap text-right">
                                                {summaryMargin === null ? (
                                                    <span className="text-sm text-muted-foreground">—</span>
                                                ) : (
                                                    <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold ${getMarginChipClass(summaryMargin)}`}>
                                                        {formatPercentage(summaryMargin)}
                                                    </span>
                                                )}
                                            </TableCell>
                                            <TableCell className="whitespace-nowrap text-right">{formatOptionalCurrency(summary?.revenue_per_trip ?? null)}</TableCell>
                                            <TableCell className="whitespace-nowrap text-right">{formatOptionalCurrency(summary?.cost_per_trip ?? null)}</TableCell>
                                            <TableCell className="whitespace-nowrap text-right">{formatOptionalCurrency(summary?.cost_per_km ?? null)}</TableCell>
                                            <TableCell className="whitespace-nowrap text-right">{formatPercentage(summary?.outsource_trip_share_percent ?? null)}</TableCell>
                                            <TableCell className="whitespace-nowrap text-right">{formatPercentage(summary?.outsource_tonnage_share_percent ?? null)}</TableCell>
                                        </TableRow>
                                    </TableFooter>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border border-slate-200 bg-white/95 shadow-sm dark:border-slate-800/70 dark:bg-slate-900/70">
                        <CardHeader className="space-y-2 border-b border-slate-200/60 pb-4 dark:border-slate-700/60">
                            <CardTitle className="text-lg font-semibold text-slate-900 dark:text-slate-50">Revenue & Margin Trend</CardTitle>
                            <CardDescription className="text-sm">Month-over-month movement in revenue, cost, and profit.</CardDescription>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="max-h-[340px] overflow-auto">
                                <Table>
                                    <TableHeader className="bg-slate-50/60 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-900/60 dark:text-slate-400">
                                        <TableRow>
                                            <TableHead>Month</TableHead>
                                            <TableHead className="text-right">Revenue</TableHead>
                                            <TableHead className="text-right">Cost</TableHead>
                                            <TableHead className="text-right">Profit</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {safeTrend.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={4} className="py-6 text-center text-sm text-muted-foreground">
                                                    No trend data available for the selected filters.
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            safeTrend.map((item) => (
                                                <TableRow key={item.month} className="odd:bg-white even:bg-slate-50/40 dark:odd:bg-slate-900/40 dark:even:bg-slate-900/20">
                                                    <TableCell className="whitespace-nowrap text-sm text-slate-700 dark:text-slate-200">{item.month}</TableCell>
                                                    <TableCell className="whitespace-nowrap text-right text-sm text-slate-700 dark:text-slate-200">{formatCurrency(item.revenue)}</TableCell>
                                                    <TableCell className="whitespace-nowrap text-right text-sm text-slate-700 dark:text-slate-200">{formatCurrency(item.cost)}</TableCell>
                                                    <TableCell className={`whitespace-nowrap text-right text-sm font-semibold ${getFinancialTone(item.profit)}`}>{formatCurrency(item.profit)}</TableCell>
                                                </TableRow>
                                            ))
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



