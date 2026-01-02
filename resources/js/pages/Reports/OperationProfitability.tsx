import { useCallback, useMemo, useState } from 'react';
import { router } from '@inertiajs/react';
import { type BreadcrumbItem } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ReportSummaryGrid, type ReportSummaryItem } from '@/components/reports/report-summary-grid';
import { ReportFiltersDialog } from '@/components/reports/report-filters-dialog';
import type { ReportSelectionOption } from '@/components/reports/types';
import { formatCurrency, formatDecimal, formatInteger, formatPercentage, getFinancialTone, getMarginChipClass } from '@/components/reports/formatters';
import { usePermissions } from '@/hooks/use-permissions';
import { CircleDollarSign, TrendingDown, TrendingUp, ClipboardList, BarChart3, MapPin, Percent } from 'lucide-react';
import { ReportPageLayout } from '@/components/report/report-page-layout';

interface CustomerOption {
    id: number;
    name: string;
    status?: string | null;
}

interface RegionOption {
    id: number;
    name: string;
}

interface ServiceTypeOption {
    value: string;
    label: string;
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
    service_types?: string[];
}

interface Options {
    customers?: CustomerOption[];
    regions?: RegionOption[];
    service_types?: ServiceTypeOption[];
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

const toParamsArray = (key: string, values: Array<string | number>, params: URLSearchParams) => {
    values.forEach((value) => params.append(`${key}[]`, String(value)));
};

export default function OperationProfitability({ filters, totals, operations, options }: Props) {
    const { hasPermission } = usePermissions();
    const canExport = hasPermission('reports.operation-profitability.export');

    const customerSource = options?.customers;
    const regionSource = options?.regions;
    const serviceTypeSource = options?.service_types;

    const customerOptions = useMemo<CustomerOption[]>(() => (Array.isArray(customerSource) ? customerSource : []), [customerSource]);
    const regionOptions = useMemo<RegionOption[]>(() => (Array.isArray(regionSource) ? regionSource : []), [regionSource]);
    const serviceTypeOptions = useMemo<ServiceTypeOption[]>(() => (Array.isArray(serviceTypeSource) ? serviceTypeSource : []), [serviceTypeSource]);

    const [from, setFrom] = useState(filters?.from ?? '');
    const [to, setTo] = useState(filters?.to ?? '');
    const [selectedCustomers, setSelectedCustomers] = useState<number[]>(filters?.customer_ids ?? []);
    const [selectedRegions, setSelectedRegions] = useState<number[]>(filters?.region_ids ?? []);
    const [selectedServiceTypes, setSelectedServiceTypes] = useState<string[]>(filters?.service_types ?? []);
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

    const serviceTypeSelectionOptions = useMemo<ReportSelectionOption[]>(
        () =>
            serviceTypeOptions.map((serviceType) => ({
                id: serviceType.value,
                label: serviceType.label,
            })),
        [serviceTypeOptions],
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
        if (selectedServiceTypes.length > 0) params.service_types = selectedServiceTypes;

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
        setSelectedServiceTypes(filters?.service_types ?? []);
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
        if (selectedServiceTypes.length > 0) toParamsArray('service_types', selectedServiceTypes, params);

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
        if (selectedServiceTypes.length > 0) count += 1;

        return count;
    }, [filters?.from, filters?.to, from, to, selectedCustomers.length, selectedRegions.length, selectedServiceTypes.length]);

    const filterBadges = useMemo(() => {
        const customerLabels = selectedCustomers
            .map((id) => customerOptions.find((option) => option.id === id)?.name)
            .filter((name): name is string => Boolean(name));

        const regionLabels = selectedRegions
            .map((id) => regionOptions.find((option) => option.id === id)?.name)
            .filter((name): name is string => Boolean(name));

        const serviceTypeLabels = selectedServiceTypes
            .map((value) => serviceTypeOptions.find((option) => option.value === value)?.label)
            .filter((label): label is string => Boolean(label));

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
            serviceTypeLabels.length === 0
                ? 'All service types'
                : serviceTypeLabels.length === 1
                    ? serviceTypeLabels[0]
                    : `${serviceTypeLabels.length} service types`,
        ];
    }, [customerOptions, from, regionOptions, selectedCustomers, selectedRegions, selectedServiceTypes, serviceTypeOptions, to]);

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
        <ReportPageLayout
            title="Operation Profitability"
            description="Analyse profitability, margin, and cost efficiency by operation. Review revenue, expenses, and contribution across your operational portfolio."
            breadcrumbs={breadcrumbs}
            icon={<ClipboardList className="h-6 w-6" />}
            filters={
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
                    serviceTypeOptions={serviceTypeSelectionOptions}
                    selectedCustomers={selectedCustomers}
                    selectedDestinations={selectedRegions}
                    selectedServiceTypes={selectedServiceTypes}
                    onCustomersChange={setSelectedCustomers}
                    onDestinationsChange={setSelectedRegions}
                    onServiceTypesChange={setSelectedServiceTypes}
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
                            <CardTitle className="text-lg font-semibold text-slate-900 dark:text-slate-50">Operation Performance Detail</CardTitle>
                            <CardDescription className="text-sm">Profitability, margin, and cost metrics by operation.</CardDescription>
                            {filterBadges.length > 0 && (
                                <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-500 dark:text-slate-400">
                                    {filterBadges.map((badge) => (
                                        <Badge key={badge} variant="outline" className="border-dashed">
                                            {badge}
                                        </Badge>
                                    ))}
                                </div>
                            )}
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
        </ReportPageLayout>
    );
}








