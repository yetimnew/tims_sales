import { useCallback, useMemo, useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ReportFiltersDialog } from '@/components/reports/report-filters-dialog';
import { ReportSummaryGrid, type ReportSummaryItem } from '@/components/reports/report-summary-grid';
import { ReportDispatchTable, type ReportDispatchRow, type ReportSummary as ReportSummaryData } from '@/components/reports/report-dispatch-table';
import { ListingPaginationFooter } from '@/components/listing/pagination-footer';
import type { ReportSelectionOption } from '@/components/reports/types';
import { formatCurrency, formatDecimal, formatInteger, formatPercentage } from '@/components/reports/formatters';
import { BarChart3, CircleDollarSign, ClipboardList, Download, FileDigit, FileSpreadsheet, FileType2, Flame, RefreshCcw, Route, TrendingUp } from 'lucide-react';
import { usePermissions } from '@/hooks/use-permissions';

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

type DestinationOption = OptionBase;

type DriverOption = OptionBase;

interface TruckOption extends OptionBase {
    plate: string;
}


interface Filters {
    from?: string | null;
    to?: string | null;
    driver_ids?: number[];
    truck_ids?: number[];
    operation_ids?: number[];
    destination_ids?: number[];
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
        destinations: DestinationOption[];
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
    const destinationSource = options?.destinations;

    const driverOptions = useMemo<DriverOption[]>(() => (Array.isArray(driverSource) ? driverSource : []), [driverSource]);
    const truckOptions = useMemo<TruckOption[]>(() => (Array.isArray(truckSource) ? truckSource : []), [truckSource]);
    const operationOptions = useMemo<OperationOption[]>(() => (Array.isArray(operationSource) ? operationSource : []), [operationSource]);
    const destinationOptions = useMemo<DestinationOption[]>(() => (Array.isArray(destinationSource) ? destinationSource : []), [destinationSource]);

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

    const destinationSelectionOptions = useMemo<ReportSelectionOption[]>(
        () =>
            destinationOptions.map((option) => ({
                id: option.id,
                label: option.name ?? '—',
                badge: option.status ?? undefined,
            })),
        [destinationOptions],
    );

    const [from, setFrom] = useState(filters?.from ?? '');
    const [to, setTo] = useState(filters?.to ?? '');
    const [perPage, setPerPage] = useState<number>(filters?.per_page ?? availablePerPageOptions[2] ?? 50);
    const [selectedDrivers, setSelectedDrivers] = useState<number[]>(filters?.driver_ids ?? []);
    const [selectedTrucks, setSelectedTrucks] = useState<number[]>(filters?.truck_ids ?? []);
    const [selectedOperations, setSelectedOperations] = useState<number[]>(filters?.operation_ids ?? []);
    const [selectedDestinations, setSelectedDestinations] = useState<number[]>(filters?.destination_ids ?? []);

    const [filtersOpen, setFiltersOpen] = useState(false);
    const [dateError, setDateError] = useState<string | null>(null);
    const activeFilterCount = useMemo(() => {
        let count = 0;

        if (from && from !== (filters?.from ?? '')) count += 1;
        if (to && to !== (filters?.to ?? '')) count += 1;
        if (perPage !== (filters?.per_page ?? 50)) count += 1;
        if (selectedDrivers.length > 0) count += 1;
        if (selectedTrucks.length > 0) count += 1;
        if (selectedOperations.length > 0) count += 1;
        if (selectedDestinations.length > 0) count += 1;

        return count;
    }, [from, to, perPage, selectedDrivers, selectedTrucks, selectedOperations, selectedDestinations, filters?.from, filters?.to, filters?.per_page]);

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
            per_page: perPage,
        };

        if (selectedDrivers.length > 0) params.driver_ids = selectedDrivers;
        if (selectedTrucks.length > 0) params.truck_ids = selectedTrucks;
        if (selectedOperations.length > 0) params.operation_ids = selectedOperations;
        if (selectedDestinations.length > 0) params.destination_ids = selectedDestinations;

        router.get('/reports/performance-all', params, {
            preserveState: true,
            preserveScroll: false,
        });
    };

    const handleReset = () => {
        setFrom(filters?.from ?? '');
        setTo(filters?.to ?? '');
        setPerPage(availablePerPageOptions[2] ?? 50);
        setSelectedDrivers(filters?.driver_ids ?? []);
        setSelectedTrucks(filters?.truck_ids ?? []);
        setSelectedOperations(filters?.operation_ids ?? []);
        setSelectedDestinations(filters?.destination_ids ?? []);
        setFiltersOpen(false);
        setDateError(null);
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
        if (selectedDestinations.length > 0) params.destination_ids = selectedDestinations;

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
        if (selectedDestinations.length > 0) toParamsArray('destination_ids', selectedDestinations, params);

        const query = params.toString();
        const url = `/reports/performance-all/export/${format}${query ? `?${query}` : ''}`;
        window.location.href = url;
    };

    const appliedFrom = filters?.from ?? '';
    const appliedTo = filters?.to ?? '';
    const appliedDriverCount = filters?.driver_ids?.length ?? 0;
    const appliedTruckCount = filters?.truck_ids?.length ?? 0;
    const appliedOperationCount = filters?.operation_ids?.length ?? 0;
    const appliedDestinationCount = filters?.destination_ids?.length ?? 0;
    const summaryMargin = summary?.margin_percent ?? null;

    const filterBadges = useMemo(
        () => [
            `From ${appliedFrom || '—'}`,
            `To ${appliedTo || '—'}`,
            appliedDriverCount > 0 ? `${appliedDriverCount} driver${appliedDriverCount > 1 ? 's' : ''}` : 'All drivers',
            appliedTruckCount > 0 ? `${appliedTruckCount} truck${appliedTruckCount > 1 ? 's' : ''}` : 'All trucks',
            appliedOperationCount > 0 ? `${appliedOperationCount} operation${appliedOperationCount > 1 ? 's' : ''}` : 'All operations',
            appliedDestinationCount > 0 ? `${appliedDestinationCount} destination${appliedDestinationCount > 1 ? 's' : ''}` : 'All destinations',
        ],
        [appliedDestinationCount, appliedDriverCount, appliedFrom, appliedOperationCount, appliedTo, appliedTruckCount],
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
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Performance (All)" />
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-slate-100/60 dark:bg-slate-900/40">
                <div className="flex flex-1 flex-col gap-6 overflow-y-auto p-4 pb-10 sm:p-6 lg:p-10">
                    <header className="rounded-2xl border border-slate-200 bg-white/95 px-6 py-6 shadow-sm backdrop-blur dark:border-slate-800/70 dark:bg-slate-900/70">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                            <div className="space-y-2">
                                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500 dark:text-slate-400">Performance Intelligence</p>
                                <h1 className="text-3xl font-semibold text-slate-900 dark:text-slate-50">Performance (All Dispatches)</h1>
                                <p className="max-w-3xl text-sm text-slate-600 dark:text-slate-300">
                                    Review every dispatch outcome across drivers, trucks, operations, and destinations. Refine the window, focus on specific assets, and export ready-to-share reports for your operations team.
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
                                    limit={perPage}
                                    onLimitChange={setPerPage}
                                    onReset={handleReset}
                                    onApply={handleApplyFilters}
                                    driverOptions={driverSelectionOptions}
                                    truckOptions={truckSelectionOptions}
                                    operationOptions={operationSelectionOptions}
                                    destinationOptions={destinationSelectionOptions}
                                    selectedDrivers={selectedDrivers}
                                    selectedTrucks={selectedTrucks}
                                    selectedOperations={selectedOperations}
                                    selectedDestinations={selectedDestinations}
                                    onDriversChange={setSelectedDrivers}
                                    onTrucksChange={setSelectedTrucks}
                                    onOperationsChange={setSelectedOperations}
                                    onDestinationsChange={setSelectedDestinations}
                                    dateError={dateError}
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

                    <ReportDispatchTable rows={safeRows} summary={summary} summaryMargin={summaryMargin} filterBadges={filterBadges} />

                    {performances && performances.links && performances.last_page > 1 && (
                        <div className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-md dark:border-slate-700 dark:bg-slate-900">
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
            </div>
        </AppLayout>
    );
}




























