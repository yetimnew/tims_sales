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
    MapPin,
    Building2,
    Users,
    Target,
    CheckCircle,
    XCircle,
    BadgeCheck,
    Navigation,
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
    | 'location'
    | 'coordinates'
    | 'population'
    | 'accessibility_score'
    | 'is_logistics_hub'
    | 'origin_performances_count'
    | 'destination_performances_count';

interface RegionSummary {
    id: number;
    name: string;
}

interface ZoneSummary {
    id: number;
    name: string;
    region?: RegionSummary | null;
}

interface WoredaSummary {
    id: number;
    name: string;
    zone?: ZoneSummary | null;
}

interface PlaceData {
    id: number;
    name: string;
    code?: string | null;
    status: 'active' | 'inactive' | string;
    latitude?: number | string | null;
    longitude?: number | string | null;
    elevation_m?: number | string | null;
    population?: number | string | null;
    is_logistics_hub?: boolean | null;
    accessibility_score?: number | string | null;
    origin_performances_count?: number | string | null;
    destination_performances_count?: number | string | null;
    woreda?: WoredaSummary | null;
    created_at?: string | null;
}

interface PlacesIndexProps {
    places: {
        data: PlaceData[];
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
        hubCount?: number;
        totalPopulation?: number;
        averageAccessibility?: number;
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

const SKELETON_FLAG_KEY = 'places.index.shouldShowSkeleton';

export default function PlacesIndex({ places, metrics, filters, statusOptions, perPageOptions }: PlacesIndexProps) {
    const { t, i18n } = useTranslation();
    const { hasPermission } = usePermissions();
    const canViewPlace = hasPermission('places.show');
    const canCreatePlace = hasPermission('places.create');
    const canEditPlace = hasPermission('places.edit');
    const canDeletePlace = hasPermission('places.destroy');
    const locale = i18n.language || 'en-US';
    const notAvailableLabel = t('places.fallbacks.notAvailable');

    const breadcrumbs = React.useMemo<BreadcrumbItem[]>(
        () => [
            {
                title: t('places.title'),
                href: '/places',
            },
        ],
        [t],
    );

    const columnDefinitions = React.useMemo<Array<{ id: ColumnKey; label: string; sortKey?: string; align?: 'center' | 'right' }>>(
        () => [
            { id: 'name', label: t('places.columns.name'), sortKey: 'name' },
            { id: 'code', label: t('places.columns.code'), sortKey: 'code' },
            { id: 'status', label: t('places.columns.status'), sortKey: 'status', align: 'center' },
            { id: 'location', label: t('places.columns.location') },
            { id: 'coordinates', label: t('places.columns.coordinates') },
            { id: 'population', label: t('places.columns.population'), sortKey: 'population', align: 'right' },
            { id: 'accessibility_score', label: t('places.columns.accessibility'), sortKey: 'accessibility_score', align: 'center' },
            { id: 'is_logistics_hub', label: t('places.columns.logisticsHub'), sortKey: 'is_logistics_hub', align: 'center' },
            { id: 'origin_performances_count', label: t('places.columns.originPerformance'), sortKey: 'origin_performances_count', align: 'right' },
            {
                id: 'destination_performances_count',
                label: t('places.columns.destinationPerformance'),
                sortKey: 'destination_performances_count',
                align: 'right',
            },
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

    const formatCoordinate = React.useCallback(
        (value?: number | string | null): string | undefined => {
            if (value === null || value === undefined || value === '') {
                return undefined;
            }

            const numeric = Number(value);
            if (!Number.isFinite(numeric)) {
                return undefined;
            }

            return numeric.toFixed(4);
        },
        [],
    );

    const getStatusBadge = React.useCallback(
        (status?: string | null): React.ReactNode => {
            if (!status) {
                return (
                    <Badge variant="outline" className="bg-muted text-muted-foreground">
                        {t('places.status.unknown')}
                    </Badge>
                );
            }

            const normalized = status.toLowerCase();
            if (normalized === 'active') {
                return (
                    <Badge className="flex items-center gap-1 border-emerald-200 bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:border-emerald-900/50 dark:bg-emerald-900/30 dark:text-emerald-200">
                        <CheckCircle className="h-3 w-3" /> {t('places.status.active')}
                    </Badge>
                );
            }

            if (normalized === 'inactive') {
                return (
                    <Badge className="flex items-center gap-1 border-slate-300 bg-slate-200 text-slate-700 hover:bg-slate-300 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-200">
                        <XCircle className="h-3 w-3" /> {t('places.status.inactive')}
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

    const getHubBadge = React.useCallback(
        (flag?: boolean | null): React.ReactNode => {
            if (!flag) {
                return (
                    <Badge className="w-fit border-slate-200 bg-slate-100 text-xs text-slate-600 dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-300">
                        {t('places.hub.standard')}
                    </Badge>
                );
            }

            return (
                <Badge className="flex w-fit items-center gap-1 border-amber-200 bg-amber-100 text-xs text-amber-800 dark:border-amber-900/40 dark:bg-amber-900/30 dark:text-amber-200">
                    <BadgeCheck className="h-3 w-3" /> {t('places.hub.hub')}
                </Badge>
            );
        },
        [t],
    );

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

    const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
    const [selectedPlace, setSelectedPlace] = React.useState<PlaceData | null>(null);
    const [isDeleting, setIsDeleting] = React.useState(false);

    const isDataReady = Array.isArray(places?.data);
    const { isLoading } = useListingLoading({
        storageKey: SKELETON_FLAG_KEY,
        isDataReady,
        onlySamePath: true,
        targetPath: '/places',
        initialIsLoading: true,
    });

    React.useEffect(() => {
        setPerPage(String(resolvedPerPage));
    }, [resolvedPerPage]);

    const placeData = React.useMemo(() => {
        const records = places?.data;
        return Array.isArray(records) ? records : [];
    }, [places?.data]);
    const totalRecords = places?.total ?? placeData.length ?? 0;
    const hubCount = metrics?.hubCount ?? 0;
    const totalPopulation = metrics?.totalPopulation ?? 0;
    const averageAccessibility = metrics?.averageAccessibility ?? 0;
    const rowOffset = Math.max((places?.from ?? 1) - 1, 0);

    const statusFilterOptions = React.useMemo(
        () =>
            (statusOptions?.length
                ? statusOptions
                : [
                      { label: t('places.status.active'), value: 'active' },
                      { label: t('places.status.inactive'), value: 'inactive' },
                  ]) || [],
        [statusOptions, t],
    );

    const perPageSelectOptions = React.useMemo(
        () =>
            availablePerPageOptions.map((option) => ({
                value: String(option),
                label: t('places.filters.perPageOption', { value: option }),
            })),
        [availablePerPageOptions, t],
    );

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

            router.get('/places', params, { preserveState: true, replace: false });
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

    const handleDeleteClick = (place: PlaceData) => {
        setSelectedPlace(place);
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = () => {
        if (!selectedPlace) {
            return;
        }

        const name = selectedPlace.name;
        setIsDeleting(true);

        router.delete(`/places/${selectedPlace.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                setDeleteDialogOpen(false);
                setSelectedPlace(null);
                setIsDeleting(false);
                toast({
                    title: t('places.delete.successTitle'),
                    description: t('places.delete.successDescription', { name }),
                });
            },
            onError: (errors) => {
                setIsDeleting(false);
                const fallback = t('places.delete.failedDescription');

                if (errors && typeof errors === 'object') {
                    const errorMessages = Object.values(errors)
                        .flatMap((value) => (Array.isArray(value) ? value : [value]))
                        .filter(Boolean)
                        .join('\n');

                    toast({
                        title: t('places.delete.failedTitle'),
                        description: errorMessages || fallback,
                        variant: 'destructive',
                    });
                } else {
                    toast({
                        title: t('places.delete.failedTitle'),
                        description: fallback,
                        variant: 'destructive',
                    });
                }
            },
        });
    };

    const statsDefinitions = [
        {
            id: 'total-places',
            label: t('places.stats.total.label'),
            icon: <MapPin className="h-3.5 w-3.5 text-rose-500" />,
            className: 'min-w-[220px] flex-shrink-0',
            value: isLoading ? (
                <Skeleton className="h-3.5 w-24" aria-hidden="true" />
            ) : (
                formatCount(totalRecords)
            ),
            description: isLoading ? (
                <Skeleton className="h-3 w-32" aria-hidden="true" />
            ) : (
                t('places.stats.total.description')
            ),
            valueClassName: isLoading ? undefined : 'text-rose-600',
        },
        {
            id: 'logistics-hubs',
            label: t('places.stats.hubs.label'),
            icon: <Building2 className="h-3.5 w-3.5 text-emerald-500" />,
            className: 'min-w-[220px] flex-shrink-0',
            value: isLoading ? (
                <Skeleton className="h-3.5 w-16" aria-hidden="true" />
            ) : (
                formatCount(hubCount)
            ),
            description: isLoading ? (
                <Skeleton className="h-3 w-28" aria-hidden="true" />
            ) : (
                t('places.stats.hubs.description')
            ),
            valueClassName: isLoading ? undefined : 'text-emerald-600',
        },
        {
            id: 'population-reach',
            label: t('places.stats.population.label'),
            icon: <Users className="h-3.5 w-3.5 text-indigo-500" />,
            className: 'min-w-[220px] flex-shrink-0',
            value: isLoading ? (
                <Skeleton className="h-3.5 w-24" aria-hidden="true" />
            ) : (
                formatCount(totalPopulation)
            ),
            description: isLoading ? (
                <Skeleton className="h-3 w-32" aria-hidden="true" />
            ) : (
                t('places.stats.population.description')
            ),
            valueClassName: isLoading ? undefined : 'text-indigo-600',
        },
        {
            id: 'accessibility-average',
            label: t('places.stats.accessibility.label'),
            icon: <Target className="h-3.5 w-3.5 text-amber-500" />,
            className: 'min-w-[220px] flex-shrink-0',
            value: isLoading ? (
                <Skeleton className="h-3.5 w-16" aria-hidden="true" />
            ) : (
                formatNumberValue(averageAccessibility, 1)
            ),
            description: isLoading ? (
                <Skeleton className="h-3 w-28" aria-hidden="true" />
            ) : (
                t('places.stats.accessibility.description')
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
            { id: 'actions', label: t('places.table.actions'), align: 'center' as const },
        ],
        [columnDefinitions, t],
    );

    const renderColumnValue = React.useCallback((place: PlaceData, column: ColumnKey): React.ReactNode => {
        switch (column) {
            case 'name':
                return (
                    <div className="flex items-center gap-2">
                        <Navigation className="h-4 w-4 text-primary" />
                        <div className="flex flex-col">
                            <span className="font-medium text-foreground">{place.name}</span>
                            {place.code && (
                                <span className="text-xs text-muted-foreground">
                                    {t('places.table.codePrefix', { code: place.code })}
                                </span>
                            )}
                        </div>
                    </div>
                );
            case 'code':
                return place.code || notAvailableLabel;
            case 'status':
                return getStatusBadge(place.status);
            case 'location':
                return (
                    <div className="flex flex-col text-sm leading-tight">
                        <span className="font-medium text-foreground">{place.woreda?.name || notAvailableLabel}</span>
                        {place.woreda?.zone && (
                            <span className="text-xs text-muted-foreground">
                                {place.woreda.zone.name}
                                {place.woreda.zone.region?.name ? `, ${place.woreda.zone.region.name}` : ''}
                            </span>
                        )}
                    </div>
                );
            case 'coordinates': {
                const lat = formatCoordinate(place.latitude);
                const lng = formatCoordinate(place.longitude);
                return lat && lng ? `${lat}, ${lng}` : notAvailableLabel;
            }
            case 'population':
                return formatNumberValue(place.population);
            case 'accessibility_score':
                return place.accessibility_score !== null && place.accessibility_score !== undefined
                    ? formatNumberValue(place.accessibility_score, 1)
                    : notAvailableLabel;
            case 'is_logistics_hub':
                return getHubBadge(place.is_logistics_hub);
            case 'origin_performances_count':
                return formatNumberValue(place.origin_performances_count ?? 0);
            case 'destination_performances_count':
                return formatNumberValue(place.destination_performances_count ?? 0);
            default:
                return notAvailableLabel;
        }
    }, [formatCoordinate, formatNumberValue, getHubBadge, getStatusBadge, notAvailableLabel, t]);

    const tableRows = isLoading
        ? Array.from({ length: 8 }).map((_, index) => (
              <TableRow key={`skeleton-${index}`} aria-hidden="true">
                  <TableCell className="text-center">
                      <Skeleton className="h-4 w-6 mx-auto" />
                  </TableCell>
                  <TableCell>
                      <div className="flex items-center gap-2">
                          <Skeleton className="h-4 w-4 rounded" />
                          <div className="flex flex-col gap-2">
                              <Skeleton className="h-4 w-32" />
                              <Skeleton className="h-3 w-20" />
                          </div>
                      </div>
                  </TableCell>
                  <TableCell>
                      <Skeleton className="h-4 w-16" />
                  </TableCell>
                  <TableCell className="text-center">
                      <Skeleton className="h-6 w-20 mx-auto rounded-full" />
                  </TableCell>
                  <TableCell>
                      <Skeleton className="h-4 w-32" />
                  </TableCell>
                  <TableCell>
                      <Skeleton className="h-4 w-24" />
                  </TableCell>
                  <TableCell className="text-right">
                      <Skeleton className="h-4 w-20 ml-auto" />
                  </TableCell>
                  <TableCell className="text-right">
                      <Skeleton className="h-4 w-16 ml-auto" />
                  </TableCell>
                  <TableCell className="text-center">
                      <Skeleton className="h-4 w-12 mx-auto" />
                  </TableCell>
                  <TableCell className="text-center">
                      <Skeleton className="h-6 w-20 mx-auto rounded-full" />
                  </TableCell>
                  <TableCell className="text-right">
                      <Skeleton className="h-4 w-12 ml-auto" />
                  </TableCell>
                  <TableCell className="text-right">
                      <Skeleton className="h-4 w-12 ml-auto" />
                  </TableCell>
                  <TableCell className="text-center">
                      <Skeleton className="h-8 w-8 mx-auto rounded" />
                  </TableCell>
              </TableRow>
          ))
        : placeData.length > 0
            ? placeData.map((place, index) => (
                  <TableRow key={place.id} className="hover:bg-muted/50">
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
                              {renderColumnValue(place, column.id)}
                          </TableCell>
                      ))}
                      <TableCell className="text-center">
                          <ListingRowActionsMenu
                              actions={[
                                  canViewPlace && {
                                      label: t('places.actions.view'),
                                      icon: <Eye className="h-4 w-4" />,
                                      href: `/places/${place.id}`,
                                  },
                                  canEditPlace && {
                                      label: t('places.actions.edit'),
                                      icon: <Edit className="h-4 w-4" />,
                                      href: `/places/${place.id}/edit`,
                                  },
                                  canDeletePlace && {
                                      label: t('places.actions.delete'),
                                      icon: <Trash2 className="h-4 w-4" />,
                                      danger: true,
                                      disabled: isDeleting && selectedPlace?.id === place.id,
                                      onSelect: () => handleDeleteClick(place),
                                  },
                              ]}
                          />
                      </TableCell>
                  </TableRow>
              ))
            : (
                <TableRow>
                    <TableCell colSpan={tableColumns.length} className="py-8 text-center text-muted-foreground">
                        {t('places.empty.title')}
                        {canCreatePlace && (
                            <Link href="/places/create" className="ml-1 text-primary underline">
                                {t('places.empty.createAction')}
                            </Link>
                        )}
                    </TableCell>
                </TableRow>
            );

    const mobileItems = React.useMemo(
        () =>
            placeData.map((place, index) => ({
                record: place,
                position: rowOffset + index + 1,
            })),
        [placeData, rowOffset],
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
                        <Skeleton className="h-6 w-20 rounded-full" />
                    </div>
                    <div className="flex items-center justify-between">
                        <Skeleton className="h-3 w-12" />
                        <Skeleton className="h-6 w-20 rounded-full" />
                    </div>
                    <div className="flex items-center justify-between">
                        <Skeleton className="h-3 w-24" />
                        <Skeleton className="h-3 w-24" />
                    </div>
                    <div className="flex items-center justify-between">
                        <Skeleton className="h-3 w-28" />
                        <Skeleton className="h-3 w-16" />
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
                        {t('places.mobile.position', { value: item.position })}
                    </span>
                    <span className="text-base font-semibold text-foreground">{item.record.name}</span>
                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
            )}
            renderSubtitle={(item) => item.record.woreda?.name || t('places.mobile.noWoreda')}
            renderContent={(item) => (
                <div className="space-y-3 text-sm text-muted-foreground">
                    <div className="flex items-center justify-between">
                        <span className="font-medium text-slate-600 dark:text-slate-300">
                            {t('places.mobile.status')}
                        </span>
                        <span className="text-right text-slate-900 dark:text-slate-100">
                            {getStatusBadge(item.record.status)}
                        </span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="font-medium text-slate-600 dark:text-slate-300">
                            {t('places.mobile.hub')}
                        </span>
                        <span className="text-right text-slate-900 dark:text-slate-100">
                            {getHubBadge(item.record.is_logistics_hub)}
                        </span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="font-medium text-slate-600 dark:text-slate-300">
                            {t('places.mobile.population')}
                        </span>
                        <span className="text-right text-slate-900 dark:text-slate-100">
                            {formatNumberValue(item.record.population)}
                        </span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="font-medium text-slate-600 dark:text-slate-300">
                            {t('places.mobile.accessibility')}
                        </span>
                        <span className="text-right text-slate-900 dark:text-slate-100">
                            {item.record.accessibility_score !== null && item.record.accessibility_score !== undefined
                                ? formatNumberValue(item.record.accessibility_score, 1)
                                : notAvailableLabel}
                        </span>
                    </div>
                </div>
            )}
            renderFooter={(item) => (
                <div className="flex w-full flex-wrap items-center justify-end gap-2">
                    {canViewPlace && (
                        <Button asChild size="sm" variant="outline" className="flex-1 sm:flex-auto">
                            <Link href={`/places/${item.record.id}`}>
                                <Eye className="mr-2 h-4 w-4" />
                                {t('places.actions.view')}
                            </Link>
                        </Button>
                    )}
                    {canEditPlace && (
                        <Button asChild size="sm" variant="secondary" className="flex-1 sm:flex-none">
                            <Link href={`/places/${item.record.id}/edit`}>
                                <Edit className="mr-2 h-4 w-4" />
                                {t('places.actions.edit')}
                            </Link>
                        </Button>
                    )}
                    {canDeletePlace && (
                        <Button
                            size="sm"
                            variant="destructive"
                            className="flex-1 sm:flex-none"
                            onClick={() => handleDeleteClick(item.record)}
                            disabled={isDeleting && selectedPlace?.id === item.record.id}
                        >
                            <Trash2 className="mr-2 h-4 w-4" />
                            {t('places.actions.delete')}
                        </Button>
                    )}
                </div>
            )}
            emptyState={(
                <div className="py-8 text-center text-muted-foreground">
                    {t('places.empty.title')}
                    {canCreatePlace && (
                        <Link href="/places/create" className="ml-1 text-primary underline">
                            {t('places.empty.createAction')}
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
                placeholder: t('places.filters.searchPlaceholder'),
                onChange: handleSearchChange,
                icon: <Search className="h-4 w-4" />,
            }}
            perPage={{
                value: perPage,
                label: t('places.filters.rowsLabel'),
                onChange: handlePerPageChange,
                options: perPageSelectOptions,
            }}
        >
            <Select value={selectedStatus} onValueChange={handleStatusChange}>
                <SelectTrigger className="w-full min-w-[160px] sm:w-auto">
                    <SelectValue placeholder={t('places.filters.statusPlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">{t('places.filters.allStatuses')}</SelectItem>
                    {statusFilterOptions.map((option) => (
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
            {canCreatePlace && (
                <Button asChild>
                    <Link href="/places/create">
                        <Plus className="mr-2 h-4 w-4" />
                        {t('places.actions.add')}
                    </Link>
                </Button>
            )}
        </>
    );

    return (
        <>
            <ListPageLayout
                headTitle={t('places.title')}
                title={t('places.title')}
                description={t('places.description', {
                    count: formatCount(totalRecords),
                    plural: totalRecords === 1 ? '' : 's',
                })}
                breadcrumbs={breadcrumbs}
                actions={headerActions}
                stats={statsSection}
                tableTitle={t('places.table.title')}
                tableDescription={t('places.table.description')}
                tableHeaderExtras={tableHeaderExtras}
                pagination={
                    !isLoading && places?.links ? (
                        <ListingPaginationFooter
                            className="mt-4"
                            links={places.links}
                            from={places.from ?? undefined}
                            to={places.to ?? undefined}
                            total={places.total ?? undefined}
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
                        setSelectedPlace(null);
                        setIsDeleting(false);
                    }
                }}
                title={t('places.delete.title')}
                description={t('places.delete.description')}
                itemName={selectedPlace ? selectedPlace.name : undefined}
                onConfirm={handleDeleteConfirm}
                isLoading={isDeleting}
            />
        </>
    );
}
