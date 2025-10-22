import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import AppLayout from '@/layouts/app-layout';
import { Head, Link, router } from '@inertiajs/react';
import { type BreadcrumbItem } from '@/types';
import {
    Settings,
    Edit,
    Trash2,
    Truck,
    Calendar,
    ArrowLeft
} from 'lucide-react';
import { DeleteConfirmationDialog } from '@/components/delete-confirmation-dialog';
import { ActivityLogTable } from '@/components/activity-log-table';
import { useState } from 'react';

interface ActivityLog {
    id: number;
    action: 'created' | 'updated' | 'deleted';
    description: string;
    user?: {
        name: string;
    };
    created_at: string;
    old_values?: Record<string, any>;
    new_values?: Record<string, any>;
}

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
    trucks?: {
        data: TruckData[];
    };
}

interface VehicleTypesShowProps {
    vehicleType: VehicleType;
    activityLogs?: ActivityLog[];
}

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

export default function VehicleTypesShow({ vehicleType, activityLogs = [] }: VehicleTypesShowProps) {
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDeleteConfirm = () => {
        setIsDeleting(true);
        router.delete(`/vehicletypes/${vehicleType.id}`, {
            onSuccess: () => {
                setDeleteDialogOpen(false);
                setIsDeleting(false);
            },
            onError: () => {
                setIsDeleting(false);
            },
        });
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={vehicleType.name} />
            <div className="flex flex-1 flex-col gap-6">
                {/* Header with Back Button */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.get('/vehicletypes')}
                            className="flex items-center gap-2"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Back to Vehicle Types
                        </Button>
                        <div>
                            <h1 className="text-2xl font-bold flex items-center gap-2">
                                <Settings className="h-6 w-6" />
                                {vehicleType.name}
                            </h1>
                            <p className="text-muted-foreground">Vehicle type details and associated trucks</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" asChild>
                            <Link href={`/vehicletypes/${vehicleType.id}/edit`}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                            </Link>
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={() => setDeleteDialogOpen(true)}
                        >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                        </Button>
                    </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-3">
                    {/* Main Details */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Vehicle Type Details */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Vehicle Type Information</CardTitle>
                                <CardDescription>Basic information about this vehicle type</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid gap-4">
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">Name</p>
                                        <p className="mt-1 text-lg font-semibold">{vehicleType.name}</p>
                                    </div>

                                    {vehicleType.description && (
                                        <div className="border-t pt-4">
                                            <p className="text-sm font-medium text-muted-foreground">Description</p>
                                            <p className="mt-1 text-sm">{vehicleType.description}</p>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Record Information */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Record Information</CardTitle>
                                <CardDescription>System-generated metadata</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid gap-4 text-sm">
                                    <div>
                                        <p className="font-medium text-muted-foreground">Created</p>
                                        <p className="mt-1 flex items-center gap-2">
                                            <Calendar className="h-4 w-4" />
                                            {formatDate(vehicleType.created_at)}
                                        </p>
                                    </div>

                                    <div>
                                        <p className="font-medium text-muted-foreground">Last Updated</p>
                                        <p className="mt-1 flex items-center gap-2">
                                            <Calendar className="h-4 w-4" />
                                            {formatDate(vehicleType.updated_at)}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Sidebar - Quick Stats */}
                    <div className="space-y-6">
                        {/* Quick Info */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Quick Info</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div className="rounded-lg bg-muted p-4">
                                        <p className="text-sm font-medium text-muted-foreground">Vehicle Type</p>
                                        <p className="mt-2 text-lg font-bold">{vehicleType.name}</p>
                                    </div>
                                    <div className="rounded-lg bg-muted p-4">
                                        <p className="text-sm font-medium text-muted-foreground">Associated Trucks</p>
                                        <p className="mt-2 text-lg font-bold">{vehicleType.trucks?.data?.length || 0}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Associated Trucks */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Truck className="h-5 w-5" />
                            Associated Trucks ({vehicleType.trucks?.data?.length || 0})
                        </CardTitle>
                        <CardDescription>Trucks using this vehicle type</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {(vehicleType.trucks?.data?.length || 0) > 0 ? (
                            <div className="space-y-4">
                                {vehicleType.trucks?.data?.map((truck) => (
                                    <div key={truck.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                                        <div className="space-y-1">
                                            <Link href={`/trucks/${truck.id}`} className="font-medium text-blue-600 hover:underline dark:text-blue-400">
                                                {truck.plate}
                                            </Link>
                                            <div className="text-sm text-muted-foreground">
                                                Created: {formatDate(truck.created_at)}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Badge variant={truck.status === 'active' ? 'default' : 'secondary'}>
                                                {truck.status.charAt(0).toUpperCase() + truck.status.slice(1)}
                                            </Badge>
                                            <Button asChild size="sm" variant="outline">
                                                <Link href={`/trucks/${truck.id}`}>
                                                    View
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

                {/* Activity Log */}
                {activityLogs && activityLogs.length > 0 && (
                    <ActivityLogTable logs={activityLogs} />
                )}
            </div>

            {/* Delete Confirmation Dialog */}
            <DeleteConfirmationDialog
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
                title="Delete Vehicle Type"
                description="Are you sure you want to delete this vehicle type? This action cannot be undone and will remove all associated records."
                itemName={vehicleType.name}
                onConfirm={handleDeleteConfirm}
                isLoading={isDeleting}
            />
        </AppLayout>
    );
}



