import { useCallback, useMemo, useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { ReportSummaryGrid, type ReportSummaryItem } from '@/components/reports/report-summary-grid';
import { ReportFiltersDialog } from '@/components/reports/report-filters-dialog';
import type { ReportSelectionOption } from '@/components/reports/types';
import {
    formatCurrency,
    formatDecimal,
    formatInteger,
    formatPercentage,
    getFinancialTone,
    getMarginChipClass,
} from '@/components/reports/formatters';
import { usePermissions } from '@/hooks/use-permissions';
import { RefreshCcw, CircleDollarSign, TrendingDown, TrendingUp, ClipboardList, BarChart3, MapPin, Percent, Download, FileDigit, FileSpreadsheet, FileType2 } from 'lucide-react';

interface CustomerOption {
    id: number;
    name: string;
    status?: string | null;
}

interface RegionOption {
    id: number;
    name: string;
}

interface Totals {
    revenue: number;
    cost: number;
    profit: number;
    operations: number;
    trips?: number;
    tonnage?: number;
    margin_percent?: number | null;
    distance?: number;
    avg_km_per_trip?: number | null;
    cost_per_km?: number | null;
}

interface Row {
    operation_id: number;
    code: string;
    customer_name: string;
    region_name: string;
    revenue: number;
    cost: number;
    profit: number;
    margin_percent: number | null;
    trips: number;
    tonnage: number;
    avg_km_per_trip: number;
    cost_per_km: number | null;
    total_km?: number;
}

interface Filters {
    from?: string;
    to?: string;
    customer_ids?: number[];
    region_ids?: number[];
}

interface Options {
    customers?: CustomerOption[];
    regions?: RegionOption[];
}

interface Props {
    filters: Filters;
    totals: Totals;
    operations: Row[];
    options?: Options;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Reports', href: '/reports/operation-profitability' },
    { title: 'Operation Profitability', href: '/reports/operation-profitability' },
];

const toParamsArray = (key: string, values: number[], params: URLSearchParams) => {
    values.forEach((value) => params.append(`${key}[]`, String(value)));
};

export default function OperationProfitability({ filters, totals, operations, options }: Props) {
    const { hasPermission } = usePermissions();
    const canExport = hasPermission('reports.operation-profitability.export');

    const customerSource = options?.customers;
    const regionSource = options?.regions;

    const customerOptions = useMemo<CustomerOption[]>(() => (Array.isArray(customerSource) ? customerSource : []), [customerSource]);
    const regionOptions = useMemo<RegionOption[]>(() => (Array.isArray(regionSource) ? regionSource : []), [regionSource]);

    const [from, setFrom] = useState(filters?.from ?? '');
    const [to, setTo] = useState(filters?.to ?? '');
    const [selectedCustomers, setSelectedCustomers] = useState<number[]>(filters?.customer_ids ?? []);
    const [selectedRegions, setSelectedRegions] = useState<number[]>(filters?.region_ids ?? []);
    const [filtersOpen, setFiltersOpen] = useState(false);
    const [dateError, setDateError] = useState<string | null>(null);

    const safeRows = useMemo<Row[]>(() => (Array.isArray(operations) ? operations : []), [operations]);

    const customerSelectionOptions = useMemo<ReportSelectionOption[]>(
        () =>
            customerOptions.map((customer) => ({
                id: customer.id,
                label: customer.name ?? 'Customer',
                badge: customer.status ?? undefined,
            })),
        [customerOptions],
    );

    const regionSelectionOptions = useMemo<ReportSelectionOption[]>(
        () =>
            regionOptions.map((region) => ({
                id: region.id,
                label: region.name,
            })),
        [regionOptions],
    );

    const validateDateRange = useCallback(
        (fromValue: string, toValue: string) => {
            if (!fromValue || !toValue) {
                setDateError(null);
                return true;
            }

            const fromDate = Date.parse(fromValue);
            const toDate = Date.parse(toValue);

            if (!Number.isNaN(fromDate) && !Number.isNaN(toDate) && fromDate > toDate) {
                setDateError('Start date must be before or equal to the end date.');
                return false;
            }

            setDateError(null);
            return true;
        },
        [],
    );

    const handleDateChange = (field: 'from' | 'to', value: string) => {
        if (field === 'from') {
            setFrom(value);
            validateDateRange(value, to);
            return;
        }

        setTo(value);
        validateDateRange(from, value);
    };

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

        if (selectedCustomers.length > 0) params.customer_ids = selectedCustomers;
        if (selectedRegions.length > 0) params.region_ids = selectedRegions;

        router.get('/reports/operation-profitability', params, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleReset = () => {
        setFrom(filters?.from ?? '');
        setTo(filters?.to ?? '');
        setSelectedCustomers(filters?.customer_ids ?? []);
        setSelectedRegions(filters?.region_ids ?? []);
        setFiltersOpen(false);
        setDateError(null);
        router.get('/reports/operation-profitability', {}, { preserveState: false, preserveScroll: true });
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
        if (selectedRegions.length > 0) toParamsArray('region_ids', selectedRegions, params);

        const query = params.toString();
        const url = `/reports/operation-profitability/export/${format}${query ? `?${query}` : ''}`;
        window.location.href = url;
    };

    const activeFilterCount = useMemo(() => {
        let count = 0;

        if (from && from !== (filters?.from ?? '')) count += 1;
        if (to && to !== (filters?.to ?? '')) count += 1;
        if (selectedCustomers.length > 0) count += 1;
        if (selectedRegions.length > 0) count += 1;

        return count;
    }, [filters?.from, filters?.to, from, to, selectedCustomers.length, selectedRegions.length]);

    const filterBadges = useMemo(() => {
        const customerLabels = selectedCustomers
            .map((id) => customerOptions.find((option) => option.id === id)?.name)
            .filter((name): name is string => Boolean(name));

        const regionLabels = selectedRegions
            .map((id) => regionOptions.find((option) => option.id === id)?.name)
            .filter((name): name is string => Boolean(name));

        return [
            `From ${from || '—'}`,
            `To ${to || '—'}`,
            customerLabels.length === 0
                ? 'All customers'
                : customerLabels.length === 1
                    ? `Customer: ${customerLabels[0]}`
                    : `${customerLabels.length} customers`,
            regionLabels.length === 0
                ? 'All regions'
                : regionLabels.length === 1
                    ? `Region: ${regionLabels[0]}`
                    : `${regionLabels.length} regions`,
        ];
    }, [customerOptions, from, regionOptions, selectedCustomers, selectedRegions, to]);

    const { totalTrips, totalTonnage, overallMargin } = useMemo(() => {
        const fallbackTrips = safeRows.reduce((sum, row) => sum + (row.trips ?? 0), 0);
        const fallbackTonnage = safeRows.reduce((sum, row) => sum + (row.tonnage ?? 0), 0);
        const margin = typeof totals?.margin_percent === 'number'
            ? totals.margin_percent
            : totals?.revenue > 0
                ? (totals.profit / totals.revenue) * 100
                : null;

        return {
            totalTrips: typeof totals?.trips === 'number' ? totals.trips : fallbackTrips,
            totalTonnage: typeof totals?.tonnage === 'number' ? totals.tonnage : fallbackTonnage,
            overallMargin: margin,
        };
    }, [safeRows, totals]);

    const summaryItems = useMemo<ReportSummaryItem[]>(
        () => [
            {
                label: 'Total Revenue',
                value: formatCurrency(totals.revenue),
                icon: CircleDollarSign,
                tone: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-200',
            },
            {
                label: 'Total Cost',
                value: formatCurrency(totals.cost),
                icon: TrendingDown,
                tone: 'bg-rose-100 text-rose-600 dark:bg-rose-500/20 dark:text-rose-200',
            },
            {
                label: 'Total Profit',
                value: formatCurrency(totals.profit),
                icon: TrendingUp,
                tone: totals.profit >= 0
                    ? 'bg-cyan-100 text-cyan-600 dark:bg-cyan-500/20 dark:text-cyan-200'
                    : 'bg-rose-100 text-rose-600 dark:bg-rose-500/20 dark:text-rose-200',
            },
            {
                label: 'Margin %',
                value: formatPercentage(overallMargin),
                icon: Percent,
                tone: overallMargin !== null && overallMargin >= 0
                    ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-200'
                    : 'bg-rose-100 text-rose-600 dark:bg-rose-500/20 dark:text-rose-200',
            },
            {
                label: 'Total Trips',
                value: formatInteger(totalTrips),
                icon: ClipboardList,
                tone: 'bg-violet-100 text-violet-600 dark:bg-violet-500/20 dark:text-violet-200',
            },
            {
                label: 'Total Tonnage (MT)',
                value: formatDecimal(totalTonnage),
                icon: BarChart3,
                tone: 'bg-sky-100 text-sky-600 dark:bg-sky-500/20 dark:text-sky-200',
            },
        ],
        [overallMargin, totalTonnage, totalTrips, totals.cost, totals.profit, totals.revenue],
    );

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Operation Profitability" />
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-slate-100/60 dark:bg-slate-900/40">
                <div className="flex flex-1 flex-col gap-6 overflow-y-auto p-4 pb-10 sm:p-6 lg:p-10">
                    <header className="rounded-2xl border border-slate-200 bg-white/95 px-6 py-6 shadow-sm backdrop-blur dark:border-slate-800/70 dark:bg-slate-900/70">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                            <div className="space-y-2">
                                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500 dark:text-slate-400">Operation Intelligence</p>
                                <h1 className="text-3xl font-semibold text-slate-900 dark:text-slate-50">Operation Profitability</h1>
                                <p className="max-w-3xl text-sm text-slate-600 dark:text-slate-300">
                                    Analyse profitability, margin, and cost efficiency by operation. Review revenue, expenses, and contribution across your operational portfolio.
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
                                    customerOptions={customerSelectionOptions}
                                    destinationOptions={regionSelectionOptions}
                                    selectedCustomers={selectedCustomers}
                                    selectedDestinations={selectedRegions}
                                    onCustomersChange={setSelectedCustomers}
                                    onDestinationsChange={setSelectedRegions}
                                    destinationFilterText={{
                                        label: 'Regions',
                                        triggerLabelWhenAll: 'All regions',
                                        summaryLabelWhenAll: 'All regions included',
                                        heading: 'Regions',
                                        searchPlaceholder: 'Search region...',
                                        emptyMessage: 'No regions found.',
                                        icon: MapPin,
                                    }}
                                    dateError={dateError}
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
                                            <DropdownMenuItem onSelect={() => handleExport('pdf')} className="gap-2">
                                                <FileType2 className="h-4 w-4 text-rose-500" />
                                                PDF
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                ) : null}
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
                                <CardTitle className="text-lg font-semibold text-slate-900 dark:text-slate-50">Operation Performance Detail</CardTitle>
                                <CardDescription className="text-sm">Profitability, margin, and cost metrics by operation.</CardDescription>
                                <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-500 dark:text-slate-400">
                                    {filterBadges.map((badge) => (
                                        <Badge key={badge} variant="outline" className="border-dashed">
                                            {badge}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader className="bg-slate-50/60 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-900/60 dark:text-slate-400">
                                        <TableRow className="divide-x divide-slate-200/40 dark:divide-slate-800/50">
                                            <TableHead className="whitespace-nowrap">Operation</TableHead>
                                            <TableHead className="whitespace-nowrap">Customer</TableHead>
                                            <TableHead className="whitespace-nowrap">Region</TableHead>
                                            <TableHead className="whitespace-nowrap text-right">Revenue</TableHead>
                                            <TableHead className="whitespace-nowrap text-right">Cost</TableHead>
                                            <TableHead className="whitespace-nowrap text-right">Profit</TableHead>
                                            <TableHead className="whitespace-nowrap text-right">Margin %</TableHead>
                                            <TableHead className="whitespace-nowrap text-right">Trips</TableHead>
                                            <TableHead className="whitespace-nowrap text-right">Tonnage</TableHead>
                                            <TableHead className="whitespace-nowrap text-right">Avg Km/Trip</TableHead>
                                            <TableHead className="whitespace-nowrap text-right">Cost/Km</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {safeRows.length > 0 ? (
                                            safeRows.map((operation) => (
                                                <TableRow key={operation.operation_id} className="divide-x divide-slate-100 hover:bg-slate-50/70 dark:divide-slate-800/50 dark:hover:bg-slate-900/50">
                                                    <TableCell className="whitespace-nowrap font-medium text-slate-900 dark:text-slate-100">{operation.code}</TableCell>
                                                    <TableCell className="whitespace-nowrap text-slate-600 dark:text-slate-400">{operation.customer_name}</TableCell>
                                                    <TableCell className="whitespace-nowrap text-slate-600 dark:text-slate-400">{operation.region_name}</TableCell>
                                                    <TableCell className="whitespace-nowrap text-right">{formatCurrency(operation.revenue)}</TableCell>
                                                    <TableCell className="whitespace-nowrap text-right">{formatCurrency(operation.cost)}</TableCell>
                                                    <TableCell className="whitespace-nowrap text-right font-semibold">
                                                        <span className={getFinancialTone(operation.profit)}>{formatCurrency(operation.profit)}</span>
                                                    </TableCell>
                                                    <TableCell className="whitespace-nowrap text-right">
                                                        {operation.margin_percent !== null ? (
                                                            <Badge className={getMarginChipClass(operation.margin_percent)}>
                                                                {formatPercentage(operation.margin_percent)}
                                                            </Badge>
                                                        ) : (
                                                            <span className="text-slate-400">—</span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="whitespace-nowrap text-right">{formatInteger(operation.trips)}</TableCell>
                                                    <TableCell className="whitespace-nowrap text-right">{formatDecimal(operation.tonnage)}</TableCell>
                                                    <TableCell className="whitespace-nowrap text-right">{formatDecimal(operation.avg_km_per_trip)}</TableCell>
                                                    <TableCell className="whitespace-nowrap text-right">{operation.cost_per_km === null ? '—' : formatCurrency(operation.cost_per_km)}</TableCell>
                                                </TableRow>
                                            ))
                                        ) : (
                                            <TableRow>
                                                <TableCell colSpan={11} className="py-10 text-center text-sm text-muted-foreground">
                                                    No data for selected period. Adjust your filters and generate the report again.
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








