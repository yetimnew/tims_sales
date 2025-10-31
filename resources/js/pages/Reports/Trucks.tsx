import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { Head } from '@inertiajs/react';
import { type BreadcrumbItem } from '@/types';

interface TruckStats {
    total_trucks?: number;
    active_trucks?: number;
    inactive_trucks?: number;
    average_purchase_price?: number;
    total_purchase_value?: number;
}

interface Paginated<T> {
    data?: T[];
    total?: number;
}

interface TruckRow {
    id: number;
    plate?: string;
    status?: string;
}

interface TrucksReportProps {
    truckStats?: TruckStats;
    trucks?: Paginated<TruckRow>;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Reports', href: '/reports/trucks' },
    { title: 'Trucks', href: '/reports/trucks' },
];

export default function TrucksReport({ truckStats, trucks }: TrucksReportProps) {
    const totals = {
        total: truckStats?.total_trucks ?? trucks?.total ?? 0,
        active: truckStats?.active_trucks ?? 0,
        inactive: truckStats?.inactive_trucks ?? 0,
        totalValue: truckStats?.total_purchase_value ?? 0,
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Truck Reports" />
            <div className="flex h-full flex-1 flex-col gap-3 overflow-hidden rounded-xl p-4">
                <div>
                    <h1 className="text-lg font-bold">Truck Reports</h1>
                    <p className="text-muted-foreground text-sm">Overview of fleet statistics</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm">Total Trucks</CardTitle>
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
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm">Total Purchase Value</CardTitle>
                        </CardHeader>
                        <CardContent className="p-3">
                            <div className="text-xl font-bold">${(totals.totalValue || 0).toLocaleString()}</div>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm">Recent Trucks</CardTitle>
                    </CardHeader>
                    <CardContent className="p-3">
                        <div className="text-sm text-muted-foreground">
                            {trucks?.data?.length ? (
                                <ul className="list-disc pl-4 space-y-1">
                                    {trucks.data.slice(0, 10).map((t) => (
                                        <li key={t.id}>
                                            <span className="font-medium">{t.plate || '—'}</span>
                                            <span className="ml-2 text-xs opacity-70">{t.status || ''}</span>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <span>No trucks found.</span>
                            )}
                        </div>
                    </CardContent>
                </Card>

                <div className="text-xs text-muted-foreground">Coming soon: detailed filters, charts, and export.</div>
            </div>
        </AppLayout>
    );
}



