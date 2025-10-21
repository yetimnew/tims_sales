import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import {
    Truck,
    Users,
    Activity,
    TrendingUp,
    Calendar,
    BarChart3,
    Eye,
    Plus
} from 'lucide-react';



const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: dashboard().url,
    },
];

interface DashboardProps {
    stats: {
        totalTrucks: number;
        activeTrucks: number;
        totalDrivers: number;
        activeDrivers: number;
        totalOperations: number;
        openOperations: number;
        totalPerformances: number;
        returnedPerformances: number;
        notReturnedPerformances: number;
        totalTonnage: number;
    };
    dailyPerformance: Array<{
        date: string;
        tonnage: number;
    }>;
    operationsReport: Array<{
        customer_id: number;
        count: number;
        total_volume: number;
        customer: {
            name: string;
        };
    }>;
    statusBreakdown: Array<{
        satus: string;
        count: number;
    }>;
    recentPerformances: Array<{
        id: number;
        trip: string;
        DateDispach: string;
        CargoVolumMT: number;
        satus: string;
        driverTruck?: {
            id: number;
            driver?: {
                id: number;
                name: string;
            };
            truck?: {
                id: number;
                plate: string;
            };
        };
        origin?: {
            id: number;
            name: string;
        };
        destination?: {
            id: number;
            name: string;
        };
    }>;
}

export default function Dashboard({
    stats,
    dailyPerformance,
    operationsReport,
    statusBreakdown,
    recentPerformances
}: DashboardProps) {
    console.log('🔍 Dashboard - recentPerformances:', recentPerformances);
    console.log('🔍 Dashboard - first performance:', recentPerformances?.[0]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />
            <div className="flex flex-col gap-6 p-4 w-full">
                {/* Key Metrics */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Trucks</CardTitle>
                            <Truck className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.totalTrucks}</div>
                            <p className="text-xs text-muted-foreground">
                                {stats.activeTrucks} active
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Drivers</CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.totalDrivers}</div>
                            <p className="text-xs text-muted-foreground">
                                {stats.activeDrivers} active
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Operations</CardTitle>
                            <Activity className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.totalOperations}</div>
                            <p className="text-xs text-muted-foreground">
                                {stats.openOperations} open
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Tonnage</CardTitle>
                            <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.totalTonnage} MT</div>
                            <p className="text-xs text-muted-foreground">
                                {stats.totalPerformances} performances
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Performance Status */}
                <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                        <CardHeader>
                            <CardTitle>Performance Status</CardTitle>
                            <CardDescription>Current performance overview</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm">Total Performances</span>
                                    <span className="font-medium">{stats.totalPerformances}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm">Returned</span>
                                    <span className="font-medium text-green-600">{stats.returnedPerformances}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm">Not Returned</span>
                                    <span className="font-medium text-orange-600">{stats.notReturnedPerformances}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Daily Performance</CardTitle>
                            <CardDescription>Last 30 days tonnage</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                {dailyPerformance.slice(-5).map((day, index) => (
                                    <div key={index} className="flex items-center justify-between">
                                        <span className="text-sm">{day.date ? new Date(day.date).toLocaleDateString() : 'Unknown Date'}</span>
                                        <span className="font-medium">{day.tonnage || 0} MT</span>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Operations Report</CardTitle>
                            <CardDescription>Top customers by volume</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                {operationsReport.slice(0, 5).map((op, index) => (
                                    <div key={index} className="flex items-center justify-between">
                                        <span className="text-sm truncate">{op.customer?.name || 'Unknown Customer'}</span>
                                        <span className="font-medium">{op.total_volume} MT</span>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Status Overview */}
                <Card>
                    <CardHeader>
                        <CardTitle>Status Overview</CardTitle>
                        <CardDescription>Performance status breakdown</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4 md:grid-cols-4">
                            {statusBreakdown.map((status, index) => (
                                <div key={index} className="text-center">
                                    <div className="text-2xl font-bold">{status.count}</div>
                                    <div className="text-sm text-muted-foreground">{status.satus || 'Unknown Status'}</div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Recent Performances */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle>Recent Performances</CardTitle>
                            <CardDescription>Latest trip performances</CardDescription>
                        </div>
                        <div className="flex gap-2">
                            <Button asChild size="sm">
                                <Link href="/performances">
                                    <Eye className="h-4 w-4 mr-2" />
                                    View All
                                </Link>
                            </Button>
                            <Button asChild size="sm">
                                <Link href="/performances/create">
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add New
                                </Link>
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {recentPerformances.map((performance) => (
                                <div key={performance.id} className="flex items-center justify-between p-4 border rounded-lg">
                                    <div className="space-y-1">
                                        <div className="font-medium">{performance.trip}</div>
                                        <div className="text-sm text-muted-foreground">
                                            {performance.driverTruck?.driver?.name || 'Unknown Driver'} - {performance.driverTruck?.truck?.plate || 'Unknown Truck'}
                                        </div>
                                        <div className="text-sm text-muted-foreground">
                                            {performance.origin?.name || 'Unknown Origin'} → {performance.destination?.name || 'Unknown Destination'}
                                        </div>
                                    </div>
                                    <div className="text-right space-y-1">
                                        <div className="font-medium">{performance.CargoVolumMT} MT</div>
                                        <div className="text-sm text-muted-foreground">
                                            {new Date(performance.DateDispach).toLocaleDateString()}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
