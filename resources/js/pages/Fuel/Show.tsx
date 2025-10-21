import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import AppLayout from '@/layouts/app-layout';
import { Head, Link, router } from '@inertiajs/react';
import { type BreadcrumbItem } from '@/types';
import { Edit, Trash2, ArrowLeft, Droplet } from 'lucide-react';
import { DeleteConfirmationDialog } from '@/components/delete-confirmation-dialog';
import { ActivityLogTable } from '@/components/activity-log-table';
import { useState } from 'react';

interface ActivityLog {
    id: number;
    action: 'created' | 'updated' | 'deleted';
    description: string;
    user?: { name: string };
    created_at: string;
    old_values?: Record<string, any>;
    new_values?: Record<string, any>;
}

interface FuelRecord {
    id: number;
    truck_id: number;
    driver_id: number;
    fuel_date: string;
    fuel_type: string;
    fuel_quantity_liters: number;
    fuel_price_per_liter: number;
    total_cost: number;
    fuel_station?: string;
    odometer_reading?: number;
    receipt_number?: string;
    notes?: string;
    created_at?: string;
    updated_at?: string;
    truck?: { id: number; plate: string };
    driver?: { id: number; name: string };
}

interface FuelShowProps {
    fuel: FuelRecord;
    activityLogs?: ActivityLog[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Fuel', href: '/fuel' },
];

export default function FuelShow({ fuel, activityLogs = [] }: FuelShowProps) {
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDeleteConfirm = () => {
        setIsDeleting(true);
        router.delete(`/fuel/${fuel.id}`, {
            onSuccess: () => {
                setDeleteDialogOpen(false);
                setIsDeleting(false);
            },
            onError: () => {
                setIsDeleting(false);
            },
        });
    };

    const formatDate = (date?: string) => {
        if (!date) return 'N/A';
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    const formatCurrency = (value?: number) => {
        if (!value) return 'N/A';
        return `$${Number(value).toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        })}`;
    };

    const getFuelTypeBadgeColor = (type: string) => {
        switch (type) {
            case 'diesel':
                return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
            case 'petrol':
                return 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200';
            case 'gas':
                return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
            default:
                return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Fuel Record - ${fuel.truck?.plate || 'Record'}`} />
            <div className="flex flex-1 flex-col gap-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.get('/fuel')}
                            className="flex items-center gap-2"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Back to Fuel
                        </Button>
                        <div>
                            <h1 className="text-2xl font-bold flex items-center gap-2">
                                <Droplet className="h-6 w-6" />
                                Fuel Record - {fuel.truck?.plate}
                            </h1>
                            <p className="text-muted-foreground">Driver: {fuel.driver?.name || 'N/A'}</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" asChild>
                            <Link href={`/fuel/${fuel.id}/edit`}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                            </Link>
                        </Button>
                        <Button variant="destructive" onClick={() => setDeleteDialogOpen(true)}>
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                        </Button>
                    </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-3">
                    {/* Main Details */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Fuel Information */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Fuel Information</CardTitle>
                                <CardDescription>Fuel details and pricing</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid gap-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-sm font-medium text-muted-foreground">Fuel Type</p>
                                            <Badge className={`mt-1 ${getFuelTypeBadgeColor(fuel.fuel_type)}`}>
                                                {fuel.fuel_type.charAt(0).toUpperCase() + fuel.fuel_type.slice(1)}
                                            </Badge>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-muted-foreground">Date</p>
                                            <p className="mt-1 text-sm">{formatDate(fuel.fuel_date)}</p>
                                        </div>
                                    </div>

                                    <div className="border-t pt-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <p className="text-sm font-medium text-muted-foreground">Quantity Liters</p>
                                                <p className="mt-1 text-sm font-semibold">{Number(fuel.fuel_quantity_liters).toFixed(2)} L</p>
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-muted-foreground">Price Per Liter</p>
                                                <p className="mt-1 text-sm font-semibold">{formatCurrency(Number(fuel.fuel_price_per_liter))}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="border-t pt-4">
                                        <p className="text-sm font-medium text-muted-foreground">Total Cost</p>
                                        <p className="mt-1 text-lg font-semibold">{formatCurrency(Number(fuel.total_cost))}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Station & Receipt Information */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Station & Receipt Details</CardTitle>
                                <CardDescription>Fuel station and transaction information</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid gap-4">
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">Fuel Station</p>
                                        <p className="mt-1 text-sm">{fuel.fuel_station || 'N/A'}</p>
                                    </div>
                                    <div className="border-t pt-4">
                                        <p className="text-sm font-medium text-muted-foreground">Receipt Number</p>
                                        <p className="mt-1 text-sm font-mono">{fuel.receipt_number || 'N/A'}</p>
                                    </div>
                                    <div className="border-t pt-4">
                                        <p className="text-sm font-medium text-muted-foreground">Odometer Reading</p>
                                        <p className="mt-1 text-sm">{fuel.odometer_reading ? `${fuel.odometer_reading.toLocaleString()} KM` : 'N/A'}</p>
                                    </div>
                                    {fuel.notes && (
                                        <>
                                            <div className="border-t pt-4">
                                                <p className="text-sm font-medium text-muted-foreground">Notes</p>
                                                <p className="mt-1 text-sm">{fuel.notes}</p>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Timestamps */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Record Information</CardTitle>
                                <CardDescription>System-generated metadata</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid gap-4 text-sm">
                                    <div>
                                        <p className="font-medium text-muted-foreground">Created</p>
                                        <p className="mt-1">{formatDate(fuel.created_at)}</p>
                                    </div>
                                    <div>
                                        <p className="font-medium text-muted-foreground">Last Updated</p>
                                        <p className="mt-1">{formatDate(fuel.updated_at)}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Quick Info */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Quick Info</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div className="rounded-lg bg-muted p-4">
                                        <p className="text-sm font-medium text-muted-foreground">Truck</p>
                                        <Link href={`/trucks/${fuel.truck_id}`} className="mt-2 inline-block text-lg font-mono font-bold text-blue-600 hover:underline dark:text-blue-400">
                                            {fuel.truck?.plate}
                                        </Link>
                                    </div>
                                    <div className="rounded-lg bg-muted p-4">
                                        <p className="text-sm font-medium text-muted-foreground">Driver</p>
                                        <Link href={`/drivers/${fuel.driver_id}`} className="mt-2 inline-block text-sm font-semibold text-blue-600 hover:underline dark:text-blue-400">
                                            {fuel.driver?.name}
                                        </Link>
                                    </div>
                                    <div className="rounded-lg bg-muted p-4">
                                        <p className="text-sm font-medium text-muted-foreground">Fuel Type</p>
                                        <Badge className={`mt-2 ${getFuelTypeBadgeColor(fuel.fuel_type)}`}>
                                            {fuel.fuel_type.toUpperCase()}
                                        </Badge>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Activity Log */}
                {activityLogs && activityLogs.length > 0 && <ActivityLogTable logs={activityLogs} />}
            </div>

            {/* Delete Confirmation Dialog */}
            <DeleteConfirmationDialog
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
                title="Delete Fuel Record"
                description="Are you sure you want to delete this fuel record? This action cannot be undone."
                itemName={`${fuel.fuel_type.toUpperCase()} - ${fuel.truck?.plate}`}
                onConfirm={handleDeleteConfirm}
                isLoading={isDeleting}
            />
        </AppLayout>
    );
}
