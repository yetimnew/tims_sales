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

interface Internal { costPerKm: number | null }
interface VendorRow {
    outsource_id: number;
    name: string;
    trips: number;
    distance_km: number;
    cost: number;
    cost_per_km: number | null;
    completed_rate_pct: number | null;
    delta_vs_internal_cost_per_km: number | null;
}

interface Props {
    filters: { from: string; to: string };
    internal: Internal;
    vendors: VendorRow[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Reports', href: '/reports/outsource-performance' },
    { title: 'Outsource Performance', href: '/reports/outsource-performance' },
];

export default function OutsourcePerformance({ filters, internal, vendors }: Props) {
    const [from, setFrom] = React.useState(filters.from);
    const [to, setTo] = React.useState(filters.to);
    const onApply = () => router.get('/reports/outsource-performance', { from, to }, { preserveState: true });

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Outsource Performance" />
            <div className="flex h-full flex-1 flex-col gap-3 overflow-hidden rounded-xl p-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-lg font-bold">Outsource Vendor Performance</h1>
                        <p className="text-muted-foreground text-sm">On-time %, cost differential vs internal, quality rate</p>
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
                    <Card><CardHeader className="pb-3"><CardTitle className="text-sm">Internal Cost / Km</CardTitle></CardHeader><CardContent><div className="text-xl font-bold">{internal.costPerKm === null ? '—' : `$${internal.costPerKm.toFixed(2)}`}</div></CardContent></Card>
                    <Card><CardHeader className="pb-3"><CardTitle className="text-sm">Vendors</CardTitle></CardHeader><CardContent><div className="text-xl font-bold">{vendors.length}</div></CardContent></Card>
                    <Card><CardHeader className="pb-3"><CardTitle className="text-sm">Total Trips</CardTitle></CardHeader><CardContent><div className="text-xl font-bold">{vendors.reduce((s, v) => s + v.trips, 0)}</div></CardContent></Card>
                </div>

                <Card className="flex-1">
                    <CardHeader className="pb-3"><CardTitle className="text-sm">Vendors</CardTitle></CardHeader>
                    <CardContent className="p-0">
                        <div className="rounded-lg border overflow-auto max-h-[60vh]">
                            <Table>
                                <TableHeader>
                                    <TableRow className="sticky top-0 bg-background z-10">
                                        <TableHead>Vendor</TableHead>
                                        <TableHead className="text-right">Trips</TableHead>
                                        <TableHead className="text-right">Distance (km)</TableHead>
                                        <TableHead className="text-right">Cost</TableHead>
                                        <TableHead className="text-right">Cost / Km</TableHead>
                                        <TableHead className="text-right">Completed %</TableHead>
                                        <TableHead className="text-right">Δ vs Internal (Cost/Km)</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {vendors.length ? vendors.map((v) => (
                                        <TableRow key={v.outsource_id}>
                                            <TableCell>{v.name}</TableCell>
                                            <TableCell className="text-right">{v.trips}</TableCell>
                                            <TableCell className="text-right">{Number(v.distance_km).toLocaleString()}</TableCell>
                                            <TableCell className="text-right">${Number(v.cost).toLocaleString()}</TableCell>
                                            <TableCell className="text-right">{v.cost_per_km === null ? '—' : `$${v.cost_per_km.toFixed(2)}`}</TableCell>
                                            <TableCell className="text-right">{v.completed_rate_pct === null ? '—' : `${v.completed_rate_pct.toFixed(2)}%`}</TableCell>
                                            <TableCell className="text-right">{v.delta_vs_internal_cost_per_km === null ? '—' : `$${v.delta_vs_internal_cost_per_km.toFixed(2)}`}</TableCell>
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







