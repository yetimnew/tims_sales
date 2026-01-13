import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
        region?: string | null;
        zone?: string | null;
        woreda?: string | null;
        sort?: string | null;
        direction?: 'asc' | 'desc' | null;
    };
}

const SKELETON_FLAG_KEY = 'distances.index.shouldShowSkeleton';

export default function DistancesIndex({ distances, metrics, filters }: DistancesIndexProps) {
    const { t, i18n } = useTranslation();
    const { hasPermission } = usePermissions();
    const canViewDistance = hasPermission('distances.show');
    const canCreateDistance = hasPermission('distances.create');
    const canEditDistance = hasPermission('distances.edit');
    const canDeleteDistance = hasPermission('distances.destroy');
    const locale = i18n.language || 'en-US';
    const notAvailableLabel = t('distances.fallbacks.notAvailable');
    const unknownLabel = t('distances.fallbacks.unknown');

    const breadcrumbs = React.useMemo<BreadcrumbItem[]>(
        () => [
            {
                title: t('distances.title'),
                href: '/distances',
            },
        ],
        [t],
    );

    const columnDefinitions = React.useMemo<Array<{ id: ColumnKey; label: string; sortKey?: string; align?: 'center' | 'right' }>>(
        () => [
            { id: 'route', label: t('distances.columns.route') },
            { id: 'status', label: t('distances.columns.status'), sortKey: 'status', align: 'center' },
            { id: 'distance_km', label: t('distances.columns.distance'), sortKey: 'distance_km', align: 'right' },
            { id: 'estimated_time_hours', label: t('distances.columns.time'), sortKey: 'estimated_time_hours', align: 'right' },
            { id: 'route_type', label: t('distances.columns.routeType'), sortKey: 'route_type', align: 'center' },
            { id: 'average_speed_kmph', label: t('distances.columns.averageSpeed'), sortKey: 'average_speed_kmph', align: 'right' },
            { id: 'road_quality_index', label: t('distances.columns.roadQuality'), sortKey: 'road_quality_index', align: 'right' },
            { id: 'toll_road', label: t('distances.columns.tollRoad'), align: 'center' },
            { id: 'restricted_for_heavy_vehicles', label: t('distances.columns.heavyVehicle'), align: 'center' },
        ],
        [t],
    );

    const routeTypeOptions = React.useMemo(
        () => [
            { label: t('distances.routeTypes.all'), value: 'all' },
            { label: t('distances.routeTypes.primary'), value: 'primary' },
            { label: t('distances.routeTypes.secondary'), value: 'secondary' },
            { label: t('distances.routeTypes.alternative'), value: 'alternative' },
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

    const formatDistanceValue = React.useCallback(
        (value?: number | string | null): string => {
            const formatted = formatNumberValue(value, 1);
            return formatted === notAvailableLabel ? notAvailableLabel : `${formatted}`;
        },
        [formatNumberValue, notAvailableLabel],
    );

    const formatHourValue = React.useCallback(
        (value?: number | string | null): string => {
            const formatted = formatNumberValue(value, 1);
            return formatted === notAvailableLabel ? notAvailableLabel : `${formatted}`;
        },
        [formatNumberValue, notAvailableLabel],
    );

    const formatSpeedValue = React.useCallback(
        (value?: number | string | null): string => {
            const formatted = formatNumberValue(value, 1);
            return formatted === notAvailableLabel ? notAvailableLabel : `${formatted}`;
        },
        [formatNumberValue, notAvailableLabel],
    );

    const getStatusBadge = React.useCallback(
        (status?: string | null): React.ReactNode => {
            if (!status) {
                return (
                    <Badge variant="outline" className="bg-muted text-muted-foreground">
                        {t('distances.status.unknown')}
                    </Badge>
                );
            }

            const normalized = status.toLowerCase();
            if (normalized === 'active') {
                return (
                    <Badge className="flex w-fit items-center gap-1 border-emerald-200 bg-emerald-100 text-xs text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-900/30 dark:text-emerald-200">
                        {t('distances.status.active')}
                    </Badge>
                );
            }

            if (normalized === 'inactive') {
                return (
                    <Badge className="flex w-fit items-center gap-1 border-slate-200 bg-slate-100 text-xs text-slate-600 dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-300">
                        {t('distances.status.inactive')}
                    </Badge>
                );
            }

            return (
                <Badge variant="outline" className="capitalize">
                    {status}
                </Badge>
            );
        },
        [t],
    );

    const getRouteTypeBadge = React.useCallback(
        (routeType?: string | null): React.ReactNode => {
            if (!routeType) {
                return notAvailableLabel;
            }

            const normalized = routeType.toLowerCase();
            const label = t(`distances.routeTypes.${normalized}`, { defaultValue: routeType });

            return (
                <Badge className="flex w-fit items-center gap-1 border-blue-200 bg-blue-100 text-xs capitalize text-blue-700 dark:border-blue-900/40 dark:bg-blue-900/30 dark:text-blue-200">
                    <CircleDot className="h-3 w-3" />
                    {label}
                </Badge>
            );
        },
        [notAvailableLabel, t],
    );

    const getBooleanBadge = React.useCallback(
        (value?: boolean | null, trueLabel = t('distances.boolean.yes'), falseLabel = t('distances.boolean.no')): React.ReactNode => {
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
        },
        [t],
    );

    const resolveRegionLabel = React.useCallback(
        (place?: PlaceSummary | null): string => {
            const region = place?.woreda?.zone?.region?.name;
            return region ?? notAvailableLabel;
        },
        [notAvailableLabel],
    );

    const [searchTerm, setSearchTerm] = React.useState(filters?.search ?? '');
    const [selectedRouteType, setSelectedRouteType] = React.useState(filters?.routeType ?? 'all');
    const [regionQuery, setRegionQuery] = React.useState(filters?.region ?? '');
    const [zoneQuery, setZoneQuery] = React.useState(filters?.zone ?? '');
    const [woredaQuery, setWoredaQuery] = React.useState(filters?.woreda ?? '');
    const [sortColumn, setSortColumn] = React.useState<string>(filters?.sort ?? 'distance_km');
    const [sortDirection, setSortDirection] = React.useState<'asc' | 'desc'>(filters?.direction ?? 'asc');

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
            routeType?: string;
            region?: string;
            zone?: string;
            woreda?: string;
            sort?: string;
            direction?: 'asc' | 'desc';
            page?: number;
        } = {}) => {
            const hasOverride = (key: keyof typeof overrides) => Object.prototype.hasOwnProperty.call(overrides, key);

            const nextSearch = hasOverride('search')
                ? overrides.search
                : searchTerm.trim()
                    ? searchTerm.trim()
                    : undefined;

            const nextRouteType = hasOverride('routeType')
                ? overrides.routeType
                : selectedRouteType !== 'all'
                    ? selectedRouteType
                    : undefined;

            const coerceOptionalInput = (value?: string) => (value && value.trim() !== '' ? value.trim() : undefined);

            const nextRegion = hasOverride('region') ? overrides.region : coerceOptionalInput(regionQuery);
            const nextZone = hasOverride('zone') ? overrides.zone : coerceOptionalInput(zoneQuery);
            const nextWoreda = hasOverride('woreda') ? overrides.woreda : coerceOptionalInput(woredaQuery);

            const nextSort = hasOverride('sort') ? overrides.sort ?? sortColumn : sortColumn;
            const nextDirection = hasOverride('direction') ? overrides.direction ?? sortDirection : sortDirection;
            const nextPage = hasOverride('page') ? overrides.page : undefined;

            const params: Record<string, string | number | undefined> = {
                search: nextSearch,
                routeType: nextRouteType,
                region: nextRegion,
                zone: nextZone,
                woreda: nextWoreda,
                sort: nextSort,
                direction: nextDirection,
                page: nextPage,
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
        [searchTerm, selectedRouteType, regionQuery, zoneQuery, woredaQuery, sortColumn, sortDirection],
    );

    const handleSearchChange = (value: string) => {
        setSearchTerm(value);
        handleNavigate({ search: value.trim() ? value.trim() : undefined, page: 1 });
    };

    const handleRouteTypeChange = (value: string) => {
        setSelectedRouteType(value);
        handleNavigate({ routeType: value !== 'all' ? value : undefined, page: 1 });
    };

    const handleRegionChange = (value: string) => {
        setRegionQuery(value);
        handleNavigate({ region: value.trim() !== '' ? value : undefined, page: 1 });
    };

    const handleZoneChange = (value: string) => {
        setZoneQuery(value);
        handleNavigate({ zone: value.trim() !== '' ? value : undefined, page: 1 });
    };

    const handleWoredaChange = (value: string) => {
        setWoredaQuery(value);
        handleNavigate({ woreda: value.trim() !== '' ? value : undefined, page: 1 });
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

        const routeLabel = `${selectedDistance.from_place?.name ?? unknownLabel} → ${selectedDistance.to_place?.name ?? unknownLabel}`;
        setIsDeleting(true);

        router.delete(`/distances/${selectedDistance.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                setDeleteDialogOpen(false);
                setSelectedDistance(null);
                setIsDeleting(false);
                toast({
                    title: t('distances.delete.successTitle'),
                    description: t('distances.delete.successDescription', { route: routeLabel }),
                });
            },
            onError: (errors) => {
                setIsDeleting(false);
                const fallback = t('distances.delete.failedDescription');

                if (errors && typeof errors === 'object') {
                    const errorMessages = Object.values(errors)
                        .flatMap((value) => (Array.isArray(value) ? value : [value]))
                        .filter(Boolean)
                        .join('\n');

                    toast({
                        title: t('distances.delete.failedTitle'),
                        description: errorMessages || fallback,
                        variant: 'destructive',
                    });
                } else {
                    toast({
                        title: t('distances.delete.failedTitle'),
                        description: fallback,
                        variant: 'destructive',
                    });
                }
            },
        });
    };

    const statsDefinitions = [
        {
            id: 'total-distances',
            label: t('distances.stats.total.label'),
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
                t('distances.stats.total.description')
            ),
            valueClassName: isLoading ? undefined : 'text-rose-600',
        },
        {
            id: 'average-speed',
            label: t('distances.stats.speed.label'),
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
                t('distances.stats.speed.description')
            ),
            valueClassName: isLoading ? undefined : 'text-indigo-600',
        },
        {
            id: 'road-quality',
            label: t('distances.stats.quality.label'),
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
                t('distances.stats.quality.description')
            ),
            valueClassName: isLoading ? undefined : 'text-emerald-600',
        },
        {
            id: 'seasonal-alerts',
            label: t('distances.stats.seasonal.label'),
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
                t('distances.stats.seasonal.description')
            ),
            valueClassName: isLoading ? undefined : 'text-amber-600',
        },
    ];

    const statsSection = <ListingStatsHeader stats={statsDefinitions} orientation="row" />;

    const tableColumns = React.useMemo(
        () => [
            { id: 'index', label: '#', align: 'center' as const },
            ...columnDefinitions.map((column) => ({
                id: column.id,
                label: column.label,
                sortable: Boolean(column.sortKey),
                sortKey: column.sortKey,
                align: column.align,
            })),
            { id: 'actions', label: t('distances.table.actions'), align: 'center' as const },
        ],
        [columnDefinitions, t],
    );

    const renderColumnValue = React.useCallback((distance: DistanceRecord, column: ColumnKey): React.ReactNode => {
        switch (column) {
            case 'route':
                return (
                    <div className="flex items-start gap-2">
                        <Navigation2 className="mt-0.5 h-4 w-4 text-primary" />
                        <div className="flex flex-col">
                            <span className="font-medium text-foreground">
                                {distance.from_place?.name ?? unknownLabel}
                                <span className="mx-1 text-xs text-muted-foreground">→</span>
                                {distance.to_place?.name ?? unknownLabel}
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
                return getBooleanBadge(Boolean(distance.toll_road), t('distances.flags.toll.true'), t('distances.flags.toll.false'));
            case 'restricted_for_heavy_vehicles':
                return getBooleanBadge(
                    Boolean(distance.restricted_for_heavy_vehicles),
                    t('distances.flags.heavyVehicle.true'),
                    t('distances.flags.heavyVehicle.false'),
                );
            default:
                return notAvailableLabel;
        }
    }, [formatDistanceValue, formatHourValue, formatNumberValue, formatSpeedValue, getBooleanBadge, getRouteTypeBadge, getStatusBadge, notAvailableLabel, resolveRegionLabel, t, unknownLabel]);

    const tableRows = distanceData.length > 0
        ? distanceData.map((distance, index) => (
                  <TableRow key={distance.id} className="hover:bg-muted/50">
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
                              {renderColumnValue(distance, column.id)}
                          </TableCell>
                      ))}
                      <TableCell className="text-center">
                          <ListingRowActionsMenu
                              actions={[
                                  canViewDistance && {
                                      label: t('distances.actions.view'),
                                      icon: <Eye className="h-4 w-4" />,
                                      href: `/distances/${distance.id}`,
                                  },
                                  canEditDistance && {
                                      label: t('distances.actions.edit'),
                                      icon: <Edit className="h-4 w-4" />,
                                      href: `/distances/${distance.id}/edit`,
                                  },
                                  canDeleteDistance && {
                                      label: t('distances.actions.delete'),
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
                    {t('distances.empty.title')}
                    {canCreateDistance && (
                        <Link href="/distances/create" className="ml-1 text-primary underline">
                            {t('distances.empty.createAction')}
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

    const mobileContent = (
        <ListingMobileItemList
            items={mobileItems}
            getKey={(item) => item.record.id}
            renderTitle={(item) => (
                <div className="flex items-center gap-2">
                    <span className="text-xs uppercase tracking-wide text-muted-foreground">
                        {t('distances.mobile.position', { value: item.position })}
                    </span>
                    <span className="text-base font-semibold text-foreground">
                        {item.record.from_place?.name ?? unknownLabel}
                        <span className="mx-1 text-xs text-muted-foreground">→</span>
                        {item.record.to_place?.name ?? unknownLabel}
                    </span>
                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
            )}
            renderSubtitle={(item) => `${resolveRegionLabel(item.record.from_place)} • ${resolveRegionLabel(item.record.to_place)}`}
            renderContent={(item) => (
                <div className="space-y-3 text-sm text-muted-foreground">
                    <div className="flex items-center justify-between">
                        <span className="font-medium text-slate-600 dark:text-slate-300">
                            {t('distances.mobile.status')}
                        </span>
                        <span className="text-right text-slate-900 dark:text-slate-100">{getStatusBadge(item.record.status)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="font-medium text-slate-600 dark:text-slate-300">
                            {t('distances.mobile.distance')}
                        </span>
                        <span className="text-right text-slate-900 dark:text-slate-100">{formatDistanceValue(item.record.distance_km)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="font-medium text-slate-600 dark:text-slate-300">
                            {t('distances.mobile.time')}
                        </span>
                        <span className="text-right text-slate-900 dark:text-slate-100">{formatHourValue(item.record.estimated_time_hours)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="font-medium text-slate-600 dark:text-slate-300">
                            {t('distances.mobile.routeType')}
                        </span>
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
                                {t('distances.actions.view')}
                            </Link>
                        </Button>
                    )}
                    {canEditDistance && (
                        <Button asChild size="sm" variant="secondary" className="flex-1 sm:flex-none">
                            <Link href={`/distances/${item.record.id}/edit`}>
                                <Edit className="mr-2 h-4 w-4" />
                                {t('distances.actions.edit')}
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
                            {t('distances.actions.delete')}
                        </Button>
                    )}
                </div>
            )}
            emptyState={(
                <div className="py-8 text-center text-muted-foreground">
                    {t('distances.empty.title')}
                    {canCreateDistance && (
                        <Link href="/distances/create" className="ml-1 text-primary underline">
                            {t('distances.empty.createAction')}
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
                placeholder: t('distances.filters.searchPlaceholder'),
                onChange: handleSearchChange,
                icon: <Search className="h-4 w-4" />,
            }}
        >
            <Select value={selectedRouteType} onValueChange={handleRouteTypeChange}>
                <SelectTrigger className="w-full min-w-[150px] sm:w-auto">
                    <SelectValue placeholder={t('distances.filters.routeTypePlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                    {routeTypeOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                            {option.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>

            <Input
                className="w-40"
                placeholder={t('distances.filters.regionPlaceholder')}
                value={regionQuery}
                onChange={(event) => handleRegionChange(event.target.value)}
            />

            <Input
                className="w-40"
                placeholder={t('distances.filters.zonePlaceholder')}
                value={zoneQuery}
                onChange={(event) => handleZoneChange(event.target.value)}
            />

            <Input
                className="w-40"
                placeholder={t('distances.filters.woredaPlaceholder')}
                value={woredaQuery}
                onChange={(event) => handleWoredaChange(event.target.value)}
            />
        </ListingFilterBar>
    );

    const headerActions = canCreateDistance ? (
        <Button asChild>
            <Link href="/distances/create">
                <Plus className="mr-2 h-4 w-4" />
                {t('distances.actions.add')}
            </Link>
        </Button>
    ) : null;

    return (
        <>
            <ListPageLayout
                headTitle={t('distances.title')}
                title={t('distances.index.title')}
                description={
                    totalRecords === 0
                        ? t('distances.index.descriptionEmpty')
                        : t('distances.index.description', {
                              count: formatCount(totalRecords),
                              plural: totalRecords === 1 ? '' : 's',
                          })
                }
                breadcrumbs={breadcrumbs}
                actions={headerActions}
                stats={statsSection}
                tableTitle={t('distances.table.title')}
                tableDescription={t('distances.table.description')}
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
                    <div className="relative">
                        <ListingTableShell
                            columns={tableColumns}
                            sort={{ column: sortColumn, direction: sortDirection, onToggle: handleSort }}
                        >
                            {tableRows}
                        </ListingTableShell>

                        {isLoading && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-background/80 backdrop-blur-sm">
                                <img src="/images/loading-spinner.svg" alt={t('distances.loading.alt')} className="h-12 w-12" />
                                <span className="text-sm text-muted-foreground">{t('distances.loading.message')}</span>
                            </div>
                        )}
                    </div>
                </div>

                <div className="relative space-y-3 md:hidden">
                    {mobileContent}

                    {isLoading && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-background/80 backdrop-blur-sm">
                            <img src="/images/loading-spinner.svg" alt={t('distances.loading.alt')} className="h-10 w-10" />
                            <span className="text-sm text-muted-foreground">{t('distances.loading.message')}</span>
                        </div>
                    )}
                </div>
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
                title={t('distances.delete.title')}
                description={t('distances.delete.description')}
                itemName={
                    selectedDistance
                        ? `${selectedDistance.from_place?.name ?? unknownLabel} → ${selectedDistance.to_place?.name ?? unknownLabel}`
                        : undefined
                }
                onConfirm={handleDeleteConfirm}
                isLoading={isDeleting}
            />
        </>
    );
}
