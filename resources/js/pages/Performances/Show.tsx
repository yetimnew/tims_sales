import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import AppLayout from '@/layouts/app-layout';
import { Head, Link, router } from '@inertiajs/react';
import { type BreadcrumbItem } from '@/types';
import { ArrowLeft, Edit, Trash2 } from 'lucide-react';
import { usePermissions } from '@/hooks/use-permissions';
import { useState } from 'react';
import { DeleteConfirmationDialog } from '@/components/delete-confirmation-dialog';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Performances', href: '/performances' },
];

interface User { id: number; name: string; }
interface ActivityLog { id: number; description: string; event: string; created_at: string; causer?: User; properties?: Record<string, any>; }
interface Performance {
    id: number; trip: string; LoadType: string; FOnumber: string; DateDispach: string;
    DistanceWCargo?: number; DistanceWOCargo?: number; tonkm?: number; CargoVolumMT?: number;
    fuelInLitter?: number; fuelInBirr?: number; perdiem?: number; other?: number; comment?: string;
    satus: string; is_returned: boolean; created_at: string;
}

interface PerformancesShowProps { performance: Performance; activityLogs?: ActivityLog[]; }

export default function PerformancesShow({ performance, activityLogs = [] }: PerformancesShowProps) {
    const { hasPermission } = usePermissions();
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = () => {
        setIsDeleting(true);
        router.delete(`/performances/${performance.id}`, {
            onSuccess: () => { setDeleteDialogOpen(false); setIsDeleting(false); },
            onError: () => { setIsDeleting(false); },
        });
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
            case 'ongoing': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
            case 'cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
            default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
        }
    };

    const getLoadTypeColor = (type: string) => {
        switch (type) {
            case 'main': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
            case 'return': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
            case 'empty': return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
            default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Performance #${performance.id}`} />
            <div className="flex flex-1 flex-col gap-6">
                {/* Header with Back Button */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.get('/performances')}
                            className="flex items-center gap-2"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Back to Performances
                        </Button>
                        <div>
                            <h1 className="text-2xl font-bold">Trip {performance.trip}</h1>
                            <p className="text-muted-foreground">View performance details and manage information</p>
                        </div>
                    </div>
                    {(hasPermission('performances.edit') || hasPermission('performances.destroy')) && (
                        <div className="flex gap-2">
                            {hasPermission('performances.edit') && (
                                <Button variant="outline" asChild>
                                    <Link href={`/performances/${performance.id}/edit`}>
                                        <Edit className="mr-2 h-4 w-4" />
                                        Edit
                                    </Link>
                                </Button>
                            )}
                            {hasPermission('performances.destroy') && (
                                <Button variant="destructive" onClick={() => setDeleteDialogOpen(true)}>
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete
                                </Button>
                            )}
                        </div>
                    )}
                </div>

                <div className="grid gap-6 lg:grid-cols-3">
                    {/* Main Details */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Trip Information */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Trip Information</CardTitle>
                                <CardDescription>Core performance details and specifications</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid gap-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-sm font-medium text-muted-foreground">Trip</p>
                                            <p className="mt-1 font-semibold">{performance.trip}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-muted-foreground">FO Number</p>
                                            <p className="mt-1 text-sm font-mono">{performance.FOnumber}</p>
                                        </div>
                                    </div>

                                    <div className="border-t pt-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <p className="text-sm font-medium text-muted-foreground">Load Type</p>
                                                <Badge className={`mt-1 ${getLoadTypeColor(performance.LoadType)}`}>
                                                    {performance.LoadType.charAt(0).toUpperCase() + performance.LoadType.slice(1)}
                                                </Badge>
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-muted-foreground">Status</p>
                                                <Badge className={`mt-1 ${getStatusColor(performance.satus)}`}>
                                                    {performance.satus.charAt(0).toUpperCase() + performance.satus.slice(1)}
                                                </Badge>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="border-t pt-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <p className="text-sm font-medium text-muted-foreground">Dispatch Date</p>
                                                <p className="mt-1 text-sm">{new Date(performance.DateDispach).toLocaleDateString()}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-muted-foreground">Is Returned</p>
                                                <p className="mt-1 text-sm">{performance.is_returned ? 'Yes' : 'No'}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Distance & Cargo Information */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Distance & Cargo</CardTitle>
                                <CardDescription>Trip distance and cargo details</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid gap-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-sm font-medium text-muted-foreground">Distance with Cargo (km)</p>
                                            <p className="mt-1 text-sm">{performance.DistanceWCargo?.toFixed(2) || 'N/A'}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-muted-foreground">Distance without Cargo (km)</p>
                                            <p className="mt-1 text-sm">{performance.DistanceWOCargo?.toFixed(2) || 'N/A'}</p>
                                        </div>
                                    </div>

                                    <div className="border-t pt-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <p className="text-sm font-medium text-muted-foreground">Cargo Volume (MT)</p>
                                                <p className="mt-1 text-sm">{performance.CargoVolumMT?.toFixed(2) || 'N/A'}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-muted-foreground">Ton-KM</p>
                                                <p className="mt-1 text-sm">{performance.tonkm?.toFixed(2) || 'N/A'}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Financial Information */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Financial Details</CardTitle>
                                <CardDescription>Costs and expenses for this trip</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid gap-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-sm font-medium text-muted-foreground">Fuel (Liters)</p>
                                            <p className="mt-1 text-sm">{performance.fuelInLitter?.toFixed(2) || 'N/A'}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-muted-foreground">Fuel Cost (Birr)</p>
                                            <p className="mt-1 text-sm font-semibold">{performance.fuelInBirr?.toFixed(2) || 'N/A'}</p>
                                        </div>
                                    </div>

                                    <div className="border-t pt-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <p className="text-sm font-medium text-muted-foreground">Per Diem (Birr)</p>
                                                <p className="mt-1 text-sm">{performance.perdiem?.toFixed(2) || 'N/A'}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-muted-foreground">Other Costs (Birr)</p>
                                                <p className="mt-1 text-sm">{performance.other?.toFixed(2) || 'N/A'}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Comments */}
                        {performance.comment && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Comments</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm whitespace-pre-wrap">{performance.comment}</p>
                                </CardContent>
                            </Card>
                        )}

                        {/* Activity Logs */}
                        {activityLogs.length > 0 && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Activity Log</CardTitle>
                                    <CardDescription>Track all changes made to this performance record</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        {activityLogs.map((log) => (
                                            <div key={log.id} className="flex gap-4 pb-4 border-b last:border-0">
                                                <div className="min-w-24">
                                                    <span className="text-sm font-medium text-muted-foreground">{new Date(log.created_at).toLocaleDateString()}</span>
                                                    <p className="text-xs text-muted-foreground">{new Date(log.created_at).toLocaleTimeString()}</p>
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-sm">
                                                        <span className="font-medium">{log.causer?.name || 'System'}</span>
                                                        <span className="text-muted-foreground"> {log.description}</span>
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    {/* Sidebar */}
                    <div className="lg:col-span-1">
                        <Card className="sticky top-4">
                            <CardHeader>
                                <CardTitle className="text-lg">Quick Info</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Trip ID</p>
                                    <p className="mt-1 font-semibold">{performance.id}</p>
                                </div>
                                <div className="border-t pt-4">
                                    <p className="text-sm font-medium text-muted-foreground">Status</p>
                                    <Badge className={`mt-2 ${getStatusColor(performance.satus)}`}>
                                        {performance.satus.charAt(0).toUpperCase() + performance.satus.slice(1)}
                                    </Badge>
                                </div>
                                <div className="border-t pt-4">
                                    <p className="text-sm font-medium text-muted-foreground">Created</p>
                                    <p className="mt-1 text-xs">{new Date(performance.created_at).toLocaleDateString()}</p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>

            <DeleteConfirmationDialog
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
                title="Delete Performance"
                description={`Are you sure you want to delete trip ${performance.trip}? This action cannot be undone.`}
                onConfirm={handleDelete}
                isLoading={isDeleting}
            />
        </AppLayout>
    );
}

