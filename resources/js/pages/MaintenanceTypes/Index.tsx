import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { TableCell, TableRow } from '@/components/ui/table';
import ListPageLayout from '@/components/layouts/list-page-layout';
import { DeleteConfirmationDialog } from '@/components/delete-confirmation-dialog';
import { ListingStatsHeader, type ListingStatDefinition } from '@/components/listing/stats-header';
import { ListingFilterBar } from '@/components/listing/filter-bar';
import { ListingTableShell, type ListingTableColumn } from '@/components/listing/data-table-shell';
import { ListingMobileItemList } from '@/components/listing/mobile-item-list';
import { ListingPaginationFooter } from '@/components/listing/pagination-footer';
import { ListingRowActionsMenu } from '@/components/listing/row-actions-menu';
import { usePermissions } from '@/hooks/use-permissions';
import { useListingLoading } from '@/hooks/use-listing-loading';
import { formatCurrency } from '@/lib/formatters/currency';
import { Link, router } from '@inertiajs/react';
import { type BreadcrumbItem } from '@/types';
import {
    Plus,
    Eye,
    Edit,
    Trash2,
    Search,
    Settings,
    Wrench,
    CheckCircle,
    XCircle,
    Gauge,
    DollarSign,
} from 'lucide-react';
import * as React from 'react';

const SKELETON_FLAG_KEY = 'maintenance-types.index.shouldShowSkeleton';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Maintenance', href: '/maintenance' },
    { title: 'Maintenance Types', href: '/maintenance-types' },
];

interface MaintenanceType {
    id: number;
    name: string;
    category: string;
    interval_km?: number | null;
    interval_months?: number | null;
    estimated_cost?: number | null;
    is_active: boolean;
    description?: string | null;
    created_at?: string | null;
    updated_at?: string | null;
    trucks_count?: number | null;
    active_trucks_count?: number | null;
}

interface PaginationMeta {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
}

interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

interface MaintenanceTypesCollection {
    data: MaintenanceType[];
    meta: PaginationMeta;
    links: PaginationLink[];
}

interface Option {
    label: string;
    value: string;
}

interface CategoryMetric extends Option {
    count: number;
}

interface MaintenanceTypeMetrics {
    counts: {
        total: number;
        active: number;
        inactive: number;
    };
    categories: CategoryMetric[];
    intervals: {
        average_km: number | null;
        average_months: number | null;
    };
    costs: {
        average: number | null;
        total: number | null;
    };
}

interface MaintenanceTypeFilters {
    search?: string | null;
    status?: string | null;
    category?: string | null;
    sort?: string | null;
    direction?: 'asc' | 'desc' | null;
    per_page?: number | null;
}

type BulkActionType = 'delete' | 'activate' | 'deactivate';

type NavigateOverrides = {
    search?: string;
    status?: string;
    category?: string;
    sort?: string;
    direction?: 'asc' | 'desc';
    page?: number;
    per_page?: number;
};

interface MaintenanceTypesIndexProps {
    maintenanceTypes?: MaintenanceTypesCollection | null;
    metrics?: MaintenanceTypeMetrics | null;
    filters?: MaintenanceTypeFilters | null;
    statusOptions?: Option[] | null;
    categoryOptions?: Option[] | null;
    perPageOptions?: number[] | null;
}

const toNumeric = (value: number | string | null | undefined): number | null => {
    if (value === null || value === undefined) {
        return null;
    }

    const numeric = typeof value === 'string' ? Number(value) : value;

    if (!Number.isFinite(numeric)) {
        return null;
    }

    return numeric;
};

const formatNumber = (value: number | string | null | undefined): string => {
    const numeric = toNumeric(value);

    if (numeric === null) {
        return '0';
    }

    return new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(numeric);
};

const formatIntervalKm = (value?: number | null): string => {
    if (!value) {
        return '—';
    }

    return `${value.toLocaleString()} km`;
};

const formatIntervalMonths = (value?: number | null): string => {
    if (!value) {
        return '—';
    }

    return `${value} month${value === 1 ? '' : 's'}`;
};

const renderStatusBadge = (isActive: boolean) => {
    if (isActive) {
        return (
            <Badge className="flex w-fit items-center gap-1 border border-emerald-200 bg-emerald-100 text-emerald-700 hover:bg-emerald-200">
                <CheckCircle className="h-3 w-3" />
                Active
            </Badge>
        );
    }

    return (
        <Badge className="flex w-fit items-center gap-1 border border-slate-200 bg-slate-100 text-slate-700 hover:bg-slate-200">
            <XCircle className="h-3 w-3" />
            Inactive
        </Badge>
    );
};

const normalizeFilterValue = (value?: string | null): string => (value && value !== '' ? value : 'all');

export default function MaintenanceTypesIndex({
    maintenanceTypes,
    metrics,
    filters,
    statusOptions,
    categoryOptions,
    perPageOptions,
}: MaintenanceTypesIndexProps) {
    const { hasPermission } = usePermissions();

    const safeStatusOptions = statusOptions ?? [];
    const safeCategoryOptions = categoryOptions ?? [];

    const availablePerPageOptions = React.useMemo(() => {
        if (perPageOptions && perPageOptions.length) {
            return perPageOptions;
        }

        return [15, 25, 50, 100];
    }, [perPageOptions]);

    const defaultPerPage = availablePerPageOptions[0] ?? 15;

    const safeMaintenanceTypes: MaintenanceTypesCollection = maintenanceTypes ?? {
        data: [],
        meta: {
            current_page: 1,
            last_page: 1,
            per_page: defaultPerPage,
            total: 0,
            from: 0,
            to: 0,
        },
        links: [],
    };

    const maintenanceTypeData = safeMaintenanceTypes.data ?? [];
    const meta = safeMaintenanceTypes.meta ?? {
        current_page: 1,
        last_page: 1,
        per_page: defaultPerPage,
        total: maintenanceTypeData.length,
        from: maintenanceTypeData.length > 0 ? 1 : 0,
        to: maintenanceTypeData.length,
    };
    const links = safeMaintenanceTypes.links ?? [];

    const metricsData: MaintenanceTypeMetrics = React.useMemo(
        () => ({
            counts: {
                total: metrics?.counts?.total ?? (meta?.total ?? maintenanceTypeData.length ?? 0),
                active: metrics?.counts?.active ?? 0,
                inactive: metrics?.counts?.inactive ?? 0,
            },
            categories: metrics?.categories ?? [],
            intervals: {
                average_km: metrics?.intervals?.average_km ?? null,
                average_months: metrics?.intervals?.average_months ?? null,
            },
            costs: {
                average: metrics?.costs?.average ?? null,
                total: metrics?.costs?.total ?? null,
            },
        }),
        [metrics, meta?.total, maintenanceTypeData.length],
    );

    const totalMaintenanceTypes = metricsData.counts.total ?? meta.total ?? maintenanceTypeData.length;

    const [searchTerm, setSearchTerm] = React.useState(filters?.search ?? '');
    const [sortColumn, setSortColumn] = React.useState(filters?.sort ?? 'created_at');
    const [sortDirection, setSortDirection] = React.useState<'asc' | 'desc'>(
        filters?.direction === 'asc' ? 'asc' : 'desc',
    );
    const [perPage, setPerPage] = React.useState<string>(
        () => String(filters?.per_page ?? meta.per_page ?? defaultPerPage),
    );
    const [selectedStatus, setSelectedStatus] = React.useState<string>(() => normalizeFilterValue(filters?.status));
    const [selectedCategory, setSelectedCategory] = React.useState<string>(() => normalizeFilterValue(filters?.category));
    const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
    const [selectedMaintenanceType, setSelectedMaintenanceType] = React.useState<MaintenanceType | null>(null);
    const [isDeleting, setIsDeleting] = React.useState(false);
    const [selectedIds, setSelectedIds] = React.useState<number[]>([]);
    const [bulkActionDialogOpen, setBulkActionDialogOpen] = React.useState(false);
    const [bulkActionType, setBulkActionType] = React.useState<BulkActionType>('delete');
    const [isBulkActionProcessing, setIsBulkActionProcessing] = React.useState(false);

    React.useEffect(() => {
        setSearchTerm(filters?.search ?? '');
    }, [filters?.search]);

    React.useEffect(() => {
        setSortColumn(filters?.sort ?? 'created_at');
    }, [filters?.sort]);

    React.useEffect(() => {
        setSortDirection(filters?.direction === 'asc' ? 'asc' : 'desc');
    }, [filters?.direction]);

    React.useEffect(() => {
        const nextPerPage = filters?.per_page ?? meta.per_page ?? defaultPerPage;
        setPerPage(String(nextPerPage));
    }, [filters?.per_page, meta.per_page, defaultPerPage]);

    React.useEffect(() => {
        setSelectedStatus(normalizeFilterValue(filters?.status));
    }, [filters?.status]);

    React.useEffect(() => {
        setSelectedCategory(normalizeFilterValue(filters?.category));
    }, [filters?.category]);

    const isDataReady = Array.isArray(maintenanceTypeData);

    const { isLoading: isTableLoading } = useListingLoading({
        storageKey: SKELETON_FLAG_KEY,
        isDataReady,
        minimumDuration: 200,
        onlySamePath: true,
        targetPath: '/maintenance-types',
        initialIsLoading: true,
    });

    const rowOffset = Math.max((meta.from ?? 1) - 1, 0);

    const canCreateMaintenanceType = hasPermission('maintenance-types.create');
    const canEditMaintenanceType = hasPermission('maintenance-types.edit');
    const canDeleteMaintenanceType = hasPermission('maintenance-types.destroy');
    const canViewMaintenanceType = hasPermission('maintenance-types.show');

    const categoryCount = React.useCallback(
        (value: string) => metricsData.categories.find((item) => item.value === value)?.count ?? 0,
        [metricsData.categories],
    );

    const categorySummary = React.useMemo(() => {
        if (!metricsData.categories.length) {
            return 'No category breakdown yet';
        }

        return metricsData.categories
            .map((item) => `${formatNumber(item.count)} ${item.label.toLowerCase()}`)
            .join(' · ');
    }, [metricsData.categories]);

    const averageKmDisplay =
        metricsData.intervals.average_km !== null && metricsData.intervals.average_km !== undefined
            ? `${Math.round(metricsData.intervals.average_km).toLocaleString()} km`
            : '—';

    const averageMonthsDisplay =
        metricsData.intervals.average_months !== null && metricsData.intervals.average_months !== undefined
            ? `${metricsData.intervals.average_months.toFixed(1)} mo`
            : '—';

    const averageCostDisplay = formatCurrency(metricsData.costs.average);
    const totalCostDisplay = formatCurrency(metricsData.costs.total);
    const inactiveCountDisplay = formatNumber(metricsData.counts.inactive);

    const preventiveCount = categoryCount('Preventive');
    const correctiveCount = categoryCount('Corrective');
    const emergencyCount = categoryCount('Emergency');

    const statsDefinitions = React.useMemo<ListingStatDefinition[]>(
        () => [
            {
                id: 'total-types',
                label: 'Total Types',
                icon: <Settings className="h-3.5 w-3.5 text-blue-600" />,
                className: 'min-w-[220px] flex-shrink-0',
                value: isTableLoading ? <Skeleton className="h-4 w-16" aria-hidden="true" /> : formatNumber(metricsData.counts.total),
                description: isTableLoading ? <Skeleton className="h-3 w-36" aria-hidden="true" /> : categorySummary,
                valueClassName: 'text-blue-600',
            },
            {
                id: 'active-types',
                label: 'Active',
                icon: <CheckCircle className="h-3.5 w-3.5 text-emerald-600" />,
                className: 'min-w-[220px] flex-shrink-0',
                value: isTableLoading ? <Skeleton className="h-4 w-12" aria-hidden="true" /> : formatNumber(metricsData.counts.active),
                description: isTableLoading ? <Skeleton className="h-3 w-32" aria-hidden="true" /> : `${inactiveCountDisplay} inactive`,
                valueClassName: 'text-emerald-600',
            },
            {
                id: 'preventive-coverage',
                label: 'Preventive Coverage',
                icon: <Wrench className="h-3.5 w-3.5 text-amber-600" />,
                className: 'min-w-[220px] flex-shrink-0',
                value: isTableLoading ? <Skeleton className="h-4 w-14" aria-hidden="true" /> : formatNumber(preventiveCount),
                description: isTableLoading
                    ? <Skeleton className="h-3 w-40" aria-hidden="true" />
                    : `${formatNumber(correctiveCount)} corrective · ${formatNumber(emergencyCount)} emergency`,
                valueClassName: 'text-amber-600',
            },
            {
                id: 'average-interval',
                label: 'Average Interval',
                icon: <Gauge className="h-3.5 w-3.5 text-indigo-600" />,
                className: 'min-w-[220px] flex-shrink-0',
                value: isTableLoading ? <Skeleton className="h-4 w-20" aria-hidden="true" /> : averageKmDisplay,
                description: isTableLoading ? <Skeleton className="h-3 w-32" aria-hidden="true" /> : `Avg months ${averageMonthsDisplay}`,
                valueClassName: 'text-indigo-600',
            },
            {
                id: 'average-cost',
                label: 'Average Cost',
                icon: <DollarSign className="h-3.5 w-3.5 text-purple-600" />,
                className: 'min-w-[220px] flex-shrink-0',
                value: isTableLoading ? <Skeleton className="h-4 w-24" aria-hidden="true" /> : averageCostDisplay,
                description: isTableLoading ? <Skeleton className="h-3 w-32" aria-hidden="true" /> : `Total ${totalCostDisplay}`,
                valueClassName: 'text-purple-600',
            },
        ],
        [
            averageCostDisplay,
            averageKmDisplay,
            averageMonthsDisplay,
            categorySummary,
            correctiveCount,
            emergencyCount,
            inactiveCountDisplay,
            isTableLoading,
            metricsData.counts.active,
            metricsData.counts.total,
            preventiveCount,
            totalCostDisplay,
        ],
    );

    const statsSection = <ListingStatsHeader stats={statsDefinitions} orientation="row" />;

    const handleNavigate = React.useCallback(
        (overrides: NavigateOverrides = {}) => {
            const hasOverride = (key: keyof NavigateOverrides) =>
                Object.prototype.hasOwnProperty.call(overrides, key);

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

            const nextCategory = hasOverride('category')
                ? overrides.category
                : selectedCategory !== 'all'
                    ? selectedCategory
                    : undefined;

            const nextSort = hasOverride('sort') ? overrides.sort ?? sortColumn : sortColumn;
            const nextDirection = hasOverride('direction') ? overrides.direction ?? sortDirection : sortDirection;
            const nextPerPage = hasOverride('per_page') ? overrides.per_page : Number(perPage);
            const nextPage = hasOverride('page') ? overrides.page : undefined;

            const params: Record<string, string | number | undefined> = {
                search: nextSearch && nextSearch !== '' ? nextSearch : undefined,
                status: nextStatus && nextStatus !== 'all' ? nextStatus : undefined,
                category: nextCategory && nextCategory !== 'all' ? nextCategory : undefined,
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

            router.get('/maintenance-types', params, { preserveState: true, replace: false });
        },
        [perPage, searchTerm, selectedCategory, selectedStatus, sortColumn, sortDirection],
    );

    const handleSearchChange = (value: string) => {
        setSearchTerm(value);
        handleNavigate({ search: value.trim() ? value.trim() : undefined, page: 1 });
    };

    const handleStatusChange = (value: string) => {
        setSelectedStatus(value);
        handleNavigate({ status: value !== 'all' ? value : undefined, page: 1 });
    };

    const handleCategoryChange = (value: string) => {
        setSelectedCategory(value);
        handleNavigate({ category: value !== 'all' ? value : undefined, page: 1 });
    };

    const handlePerPageChange = (value: string) => {
        setPerPage(value);
        const numericValue = Number(value);
        handleNavigate({ per_page: Number.isNaN(numericValue) ? undefined : numericValue, page: 1 });
    };

    const handleSort = React.useCallback(
        (column: string) => {
            const newDirection: 'asc' | 'desc' =
                sortColumn === column && sortDirection === 'asc' ? 'desc' : 'asc';
            setSortColumn(column);
            setSortDirection(newDirection);
            handleNavigate({ sort: column, direction: newDirection });
        },
        [handleNavigate, sortColumn, sortDirection],
    );

    const handleSelectAll = React.useCallback(
        (value: boolean) => {
            if (value) {
                setSelectedIds(maintenanceTypeData.map((item) => item.id));
            } else {
                setSelectedIds([]);
            }
        },
        [maintenanceTypeData],
    );

    const handleSelectItem = React.useCallback((id: number, value: boolean) => {
        if (value) {
            setSelectedIds((current) => [...current, id]);
        } else {
            setSelectedIds((current) => current.filter((item) => item !== id));
        }
    }, []);

    const handleDeleteClick = React.useCallback(
        (maintenanceType: MaintenanceType) => {
            if (!canDeleteMaintenanceType) {
                return;
            }

            setSelectedMaintenanceType(maintenanceType);
            setDeleteDialogOpen(true);
        },
        [canDeleteMaintenanceType],
    );

    const handleDeleteDialogChange = React.useCallback((open: boolean) => {
        setDeleteDialogOpen(open);
        if (!open) {
            setSelectedMaintenanceType(null);
        }
    }, []);

    const handleDeleteConfirm = React.useCallback(() => {
        if (!selectedMaintenanceType) {
            return;
        }

        setIsDeleting(true);

        router.delete(`/maintenance-types/${selectedMaintenanceType.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                setDeleteDialogOpen(false);
                setSelectedMaintenanceType(null);
            },
            onError: () => {
                // Errors surface via flash messaging to ensure consistency across the app.
            },
            onFinish: () => {
                setIsDeleting(false);
            },
        });
    }, [selectedMaintenanceType]);

    React.useEffect(() => {
        setSelectedIds((current) =>
            current.filter((id) => maintenanceTypeData.some((item) => item.id === id)),
        );
    }, [maintenanceTypeData]);

    const isAllSelected = maintenanceTypeData.length > 0 && selectedIds.length === maintenanceTypeData.length;
    const isSomeSelected = selectedIds.length > 0 && selectedIds.length < maintenanceTypeData.length;
    const selectedCount = selectedIds.length;

    const tableColumns = React.useMemo<ListingTableColumn[]>(
        () => [
            {
                id: 'select',
                label: (
                    <Checkbox
                        aria-label="Select all maintenance types"
                        checked={isAllSelected ? true : isSomeSelected ? 'indeterminate' : false}
                        onCheckedChange={(value) => handleSelectAll(value === true)}
                        disabled={isTableLoading || maintenanceTypeData.length === 0}
                    />
                ),
                align: 'center',
                className: 'w-[52px]',
            },
            { id: 'index', label: '#', align: 'center', className: 'w-[64px]' },
            { id: 'name', label: 'Name', sortable: true },
            { id: 'category', label: 'Category', sortable: true },
            { id: 'interval_km', label: 'Interval KM' },
            { id: 'interval_months', label: 'Interval Months' },
            { id: 'estimated_cost', label: 'Cost', sortable: true, align: 'right' },
            { id: 'is_active', label: 'Status', sortable: true, align: 'center' },
            { id: 'actions', label: 'Actions', align: 'center' },
        ],
        [handleSelectAll, isAllSelected, isSomeSelected, isTableLoading, maintenanceTypeData.length],
    );

    const tableRows = React.useMemo(() => {
        if (isTableLoading) {
            return Array.from({ length: 8 }).map((_, index) => (
                <TableRow key={`skeleton-${index}`} aria-hidden="true">
                    <TableCell className="text-center">
                        <Skeleton className="h-4 w-4 mx-auto" />
                    </TableCell>
                    <TableCell className="text-center">
                        <Skeleton className="h-4 w-6 mx-auto" />
                    </TableCell>
                    <TableCell>
                        <Skeleton className="h-4 w-32" />
                    </TableCell>
                    <TableCell>
                        <Skeleton className="h-5 w-20 rounded-full" />
                    </TableCell>
                    <TableCell>
                        <Skeleton className="h-4 w-24" />
                    </TableCell>
                    <TableCell>
                        <Skeleton className="h-4 w-20" />
                    </TableCell>
                    <TableCell className="text-right">
                        <Skeleton className="h-4 w-20 ml-auto" />
                    </TableCell>
                    <TableCell className="text-center">
                        <Skeleton className="h-6 w-20 mx-auto rounded-full" />
                    </TableCell>
                    <TableCell className="text-center">
                        <Skeleton className="h-8 w-8 mx-auto rounded" />
                    </TableCell>
                </TableRow>
            ));
        }

        if (maintenanceTypeData.length === 0) {
            return [
                <TableRow key="maintenance-types-empty">
                    <TableCell colSpan={tableColumns.length} className="py-12 text-center text-muted-foreground">
                        No maintenance types found.
                        {canCreateMaintenanceType && (
                            <Link href="/maintenance-types/create" className="ml-1 text-primary underline">
                                Create one
                            </Link>
                        )}
                    </TableCell>
                </TableRow>,
            ];
        }

        return maintenanceTypeData.map((maintenanceType, index) => (
            <TableRow key={maintenanceType.id} className="hover:bg-muted/50">
                <TableCell className="text-center">
                    <Checkbox
                        aria-label={`Select ${maintenanceType.name}`}
                        checked={selectedIds.includes(maintenanceType.id)}
                        onCheckedChange={(value) => handleSelectItem(maintenanceType.id, value === true)}
                    />
                </TableCell>
                <TableCell className="text-center font-medium">{rowOffset + index + 1}</TableCell>
                <TableCell className="font-medium">
                    <div className="flex flex-col gap-1">
                        <span>{maintenanceType.name}</span>
                        <span className="text-xs text-muted-foreground">ID #{maintenanceType.id}</span>
                    </div>
                </TableCell>
                <TableCell>
                    <Badge variant="outline" className="border-slate-200 text-slate-700">
                        {maintenanceType.category}
                    </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">
                    {formatIntervalKm(maintenanceType.interval_km)}
                </TableCell>
                <TableCell className="text-muted-foreground">
                    {formatIntervalMonths(maintenanceType.interval_months)}
                </TableCell>
                <TableCell className="text-right font-medium text-slate-700 dark:text-slate-200">
                    {formatCurrency(maintenanceType.estimated_cost)}
                </TableCell>
                <TableCell className="text-center">{renderStatusBadge(maintenanceType.is_active)}</TableCell>
                <TableCell className="text-center">
                    <ListingRowActionsMenu
                        actions={[
                            canViewMaintenanceType && {
                                label: 'View',
                                icon: <Eye className="h-4 w-4" />,
                                href: `/maintenance-types/${maintenanceType.id}`,
                            },
                            canEditMaintenanceType && {
                                label: 'Edit',
                                icon: <Edit className="h-4 w-4" />,
                                href: `/maintenance-types/${maintenanceType.id}/edit`,
                            },
                            canDeleteMaintenanceType && {
                                label: 'Delete',
                                icon: <Trash2 className="h-4 w-4" />,
                                danger: true,
                                disabled: isDeleting && selectedMaintenanceType?.id === maintenanceType.id,
                                onSelect: () => handleDeleteClick(maintenanceType),
                            },
                        ]}
                    />
                </TableCell>
            </TableRow>
        ));
    }, [
        canCreateMaintenanceType,
        canDeleteMaintenanceType,
        canEditMaintenanceType,
        canViewMaintenanceType,
        handleDeleteClick,
        handleSelectItem,
        isDeleting,
        isTableLoading,
        maintenanceTypeData,
        rowOffset,
        selectedIds,
        selectedMaintenanceType,
        tableColumns.length,
    ]);

    const mobileItems = React.useMemo(
        () =>
            maintenanceTypeData.map((maintenanceType, index) => ({
                maintenanceType,
                position: rowOffset + index + 1,
            })),
        [maintenanceTypeData, rowOffset],
    );

    const mobileContent = isTableLoading ? (
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
            getKey={(item) => item.maintenanceType.id}
            renderTitle={(item) => (
                <div className="flex items-center gap-2">
                    <span className="text-xs uppercase tracking-wide text-muted-foreground">#{item.position}</span>
                    <span className="text-base font-semibold text-foreground">{item.maintenanceType.name}</span>
                </div>
            )}
            renderSubtitle={(item) => item.maintenanceType.category}
            renderContent={(item) => (
                <div className="space-y-3 text-sm text-muted-foreground">
                    <div className="flex items-center justify-between">
                        <span className="font-medium text-slate-600 dark:text-slate-300">Interval (KM)</span>
                        <span className="text-right text-slate-900 dark:text-slate-100">
                            {formatIntervalKm(item.maintenanceType.interval_km)}
                        </span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="font-medium text-slate-600 dark:text-slate-300">Interval (Months)</span>
                        <span className="text-right text-slate-900 dark:text-slate-100">
                            {formatIntervalMonths(item.maintenanceType.interval_months)}
                        </span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="font-medium text-slate-600 dark:text-slate-300">Estimated Cost</span>
                        <span className="text-right text-slate-900 dark:text-slate-100">
                            {formatCurrency(item.maintenanceType.estimated_cost)}
                        </span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="font-medium text-slate-600 dark:text-slate-300">Status</span>
                        <span className="text-right text-slate-900 dark:text-slate-100">
                            {renderStatusBadge(item.maintenanceType.is_active)}
                        </span>
                    </div>
                </div>
            )}
            renderFooter={(item) => (
                <div className="flex w-full flex-wrap items-center justify-end gap-2">
                    <Checkbox
                        aria-label={`Select ${item.maintenanceType.name}`}
                        checked={selectedIds.includes(item.maintenanceType.id)}
                        onCheckedChange={(value) => handleSelectItem(item.maintenanceType.id, value === true)}
                    />
                    <span className="text-xs text-muted-foreground">Select</span>
                    {canViewMaintenanceType && (
                        <Button asChild size="sm" variant="outline" className="flex-1 sm:flex-auto">
                            <Link href={`/maintenance-types/${item.maintenanceType.id}`}>
                                <Eye className="mr-2 h-4 w-4" />
                                View
                            </Link>
                        </Button>
                    )}
                    {canEditMaintenanceType && (
                        <Button asChild size="sm" variant="secondary" className="flex-1 sm:flex-none">
                            <Link href={`/maintenance-types/${item.maintenanceType.id}/edit`}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                            </Link>
                        </Button>
                    )}
                    {canDeleteMaintenanceType && (
                        <Button
                            size="sm"
                            variant="destructive"
                            className="flex-1 sm:flex-none"
                            onClick={() => handleDeleteClick(item.maintenanceType)}
                            disabled={isDeleting && selectedMaintenanceType?.id === item.maintenanceType.id}
                        >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                        </Button>
                    )}
                </div>
            )}
            emptyState={(
                <div className="py-8 text-center text-muted-foreground">
                    No maintenance types found.
                    {canCreateMaintenanceType && (
                        <Link href="/maintenance-types/create" className="ml-1 text-primary underline">
                            Create one
                        </Link>
                    )}
                </div>
            )}
        />
    );

    const tableContent = (
        <ListingTableShell
            columns={tableColumns}
            sort={{ column: sortColumn, direction: sortDirection, onToggle: handleSort }}
        >
            {tableRows}
        </ListingTableShell>
    );

    const handleBulkAction = (action: BulkActionType) => {
        if (selectedIds.length === 0) {
            return;
        }

        setBulkActionType(action);
        setBulkActionDialogOpen(true);
    };

    const handleBulkActionConfirm = () => {
        if (selectedIds.length === 0) {
            setBulkActionDialogOpen(false);
            return;
        }

        setIsBulkActionProcessing(true);

        const endpoints: Record<BulkActionType, string> = {
            delete: '/maintenance-types/bulk-delete',
            activate: '/maintenance-types/bulk-activate',
            deactivate: '/maintenance-types/bulk-deactivate',
        };

        const onError = () => {
            // Flash messaging handles user feedback for bulk actions.
        };

        const onSuccess = () => {
            setBulkActionDialogOpen(false);
            setSelectedIds([]);
        };

        const onFinish = () => {
            setIsBulkActionProcessing(false);
        };

        if (bulkActionType === 'delete') {
            router.delete(endpoints.delete, {
                data: { ids: selectedIds },
                preserveScroll: true,
                onSuccess,
                onError,
                onFinish,
            });
            return;
        }

        router.patch(
            endpoints[bulkActionType],
            { ids: selectedIds },
            {
                preserveScroll: true,
                onSuccess,
                onError,
                onFinish,
            },
        );
    };

    const selectionActions = selectedCount > 0 ? (
        <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground">{selectedCount} selected</span>
            {canDeleteMaintenanceType && (
                <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleBulkAction('delete')}
                    disabled={isBulkActionProcessing}
                >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                </Button>
            )}
            {canEditMaintenanceType && (
                <>
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleBulkAction('activate')}
                        disabled={isBulkActionProcessing}
                    >
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Activate
                    </Button>
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleBulkAction('deactivate')}
                        disabled={isBulkActionProcessing}
                    >
                        <XCircle className="mr-2 h-4 w-4" />
                        Deactivate
                    </Button>
                </>
            )}
            <Button size="sm" variant="ghost" onClick={() => setSelectedIds([])} disabled={isBulkActionProcessing}>
                Clear
            </Button>
        </div>
    ) : undefined;

    const perPageSelectOptions = React.useMemo(
        () => availablePerPageOptions.map((option) => ({ value: String(option), label: `${option} / page` })),
        [availablePerPageOptions],
    );

    const tableHeaderExtras = (
        <ListingFilterBar
            search={{
                value: searchTerm,
                placeholder: 'Search maintenance types...',
                onChange: handleSearchChange,
                icon: <Search className="h-4 w-4" />,
            }}
            perPage={{
                value: perPage,
                label: 'Rows',
                onChange: handlePerPageChange,
                options: perPageSelectOptions,
            }}
            trailing={selectionActions}
        >
            <Select value={selectedStatus} onValueChange={handleStatusChange}>
                <SelectTrigger className="w-full min-w-[150px] sm:w-auto">
                    <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    {safeStatusOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                            {option.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
            <Select value={selectedCategory} onValueChange={handleCategoryChange}>
                <SelectTrigger className="w-full min-w-[180px] sm:w-auto">
                    <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All categories</SelectItem>
                    {safeCategoryOptions.map((option) => (
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
            {canCreateMaintenanceType && (
                <Button asChild>
                    <Link href="/maintenance-types/create">
                        <Plus className="mr-2 h-4 w-4" />
                        Add Maintenance Type
                    </Link>
                </Button>
            )}
        </>
    );

    const bulkActionLabel = React.useMemo(
        () => bulkActionType.charAt(0).toUpperCase() + bulkActionType.slice(1),
        [bulkActionType],
    );

    return (
        <>
            <ListPageLayout
                headTitle="Maintenance Types"
                title="Maintenance Types"
                description={`Manage your catalog of ${formatNumber(totalMaintenanceTypes)} maintenance type${
                    totalMaintenanceTypes === 1 ? '' : 's'
                }`}
                breadcrumbs={breadcrumbs}
                actions={headerActions}
                stats={statsSection}
                tableTitle="Maintenance Types Directory"
                tableDescription="Complete list of all maintenance type templates"
                tableHeaderExtras={tableHeaderExtras}
                pagination={
                    !isTableLoading && links.length > 0 ? (
                        <ListingPaginationFooter
                            className="mt-4"
                            links={links}
                            from={meta.from ?? undefined}
                            to={meta.to ?? undefined}
                            total={meta.total ?? undefined}
                        />
                    ) : null
                }
            >
                <div className="hidden md:block">{tableContent}</div>

                <div className="space-y-3 md:hidden">
                    {mobileContent}
                </div>
            </ListPageLayout>

            <DeleteConfirmationDialog
                open={deleteDialogOpen}
                onOpenChange={handleDeleteDialogChange}
                title="Delete Maintenance Type"
                description="Are you sure you want to delete this maintenance type? This action cannot be undone."
                itemName={selectedMaintenanceType?.name}
                onConfirm={handleDeleteConfirm}
                isLoading={isDeleting}
            />

            <DeleteConfirmationDialog
                open={bulkActionDialogOpen}
                onOpenChange={setBulkActionDialogOpen}
                title={`Bulk ${bulkActionLabel} Maintenance Types`}
                description={`Are you sure you want to ${bulkActionType} ${selectedCount} maintenance type(s)? ${
                    bulkActionType === 'delete'
                        ? 'This action cannot be undone.'
                        : 'This will update the status of all selected maintenance types.'
                }`}
                itemName={`${selectedCount} maintenance type(s)`}
                onConfirm={handleBulkActionConfirm}
                isLoading={isBulkActionProcessing}
                isDangerous={bulkActionType === 'delete'}
                confirmLabel={`${bulkActionLabel} ${selectedCount > 1 ? 'Types' : 'Type'}`}
            />
        </>
    );
}
