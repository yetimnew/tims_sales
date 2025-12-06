import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TableCell, TableRow } from '@/components/ui/table';
import ListPageLayout from '@/components/layouts/list-page-layout';
import { ListingStatsHeader } from '@/components/listing/stats-header';
import { ListingFilterBar } from '@/components/listing/filter-bar';
import { ListingTableShell } from '@/components/listing/data-table-shell';
import { ListingMobileItemList } from '@/components/listing/mobile-item-list';
import { ListingLoadingPlaceholder } from '@/components/listing/loading-placeholder';
import { ListingPaginationFooter } from '@/components/listing/pagination-footer';
import { ListingRowActionsMenu } from '@/components/listing/row-actions-menu';
import { DeleteConfirmationDialog } from '@/components/delete-confirmation-dialog';
import { usePermissions } from '@/hooks/use-permissions';
import { useListingLoading } from '@/hooks/use-listing-loading';
import { toast } from '@/hooks/use-toast';
import { Link, router } from '@inertiajs/react';
import { type BreadcrumbItem } from '@/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import * as React from 'react';
import {
    Plus,
    Eye,
    Edit,
    Search,
    Trash2,
    Fuel as FuelIcon,
    Droplet,
    DollarSign,
    Gauge,
    ChevronRight,
} from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Fuel Records',
        href: '/fuel',
    },
];

interface FuelRecord {
    id: number;
    truck_id: number;
    driver_id: number;
    driver_truck_id?: number | null;
    fuel_date: string;
    fuel_quantity_liters: number;
    fuel_price_per_liter: number;
    total_cost: number;
    fuel_type: string;
    fuel_station?: string | null;
    truck?: { id: number; plate: string } | null;
    driver?: { id: number; name: string } | null;
    driver_truck?: {
        id: number;
        truck?: { id: number; plate: string } | null;
        driver?: { id: number; name: string } | null;
    } | null;
    receipt_number?: string | null;
}

interface FuelIndexProps {
    fuelRecords: {
        data: FuelRecord[];
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
        total_liters: number;
        total_cost: number;
        average_price_per_liter: number;
        diesel_count: number;
        petrol_count: number;
        gas_count: number;
    };
    filters: {
        search?: string | null;
        fuel_type?: string | null;
        truck?: number | string | null;
        driver?: number | string | null;
        sort?: string | null;
        direction?: 'asc' | 'desc' | null;
        per_page?: number | null;
    };
    fuelTypeOptions: Array<{ label: string; value: string }>;
    truckOptions: Array<{ id: number; plate: string }>;
    driverOptions: Array<{ id: number; name: string }>;
    perPageOptions: number[];
}

const SKELETON_FLAG_KEY = 'fuel.index.shouldShowSkeleton';

const COLUMN_DEFINITIONS: Array<{
    id:
        | 'fuel_date'
        | 'truck'
        | 'driver'
        | 'fuel_type'
        | 'fuel_quantity_liters'
        | 'fuel_price_per_liter'
        | 'total_cost'
        | 'receipt_number';
    label: string;
    sortKey?: string;
    align?: 'left' | 'center' | 'right';
}> = [
    { id: 'fuel_date', label: 'Date', sortKey: 'fuel_date' },
    { id: 'truck', label: 'Truck' },
    { id: 'driver', label: 'Driver' },
    { id: 'fuel_type', label: 'Type', align: 'center' },
    { id: 'fuel_quantity_liters', label: 'Quantity (L)', sortKey: 'fuel_quantity_liters', align: 'right' },
    { id: 'fuel_price_per_liter', label: 'Price / L', sortKey: 'fuel_price_per_liter', align: 'right' },
    { id: 'total_cost', label: 'Total Cost', sortKey: 'total_cost', align: 'right' },
    { id: 'receipt_number', label: 'Receipt #' },
];

type NavigateOverrides = {
    search?: string;
    fuel_type?: string;
    truck?: string | number;
    driver?: string | number;
    sort?: string;
    direction?: 'asc' | 'desc';
    page?: number;
    per_page?: number;
};

const toNumeric = (value: number | string | null | undefined): number | null => {
    if (value === null || value === undefined || value === '') {
        return null;
    }

    if (typeof value === 'number') {
        return Number.isFinite(value) ? value : null;
    }

    const parsed = Number.parseFloat(value);
    return Number.isNaN(parsed) ? null : parsed;
};

const formatNumber = (value: number | string | null | undefined): string => {
    const numeric = toNumeric(value);
    if (numeric === null) {
        return '0.00';
    }

    return numeric.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
};

const formatCurrency = (value: number | string | null | undefined): string => {
    const numeric = toNumeric(value);
    if (numeric === null) {
        return 'ETB 0.00';
    }

    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'ETB',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(numeric);
};

const formatDate = (value?: string | null): string => {
    if (!value) {
        return '—';
    }

    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        return value;
    }

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
        return value;
    }

    return parsed.toLocaleDateString();
};

const getFuelTypeBadgeClass = (type: string): string => {
    const normalized = type.toLowerCase();
    if (normalized === 'diesel') {
        return 'bg-blue-500 text-white hover:bg-blue-600';
    }
    if (normalized === 'petrol') {
        return 'bg-orange-500 text-white hover:bg-orange-600';
    }
    if (normalized === 'gas') {
        return 'bg-green-500 text-white hover:bg-green-600';
    }
    return 'bg-muted text-muted-foreground';
};

export default function FuelIndex({
    fuelRecords,
    metrics,
    filters,
    fuelTypeOptions,
    truckOptions,
    driverOptions,
    perPageOptions,
}: FuelIndexProps) {
    const { hasPermission } = usePermissions();
    const canViewRecord = hasPermission('fuel.show');
    const canEditRecord = hasPermission('fuel.edit');
    const canDeleteRecord = hasPermission('fuel.destroy');
    const canCreateRecord = hasPermission('fuel.create');

    const [searchTerm, setSearchTerm] = React.useState(filters?.search ?? '');
    const [selectedFuelType, setSelectedFuelType] = React.useState(filters?.fuel_type ?? 'all');
    const [selectedTruck, setSelectedTruck] = React.useState(filters?.truck ? String(filters.truck) : 'all');
    const [selectedDriver, setSelectedDriver] = React.useState(filters?.driver ? String(filters.driver) : 'all');
    const [sortColumn, setSortColumn] = React.useState<string>(filters?.sort ?? 'fuel_date');
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
    const [selectedRecord, setSelectedRecord] = React.useState<FuelRecord | null>(null);
    const [isDeleting, setIsDeleting] = React.useState(false);

    const isDataReady = Array.isArray(fuelRecords?.data);
    const { isLoading } = useListingLoading({
        storageKey: SKELETON_FLAG_KEY,
        isDataReady,
    });

    React.useEffect(() => {
        setPerPage(String(resolvedPerPage));
    }, [resolvedPerPage]);

    const fuelData = fuelRecords?.data ?? [];
    const totalRecords = metrics?.total ?? fuelRecords?.total ?? fuelData.length ?? 0;
    const totalLiters = metrics?.total_liters ?? 0;
    const totalCost = metrics?.total_cost ?? 0;
    const averagePricePerLiter = metrics?.average_price_per_liter ?? 0;
    const dieselCount = metrics?.diesel_count ?? 0;
    const petrolCount = metrics?.petrol_count ?? 0;
    const gasCount = metrics?.gas_count ?? 0;

    const rowOffset = Math.max((fuelRecords?.from ?? 1) - 1, 0);

    const handleNavigate = React.useCallback(
        (overrides: NavigateOverrides = {}) => {
            const hasOverride = (key: keyof NavigateOverrides) =>
                Object.prototype.hasOwnProperty.call(overrides, key);

            const nextSearch = hasOverride('search')
                ? overrides.search
                : searchTerm.trim()
                    ? searchTerm.trim()
                    : undefined;

            const nextFuelType = hasOverride('fuel_type')
                ? overrides.fuel_type
                : selectedFuelType !== 'all'
                    ? selectedFuelType
                    : undefined;

            const nextTruck = hasOverride('truck')
                ? overrides.truck
                : selectedTruck !== 'all'
                    ? selectedTruck
                    : undefined;

            const nextDriver = hasOverride('driver')
                ? overrides.driver
                : selectedDriver !== 'all'
                    ? selectedDriver
                    : undefined;

            const nextSort = hasOverride('sort') ? overrides.sort ?? sortColumn : sortColumn;
            const nextDirection = hasOverride('direction') ? overrides.direction ?? sortDirection : sortDirection;
            const nextPerPage = hasOverride('per_page') ? overrides.per_page : Number(perPage);
            const nextPage = hasOverride('page') ? overrides.page : undefined;

            const params: Record<string, string | number | undefined> = {
                search: nextSearch && nextSearch !== '' ? nextSearch : undefined,
                fuel_type: nextFuelType && nextFuelType !== 'all' ? nextFuelType : undefined,
                truck: nextTruck && nextTruck !== 'all' ? nextTruck : undefined,
                driver: nextDriver && nextDriver !== 'all' ? nextDriver : undefined,
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

            if (typeof window !== 'undefined') {
                window.sessionStorage.setItem(SKELETON_FLAG_KEY, 'true');
            }

            router.get('/fuel', params, { preserveState: true, replace: false });
        },
        [perPage, searchTerm, selectedFuelType, selectedTruck, selectedDriver, sortColumn, sortDirection],
    );

    const handleSearchChange = (value: string) => {
        setSearchTerm(value);
        handleNavigate({ search: value.trim() ? value.trim() : undefined, page: 1 });
    };

    const handleFuelTypeChange = (value: string) => {
        setSelectedFuelType(value);
        handleNavigate({ fuel_type: value !== 'all' ? value : undefined, page: 1 });
    };

    const handleTruckChange = (value: string) => {
        setSelectedTruck(value);
        handleNavigate({ truck: value !== 'all' ? value : undefined, page: 1 });
    };

    const handleDriverChange = (value: string) => {
        setSelectedDriver(value);
        handleNavigate({ driver: value !== 'all' ? value : undefined, page: 1 });
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

    const handleDeleteClick = (record: FuelRecord) => {
        setSelectedRecord(record);
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = () => {
        if (!selectedRecord) {
            return;
        }

        setIsDeleting(true);

        router.delete(`/fuel/${selectedRecord.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                setDeleteDialogOpen(false);
                setSelectedRecord(null);
                setIsDeleting(false);
                toast({
                    title: 'Fuel record removed',
                    description: 'The fuel record was deleted successfully.',
                });
            },
            onError: (errors) => {
                setIsDeleting(false);

                const fallback = 'Failed to delete fuel record. Please try again.';
                if (errors && typeof errors === 'object') {
                    const errorMessages = Object.values(errors)
                        .flatMap((value) => (Array.isArray(value) ? value : [value]))
                        .filter(Boolean)
                        .join('\n');

                    toast({
                        title: 'Delete failed',
                        description: errorMessages || fallback,
                        variant: 'destructive',
                    });
                } else {
                    toast({
                        title: 'Delete failed',
                        description: fallback,
                        variant: 'destructive',
                    });
                }
            },
        });
    };

    const headerActions = (
        <>
            {canCreateRecord && (
                <Button asChild>
                    <Link href="/fuel/create">
                        <Plus className="mr-2 h-4 w-4" />
                        Add Fuel Record
                    </Link>
                </Button>
            )}
        </>
    );

    const statsDefinitions = [
        {
            id: 'fuel-records',
            label: 'Fuel Records',
            icon: <FuelIcon className="h-3.5 w-3.5 text-blue-600" />,
            className: 'min-w-0',
            value: isLoading ? (
                <Skeleton className="h-3.5 w-20" aria-hidden="true" />
            ) : (
                (totalRecords ?? 0).toLocaleString()
            ),
            description: isLoading ? (
                <Skeleton className="h-3 w-36" aria-hidden="true" />
            ) : (
                `${(dieselCount ?? 0).toLocaleString()} diesel entries`
            ),
            valueClassName: isLoading ? undefined : 'text-blue-600',
        },
        {
            id: 'total-liters',
            label: 'Total Liters',
            icon: <Droplet className="h-3.5 w-3.5 text-emerald-600" />,
            className: 'min-w-0',
            value: isLoading ? (
                <Skeleton className="h-3.5 w-20" aria-hidden="true" />
            ) : (
                formatNumber(totalLiters)
            ),
            description: isLoading ? (
                <Skeleton className="h-3 w-36" aria-hidden="true" />
            ) : (
                `${(petrolCount ?? 0).toLocaleString()} petrol records`
            ),
            valueClassName: isLoading ? undefined : 'text-emerald-600',
        },
        {
            id: 'total-cost',
            label: 'Total Cost',
            icon: <DollarSign className="h-3.5 w-3.5 text-purple-600" />,
            className: 'min-w-0',
            value: isLoading ? (
                <Skeleton className="h-3.5 w-28" aria-hidden="true" />
            ) : (
                formatCurrency(totalCost)
            ),
            description: isLoading ? (
                <Skeleton className="h-3 w-32" aria-hidden="true" />
            ) : (
                `${(gasCount ?? 0).toLocaleString()} gas entries`
            ),
            valueClassName: isLoading ? undefined : 'text-purple-600',
        },
        {
            id: 'average-price',
            label: 'Avg Price / L',
            icon: <Gauge className="h-3.5 w-3.5 text-amber-600" />,
            className: 'min-w-0',
            value: isLoading ? (
                <Skeleton className="h-3.5 w-24" aria-hidden="true" />
            ) : (
                formatCurrency(averagePricePerLiter)
            ),
            description: isLoading ? (
                <Skeleton className="h-3 w-32" aria-hidden="true" />
            ) : (
                'Across filtered records'
            ),
            valueClassName: isLoading ? undefined : 'text-amber-600',
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
                sortable: Boolean(column.sortKey),
                sortKey: column.sortKey,
                align: column.align,
            })),
            { id: 'actions', label: 'Actions', align: 'center' as const },
        ],
        [],
    );

    const tableRows = isLoading
        ? Array.from({ length: 6 }).map((_, rowIndex) => (
              <TableRow key={`fuel-record-skeleton-${rowIndex}`} aria-hidden="true">
                  {tableColumns.map((column) => (
                      <TableCell
                          key={`${column.id}-${rowIndex}`}
                          className={column.align === 'center' ? 'text-center' : column.align === 'right' ? 'text-right' : undefined}
                      >
                          <Skeleton className="mx-auto h-4 w-24 max-w-full" />
                      </TableCell>
                  ))}
              </TableRow>
          ))
        : fuelData.length > 0
            ? fuelData.map((record, index) => {
                  const truckLabel = record.truck?.plate ?? record.driver_truck?.truck?.plate ?? '—';
                  const driverLabel = record.driver?.name ?? record.driver_truck?.driver?.name ?? '—';

                  return (
                      <TableRow key={record.id} className="hover:bg-muted/50">
                          <TableCell className="text-center font-medium">{rowOffset + index + 1}</TableCell>
                          <TableCell className="font-medium">{formatDate(record.fuel_date)}</TableCell>
                          <TableCell className="text-muted-foreground">{truckLabel}</TableCell>
                          <TableCell className="text-muted-foreground">{driverLabel}</TableCell>
                          <TableCell className="text-center">
                              <Badge className={getFuelTypeBadgeClass(record.fuel_type)}>{record.fuel_type}</Badge>
                          </TableCell>
                          <TableCell className="text-right text-muted-foreground">{formatNumber(record.fuel_quantity_liters)}</TableCell>
                          <TableCell className="text-right text-muted-foreground">{formatCurrency(record.fuel_price_per_liter)}</TableCell>
                          <TableCell className="text-right font-semibold">{formatCurrency(record.total_cost)}</TableCell>
                          <TableCell className="text-muted-foreground">{record.receipt_number || '—'}</TableCell>
                          <TableCell className="text-center">
                              <ListingRowActionsMenu
                                  actions={[
                                      canViewRecord && {
                                          label: 'View',
                                          icon: <Eye className="h-4 w-4" />,
                                          href: `/fuel/${record.id}`,
                                      },
                                      canEditRecord && {
                                          label: 'Edit',
                                          icon: <Edit className="h-4 w-4" />,
                                          href: `/fuel/${record.id}/edit`,
                                      },
                                      canDeleteRecord && {
                                          label: 'Delete',
                                          icon: <Trash2 className="h-4 w-4" />,
                                          danger: true,
                                          disabled: isDeleting && selectedRecord?.id === record.id,
                                          onSelect: () => handleDeleteClick(record),
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
                        No fuel records found.
                        {canCreateRecord && (
                            <Link href="/fuel/create" className="ml-1 text-primary underline">
                                Create one
                            </Link>
                        )}
                    </TableCell>
                </TableRow>
            );

    const mobileItems = React.useMemo(
        () =>
            fuelData.map((record, index) => ({
                record,
                position: rowOffset + index + 1,
                truckLabel: record.truck?.plate ?? record.driver_truck?.truck?.plate ?? '—',
                driverLabel: record.driver?.name ?? record.driver_truck?.driver?.name ?? '—',
            })),
        [fuelData, rowOffset],
    );

    const mobileContent = isLoading ? (
        <ListingLoadingPlaceholder showStats={false} filterItemCount={4} rowCount={4} />
    ) : (
        <ListingMobileItemList
            items={mobileItems}
            getKey={(item) => item.record.id}
            renderTitle={(item) => (
                <div className="flex items-center gap-2">
                    <span className="text-xs uppercase tracking-wide text-muted-foreground">#{item.position}</span>
                    <span className="text-base">{item.truckLabel}</span>
                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
            )}
            renderSubtitle={(item) => item.driverLabel}
            renderContent={(item) => (
                <div className="space-y-3 text-sm text-muted-foreground">
                    <div className="flex items-center justify-between">
                        <span className="font-medium text-slate-600 dark:text-slate-300">Date</span>
                        <span className="text-right text-slate-900 dark:text-slate-100">{formatDate(item.record.fuel_date)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="font-medium text-slate-600 dark:text-slate-300">Fuel Type</span>
                        <span className="text-right text-slate-900 dark:text-slate-100">{item.record.fuel_type}</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="font-medium text-slate-600 dark:text-slate-300">Quantity</span>
                        <span className="text-right text-slate-900 dark:text-slate-100">{formatNumber(item.record.fuel_quantity_liters)} L</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="font-medium text-slate-600 dark:text-slate-300">Total Cost</span>
                        <span className="text-right text-slate-900 dark:text-slate-100">{formatCurrency(item.record.total_cost)}</span>
                    </div>
                </div>
            )}
            renderFooter={(item) => (
                <div className="flex w-full flex-wrap items-center justify-end gap-2">
                    {canViewRecord && (
                        <Button asChild size="sm" variant="outline" className="flex-1 sm:flex-auto">
                            <Link href={`/fuel/${item.record.id}`}>
                                <Eye className="mr-2 h-4 w-4" />
                                View
                            </Link>
                        </Button>
                    )}
                    {canEditRecord && (
                        <Button asChild size="sm" variant="secondary" className="flex-1 sm:flex-none">
                            <Link href={`/fuel/${item.record.id}/edit`}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                            </Link>
                        </Button>
                    )}
                    {canDeleteRecord && (
                        <Button
                            size="sm"
                            variant="destructive"
                            className="flex-1 sm:flex-none"
                            onClick={() => handleDeleteClick(item.record)}
                            disabled={isDeleting && selectedRecord?.id === item.record.id}
                        >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                        </Button>
                    )}
                </div>
            )}
            emptyState={(
                <div className="py-8 text-center text-muted-foreground">
                    No fuel records found.
                    {canCreateRecord && (
                        <Link href="/fuel/create" className="ml-1 text-primary underline">
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
                placeholder: 'Search fuel records...',
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
            <Select value={selectedFuelType} onValueChange={handleFuelTypeChange}>
                <SelectTrigger className="w-full min-w-[150px] sm:w-auto">
                    <SelectValue placeholder="Fuel type" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All fuel types</SelectItem>
                    {fuelTypeOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                            {option.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
            <Select value={selectedTruck} onValueChange={handleTruckChange}>
                <SelectTrigger className="w-full min-w-[180px] sm:w-auto">
                    <SelectValue placeholder="Truck" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All trucks</SelectItem>
                    {truckOptions.map((truck) => (
                        <SelectItem key={truck.id} value={String(truck.id)}>
                            {truck.plate}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
            <Select value={selectedDriver} onValueChange={handleDriverChange}>
                <SelectTrigger className="w-full min-w-[180px] sm:w-auto">
                    <SelectValue placeholder="Driver" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All drivers</SelectItem>
                    {driverOptions.map((driver) => (
                        <SelectItem key={driver.id} value={String(driver.id)}>
                            {driver.name}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </ListingFilterBar>
    );

    return (
        <>
            <ListPageLayout
                headTitle="Fuel Records"
                title="Fuel Records"
                description={`Manage fuel transactions across your fleet. Total: ${totalRecords}`}
                breadcrumbs={breadcrumbs}
                actions={headerActions}
                stats={statsSection}
                tableTitle="Fuel Transactions"
                tableDescription="Track refuelling activities across your fleet"
                tableHeaderExtras={tableHeaderExtras}
                pagination={
                    !isLoading && fuelRecords?.links ? (
                        <ListingPaginationFooter
                            className="mt-4"
                            links={fuelRecords.links}
                            from={fuelRecords.from ?? undefined}
                            to={fuelRecords.to ?? undefined}
                            total={fuelRecords.total ?? undefined}
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

                <div className="space-y-3 md:hidden">{mobileContent}</div>
            </ListPageLayout>

            <DeleteConfirmationDialog
                open={deleteDialogOpen}
                onOpenChange={(open) => {
                    setDeleteDialogOpen(open);
                    if (!open) {
                        setSelectedRecord(null);
                        setIsDeleting(false);
                    }
                }}
                title="Delete Fuel Record"
                description="Are you sure you want to delete this fuel record? This action cannot be undone."
                itemName={
                    selectedRecord
                        ? `${selectedRecord.truck?.plate || selectedRecord.driver_truck?.truck?.plate || 'Fuel'} – ${formatDate(selectedRecord.fuel_date)}`
                        : undefined
                }
                onConfirm={handleDeleteConfirm}
                isLoading={isDeleting}
            />
        </>
    );
}

