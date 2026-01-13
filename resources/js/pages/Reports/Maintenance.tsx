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
import { useTranslation } from 'react-i18next';

type QueryParamValue = string | number | boolean | null | undefined | Array<string | number | boolean>;

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

const formatOptionalCurrency = (value: number | null, fallback: string): string => {
    if (value === null || Number.isNaN(value)) {
        return fallback;
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
    const { t } = useTranslation();
    const { hasPermission } = usePermissions();
    const canExport = hasPermission('reports.maintenance.export');
    const notAvailable = t('maintenanceReport.fallbacks.notAvailable');

    const breadcrumbs: BreadcrumbItem[] = useMemo(
        () => [
            { title: t('maintenanceReport.breadcrumbs.reports'), href: '/reports/maintenance' },
            { title: t('maintenanceReport.breadcrumbs.maintenance'), href: '/reports/maintenance' },
        ],
        [t],
    );

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
                    setDateError(t('maintenanceReport.filters.dateError'));

                    return false;
                }
            }

            setDateError(null);

            return true;
        },
        [t],
    );

    const buildAppliedParams = useCallback(
        (overrides: Record<string, QueryParamValue> = {}) => {
            const params: Record<string, QueryParamValue> = {};

            if (filters?.from) params.from = filters.from;
            if (filters?.to) params.to = filters.to;
            if (Array.isArray(filters?.truck_ids) && filters.truck_ids.length > 0) params.truck_ids = filters.truck_ids;
            if (Array.isArray(filters?.maintenance_type_ids) && filters.maintenance_type_ids.length > 0) params.maintenance_type_ids = filters.maintenance_type_ids;
            if (Array.isArray(filters?.statuses) && filters.statuses.length > 0) params.statuses = filters.statuses;
            if (Array.isArray(filters?.service_providers) && filters.service_providers.length > 0) params.service_providers = filters.service_providers;
            if (typeof filters?.per_page === 'number') params.per_page = filters.per_page;

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

        const params: Record<string, QueryParamValue> = {};

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

        const resetParams: Record<string, QueryParamValue> = { per_page: defaultPerPage };

        router.get('/reports/maintenance', resetParams, {
            preserveState: false,
            preserveScroll: true,
        });
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
            t('maintenanceReport.badges.from', { value: appliedFrom || notAvailable }),
            t('maintenanceReport.badges.to', { value: appliedTo || notAvailable }),
            appliedTruckCount > 0
                ? t(appliedTruckCount === 1 ? 'maintenanceReport.badges.truck' : 'maintenanceReport.badges.trucks', { count: appliedTruckCount })
                : t('maintenanceReport.badges.allTrucks'),
            appliedTypeCount > 0
                ? t(appliedTypeCount === 1 ? 'maintenanceReport.badges.type' : 'maintenanceReport.badges.types', { count: appliedTypeCount })
                : t('maintenanceReport.badges.allTypes'),
            appliedStatusCount > 0
                ? t(appliedStatusCount === 1 ? 'maintenanceReport.badges.status' : 'maintenanceReport.badges.statuses', { count: appliedStatusCount })
                : t('maintenanceReport.badges.allStatuses'),
            appliedProviderCount > 0
                ? t(appliedProviderCount === 1 ? 'maintenanceReport.badges.provider' : 'maintenanceReport.badges.providers', { count: appliedProviderCount })
                : t('maintenanceReport.badges.allProviders'),
        ],
        [appliedFrom, appliedProviderCount, appliedStatusCount, appliedTo, appliedTruckCount, appliedTypeCount, notAvailable, t],
    );

    const summaryItems = useMemo<ReportSummaryItem[]>(
        () => [
            {
                label: t('maintenanceReport.summary.tasks'),
                value: formatInteger(totals?.records ?? safeBreakdown.length ?? 0),
                icon: ClipboardList,
                tone: 'bg-sky-100 text-sky-600 dark:bg-sky-500/20 dark:text-sky-200',
            },
            {
                label: t('maintenanceReport.summary.completionRate'),
                value: formatPercentage(summary?.completion_rate_pct ?? null),
                icon: CheckCircle2,
                tone: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-200',
            },
            {
                label: t('maintenanceReport.summary.overdue'),
                value: formatInteger(totals?.overdue ?? 0),
                icon: AlertTriangle,
                tone: 'bg-rose-100 text-rose-600 dark:bg-rose-500/20 dark:text-rose-200',
            },
            {
                label: t('maintenanceReport.summary.totalSpend'),
                value: formatCurrency(totals?.total_cost ?? 0),
                icon: DollarSign,
                tone: 'bg-violet-100 text-violet-600 dark:bg-violet-500/20 dark:text-violet-200',
            },
            {
                label: t('maintenanceReport.summary.openCost'),
                value: formatCurrency(totals?.open_cost ?? 0),
                icon: ShieldAlert,
                tone: 'bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-200',
            },
            {
                label: t('maintenanceReport.summary.upcoming'),
                value: formatInteger(summary?.upcoming_within_seven_days ?? 0),
                icon: CalendarDays,
                tone: 'bg-cyan-100 text-cyan-600 dark:bg-cyan-500/20 dark:text-cyan-200',
            },
        ],
        [safeBreakdown.length, summary?.completion_rate_pct, summary?.upcoming_within_seven_days, t, totals?.open_cost, totals?.overdue, totals?.records, totals?.total_cost],
    );

    return (
        <ReportPageLayout
            title={t('maintenanceReport.title')}
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
                        label: t('maintenanceReport.filters.types.label'),
                        triggerLabelWhenAll: t('maintenanceReport.filters.types.triggerAll'),
                        summaryLabelWhenAll: t('maintenanceReport.filters.types.summaryAll'),
                        heading: t('maintenanceReport.filters.types.heading'),
                        searchPlaceholder: t('maintenanceReport.filters.types.searchPlaceholder'),
                        emptyMessage: t('maintenanceReport.filters.types.empty'),
                        icon: Wrench,
                    }}
                    statusFilterText={{
                        label: t('maintenanceReport.filters.statuses.label'),
                        triggerLabelWhenAll: t('maintenanceReport.filters.statuses.triggerAll'),
                        summaryLabelWhenAll: t('maintenanceReport.filters.statuses.summaryAll'),
                        heading: t('maintenanceReport.filters.statuses.heading'),
                        searchPlaceholder: t('maintenanceReport.filters.statuses.searchPlaceholder'),
                        emptyMessage: t('maintenanceReport.filters.statuses.empty'),
                    }}
                    providerFilterText={{
                        label: t('maintenanceReport.filters.providers.label'),
                        triggerLabelWhenAll: t('maintenanceReport.filters.providers.triggerAll'),
                        summaryLabelWhenAll: t('maintenanceReport.filters.providers.summaryAll'),
                        heading: t('maintenanceReport.filters.providers.heading'),
                        searchPlaceholder: t('maintenanceReport.filters.providers.searchPlaceholder'),
                        emptyMessage: t('maintenanceReport.filters.providers.empty'),
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
                                <CardTitle className="text-base font-semibold text-slate-900 dark:text-slate-50">{t('maintenanceReport.highlights.title')}</CardTitle>
                                <CardDescription className="text-sm">{t('maintenanceReport.highlights.description')}</CardDescription>
                            </CardHeader>
                            <CardContent className="grid gap-4 text-sm">
                                <div className="space-y-2">
                                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t('maintenanceReport.highlights.highestSpend')}</p>
                                    {highlightData.highest_cost_trucks.length === 0 && (
                                        <p className="text-muted-foreground">{t('maintenanceReport.highlights.noSpend')}</p>
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
                                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t('maintenanceReport.highlights.mostOverdue')}</p>
                                    {highlightData.most_overdue_trucks.length === 0 && (
                                        <p className="text-muted-foreground">{t('maintenanceReport.highlights.noOverdue')}</p>
                                    )}
                                    {highlightData.most_overdue_trucks.map((truck) => (
                                        <div key={truck.truck_id} className="flex items-center justify-between rounded-lg border border-slate-200/80 px-3 py-2 dark:border-slate-800/70">
                                            <div>
                                                <p className="font-semibold text-slate-900 dark:text-slate-100">{truck.plate}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {t('maintenanceReport.highlights.overdueValue', { value: formatInteger(truck.overdue) })} •{' '}
                                                    {truck.max_overdue_days === null
                                                        ? notAvailable
                                                        : t('maintenanceReport.highlights.daysValue', { value: formatInteger(truck.max_overdue_days) })}
                                                </p>
                                            </div>
                                            <ShieldAlert className="h-4 w-4 text-rose-500" />
                                        </div>
                                    ))}
                                </div>
                                <div className="space-y-2">
                                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t('maintenanceReport.highlights.costliestTypes')}</p>
                                    {highlightData.costliest_types.length === 0 && (
                                        <p className="text-muted-foreground">{t('maintenanceReport.highlights.noTypes')}</p>
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
                                <CardTitle className="text-base font-semibold text-slate-900 dark:text-slate-50">{t('maintenanceReport.upcoming.title')}</CardTitle>
                                <CardDescription className="text-sm">{t('maintenanceReport.upcoming.description')}</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-3 text-sm">
                                {safeUpcoming.length === 0 && <p className="text-muted-foreground">{t('maintenanceReport.upcoming.empty')}</p>}
                                {safeUpcoming.map((item) => (
                                    <div key={item.id} className="flex flex-col gap-1 rounded-lg border border-slate-200/80 px-3 py-2 dark:border-slate-800/70">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                                {item.scheduled_date ?? t('maintenanceReport.upcoming.tbd')}
                                            </span>
                                            {item.days_until !== null && (
                                                <Badge variant="outline" className="text-xs">
                                                    {t('maintenanceReport.upcoming.days', { value: formatInteger(item.days_until) })}
                                                </Badge>
                                            )}
                                        </div>
                                        <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                                            {item.truck?.plate ?? t('maintenanceReport.upcoming.unassignedTruck')}
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                            {item.maintenance_type?.name ?? t('maintenanceReport.upcoming.generalMaintenance')}
                                            {item.service_provider ? ` • ${item.service_provider}` : ''}
                                        </div>
                                        <div className="text-xs font-medium text-slate-600 dark:text-slate-300">
                                            {formatOptionalCurrency(item.estimated_cost, notAvailable)}
                                        </div>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>

                        <Card className="border border-slate-200 bg-white/95 shadow-sm dark:border-slate-800/70 dark:bg-slate-900/70">
                            <CardHeader>
                                <CardTitle className="text-base font-semibold text-slate-900 dark:text-slate-50">{t('maintenanceReport.trend.title')}</CardTitle>
                                <CardDescription className="text-sm">{t('maintenanceReport.trend.description')}</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-3 text-sm">
                                {safeTrend.length === 0 && <p className="text-muted-foreground">{t('maintenanceReport.trend.empty')}</p>}
                                {safeTrend.map((row) => (
                                    <div key={row.period} className="flex flex-col gap-1 rounded-lg border border-slate-200/80 px-3 py-2 dark:border-slate-800/70">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{row.period}</span>
                                            <Badge variant="outline" className="text-xs">
                                                {t('maintenanceReport.trend.tasks', { value: formatInteger(row.records) })}
                                            </Badge>
                                        </div>
                                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                                            <span>{t('maintenanceReport.trend.completed')}</span>
                                            <span className="font-semibold text-slate-900 dark:text-slate-100">{formatInteger(row.completed)}</span>
                                        </div>
                                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                                            <span>{t('maintenanceReport.trend.cost')}</span>
                                            <span className="font-semibold text-slate-900 dark:text-slate-100">{formatCurrency(row.total_cost)}</span>
                                        </div>
                                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                                            <span>{t('maintenanceReport.trend.avgCost')}</span>
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
                                <CardTitle className="text-lg font-semibold text-slate-900 dark:text-slate-50">{t('maintenanceReport.typeBreakdown.title')}</CardTitle>
                                <CardDescription className="text-sm">{t('maintenanceReport.typeBreakdown.description')}</CardDescription>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="max-h-[50vh] overflow-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="sticky top-0 z-10 bg-white/95 backdrop-blur dark:bg-slate-900/80">
                                                <TableHead>{t('maintenanceReport.table.type')}</TableHead>
                                                <TableHead>{t('maintenanceReport.table.category')}</TableHead>
                                                <TableHead className="text-right">{t('maintenanceReport.table.tasks')}</TableHead>
                                                <TableHead className="text-right">{t('maintenanceReport.table.completed')}</TableHead>
                                                <TableHead className="text-right">{t('maintenanceReport.table.overdue')}</TableHead>
                                                <TableHead className="text-right">{t('maintenanceReport.table.completion')}</TableHead>
                                                <TableHead className="text-right">{t('maintenanceReport.table.totalCost')}</TableHead>
                                                <TableHead className="text-right">{t('maintenanceReport.table.avgCost')}</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {safeTypeBreakdown.length === 0 && (
                                                <TableRow>
                                                    <TableCell colSpan={8} className="py-8 text-center text-muted-foreground">
                                                        {t('maintenanceReport.typeBreakdown.empty')}
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                            {safeTypeBreakdown.map((type) => (
                                                <TableRow key={type.maintenance_type_id}>
                                                    <TableCell className="font-semibold text-slate-900 dark:text-slate-100">{type.name}</TableCell>
                                                    <TableCell className="capitalize text-muted-foreground">{type.category ?? notAvailable}</TableCell>
                                                    <TableCell className="text-right font-medium">{formatInteger(type.records)}</TableCell>
                                                    <TableCell className="text-right">{formatInteger(type.completed)}</TableCell>
                                                    <TableCell className="text-right">{formatInteger(type.overdue)}</TableCell>
                                                    <TableCell className="text-right">{formatPercentage(type.completion_rate_pct ?? null)}</TableCell>
                                                    <TableCell className="text-right">{formatCurrency(type.total_cost)}</TableCell>
                                                    <TableCell className="text-right">{formatOptionalCurrency(type.average_cost, notAvailable)}</TableCell>
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


