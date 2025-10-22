import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import AppLayout from '@/layouts/app-layout';
import { Head, Link } from '@inertiajs/react';
import { type BreadcrumbItem } from '@/types';
import { ArrowLeft, Edit, Trash2 } from 'lucide-react';
import { usePermissions } from '@/hooks/use-permissions';
import { useState } from 'react';
import { DeleteConfirmationDialog } from '@/components/delete-confirmation-dialog';
import { router } from '@inertiajs/react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Driver Safety',
        href: '/driver-safety',
    },
    {
        title: 'View',
        href: '#',
    },
];

interface Driver {
    id: number;
    name: string;
}

interface User {
    id: number;
    name: string;
}

interface ActivityLog {
    id: number;
    description: string;
    event: string;
    created_at: string;
    causer?: User;
    properties?: Record<string, any>;
}

interface SafetyRecord {
    id: number;
    driver_id: number;
    driver?: Driver;
    incident_date: string;
    incident_type: string;
    severity: string;
    description: string;
    damage_cost?: number;
    location?: string;
    resolution?: string;
    created_at: string;
    updated_at: string;
}

interface DriverSafetyShowProps {
    driverSafety: SafetyRecord;
    activityLogs?: ActivityLog[];
}

export default function DriverSafetyShow({
    driverSafety,
    activityLogs = [],
}: DriverSafetyShowProps) {
    const { hasPermission } = usePermissions();
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = () => {
        setIsDeleting(true);
        router.delete(`/driver-safety/${driverSafety.id}`, {
            onSuccess: () => {
                setDeleteDialogOpen(false);
                setIsDeleting(false);
            },
            onError: () => {
                setIsDeleting(false);
            },
        });
    };

    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case 'critical':
                return 'bg-red-100 text-red-800';
            case 'major':
                return 'bg-orange-100 text-orange-800';
            case 'minor':
                return 'bg-yellow-100 text-yellow-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const getIncidentTypeColor = (type: string) => {
        switch (type) {
            case 'accident':
                return 'bg-red-100 text-red-800';
            case 'violation':
                return 'bg-orange-100 text-orange-800';
            case 'warning':
                return 'bg-blue-100 text-blue-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Safety Record #${driverSafety.id}`} />

            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/driver-safety" className="text-gray-600 hover:text-gray-900">
                            <ArrowLeft size={20} />
                        </Link>
                        <div>
                            <h1 className="text-3xl font-bold">Safety Record #{driverSafety.id}</h1>
                            <p className="text-gray-600 mt-1">
                                {driverSafety.driver?.name}
                            </p>
                        </div>
                    </div>

                    {(hasPermission('driver-safety.edit') ||
                        hasPermission('driver-safety.destroy')) && (
                        <div className="flex gap-2">
                            {hasPermission('driver-safety.edit') && (
                                <Link href={`/driver-safety/${driverSafety.id}/edit`}>
                                    <Button className="gap-2">
                                        <Edit size={16} />
                                        Edit
                                    </Button>
                                </Link>
                            )}
                            {hasPermission('driver-safety.destroy') && (
                                <Button
                                    variant="destructive"
                                    className="gap-2"
                                    onClick={() => setDeleteDialogOpen(true)}
                                >
                                    <Trash2 size={16} />
                                    Delete
                                </Button>
                            )}
                        </div>
                    )}
                </div>

                {/* Incident Details */}
                <Card>
                    <CardHeader>
                        <CardTitle>Incident Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="text-sm font-medium text-gray-600">
                                    Driver
                                </label>
                                <p className="mt-1 text-lg">
                                    {driverSafety.driver?.name || 'N/A'}
                                </p>
                            </div>

                            <div>
                                <label className="text-sm font-medium text-gray-600">
                                    Incident Date
                                </label>
                                <p className="mt-1 text-lg">
                                    {new Date(
                                        driverSafety.incident_date
                                    ).toLocaleDateString()}
                                </p>
                            </div>

                            <div>
                                <label className="text-sm font-medium text-gray-600">
                                    Incident Type
                                </label>
                                <p className="mt-1">
                                    <Badge
                                        className={getIncidentTypeColor(
                                            driverSafety.incident_type
                                        )}
                                    >
                                        {driverSafety.incident_type}
                                    </Badge>
                                </p>
                            </div>

                            <div>
                                <label className="text-sm font-medium text-gray-600">
                                    Severity
                                </label>
                                <p className="mt-1">
                                    <Badge
                                        className={getSeverityColor(driverSafety.severity)}
                                    >
                                        {driverSafety.severity}
                                    </Badge>
                                </p>
                            </div>

                            {driverSafety.location && (
                                <div>
                                    <label className="text-sm font-medium text-gray-600">
                                        Location
                                    </label>
                                    <p className="mt-1 text-lg">
                                        {driverSafety.location}
                                    </p>
                                </div>
                            )}

                            {driverSafety.damage_cost && (
                                <div>
                                    <label className="text-sm font-medium text-gray-600">
                                        Damage Cost
                                    </label>
                                    <p className="mt-1 text-lg">
                                        ${driverSafety.damage_cost.toFixed(2)}
                                    </p>
                                </div>
                            )}
                        </div>

                        <div>
                            <label className="text-sm font-medium text-gray-600">
                                Description
                            </label>
                            <p className="mt-2 text-gray-700 whitespace-pre-wrap">
                                {driverSafety.description}
                            </p>
                        </div>

                        {driverSafety.resolution && (
                            <div>
                                <label className="text-sm font-medium text-gray-600">
                                    Resolution
                                </label>
                                <p className="mt-2 text-gray-700 whitespace-pre-wrap">
                                    {driverSafety.resolution}
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Activity Log */}
                {activityLogs && activityLogs.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Activity Log</CardTitle>
                            <CardDescription>
                                Track all changes made to this record
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {activityLogs.map((log) => (
                                    <div key={log.id} className="flex gap-4 pb-4 border-b last:border-0">
                                        <div className="min-w-24">
                                            <span className="text-sm font-medium text-gray-600">
                                                {new Date(log.created_at).toLocaleDateString()}
                                            </span>
                                            <p className="text-xs text-gray-500">
                                                {new Date(log.created_at).toLocaleTimeString()}
                                            </p>
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm">
                                                <span className="font-medium">
                                                    {log.causer?.name || 'System'}
                                                </span>{' '}
                                                <span className="text-gray-600">
                                                    {log.description}
                                                </span>
                                            </p>
                                            {log.properties && Object.keys(log.properties).length > 0 && (
                                                <p className="text-xs text-gray-500 mt-1">
                                                    {Object.entries(log.properties)
                                                        .map(
                                                            ([key, value]) =>
                                                                `${key}: ${JSON.stringify(value)}`
                                                        )
                                                        .join(', ')}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>

            <DeleteConfirmationDialog
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
                title="Delete Safety Record"
                description={`Are you sure you want to delete this safety record for ${driverSafety.driver?.name}? This action cannot be undone.`}
                onConfirm={handleDelete}
                isLoading={isDeleting}
            />
        </AppLayout>
    );
}

