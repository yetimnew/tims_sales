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
import { useTranslation } from 'react-i18next';
import { Activity, CheckCircle, Edit, Eye, Plus, Search, Trash2, XCircle, ChevronRight, BarChart3 } from 'lucide-react';

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
        truck?: number | string | null;
    };
    statusOptions: Array<{ label: string; value: string }>;
    loadPhaseOptions: Array<{ label: string; value: string }>;
    perPageOptions: number[];
    totalCount?: number;
}

const SKELETON_FLAG_KEY = 'performances.index.shouldShowSkeleton';


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
    const { t, i18n } = useTranslation();
    const breadcrumbs = React.useMemo<BreadcrumbItem[]>(
        () => [
            {
                title: t('performances.breadcrumb'),
                href: '/performances',
            },
        ],
        [t],
    );
    const { hasPermission } = usePermissions();
    const canViewPerformance = hasPermission('performances.show');
    const canCreatePerformance = hasPermission('performances.create');
    const canEditPerformance = hasPermission('performances.edit');
    const canDeletePerformance = hasPermission('performances.destroy');
    const notAvailableLabel = t('performances.fallbacks.notAvailable');

    const columnDefinitions = React.useMemo(
        () => [
            { id: 'foNumber', label: t('performances.columns.foNumber'), sortKey: 'FOnumber' },
            { id: 'dispatchDate', label: t('performances.columns.dispatchDate'), sortKey: 'DateDispach' },
            { id: 'truckDriver', label: t('performances.columns.truckDriver') },
            { id: 'origin', label: t('performances.columns.origin') },
            { id: 'destination', label: t('performances.columns.destination') },
            { id: 'distance', label: t('performances.columns.distance'), sortKey: 'DistanceWCargo', align: 'right' as const },
        ],
        [t],
    );

    const formatNumberValue = React.useCallback(
        (value?: number | null, fractionDigits = 2): string => {
            if (value === null || value === undefined || Number.isNaN(Number(value))) {
                return notAvailableLabel;
            }

            return Number(value).toLocaleString(i18n.language, {
                minimumFractionDigits: fractionDigits,
                maximumFractionDigits: fractionDigits,
            });
        },
        [i18n.language, notAvailableLabel],
    );

    const formatDateValue = React.useCallback(
        (value?: string | null): string => {
            if (!value) {
                return notAvailableLabel;
            }

            const parsed = new Date(value);
            if (Number.isNaN(parsed.getTime())) {
                return notAvailableLabel;
            }

            const formattedDate = parsed.toLocaleDateString(i18n.language, {
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
                relativeLabel = t('performances.dateLabels.today');
            } else if (diffDays === -1) {
                relativeLabel = t('performances.dateLabels.yesterday');
            } else if (diffDays === 1) {
                relativeLabel = t('performances.dateLabels.tomorrow');
            } else if (diffDays < 0) {
                relativeLabel = t('performances.dateLabels.daysAgo', { count: Math.abs(diffDays) });
            } else {
                relativeLabel = t('performances.dateLabels.inDays', { count: diffDays });
            }

            return t('performances.dateLabels.withRelative', { date: formattedDate, label: relativeLabel });
        },
        [i18n.language, notAvailableLabel, t],
    );

    const formatCount = React.useCallback(
        (value?: number | null): string => {
            if (typeof value !== 'number' || Number.isNaN(value)) {
                return '0';
            }

            return value.toLocaleString(i18n.language);
        },
        [i18n.language],
    );

    const formatTruckDriver = React.useCallback(
        (plate?: string | null, driver?: string | null): string => {
            if (plate && driver) {
                return t('performances.fallbacks.truckDriver', { plate, driver });
            }

            return plate ?? driver ?? notAvailableLabel;
        },
        [notAvailableLabel, t],
    );

    const [searchTerm, setSearchTerm] = React.useState(filters?.search ?? '');
    const [selectedStatus, setSelectedStatus] = React.useState(filters?.status ?? 'all');
    const [selectedLoadPhase, setSelectedLoadPhase] = React.useState(filters?.load_phase ?? 'all');
    const [sortColumn, setSortColumn] = React.useState<string>(filters?.sort ?? 'DateDispach');
    const [sortDirection, setSortDirection] = React.useState<'asc' | 'desc'>(filters?.direction ?? 'desc');
    const truckFilter = filters?.truck ?? undefined;
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
    const currentPage = performances?.current_page ?? 1;
    const perPageCountRaw = performances?.per_page ?? Number(perPage);
    const perPageCount =
        Number.isFinite(perPageCountRaw) && perPageCountRaw && perPageCountRaw > 0
            ? Number(perPageCountRaw)
            : performanceData.length || 1;
    const rowOffset = (currentPage - 1) * perPageCount;
    const metricsWindowLabel = t('performances.stats.windowLabel');
    const metricsCounts = React.useMemo(
        () => ({
            total: metrics?.total ?? 0,
            active: metrics?.active ?? 0,
            completed: metrics?.completed ?? 0,
            failed: metrics?.failed ?? 0,
        }),
        [metrics],
    );

    const handleNavigate = React.useCallback(
        (overrides: {
            search?: string;
            status?: string;
            load_phase?: string;
            sort?: string;
            direction?: 'asc' | 'desc';
            page?: number;
            per_page?: number;
            truck?: number | string | null;
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
            const nextTruck = hasOverride('truck') ? overrides.truck ?? undefined : truckFilter;
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
                truck: typeof nextTruck === 'number' || (typeof nextTruck === 'string' && nextTruck !== '') ? nextTruck : undefined,
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
        [perPage, searchTerm, selectedStatus, selectedLoadPhase, sortColumn, sortDirection, truckFilter],
    );

    const statsDefinitions = [
        {
            id: 'total-performances',
            label: t('performances.stats.total.label'),
            icon: <BarChart3 className="h-3.5 w-3.5 text-blue-600" />,
            className: 'min-w-[220px] flex-shrink-0',
            value: isTableLoading ? (
                <Skeleton className="h-3.5 w-20" aria-hidden="true" />
            ) : (
                formatCount(metricsCounts.total)
            ),
            description: isTableLoading ? (
                <Skeleton className="h-3 w-28" aria-hidden="true" />
            ) : (
                metricsWindowLabel
            ),
            valueClassName: isTableLoading ? undefined : 'text-blue-600',
        },
        {
            id: 'active-performances',
            label: t('performances.stats.active.label'),
            icon: <Activity className="h-3.5 w-3.5 text-emerald-600" />,
            className: 'min-w-[220px] flex-shrink-0',
            value: isTableLoading ? (
                <Skeleton className="h-3.5 w-16" aria-hidden="true" />
            ) : (
                formatCount(metricsCounts.active)
            ),
            description: isTableLoading ? (
                <Skeleton className="h-3 w-24" aria-hidden="true" />
            ) : (
                t('performances.stats.active.description')
            ),
            valueClassName: isTableLoading ? undefined : 'text-emerald-600',
        },
        {
            id: 'completed-performances',
            label: t('performances.stats.completed.label'),
            icon: <CheckCircle className="h-3.5 w-3.5 text-blue-600" />,
            className: 'min-w-[220px] flex-shrink-0',
            value: isTableLoading ? (
                <Skeleton className="h-3.5 w-16" aria-hidden="true" />
            ) : (
                formatCount(metricsCounts.completed)
            ),
            description: isTableLoading ? (
                <Skeleton className="h-3 w-24" aria-hidden="true" />
            ) : (
                t('performances.stats.completed.description')
            ),
            valueClassName: isTableLoading ? undefined : 'text-blue-600',
        },
        {
            id: 'failed-performances',
            label: t('performances.stats.failed.label'),
            icon: <XCircle className="h-3.5 w-3.5 text-rose-600" />,
            className: 'min-w-[220px] flex-shrink-0',
            value: isTableLoading ? (
                <Skeleton className="h-3.5 w-16" aria-hidden="true" />
            ) : (
                formatCount(metricsCounts.failed)
            ),
            description: isTableLoading ? (
                <Skeleton className="h-3 w-24" aria-hidden="true" />
            ) : (
                t('performances.stats.failed.description')
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
        router.delete(`/performances/${selectedPerformance.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                setDeleteDialogOpen(false);
                setSelectedPerformance(null);
                setIsDeleting(false);
                toast({
                    title: t('performances.delete.successTitle'),
                    description: t('performances.delete.successDescription', { foNumber: selectedPerformance.foNumber }),
                });
            },
            onError: (errors) => {
                setIsDeleting(false);
                const fallback = t('performances.delete.failedDescription');
                const errorMessages = errors && typeof errors === 'object'
                    ? Object.values(errors)
                          .flatMap((value) => (Array.isArray(value) ? value : [value]))
                          .filter(Boolean)
                          .join(', ')
                    : fallback;

                toast({
                    title: t('performances.delete.failedTitle'),
                    description: errorMessages || fallback,
                    variant: 'destructive',
                });
            },
        });
    }, [selectedPerformance, canDeletePerformance, handleNavigate, t]);

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
            { id: 'index', label: t('performances.table.index'), align: 'center' as const },
            ...columnDefinitions.map((column) => ({
                id: column.id,
                label: column.label,
                sortable: Boolean(column.sortKey),
                sortKey: column.sortKey,
                align: column.align,
            })),
            { id: 'actions', label: t('performances.table.actions'), align: 'center' as const },
        ],
        [columnDefinitions, t],
    );

    const perPageSelectOptions = React.useMemo(
        () => availablePerPageOptions.map(option => ({ label: t('performances.filters.perPageOption', { value: option }), value: String(option) })),
        [availablePerPageOptions, t],
    );

    const statsSection = (
        <ListingStatsHeader stats={statsDefinitions} orientation="row" />
    );

    const tableRows = isTableLoading
        ? Array.from({ length: 8 }).map((_, index) => (
              <TableRow key={`skeleton-${index}`} aria-hidden="true">
                  <TableCell className="text-center">
                      <Skeleton className="h-4 w-6 mx-auto" />
                  </TableCell>
                  <TableCell>
                      <Skeleton className="h-4 w-24" />
                  </TableCell>
                  <TableCell>
                      <Skeleton className="h-4 w-32" />
                  </TableCell>
                  <TableCell>
                      <Skeleton className="h-4 w-36" />
                  </TableCell>
                  <TableCell>
                      <Skeleton className="h-4 w-28" />
                  </TableCell>
                  <TableCell>
                      <Skeleton className="h-4 w-28" />
                  </TableCell>
                  <TableCell className="text-right">
                      <Skeleton className="h-4 w-20 ml-auto" />
                  </TableCell>
                  <TableCell className="text-center">
                      <Skeleton className="h-8 w-8 mx-auto rounded" />
                  </TableCell>
              </TableRow>
          ))
        : performanceData.length > 0
            ? performanceData.map((performance, index) => {
                  const distanceValue = resolveDistanceValue(performance);

                  return (
                      <TableRow key={performance.id} className="hover:bg-muted/50">
                          <TableCell className="text-center font-medium">{rowOffset + index + 1}</TableCell>
                          <TableCell className="font-medium">
                              <Link
                                  href={`/performances/${performance.id}`}
                                  className="text-foreground underline-offset-4 hover:underline"
                              >
                                  {performance.foNumber}
                              </Link>
                          </TableCell>
                          <TableCell className="text-muted-foreground">{formatDateValue(performance.dispatchDate)}</TableCell>
                          <TableCell>
                              <div className="flex flex-col gap-1">
                                  <span className="font-medium text-foreground">
                                      {formatTruckDriver(performance.truckPlate, performance.driverName)}
                                  </span>
                              </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground">{performance.originName ?? notAvailableLabel}</TableCell>
                          <TableCell className="text-muted-foreground">{performance.destinationName ?? notAvailableLabel}</TableCell>
                          <TableCell className="text-right">
                              {distanceValue !== null
                                  ? t('performances.fallbacks.distanceValue', { value: formatNumberValue(distanceValue, 0) })
                                  : notAvailableLabel}
                          </TableCell>
                          <TableCell className="text-center">
                              <ListingRowActionsMenu
                                  actions={[
                                      canViewPerformance && {
                                          label: t('performances.actions.view'),
                                          icon: <Eye className="h-4 w-4" />,
                                          href: `/performances/${performance.id}`,
                                      },
                                      canEditPerformance && {
                                          label: t('performances.actions.edit'),
                                          icon: <Edit className="h-4 w-4" />,
                                          href: `/performances/${performance.id}/edit`,
                                      },
                                      canDeletePerformance && {
                                          label: t('performances.actions.delete'),
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
            : (
                <TableRow>
                    <TableCell colSpan={tableColumns.length} className="py-8 text-center text-muted-foreground">
                        {t('performances.empty.title')}
                        {canCreatePerformance && (
                            <Link href="/performances/create" className="ml-1 text-primary underline">
                                {t('performances.empty.createAction')}
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

    const tableContent = (
        <ListingTableShell
            columns={tableColumns}
            sort={{ column: sortColumn, direction: sortDirection, onToggle: handleSort }}
        >
            {tableRows}
        </ListingTableShell>
    );

    const mobileContent = isTableLoading ? (
        <ListingMobileItemList
            items={Array.from({ length: 5 }).map((_, i) => ({ record: { id: i }, position: i + 1 }))}
            getKey={(item) => `skeleton-${item.position}`}
            renderTitle={() => (
                <div className="flex items-center gap-2">
                    <Skeleton className="h-3 w-8" />
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3.5 w-3.5 rounded" />
                </div>
            )}
            renderSubtitle={() => <Skeleton className="h-3 w-40" />}
            renderContent={() => (
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <Skeleton className="h-3 w-16" />
                        <Skeleton className="h-3 w-24" />
                    </div>
                    <div className="flex items-center justify-between">
                        <Skeleton className="h-3 w-16" />
                        <Skeleton className="h-3 w-20" />
                    </div>
                    <div className="flex items-center justify-between">
                        <Skeleton className="h-3 w-20" />
                        <Skeleton className="h-3 w-28" />
                    </div>
                    <div className="flex items-center justify-between">
                        <Skeleton className="h-3 w-24" />
                        <Skeleton className="h-3 w-28" />
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
            getKey={(item) => item.record.id}
            renderTitle={(item) => (
                <div className="flex items-center gap-2">
                    <span className="text-xs uppercase tracking-wide text-muted-foreground">
                        {t('performances.mobile.position', { value: item.position })}
                    </span>
                    <span className="text-base">{item.record.foNumber || t('performances.fallbacks.unknown')}</span>
                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
            )}
            renderSubtitle={(item) => formatDateValue(item.record.dispatchDate)}
            renderContent={(item) => {
                const mobileDistance = resolveDistanceValue(item.record);

                return (
                    <div className="space-y-3 text-sm text-muted-foreground">
                    <div className="flex items-center justify-between">
                        <span className="font-medium text-slate-600 dark:text-slate-300">{t('performances.mobile.driver')}</span>
                        <span className="text-right text-slate-900 dark:text-slate-100">
                            {item.record.driverName ?? notAvailableLabel}
                        </span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="font-medium text-slate-600 dark:text-slate-300">{t('performances.mobile.truck')}</span>
                        <span className="text-right text-slate-900 dark:text-slate-100">
                            {item.record.truckPlate ?? notAvailableLabel}
                        </span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="font-medium text-slate-600 dark:text-slate-300">{t('performances.mobile.origin')}</span>
                        <span className="text-right text-slate-900 dark:text-slate-100">
                            {item.record.originName ?? notAvailableLabel}
                        </span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="font-medium text-slate-600 dark:text-slate-300">{t('performances.mobile.destination')}</span>
                        <span className="text-right text-slate-900 dark:text-slate-100">
                            {item.record.destinationName ?? notAvailableLabel}
                        </span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="font-medium text-slate-600 dark:text-slate-300">{t('performances.mobile.distance')}</span>
                        <span className="text-right text-slate-900 dark:text-slate-100">
                            {mobileDistance !== null
                                ? t('performances.fallbacks.distanceValue', { value: formatNumberValue(mobileDistance, 0) })
                                : notAvailableLabel}
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
                                {t('performances.actions.view')}
                            </Link>
                        </Button>
                    )}
                    {canEditPerformance && (
                        <Button asChild size="sm" variant="secondary" className="flex-1 sm:flex-none">
                            <Link href={`/performances/${item.record.id}/edit`}>
                                <Edit className="mr-2 h-4 w-4" />
                                {t('performances.actions.edit')}
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
                            {t('performances.actions.delete')}
                        </Button>
                    )}
                </div>
            )}
            emptyState={(
                <div className="py-8 text-center text-muted-foreground">
                    {t('performances.empty.title')}
                    {canCreatePerformance && (
                        <Link href="/performances/create" className="ml-1 text-primary underline">
                            {t('performances.empty.createAction')}
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
                placeholder: t('performances.filters.searchPlaceholder'),
                onChange: handleSearchChange,
                icon: <Search className="h-4 w-4" />,
            }}
            perPage={{
                value: perPage,
                label: t('performances.filters.rowsLabel'),
                onChange: handlePerPageChange,
                options: perPageSelectOptions,
            }}
        >
            <Select value={selectedStatus} onValueChange={handleStatusChange}>
                <SelectTrigger className="w-full min-w-[160px] sm:w-auto">
                    <SelectValue placeholder={t('performances.filters.statusPlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">{t('performances.filters.allStatuses')}</SelectItem>
                    {statusOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                            {option.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
            <Select value={selectedLoadPhase} onValueChange={handleLoadPhaseChange}>
                <SelectTrigger className="w-full min-w-[180px] sm:w-auto">
                    <SelectValue placeholder={t('performances.filters.loadPhasePlaceholder')} />
                </SelectTrigger>
                <SelectContent className="max-h-72">
                    <SelectItem value="all">{t('performances.filters.allLoadPhases')}</SelectItem>
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
                        {t('performances.actions.add')}
                    </Link>
                </Button>
            )}
        </>
    );

    return (
        <>
            <ListPageLayout
                headTitle={t('performances.title')}
                title={t('performances.title')}
                description={t('performances.description', { count: formatCount(metricsCounts.total) })}
                breadcrumbs={breadcrumbs}
                actions={headerActions}
                stats={statsSection}
                tableTitle={t('performances.table.title')}
                tableDescription={t('performances.table.description')}
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
                title={t('performances.delete.title')}
                description={t('performances.delete.description')}
                itemName={selectedPerformance ? selectedPerformance.foNumber : undefined}
                onConfirm={handleDeleteConfirm}
                isLoading={isDeleting}
            />
        </>
    );
}
