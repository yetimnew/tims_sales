import { useCallback, useEffect, useMemo, useState } from 'react';
import { router } from '@inertiajs/react';
import { type BreadcrumbItem } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ReportFiltersDialog } from '@/components/reports/report-filters-dialog';
import { ReportSummaryGrid, type ReportSummaryItem } from '@/components/reports/report-summary-grid';
import { ReportMaintenanceTable, type MaintenanceReportRow } from '@/components/reports/report-maintenance-table';
import type { ReportSelectionOption } from '@/components/reports/types';
import { formatCurrency, formatInteger, formatPercentage } from '@/components/reports/formatters';
import { AlertTriangle, CalendarDays, CheckCircle2, ClipboardList, DollarSign, ShieldAlert, Wrench } from 'lucide-react';
import { usePermissions } from '@/hooks/use-permissions';
import { ReportPageLayout } from '@/components/report/report-page-layout';

interface MaintenanceFilters {
    from?: string | null;
    to?: string | null;
    truck_ids?: number[];
    maintenance_type_ids?: number[];
    statuses?: string[];
    service_providers?: string[];
    per_page?: number | null;
}

interface MaintenanceOptions {
    trucks: { id: number; plate: string; status?: string | null }[];
    maintenance_types: { id: number; name: string; category?: string | null }[];
    statuses: string[];
    service_providers: string[];
}

interface MaintenanceTotals {
    records: number;
    completed: number;
    scheduled: number;
    in_progress: number;
    overdue: number;
    total_cost: number;
    completed_cost: number;
    open_cost: number;
    truck_count: number;
    type_count: number;
    average_completion_days: number | null;
}

interface MaintenanceSummary {
    completion_rate_pct: number | null;
    overdue_rate_pct: number | null;
    average_cost_per_record: number | null;
    average_cost_per_completed: number | null;
    average_completion_days: number | null;
    share_of_cost_tracked_types_pct: number | null;
    upcoming_within_seven_days: number;
}

interface MaintenanceBreakdownRow {
    truck_id: number;
    plate: string;
    status?: string | null;
    records: number;
    completed: number;
    scheduled: number;
    in_progress: number;
    overdue: number;
    completion_rate_pct: number | null;
    overdue_rate_pct: number | null;
    total_cost: number;
    completed_cost: number;
    open_cost: number;
    average_cost: number | null;
    average_completion_days: number | null;
    last_completed_at: string | null;
    next_scheduled_at: string | null;
    max_overdue_days: number | null;
}

interface MaintenanceTypeBreakdownRow {
    maintenance_type_id: number;
    name: string;
    category?: string | null;
    records: number;
    completed: number;
    scheduled: number;
    overdue: number;
    completion_rate_pct: number | null;
    total_cost: number;
    average_cost: number | null;
}

interface MaintenanceTrendRow {
    period: string;
    records: number;
    completed: number;
    scheduled: number;
    overdue: number;
    total_cost: number;
    average_cost_per_record: number | null;
}

interface MaintenanceUpcomingRow {
    id: number;
    truck: { id: number; plate: string; status?: string | null } | null;
    maintenance_type: { id: number | null; name: string | null; category?: string | null } | null;
    scheduled_date: string | null;
    days_until: number | null;
    service_provider?: string | null;
    estimated_cost: number | null;
}

interface MaintenanceHighlights {
    highest_cost_trucks: MaintenanceBreakdownRow[];
    most_overdue_trucks: MaintenanceBreakdownRow[];
    costliest_types: MaintenanceTypeBreakdownRow[];
    upcoming: MaintenanceUpcomingRow[];
}

interface MaintenanceProps {
    filters: MaintenanceFilters;
    options: MaintenanceOptions;
    totals: MaintenanceTotals;
    summary: MaintenanceSummary;
    breakdown: MaintenanceBreakdownRow[];
    breakdown_paginator?: {
        meta?: {
            current_page?: number | null;
            last_page?: number | null;
            per_page?: number | null;
            total?: number | null;
            from?: number | null;
            to?: number | null;
        } | null;
        links?: Array<{ url: string | null; label: string; active?: boolean }>;
    } | null;
    per_page_options?: number[];
    type_breakdown: MaintenanceTypeBreakdownRow[];
    trend: MaintenanceTrendRow[];
    upcoming: MaintenanceUpcomingRow[];
    highlights: MaintenanceHighlights;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Reports', href: '/reports/maintenance' },
    { title: 'Maintenance', href: '/reports/maintenance' },
];

const formatOptionalCurrency = (value: number | null): string => {
    if (value === null || Number.isNaN(value)) {
        return '—';
    }

    return formatCurrency(value);
};


const toParamsArray = (key: string, values: Array<number | string>, params: URLSearchParams) => {
    values.forEach((value, index) => {
        params.append(`${key}[${index}]`, String(value));
    });
};

export default function MaintenanceReport({
    filters,
    options,
    totals,
    summary,
    breakdown = [],
    breakdown_paginator: breakdownPaginator = null,
    type_breakdown: typeBreakdown = [],
    trend = [],
    upcoming = [],
    per_page_options: perPageOptionsProp = [],
    highlights,
}: MaintenanceProps) {
    const { hasPermission } = usePermissions();
    const canExport = hasPermission('reports.maintenance.export');

    const truckSelectionOptions = useMemo<ReportSelectionOption[]>(
        () =>
            Array.isArray(options?.trucks)
                ? options.trucks.map((truck) => ({
                      id: truck.id,
                      label: truck.plate,
                      badge: truck.status ?? undefined,
                  }))
                : [],
        [options?.trucks],
    );

    const maintenanceTypeOptions = useMemo<ReportSelectionOption[]>(
        () =>
            Array.isArray(options?.maintenance_types)
                ? options.maintenance_types.map((type) => ({
                      id: type.id,
                      label: type.name,
                      badge: type.category ?? undefined,
                  }))
                : [],
        [options?.maintenance_types],
    );

    const statusSelectionOptions = useMemo<ReportSelectionOption[]>(
        () =>
            Array.isArray(options?.statuses)
                ? options.statuses.map((status) => ({
                      id: status,
                      label: status,
                  }))
                : [],
        [options?.statuses],
    );

    const providerSelectionOptions = useMemo<ReportSelectionOption[]>(
        () =>
            Array.isArray(options?.service_providers)
                ? options.service_providers.map((provider) => ({
                      id: provider,
                      label: provider,
                  }))
                : [],
        [options?.service_providers],
    );

    const safeBreakdown = useMemo<MaintenanceReportRow[]>(
        () => (Array.isArray(breakdown) ? breakdown : []),
        [breakdown],
    );

    const safeTypeBreakdown = useMemo(
        () => (Array.isArray(typeBreakdown) ? typeBreakdown : []),
        [typeBreakdown],
    );

    const safeTrend = useMemo(() => (Array.isArray(trend) ? trend : []), [trend]);
    const safeUpcoming = useMemo(() => (Array.isArray(upcoming) ? upcoming : []), [upcoming]);

    const highlightData = useMemo(
        () => ({
            highest_cost_trucks: highlights?.highest_cost_trucks ?? [],
            most_overdue_trucks: highlights?.most_overdue_trucks ?? [],
            costliest_types: highlights?.costliest_types ?? [],
            upcoming: highlights?.upcoming ?? [],
        }),
        [highlights],
    );

    const breakdownPaginatorMeta = useMemo(
        () => (breakdownPaginator && typeof breakdownPaginator === 'object' ? breakdownPaginator.meta ?? null : null),
        [breakdownPaginator],
    );

    const breakdownPaginationLinks = useMemo(
        () => (breakdownPaginator && Array.isArray(breakdownPaginator.links) ? breakdownPaginator.links : []),
        [breakdownPaginator],
    );

    const perPageOptionsList = useMemo<number[]>(
        () => (Array.isArray(perPageOptionsProp) && perPageOptionsProp.length > 0 ? perPageOptionsProp : [10, 25, 50]),
        [perPageOptionsProp],
    );

    const breakdownPerPage = breakdownPaginatorMeta?.per_page ?? null;

    const [perPage, setPerPage] = useState<number>(filters?.per_page ?? breakdownPerPage ?? perPageOptionsList[0] ?? 25);

    useEffect(() => {
        const next = filters?.per_page ?? breakdownPerPage ?? perPageOptionsList[0] ?? 25;
        setPerPage(next);
    }, [filters?.per_page, breakdownPerPage, perPageOptionsList]);

    const [from, setFrom] = useState(filters?.from ?? '');
    const [to, setTo] = useState(filters?.to ?? '');
    const [selectedTruckIds, setSelectedTruckIds] = useState<number[]>(filters?.truck_ids ?? []);
    const [selectedMaintenanceTypes, setSelectedMaintenanceTypes] = useState<number[]>(filters?.maintenance_type_ids ?? []);
    const [selectedStatuses, setSelectedStatuses] = useState<string[]>(filters?.statuses ?? []);
    const [selectedProviders, setSelectedProviders] = useState<string[]>(filters?.service_providers ?? []);
    const [filtersOpen, setFiltersOpen] = useState(false);
    const [dateError, setDateError] = useState<string | null>(null);

    const activeFilterCount = useMemo(() => {
        let count = 0;

        if (from && from !== (filters?.from ?? '')) count += 1;
        if (to && to !== (filters?.to ?? '')) count += 1;
        if (selectedTruckIds.length > 0) count += 1;
        if (selectedMaintenanceTypes.length > 0) count += 1;
        if (selectedStatuses.length > 0) count += 1;
        if (selectedProviders.length > 0) count += 1;

        return count;
    }, [filters?.from, filters?.to, selectedMaintenanceTypes.length, selectedProviders.length, selectedStatuses.length, selectedTruckIds.length, from, to]);

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

    const buildAppliedParams = useCallback(
        (overrides: Record<string, unknown> = {}) => {
            const params: Record<string, unknown> = {};

            if (filters?.from) params.from = filters.from;
            if (filters?.to) params.to = filters.to;
            if (Array.isArray(filters?.truck_ids) && filters.truck_ids.length > 0) params.truck_ids = filters.truck_ids;
            if (Array.isArray(filters?.maintenance_type_ids) && filters.maintenance_type_ids.length > 0) params.maintenance_type_ids = filters.maintenance_type_ids;
            if (Array.isArray(filters?.statuses) && filters.statuses.length > 0) params.statuses = filters.statuses;
            if (Array.isArray(filters?.service_providers) && filters.service_providers.length > 0) params.service_providers = filters.service_providers;
            if (filters?.per_page) params.per_page = filters.per_page;

            return { ...params, ...overrides };
        },
        [filters],
    );

    const handleApplyFilters = () => {
        if (!validateDateRange(from, to)) {
            setFiltersOpen(true);

            return;
        }

        setFiltersOpen(false);

        const params: Record<string, unknown> = {};

        if (from) params.from = from;
        if (to) params.to = to;
        if (selectedTruckIds.length > 0) params.truck_ids = selectedTruckIds;
        if (selectedMaintenanceTypes.length > 0) params.maintenance_type_ids = selectedMaintenanceTypes;
        if (selectedStatuses.length > 0) params.statuses = selectedStatuses;
        if (selectedProviders.length > 0) params.service_providers = selectedProviders;
        params.per_page = perPage;
        params.page = 1;

        router.get('/reports/maintenance', params, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleReset = () => {
        const defaultPerPage = perPageOptionsList[0] ?? 25;
        setPerPage(defaultPerPage);
        setFrom(filters?.from ?? '');
        setTo(filters?.to ?? '');
        setSelectedTruckIds(filters?.truck_ids ?? []);
        setSelectedMaintenanceTypes(filters?.maintenance_type_ids ?? []);
        setSelectedStatuses(filters?.statuses ?? []);
        setSelectedProviders(filters?.service_providers ?? []);
        setFiltersOpen(false);
        setDateError(null);

        router.get('/reports/maintenance', { per_page: defaultPerPage }, { preserveState: false, preserveScroll: true });
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
        if (selectedTruckIds.length > 0) toParamsArray('truck_ids', selectedTruckIds, params);
        if (selectedMaintenanceTypes.length > 0) toParamsArray('maintenance_type_ids', selectedMaintenanceTypes, params);
        if (selectedStatuses.length > 0) toParamsArray('statuses', selectedStatuses, params);
        if (selectedProviders.length > 0) toParamsArray('service_providers', selectedProviders, params);

        const query = params.toString();
        const url = `/reports/maintenance/export/${format}${query ? `?${query}` : ''}`;
        window.location.href = url;
    };

    const handlePerPageChange = useCallback(
        (value: number) => {
            setPerPage(value);

            router.get(
                '/reports/maintenance',
                buildAppliedParams({ per_page: value, page: 1 }),
                { preserveState: true, preserveScroll: true },
            );
        },
        [buildAppliedParams],
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

    const handleStatusesChange = (ids: Array<number | string>) => {
        setSelectedStatuses(ids.map((value) => String(value)));
    };

    const handleProvidersChange = (ids: Array<number | string>) => {
        setSelectedProviders(ids.map((value) => String(value)));
    };

    const appliedFrom = filters?.from ?? '';
    const appliedTo = filters?.to ?? '';
    const appliedTruckCount = filters?.truck_ids?.length ?? 0;
    const appliedTypeCount = filters?.maintenance_type_ids?.length ?? 0;
    const appliedStatusCount = filters?.statuses?.length ?? 0;
    const appliedProviderCount = filters?.service_providers?.length ?? 0;

    const filterBadges = useMemo(
        () => [
            `From ${appliedFrom || '—'}`,
            `To ${appliedTo || '—'}`,
            appliedTruckCount > 0 ? `${appliedTruckCount} truck${appliedTruckCount > 1 ? 's' : ''}` : 'All trucks',
            appliedTypeCount > 0 ? `${appliedTypeCount} type${appliedTypeCount > 1 ? 's' : ''}` : 'All maintenance types',
            appliedStatusCount > 0 ? `${appliedStatusCount} status${appliedStatusCount > 1 ? 'es' : ''}` : 'All statuses',
            appliedProviderCount > 0 ? `${appliedProviderCount} provider${appliedProviderCount > 1 ? 's' : ''}` : 'All providers',
        ],
        [appliedFrom, appliedProviderCount, appliedStatusCount, appliedTo, appliedTruckCount, appliedTypeCount],
    );

    const summaryItems = useMemo<ReportSummaryItem[]>(
        () => [
            {
                label: 'Maintenance tasks',
                value: formatInteger(totals?.records ?? safeBreakdown.length ?? 0),
                icon: ClipboardList,
                tone: 'bg-sky-100 text-sky-600 dark:bg-sky-500/20 dark:text-sky-200',
            },
            {
                label: 'Completion rate',
                value: formatPercentage(summary?.completion_rate_pct ?? null),
                icon: CheckCircle2,
                tone: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-200',
            },
            {
                label: 'Overdue tasks',
                value: formatInteger(totals?.overdue ?? 0),
                icon: AlertTriangle,
                tone: 'bg-rose-100 text-rose-600 dark:bg-rose-500/20 dark:text-rose-200',
            },
            {
                label: 'Total spend',
                value: formatCurrency(totals?.total_cost ?? 0),
                icon: DollarSign,
                tone: 'bg-violet-100 text-violet-600 dark:bg-violet-500/20 dark:text-violet-200',
            },
            {
                label: 'Open cost',
                value: formatCurrency(totals?.open_cost ?? 0),
                icon: ShieldAlert,
                tone: 'bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-200',
            },
            {
                label: 'Upcoming (7d)',
                value: formatInteger(summary?.upcoming_within_seven_days ?? 0),
                icon: CalendarDays,
                tone: 'bg-cyan-100 text-cyan-600 dark:bg-cyan-500/20 dark:text-cyan-200',
            },
        ],
        [safeBreakdown.length, summary?.completion_rate_pct, summary?.upcoming_within_seven_days, totals?.open_cost, totals?.overdue, totals?.records, totals?.total_cost],
    );

    return (
        <ReportPageLayout
            title="Maintenance Operations"
            description="Track workshop throughput, completion performance, and supplier spend to keep assets road-ready. Adjust the window, focus on specific trucks or job types, and share consistent reporting with your teams."
            breadcrumbs={breadcrumbs}
            icon={<Wrench className="h-6 w-6" />}
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
                    truckOptions={truckSelectionOptions}
                    operationOptions={maintenanceTypeOptions}
                    statusOptions={statusSelectionOptions}
                    providerOptions={providerSelectionOptions}
                    selectedTrucks={selectedTruckIds}
                    selectedOperations={selectedMaintenanceTypes}
                    selectedStatuses={selectedStatuses}
                    selectedProviders={selectedProviders}
                    onTrucksChange={setSelectedTruckIds}
                    onOperationsChange={setSelectedMaintenanceTypes}
                    onStatusesChange={handleStatusesChange}
                    onProvidersChange={handleProvidersChange}
                    driverOptions={[]}
                    destinationOptions={[]}
                    operationFilterText={{
                        label: 'Maintenance types',
                        triggerLabelWhenAll: 'All types',
                        summaryLabelWhenAll: 'All types included',
                        heading: 'Maintenance types',
                        searchPlaceholder: 'Search type...',
                        emptyMessage: 'No maintenance types found.',
                        icon: Wrench,
                    }}
                    statusFilterText={{
                        label: 'Statuses',
                        triggerLabelWhenAll: 'All statuses',
                        summaryLabelWhenAll: 'All statuses included',
                        heading: 'Work order status',
                        searchPlaceholder: 'Search status...',
                        emptyMessage: 'No statuses found.',
                    }}
                    providerFilterText={{
                        label: 'Service providers',
                        triggerLabelWhenAll: 'All providers',
                        summaryLabelWhenAll: 'All providers included',
                        heading: 'Service providers',
                        searchPlaceholder: 'Search provider...',
                                        emptyMessage: 'No providers found.',
                                    }}
                                    showDriverFilter={false}
                                    showDestinationFilter={false}
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

                    <ReportMaintenanceTable
                        rows={safeBreakdown}
                        totals={totals}
                        filterBadges={filterBadges}
                        paginatorMeta={breakdownPaginatorMeta}
                        paginationLinks={breakdownPaginationLinks}
                        perPageOptions={perPageOptionsList}
                        perPage={perPage}
                        onPerPageChange={handlePerPageChange}
                    />

                    <section className="grid gap-6 xl:grid-cols-3">
                        <Card className="border border-slate-200 bg-white/95 shadow-sm dark:border-slate-800/70 dark:bg-slate-900/70">
                            <CardHeader>
                                <CardTitle className="text-base font-semibold text-slate-900 dark:text-slate-50">Highlights</CardTitle>
                                <CardDescription className="text-sm">Top insights from the current selection.</CardDescription>
                            </CardHeader>
                            <CardContent className="grid gap-4 text-sm">
                                <div className="space-y-2">
                                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Highest spend trucks</p>
                                    {highlightData.highest_cost_trucks.length === 0 && (
                                        <p className="text-muted-foreground">No spend recorded in this range.</p>
                                    )}
                                    {highlightData.highest_cost_trucks.map((truck) => (
                                        <div key={truck.truck_id} className="flex items-center justify-between rounded-lg border border-slate-200/80 px-3 py-2 dark:border-slate-800/70">
                                            <div>
                                                <p className="font-semibold text-slate-900 dark:text-slate-100">{truck.plate}</p>
                                                <p className="text-xs text-muted-foreground">{formatCurrency(truck.total_cost)}</p>
                                            </div>
                                            <Wrench className="h-4 w-4 text-slate-500" />
                                        </div>
                                    ))}
                                </div>
                                <div className="space-y-2">
                                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Most overdue</p>
                                    {highlightData.most_overdue_trucks.length === 0 && (
                                        <p className="text-muted-foreground">No overdue maintenance detected.</p>
                                    )}
                                    {highlightData.most_overdue_trucks.map((truck) => (
                                        <div key={truck.truck_id} className="flex items-center justify-between rounded-lg border border-slate-200/80 px-3 py-2 dark:border-slate-800/70">
                                            <div>
                                                <p className="font-semibold text-slate-900 dark:text-slate-100">{truck.plate}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {formatInteger(truck.overdue)} overdue •{' '}
                                                    {truck.max_overdue_days === null
                                                        ? '—'
                                                        : `${formatInteger(truck.max_overdue_days)} days`}
                                                </p>
                                            </div>
                                            <ShieldAlert className="h-4 w-4 text-rose-500" />
                                        </div>
                                    ))}
                                </div>
                                <div className="space-y-2">
                                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Costliest job types</p>
                                    {highlightData.costliest_types.length === 0 && (
                                        <p className="text-muted-foreground">No maintenance types found.</p>
                                    )}
                                    {highlightData.costliest_types.map((type) => (
                                        <div key={type.maintenance_type_id} className="flex items-center justify-between rounded-lg border border-slate-200/80 px-3 py-2 dark:border-slate-800/70">
                                            <div>
                                                <p className="font-semibold text-slate-900 dark:text-slate-100">{type.name}</p>
                                                <p className="text-xs text-muted-foreground">{formatCurrency(type.total_cost)}</p>
                                            </div>
                                            <DollarSign className="h-4 w-4 text-emerald-500" />
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border border-slate-200 bg-white/95 shadow-sm dark:border-slate-800/70 dark:bg-slate-900/70">
                            <CardHeader>
                                <CardTitle className="text-base font-semibold text-slate-900 dark:text-slate-50">Upcoming work orders</CardTitle>
                                <CardDescription className="text-sm">Scheduled tasks within the next 30 days.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-3 text-sm">
                                {safeUpcoming.length === 0 && <p className="text-muted-foreground">No upcoming maintenance within the next 30 days.</p>}
                                {safeUpcoming.map((item) => (
                                    <div key={item.id} className="flex flex-col gap-1 rounded-lg border border-slate-200/80 px-3 py-2 dark:border-slate-800/70">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{item.scheduled_date ?? 'TBD'}</span>
                                            {item.days_until !== null && (
                                                <Badge variant="outline" className="text-xs">
                                                    {item.days_until} days
                                                </Badge>
                                            )}
                                        </div>
                                        <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                                            {item.truck?.plate ?? 'Unassigned truck'}
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                            {item.maintenance_type?.name ?? 'General maintenance'}
                                            {item.service_provider ? ` • ${item.service_provider}` : ''}
                                        </div>
                                        <div className="text-xs font-medium text-slate-600 dark:text-slate-300">
                                            {formatOptionalCurrency(item.estimated_cost)}
                                        </div>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>

                        <Card className="border border-slate-200 bg-white/95 shadow-sm dark:border-slate-800/70 dark:bg-slate-900/70">
                            <CardHeader>
                                <CardTitle className="text-base font-semibold text-slate-900 dark:text-slate-50">Monthly trend</CardTitle>
                                <CardDescription className="text-sm">Maintenance volume and spend per month.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-3 text-sm">
                                {safeTrend.length === 0 && <p className="text-muted-foreground">No trend data for the selected filters.</p>}
                                {safeTrend.map((row) => (
                                    <div key={row.period} className="flex flex-col gap-1 rounded-lg border border-slate-200/80 px-3 py-2 dark:border-slate-800/70">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{row.period}</span>
                                            <Badge variant="outline" className="text-xs">
                                                {formatInteger(row.records)} tasks
                                            </Badge>
                                        </div>
                                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                                            <span>Completed</span>
                                            <span className="font-semibold text-slate-900 dark:text-slate-100">{formatInteger(row.completed)}</span>
                                        </div>
                                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                                            <span>Cost</span>
                                            <span className="font-semibold text-slate-900 dark:text-slate-100">{formatCurrency(row.total_cost)}</span>
                                        </div>
                                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                                            <span>Avg cost / task</span>
                                            <span className="font-semibold text-slate-900 dark:text-slate-100">{formatOptionalCurrency(row.average_cost_per_record)}</span>
                                        </div>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    </section>

                    <section className="grid gap-6">
                        <Card className="border border-slate-200 bg-white/95 shadow-sm dark:border-slate-800/70 dark:bg-slate-900/70">
                            <CardHeader>
                                <CardTitle className="text-lg font-semibold text-slate-900 dark:text-slate-50">Maintenance type breakdown</CardTitle>
                                <CardDescription className="text-sm">Frequency and spend per maintenance type.</CardDescription>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="max-h-[50vh] overflow-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="sticky top-0 z-10 bg-white/95 backdrop-blur dark:bg-slate-900/80">
                                                <TableHead>Type</TableHead>
                                                <TableHead>Category</TableHead>
                                                <TableHead className="text-right">Tasks</TableHead>
                                                <TableHead className="text-right">Completed</TableHead>
                                                <TableHead className="text-right">Overdue</TableHead>
                                                <TableHead className="text-right">Completion %</TableHead>
                                                <TableHead className="text-right">Total cost</TableHead>
                                                <TableHead className="text-right">Avg cost</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {safeTypeBreakdown.length === 0 && (
                                                <TableRow>
                                                    <TableCell colSpan={8} className="py-8 text-center text-muted-foreground">
                                                        No maintenance types found for the selected filters.
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                            {safeTypeBreakdown.map((type) => (
                                                <TableRow key={type.maintenance_type_id}>
                                                    <TableCell className="font-semibold text-slate-900 dark:text-slate-100">{type.name}</TableCell>
                                                    <TableCell className="capitalize text-muted-foreground">{type.category ?? '—'}</TableCell>
                                                    <TableCell className="text-right font-medium">{formatInteger(type.records)}</TableCell>
                                                    <TableCell className="text-right">{formatInteger(type.completed)}</TableCell>
                                                    <TableCell className="text-right">{formatInteger(type.overdue)}</TableCell>
                                                    <TableCell className="text-right">{formatPercentage(type.completion_rate_pct ?? null)}</TableCell>
                                                    <TableCell className="text-right">{formatCurrency(type.total_cost)}</TableCell>
                                                    <TableCell className="text-right">{formatOptionalCurrency(type.average_cost)}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </CardContent>
                        </Card>
                    </section>
            </div>
        </ReportPageLayout>
    );
}



