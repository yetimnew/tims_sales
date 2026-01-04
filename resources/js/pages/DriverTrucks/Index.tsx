import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TableCell, TableRow } from '@/components/ui/table';
import ListPageLayout from '@/components/layouts/list-page-layout';
import { ListingStatsHeader } from '@/components/listing/stats-header';
import { ListingFilterBar } from '@/components/listing/filter-bar';
import { ListingTableShell } from '@/components/listing/data-table-shell';
import { ListingMobileItemList } from '@/components/listing/mobile-item-list';
import { ListingPaginationFooter } from '@/components/listing/pagination-footer';
import { ListingRowActionsMenu } from '@/components/listing/row-actions-menu';
import { usePermissions } from '@/hooks/use-permissions';
import { useListingLoading } from '@/hooks/use-listing-loading';
import { Link, router } from '@inertiajs/react';
import { type BreadcrumbItem } from '@/types';
import { DeleteConfirmationDialog } from '@/components/delete-confirmation-dialog';
import { toast } from '@/hooks/use-toast';
import {
    Plus,
    Eye,
    Edit,
    Search,
    Trash2,
    Truck,
    User,
    UserCheck,
    UserX,
    ChevronRight,
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
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
    created_at?: string;
}

interface DriverTrucksIndexProps {
    driverTrucks: {
        data: DriverTruckData[];
        current_page: number;
        last_page: number;
        total: number;
        from: number | null;
        to: number | null;
        per_page?: number | null;
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
        truck_id?: number | string | null;
        truck?: number | string | null;
    };
    statusOptions: Array<{ label: string; value: string }>;
    perPageOptions: number[];
}

const SKELETON_FLAG_KEY = 'driver-trucks.index.shouldShowSkeleton';
const ALLOWED_STATUS_VALUES = ['attached', 'detached'];

const COLUMN_DEFINITIONS: Array<{ id: string; label: string; sortKey: string }> = [
    { id: 'driver', label: 'Driver', sortKey: 'driver_name' },
    { id: 'truck', label: 'Truck', sortKey: 'truck_plate' },
    { id: 'date_recived', label: 'Assigned Date', sortKey: 'date_recived' },
    { id: 'created_at', label: 'Created', sortKey: 'created_at' },
    { id: 'status', label: 'Status', sortKey: 'is_attached' },
];

type NavigateOverrides = {
    search?: string;
    status?: string;
    sort?: string;
    direction?: 'asc' | 'desc';
    page?: number;
    per_page?: number;
    truck_id?: number | string | null;
};

const formatDate = (value?: string | null): string => {
    if (!value) {
        return '—';
    }

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
        return '—';
    }

    return parsed.toLocaleDateString('en-US', {
        month: '2-digit',
        day: '2-digit',
        year: 'numeric',
    });
};

const getAttachmentBadge = (isAttached?: boolean) => {
    if (isAttached) {
        return <Badge className="border-green-200 bg-green-100 text-xs font-medium text-green-700">Attached</Badge>;
    }

    return <Badge className="border-red-200 bg-red-100 text-xs font-medium text-red-700">Detached</Badge>;
};

export default function DriverTrucksIndex({ driverTrucks, metrics, filters, statusOptions, perPageOptions }: DriverTrucksIndexProps) {
    const { hasPermission } = usePermissions();
    const canViewAssignment = hasPermission('driver-trucks.show');
    const canEditAssignment = hasPermission('driver-trucks.edit');
    const canDeleteAssignment = hasPermission('driver-trucks.destroy');
    const canCreateAssignment = hasPermission('driver-trucks.create');

    const [searchTerm, setSearchTerm] = React.useState(filters?.search ?? '');
    const [selectedStatus, setSelectedStatus] = React.useState(() => {
        const incoming = filters?.status ?? 'all';
        if (incoming !== 'all' && !ALLOWED_STATUS_VALUES.includes(incoming)) {
            return 'all';
        }

        return incoming;
    });
    const [sortColumn, setSortColumn] = React.useState<string>(filters?.sort ?? 'created_at');
    const [sortDirection, setSortDirection] = React.useState<'asc' | 'desc'>(filters?.direction ?? 'desc');
    const availablePerPageOptions = React.useMemo(
        () => (perPageOptions?.length ? perPageOptions : [15, 25, 50, 100]),
        [perPageOptions],
    );
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
    const [deleteError, setDeleteError] = React.useState<string | null>(null);
    const truckFilter = filters?.truck_id ?? filters?.truck ?? undefined;

    React.useEffect(() => {
        const incoming = filters?.status ?? 'all';
        const normalized = incoming !== 'all' && !ALLOWED_STATUS_VALUES.includes(incoming) ? 'all' : incoming;

        if (normalized !== selectedStatus) {
            setSelectedStatus(normalized);
        }
    }, [filters?.status, selectedStatus]);

    const filteredStatusOptions = React.useMemo(
        () => statusOptions.filter((option) => ALLOWED_STATUS_VALUES.includes(option.value)),
        [statusOptions],
    );

    const isDataReady = Array.isArray(driverTrucks?.data);
    const { isLoading: isTableLoading } = useListingLoading({
        storageKey: SKELETON_FLAG_KEY,
        isDataReady,
        minimumDuration: 200,
        onlySamePath: true,
        targetPath: '/driver-trucks',
        initialIsLoading: true,
    });

    React.useEffect(() => {
        setPerPage(String(resolvedPerPage));
    }, [resolvedPerPage]);

    const assignments = React.useMemo(
        () => (Array.isArray(driverTrucks?.data) ? driverTrucks.data : []),
        [driverTrucks],
    );
    const totalAssignments = metrics?.total ?? driverTrucks?.total ?? assignments.length ?? 0;
    const attachedAssignments = metrics?.attached ?? 0;
    const detachedAssignments = metrics?.detached ?? 0;
    const availableDrivers = metrics?.availableDrivers ?? 0;
    const availableTrucks = metrics?.availableTrucks ?? 0;

    const rowOffset = Math.max((driverTrucks?.from ?? 1) - 1, 0);

    const handleNavigate = React.useCallback(
        (overrides: NavigateOverrides = {}) => {
            const hasOverride = (key: keyof NavigateOverrides) =>
                Object.prototype.hasOwnProperty.call(overrides, key);

            const nextSearch = hasOverride('search')
                ? overrides.search
                : searchTerm.trim()
                    ? searchTerm.trim()
                    : undefined;

            const rawStatus = hasOverride('status')
                ? overrides.status
                : selectedStatus !== 'all'
                    ? selectedStatus
                    : undefined;

            const nextStatus = rawStatus && ALLOWED_STATUS_VALUES.includes(rawStatus) ? rawStatus : undefined;

            const nextSort = hasOverride('sort') ? overrides.sort ?? sortColumn : sortColumn;
            const nextDirection = hasOverride('direction') ? overrides.direction ?? sortDirection : sortDirection;
            const nextPerPage = hasOverride('per_page') ? overrides.per_page : Number(perPage);
            const nextTruckId = hasOverride('truck_id')
                ? overrides.truck_id ?? undefined
                : typeof truckFilter === 'number' || (typeof truckFilter === 'string' && truckFilter !== '')
                    ? truckFilter
                    : undefined;
            const nextPage = hasOverride('page') ? overrides.page : undefined;

            const params: Record<string, string | number | undefined> = {
                search: nextSearch && nextSearch !== '' ? nextSearch : undefined,
                status: nextStatus,
                sort: nextSort,
                direction: nextDirection,
                page: nextPage,
                per_page:
                    typeof nextPerPage === 'number' && Number.isFinite(nextPerPage) && nextPerPage > 0
                        ? nextPerPage
                        : undefined,
                truck_id: nextTruckId,
            };

            Object.keys(params).forEach((key) => {
                if (params[key] === undefined) {
                    delete params[key];
                }
            });

            if (typeof window !== 'undefined') {
                window.sessionStorage.setItem(SKELETON_FLAG_KEY, 'true');
            }

            router.get('/driver-trucks', params, { preserveState: true, replace: false });
        },
        [perPage, searchTerm, selectedStatus, sortColumn, sortDirection, truckFilter],
    );

    const handleSearchChange = (value: string) => {
        setSearchTerm(value);
        handleNavigate({ search: value.trim() ? value.trim() : undefined, page: 1 });
    };

    const handleStatusChange = (value: string) => {
        setSelectedStatus(value);
        handleNavigate({ status: value !== 'all' ? value : undefined, page: 1 });
    };

    const handlePerPageChange = (value: string) => {
        setPerPage(value);
        const numericValue = Number(value);
        handleNavigate({ per_page: Number.isNaN(numericValue) ? undefined : numericValue, page: 1 });
    };

    const handleSort = React.useCallback(
        (column: string) => {
            const newDirection: 'asc' | 'desc' = sortColumn === column && sortDirection === 'asc' ? 'desc' : 'asc';
            setSortColumn(column);
            setSortDirection(newDirection);
            handleNavigate({ sort: column, direction: newDirection });
        },
        [handleNavigate, sortColumn, sortDirection],
    );

    const handleDeleteClick = (assignment: DriverTruckData) => {
        setSelectedAssignment(assignment);
        setDeleteDialogOpen(true);
        setDeleteError(null);
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
                setDeleteError(null);
            },
            onError: (errors) => {
                setIsDeleting(false);

                const fallback = 'Failed to delete assignment. Please review the requirements and try again.';
                if (errors && typeof errors === 'object') {
                    const messages = Object.values(errors)
                        .flatMap((value) => (Array.isArray(value) ? value : [value]))
                        .filter((value) => Boolean(value))
                        .join('\n');

                    setDeleteError(messages || fallback);

                    toast({
                        title: '❌ Delete Failed',
                        description: messages || fallback,
                        variant: 'destructive',
                    });
                } else {
                    setDeleteError(fallback);

                    toast({
                        title: '❌ Delete Failed',
                        description: fallback,
                        variant: 'destructive',
                    });
                }
            },
        });
    };

    const headerActions = (
        <>
            {canCreateAssignment && (
                <Button asChild>
                    <Link href="/driver-trucks/create">
                        <Plus className="mr-2 h-4 w-4" />
                        Add Assignment
                    </Link>
                </Button>
            )}
        </>
    );

    const statsDefinitions = [
        {
            id: 'total-assignments',
            label: 'Assignments',
            icon: <UserCheck className="h-3.5 w-3.5 text-blue-600" />,
            className: 'min-w-[220px] flex-shrink-0',
            value: isTableLoading ? <Skeleton className="h-3.5 w-20" aria-hidden="true" /> : totalAssignments.toLocaleString(),
            description: isTableLoading ? (
                <Skeleton className="h-3 w-28" aria-hidden="true" />
            ) : (
                'Driver-truck pairs'
            ),
            valueClassName: isTableLoading ? undefined : 'text-blue-600',
        },
        {
            id: 'attached-assignments',
            label: 'Attached',
            icon: <Truck className="h-3.5 w-3.5 text-green-600" />,
            className: 'min-w-[220px] flex-shrink-0',
            value: isTableLoading ? <Skeleton className="h-3.5 w-16" aria-hidden="true" /> : attachedAssignments.toLocaleString(),
            description: isTableLoading ? (
                <Skeleton className="h-3 w-24" aria-hidden="true" />
            ) : (
                'Currently active links'
            ),
            valueClassName: isTableLoading ? undefined : 'text-green-600',
        },
        {
            id: 'detached-assignments',
            label: 'Detached',
            icon: <UserX className="h-3.5 w-3.5 text-red-600" />,
            className: 'min-w-[220px] flex-shrink-0',
            value: isTableLoading ? <Skeleton className="h-3.5 w-16" aria-hidden="true" /> : detachedAssignments.toLocaleString(),
            description: isTableLoading ? (
                <Skeleton className="h-3 w-24" aria-hidden="true" />
            ) : (
                'Awaiting reassignment'
            ),
            valueClassName: isTableLoading ? undefined : 'text-red-600',
        },
        {
            id: 'available-drivers',
            label: 'Free Drivers',
            icon: <User className="h-3.5 w-3.5 text-purple-600" />,
            className: 'min-w-[220px] flex-shrink-0',
            value: isTableLoading ? <Skeleton className="h-3.5 w-16" aria-hidden="true" /> : availableDrivers.toLocaleString(),
            description: isTableLoading ? (
                <Skeleton className="h-3 w-24" aria-hidden="true" />
            ) : (
                'Ready to deploy'
            ),
            valueClassName: isTableLoading ? undefined : 'text-purple-600',
        },
        {
            id: 'available-trucks',
            label: 'Free Trucks',
            icon: <Truck className="h-3.5 w-3.5 text-amber-500" />,
            className: 'min-w-[220px] flex-shrink-0',
            value: isTableLoading ? <Skeleton className="h-3.5 w-16" aria-hidden="true" /> : availableTrucks.toLocaleString(),
            description: isTableLoading ? (
                <Skeleton className="h-3 w-24" aria-hidden="true" />
            ) : (
                'Available fleet'
            ),
            valueClassName: isTableLoading ? undefined : 'text-amber-600',
        },
    ];

    const statsSection = <ListingStatsHeader stats={statsDefinitions} orientation="row" />;

    const perPageSelectOptions = React.useMemo(
        () =>
            availablePerPageOptions.map((option) => ({
                value: String(option),
                label: `${option} / page`,
            })),
        [availablePerPageOptions],
    );

    const tableColumns = React.useMemo(
        () => [
            { id: 'index', label: '#', align: 'center' as const },
            ...COLUMN_DEFINITIONS.map((column) => ({
                id: column.id,
                label: column.label,
                sortable: true,
                sortKey: column.sortKey,
            })),
            { id: 'actions', label: 'Actions', align: 'center' as const },
        ],
        [],
    );

    const tableRows = isTableLoading
        ? Array.from({ length: 8 }).map((_, index) => (
              <TableRow key={`skeleton-${index}`} aria-hidden="true">
                  <TableCell className="text-center">
                      <Skeleton className="h-4 w-6 mx-auto" />
                  </TableCell>
                  <TableCell>
                      <div className="flex flex-col gap-2">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-3 w-24" />
                      </div>
                  </TableCell>
                  <TableCell>
                      <Skeleton className="h-4 w-24" />
                  </TableCell>
                  <TableCell>
                      <Skeleton className="h-4 w-24" />
                  </TableCell>
                  <TableCell>
                      <Skeleton className="h-4 w-24" />
                  </TableCell>
                  <TableCell>
                      <div className="flex flex-col gap-2">
                          <Skeleton className="h-6 w-20 rounded-full" />
                          <Skeleton className="h-3 w-16" />
                      </div>
                  </TableCell>
                  <TableCell className="text-center">
                      <Skeleton className="h-8 w-8 mx-auto rounded" />
                  </TableCell>
              </TableRow>
          ))
        : assignments.length > 0
            ? assignments.map((assignment, index) => {
                  const assignedDate = assignment.date_recived ?? assignment.assigned_at;

                  return (
                      <TableRow key={assignment.id} className="hover:bg-muted/50">
                          <TableCell className="text-center font-medium">{rowOffset + index + 1}</TableCell>
                          <TableCell className="font-medium">
                              <div className="flex flex-col">
                                  <span>{assignment.driver.name}</span>
                                  <span className="text-xs text-muted-foreground">{assignment.driver.driverid}</span>
                              </div>
                          </TableCell>
                          <TableCell className="font-mono text-muted-foreground">{assignment.truck.plate}</TableCell>
                          <TableCell className="text-muted-foreground">{formatDate(assignedDate)}</TableCell>
                          <TableCell className="text-muted-foreground">{formatDate(assignment.created_at)}</TableCell>
                          <TableCell>
                              <div className="flex flex-col items-start gap-1">
                                  {getAttachmentBadge(assignment.is_attached)}
                                  <span className="text-xs text-muted-foreground">
                                      {assignment.is_attached ? 'Attached' : 'Detached'}
                                  </span>
                                  {assignment.date_detach && (
                                      <span className="text-xs text-muted-foreground">
                                          Detached: {formatDate(assignment.date_detach)}
                                      </span>
                                  )}
                              </div>
                          </TableCell>
                          <TableCell className="text-center">
                              <ListingRowActionsMenu
                                  actions={[
                                      canViewAssignment && {
                                          label: 'View',
                                          icon: <Eye className="h-4 w-4" />,
                                          href: `/driver-trucks/${assignment.id}`,
                                      },
                                      canEditAssignment && {
                                          label: 'Edit',
                                          icon: <Edit className="h-4 w-4" />,
                                          href: `/driver-trucks/${assignment.id}/edit`,
                                      },
                                      canDeleteAssignment && {
                                          label: 'Delete',
                                          icon: <Trash2 className="h-4 w-4" />,
                                          danger: true,
                                          disabled: isDeleting && selectedAssignment?.id === assignment.id,
                                          onSelect: () => handleDeleteClick(assignment),
                                      },
                                  ]}
                              />
                          </TableCell>
                      </TableRow>
                  );
              })
            : (
                <TableRow>
                    <TableCell colSpan={tableColumns.length} className="py-8 text-center text-muted-foreground">
                        No assignments found.
                        {canCreateAssignment && (
                            <Link href="/driver-trucks/create" className="ml-1 text-primary underline">
                                Create one
                            </Link>
                        )}
                    </TableCell>
                </TableRow>
            );

    const mobileItems = React.useMemo(
        () =>
            assignments.map((assignment, index) => ({
                assignment,
                position: rowOffset + index + 1,
            })),
        [assignments, rowOffset],
    );

    const mobileContent = isTableLoading ? (
        <ListingMobileItemList
            items={Array.from({ length: 5 }).map((_, i) => ({ assignment: { id: i }, position: i + 1 }))}
            getKey={(item) => `skeleton-${item.position}`}
            renderTitle={() => (
                <div className="flex items-center gap-2">
                    <Skeleton className="h-3 w-8" />
                    <Skeleton className="h-4 w-36" />
                    <Skeleton className="h-3.5 w-3.5 rounded" />
                </div>
            )}
            renderSubtitle={() => <Skeleton className="h-3 w-24" />}
            renderContent={() => (
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <Skeleton className="h-3 w-16" />
                        <Skeleton className="h-6 w-20 rounded-full" />
                    </div>
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <Skeleton className="h-3 w-20" />
                            <Skeleton className="h-3 w-24" />
                        </div>
                        <div className="flex items-center justify-between">
                            <Skeleton className="h-3 w-20" />
                            <Skeleton className="h-3 w-24" />
                        </div>
                        <div className="flex items-center justify-between">
                            <Skeleton className="h-3 w-20" />
                            <Skeleton className="h-3 w-24" />
                        </div>
                    </div>
                    <Skeleton className="h-3 w-32" />
                </div>
            )}
            renderFooter={() => (
                <div className="flex w-full gap-2">
                    <Skeleton className="h-8 flex-1" />
                    <Skeleton className="h-8 w-20" />
                </div>
            )}
        />
    ) : (
        <ListingMobileItemList
            items={mobileItems}
            getKey={(item) => item.assignment.id}
            renderTitle={(item) => (
                <div className="flex items-center gap-2">
                    <span className="text-xs uppercase tracking-wide text-muted-foreground">#{item.position}</span>
                    <span className="text-base">{item.assignment.driver.name}</span>
                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
            )}
            renderSubtitle={(item) => item.assignment.truck.plate || 'Truck pending'}
            renderContent={(item) => (
                <div className="space-y-3 text-sm text-muted-foreground">
                    <div className="flex items-center justify-between">
                        <span className="font-medium text-slate-600 dark:text-slate-300">Status</span>
                        {getAttachmentBadge(item.assignment.is_attached)}
                    </div>
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="font-medium text-slate-600 dark:text-slate-300">Assigned</span>
                            <span className="text-right font-semibold text-slate-900 dark:text-slate-100">
                                {formatDate(item.assignment.date_recived ?? item.assignment.assigned_at)}
                            </span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="font-medium text-slate-600 dark:text-slate-300">Created</span>
                            <span className="text-right font-semibold text-slate-900 dark:text-slate-100">
                                {formatDate(item.assignment.created_at)}
                            </span>
                        </div>
                        {item.assignment.date_detach && (
                            <div className="flex items-center justify-between">
                                <span className="font-medium text-slate-600 dark:text-slate-300">Detached</span>
                                <span className="text-right font-semibold text-slate-900 dark:text-slate-100">
                                    {formatDate(item.assignment.date_detach)}
                                </span>
                            </div>
                        )}
                    </div>
                    <div className="text-xs text-muted-foreground">
                        Status: {item.assignment.is_attached ? 'Attached' : 'Detached'}
                    </div>
                </div>
            )}
            renderFooter={(item) => (
                <div className="flex w-full flex-wrap items-center justify-end gap-2">
                    {canViewAssignment && (
                        <Button asChild size="sm" variant="outline" className="flex-1 sm:flex-auto">
                            <Link href={`/driver-trucks/${item.assignment.id}`}>
                                <Eye className="mr-2 h-4 w-4" />
                                View
                            </Link>
                        </Button>
                    )}
                    {canEditAssignment && (
                        <Button asChild size="sm" variant="secondary" className="flex-1 sm:flex-none">
                            <Link href={`/driver-trucks/${item.assignment.id}/edit`}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                            </Link>
                        </Button>
                    )}
                    {canDeleteAssignment && (
                        <Button
                            size="sm"
                            variant="destructive"
                            className="flex-1 sm:flex-none"
                            onClick={() => handleDeleteClick(item.assignment)}
                            disabled={isDeleting && selectedAssignment?.id === item.assignment.id}
                        >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                        </Button>
                    )}
                </div>
            )}
            emptyState={(
                <div className="py-8 text-center text-muted-foreground">
                    No assignments found.
                    {canCreateAssignment && (
                        <Link href="/driver-trucks/create" className="ml-1 text-primary underline">
                            Create one
                        </Link>
                    )}
                </div>
            )}
        />
    );

    const tableHeaderExtras = (
        <ListingFilterBar
            search={{
                value: searchTerm,
                placeholder: 'Search assignments...',
                onChange: handleSearchChange,
                icon: <Search className="h-4 w-4" />,
            }}
            perPage={{
                value: perPage,
                label: 'Rows',
                onChange: handlePerPageChange,
                options: perPageSelectOptions,
            }}
        >
            <Select value={selectedStatus} onValueChange={handleStatusChange}>
                <SelectTrigger className="w-full min-w-[150px] sm:w-auto">
                    <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    {filteredStatusOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                            {option.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </ListingFilterBar>
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
                tableDescription="All driver-truck assignment records"
                tableHeaderExtras={tableHeaderExtras}
                pagination={
                    !isTableLoading && driverTrucks?.links ? (
                        <ListingPaginationFooter
                            className="mt-4"
                            links={driverTrucks.links}
                            from={driverTrucks.from ?? undefined}
                            to={driverTrucks.to ?? undefined}
                            total={driverTrucks.total ?? undefined}
                        />
                    ) : null
                }
            >
                <div className="hidden md:block">
                    <ListingTableShell
                        columns={tableColumns}
                        sort={{ column: sortColumn, direction: sortDirection, onToggle: handleSort }}
                    >
                        {tableRows}
                    </ListingTableShell>
                </div>

                <div className="relative space-y-3 md:hidden">
                    {mobileContent}
                </div>
            </ListPageLayout>

            <DeleteConfirmationDialog
                open={deleteDialogOpen}
                onOpenChange={(open) => {
                    setDeleteDialogOpen(open);
                    if (!open) {
                        setSelectedAssignment(null);
                        setDeleteError(null);
                    }
                }}
                title="Delete Assignment"
                description="Are you sure you want to delete this driver-truck assignment? This action cannot be undone."
                itemName={selectedAssignment ? `${selectedAssignment.driver.name} ↔ ${selectedAssignment.truck.plate}` : undefined}
                onConfirm={handleDeleteConfirm}
                isLoading={isDeleting}
                errorMessage={deleteError}
            />
        </>
    );
}

