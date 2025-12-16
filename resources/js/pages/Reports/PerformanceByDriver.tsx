import { useCallback, useMemo, useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Activity, Award, CircleDollarSign, Download, FileDigit, FileSpreadsheet, FileType2, GaugeCircle, RefreshCcw } from 'lucide-react';
import { usePermissions } from '@/hooks/use-permissions';
import { ReportFiltersDialog } from '@/components/reports/report-filters-dialog';
import { ReportSummaryGrid, type ReportSummaryItem } from '@/components/reports/report-summary-grid';
import { formatCurrency, formatDecimal, formatInteger, formatPercentage, getFinancialTone, getMarginChipClass } from '@/components/reports/formatters';
import type { ReportSelectionOption } from '@/components/reports/types';

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
    const [from, setFrom] = useState(filters?.from ?? '');
    const [to, setTo] = useState(filters?.to ?? '');
    const [selectedDrivers, setSelectedDrivers] = useState<number[]>(filters?.driver_ids ?? []);
    const [filtersOpen, setFiltersOpen] = useState(false);
    const [dateError, setDateError] = useState<string | null>(null);

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

    const validateDateRange = useCallback(
        (nextFrom: string, nextTo: string) => {
            if (nextFrom && nextTo) {
                const fromTimestamp = Date.parse(nextFrom);
                const toTimestamp = Date.parse(nextTo);

                if (!Number.isNaN(fromTimestamp) && !Number.isNaN(toTimestamp) && fromTimestamp > toTimestamp) {
                    setDateError('Start date must be before or equal to the end date.');

                    return false;
                }
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

        if (selectedDrivers.length > 0) {
            params.driver_ids = selectedDrivers;
        }

        router.get('/reports/performance-by-driver', params, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleReset = () => {
        setFrom(filters?.from ?? '');
        setTo(filters?.to ?? '');
        setSelectedDrivers(filters?.driver_ids ?? []);
        setFiltersOpen(false);
        setDateError(null);
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

    const handleDateChange = (field: 'from' | 'to', value: string) => {
        if (field === 'from') {
            setFrom(value);
            validateDateRange(value, to);
            return;
        }

        setTo(value);
        validateDateRange(from, value);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Performance by Driver" />
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-slate-100/60 dark:bg-slate-900/40">
                <div className="flex flex-1 flex-col gap-6 overflow-y-auto p-4 pb-10 sm:p-6 lg:p-10">
                    <header className="rounded-2xl border border-slate-200 bg-white/95 px-6 py-6 shadow-sm backdrop-blur dark:border-slate-800/70 dark:bg-slate-900/70">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                            <div className="space-y-2">
                                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500 dark:text-slate-400">Driver Intelligence</p>
                                <h1 className="text-3xl font-semibold text-slate-900 dark:text-slate-50">Performance by Driver</h1>
                                <p className="max-w-3xl text-sm text-slate-600 dark:text-slate-300">
                                    Compare utilisation, earnings, and cost efficiency for each driver. Refine the window, focus on specific drivers, and export polished reports for your operational reviews.
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
                                {canExport && (
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
                                            <DropdownMenuItem onSelect={() => handleExport('pdf')} className="gap-2">
                                                <FileType2 className="h-4 w-4 text-rose-500" />
                                                PDF
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                )}
                                <Button type="button" variant="outline" className="gap-2" onClick={handleReset}>
                                    <RefreshCcw className="h-4 w-4" />
                                    Reset
                                </Button>
                            </div>
                        </div>
                    </header>

                    <ReportSummaryGrid items={summaryItems} />

                    <Card className="border border-slate-200 bg-white/95 shadow-sm dark:border-slate-800/70 dark:bg-slate-900/70">
                        <CardHeader className="space-y-3 border-b border-slate-200/60 pb-5 dark:border-slate-700/60">
                            <div className="space-y-1">
                                <CardTitle className="text-lg font-semibold text-slate-900 dark:text-slate-50">Driver Performance Detail</CardTitle>
                                <CardDescription className="text-sm">Utilisation, cost, and contribution by driver.</CardDescription>
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
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}








