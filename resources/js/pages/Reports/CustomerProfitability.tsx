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

interface Totals { revenue: number; cost: number; profit: number }
interface CustomerRow {
    customer_id: number;
    customer_name: string;
    revenue: number;
    cost: number;
    profit: number;
    margin_percent: number | null;
    lanes_used: number;
    trips: number;
    tonnage: number;
}

interface TrendRow { month: string; revenue: number; profit: number }

interface Props {
    filters: { from: string; to: string };
    totals: Totals;
    customers: CustomerRow[];
    trend: TrendRow[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Reports', href: '/reports/customer-profitability' },
    { title: 'Customer Profitability', href: '/reports/customer-profitability' },
];

export default function CustomerProfitability({ filters, totals, customers, trend }: Props) {
    const [from, setFrom] = React.useState(filters.from);
    const [to, setTo] = React.useState(filters.to);
    const onApply = () => router.get('/reports/customer-profitability', { from, to }, { preserveState: true });

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Customer Profitability" />
            <div className="flex h-full flex-1 flex-col gap-3 overflow-hidden rounded-xl p-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-lg font-bold">Customer Profitability</h1>
                        <p className="text-muted-foreground text-sm">Revenue, cost, margin per customer; lanes and trends</p>
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

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <Card><CardHeader className="pb-3"><CardTitle className="text-sm">Total Revenue</CardTitle></CardHeader><CardContent><div className="text-xl font-bold">${Number(totals.revenue).toLocaleString()}</div></CardContent></Card>
                    <Card><CardHeader className="pb-3"><CardTitle className="text-sm">Total Cost</CardTitle></CardHeader><CardContent><div className="text-xl font-bold">${Number(totals.cost).toLocaleString()}</div></CardContent></Card>
                    <Card><CardHeader className="pb-3"><CardTitle className="text-sm">Total Profit</CardTitle></CardHeader><CardContent><div className="text-xl font-bold">${Number(totals.profit).toLocaleString()}</div></CardContent></Card>
                </div>

                <Card className="flex-1">
                    <CardHeader className="pb-3"><CardTitle className="text-sm">Customers</CardTitle></CardHeader>
                    <CardContent className="p-0">
                        <div className="rounded-lg border overflow-auto max-h-[60vh]">
                            <Table>
                                <TableHeader>
                                    <TableRow className="sticky top-0 bg-background z-10">
                                        <TableHead>Customer</TableHead>
                                        <TableHead className="text-right">Revenue</TableHead>
                                        <TableHead className="text-right">Cost</TableHead>
                                        <TableHead className="text-right">Profit</TableHead>
                                        <TableHead className="text-right">Margin %</TableHead>
                                        <TableHead className="text-right">Lanes</TableHead>
                                        <TableHead className="text-right">Trips</TableHead>
                                        <TableHead className="text-right">Tonnage</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {customers.length ? customers.map((c) => (
                                        <TableRow key={c.customer_id}>
                                            <TableCell>{c.customer_name}</TableCell>
                                            <TableCell className="text-right">${Number(c.revenue).toLocaleString()}</TableCell>
                                            <TableCell className="text-right">${Number(c.cost).toLocaleString()}</TableCell>
                                            <TableCell className="text-right">${Number(c.profit).toLocaleString()}</TableCell>
                                            <TableCell className="text-right">{c.margin_percent === null ? '—' : `${c.margin_percent.toFixed(2)}%`}</TableCell>
                                            <TableCell className="text-right">{c.lanes_used}</TableCell>
                                            <TableCell className="text-right">{c.trips}</TableCell>
                                            <TableCell className="text-right">{Number(c.tonnage).toLocaleString()}</TableCell>
                                        </TableRow>
                                    )) : (
                                        <TableRow>
                                            <TableCell colSpan={8} className="py-10 text-center text-muted-foreground">No data for selected period.</TableCell>
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



