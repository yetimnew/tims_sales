import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { Head } from '@inertiajs/react';
import { type BreadcrumbItem } from '@/types';
import { Users, Truck, Link2 } from 'lucide-react';

interface Row { id: number; driver_name: string; truck_plate: string; assigned_date?: string; unassigned_date?: string; is_attached: number }

export default function DriverTruckAttachDetach({ rows }: { rows: Row[] }) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Reports', href: '/reports/driver-truck-attach-detach' },
        { title: 'Attach / Detach History', href: '/reports/driver-truck-attach-detach' },
    ];

    const attachedCount = rows.filter((r) => r.is_attached).length;
    const detachedCount = rows.filter((r) => !r.is_attached).length;
    const totalAssignments = rows.length;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Attach / Detach History" />
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-slate-100/60 dark:bg-slate-900/40">
                <div className="flex flex-1 flex-col gap-6 overflow-y-auto p-4 pb-10 sm:p-6 lg:p-10">
                    <header className="rounded-2xl border border-slate-200 bg-white/95 px-6 py-6 shadow-sm backdrop-blur dark:border-slate-800/70 dark:bg-slate-900/70">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                            <div className="space-y-2">
                                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500 dark:text-slate-400">Assignment Intelligence</p>
                                <h1 className="text-3xl font-semibold text-slate-900 dark:text-slate-50">Driver-Truck Attach / Detach History</h1>
                                <p className="max-w-3xl text-sm text-slate-600 dark:text-slate-300">
                                    Track driver-truck assignment history, monitor attachment patterns, and review assignment lifecycle across your fleet.
                                </p>
                            </div>
                        </div>
                    </header>

                    <section className="grid gap-3 sm:grid-cols-3">
                        <Card className="border border-slate-200 bg-white/95 shadow-sm dark:border-slate-800/70 dark:bg-slate-900/70">
                            <CardContent className="flex items-center gap-3 p-4">
                                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-sky-100 text-sky-600 dark:bg-sky-500/20 dark:text-sky-200">
                                    <Link2 className="h-5 w-5" />
                                </span>
                                <div className="space-y-0.5">
                                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Total Assignments</p>
                                    <p className="text-lg font-semibold text-slate-900 dark:text-slate-50">{totalAssignments.toLocaleString()}</p>
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="border border-slate-200 bg-white/95 shadow-sm dark:border-slate-800/70 dark:bg-slate-900/70">
                            <CardContent className="flex items-center gap-3 p-4">
                                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-200">
                                    <Users className="h-5 w-5" />
                                </span>
                                <div className="space-y-0.5">
                                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Attached</p>
                                    <p className="text-lg font-semibold text-slate-900 dark:text-slate-50">{attachedCount.toLocaleString()}</p>
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="border border-slate-200 bg-white/95 shadow-sm dark:border-slate-800/70 dark:bg-slate-900/70">
                            <CardContent className="flex items-center gap-3 p-4">
                                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-600 dark:bg-slate-500/20 dark:text-slate-200">
                                    <Truck className="h-5 w-5" />
                                </span>
                                <div className="space-y-0.5">
                                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Detached</p>
                                    <p className="text-lg font-semibold text-slate-900 dark:text-slate-50">{detachedCount.toLocaleString()}</p>
                                </div>
                            </CardContent>
                        </Card>
                    </section>

                    <Card className="border border-slate-200 bg-white/95 shadow-sm dark:border-slate-800/70 dark:bg-slate-900/70">
                        <CardHeader className="space-y-3 border-b border-slate-200/60 pb-5 dark:border-slate-700/60">
                            <div className="space-y-1">
                                <CardTitle className="text-lg font-semibold text-slate-900 dark:text-slate-50">Assignment History</CardTitle>
                                <CardDescription className="text-sm">Complete record of driver-truck assignments and detachments.</CardDescription>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader className="bg-slate-50/60 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-900/60 dark:text-slate-400">
                                        <TableRow className="divide-x divide-slate-200/40 dark:divide-slate-800/50">
                                            <TableHead className="whitespace-nowrap">Driver</TableHead>
                                            <TableHead className="whitespace-nowrap">Truck</TableHead>
                                            <TableHead className="whitespace-nowrap text-right">Assigned Date</TableHead>
                                            <TableHead className="whitespace-nowrap text-right">Unassigned Date</TableHead>
                                            <TableHead className="whitespace-nowrap text-right">Status</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {rows.length > 0 ? (
                                            rows.map((r) => (
                                                <TableRow key={r.id} className="divide-x divide-slate-100 hover:bg-slate-50/70 dark:divide-slate-800/50 dark:hover:bg-slate-900/50">
                                                    <TableCell className="whitespace-nowrap font-medium text-slate-900 dark:text-slate-100">{r.driver_name}</TableCell>
                                                    <TableCell className="whitespace-nowrap text-slate-600 dark:text-slate-400">{r.truck_plate}</TableCell>
                                                    <TableCell className="whitespace-nowrap text-right text-slate-600 dark:text-slate-400">
                                                        {r.assigned_date ? new Date(r.assigned_date).toLocaleDateString() : '—'}
                                                    </TableCell>
                                                    <TableCell className="whitespace-nowrap text-right text-slate-600 dark:text-slate-400">
                                                        {r.unassigned_date ? new Date(r.unassigned_date).toLocaleDateString() : '—'}
                                                    </TableCell>
                                                    <TableCell className="whitespace-nowrap text-right">
                                                        {r.is_attached ? (
                                                            <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200">Attached</Badge>
                                                        ) : (
                                                            <Badge variant="outline">Detached</Badge>
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        ) : (
                                            <TableRow>
                                                <TableCell colSpan={5} className="py-10 text-center text-sm text-muted-foreground">
                                                    No assignment history available.
                                                </TableCell>
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








