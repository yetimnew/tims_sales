import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { Head, Link, router } from '@inertiajs/react';
import { type BreadcrumbItem } from '@/types';
import { Edit, Trash2, ArrowLeft } from 'lucide-react';
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

interface DriverTruck {
    id: number;
    truck_id: number;
    plate: string;
    date_recived: string;
    date_detach?: string;
    is_attached: number;
    status: number;
    truck: {
        id: number;
        plate: string;
    };
}

interface Driver {
    id: number;
    driverid: string;
    name: string;
    sex: string;
    birthdate?: string;
    zone?: string;
    woreda?: string;
    kebele?: string;
    housenumber?: string;
    mobile?: string;
    hireddate?: string;
    status: string;
    created_at?: string;
    updated_at?: string;
    trucks?: any[];
    performances?: any[];
    driverTrucks?: DriverTruck[];
}

interface DriversShowProps {
    driver: Driver;
    activityLogs?: ActivityLog[];
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Drivers',
        href: '/drivers',
    },
];

export default function DriversShow({ driver, activityLogs = [] }: DriversShowProps) {
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDeleteConfirm = () => {
        setIsDeleting(true);
        router.delete(`/drivers/${driver.id}`, {
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

    const getStatusBadgeColor = (status: string) => {
        switch (status) {
            case 'active':
                return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
            case 'inactive':
                return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
            default:
                return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
        }
    };

    const getSexBadgeColor = (sex: string) => {
        switch (sex) {
            case 'male':
                return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
            case 'female':
                return 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200';
            default:
                return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`View Driver - ${driver?.name || 'Unknown'}`} />
            <div className="flex flex-1 flex-col gap-6">
                {/* Header with Back Button */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.get('/drivers')}
                            className="flex items-center gap-2"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Back to Drivers
                        </Button>
                        <div>
                            <h1 className="text-2xl font-bold">{driver?.name || 'Unknown Driver'}</h1>
                            <p className="text-muted-foreground">View driver details and manage information</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" asChild>
                            <Link href={`/drivers/${driver?.id}/edit`}>
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
                                <CardTitle>Basic Information</CardTitle>
                                <CardDescription>Personal and professional details</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid gap-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-sm font-medium text-muted-foreground">Status</p>
                                            <Badge className={`mt-1 ${getStatusBadgeColor(driver?.status || 'inactive')}`}>
                                                {(driver?.status || 'inactive').charAt(0).toUpperCase() + (driver?.status || 'inactive').slice(1)}
                                            </Badge>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-muted-foreground">Gender</p>
                                            <Badge className={`mt-1 ${getSexBadgeColor(driver?.sex || 'male')}`}>
                                                {(driver?.sex || 'male').charAt(0).toUpperCase() + (driver?.sex || 'male').slice(1)}
                                            </Badge>
                                        </div>
                                    </div>

                                    <div className="border-t pt-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <p className="text-sm font-medium text-muted-foreground">Driver ID</p>
                                                <p className="mt-1 text-sm font-mono">{driver?.driverid || 'N/A'}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-muted-foreground">Mobile</p>
                                                <p className="mt-1 text-sm">{driver?.mobile || 'N/A'}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="border-t pt-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <p className="text-sm font-medium text-muted-foreground">Zone</p>
                                                <p className="mt-1 text-sm">{driver?.zone || 'N/A'}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-muted-foreground">Woreda</p>
                                                <p className="mt-1 text-sm">{driver?.woreda || 'N/A'}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="border-t pt-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <p className="text-sm font-medium text-muted-foreground">Kebele</p>
                                                <p className="mt-1 text-sm">{driver.kebele || 'N/A'}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-muted-foreground">House Number</p>
                                                <p className="mt-1 text-sm">{driver.housenumber || 'N/A'}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Employment Information */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Employment Information</CardTitle>
                                <CardDescription>Hiring and employment details</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid gap-4">
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">Birthdate</p>
                                        <p className="mt-1 text-sm">{formatDate(driver.birthdate)}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">Hired Date</p>
                                        <p className="mt-1 text-sm">{formatDate(driver.hireddate)}</p>
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
                                        <p className="mt-1">{formatDate(driver.created_at)}</p>
                                    </div>
                                    <div>
                                        <p className="font-medium text-muted-foreground">Last Updated</p>
                                        <p className="mt-1">{formatDate(driver.updated_at)}</p>
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
                                <CardTitle className="text-base">Quick Status</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div className="rounded-lg bg-muted p-4">
                                        <p className="text-sm font-medium text-muted-foreground">Current Status</p>
                                        <Badge className={`mt-2 ${getStatusBadgeColor(driver.status)}`}>
                                            {driver.status.charAt(0).toUpperCase() + driver.status.slice(1)}
                                        </Badge>
                                    </div>
                                    <div className="rounded-lg bg-muted p-4">
                                        <p className="text-sm font-medium text-muted-foreground">Driver Name</p>
                                        <p className="mt-2 text-lg font-mono font-bold">{driver.name}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Driver Truck Assignments */}
                        {driver?.driverTrucks && driver.driverTrucks.length > 0 && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-base">Truck Assignments</CardTitle>
                                    <CardDescription>Current and past truck assignments</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-3">
                                        {driver?.driverTrucks?.map((assignment: any) => (
                                            <div
                                                key={assignment.id}
                                                className="rounded-lg border border-border p-3 hover:bg-muted/50"
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <div>
                                                            <p className="font-medium text-sm">{assignment.plate || 'N/A'}</p>
                                                            <p className="text-xs text-muted-foreground">
                                                                Status: {assignment.status}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <Badge variant="default">
                                                        {assignment.is_attached ? 'Active' : 'Detached'}
                                                    </Badge>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Recent Activities */}
                        {driver.performances && driver.performances.length > 0 && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-base">Recent Activities</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-muted-foreground">
                                        {driver.performances.length} performance record{driver.performances.length !== 1 ? 's' : ''} available
                                    </p>
                                </CardContent>
                            </Card>
                        )}
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
                title="Delete Driver"
                description="Are you sure you want to delete this driver? This action cannot be undone and will remove all associated records."
                itemName={driver.name}
                onConfirm={handleDeleteConfirm}
                isLoading={isDeleting}
            />
        </AppLayout>
    );
}
