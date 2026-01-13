import { Badge } from '@/components/ui/badge';
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
import { useTranslation } from 'react-i18next';
import * as React from 'react';
import {
    Map,
    CheckCircle,
    XCircle,
    BarChart3,
    Target,
    MapPin,
    Eye,
    Edit,
    Trash2,
    Plus,
    Search,
    ChevronRight,
} from 'lucide-react';

type ColumnKey =
    | 'name'
    | 'code'
    | 'status'
    | 'region'
    | 'administrative_center'
    | 'population'
    | 'accessibility_score'
    | 'woredas_count';

interface RegionSummary {
    id: number;
    name: string;
}

interface ZoneData {
    id: number;
    name: string;
    code?: string | null;
    status: 'active' | 'inactive' | string;
    region?: RegionSummary | null;
    administrative_center?: string | null;
    population?: number | string | null;
    accessibility_score?: number | string | null;
    woredas_count?: number | null;
    created_at?: string | null;
}

interface ZonesIndexProps {
    zones: {
        data: ZoneData[];
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
    metrics?: {
        totalZones?: number;
        totalPopulation?: number;
        averageAccessibility?: number;
        surveyedCount?: number;
        activeCount?: number;
        inactiveCount?: number;
    };
    filters?: {
        search?: string | null;
        status?: string | null;
        sort?: string | null;
        direction?: 'asc' | 'desc' | null;
        per_page?: number | null;
    };
    statusOptions?: Array<{ label: string; value: string }>;
    perPageOptions?: number[];
}

const SKELETON_FLAG_KEY = 'zones.index.shouldShowSkeleton';

export default function ZonesIndex({ zones, metrics, filters, statusOptions, perPageOptions }: ZonesIndexProps) {
    const { t, i18n } = useTranslation();
    const { hasPermission } = usePermissions();
    const canViewZone = hasPermission('zones.show');
    const canCreateZone = hasPermission('zones.create');
    const canEditZone = hasPermission('zones.edit');
    const canDeleteZone = hasPermission('zones.destroy');
    const locale = i18n.language || 'en-US';
    const notAvailableLabel = t('zones.fallbacks.notAvailable');
    const unknownStatusLabel = t('zones.status.unknown');

    const [searchTerm, setSearchTerm] = React.useState(filters?.search ?? '');
    const [selectedStatus, setSelectedStatus] = React.useState(filters?.status ?? 'all');
    const [sortColumn, setSortColumn] = React.useState<string>(filters?.sort ?? 'name');
    const [sortDirection, setSortDirection] = React.useState<'asc' | 'desc'>(filters?.direction ?? 'asc');
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

    const breadcrumbs = React.useMemo<BreadcrumbItem[]>(
        () => [
            {
                title: t('zones.title'),
                href: '/zones',
            },
        ],
        [t],
    );

    const columnDefinitions = React.useMemo(
        () => [
            { id: 'name', label: t('zones.columns.name'), sortKey: 'name' },
            { id: 'code', label: t('zones.columns.code'), sortKey: 'code' },
            { id: 'status', label: t('zones.columns.status'), sortKey: 'status', align: 'center' as const },
            { id: 'region', label: t('zones.columns.region'), sortKey: 'region_id' },
            {
                id: 'administrative_center',
                label: t('zones.columns.administrativeCenter'),
                sortKey: 'administrative_center',
            },
            { id: 'population', label: t('zones.columns.population'), sortKey: 'population', align: 'right' as const },
            {
                id: 'accessibility_score',
                label: t('zones.columns.accessibility'),
                sortKey: 'accessibility_score',
                align: 'center' as const,
            },
            { id: 'woredas_count', label: t('zones.columns.woredas'), sortKey: 'woredas_count', align: 'center' as const },
        ],
        [t],
    );

    const formatNumberValue = React.useCallback(
        (value?: number | string | null, fractionDigits = 0): string => {
            if (value === null || value === undefined || value === '') {
                return notAvailableLabel;
            }

            const numeric = Number(value);
            if (!Number.isFinite(numeric)) {
                return notAvailableLabel;
            }

            return numeric.toLocaleString(locale, {
                minimumFractionDigits: fractionDigits,
                maximumFractionDigits: fractionDigits,
            });
        },
        [locale, notAvailableLabel],
    );

    const formatCount = React.useCallback(
        (value?: number | string | null): string => {
            if (value === null || value === undefined || value === '') {
                return '0';
            }

            const numeric = Number(value);
            if (!Number.isFinite(numeric)) {
                return '0';
            }

            return numeric.toLocaleString(locale);
        },
        [locale],
    );

    const getStatusBadge = React.useCallback(
        (status?: string | null): React.ReactNode => {
            if (!status) {
                return (
                    <Badge variant="outline" className="bg-muted text-muted-foreground">
                        {unknownStatusLabel}
                    </Badge>
                );
            }

            const normalized = status.toLowerCase();
            if (normalized === 'active') {
                return (
                    <Badge className="flex items-center gap-1 border-emerald-200 bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:border-emerald-900/50 dark:bg-emerald-900/30 dark:text-emerald-200">
                        <CheckCircle className="h-3 w-3" /> {t('zones.status.active')}
                    </Badge>
                );
            }

            if (normalized === 'inactive') {
                return (
                    <Badge className="flex items-center gap-1 border-slate-300 bg-slate-200 text-slate-700 hover:bg-slate-300 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-200">
                        <XCircle className="h-3 w-3" /> {t('zones.status.inactive')}
                    </Badge>
                );
            }

            return (
                <Badge variant="outline" className="capitalize">
                    {status}
                </Badge>
            );
        },
        [t, unknownStatusLabel],
    );

    const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
    const [selectedZone, setSelectedZone] = React.useState<ZoneData | null>(null);
    const [isDeleting, setIsDeleting] = React.useState(false);

    const isDataReady = Array.isArray(zones?.data);
    const { isLoading } = useListingLoading({
        storageKey: SKELETON_FLAG_KEY,
        isDataReady,
        onlySamePath: true,
        targetPath: '/zones',
        initialIsLoading: true,
    });

    React.useEffect(() => {
        setPerPage(String(resolvedPerPage));
    }, [resolvedPerPage]);

    const zoneData = React.useMemo(() => {
        const records = zones?.data;
        return Array.isArray(records) ? records : [];
    }, [zones?.data]);
    const totalRecords = metrics?.totalZones ?? zones?.total ?? zoneData.length ?? 0;
    const activeCount = metrics?.activeCount ?? 0;
    const inactiveCount = metrics?.inactiveCount ?? 0;
    const surveyedCount = metrics?.surveyedCount ?? 0;
    const totalPopulation = metrics?.totalPopulation ?? 0;
    const averageAccessibility = metrics?.averageAccessibility ?? 0;

    const rowOffset = Math.max((zones?.from ?? 1) - 1, 0);

    const handleNavigate = React.useCallback(
        (overrides: {
            search?: string;
            status?: string;
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

            const nextSort = hasOverride('sort') ? overrides.sort ?? sortColumn : sortColumn;
            const nextDirection = hasOverride('direction') ? overrides.direction ?? sortDirection : sortDirection;
            const nextPerPage = hasOverride('per_page') ? overrides.per_page : Number(perPage);
            const nextPage = hasOverride('page') ? overrides.page : undefined;

            const params: Record<string, string | number | undefined> = {
                search: nextSearch && nextSearch !== '' ? nextSearch : undefined,
                status: nextStatus && nextStatus !== 'all' ? nextStatus : undefined,
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

            router.get('/zones', params, { preserveState: true, replace: false });
        },
        [perPage, searchTerm, selectedStatus, sortColumn, sortDirection],
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

    const handleDeleteClick = (zone: ZoneData) => {
        setSelectedZone(zone);
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = () => {
        if (!selectedZone) {
            return;
        }

        setIsDeleting(true);

        router.delete(`/zones/${selectedZone.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                setDeleteDialogOpen(false);
                setSelectedZone(null);
                setIsDeleting(false);
                toast({
                    title: t('zones.delete.successTitle'),
                    description: t('zones.delete.successDescription', { name: selectedZone?.name ?? '' }),
                });
            },
            onError: (errors) => {
                setIsDeleting(false);

                const fallback = t('zones.delete.failedDescription');
                if (errors && typeof errors === 'object') {
                    const errorMessages = Object.values(errors)
                        .flatMap((value) => (Array.isArray(value) ? value : [value]))
                        .filter(Boolean)
                        .join('\n');

                    toast({
                        title: t('zones.delete.failedTitle'),
                        description: errorMessages || fallback,
                        variant: 'destructive',
                    });
                } else {
                    toast({
                        title: t('zones.delete.failedTitle'),
                        description: fallback,
                        variant: 'destructive',
                    });
                }
            },
        });
    };

    const statsDefinitions = React.useMemo(
        () => [
            {
                id: 'total-zones',
                label: t('zones.stats.total.label'),
                icon: <Map className="h-3.5 w-3.5 text-blue-600" />,
                className: 'min-w-[220px] flex-shrink-0',
                value: isLoading ? (
                    <Skeleton className="h-3.5 w-20" aria-hidden="true" />
                ) : (
                    formatCount(totalRecords)
                ),
                description: isLoading ? (
                    <Skeleton className="h-3 w-32" aria-hidden="true" />
                ) : (
                    t('zones.stats.total.description', { count: formatCount(surveyedCount) })
                ),
                valueClassName: isLoading ? undefined : 'text-blue-600',
            },
            {
                id: 'active-zones',
                label: t('zones.stats.active.label'),
                icon: <CheckCircle className="h-3.5 w-3.5 text-emerald-600" />,
                className: 'min-w-[220px] flex-shrink-0',
                value: isLoading ? (
                    <Skeleton className="h-3.5 w-16" aria-hidden="true" />
                ) : (
                    formatCount(activeCount)
                ),
                description: isLoading ? (
                    <Skeleton className="h-3 w-24" aria-hidden="true" />
                ) : (
                    t('zones.stats.active.description')
                ),
                valueClassName: isLoading ? undefined : 'text-emerald-600',
            },
            {
                id: 'inactive-zones',
                label: t('zones.stats.inactive.label'),
                icon: <XCircle className="h-3.5 w-3.5 text-rose-600" />,
                className: 'min-w-[220px] flex-shrink-0',
                value: isLoading ? (
                    <Skeleton className="h-3.5 w-16" aria-hidden="true" />
                ) : (
                    formatCount(inactiveCount)
                ),
                description: isLoading ? (
                    <Skeleton className="h-3 w-28" aria-hidden="true" />
                ) : (
                    t('zones.stats.inactive.description')
                ),
                valueClassName: isLoading ? undefined : 'text-rose-600',
            },
            {
                id: 'population-reach',
                label: t('zones.stats.population.label'),
                icon: <BarChart3 className="h-3.5 w-3.5 text-indigo-500" />,
                className: 'min-w-[220px] flex-shrink-0',
                value: isLoading ? (
                    <Skeleton className="h-3.5 w-24" aria-hidden="true" />
                ) : (
                    formatCount(totalPopulation)
                ),
                description: isLoading ? (
                    <Skeleton className="h-3 w-28" aria-hidden="true" />
                ) : (
                    t('zones.stats.population.description')
                ),
                valueClassName: isLoading ? undefined : 'text-indigo-600',
            },
            {
                id: 'accessibility-index',
                label: t('zones.stats.accessibility.label'),
                icon: <Target className="h-3.5 w-3.5 text-amber-600" />,
                className: 'min-w-[220px] flex-shrink-0',
                value: isLoading ? (
                    <Skeleton className="h-3.5 w-16" aria-hidden="true" />
                ) : (
                    formatNumberValue(averageAccessibility, 1)
                ),
                description: isLoading ? (
                    <Skeleton className="h-3 w-28" aria-hidden="true" />
                ) : (
                    t('zones.stats.accessibility.description')
                ),
                valueClassName: isLoading ? undefined : 'text-amber-600',
            },
        ],
        [
            activeCount,
            averageAccessibility,
            formatCount,
            formatNumberValue,
            inactiveCount,
            isLoading,
            surveyedCount,
            t,
            totalPopulation,
            totalRecords,
        ],
    );

    const statsSection = <ListingStatsHeader stats={statsDefinitions} orientation="row" />;

    const perPageSelectOptions = React.useMemo(
        () =>
            availablePerPageOptions.map((option) => ({
                value: String(option),
                label: t('zones.filters.perPageOption', { value: option }),
            })),
        [availablePerPageOptions, t],
    );

    const tableColumns = React.useMemo(
        () => [
            { id: 'index', label: t('zones.table.index'), align: 'center' as const },
            ...columnDefinitions.map((column) => ({
                id: column.id,
                label: column.label,
                sortable: Boolean(column.sortKey),
                sortKey: column.sortKey,
                align: column.align,
            })),
            { id: 'actions', label: t('zones.table.actions'), align: 'center' as const },
        ],
        [columnDefinitions, t],
    );

    const renderColumnValue = React.useCallback(
        (zone: ZoneData, column: ColumnKey): React.ReactNode => {
            switch (column) {
                case 'name':
                    return (
                        <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-primary" />
                            <div className="flex flex-col">
                                <span className="font-medium text-foreground">{zone.name}</span>
                                {zone.administrative_center && (
                                    <span className="text-xs text-muted-foreground">{zone.administrative_center}</span>
                                )}
                            </div>
                        </div>
                    );
                case 'code':
                    return zone.code || notAvailableLabel;
                case 'status':
                    return getStatusBadge(zone.status);
                case 'region':
                    return zone.region?.name || notAvailableLabel;
                case 'administrative_center':
                    return zone.administrative_center || notAvailableLabel;
                case 'population':
                    return formatNumberValue(zone.population);
                case 'accessibility_score':
                    return zone.accessibility_score !== null && zone.accessibility_score !== undefined
                        ? formatNumberValue(zone.accessibility_score, 1)
                        : notAvailableLabel;
                case 'woredas_count':
                    return formatNumberValue(zone.woredas_count ?? 0);
                default:
                    return notAvailableLabel;
            }
        },
        [formatNumberValue, getStatusBadge, notAvailableLabel],
    );

    const tableRows = isLoading
        ? Array.from({ length: 8 }).map((_, index) => (
              <TableRow key={`skeleton-${index}`} aria-hidden="true">
                  <TableCell className="text-center">
                      <Skeleton className="h-4 w-6 mx-auto" />
                  </TableCell>
                  <TableCell>
                      <div className="flex items-center gap-2">
                          <Skeleton className="h-4 w-4 rounded" />
                          <Skeleton className="h-4 w-32" />
                      </div>
                  </TableCell>
                  <TableCell>
                      <Skeleton className="h-4 w-16" />
                  </TableCell>
                  <TableCell className="text-center">
                      <Skeleton className="h-6 w-20 mx-auto rounded-full" />
                  </TableCell>
                  <TableCell>
                      <Skeleton className="h-4 w-24" />
                  </TableCell>
                  <TableCell>
                      <Skeleton className="h-4 w-24" />
                  </TableCell>
                  <TableCell className="text-right">
                      <Skeleton className="h-4 w-20 ml-auto" />
                  </TableCell>
                  <TableCell className="text-center">
                      <Skeleton className="h-4 w-12 mx-auto" />
                  </TableCell>
                  <TableCell className="text-center">
                      <Skeleton className="h-4 w-12 mx-auto" />
                  </TableCell>
                  <TableCell>
                      <Skeleton className="h-4 w-24" />
                  </TableCell>
                  <TableCell className="text-center">
                      <Skeleton className="h-8 w-8 mx-auto rounded" />
                  </TableCell>
              </TableRow>
          ))
        : zoneData.length > 0
            ? zoneData.map((zone, index) => (
                  <TableRow key={zone.id} className="hover:bg-muted/50">
                      <TableCell className="text-center font-medium">{rowOffset + index + 1}</TableCell>
                      {columnDefinitions.map((column) => (
                          <TableCell
                              key={column.id}
                              className={
                                  column.align === 'center'
                                      ? 'text-center'
                                      : column.align === 'right'
                                          ? 'text-right'
                                          : undefined
                              }
                          >
                              {renderColumnValue(zone, column.id)}
                          </TableCell>
                      ))}
                      <TableCell className="text-center">
                          <ListingRowActionsMenu
                              actions={[
                                  canViewZone && {
                                      label: t('zones.actions.view'),
                                      icon: <Eye className="h-4 w-4" />,
                                      href: `/zones/${zone.id}`,
                                  },
                                  canEditZone && {
                                      label: t('zones.actions.edit'),
                                      icon: <Edit className="h-4 w-4" />,
                                      href: `/zones/${zone.id}/edit`,
                                  },
                                  canDeleteZone && {
                                      label: t('zones.actions.delete'),
                                      icon: <Trash2 className="h-4 w-4" />,
                                      danger: true,
                                      disabled: isDeleting && selectedZone?.id === zone.id,
                                      onSelect: () => handleDeleteClick(zone),
                                  },
                              ]}
                          />
                      </TableCell>
                  </TableRow>
              ))
            : (
                <TableRow>
                    <TableCell colSpan={tableColumns.length} className="py-8 text-center text-muted-foreground">
                        {t('zones.empty.title')}
                        {canCreateZone && (
                            <Link href="/zones/create" className="ml-1 text-primary underline">
                                {t('zones.empty.createAction')}
                            </Link>
                        )}
                    </TableCell>
                </TableRow>
            );

    const mobileItems = React.useMemo(
        () =>
            zoneData.map((zone, index) => ({
                record: zone,
                position: rowOffset + index + 1,
            })),
        [zoneData, rowOffset],
    );

    const mobileContent = isLoading ? (
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
            renderSubtitle={() => <Skeleton className="h-3 w-28" />}
            renderContent={() => (
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <Skeleton className="h-3 w-16" />
                        <Skeleton className="h-3 w-20" />
                    </div>
                    <div className="flex items-center justify-between">
                        <Skeleton className="h-3 w-24" />
                        <Skeleton className="h-3 w-24" />
                    </div>
                    <div className="flex items-center justify-between">
                        <Skeleton className="h-3 w-20" />
                        <Skeleton className="h-3 w-12" />
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
                        {t('zones.mobile.position', { value: item.position })}
                    </span>
                    <span className="text-base font-semibold text-foreground">{item.record.name}</span>
                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
            )}
            renderSubtitle={(item) => item.record.region?.name || t('zones.mobile.noRegion')}
            renderContent={(item) => (
                <div className="space-y-3 text-sm text-muted-foreground">
                    <div className="flex items-center justify-between">
                        <span className="font-medium text-slate-600 dark:text-slate-300">
                            {t('zones.mobile.status')}
                        </span>
                        <div className="text-right text-slate-900 dark:text-slate-100">
                            {getStatusBadge(item.record.status)}
                        </div>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="font-medium text-slate-600 dark:text-slate-300">
                            {t('zones.mobile.population')}
                        </span>
                        <span className="text-right text-slate-900 dark:text-slate-100">
                            {formatNumberValue(item.record.population)}
                        </span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="font-medium text-slate-600 dark:text-slate-300">
                            {t('zones.mobile.woredas')}
                        </span>
                        <span className="text-right text-slate-900 dark:text-slate-100">
                            {formatNumberValue(item.record.woredas_count ?? 0)}
                        </span>
                    </div>
                </div>
            )}
            renderFooter={(item) => (
                <div className="flex w-full flex-wrap items-center justify-end gap-2">
                    {canViewZone && (
                        <Button asChild size="sm" variant="outline" className="flex-1 sm:flex-auto">
                            <Link href={`/zones/${item.record.id}`}>
                                <Eye className="mr-2 h-4 w-4" />
                                {t('zones.actions.view')}
                            </Link>
                        </Button>
                    )}
                    {canEditZone && (
                        <Button asChild size="sm" variant="secondary" className="flex-1 sm:flex-none">
                            <Link href={`/zones/${item.record.id}/edit`}>
                                <Edit className="mr-2 h-4 w-4" />
                                {t('zones.actions.edit')}
                            </Link>
                        </Button>
                    )}
                    {canDeleteZone && (
                        <Button
                            size="sm"
                            variant="destructive"
                            className="flex-1 sm:flex-none"
                            onClick={() => handleDeleteClick(item.record)}
                            disabled={isDeleting && selectedZone?.id === item.record.id}
                        >
                            <Trash2 className="mr-2 h-4 w-4" />
                            {t('zones.actions.delete')}
                        </Button>
                    )}
                </div>
            )}
            emptyState={(
                <div className="py-8 text-center text-muted-foreground">
                    {t('zones.empty.title')}
                    {canCreateZone && (
                        <Link href="/zones/create" className="ml-1 text-primary underline">
                            {t('zones.empty.createAction')}
                        </Link>
                    )}
                </div>
            )}
        />
    );

    const statusFilterOptions = React.useMemo(
        () =>
            (statusOptions?.length
                ? statusOptions.map((option) => ({
                      value: option.value,
                      label: t(`zones.filters.statusOptions.${option.value}`, { defaultValue: option.label }),
                  }))
                : [
                      { label: t('zones.filters.statusOptions.active'), value: 'active' },
                      { label: t('zones.filters.statusOptions.inactive'), value: 'inactive' },
                  ]) || [],
        [statusOptions, t],
    );

    const tableHeaderExtras = (
        <ListingFilterBar
            search={{
                value: searchTerm,
                placeholder: t('zones.filters.searchPlaceholder'),
                onChange: handleSearchChange,
                icon: <Search className="h-4 w-4" />,
            }}
            perPage={{
                value: perPage,
                label: t('zones.filters.rowsLabel'),
                onChange: handlePerPageChange,
                options: perPageSelectOptions,
            }}
        >
            <Select value={selectedStatus} onValueChange={handleStatusChange}>
                <SelectTrigger className="w-full min-w-[160px] sm:w-auto">
                    <SelectValue placeholder={t('zones.filters.statusPlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">{t('zones.filters.statusAll')}</SelectItem>
                    {statusFilterOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                            {option.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </ListingFilterBar>
    );

    const formattedTotalRecords = React.useMemo(() => formatCount(totalRecords), [formatCount, totalRecords]);

    const headerActions = (
        <>
            {canCreateZone && (
                <Button asChild>
                    <Link href="/zones/create">
                        <Plus className="mr-2 h-4 w-4" />
                        {t('zones.actions.add')}
                    </Link>
                </Button>
            )}
        </>
    );

    return (
        <>
            <ListPageLayout
                headTitle={t('zones.headTitle')}
                title={t('zones.title')}
                description={t('zones.description', {
                    count: totalRecords,
                    formattedCount: formattedTotalRecords,
                })}
                breadcrumbs={breadcrumbs}
                actions={headerActions}
                stats={statsSection}
                tableTitle={t('zones.table.title')}
                tableDescription={t('zones.table.description')}
                tableHeaderExtras={tableHeaderExtras}
                pagination={
                    !isLoading && zones?.links ? (
                        <ListingPaginationFooter
                            className="mt-4"
                            links={zones.links}
                            from={zones.from ?? undefined}
                            to={zones.to ?? undefined}
                            total={zones.total ?? undefined}
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
                        setSelectedZone(null);
                        setIsDeleting(false);
                    }
                }}
                title={t('zones.delete.title')}
                description={t('zones.delete.description')}
                itemName={selectedZone ? selectedZone.name : undefined}
                onConfirm={handleDeleteConfirm}
                isLoading={isDeleting}
            />
        </>
    );
}

