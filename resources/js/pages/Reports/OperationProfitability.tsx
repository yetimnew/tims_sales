import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { ReportSummaryGrid, type ReportSummaryItem } from '@/components/reports/report-summary-grid';
import { formatCurrency, formatInteger } from '@/components/reports/formatters';
import AppLayout from '@/layouts/app-layout';
import { Head, router } from '@inertiajs/react';
import { type BreadcrumbItem } from '@/types';
import { RefreshCcw, CircleDollarSign, TrendingDown, TrendingUp, ClipboardList } from 'lucide-react';
import * as React from 'react';

interface Totals { revenue: number; cost: number; profit: number; operations: number }
interface Row {
    operation_id: number;
    code: string;
    customer_name: string;
    region_name: string;
    revenue: number;
    cost: number;
    profit: number;
    margin_percent: number | null;
    trips: number;
    tonnage: number;
    avg_km_per_trip: number;
    cost_per_km: number | null;
}

interface Props {
    filters: { from: string; to: string; customer_id?: number | null; region_id?: number | null };
    totals: Totals;
    operations: Row[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Reports', href: '/reports/operation-profitability' },
    { title: 'Operation Profitability', href: '/reports/operation-profitability' },
];

export default function OperationProfitability({ filters, totals, operations }: Props) {
    const [from, setFrom] = React.useState(filters.from);
    const [to, setTo] = React.useState(filters.to);
    
    const handleApply = () => {
        router.get('/reports/operation-profitability', { from, to }, { preserveState: true, preserveScroll: true });
    };

    const handleReset = () => {
        setFrom(filters.from);
        setTo(filters.to);
        router.get('/reports/operation-profitability', {}, { preserveState: false, preserveScroll: true });
    };

    const summaryItems = React.useMemo<ReportSummaryItem[]>(
        () => [
            {
                label: 'Total Revenue',
                value: formatCurrency(totals.revenue),
                icon: CircleDollarSign,
                tone: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-200',
            },
            {
                label: 'Total Cost',
                value: formatCurrency(totals.cost),
                icon: TrendingDown,
                tone: 'bg-rose-100 text-rose-600 dark:bg-rose-500/20 dark:text-rose-200',
            },
            {
                label: 'Total Profit',
                value: formatCurrency(totals.profit),
                icon: TrendingUp,
                tone: 'bg-cyan-100 text-cyan-600 dark:bg-cyan-500/20 dark:text-cyan-200',
            },
            {
                label: 'Operations',
                value: formatInteger(totals.operations),
                icon: ClipboardList,
                tone: 'bg-violet-100 text-violet-600 dark:bg-violet-500/20 dark:text-violet-200',
            },
        ],
        [totals],
    );

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Operation Profitability" />
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-slate-100/60 dark:bg-slate-900/40">
                <div className="flex flex-1 flex-col gap-6 overflow-y-auto p-4 pb-10 sm:p-6 lg:p-10">
                    <header className="rounded-2xl border border-slate-200 bg-white/95 px-6 py-6 shadow-sm backdrop-blur dark:border-slate-800/70 dark:bg-slate-900/70">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                            <div className="space-y-2">
                                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500 dark:text-slate-400">Operation Intelligence</p>
                                <h1 className="text-3xl font-semibold text-slate-900 dark:text-slate-50">Operation Profitability</h1>
                                <p className="max-w-3xl text-sm text-slate-600 dark:text-slate-300">
                                    Analyse profitability, margin, and cost efficiency by operation. Review revenue, expenses, and contribution across your operational portfolio.
                                </p>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-medium text-slate-600 dark:text-slate-400">From</span>
                                    <input
                                        type="date"
                                        value={from}
                                        onChange={(e) => setFrom(e.target.value)}
                                        className="h-9 rounded-md border border-slate-300 bg-white px-3 text-sm dark:border-slate-600 dark:bg-slate-800"
                                    />
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-medium text-slate-600 dark:text-slate-400">To</span>
                                    <input
                                        type="date"
                                        value={to}
                                        onChange={(e) => setTo(e.target.value)}
                                        className="h-9 rounded-md border border-slate-300 bg-white px-3 text-sm dark:border-slate-600 dark:bg-slate-800"
                                    />
                                </div>
                                <Button type="button" variant="outline" className="gap-2" onClick={handleReset}>
                                    <RefreshCcw className="h-4 w-4" />
                                    Reset
                                </Button>
                                <Button type="button" className="gap-2" onClick={handleApply}>
                                    Generate report
                                </Button>
                            </div>
                        </div>
                    </header>

                    <ReportSummaryGrid items={summaryItems} />

                    <Card className="border border-slate-200 bg-white/95 shadow-sm dark:border-slate-800/70 dark:bg-slate-900/70">
                        <CardHeader className="space-y-3 border-b border-slate-200/60 pb-5 dark:border-slate-700/60">
                            <div className="space-y-1">
                                <CardTitle className="text-lg font-semibold text-slate-900 dark:text-slate-50">Operation Performance Detail</CardTitle>
                                <CardDescription className="text-sm">Profitability, margin, and cost metrics by operation.</CardDescription>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader className="bg-slate-50/60 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-900/60 dark:text-slate-400">
                                        <TableRow className="divide-x divide-slate-200/40 dark:divide-slate-800/50">
                                            <TableHead className="whitespace-nowrap">Operation</TableHead>
                                            <TableHead className="whitespace-nowrap">Customer</TableHead>
                                            <TableHead className="whitespace-nowrap">Region</TableHead>
                                            <TableHead className="whitespace-nowrap text-right">Revenue</TableHead>
                                            <TableHead className="whitespace-nowrap text-right">Cost</TableHead>
                                            <TableHead className="whitespace-nowrap text-right">Profit</TableHead>
                                            <TableHead className="whitespace-nowrap text-right">Margin %</TableHead>
                                            <TableHead className="whitespace-nowrap text-right">Trips</TableHead>
                                            <TableHead className="whitespace-nowrap text-right">Tonnage</TableHead>
                                            <TableHead className="whitespace-nowrap text-right">Avg Km/Trip</TableHead>
                                            <TableHead className="whitespace-nowrap text-right">Cost/Km</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {operations.length > 0 ? (
                                            operations.map((o) => (
                                                <TableRow key={o.operation_id} className="divide-x divide-slate-100 hover:bg-slate-50/70 dark:divide-slate-800/50 dark:hover:bg-slate-900/50">
                                                    <TableCell className="whitespace-nowrap font-medium text-slate-900 dark:text-slate-100">{o.code}</TableCell>
                                                    <TableCell className="whitespace-nowrap text-slate-600 dark:text-slate-400">{o.customer_name}</TableCell>
                                                    <TableCell className="whitespace-nowrap text-slate-600 dark:text-slate-400">{o.region_name}</TableCell>
                                                    <TableCell className="whitespace-nowrap text-right">{formatCurrency(o.revenue)}</TableCell>
                                                    <TableCell className="whitespace-nowrap text-right">{formatCurrency(o.cost)}</TableCell>
                                                    <TableCell className="whitespace-nowrap text-right font-semibold">{formatCurrency(o.profit)}</TableCell>
                                                    <TableCell className="whitespace-nowrap text-right">{o.margin_percent === null ? '—' : `${o.margin_percent.toFixed(2)}%`}</TableCell>
                                                    <TableCell className="whitespace-nowrap text-right">{formatInteger(o.trips)}</TableCell>
                                                    <TableCell className="whitespace-nowrap text-right">{formatInteger(o.tonnage)}</TableCell>
                                                    <TableCell className="whitespace-nowrap text-right">{formatInteger(o.avg_km_per_trip)}</TableCell>
                                                    <TableCell className="whitespace-nowrap text-right">{o.cost_per_km === null ? '—' : formatCurrency(o.cost_per_km)}</TableCell>
                                                </TableRow>
                                            ))
                                        ) : (
                                            <TableRow>
                                                <TableCell colSpan={11} className="py-10 text-center text-sm text-muted-foreground">
                                                    No data for selected period. Adjust your filters and generate the report again.
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}








