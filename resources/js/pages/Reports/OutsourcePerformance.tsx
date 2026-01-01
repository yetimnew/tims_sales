import { useCallback, useMemo, useState } from 'react';
import { router } from '@inertiajs/react';
import { type BreadcrumbItem } from '@/types';
import { ReportFiltersDialog } from '@/components/reports/report-filters-dialog';
import { ReportSummaryGrid, type ReportSummaryItem } from '@/components/reports/report-summary-grid';
import { ReportDispatchTable, type ReportDispatchRow, type ReportSummary as ReportSummaryData } from '@/components/reports/report-dispatch-table';
import type { ReportSelectionOption } from '@/components/reports/types';
import { formatCurrency, formatDecimal, formatInteger, formatPercentage } from '@/components/reports/formatters';
import { Building2, CircleDollarSign, ClipboardList, Flame, Route, TrendingUp } from 'lucide-react';
import { usePermissions } from '@/hooks/use-permissions';
import { ReportPageLayout } from '@/components/report/report-page-layout';

interface VendorOption {
    id: number;
    name: string;
    status?: string | null;
}

interface OperationOption {
    id: number;
    code: string;
    status?: string | null;
    customer?: string | null;
}

interface DestinationOption {
    id: number;
    name: string;
    status?: string | null;
}

interface StatusOption {
    value: string;
    label: string;
}

interface Filters {
    from?: string | null;
    to?: string | null;
    outsource_ids?: number[];
    operation_ids?: number[];
    destination_ids?: number[];
    statuses?: string[];
    limit?: number;
}

interface OutsourcePerformanceProps {
    filters: Filters;
    rows: ReportDispatchRow[];
    summary: ReportSummaryData;
    highlights?: unknown;
    options: {
        vendors: VendorOption[];
        operations: OperationOption[];
        destinations: DestinationOption[];
        statuses: StatusOption[];
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Reports', href: '/reports/outsource-performance' },
    { title: 'Outsource Performance', href: '/reports/outsource-performance' },
];

const toParamsArray = (key: string, values: Array<number | string>, params: URLSearchParams) => {
    values.forEach((value) => params.append(`${key}[]`, String(value)));
};

export default function OutsourcePerformance({ filters, rows = [], summary, options }: OutsourcePerformanceProps) {
    const { hasPermission } = usePermissions();
    const canExport = hasPermission('reports.outsource-performance.export');

    const vendorSource = options?.vendors;
    const operationSource = options?.operations;
    const destinationSource = options?.destinations;
    const statusSource = options?.statuses;

    const vendorOptions = useMemo<VendorOption[]>(() => (Array.isArray(vendorSource) ? vendorSource : []), [vendorSource]);
    const operationOptions = useMemo<OperationOption[]>(() => (Array.isArray(operationSource) ? operationSource : []), [operationSource]);
    const destinationOptions = useMemo<DestinationOption[]>(() => (Array.isArray(destinationSource) ? destinationSource : []), [destinationSource]);
    const statusOptions = useMemo<StatusOption[]>(() => (Array.isArray(statusSource) ? statusSource : []), [statusSource]);

    const safeRows = useMemo<ReportDispatchRow[]>(() => (Array.isArray(rows) ? rows : []), [rows]);

    const vendorSelectionOptions = useMemo<ReportSelectionOption[]>(
        () =>
            vendorOptions.map((option) => ({
                id: option.id,
                label: option.name ?? `Vendor #${option.id}`,
                badge: option.status ?? undefined,
            })),
        [vendorOptions],
    );

    const operationSelectionOptions = useMemo<ReportSelectionOption[]>(
        () =>
            operationOptions.map((option) => ({
                id: option.id,
                label: option.code,
                description: option.customer ?? undefined,
                badge: option.status ?? undefined,
            })),
        [operationOptions],
    );

    const destinationSelectionOptions = useMemo<ReportSelectionOption[]>(
        () =>
            destinationOptions.map((option) => ({
                id: option.id,
                label: option.name ?? '—',
                badge: option.status ?? undefined,
            })),
        [destinationOptions],
    );

    const statusSelectionOptions = useMemo<ReportSelectionOption[]>(
        () =>
            statusOptions.map((option) => ({
                id: option.value,
                label: option.label,
            })),
        [statusOptions],
    );

    const [from, setFrom] = useState(filters?.from ?? '');
    const [to, setTo] = useState(filters?.to ?? '');
    const [limit, setLimit] = useState<number>(filters?.limit ?? 200);
    const [selectedVendors, setSelectedVendors] = useState<number[]>(filters?.outsource_ids ?? []);
    const [selectedOperations, setSelectedOperations] = useState<number[]>(filters?.operation_ids ?? []);
    const [selectedDestinations, setSelectedDestinations] = useState<number[]>(filters?.destination_ids ?? []);
    const [selectedStatuses, setSelectedStatuses] = useState<string[]>(filters?.statuses ?? []);

    const [filtersOpen, setFiltersOpen] = useState(false);
    const [dateError, setDateError] = useState<string | null>(null);

    const activeFilterCount = useMemo(() => {
        let count = 0;

        if (from && from !== (filters?.from ?? '')) count += 1;
        if (to && to !== (filters?.to ?? '')) count += 1;
        if (limit !== (filters?.limit ?? 200)) count += 1;
        if (selectedVendors.length > 0) count += 1;
        if (selectedOperations.length > 0) count += 1;
        if (selectedDestinations.length > 0) count += 1;
        if (selectedStatuses.length > 0) count += 1;

        return count;
    }, [filters?.from, filters?.limit, filters?.to, from, limit, selectedDestinations.length, selectedOperations.length, selectedStatuses.length, selectedVendors.length, to]);

    const summaryItems = useMemo<ReportSummaryItem[]>(
        () => [
            {
                label: 'Dispatches',
                value: formatInteger(summary?.records ?? safeRows.length),
                icon: ClipboardList,
                tone: 'bg-sky-100 text-sky-600 dark:bg-sky-500/20 dark:text-sky-200',
            },
            {
                label: 'Total tonnage (MT)',
                value: formatDecimal(summary?.tonnage ?? 0),
                icon: Building2,
                tone: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-200',
            },
            {
                label: 'Distance (km)',
                value: formatDecimal(summary?.distance_total ?? 0),
                icon: Route,
                tone: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-200',
            },
            {
                label: 'Vendor spend',
                value: formatCurrency(summary?.expense ?? 0),
                icon: CircleDollarSign,
                tone: 'bg-cyan-100 text-cyan-600 dark:bg-cyan-500/20 dark:text-cyan-200',
            },
            {
                label: 'Revenue',
                value: formatCurrency(summary?.revenue ?? 0),
                icon: Flame,
                tone: 'bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-200',
            },
            {
                label: 'Margin %',
                value: formatPercentage(summary?.margin_percent ?? null),
                icon: TrendingUp,
                tone: 'bg-rose-100 text-rose-600 dark:bg-rose-500/20 dark:text-rose-200',
            },
        ],
        [safeRows.length, summary],
    );

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
            limit,
        };

        if (selectedVendors.length > 0) params.outsource_ids = selectedVendors;
        if (selectedOperations.length > 0) params.operation_ids = selectedOperations;
        if (selectedDestinations.length > 0) params.destination_ids = selectedDestinations;
        if (selectedStatuses.length > 0) params.statuses = selectedStatuses;

        router.get('/reports/outsource-performance', params, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleReset = () => {
        setFrom(filters?.from ?? '');
        setTo(filters?.to ?? '');
        setLimit(filters?.limit ?? 200);
        setSelectedVendors(filters?.outsource_ids ?? []);
        setSelectedOperations(filters?.operation_ids ?? []);
        setSelectedDestinations(filters?.destination_ids ?? []);
        setSelectedStatuses(filters?.statuses ?? []);
        setFiltersOpen(false);
        setDateError(null);

        router.get('/reports/outsource-performance', {}, { preserveState: false, preserveScroll: true });
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
        if (limit) params.set('limit', String(limit));

        if (selectedVendors.length > 0) toParamsArray('outsource_ids', selectedVendors, params);
        if (selectedOperations.length > 0) toParamsArray('operation_ids', selectedOperations, params);
        if (selectedDestinations.length > 0) toParamsArray('destination_ids', selectedDestinations, params);
        if (selectedStatuses.length > 0) toParamsArray('statuses', selectedStatuses, params);

        const query = params.toString();
        const url = `/reports/outsource-performance/export/${format}${query ? `?${query}` : ''}`;
        window.location.href = url;
    };

    const appliedFrom = filters?.from ?? '';
    const appliedTo = filters?.to ?? '';
    const appliedVendorCount = filters?.outsource_ids?.length ?? 0;
    const appliedOperationCount = filters?.operation_ids?.length ?? 0;
    const appliedDestinationCount = filters?.destination_ids?.length ?? 0;
    const appliedStatuses = filters?.statuses ?? [];
    const appliedLimit = filters?.limit ?? 200;
    const summaryMargin = summary?.margin_percent ?? null;

    const filterBadges = useMemo(
        () => {
            const badges: string[] = [];

            badges.push(`From ${appliedFrom || '—'}`);
            badges.push(`To ${appliedTo || '—'}`);
            badges.push(appliedVendorCount > 0 ? `${appliedVendorCount} vendor${appliedVendorCount > 1 ? 's' : ''}` : 'All vendors');
            badges.push(appliedOperationCount > 0 ? `${appliedOperationCount} operation${appliedOperationCount > 1 ? 's' : ''}` : 'All operations');
            badges.push(appliedDestinationCount > 0 ? `${appliedDestinationCount} destination${appliedDestinationCount > 1 ? 's' : ''}` : 'All destinations');
            badges.push(appliedStatuses.length > 0 ? `${appliedStatuses.length} status${appliedStatuses.length > 1 ? 'es' : ''}` : 'All statuses');
            badges.push(`Limit ${appliedLimit}`);

            return badges;
        },
        [appliedDestinationCount, appliedFrom, appliedLimit, appliedOperationCount, appliedStatuses.length, appliedTo, appliedVendorCount],
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

    return (
        <ReportPageLayout
            title="Outsource Dispatch Performance"
            description="Review every outsource dispatch alongside internal benchmarks. Filter by vendor, route, and status to reconcile spend, revenue, and profitability."
            breadcrumbs={breadcrumbs}
            icon={<Building2 className="h-6 w-6" />}
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
                    limit={limit}
                    onLimitChange={setLimit}
                    dateError={dateError}
                    driverOptions={vendorSelectionOptions}
                    operationOptions={operationSelectionOptions}
                    destinationOptions={destinationSelectionOptions}
                    statusOptions={statusSelectionOptions}
                    selectedDrivers={selectedVendors}
                    selectedOperations={selectedOperations}
                    selectedDestinations={selectedDestinations}
                    selectedStatuses={selectedStatuses}
                    onDriversChange={setSelectedVendors}
                    onOperationsChange={setSelectedOperations}
                    onDestinationsChange={setSelectedDestinations}
                    onStatusesChange={(ids) => setSelectedStatuses(ids.map(String))}
                    showTruckFilter={false}
                    driverFilterText={{
                        label: 'Vendors',
                        triggerLabelWhenAll: 'All vendors',
                        summaryLabelWhenAll: 'All vendors included',
                        heading: 'Vendors',
                        searchPlaceholder: 'Search vendor...',
                        emptyMessage: 'No vendors found.',
                        icon: Building2,
                    }}
                    destinationFilterText={{
                        label: 'Destinations',
                        summaryLabelWhenAll: 'All destinations included',
                    }}
                    statusFilterText={{
                        label: 'Statuses',
                        triggerLabelWhenAll: 'All statuses',
                        summaryLabelWhenAll: 'All statuses included',
                        heading: 'Statuses',
                        searchPlaceholder: 'Search status...',
                    }}
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
            <div className="p-6">
                <ReportDispatchTable
                    rows={safeRows}
                    summary={summary}
                    summaryMargin={summaryMargin}
                    filterBadges={filterBadges}
                    columnLabelOverrides={{
                        driver_name: 'Vendor',
                        truck_plate: 'Vendor Status',
                        fuel_litres: 'Fuel (L)',
                        other_cost: 'Vendor Cost',
                    }}
                />
            </div>
        </ReportPageLayout>
    );
}

