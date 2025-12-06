import { useMemo, useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { ReportHero } from '@/components/reports/report-hero';
import { ReportPageShell } from '@/components/reports/report-page-shell';
import { ReportSectionCard } from '@/components/reports/report-section-card';
import { ReportSummaryGrid } from '@/components/reports/report-summary-grid';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useListingLoading } from '@/hooks/use-listing-loading';
import { Activity, BarChart3, Clock4, Layers3, Route } from 'lucide-react';

interface PerformanceByStatusSummaryRow {
    status_name: string;
    count: number;
}

interface PerformanceByStatusLatestRow {
    plate: string;
    status_name: string;
    registerddate: string;
}

interface PerformanceByStatusProps {
    date: string;
    summary: PerformanceByStatusSummaryRow[];
    latest: PerformanceByStatusLatestRow[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Reports', href: '/reports/performance-by-status' },
    { title: 'Performance by Status', href: '/reports/performance-by-status' },
];

const SKELETON_FLAG_KEY = 'reports.performance-by-status.shouldShowSkeleton';

const formatNumber = (value: number): string => value.toLocaleString();

const formatDateTime = (value: string): string => {
    if (!value) {
        return '—';
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return '—';
    }

    return new Intl.DateTimeFormat(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
    }).format(date);
};

export default function PerformanceByStatus({ date, summary = [], latest = [] }: PerformanceByStatusProps) {
    const [selectedDate, setSelectedDate] = useState(date ?? '');

    const isDataReady = Array.isArray(summary) && Array.isArray(latest);
    const { isLoading } = useListingLoading({
        storageKey: SKELETON_FLAG_KEY,
        isDataReady,
    });

    const totals = useMemo(() => {
        const totalVehicles = summary.reduce((acc, row) => acc + (row.count ?? 0), 0);
        const uniqueStatuses = summary.length;
        const topStatus = summary
            .slice()
            .sort((a, b) => b.count - a.count)[0];

        const latestStatus = latest[0];

        return {
            totalVehicles,
            uniqueStatuses,
            topStatus,
            latestStatus,
        };
    }, [summary, latest]);

    const summaryItems = [
        {
            key: 'vehicles-tracked',
            label: 'Vehicles tracked',
            value: isLoading ? <Skeleton className="h-5 w-24" /> : formatNumber(totals.totalVehicles),
            helper: 'Units with a recorded status on the selected date',
            icon: <Route className="h-3.5 w-3.5" />,
            iconWrapperClassName: 'bg-blue-50 text-blue-600 dark:bg-blue-500/20 dark:text-blue-200',
            valueClassName: isLoading ? undefined : 'text-blue-600 dark:text-blue-200',
        },
        {
            key: 'statuses-covered',
            label: 'Statuses covered',
            value: isLoading ? <Skeleton className="h-5 w-24" /> : formatNumber(totals.uniqueStatuses),
            helper: 'Distinct statuses present in the snapshot',
            icon: <Layers3 className="h-3.5 w-3.5" />,
            iconWrapperClassName: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-200',
            valueClassName: isLoading ? undefined : 'text-emerald-600 dark:text-emerald-200',
        },
        {
            key: 'top-status',
            label: 'Top status',
            value: isLoading ? (
                <Skeleton className="h-5 w-32" />
            ) : totals.topStatus ? (
                `${totals.topStatus.status_name} · ${formatNumber(totals.topStatus.count)}`
            ) : (
                '—'
            ),
            helper: 'Status with the highest count for the period',
            icon: <BarChart3 className="h-3.5 w-3.5" />,
            iconWrapperClassName: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-200',
        },
        {
            key: 'latest-update',
            label: 'Latest update',
            value: isLoading ? (
                <Skeleton className="h-5 w-40" />
            ) : totals.latestStatus ? (
                `${totals.latestStatus.status_name} · ${formatDateTime(totals.latestStatus.registerddate)}`
            ) : (
                '—'
            ),
            helper: 'Most recent status transition recorded',
            icon: <Clock4 className="h-3.5 w-3.5" />,
            iconWrapperClassName: 'bg-amber-50 text-amber-600 dark:bg-amber-500/20 dark:text-amber-200',
        },
    ];

    const orderedSummary = useMemo(() => summary.slice().sort((a, b) => b.count - a.count), [summary]);

    const highlights = orderedSummary.slice(0, 3);

    const appliedBadgeItems = [
        { key: 'date', label: `Snapshot: ${date || '—'}` },
    ];

    const latestBadgeItems = [
        { key: 'events', label: `${latest.length} recent updates` },
    ];

    const handleApplyFilters = () => {
        const params: Record<string, string> = {};

        if (selectedDate) {
            params.date = selectedDate;
        }

        router.get('/reports/performance-by-status', params, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleReset = () => {
        setSelectedDate(date ?? '');

        router.get('/reports/performance-by-status', {}, {
            preserveState: false,
            preserveScroll: true,
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Performance by Status" />
            <ReportPageShell>
                <ReportHero
                    eyebrow="Fleet activity"
                    title="Performance by status"
                    description="Review how vehicles are distributed across operational statuses and keep an eye on the latest transitions. Adjust the snapshot date to analyse changing demand patterns."
                    actions={
                        <>
                            <Button type="button" variant="outline" onClick={handleReset}>
                                Reset
                            </Button>
                            <Button type="button" onClick={handleApplyFilters}>
                                Generate report
                            </Button>
                        </>
                    }
                />

                <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
                    <ReportSectionCard
                        title="Filters"
                        description="Pick the snapshot date to analyse fleet status distribution."
                        contentClassName="flex flex-col gap-6 p-6"
                    >
                        <div className="space-y-2">
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Snapshot date</span>
                            <Input type="date" value={selectedDate} onChange={(event) => setSelectedDate(event.target.value)} />
                        </div>
                        <div className="flex flex-col gap-3 border-t border-slate-200/60 pt-6 sm:flex-row sm:justify-between dark:border-slate-700/60">
                            <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={handleReset}>
                                Reset
                            </Button>
                            <Button type="button" className="w-full sm:w-auto" onClick={handleApplyFilters}>
                                Apply filters
                            </Button>
                        </div>
                    </ReportSectionCard>

                    <ReportSectionCard
                        title="Status snapshot"
                        description="Headline metrics for the selected date."
                        contentClassName="p-6"
                    >
                        <ReportSummaryGrid items={summaryItems} className="gap-4 md:grid-cols-2" />
                    </ReportSectionCard>
                </div>

                <ReportSectionCard
                    title="Status highlights"
                    description="Top statuses by volume to prioritise follow-up actions."
                    contentClassName="grid gap-4 p-6 sm:grid-cols-3"
                >
                    {isLoading && (
                        <>
                            <Skeleton className="h-24 w-full" />
                            <Skeleton className="h-24 w-full" />
                            <Skeleton className="h-24 w-full" />
                        </>
                    )}
                    {!isLoading && highlights.length === 0 && (
                        <p className="text-sm text-muted-foreground">No status activity recorded for the selected date.</p>
                    )}
                    {!isLoading &&
                        highlights.map((row, index) => (
                            <div
                                key={row.status_name ?? index}
                                className="flex items-center justify-between rounded-lg border border-slate-200/70 px-3 py-3 dark:border-slate-800/70"
                            >
                                <div>
                                    <p className="font-semibold text-slate-900 dark:text-slate-100">{row.status_name}</p>
                                    <p className="text-xs text-muted-foreground">{formatNumber(row.count)} vehicles</p>
                                </div>
                                <Badge variant="secondary" className="min-w-[2rem] justify-center">#{index + 1}</Badge>
                            </div>
                        ))}
                </ReportSectionCard>

                <ReportSectionCard
                    title="Status distribution"
                    description="Per-status counts ordered by volume."
                    badgeItems={appliedBadgeItems}
                    contentClassName="p-0"
                >
                    {isLoading ? (
                        <div className="space-y-3 p-6">
                            {Array.from({ length: 6 }).map((_, index) => (
                                <Skeleton key={index} className="h-12 w-full" />
                            ))}
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader className="bg-slate-50/70 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-900/50 dark:text-slate-400">
                                    <TableRow className="divide-x divide-slate-200/60 dark:divide-slate-800/50">
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Vehicles</TableHead>
                                        <TableHead className="text-right">Share</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {orderedSummary.length > 0 ? (
                                        orderedSummary.map((row) => {
                                            const share = totals.totalVehicles > 0 ? (row.count / totals.totalVehicles) * 100 : 0;

                                            return (
                                                <TableRow
                                                    key={row.status_name}
                                                    className="divide-x divide-slate-100 hover:bg-slate-50/70 dark:divide-slate-800/60 dark:hover:bg-slate-900/50"
                                                >
                                                    <TableCell className="font-semibold text-slate-900 dark:text-slate-100">{row.status_name}</TableCell>
                                                    <TableCell className="text-right font-medium">{formatNumber(row.count)}</TableCell>
                                                    <TableCell className="text-right text-sm text-muted-foreground">
                                                        {share.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={3} className="py-10 text-center text-muted-foreground">
                                                No status distribution data available.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    )}

                    <div className="flex flex-wrap items-center gap-4 border-t border-slate-200/80 bg-slate-50/60 px-4 py-3 text-sm dark:border-slate-800/70 dark:bg-slate-900/40">
                        <Badge variant="outline" className="bg-white/80 text-xs text-slate-600 dark:bg-slate-900/80 dark:text-slate-300">
                            Vehicles: {formatNumber(totals.totalVehicles)}
                        </Badge>
                        <Badge variant="outline" className="bg-white/80 text-xs text-slate-600 dark:bg-slate-900/80 dark:text-slate-300">
                            Statuses: {formatNumber(totals.uniqueStatuses)}
                        </Badge>
                    </div>
                </ReportSectionCard>

                <ReportSectionCard
                    title="Latest updates"
                    description="Recently recorded status changes to monitor live fleet activity."
                    badgeItems={latestBadgeItems}
                    contentClassName="p-0"
                >
                    {isLoading ? (
                        <div className="space-y-3 p-6">
                            {Array.from({ length: 5 }).map((_, index) => (
                                <Skeleton key={index} className="h-12 w-full" />
                            ))}
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader className="bg-slate-50/70 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-900/50 dark:text-slate-400">
                                    <TableRow className="divide-x divide-slate-200/60 dark:divide-slate-800/50">
                                        <TableHead>Vehicle</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Recorded</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {latest.length > 0 ? (
                                        latest.map((row, index) => (
                                            <TableRow
                                                key={`${row.plate}-${row.registerddate}-${index}`}
                                                className="divide-x divide-slate-100 hover:bg-slate-50/70 dark:divide-slate-800/60 dark:hover:bg-slate-900/50"
                                            >
                                                <TableCell className="font-semibold text-slate-900 dark:text-slate-100">{row.plate}</TableCell>
                                                <TableCell className="text-muted-foreground">{row.status_name}</TableCell>
                                                <TableCell className="text-right text-sm text-muted-foreground">{formatDateTime(row.registerddate)}</TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={3} className="py-10 text-center text-muted-foreground">
                                                No recent status updates captured.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    )}

                    <div className="flex flex-wrap items-center gap-4 border-t border-slate-200/80 bg-slate-50/60 px-4 py-3 text-sm dark:border-slate-800/70 dark:bg-slate-900/40">
                        <Badge variant="outline" className="bg-white/80 text-xs text-slate-600 dark:bg-slate-900/80 dark:text-slate-300">
                            Updates listed: {formatNumber(latest.length)}
                        </Badge>
                        {totals.latestStatus && (
                            <span className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Activity className="h-3.5 w-3.5" />
                                Latest: {formatDateTime(totals.latestStatus.registerddate)}
                            </span>
                        )}
                    </div>
                </ReportSectionCard>
            </ReportPageShell>
        </AppLayout>
    );
}








