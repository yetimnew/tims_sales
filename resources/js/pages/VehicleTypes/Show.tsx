import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import AppLayout from '@/layouts/app-layout';
import { Head, Link } from '@inertiajs/react';
import { type BreadcrumbItem } from '@/types';
import {
    Settings,
    Edit,
    Trash2,
    Truck,
    Calendar,
    ArrowLeft
} from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Vehicle Types',
        href: '/vehicletypes',
    },
    {
        title: 'Details',
        href: '#',
    },
];

interface TruckData {
    id: number;
    plate: string;
    status: string;
    created_at: string;
}

interface VehicleType {
    id: number;
    name: string;
    description?: string;
    created_at: string;
    updated_at: string;
    trucks: {
        data: TruckData[];
    };
}

interface VehicleTypesShowProps {
    vehicleType: VehicleType;
}

export default function VehicleTypesShow({ vehicleType }: VehicleTypesShowProps) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={vehicleType.name} />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl p-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="outline" size="sm" asChild>
                            <Link href="/vehicletypes">
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Back
                            </Link>
                        </Button>
                        <div>
                            <h1 className="text-2xl font-bold">{vehicleType.name}</h1>
                            <p className="text-muted-foreground">
                                Vehicle type details and associated trucks
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button asChild>
                            <Link href={`/vehicletypes/${vehicleType.id}/edit`}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                            </Link>
                        </Button>
                    </div>
                </div>

                {/* Vehicle Type Details */}
                <Card>
                    <CardHeader>
                        <CardTitle>Vehicle Type Information</CardTitle>
                        <CardDescription>
                            Basic information about this vehicle type
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Name</label>
                                    <p className="text-lg font-semibold">{vehicleType.name}</p>
                                </div>

                                {vehicleType.description && (
                                    <div>
                                        <label className="text-sm font-medium text-muted-foreground">Description</label>
                                        <p className="text-sm">{vehicleType.description}</p>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Created</label>
                                    <p className="text-sm flex items-center gap-2">
                                        <Calendar className="h-4 w-4" />
                                        {new Date(vehicleType.created_at).toLocaleDateString()}
                                    </p>
                                </div>

                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Last Updated</label>
                                    <p className="text-sm flex items-center gap-2">
                                        <Calendar className="h-4 w-4" />
                                        {new Date(vehicleType.updated_at).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Associated Trucks */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Truck className="h-5 w-5" />
                            Associated Trucks
                        </CardTitle>
                        <CardDescription>
                            Trucks using this vehicle type
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {vehicleType.trucks.data.length > 0 ? (
                            <div className="space-y-4">
                                {vehicleType.trucks.data.map((truck) => (
                                    <div key={truck.id} className="flex items-center justify-between p-4 border rounded-lg">
                                        <div className="space-y-1">
                                            <div className="font-medium">{truck.plate}</div>
                                            <div className="text-sm text-muted-foreground">
                                                Created: {new Date(truck.created_at).toLocaleDateString()}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Badge variant={truck.status === 'active' ? 'default' : 'secondary'}>
                                                {truck.status}
                                            </Badge>
                                            <Button asChild size="sm" variant="outline">
                                                <Link href={`/trucks/${truck.id}`}>
                                                    View Truck
                                                </Link>
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-muted-foreground">
                                <Truck className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                <p>No trucks are using this vehicle type yet.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}

