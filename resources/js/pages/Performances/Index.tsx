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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import * as React from 'react';
import { Activity, CheckCircle, Edit, Eye, Plus, Search, Trash2, XCircle, ChevronRight, BarChart3 } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Performances',
        href: '/performances',
    },
];

type ColumnKey =
    | 'foNumber'
    | 'dispatchDate'
    | 'truckDriver'
    | 'origin'
    | 'destination'
    | 'distance';

interface PerformanceData {
    id: number;
    foNumber: string;
    dispatchDate?: string | null;
    loadPhase?: string | null;
    loadCompletion?: string | null;
    status?: string | null;
    distanceWithCargo?: number | null;
    fuelCost?: number | null;
    distanceWithoutCargo?: number | null;
    tonnage?: number | null;
    fuelInLitter?: number | null;
    totalDistance?: number | null;
    truckPlate?: string | null;
    driverName?: string | null;
    originName?: string | null;
    destinationName?: string | null;
}

interface PerformancesIndexProps {
    performances: {
        data: PerformanceData[];
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
        active: number;
        completed: number;
        failed: number;
    };
    filters: {
        search?: string | null;
        status?: string | null;
        load_phase?: string | null;
        sort?: string | null;
        direction?: 'asc' | 'desc' | null;
        per_page?: number | null;
    };
    statusOptions: Array<{ label: string; value: string }>;
    loadPhaseOptions: Array<{ label: string; value: string }>;
    perPageOptions: number[];
    totalCount?: number;
}

const SKELETON_FLAG_KEY = 'performances.index.shouldShowSkeleton';

const COLUMN_DEFINITIONS: Array<{
    id: ColumnKey;
    label: string;
    sortKey?: string;
    align?: 'center' | 'right';
}> = [
    { id: 'foNumber', label: 'FO Number', sortKey: 'FOnumber' },
    { id: 'dispatchDate', label: 'Dispatch Date', sortKey: 'DateDispach' },
    { id: 'truckDriver', label: 'Truck / Driver' },
    { id: 'origin', label: 'Origin' },
    { id: 'destination', label: 'Destination' },
    { id: 'distance', label: 'Distance (KM)', sortKey: 'DistanceWCargo', align: 'right' },
];

const formatNumberValue = (value?: number | null, fractionDigits = 2): string => {
    if (value === null || value === undefined || Number.isNaN(Number(value))) {
        return '—';
    }

    return Number(value).toLocaleString('en-US', {
        minimumFractionDigits: fractionDigits,
        maximumFractionDigits: fractionDigits,
    });
};

const formatDateValue = (value?: string | null): string => {
    if (!value) {
        return '—';
    }

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
        return '—';
    }

    const formattedDate = parsed.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
    });

    const now = new Date();
    const parsedDay = new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const diffDays = Math.round((parsedDay.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    let relativeLabel: string;

    if (diffDays === 0) {
        relativeLabel = 'Today';
    } else if (diffDays === -1) {
        relativeLabel = 'Yesterday';
    } else if (diffDays === 1) {
        relativeLabel = 'Tomorrow';
    } else if (diffDays < 0) {
        relativeLabel = `${Math.abs(diffDays)} days ago`;
    } else {
        relativeLabel = `In ${diffDays} days`;
    }

    return `${formattedDate} (${relativeLabel})`;
};

const formatCount = (value?: number | null): string => {
    if (typeof value !== 'number' || Number.isNaN(value)) {
        return '0';
    }

    return value.toLocaleString();
};

const formatTruckDriver = (plate?: string | null, driver?: string | null): string => {
    if (plate && driver) {
        return `${plate} • ${driver}`;
    }

    return plate ?? driver ?? '—';
};

const resolveDistanceValue = (performance: PerformanceData): number | null => {
    if (typeof performance.totalDistance === 'number') {
        return performance.totalDistance;
    }

    if (typeof performance.distanceWithCargo === 'number') {
        return performance.distanceWithCargo;
    }

    return null;
};

export default function PerformancesIndex({
    performances,
    metrics,
    filters,
    statusOptions,
    loadPhaseOptions,
    perPageOptions,
    totalCount,
}: PerformancesIndexProps) {
    const { hasPermission } = usePermissions();
    const canViewPerformance = hasPermission('performances.show');
    const canCreatePerformance = hasPermission('performances.create');
    const canEditPerformance = hasPermission('performances.edit');
    const canDeletePerformance = hasPermission('performances.destroy');

    const [searchTerm, setSearchTerm] = React.useState(filters?.search ?? '');
    const [selectedStatus, setSelectedStatus] = React.useState(filters?.status ?? 'all');
    const [selectedLoadPhase, setSelectedLoadPhase] = React.useState(filters?.load_phase ?? 'all');
    const [sortColumn, setSortColumn] = React.useState<string>(filters?.sort ?? 'DateDispach');
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
    const [selectedPerformance, setSelectedPerformance] = React.useState<PerformanceData | null>(null);
    const [isDeleting, setIsDeleting] = React.useState(false);

    const isDataReady = Array.isArray(performances?.data);
    const { isLoading: isTableLoading } = useListingLoading({
        storageKey: SKELETON_FLAG_KEY,
        isDataReady,
        minimumDuration: 200,
        onlySamePath: true,
        initialIsLoading: false,
    });

    React.useEffect(() => {
        setPerPage(String(resolvedPerPage));
    }, [resolvedPerPage]);

    const performanceData = performances?.data ?? [];
    const totalRecords = totalCount ?? metrics?.total ?? performances?.total ?? performanceData.length ?? 0;
    const currentPage = performances?.current_page ?? 1;
    const perPageCountRaw = performances?.per_page ?? Number(perPage);
    const perPageCount =
        Number.isFinite(perPageCountRaw) && perPageCountRaw && perPageCountRaw > 0
            ? Number(perPageCountRaw)
            : performanceData.length || 1;
    const rowOffset = (currentPage - 1) * perPageCount;

    const handleNavigate = React.useCallback(
        (overrides: {
            search?: string;
            status?: string;
            load_phase?: string;
            sort?: string;
            direction?: 'asc' | 'desc';
            page?: number;
            per_page?: number;
        } = {}) => {
            const hasOverride = (key: keyof typeof overrides) => Object.prototype.hasOwnProperty.call(overrides, key);

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

            const nextLoadPhase = hasOverride('load_phase')
                ? overrides.load_phase
                : selectedLoadPhase !== 'all'
                    ? selectedLoadPhase
                    : undefined;

            const nextSort = hasOverride('sort') ? overrides.sort ?? sortColumn : sortColumn;
            const nextDirection = hasOverride('direction') ? overrides.direction ?? sortDirection : sortDirection;
            const nextPerPage = hasOverride('per_page') ? overrides.per_page : Number(perPage);
            const nextPage = hasOverride('page') ? overrides.page : undefined;

            const params: Record<string, string | number | undefined> = {
                search: nextSearch && nextSearch !== '' ? nextSearch : undefined,
                status: nextStatus && nextStatus !== 'all' ? nextStatus : undefined,
                load_phase: nextLoadPhase && nextLoadPhase !== 'all' ? nextLoadPhase : undefined,
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

            router.get('/performances', params, { preserveState: true, replace: false });
        },
        [perPage, searchTerm, selectedStatus, selectedLoadPhase, sortColumn, sortDirection],
    );

    const statsDefinitions = [
        {
            id: 'total-performances',
            label: 'Total Performances',
            icon: <BarChart3 className="h-3.5 w-3.5 text-blue-600" />,
            className: 'min-w-[220px] flex-shrink-0',
            value: isTableLoading ? (
                <Skeleton className="h-3.5 w-20" aria-hidden="true" />
            ) : (
                totalRecords.toLocaleString()
            ),
            description: isTableLoading ? (
                <Skeleton className="h-3 w-28" aria-hidden="true" />
            ) : (
                'All dispatches'
            ),
            valueClassName: isTableLoading ? undefined : 'text-blue-600',
        },
        {
            id: 'active-performances',
            label: 'Active',
            icon: <Activity className="h-3.5 w-3.5 text-emerald-600" />,
            className: 'min-w-[220px] flex-shrink-0',
            value: isTableLoading ? (
                <Skeleton className="h-3.5 w-16" aria-hidden="true" />
            ) : (
                (metrics?.active ?? 0).toLocaleString()
            ),
            description: isTableLoading ? (
                <Skeleton className="h-3 w-24" aria-hidden="true" />
            ) : (
                'In progress'
            ),
            valueClassName: isTableLoading ? undefined : 'text-emerald-600',
        },
        {
            id: 'completed-performances',
            label: 'Completed',
            icon: <CheckCircle className="h-3.5 w-3.5 text-blue-600" />,
            className: 'min-w-[220px] flex-shrink-0',
            value: isTableLoading ? (
                <Skeleton className="h-3.5 w-16" aria-hidden="true" />
            ) : (
                (metrics?.completed ?? 0).toLocaleString()
            ),
            description: isTableLoading ? (
                <Skeleton className="h-3 w-24" aria-hidden="true" />
            ) : (
                'Finished'
            ),
            valueClassName: isTableLoading ? undefined : 'text-blue-600',
        },
        {
            id: 'failed-performances',
            label: 'Failed',
            icon: <XCircle className="h-3.5 w-3.5 text-rose-600" />,
            className: 'min-w-[220px] flex-shrink-0',
            value: isTableLoading ? (
                <Skeleton className="h-3.5 w-16" aria-hidden="true" />
            ) : (
                (metrics?.failed ?? 0).toLocaleString()
            ),
            description: isTableLoading ? (
                <Skeleton className="h-3 w-24" aria-hidden="true" />
            ) : (
                'Unsuccessful'
            ),
            valueClassName: isTableLoading ? undefined : 'text-rose-600',
        },
    ];

    const handleSearchChange = (value: string) => {
        setSearchTerm(value);
        handleNavigate({ search: value.trim() ? value.trim() : undefined, page: 1 });
    };

    const handleStatusChange = (value: string) => {
        setSelectedStatus(value);
        handleNavigate({ status: value !== 'all' ? value : undefined, page: 1 });
    };

    const handleLoadPhaseChange = (value: string) => {
        setSelectedLoadPhase(value);
        handleNavigate({ load_phase: value !== 'all' ? value : undefined, page: 1 });
    };

    const handlePerPageChange = (value: string) => {
        setPerPage(value);
        const numericValue = Number(value);
        handleNavigate({ per_page: Number.isNaN(numericValue) ? undefined : numericValue, page: 1 });
    };

    const handleDeleteClick = (performance: PerformanceData) => {
        setSelectedPerformance(performance);
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = React.useCallback(async () => {
        if (!selectedPerformance || !canDeletePerformance) return;

        setIsDeleting(true);
        try {
            await router.delete(`/performances/${selectedPerformance.id}`, {
                onSuccess: () => {
                    setDeleteDialogOpen(false);
                    setSelectedPerformance(null);
                    handleNavigate({ page: 1 });
                },
            });
        } finally {
            setIsDeleting(false);
        }
    }, [selectedPerformance, canDeletePerformance, handleNavigate]);

    const handleSort = React.useCallback(
        (column: string) => {
            const newDirection: 'asc' | 'desc' = sortColumn === column && sortDirection === 'asc' ? 'desc' : 'asc';
            setSortColumn(column);
            setSortDirection(newDirection);
            handleNavigate({ sort: column, direction: newDirection });
        },
        [handleNavigate, sortColumn, sortDirection],
    );

    const tableColumns = React.useMemo(
        () => [
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

    const perPageSelectOptions = React.useMemo(
        () => availablePerPageOptions.map(option => ({ label: String(option), value: String(option) })),
        [availablePerPageOptions],
    );

    const statsSection = (
        <ListingStatsHeader stats={statsDefinitions} />
    );

    const tableRows = performanceData.length > 0
        ? performanceData.map((performance) => {
              const distanceValue = resolveDistanceValue(performance);

              return (
                  <TableRow key={performance.id} className="hover:bg-muted/50">
                      <TableCell className="font-medium">{performance.foNumber}</TableCell>
                      <TableCell className="text-muted-foreground">{formatDateValue(performance.dispatchDate)}</TableCell>
                      <TableCell>
                          <div className="flex flex-col gap-1">
                              <span className="font-medium text-foreground">
                                  {formatTruckDriver(performance.truckPlate, performance.driverName)}
                              </span>
                          </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{performance.originName ?? '—'}</TableCell>
                      <TableCell className="text-muted-foreground">{performance.destinationName ?? '—'}</TableCell>
                      <TableCell className="text-right">
                          {distanceValue !== null ? `${formatNumberValue(distanceValue, 0)} km` : '—'}
                      </TableCell>
                      <TableCell className="text-center">
                          <ListingRowActionsMenu
                              actions={[
                                  canViewPerformance && {
                                      label: 'View',
                                      icon: <Eye className="h-4 w-4" />,
                                      href: `/performances/${performance.id}`,
                                  },
                                  canEditPerformance && {
                                      label: 'Edit',
                                      icon: <Edit className="h-4 w-4" />,
                                      href: `/performances/${performance.id}/edit`,
                                  },
                                  canDeletePerformance && {
                                      label: 'Delete',
                                      icon: <Trash2 className="h-4 w-4" />,
                                      danger: true,
                                      onSelect: () => handleDeleteClick(performance),
                                  },
                              ].filter(Boolean)}
                          />
                      </TableCell>
                  </TableRow>
              );
          })
        : !isTableLoading
            ? (
                <TableRow>
                    <TableCell colSpan={tableColumns.length} className="py-8 text-center text-muted-foreground">
                        No performances found.
                        {canCreatePerformance && (
                            <Link href="/performances/create" className="ml-1 text-primary underline">
                                Create one
                            </Link>
                        )}
                    </TableCell>
                </TableRow>
            )
            : null;

    const mobileItems = React.useMemo(
        () =>
            performanceData.map((performance, index) => ({
                record: performance,
                position: rowOffset + index + 1,
            })),
        [performanceData, rowOffset],
    );

    const tableContent = (
        <div className="relative">
            <ListingTableShell
                columns={tableColumns}
                sort={{ column: sortColumn, direction: sortDirection, onToggle: handleSort }}
            >
                {tableRows}
            </ListingTableShell>

            {isTableLoading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-background/80 backdrop-blur-sm">
                    <img src="/images/loading-spinner.svg" alt="Loading performances" className="h-12 w-12" />
                    <span className="text-sm text-muted-foreground">Loading performances...</span>
                </div>
            )}
        </div>
    );

    const mobileContent = isTableLoading ? null : (
        <ListingMobileItemList
            items={mobileItems}
            getKey={(item) => item.record.id}
            renderTitle={(item) => (
                <div className="flex items-center gap-2">
                    <span className="text-xs uppercase tracking-wide text-muted-foreground">#{item.position}</span>
                    <span className="text-base">{item.record.foNumber || 'Unknown'}</span>
                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
            )}
            renderSubtitle={(item) => formatDateValue(item.record.dispatchDate)}
            renderContent={(item) => {
                const mobileDistance = resolveDistanceValue(item.record);

                return (
                    <div className="space-y-3 text-sm text-muted-foreground">
                    <div className="flex items-center justify-between">
                        <span className="font-medium text-slate-600 dark:text-slate-300">Driver</span>
                        <span className="text-right text-slate-900 dark:text-slate-100">
                            {item.record.driverName ?? '—'}
                        </span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="font-medium text-slate-600 dark:text-slate-300">Truck</span>
                        <span className="text-right text-slate-900 dark:text-slate-100">
                            {item.record.truckPlate ?? '—'}
                        </span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="font-medium text-slate-600 dark:text-slate-300">Origin</span>
                        <span className="text-right text-slate-900 dark:text-slate-100">
                            {item.record.originName ?? '—'}
                        </span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="font-medium text-slate-600 dark:text-slate-300">Destination</span>
                        <span className="text-right text-slate-900 dark:text-slate-100">
                            {item.record.destinationName ?? '—'}
                        </span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="font-medium text-slate-600 dark:text-slate-300">Distance</span>
                        <span className="text-right text-slate-900 dark:text-slate-100">
                            {mobileDistance !== null
                                ? `${formatNumberValue(mobileDistance, 0)} km`
                                : '—'}
                        </span>
                    </div>
                    </div>
                );
            }}
            renderFooter={(item) => (
                <div className="flex w-full flex-wrap items-center justify-end gap-2">
                    {canViewPerformance && (
                        <Button asChild size="sm" variant="outline" className="flex-1 sm:flex-auto">
                            <Link href={`/performances/${item.record.id}`}>
                                <Eye className="mr-2 h-4 w-4" />
                                View
                            </Link>
                        </Button>
                    )}
                    {canEditPerformance && (
                        <Button asChild size="sm" variant="secondary" className="flex-1 sm:flex-none">
                            <Link href={`/performances/${item.record.id}/edit`}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                            </Link>
                        </Button>
                    )}
                    {canDeletePerformance && (
                        <Button
                            size="sm"
                            variant="destructive"
                            className="flex-1 sm:flex-none"
                            onClick={() => handleDeleteClick(item.record)}
                            disabled={isDeleting && selectedPerformance?.id === item.record.id}
                        >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                        </Button>
                    )}
                </div>
            )}
            emptyState={(
                <div className="py-8 text-center text-muted-foreground">
                    No performances found.
                    {canCreatePerformance && (
                        <Link href="/performances/create" className="ml-1 text-primary underline">
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
                placeholder: 'Search performances...',
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
                <SelectTrigger className="w-full min-w-[160px] sm:w-auto">
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
            <Select value={selectedLoadPhase} onValueChange={handleLoadPhaseChange}>
                <SelectTrigger className="w-full min-w-[180px] sm:w-auto">
                    <SelectValue placeholder="Load phase" />
                </SelectTrigger>
                <SelectContent className="max-h-72">
                    <SelectItem value="all">All phases</SelectItem>
                    {loadPhaseOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                            {option.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </ListingFilterBar>
    );

    const headerActions = (
        <>
            {canCreatePerformance && (
                <Button asChild>
                    <Link href="/performances/create">
                        <Plus className="mr-2 h-4 w-4" />
                        Add Performance
                    </Link>
                </Button>
            )}
        </>
    );

    return (
        <>
            <ListPageLayout
                headTitle="Performances"
                title="Performances"
                description={`Manage your fleet performance (${formatCount(totalRecords)})`}
                breadcrumbs={breadcrumbs}
                actions={headerActions}
                stats={statsSection}
                tableTitle="Performance Records"
                tableDescription="Track every performance entry"
                tableHeaderExtras={tableHeaderExtras}
                pagination={
                    !isTableLoading && performances?.links ? (
                        <ListingPaginationFooter
                            className="mt-4"
                            links={performances.links}
                            from={performances.from ?? undefined}
                            to={performances.to ?? undefined}
                            total={performances.total ?? undefined}
                        />
                    ) : null
                }
            >
                <div className="hidden md:block">{tableContent}</div>

                <div className="relative space-y-3 md:hidden">
                    {mobileContent}

                    {isTableLoading && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-background/80 backdrop-blur-sm">
                            <img src="/images/loading-spinner.svg" alt="Loading performances" className="h-10 w-10" />
                            <span className="text-sm text-muted-foreground">Loading performances...</span>
                        </div>
                    )}
                </div>
            </ListPageLayout>

            <DeleteConfirmationDialog
                open={deleteDialogOpen}
                onOpenChange={(open) => {
                    setDeleteDialogOpen(open);
                    if (!open) {
                        setSelectedPerformance(null);
                        setIsDeleting(false);
                    }
                }}
                title="Delete Performance"
                description="Are you sure you want to delete this performance? This action cannot be undone."
                itemName={selectedPerformance ? selectedPerformance.foNumber : undefined}
                onConfirm={handleDeleteConfirm}
                isLoading={isDeleting}
            />
        </>
    );
}

