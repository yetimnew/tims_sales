import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TableCell, TableRow } from '@/components/ui/table';
import ListPageLayout from '@/components/layouts/list-page-layout';
import { DeleteConfirmationDialog } from '@/components/delete-confirmation-dialog';
import { ListingStatsHeader } from '@/components/listing/stats-header';
import { ListingFilterBar } from '@/components/listing/filter-bar';
import { ListingTableShell } from '@/components/listing/data-table-shell';
import { ListingMobileItemList } from '@/components/listing/mobile-item-list';
import { ListingPaginationFooter } from '@/components/listing/pagination-footer';
import { ListingRowActionsMenu } from '@/components/listing/row-actions-menu';
import { usePermissions } from '@/hooks/use-permissions';
import { useListingLoading } from '@/hooks/use-listing-loading';
import { Link, router } from '@inertiajs/react';
import { toast } from '@/hooks/use-toast';
import { type BreadcrumbItem } from '@/types';
import {
    Plus,
    Eye,
    Edit,
    Trash2,
    Search,
    Truck,
    CheckCircle,
    Wrench,
    XCircle,
    DollarSign,
    ChevronRight,
    Gauge,
    TrendingUp,
    Users,
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import * as React from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Trucks',
        href: '/trucks',
    },
];

const SKELETON_FLAG_KEY = 'trucks.index.table-loading';

interface TruckData {
    id: number;
    plate: string;
    vehicleType: {
        id: number;
        name: string;
    } | null;
    chasisNumber?: string;
    engineNumber?: string;
    serviceIntervalKM?: number;
    purchasePrice?: number;
    status: string;
    created_at?: string;
    currentDriverName?: string | null;
}

interface PaginationMeta {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
}

interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

interface UtilizationMetrics {
    window_days: number;
    service_days: number;
    idle_days: number;
    unknown_days: number;
    total_days: number;
    utilization_rate: number | null;
    idle_rate: number | null;
}

interface FinancialMetrics {
    window_days: number;
    total_revenue: number;
    total_cost: number;
    total_profit: number;
    avg_revenue_per_truck: number;
    ton_km: number;
    ton_km_per_birr: number | null;
}

interface StaffingMetrics {
    window_days: number;
    average_tenure_days: number | null;
    assignment_count: number;
    truck_count_with_assignments: number;
    short_tenure_threshold_days: number;
    high_churn_truck_count: number;
    high_churn_trucks: Array<{
        truck_id: number;
        truck_plate: string | null;
        average_tenure_days: number;
        assignment_count: number;
    }>;
    flagged_truck_ids: number[];
}

interface TrucksIndexProps {
    trucks: {
        data: TruckData[];
        meta: PaginationMeta;
        links: PaginationLink[];
    };
    metrics?: {
        total: number;
        active: number;
        maintenance: number;
        fleet_value: number;
        utilization?: UtilizationMetrics | null;
        financial?: FinancialMetrics | null;
        staffing?: StaffingMetrics | null;
    } | null;
    filters: {
        search?: string | null;
        status?: string | null;
        vehicle_type?: number | string | null;
        sort?: string | null;
        direction?: 'asc' | 'desc' | null;
        per_page?: number | null;
    };
    statusOptions: Array<{ label: string; value: string }>;
    vehicleTypes: Array<{ id: number; name: string }>;
    perPageOptions: number[];
}

type NavigateOverrides = {
    search?: string;
    status?: string;
    vehicle_type?: string | number;
    sort?: string;
    direction?: 'asc' | 'desc';
    page?: number;
    per_page?: number;
};

const columns: Array<{ key: string; label: string }> = [
    { key: 'plate', label: 'Plate' },
    { key: 'vehicleType', label: 'Vehicle Type' },
    { key: 'currentDriverName', label: 'Driver' },
    { key: 'chasisNumber', label: 'Chassis' },
    { key: 'engineNumber', label: 'Engine' },
    { key: 'serviceIntervalKM', label: 'Service (KM)' },
    { key: 'purchasePrice', label: 'Price' },
    { key: 'status', label: 'Status' },
];

const etbCurrencyFormatter = new Intl.NumberFormat('en-ET', {
    style: 'currency',
    currency: 'ETB',
    maximumFractionDigits: 2,
});

const formatETBCurrency = (value?: number | null, options?: Intl.NumberFormatOptions): string => {
    if (value === null || value === undefined || Number.isNaN(Number(value))) {
        return '—';
    }

    if (options) {
        return new Intl.NumberFormat('en-ET', {
            style: 'currency',
            currency: 'ETB',
            maximumFractionDigits: 2,
            ...options,
        }).format(value);
    }

    return etbCurrencyFormatter.format(value);
};

export default function TrucksIndex({
    trucks,
    metrics,
    filters,
    statusOptions,
    vehicleTypes,
    perPageOptions,
}: TrucksIndexProps) {
    const { hasPermission } = usePermissions();
    const isDataReady = Array.isArray(trucks?.data);
    const { isLoading: isTableLoading } = useListingLoading({
        storageKey: SKELETON_FLAG_KEY,
        isDataReady,
        minimumDuration: 200,
        onlySamePath: true, // Still show loading for same-path navigation (pagination, filtering)
        targetPath: '/trucks', // Show loading when navigating TO /trucks from any other page
        initialIsLoading: true, // Show skeleton immediately on initial mount
    });

    const [searchTerm, setSearchTerm] = React.useState(filters?.search ?? '');
    const [selectedStatus, setSelectedStatus] = React.useState(filters?.status ?? 'all');
    const [selectedVehicleType, setSelectedVehicleType] = React.useState(
        filters?.vehicle_type ? String(filters.vehicle_type) : 'all',
    );
    const [sortBy, setSortBy] = React.useState(filters?.sort ?? 'created_at');
    const [sortDirection, setSortDirection] = React.useState<'asc' | 'desc'>(filters?.direction ?? 'desc');

    const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
    const [selectedTruck, setSelectedTruck] = React.useState<TruckData | null>(null);
    const [isDeleting, setIsDeleting] = React.useState(false);
    const [deleteError, setDeleteError] = React.useState<string | null>(null);

    const availablePerPageOptions = React.useMemo(
        () => (perPageOptions?.length ? perPageOptions : [15, 25, 50, 100]),
        [perPageOptions],
    );

    const statusSegments = React.useMemo(() => {
        const segments: Array<{ value: string; label: string }> = [];
        const seen = new Set<string>();

        const pushSegment = (value: string, label: string) => {
            if (seen.has(value)) {
                return;
            }

            segments.push({ value, label });
            seen.add(value);
        };

        pushSegment('active', statusOptions.find((option) => option.value === 'active')?.label ?? 'Active');
        pushSegment('inactive', statusOptions.find((option) => option.value === 'inactive')?.label ?? 'Inactive');

        statusOptions.forEach((option) => {
            pushSegment(option.value, option.label);
        });

        pushSegment('all', 'All');

        return segments;
    }, [statusOptions]);

    const resolvedPerPage = React.useMemo(() => {
        const candidate = filters?.per_page;
        if (typeof candidate === 'number' && availablePerPageOptions.includes(candidate)) {
            return candidate;
        }
        return availablePerPageOptions[0] ?? 15;
    }, [filters?.per_page, availablePerPageOptions]);

    const [perPage, setPerPage] = React.useState<string>(() => String(resolvedPerPage));

    // Keep perPage synced with server-provided filter changes
    React.useEffect(() => {
        setPerPage(String(resolvedPerPage));
    }, [resolvedPerPage]);

    const truckCount = metrics?.total ?? trucks?.meta?.total ?? trucks?.data?.length ?? 0;
    const currentPage = trucks?.meta?.current_page ?? 1;

    const perPageCountRaw = trucks?.meta?.per_page ?? Number(perPage);
    const perPageCount =
        Number.isFinite(perPageCountRaw) && perPageCountRaw > 0
            ? Number(perPageCountRaw)
            : trucks?.data?.length || 1;

    const rowOffset = (currentPage - 1) * perPageCount;

    const activeCount = metrics?.active ?? 0;
    const maintenanceCount = metrics?.maintenance ?? 0;
    const fleetValue = metrics?.fleet_value ?? 0;

    const utilization = metrics?.utilization ?? null;
    const financial = metrics?.financial ?? null;
    const staffing = metrics?.staffing ?? null;

    const utilizationRateValue = utilization?.utilization_rate ?? null;
    const utilizationRateDisplay =
        utilizationRateValue !== null ? `${(utilizationRateValue * 100).toFixed(0)}%` : '—';

    const utilizationValueClass =
        utilizationRateValue === null
            ? 'text-slate-500'
            : utilizationRateValue >= 0.75
                ? 'text-green-600'
                : utilizationRateValue >= 0.5
                    ? 'text-yellow-600'
                    : 'text-red-600';

    const utilizationDescription = utilization
        ? `Service ${utilization.service_days}d · Idle ${utilization.idle_days}d · Unknown ${utilization.unknown_days}d`
        : 'Utilization data pending';

    const financialWindowDays = financial?.window_days ?? 30;
    const revenueDisplay = formatETBCurrency(financial?.total_revenue ?? 0, {
        notation: 'compact',
        maximumFractionDigits: 2,
    });

    const tonKmPerBirrDisplay =
        financial?.ton_km_per_birr !== null && financial?.ton_km_per_birr !== undefined
            ? `${financial.ton_km_per_birr.toFixed(2)} ton-km / ETB`
            : 'Ton-km per birr pending';

    const churnWindowDays = staffing?.window_days ?? 180;
    const averageTenureDisplay =
        staffing?.average_tenure_days !== null && staffing?.average_tenure_days !== undefined
            ? `${staffing.average_tenure_days.toFixed(1)} days`
            : 'Average tenure pending';

    const highChurnCount = staffing?.high_churn_truck_count ?? 0;
    const highChurnThreshold = staffing?.short_tenure_threshold_days ?? 0;

    const highChurnDescription =
        highChurnCount > 0
            ? `${highChurnCount} truck${highChurnCount === 1 ? '' : 's'} below ${highChurnThreshold}d`
            : 'Stable driver assignments';

    const churnValueClass = highChurnCount > 0 ? 'text-rose-600' : 'text-slate-600';

    const handleNavigate = React.useCallback(
        (overrides: NavigateOverrides = {}) => {
            const hasOverride = (key: keyof NavigateOverrides) =>
                Object.prototype.hasOwnProperty.call(overrides, key);

            const nextSearch = hasOverride('search')
                ? overrides.search
                : searchTerm.trim()
                    ? searchTerm.trim()
                    : undefined;

            const nextStatus = hasOverride('status')
                ? overrides.status
                : selectedStatus !== 'all'
                    ? selectedStatus
                    : undefined;

            const nextVehicleType = hasOverride('vehicle_type')
                ? overrides.vehicle_type
                : selectedVehicleType !== 'all'
                    ? selectedVehicleType
                    : undefined;

            const nextSort = hasOverride('sort') ? overrides.sort ?? sortBy : sortBy;
            const nextDirection = hasOverride('direction') ? overrides.direction ?? sortDirection : sortDirection;

            const nextPerPage = hasOverride('per_page') ? overrides.per_page : Number(perPage);
            const nextPage = hasOverride('page') ? overrides.page : undefined;

            const params: Record<string, string | number | undefined> = {
                search: nextSearch && nextSearch !== '' ? nextSearch : undefined,
                status: nextStatus && nextStatus !== 'all' ? nextStatus : undefined,
                vehicle_type: nextVehicleType && nextVehicleType !== 'all' ? nextVehicleType : undefined,
                sort: nextSort,
                direction: nextDirection,
                page: nextPage,
                per_page:
                    typeof nextPerPage === 'number' && Number.isFinite(nextPerPage) && nextPerPage > 0
                        ? nextPerPage
                        : undefined,
            };

            Object.keys(params).forEach((key) => {
                if (params[key] === undefined) {
                    delete params[key];
                }
            });

            router.get('/trucks', params, { preserveState: true, replace: false });
        },
        [searchTerm, selectedStatus, selectedVehicleType, sortBy, sortDirection, perPage],
    );

    const handleSearchChange = (value: string) => {
        setSearchTerm(value);
        handleNavigate({ search: value.trim() ? value.trim() : undefined, page: 1 });
    };

    const handleStatusChange = (value: string) => {
        setSelectedStatus(value);
        handleNavigate({ status: value !== 'all' ? value : undefined, page: 1 });
    };

    const handleVehicleTypeChange = (value: string) => {
        setSelectedVehicleType(value);
        handleNavigate({ vehicle_type: value !== 'all' ? value : undefined, page: 1 });
    };

    const handlePerPageChange = (value: string) => {
        setPerPage(value);
        const numericValue = Number(value);
        handleNavigate({ per_page: Number.isNaN(numericValue) ? undefined : numericValue, page: 1 });
    };

    const handleSort = (column: string) => {
        const newDirection: 'asc' | 'desc' =
            sortBy === column && sortDirection === 'asc' ? 'desc' : 'asc';

        setSortBy(column);
        setSortDirection(newDirection);

        handleNavigate({ sort: column, direction: newDirection });
    };

    const handleDeleteClick = (truck: TruckData) => {
        setSelectedTruck(truck);
        setDeleteDialogOpen(true);
        setDeleteError(null);
    };

    const handleDeleteConfirm = () => {
        if (!selectedTruck) return;

        setIsDeleting(true);

        router.delete(`/trucks/${selectedTruck.id}`, {
            onSuccess: () => {
                setDeleteDialogOpen(false);
                setSelectedTruck(null);
                setIsDeleting(false);
                setDeleteError(null);
            },
            onError: (errors) => {
                setIsDeleting(false);

                if (errors && typeof errors === 'object') {
                    const messages = Object.values(errors)
                        .flatMap((value) => (Array.isArray(value) ? value : [value]))
                        .filter((value) => Boolean(value))
                        .join('\n');

                    const fallback = 'Failed to delete truck. Please review the requirements and try again.';
                    setDeleteError(messages || fallback);

                    toast({
                        title: '❌ Delete Failed',
                        description: messages || fallback,
                        variant: 'destructive',
                    });
                } else {
                    const fallback = 'An unexpected error occurred while deleting the truck. Please try again.';
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
            {hasPermission('trucks.create') && (
                <Button asChild>
                    <Link href="/trucks/create">
                        <Plus className="mr-2 h-4 w-4" />
                        Add Truck
                    </Link>
                </Button>
            )}
        </>
    );

    const fleetValueDisplay = formatETBCurrency(fleetValue, {
        notation: 'compact',
        maximumFractionDigits: 2,
    });

    const statsDefinitions = [
        {
            id: 'active-trucks',
            label: 'Active',
            icon: <CheckCircle className="h-3.5 w-3.5 text-green-600" />,
            className: 'min-w-[220px] flex-shrink-0',
            value: activeCount.toLocaleString(),
            description: `${maintenanceCount.toLocaleString()} in maintenance`,
            valueClassName: 'text-green-600',
        },
        {
            id: 'fleet-value',
            label: 'Fleet Value',
            icon: <DollarSign className="h-3.5 w-3.5 text-purple-600" />,
            className: 'min-w-[220px] flex-shrink-0',
            value: fleetValueDisplay,
            description: 'Total fleet value',
            valueClassName: 'text-purple-600',
        },

        {
            id: 'driver-churn',
            label: `Driver Churn (${churnWindowDays}d)`,
            icon: <Users className="h-3.5 w-3.5 text-rose-600" />,
            className: 'min-w-[220px] flex-shrink-0',
            value: averageTenureDisplay,
            description: highChurnDescription,
            valueClassName: churnValueClass,
        },
        {
            id: 'utilization',
            label: `Utilization (${utilization?.window_days ?? 30}d)`,
            icon: <Gauge className="h-3.5 w-3.5 text-slate-600" />,
            className: 'min-w-[220px] flex-shrink-0',
            value: utilizationRateDisplay,
            description: utilizationDescription,
            valueClassName: utilizationValueClass,
        },
    ];

    const canViewTruckDetails = hasPermission('trucks.show');

    const statsSection = <ListingStatsHeader stats={statsDefinitions} orientation="row" />;

    const tableColumns = React.useMemo(
        () => [
            { id: 'index', label: '#', align: 'center' as const },
            ...columns.map(({ key, label }) => ({
                id: key,
                label,
                sortable: true,
            })),
            { id: 'actions', label: 'Actions', align: 'center' as const },
        ],
        [],
    );

    const renderStatusBadge = (status: string) => {
        const baseClasses = 'flex items-center gap-1 w-fit';

        if (status === 'active') {
            return (
                <Badge className={`${baseClasses} bg-green-100 text-green-800 border-green-200 hover:bg-green-200`}>
                    <CheckCircle className="h-3 w-3" />
                    Active
                </Badge>
            );
        }

        if (status === 'maintenance') {
            return (
                <Badge className={`${baseClasses} bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-200`}>
                    <Wrench className="h-3 w-3" />
                    Maintenance
                </Badge>
            );
        }

        return (
            <Badge className={`${baseClasses} bg-red-100 text-red-800 border-red-200 hover:bg-red-200`}>
                <XCircle className="h-3 w-3" />
                {status.charAt(0).toUpperCase() + status.slice(1)}
            </Badge>
        );
    };

    const tableRows = trucks?.data && trucks.data.length > 0
        ? trucks.data.map((truck, index) => (
              <TableRow key={truck.id} className="hover:bg-muted/50">
                  <TableCell className="text-center font-medium">
                      {rowOffset + index + 1}
                  </TableCell>
                  <TableCell className="font-medium">{truck.plate}</TableCell>
                  <TableCell className="text-muted-foreground">
                      {truck.vehicleType?.name || 'N/A'}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                      {truck.currentDriverName || 'No driver assigned'}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                      {truck.chasisNumber || '—'}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                      {truck.engineNumber || '—'}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                      {truck.serviceIntervalKM
                          ? `${truck.serviceIntervalKM.toLocaleString()} km`
                          : '—'}
                  </TableCell>
                  <TableCell className="font-medium">
                      {formatETBCurrency(truck.purchasePrice)}
                  </TableCell>
                  <TableCell className="text-center">{renderStatusBadge(truck.status)}</TableCell>
                  <TableCell className="text-center">
                      <ListingRowActionsMenu
                          actions={[
                              canViewTruckDetails && {
                                  label: 'View',
                                  icon: <Eye className="h-4 w-4" />,
                                  href: `/trucks/${truck.id}`,
                              },
                              hasPermission('trucks.edit') && {
                                  label: 'Edit',
                                  icon: <Edit className="h-4 w-4" />,
                                  href: `/trucks/${truck.id}/edit`,
                              },
                              hasPermission('trucks.destroy') && {
                                  label: 'Delete',
                                  icon: <Trash2 className="h-4 w-4" />,
                                  danger: true,
                                  onSelect: () => handleDeleteClick(truck),
                              },
                          ]}
                      />
                  </TableCell>
              </TableRow>
          ))
        : (
              <TableRow>
                  <TableCell colSpan={tableColumns.length} className="py-8 text-center text-muted-foreground">
                      No trucks found.
                      {hasPermission('trucks.create') && (
                          <Link href="/trucks/create" className="ml-1 text-primary underline">
                              Create one
                          </Link>
                      )}
                  </TableCell>
              </TableRow>
          );

    const mobileItems = React.useMemo(
        () =>
            trucks?.data?.map((truck, index) => ({
                truck,
                position: rowOffset + index + 1,
            })) ?? [],
        [rowOffset, trucks?.data],
    );

    const mobileContent = (
        <ListingMobileItemList
            items={mobileItems}
            getKey={(item) => item.truck.id}
            renderTitle={(item) => (
                <div className="flex items-center gap-2">
                    <span className="text-xs uppercase tracking-wide text-muted-foreground">#{item.position}</span>
                    <span className="text-base">{item.truck.plate}</span>
                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
            )}
            renderSubtitle={(item) => item.truck.vehicleType?.name || 'Vehicle type pending'}
            renderContent={(item) => (
                <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                        <span className="font-medium text-slate-600 dark:text-slate-300">Status</span>
                        {renderStatusBadge(item.truck.status)}
                    </div>
                    <div className="grid grid-cols-1 gap-3 text-sm text-muted-foreground">
                        <div className="flex items-center justify-between">
                            <span className="font-medium text-slate-600 dark:text-slate-300">Driver</span>
                            <span className="text-right font-semibold text-slate-900 dark:text-slate-100">
                                {item.truck.currentDriverName || 'No driver assigned'}
                            </span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="font-medium text-slate-600 dark:text-slate-300">Chassis</span>
                            <span className="text-right font-semibold text-slate-900 dark:text-slate-100">
                                {item.truck.chasisNumber || '—'}
                            </span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="font-medium text-slate-600 dark:text-slate-300">Engine</span>
                            <span className="text-right font-semibold text-slate-900 dark:text-slate-100">
                                {item.truck.engineNumber || '—'}
                            </span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="font-medium text-slate-600 dark:text-slate-300">Service Interval</span>
                            <span className="text-right font-semibold text-slate-900 dark:text-slate-100">
                                {item.truck.serviceIntervalKM
                                    ? `${item.truck.serviceIntervalKM.toLocaleString()} km`
                                    : '—'}
                            </span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="font-medium text-slate-600 dark:text-slate-300">Purchase Price</span>
                            <span className="text-right font-semibold text-slate-900 dark:text-slate-100">
                                {formatETBCurrency(item.truck.purchasePrice)}
                            </span>
                        </div>
                    </div>
                </div>
            )}
            renderFooter={(item) => (
                <div className="flex w-full flex-wrap items-center justify-end gap-2">
                    {canViewTruckDetails && (
                        <Button asChild size="sm" variant="outline" className="flex-1 sm:flex-auto">
                            <Link href={`/trucks/${item.truck.id}`}>
                                <Eye className="mr-2 h-4 w-4" />
                                View
                            </Link>
                        </Button>
                    )}
                    {hasPermission('trucks.edit') && (
                        <Button asChild size="sm" variant="secondary" className="flex-1 sm:flex-none">
                            <Link href={`/trucks/${item.truck.id}/edit`}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                            </Link>
                        </Button>
                    )}
                    {hasPermission('trucks.destroy') && (
                        <Button
                            size="sm"
                            variant="destructive"
                            className="flex-1 sm:flex-none"
                            onClick={() => handleDeleteClick(item.truck)}
                            disabled={isDeleting && selectedTruck?.id === item.truck.id}
                        >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                        </Button>
                    )}
                </div>
            )}
            emptyState={(
                <div className="py-8 text-center text-muted-foreground">
                    No trucks found.
                    {hasPermission('trucks.create') && (
                        <Link href="/trucks/create" className="ml-1 text-primary underline">
                            Create one
                        </Link>
                    )}
                </div>
            )}
        />
    );

    const perPageSelectOptions = React.useMemo(
        () =>
            availablePerPageOptions.map((option) => ({
                value: String(option),
                label: `${option} / page`,
            })),
        [availablePerPageOptions],
    );

    const tableHeaderExtras = (
        <ListingFilterBar
            search={{
                value: searchTerm,
                placeholder: 'Search trucks...',
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
            <ToggleGroup
                type="single"
                value={selectedStatus}
                onValueChange={(value) => {
                    if (!value) {
                        return;
                    }

                    handleStatusChange(value);
                }}
                variant="outline"
                size="sm"
                className="flex flex-wrap gap-px rounded-md"
            >
                {statusSegments.map((segment) => (
                    <ToggleGroupItem
                        key={segment.value}
                        value={segment.value}
                        className="px-3 py-1 text-sm font-medium capitalize data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
                    >
                        {segment.value === 'all' ? 'All' : segment.label}
                    </ToggleGroupItem>
                ))}
            </ToggleGroup>
            <Select value={selectedVehicleType} onValueChange={handleVehicleTypeChange}>
                <SelectTrigger className="w-full min-w-[180px] sm:w-auto">
                    <SelectValue placeholder="Vehicle type" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All vehicle types</SelectItem>
                    {vehicleTypes.map((type) => (
                        <SelectItem key={type.id} value={String(type.id)}>
                            {type.name}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </ListingFilterBar>
    );


    return (
        <>
            <ListPageLayout
                headTitle="Trucks"
                title="Trucks"
                description={`Manage your fleet of ${truckCount} truck${truckCount !== 1 ? 's' : ''}`}
                breadcrumbs={breadcrumbs}
                actions={headerActions}
                stats={statsSection}
                tableTitle="Truck Inventory"
                tableDescription="Manage and track all vehicles in your fleet"
                tableHeaderExtras={tableHeaderExtras}
                pagination={
                    trucks?.links ? (
                        <ListingPaginationFooter
                            className="mt-4"
                            links={trucks.links}
                            from={trucks.meta?.from ?? undefined}
                            to={trucks.meta?.to ?? undefined}
                            total={trucks.meta?.total ?? undefined}
                        />
                    ) : null
                }
            >
                <div className="hidden md:block">
                    <div className="relative">
                        <ListingTableShell columns={tableColumns} sort={{ column: sortBy, direction: sortDirection, onToggle: handleSort }}>
                            {tableRows}
                        </ListingTableShell>

                        {isTableLoading && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-background/80 backdrop-blur-sm">
                                <img src="/images/loading-spinner.svg" alt="Loading trucks" className="h-12 w-12" />
                                <span className="text-sm text-muted-foreground">Loading trucks...</span>
                            </div>
                        )}
                    </div>
                </div>

                <div className="relative space-y-3 md:hidden">
                    {mobileContent}

                    {isTableLoading && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-background/80 backdrop-blur-sm">
                            <img src="/images/loading-spinner.svg" alt="Loading trucks" className="h-10 w-10" />
                            <span className="text-sm text-muted-foreground">Loading trucks...</span>
                        </div>
                    )}
                </div>
            </ListPageLayout>

            <DeleteConfirmationDialog
                open={deleteDialogOpen}
                onOpenChange={(open) => {
                    setDeleteDialogOpen(open);
                    if (!open) {
                        setSelectedTruck(null);
                        setDeleteError(null);
                    }
                }}
                title="Delete Truck"
                description="Are you sure you want to delete this truck? This action cannot be undone."
                itemName={selectedTruck?.plate}
                onConfirm={handleDeleteConfirm}
                isLoading={isDeleting}
                errorMessage={deleteError}
                confirmLabel="Delete Truck"
            />
        </>
    );
}
