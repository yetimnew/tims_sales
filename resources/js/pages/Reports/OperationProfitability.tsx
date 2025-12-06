import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import AppLayout from '@/layouts/app-layout';
import { Head, router } from '@inertiajs/react';
import { type BreadcrumbItem } from '@/types';
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
    const onApply = () => router.get('/reports/operation-profitability', { from, to }, { preserveState: true });

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Operation Profitability" />
            <div className="flex h-full flex-1 flex-col gap-3 overflow-hidden rounded-xl p-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-lg font-bold">Operation Profitability</h1>
                        <p className="text-muted-foreground text-sm">Profit, margin, and cost per km by operation</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">From</span>
                            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-40" />
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">To</span>
                            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-40" />
                        </div>
                        <button onClick={onApply} className="px-3 py-2 border rounded-md text-sm">Apply</button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <Card><CardHeader className="pb-3"><CardTitle className="text-sm">Total Revenue</CardTitle></CardHeader><CardContent><div className="text-xl font-bold">${Number(totals.revenue).toLocaleString()}</div></CardContent></Card>
                    <Card><CardHeader className="pb-3"><CardTitle className="text-sm">Total Cost</CardTitle></CardHeader><CardContent><div className="text-xl font-bold">${Number(totals.cost).toLocaleString()}</div></CardContent></Card>
                    <Card><CardHeader className="pb-3"><CardTitle className="text-sm">Total Profit</CardTitle></CardHeader><CardContent><div className="text-xl font-bold">${Number(totals.profit).toLocaleString()}</div></CardContent></Card>
                    <Card><CardHeader className="pb-3"><CardTitle className="text-sm">Operations</CardTitle></CardHeader><CardContent><div className="text-xl font-bold">{totals.operations}</div></CardContent></Card>
                </div>

                <Card className="flex-1">
                    <CardHeader className="pb-3"><CardTitle className="text-sm">Operations</CardTitle></CardHeader>
                    <CardContent className="p-0">
                        <div className="rounded-lg border overflow-auto max-h-[60vh]">
                            <Table>
                                <TableHeader>
                                    <TableRow className="sticky top-0 bg-background z-10">
                                        <TableHead>Operation</TableHead>
                                        <TableHead>Customer</TableHead>
                                        <TableHead>Region</TableHead>
                                        <TableHead className="text-right">Revenue</TableHead>
                                        <TableHead className="text-right">Cost</TableHead>
                                        <TableHead className="text-right">Profit</TableHead>
                                        <TableHead className="text-right">Margin %</TableHead>
                                        <TableHead className="text-right">Trips</TableHead>
                                        <TableHead className="text-right">Tonnage</TableHead>
                                        <TableHead className="text-right">Avg Km/Trip</TableHead>
                                        <TableHead className="text-right">Cost/Km</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {operations.length ? operations.map((o) => (
                                        <TableRow key={o.operation_id}>
                                            <TableCell>{o.code}</TableCell>
                                            <TableCell>{o.customer_name}</TableCell>
                                            <TableCell>{o.region_name}</TableCell>
                                            <TableCell className="text-right">${Number(o.revenue).toLocaleString()}</TableCell>
                                            <TableCell className="text-right">${Number(o.cost).toLocaleString()}</TableCell>
                                            <TableCell className="text-right">${Number(o.profit).toLocaleString()}</TableCell>
                                            <TableCell className="text-right">{o.margin_percent === null ? '—' : `${o.margin_percent.toFixed(2)}%`}</TableCell>
                                            <TableCell className="text-right">{o.trips}</TableCell>
                                            <TableCell className="text-right">{Number(o.tonnage).toLocaleString()}</TableCell>
                                            <TableCell className="text-right">{Number(o.avg_km_per_trip).toLocaleString()}</TableCell>
                                            <TableCell className="text-right">{o.cost_per_km === null ? '—' : `$${o.cost_per_km.toFixed(2)}`}</TableCell>
                                        </TableRow>
                                    )) : (
                                        <TableRow>
                                            <TableCell colSpan={11} className="py-10 text-center text-muted-foreground">No data for selected period.</TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}








