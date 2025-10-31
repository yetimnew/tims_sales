import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { Head } from '@inertiajs/react';
import { type BreadcrumbItem } from '@/types';

interface DriverStats {
    total_drivers?: number;
    active_drivers?: number;
    inactive_drivers?: number;
}

interface DriversReportProps {
    driverStats?: DriverStats;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Reports', href: '/reports/drivers' },
    { title: 'Drivers', href: '/reports/drivers' },
];

export default function DriversReport({ driverStats }: DriversReportProps) {
    const totals = {
        total: driverStats?.total_drivers ?? 0,
        active: driverStats?.active_drivers ?? 0,
        inactive: driverStats?.inactive_drivers ?? 0,
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Driver Reports" />
            <div className="flex h-full flex-1 flex-col gap-3 overflow-hidden rounded-xl p-4">
                <div>
                    <h1 className="text-lg font-bold">Driver Reports</h1>
                    <p className="text-muted-foreground text-sm">Overview of driver statistics</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm">Total Drivers</CardTitle>
                        </CardHeader>
                        <CardContent className="p-3">
                            <div className="text-xl font-bold">{totals.total}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm">Active</CardTitle>
                        </CardHeader>
                        <CardContent className="p-3">
                            <div className="text-xl font-bold">{totals.active}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm">Inactive</CardTitle>
                        </CardHeader>
                        <CardContent className="p-3">
                            <div className="text-xl font-bold">{totals.inactive}</div>
                        </CardContent>
                    </Card>
                </div>

                <div className="text-xs text-muted-foreground">Coming soon: breakdown by zone, assignments, and trends.</div>
            </div>
        </AppLayout>
    );
}



