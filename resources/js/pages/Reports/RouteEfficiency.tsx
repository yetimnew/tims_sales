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

interface Totals { lanes: number; trips: number; avg_cost_per_km: number | null }
interface LaneRow {
    from_name: string;
    to_name: string;
    planned_km: number | null;
    actual_avg_km: number;
    cost_per_km: number | null;
    trips: number;
    detour_pct: number | null;
}

interface Props {
    filters: { from: string; to: string };
    totals: Totals;
    lanes: LaneRow[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Reports', href: '/reports/route-efficiency' },
    { title: 'Route & Distance Efficiency', href: '/reports/route-efficiency' },
];

export default function RouteEfficiency({ filters, totals, lanes }: Props) {
    const [from, setFrom] = React.useState(filters.from);
    const [to, setTo] = React.useState(filters.to);
    const onApply = () => router.get('/reports/route-efficiency', { from, to }, { preserveState: true });

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Route & Distance Efficiency" />
            <div className="flex h-full flex-1 flex-col gap-3 overflow-hidden rounded-xl p-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-lg font-bold">Route & Distance Efficiency</h1>
                        <p className="text-muted-foreground text-sm">Planned vs actual distance, cost per km, detours</p>
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
                    <Card><CardHeader className="pb-3"><CardTitle className="text-sm">Lanes</CardTitle></CardHeader><CardContent><div className="text-xl font-bold">{totals.lanes}</div></CardContent></Card>
                    <Card><CardHeader className="pb-3"><CardTitle className="text-sm">Trips</CardTitle></CardHeader><CardContent><div className="text-xl font-bold">{totals.trips}</div></CardContent></Card>
                    <Card><CardHeader className="pb-3"><CardTitle className="text-sm">Avg Cost / Km</CardTitle></CardHeader><CardContent><div className="text-xl font-bold">{totals.avg_cost_per_km === null ? '—' : `$${totals.avg_cost_per_km.toFixed(2)}`}</div></CardContent></Card>
                </div>

                <Card className="flex-1">
                    <CardHeader className="pb-3"><CardTitle className="text-sm">Lanes</CardTitle></CardHeader>
                    <CardContent className="p-0">
                        <div className="rounded-lg border overflow-auto max-h-[60vh]">
                            <Table>
                                <TableHeader>
                                    <TableRow className="sticky top-0 bg-background z-10">
                                        <TableHead>From</TableHead>
                                        <TableHead>To</TableHead>
                                        <TableHead className="text-right">Planned Km</TableHead>
                                        <TableHead className="text-right">Actual Avg Km</TableHead>
                                        <TableHead className="text-right">Cost / Km</TableHead>
                                        <TableHead className="text-right">Trips</TableHead>
                                        <TableHead className="text-right">Detour %</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {lanes.length ? lanes.map((l, idx) => (
                                        <TableRow key={`${l.from_name}-${l.to_name}-${idx}`}>
                                            <TableCell>{l.from_name}</TableCell>
                                            <TableCell>{l.to_name}</TableCell>
                                            <TableCell className="text-right">{l.planned_km === null ? '—' : Number(l.planned_km).toLocaleString()}</TableCell>
                                            <TableCell className="text-right">{Number(l.actual_avg_km).toLocaleString()}</TableCell>
                                            <TableCell className="text-right">{l.cost_per_km === null ? '—' : `$${Number(l.cost_per_km).toFixed(2)}`}</TableCell>
                                            <TableCell className="text-right">{l.trips}</TableCell>
                                            <TableCell className="text-right">{l.detour_pct === null ? '—' : `${l.detour_pct.toFixed(2)}%`}</TableCell>
                                        </TableRow>
                                    )) : (
                                        <TableRow>
                                            <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">No data for selected period.</TableCell>
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








