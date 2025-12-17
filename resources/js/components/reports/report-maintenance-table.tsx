import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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

    return (
        <Card className="border border-slate-200 bg-white/95 shadow-sm dark:border-slate-800/70 dark:bg-slate-900/70">
            <CardHeader className="space-y-3 border-b border-slate-200/60 pb-5 dark:border-slate-700/60">
                <div className="space-y-1">
                    <CardTitle className="text-lg font-semibold text-slate-900 dark:text-slate-50">Maintenance Detail</CardTitle>
                    <CardDescription className="text-sm">Asset workload, completion outcomes, and spend per truck.</CardDescription>
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
            </CardContent>
        </Card>
    );
}
