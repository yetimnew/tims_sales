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
import { Link, router } from '@inertiajs/react';
import { type BreadcrumbItem } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import * as React from 'react';
import {
    Route,
    TrendingDown,
    ShieldAlert,
    Navigation2,
    Gauge,
    CircleDot,
    Eye,
    Edit,
    Trash2,
    Plus,
    Search,
    ChevronRight,
} from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Distances',
        href: '/distances',
    },
];

type ColumnKey =
    | 'route'
    | 'status'
    | 'distance_km'
    | 'estimated_time_hours'
    | 'route_type'
    | 'average_speed_kmph'
    | 'road_quality_index'
    | 'toll_road'
    | 'restricted_for_heavy_vehicles';

interface RegionSummary {
    name?: string | null;
}

interface ZoneSummary {
    name?: string | null;
    region?: RegionSummary | null;
}

interface WoredaSummary {
    name?: string | null;
    zone?: ZoneSummary | null;
}

interface PlaceSummary {
    id: number;
    name: string;
    woreda?: WoredaSummary | null;
}

interface DistanceRecord {
    id: number;
    status: 'active' | 'inactive' | string;
    distance_km?: number | string | null;
    estimated_time_hours?: number | string | null;
    route_type?: 'primary' | 'secondary' | 'alternative' | string | null;
    toll_road?: boolean | null;
    restricted_for_heavy_vehicles?: boolean | null;
    average_speed_kmph?: number | string | null;
    road_quality_index?: number | string | null;
    from_place?: PlaceSummary | null;
    to_place?: PlaceSummary | null;
    created_at?: string | null;
}

interface DistancesIndexProps {
    distances: {
        data: DistanceRecord[];
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
        averageSpeed?: number;
        averageRoadQuality?: number;
        seasonalConstraintCount?: number;
    };
    filters?: {
        search?: string | null;
        routeType?: string | null;
        tollRoad?: string | null;
        heavyVehicleRestricted?: string | null;
        distanceMin?: string | null;
        distanceMax?: string | null;
        timeMin?: string | null;
        timeMax?: string | null;
        region?: string | null;
        sort?: string | null;
        direction?: 'asc' | 'desc' | null;
        per_page?: number | null;
    };
    perPageOptions?: number[];
}

const SKELETON_FLAG_KEY = 'distances.index.shouldShowSkeleton';

const COLUMN_DEFINITIONS: Array<{
    id: ColumnKey;
    label: string;
    sortKey?: string;
    align?: 'center' | 'right';
}> = [
    { id: 'route', label: 'Route' },
    { id: 'status', label: 'Status', sortKey: 'status', align: 'center' },
    { id: 'distance_km', label: 'Distance (km)', sortKey: 'distance_km', align: 'right' },
    { id: 'estimated_time_hours', label: 'Time (hrs)', sortKey: 'estimated_time_hours', align: 'right' },
    { id: 'route_type', label: 'Route Type', sortKey: 'route_type', align: 'center' },
    { id: 'average_speed_kmph', label: 'Avg Speed', sortKey: 'average_speed_kmph', align: 'right' },
    { id: 'road_quality_index', label: 'Road Quality', sortKey: 'road_quality_index', align: 'right' },
    { id: 'toll_road', label: 'Toll Road', align: 'center' },
    { id: 'restricted_for_heavy_vehicles', label: 'Heavy Vehicle', align: 'center' },
];

const formatNumberValue = (value?: number | string | null, fractionDigits = 0): string => {
    if (value === null || value === undefined || value === '') {
        return '—';
    }

    const numeric = Number(value);
    if (!Number.isFinite(numeric)) {
        return '—';
    }

    return numeric.toLocaleString('en-US', {
        minimumFractionDigits: fractionDigits,
        maximumFractionDigits: fractionDigits,
    });
};

const formatCount = (value?: number | string | null): string => {
    if (value === null || value === undefined || value === '') {
        return '0';
    }

    const numeric = Number(value);
    if (!Number.isFinite(numeric)) {
        return '0';
    }

    return numeric.toLocaleString();
};

const formatDistanceValue = (value?: number | string | null): string => {
    const formatted = formatNumberValue(value, 1);
    return formatted === '—' ? '—' : `${formatted}`;
};

const formatHourValue = (value?: number | string | null): string => {
    const formatted = formatNumberValue(value, 1);
    return formatted === '—' ? '—' : `${formatted}`;
};

const formatSpeedValue = (value?: number | string | null): string => {
    const formatted = formatNumberValue(value, 1);
    return formatted === '—' ? '—' : `${formatted}`;
};

const getStatusBadge = (status?: string | null): React.ReactNode => {
    if (!status) {
        return (
            <Badge variant="outline" className="bg-muted text-muted-foreground">
                Unknown
            </Badge>
        );
    }

    const normalized = status.toLowerCase();
    if (normalized === 'active') {
        return (
            <Badge className="flex w-fit items-center gap-1 border-emerald-200 bg-emerald-100 text-xs text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-900/30 dark:text-emerald-200">
                Active
            </Badge>
        );
    }

    if (normalized === 'inactive') {
        return (
            <Badge className="flex w-fit items-center gap-1 border-slate-200 bg-slate-100 text-xs text-slate-600 dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-300">
                Inactive
            </Badge>
        );
    }

    return (
        <Badge variant="outline" className="capitalize">
            {status}
        </Badge>
    );
};

const getRouteTypeBadge = (routeType?: string | null): React.ReactNode => {
    if (!routeType) {
        return '—';
    }

    return (
        <Badge className="flex w-fit items-center gap-1 border-blue-200 bg-blue-100 text-xs capitalize text-blue-700 dark:border-blue-900/40 dark:bg-blue-900/30 dark:text-blue-200">
            <CircleDot className="h-3 w-3" />
            {routeType}
        </Badge>
    );
};

const getBooleanBadge = (value?: boolean | null, trueLabel = 'Yes', falseLabel = 'No'): React.ReactNode => {
    if (value) {
        return (
            <Badge className="w-fit border-emerald-200 bg-emerald-100 text-xs text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-900/30 dark:text-emerald-200">
                {trueLabel}
            </Badge>
        );
    }

    return (
        <Badge className="w-fit border-slate-200 bg-slate-100 text-xs text-slate-600 dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-300">
            {falseLabel}
        </Badge>
    );
};

const resolveRegionLabel = (place?: PlaceSummary | null): string => {
    const region = place?.woreda?.zone?.region?.name;
    return region ?? '—';
};

const normalizeOptionalString = (value?: string | null): string | undefined => {
    if (typeof value !== 'string') {
        return undefined;
    }

    const trimmed = value.trim();
    return trimmed === '' ? undefined : trimmed;
};

export default function DistancesIndex({ distances, metrics, filters, perPageOptions }: DistancesIndexProps) {
    const { hasPermission } = usePermissions();
    const canViewDistance = hasPermission('distances.show');
    const canCreateDistance = hasPermission('distances.create');
    const canEditDistance = hasPermission('distances.edit');
    const canDeleteDistance = hasPermission('distances.destroy');

    const [searchTerm, setSearchTerm] = React.useState(filters?.search ?? '');
    const [sortColumn, setSortColumn] = React.useState<string>(filters?.sort ?? 'distance_km');
    const [sortDirection, setSortDirection] = React.useState<'asc' | 'desc'>(filters?.direction ?? 'asc');

    const filterRouteType = filters?.routeType && filters.routeType !== 'all' ? filters.routeType : undefined;
    const filterTollRoad = filters?.tollRoad && filters.tollRoad !== 'all' ? filters.tollRoad : undefined;
    const filterHeavyRestriction = filters?.heavyVehicleRestricted && filters.heavyVehicleRestricted !== 'all'
        ? filters.heavyVehicleRestricted
        : undefined;
    const filterDistanceMin = normalizeOptionalString(filters?.distanceMin);
    const filterDistanceMax = normalizeOptionalString(filters?.distanceMax);
    const filterTimeMin = normalizeOptionalString(filters?.timeMin);
    const filterTimeMax = normalizeOptionalString(filters?.timeMax);
    const filterRegion = normalizeOptionalString(filters?.region);

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
    const [selectedDistance, setSelectedDistance] = React.useState<DistanceRecord | null>(null);
    const [isDeleting, setIsDeleting] = React.useState(false);

    const isDataReady = Array.isArray(distances?.data);
    const { isLoading } = useListingLoading({
        storageKey: SKELETON_FLAG_KEY,
        isDataReady,
        onlySamePath: true,
        targetPath: '/distances',
        initialIsLoading: true,
    });

    React.useEffect(() => {
        setPerPage(String(resolvedPerPage));
    }, [resolvedPerPage]);

    const distanceData = React.useMemo(() => {
        const records = distances?.data;
        return Array.isArray(records) ? records : [];
    }, [distances?.data]);
    const totalRecords = distances?.total ?? distanceData.length ?? 0;
    const averageSpeed = metrics?.averageSpeed ?? 0;
    const averageRoadQuality = metrics?.averageRoadQuality ?? 0;
    const seasonalConstraintCount = metrics?.seasonalConstraintCount ?? 0;
    const rowOffset = Math.max((distances?.from ?? 1) - 1, 0);

    const handleNavigate = React.useCallback(
        (overrides: {
            search?: string;
            sort?: string;
            direction?: 'asc' | 'desc';
            page?: number;
            per_page?: number;
        } = {}) => {
            const hasOverride = (key: keyof typeof overrides) => Object.prototype.hasOwnProperty.call(overrides, key);

            const nextSearch = hasOverride('search')
                ? overrides.search
                : normalizeOptionalString(searchTerm);

            const nextSort = hasOverride('sort') ? overrides.sort ?? sortColumn : sortColumn;
            const nextDirection = hasOverride('direction') ? overrides.direction ?? sortDirection : sortDirection;
            const nextPerPage = hasOverride('per_page') ? overrides.per_page : Number(perPage);
            const nextPage = hasOverride('page') ? overrides.page : undefined;

            const params: Record<string, string | number | undefined> = {
                search: nextSearch,
                routeType: filterRouteType,
                tollRoad: filterTollRoad,
                heavyVehicleRestricted: filterHeavyRestriction,
                distanceMin: filterDistanceMin,
                distanceMax: filterDistanceMax,
                timeMin: filterTimeMin,
                timeMax: filterTimeMax,
                region: filterRegion,
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

            router.get('/distances', params, { preserveState: true, preserveScroll: true, replace: false });
        },
        [
            perPage,
            searchTerm,
            filterRouteType,
            filterTollRoad,
            filterHeavyRestriction,
            filterDistanceMin,
            filterDistanceMax,
            filterTimeMin,
            filterTimeMax,
            filterRegion,
            sortColumn,
            sortDirection,
        ],
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

    const handleDeleteClick = (distance: DistanceRecord) => {
        setSelectedDistance(distance);
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = () => {
        if (!selectedDistance) {
            return;
        }

        const routeLabel = `${selectedDistance.from_place?.name ?? 'Unknown'} → ${selectedDistance.to_place?.name ?? 'Unknown'}`;
        setIsDeleting(true);

        router.delete(`/distances/${selectedDistance.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                setDeleteDialogOpen(false);
                setSelectedDistance(null);
            },
            onFinish: () => {
                setIsDeleting(false);
            },
        });
    };

    const statsDefinitions = [
        {
            id: 'total-distances',
            label: 'Tracked Routes',
            icon: <Route className="h-3.5 w-3.5 text-rose-500" />,
            className: 'min-w-[220px] flex-shrink-0',
            value: isLoading ? (
                <Skeleton className="h-3.5 w-20" aria-hidden="true" />
            ) : (
                formatCount(totalRecords)
            ),
            description: isLoading ? (
                <Skeleton className="h-3 w-40" aria-hidden="true" />
            ) : (
                'Active corridor records'
            ),
            valueClassName: isLoading ? undefined : 'text-rose-600',
        },
        {
            id: 'average-speed',
            label: 'Avg Speed (km/h)',
            icon: <Gauge className="h-3.5 w-3.5 text-indigo-500" />,
            className: 'min-w-[220px] flex-shrink-0',
            value: isLoading ? (
                <Skeleton className="h-3.5 w-16" aria-hidden="true" />
            ) : (
                formatSpeedValue(averageSpeed)
            ),
            description: isLoading ? (
                <Skeleton className="h-3 w-36" aria-hidden="true" />
            ) : (
                'Mean corridor velocity'
            ),
            valueClassName: isLoading ? undefined : 'text-indigo-600',
        },
        {
            id: 'road-quality',
            label: 'Road Quality Index',
            icon: <TrendingDown className="h-3.5 w-3.5 text-emerald-500" />,
            className: 'min-w-[220px] flex-shrink-0',
            value: isLoading ? (
                <Skeleton className="h-3.5 w-16" aria-hidden="true" />
            ) : (
                formatNumberValue(averageRoadQuality, 1)
            ),
            description: isLoading ? (
                <Skeleton className="h-3 w-32" aria-hidden="true" />
            ) : (
                'Infrastructure readiness'
            ),
            valueClassName: isLoading ? undefined : 'text-emerald-600',
        },
        {
            id: 'seasonal-alerts',
            label: 'Seasonal Alerts',
            icon: <ShieldAlert className="h-3.5 w-3.5 text-amber-500" />,
            className: 'min-w-[220px] flex-shrink-0',
            value: isLoading ? (
                <Skeleton className="h-3.5 w-16" aria-hidden="true" />
            ) : (
                formatCount(seasonalConstraintCount)
            ),
            description: isLoading ? (
                <Skeleton className="h-3 w-40" aria-hidden="true" />
            ) : (
                'Routes with seasonal risks'
            ),
            valueClassName: isLoading ? undefined : 'text-amber-600',
        },
    ];

    const statsSection = <ListingStatsHeader stats={statsDefinitions} orientation="row" />;

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

    const renderColumnValue = React.useCallback((distance: DistanceRecord, column: ColumnKey): React.ReactNode => {
        switch (column) {
            case 'route':
                return (
                    <div className="flex items-start gap-2">
                        <Navigation2 className="mt-0.5 h-4 w-4 text-primary" />
                        <div className="flex flex-col">
                            <span className="font-medium text-foreground">
                                {distance.from_place?.name ?? 'Unknown'}
                                <span className="mx-1 text-xs text-muted-foreground">→</span>
                                {distance.to_place?.name ?? 'Unknown'}
                            </span>
                            <span className="text-xs text-muted-foreground">
                                {resolveRegionLabel(distance.from_place)} • {resolveRegionLabel(distance.to_place)}
                            </span>
                        </div>
                    </div>
                );
            case 'status':
                return getStatusBadge(distance.status);
            case 'distance_km':
                return formatDistanceValue(distance.distance_km);
            case 'estimated_time_hours':
                return formatHourValue(distance.estimated_time_hours);
            case 'route_type':
                return getRouteTypeBadge(distance.route_type ?? null);
            case 'average_speed_kmph':
                return formatSpeedValue(distance.average_speed_kmph);
            case 'road_quality_index':
                return formatNumberValue(distance.road_quality_index, 1);
            case 'toll_road':
                return getBooleanBadge(Boolean(distance.toll_road), 'Toll', 'No Toll');
            case 'restricted_for_heavy_vehicles':
                return getBooleanBadge(Boolean(distance.restricted_for_heavy_vehicles), 'Restricted', 'Allowed');
            default:
                return '—';
        }
    }, []);

    const tableRows = isLoading
        ? Array.from({ length: 6 }).map((_, rowIndex) => (
              <TableRow key={`distances-skeleton-${rowIndex}`} aria-hidden="true">
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
        : distanceData.length > 0
            ? distanceData.map((distance, index) => (
                  <TableRow key={distance.id} className="hover:bg-muted/50">
                      <TableCell className="text-center font-medium">{rowOffset + index + 1}</TableCell>
                      {COLUMN_DEFINITIONS.map((column) => (
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
                              {renderColumnValue(distance, column.id)}
                          </TableCell>
                      ))}
                      <TableCell className="text-center">
                          <ListingRowActionsMenu
                              actions={[
                                  canViewDistance && {
                                      label: 'View',
                                      icon: <Eye className="h-4 w-4" />,
                                      href: `/distances/${distance.id}`,
                                  },
                                  canEditDistance && {
                                      label: 'Edit',
                                      icon: <Edit className="h-4 w-4" />,
                                      href: `/distances/${distance.id}/edit`,
                                  },
                                  canDeleteDistance && {
                                      label: 'Delete',
                                      icon: <Trash2 className="h-4 w-4" />,
                                      danger: true,
                                      disabled: isDeleting && selectedDistance?.id === distance.id,
                                      onSelect: () => handleDeleteClick(distance),
                                  },
                              ]}
                          />
                      </TableCell>
                  </TableRow>
              ))
            : (
                <TableRow>
                    <TableCell colSpan={tableColumns.length} className="py-8 text-center text-muted-foreground">
                        No distances found.
                        {canCreateDistance && (
                            <Link href="/distances/create" className="ml-1 text-primary underline">
                                Create one
                            </Link>
                        )}
                    </TableCell>
                </TableRow>
            );

    const mobileItems = React.useMemo(
        () =>
            distanceData.map((distance, index) => ({
                record: distance,
                position: rowOffset + index + 1,
            })),
        [distanceData, rowOffset],
    );

    const mobileContent = isLoading ? (
        <ListingLoadingPlaceholder showStats={false} filterItemCount={2} rowCount={4} />
    ) : (
        <ListingMobileItemList
            items={mobileItems}
            getKey={(item) => item.record.id}
            renderTitle={(item) => (
                <div className="flex items-center gap-2">
                    <span className="text-xs uppercase tracking-wide text-muted-foreground">#{item.position}</span>
                    <span className="text-base font-semibold text-foreground">
                        {item.record.from_place?.name ?? 'Unknown'}
                        <span className="mx-1 text-xs text-muted-foreground">→</span>
                        {item.record.to_place?.name ?? 'Unknown'}
                    </span>
                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
            )}
            renderSubtitle={(item) => `${resolveRegionLabel(item.record.from_place)} • ${resolveRegionLabel(item.record.to_place)}`}
            renderContent={(item) => (
                <div className="space-y-3 text-sm text-muted-foreground">
                    <div className="flex items-center justify-between">
                        <span className="font-medium text-slate-600 dark:text-slate-300">Status</span>
                        <span className="text-right text-slate-900 dark:text-slate-100">{getStatusBadge(item.record.status)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="font-medium text-slate-600 dark:text-slate-300">Distance</span>
                        <span className="text-right text-slate-900 dark:text-slate-100">{formatDistanceValue(item.record.distance_km)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="font-medium text-slate-600 dark:text-slate-300">Travel Time</span>
                        <span className="text-right text-slate-900 dark:text-slate-100">{formatHourValue(item.record.estimated_time_hours)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="font-medium text-slate-600 dark:text-slate-300">Route Type</span>
                        <span className="text-right text-slate-900 dark:text-slate-100">{getRouteTypeBadge(item.record.route_type ?? null)}</span>
                    </div>
                </div>
            )}
            renderFooter={(item) => (
                <div className="flex w-full flex-wrap items-center justify-end gap-2">
                    {canViewDistance && (
                        <Button asChild size="sm" variant="outline" className="flex-1 sm:flex-auto">
                            <Link href={`/distances/${item.record.id}`}>
                                <Eye className="mr-2 h-4 w-4" />
                                View
                            </Link>
                        </Button>
                    )}
                    {canEditDistance && (
                        <Button asChild size="sm" variant="secondary" className="flex-1 sm:flex-none">
                            <Link href={`/distances/${item.record.id}/edit`}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                            </Link>
                        </Button>
                    )}
                    {canDeleteDistance && (
                        <Button
                            size="sm"
                            variant="destructive"
                            className="flex-1 sm:flex-none"
                            onClick={() => handleDeleteClick(item.record)}
                            disabled={isDeleting && selectedDistance?.id === item.record.id}
                        >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                        </Button>
                    )}
                </div>
            )}
            emptyState={(
                <div className="py-8 text-center text-muted-foreground">
                    No distances found.
                    {canCreateDistance && (
                        <Link href="/distances/create" className="ml-1 text-primary underline">
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
                placeholder: 'Search routes or notes...',
                onChange: handleSearchChange,
                icon: <Search className="h-4 w-4" />,
            }}
            perPage={{
                value: perPage,
                label: 'Rows',
                onChange: handlePerPageChange,
                options: availablePerPageOptions.map((option) => ({
                    value: String(option),
                    label: `${option} / page`,
                })),
            }}
        />
    );

    const headerActions = canCreateDistance ? (
        <Button asChild>
            <Link href="/distances/create">
                <Plus className="mr-2 h-4 w-4" />
                Add Distance
            </Link>
        </Button>
    ) : null;

    return (
        <>
            <ListPageLayout
                headTitle="Distances"
                title="Route Distances"
                description={
                    totalRecords === 0
                        ? 'Monitor corridor readiness, travel times, and seasonal risks across logistics routes.'
                        : `Monitor ${formatCount(totalRecords)} route${totalRecords === 1 ? '' : 's'} and seasonal risk factors.`
                }
                breadcrumbs={breadcrumbs}
                actions={headerActions}
                stats={statsSection}
                tableTitle="Distance Matrix"
                tableDescription="Analyse corridor performance, infrastructure indicators, and travel constraints"
                tableHeaderExtras={tableHeaderExtras}
                pagination={
                    !isLoading && distances?.links ? (
                        <ListingPaginationFooter
                            className="mt-4"
                            links={distances.links}
                            from={distances.from ?? undefined}
                            to={distances.to ?? undefined}
                            total={distances.total ?? undefined}
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
                        setSelectedDistance(null);
                        setIsDeleting(false);
                    }
                }}
                title="Delete Distance"
                description="Are you sure you want to delete this distance? This action cannot be undone."
                itemName={selectedDistance ? `${selectedDistance.from_place?.name ?? 'Unknown'} → ${selectedDistance.to_place?.name ?? 'Unknown'}` : undefined}
                onConfirm={handleDeleteConfirm}
                isLoading={isDeleting}
            />
        </>
    );
}
