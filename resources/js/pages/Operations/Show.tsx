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
    { title: 'Operations', href: '/operations' },
];

interface User { id: number; name: string; }
interface ActivityLog { id: number; description: string; event: string; created_at: string; causer?: User; }
interface Operation {
    id: number; operationid: string; description?: string; status: string;
    startdate?: string; enddate?: string; volume?: number; km?: number; tariff?: number;
    closed?: boolean; created_at: string;
    customer?: { id: number; name: string };
    region?: { id: number; name: string };
    user?: { id: number; name: string };
}
interface OperationsShowProps { operation: Operation; activityLogs?: ActivityLog[]; }

export default function OperationsShow({ operation, activityLogs = [] }: OperationsShowProps) {
    const { hasPermission } = usePermissions();
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = () => {
        setIsDeleting(true);
        router.delete(`/operations/${operation.id}`, {
            onSuccess: () => { setDeleteDialogOpen(false); setIsDeleting(false); },
            onError: () => { setIsDeleting(false); },
        });
    };

    const getStatusColor = (status: string) => {
        return status === 'active'
            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
            : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Operation: ${operation.operationid}`} />
            <div className="flex flex-1 flex-col gap-6">
                {/* Header with Back Button */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.get('/operations')}
                            className="flex items-center gap-2"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Back to Operations
                        </Button>
                        <div>
                            <h1 className="text-2xl font-bold">{operation.operationid}</h1>
                            <p className="text-muted-foreground">View operation details and manage information</p>
                        </div>
                    </div>
                    {(hasPermission('operations.edit') || hasPermission('operations.destroy')) && (
                        <div className="flex gap-2">
                            {hasPermission('operations.edit') && (
                                <Button variant="outline" asChild>
                                    <Link href={`/operations/${operation.id}/edit`}>
                                        <Edit className="mr-2 h-4 w-4" />
                                        Edit
                                    </Link>
                                </Button>
                            )}
                            {hasPermission('operations.destroy') && (
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
                        {/* Operation Information */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Operation Information</CardTitle>
                                <CardDescription>Core operation details</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid gap-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-sm font-medium text-muted-foreground">Operation ID</p>
                                            <p className="mt-1 font-semibold">{operation.operationid}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-muted-foreground">Status</p>
                                            <Badge className={`mt-1 ${getStatusColor(operation.status)}`}>
                                                {operation.status.charAt(0).toUpperCase() + operation.status.slice(1)}
                                            </Badge>
                                        </div>
                                    </div>

                                    <div className="border-t pt-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <p className="text-sm font-medium text-muted-foreground">Customer</p>
                                                <p className="mt-1 text-sm">{operation.customer?.name || 'N/A'}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-muted-foreground">Region</p>
                                                <p className="mt-1 text-sm">{operation.region?.name || 'N/A'}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="border-t pt-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <p className="text-sm font-medium text-muted-foreground">Start Date</p>
                                                <p className="mt-1 text-sm">{operation.startdate ? new Date(operation.startdate).toLocaleDateString() : 'N/A'}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-muted-foreground">End Date</p>
                                                <p className="mt-1 text-sm">{operation.enddate ? new Date(operation.enddate).toLocaleDateString() : 'N/A'}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Operation Metrics */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Metrics</CardTitle>
                                <CardDescription>Volume, distance, and tariff information</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid gap-4">
                                    <div className="grid grid-cols-3 gap-4">
                                        <div>
                                            <p className="text-sm font-medium text-muted-foreground">Volume (MT)</p>
                                            <p className="mt-1 text-lg font-semibold">{operation.volume ? Number(operation.volume).toFixed(2) : 'N/A'}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-muted-foreground">Distance (KM)</p>
                                            <p className="mt-1 text-lg font-semibold">{operation.km ? Number(operation.km).toFixed(2) : 'N/A'}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-muted-foreground">Tariff</p>
                                            <p className="mt-1 text-lg font-semibold">{operation.tariff ? Number(operation.tariff).toFixed(2) : 'N/A'}</p>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Description */}
                        {operation.description && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Description</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm whitespace-pre-wrap">{operation.description}</p>
                                </CardContent>
                            </Card>
                        )}

                        {/* Activity Logs */}
                        {activityLogs.length > 0 && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Activity Log</CardTitle>
                                    <CardDescription>Track all changes made to this operation</CardDescription>
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
                                    <p className="text-sm font-medium text-muted-foreground">Operation ID</p>
                                    <p className="mt-1 font-semibold">{operation.id}</p>
                                </div>
                                <div className="border-t pt-4">
                                    <p className="text-sm font-medium text-muted-foreground">Status</p>
                                    <Badge className={`mt-2 ${getStatusColor(operation.status)}`}>
                                        {operation.status.charAt(0).toUpperCase() + operation.status.slice(1)}
                                    </Badge>
                                </div>
                                <div className="border-t pt-4">
                                    <p className="text-sm font-medium text-muted-foreground">Customer</p>
                                    <p className="mt-1 text-xs">{operation.customer?.name || 'N/A'}</p>
                                </div>
                                <div className="border-t pt-4">
                                    <p className="text-sm font-medium text-muted-foreground">Created</p>
                                    <p className="mt-1 text-xs">{new Date(operation.created_at).toLocaleDateString()}</p>
                                </div>
                                <div className="border-t pt-4">
                                    <p className="text-sm font-medium text-muted-foreground">Closed</p>
                                    <p className="mt-1 text-xs">{operation.closed ? 'Yes' : 'No'}</p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>

            <DeleteConfirmationDialog
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
                title="Delete Operation"
                description={`Are you sure you want to delete operation ${operation.operationid}? This action cannot be undone.`}
                onConfirm={handleDelete}
                isLoading={isDeleting}
            />
        </AppLayout>
    );
}
