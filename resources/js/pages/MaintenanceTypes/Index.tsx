import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TableCell, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
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
import { toast } from '@/hooks/use-toast';
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
    AlertTriangle,
} from 'lucide-react';
import * as React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

const SKELETON_FLAG_KEY = 'maintenance-types.index.shouldShowSkeleton';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Maintenance',
        href: '/maintenance',
    },
    {
        title: 'Maintenance Types',
        href: '/maintenance-types',
    },
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
    trucks_count?: number;
    active_trucks_count?: number;
    created_at?: string | null;
}

interface MaintenanceTypesCollection {
    data: MaintenanceType[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
    links: Array<{
        url: string | null;
        label: string;
        active: boolean;
    }>;
}

interface MaintenanceTypeStatistics {
    total: number;
    active: number;
    inactive: number;
    preventive: number;
    corrective: number;
    emergency: number;
}

interface MaintenanceTypeFilters {
    search?: string | null;
    sort?: string | null;
    direction?: 'asc' | 'desc' | null;
    per_page?: number | null;
}

type BulkActionType = 'delete' | 'activate' | 'deactivate';

type NavigateOverrides = {
    search?: string;
    sort?: string;
    direction?: 'asc' | 'desc';
    page?: number;
    per_page?: number;
};

interface MaintenanceTypesIndexProps {
    maintenanceTypes?: MaintenanceTypesCollection;
    statistics?: MaintenanceTypeStatistics;
    filters?: MaintenanceTypeFilters;
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

const formatCurrency = (value: number | string | null | undefined): string => {
    const numeric = toNumeric(value);
    if (numeric === null) {
        return '$0.00';
    }

    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(numeric);
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

const getStatusBadge = (isActive: boolean) => (
    <Badge variant={isActive ? 'default' : 'secondary'}>
        {isActive ? 'Active' : 'Inactive'}
    </Badge>
);

const getCategoryBadgeVariant = (category: string) => {
    switch (category.toLowerCase()) {
        case 'preventive':
            return 'default' as const;
        case 'corrective':
            return 'secondary' as const;
        case 'emergency':
            return 'destructive' as const;
        default:
            return 'outline' as const;
    }
};

export default function MaintenanceTypesIndex({ maintenanceTypes, statistics, filters }: MaintenanceTypesIndexProps) {
    const { hasPermission } = usePermissions();

    const safeMaintenanceTypes = maintenanceTypes ?? {
        data: [],
        current_page: 1,
        last_page: 1,
        per_page: 15,
        total: 0,
        from: 0,
        to: 0,
        links: [],
    };

    const safeStatistics = statistics ?? {
        total: 0,
        active: 0,
        inactive: 0,
        preventive: 0,
        corrective: 0,
        emergency: 0,
    };

    const safeFilters = filters ?? {
        search: '',
        sort: 'name',
        direction: 'asc',
        per_page: safeMaintenanceTypes.per_page,
    };

    const [searchTerm, setSearchTerm] = React.useState<string>(safeFilters.search ?? '');
    const [sortColumn, setSortColumn] = React.useState<string>(safeFilters.sort ?? 'name');
    const [sortDirection, setSortDirection] = React.useState<'asc' | 'desc'>(
        safeFilters.direction === 'desc' ? 'desc' : 'asc',
    );
    const [perPage, setPerPage] = React.useState<string>(() => String(safeFilters.per_page ?? safeMaintenanceTypes.per_page ?? 15));
    const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
    const [selectedMaintenanceType, setSelectedMaintenanceType] = React.useState<MaintenanceType | null>(null);
    const [isDeleting, setIsDeleting] = React.useState(false);

    const [selectedIds, setSelectedIds] = React.useState<number[]>([]);
    const [bulkActionDialogOpen, setBulkActionDialogOpen] = React.useState(false);
    const [bulkActionType, setBulkActionType] = React.useState<BulkActionType>('delete');
    const [isBulkActionProcessing, setIsBulkActionProcessing] = React.useState(false);

    const maintenanceTypeData = safeMaintenanceTypes.data ?? [];
    const totalMaintenanceTypes = safeMaintenanceTypes.total ?? maintenanceTypeData.length ?? 0;

    const availablePerPageOptions = React.useMemo(() => {
        const base = [10, 15, 25, 50, 100];
        const serverPerPage = safeMaintenanceTypes.per_page;
        if (serverPerPage && !base.includes(serverPerPage)) {
            base.push(serverPerPage);
        }
        return Array.from(new Set(base)).sort((a, b) => a - b);
    }, [safeMaintenanceTypes.per_page]);

    const resolvedPerPage = React.useMemo(() => {
        const candidate = safeFilters.per_page ?? safeMaintenanceTypes.per_page;
        if (typeof candidate === 'number' && availablePerPageOptions.includes(candidate)) {
            return candidate;
        }

        return availablePerPageOptions[0] ?? 15;
    }, [availablePerPageOptions, safeFilters.per_page, safeMaintenanceTypes.per_page]);

    React.useEffect(() => {
        setSearchTerm(safeFilters.search ?? '');
    }, [safeFilters.search]);

    React.useEffect(() => {
        setSortColumn(safeFilters.sort ?? 'name');
    }, [safeFilters.sort]);

    React.useEffect(() => {
        setSortDirection(safeFilters.direction === 'desc' ? 'desc' : 'asc');
    }, [safeFilters.direction]);

    React.useEffect(() => {
        setPerPage(String(resolvedPerPage));
    }, [resolvedPerPage]);

    const isDataReady = Array.isArray(maintenanceTypeData);
    const { isLoading: isTableLoading } = useListingLoading({
        storageKey: SKELETON_FLAG_KEY,
        isDataReady,
        minimumDuration: 200,
        onlySamePath: true,
        initialIsLoading: false,
    });

    const rowOffset = Math.max((safeMaintenanceTypes.from ?? 1) - 1, 0);

    const canCreateMaintenanceType = hasPermission('maintenance-types.create');
    const canEditMaintenanceType = hasPermission('maintenance-types.edit');
    const canDeleteMaintenanceType = hasPermission('maintenance-types.destroy');

    const handleNavigate = React.useCallback(
        (overrides: NavigateOverrides = {}) => {
            const hasOverride = (key: keyof NavigateOverrides) => Object.prototype.hasOwnProperty.call(overrides, key);

            const nextSearch = hasOverride('search')
                ? overrides.search
                : searchTerm.trim()
                    ? searchTerm.trim()
                    : undefined;

            const nextSort = hasOverride('sort') ? overrides.sort ?? sortColumn : sortColumn;
            const nextDirection = hasOverride('direction') ? overrides.direction ?? sortDirection : sortDirection;
            const nextPerPage = hasOverride('per_page') ? overrides.per_page : Number(perPage);
            const nextPage = hasOverride('page') ? overrides.page : undefined;

            const params: Record<string, string | number | undefined> = {
                search: nextSearch && nextSearch !== '' ? nextSearch : undefined,
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
        [perPage, searchTerm, sortColumn, sortDirection],
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

        const onError = (errors: unknown) => {
            if (errors && typeof errors === 'object') {
                const messages = Object.values(errors as Record<string, unknown>)
                    .flatMap((value) => (Array.isArray(value) ? value : [value]))
                    .filter(Boolean)
                    .join('\n');

                if (messages) {
                    toast({
                        title: '❌ Bulk Action Failed',
                        description: messages,
                        variant: 'destructive',
                    });
                }
            }
        };

        const onSuccess = () => {
            setBulkActionDialogOpen(false);
            setSelectedIds([]);
            toast({
                title: '✅ Bulk Action Completed',
                description: `Successfully ${bulkActionType}d ${selectedIds.length} maintenance type(s).`,
            });
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

    const handleDeleteClick = React.useCallback((maintenanceType: MaintenanceType) => {
        if (!canDeleteMaintenanceType) {
            return;
        }

        setSelectedMaintenanceType(maintenanceType);
        setDeleteDialogOpen(true);
    }, [canDeleteMaintenanceType]);

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
                toast({
                    title: '✅ Deleted',
                    description: 'Maintenance type has been successfully deleted.',
                });
            },
            onError: (errors) => {
                const messages = Object.values(errors as Record<string, unknown>)
                    .flatMap((value) => (Array.isArray(value) ? value : [value]))
                    .filter(Boolean)
                    .join('\n');

                if (messages) {
                    toast({
                        title: '❌ Delete Failed',
                        description: messages,
                        variant: 'destructive',
                    });
                }
            },
            onFinish: () => {
                setIsDeleting(false);
            },
        });
    }, [selectedMaintenanceType]);

    React.useEffect(() => {
        setSelectedIds((current) => current.filter((id) => maintenanceTypeData.some((item) => item.id === id)));
    }, [maintenanceTypeData]);

    const isAllSelected = maintenanceTypeData.length > 0 && selectedIds.length === maintenanceTypeData.length;
    const isSomeSelected = selectedIds.length > 0 && selectedIds.length < maintenanceTypeData.length;
    const selectedCount = selectedIds.length;

    const statsDefinitions = React.useMemo<ListingStatDefinition[]>(
        () => [
            {
                id: 'total-types',
                label: 'Total Types',
                value: isTableLoading ? <Skeleton className="h-4 w-16" aria-hidden="true" /> : formatNumber(safeStatistics.total),
                description: isTableLoading ? <Skeleton className="h-3 w-24" aria-hidden="true" /> : 'All maintenance types',
                icon: <Settings className="h-3.5 w-3.5 text-slate-600" />,
                valueClassName: isTableLoading ? undefined : 'text-slate-700',
            },
            {
                id: 'active-types',
                label: 'Active',
                value: isTableLoading ? <Skeleton className="h-4 w-14" aria-hidden="true" /> : formatNumber(safeStatistics.active),
                description: isTableLoading ? <Skeleton className="h-3 w-28" aria-hidden="true" /> : 'Currently active',
                icon: <Wrench className="h-3.5 w-3.5 text-emerald-600" />,
                valueClassName: isTableLoading ? undefined : 'text-emerald-600',
            },
            {
                id: 'inactive-types',
                label: 'Inactive',
                value: isTableLoading ? <Skeleton className="h-4 w-16" aria-hidden="true" /> : formatNumber(safeStatistics.inactive),
                description: isTableLoading ? <Skeleton className="h-3 w-28" aria-hidden="true" /> : 'Currently inactive',
                icon: <Trash2 className="h-3.5 w-3.5 text-rose-600" />,
                valueClassName: isTableLoading ? undefined : 'text-rose-600',
            },
            {
                id: 'preventive-types',
                label: 'Preventive',
                value: isTableLoading ? <Skeleton className="h-4 w-16" aria-hidden="true" /> : formatNumber(safeStatistics.preventive),
                description: isTableLoading ? <Skeleton className="h-3 w-32" aria-hidden="true" /> : 'Preventive tasks',
                icon: <CheckCircle className="h-3.5 w-3.5 text-blue-600" />,
                valueClassName: isTableLoading ? undefined : 'text-blue-600',
            },
            {
                id: 'corrective-types',
                label: 'Corrective',
                value: isTableLoading ? <Skeleton className="h-4 w-16" aria-hidden="true" /> : formatNumber(safeStatistics.corrective),
                description: isTableLoading ? <Skeleton className="h-3 w-32" aria-hidden="true" /> : 'Corrective tasks',
                icon: <Edit className="h-3.5 w-3.5 text-orange-600" />,
                valueClassName: isTableLoading ? undefined : 'text-orange-600',
            },
            {
                id: 'emergency-types',
                label: 'Emergency',
                value: isTableLoading ? <Skeleton className="h-4 w-16" aria-hidden="true" /> : formatNumber(safeStatistics.emergency),
                description: isTableLoading ? <Skeleton className="h-3 w-32" aria-hidden="true" /> : 'Emergency tasks',
                icon: <AlertTriangle className="h-3.5 w-3.5 text-red-600" />,
                valueClassName: isTableLoading ? undefined : 'text-red-600',
            },
        ],
        [isTableLoading, safeStatistics.active, safeStatistics.corrective, safeStatistics.emergency, safeStatistics.inactive, safeStatistics.preventive, safeStatistics.total],
    );

    const statsSection = <ListingStatsHeader stats={statsDefinitions} orientation="row" />;

    const perPageSelectOptions = React.useMemo(
        () => availablePerPageOptions.map((option) => ({ value: String(option), label: `${option} / page` })),
        [availablePerPageOptions],
    );

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

        return maintenanceTypeData.map((maintenanceType) => (
            <TableRow key={maintenanceType.id} className="hover:bg-muted/50">
                <TableCell className="text-center">
                    <Checkbox
                        aria-label={`Select ${maintenanceType.name}`}
                        checked={selectedIds.includes(maintenanceType.id)}
                        onCheckedChange={(value) => handleSelectItem(maintenanceType.id, value === true)}
                    />
                </TableCell>
                <TableCell className="font-medium">
                    <div className="flex flex-col gap-1">
                        <span>{maintenanceType.name}</span>
                        <span className="text-xs text-muted-foreground">ID #{maintenanceType.id}</span>
                    </div>
                </TableCell>
                <TableCell>
                    <Badge variant={getCategoryBadgeVariant(maintenanceType.category)}>
                        {maintenanceType.category}
                    </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">{formatIntervalKm(maintenanceType.interval_km)}</TableCell>
                <TableCell className="text-muted-foreground">{formatIntervalMonths(maintenanceType.interval_months)}</TableCell>
                <TableCell className="text-right font-medium text-slate-700 dark:text-slate-200">
                    {formatCurrency(maintenanceType.estimated_cost)}
                </TableCell>
                <TableCell className="text-center">{getStatusBadge(maintenanceType.is_active)}</TableCell>
                <TableCell className="text-center">
                    <ListingRowActionsMenu
                        actions={[
                            {
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
        handleSelectItem,
        handleDeleteClick,
        isDeleting,
        maintenanceTypeData,
        selectedIds,
        selectedMaintenanceType,
        tableColumns,
    ]);

    const mobileItems = React.useMemo(
        () => maintenanceTypeData.map((maintenanceType, index) => ({ maintenanceType, position: rowOffset + index + 1 })),
        [maintenanceTypeData, rowOffset],
    );

    const mobileContent = (
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
                        <span className="text-right text-slate-900 dark:text-slate-100">{formatIntervalKm(item.maintenanceType.interval_km)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="font-medium text-slate-600 dark:text-slate-300">Interval (Months)</span>
                        <span className="text-right text-slate-900 dark:text-slate-100">{formatIntervalMonths(item.maintenanceType.interval_months)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="font-medium text-slate-600 dark:text-slate-300">Estimated Cost</span>
                        <span className="text-right text-slate-900 dark:text-slate-100">{formatCurrency(item.maintenanceType.estimated_cost)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="font-medium text-slate-600 dark:text-slate-300">Status</span>
                        <span className="text-right text-slate-900 dark:text-slate-100">{getStatusBadge(item.maintenanceType.is_active)}</span>
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
                    <Button asChild size="sm" variant="outline" className="flex-1 sm:flex-auto">
                        <Link href={`/maintenance-types/${item.maintenanceType.id}`}>
                            <Eye className="mr-2 h-4 w-4" />
                            View
                        </Link>
                    </Button>
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
        <div className="relative">
            <ListingTableShell
                columns={tableColumns}
                sort={{ column: sortColumn, direction: sortDirection, onToggle: handleSort }}
            >
                {tableRows}
            </ListingTableShell>

            {isTableLoading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-background/80 backdrop-blur-sm">
                    <img src="/images/loading-spinner.svg" alt="Loading maintenance types" className="h-12 w-12" />
                    <span className="text-sm text-muted-foreground">Loading maintenance types...</span>
                </div>
            )}
        </div>
    );

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
        />
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

    const capitalize = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);
    const bulkActionLabel = capitalize(bulkActionType);

    return (
        <>
            <ListPageLayout
                headTitle="Maintenance Types"
                title="Maintenance Types"
                description={`Manage your catalog of ${formatNumber(totalMaintenanceTypes)} maintenance type${totalMaintenanceTypes === 1 ? '' : 's'}`}
                breadcrumbs={breadcrumbs}
                actions={headerActions}
                stats={statsSection}
                tableTitle="Maintenance Types Directory"
                tableDescription="Complete list of all maintenance type templates"
                tableHeaderExtras={tableHeaderExtras}
                pagination={
                    !isTableLoading && safeMaintenanceTypes.links.length > 0 ? (
                        <ListingPaginationFooter
                            className="mt-4"
                            links={safeMaintenanceTypes.links}
                            from={safeMaintenanceTypes.from}
                            to={safeMaintenanceTypes.to}
                            total={safeMaintenanceTypes.total}
                        />
                    ) : null
                }
            >
                <div className="hidden md:block">{tableContent}</div>

                <div className="relative space-y-3 md:hidden">
                    {mobileContent}

                    {isTableLoading && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-background/80 backdrop-blur-sm">
                            <img src="/images/loading-spinner.svg" alt="Loading maintenance types" className="h-10 w-10" />
                            <span className="text-sm text-muted-foreground">Loading maintenance types...</span>
                        </div>
                    )}
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
