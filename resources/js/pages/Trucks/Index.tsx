import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import AppLayout from '@/layouts/app-layout';
import { Head, Link } from '@inertiajs/react';
import { type BreadcrumbItem } from '@/types';
import {
    Truck,
    Plus,
    Eye,
    Edit,
    Trash2,
    Settings,
    Calendar,
    DollarSign
} from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Trucks',
        href: '/trucks',
    },
];

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
    vehicleType: {
        id: number;
        name: string;
    };
    created_at: string;
}

interface TrucksIndexProps {
    trucks: {
        data: TruckData[];
        links: any[];
        meta: any;
    };
}

export default function TrucksIndex({ trucks }: TrucksIndexProps) {
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
            <Head title="Trucks" />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl p-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Trucks</h1>
                        <p className="text-muted-foreground">
                            Manage your fleet of trucks
                        </p>
                    </div>
                    <Button asChild>
                        <Link href="/trucks/create">
                            <Plus className="h-4 w-4 mr-2" />
                            Add Truck
                        </Link>
                    </Button>
                </div>

                {/* Trucks List */}
                <Card>
                    <CardHeader>
                        <CardTitle>Fleet Overview</CardTitle>
                        <CardDescription>
                            {trucks.meta.total} trucks in your fleet
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {trucks.data.map((truck) => (
                                <div key={truck.id} className="flex items-center justify-between p-4 border rounded-lg">
                                    <div className="space-y-1">
                                        <div className="font-medium">{truck.plate}</div>
                                        <div className="text-sm text-muted-foreground">
                                            {truck.vehicleType.name}
                                        </div>
                                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                            {truck.chasisNumber && (
                                                <span>Chassis: {truck.chasisNumber}</span>
                                            )}
                                            {truck.engineNumber && (
                                                <span>Engine: {truck.engineNumber}</span>
                                            )}
                                            {truck.serviceIntervalKM && (
                                                <span>Service: {truck.serviceIntervalKM} KM</span>
                                            )}
                                        </div>
                                        {truck.purchasePrice && (
                                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                                <DollarSign className="h-3 w-3" />
                                                {truck.purchasePrice.toLocaleString()}
                                            </div>
                                        )}
                                    </div>
                                    <div className="text-right space-y-2">
                                        {getStatusBadge(truck.status)}
                                        <div className="flex gap-2">
                                            <Button asChild size="sm" variant="outline">
                                                <Link href={`/trucks/${truck.id}`}>
                                                    <Eye className="h-4 w-4" />
                                                </Link>
                                            </Button>
                                            <Button asChild size="sm" variant="outline">
                                                <Link href={`/trucks/${truck.id}/edit`}>
                                                    <Edit className="h-4 w-4" />
                                                </Link>
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Pagination */}
                        {trucks.links && trucks.links.length > 3 && (
                            <div className="flex items-center justify-center space-x-2 mt-6">
                                {trucks.links.map((link, index) => (
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
