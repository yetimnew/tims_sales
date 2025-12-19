import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { InertiaPagination } from '@/components/ui/pagination';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatCurrency, formatDecimal, formatInteger, formatPercentage } from './formatters';

export interface MaintenanceReportRow {
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

export interface MaintenanceReportTotals {
    records: number;
    completed: number;
    scheduled: number;
    in_progress: number;
    overdue: number;
    total_cost: number;
    completed_cost: number;
    open_cost: number;
    average_completion_days: number | null;
    truck_count?: number;
}

interface ReportMaintenanceTableProps {
    rows: MaintenanceReportRow[];
    totals: MaintenanceReportTotals | null;
    filterBadges: string[];
    emptyMessage?: string;
    paginatorMeta?: {
        current_page?: number | null;
        last_page?: number | null;
        per_page?: number | null;
        total?: number | null;
        from?: number | null;
        to?: number | null;
    } | null;
    paginationLinks?: Array<{ url: string | null; label: string; active?: boolean }>;
    perPageOptions?: number[];
    perPage?: number;
    onPerPageChange?: (value: number) => void;
}

const formatOptionalDecimal = (value: number | null): string => {
    if (value === null || Number.isNaN(value)) {
        return '—';
    }

    return formatDecimal(value);
};

const formatOptionalCurrency = (value: number | null): string => {
    if (value === null || Number.isNaN(value)) {
        return '—';
    }

    return formatCurrency(value);
};

const formatOptionalInteger = (value: number | null): string => {
    if (value === null || Number.isNaN(value)) {
        return '—';
    }

    return formatInteger(value);
};

export function ReportMaintenanceTable({
    rows,
    totals,
    filterBadges,
    emptyMessage = 'No maintenance records match the selected filters.',
    paginatorMeta,
    paginationLinks,
    perPageOptions,
    perPage,
    onPerPageChange,
}: ReportMaintenanceTableProps) {
    const safeRows = Array.isArray(rows) ? rows : [];
    const safeTotals = totals ?? {
        records: 0,
        completed: 0,
        scheduled: 0,
        in_progress: 0,
        overdue: 0,
        total_cost: 0,
        completed_cost: 0,
        open_cost: 0,
        average_completion_days: null,
    };
    const safeMeta = paginatorMeta ?? null;
    const safePerPageOptions = Array.isArray(perPageOptions) && perPageOptions.length > 0 ? perPageOptions : [10, 25, 50];
    const currentPerPage = perPage ?? safePerPageOptions[0] ?? 25;
    const allowPerPageChange = typeof onPerPageChange === 'function';
    const handlePerPageSelect = (value: string) => {
        if (!onPerPageChange) {
            return;
        }

        const parsed = Number(value);

        if (!Number.isNaN(parsed) && parsed > 0) {
            onPerPageChange(parsed);
        }
    };
    const showingText = safeMeta
        ? `Showing ${safeMeta.from ?? 0}–${safeMeta.to ?? (safeMeta.total ?? 0)} of ${safeMeta.total ?? 0}`
        : null;

    return (
        <Card className="border border-slate-200 bg-white/95 shadow-sm dark:border-slate-800/70 dark:bg-slate-900/70">
            <CardHeader className="space-y-3 border-b border-slate-200/60 pb-5 dark:border-slate-700/60">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div className="space-y-1">
                        <CardTitle className="text-lg font-semibold text-slate-900 dark:text-slate-50">Maintenance Detail</CardTitle>
                        <CardDescription className="text-sm">Asset workload, completion outcomes, and spend per truck.</CardDescription>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        <span>Rows per page</span>
                        <Select value={String(currentPerPage)} onValueChange={handlePerPageSelect}>
                            <SelectTrigger className="h-8 w-[150px]" disabled={!allowPerPageChange}>
                                <SelectValue placeholder={`${currentPerPage} / page`} />
                            </SelectTrigger>
                            <SelectContent>
                                {safePerPageOptions.map((option) => (
                                    <SelectItem key={option} value={String(option)}>
                                        {option} / page
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                    {filterBadges.map((badge) => (
                        <Badge key={badge} variant="outline">
                            {badge}
                        </Badge>
                    ))}
                </div>
            </CardHeader>
            <CardContent className="space-y-4 p-0">
                {showingText ? (
                    <div className="flex flex-col gap-1 border-b border-slate-200/60 px-4 py-3 text-xs text-muted-foreground dark:border-slate-800/60 sm:flex-row sm:items-center sm:justify-between">
                        <span>{showingText}</span>
                        {safeMeta?.current_page && safeMeta?.last_page ? (
                            <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
                                Page {safeMeta.current_page} of {safeMeta.last_page}
                            </span>
                        ) : null}
                    </div>
                ) : null}
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader className="bg-slate-50/60 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-900/60 dark:text-slate-400">
                            <TableRow className="divide-x divide-slate-200/40 dark:divide-slate-800/50">
                                <TableHead className="whitespace-nowrap">Truck</TableHead>
                                <TableHead className="whitespace-nowrap">Status</TableHead>
                                <TableHead className="whitespace-nowrap text-right">Tasks</TableHead>
                                <TableHead className="whitespace-nowrap text-right">Completed</TableHead>
                                <TableHead className="whitespace-nowrap text-right">Scheduled</TableHead>
                                <TableHead className="whitespace-nowrap text-right">In progress</TableHead>
                                <TableHead className="whitespace-nowrap text-right">Overdue</TableHead>
                                <TableHead className="whitespace-nowrap text-right">Completion %</TableHead>
                                <TableHead className="whitespace-nowrap text-right">Overdue %</TableHead>
                                <TableHead className="whitespace-nowrap text-right">Total cost</TableHead>
                                <TableHead className="whitespace-nowrap text-right">Completed cost</TableHead>
                                <TableHead className="whitespace-nowrap text-right">Open cost</TableHead>
                                <TableHead className="whitespace-nowrap text-right">Avg cost</TableHead>
                                <TableHead className="whitespace-nowrap text-right">Avg completion (days)</TableHead>
                                <TableHead className="whitespace-nowrap">Last completed</TableHead>
                                <TableHead className="whitespace-nowrap">Next scheduled</TableHead>
                                <TableHead className="whitespace-nowrap text-right">Max overdue (days)</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {safeRows.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={17} className="py-6 text-center text-sm text-muted-foreground">
                                        {emptyMessage}
                                    </TableCell>
                                </TableRow>
                            ) : (
                                safeRows.map((row) => (
                                    <TableRow
                                        key={row.truck_id}
                                        className="divide-x divide-slate-200/40 odd:bg-white even:bg-slate-50/40 hover:bg-slate-100/60 dark:divide-slate-800/50 dark:odd:bg-slate-900/40 dark:even:bg-slate-900/20 dark:hover:bg-slate-800/50"
                                    >
                                        <TableCell className="whitespace-nowrap text-sm font-medium text-slate-700 dark:text-slate-100">{row.plate}</TableCell>
                                        <TableCell className="whitespace-nowrap text-sm capitalize text-slate-600 dark:text-slate-200">{row.status ?? '—'}</TableCell>
                                        <TableCell className="whitespace-nowrap text-right text-sm text-slate-700 dark:text-slate-100">{formatInteger(row.records)}</TableCell>
                                        <TableCell className="whitespace-nowrap text-right text-sm text-slate-700 dark:text-slate-100">{formatInteger(row.completed)}</TableCell>
                                        <TableCell className="whitespace-nowrap text-right text-sm text-slate-700 dark:text-slate-100">{formatInteger(row.scheduled)}</TableCell>
                                        <TableCell className="whitespace-nowrap text-right text-sm text-slate-700 dark:text-slate-100">{formatInteger(row.in_progress)}</TableCell>
                                        <TableCell className="whitespace-nowrap text-right text-sm text-slate-700 dark:text-slate-100">{formatInteger(row.overdue)}</TableCell>
                                        <TableCell className="whitespace-nowrap text-right text-sm text-slate-700 dark:text-slate-100">{formatPercentage(row.completion_rate_pct)}</TableCell>
                                        <TableCell className="whitespace-nowrap text-right text-sm text-slate-700 dark:text-slate-100">{formatPercentage(row.overdue_rate_pct)}</TableCell>
                                        <TableCell className="whitespace-nowrap text-right text-sm text-slate-700 dark:text-slate-100">{formatCurrency(row.total_cost)}</TableCell>
                                        <TableCell className="whitespace-nowrap text-right text-sm text-slate-700 dark:text-slate-100">{formatCurrency(row.completed_cost)}</TableCell>
                                        <TableCell className="whitespace-nowrap text-right text-sm text-slate-700 dark:text-slate-100">{formatCurrency(row.open_cost)}</TableCell>
                                        <TableCell className="whitespace-nowrap text-right text-sm text-slate-700 dark:text-slate-100">{formatOptionalCurrency(row.average_cost)}</TableCell>
                                        <TableCell className="whitespace-nowrap text-right text-sm text-slate-700 dark:text-slate-100">{formatOptionalDecimal(row.average_completion_days)}</TableCell>
                                        <TableCell className="whitespace-nowrap text-sm text-slate-600 dark:text-slate-200">{row.last_completed_at ?? '—'}</TableCell>
                                        <TableCell className="whitespace-nowrap text-sm text-slate-600 dark:text-slate-200">{row.next_scheduled_at ?? '—'}</TableCell>
                                        <TableCell className="whitespace-nowrap text-right text-sm text-slate-700 dark:text-slate-100">{formatOptionalInteger(row.max_overdue_days)}</TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                        <TableFooter>
                            <TableRow className="divide-x divide-slate-200/60 bg-slate-100/80 text-sm font-semibold dark:divide-slate-800/50 dark:bg-slate-900/60">
                                <TableCell className="whitespace-nowrap" colSpan={2}>
                                    Totals
                                </TableCell>
                                <TableCell className="whitespace-nowrap text-right">{formatInteger(safeTotals.records ?? 0)}</TableCell>
                                <TableCell className="whitespace-nowrap text-right">{formatInteger(safeTotals.completed ?? 0)}</TableCell>
                                <TableCell className="whitespace-nowrap text-right">{formatInteger(safeTotals.scheduled ?? 0)}</TableCell>
                                <TableCell className="whitespace-nowrap text-right">{formatInteger(safeTotals.in_progress ?? 0)}</TableCell>
                                <TableCell className="whitespace-nowrap text-right">{formatInteger(safeTotals.overdue ?? 0)}</TableCell>
                                <TableCell className="whitespace-nowrap text-right">—</TableCell>
                                <TableCell className="whitespace-nowrap text-right">—</TableCell>
                                <TableCell className="whitespace-nowrap text-right">{formatCurrency(safeTotals.total_cost ?? 0)}</TableCell>
                                <TableCell className="whitespace-nowrap text-right">{formatCurrency(safeTotals.completed_cost ?? 0)}</TableCell>
                                <TableCell className="whitespace-nowrap text-right">{formatCurrency(safeTotals.open_cost ?? 0)}</TableCell>
                                <TableCell className="whitespace-nowrap text-right">—</TableCell>
                                <TableCell className="whitespace-nowrap text-right">{formatOptionalDecimal(safeTotals.average_completion_days ?? null)}</TableCell>
                                <TableCell className="whitespace-nowrap">—</TableCell>
                                <TableCell className="whitespace-nowrap">—</TableCell>
                                <TableCell className="whitespace-nowrap text-right">—</TableCell>
                            </TableRow>
                        </TableFooter>
                    </Table>
                </div>
                <div className="px-4 pb-4">
                    <InertiaPagination
                        links={paginationLinks ?? []}
                        from={safeMeta?.from ?? undefined}
                        to={safeMeta?.to ?? undefined}
                        total={safeMeta?.total ?? undefined}
                        currentPage={safeMeta?.current_page ?? undefined}
                        lastPage={safeMeta?.last_page ?? undefined}
                    />
                </div>
            </CardContent>
        </Card>
    );
}
