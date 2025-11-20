import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import ListPageLayout from '@/components/layouts/list-page-layout';
import { usePermissions } from '@/hooks/use-permissions';
import { Link, router } from '@inertiajs/react';
import { type BreadcrumbItem } from '@/types';
import { DeleteConfirmationDialog } from '@/components/delete-confirmation-dialog';
import { toast } from '@/hooks/use-toast';
import { Plus, Eye, Edit, Search, ArrowUpDown, Trash2, Truck, User, UserCheck, UserX } from 'lucide-react';
import { InertiaPagination } from '@/components/ui/pagination';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import * as React from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Driver-Truck Assignments',
        href: '/driver-trucks',
    },
];

interface DriverTruckData {
    id: number;
    driver: {
        id: number;
        name: string;
        driverid: string;
    };
    truck: {
        id: number;
        plate: string;
    };
    date_recived?: string;
    date_detach?: string | null;
    assigned_at?: string;
    status?: string | null;
    is_attached?: boolean;
}

interface DriverTrucksIndexProps {
    driverTrucks: {
        data: DriverTruckData[];
        current_page: number;
        last_page: number;
        total: number;
        from: number;
        to: number;
        links: Array<{
            url: string | null;
            label: string;
            active: boolean;
        }>;
    };
    metrics: {
        total: number;
        attached: number;
        detached: number;
        availableDrivers: number;
        availableTrucks: number;
    };
    filters: {
        search?: string | null;
        status?: string | null;
        sort?: string | null;
        direction?: 'asc' | 'desc' | null;
        per_page?: number | null;
        driver_id?: number | null;
        truck_id?: number | null;
    };
    statusOptions: Array<{ label: string; value: string }>;
    perPageOptions: number[];
    driverOptions: Array<{ label: string; value: number }>;
    truckOptions: Array<{ label: string; value: number }>;
}

const columns: Array<{ key: string; label: string; sortable?: boolean; sortKey?: string }> = [
    { key: 'driver', label: 'Driver' },
    { key: 'truck', label: 'Truck' },
    { key: 'date_recived', label: 'Assigned Date', sortable: true, sortKey: 'date_recived' },
    { key: 'status', label: 'Status', sortable: true, sortKey: 'is_attached' },
];

type NavigateOverrides = Partial<{
    search: string;
    status: string;
    sort: string;
    direction: 'asc' | 'desc';
    page: number;
    per_page: number;
    driver_id: number | null;
    truck_id: number | null;
}>;

export default function DriverTrucksIndex({ driverTrucks, metrics, filters, statusOptions, perPageOptions, driverOptions, truckOptions }: DriverTrucksIndexProps) {
    const { hasPermission } = usePermissions();
    const [searchTerm, setSearchTerm] = React.useState(filters?.search ?? '');
    const [selectedStatus, setSelectedStatus] = React.useState(filters?.status ?? 'all');
    const [sortColumn, setSortColumn] = React.useState<string>(filters?.sort ?? 'date_recived');
    const [sortDirection, setSortDirection] = React.useState<'asc' | 'desc'>(filters?.direction ?? 'desc');
    const [selectedDriver, setSelectedDriver] = React.useState<string | undefined>(
        filters?.driver_id ? String(filters.driver_id) : undefined,
    );
    const [selectedTruck, setSelectedTruck] = React.useState<string | undefined>(
        filters?.truck_id ? String(filters.truck_id) : undefined,
    );
    const availablePerPageOptions = React.useMemo(() => (perPageOptions?.length ? perPageOptions : [15, 25, 50, 100]), [perPageOptions]);
    const resolvedPerPage = React.useMemo(() => {
        const candidate = filters?.per_page;
        if (typeof candidate === 'number' && availablePerPageOptions.includes(candidate)) {
            return candidate;
        }
        return availablePerPageOptions[0] ?? 15;
    }, [filters?.per_page, availablePerPageOptions]);
    const [perPage, setPerPage] = React.useState<string>(() => String(resolvedPerPage));
    const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
    const [selectedAssignment, setSelectedAssignment] = React.useState<DriverTruckData | null>(null);
    const [isDeleting, setIsDeleting] = React.useState(false);

    React.useEffect(() => {
        setPerPage(String(resolvedPerPage));
    }, [resolvedPerPage]);

    const totalAssignments = metrics?.total ?? driverTrucks?.total ?? 0;
    const currentPage = driverTrucks?.current_page ?? 1;
    const lastPage = driverTrucks?.last_page ?? 1;
    const driverTruckFilterActive = Boolean(selectedDriver || selectedTruck);

    const handleNavigate = React.useCallback((overrides: NavigateOverrides = {}) => {
        const perPageValue = Object.prototype.hasOwnProperty.call(overrides, 'per_page')
            ? overrides.per_page
            : Number(perPage);
        const hasDriverOverride = Object.prototype.hasOwnProperty.call(overrides, 'driver_id');
        const hasTruckOverride = Object.prototype.hasOwnProperty.call(overrides, 'truck_id');
        const driverIdCandidate = hasDriverOverride
            ? overrides.driver_id
            : (selectedDriver ? Number(selectedDriver) : undefined);
        const truckIdCandidate = hasTruckOverride
            ? overrides.truck_id
            : (selectedTruck ? Number(selectedTruck) : undefined);

        const params: Record<string, string | number | undefined> = {
            search: overrides.search !== undefined ? overrides.search : (searchTerm.trim() ? searchTerm.trim() : undefined),
            status: overrides.status !== undefined ? overrides.status : (selectedStatus !== 'all' ? selectedStatus : undefined),
            sort: overrides.sort ?? sortColumn,
            direction: overrides.direction ?? sortDirection,
            page: overrides.page,
            per_page: perPageValue,
            driver_id: typeof driverIdCandidate === 'number' && Number.isFinite(driverIdCandidate)
                ? driverIdCandidate
                : undefined,
            truck_id: typeof truckIdCandidate === 'number' && Number.isFinite(truckIdCandidate)
                ? truckIdCandidate
                : undefined,
        };

        Object.keys(params).forEach((key) => {
            const value = params[key];
            if (
                value === undefined ||
                value === null ||
                value === '' ||
                (key === 'per_page' && (typeof value !== 'number' || !Number.isFinite(value) || value <= 0))
            ) {
                delete params[key];
            }
        });

        router.get('/driver-trucks', params, { preserveState: true, replace: false });
    }, [searchTerm, selectedStatus, sortColumn, sortDirection, perPage, selectedDriver, selectedTruck]);

    const handleSearchChange = (value: string) => {
        setSearchTerm(value);
        handleNavigate({ search: value.trim() ? value.trim() : undefined, page: 1 });
    };

    const handleStatusChange = (value: string) => {
        setSelectedStatus(value);
        handleNavigate({ status: value !== 'all' ? value : undefined, page: 1 });
    };

    const handleDriverChange = (value: string) => {
        setSelectedDriver(value);
        const numericValue = Number(value);
        handleNavigate({ driver_id: Number.isFinite(numericValue) ? numericValue : null, page: 1 });
    };

    const handleTruckChange = (value: string) => {
        setSelectedTruck(value);
        const numericValue = Number(value);
        handleNavigate({ truck_id: Number.isFinite(numericValue) ? numericValue : null, page: 1 });
    };

    const handlePerPageChange = (value: string) => {
        setPerPage(value);
        const numericValue = Number(value);
        handleNavigate({ per_page: Number.isNaN(numericValue) ? undefined : numericValue, page: 1 });
    };

    const handleDriverTruckReset = () => {
        if (!driverTruckFilterActive) {
            return;
        }

        setSelectedDriver(undefined);
        setSelectedTruck(undefined);
        handleNavigate({ driver_id: null, truck_id: null, page: 1 });
    };

    const handleSort = (column: string) => {
        const newDirection = sortColumn === column && sortDirection === 'asc' ? 'desc' : 'asc';
        setSortColumn(column);
        setSortDirection(newDirection);
        handleNavigate({ sort: column, direction: newDirection });
    };

    const handleDeleteClick = (assignment: DriverTruckData) => {
        setSelectedAssignment(assignment);
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = () => {
        if (!selectedAssignment) {
            return;
        }

        setIsDeleting(true);

        router.delete(`/driver-trucks/${selectedAssignment.id}`, {
            onSuccess: () => {
                setDeleteDialogOpen(false);
                setSelectedAssignment(null);
                setIsDeleting(false);
            },
            onError: (errors) => {
                setIsDeleting(false);
                if (errors && typeof errors === 'object') {
                    const errorMessages = Object.values(errors).flat().join('\n');
                    if (errorMessages) {
                        toast({
                            title: '❌ Delete Failed',
                            description: errorMessages,
                            variant: 'destructive',
                        });
                    }
                }
            },
        });
    };

    const renderHeaderCell = (column: { key: string; label: string; sortable?: boolean; sortKey?: string }) => {
        const sortable = column.sortable ?? false;
        const columnKey = column.sortKey ?? column.key;
        const isActive = sortColumn === columnKey;
        return (
            <TableHead
                key={column.key}
                className={`sticky top-0 z-20 bg-background ${sortable ? 'cursor-pointer hover:bg-muted/70' : 'cursor-default'} select-none transition-colors`}
                onClick={sortable ? () => handleSort(columnKey) : undefined}
            >
                <div className="flex items-center gap-2">
                    {column.label}
                    {sortable && (
                        <ArrowUpDown
                            size={14}
                            className={isActive ? 'text-primary' : 'text-muted-foreground opacity-50'}
                        />
                    )}
                </div>
            </TableHead>
        );
    };

    const headerActions = (
        <>
            {hasPermission('driver-trucks.create') && (
                <Button asChild>
                    <Link href="/driver-trucks/create">
                        <Plus className="mr-2 h-4 w-4" />
                        Assign Driver to Truck
                    </Link>
                </Button>
            )}
        </>
    );

    const statsCards = [
        {
            title: 'Assignments',
            value: metrics?.total ?? 0,
            description: 'Driver-truck pairs',
            icon: <UserCheck className="h-3.5 w-3.5 text-blue-600" />,
            valueClassName: 'text-blue-600',
        },
        {
            title: 'Attached',
            value: metrics?.attached ?? 0,
            description: 'Currently active links',
            icon: <Truck className="h-3.5 w-3.5 text-green-600" />,
            valueClassName: 'text-green-600',
        },
        {
            title: 'Detached',
            value: metrics?.detached ?? 0,
            description: 'Awaiting reassignment',
            icon: <UserX className="h-3.5 w-3.5 text-red-600" />,
            valueClassName: 'text-red-600',
        },
        {
            title: 'Free Drivers',
            value: metrics?.availableDrivers ?? 0,
            description: 'Ready to deploy',
            icon: <User className="h-3.5 w-3.5 text-purple-600" />,
            valueClassName: 'text-purple-600',
        },
        {
            title: 'Free Trucks',
            value: metrics?.availableTrucks ?? 0,
            description: 'Available fleet',
            icon: <Truck className="h-3.5 w-3.5 text-amber-600" />,
            valueClassName: 'text-amber-600',
        },
    ];

    const statsSection = (
        <div className="hidden gap-2 md:grid md:grid-cols-2 xl:grid-cols-5">
            {statsCards.map((card) => (
                <Card key={card.title} className="gap-2 border border-slate-200 py-2 shadow-sm sm:py-3">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 p-1.5 sm:p-2">
                        <CardTitle className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                            {card.title}
                        </CardTitle>
                        {card.icon}
                    </CardHeader>
                    <CardContent className="px-2 pb-2 pt-0 sm:px-3 sm:pb-2">
                        <div className={`text-sm font-semibold sm:text-base ${card.valueClassName}`}>{card.value}</div>
                        <p className="text-[11px] text-muted-foreground">{card.description}</p>
                    </CardContent>
                </Card>
            ))}
        </div>
    );

    const tableHeaderExtras = (
        <div className="flex flex-wrap items-center gap-2">
            <div className="relative w-[260px] max-w-full">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search assignments..."
                    value={searchTerm}
                    onChange={(event) => handleSearchChange(event.target.value)}
                    className="pl-10"
                />
            </div>
            <Select value={selectedStatus} onValueChange={handleStatusChange}>
                <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    {statusOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                            {option.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
            <Select value={selectedDriver} onValueChange={handleDriverChange}>
                <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Driver" />
                </SelectTrigger>
                <SelectContent>
                    {driverOptions.map((option) => (
                        <SelectItem key={option.value} value={String(option.value)}>
                            {option.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
            <Select value={selectedTruck} onValueChange={handleTruckChange}>
                <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Truck" />
                </SelectTrigger>
                <SelectContent>
                    {truckOptions.map((option) => (
                        <SelectItem key={option.value} value={String(option.value)}>
                            {option.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
            <Button
                variant="ghost"
                size="sm"
                className="px-2 text-xs text-muted-foreground hover:text-primary"
                onClick={handleDriverTruckReset}
                disabled={!driverTruckFilterActive}
            >
                Reset driver / truck
            </Button>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <span className="hidden sm:inline">Rows</span>
                <Select value={perPage} onValueChange={handlePerPageChange}>
                    <SelectTrigger className="w-[110px]">
                        <SelectValue placeholder="Per page" />
                    </SelectTrigger>
                    <SelectContent>
                        {availablePerPageOptions.map((option) => (
                            <SelectItem key={option} value={String(option)}>
                                {option} / page
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
        </div>
    );

    const getAttachmentBadge = (isAttached?: boolean) => {
        if (isAttached) {
            return <Badge className="border-green-200 bg-green-100 text-xs font-medium text-green-700">Attached</Badge>;
        }
        return <Badge className="border-red-200 bg-red-100 text-xs font-medium text-red-700">Detached</Badge>;
    };

    // TODO: Evaluate infinite scrolling if assignment volumes increase notably.
    const rowOffset = Math.max((driverTrucks.from ?? 1) - 1, 0);

    const tableContent = (
        <Table>
            <TableHeader className="[&_tr]:sticky [&_tr]:top-0 [&_tr]:z-20 [&_tr]:bg-background [&_tr]:shadow-sm">
                <TableRow className="border-b bg-background">
                    <TableHead className="sticky top-0 z-20 w-12 bg-background text-center">#</TableHead>
                    {columns.map((column) => renderHeaderCell(column))}
                    <TableHead className="sticky top-0 z-20 bg-background text-center">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {driverTrucks?.data && driverTrucks.data.length > 0 ? (
                    driverTrucks.data.map((assignment, index) => {
                        const assignedDate = assignment.date_recived ?? assignment.assigned_at;
                        return (
                            <TableRow key={assignment.id} className="hover:bg-muted/50">
                                <TableCell className="text-center font-medium">
                                    {rowOffset + index + 1}
                                </TableCell>
                                <TableCell className="font-medium">
                                    <div className="flex flex-col">
                                        <span>{assignment.driver.name}</span>
                                        <span className="text-xs text-muted-foreground">{assignment.driver.driverid}</span>
                                    </div>
                                </TableCell>
                                <TableCell className="font-mono text-muted-foreground">
                                    {assignment.truck.plate}
                                </TableCell>
                                <TableCell className="text-muted-foreground">
                                    {assignedDate ? new Date(assignedDate).toLocaleDateString() : '-'}
                                </TableCell>
                                <TableCell>
                                    <div className="flex flex-col items-start gap-1">
                                        {getAttachmentBadge(assignment.is_attached)}
                                        <span className="text-xs text-muted-foreground capitalize">
                                            {assignment.status ?? 'n/a'}
                                        </span>
                                        {assignment.date_detach && (
                                            <span className="text-xs text-muted-foreground">
                                                Detached: {new Date(assignment.date_detach).toLocaleDateString()}
                                            </span>
                                        )}
                                    </div>
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
                                        {hasPermission('driver-trucks.destroy') && (
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                className="text-red-600 hover:bg-red-50 hover:text-red-700"
                                                onClick={() => handleDeleteClick(assignment)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </div>
                                </TableCell>
                            </TableRow>
                        );
                    })
                ) : (
                    <TableRow>
                        <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                            No assignments found.
                            {hasPermission('driver-trucks.create') && (
                                <Link href="/driver-trucks/create" className="ml-1 text-primary underline">
                                    Create one
                                </Link>
                            )}
                        </TableCell>
                    </TableRow>
                )}
            </TableBody>
        </Table>
    );

    return (
        <>
            <ListPageLayout
                headTitle="Driver-Truck Assignments"
                title="Driver-Truck Assignments"
                description={`Manage all driver-truck assignments. Total: ${totalAssignments}`}
                breadcrumbs={breadcrumbs}
                actions={headerActions}
                stats={statsSection}
                tableTitle="Assignments"
                tableDescription="List of all driver-truck assignments"
                tableHeaderExtras={tableHeaderExtras}
                pagination={
                    <InertiaPagination
                        className="mt-4"
                        from={driverTrucks.from}
                        to={driverTrucks.to}
                        total={driverTrucks.total}
                        links={driverTrucks.links}
                        currentPage={currentPage}
                        lastPage={lastPage}
                    />
                }
            >
                {tableContent}
            </ListPageLayout>

            <DeleteConfirmationDialog
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
                title="Delete Assignment"
                description="Are you sure you want to delete this driver-truck assignment? This action cannot be undone."
                itemName={selectedAssignment ? `${selectedAssignment.driver.name} ↔ ${selectedAssignment.truck.plate}` : undefined}
                onConfirm={handleDeleteConfirm}
                isLoading={isDeleting}
            />
        </>
    );
}
