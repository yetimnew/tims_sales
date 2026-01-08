import { useCallback, useMemo, useState } from 'react';
import { router } from '@inertiajs/react';
import { type BreadcrumbItem } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ReportFiltersDialog } from '@/components/reports/report-filters-dialog';
import { ReportSummaryGrid, type ReportSummaryItem } from '@/components/reports/report-summary-grid';
import type { ReportSelectionOption } from '@/components/reports/types';
import { formatInteger, formatPercentage } from '@/components/reports/formatters';
import { cn } from '@/lib/utils';
import { CalendarClock, Medal, PieChart, Truck } from 'lucide-react';
import { ReportPageLayout } from '@/components/report/report-page-layout';

type QueryParamValue = string | number | boolean | null | undefined | Array<string | number | boolean>;

interface SummaryRow {
    status_id: number;
    status_name: string;
    count: number;
    share: number;
}

interface LatestRow {
    id: number;
    truck_id: number;
    plate: string;
    status_id: number | null;
    status_name: string;
    status_date: string | null;
    registerddate: string | null;
    changed_by: string | null;
    notes: string | null;
}

interface Metrics {
    vehicles_tracked: number;
    unique_statuses: number;
    top_status: {
        status_name: string;
        count: number;
        share: number;
    } | null;
    latest_update: string | null;
}

interface StatusOption {
    id: number;
    name: string;
}

interface Filters {
    date?: string | null;
    status_ids?: number[];
}

interface PerformanceByStatusOptions {
    statuses: StatusOption[];
}

interface PerformanceByStatusProps {
    filters: Filters;
    summary: SummaryRow[];
    latest: LatestRow[];
    metrics: Metrics;
    options: PerformanceByStatusOptions;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Reports', href: '/reports/performance-by-status' },
    { title: 'Performance by Status', href: '/reports/performance-by-status' },
];

const formatDateValue = (value: string | null): Date | null => {
    if (!value) {
        return null;
    }

    const parsed = new Date(value);

    if (!Number.isNaN(parsed.getTime())) {
        return parsed;
    }

    const fallback = new Date(`${value}T00:00:00`);

    return Number.isNaN(fallback.getTime()) ? null : fallback;
};

export default function PerformanceByStatus({ filters, summary = [], latest = [], metrics, options }: PerformanceByStatusProps) {
    const summaryRows = Array.isArray(summary) ? summary : [];
    const latestRows = Array.isArray(latest) ? latest : [];
    const statusOptionsSource = Array.isArray(options?.statuses) ? options.statuses : [];

    const statusSelectionOptions = useMemo<ReportSelectionOption[]>(
        () =>
            statusOptionsSource.map((status) => ({
                id: status.id,
                label: status.name,
            })),
        [statusOptionsSource],
    );

    const [filtersOpen, setFiltersOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState(filters?.date ?? '');
    const [selectedStatuses, setSelectedStatuses] = useState<number[]>(filters?.status_ids ?? []);

    const activeFilterCount = useMemo(() => {
        let count = 0;

        if ((filters?.date ?? '') !== selectedDate && selectedDate !== '') {
            count += 1;
        }

        if (selectedStatuses.length > 0) {
            count += 1;
        }

        return count;
    }, [filters?.date, selectedDate, selectedStatuses.length]);

    const dateFormatter = useMemo(
        () =>
            new Intl.DateTimeFormat(undefined, {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
            }),
        [],
    );

    const dateTimeFormatter = useMemo(
        () =>
            new Intl.DateTimeFormat(undefined, {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
            }),
        [],
    );

    const formatDate = useCallback(
        (value: string | null) => {
            const parsed = formatDateValue(value);

            return parsed ? dateFormatter.format(parsed) : '—';
        },
        [dateFormatter],
    );

    const formatDateTime = useCallback(
        (value: string | null) => {
            const parsed = formatDateValue(value);

            return parsed ? dateTimeFormatter.format(parsed) : '—';
        },
        [dateTimeFormatter],
    );

    const topStatusDisplay = metrics?.top_status
        ? `${metrics.top_status.status_name} · ${formatInteger(metrics.top_status.count)} vehicles (${formatPercentage(metrics.top_status.share)})`
        : 'No dominant status yet';

    const latestUpdateDisplay = metrics?.latest_update ? formatDateTime(metrics.latest_update) : 'No recent updates';

    const summaryItems = useMemo<ReportSummaryItem[]>(
        () => [
            {
                label: 'Vehicles tracked',
                value: formatInteger(metrics?.vehicles_tracked ?? latestRows.length),
                icon: Truck,
                tone: 'bg-sky-100 text-sky-600 dark:bg-sky-500/20 dark:text-sky-200',
            },
            {
                label: 'Unique statuses',
                value: formatInteger(metrics?.unique_statuses ?? summaryRows.length),
                icon: PieChart,
                tone: 'bg-violet-100 text-violet-600 dark:bg-violet-500/20 dark:text-violet-200',
            },
            {
                label: 'Top status',
                value: topStatusDisplay,
                icon: Medal,
                tone: 'bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-200',
            },
            {
                label: 'Latest update',
                value: latestUpdateDisplay,
                icon: CalendarClock,
                tone: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-200',
            },
        ],
        [latestRows.length, latestUpdateDisplay, metrics, summaryRows.length, topStatusDisplay],
    );

    const appliedDate = filters?.date ?? '';
    const appliedStatusCount = filters?.status_ids?.length ?? 0;

    const filterBadges = useMemo(
        () => [
            `Date ${formatDate(appliedDate || null)}`,
            appliedStatusCount > 0 ? `${appliedStatusCount} status${appliedStatusCount > 1 ? 'es' : ''}` : 'All statuses',
        ],
        [appliedDate, appliedStatusCount, formatDate],
    );

    const handleApplyFilters = () => {
        const params: Record<string, QueryParamValue> = {};

        if (selectedDate) params.date = selectedDate;
        if (selectedStatuses.length > 0) params.status_ids = selectedStatuses;

        setFiltersOpen(false);

        router.get('/reports/performance-by-status', params, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleResetFilters = () => {
        setSelectedDate(filters?.date ?? '');
        setSelectedStatuses(filters?.status_ids ?? []);
        setFiltersOpen(false);

        router.get('/reports/performance-by-status', {}, { preserveState: false, preserveScroll: true });
    };

    const handleStatusesChange = (ids: Array<number | string>) => {
        setSelectedStatuses(ids.map((value) => Number(value)));
    };

    return (
        <ReportPageLayout
            title="Performance by Status"
            breadcrumbs={breadcrumbs}
            icon={<PieChart className="h-6 w-6" />}
            filters={
                <ReportFiltersDialog
                    open={filtersOpen}
                    onOpenChange={setFiltersOpen}
                    activeFilterCount={activeFilterCount}
                    onReset={handleResetFilters}
                    onApply={handleApplyFilters}
                    showDateRange={false}
                    showSingleDate
                    singleDate={selectedDate}
                    onSingleDateChange={setSelectedDate}
                    singleDateLabel="Reporting date"
                    singleDateDescription="Choose a single day to review status activity."
                    statusOptions={statusSelectionOptions}
                    selectedStatuses={selectedStatuses}
                    onStatusesChange={handleStatusesChange}
                    statusFilterText={{ label: 'Statuses', heading: 'Statuses', triggerLabelWhenAll: 'All statuses' }}
                />
            }
            summarySection={<ReportSummaryGrid items={summaryItems} />}
            onRefresh={handleResetFilters}
            canExport={false}
            contentClassName="p-0"
        >
            <div className="space-y-6 p-6">
                {/* Status Distribution Table */}
                <div className="space-y-4">
                    <div className="space-y-2">
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50">Status distribution</h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400">Count of vehicles per status with relative share.</p>
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
                                    <TableHead className="whitespace-nowrap">Status</TableHead>
                                    <TableHead className="whitespace-nowrap text-right">Vehicles</TableHead>
                                    <TableHead className="whitespace-nowrap text-right">Share</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {summaryRows.length > 0 ? (
                                    summaryRows.map((row) => {
                                        const isTopStatus = metrics?.top_status?.status_name !== undefined && metrics.top_status?.status_name === row.status_name;

                                        return (
                                            <TableRow
                                                key={row.status_id ?? row.status_name}
                                                className={cn(
                                                    'divide-x divide-slate-100 hover:bg-slate-50/70 dark:divide-slate-800/50 dark:hover:bg-slate-900/50',
                                                    isTopStatus ? 'bg-emerald-50/60 dark:bg-emerald-500/10' : undefined,
                                                )}
                                            >
                                                <TableCell className="whitespace-nowrap font-medium text-slate-900 dark:text-slate-100">
                                                    <div className="flex flex-col">
                                                        <span>{row.status_name}</span>
                                                        {isTopStatus ? <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-300">Top status</span> : null}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="whitespace-nowrap text-right">{formatInteger(row.count)}</TableCell>
                                                <TableCell className="whitespace-nowrap text-right">
                                                    <Badge variant="outline" className="rounded-full border-slate-200 px-2 py-0.5 text-[11px] font-semibold dark:border-slate-700">
                                                        {formatPercentage(row.share)}
                                                    </Badge>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={3} className="py-10 text-center text-sm text-muted-foreground">
                                            No statuses recorded for the selected filters.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>

                {/* Latest Updates Table */}
                <div className="space-y-4">
                    <div className="space-y-2">
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50">Latest status updates</h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400">Most recent changes recorded for trucks on the selected date.</p>
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
                                    <TableHead className="whitespace-nowrap">Vehicle</TableHead>
                                    <TableHead className="whitespace-nowrap">Status</TableHead>
                                    <TableHead className="whitespace-nowrap text-right">Status date</TableHead>
                                    <TableHead className="whitespace-nowrap text-right">Registered</TableHead>
                                    <TableHead className="whitespace-nowrap">Changed by</TableHead>
                                    <TableHead className="whitespace-nowrap">Notes</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {latestRows.length > 0 ? (
                                    latestRows.map((row, index) => {
                                        const registeredAt = formatDateTime(row.registerddate);
                                        const statusDate = formatDate(row.status_date);
                                        const isLatest = index === 0;

                                        return (
                                            <TableRow
                                                key={row.id}
                                                className={cn(
                                                    'divide-x divide-slate-100 align-top hover:bg-slate-50/70 dark:divide-slate-800/50 dark:hover:bg-slate-900/50',
                                                    isLatest ? 'bg-sky-50/60 dark:bg-sky-500/10' : undefined,
                                                )}
                                            >
                                                <TableCell className="whitespace-nowrap font-medium text-slate-900 dark:text-slate-100">{row.plate}</TableCell>
                                                <TableCell className="whitespace-nowrap text-slate-700 dark:text-slate-300">{row.status_name}</TableCell>
                                                <TableCell className="whitespace-nowrap text-right text-sm text-slate-600 dark:text-slate-400">{statusDate}</TableCell>
                                                <TableCell className="whitespace-nowrap text-right text-sm text-slate-600 dark:text-slate-400">{registeredAt}</TableCell>
                                                <TableCell className="whitespace-nowrap text-sm text-slate-600 dark:text-slate-400">{row.changed_by ?? '—'}</TableCell>
                                                <TableCell className="max-w-[18rem] text-sm text-slate-600 dark:text-slate-300">
                                                    {row.notes ? <span className="line-clamp-2">{row.notes}</span> : <span className="text-muted-foreground">—</span>}
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={6} className="py-10 text-center text-sm text-muted-foreground">
                                            No recent updates were recorded for the selected filters.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>

                {/* Available Statuses */}
                <div className="space-y-4 rounded-lg border border-slate-200 bg-slate-50/30 p-6 dark:border-slate-800 dark:bg-slate-900/30">
                    <div>
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50">Available statuses</h3>
                        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                            Operational statuses configured for daily truck monitoring. Only statuses with activity appear in the distribution table above.
                        </p>
                    </div>
                    {statusOptionsSource.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                            {statusOptionsSource.map((status) => (
                                <Badge key={status.id} variant="outline" className="rounded-full border-slate-200 px-3 py-1 text-xs font-medium dark:border-slate-700">
                                    {status.name}
                                </Badge>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-muted-foreground">No statuses are configured yet.</p>
                    )}
                </div>
            </div>
        </ReportPageLayout>
    );
}
