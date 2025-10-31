import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { DeleteConfirmationDialog } from '@/components/delete-confirmation-dialog';
import { usePermissions } from '@/hooks/use-permissions';
import { Head, Link, router } from '@inertiajs/react';
import { type BreadcrumbItem } from '@/types';
import {
    Plus,
    Search,
    Eye,
    Edit,
    Trash2,
    ArrowUpDown,
    ChevronLeft,
    ChevronRight,
    FileDown,
    CheckCircle,
    XCircle,
    Activity
} from 'lucide-react';
import { InertiaPagination } from '@/components/ui/pagination';
import * as React from 'react';

interface DriverTruck {
    id: number;
    driver_id: number;
    truck_id: number;
    plate: string;
    driverid: string;
    date_recived: string;
    date_detach?: string;
    reason?: string;
    is_attached: boolean;
    status: string;
    driver: {
        id: number;
        name: string;
        driverid: string;
    };
    truck: {
        id: number;
        plate: string;
        vehicletype: {
            name: string;
        };
    };
    created_at: string;
    updated_at: string;
}

interface Filters {
    search: string;
    status: string;
}

interface DriverTrucksIndexProps {
    driverTrucks: {
        data: DriverTruck[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
        from: number;
        to: number;
        links: Array<{
            url: string | null;
            label: string;
            active: boolean;
        }>;
    };
    filters: Filters;
    statistics: {
        total: number;
        attached: number;
        detached: number;
        availableDrivers: number;
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Fleet Management',
        href: '#',
    },
    {
        title: 'Driver-Truck Assignments',
        href: '/driver-trucks',
    },
];

export default function Index({ driverTrucks, filters, statistics }: DriverTrucksIndexProps) {
    // Add null checking to prevent white space errors
    if (!driverTrucks || !statistics) {
        return (
            <AppLayout breadcrumbs={[]}>
                <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                        <h2 className="text-lg font-semibold text-gray-900">Loading...</h2>
                        <p className="text-gray-600">Please wait while we load the assignments data.</p>
                    </div>
                </div>
            </AppLayout>
        );
    }

    const { hasPermission } = usePermissions();
    const [searchTerm, setSearchTerm] = React.useState(filters?.search || '');
    const [statusFilter, setStatusFilter] = React.useState(filters?.status || '');
    const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
    const [selectedAssignment, setSelectedAssignment] = React.useState<DriverTruck | null>(null);
    const [isDeleting, setIsDeleting] = React.useState(false);

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setSearchTerm(value);

        router.get('/driver-trucks',
            { search: value, status: statusFilter },
            { preserveState: true, replace: false }
        );
    };

    const handleFilterChange = (key: string, value: string) => {
        if (key === 'status') {
            setStatusFilter(value);
        }
        router.get(
            '/driver-trucks',
            { ...filters, [key]: value },
            {
                preserveState: true,
                replace: true,
            }
        );
    };

    const handleDeleteClick = (assignment: DriverTruck) => {
        setSelectedAssignment(assignment);
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = () => {
        if (!selectedAssignment) return;

        setIsDeleting(true);
        router.delete(`/driver-trucks/${selectedAssignment.id}`, {
            onSuccess: () => {
                setDeleteDialogOpen(false);
                setSelectedAssignment(null);
                setIsDeleting(false);
            },
            onError: () => {
                setIsDeleting(false);
            },
        });
    };

    const assignmentCount = statistics.total || driverTrucks?.total || 0;
    const perPage = driverTrucks?.per_page || 15;
    const currentPage = driverTrucks?.current_page || 1;
    const totalPages = driverTrucks?.last_page || 1;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Driver-Truck Assignments" />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-y-auto rounded-xl p-4">
                {/* Header Section */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">Driver-Truck Assignments</h1>
                        <p className="text-muted-foreground mt-2">
                            Manage driver and truck assignments ({assignmentCount} total)
                        </p>
                    </div>
                    <div className="flex gap-2">
                        {hasPermission('driver-trucks.view') && (
                            <Link href="/reports/driver-truck-attach-detach">
                                <Button variant="outline">
                                    <Calendar className="mr-2 h-4 w-4" />
                                    View History
                                </Button>
                            </Link>
                        )}
                        {hasPermission('driver-trucks.create') && (
                            <Button asChild>
                                <Link href="/driver-trucks/create">
                                    <Plus className="mr-2 h-4 w-4" />
                                    Assign Driver-Truck
                                </Link>
                            </Button>
                        )}
                    </div>
                </div>

                {/* Enhanced Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <Card className="border-l-4 border-l-blue-500 hover:shadow-md transition-all duration-200">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-medium text-muted-foreground mb-1">Total Assignments</p>
                                    <p className="text-2xl font-bold text-blue-600">{assignmentCount}</p>
                                    <p className="text-xs text-muted-foreground">All assignments</p>
                                </div>
                                <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                                    <UserCheck className="h-5 w-5 text-blue-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-l-4 border-l-green-500 hover:shadow-md transition-all duration-200">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-medium text-muted-foreground mb-1">Attached</p>
                                    <p className="text-2xl font-bold text-green-600">{statistics.attached}</p>
                                    <p className="text-xs text-muted-foreground">Currently active</p>
                                </div>
                                <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
                                    <CheckCircle className="h-5 w-5 text-green-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-l-4 border-l-yellow-500 hover:shadow-md transition-all duration-200">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-medium text-muted-foreground mb-1">Detached</p>
                                    <p className="text-2xl font-bold text-yellow-600">{statistics.detached}</p>
                                    <p className="text-xs text-muted-foreground">Previously assigned</p>
                                </div>
                                <div className="h-10 w-10 bg-yellow-100 rounded-full flex items-center justify-center">
                                    <UserX className="h-5 w-5 text-yellow-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-l-4 border-l-purple-500 hover:shadow-md transition-all duration-200">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-medium text-muted-foreground mb-1">Available Drivers</p>
                                    <p className="text-2xl font-bold text-purple-600">{statistics.availableDrivers}</p>
                                    <p className="text-xs text-muted-foreground">Ready for assignment</p>
                                </div>
                                <div className="h-10 w-10 bg-purple-100 rounded-full flex items-center justify-center">
                                    <User className="h-5 w-5 text-purple-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Table Section */}
                <Card className="flex flex-1 flex-col overflow-hidden">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle>Driver-Truck Assignments</CardTitle>
                                <CardDescription>
                                    {assignmentCount} total assignment{assignmentCount !== 1 ? 's' : ''} in system
                                </CardDescription>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="relative w-80">
                                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search by driver name, driver ID, or truck plate..."
                                        value={searchTerm}
                                        onChange={handleSearch}
                                        className="pl-10 focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <Select
                                    value={statusFilter || "all"}
                                    onValueChange={(value) => handleFilterChange('status', value === "all" ? "" : value)}
                                >
                                    <SelectTrigger className="w-[180px]">
                                        <SelectValue placeholder="Filter by status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Status</SelectItem>
                                        <SelectItem value="attached">Attached</SelectItem>
                                        <SelectItem value="detached">Detached</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="flex-1 p-0 flex flex-col overflow-hidden">
                        <div className="rounded-lg border overflow-auto max-h-[55vh] relative flex-1">
                            <Table>
                                <TableHeader>
                                    <TableRow className="sticky top-0 z-50 bg-background border-b">
                                        <TableHead>Driver</TableHead>
                                        <TableHead>Truck</TableHead>
                                        <TableHead>Vehicle Type</TableHead>
                                        <TableHead>Assigned Date</TableHead>
                                        <TableHead>Detached Date</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-center">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {driverTrucks?.data && driverTrucks.data.length > 0 ? (
                                        driverTrucks.data.map((assignment) => (
                                            <TableRow key={assignment.id} className="hover:bg-muted/50">
                                                <TableCell className="font-medium">
                                                    <div>
                                                        <div className="font-medium">{assignment.driver.name}</div>
                                                        <div className="text-sm text-muted-foreground">
                                                            ID: {assignment.driver.driverid}
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-muted-foreground">
                                                    {assignment.truck.plate}
                                                </TableCell>
                                                <TableCell className="text-muted-foreground">
                                                    {assignment.truck.vehicletype?.name || 'N/A'}
                                                </TableCell>
                                                <TableCell className="text-muted-foreground">
                                                    {new Date(assignment.date_recived).toLocaleDateString()}
                                                </TableCell>
                                                <TableCell className="text-muted-foreground">
                                                    {assignment.date_detach
                                                        ? new Date(assignment.date_detach).toLocaleDateString()
                                                        : '—'
                                                    }
                                                </TableCell>
                                                <TableCell>
                                                    <Badge
                                                        className={`flex items-center gap-1 w-fit ${
                                                            assignment.is_attached
                                                                ? 'bg-green-100 text-green-800 border-green-200 hover:bg-green-200'
                                                                : 'bg-red-100 text-red-800 border-red-200 hover:bg-red-200'
                                                        }`}
                                                    >
                                                        {assignment.is_attached ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                                                        {assignment.is_attached ? 'Attached' : 'Detached'}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <div className="flex justify-center gap-2">
                                                        <Button asChild size="sm" variant="ghost">
                                                            <Link href={`/driver-trucks/${assignment.id}`}>
                                                                <Eye className="h-4 w-4" />
                                                            </Link>
                                                        </Button>
                                                        {hasPermission('driver-trucks.edit') && (
                                                            <Button asChild size="sm" variant="ghost">
                                                                <Link href={`/driver-trucks/${assignment.id}/edit`}>
                                                                    <Edit className="h-4 w-4" />
                                                                </Link>
                                                            </Button>
                                                        )}
                                                        {assignment.is_attached && hasPermission('driver-trucks.detach') && (
                                                            <Button asChild size="sm" variant="ghost" className="text-orange-600 hover:text-orange-700 hover:bg-orange-50">
                                                                <Link href={`/driver-trucks/${assignment.id}/detach`}>
                                                                    <UserX className="h-4 w-4" />
                                                                </Link>
                                                            </Button>
                                                        )}
                                                        {hasPermission('driver-trucks.destroy') && (
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                onClick={() => handleDeleteClick(assignment)}
                                                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        )}
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={7} className="py-16">
                                                <div className="flex flex-col items-center justify-center text-center">
                                                    <div className="h-20 w-20 bg-muted/50 rounded-full flex items-center justify-center mb-6">
                                                        <UserCheck className="h-10 w-10 text-muted-foreground" />
                                                    </div>
                                                    <h3 className="text-xl font-semibold mb-2">No assignments found</h3>
                                                    <p className="text-muted-foreground mb-6 max-w-md">
                                                        {searchTerm
                                                            ? `No assignments match "${searchTerm}". Try adjusting your search terms.`
                                                            : "Get started by assigning drivers to trucks. Build efficient fleet management."
                                                        }
                                                    </p>
                                                    {hasPermission('driver-trucks.create') && (
                                                        <Button asChild size="lg" className="shadow-lg">
                                                            <Link href="/driver-trucks/create">
                                                                <Plus className="mr-2 h-4 w-4" />
                                                                {searchTerm ? 'Clear Search & Assign' : 'Create First Assignment'}
                                                            </Link>
                                                        </Button>
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Pagination */}
                        <InertiaPagination
                            from={driverTrucks?.from}
                            to={driverTrucks?.to}
                            total={assignmentCount}
                            links={driverTrucks?.links}
                            currentPage={currentPage}
                            lastPage={totalPages}
                            className="mt-0 p-4 border-t bg-muted/30 flex-shrink-0"
                        />
                    </CardContent>
                </Card>
            </div>

            {/* Delete Confirmation Dialog */}
            <DeleteConfirmationDialog
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
                title="Delete Assignment"
                description="Are you sure you want to delete this driver-truck assignment? This action cannot be undone."
                itemName={`${selectedAssignment?.driver.name} → ${selectedAssignment?.truck.plate}`}
                onConfirm={handleDeleteConfirm}
                isLoading={isDeleting}
            />
        </AppLayout>
    );
}
