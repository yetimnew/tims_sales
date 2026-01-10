import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
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
import { useTranslation } from 'react-i18next';
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

const getBreadcrumbs = (translate: (key: string) => string): BreadcrumbItem[] => [
    {
        title: translate('trucks.breadcrumb'),
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

const getColumns = (translate: (key: string) => string): Array<{ key: string; label: string }> => [
    { key: 'plate', label: translate('trucks.columns.plate') },
    { key: 'vehicleType', label: translate('trucks.columns.vehicleType') },
    { key: 'currentDriverName', label: translate('trucks.columns.driver') },
    { key: 'chasisNumber', label: translate('trucks.columns.chassis') },
    { key: 'engineNumber', label: translate('trucks.columns.engine') },
    { key: 'serviceIntervalKM', label: translate('trucks.columns.serviceInterval') },
    { key: 'purchasePrice', label: translate('trucks.columns.price') },
    { key: 'status', label: translate('trucks.columns.status') },
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
    const { t } = useTranslation();
    const breadcrumbs = React.useMemo(() => getBreadcrumbs(t), [t]);
    const columns = React.useMemo(() => getColumns(t), [t]);
    const isDataReady = React.useMemo(() => {
        // Check if we have valid data structure
        // Data is ready if trucks exists and has a data array (even if empty)
        return (
            trucks !== null &&
            trucks !== undefined &&
            Array.isArray(trucks.data)
        );
    }, [trucks]);
    const { isLoading: isLoadingState } = useListingLoading({
        storageKey: SKELETON_FLAG_KEY,
        isDataReady,
        minimumDuration: 350,
        onlySamePath: true, // Still show loading for same-path navigation (pagination, filtering)
        targetPath: '/trucks', // Show loading when navigating TO /trucks from any other page
        initialIsLoading: true, // Show skeleton immediately on initial mount
    });

    // Force skeleton display for testing - remove this in production
    // Uncomment the line below to always show skeletons for testing
    // const isTableLoading = true;
    const isTableLoading = isLoadingState;

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

        pushSegment(
            'active',
            statusOptions.find((option) => option.value === 'active')?.label ?? t('trucks.status.active'),
        );
        pushSegment(
            'inactive',
            statusOptions.find((option) => option.value === 'inactive')?.label ?? t('trucks.status.inactive'),
        );

        statusOptions.forEach((option) => {
            pushSegment(option.value, option.label);
        });

        pushSegment('all', t('trucks.filters.all'));

        return segments;
    }, [statusOptions, t]);

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
        ? t('trucks.stats.utilization.detail', {
            serviceDays: utilization.service_days,
            idleDays: utilization.idle_days,
            unknownDays: utilization.unknown_days,
        })
        : t('trucks.stats.utilization.pending');

    const financialWindowDays = financial?.window_days ?? 30;
    const revenueDisplay = formatETBCurrency(financial?.total_revenue ?? 0, {
        notation: 'compact',
        maximumFractionDigits: 2,
    });

    const tonKmPerBirrDisplay =
        financial?.ton_km_per_birr !== null && financial?.ton_km_per_birr !== undefined
            ? t('trucks.stats.revenue.tonKmPerBirr', {
                value: financial.ton_km_per_birr.toFixed(2),
            })
            : t('trucks.stats.revenue.tonKmPerBirrPending');

    const churnWindowDays = staffing?.window_days ?? 180;
    const averageTenureDisplay =
        staffing?.average_tenure_days !== null && staffing?.average_tenure_days !== undefined
            ? t('trucks.stats.churn.averageTenure', {
                days: staffing.average_tenure_days.toFixed(1),
            })
            : t('trucks.stats.churn.averageTenurePending');

    const highChurnCount = staffing?.high_churn_truck_count ?? 0;
    const highChurnThreshold = staffing?.short_tenure_threshold_days ?? 0;

    const highChurnDescription =
        highChurnCount > 0
            ? t('trucks.stats.churn.highChurn', {
                count: highChurnCount,
                days: highChurnThreshold,
            })
            : t('trucks.stats.churn.stable');

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

                    const fallback = t('trucks.delete.errorKnown');
                    setDeleteError(messages || fallback);

                    toast({
                        title: t('trucks.delete.failedTitle'),
                        description: messages || fallback,
                        variant: 'destructive',
                    });
                } else {
                    const fallback = t('trucks.delete.errorUnknown');
                    setDeleteError(fallback);

                    toast({
                        title: t('trucks.delete.failedTitle'),
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
                        {t('trucks.actions.add')}
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
            id: 'total-trucks',
            label: t('trucks.stats.total.label'),
            icon: <Truck className="h-3.5 w-3.5 text-blue-600" />,
            className: 'min-w-[220px] flex-shrink-0',
            value: isTableLoading ? (
                <Skeleton className="h-3.5 w-20" aria-hidden="true" />
            ) : (
                truckCount.toLocaleString()
            ),
            description: isTableLoading ? (
                <Skeleton className="h-3 w-24" aria-hidden="true" />
            ) : (
                t('trucks.stats.total.description')
            ),
            valueClassName: isTableLoading ? undefined : 'text-blue-600',
        },
        {
            id: 'active-trucks',
            label: t('trucks.stats.active.label'),
            icon: <CheckCircle className="h-3.5 w-3.5 text-green-600" />,
            className: 'min-w-[220px] flex-shrink-0',
            value: isTableLoading ? (
                <Skeleton className="h-3.5 w-16" aria-hidden="true" />
            ) : (
                activeCount.toLocaleString()
            ),
            description: isTableLoading ? (
                <Skeleton className="h-3 w-28" aria-hidden="true" />
            ) : (
                t('trucks.stats.active.description', {
                    count: maintenanceCount,
                })
            ),
            valueClassName: isTableLoading ? undefined : 'text-green-600',
        },
        {
            id: 'fleet-value',
            label: t('trucks.stats.fleetValue.label'),
            icon: <DollarSign className="h-3.5 w-3.5 text-purple-600" />,
            className: 'min-w-[220px] flex-shrink-0',
            value: isTableLoading ? (
                <Skeleton className="h-3.5 w-20" aria-hidden="true" />
            ) : (
                fleetValueDisplay
            ),
            description: isTableLoading ? (
                <Skeleton className="h-3 w-24" aria-hidden="true" />
            ) : (
                t('trucks.stats.fleetValue.description')
            ),
            valueClassName: isTableLoading ? undefined : 'text-purple-600',
        },
        {
            id: 'revenue',
            label: t('trucks.stats.revenue.label', { days: financialWindowDays }),
            icon: <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />,
            className: 'min-w-[220px] flex-shrink-0',
            value: isTableLoading ? (
                <Skeleton className="h-3.5 w-24" aria-hidden="true" />
            ) : (
                revenueDisplay
            ),
            description: isTableLoading ? (
                <Skeleton className="h-3 w-28" aria-hidden="true" />
            ) : (
                tonKmPerBirrDisplay
            ),
            valueClassName: isTableLoading ? undefined : 'text-emerald-600',
        },
        {
            id: 'driver-churn',
            label: t('trucks.stats.churn.label', { days: churnWindowDays }),
            icon: <Users className="h-3.5 w-3.5 text-rose-600" />,
            className: 'min-w-[220px] flex-shrink-0',
            value: isTableLoading ? (
                <Skeleton className="h-3.5 w-16" aria-hidden="true" />
            ) : (
                averageTenureDisplay
            ),
            description: isTableLoading ? (
                <Skeleton className="h-3 w-32" aria-hidden="true" />
            ) : (
                highChurnDescription
            ),
            valueClassName: isTableLoading ? undefined : churnValueClass,
        },
        {
            id: 'utilization',
            label: t('trucks.stats.utilization.label', { days: utilization?.window_days ?? 30 }),
            icon: <Gauge className="h-3.5 w-3.5 text-slate-600" />,
            className: 'min-w-[220px] flex-shrink-0',
            value: isTableLoading ? (
                <Skeleton className="h-3.5 w-16" aria-hidden="true" />
            ) : (
                utilizationRateDisplay
            ),
            description: isTableLoading ? (
                <Skeleton className="h-3 w-36" aria-hidden="true" />
            ) : (
                utilizationDescription
            ),
            valueClassName: isTableLoading ? undefined : utilizationValueClass,
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
            { id: 'actions', label: t('trucks.table.actions'), align: 'center' as const },
        ],
        [columns, t],
    );

    const renderStatusBadge = (status: string) => {
        const baseClasses = 'flex items-center gap-1 w-fit';

        if (status === 'active') {
            return (
                <Badge className={`${baseClasses} bg-green-100 text-green-800 border-green-200 hover:bg-green-200`}>
                    <CheckCircle className="h-3 w-3" />
                    {t('trucks.status.active')}
                </Badge>
            );
        }

        if (status === 'maintenance') {
            return (
                <Badge className={`${baseClasses} bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-200`}>
                    <Wrench className="h-3 w-3" />
                    {t('trucks.status.maintenance')}
                </Badge>
            );
        }

        return (
            <Badge className={`${baseClasses} bg-red-100 text-red-800 border-red-200 hover:bg-red-200`}>
                <XCircle className="h-3 w-3" />
                {t(`trucks.status.${status}`, {
                    defaultValue: status.charAt(0).toUpperCase() + status.slice(1),
                })}
            </Badge>
        );
    };

    const tableRows = isTableLoading
        ? Array.from({ length: 8 }).map((_, index) => (
              <TableRow key={`skeleton-${index}`} aria-hidden="true">
                  <TableCell className="text-center">
                      <Skeleton className="h-4 w-6 mx-auto" />
                  </TableCell>
                  <TableCell>
                      <Skeleton className="h-4 w-20" />
                  </TableCell>
                  <TableCell>
                      <Skeleton className="h-4 w-24" />
                  </TableCell>
                  <TableCell>
                      <Skeleton className="h-4 w-28" />
                  </TableCell>
                  <TableCell>
                      <Skeleton className="h-4 w-24" />
                  </TableCell>
                  <TableCell>
                      <Skeleton className="h-4 w-20" />
                  </TableCell>
                  <TableCell>
                      <Skeleton className="h-4 w-16" />
                  </TableCell>
                  <TableCell>
                      <Skeleton className="h-4 w-24" />
                  </TableCell>
                  <TableCell className="text-center">
                      <Skeleton className="h-6 w-20 mx-auto rounded-full" />
                  </TableCell>
                  <TableCell className="text-center">
                      <Skeleton className="h-8 w-8 mx-auto rounded" />
                  </TableCell>
              </TableRow>
          ))
        : trucks?.data && trucks.data.length > 0
        ? trucks.data.map((truck, index) => (
              <TableRow key={truck.id} className="hover:bg-muted/50">
                  <TableCell className="text-center font-medium">
                      {rowOffset + index + 1}
                  </TableCell>
                  <TableCell className="font-medium">{truck.plate}</TableCell>
                  <TableCell className="text-muted-foreground">
                      {truck.vehicleType?.name || t('trucks.fallbacks.notAvailable')}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                      {truck.currentDriverName || t('trucks.fallbacks.noDriverAssigned')}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                      {truck.chasisNumber || '—'}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                      {truck.engineNumber || '—'}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                      {truck.serviceIntervalKM
                          ? t('trucks.units.kilometers', { value: truck.serviceIntervalKM.toLocaleString() })
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
                                  label: t('trucks.actions.view'),
                                  icon: <Eye className="h-4 w-4" />,
                                  href: `/trucks/${truck.id}`,
                              },
                              hasPermission('trucks.edit') && {
                                  label: t('trucks.actions.edit'),
                                  icon: <Edit className="h-4 w-4" />,
                                  href: `/trucks/${truck.id}/edit`,
                              },
                              hasPermission('trucks.destroy') && {
                                  label: t('trucks.actions.delete'),
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
                      {t('trucks.empty.title')}
                      {hasPermission('trucks.create') && (
                          <Link href="/trucks/create" className="ml-1 text-primary underline">
                              {t('trucks.empty.createAction')}
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

    const skeletonMobileItems = React.useMemo(
        () => Array.from({ length: 5 }).map((_, index) => ({ id: `skeleton-${index}` })),
        [],
    );

    const mobileContent = isTableLoading ? (
        <div className="space-y-3">
            {skeletonMobileItems.map((item) => (
                <div key={item.id} className="rounded-lg border bg-card p-4" aria-hidden="true">
                    <div className="mb-3 flex items-center gap-2">
                        <Skeleton className="h-3 w-8" />
                        <Skeleton className="h-5 w-24" />
                        <Skeleton className="h-3.5 w-3.5 ml-auto" />
                    </div>
                    <Skeleton className="mb-3 h-4 w-32" />
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <Skeleton className="h-4 w-16" />
                            <Skeleton className="h-4 w-20" />
                        </div>
                        <div className="flex items-center justify-between">
                            <Skeleton className="h-4 w-20" />
                            <Skeleton className="h-4 w-24" />
                        </div>
                        <div className="flex items-center justify-between">
                            <Skeleton className="h-4 w-16" />
                            <Skeleton className="h-4 w-20" />
                        </div>
                        <div className="flex items-center justify-between">
                            <Skeleton className="h-4 w-28" />
                            <Skeleton className="h-4 w-16" />
                        </div>
                        <div className="flex items-center justify-between">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-4 w-24" />
                        </div>
                    </div>
                    <div className="mt-4 flex gap-2">
                        <Skeleton className="h-8 flex-1" />
                        <Skeleton className="h-8 w-20" />
                        <Skeleton className="h-8 w-20" />
                    </div>
                </div>
            ))}
        </div>
    ) : (
        <ListingMobileItemList
            items={mobileItems}
            getKey={(item) => item.truck.id}
            renderTitle={(item) => (
                <div className="flex items-center gap-2">
                    <span className="text-xs uppercase tracking-wide text-muted-foreground">
                        {t('trucks.mobile.position', { value: item.position })}
                    </span>
                    <span className="text-base">{item.truck.plate}</span>
                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
            )}
            renderSubtitle={(item) => item.truck.vehicleType?.name || t('trucks.fallbacks.vehicleTypePending')}
            renderContent={(item) => (
                <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                        <span className="font-medium text-slate-600 dark:text-slate-300">{t('trucks.labels.status')}</span>
                        {renderStatusBadge(item.truck.status)}
                    </div>
                    <div className="grid grid-cols-1 gap-3 text-sm text-muted-foreground">
                        <div className="flex items-center justify-between">
                            <span className="font-medium text-slate-600 dark:text-slate-300">{t('trucks.labels.driver')}</span>
                            <span className="text-right font-semibold text-slate-900 dark:text-slate-100">
                                {item.truck.currentDriverName || t('trucks.fallbacks.noDriverAssigned')}
                            </span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="font-medium text-slate-600 dark:text-slate-300">{t('trucks.labels.chassis')}</span>
                            <span className="text-right font-semibold text-slate-900 dark:text-slate-100">
                                {item.truck.chasisNumber || '—'}
                            </span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="font-medium text-slate-600 dark:text-slate-300">{t('trucks.labels.engine')}</span>
                            <span className="text-right font-semibold text-slate-900 dark:text-slate-100">
                                {item.truck.engineNumber || '—'}
                            </span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="font-medium text-slate-600 dark:text-slate-300">{t('trucks.labels.serviceInterval')}</span>
                            <span className="text-right font-semibold text-slate-900 dark:text-slate-100">
                                {item.truck.serviceIntervalKM
                                    ? t('trucks.units.kilometers', { value: item.truck.serviceIntervalKM.toLocaleString() })
                                    : '—'}
                            </span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="font-medium text-slate-600 dark:text-slate-300">{t('trucks.labels.purchasePrice')}</span>
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
                                {t('trucks.actions.view')}
                            </Link>
                        </Button>
                    )}
                    {hasPermission('trucks.edit') && (
                        <Button asChild size="sm" variant="secondary" className="flex-1 sm:flex-none">
                            <Link href={`/trucks/${item.truck.id}/edit`}>
                                <Edit className="mr-2 h-4 w-4" />
                                {t('trucks.actions.edit')}
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
                            {t('trucks.actions.delete')}
                        </Button>
                    )}
                </div>
            )}
            emptyState={(
                <div className="py-8 text-center text-muted-foreground">
                    {t('trucks.empty.title')}
                    {hasPermission('trucks.create') && (
                        <Link href="/trucks/create" className="ml-1 text-primary underline">
                            {t('trucks.empty.createAction')}
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
                label: t('trucks.filters.perPageOption', { value: option }),
            })),
        [availablePerPageOptions, t],
    );

    const tableHeaderExtras = (
        <ListingFilterBar
            search={{
                value: searchTerm,
                placeholder: t('trucks.filters.searchPlaceholder'),
                onChange: handleSearchChange,
                icon: <Search className="h-4 w-4" />,
            }}
            perPage={{
                value: perPage,
                label: t('trucks.filters.rowsLabel'),
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
                        {segment.value === 'all' ? t('trucks.filters.all') : segment.label}
                    </ToggleGroupItem>
                ))}
            </ToggleGroup>
            <Select value={selectedVehicleType} onValueChange={handleVehicleTypeChange}>
                <SelectTrigger className="w-full min-w-[180px] sm:w-auto">
                    <SelectValue placeholder={t('trucks.filters.vehicleType')} />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">{t('trucks.filters.allVehicleTypes')}</SelectItem>
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
                headTitle={t('trucks.title')}
                title={t('trucks.title')}
                description={t('trucks.description', { count: truckCount, plural: truckCount === 1 ? '' : 's' })}
                breadcrumbs={breadcrumbs}
                actions={headerActions}
                stats={statsSection}
                tableTitle={t('trucks.table.title')}
                tableDescription={t('trucks.table.description')}
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
                        <ListingTableShell columns={tableColumns} sort={{ column: sortBy, direction: sortDirection, onToggle: handleSort }}>
                            {tableRows}
                        </ListingTableShell>
                </div>

                <div className="space-y-3 md:hidden">
                    {mobileContent}
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
                title={t('trucks.delete.title')}
                description={t('trucks.delete.description')}
                itemName={selectedTruck?.plate}
                onConfirm={handleDeleteConfirm}
                isLoading={isDeleting}
                errorMessage={deleteError}
                confirmLabel={t('trucks.delete.confirm')}
            />
        </>
    );
}
