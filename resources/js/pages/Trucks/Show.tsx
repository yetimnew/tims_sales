import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, Wrench, BarChart3, History, CheckCircle, XCircle, DollarSign, Calendar, Clock } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { Head, Link, router } from '@inertiajs/react';
import { type BreadcrumbItem } from '@/types';
import { Edit, Trash2, ArrowLeft } from 'lucide-react';
import { DeleteConfirmationDialog } from '@/components/delete-confirmation-dialog';
import { ActivityLogTable } from '@/components/activity-log-table';
import { useState } from 'react';

interface VehicleType {
    id: number;
    name: string;
}

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
    vehicletype_id: number;
    chasisNumber?: string;
    engineNumber?: string;
    tyreSyze?: string;
    serviceIntervalKM?: number;
    purchasePrice?: number;
    productionDate?: string;
    serviceStartDate?: string;
    status: string;
    created_at?: string;
    updated_at?: string;
    vehicleType?: VehicleType;
    drivers?: any[];
    performances?: any[];
    activityLogs?: ActivityLog[];
}

interface TrucksShowProps {
    truck: Truck;
    activityLogs?: ActivityLog[];
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Trucks',
        href: '/trucks',
    },
];

export default function TrucksShow({ truck, activityLogs = [] }: TrucksShowProps) {
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDeleteConfirm = () => {
        setIsDeleting(true);
        router.delete(`/trucks/${truck.id}`, {
            onSuccess: () => {
                setDeleteDialogOpen(false);
                setIsDeleting(false);
            },
            onError: () => {
                setIsDeleting(false);
            },
        });
    };

    const formatCurrency = (value?: number) => {
        if (!value) return 'N/A';
        return `$${Number(value).toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        })}`;
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
            case 'maintenance':
                return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
            case 'inactive':
                return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
            default:
                return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`View Truck - ${truck.plate}`} />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-hidden rounded-xl p-4">
                {/* Enhanced Header with Back Button */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.get('/trucks')}
                            className="flex items-center gap-2 hover:bg-muted/50"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Back to Trucks
                        </Button>
                        <div>
                            <h1 className="text-3xl font-bold text-foreground">{truck.plate}</h1>
                            <p className="text-muted-foreground mt-1">View comprehensive truck details and manage information</p>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <Button variant="outline" asChild className="hover:bg-blue-50 hover:border-blue-300">
                            <Link href={`/trucks/${truck.id}/edit`}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit Truck
                            </Link>
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => setDeleteDialogOpen(true)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 hover:border-red-300"
                        >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete Truck
                        </Button>
                    </div>
                </div>

                <Tabs defaultValue="overview" className="space-y-6">
                    <TabsList className="grid w-full grid-cols-4 bg-muted/50 p-1 rounded-lg">
                        <TabsTrigger value="overview" className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                            <CheckCircle className="h-4 w-4" />
                            Overview
                        </TabsTrigger>
                        <TabsTrigger value="maintenance" className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                            <Wrench className="h-4 w-4" />
                            Maintenance
                        </TabsTrigger>
                        <TabsTrigger value="performance" className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                            <BarChart3 className="h-4 w-4" />
                            Performance
                        </TabsTrigger>
                        <TabsTrigger value="history" className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                            <History className="h-4 w-4" />
                            History
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview" className="space-y-6">
                        <div className="grid gap-6 lg:grid-cols-3">
                            {/* Main Details */}
                            <div className="lg:col-span-2 space-y-6">
                                {/* Enhanced Basic Information */}
                                <Card className="shadow-lg border-0 bg-gradient-to-br from-background to-muted/20">
                                    <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-b">
                                        <CardTitle className="flex items-center gap-2 text-xl">
                                            <CheckCircle className="h-5 w-5 text-blue-600" />
                                            Basic Information
                                        </CardTitle>
                                        <CardDescription className="text-base">
                                            Core truck details and specifications
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="grid gap-4">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <p className="text-sm font-medium text-muted-foreground">Status</p>
                                                    <Badge className={`mt-1 flex items-center gap-1 w-fit ${getStatusBadgeColor(truck.status)}`}>
                                                        {truck.status === 'active' && <CheckCircle className="h-3 w-3" />}
                                                        {truck.status === 'maintenance' && <Wrench className="h-3 w-3" />}
                                                        {truck.status === 'inactive' && <XCircle className="h-3 w-3" />}
                                                        {truck.status.charAt(0).toUpperCase() + truck.status.slice(1)}
                                                    </Badge>
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-muted-foreground">Vehicle Type</p>
                                                    <p className="mt-1 text-sm font-semibold">{truck.vehicleType?.name || 'Unknown'}</p>
                                                </div>
                                            </div>

                                            <div className="border-t pt-4">
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <p className="text-sm font-medium text-muted-foreground">Chassis Number</p>
                                                        <p className="mt-1 text-sm font-mono">{truck.chasisNumber || 'N/A'}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium text-muted-foreground">Engine Number</p>
                                                        <p className="mt-1 text-sm font-mono">{truck.engineNumber || 'N/A'}</p>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="border-t pt-4">
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <p className="text-sm font-medium text-muted-foreground">Tyre Size</p>
                                                        <p className="mt-1 text-sm">{truck.tyreSyze || 'N/A'}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium text-muted-foreground">Service Interval</p>
                                                        <p className="mt-1 text-sm">{truck.serviceIntervalKM?.toLocaleString()} KM || 'N/A'</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Financial Information */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Financial Information</CardTitle>
                                        <CardDescription>Purchase and pricing details</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="grid gap-4">
                                            <div>
                                                <p className="text-sm font-medium text-muted-foreground">Purchase Price</p>
                                                <p className="mt-1 text-lg font-semibold">{formatCurrency(truck.purchasePrice)}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-muted-foreground">Purchase/Production Date</p>
                                                <p className="mt-1 text-sm">{formatDate(truck.productionDate)}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-muted-foreground">Service Start Date</p>
                                                <p className="mt-1 text-sm">{formatDate(truck.serviceStartDate)}</p>
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
                                                <p className="mt-1">{formatDate(truck.created_at)}</p>
                                            </div>
                                            <div>
                                                <p className="font-medium text-muted-foreground">Last Updated</p>
                                                <p className="mt-1">{formatDate(truck.updated_at)}</p>
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
                                                <Badge className={`mt-2 flex items-center gap-1 w-fit ${getStatusBadgeColor(truck.status)}`}>
                                                    {truck.status === 'active' && <CheckCircle className="h-3 w-3" />}
                                                    {truck.status === 'maintenance' && <Wrench className="h-3 w-3" />}
                                                    {truck.status === 'inactive' && <XCircle className="h-3 w-3" />}
                                                    {truck.status.charAt(0).toUpperCase() + truck.status.slice(1)}
                                                </Badge>
                                            </div>
                                            <div className="rounded-lg bg-muted p-4">
                                                <p className="text-sm font-medium text-muted-foreground">Plate Number</p>
                                                <p className="mt-2 text-lg font-mono font-bold">{truck.plate}</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Assigned Drivers */}
                                {truck.drivers && truck.drivers.length > 0 && (
                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="text-base">Assigned Drivers</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="space-y-2">
                                                {truck.drivers.map((driver: any) => (
                                                    <Link
                                                        key={driver.id}
                                                        href={`/drivers/${driver.id}`}
                                                        className="block rounded-lg border border-border p-2 text-sm hover:bg-muted"
                                                    >
                                                        {driver.name}
                                                    </Link>
                                                ))}
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}

                                {/* Recent Performances */}
                                {truck.performances && truck.performances.length > 0 && (
                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="text-base">Recent Activities</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <p className="text-sm text-muted-foreground">
                                                {truck.performances.length} performance record{truck.performances.length !== 1 ? 's' : ''} available
                                            </p>
                                        </CardContent>
                                    </Card>
                                )}
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="maintenance" className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Wrench className="h-5 w-5" />
                                    Maintenance Records
                                </CardTitle>
                                <CardDescription>Track maintenance history and upcoming services</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="text-center py-8">
                                    <Wrench className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                    <h3 className="text-lg font-semibold mb-2">No maintenance records</h3>
                                    <p className="text-muted-foreground mb-4">
                                        Maintenance records will appear here when they are created
                                    </p>
                                    <Button>
                                        <Wrench className="mr-2 h-4 w-4" />
                                        Schedule Maintenance
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="performance" className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <BarChart3 className="h-5 w-5" />
                                    Performance Metrics
                                </CardTitle>
                                <CardDescription>View performance data and analytics</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="text-center py-8">
                                    <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                    <h3 className="text-lg font-semibold mb-2">No performance data</h3>
                                    <p className="text-muted-foreground mb-4">
                                        Performance metrics will be displayed here when available
                                    </p>
                                    <Button variant="outline">
                                        <BarChart3 className="mr-2 h-4 w-4" />
                                        View All Performance
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="history" className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <History className="h-5 w-5" />
                                    Activity History
                                </CardTitle>
                                <CardDescription>Complete audit trail of all truck activities</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {activityLogs && activityLogs.length > 0 ? (
                                    <ActivityLogTable logs={activityLogs} />
                                ) : (
                                    <div className="text-center py-8">
                                        <History className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                        <h3 className="text-lg font-semibold mb-2">No activity history</h3>
                                        <p className="text-muted-foreground">
                                            Activity logs will appear here as changes are made
                                        </p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>

            {/* Delete Confirmation Dialog */}
            <DeleteConfirmationDialog
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
                title="Delete Truck"
                description="Are you sure you want to delete this truck? This action cannot be undone and will remove all associated records."
                itemName={truck.plate}
                onConfirm={handleDeleteConfirm}
                isLoading={isDeleting}
            />
        </AppLayout>
    );
}



