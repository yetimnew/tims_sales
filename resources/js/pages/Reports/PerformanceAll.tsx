import { useMemo, useState } from 'react';
import { router } from '@inertiajs/react';
import { type BreadcrumbItem } from '@/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ReportFiltersDialog } from '@/components/reports/report-filters-dialog';
import { ReportSummaryGrid, type ReportSummaryItem } from '@/components/reports/report-summary-grid';
import { ReportDispatchTable, type ReportDispatchRow, type ReportSummary as ReportSummaryData } from '@/components/reports/report-dispatch-table';
import { ListingPaginationFooter } from '@/components/listing/pagination-footer';
import type { ReportSelectionOption } from '@/components/reports/types';
import { formatCurrency, formatDecimal, formatInteger, formatPercentage } from '@/components/reports/formatters';
import { BarChart3, CircleDollarSign, ClipboardList, Flame, Route, TrendingUp } from 'lucide-react';
import { usePermissions } from '@/hooks/use-permissions';
import { REPORT_DATE_RANGE_DESCRIPTION, useReportDateRange } from '@/components/reports/use-report-date-range';
import { ReportPageLayout } from '@/components/report/report-page-layout';

interface OptionBase {
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

type DriverOption = OptionBase;

interface TruckOption extends OptionBase {
    plate: string;
}

interface LoadPhaseOption {
    id: string;
    label: string;
}


interface Filters {
    from?: string | null;
    to?: string | null;
    driver_ids?: number[];
    truck_ids?: number[];
    operation_ids?: number[];
    load_phase?: string | null;
    per_page?: number;
}

interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

interface LaravelPaginator<T> {
    data: T[];
    current_page: number;
    first_page_url: string;
    from: number | null;
    last_page: number;
    last_page_url: string;
    links: PaginationLink[];
    next_page_url: string | null;
    path: string;
    per_page: number;
    prev_page_url: string | null;
    to: number | null;
    total: number;
}

interface PerformanceAllProps {
    filters: Filters;
    performances: LaravelPaginator<ReportDispatchRow>;
    summary: ReportSummaryData;
    perPageOptions: number[];
    options: {
        drivers: DriverOption[];
        trucks: TruckOption[];
        operations: OperationOption[];
        loadPhases: LoadPhaseOption[];
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Reports', href: '/reports/performance-all' },
    { title: 'Performance (All)', href: '/reports/performance-all' },
];

const toParamsArray = (key: string, values: Array<number | string>, params: URLSearchParams) => {
    values.forEach((value) => params.append(`${key}[]`, String(value)));
};

export default function PerformanceAll({ filters, performances, summary, perPageOptions, options }: PerformanceAllProps) {
    const { hasPermission } = usePermissions();
    const canExport = hasPermission('reports.performance-all.export');
    const driverSource = options?.drivers;
    const truckSource = options?.trucks;
    const operationSource = options?.operations;
    const loadPhaseSource = options?.loadPhases;

    const driverOptions = useMemo<DriverOption[]>(() => (Array.isArray(driverSource) ? driverSource : []), [driverSource]);
    const truckOptions = useMemo<TruckOption[]>(() => (Array.isArray(truckSource) ? truckSource : []), [truckSource]);
    const operationOptions = useMemo<OperationOption[]>(() => (Array.isArray(operationSource) ? operationSource : []), [operationSource]);
    const loadPhaseOptions = useMemo<LoadPhaseOption[]>(() => (Array.isArray(loadPhaseSource) ? loadPhaseSource : []), [loadPhaseSource]);

    const safeRows = useMemo<ReportDispatchRow[]>(() => (Array.isArray(performances?.data) ? performances.data : []), [performances]);
    const availablePerPageOptions = useMemo(() => (perPageOptions && perPageOptions.length > 0 ? perPageOptions : [10, 25, 50, 100, 200]), [perPageOptions]);

    const driverSelectionOptions = useMemo<ReportSelectionOption[]>(
        () =>
            driverOptions.map((option) => ({
                id: option.id,
                label: option.name ?? 'Unassigned',
                badge: option.status ?? undefined,
            })),
        [driverOptions],
    );

    const truckSelectionOptions = useMemo<ReportSelectionOption[]>(
        () =>
            truckOptions.map((option) => ({
                id: option.id,
                label: option.plate ?? '—',
                badge: option.status ?? undefined,
            })),
        [truckOptions],
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

    const loadPhaseSelectionOptions = useMemo<ReportSelectionOption[]>(
        () =>
            loadPhaseOptions.map((option) => ({
                id: option.id,
                label: option.label,
            })),
        [loadPhaseOptions],
    );

    const {
        from,
        to,
        dateError,
        validateDateRange,
        handleDateChange: handleDateRangeChange,
        resetDateRange,
    } = useReportDateRange(filters?.from ?? '', filters?.to ?? '');
    const [perPage, setPerPage] = useState<number>(filters?.per_page ?? availablePerPageOptions[2] ?? 50);
    const [selectedDrivers, setSelectedDrivers] = useState<number[]>(filters?.driver_ids ?? []);
    const [selectedTrucks, setSelectedTrucks] = useState<number[]>(filters?.truck_ids ?? []);
    const [selectedOperations, setSelectedOperations] = useState<number[]>(filters?.operation_ids ?? []);
    const [selectedLoadPhase, setSelectedLoadPhase] = useState<string>(filters?.load_phase ?? 'all');

    const [filtersOpen, setFiltersOpen] = useState(false);
    const activeFilterCount = useMemo(() => {
        let count = 0;

        if (from && from !== (filters?.from ?? '')) count += 1;
        if (to && to !== (filters?.to ?? '')) count += 1;
        if (perPage !== (filters?.per_page ?? 50)) count += 1;
        if (selectedDrivers.length > 0) count += 1;
        if (selectedTrucks.length > 0) count += 1;
        if (selectedOperations.length > 0) count += 1;
        if (selectedLoadPhase !== 'all') count += 1;

        return count;
    }, [from, to, perPage, selectedDrivers, selectedTrucks, selectedOperations, selectedLoadPhase, filters?.from, filters?.to, filters?.per_page, filters?.load_phase]);

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
                icon: BarChart3,
                tone: 'bg-violet-100 text-violet-600 dark:bg-violet-500/20 dark:text-violet-200',
            },
            {
                label: 'Distance (km)',
                value: formatDecimal(summary?.distance_total ?? 0),
                icon: Route,
                tone: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-200',
            },
            {
                label: 'Fuel (L)',
                value: formatDecimal(summary?.fuel_litres ?? 0),
                icon: Flame,
                tone: 'bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-200',
            },
            {
                label: 'Revenue',
                value: formatCurrency(summary?.revenue ?? 0),
                icon: CircleDollarSign,
                tone: 'bg-cyan-100 text-cyan-600 dark:bg-cyan-500/20 dark:text-cyan-200',
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

    const handleApplyFilters = () => {
        if (!validateDateRange(from, to)) {
            setFiltersOpen(true);

            return;
        }

        setFiltersOpen(false);

        const params: Record<string, unknown> = {
            from,
            to,
            per_page: perPage,
        };

        if (selectedDrivers.length > 0) params.driver_ids = selectedDrivers;
        if (selectedTrucks.length > 0) params.truck_ids = selectedTrucks;
        if (selectedOperations.length > 0) params.operation_ids = selectedOperations;
        if (selectedLoadPhase !== 'all') params.load_phase = selectedLoadPhase;

        router.get('/reports/performance-all', params, {
            preserveState: true,
            preserveScroll: false,
        });
    };

    const handleReset = () => {
        resetDateRange(filters?.from ?? '', filters?.to ?? '');
        setPerPage(availablePerPageOptions[2] ?? 50);
        setSelectedDrivers(filters?.driver_ids ?? []);
        setSelectedTrucks(filters?.truck_ids ?? []);
        setSelectedOperations(filters?.operation_ids ?? []);
        setSelectedLoadPhase(filters?.load_phase ?? 'all');
        setFiltersOpen(false);
        router.get('/reports/performance-all', {}, { preserveState: false, preserveScroll: false });
    };

    const handlePerPageChange = (value: string) => {
        const newPerPage = Number(value);
        setPerPage(newPerPage);
        const params: Record<string, unknown> = {
            from,
            to,
            per_page: newPerPage,
        };

        if (selectedDrivers.length > 0) params.driver_ids = selectedDrivers;
        if (selectedTrucks.length > 0) params.truck_ids = selectedTrucks;
        if (selectedOperations.length > 0) params.operation_ids = selectedOperations;
        if (selectedLoadPhase !== 'all') params.load_phase = selectedLoadPhase;

        router.get('/reports/performance-all', params, {
            preserveState: true,
            preserveScroll: false,
        });
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
        if (perPage) params.set('per_page', String(perPage));

        if (selectedDrivers.length > 0) toParamsArray('driver_ids', selectedDrivers, params);
        if (selectedTrucks.length > 0) toParamsArray('truck_ids', selectedTrucks, params);
        if (selectedOperations.length > 0) toParamsArray('operation_ids', selectedOperations, params);
        if (selectedLoadPhase !== 'all') params.set('load_phase', selectedLoadPhase);

        const query = params.toString();
        const url = `/reports/performance-all/export/${format}${query ? `?${query}` : ''}`;
        window.location.href = url;
    };

    const appliedFrom = filters?.from ?? '';
    const appliedTo = filters?.to ?? '';
    const appliedDriverCount = filters?.driver_ids?.length ?? 0;
    const appliedTruckCount = filters?.truck_ids?.length ?? 0;
    const appliedOperationCount = filters?.operation_ids?.length ?? 0;
    const appliedLoadPhase = filters?.load_phase ?? null;
    const summaryMargin = summary?.margin_percent ?? null;

    const appliedLoadPhaseLabel = appliedLoadPhase
        ? loadPhaseSelectionOptions.find((option) => option.id === appliedLoadPhase)?.label ?? appliedLoadPhase
        : 'All load phases';

    const filterBadges = useMemo(
        () => [
            `From ${appliedFrom || '—'}`,
            `To ${appliedTo || '—'}`,
            appliedDriverCount > 0 ? `${appliedDriverCount} driver${appliedDriverCount > 1 ? 's' : ''}` : 'All drivers',
            appliedTruckCount > 0 ? `${appliedTruckCount} truck${appliedTruckCount > 1 ? 's' : ''}` : 'All trucks',
            appliedOperationCount > 0 ? `${appliedOperationCount} operation${appliedOperationCount > 1 ? 's' : ''}` : 'All operations',
            appliedLoadPhaseLabel,
        ],
        [appliedDriverCount, appliedFrom, appliedOperationCount, appliedTo, appliedTruckCount, appliedLoadPhaseLabel],
    );

    return (
        <ReportPageLayout
            title="Performance (All Dispatches)"
            description="Review every dispatch outcome across drivers, trucks, operations, and destinations. Refine the window, focus on specific assets, and export ready-to-share reports for your operations team."
            breadcrumbs={breadcrumbs}
            icon={<ClipboardList className="h-6 w-6" />}
            filters={
                <ReportFiltersDialog
                    open={filtersOpen}
                    onOpenChange={setFiltersOpen}
                    activeFilterCount={activeFilterCount}
                    from={from}
                    to={to}
                    onDateChange={handleDateRangeChange}
                    dateRangeDescription={REPORT_DATE_RANGE_DESCRIPTION}
                    limit={perPage}
                    onLimitChange={setPerPage}
                    onReset={handleReset}
                    onApply={handleApplyFilters}
                    driverOptions={driverSelectionOptions}
                    truckOptions={truckSelectionOptions}
                    operationOptions={operationSelectionOptions}
                    loadPhaseOptions={loadPhaseSelectionOptions}
                    selectedDrivers={selectedDrivers}
                    selectedTrucks={selectedTrucks}
                    selectedOperations={selectedOperations}
                    selectedLoadPhase={selectedLoadPhase !== 'all' ? selectedLoadPhase : null}
                    onDriversChange={setSelectedDrivers}
                    onTrucksChange={setSelectedTrucks}
                    onOperationsChange={setSelectedOperations}
                    onLoadPhaseChange={(value) => {
                        setSelectedLoadPhase(value ?? 'all');
                    }}
                    dateError={dateError}
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
            <div className="space-y-6 p-6">
                <ReportDispatchTable rows={safeRows} summary={summary} summaryMargin={summaryMargin} filterBadges={filterBadges} />

                {performances && performances.links && performances.last_page > 1 && (
                    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-md dark:border-slate-700 dark:bg-slate-900">
                        <ListingPaginationFooter
                            from={performances.from}
                            to={performances.to}
                            total={performances.total}
                            links={performances.links}
                            extra={
                                <div className="flex items-center gap-2">
                                    <label htmlFor="per-page-select" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                        Rows per page:
                                    </label>
                                    <Select value={String(perPage)} onValueChange={handlePerPageChange}>
                                        <SelectTrigger
                                            id="per-page-select"
                                            className="h-9 w-[70px] border-slate-300 bg-white font-semibold shadow-sm transition-all hover:border-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-slate-600 dark:bg-slate-800 dark:hover:border-slate-500"
                                        >
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="min-w-[70px]">
                                            {availablePerPageOptions.map((option) => (
                                                <SelectItem key={option} value={String(option)} className="font-semibold">
                                                    {option}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            }
                        />
                    </div>
                )}
            </div>
        </ReportPageLayout>
    );
}




























