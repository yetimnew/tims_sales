import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import AppLayout from '@/layouts/app-layout';
import { Head, Link } from '@inertiajs/react';
import { type BreadcrumbItem } from '@/types';
import {
    Truck,
    Edit,
    Trash2,
    Calendar,
    DollarSign,
    Settings,
    ArrowLeft,
    Users,
    Activity
} from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Trucks',
        href: '/trucks',
    },
    {
        title: 'Details',
        href: '#',
    },
];

interface DriverData {
    id: number;
    name: string;
    driverid: string;
    status: string;
}

interface PerformanceData {
    id: number;
    trip: string;
    DateDispach: string;
    CargoVolumMT: number;
    status: string;
}

interface TruckData {
    id: number;
    plate: string;
    chasisNumber?: string;
    engineNumber?: string;
    tyreSyze?: string;
    serviceIntervalKM?: number;
    purchasePrice?: number;
    productionDate?: string;
    serviceStartDate?: string;
    status: string;
    created_at: string;
    updated_at: string;
    vehicleType: {
        id: number;
        name: string;
    };
    drivers: DriverData[];
    performances: {
        data: PerformanceData[];
    };
}

interface TrucksShowProps {
    truck: TruckData;
}

export default function TrucksShow({ truck }: TrucksShowProps) {
    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'active':
                return <Badge variant="default">Active</Badge>;
            case 'inactive':
                return <Badge variant="secondary">Inactive</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={truck.plate} />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl p-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="outline" size="sm" asChild>
                            <Link href="/trucks">
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Back
                            </Link>
                        </Button>
                        <div>
                            <h1 className="text-2xl font-bold">{truck.plate}</h1>
                            <p className="text-muted-foreground">
                                Truck details and performance history
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button asChild>
                            <Link href={`/trucks/${truck.id}/edit`}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                            </Link>
                        </Button>
                    </div>
                </div>

                {/* Truck Details */}
                <Card>
                    <CardHeader>
                        <CardTitle>Truck Information</CardTitle>
                        <CardDescription>
                            Basic information about this truck
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <div className="space-y-4">
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Plate Number</label>
                                    <p className="text-lg font-semibold">{truck.plate}</p>
                                </div>

                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Vehicle Type</label>
                                    <p className="text-sm">{truck.vehicleType.name}</p>
                                </div>

                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Status</label>
                                    <div className="mt-1">
                                        {getStatusBadge(truck.status)}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                {truck.chasisNumber && (
                                    <div>
                                        <label className="text-sm font-medium text-muted-foreground">Chassis Number</label>
                                        <p className="text-sm">{truck.chasisNumber}</p>
                                    </div>
                                )}

                                {truck.engineNumber && (
                                    <div>
                                        <label className="text-sm font-medium text-muted-foreground">Engine Number</label>
                                        <p className="text-sm">{truck.engineNumber}</p>
                                    </div>
                                )}

                                {truck.tyreSyze && (
                                    <div>
                                        <label className="text-sm font-medium text-muted-foreground">Tyre Size</label>
                                        <p className="text-sm">{truck.tyreSyze}</p>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-4">
                                {truck.serviceIntervalKM && (
                                    <div>
                                        <label className="text-sm font-medium text-muted-foreground">Service Interval</label>
                                        <p className="text-sm flex items-center gap-2">
                                            <Settings className="h-4 w-4" />
                                            {truck.serviceIntervalKM.toLocaleString()} KM
                                        </p>
                                    </div>
                                )}

                                {truck.purchasePrice && (
                                    <div>
                                        <label className="text-sm font-medium text-muted-foreground">Purchase Price</label>
                                        <p className="text-sm flex items-center gap-2">
                                            <DollarSign className="h-4 w-4" />
                                            {truck.purchasePrice.toLocaleString()}
                                        </p>
                                    </div>
                                )}

                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Created</label>
                                    <p className="text-sm flex items-center gap-2">
                                        <Calendar className="h-4 w-4" />
                                        {new Date(truck.created_at).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Assigned Drivers */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Users className="h-5 w-5" />
                            Assigned Drivers
                        </CardTitle>
                        <CardDescription>
                            Drivers currently assigned to this truck
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {truck.drivers.length > 0 ? (
                            <div className="space-y-4">
                                {truck.drivers.map((driver) => (
                                    <div key={driver.id} className="flex items-center justify-between p-4 border rounded-lg">
                                        <div className="space-y-1">
                                            <div className="font-medium">{driver.name}</div>
                                            <div className="text-sm text-muted-foreground">
                                                ID: {driver.driverid}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Badge variant={driver.status === 'active' ? 'default' : 'secondary'}>
                                                {driver.status}
                                            </Badge>
                                            <Button asChild size="sm" variant="outline">
                                                <Link href={`/drivers/${driver.id}`}>
                                                    View Driver
                                                </Link>
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-muted-foreground">
                                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                <p>No drivers are currently assigned to this truck.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Recent Performances */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Activity className="h-5 w-5" />
                            Recent Performances
                        </CardTitle>
                        <CardDescription>
                            Latest trip performances for this truck
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {truck.performances.data.length > 0 ? (
                            <div className="space-y-4">
                                {truck.performances.data.map((performance) => (
                                    <div key={performance.id} className="flex items-center justify-between p-4 border rounded-lg">
                                        <div className="space-y-1">
                                            <div className="font-medium">{performance.trip}</div>
                                            <div className="text-sm text-muted-foreground">
                                                {performance.CargoVolumMT} MT • {new Date(performance.DateDispach).toLocaleDateString()}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Badge variant={performance.status === 'active' ? 'default' : 'secondary'}>
                                                {performance.status}
                                            </Badge>
                                            <Button asChild size="sm" variant="outline">
                                                <Link href={`/performances/${performance.id}`}>
                                                    View Performance
                                                </Link>
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-muted-foreground">
                                <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                <p>No performances recorded for this truck yet.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}



