import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { Head } from '@inertiajs/react';
import { type BreadcrumbItem } from '@/types';

interface MaintenanceStats {
    total_maintenance_records?: number;
    scheduled_maintenance?: number;
    completed_maintenance?: number;
    overdue_maintenance?: number;
    total_maintenance_cost?: number;
}

interface MaintenanceReportProps {
    maintenanceStats?: MaintenanceStats;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Reports', href: '/reports/maintenance' },
    { title: 'Maintenance', href: '/reports/maintenance' },
];

export default function MaintenanceReport({ maintenanceStats }: MaintenanceReportProps) {
    const totals = {
        total: maintenanceStats?.total_maintenance_records ?? 0,
        scheduled: maintenanceStats?.scheduled_maintenance ?? 0,
        completed: maintenanceStats?.completed_maintenance ?? 0,
        overdue: maintenanceStats?.overdue_maintenance ?? 0,
        cost: maintenanceStats?.total_maintenance_cost ?? 0,
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Maintenance Reports" />
            <div className="flex h-full flex-1 flex-col gap-3 overflow-hidden rounded-xl p-4">
                <div>
                    <h1 className="text-lg font-bold">Maintenance Reports</h1>
                    <p className="text-muted-foreground text-sm">Status and costs overview</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm">Total Records</CardTitle>
                        </CardHeader>
                        <CardContent className="p-3">
                            <div className="text-xl font-bold">{totals.total}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm">Scheduled</CardTitle>
                        </CardHeader>
                        <CardContent className="p-3">
                            <div className="text-xl font-bold">{totals.scheduled}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm">Completed</CardTitle>
                        </CardHeader>
                        <CardContent className="p-3">
                            <div className="text-xl font-bold">{totals.completed}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm">Overdue</CardTitle>
                        </CardHeader>
                        <CardContent className="p-3">
                            <div className="text-xl font-bold">{totals.overdue}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm">Total Cost</CardTitle>
                        </CardHeader>
                        <CardContent className="p-3">
                            <div className="text-xl font-bold">${Number(totals.cost).toLocaleString()}</div>
                        </CardContent>
                    </Card>
                </div>

                <div className="text-xs text-muted-foreground">Coming soon: breakdown by type and upcoming schedule.</div>
            </div>
        </AppLayout>
    );
}



