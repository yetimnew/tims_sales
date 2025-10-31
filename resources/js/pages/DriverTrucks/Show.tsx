import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { Head, Link } from '@inertiajs/react';
import { type BreadcrumbItem } from '@/types';
import {
    ArrowLeft,
    Edit,
    UserX,
    Calendar,
    Clock,
    Truck,
    User,
    Activity,
    BarChart3
} from 'lucide-react';

interface DriverTruck {
    id: number;
    driver_id: number;
    truck_id: number;
    plate: string;
    driverid: string;
    date_recived: string;
    date_detach?: string;
    reason?: string;
    is_attached: boolean;
    status: number;
    driver: {
        id: number;
        name: string;
        driverid: string;
    };
    truck: {
        id: number;
        plate: string;
    };
    created_at: string;
    updated_at: string;
}

interface Performance {
    id: number;
    trip: string;
    DateDispach: string;
    CargoVolumMT: number;
    operation: {
        customer: {
            name: string;
        };
    };
    origin?: {
        name: string;
    };
    destination?: {
        name: string;
    };
}

interface ActivityLog {
    id: number;
    description: string;
    created_at: string;
    causer?: {
        name: string;
    };
}

interface Props {
    driverTruck: DriverTruck;
    performances: Performance[];
    dateDifference?: string;
    activityLogs: ActivityLog[];
}

export default function Show({ driverTruck, performances, dateDifference, activityLogs }: Props) {
    // Add null checking to prevent white space errors
    if (!driverTruck || !driverTruck.driver || !driverTruck.truck) {
        return (
            <AppLayout breadcrumbs={[]}>
                <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                        <h2 className="text-lg font-semibold text-gray-900">Loading...</h2>
                        <p className="text-gray-600">Please wait while we load the assignment data.</p>
                    </div>
                </div>
            </AppLayout>
        );
    }

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Fleet Management',
            href: '#',
        },
        {
            title: 'Driver-Truck Assignments',
            href: '/driver-trucks',
        },
        {
            title: `${driverTruck.driver.name} - ${driverTruck.truck.plate}`,
            href: `/driver-trucks/${driverTruck.id}`,
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Assignment: ${driverTruck.driver.name} - ${driverTruck.truck.plate}`} />

            <div className="flex h-full flex-1 flex-col gap-4 overflow-y-auto rounded-xl p-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/driver-trucks">
                            <Button variant="ghost" size="sm">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back to Assignments
                            </Button>
                        </Link>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-2xl font-bold">
                                    {driverTruck.driver.name} - {driverTruck.truck.plate}
                                </h1>
                                <Badge variant={driverTruck.is_attached ? "default" : "secondary"}>
                                    {driverTruck.is_attached ? 'Attached' : 'Detached'}
                                </Badge>
                            </div>
                            <p className="text-muted-foreground">
                                Driver-Truck Assignment Details
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Link href={`/driver-trucks/${driverTruck.id}/edit`}>
                            <Button variant="outline">
                                <Edit className="mr-2 h-4 w-4" />
                                Edit Assignment
                            </Button>
                        </Link>
                        {driverTruck.is_attached && (
                            <Link href={`/driver-trucks/${driverTruck.id}/detach`}>
                                <Button variant="outline">
                                    <UserX className="mr-2 h-4 w-4" />
                                    Detach Driver
                                </Button>
                            </Link>
                        )}
                    </div>
                </div>

                {/* Quick Stats */}
                <div className="grid gap-4 md:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Driver</CardTitle>
                            <User className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-lg font-bold">{driverTruck.driver.name}</div>
                            <p className="text-xs text-muted-foreground">
                                ID: {driverTruck.driver.driverid}
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Truck</CardTitle>
                            <Truck className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-lg font-bold">{driverTruck.truck.plate}</div>
                            <p className="text-xs text-muted-foreground">
                                Plate: {driverTruck.plate}
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Assigned Date</CardTitle>
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-lg font-bold">
                                {new Date(driverTruck.date_recived).toLocaleDateString()}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Assignment date
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Status</CardTitle>
                            <Activity className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-lg font-bold">
                                {driverTruck.is_attached ? 'Active' : 'Inactive'}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Current status
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Tabs */}
                <Tabs defaultValue="overview" className="flex-1">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="overview">Overview</TabsTrigger>
                        <TabsTrigger value="performances">Performances ({performances.length})</TabsTrigger>
                        <TabsTrigger value="activity">Activity Log</TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview" className="space-y-4">
                        <div className="grid gap-6 md:grid-cols-2">
                            {/* Assignment Details */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Assignment Information</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-sm font-medium text-muted-foreground">Assignment ID</label>
                                            <p className="text-sm font-medium">#{driverTruck.id}</p>
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-muted-foreground">Status</label>
                                            <div className="mt-1">
                                                <Badge variant={driverTruck.is_attached ? "default" : "secondary"}>
                                                    {driverTruck.is_attached ? 'Currently Attached' : 'Detached'}
                                                </Badge>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-muted-foreground">Assigned On</label>
                                            <p className="text-sm">{new Date(driverTruck.date_recived).toLocaleDateString()}</p>
                                        </div>
                                        {driverTruck.date_detach && (
                                            <div>
                                                <label className="text-sm font-medium text-muted-foreground">Detached On</label>
                                                <p className="text-sm">{new Date(driverTruck.date_detach).toLocaleDateString()}</p>
                                            </div>
                                        )}
                                        {dateDifference && (
                                            <div className="col-span-2">
                                                <label className="text-sm font-medium text-muted-foreground">Assignment Duration</label>
                                                <p className="text-sm font-medium text-blue-600">{dateDifference}</p>
                                            </div>
                                        )}
                                        {driverTruck.reason && (
                                            <div className="col-span-2">
                                                <label className="text-sm font-medium text-muted-foreground">Reason for Detachment</label>
                                                <p className="text-sm">{driverTruck.reason}</p>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>

                            {/* System Information */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>System Information</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-sm font-medium text-muted-foreground">Created</label>
                                            <p className="text-sm">{new Date(driverTruck.created_at).toLocaleString()}</p>
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-muted-foreground">Last Updated</label>
                                            <p className="text-sm">{new Date(driverTruck.updated_at).toLocaleString()}</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    <TabsContent value="performances" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <BarChart3 className="h-5 w-5" />
                                    Performance Records ({performances.length})
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {performances.length > 0 ? (
                                    <div className="rounded-lg border overflow-auto max-h-[500px]">
                                        <Table>
                                            <TableHeader className="sticky top-0 bg-background">
                                                <TableRow>
                                                    <TableHead>Trip</TableHead>
                                                    <TableHead>Date</TableHead>
                                                    <TableHead>Customer</TableHead>
                                                    <TableHead>Route</TableHead>
                                                    <TableHead className="text-right">Volume (MT)</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {performances.map((performance) => (
                                                    <TableRow key={performance.id}>
                                                        <TableCell className="font-medium">{performance.trip}</TableCell>
                                                        <TableCell>{new Date(performance.DateDispach).toLocaleDateString()}</TableCell>
                                                        <TableCell>{performance.operation?.customer?.name || 'N/A'}</TableCell>
                                                        <TableCell>
                                                            {performance.origin?.name || 'N/A'} → {performance.destination?.name || 'N/A'}
                                                        </TableCell>
                                                        <TableCell className="text-right font-medium">
                                                            {performance.CargoVolumMT} MT
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                ) : (
                                    <div className="text-center py-8 text-muted-foreground">
                                        <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                        <p>No performance records found for this assignment.</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="activity" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Activity className="h-5 w-5" />
                                    Activity Log
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {activityLogs.length > 0 ? (
                                    <div className="space-y-4 max-h-[500px] overflow-auto">
                                        {activityLogs.map((log) => (
                                            <div key={log.id} className="flex items-start gap-4 p-4 border rounded-lg">
                                                <div className="flex-shrink-0">
                                                    <Activity className="h-5 w-5 text-muted-foreground" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm">{log.description}</p>
                                                    <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                                                        <Clock className="h-3 w-3" />
                                                        <span>{new Date(log.created_at).toLocaleString()}</span>
                                                        {log.causer && (
                                                            <>
                                                                <span>•</span>
                                                                <span>by {log.causer.name}</span>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-8 text-muted-foreground">
                                        <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                        <p>No activity logs found for this assignment.</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </AppLayout>
    );
}
