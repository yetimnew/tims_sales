import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link, router } from '@inertiajs/react';
import { type BreadcrumbItem } from '@/types';
import { usePermissions } from '@/hooks/use-permissions';
import { useListingLoading } from '@/hooks/use-listing-loading';
import ListPageLayout from '@/components/layouts/list-page-layout';
import { DeleteConfirmationDialog } from '@/components/delete-confirmation-dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TableCell, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';
import {
    Activity,
    ArrowDownRight,
    ChevronRight,
    Coins,
    MapPin,
    Plus,
    Search,
    TrendingUp,
    Eye,
    Edit,
    Trash2,
} from 'lucide-react';
import { ListingFilterBar } from '@/components/listing/filter-bar';
import { ListingStatsHeader, type ListingStatDefinition } from '@/components/listing/stats-header';
import { ListingTableShell, type ListingTableColumn } from '@/components/listing/data-table-shell';
import { ListingMobileItemList } from '@/components/listing/mobile-item-list';
import { ListingLoadingPlaceholder } from '@/components/listing/loading-placeholder';
import { ListingRowActionsMenu } from '@/components/listing/row-actions-menu';
import { ListingPaginationFooter } from '@/components/listing/pagination-footer';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Outsource Performances',
        href: '/outsource-performances',
    },
];

interface OutsourceSummary {
    id: number;
    name: string;
}

interface PlaceSummary {
    id?: number;
    name?: string | null;
}

interface OutsourcePerformanceRecord {
    id: number;
    trip_number: string;
    dispatch_date?: string | null;
    distance_km?: number | string | null;
    cargo_volume_mt?: number | string | null;
    tonkm?: number | string | null;
    cost?: number | string | null;
    status: string;
    remarks?: string | null;
    outsource?: OutsourceSummary | null;
    from_place?: PlaceSummary | null;
    to_place?: PlaceSummary | null;
    fromPlace?: PlaceSummary | null;
    toPlace?: PlaceSummary | null;
}

interface OutsourcePerformanceIndexProps {
    outsourcePerformances: {
        data: OutsourcePerformanceRecord[];
        current_page: number;
        last_page: number;
        total: number;
        from: number;
        to: number;
        links: Array<{
            url: string | null;
            label: string;
            active: boolean;
        }>;
    };
    metrics?: {
        totalRecords?: number;
        totalDistance?: number;
        totalCargo?: number;
        totalCost?: number;
        activeRecords?: number;
    };
    filters?: {
        search?: string | null;
        status?: string | null;
        outsource_id?: number | string | null;
        dispatched_from?: string | null;
        dispatched_to?: string | null;
        sort?: string | null;
        direction?: 'asc' | 'desc' | null;
        per_page?: number | null;
    };
    statusOptions?: Array<{ label: string; value: string }>;
    outsourceOptions?: Array<{ label: string; value: number }>;
    perPageOptions?: number[];
}

type SortDirection = 'asc' | 'desc';

type ColumnKey =
    | 'trip_number'
    | 'dispatch_date'
    | 'vendor'
    | 'route'
    | 'distance_km'
    | 'cargo_volume_mt'
    | 'tonkm'
    | 'cost'
    | 'status';

interface ColumnDefinition {
    id: ColumnKey;
    label: string;
    sortKey?: string;
    sortable?: boolean;
    align?: 'left' | 'center' | 'right';
}

const COLUMN_DEFINITIONS: ColumnDefinition[] = [
    { id: 'trip_number', label: 'Trip #', sortKey: 'trip_number' },
    { id: 'dispatch_date', label: 'Dispatch Date', sortKey: 'dispatch_date' },
    { id: 'vendor', label: 'Vendor', sortKey: 'vendor' },
    { id: 'route', label: 'Route', sortable: false },
    { id: 'distance_km', label: 'Distance (KM)', sortKey: 'distance_km', align: 'right' },
    { id: 'cargo_volume_mt', label: 'Cargo (MT)', sortKey: 'cargo_volume_mt', align: 'right' },
    { id: 'tonkm', label: 'Ton-KM', sortKey: 'tonkm', align: 'right' },
    { id: 'cost', label: 'Cost', sortKey: 'cost', align: 'right' },
    { id: 'status', label: 'Status', sortKey: 'status', align: 'center' },
];

const SKELETON_FLAG_KEY = 'outsource-performances.index.shouldShowSkeleton';

const formatNumberValue = (value?: number | string | null, fractionDigits = 2, suffix = ''): string => {
    if (value === null || value === undefined || value === '') {
        return '—';
    }

    const numeric = Number(value);
    if (!Number.isFinite(numeric)) {
        return '—';
    }

    return `${numeric.toLocaleString('en-US', {
        minimumFractionDigits: fractionDigits,
        maximumFractionDigits: fractionDigits,
    })}${suffix}`;
};

const formatCurrencyValue = (value?: number | string | null): string => {
    if (value === null || value === undefined || value === '') {
        return '—';
    }

    const numeric = Number(value);
    if (!Number.isFinite(numeric)) {
        return '—';
    }

    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'ETB',
        maximumFractionDigits: 2,
    }).format(numeric);
};

const formatDateValue = (value?: string | null): string => {
    if (!value) {
        return '—';
    }

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
        return '—';
    }

    return parsed.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
};

const renderStatusBadge = (status: string): ReactNode => {
    const normalized = status?.toLowerCase();

    if (normalized === 'active' || normalized === 'in_transit') {
        return (
            <Badge className="border border-blue-200 bg-blue-100 text-blue-700 dark:border-blue-900/40 dark:bg-blue-900/30 dark:text-blue-200">
                {status ? status.replace(/_/g, ' ') : 'Active'}
            </Badge>
        );
    }

    if (normalized === 'completed') {
        return (
            <Badge className="border border-emerald-200 bg-emerald-100 text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-900/30 dark:text-emerald-200">
                Completed
            </Badge>
        );
    }

    if (normalized === 'cancelled') {
        return (
            <Badge className="border border-rose-200 bg-rose-100 text-rose-700 dark:border-rose-900/40 dark:bg-rose-900/30 dark:text-rose-200">
                Cancelled
            </Badge>
        );
    }

    return (
        <Badge className="border border-slate-200 bg-slate-100 text-slate-700 dark:border-slate-800/50 dark:bg-slate-900/40 dark:text-slate-200">
            {status || 'Unknown'}
        </Badge>
    );
};

export default function OutsourcePerformancesIndex({
    outsourcePerformances,
    metrics,
    filters,
    statusOptions,
    outsourceOptions,
    perPageOptions,
}: OutsourcePerformanceIndexProps) {
    const { hasPermission } = usePermissions();

    const canCreate = hasPermission('outsource-performances.create');
    const canEdit = hasPermission('outsource-performances.edit');
    const canDelete = hasPermission('outsource-performances.destroy');

    const [searchTerm, setSearchTerm] = useState(filters?.search ?? '');
    const [selectedStatus, setSelectedStatus] = useState(filters?.status ?? 'all');
    const [selectedOutsource, setSelectedOutsource] = useState(
        filters?.outsource_id ? String(filters.outsource_id) : 'all',
    );
    const [sortColumn, setSortColumn] = useState<string>(filters?.sort ?? 'dispatch_date');
    const [sortDirection, setSortDirection] = useState<SortDirection>(filters?.direction ?? 'desc');
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [selectedRecord, setSelectedRecord] = useState<OutsourcePerformanceRecord | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const availablePerPageOptions = useMemo(
        () => (perPageOptions?.length ? perPageOptions : [15, 25, 50, 100]),
        [perPageOptions],
    );

    const resolvedPerPage = useMemo(() => {
        const candidate = filters?.per_page;
        if (typeof candidate === 'number' && availablePerPageOptions.includes(candidate)) {
            return candidate;
        }

        return availablePerPageOptions[0] ?? 15;
    }, [filters?.per_page, availablePerPageOptions]);

    const [perPage, setPerPage] = useState<string>(() => String(resolvedPerPage));

    useEffect(() => {
        setPerPage(String(resolvedPerPage));
    }, [resolvedPerPage]);

    const totalRecords = metrics?.totalRecords ?? outsourcePerformances?.total ?? 0;
    const totalDistance = metrics?.totalDistance ?? 0;
    const totalCargo = metrics?.totalCargo ?? 0;
    const totalCost = metrics?.totalCost ?? 0;
    const activeRecords = metrics?.activeRecords ?? 0;

    const rowOffset = Math.max((outsourcePerformances?.from ?? 1) - 1, 0);
    const isDataReady = Array.isArray(outsourcePerformances?.data);

    const { isLoading } = useListingLoading({
        storageKey: SKELETON_FLAG_KEY,
        isDataReady,
        onlySamePath: true,
        targetPath: '/outsource-performances',
        initialIsLoading: true,
    });

    const perPageSelectOptions = useMemo(
        () => availablePerPageOptions.map((option) => ({ value: String(option), label: `${option} / page` })),
        [availablePerPageOptions],
    );

    const tableColumns: ListingTableColumn[] = useMemo(
        () => [
            { id: 'index', label: '#', align: 'center' },
            ...COLUMN_DEFINITIONS.map((column) => ({
                id: column.id,
                label: column.label,
                sortable: column.sortable !== false,
                sortKey: column.sortKey ?? column.id,
                align: column.align,
            })),
            { id: 'actions', label: 'Actions', align: 'center' },
        ],
        [],
    );

    const handleNavigate = useCallback((overrides: Partial<{
        search?: string;
        status?: string;
        outsource_id?: string | number;
        sort?: string;
        direction?: SortDirection;
        page?: number;
        per_page?: number;
    }>) => {
        const params: Record<string, string | number | undefined> = {
            search:
                overrides.search !== undefined
                    ? overrides.search
                    : searchTerm.trim()
                        ? searchTerm.trim()
                        : undefined,
            status:
                overrides.status !== undefined
                    ? overrides.status
                    : selectedStatus !== 'all'
                        ? selectedStatus
                        : undefined,
            outsource_id:
                overrides.outsource_id !== undefined
                    ? overrides.outsource_id
                    : selectedOutsource !== 'all'
                        ? selectedOutsource
                        : undefined,
            sort: overrides.sort ?? sortColumn,
            direction: overrides.direction ?? sortDirection,
            page: overrides.page,
            per_page: overrides.per_page !== undefined ? overrides.per_page : Number(perPage),
        };

        Object.keys(params).forEach((key) => {
            const value = params[key];
            if (
                value === undefined ||
                value === null ||
                value === '' ||
                (key === 'per_page' && (typeof value !== 'number' || !Number.isFinite(value) || value <= 0))
            ) {
                delete params[key];
            }
        });

        if (typeof window !== 'undefined') {
            window.sessionStorage.setItem(SKELETON_FLAG_KEY, 'true');
        }

        router.get('/outsource-performances', params, {
            preserveState: true,
            preserveScroll: true,
            replace: false,
        });
    }, [perPage, searchTerm, selectedOutsource, selectedStatus, sortColumn, sortDirection]);

    const handleSearchChange = (value: string) => {
        setSearchTerm(value);
        handleNavigate({ search: value.trim() ? value.trim() : undefined, page: 1 });
    };

    const handleStatusChange = (value: string) => {
        setSelectedStatus(value);
        handleNavigate({ status: value !== 'all' ? value : undefined, page: 1 });
    };

    const handleOutsourceChange = (value: string) => {
        setSelectedOutsource(value);
        handleNavigate({ outsource_id: value !== 'all' ? value : undefined, page: 1 });
    };

    const handlePerPageChange = (value: string) => {
        setPerPage(value);
        const numericValue = Number(value);
        handleNavigate({ per_page: Number.isNaN(numericValue) ? undefined : numericValue, page: 1 });
    };

    const handleSortToggle = useCallback((columnId: string) => {
        const definition = COLUMN_DEFINITIONS.find((column) => {
            const key = column.sortKey ?? column.id;
            return key === columnId;
        });

        if (!definition || definition.sortable === false) {
            return;
        }

        const nextColumn = definition.sortKey ?? definition.id;
        const nextDirection: SortDirection =
            sortColumn === nextColumn && sortDirection === 'asc' ? 'desc' : 'asc';

        setSortColumn(nextColumn);
        setSortDirection(nextDirection);
        handleNavigate({ sort: nextColumn, direction: nextDirection });
    }, [handleNavigate, sortColumn, sortDirection]);

    const handleDeleteClick = useCallback((record: OutsourcePerformanceRecord) => {
        setSelectedRecord(record);
        setDeleteDialogOpen(true);
    }, []);

    const handleDeleteConfirm = () => {
        if (!selectedRecord) {
            return;
        }

        setIsDeleting(true);
        const recordToDelete = selectedRecord;

        router.delete(`/outsource-performances/${recordToDelete.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                setDeleteDialogOpen(false);
                setSelectedRecord(null);
                setIsDeleting(false);
                toast({
                    title: '✅ Trip Deleted',
                    description: recordToDelete.trip_number
                        ? `Outsource trip ${recordToDelete.trip_number} was deleted successfully.`
                        : 'The outsource performance record was removed successfully.',
                });
            },
            onError: (errors) => {
                setIsDeleting(false);
                const fallback = 'Failed to delete outsource performance. Please try again.';

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

    const headerActions = (
        <>
            {canCreate && (
                <Button asChild>
                    <Link href="/outsource-performances/create">
                        <Plus className="mr-2 h-4 w-4" />
                        Log Trip
                    </Link>
                </Button>
            )}
        </>
    );

    const statsDefinitions: ListingStatDefinition[] = [
        {
            id: 'trips',
            label: 'Trips Logged',
            icon: <Activity className="h-3.5 w-3.5 text-indigo-600" />,
            value: isLoading ? <Skeleton className="h-5 w-20" /> : totalRecords.toLocaleString(),
            description: isLoading
                ? <Skeleton className="h-3 w-32" />
                : `${activeRecords.toLocaleString()} active trips underway`,
            valueClassName: isLoading ? undefined : 'text-indigo-600',
        },
        {
            id: 'cargo',
            label: 'Cargo Moved',
            icon: <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />,
            value: isLoading ? <Skeleton className="h-5 w-24" /> : formatNumberValue(totalCargo, 0, ' MT'),
            description: isLoading ? <Skeleton className="h-3 w-28" /> : 'Total tonnage handled by vendors',
            valueClassName: isLoading ? undefined : 'text-emerald-600',
        },
        {
            id: 'distance',
            label: 'Distance Covered',
            icon: <MapPin className="h-3.5 w-3.5 text-rose-600" />,
            value: isLoading ? <Skeleton className="h-5 w-24" /> : formatNumberValue(totalDistance, 0, ' km'),
            description: isLoading ? <Skeleton className="h-3 w-32" /> : 'Kilometres logged across the period',
            valueClassName: isLoading ? undefined : 'text-rose-600',
        },
        {
            id: 'cost',
            label: 'Total Cost',
            icon: <Coins className="h-3.5 w-3.5 text-amber-600" />,
            value: isLoading ? <Skeleton className="h-5 w-28" /> : formatCurrencyValue(totalCost),
            description: isLoading ? <Skeleton className="h-3 w-28" /> : 'Aggregate spend with vendors',
            valueClassName: isLoading ? undefined : 'text-amber-600',
        },
    ];

    const renderColumnValue = useCallback((record: OutsourcePerformanceRecord, column: ColumnKey): ReactNode => {
        switch (column) {
            case 'trip_number':
                return record.trip_number;
            case 'dispatch_date':
                return <span className="text-sm text-muted-foreground">{formatDateValue(record.dispatch_date)}</span>;
            case 'vendor':
                return <span className="text-sm text-muted-foreground">{record.outsource?.name ?? '—'}</span>;
            case 'route': {
                const fromPlace = record.from_place?.name ?? record.fromPlace?.name ?? '—';
                const toPlace = record.to_place?.name ?? record.toPlace?.name ?? '—';

                return (
                    <div className="flex flex-col text-xs text-muted-foreground">
                        <span>{fromPlace}</span>
                        <span className="text-muted-foreground">→ {toPlace}</span>
                    </div>
                );
            }
            case 'distance_km':
                return <span className="font-medium">{formatNumberValue(record.distance_km, 2, ' km')}</span>;
            case 'cargo_volume_mt':
                return <span className="font-medium">{formatNumberValue(record.cargo_volume_mt, 2, ' MT')}</span>;
            case 'tonkm':
                return <span className="font-medium">{formatNumberValue(record.tonkm)}</span>;
            case 'cost':
                return <span className="font-medium">{formatCurrencyValue(record.cost)}</span>;
            case 'status':
                return renderStatusBadge(record.status ?? '');
            default:
                return '—';
        }
    }, []);

    const tableRows = useMemo(() => {
        if (isLoading) {
            return Array.from({ length: 6 }).map((_, rowIndex) => (
                <TableRow key={`outsource-performance-skeleton-${rowIndex}`} aria-hidden="true">
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
            ));
        }

        if (!outsourcePerformances?.data?.length) {
            return (
                <TableRow>
                    <TableCell colSpan={tableColumns.length} className="py-10 text-center text-muted-foreground">
                        No outsource performance records found.
                        {canCreate && (
                            <Link href="/outsource-performances/create" className="ml-1 text-primary underline">
                                Log one
                            </Link>
                        )}
                    </TableCell>
                </TableRow>
            );
        }

        return outsourcePerformances.data.map((record, index) => (
            <TableRow key={record.id} className="hover:bg-muted/50">
                <TableCell className="text-center font-medium text-muted-foreground">{rowOffset + index + 1}</TableCell>
                {COLUMN_DEFINITIONS.map((column) => (
                    <TableCell
                        key={`${record.id}-${column.id}`}
                        className={
                            column.align === 'right'
                                ? 'text-right'
                                : column.align === 'center'
                                    ? 'text-center'
                                    : undefined
                        }
                    >
                        {renderColumnValue(record, column.id)}
                    </TableCell>
                ))}
                <TableCell className="text-center">
                    <ListingRowActionsMenu
                        actions={[
                            {
                                label: 'View',
                                icon: <Eye className="h-4 w-4" />,
                                href: `/outsource-performances/${record.id}`,
                            },
                            canEdit && {
                                label: 'Edit',
                                icon: <Edit className="h-4 w-4" />,
                                href: `/outsource-performances/${record.id}/edit`,
                            },
                            canDelete && {
                                label: 'Delete',
                                icon: <Trash2 className="h-4 w-4" />,
                                danger: true,
                                disabled: isDeleting && selectedRecord?.id === record.id,
                                onSelect: () => handleDeleteClick(record),
                            },
                        ]}
                    />
                </TableCell>
            </TableRow>
        ));
    }, [
        canCreate,
        canDelete,
        canEdit,
        handleDeleteClick,
        isDeleting,
        isLoading,
        outsourcePerformances,
        renderColumnValue,
        rowOffset,
        selectedRecord?.id,
        tableColumns,
    ]);

    const mobileItems = useMemo(
        () =>
            (outsourcePerformances?.data ?? []).map((record, index) => ({
                record,
                position: rowOffset + index + 1,
            })),
        [outsourcePerformances?.data, rowOffset],
    );

    const mobileContent = isLoading ? (
        <ListingLoadingPlaceholder showStats={false} filterItemCount={4} rowCount={4} className="p-4" />
    ) : (
        <ListingMobileItemList
            items={mobileItems}
            getKey={(item) => item.record.id}
            renderTitle={(item) => (
                <div className="flex items-center gap-2">
                    <span className="text-xs uppercase tracking-wide text-muted-foreground">#{item.position}</span>
                    <span className="text-base font-semibold text-foreground">{item.record.trip_number}</span>
                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
            )}
            renderSubtitle={(item) => item.record.outsource?.name ?? 'Vendor unknown'}
            renderContent={(item) => (
                <div className="space-y-3 text-sm text-muted-foreground">
                    <div className="flex items-center justify-between">
                        <span className="font-medium text-slate-600 dark:text-slate-300">Dispatch</span>
                        <span className="text-right text-slate-900 dark:text-slate-100">
                            {formatDateValue(item.record.dispatch_date)}
                        </span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="font-medium text-slate-600 dark:text-slate-300">Route</span>
                        <span className="text-right text-slate-900 dark:text-slate-100">
                            {(item.record.from_place?.name ?? item.record.fromPlace?.name ?? '—')}
                        </span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="font-medium text-slate-600 dark:text-slate-300">Distance</span>
                        <span className="text-right text-slate-900 dark:text-slate-100">
                            {formatNumberValue(item.record.distance_km, 2, ' km')}
                        </span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="font-medium text-slate-600 dark:text-slate-300">Cost</span>
                        <span className="text-right text-slate-900 dark:text-slate-100">
                            {formatCurrencyValue(item.record.cost)}
                        </span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="font-medium text-slate-600 dark:text-slate-300">Status</span>
                        <span className="text-right text-slate-900 dark:text-slate-100">
                            {renderStatusBadge(item.record.status ?? '')}
                        </span>
                    </div>
                </div>
            )}
            renderFooter={(item) => (
                <div className="flex w-full flex-wrap items-center gap-2">
                    <Button asChild size="sm" variant="outline" className="flex-1 sm:flex-auto">
                        <Link href={`/outsource-performances/${item.record.id}`}>
                            <Eye className="mr-2 h-4 w-4" />
                            View
                        </Link>
                    </Button>
                    {canEdit && (
                        <Button asChild size="sm" variant="secondary" className="flex-1 sm:flex-none">
                            <Link href={`/outsource-performances/${item.record.id}/edit`}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                            </Link>
                        </Button>
                    )}
                    {canDelete && (
                        <Button
                            size="sm"
                            variant="destructive"
                            className="flex-1 sm:flex-none"
                            onClick={() => handleDeleteClick(item.record)}
                            disabled={isDeleting && selectedRecord?.id === item.record.id}
                        >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                        </Button>
                    )}
                </div>
            )}
            emptyState={
                <div className="py-8 text-center text-muted-foreground">
                    No outsource performance records found.
                    {canCreate && (
                        <Link href="/outsource-performances/create" className="ml-1 text-primary underline">
                            Log one
                        </Link>
                    )}
                </div>
            }
        />
    );

    const tableHeaderExtras = (
        <ListingFilterBar
            search={{
                value: searchTerm,
                placeholder: 'Search trips or vendors',
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
            <div className="flex flex-wrap items-center gap-2">
                <Select value={selectedOutsource} onValueChange={handleOutsourceChange}>
                    <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="Vendor" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All vendors</SelectItem>
                        {outsourceOptions?.map((option) => (
                            <SelectItem key={option.value} value={String(option.value)}>
                                {option.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Select value={selectedStatus} onValueChange={handleStatusChange}>
                    <SelectTrigger className="w-[150px]">
                        <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All statuses</SelectItem>
                        {statusOptions?.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                                {option.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
        </ListingFilterBar>
    );

    return (
        <>
            <ListPageLayout
                headTitle="Outsource Performances"
                title="Outsource Performances"
                description={`Manage vendor delivery performance (${totalRecords.toLocaleString()} records).`}
                breadcrumbs={breadcrumbs}
                actions={headerActions}
                stats={<ListingStatsHeader stats={statsDefinitions} />}
                tableTitle="Outsource Trip Ledger"
                tableDescription="Analyse partner performance across distance, volume, and spend"
                tableHeaderExtras={tableHeaderExtras}
                pagination={
                    !isLoading && outsourcePerformances ? (
                        <ListingPaginationFooter
                            className="mt-4"
                            links={outsourcePerformances.links}
                            from={outsourcePerformances.from}
                            to={outsourcePerformances.to}
                            total={outsourcePerformances.total}
                            extra={(
                                <div className="flex flex-wrap items-center gap-2">
                                    <Badge variant="outline" className="bg-white/80 text-xs text-slate-600 dark:bg-slate-900/80 dark:text-slate-300">
                                        Distance: {formatNumberValue(totalDistance, 0, ' km')}
                                    </Badge>
                                    <Badge variant="outline" className="bg-white/80 text-xs text-slate-600 dark:bg-slate-900/80 dark:text-slate-300">
                                        Cargo: {formatNumberValue(totalCargo, 0, ' MT')}
                                    </Badge>
                                    <Badge variant="outline" className="bg-white/80 text-xs text-slate-600 dark:bg-slate-900/80 dark:text-slate-300">
                                        Cost: {formatCurrencyValue(totalCost)}
                                    </Badge>
                                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                        <ArrowDownRight className="h-3.5 w-3.5 text-emerald-600" />
                                        Active: {activeRecords.toLocaleString()}
                                    </span>
                                </div>
                            )}
                        />
                    ) : null
                }
            >
                <div className="hidden md:block">
                    <ListingTableShell
                        columns={tableColumns}
                        sort={{ column: sortColumn, direction: sortDirection, onToggle: handleSortToggle }}
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
                        setSelectedRecord(null);
                        setIsDeleting(false);
                    }
                }}
                title="Delete Trip"
                description="Are you sure you want to delete this outsource performance record? This action cannot be undone."
                itemName={selectedRecord?.trip_number ?? undefined}
                onConfirm={handleDeleteConfirm}
                isLoading={isDeleting}
            />
        </>
    );
}
