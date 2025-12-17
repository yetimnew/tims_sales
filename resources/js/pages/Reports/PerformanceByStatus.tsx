import { useCallback, useMemo, useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ReportFiltersDialog } from '@/components/reports/report-filters-dialog';
import { ReportSummaryGrid, type ReportSummaryItem } from '@/components/reports/report-summary-grid';
import type { ReportSelectionOption } from '@/components/reports/types';
import { formatInteger, formatPercentage } from '@/components/reports/formatters';
import { cn } from '@/lib/utils';
import { CalendarClock, Medal, PieChart, RefreshCcw, Truck } from 'lucide-react';

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
        const params: Record<string, unknown> = {};

        if (selectedDate) {
            params.date = selectedDate;
        }

        if (selectedStatuses.length > 0) {
            params.status_ids = selectedStatuses;
        }

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
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Performance by Status" />
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-slate-100/60 dark:bg-slate-900/40">
                <div className="flex flex-1 flex-col gap-6 overflow-y-auto p-4 pb-10 sm:p-6 lg:p-10">
                    <header className="rounded-2xl border border-slate-200 bg-white/95 px-6 py-6 shadow-sm backdrop-blur dark:border-slate-800/70 dark:bg-slate-900/70">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                            <div className="space-y-2">
                                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500 dark:text-slate-400">Status Intelligence</p>
                                <h1 className="text-3xl font-semibold text-slate-900 dark:text-slate-50">Performance by Status</h1>
                                <p className="max-w-3xl text-sm text-slate-600 dark:text-slate-300">
                                    Track how operational statuses evolve throughout the day. Filter by reporting date, focus on the statuses you care about, and surface the dominant state across the fleet.
                                </p>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
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
                                <Button type="button" variant="outline" className="gap-2" onClick={handleResetFilters}>
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
                                <CardTitle className="text-lg font-semibold text-slate-900 dark:text-slate-50">Status distribution</CardTitle>
                                <CardDescription className="text-sm">Count of vehicles per status with relative share.</CardDescription>
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
                        </CardContent>
                    </Card>

                    <Card className="border border-slate-200 bg-white/95 shadow-sm dark:border-slate-800/70 dark:bg-slate-900/70">
                        <CardHeader className="space-y-3 border-b border-slate-200/60 pb-5 dark:border-slate-700/60">
                            <div className="space-y-1">
                                <CardTitle className="text-lg font-semibold text-slate-900 dark:text-slate-50">Latest status updates</CardTitle>
                                <CardDescription className="text-sm">Most recent changes recorded for trucks on the selected date.</CardDescription>
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
                        </CardContent>
                    </Card>

                    <Card className="border border-slate-200 bg-white/95 shadow-sm dark:border-slate-800/70 dark:bg-slate-900/70">
                        <CardHeader className="space-y-3 border-b border-slate-200/60 pb-4 dark:border-slate-700/60">
                            <CardTitle className="text-lg font-semibold text-slate-900 dark:text-slate-50">Available statuses</CardTitle>
                            <CardDescription className="text-sm text-slate-600 dark:text-slate-300">
                                Operational statuses configured for daily truck monitoring. Only statuses with activity appear in the distribution table above.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
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
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}
