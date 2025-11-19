import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { router } from '@inertiajs/react';
import { ReportHeader } from '@/components/report-header';
import { KpiCard } from '@/components/kpi-card';
import { InertiaPagination } from '@/components/ui/pagination';
import { Head } from '@inertiajs/react';
import { type BreadcrumbItem } from '@/types';
import * as React from 'react';

interface OperationCustomerHighlight {
    customer_id: number;
    customer_name: string;
    operations: number;
    internal_trips: number;
    outsource_trips: number;
    tonnage: number;
    revenue: number;
    cost: number;
    margin: number;
    margin_percent: number | null;
}

interface MixTrendPoint {
    period: string;
    internal_trips: number;
    outsource_trips: number;
    internal_tonnage: number;
    outsource_tonnage: number;
}

interface OperationStats {
    total_operations?: number;
    active_operations?: number;
    inactive_operations?: number;
    operations_with_performances?: number;
    operations_with_outsource?: number;
    operations_with_activity?: number;
    operations_by_customer?: Array<{ customer_id: number | null; count: number; customer?: { id: number; name: string } }>;
    internal_trips?: number;
    internal_tonnage?: number;
    internal_distance_km?: number;
    internal_cost?: number;
    internal_revenue?: number;
    outsource_trips?: number;
    outsource_tonnage?: number;
    outsource_distance_km?: number;
    outsource_cost?: number;
    outsource_revenue?: number;
    total_revenue?: number;
    margin?: number;
}

interface OperationsReportProps {
    operationStats?: OperationStats;
    filters?: { from: string; to: string };
    operations?: {
        data: OperationRow[];
        from: number;
        to: number;
        total: number;
        current_page: number;
        last_page: number;
        links: Array<{ url: string | null; label: string; active: boolean }>;
    };
    customerHighlights?: OperationCustomerHighlight[];
    mixTrend?: MixTrendPoint[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Reports', href: '/reports/operations' },
    { title: 'Operations', href: '/reports/operations' },
];

interface OperationRow {
    id: number;
    code: string;
    status: string;
    tariff: number;
    customer: {
        id?: number;
        name: string;
    };
    internal: {
        trips: number;
        tonnage: number;
        distance_km: number;
        cost: number;
    };
    outsource: {
        trips: number;
        tonnage: number;
        distance_km: number;
        cost: number;
    };
    revenue: number;
    total_cost: number;
    margin: number;
    margin_percent: number | null;
}

const currencyFormatter = new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'ETB',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
});

const numberFormatter = new Intl.NumberFormat(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
});

function formatCurrency(value: number | undefined | null) {
    if (value === undefined || value === null) {
        return '—';
    }
    return currencyFormatter.format(value);
}

function formatNumber(value: number | undefined | null, fractionDigits = 0) {
    if (value === undefined || value === null) {
        return '—';
    }
    return new Intl.NumberFormat(undefined, {
        minimumFractionDigits: fractionDigits,
        maximumFractionDigits: fractionDigits,
    }).format(value);
}

function operationStatusVariant(status: string | undefined) {
    switch (status) {
        case 'active':
            return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
        case 'inactive':
            return 'bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-300 border-slate-200 dark:border-slate-800';
        case 'closed':
            return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 border-amber-200 dark:border-amber-800';
        default:
            return 'bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-300 border-slate-200 dark:border-slate-800';
    }
}

export default function OperationsReport({ operationStats, filters, operations, customerHighlights = [], mixTrend = [] }: OperationsReportProps) {
    const totals = {
        total: operationStats?.total_operations ?? 0,
        active: operationStats?.active_operations ?? 0,
        inactive: operationStats?.inactive_operations ?? 0,
        withPerformances: operationStats?.operations_with_performances ?? 0,
        withOutsource: operationStats?.operations_with_outsource ?? 0,
        withActivity: operationStats?.operations_with_activity ?? 0,
        internalTrips: operationStats?.internal_trips ?? 0,
        internalTonnage: operationStats?.internal_tonnage ?? 0,
        internalDistance: operationStats?.internal_distance_km ?? 0,
        internalCost: operationStats?.internal_cost ?? 0,
        internalRevenue: operationStats?.internal_revenue ?? 0,
        outsourceTrips: operationStats?.outsource_trips ?? 0,
        outsourceTonnage: operationStats?.outsource_tonnage ?? 0,
        outsourceDistance: operationStats?.outsource_distance_km ?? 0,
        outsourceCost: operationStats?.outsource_cost ?? 0,
        outsourceRevenue: operationStats?.outsource_revenue ?? 0,
        totalRevenue: operationStats?.total_revenue ?? 0,
        margin: operationStats?.margin ?? 0,
    };
    const [from, setFrom] = React.useState(filters?.from || '');
    const [to, setTo] = React.useState(filters?.to || '');

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Operation Reports" />
            <div className="flex h-full flex-1 flex-col gap-3 overflow-hidden rounded-xl p-4">
                <ReportHeader
                    title="Operation Reports"
                    subtitle="Blend of internal fleet and outsourced vendor performance"
                    from={from}
                    to={to}
                    onApply={(f, t) => router.get('/reports/operations', { from: f, to: t }, { preserveState: true })}
                />

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-3">
                    <KpiCard title="Operations" value={totals.total} helper={`${totals.active.toLocaleString()} active`} />
                    <KpiCard title="Internal Trips" value={totals.internalTrips} helper={`${formatNumber(totals.internalTonnage, 1)} MT • ${formatNumber(totals.internalDistance, 0)} km`} />
                    <KpiCard title="Outsource Trips" value={totals.outsourceTrips} helper={`${formatNumber(totals.outsourceTonnage, 1)} MT • ${formatNumber(totals.outsourceDistance, 0)} km`} />
                    <KpiCard title="Total Margin" value={formatCurrency(totals.margin)} helper={`Revenue ${formatCurrency(totals.totalRevenue)}`} />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                    <Card className="lg:col-span-2">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm">Top Customers by Revenue</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="border-t">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="sticky top-0 bg-background z-10">
                                            <TableHead>Customer</TableHead>
                                            <TableHead className="text-right">Operations</TableHead>
                                            <TableHead className="text-right">Internal / Outsource Trips</TableHead>
                                            <TableHead className="text-right">Tonnage</TableHead>
                                            <TableHead className="text-right">Revenue</TableHead>
                                            <TableHead className="text-right">Margin</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {customerHighlights.length ? customerHighlights.map((customer) => (
                                            <TableRow key={customer.customer_id}>
                                                <TableCell className="max-w-[180px] truncate" title={customer.customer_name}>{customer.customer_name}</TableCell>
                                                <TableCell className="text-right">{customer.operations}</TableCell>
                                                <TableCell className="text-right text-xs text-muted-foreground">
                                                    <span className="font-semibold text-foreground">{customer.internal_trips}</span>
                                                    <span className="mx-1">/</span>
                                                    <span>{customer.outsource_trips}</span>
                                                </TableCell>
                                                <TableCell className="text-right">{formatNumber(customer.tonnage, 1)} MT</TableCell>
                                                <TableCell className="text-right">{formatCurrency(customer.revenue)}</TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex flex-col items-end">
                                                        <span>{formatCurrency(customer.margin)}</span>
                                                        <span className={`text-xs ${customer.margin_percent && customer.margin_percent >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                                                            {customer.margin_percent === null ? '—' : `${customer.margin_percent.toFixed(1)}%`}
                                                        </span>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        )) : (
                                            <TableRow>
                                                <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">No customer data available.</TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm">Mix Trend (Trips)</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="max-h-[280px] overflow-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="sticky top-0 bg-background z-10">
                                            <TableHead>Period</TableHead>
                                            <TableHead className="text-right">Internal</TableHead>
                                            <TableHead className="text-right">Outsource</TableHead>
                                            <TableHead className="text-right">Mix</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {mixTrend.length ? mixTrend.map((period) => (
                                            <TableRow key={period.period}>
                                                <TableCell>{period.period}</TableCell>
                                                <TableCell className="text-right">{period.internal_trips}</TableCell>
                                                <TableCell className="text-right">{period.outsource_trips}</TableCell>
                                                <TableCell className="text-right text-xs text-muted-foreground">
                                                    {formatNumber((period.internal_trips + period.outsource_trips) || 0)} trips
                                                </TableCell>
                                            </TableRow>
                                        )) : (
                                            <TableRow>
                                                <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">No trend data for selected period.</TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Card className="flex-1">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm">Operations</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="rounded-lg border overflow-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="sticky top-0 bg-background z-10">
                                        <TableHead>Operation</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Tariff</TableHead>
                                        <TableHead className="text-right">Internal Trips</TableHead>
                                        <TableHead className="text-right">Internal Tonnage</TableHead>
                                        <TableHead className="text-right">Outsource Trips</TableHead>
                                        <TableHead className="text-right">Outsource Tonnage</TableHead>
                                        <TableHead className="text-right">Revenue</TableHead>
                                        <TableHead className="text-right">Total Cost</TableHead>
                                        <TableHead className="text-right">Margin</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {operations?.data.length ? operations.data.map((operation) => (
                                        <TableRow key={operation.id}>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="font-medium text-sm">{operation.code}</span>
                                                    <span className="text-xs text-muted-foreground">{operation.customer?.name}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge className={`border ${operationStatusVariant(operation.status)} text-xs font-medium px-2 py-0.5`}>{operation.status}</Badge>
                                            </TableCell>
                                            <TableCell>{formatCurrency(operation.tariff)}</TableCell>
                                            <TableCell className="text-right">{operation.internal.trips}</TableCell>
                                            <TableCell className="text-right">{formatNumber(operation.internal.tonnage, 1)} MT</TableCell>
                                            <TableCell className="text-right">{operation.outsource.trips}</TableCell>
                                            <TableCell className="text-right">{formatNumber(operation.outsource.tonnage, 1)} MT</TableCell>
                                            <TableCell className="text-right">{formatCurrency(operation.revenue)}</TableCell>
                                            <TableCell className="text-right">{formatCurrency(operation.total_cost)}</TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex flex-col items-end">
                                                    <span>{formatCurrency(operation.margin)}</span>
                                                    <span className={`text-xs ${operation.margin_percent === null ? 'text-muted-foreground' : operation.margin_percent >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                                                        {operation.margin_percent === null ? '—' : `${operation.margin_percent.toFixed(1)}%`}
                                                    </span>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )) : (
                                        <TableRow>
                                            <TableCell colSpan={10} className="py-8 text-center text-muted-foreground">No operations for the selected period.</TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                        {operations && (
                            <InertiaPagination
                                className="p-4"
                                links={operations.links}
                                from={operations.from}
                                to={operations.to}
                                total={operations.total}
                                currentPage={operations.current_page}
                                lastPage={operations.last_page}
                            />
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}


