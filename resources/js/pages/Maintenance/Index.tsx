import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
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
    DollarSign,
    BarChart3
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
                return <Badge variant="secondary"><Clock className="mr-1 h-3 w-3" />Scheduled</Badge>;
            case 'in_progress':
                return <Badge variant="default"><Wrench className="mr-1 h-3 w-3" />In Progress</Badge>;
            case 'completed':
                return <Badge className="bg-green-600 hover:bg-green-700"><CheckCircle className="mr-1 h-3 w-3" />Completed</Badge>;
            case 'overdue':
                return <Badge variant="destructive"><AlertTriangle className="mr-1 h-3 w-3" />Overdue</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    const getCategoryColor = (category: string) => {
        switch (category) {
            case 'Preventive':
                return 'text-blue-600 dark:text-blue-400';
            case 'Corrective':
                return 'text-orange-600 dark:text-orange-400';
            case 'Emergency':
                return 'text-red-600 dark:text-red-400';
            default:
                return 'text-gray-600 dark:text-gray-400';
        }
    };

    const maintenanceData = maintenanceRecords?.data || [];
    const stats = statistics || {
        total_scheduled: 0,
        total_completed: 0,
        total_overdue: 0,
        total_cost: 0,
        average_cost: 0,
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Maintenance Management" />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-hidden rounded-xl p-4">
                {/* Header Section */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">Maintenance</h1>
                        <p className="text-muted-foreground mt-2">
                            Manage maintenance records and schedules
                        </p>
                    </div>
                    <Button asChild>
                        <Link href="/maintenance/create">
                            <Plus className="mr-2 h-4 w-4" />
                            Schedule Maintenance
                        </Link>
                    </Button>
                </div>

                {/* Statistics Cards */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Scheduled</CardTitle>
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.total_scheduled}</div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Completed</CardTitle>
                            <CheckCircle className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.total_completed}</div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
                            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-red-600">{stats.total_overdue}</div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {stats.total_cost ? `$${Number(stats.total_cost).toLocaleString()}` : '$0'}
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
                                {stats.average_cost
                                    ? `$${Number(stats.average_cost).toFixed(2)}`
                                    : '$0'}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Maintenance Records Table */}
                <Card className="flex flex-1 flex-col overflow-hidden">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle>Maintenance Records</CardTitle>
                            <CardDescription>Manage vehicle maintenance schedules and records</CardDescription>
                        </div>
                        <Button asChild>
                            <Link href="/maintenance/create">
                                <Plus className="mr-2 h-4 w-4" />
                                Schedule Maintenance
                            </Link>
                        </Button>
                    </CardHeader>
                    <CardContent className="flex-1 overflow-auto">
                        <div className="rounded-lg border">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-muted/50">
                                        <TableHead>Truck</TableHead>
                                        <TableHead>Maintenance Type</TableHead>
                                        <TableHead>Category</TableHead>
                                        <TableHead>Scheduled Date</TableHead>
                                        <TableHead>Completed Date</TableHead>
                                        <TableHead>Cost</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {maintenanceData.length > 0 ? (
                                        maintenanceData.map((record) => (
                                            <TableRow
                                                key={record.id}
                                                className={`hover:bg-muted/50 ${
                                                    record.status === 'overdue' ? 'bg-red-50 dark:bg-red-950/20' : ''
                                                }`}
                                            >
                                                <TableCell className="font-medium font-mono">
                                                    {record.truck?.plate || '-'}
                                                </TableCell>
                                                <TableCell>
                                                    {record.maintenanceType?.name || '-'}
                                                </TableCell>
                                                <TableCell>
                                                    <span className={getCategoryColor(record.maintenanceType?.category || '')}>
                                                        {record.maintenanceType?.category || 'N/A'}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-muted-foreground">
                                                    {new Date(record.scheduled_date).toLocaleDateString()}
                                                </TableCell>
                                                <TableCell className="text-muted-foreground">
                                                    {record.completed_date
                                                        ? new Date(record.completed_date).toLocaleDateString()
                                                        : '-'
                                                    }
                                                </TableCell>
                                                <TableCell className="font-medium">
                                                    {record.cost
                                                        ? `$${Number(record.cost).toFixed(2)}`
                                                        : '-'
                                                    }
                                                </TableCell>
                                                <TableCell>
                                                    {getStatusBadge(record.status)}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <Button asChild size="sm" variant="ghost">
                                                            <Link href={`/maintenance/${record.id}`}>
                                                                <Eye className="h-4 w-4" />
                                                            </Link>
                                                        </Button>
                                                        <Button asChild size="sm" variant="ghost">
                                                            <Link href={`/maintenance/${record.id}/edit`}>
                                                                <Edit className="h-4 w-4" />
                                                            </Link>
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={8} className="py-8 text-center text-muted-foreground">
                                                No maintenance records found.
                                                <Link href="/maintenance/create" className="ml-1 text-primary underline">
                                                    Create one
                                                </Link>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Pagination */}
                        {maintenanceRecords.links && maintenanceRecords.links.length > 3 && (
                            <div className="mt-6 flex justify-center gap-2">
                                {maintenanceRecords.links.map((link, index) => (
                                    <Button
                                        key={index}
                                        asChild
                                        variant={link.active ? 'default' : 'outline'}
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



