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
import { Activity, CheckCircle, Edit, Eye, Plus, Search, Trash2, XCircle, ChevronRight } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Performances',
        href: '/performances',
    },
];

type ColumnKey =
    | 'foNumber'
    | 'dispatchDate'
    | 'loadPhase'
    | 'loadCompletion'
    | 'status'
    | 'distanceWithCargo'
    | 'fuelCost';

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
    { id: 'loadPhase', label: 'Load Phase', sortKey: 'load_phase', align: 'center' },
    { id: 'loadCompletion', label: 'Load Completion', sortKey: 'load_completion', align: 'center' },
    { id: 'status', label: 'Status', sortKey: 'satus', align: 'center' },
    { id: 'distanceWithCargo', label: 'Distance (KM)', sortKey: 'DistanceWCargo', align: 'right' },
    { id: 'fuelCost', label: 'Fuel Cost (Birr)', sortKey: 'fuelInBirr', align: 'right' },
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

const formatCurrency = (value?: number | null): string => {
    if (value === null || value === undefined || Number.isNaN(Number(value))) {
        return 'ETB 0.00';
    }

    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'ETB',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(value);
};

const formatDateValue = (value?: string | null): string => {
    if (!value) {
        return '—';
    }

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
        return '—';
    }

    return parsed.toLocaleDateString();
};

const formatCount = (value?: number | null): string => {
    if (typeof value !== 'number' || Number.isNaN(value)) {
        return '0';
    }

    return value.toLocaleString();
};

const getStatusBadge = (status?: string | null): React.ReactNode => {
    if (!status) {
        return <Badge variant="outline">Unknown</Badge>;
    }

    const normalized = status.toLowerCase();
    if (normalized === 'completed') {
        return <Badge className="bg-blue-500 text-white hover:bg-blue-600">Completed</Badge>;
    }
    if (normalized === 'active') {
        return <Badge className="bg-emerald-600 text-white hover:bg-emerald-700">Active</Badge>;
    }
    if (normalized === 'failed') {
        return <Badge className="bg-rose-500 text-white hover:bg-rose-600">Failed</Badge>;
    }

    return <Badge variant="outline">{status}</Badge>;
};

const getPhaseBadge = (value?: string | null): React.ReactNode => {
    if (!value) {
        return '—';
    }

    return (
        <Badge variant="secondary" className="capitalize">
            {value}
        </Badge>
    );
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
    const { isLoading } = useListingLoading({
        storageKey: SKELETON_FLAG_KEY,
        isDataReady,
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

    const handleSort = React.useCallback(
        (column: string) => {
            const newDirection: 'asc' | 'desc' = sortColumn === column && sortDirection === 'asc' ? 'desc' : 'asc';
            setSortColumn(column);
            setSortDirection(newDirection);
            handleNavigate({ sort: column, direction: newDirection });
        },
        [handleNavigate, sortColumn, sortDirection],
    );

    const handleDeleteClick = (performance: PerformanceData) => {
        setSelectedPerformance(performance);
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = () => {
        if (!selectedPerformance) {
            return;
        }

        setIsDeleting(true);

        router.delete(`/performances/${selectedPerformance.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                setDeleteDialogOpen(false);
                setSelectedPerformance(null);
                setIsDeleting(false);
                toast({
                    title: 'Performance deleted',
                    description: selectedPerformance.foNumber
                        ? `Performance ${selectedPerformance.foNumber} was removed successfully.`
                        : 'The performance record was removed successfully.',
                });
            },
            onError: (errors) => {
                setIsDeleting(false);

                const fallback = 'Failed to delete performance. Please try again.';
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

    const statsDefinitions = [
        {
            id: 'total-performances',
            label: 'Total Records',
            icon: <Activity className="h-3.5 w-3.5 text-slate-600" />,
            className: 'min-w-0',
            value: isLoading ? (
                <Skeleton className="h-3.5 w-20" aria-hidden="true" />
            ) : (
                formatCount(totalRecords)
            ),
            description: isLoading ? (
                <Skeleton className="h-3 w-32" aria-hidden="true" />
            ) : (
                `${formatCount(metrics?.active)} active`
            ),
            valueClassName: isLoading ? undefined : 'text-slate-700',
        },
        {
            id: 'completed-performances',
            label: 'Completed',
            icon: <CheckCircle className="h-3.5 w-3.5 text-emerald-600" />,
            className: 'min-w-0',
            value: isLoading ? (
                <Skeleton className="h-3.5 w-16" aria-hidden="true" />
            ) : (
                formatCount(metrics?.completed)
            ),
            description: isLoading ? (
                <Skeleton className="h-3 w-28" aria-hidden="true" />
            ) : (
                'Closed records'
            ),
            valueClassName: isLoading ? undefined : 'text-emerald-600',
        },
        {
            id: 'failed-performances',
            label: 'Flagged',
            icon: <XCircle className="h-3.5 w-3.5 text-rose-500" />,
            className: 'min-w-0',
            value: isLoading ? (
                <Skeleton className="h-3.5 w-16" aria-hidden="true" />
            ) : (
                formatCount(metrics?.failed)
            ),
            description: isLoading ? (
                <Skeleton className="h-3 w-24" aria-hidden="true" />
            ) : (
                'Requires attention'
            ),
            valueClassName: isLoading ? undefined : 'text-rose-500',
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
              <TableRow key={`performance-skeleton-${rowIndex}`} aria-hidden="true">
                  {tableColumns.map((column) => (
                      <TableCell
                          key={`${column.id}-${rowIndex}`}
                          className={
                              column.align === 'center'
                                  ? 'text-center'
                                  : column.align === 'right'
                                      ? 'text-right'
                                      : undefined
                          }
                      >
                          <Skeleton className="mx-auto h-4 w-24 max-w-full" />
                      </TableCell>
                  ))}
              </TableRow>
          ))
        : performanceData.length > 0
            ? performanceData.map((performance, index) => (
                  <TableRow key={performance.id} className="hover:bg-muted/50">
                      <TableCell className="text-center font-medium">{rowOffset + index + 1}</TableCell>
                      <TableCell className="font-medium">{performance.foNumber || '—'}</TableCell>
                      <TableCell className="text-muted-foreground">{formatDateValue(performance.dispatchDate)}</TableCell>
                      <TableCell className="text-center">{getPhaseBadge(performance.loadPhase)}</TableCell>
                      <TableCell className="text-center">{getPhaseBadge(performance.loadCompletion)}</TableCell>
                      <TableCell className="text-center">{getStatusBadge(performance.status)}</TableCell>
                      <TableCell className="text-right text-muted-foreground">
                          {performance.distanceWithCargo !== null && performance.distanceWithCargo !== undefined
                              ? `${formatNumberValue(performance.distanceWithCargo)} km`
                              : '—'}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                          {performance.fuelCost !== null && performance.fuelCost !== undefined
                              ? formatCurrency(performance.fuelCost)
                              : 'ETB 0.00'}
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
                                      disabled: isDeleting && selectedPerformance?.id === performance.id,
                                      onSelect: () => handleDeleteClick(performance),
                                  },
                              ]}
                          />
                      </TableCell>
                  </TableRow>
              ))
            : (
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
            );

    const mobileItems = React.useMemo(
        () =>
            performanceData.map((performance, index) => ({
                record: performance,
                position: rowOffset + index + 1,
            })),
        [performanceData, rowOffset],
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
                    <span className="text-base">{item.record.foNumber || 'Unknown'}</span>
                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
            )}
            renderSubtitle={(item) => formatDateValue(item.record.dispatchDate)}
            renderContent={(item) => (
                <div className="space-y-3 text-sm text-muted-foreground">
                    <div className="flex items-center justify-between">
                        <span className="font-medium text-slate-600 dark:text-slate-300">Status</span>
                        <span className="text-right text-slate-900 dark:text-slate-100">
                            {item.record.status || 'Unknown'}
                        </span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="font-medium text-slate-600 dark:text-slate-300">Load Phase</span>
                        <span className="text-right text-slate-900 dark:text-slate-100">
                            {item.record.loadPhase || '—'}
                        </span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="font-medium text-slate-600 dark:text-slate-300">Distance</span>
                        <span className="text-right text-slate-900 dark:text-slate-100">
                            {item.record.distanceWithCargo !== null && item.record.distanceWithCargo !== undefined
                                ? `${formatNumberValue(item.record.distanceWithCargo)} km`
                                : '—'}
                        </span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="font-medium text-slate-600 dark:text-slate-300">Fuel Cost</span>
                        <span className="text-right text-slate-900 dark:text-slate-100">
                            {item.record.fuelCost !== null && item.record.fuelCost !== undefined
                                ? formatCurrency(item.record.fuelCost)
                                : 'ETB 0.00'}
                        </span>
                    </div>
                </div>
            )}
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
                    !isLoading && performances?.links ? (
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

