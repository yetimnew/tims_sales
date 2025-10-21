import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import AppLayout from '@/layouts/app-layout';
import { Head, Link } from '@inertiajs/react';
import { type BreadcrumbItem } from '@/types';
import {
    Wrench,
    Calendar,
    AlertTriangle,
    CheckCircle,
    Clock,
    Plus,
    Eye,
    Edit,
    Trash2
} from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Maintenance',
        href: '/maintenance',
    },
];

interface MaintenanceRecord {
    id: number;
    scheduled_date: string;
    completed_date?: string;
    status: string;
    cost?: number;
    description?: string;
    truck: {
        id: number;
        plate: string;
    };
    maintenanceType: {
        id: number;
        name: string;
        category: string;
    };
    assignedMechanic?: {
        id: number;
        name: string;
    };
}

interface MaintenanceIndexProps {
    maintenanceRecords: {
        data: MaintenanceRecord[];
        links: any[];
        meta: any;
    };
    statistics: {
        total_scheduled: number;
        total_completed: number;
        total_overdue: number;
        total_cost: number;
        average_cost: number;
    };
}

export default function MaintenanceIndex({
    maintenanceRecords,
    statistics
}: MaintenanceIndexProps) {
    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'scheduled':
                return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Scheduled</Badge>;
            case 'in_progress':
                return <Badge variant="default"><Wrench className="h-3 w-3 mr-1" />In Progress</Badge>;
            case 'completed':
                return <Badge variant="success"><CheckCircle className="h-3 w-3 mr-1" />Completed</Badge>;
            case 'overdue':
                return <Badge variant="destructive"><AlertTriangle className="h-3 w-3 mr-1" />Overdue</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    const getCategoryColor = (category: string) => {
        switch (category) {
            case 'Preventive':
                return 'text-blue-600';
            case 'Corrective':
                return 'text-orange-600';
            case 'Emergency':
                return 'text-red-600';
            default:
                return 'text-gray-600';
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Maintenance Management" />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl p-4">
                {/* Statistics Cards */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Scheduled</CardTitle>
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{statistics.total_scheduled}</div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Completed</CardTitle>
                            <CheckCircle className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{statistics.total_completed}</div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
                            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-red-600">{statistics.total_overdue}</div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {statistics.total_cost ? `$${statistics.total_cost.toLocaleString()}` : '$0'}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Average Cost</CardTitle>
                            <BarChart3 className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {statistics.average_cost ? `$${statistics.average_cost.toFixed(2)}` : '$0'}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Maintenance Records */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle>Maintenance Records</CardTitle>
                            <CardDescription>Manage vehicle maintenance schedules and records</CardDescription>
                        </div>
                        <Button asChild>
                            <Link href="/maintenance/create">
                                <Plus className="h-4 w-4 mr-2" />
                                Schedule Maintenance
                            </Link>
                        </Button>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {maintenanceRecords.data.map((record) => (
                                <div key={record.id} className="flex items-center justify-between p-4 border rounded-lg">
                                    <div className="space-y-1">
                                        <div className="font-medium">{record.truck.plate}</div>
                                        <div className="text-sm text-muted-foreground">
                                            {record.maintenanceType.name} -
                                            <span className={getCategoryColor(record.maintenanceType.category)}>
                                                {record.maintenanceType.category}
                                            </span>
                                        </div>
                                        <div className="text-sm text-muted-foreground">
                                            Scheduled: {new Date(record.scheduled_date).toLocaleDateString()}
                                        </div>
                                        {record.description && (
                                            <div className="text-sm text-muted-foreground">
                                                {record.description}
                                            </div>
                                        )}
                                    </div>
                                    <div className="text-right space-y-2">
                                        {getStatusBadge(record.status)}
                                        {record.cost && (
                                            <div className="font-medium">${record.cost.toFixed(2)}</div>
                                        )}
                                        <div className="flex gap-2">
                                            <Button asChild size="sm" variant="outline">
                                                <Link href={`/maintenance/${record.id}`}>
                                                    <Eye className="h-4 w-4" />
                                                </Link>
                                            </Button>
                                            <Button asChild size="sm" variant="outline">
                                                <Link href={`/maintenance/${record.id}/edit`}>
                                                    <Edit className="h-4 w-4" />
                                                </Link>
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}



