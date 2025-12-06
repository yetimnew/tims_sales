import { useMemo } from 'react';
import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { ReportHero } from '@/components/reports/report-hero';
import { ReportPageShell } from '@/components/reports/report-page-shell';
import { ReportSectionCard } from '@/components/reports/report-section-card';
import { ReportSummaryGrid } from '@/components/reports/report-summary-grid';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Link2, Unlink, Users, Truck } from 'lucide-react';

interface Row {
    id: number;
    driver_name: string;
    truck_plate: string;
    assigned_date?: string;
    unassigned_date?: string;
    is_attached: number;
}

export default function DriverTruckAttachDetach({ rows }: { rows: Row[] }) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Reports', href: '/reports/driver-truck-attach-detach' },
        { title: 'Attach / Detach History', href: '/reports/driver-truck-attach-detach' },
    ];

    const summaryItems = useMemo(() => {
        const totalRecords = rows.length;
        const currentlyAttached = rows.filter((row) => row.is_attached).length;
        const currentlyDetached = totalRecords - currentlyAttached;
        const uniqueDrivers = new Set(rows.map((row) => row.driver_name)).size;
        const uniqueTrucks = new Set(rows.map((row) => row.truck_plate)).size;

        return [
            {
                key: 'total-records',
                label: 'Assignment records',
                value: totalRecords.toLocaleString(),
                icon: <Link2 className="h-3.5 w-3.5" />,
                iconWrapperClassName: 'bg-slate-100 text-slate-600 dark:bg-slate-800/60 dark:text-slate-200',
            },
            {
                key: 'attached',
                label: 'Currently attached',
                value: currentlyAttached.toLocaleString(),
                icon: <Users className="h-3.5 w-3.5" />,
                iconWrapperClassName: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-200',
            },
            {
                key: 'detached',
                label: 'Currently detached',
                value: currentlyDetached.toLocaleString(),
                icon: <Unlink className="h-3.5 w-3.5" />,
                iconWrapperClassName: 'bg-rose-50 text-rose-600 dark:bg-rose-500/20 dark:text-rose-200',
            },
            {
                key: 'unique-trucks',
                label: 'Distinct trucks',
                value: uniqueTrucks.toLocaleString(),
                icon: <Truck className="h-3.5 w-3.5" />,
                iconWrapperClassName: 'bg-sky-50 text-sky-600 dark:bg-sky-500/20 dark:text-sky-200',
            },
        ];
    }, [rows]);

    const detailBadgeItems = useMemo(() => {
        const attachedCount = rows.filter((row) => row.is_attached).length;
        const detachedCount = rows.length - attachedCount;
        return [
            { key: 'rows', label: `${rows.length.toLocaleString()} total records` },
            { key: 'attached', label: `${attachedCount.toLocaleString()} attached` },
            { key: 'detached', label: `${detachedCount.toLocaleString()} detached` },
        ];
    }, [rows]);

    const formatDate = (value?: string) => {
        if (!value) return '—';
        const parsed = new Date(value);
        return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleDateString();
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Attach / Detach History" />
            <ReportPageShell>
                <ReportHero
                    eyebrow="Driver Operations"
                    title="Driver & truck attach / detach"
                    description="Audit how drivers are paired with trucks over time. Track active attachments, recent detachments, and the overall assignment footprint."
                />

                <ReportSummaryGrid items={summaryItems} />

                <ReportSectionCard
                    title="Driver-truck assignments"
                    description="Historic attachments between drivers and trucks, including the current status of each pairing."
                    badgeItems={detailBadgeItems}
                    contentClassName="p-0"
                >
                    <div className="max-h-[60vh] overflow-auto">
                        <Table>
                            <TableHeader className="sticky top-0 z-10 bg-white/95 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-900/95 dark:text-slate-400">
                                <TableRow className="divide-x divide-slate-200/40 dark:divide-slate-800/50">
                                    <TableHead>Driver</TableHead>
                                    <TableHead>Truck</TableHead>
                                    <TableHead className="text-right">Assigned</TableHead>
                                    <TableHead className="text-right">Unassigned</TableHead>
                                    <TableHead className="text-right">Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {rows.length > 0 ? (
                                    rows.map((row) => (
                                        <TableRow key={row.id} className="divide-x divide-slate-200/40 dark:divide-slate-800/50">
                                            <TableCell className="whitespace-nowrap font-medium text-slate-900 dark:text-slate-50">{row.driver_name}</TableCell>
                                            <TableCell className="whitespace-nowrap text-slate-700 dark:text-slate-200">{row.truck_plate}</TableCell>
                                            <TableCell className="whitespace-nowrap text-right text-slate-600 dark:text-slate-300">{formatDate(row.assigned_date)}</TableCell>
                                            <TableCell className="whitespace-nowrap text-right text-slate-600 dark:text-slate-300">{formatDate(row.unassigned_date)}</TableCell>
                                            <TableCell className="whitespace-nowrap text-right">
                                                <Badge variant={row.is_attached ? 'secondary' : 'outline'} className={row.is_attached ? 'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-200' : 'border-dashed text-slate-500'}>
                                                    {row.is_attached ? 'Attached' : 'Detached'}
                                                </Badge>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={5} className="py-10 text-center text-sm text-muted-foreground">
                                            No assignments available.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </ReportSectionCard>
            </ReportPageShell>
        </AppLayout>
    );
}








