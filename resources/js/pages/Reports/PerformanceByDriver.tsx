import { useMemo, useState } from 'react';
import { router } from '@inertiajs/react';
import { type BreadcrumbItem } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Activity, Award, CircleDollarSign, GaugeCircle } from 'lucide-react';
import { usePermissions } from '@/hooks/use-permissions';
import { ReportFiltersDialog } from '@/components/reports/report-filters-dialog';
import { ReportSummaryGrid, type ReportSummaryItem } from '@/components/reports/report-summary-grid';
import { formatCurrency, formatDecimal, formatInteger, formatPercentage, getFinancialTone, getMarginChipClass } from '@/components/reports/formatters';
import type { ReportSelectionOption } from '@/components/reports/types';
import { REPORT_DATE_RANGE_DESCRIPTION, useReportDateRange } from '@/components/reports/use-report-date-range';
import { ReportPageLayout } from '@/components/report/report-page-layout';

type QueryParamValue = string | number | boolean | null | undefined | Array<string | number | boolean>;

interface DriverOption {
    id: number;
    name: string;
}

interface DriverReportRow {
    driver_id: number | null;
    driver_name: string;
    trips: number;
    tonnage: number;
    ton_km: number;
    distance_wc: number;
    distance_wo: number;
    distance_total: number;
    fuel_cost: number;
    perdiem: number;
    other_cost: number;
    expense: number;
    revenue: number;
    profit: number;
    margin_percent: number | null;
}

interface DriverReportSummary {
    trips: number;
    tonnage: number;
    ton_km: number;
    distance_wc: number;
    distance_wo: number;
    distance_total: number;
    fuel_cost: number;
    perdiem: number;
    other_cost: number;
    expense: number;
    revenue: number;
    profit: number;
    margin_percent: number | null;
}

interface Filters {
    from: string;
    to: string;
    driver_ids?: number[];
}

interface PerformanceByDriverProps {
    filters: Filters;
    rows: DriverReportRow[];
    summary: DriverReportSummary;
    drivers: DriverOption[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Reports', href: '/reports/performance-by-driver' },
    { title: 'Performance by Driver', href: '/reports/performance-by-driver' },
];

export default function PerformanceByDriver({ filters, rows = [], summary, drivers }: PerformanceByDriverProps) {
    const { hasPermission } = usePermissions();
    const canExport = hasPermission('reports.performance-by-driver.export');
    const {
        from,
        to,
        dateError,
        validateDateRange,
        handleDateChange: handleDateRangeChange,
        resetDateRange,
    } = useReportDateRange(filters?.from ?? '', filters?.to ?? '');
    const [selectedDrivers, setSelectedDrivers] = useState<number[]>(filters?.driver_ids ?? []);
    const [filtersOpen, setFiltersOpen] = useState(false);

    const safeRows = Array.isArray(rows) ? rows : [];

    const driverSelectionOptions = useMemo<ReportSelectionOption[]>(
        () => drivers.map((option) => ({ id: option.id, label: option.name ?? 'Unassigned' })),
        [drivers],
    );

    const activeFilterCount = useMemo(() => {
        let count = 0;

        if (from && from !== (filters?.from ?? '')) count += 1;
        if (to && to !== (filters?.to ?? '')) count += 1;
        if (selectedDrivers.length > 0) count += 1;

        return count;
    }, [from, to, selectedDrivers, filters?.from, filters?.to]);

    const handleApplyFilters = () => {
        if (!validateDateRange(from, to)) {
            setFiltersOpen(true);

            return;
        }

        setFiltersOpen(false);
        const params: Record<string, QueryParamValue> = {};

        if (from) params.from = from;
        if (to) params.to = to;
        if (selectedDrivers.length > 0) params.driver_ids = selectedDrivers;

        router.get('/reports/performance-by-driver', params, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleReset = () => {
        resetDateRange(filters?.from ?? '', filters?.to ?? '');
        setSelectedDrivers(filters?.driver_ids ?? []);
        setFiltersOpen(false);
        router.get('/reports/performance-by-driver', {}, { preserveState: false, preserveScroll: true });
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

        if (selectedDrivers.length > 0) {
            selectedDrivers.forEach((driverId) => {
                params.append('driver_ids[]', String(driverId));
            });
        }

        const query = params.toString();
        const url = `/reports/performance-by-driver/export/${format}${query ? `?${query}` : ''}`;
        window.location.href = url;
    };

    const summaryItems = useMemo<ReportSummaryItem[]>(
        () => [
            {
                label: 'Total Trips',
                value: formatInteger(summary?.trips ?? safeRows.length),
                icon: Activity,
                tone: 'bg-sky-100 text-sky-600 dark:bg-sky-500/20 dark:text-sky-200',
            },
            {
                label: 'Tonnage (MT)',
                value: formatDecimal(summary?.tonnage ?? 0),
                icon: Award,
                tone: 'bg-violet-100 text-violet-600 dark:bg-violet-500/20 dark:text-violet-200',
            },
            {
                label: 'Driver Revenue',
                value: formatCurrency(summary?.revenue ?? 0),
                icon: CircleDollarSign,
                tone: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-200',
            },
            {
                label: 'Net Margin',
                value: `${formatCurrency(summary?.profit ?? 0)} · ${formatPercentage(summary?.margin_percent ?? null)}`,
                icon: GaugeCircle,
                tone: 'bg-rose-100 text-rose-600 dark:bg-rose-500/20 dark:text-rose-200',
            },
        ],
        [safeRows.length, summary],
    );

    const appliedFrom = filters?.from ?? '';
    const appliedTo = filters?.to ?? '';
    const appliedDriverCount = filters?.driver_ids?.length ?? 0;

    const filterBadges = useMemo(
        () => [
            `From ${appliedFrom || '—'}`,
            `To ${appliedTo || '—'}`,
            appliedDriverCount > 0 ? `${appliedDriverCount} driver${appliedDriverCount > 1 ? 's' : ''}` : 'All drivers',
        ],
        [appliedDriverCount, appliedFrom, appliedTo],
    );

    const summaryMargin = summary?.margin_percent ?? null;

    return (
        <ReportPageLayout
            title="Performance by Driver"
            breadcrumbs={breadcrumbs}
            icon={<Activity className="h-6 w-6" />}
            filters={
                <ReportFiltersDialog
                    open={filtersOpen}
                    onOpenChange={setFiltersOpen}
                    activeFilterCount={activeFilterCount}
                    from={from}
                    to={to}
                    onDateChange={handleDateRangeChange}
                    dateRangeDescription={REPORT_DATE_RANGE_DESCRIPTION}
                    onReset={handleReset}
                    onApply={handleApplyFilters}
                    driverOptions={driverSelectionOptions}
                    selectedDrivers={selectedDrivers}
                    onDriversChange={setSelectedDrivers}
                    showLimit={false}
                    showDriverFilter
                    showTruckFilter={false}
                    showOperationFilter={false}
                    showDestinationFilter={false}
                    dateError={dateError}
                    title="Filter performance by driver"
                    description="Adjust the reporting window and focus on specific drivers before generating the report."
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
            <div className="space-y-4 p-6">
                <div className="space-y-3">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50">Driver Performance Detail</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Utilisation, cost, and contribution by driver.</p>
                    <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                        {filterBadges.map((badge) => (
                            <Badge key={badge} variant="outline">
                                {badge}
                            </Badge>
                        ))}
                    </div>
                </div>
                <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
                    <Table>
                                    <TableHeader className="bg-slate-50/60 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-900/60 dark:text-slate-400">
                                        <TableRow className="divide-x divide-slate-200/40 dark:divide-slate-800/50">
                                            <TableHead className="whitespace-nowrap">Driver</TableHead>
                                            <TableHead className="whitespace-nowrap text-right">Trips</TableHead>
                                            <TableHead className="whitespace-nowrap text-right">Tonnage (MT)</TableHead>
                                            <TableHead className="whitespace-nowrap text-right">Ton-KM</TableHead>
                                            <TableHead className="whitespace-nowrap text-right">Distance (WC)</TableHead>
                                            <TableHead className="whitespace-nowrap text-right">Distance (WO)</TableHead>
                                            <TableHead className="whitespace-nowrap text-right">Total Distance</TableHead>
                                            <TableHead className="whitespace-nowrap text-right">Fuel Cost</TableHead>
                                            <TableHead className="whitespace-nowrap text-right">Perdiem</TableHead>
                                            <TableHead className="whitespace-nowrap text-right">Other Cost</TableHead>
                                            <TableHead className="whitespace-nowrap text-right">Total Expense</TableHead>
                                            <TableHead className="whitespace-nowrap text-right">Revenue</TableHead>
                                            <TableHead className="whitespace-nowrap text-right">Profit</TableHead>
                                            <TableHead className="whitespace-nowrap text-right">Margin %</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {safeRows.length > 0 ? (
                                            safeRows.map((row) => (
                                                <TableRow key={`${row.driver_id}-${row.driver_name}`} className="divide-x divide-slate-100 hover:bg-slate-50/70 dark:divide-slate-800/50 dark:hover:bg-slate-900/50">
                                                    <TableCell className="whitespace-nowrap font-medium text-slate-900 dark:text-slate-100">{row.driver_name}</TableCell>
                                                    <TableCell className="whitespace-nowrap text-right">{formatInteger(row.trips)}</TableCell>
                                                    <TableCell className="whitespace-nowrap text-right">{formatDecimal(row.tonnage)}</TableCell>
                                                    <TableCell className="whitespace-nowrap text-right">{formatDecimal(row.ton_km)}</TableCell>
                                                    <TableCell className="whitespace-nowrap text-right">{formatDecimal(row.distance_wc)}</TableCell>
                                                    <TableCell className="whitespace-nowrap text-right">{formatDecimal(row.distance_wo)}</TableCell>
                                                    <TableCell className="whitespace-nowrap text-right">{formatDecimal(row.distance_total)}</TableCell>
                                                    <TableCell className="whitespace-nowrap text-right">{formatCurrency(row.fuel_cost)}</TableCell>
                                                    <TableCell className="whitespace-nowrap text-right">{formatCurrency(row.perdiem)}</TableCell>
                                                    <TableCell className="whitespace-nowrap text-right">{formatCurrency(row.other_cost)}</TableCell>
                                                    <TableCell className="whitespace-nowrap text-right">{formatCurrency(row.expense)}</TableCell>
                                                    <TableCell className="whitespace-nowrap text-right">{formatCurrency(row.revenue)}</TableCell>
                                                    <TableCell className={`whitespace-nowrap text-right font-semibold ${getFinancialTone(row.profit)}`}>{formatCurrency(row.profit)}</TableCell>
                                                    <TableCell className="whitespace-nowrap text-right">
                                                        {row.margin_percent === null ? (
                                                            <span className="text-sm text-muted-foreground">—</span>
                                                        ) : (
                                                            <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold ${getMarginChipClass(row.margin_percent)}`}>
                                                                {formatPercentage(row.margin_percent)}
                                                            </span>
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        ) : (
                                            <TableRow>
                                                <TableCell colSpan={14} className="py-10 text-center text-muted-foreground">
                                                    No data for the selected filters. Adjust your filters and generate the report again.
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                    {safeRows.length > 0 && (
                                        <TableFooter>
                                            <TableRow className="bg-slate-50/70 font-semibold dark:bg-slate-900/60">
                                                <TableCell>Total</TableCell>
                                                <TableCell className="text-right">{formatInteger(summary?.trips ?? 0)}</TableCell>
                                                <TableCell className="text-right">{formatDecimal(summary?.tonnage ?? 0)}</TableCell>
                                                <TableCell className="text-right">{formatDecimal(summary?.ton_km ?? 0)}</TableCell>
                                                <TableCell className="text-right">{formatDecimal(summary?.distance_wc ?? 0)}</TableCell>
                                                <TableCell className="text-right">{formatDecimal(summary?.distance_wo ?? 0)}</TableCell>
                                                <TableCell className="text-right">{formatDecimal(summary?.distance_total ?? 0)}</TableCell>
                                                <TableCell className="text-right">{formatCurrency(summary?.fuel_cost ?? 0)}</TableCell>
                                                <TableCell className="text-right">{formatCurrency(summary?.perdiem ?? 0)}</TableCell>
                                                <TableCell className="text-right">{formatCurrency(summary?.other_cost ?? 0)}</TableCell>
                                                <TableCell className="text-right">{formatCurrency(summary?.expense ?? 0)}</TableCell>
                                                <TableCell className="text-right">{formatCurrency(summary?.revenue ?? 0)}</TableCell>
                                                <TableCell className={`text-right ${getFinancialTone(summary?.profit ?? 0)}`}>{formatCurrency(summary?.profit ?? 0)}</TableCell>
                                                <TableCell className="text-right">
                                                    {summaryMargin === null ? (
                                                        <span className="text-sm text-muted-foreground">—</span>
                                                    ) : (
                                                        <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold ${getMarginChipClass(summaryMargin)}`}>
                                                            {formatPercentage(summaryMargin)}
                                                        </span>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        </TableFooter>
                                    )}
                    </Table>
                </div>
            </div>
        </ReportPageLayout>
    );
}








