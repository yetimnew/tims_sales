import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import AppLayout from '@/layouts/app-layout';
import { Head, router } from '@inertiajs/react';
import { type BreadcrumbItem } from '@/types';
import * as React from 'react';

interface Row { driver_id: number; driver_name: string; trips: number; tonnage: number; distance_km: number; revenue: number; cost: number; profit: number; margin_percent: number | null }

export default function PerformanceByDriver({ filters, rows }: { filters: { from: string; to: string; driver_id?: number | null }; rows: Row[] }) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Reports', href: '/reports/performance-by-driver' },
        { title: 'Performance by Driver', href: '/reports/performance-by-driver' },
    ];
    const [from, setFrom] = React.useState(filters.from);
    const [to, setTo] = React.useState(filters.to);
    const onApply = () => router.get('/reports/performance-by-driver', { from, to }, { preserveState: true });

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Performance by Driver" />
            <div className="flex h-full flex-1 flex-col gap-3 overflow-hidden rounded-xl p-4">
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

                <Card>
                    <CardHeader className="pb-3"><CardTitle className="text-sm">Drivers</CardTitle></CardHeader>
                    <CardContent className="p-0">
                        <div className="rounded-lg border overflow-auto max-h-[60vh]">
                            <Table>
                                <TableHeader>
                                    <TableRow className="sticky top-0 bg-background z-10">
                                        <TableHead>Driver</TableHead>
                                        <TableHead className="text-right">Trips</TableHead>
                                        <TableHead className="text-right">Tonnage</TableHead>
                                        <TableHead className="text-right">Distance</TableHead>
                                        <TableHead className="text-right">Revenue</TableHead>
                                        <TableHead className="text-right">Cost</TableHead>
                                        <TableHead className="text-right">Profit</TableHead>
                                        <TableHead className="text-right">Margin %</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {rows.length ? rows.map((r) => (
                                        <TableRow key={r.driver_id}>
                                            <TableCell>{r.driver_name}</TableCell>
                                            <TableCell className="text-right">{r.trips}</TableCell>
                                            <TableCell className="text-right">{Number(r.tonnage).toLocaleString()}</TableCell>
                                            <TableCell className="text-right">{Number(r.distance_km).toLocaleString()}</TableCell>
                                            <TableCell className="text-right">${Number(r.revenue).toLocaleString()}</TableCell>
                                            <TableCell className="text-right">${Number(r.cost).toLocaleString()}</TableCell>
                                            <TableCell className="text-right">${Number(r.profit).toLocaleString()}</TableCell>
                                            <TableCell className="text-right">{r.margin_percent === null ? '—' : `${r.margin_percent.toFixed(2)}%`}</TableCell>
                                        </TableRow>
                                    )) : (
                                        <TableRow>
                                            <TableCell colSpan={8} className="py-10 text-center text-muted-foreground">No data.</TableCell>
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







