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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CircleDollarSign, LayoutGrid, PiggyBank, TrendingUp } from 'lucide-react';

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
    const [from, setFrom] = useState(filters.from ?? '');
    const [to, setTo] = useState(filters.to ?? '');

    const formatNumber = (value: number) => value.toLocaleString();
    const formatDecimal = (value: number) => value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const formatCurrency = (value: number) =>
        new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(value);
    const formatPercentage = (value: number | null) => (value === null ? '—' : `${value.toFixed(2)}%`);

    const summaryItems = useMemo(
        () => [
            {
                key: 'total-revenue',
                label: 'Total revenue',
                value: formatCurrency(totals.revenue ?? 0),
                helper: 'Gross revenue across included operations',
                icon: <TrendingUp className="h-3.5 w-3.5" />,
                iconWrapperClassName: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-200',
                valueClassName: 'text-emerald-600 dark:text-emerald-200',
            },
            {
                key: 'total-cost',
                label: 'Total cost',
                value: formatCurrency(totals.cost ?? 0),
                helper: 'Combined direct and operational spend',
                icon: <CircleDollarSign className="h-3.5 w-3.5" />,
                iconWrapperClassName: 'bg-sky-50 text-sky-600 dark:bg-sky-500/20 dark:text-sky-200',
                valueClassName: 'text-sky-600 dark:text-sky-200',
            },
            {
                key: 'total-profit',
                label: 'Total profit',
                value: formatCurrency(totals.profit ?? 0),
                helper: 'Contribution after costs',
                icon: <PiggyBank className="h-3.5 w-3.5" />,
                iconWrapperClassName: 'bg-amber-50 text-amber-600 dark:bg-amber-500/20 dark:text-amber-200',
                valueClassName: 'text-amber-600 dark:text-amber-200',
            },
            {
                key: 'operations-count',
                label: 'Operations analysed',
                value: formatNumber(totals.operations ?? 0),
                helper: 'Distinct operations in the selected range',
                icon: <LayoutGrid className="h-3.5 w-3.5" />,
                iconWrapperClassName: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-200',
                valueClassName: 'text-indigo-600 dark:text-indigo-200',
            },
        ],
        [totals],
    );

    const detailBadgeItems = [
        { key: 'from', label: `From ${filters.from || '—'}` },
        { key: 'to', label: `To ${filters.to || '—'}` },
    ];

    const handleApply = () => {
        router.get(
            '/reports/operation-profitability',
            { from, to },
            { preserveState: true, preserveScroll: true },
        );
    };

    const handleReset = () => {
        setFrom(filters.from ?? '');
        setTo(filters.to ?? '');
        router.get('/reports/operation-profitability', {}, { preserveState: false, preserveScroll: true });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Operation Profitability" />
            <ReportPageShell>
                <ReportHero
                    eyebrow="Profit lens"
                    title="Operation profitability"
                    description="Track revenue, spend, and contribution by operation to spotlight high performers and uncover corridors that need optimisation."
                />

                <ReportSectionCard
                    title="Filters"
                    description="Adjust the reporting window before regenerating the report."
                    contentClassName="flex flex-col gap-4 p-6 sm:flex-row sm:items-end"
                >
                    <div className="grid flex-1 gap-2">
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-200">From date</span>
                        <Input type="date" value={from} onChange={(event) => setFrom(event.target.value)} />
                    </div>
                    <div className="grid flex-1 gap-2">
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-200">To date</span>
                        <Input type="date" value={to} onChange={(event) => setTo(event.target.value)} />
                    </div>
                    <div className="flex flex-col gap-2 sm:w-auto">
                        <Button type="button" variant="outline" onClick={handleReset}>
                            Reset
                        </Button>
                        <Button type="button" onClick={handleApply}>
                            Apply filters
                        </Button>
                    </div>
                </ReportSectionCard>

                <ReportSectionCard
                    title="Operations snapshot"
                    description="High-level revenue and cost signals for the selected range."
                    contentClassName="p-6"
                >
                    <ReportSummaryGrid items={summaryItems} className="gap-4 md:grid-cols-2 xl:grid-cols-4" />
                </ReportSectionCard>

                <ReportSectionCard
                    title="Operation profitability detail"
                    description="Compare utilisation, cost structure, and profitability for each operation."
                    badgeItems={detailBadgeItems}
                    contentClassName="p-0"
                >
                    <div className="max-h-[60vh] overflow-auto">
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
                                    <TableHead className="whitespace-nowrap text-right">Tonnage (MT)</TableHead>
                                    <TableHead className="whitespace-nowrap text-right">Avg km / trip</TableHead>
                                    <TableHead className="whitespace-nowrap text-right">Cost / km</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {operations.length > 0 ? (
                                    operations.map((operation) => (
                                        <TableRow
                                            key={operation.operation_id}
                                            className="divide-x divide-slate-100 hover:bg-slate-50/70 dark:divide-slate-800/50 dark:hover:bg-slate-900/50"
                                        >
                                            <TableCell className="whitespace-nowrap font-medium text-slate-900 dark:text-slate-100">
                                                {operation.code}
                                            </TableCell>
                                            <TableCell className="whitespace-nowrap text-slate-600 dark:text-slate-300">
                                                {operation.customer_name}
                                            </TableCell>
                                            <TableCell className="whitespace-nowrap text-slate-600 dark:text-slate-300">
                                                {operation.region_name}
                                            </TableCell>
                                            <TableCell className="whitespace-nowrap text-right">{formatCurrency(operation.revenue)}</TableCell>
                                            <TableCell className="whitespace-nowrap text-right">{formatCurrency(operation.cost)}</TableCell>
                                            <TableCell className="whitespace-nowrap text-right">{formatCurrency(operation.profit)}</TableCell>
                                            <TableCell className="whitespace-nowrap text-right">{formatPercentage(operation.margin_percent)}</TableCell>
                                            <TableCell className="whitespace-nowrap text-right">{formatNumber(operation.trips)}</TableCell>
                                            <TableCell className="whitespace-nowrap text-right">{formatDecimal(operation.tonnage)}</TableCell>
                                            <TableCell className="whitespace-nowrap text-right">{formatDecimal(operation.avg_km_per_trip)}</TableCell>
                                            <TableCell className="whitespace-nowrap text-right">
                                                {operation.cost_per_km === null ? '—' : `${formatCurrency(operation.cost_per_km)} / km`}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={11} className="py-10 text-center text-muted-foreground">
                                            No data for the selected period.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </ReportSectionCard>
            </ReportPageShell>
        </AppLayout>
    );
}








