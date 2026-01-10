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
import { useTranslation } from 'react-i18next';
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

type ColumnDefinition = { id: keyof VehicleType | 'description'; label: string; sortKey?: string };

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

const formatDate = (value?: string | null, fallback = '—'): string => {
    if (!value) {
        return fallback;
    }

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
        return fallback;
    }

    return parsed.toLocaleDateString();
};

export default function VehicleTypesIndex({ vehicleTypes, metrics, filters, perPageOptions }: VehicleTypesIndexProps) {
    const { t } = useTranslation();
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

    const breadcrumbs = React.useMemo<BreadcrumbItem[]>(
        () => [
            {
                title: t('vehicleTypes.breadcrumb'),
                href: '/vehicletypes',
            },
        ],
        [t],
    );

    const columnDefinitions = React.useMemo<ColumnDefinition[]>(
        () => [
            { id: 'name', label: t('vehicleTypes.columns.name'), sortKey: 'name' },
            { id: 'description', label: t('vehicleTypes.columns.description') },
            { id: 'trucks_count', label: t('vehicleTypes.columns.totalTrucks'), sortKey: 'trucks_count' },
            { id: 'active_trucks_count', label: t('vehicleTypes.columns.activeTrucks'), sortKey: 'active_trucks_count' },
            { id: 'created_at', label: t('vehicleTypes.columns.created'), sortKey: 'created_at' },
        ],
        [t],
    );

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
    const notAvailableLabel = t('vehicleTypes.fallbacks.notAvailable');

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
                    title: t('vehicleTypes.delete.successTitle'),
                    description: t('vehicleTypes.delete.successDescription', { name: selectedVehicleType?.name ?? '' }),
                });
            },
            onError: (errors) => {
                setIsDeleting(false);

                const fallback = t('vehicleTypes.delete.failedDescription');
                if (errors && typeof errors === 'object') {
                    const messages = Object.values(errors)
                        .flatMap((value) => (Array.isArray(value) ? value : [value]))
                        .filter((value) => Boolean(value))
                        .join('\n');

                    setDeleteError(messages || fallback);

                    toast({
                        title: t('vehicleTypes.delete.failedTitle'),
                        description: messages || fallback,
                        variant: 'destructive',
                    });
                } else {
                    setDeleteError(fallback);

                    toast({
                        title: t('vehicleTypes.delete.failedTitle'),
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
                        {t('vehicleTypes.actions.add')}
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
            label: t('vehicleTypes.stats.total.label'),
            icon: <Settings className="h-3.5 w-3.5 text-blue-600" />,
            className: 'min-w-[220px] flex-shrink-0',
            value: isTableLoading ? <Skeleton className="h-3.5 w-20" aria-hidden="true" /> : formatNumber(totalVehicleTypesCount),
            description: isTableLoading ? (
                <Skeleton className="h-3 w-28" aria-hidden="true" />
            ) : (
                t('vehicleTypes.stats.total.description', { count: typesWithTrucks })
            ),
            valueClassName: isTableLoading ? undefined : 'text-blue-600',
        },
        {
            id: 'total-trucks',
            label: t('vehicleTypes.stats.totalTrucks.label'),
            icon: <Truck className="h-3.5 w-3.5 text-emerald-600" />,
            className: 'min-w-[220px] flex-shrink-0',
            value: isTableLoading ? <Skeleton className="h-3.5 w-20" aria-hidden="true" /> : formatNumber(totalTrucks),
            description: isTableLoading ? (
                <Skeleton className="h-3 w-24" aria-hidden="true" />
            ) : (
                t('vehicleTypes.stats.totalTrucks.description')
            ),
            valueClassName: isTableLoading ? undefined : 'text-emerald-600',
        },
        {
            id: 'active-trucks',
            label: t('vehicleTypes.stats.activeTrucks.label'),
            icon: <CheckCircle className="h-3.5 w-3.5 text-purple-600" />,
            className: 'min-w-[220px] flex-shrink-0',
            value: isTableLoading ? <Skeleton className="h-3.5 w-20" aria-hidden="true" /> : formatNumber(activeTrucks),
            description: isTableLoading ? (
                <Skeleton className="h-3 w-24" aria-hidden="true" />
            ) : (
                t('vehicleTypes.stats.activeTrucks.description')
            ),
            valueClassName: isTableLoading ? undefined : 'text-purple-600',
        },
        {
            id: 'empty-types',
            label: t('vehicleTypes.stats.empty.label'),
            icon: <Package className="h-3.5 w-3.5 text-amber-600" />,
            className: 'min-w-[220px] flex-shrink-0',
            value: isTableLoading ? <Skeleton className="h-3.5 w-20" aria-hidden="true" /> : formatNumber(emptyTypes),
            description: isTableLoading ? (
                <Skeleton className="h-3 w-24" aria-hidden="true" />
            ) : (
                t('vehicleTypes.stats.empty.description')
            ),
            valueClassName: isTableLoading ? undefined : 'text-amber-600',
        },
    ];

    const statsSection = <ListingStatsHeader stats={statsDefinitions} orientation="row" />;

    const perPageSelectOptions = React.useMemo(
        () =>
            availablePerPageOptions.map((option) => ({
                value: String(option),
                label: t('vehicleTypes.filters.perPageOption', { value: option }),
            })),
        [availablePerPageOptions, t],
    );

    const tableColumns = React.useMemo(
        () => [
            { id: 'index', label: t('vehicleTypes.table.index'), align: 'center' as const },
            ...columnDefinitions.map((column) => ({
                id: column.id === 'description' ? 'description' : String(column.id),
                label: column.label,
                sortable: Boolean(column.sortKey),
                sortKey: column.sortKey ? String(column.sortKey) : undefined,
            })),
            { id: 'actions', label: t('vehicleTypes.table.actions'), align: 'center' as const },
        ],
        [columnDefinitions, t],
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
                      <TableCell className="text-muted-foreground">{vehicleType.description || notAvailableLabel}</TableCell>
                      <TableCell className="font-medium">{formatNumber(vehicleType.trucks_count)}</TableCell>
                      <TableCell className="text-muted-foreground">{formatNumber(vehicleType.active_trucks_count)}</TableCell>
                      <TableCell className="text-muted-foreground">{formatDate(vehicleType.created_at, notAvailableLabel)}</TableCell>
                      <TableCell className="text-center">
                          <ListingRowActionsMenu
                              actions={[
                                  {
                                      label: t('vehicleTypes.actions.view'),
                                      icon: <Eye className="h-4 w-4" />,
                                      href: `/vehicletypes/${vehicleType.id}`,
                                  },
                                  canEditVehicleType && {
                                      label: t('vehicleTypes.actions.edit'),
                                      icon: <Edit className="h-4 w-4" />,
                                      href: `/vehicletypes/${vehicleType.id}/edit`,
                                  },
                                  canDeleteVehicleType && {
                                      label: t('vehicleTypes.actions.delete'),
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
                        {t('vehicleTypes.empty.title')}
                        {canCreateVehicleType && (
                            <Link href="/vehicletypes/create" className="ml-1 text-primary underline">
                                {t('vehicleTypes.empty.createAction')}
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
                    <span className="text-xs uppercase tracking-wide text-muted-foreground">
                        {t('vehicleTypes.mobile.position', { value: item.position })}
                    </span>
                    <span className="text-base">{item.vehicleType.name}</span>
                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
            )}
            renderSubtitle={(item) => t('vehicleTypes.mobile.trucksCount', { value: formatNumber(item.vehicleType.trucks_count) })}
            renderContent={(item) => (
                <div className="space-y-3 text-sm text-muted-foreground">
                    <div>
                        <p className="font-medium text-slate-600 dark:text-slate-300">
                            {t('vehicleTypes.mobile.description')}
                        </p>
                        <p className="text-sm text-muted-foreground">
                            {item.vehicleType.description || t('vehicleTypes.mobile.noDescription')}
                        </p>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="font-medium text-slate-600 dark:text-slate-300">
                            {t('vehicleTypes.mobile.activeTrucks')}
                        </span>
                        <span className="text-right font-semibold text-slate-900 dark:text-slate-100">
                            {formatNumber(item.vehicleType.active_trucks_count)}
                        </span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="font-medium text-slate-600 dark:text-slate-300">
                            {t('vehicleTypes.mobile.totalTrucks')}
                        </span>
                        <span className="text-right font-semibold text-slate-900 dark:text-slate-100">
                            {formatNumber(item.vehicleType.trucks_count)}
                        </span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="font-medium text-slate-600 dark:text-slate-300">
                            {t('vehicleTypes.mobile.created')}
                        </span>
                        <span className="text-right font-semibold text-slate-900 dark:text-slate-100">
                            {formatDate(item.vehicleType.created_at, notAvailableLabel)}
                        </span>
                    </div>
                </div>
            )}
            renderFooter={(item) => (
                <div className="flex w-full flex-wrap items-center justify-end gap-2">
                    <Button asChild size="sm" variant="outline" className="flex-1 sm:flex-auto">
                        <Link href={`/vehicletypes/${item.vehicleType.id}`}>
                            <Eye className="mr-2 h-4 w-4" />
                            {t('vehicleTypes.actions.view')}
                        </Link>
                    </Button>
                    {canEditVehicleType && (
                        <Button asChild size="sm" variant="secondary" className="flex-1 sm:flex-none">
                            <Link href={`/vehicletypes/${item.vehicleType.id}/edit`}>
                                <Edit className="mr-2 h-4 w-4" />
                                {t('vehicleTypes.actions.edit')}
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
                            {t('vehicleTypes.actions.delete')}
                        </Button>
                    )}
                </div>
            )}
            emptyState={(
                <div className="py-8 text-center text-muted-foreground">
                    {t('vehicleTypes.empty.title')}
                    {canCreateVehicleType && (
                        <Link href="/vehicletypes/create" className="ml-1 text-primary underline">
                            {t('vehicleTypes.empty.createAction')}
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
                placeholder: t('vehicleTypes.filters.searchPlaceholder'),
                onChange: handleSearchChange,
                icon: <Search className="h-4 w-4" />,
            }}
            perPage={{
                value: perPage,
                label: t('vehicleTypes.filters.rowsLabel'),
                onChange: handlePerPageChange,
                options: perPageSelectOptions,
            }}
        />
    );

    return (
        <>
            <ListPageLayout
                headTitle={t('vehicleTypes.title')}
                title={t('vehicleTypes.title')}
                description={t('vehicleTypes.description', { count: totalVehicleTypes })}
                breadcrumbs={breadcrumbs}
                actions={headerActions}
                stats={statsSection}
                tableTitle={t('vehicleTypes.table.title')}
                tableDescription={t('vehicleTypes.table.description')}
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
                title={t('vehicleTypes.delete.title')}
                description={t('vehicleTypes.delete.description')}
                itemName={selectedVehicleType?.name || undefined}
                onConfirm={handleDeleteConfirm}
                isLoading={isDeleting}
                errorMessage={deleteError}
            />
        </>
    );
}
