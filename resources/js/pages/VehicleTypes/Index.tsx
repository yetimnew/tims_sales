import { Button } from '@/components/ui/button';
import { TableCell, TableRow } from '@/components/ui/table';
import ListPageLayout from '@/components/layouts/list-page-layout';
import { ListingStatsHeader } from '@/components/listing/stats-header';
import { ListingFilterBar } from '@/components/listing/filter-bar';
import { ListingTableShell } from '@/components/listing/data-table-shell';
import { ListingMobileItemList } from '@/components/listing/mobile-item-list';
import { ListingPaginationFooter } from '@/components/listing/pagination-footer';
import { ListingRowActionsMenu } from '@/components/listing/row-actions-menu';
import { DeleteConfirmationDialog } from '@/components/delete-confirmation-dialog';
import { usePermissions } from '@/hooks/use-permissions';
import { useListingLoading } from '@/hooks/use-listing-loading';
import { toast } from '@/hooks/use-toast';
import { Link, router } from '@inertiajs/react';
import { type BreadcrumbItem } from '@/types';
import {
    Plus,
    Eye,
    Edit,
    Search,
    Trash2,
    Truck,
    CheckCircle,
    Package,
    Settings,
    ChevronRight,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import * as React from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Vehicle Types',
        href: '/vehicletypes',
    },
];

interface VehicleType {
    id: number;
    name: string;
    description?: string;
    trucks_count: number;
    active_trucks_count: number;
    created_at: string;
}

interface VehicleTypesIndexProps {
    vehicleTypes: {
        data: VehicleType[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
        from: number | null;
        to: number | null;
        links: Array<{
            url: string | null;
            label: string;
            active: boolean;
        }>;
    };
    metrics: {
        total: number;
        with_trucks: number;
        without_trucks: number;
        total_trucks: number;
        active_trucks: number;
    };
    filters: {
        search?: string | null;
        sort?: string | null;
        direction?: 'asc' | 'desc' | null;
        per_page?: number | null;
    };
    perPageOptions: number[];
}

const SKELETON_FLAG_KEY = 'vehicle-types.index.shouldShowSkeleton';

const COLUMN_DEFINITIONS: Array<{ id: keyof VehicleType | 'description'; label: string; sortKey?: string }> = [
    { id: 'name', label: 'Vehicle Type', sortKey: 'name' },
    { id: 'description', label: 'Description' },
    { id: 'trucks_count', label: 'Total Trucks', sortKey: 'trucks_count' },
    { id: 'active_trucks_count', label: 'Active Trucks', sortKey: 'active_trucks_count' },
    { id: 'created_at', label: 'Created', sortKey: 'created_at' },
];

type NavigateOverrides = {
    search?: string;
    sort?: string;
    direction?: 'asc' | 'desc';
    page?: number;
    per_page?: number;
};

const formatNumber = (value: number | null | undefined): string => {
    if (typeof value !== 'number' || Number.isNaN(value)) {
        return '0';
    }

    return value.toLocaleString();
};

const formatDate = (value?: string | null): string => {
    if (!value) {
        return '—';
    }

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
        return '—';
    }

    return parsed.toLocaleDateString();
};

export default function VehicleTypesIndex({ vehicleTypes, metrics, filters, perPageOptions }: VehicleTypesIndexProps) {
    const { hasPermission } = usePermissions();
    const canEditVehicleType = hasPermission('vehicletypes.edit');
    const canDeleteVehicleType = hasPermission('vehicletypes.destroy');
    const canCreateVehicleType = hasPermission('vehicletypes.create');

    const [searchTerm, setSearchTerm] = React.useState(filters?.search ?? '');
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
    const [selectedVehicleType, setSelectedVehicleType] = React.useState<VehicleType | null>(null);
    const [isDeleting, setIsDeleting] = React.useState(false);
    const [deleteError, setDeleteError] = React.useState<string | null>(null);

    const isDataReady = Array.isArray(vehicleTypes?.data);
    const { isLoading: isTableLoading } = useListingLoading({
        storageKey: SKELETON_FLAG_KEY,
        isDataReady,
        minimumDuration: 200,
        onlySamePath: true,
        targetPath: '/vehicletypes',
        initialIsLoading: true,
    });

    React.useEffect(() => {
        setPerPage(String(resolvedPerPage));
    }, [resolvedPerPage]);

    const vehicleTypeData = React.useMemo(
        () => (Array.isArray(vehicleTypes?.data) ? vehicleTypes.data : []),
        [vehicleTypes],
    );
    const totalVehicleTypes = metrics?.total ?? vehicleTypes?.total ?? vehicleTypeData.length ?? 0;
    const currentPage = vehicleTypes?.current_page ?? 1;
    const perPageCountRaw = vehicleTypes?.per_page ?? Number(perPage);
    const perPageCount = Number.isFinite(perPageCountRaw) && perPageCountRaw > 0 ? Number(perPageCountRaw) : vehicleTypeData.length || 1;
    const rowOffset = (currentPage - 1) * perPageCount;

    const handleNavigate = React.useCallback(
        (overrides: NavigateOverrides = {}) => {
            const hasOverride = (key: keyof NavigateOverrides) => Object.prototype.hasOwnProperty.call(overrides, key);

            const nextSearch = hasOverride('search')
                ? overrides.search
                : searchTerm.trim()
                    ? searchTerm.trim()
                    : undefined;

            const nextSort = hasOverride('sort') ? overrides.sort ?? sortColumn : sortColumn;
            const nextDirection = hasOverride('direction') ? overrides.direction ?? sortDirection : sortDirection;
            const nextPerPage = hasOverride('per_page') ? overrides.per_page : Number(perPage);
            const nextPage = hasOverride('page') ? overrides.page : undefined;

            const params: Record<string, string | number | undefined> = {
                search: nextSearch && nextSearch !== '' ? nextSearch : undefined,
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

            router.get('/vehicletypes', params, { preserveState: true, replace: false });
        },
        [perPage, searchTerm, sortColumn, sortDirection],
    );

    const handleSearchChange = (value: string) => {
        setSearchTerm(value);
        handleNavigate({ search: value.trim() ? value.trim() : undefined, page: 1 });
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

    const handleDeleteClick = (vehicleType: VehicleType) => {
        setSelectedVehicleType(vehicleType);
        setDeleteDialogOpen(true);
        setDeleteError(null);
    };

    const handleDeleteConfirm = () => {
        if (!selectedVehicleType) {
            return;
        }

        setIsDeleting(true);

        router.delete(`/vehicletypes/${selectedVehicleType.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                setDeleteDialogOpen(false);
                setSelectedVehicleType(null);
                setIsDeleting(false);
                setDeleteError(null);
                toast({
                    title: 'Vehicle type removed',
                    description: 'The vehicle type was deleted successfully.',
                });
            },
            onError: (errors) => {
                setIsDeleting(false);

                const fallback = 'Failed to delete vehicle type. Please review the requirements and try again.';
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
            {canCreateVehicleType && (
                <Button asChild>
                    <Link href="/vehicletypes/create">
                        <Plus className="mr-2 h-4 w-4" />
                        Add Vehicle Type
                    </Link>
                </Button>
            )}
        </>
    );

    const totalVehicleTypesCount = metrics?.total ?? 0;
    const typesWithTrucks = metrics?.with_trucks ?? 0;
    const emptyTypes = metrics?.without_trucks ?? 0;
    const totalTrucks = metrics?.total_trucks ?? 0;
    const activeTrucks = metrics?.active_trucks ?? 0;

    const statsDefinitions = [
        {
            id: 'vehicle-types',
            label: 'Vehicle Types',
            icon: <Settings className="h-3.5 w-3.5 text-blue-600" />,
            className: 'min-w-[220px] flex-shrink-0',
            value: isTableLoading ? <Skeleton className="h-3.5 w-20" aria-hidden="true" /> : formatNumber(totalVehicleTypesCount),
            description: isTableLoading ? (
                <Skeleton className="h-3 w-28" aria-hidden="true" />
            ) : (
                `${formatNumber(typesWithTrucks)} types with trucks`
            ),
            valueClassName: isTableLoading ? undefined : 'text-blue-600',
        },
        {
            id: 'total-trucks',
            label: 'Total Trucks',
            icon: <Truck className="h-3.5 w-3.5 text-emerald-600" />,
            className: 'min-w-[220px] flex-shrink-0',
            value: isTableLoading ? <Skeleton className="h-3.5 w-20" aria-hidden="true" /> : formatNumber(totalTrucks),
            description: isTableLoading ? (
                <Skeleton className="h-3 w-24" aria-hidden="true" />
            ) : (
                'Across filtered types'
            ),
            valueClassName: isTableLoading ? undefined : 'text-emerald-600',
        },
        {
            id: 'active-trucks',
            label: 'Active Trucks',
            icon: <CheckCircle className="h-3.5 w-3.5 text-purple-600" />,
            className: 'min-w-[220px] flex-shrink-0',
            value: isTableLoading ? <Skeleton className="h-3.5 w-20" aria-hidden="true" /> : formatNumber(activeTrucks),
            description: isTableLoading ? (
                <Skeleton className="h-3 w-24" aria-hidden="true" />
            ) : (
                'Currently active'
            ),
            valueClassName: isTableLoading ? undefined : 'text-purple-600',
        },
        {
            id: 'empty-types',
            label: 'Empty Types',
            icon: <Package className="h-3.5 w-3.5 text-amber-600" />,
            className: 'min-w-[220px] flex-shrink-0',
            value: isTableLoading ? <Skeleton className="h-3.5 w-20" aria-hidden="true" /> : formatNumber(emptyTypes),
            description: isTableLoading ? (
                <Skeleton className="h-3 w-24" aria-hidden="true" />
            ) : (
                'No trucks assigned'
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
                id: column.id === 'description' ? 'description' : String(column.id),
                label: column.label,
                sortable: Boolean(column.sortKey),
                sortKey: column.sortKey ? String(column.sortKey) : undefined,
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
                      <Skeleton className="h-4 w-32" />
                  </TableCell>
                  <TableCell>
                      <Skeleton className="h-4 w-48" />
                  </TableCell>
                  <TableCell>
                      <Skeleton className="h-4 w-16" />
                  </TableCell>
                  <TableCell>
                      <Skeleton className="h-4 w-16" />
                  </TableCell>
                  <TableCell>
                      <Skeleton className="h-4 w-24" />
                  </TableCell>
                  <TableCell className="text-center">
                      <Skeleton className="h-8 w-8 mx-auto rounded" />
                  </TableCell>
              </TableRow>
          ))
        : vehicleTypeData.length > 0
            ? vehicleTypeData.map((vehicleType, index) => (
                  <TableRow key={vehicleType.id} className="hover:bg-muted/50">
                      <TableCell className="text-center font-medium">{rowOffset + index + 1}</TableCell>
                      <TableCell className="font-medium">{vehicleType.name}</TableCell>
                      <TableCell className="text-muted-foreground">{vehicleType.description || '—'}</TableCell>
                      <TableCell className="font-medium">{formatNumber(vehicleType.trucks_count)}</TableCell>
                      <TableCell className="text-muted-foreground">{formatNumber(vehicleType.active_trucks_count)}</TableCell>
                      <TableCell className="text-muted-foreground">{formatDate(vehicleType.created_at)}</TableCell>
                      <TableCell className="text-center">
                          <ListingRowActionsMenu
                              actions={[
                                  {
                                      label: 'View',
                                      icon: <Eye className="h-4 w-4" />,
                                      href: `/vehicletypes/${vehicleType.id}`,
                                  },
                                  canEditVehicleType && {
                                      label: 'Edit',
                                      icon: <Edit className="h-4 w-4" />,
                                      href: `/vehicletypes/${vehicleType.id}/edit`,
                                  },
                                  canDeleteVehicleType && {
                                      label: 'Delete',
                                      icon: <Trash2 className="h-4 w-4" />,
                                      danger: true,
                                      disabled: isDeleting && selectedVehicleType?.id === vehicleType.id,
                                      onSelect: () => handleDeleteClick(vehicleType),
                                  },
                              ]}
                          />
                      </TableCell>
                  </TableRow>
              ))
            : (
                <TableRow>
                    <TableCell colSpan={tableColumns.length} className="py-8 text-center text-muted-foreground">
                        No vehicle types found.
                        {canCreateVehicleType && (
                            <Link href="/vehicletypes/create" className="ml-1 text-primary underline">
                                Create one
                            </Link>
                        )}
                    </TableCell>
                </TableRow>
            );

    const mobileItems = React.useMemo(
        () =>
            vehicleTypeData.map((vehicleType, index) => ({
                vehicleType,
                position: rowOffset + index + 1,
            })),
        [rowOffset, vehicleTypeData],
    );

    const mobileContent = isTableLoading ? (
        <ListingMobileItemList
            items={Array.from({ length: 5 }).map((_, i) => ({ vehicleType: { id: i }, position: i + 1 }))}
            getKey={(item) => `skeleton-${item.position}`}
            renderTitle={() => (
                <div className="flex items-center gap-2">
                    <Skeleton className="h-3 w-8" />
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3.5 w-3.5 rounded" />
                </div>
            )}
            renderSubtitle={() => <Skeleton className="h-3 w-24" />}
            renderContent={() => (
                <div className="space-y-3">
                    <div>
                        <Skeleton className="h-3 w-24 mb-2" />
                        <Skeleton className="h-3 w-full" />
                    </div>
                    <div className="flex items-center justify-between">
                        <Skeleton className="h-3 w-24" />
                        <Skeleton className="h-3 w-16" />
                    </div>
                    <div className="flex items-center justify-between">
                        <Skeleton className="h-3 w-24" />
                        <Skeleton className="h-3 w-16" />
                    </div>
                    <div className="flex items-center justify-between">
                        <Skeleton className="h-3 w-20" />
                        <Skeleton className="h-3 w-24" />
                    </div>
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
            getKey={(item) => item.vehicleType.id}
            renderTitle={(item) => (
                <div className="flex items-center gap-2">
                    <span className="text-xs uppercase tracking-wide text-muted-foreground">#{item.position}</span>
                    <span className="text-base">{item.vehicleType.name}</span>
                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
            )}
            renderSubtitle={(item) => `${formatNumber(item.vehicleType.trucks_count)} trucks`}
            renderContent={(item) => (
                <div className="space-y-3 text-sm text-muted-foreground">
                    <div>
                        <p className="font-medium text-slate-600 dark:text-slate-300">Description</p>
                        <p className="text-sm text-muted-foreground">
                            {item.vehicleType.description || 'No description provided.'}
                        </p>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="font-medium text-slate-600 dark:text-slate-300">Active Trucks</span>
                        <span className="text-right font-semibold text-slate-900 dark:text-slate-100">
                            {formatNumber(item.vehicleType.active_trucks_count)}
                        </span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="font-medium text-slate-600 dark:text-slate-300">Total Trucks</span>
                        <span className="text-right font-semibold text-slate-900 dark:text-slate-100">
                            {formatNumber(item.vehicleType.trucks_count)}
                        </span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="font-medium text-slate-600 dark:text-slate-300">Created</span>
                        <span className="text-right font-semibold text-slate-900 dark:text-slate-100">
                            {formatDate(item.vehicleType.created_at)}
                        </span>
                    </div>
                </div>
            )}
            renderFooter={(item) => (
                <div className="flex w-full flex-wrap items-center justify-end gap-2">
                    <Button asChild size="sm" variant="outline" className="flex-1 sm:flex-auto">
                        <Link href={`/vehicletypes/${item.vehicleType.id}`}>
                            <Eye className="mr-2 h-4 w-4" />
                            View
                        </Link>
                    </Button>
                    {canEditVehicleType && (
                        <Button asChild size="sm" variant="secondary" className="flex-1 sm:flex-none">
                            <Link href={`/vehicletypes/${item.vehicleType.id}/edit`}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                            </Link>
                        </Button>
                    )}
                    {canDeleteVehicleType && (
                        <Button
                            size="sm"
                            variant="destructive"
                            className="flex-1 sm:flex-none"
                            onClick={() => handleDeleteClick(item.vehicleType)}
                            disabled={isDeleting && selectedVehicleType?.id === item.vehicleType.id}
                        >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                        </Button>
                    )}
                </div>
            )}
            emptyState={(
                <div className="py-8 text-center text-muted-foreground">
                    No vehicle types found.
                    {canCreateVehicleType && (
                        <Link href="/vehicletypes/create" className="ml-1 text-primary underline">
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
                placeholder: 'Search vehicle types...',
                onChange: handleSearchChange,
                icon: <Search className="h-4 w-4" />,
            }}
            perPage={{
                value: perPage,
                label: 'Rows',
                onChange: handlePerPageChange,
                options: perPageSelectOptions,
            }}
        />
    );

    return (
        <>
            <ListPageLayout
                headTitle="Vehicle Types"
                title="Vehicle Types"
                description={`Manage vehicle types and categories. Total: ${totalVehicleTypes}`}
                breadcrumbs={breadcrumbs}
                actions={headerActions}
                stats={statsSection}
                tableTitle="Vehicle Types"
                tableDescription="Manage your fleet of vehicle types"
                tableHeaderExtras={tableHeaderExtras}
                pagination={
                    !isTableLoading && vehicleTypes?.links ? (
                        <ListingPaginationFooter
                            className="mt-4"
                            links={vehicleTypes.links}
                            from={vehicleTypes.from ?? undefined}
                            to={vehicleTypes.to ?? undefined}
                            total={vehicleTypes.total ?? undefined}
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
                        setSelectedVehicleType(null);
                        setDeleteError(null);
                    }
                }}
                title="Delete Vehicle Type"
                description="Are you sure you want to delete this vehicle type? This action cannot be undone."
                itemName={selectedVehicleType?.name || undefined}
                onConfirm={handleDeleteConfirm}
                isLoading={isDeleting}
                errorMessage={deleteError}
            />
        </>
    );
}
