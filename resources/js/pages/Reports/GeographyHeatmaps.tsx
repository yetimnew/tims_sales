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

interface RegionRow { name: string; trips: number; tonnage: number; revenue: number }
interface ZoneRow { name: string; trips: number; tonnage: number; revenue: number }
interface WoredaRow { name: string; trips: number; tonnage: number; revenue: number }
interface PlaceRow { name: string; trips: number; tonnage: number; revenue: number }
interface RegionTrend { region: string; series: { month: string; revenue: number }[] }

interface Props {
    filters: { from: string; to: string };
    regions: RegionRow[];
    zones: ZoneRow[];
    woredas: WoredaRow[];
    places: PlaceRow[];
    regionTrends: RegionTrend[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Reports', href: '/reports/geography-heatmaps' },
    { title: 'Geographic Heatmaps', href: '/reports/geography-heatmaps' },
];

export default function GeographyHeatmaps({ filters, regions, zones, woredas, places, regionTrends }: Props) {
    const [from, setFrom] = React.useState(filters.from);
    const [to, setTo] = React.useState(filters.to);
    const onApply = () => router.get('/reports/geography-heatmaps', { from, to }, { preserveState: true });

    const renderTable = (title: string, rows: { name: string; trips: number; tonnage: number; revenue: number }[]) => (
        <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm">{title}</CardTitle></CardHeader>
            <CardContent className="p-0">
                <div className="rounded-lg border overflow-auto max-h-[60vh]">
                    <Table>
                        <TableHeader>
                            <TableRow className="sticky top-0 bg-background z-10">
                                <TableHead>Name</TableHead>
                                <TableHead className="text-right">Trips</TableHead>
                                <TableHead className="text-right">Tonnage</TableHead>
                                <TableHead className="text-right">Revenue</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {rows.length ? rows.map((r, idx) => (
                                <TableRow key={`${r.name}-${idx}`}>
                                    <TableCell>{r.name}</TableCell>
                                    <TableCell className="text-right">{r.trips}</TableCell>
                                    <TableCell className="text-right">{Number(r.tonnage).toLocaleString()}</TableCell>
                                    <TableCell className="text-right">${Number(r.revenue).toLocaleString()}</TableCell>
                                </TableRow>
                            )) : (
                                <TableRow>
                                    <TableCell colSpan={4} className="py-10 text-center text-muted-foreground">No data for selected period.</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Geographic Heatmaps" />
            <div className="flex h-full flex-1 flex-col gap-3 overflow-hidden rounded-xl p-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-lg font-bold">Geographic Heatmaps</h1>
                        <p className="text-muted-foreground text-sm">Trips, tonnage, revenue by region/zone/woreda/place</p>
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {renderTable('Regions', regions)}
                    {renderTable('Zones', zones)}
                    {renderTable('Woredas', woredas)}
                    {renderTable('Places', places)}
                </div>

                {/* Region trend placeholder (tabular for now) */}
                <Card>
                    <CardHeader className="pb-3"><CardTitle className="text-sm">Regional Revenue Trend (Monthly)</CardTitle></CardHeader>
                    <CardContent className="p-0">
                        <div className="rounded-lg border overflow-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Region</TableHead>
                                        <TableHead>Series (Month: Revenue)</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {regionTrends.length ? regionTrends.map((t, idx) => (
                                        <TableRow key={`${t.region}-${idx}`}>
                                            <TableCell>{t.region}</TableCell>
                                            <TableCell className="text-sm text-muted-foreground">
                                                {t.series.map(s => `${s.month}: $${Number(s.revenue).toLocaleString()}`).join('  |  ')}
                                            </TableCell>
                                        </TableRow>
                                    )) : (
                                        <TableRow>
                                            <TableCell colSpan={2} className="py-6 text-center text-muted-foreground">No trend data.</TableCell>
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








