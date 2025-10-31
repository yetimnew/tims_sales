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
import { ReportHeader } from '@/components/report-header';
import { KpiCard } from '@/components/kpi-card';
import { type BreadcrumbItem } from '@/types';
import * as React from 'react';

interface FuelTotals {
    totalFuelLiters: number;
    totalFuelCost: number;
    totalDistanceKm: number;
}

interface FuelSummary {
    efficiencyKmPerLiter: number | null;
    costPerKm: number | null;
}

interface BreakdownRow {
    truck_id: number;
    plate: string;
    total_liters: number;
    total_cost: number;
    distance_km: number;
    efficiency_km_per_liter: number | null;
    cost_per_km: number | null;
}

interface FuelEfficiencyProps {
    filters: { from: string; to: string; truck_id?: number | null };
    totals: FuelTotals;
    summary: FuelSummary;
    breakdown: BreakdownRow[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Reports', href: '/reports/fuel-efficiency' },
    { title: 'Fuel Efficiency & Cost', href: '/reports/fuel-efficiency' },
];

export default function FuelEfficiency({ filters, totals, summary, breakdown }: FuelEfficiencyProps) {
    const [from, setFrom] = React.useState(filters.from);
    const [to, setTo] = React.useState(filters.to);

    const onApply = () => {
        router.get('/reports/fuel-efficiency', { from, to }, { preserveState: true });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Fuel Efficiency & Cost" />
            <div className="flex h-full flex-1 flex-col gap-3 overflow-hidden rounded-xl p-4">
                <ReportHeader title="Fuel Efficiency & Cost" subtitle="Benchmark trucks by km/l and cost per km" from={from} to={to} onApply={(f, t) => router.get('/reports/fuel-efficiency', { from: f, to: t }, { preserveState: true })} />

                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <KpiCard title="Total Liters" value={Number(totals.totalFuelLiters)} />
                    <KpiCard title="Total Cost" value={`$${Number(totals.totalFuelCost).toLocaleString()}`} />
                    <KpiCard title="Total Distance" value={`${Number(totals.totalDistanceKm).toLocaleString()} km`} />
                    <KpiCard title="Avg Cost / Km" value={summary.costPerKm !== null ? `$${summary.costPerKm.toFixed(2)}` : '—'} />
                </div>

                <Card className="flex-1">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm">Per-truck Efficiency</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="rounded-lg border overflow-auto max-h-[60vh]">
                            <Table>
                                <TableHeader>
                                    <TableRow className="sticky top-0 bg-background z-10">
                                        <TableHead>Truck</TableHead>
                                        <TableHead className="text-right">Distance (km)</TableHead>
                                        <TableHead className="text-right">Liters</TableHead>
                                        <TableHead className="text-right">Cost</TableHead>
                                        <TableHead className="text-right">Km/L</TableHead>
                                        <TableHead className="text-right">Cost/Km</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {breakdown.length ? breakdown.map((row) => (
                                        <TableRow key={row.truck_id}>
                                            <TableCell className="font-medium">{row.plate}</TableCell>
                                            <TableCell className="text-right">{Number(row.distance_km).toLocaleString()}</TableCell>
                                            <TableCell className="text-right">{Number(row.total_liters).toLocaleString()}</TableCell>
                                            <TableCell className="text-right">${Number(row.total_cost).toLocaleString()}</TableCell>
                                            <TableCell className="text-right">{row.efficiency_km_per_liter !== null ? row.efficiency_km_per_liter.toFixed(2) : '—'}</TableCell>
                                            <TableCell className="text-right">{row.cost_per_km !== null ? `$${row.cost_per_km.toFixed(2)}` : '—'}</TableCell>
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
            </div>
        </AppLayout>
    );
}


