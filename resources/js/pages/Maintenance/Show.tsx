import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import AppLayout from '@/layouts/app-layout';
import { Head, Link, router } from '@inertiajs/react';
import { type BreadcrumbItem } from '@/types';
import { Edit, Trash2, ArrowLeft, Wrench } from 'lucide-react';
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

interface Truck {
    id: number;
    plate: string;
}

interface MaintenanceType {
    id: number;
    name: string;
    category: string;
}

interface MaintenanceRecord {
    id: number;
    truck_id: number;
    maintenance_type_id: number;
    scheduled_date: string;
    completed_date?: string;
    odometer_reading?: number;
    cost?: number;
    description?: string;
    work_performed?: string;
    parts_replaced?: string;
    service_provider?: string;
    status: string;
    created_at?: string;
    updated_at?: string;
    truck?: Truck;
    maintenanceType?: MaintenanceType;
    assignedMechanic?: any;
}

interface MaintenanceShowProps {
    maintenance: MaintenanceRecord;
    activityLogs?: ActivityLog[];
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Maintenance',
        href: '/maintenance',
    },
];

export default function MaintenanceShow({ maintenance, activityLogs = [] }: MaintenanceShowProps) {
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDeleteConfirm = () => {
        setIsDeleting(true);
        router.delete(`/maintenance/${maintenance.id}`, {
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

    const getStatusBadgeColor = (status: string) => {
        switch (status) {
            case 'scheduled':
                return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
            case 'in_progress':
                return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
            case 'completed':
                return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
            case 'overdue':
                return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
            default:
                return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Maintenance - ${maintenance.truck?.plate || 'Record'}`} />
            <div className="flex flex-1 flex-col gap-6">
                {/* Header with Back Button */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.get('/maintenance')}
                            className="flex items-center gap-2"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Back to Maintenance
                        </Button>
                        <div>
                            <h1 className="text-2xl font-bold flex items-center gap-2">
                                <Wrench className="h-6 w-6" />
                                {maintenance.maintenanceType?.name || 'Maintenance'}
                            </h1>
                            <p className="text-muted-foreground">Truck: {maintenance.truck?.plate || 'N/A'}</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" asChild>
                            <Link href={`/maintenance/${maintenance.id}/edit`}>
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
                        {/* Basic Information */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Maintenance Details</CardTitle>
                                <CardDescription>Scheduled and completion information</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid gap-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-sm font-medium text-muted-foreground">Status</p>
                                            <Badge className={`mt-1 ${getStatusBadgeColor(maintenance.status)}`}>
                                                {maintenance.status.charAt(0).toUpperCase() + maintenance.status.slice(1).replace('_', ' ')}
                                            </Badge>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-muted-foreground">Category</p>
                                            <p className="mt-1 text-sm font-semibold">{maintenance.maintenanceType?.category || 'N/A'}</p>
                                        </div>
                                    </div>

                                    <div className="border-t pt-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <p className="text-sm font-medium text-muted-foreground">Scheduled Date</p>
                                                <p className="mt-1 text-sm">{formatDate(maintenance.scheduled_date)}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-muted-foreground">Completed Date</p>
                                                <p className="mt-1 text-sm">{formatDate(maintenance.completed_date)}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="border-t pt-4">
                                        <p className="text-sm font-medium text-muted-foreground">Description</p>
                                        <p className="mt-1 text-sm">{maintenance.description || 'N/A'}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Work Information */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Work Information</CardTitle>
                                <CardDescription>Work performed and parts details</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid gap-4">
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">Work Performed</p>
                                        <p className="mt-1 text-sm">{maintenance.work_performed || 'N/A'}</p>
                                    </div>
                                    <div className="border-t pt-4">
                                        <p className="text-sm font-medium text-muted-foreground">Parts Replaced</p>
                                        <p className="mt-1 text-sm">{maintenance.parts_replaced || 'N/A'}</p>
                                    </div>
                                    <div className="border-t pt-4">
                                        <p className="text-sm font-medium text-muted-foreground">Service Provider</p>
                                        <p className="mt-1 text-sm">{maintenance.service_provider || 'N/A'}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Financial Information */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Financial Information</CardTitle>
                                <CardDescription>Cost and odometer details</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid gap-4">
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">Cost</p>
                                        <p className="mt-1 text-lg font-semibold">{formatCurrency(maintenance.cost)}</p>
                                    </div>
                                    <div className="border-t pt-4">
                                        <p className="text-sm font-medium text-muted-foreground">Odometer Reading</p>
                                        <p className="mt-1 text-sm">{maintenance.odometer_reading?.toLocaleString() || 'N/A'} KM</p>
                                    </div>
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
                                        <p className="mt-1">{formatDate(maintenance.created_at)}</p>
                                    </div>
                                    <div>
                                        <p className="font-medium text-muted-foreground">Last Updated</p>
                                        <p className="mt-1">{formatDate(maintenance.updated_at)}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Sidebar - Quick Stats */}
                    <div className="space-y-6">
                        {/* Status Card */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Quick Info</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div className="rounded-lg bg-muted p-4">
                                        <p className="text-sm font-medium text-muted-foreground">Status</p>
                                        <Badge className={`mt-2 ${getStatusBadgeColor(maintenance.status)}`}>
                                            {maintenance.status.charAt(0).toUpperCase() + maintenance.status.slice(1).replace('_', ' ')}
                                        </Badge>
                                    </div>
                                    <div className="rounded-lg bg-muted p-4">
                                        <p className="text-sm font-medium text-muted-foreground">Truck</p>
                                        <Link
                                            href={`/trucks/${maintenance.truck_id}`}
                                            className="mt-2 inline-block text-lg font-mono font-bold text-blue-600 hover:underline dark:text-blue-400"
                                        >
                                            {maintenance.truck?.plate || 'N/A'}
                                        </Link>
                                    </div>
                                    <div className="rounded-lg bg-muted p-4">
                                        <p className="text-sm font-medium text-muted-foreground">Maintenance Type</p>
                                        <p className="mt-2 text-sm font-semibold">{maintenance.maintenanceType?.name || 'N/A'}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Activity Log */}
                {activityLogs && activityLogs.length > 0 && (
                    <ActivityLogTable logs={activityLogs} />
                )}
            </div>

            {/* Delete Confirmation Dialog */}
            <DeleteConfirmationDialog
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
                title="Delete Maintenance Record"
                description="Are you sure you want to delete this maintenance record? This action cannot be undone."
                itemName={`${maintenance.maintenanceType?.name || 'Record'} for ${maintenance.truck?.plate || 'Truck'}`}
                onConfirm={handleDeleteConfirm}
                isLoading={isDeleting}
            />
        </AppLayout>
    );
}
