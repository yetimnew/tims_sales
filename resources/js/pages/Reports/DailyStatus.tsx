import { useCallback, useMemo, useState } from 'react';
import { router } from '@inertiajs/react';
import type { BreadcrumbItem } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ReportFiltersDialog } from '@/components/reports/report-filters-dialog';
import type { ReportSelectionOption } from '@/components/reports/types';
import { formatInteger, formatPercentage } from '@/components/reports/formatters';
import { Filter, RefreshCcw, Truck, Users } from 'lucide-react';
import { ListingPaginationFooter } from '@/components/listing/pagination-footer';
import { usePermissions } from '@/hooks/use-permissions';
import { REPORT_DATE_RANGE_DESCRIPTION, useReportDateRange } from '@/components/reports/use-report-date-range';
import { ReportPageLayout } from '@/components/report/report-page-layout';

type QueryParamValue = string | number | boolean | null | undefined | Array<string | number | boolean>;

interface StatusSummaryRow {
    status_id: number | null;
    status_name: string;
    count: number;
    share: number;
}

interface DailyEntry {
    id: number;
    truck_id: number;
    plate: string;
    status_id: number | null;
    status_name: string;
    status_date: string | null;
    registered_at: string | null;
    changed_by: string | null;
    notes: string | null;
}

interface DailyDayRow {
    date: string;
    total_updates: number;
    unique_trucks: number;
    latest_update: string | null;
    status_breakdown: StatusSummaryRow[];
    entries: DailyEntry[];
}

interface DailyPaginator {
    data: DailyDayRow[];
    current_page: number;
    first_page_url: string;
    from: number | null;
    last_page: number;
    last_page_url: string;
    links: Array<{ url: string | null; label: string; active: boolean }>;
    next_page_url: string | null;
    path: string;
    per_page: number;
    prev_page_url: string | null;
    to: number | null;
    total: number;
}

interface SummaryPayload {
    total_updates: number;
    unique_trucks: number;
    unique_statuses: number;
    latest_update: string | null;
    days_with_activity: number;
    average_updates_per_day: number;
}

interface FiltersPayload {
    from: string;
    to: string;
    truck_ids: number[];
    status_ids: number[];
    per_page: number;
    page: number;
}

interface OptionTruck {
    id: number;
    plate: string;
    status: string | null;
}

interface OptionStatus {
    id: number;
    name: string;
}

interface DailyStatusProps {
    filters: FiltersPayload;
    summary: SummaryPayload;
    statusSummary: StatusSummaryRow[];
    daily: DailyPaginator;
    options: {
        trucks: OptionTruck[];
        statuses: OptionStatus[];
    };
    meta: {
        resolved_from: string;
        resolved_to: string;
        total_days: number;
        truncated: boolean;
    };
    can: {
        export: boolean;
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Reports', href: '/reports/daily-status' },
    { title: 'Daily Status', href: '/reports/daily-status' },
];

const formatDateTime = (value: string | null): string => {
    if (!value) {
        return '—';
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return date.toLocaleString();
};

const formatDate = (value: string | null): string => {
    if (!value) {
        return '—';
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return date.toLocaleDateString();
};

const toSelectionOptions = <T extends { id: number }>(items: T[], map: (item: T) => ReportSelectionOption): ReportSelectionOption[] =>
    items.map(map);

const appendArrayParam = (params: URLSearchParams, key: string, values: number[] | string[]) => {
    values.forEach((value) => params.append(`${key}[]`, String(value)));
};

export default function DailyStatus({ filters, summary, statusSummary, daily, options, meta, can }: DailyStatusProps) {
    const { hasPermission } = usePermissions();
    const canExport = can?.export && hasPermission('reports.daily-status.export');

    const nullableTruckOptions = Array.isArray(options?.trucks) ? options.trucks : [];
    const nullableStatusOptions = Array.isArray(options?.statuses) ? options.statuses : [];

    const truckOptions = useMemo(
        () =>
            toSelectionOptions(nullableTruckOptions, (truck) => ({
                id: truck.id,
                label: truck.plate ?? `Truck #${truck.id}`,
                badge: truck.status ?? undefined,
            })),
        [nullableTruckOptions],
    );

    const statusOptions = useMemo(
        () =>
            toSelectionOptions(nullableStatusOptions, (status) => ({
                id: status.id,
                label: status.name,
            })),
        [nullableStatusOptions],
    );

    const { from, to, dateError, handleDateChange, validateDateRange, resetDateRange } = useReportDateRange(filters?.from ?? '', filters?.to ?? '');
    const [perPage, setPerPage] = useState<number>(filters?.per_page ?? 7);
    const [selectedTrucks, setSelectedTrucks] = useState<number[]>(filters?.truck_ids ?? []);
    const [selectedStatuses, setSelectedStatuses] = useState<number[]>(filters?.status_ids ?? []);
    const [filtersOpen, setFiltersOpen] = useState(false);

    const activeFilterCount = useMemo(() => {
        let count = 0;

        if (from !== (filters?.from ?? '')) count += 1;
        if (to !== (filters?.to ?? '')) count += 1;
        if (perPage !== (filters?.per_page ?? 7)) count += 1;
        if (selectedTrucks.length > 0) count += 1;
        if (selectedStatuses.length > 0) count += 1;

        return count;
    }, [filters?.from, filters?.to, filters?.per_page, from, to, perPage, selectedTrucks.length, selectedStatuses.length]);

    const handleApply = useCallback(() => {
        if (!validateDateRange(from, to)) {
            setFiltersOpen(true);

            return;
        }

        const params: Record<string, QueryParamValue> = {};

        if (from) params.from = from;
        if (to) params.to = to;
        if (perPage) params.per_page = perPage;

        if (selectedTrucks.length > 0) {
            params.truck_ids = selectedTrucks;
        }

        if (selectedStatuses.length > 0) {
            params.status_ids = selectedStatuses;
        }

        setFiltersOpen(false);

        router.get('/reports/daily-status', params, {
            preserveState: true,
            preserveScroll: true,
        });
    }, [from, to, perPage, selectedTrucks, selectedStatuses, validateDateRange]);

    const handleReset = useCallback(() => {
        resetDateRange(filters?.from ?? '', filters?.to ?? '');
        setPerPage(filters?.per_page ?? 7);
        setSelectedTrucks(filters?.truck_ids ?? []);
        setSelectedStatuses(filters?.status_ids ?? []);
        setFiltersOpen(false);

        router.get('/reports/daily-status', undefined, { preserveState: false, preserveScroll: true });
    }, [filters, resetDateRange]);

    const handleExport = useCallback(
        (format: 'csv' | 'xlsx' | 'pdf') => {
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
            if (perPage) params.set('per_page', String(perPage));

            if (selectedTrucks.length > 0) appendArrayParam(params, 'truck_ids', selectedTrucks);
            if (selectedStatuses.length > 0) appendArrayParam(params, 'status_ids', selectedStatuses);

            const query = params.toString();
            const url = `/reports/daily-status/export/${format}${query ? `?${query}` : ''}`;
            window.location.href = url;
        },
        [canExport, from, to, perPage, selectedTrucks, selectedStatuses, validateDateRange],
    );

    const dailyRows = Array.isArray(daily?.data) ? daily.data : [];
    const statusSummaryRows = Array.isArray(statusSummary) ? statusSummary : [];

    const filterBadges = useMemo(() => {
        const badges: string[] = [];

        badges.push(`From ${filters?.from ?? meta?.resolved_from ?? '—'}`);
        badges.push(`To ${filters?.to ?? meta?.resolved_to ?? '—'}`);
        badges.push(selectedTrucks.length > 0 ? `${selectedTrucks.length} truck${selectedTrucks.length > 1 ? 's' : ''}` : 'All trucks');
        badges.push(selectedStatuses.length > 0 ? `${selectedStatuses.length} status${selectedStatuses.length > 1 ? 'es' : ''}` : 'All statuses');

        return badges;
    }, [filters?.from, filters?.to, meta?.resolved_from, meta?.resolved_to, selectedTrucks.length, selectedStatuses.length]);

    const quickMetrics = useMemo(
        () => [
            { label: 'Total updates', value: formatInteger(summary?.total_updates ?? 0), icon: Users },
            { label: 'Unique trucks', value: formatInteger(summary?.unique_trucks ?? 0), icon: Truck },
            { label: 'Unique statuses', value: formatInteger(summary?.unique_statuses ?? 0), icon: Filter },
            {
                label: 'Updates per day',
                value: formatPercentage(summary?.average_updates_per_day ?? 0, { style: 'decimal', minimumFractionDigits: 0, maximumFractionDigits: 2 }),
                icon: RefreshCcw,
            },
        ],
        [summary],
    );

    const handlePerPageChange = (value: string) => {
        const next = Number(value);
        setPerPage(next);
        const params: Record<string, QueryParamValue> = {};

        if (from) params.from = from;
        if (to) params.to = to;
        if (next) params.per_page = next;
        if (selectedTrucks.length > 0) params.truck_ids = selectedTrucks;
        if (selectedStatuses.length > 0) params.status_ids = selectedStatuses;

        router.get('/reports/daily-status', params, { preserveState: true, preserveScroll: true });
    };

    const renderStatusSummary = () => (
        <Card className="border border-slate-200 bg-white/95 shadow-sm dark:border-slate-800/70 dark:bg-slate-900/70">
            <CardHeader className="space-y-3 border-b border-slate-200/60 pb-5 dark:border-slate-700/60">
                <div className="space-y-1">
                    <CardTitle className="text-lg font-semibold text-slate-900 dark:text-slate-50">Status distribution</CardTitle>
                    <CardDescription className="text-sm">Share of updates per status across the period.</CardDescription>
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
                                <TableHead className="whitespace-nowrap">Status</TableHead>
                                <TableHead className="whitespace-nowrap text-right">Updates</TableHead>
                                <TableHead className="whitespace-nowrap text-right">Share</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {statusSummaryRows.length > 0 ? (
                                statusSummaryRows.map((row) => (
                                    <TableRow key={`${row.status_id ?? 'null'}-${row.status_name}`} className="divide-x divide-slate-100 dark:divide-slate-800/50">
                                        <TableCell className="whitespace-nowrap font-medium text-slate-900 dark:text-slate-100">{row.status_name}</TableCell>
                                        <TableCell className="whitespace-nowrap text-right">{formatInteger(row.count)}</TableCell>
                                        <TableCell className="whitespace-nowrap text-right">
                                            <Badge variant="outline" className="rounded-full border-slate-200 px-2 py-0.5 text-[11px] font-semibold dark:border-slate-700">
                                                {formatPercentage(row.share)}
                                            </Badge>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={3} className="py-8 text-center text-sm text-muted-foreground">
                                        No status activity recorded for the selected filters.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );

    return (
        <ReportPageLayout
            title="Daily Status Report"
            description="Review daily operational statuses for selected trucks and periods. Compare status distribution, spot activity peaks, and export summaries for your teams."
            breadcrumbs={breadcrumbs}
            icon={<Filter className="h-6 w-6" />}
            filters={
                <ReportFiltersDialog
                    open={filtersOpen}
                    onOpenChange={setFiltersOpen}
                    activeFilterCount={activeFilterCount}
                    onReset={handleReset}
                    onApply={handleApply}
                    from={from}
                    to={to}
                    onDateChange={handleDateChange}
                    dateError={dateError}
                    limit={perPage}
                    onLimitChange={(value) => setPerPage(value)}
                    showLimit
                    limitLabel="Days per page"
                    limitDescription="Number of days to display per page."
                    truckOptions={truckOptions}
                    statusOptions={statusOptions}
                    selectedTrucks={selectedTrucks}
                    selectedStatuses={selectedStatuses}
                    onTrucksChange={setSelectedTrucks}
                    onStatusesChange={(ids) => setSelectedStatuses(ids.map((value) => Number(value)))}
                    dateRangeDescription={REPORT_DATE_RANGE_DESCRIPTION}
                />
            }
            summarySection={
                <section className="grid gap-4 lg:grid-cols-4">
                    {quickMetrics.map((metric) => (
                        <div key={metric.label} className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 shadow-sm dark:border-slate-800 dark:bg-slate-800/50">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-slate-600 dark:text-slate-300">{metric.label}</span>
                                <metric.icon className="h-4 w-4 text-slate-400" />
                            </div>
                            <p className="mt-2 text-2xl font-semibold text-slate-900 dark:text-slate-50">{metric.value}</p>
                        </div>
                    ))}
                </section>
            }
            onRefresh={handleReset}
            onExportPdf={canExport ? () => handleExport('pdf') : undefined}
            onExportExcel={canExport ? () => handleExport('xlsx') : undefined}
            onExportCsv={canExport ? () => handleExport('csv') : undefined}
            canExport={canExport}
            contentClassName="p-0"
        >
            <div className="space-y-6 p-6">
                {renderStatusSummary()}

                    <Card className="border border-slate-200 bg-white/95 shadow-sm dark:border-slate-800/70 dark:bg-slate-900/70">
                        <CardHeader className="space-y-3 border-b border-slate-200/60 pb-5 dark:border-slate-700/60">
                            <div className="space-y-1">
                                <CardTitle className="text-lg font-semibold text-slate-900 dark:text-slate-50">Daily breakdown</CardTitle>
                                <CardDescription className="text-sm">Latest status per truck for each day in the period.</CardDescription>
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
                            <div className="flex flex-col divide-y divide-slate-200 dark:divide-slate-800/60">
                                {dailyRows.length > 0 ? (
                                    dailyRows.map((day) => (
                                        <div key={day.date} className="space-y-3 p-6">
                                            <div className="flex flex-wrap items-center justify-between gap-3">
                                                <div>
                                                    <p className="text-lg font-semibold text-slate-900 dark:text-slate-50">{formatDate(day.date)}</p>
                                                    <p className="text-sm text-slate-500 dark:text-slate-400">
                                                        {formatInteger(day.total_updates)} update{day.total_updates === 1 ? '' : 's'} · {formatInteger(day.unique_trucks)} truck
                                                        {day.unique_trucks === 1 ? '' : 's'} · Latest update {formatDateTime(day.latest_update)}
                                                    </p>
                                                </div>
                                                <div className="flex flex-wrap gap-2">
                                                    {day.status_breakdown.map((status) => (
                                                        <Badge key={`${status.status_id ?? 'null'}-${status.status_name}`} variant="secondary" className="gap-1">
                                                            <span className="font-semibold">{status.status_name}</span>
                                                            <span className="text-xs text-slate-600 dark:text-slate-300">{formatInteger(status.count)}</span>
                                                        </Badge>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="overflow-x-auto">
                                                <Table>
                                                    <TableHeader className="bg-slate-50/60 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-900/60 dark:text-slate-400">
                                                        <TableRow className="divide-x divide-slate-200/40 dark:divide-slate-800/50">
                                                            <TableHead className="whitespace-nowrap">Truck</TableHead>
                                                            <TableHead className="whitespace-nowrap">Status</TableHead>
                                                            <TableHead className="whitespace-nowrap">Status date</TableHead>
                                                            <TableHead className="whitespace-nowrap">Recorded</TableHead>
                                                            <TableHead className="whitespace-nowrap">Changed by</TableHead>
                                                            <TableHead className="whitespace-nowrap">Notes</TableHead>
                                                        </TableRow>
                                                    </TableHeader>
                                                    <TableBody>
                                                        {day.entries.length > 0 ? (
                                                            day.entries.map((entry) => (
                                                                <TableRow key={entry.id} className="divide-x divide-slate-100 align-top dark:divide-slate-800/50">
                                                                    <TableCell className="whitespace-nowrap font-medium text-slate-900 dark:text-slate-100">{entry.plate}</TableCell>
                                                                    <TableCell className="whitespace-nowrap text-slate-700 dark:text-slate-300">{entry.status_name}</TableCell>
                                                                    <TableCell className="whitespace-nowrap text-sm text-slate-600 dark:text-slate-400">{formatDate(entry.status_date)}</TableCell>
                                                                    <TableCell className="whitespace-nowrap text-sm text-slate-600 dark:text-slate-400">{formatDateTime(entry.registered_at)}</TableCell>
                                                                    <TableCell className="whitespace-nowrap text-sm text-slate-600 dark:text-slate-400">{entry.changed_by ?? '—'}</TableCell>
                                                                    <TableCell className="max-w-[18rem] text-sm text-slate-600 dark:text-slate-300">
                                                                        {entry.notes ? <span className="line-clamp-2">{entry.notes}</span> : <span className="text-muted-foreground">—</span>}
                                                                    </TableCell>
                                                                </TableRow>
                                                            ))
                                                        ) : (
                                                            <TableRow>
                                                                <TableCell colSpan={6} className="py-6 text-center text-sm text-muted-foreground">
                                                                    No records on this day.
                                                                </TableCell>
                                                            </TableRow>
                                                        )}
                                                    </TableBody>
                                                </Table>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="py-16 text-center text-sm text-muted-foreground">No records found for the selected filters.</div>
                                )}
                            </div>
                        </CardContent>
                        <ListingPaginationFooter from={daily?.from} to={daily?.to} total={daily?.total} links={daily?.links ?? []} className="border-t border-slate-200/60"
                            extra={(
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button type="button" variant="outline" className="gap-2">
                                            Per page
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-32">
                                        {[7, 14, 21, 31].map((option) => (
                                            <DropdownMenuItem key={option} onSelect={() => handlePerPageChange(String(option))}>
                                                {option}
                                            </DropdownMenuItem>
                                        ))}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            )}
                        />
                    </Card>

                {meta?.truncated ? (
                    <div className="rounded-xl border border-amber-200/70 bg-amber-50/70 p-4 text-sm text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
                        The selected period exceeded the maximum supported window. The report has been truncated to the first {formatInteger(meta.total_days)} days.
                    </div>
                ) : null}
            </div>
        </ReportPageLayout>
    );
}
