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
import { router } from '@inertiajs/react';
import ReactPaginate from 'react-paginate';
import { Wrench, AlertTriangle, CheckCircle, Clock, Plus, Eye, Edit } from 'lucide-react';
const breadcrumbs = [
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

export default function MaintenanceIndex({ maintenanceRecords, statistics }: MaintenanceIndexProps) {
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

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Maintenance Management" />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-hidden rounded-xl p-4">
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
                <div className="mt-4 flex items-center justify-between w-full">
                    <div className="text-sm text-muted-foreground">
                        Showing <span className="font-semibold text-foreground">{maintenanceRecords.meta?.from}</span> to <span className="font-semibold text-foreground">{maintenanceRecords.meta?.to}</span> of <span className="font-semibold text-foreground">{maintenanceRecords.meta?.total}</span> records
                    </div>
                    <div>
                        <ReactPaginate
                            pageCount={maintenanceRecords.meta?.last_page || 1}
                            forcePage={(maintenanceRecords.meta?.current_page || 1) - 1}
                            onPageChange={({ selected }) => {
                                router.get('/maintenance', {
                                    page: selected + 1
                                }, { preserveState: true });
                            }}
                            containerClassName="pagination flex gap-2"
                            pageClassName="page-item"
                            pageLinkClassName="page-link px-2 py-1 rounded"
                            previousClassName="page-item"
                            previousLinkClassName="page-link px-2 py-1 rounded"
                            nextClassName="page-item"
                            nextLinkClassName="page-link px-2 py-1 rounded"
                            breakClassName="page-item"
                            breakLinkClassName="page-link px-2 py-1 rounded"
                            activeClassName="bg-primary text-white"
                            disabledClassName="opacity-50 cursor-not-allowed"
                            marginPagesDisplayed={1}
                            pageRangeDisplayed={3}
                            previousLabel={"<"}
                            nextLabel={">"}
                        />
                    </div>
                </div>
                <Card className="mt-4">
                    <CardContent>
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Truck</TableHead>
                                        <TableHead>Type</TableHead>
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
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}






