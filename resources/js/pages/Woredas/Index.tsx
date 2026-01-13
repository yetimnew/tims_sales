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
    Layers,
    Users,
    Target,
    MapPin,
    CheckCircle,
    XCircle,
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
    | 'zone'
    | 'region'
    | 'administrative_center'
    | 'population'
    | 'area_km2'
    | 'accessibility_score'
    | 'places_count';

interface RegionSummary {
    id: number;
    name: string;
}

interface ZoneSummary {
    id: number;
    name: string;
    region?: RegionSummary | null;
}

interface WoredaData {
    id: number;
    name: string;
    code?: string | null;
    status: 'active' | 'inactive' | string;
    zone?: ZoneSummary | null;
    administrative_center?: string | null;
    population?: number | string | null;
    area_km2?: number | string | null;
    accessibility_score?: number | string | null;
    places_count?: number | null;
    created_at?: string | null;
}

interface WoredasIndexProps {
    woredas: {
        data: WoredaData[];
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
        totalPopulation?: number;
        averageAccessibility?: number;
        roadNoteCount?: number;
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

const SKELETON_FLAG_KEY = 'woredas.index.shouldShowSkeleton';

export default function WoredasIndex({ woredas, metrics, filters, statusOptions, perPageOptions }: WoredasIndexProps) {
    const { t, i18n } = useTranslation();
    const { hasPermission } = usePermissions();
    const canViewWoreda = hasPermission('woredas.show');
    const canCreateWoreda = hasPermission('woredas.create');
    const canEditWoreda = hasPermission('woredas.edit');
    const canDeleteWoreda = hasPermission('woredas.destroy');
    const locale = i18n.language || 'en-US';
    const notAvailableLabel = t('woredas.fallbacks.notAvailable');

    const breadcrumbs = React.useMemo<BreadcrumbItem[]>(
        () => [
            {
                title: t('woredas.title'),
                href: '/woredas',
            },
        ],
        [t],
    );

    const columnDefinitions = React.useMemo<Array<{ id: ColumnKey; label: string; sortKey?: string; align?: 'center' | 'right' }>>(
        () => [
            { id: 'name', label: t('woredas.columns.name'), sortKey: 'name' },
            { id: 'code', label: t('woredas.columns.code'), sortKey: 'code' },
            { id: 'status', label: t('woredas.columns.status'), sortKey: 'status', align: 'center' },
            { id: 'zone', label: t('woredas.columns.zone'), sortKey: 'zone_id' },
            { id: 'region', label: t('woredas.columns.region') },
            { id: 'administrative_center', label: t('woredas.columns.adminCenter'), sortKey: 'administrative_center' },
            { id: 'population', label: t('woredas.columns.population'), sortKey: 'population', align: 'right' },
            { id: 'area_km2', label: t('woredas.columns.area'), sortKey: 'area_km2', align: 'right' },
            { id: 'accessibility_score', label: t('woredas.columns.accessibility'), sortKey: 'accessibility_score', align: 'center' },
            { id: 'places_count', label: t('woredas.columns.places'), sortKey: 'places_count', align: 'center' },
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
                        {t('woredas.status.unknown')}
                    </Badge>
                );
            }

            const normalized = status.toLowerCase();
            if (normalized === 'active') {
                return (
                    <Badge className="flex items-center gap-1 border-emerald-200 bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:border-emerald-900/50 dark:bg-emerald-900/30 dark:text-emerald-200">
                        <CheckCircle className="h-3 w-3" /> {t('woredas.status.active')}
                    </Badge>
                );
            }

            if (normalized === 'inactive') {
                return (
                    <Badge className="flex items-center gap-1 border-slate-300 bg-slate-200 text-slate-700 hover:bg-slate-300 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-200">
                        <XCircle className="h-3 w-3" /> {t('woredas.status.inactive')}
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
    const [selectedWoreda, setSelectedWoreda] = React.useState<WoredaData | null>(null);
    const [isDeleting, setIsDeleting] = React.useState(false);

    const isDataReady = Array.isArray(woredas?.data);
    const { isLoading } = useListingLoading({
        storageKey: SKELETON_FLAG_KEY,
        isDataReady,
        onlySamePath: true,
        targetPath: '/woredas',
        initialIsLoading: true,
    });

    React.useEffect(() => {
        setPerPage(String(resolvedPerPage));
    }, [resolvedPerPage]);

    const woredaData = React.useMemo(() => {
        const records = woredas?.data;
        return Array.isArray(records) ? records : [];
    }, [woredas?.data]);
    const totalRecords = woredas?.total ?? woredaData.length ?? 0;
    const activeCount = metrics?.activeCount ?? 0;
    const inactiveCount = metrics?.inactiveCount ?? 0;
    const totalPopulation = metrics?.totalPopulation ?? 0;
    const averageAccessibility = metrics?.averageAccessibility ?? 0;
    const roadNoteCount = metrics?.roadNoteCount ?? 0;

    const rowOffset = Math.max((woredas?.from ?? 1) - 1, 0);

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

            router.get('/woredas', params, { preserveState: true, replace: false });
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

    const handleDeleteClick = (woreda: WoredaData) => {
        setSelectedWoreda(woreda);
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = () => {
        if (!selectedWoreda) {
            return;
        }

        setIsDeleting(true);

        router.delete(`/woredas/${selectedWoreda.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                setDeleteDialogOpen(false);
                setSelectedWoreda(null);
                setIsDeleting(false);
                toast({
                    title: t('woredas.delete.successTitle'),
                    description: t('woredas.delete.successDescription', { name: selectedWoreda.name }),
                });
            },
            onError: (errors) => {
                setIsDeleting(false);

                const fallback = t('woredas.delete.failedDescription');
                if (errors && typeof errors === 'object') {
                    const errorMessages = Object.values(errors)
                        .flatMap((value) => (Array.isArray(value) ? value : [value]))
                        .filter(Boolean)
                        .join('\n');

                    toast({
                        title: t('woredas.delete.failedTitle'),
                        description: errorMessages || fallback,
                        variant: 'destructive',
                    });
                } else {
                    toast({
                        title: t('woredas.delete.failedTitle'),
                        description: fallback,
                        variant: 'destructive',
                    });
                }
            },
        });
    };

    const statsDefinitions = [
        {
            id: 'total-woredas',
            label: t('woredas.stats.total.label'),
            icon: <Layers className="h-3.5 w-3.5 text-sky-600" />,
            className: 'min-w-[220px] flex-shrink-0',
            value: isLoading ? (
                <Skeleton className="h-3.5 w-20" aria-hidden="true" />
            ) : (
                formatCount(totalRecords)
            ),
            description: isLoading ? (
                <Skeleton className="h-3 w-32" aria-hidden="true" />
            ) : (
                t('woredas.stats.total.description', { count: formatCount(activeCount) })
            ),
            valueClassName: isLoading ? undefined : 'text-sky-600',
        },
        {
            id: 'inactive-woredas',
            label: t('woredas.stats.inactive.label'),
            icon: <XCircle className="h-3.5 w-3.5 text-rose-600" />,
            className: 'min-w-[220px] flex-shrink-0',
            value: isLoading ? (
                <Skeleton className="h-3.5 w-16" aria-hidden="true" />
            ) : (
                formatCount(inactiveCount)
            ),
            description: isLoading ? (
                <Skeleton className="h-3 w-24" aria-hidden="true" />
            ) : (
                t('woredas.stats.inactive.description')
            ),
            valueClassName: isLoading ? undefined : 'text-rose-600',
        },
        {
            id: 'population-reach',
            label: t('woredas.stats.population.label'),
            icon: <Users className="h-3.5 w-3.5 text-emerald-600" />,
            className: 'min-w-[220px] flex-shrink-0',
            value: isLoading ? (
                <Skeleton className="h-3.5 w-24" aria-hidden="true" />
            ) : (
                formatCount(totalPopulation)
            ),
            description: isLoading ? (
                <Skeleton className="h-3 w-28" aria-hidden="true" />
            ) : (
                t('woredas.stats.population.description')
            ),
            valueClassName: isLoading ? undefined : 'text-emerald-600',
        },
        {
            id: 'accessibility-index',
            label: t('woredas.stats.accessibility.label'),
            icon: <Target className="h-3.5 w-3.5 text-indigo-500" />,
            className: 'min-w-[220px] flex-shrink-0',
            value: isLoading ? (
                <Skeleton className="h-3.5 w-16" aria-hidden="true" />
            ) : (
                formatNumberValue(averageAccessibility, 1)
            ),
            description: isLoading ? (
                <Skeleton className="h-3 w-28" aria-hidden="true" />
            ) : (
                t('woredas.stats.accessibility.description', { count: formatCount(roadNoteCount) })
            ),
            valueClassName: isLoading ? undefined : 'text-indigo-600',
        },
    ];

    const statsSection = <ListingStatsHeader stats={statsDefinitions} orientation="row" />;

    const perPageSelectOptions = React.useMemo(
        () =>
            availablePerPageOptions.map((option) => ({
                value: String(option),
                label: t('woredas.filters.perPageOption', { value: option }),
            })),
        [availablePerPageOptions, t],
    );

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
            { id: 'actions', label: t('woredas.table.actions'), align: 'center' as const },
        ],
        [columnDefinitions, t],
    );

    const renderColumnValue = React.useCallback(
        (woreda: WoredaData, column: ColumnKey): React.ReactNode => {
            switch (column) {
                case 'name':
                    return (
                        <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-primary" />
                            <div className="flex flex-col">
                                <span className="font-medium text-foreground">{woreda.name}</span>
                                {woreda.administrative_center && (
                                    <span className="text-xs text-muted-foreground">{woreda.administrative_center}</span>
                                )}
                            </div>
                        </div>
                    );
                case 'code':
                    return woreda.code || notAvailableLabel;
                case 'status':
                    return getStatusBadge(woreda.status);
                case 'zone':
                    return woreda.zone?.name || notAvailableLabel;
                case 'region':
                    return woreda.zone?.region?.name || notAvailableLabel;
                case 'administrative_center':
                    return woreda.administrative_center || notAvailableLabel;
                case 'population':
                    return formatNumberValue(woreda.population);
                case 'area_km2':
                    return formatNumberValue(woreda.area_km2, 2);
                case 'accessibility_score':
                    return woreda.accessibility_score !== null && woreda.accessibility_score !== undefined
                        ? formatNumberValue(woreda.accessibility_score, 1)
                        : notAvailableLabel;
                case 'places_count':
                    return formatNumberValue(woreda.places_count ?? 0);
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
                            <Skeleton className="h-4 w-20" />
                        </TableCell>
                    ))}
                    <TableCell className="text-center">
                        <Skeleton className="h-8 w-8 mx-auto rounded" />
                    </TableCell>
                </TableRow>
            ))
        : woredaData.length > 0
            ? woredaData.map((woreda, index) => (
                  <TableRow key={woreda.id} className="hover:bg-muted/50">
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
                              {renderColumnValue(woreda, column.id)}
                          </TableCell>
                      ))}
                      <TableCell className="text-center">
                          <ListingRowActionsMenu
                              actions={[
                                  canViewWoreda && {
                                      label: t('woredas.actions.view'),
                                      icon: <Eye className="h-4 w-4" />,
                                      href: `/woredas/${woreda.id}`,
                                  },
                                  canEditWoreda && {
                                      label: t('woredas.actions.edit'),
                                      icon: <Edit className="h-4 w-4" />,
                                      href: `/woredas/${woreda.id}/edit`,
                                  },
                                  canDeleteWoreda && {
                                      label: t('woredas.actions.delete'),
                                      icon: <Trash2 className="h-4 w-4" />,
                                      danger: true,
                                      disabled: isDeleting && selectedWoreda?.id === woreda.id,
                                      onSelect: () => handleDeleteClick(woreda),
                                  },
                              ]}
                          />
                      </TableCell>
                  </TableRow>
              ))
        : (
            <TableRow>
                <TableCell colSpan={tableColumns.length} className="py-8 text-center text-muted-foreground">
                    {t('woredas.empty.title')}
                    {canCreateWoreda && (
                        <Link href="/woredas/create" className="ml-1 text-primary underline">
                            {t('woredas.empty.createAction')}
                        </Link>
                    )}
                </TableCell>
            </TableRow>
        );

    const mobileItems = React.useMemo(
        () =>
            woredaData.map((woreda, index) => ({
                record: woreda,
                position: rowOffset + index + 1,
            })),
        [woredaData, rowOffset],
    );

    const mobileContent = isLoading ? (
        <ListingMobileItemList
            items={Array.from({ length: 5 }).map((_, i) => ({ id: `skeleton-${i}` }))}
            getKey={(item) => item.id}
            renderTitle={() => (
                <div className="flex items-center gap-2">
                    <Skeleton className="h-3 w-8" />
                    <Skeleton className="h-4 w-32" />
                </div>
            )}
            renderSubtitle={() => <Skeleton className="h-3 w-24" />}
            renderContent={() => (
                <div className="space-y-3">
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-3/4" />
                    <Skeleton className="h-3 w-full" />
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
                    <span className="text-xs uppercase tracking-wide text-muted-foreground">#{item.position}</span>
                    <span className="text-base font-semibold text-foreground">{item.record.name}</span>
                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
            )}
            renderSubtitle={(item) => item.record.zone?.name || t('woredas.mobile.noZone')}
            renderContent={(item) => (
                <div className="space-y-3 text-sm text-muted-foreground">
                    <div className="flex items-center justify-between">
                        <span className="font-medium text-slate-600 dark:text-slate-300">{t('woredas.mobile.status')}</span>
                        <span className="text-right text-slate-900 dark:text-slate-100">
                            {getStatusBadge(item.record.status)}
                        </span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="font-medium text-slate-600 dark:text-slate-300">{t('woredas.mobile.region')}</span>
                        <span className="text-right text-slate-900 dark:text-slate-100">
                            {item.record.zone?.region?.name || notAvailableLabel}
                        </span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="font-medium text-slate-600 dark:text-slate-300">{t('woredas.mobile.population')}</span>
                        <span className="text-right text-slate-900 dark:text-slate-100">
                            {formatNumberValue(item.record.population)}
                        </span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="font-medium text-slate-600 dark:text-slate-300">{t('woredas.mobile.places')}</span>
                        <span className="text-right text-slate-900 dark:text-slate-100">
                            {formatNumberValue(item.record.places_count ?? 0)}
                        </span>
                    </div>
                </div>
            )}
            renderFooter={(item) => (
                <div className="flex w-full flex-wrap items-center justify-end gap-2">
                    {canViewWoreda && (
                        <Button asChild size="sm" variant="outline" className="flex-1 sm:flex-auto">
                            <Link href={`/woredas/${item.record.id}`}>
                                <Eye className="mr-2 h-4 w-4" />
                                {t('woredas.actions.view')}
                            </Link>
                        </Button>
                    )}
                    {canEditWoreda && (
                        <Button asChild size="sm" variant="secondary" className="flex-1 sm:flex-none">
                            <Link href={`/woredas/${item.record.id}/edit`}>
                                <Edit className="mr-2 h-4 w-4" />
                                {t('woredas.actions.edit')}
                            </Link>
                        </Button>
                    )}
                    {canDeleteWoreda && (
                        <Button
                            size="sm"
                            variant="destructive"
                            className="flex-1 sm:flex-none"
                            onClick={() => handleDeleteClick(item.record)}
                            disabled={isDeleting && selectedWoreda?.id === item.record.id}
                        >
                            <Trash2 className="mr-2 h-4 w-4" />
                            {t('woredas.actions.delete')}
                        </Button>
                    )}
                </div>
            )}
            emptyState={(
                <div className="py-8 text-center text-muted-foreground">
                    {t('woredas.empty.title')}
                    {canCreateWoreda && (
                        <Link href="/woredas/create" className="ml-1 text-primary underline">
                            {t('woredas.empty.createAction')}
                        </Link>
                    )}
                </div>
            )}
        />
    );

    const statusFilterOptions = React.useMemo(
        () =>
            (statusOptions?.length
                ? statusOptions
                : [
                      { label: t('woredas.status.active'), value: 'active' },
                      { label: t('woredas.status.inactive'), value: 'inactive' },
                  ]) || [],
        [statusOptions, t],
    );

    const tableHeaderExtras = (
        <ListingFilterBar
            search={{
                value: searchTerm,
                placeholder: t('woredas.filters.searchPlaceholder'),
                onChange: handleSearchChange,
                icon: <Search className="h-4 w-4" />,
            }}
            perPage={{
                value: perPage,
                label: t('woredas.filters.rowsLabel'),
                onChange: handlePerPageChange,
                options: perPageSelectOptions,
            }}
        >
            <Select value={selectedStatus} onValueChange={handleStatusChange}>
                <SelectTrigger className="w-full min-w-[160px] sm:w-auto">
                    <SelectValue placeholder={t('woredas.filters.statusPlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">{t('woredas.filters.allStatuses')}</SelectItem>
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
            {canCreateWoreda && (
                <Button asChild>
                    <Link href="/woredas/create">
                        <Plus className="mr-2 h-4 w-4" />
                        {t('woredas.actions.add')}
                    </Link>
                </Button>
            )}
        </>
    );

    return (
        <>
            <ListPageLayout
                headTitle={t('woredas.title')}
                title={t('woredas.title')}
                description={t('woredas.description', { count: formatCount(totalRecords) })}
                breadcrumbs={breadcrumbs}
                actions={headerActions}
                stats={statsSection}
                tableTitle={t('woredas.table.title')}
                tableDescription={t('woredas.table.description')}
                tableHeaderExtras={tableHeaderExtras}
                pagination={
                    !isLoading && woredas?.links ? (
                        <ListingPaginationFooter
                            className="mt-4"
                            links={woredas.links}
                            from={woredas.from ?? undefined}
                            to={woredas.to ?? undefined}
                            total={woredas.total ?? undefined}
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

                <div className="space-y-3 md:hidden">
                    {mobileContent}
                </div>
            </ListPageLayout>

            <DeleteConfirmationDialog
                open={deleteDialogOpen}
                onOpenChange={(open) => {
                    setDeleteDialogOpen(open);
                    if (!open) {
                        setSelectedWoreda(null);
                        setIsDeleting(false);
                    }
                }}
                title={t('woredas.delete.title')}
                description={t('woredas.delete.description')}
                itemName={selectedWoreda ? selectedWoreda.name : undefined}
                onConfirm={handleDeleteConfirm}
                isLoading={isDeleting}
            />
        </>
    );
}
