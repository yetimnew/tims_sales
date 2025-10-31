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

interface Totals { trips: number; tonnage: number; avg_load_factor_pct: number | null; empty_run_rate_pct: number | null }
interface LaneRow { from_name: string; to_name: string; trips: number; tonnage: number; empty_runs: number; load_factor_pct: number | null }
interface CustomerRow { customer_id: number; customer_name: string; trips: number; tonnage: number; empty_runs: number; load_factor_pct: number | null }

interface Props {
    filters: { from: string; to: string; capacity_tons: number };
    totals: Totals;
    lanes: LaneRow[];
    customers: CustomerRow[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Reports', href: '/reports/capacity-load' },
    { title: 'Capacity & Load Factor', href: '/reports/capacity-load' },
];

export default function CapacityLoad({ filters, totals, lanes, customers }: Props) {
    const [from, setFrom] = React.useState(filters.from);
    const [to, setTo] = React.useState(filters.to);
    const [capacity, setCapacity] = React.useState<number>(filters.capacity_tons);
    const onApply = () => router.get('/reports/capacity-load', { from, to, capacity_tons: capacity }, { preserveState: true });

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Capacity & Load Factor" />
            <div className="flex h-full flex-1 flex-col gap-3 overflow-hidden rounded-xl p-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-lg font-bold">Capacity & Load Factor</h1>
                        <p className="text-muted-foreground text-sm">Tonnage vs capacity, lane/customer load factor, empty runs</p>
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
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">Capacity (MT)</span>
                            <Input type="number" value={capacity} onChange={(e) => setCapacity(Number(e.target.value))} className="w-28" />
                        </div>
                        <button onClick={onApply} className="px-3 py-2 border rounded-md text-sm">Apply</button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <Card><CardHeader className="pb-3"><CardTitle className="text-sm">Trips</CardTitle></CardHeader><CardContent><div className="text-xl font-bold">{totals.trips}</div></CardContent></Card>
                    <Card><CardHeader className="pb-3"><CardTitle className="text-sm">Tonnage</CardTitle></CardHeader><CardContent><div className="text-xl font-bold">{Number(totals.tonnage).toLocaleString()}</div></CardContent></Card>
                    <Card><CardHeader className="pb-3"><CardTitle className="text-sm">Avg Load Factor</CardTitle></CardHeader><CardContent><div className="text-xl font-bold">{totals.avg_load_factor_pct === null ? '—' : `${totals.avg_load_factor_pct.toFixed(2)}%`}</div></CardContent></Card>
                    <Card><CardHeader className="pb-3"><CardTitle className="text-sm">Empty Run Rate</CardTitle></CardHeader><CardContent><div className="text-xl font-bold">{totals.empty_run_rate_pct === null ? '—' : `${totals.empty_run_rate_pct.toFixed(2)}%`}</div></CardContent></Card>
                </div>

                <Card>
                    <CardHeader className="pb-3"><CardTitle className="text-sm">By Lane</CardTitle></CardHeader>
                    <CardContent className="p-0">
                        <div className="rounded-lg border overflow-auto max-h-[60vh]">
                            <Table>
                                <TableHeader>
                                    <TableRow className="sticky top-0 bg-background z-10">
                                        <TableHead>From</TableHead>
                                        <TableHead>To</TableHead>
                                        <TableHead className="text-right">Trips</TableHead>
                                        <TableHead className="text-right">Tonnage</TableHead>
                                        <TableHead className="text-right">Empty Runs</TableHead>
                                        <TableHead className="text-right">Load Factor %</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {lanes.length ? lanes.map((l, idx) => (
                                        <TableRow key={`${l.from_name}-${l.to_name}-${idx}`}>
                                            <TableCell>{l.from_name}</TableCell>
                                            <TableCell>{l.to_name}</TableCell>
                                            <TableCell className="text-right">{l.trips}</TableCell>
                                            <TableCell className="text-right">{Number(l.tonnage).toLocaleString()}</TableCell>
                                            <TableCell className="text-right">{l.empty_runs}</TableCell>
                                            <TableCell className="text-right">{l.load_factor_pct === null ? '—' : `${l.load_factor_pct.toFixed(2)}%`}</TableCell>
                                        </TableRow>
                                    )) : (
                                        <TableRow>
                                            <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">No data for selected period.</TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-3"><CardTitle className="text-sm">By Customer</CardTitle></CardHeader>
                    <CardContent className="p-0">
                        <div className="rounded-lg border overflow-auto max-h-[60vh]">
                            <Table>
                                <TableHeader>
                                    <TableRow className="sticky top-0 bg-background z-10">
                                        <TableHead>Customer</TableHead>
                                        <TableHead className="text-right">Trips</TableHead>
                                        <TableHead className="text-right">Tonnage</TableHead>
                                        <TableHead className="text-right">Empty Runs</TableHead>
                                        <TableHead className="text-right">Load Factor %</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {customers.length ? customers.map((c) => (
                                        <TableRow key={c.customer_id}>
                                            <TableCell>{c.customer_name}</TableCell>
                                            <TableCell className="text-right">{c.trips}</TableCell>
                                            <TableCell className="text-right">{Number(c.tonnage).toLocaleString()}</TableCell>
                                            <TableCell className="text-right">{c.empty_runs}</TableCell>
                                            <TableCell className="text-right">{c.load_factor_pct === null ? '—' : `${c.load_factor_pct.toFixed(2)}%`}</TableCell>
                                        </TableRow>
                                    )) : (
                                        <TableRow>
                                            <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">No data for selected period.</TableCell>
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







