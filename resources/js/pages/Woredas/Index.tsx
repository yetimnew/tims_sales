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

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Woredas',
        href: '/woredas',
    },
];

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

const COLUMN_DEFINITIONS: Array<{
    id: ColumnKey;
    label: string;
    sortKey?: string;
    align?: 'center' | 'right';
}> = [
    { id: 'name', label: 'Woreda', sortKey: 'name' },
    { id: 'code', label: 'Code', sortKey: 'code' },
    { id: 'status', label: 'Status', sortKey: 'status', align: 'center' },
    { id: 'zone', label: 'Zone', sortKey: 'zone_id' },
    { id: 'region', label: 'Region' },
    { id: 'administrative_center', label: 'Admin Center', sortKey: 'administrative_center' },
    { id: 'population', label: 'Population', sortKey: 'population', align: 'right' },
    { id: 'area_km2', label: 'Area (km²)', sortKey: 'area_km2', align: 'right' },
    { id: 'accessibility_score', label: 'Accessibility', sortKey: 'accessibility_score', align: 'center' },
    { id: 'places_count', label: 'Places', sortKey: 'places_count', align: 'center' },
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

export default function WoredasIndex({ woredas, metrics, filters, statusOptions, perPageOptions }: WoredasIndexProps) {
    const { hasPermission } = usePermissions();
    const canViewWoreda = hasPermission('woredas.show');
    const canCreateWoreda = hasPermission('woredas.create');
    const canEditWoreda = hasPermission('woredas.edit');
    const canDeleteWoreda = hasPermission('woredas.destroy');

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
                    title: '✅ Woreda Deleted',
                    description: `${selectedWoreda.name} has been removed successfully.`,
                });
            },
            onError: (errors) => {
                setIsDeleting(false);

                const fallback = 'Failed to delete woreda. Please try again.';
                if (errors && typeof errors === 'object') {
                    const errorMessages = Object.values(errors)
                        .flatMap((value) => (Array.isArray(value) ? value : [value]))
                        .filter(Boolean)
                        .join('\n');

                    toast({
                        title: '❌ Delete Failed',
                        description: errorMessages || fallback,
                        variant: 'destructive',
                    });
                } else {
                    toast({
                        title: '❌ Delete Failed',
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
            label: 'Total Woredas',
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
                `${formatCount(activeCount)} active`
            ),
            valueClassName: isLoading ? undefined : 'text-sky-600',
        },
        {
            id: 'inactive-woredas',
            label: 'Inactive Woredas',
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
                'Paused districts'
            ),
            valueClassName: isLoading ? undefined : 'text-rose-600',
        },
        {
            id: 'population-reach',
            label: 'Population Reach',
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
                'Residents covered'
            ),
            valueClassName: isLoading ? undefined : 'text-emerald-600',
        },
        {
            id: 'accessibility-index',
            label: 'Accessibility Index',
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
                `${formatCount(roadNoteCount)} road intel`
            ),
            valueClassName: isLoading ? undefined : 'text-indigo-600',
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

    const renderColumnValue = React.useCallback((woreda: WoredaData, column: ColumnKey): React.ReactNode => {
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
                return woreda.code || '—';
            case 'status':
                return getStatusBadge(woreda.status);
            case 'zone':
                return woreda.zone?.name || '—';
            case 'region':
                return woreda.zone?.region?.name || '—';
            case 'administrative_center':
                return woreda.administrative_center || '—';
            case 'population':
                return formatNumberValue(woreda.population);
            case 'area_km2':
                return formatNumberValue(woreda.area_km2, 2);
            case 'accessibility_score':
                return woreda.accessibility_score !== null && woreda.accessibility_score !== undefined
                    ? formatNumberValue(woreda.accessibility_score, 1)
                    : '—';
            case 'places_count':
                return formatNumberValue(woreda.places_count ?? 0);
            default:
                return '—';
        }
    }, []);

    const tableRows = isLoading
        ? Array.from({ length: 6 }).map((_, rowIndex) => (
              <TableRow key={`woreda-skeleton-${rowIndex}`} aria-hidden="true">
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
        : woredaData.length > 0
            ? woredaData.map((woreda, index) => (
                  <TableRow key={woreda.id} className="hover:bg-muted/50">
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
                              {renderColumnValue(woreda, column.id)}
                          </TableCell>
                      ))}
                      <TableCell className="text-center">
                          <ListingRowActionsMenu
                              actions={[
                                  canViewWoreda && {
                                      label: 'View',
                                      icon: <Eye className="h-4 w-4" />,
                                      href: `/woredas/${woreda.id}`,
                                  },
                                  canEditWoreda && {
                                      label: 'Edit',
                                      icon: <Edit className="h-4 w-4" />,
                                      href: `/woredas/${woreda.id}/edit`,
                                  },
                                  canDeleteWoreda && {
                                      label: 'Delete',
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
                        No woredas found.
                        {canCreateWoreda && (
                            <Link href="/woredas/create" className="ml-1 text-primary underline">
                                Create one
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
            renderSubtitle={(item) => item.record.zone?.name || 'No zone assigned'}
            renderContent={(item) => (
                <div className="space-y-3 text-sm text-muted-foreground">
                    <div className="flex items-center justify-between">
                        <span className="font-medium text-slate-600 dark:text-slate-300">Status</span>
                        <span className="text-right text-slate-900 dark:text-slate-100">
                            {getStatusBadge(item.record.status)}
                        </span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="font-medium text-slate-600 dark:text-slate-300">Region</span>
                        <span className="text-right text-slate-900 dark:text-slate-100">
                            {item.record.zone?.region?.name || '—'}
                        </span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="font-medium text-slate-600 dark:text-slate-300">Population</span>
                        <span className="text-right text-slate-900 dark:text-slate-100">
                            {formatNumberValue(item.record.population)}
                        </span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="font-medium text-slate-600 dark:text-slate-300">Places</span>
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
                                View
                            </Link>
                        </Button>
                    )}
                    {canEditWoreda && (
                        <Button asChild size="sm" variant="secondary" className="flex-1 sm:flex-none">
                            <Link href={`/woredas/${item.record.id}/edit`}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
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
                            Delete
                        </Button>
                    )}
                </div>
            )}
            emptyState={(
                <div className="py-8 text-center text-muted-foreground">
                    No woredas found.
                    {canCreateWoreda && (
                        <Link href="/woredas/create" className="ml-1 text-primary underline">
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
                placeholder: 'Search woredas...',
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
            {canCreateWoreda && (
                <Button asChild>
                    <Link href="/woredas/create">
                        <Plus className="mr-2 h-4 w-4" />
                        Add Woreda
                    </Link>
                </Button>
            )}
        </>
    );

    return (
        <>
            <ListPageLayout
                headTitle="Woredas"
                title="Woredas"
                description={`Manage ${formatCount(totalRecords)} woreda${totalRecords === 1 ? '' : 's'} and align coverage with operational needs.`}
                breadcrumbs={breadcrumbs}
                actions={headerActions}
                stats={statsSection}
                tableTitle="Woreda Inventory"
                tableDescription="Review administrative coverage, readiness signals, and child places per woreda"
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

                <div className="space-y-3 md:hidden">{mobileContent}</div>
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
                title="Delete Woreda"
                description="Are you sure you want to delete this woreda? This action cannot be undone."
                itemName={selectedWoreda ? selectedWoreda.name : undefined}
                onConfirm={handleDeleteConfirm}
                isLoading={isDeleting}
            />
        </>
    );
}

