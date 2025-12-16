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

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Zones',
        href: '/zones',
    },
];

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

const COLUMN_DEFINITIONS: Array<{
    id: ColumnKey;
    label: string;
    sortKey?: string;
    align?: 'center' | 'right';
}> = [
    { id: 'name', label: 'Zone', sortKey: 'name' },
    { id: 'code', label: 'Code', sortKey: 'code' },
    { id: 'status', label: 'Status', sortKey: 'status', align: 'center' },
    { id: 'region', label: 'Region', sortKey: 'region_id' },
    { id: 'administrative_center', label: 'Admin Center', sortKey: 'administrative_center' },
    { id: 'population', label: 'Population', sortKey: 'population', align: 'right' },
    { id: 'accessibility_score', label: 'Accessibility', sortKey: 'accessibility_score', align: 'center' },
    { id: 'woredas_count', label: 'Woredas', sortKey: 'woredas_count', align: 'center' },
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
            <Badge className="flex items-center gap-1 border-emerald-200 bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:border-emerald-900/50 dark:bg-emerald-900/30 dark:text-emerald-200">
                <CheckCircle className="h-3 w-3" /> Active
            </Badge>
        );
    }

    if (normalized === 'inactive') {
        return (
            <Badge className="flex items-center gap-1 border-slate-300 bg-slate-200 text-slate-700 hover:bg-slate-300 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-200">
                <XCircle className="h-3 w-3" /> Inactive
            </Badge>
        );
    }

    return (
        <Badge variant="outline" className="capitalize">
            {status}
        </Badge>
    );
};

export default function ZonesIndex({ zones, metrics, filters, statusOptions, perPageOptions }: ZonesIndexProps) {
    const { hasPermission } = usePermissions();
    const canViewZone = hasPermission('zones.show');
    const canCreateZone = hasPermission('zones.create');
    const canEditZone = hasPermission('zones.edit');
    const canDeleteZone = hasPermission('zones.destroy');

    const [searchTerm, setSearchTerm] = React.useState(filters?.search ?? '');
    const [selectedStatus, setSelectedStatus] = React.useState(filters?.status ?? 'all');
    const [sortColumn, setSortColumn] = React.useState<string>(filters?.sort ?? 'name');
    const [sortDirection, setSortDirection] = React.useState<'asc' | 'desc'>(filters?.direction ?? 'asc');
    const availablePerPageOptions = React.useMemo(
        () => (perPageOptions?.length ? perPageOptions : [10, 15, 25, 50]),
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
                toast({
                    title: 'Zone deleted',
                    description: `${selectedZone.name} has been removed.`,
                });
                setSelectedZone(null);
                setIsDeleting(false);
            },
            onError: (errors) => {
                setIsDeleting(false);

                const fallback = 'Failed to delete zone. Please try again.';
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
            id: 'total-zones',
            label: 'Total Zones',
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
                `${formatCount(surveyedCount)} surveyed`
            ),
            valueClassName: isLoading ? undefined : 'text-blue-600',
        },
        {
            id: 'active-zones',
            label: 'Active Zones',
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
                'Operational coverage'
            ),
            valueClassName: isLoading ? undefined : 'text-emerald-600',
        },
        {
            id: 'inactive-zones',
            label: 'Inactive Zones',
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
                'Awaiting activation'
            ),
            valueClassName: isLoading ? undefined : 'text-rose-600',
        },
        {
            id: 'population-reach',
            label: 'Population Reach',
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
                'Residents served'
            ),
            valueClassName: isLoading ? undefined : 'text-indigo-600',
        },
        {
            id: 'accessibility-index',
            label: 'Accessibility Index',
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
                'Logistics readiness'
            ),
            valueClassName: isLoading ? undefined : 'text-amber-600',
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

    const renderColumnValue = React.useCallback((zone: ZoneData, column: ColumnKey): React.ReactNode => {
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
                return zone.code || '—';
            case 'status':
                return getStatusBadge(zone.status);
            case 'region':
                return zone.region?.name || '—';
            case 'administrative_center':
                return zone.administrative_center || '—';
            case 'population':
                return formatNumberValue(zone.population);
            case 'accessibility_score':
                return zone.accessibility_score !== null && zone.accessibility_score !== undefined
                    ? formatNumberValue(zone.accessibility_score, 1)
                    : '—';
            case 'woredas_count':
                return formatNumberValue(zone.woredas_count ?? 0);
            default:
                return '—';
        }
    }, []);

    const tableRows = isLoading
        ? Array.from({ length: 6 }).map((_, rowIndex) => (
              <TableRow key={`zone-skeleton-${rowIndex}`} aria-hidden="true">
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
        : zoneData.length > 0
            ? zoneData.map((zone, index) => (
                  <TableRow key={zone.id} className="hover:bg-muted/50">
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
                              {renderColumnValue(zone, column.id)}
                          </TableCell>
                      ))}
                      <TableCell className="text-center">
                          <ListingRowActionsMenu
                              actions={[
                                  canViewZone && {
                                      label: 'View',
                                      icon: <Eye className="h-4 w-4" />,
                                      href: `/zones/${zone.id}`,
                                  },
                                  canEditZone && {
                                      label: 'Edit',
                                      icon: <Edit className="h-4 w-4" />,
                                      href: `/zones/${zone.id}/edit`,
                                  },
                                  canDeleteZone && {
                                      label: 'Delete',
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
                        No zones found.
                        {canCreateZone && (
                            <Link href="/zones/create" className="ml-1 text-primary underline">
                                Create one
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
        <ListingLoadingPlaceholder showStats={false} filterItemCount={3} rowCount={4} />
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
            renderSubtitle={(item) => item.record.region?.name || 'No region assigned'}
            renderContent={(item) => (
                <div className="space-y-3 text-sm text-muted-foreground">
                    <div className="flex items-center justify-between">
                        <span className="font-medium text-slate-600 dark:text-slate-300">Status</span>
                        <span className="text-right text-slate-900 dark:text-slate-100">
                            {item.record.status || 'Unknown'}
                        </span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="font-medium text-slate-600 dark:text-slate-300">Population</span>
                        <span className="text-right text-slate-900 dark:text-slate-100">
                            {formatNumberValue(item.record.population)}
                        </span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="font-medium text-slate-600 dark:text-slate-300">Woredas</span>
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
                                View
                            </Link>
                        </Button>
                    )}
                    {canEditZone && (
                        <Button asChild size="sm" variant="secondary" className="flex-1 sm:flex-none">
                            <Link href={`/zones/${item.record.id}/edit`}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
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
                            Delete
                        </Button>
                    )}
                </div>
            )}
            emptyState={(
                <div className="py-8 text-center text-muted-foreground">
                    No zones found.
                    {canCreateZone && (
                        <Link href="/zones/create" className="ml-1 text-primary underline">
                            Create one
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
                      { label: 'Active', value: 'active' },
                      { label: 'Inactive', value: 'inactive' },
                  ]) || [],
        [statusOptions],
    );

    const tableHeaderExtras = (
        <ListingFilterBar
            search={{
                value: searchTerm,
                placeholder: 'Search zones...',
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
            {canCreateZone && (
                <Button asChild>
                    <Link href="/zones/create">
                        <Plus className="mr-2 h-4 w-4" />
                        Add Zone
                    </Link>
                </Button>
            )}
        </>
    );

    return (
        <>
            <ListPageLayout
                headTitle="Zones"
                title="Zones"
                description={`Manage ${formatCount(totalRecords)} zone${totalRecords === 1 ? '' : 's'} and keep coverage aligned with regional strategy.`}
                breadcrumbs={breadcrumbs}
                actions={headerActions}
                stats={statsSection}
                tableTitle="Zone Inventory"
                tableDescription="Monitor readiness signals, demographic reach, and operational status by zone"
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

                <div className="space-y-3 md:hidden">{mobileContent}</div>
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
                title="Delete Zone"
                description="Are you sure you want to delete this zone? This action cannot be undone."
                itemName={selectedZone ? selectedZone.name : undefined}
                onConfirm={handleDeleteConfirm}
                isLoading={isDeleting}
            />
        </>
    );
}

