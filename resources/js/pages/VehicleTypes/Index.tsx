import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import AppLayout from '@/layouts/app-layout';
import { Head, Link } from '@inertiajs/react';
import { type BreadcrumbItem } from '@/types';
import {
    Settings,
    Plus,
    Eye,
    Edit,
    Trash2,
    Truck
} from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Vehicle Types',
        href: '/vehicletypes',
    },
];

interface VehicleType {
    id: number;
    name: string;
    description?: string;
    trucks_count: number;
    created_at: string;
}

interface VehicleTypesIndexProps {
    vehicleTypes: {
        data: VehicleType[];
        links: any[];
        meta: any;
    };
}

export default function VehicleTypesIndex({ vehicleTypes }: VehicleTypesIndexProps) {
    // Safety checks for undefined data
    const vehicleTypeData = vehicleTypes?.data || [];
    const totalVehicleTypes = vehicleTypes?.meta?.total || 0;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Vehicle Types" />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl p-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Vehicle Types</h1>
                        <p className="text-muted-foreground">
                            Manage vehicle types and categories
                        </p>
                    </div>
                    <Button asChild>
                        <Link href="/vehicletypes/create">
                            <Plus className="h-4 w-4 mr-2" />
                            Add Vehicle Type
                        </Link>
                    </Button>
                </div>

                {/* Vehicle Types List */}
                <Card>
                    <CardHeader>
                        <CardTitle>Vehicle Types</CardTitle>
                        <CardDescription>
                            {totalVehicleTypes} vehicle types registered
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {vehicleTypeData.map((vehicleType) => (
                                <div key={vehicleType.id} className="flex items-center justify-between p-4 border rounded-lg">
                                    <div className="space-y-1">
                                        <div className="font-medium">{vehicleType.name}</div>
                                        {vehicleType.description && (
                                            <div className="text-sm text-muted-foreground">
                                                {vehicleType.description}
                                            </div>
                                        )}
                                        <div className="flex items-center gap-2">
                                            <Truck className="h-4 w-4 text-muted-foreground" />
                                            <span className="text-sm text-muted-foreground">
                                                {vehicleType.trucks_count} trucks
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button asChild size="sm" variant="outline">
                                            <Link href={`/vehicletypes/${vehicleType.id}`}>
                                                <Eye className="h-4 w-4" />
                                            </Link>
                                        </Button>
                                        <Button asChild size="sm" variant="outline">
                                            <Link href={`/vehicletypes/${vehicleType.id}/edit`}>
                                                <Edit className="h-4 w-4" />
                                            </Link>
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Pagination */}
                        {vehicleTypes.links && vehicleTypes.links.length > 3 && (
                            <div className="flex items-center justify-center space-x-2 mt-6">
                                {vehicleTypes.links.map((link, index) => (
                                    <Button
                                        key={index}
                                        asChild
                                        variant={link.active ? "default" : "outline"}
                                        size="sm"
                                        disabled={!link.url}
                                    >
                                        <Link href={link.url || '#'}>
                                            <span dangerouslySetInnerHTML={{ __html: link.label }} />
                                        </Link>
                                    </Button>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}



