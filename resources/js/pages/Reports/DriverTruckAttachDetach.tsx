import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { Head } from '@inertiajs/react';
import { type BreadcrumbItem } from '@/types';

interface Row { id: number; driver_name: string; truck_plate: string; assigned_date?: string; unassigned_date?: string; is_attached: number }

export default function DriverTruckAttachDetach({ rows }: { rows: Row[] }) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Reports', href: '/reports/driver-truck-attach-detach' },
        { title: 'Attach / Detach History', href: '/reports/driver-truck-attach-detach' },
    ];
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Attach / Detach History" />
            <div className="flex h-full flex-1 flex-col gap-3 overflow-hidden rounded-xl p-4">
                <Card>
                    <CardHeader className="pb-3"><CardTitle className="text-sm">Driver-Truck Assignments</CardTitle></CardHeader>
                    <CardContent className="p-0">
                        <div className="rounded-lg border overflow-auto max-h-[60vh]">
                            <Table>
                                <TableHeader>
                                    <TableRow className="sticky top-0 bg-background z-10">
                                        <TableHead>Driver</TableHead>
                                        <TableHead>Truck</TableHead>
                                        <TableHead className="text-right">Assigned</TableHead>
                                        <TableHead className="text-right">Unassigned</TableHead>
                                        <TableHead className="text-right">Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {rows.length ? rows.map((r) => (
                                        <TableRow key={r.id}>
                                            <TableCell>{r.driver_name}</TableCell>
                                            <TableCell>{r.truck_plate}</TableCell>
                                            <TableCell className="text-right">{r.assigned_date ? new Date(r.assigned_date).toLocaleDateString() : '—'}</TableCell>
                                            <TableCell className="text-right">{r.unassigned_date ? new Date(r.unassigned_date).toLocaleDateString() : '—'}</TableCell>
                                            <TableCell className="text-right">{r.is_attached ? 'Attached' : 'Detached'}</TableCell>
                                        </TableRow>
                                    )) : (
                                        <TableRow>
                                            <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">No data.</TableCell>
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








