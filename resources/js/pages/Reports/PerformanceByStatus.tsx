import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import AppLayout from '@/layouts/app-layout';
import { Head, router } from '@inertiajs/react';
import { type BreadcrumbItem } from '@/types';
import * as React from 'react';

interface SummaryRow { status_name: string; count: number }
interface LatestRow { plate: string; status_name: string; registerddate: string }

export default function PerformanceByStatus({ date, summary, latest }: { date: string; summary: SummaryRow[]; latest: LatestRow[] }) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Reports', href: '/reports/performance-by-status' },
        { title: 'Performance by Status', href: '/reports/performance-by-status' },
    ];
    const [d, setD] = React.useState(date);
    const onApply = () => router.get('/reports/performance-by-status', { date: d }, { preserveState: true });

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Performance by Status" />
            <div className="flex h-full flex-1 flex-col gap-3 overflow-hidden rounded-xl p-4">
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">Date</span>
                        <Input type="date" value={d} onChange={(e) => setD(e.target.value)} className="w-40" />
                    </div>
                    <button onClick={onApply} className="px-3 py-2 border rounded-md text-sm">Apply</button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <Card>
                        <CardHeader className="pb-3"><CardTitle className="text-sm">Summary</CardTitle></CardHeader>
                        <CardContent className="p-0">
                            <div className="rounded-lg border overflow-auto max-h-[60vh]">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="sticky top-0 bg-background z-10">
                                            <TableHead>Status</TableHead>
                                            <TableHead className="text-right">Count</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {summary.length ? summary.map((r, idx) => (
                                            <TableRow key={`${r.status_name}-${idx}`}>
                                                <TableCell>{r.status_name}</TableCell>
                                                <TableCell className="text-right">{r.count}</TableCell>
                                            </TableRow>
                                        )) : (
                                            <TableRow>
                                                <TableCell colSpan={2} className="py-10 text-center text-muted-foreground">No data.</TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-3"><CardTitle className="text-sm">Latest</CardTitle></CardHeader>
                        <CardContent className="p-0">
                            <div className="rounded-lg border overflow-auto max-h-[60vh]">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="sticky top-0 bg-background z-10">
                                            <TableHead>Plate</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead className="text-right">Time</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {latest.length ? latest.map((r, idx) => (
                                            <TableRow key={`${r.plate}-${idx}`}>
                                                <TableCell>{r.plate}</TableCell>
                                                <TableCell>{r.status_name}</TableCell>
                                                <TableCell className="text-right">{new Date(r.registerddate).toLocaleString()}</TableCell>
                                            </TableRow>
                                        )) : (
                                            <TableRow>
                                                <TableCell colSpan={3} className="py-10 text-center text-muted-foreground">No data.</TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}








