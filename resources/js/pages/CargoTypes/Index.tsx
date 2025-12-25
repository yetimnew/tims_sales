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
import * as React from 'react';
import {
    Plus,
    Eye,
    Edit,
    Search,
    Trash2,
    Boxes,
    Package,
    Scale,
    ClipboardList,
    ChevronRight,
    Download,
} from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Cargo Types',
        href: '/cargo-types',
    },
];

interface CargoTypeSummary {
    id: number;
    name: string;
    category: string;
    weight_per_cubic_meter?: number | null;
    requires_special_equipment: boolean;
    handling_requirements?: string | null;
    safety_requirements?: string | null;
}

interface CargoTypesIndexProps {
    cargoTypes: {
        data: CargoTypeSummary[];
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
    metrics: {
        total: number;
        requires_special_equipment: number;
        without_special_equipment: number;
        average_weight: number;
        distinct_categories: number;
    };
    filters: {
        search?: string | null;
        category?: string | null;
        requires_special_equipment?: string | null;
        sort?: string | null;
        direction?: 'asc' | 'desc' | null;
        per_page?: number | null;
    };
    categoryOptions: Array<{ label: string; value: string }>;
    perPageOptions: number[];
}

const SKELETON_FLAG_KEY = 'cargo-types.index.shouldShowSkeleton';

const COLUMN_DEFINITIONS: Array<{
    id: keyof CargoTypeSummary | 'weight';
    label: string;
    sortKey?: string;
    align?: 'center' | 'right';
}> = [
    { id: 'name', label: 'Name', sortKey: 'name' },
    { id: 'category', label: 'Category', sortKey: 'category' },
    { id: 'weight', label: 'Weight / m³', sortKey: 'weight_per_cubic_meter', align: 'right' },
    { id: 'requires_special_equipment', label: 'Special Equipment', sortKey: 'requires_special_equipment', align: 'center' },
];

const SPECIAL_EQUIPMENT_OPTIONS: Array<{ label: string; value: string }> = [
    { label: 'All types', value: 'all' },
    { label: 'Requires special equipment', value: '1' },
    { label: 'No special equipment', value: '0' },
];

const formatWeight = (value?: number | null): string => {
    if (typeof value !== 'number' || Number.isNaN(value)) {
        return '—';
    }

    return `${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} kg`;
};

const formatNumber = (value?: number | null): string => {
    if (typeof value !== 'number' || Number.isNaN(value)) {
        return '0';
    }

    return value.toLocaleString();
};

export default function CargoTypesIndex({
    cargoTypes,
    metrics,
    filters,
    categoryOptions,
    perPageOptions,
}: CargoTypesIndexProps) {
    const { hasPermission } = usePermissions();
    const canViewCargoType = hasPermission('cargo-types.show');
    const canEditCargoType = hasPermission('cargo-types.edit');
    const canDeleteCargoType = hasPermission('cargo-types.destroy');
    const canCreateCargoType = hasPermission('cargo-types.create');
    const canExportCargoTypes = hasPermission('cargo-types.export');

    const [searchTerm, setSearchTerm] = React.useState(filters?.search ?? '');
    const [selectedCategory, setSelectedCategory] = React.useState(filters?.category ?? 'all');
    const [selectedSpecialEquipment, setSelectedSpecialEquipment] = React.useState(
        filters?.requires_special_equipment ?? 'all',
    );
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
    const [selectedType, setSelectedType] = React.useState<CargoTypeSummary | null>(null);
    const [isDeleting, setIsDeleting] = React.useState(false);
    const [deleteError, setDeleteError] = React.useState<string | null>(null);

    const isDataReady = Array.isArray(cargoTypes?.data);
    const { isLoading: isTableLoading } = useListingLoading({
        storageKey: SKELETON_FLAG_KEY,
        isDataReady,
        minimumDuration: 200,
        onlySamePath: true,
        targetPath: '/cargo-types',
        initialIsLoading: true,
    });

    React.useEffect(() => {
        setPerPage(String(resolvedPerPage));
    }, [resolvedPerPage]);

    const cargoTypeData = cargoTypes?.data ?? [];
    const totalRecords = metrics?.total ?? cargoTypes?.total ?? cargoTypeData.length ?? 0;
    const currentPage = cargoTypes?.current_page ?? 1;
    const perPageCountRaw = cargoTypes?.per_page ?? Number(perPage);
    const perPageCount =
        Number.isFinite(perPageCountRaw) && perPageCountRaw && perPageCountRaw > 0
            ? Number(perPageCountRaw)
            : cargoTypeData.length || 1;
    const rowOffset = (currentPage - 1) * perPageCount;

    const handleNavigate = React.useCallback(
        (overrides: {
            search?: string;
            category?: string;
            requires_special_equipment?: string;
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

            const nextCategory = hasOverride('category')
                ? overrides.category
                : selectedCategory !== 'all'
                    ? selectedCategory
                    : undefined;

            const nextSpecialEquipment = hasOverride('requires_special_equipment')
                ? overrides.requires_special_equipment
                : selectedSpecialEquipment !== 'all'
                    ? selectedSpecialEquipment
                    : undefined;

            const nextSort = hasOverride('sort') ? overrides.sort ?? sortColumn : sortColumn;
            const nextDirection = hasOverride('direction') ? overrides.direction ?? sortDirection : sortDirection;
            const nextPerPage = hasOverride('per_page') ? overrides.per_page : Number(perPage);
            const nextPage = hasOverride('page') ? overrides.page : undefined;

            const params: Record<string, string | number | undefined> = {
                search: nextSearch && nextSearch !== '' ? nextSearch : undefined,
                category: nextCategory && nextCategory !== 'all' ? nextCategory : undefined,
                requires_special_equipment:
                    nextSpecialEquipment && nextSpecialEquipment !== 'all' ? nextSpecialEquipment : undefined,
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

            router.get('/cargo-types', params, { preserveState: true, replace: false });
        },
        [perPage, searchTerm, selectedCategory, selectedSpecialEquipment, sortColumn, sortDirection],
    );

    const handleSearchChange = (value: string) => {
        setSearchTerm(value);
        handleNavigate({ search: value.trim() ? value.trim() : undefined, page: 1 });
    };

    const handleCategoryChange = (value: string) => {
        setSelectedCategory(value);
        handleNavigate({ category: value !== 'all' ? value : undefined, page: 1 });
    };

    const handleSpecialEquipmentChange = (value: string) => {
        setSelectedSpecialEquipment(value);
        handleNavigate({ requires_special_equipment: value !== 'all' ? value : undefined, page: 1 });
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

    const handleDeleteClick = (type: CargoTypeSummary) => {
        setSelectedType(type);
        setDeleteDialogOpen(true);
        setDeleteError(null);
    };

    const handleDeleteConfirm = () => {
        if (!selectedType) {
            return;
        }

        setIsDeleting(true);

        router.delete(`/cargo-types/${selectedType.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                setDeleteDialogOpen(false);
                setSelectedType(null);
                setIsDeleting(false);
                setDeleteError(null);
                toast({
                    title: 'Cargo type deleted',
                    description: 'The cargo type was removed successfully.',
                });
            },
            onError: (errors) => {
                setIsDeleting(false);

                const fallback = 'Failed to delete cargo type. Please review the requirements and try again.';
                if (errors && typeof errors === 'object') {
                    const messages = Object.values(errors)
                        .flatMap((value) => (Array.isArray(value) ? value : [value]))
                        .filter((value) => Boolean(value))
                        .join('\n');

                    setDeleteError(messages || fallback);

                    toast({
                        title: '❌ Delete Failed',
                        description: messages || fallback,
                        variant: 'destructive',
                    });
                } else {
                    setDeleteError(fallback);

                    toast({
                        title: '❌ Delete Failed',
                        description: fallback,
                        variant: 'destructive',
                    });
                }
            },
        });
    };

    const handleExport = React.useCallback(() => {
        const params = new URLSearchParams();
        if (searchTerm.trim()) {
            params.set('search', searchTerm.trim());
        }
        if (selectedCategory !== 'all') {
            params.set('category', selectedCategory);
        }
        if (selectedSpecialEquipment !== 'all') {
            params.set('requires_special_equipment', selectedSpecialEquipment);
        }
        params.set('sort', sortColumn);
        params.set('direction', sortDirection);

        const queryString = params.toString();
        window.location.href = queryString ? `/cargo-types/export?${queryString}` : '/cargo-types/export';
    }, [searchTerm, selectedCategory, selectedSpecialEquipment, sortColumn, sortDirection]);

    const getCategoryBadgeClass = (category: string): string => {
        const normalized = category.toLowerCase();
        if (normalized.includes('general')) {
            return 'bg-slate-500 text-white hover:bg-slate-600';
        }
        if (normalized.includes('construct')) {
            return 'bg-blue-500 text-white hover:bg-blue-600';
        }
        if (normalized.includes('agri')) {
            return 'bg-emerald-500 text-white hover:bg-emerald-600';
        }
        if (normalized.includes('industrial')) {
            return 'bg-orange-500 text-white hover:bg-orange-600';
        }
        if (normalized.includes('food')) {
            return 'bg-rose-500 text-white hover:bg-rose-600';
        }
        if (normalized.includes('consumer')) {
            return 'bg-purple-500 text-white hover:bg-purple-600';
        }
        return 'bg-muted text-muted-foreground';
    };

    const statsDefinitions = [
        {
            id: 'cargo-types',
            label: 'Cargo Types',
            icon: <Boxes className="h-3.5 w-3.5 text-blue-600" />,
            className: 'min-w-[220px] flex-shrink-0',
            value: isTableLoading ? (
                <Skeleton className="h-3.5 w-20" aria-hidden="true" />
            ) : (
                formatNumber(metrics?.total)
            ),
            description: isTableLoading ? (
                <Skeleton className="h-3 w-36" aria-hidden="true" />
            ) : (
                `${formatNumber(metrics?.distinct_categories)} categories`
            ),
            valueClassName: isTableLoading ? undefined : 'text-blue-600',
        },
        {
            id: 'special-equipment',
            label: 'Special Equipment',
            icon: <Package className="h-3.5 w-3.5 text-purple-600" />,
            className: 'min-w-[220px] flex-shrink-0',
            value: isTableLoading ? (
                <Skeleton className="h-3.5 w-20" aria-hidden="true" />
            ) : (
                formatNumber(metrics?.requires_special_equipment)
            ),
            description: isTableLoading ? (
                <Skeleton className="h-3 w-36" aria-hidden="true" />
            ) : (
                `${formatNumber(metrics?.without_special_equipment)} standard`
            ),
            valueClassName: isTableLoading ? undefined : 'text-purple-600',
        },
        {
            id: 'average-weight',
            label: 'Average Weight',
            icon: <Scale className="h-3.5 w-3.5 text-emerald-600" />,
            className: 'min-w-[220px] flex-shrink-0',
            value: isTableLoading ? (
                <Skeleton className="h-3.5 w-24" aria-hidden="true" />
            ) : (
                metrics?.average_weight
                    ? `${metrics.average_weight.toFixed(2)} kg`
                    : '0.00 kg'
            ),
            description: isTableLoading ? (
                <Skeleton className="h-3 w-28" aria-hidden="true" />
            ) : (
                'Per cubic meter'
            ),
            valueClassName: isTableLoading ? undefined : 'text-emerald-600',
        },
        {
            id: 'handling-notes',
            label: 'Handling Notes',
            icon: <ClipboardList className="h-3.5 w-3.5 text-amber-600" />,
            className: 'min-w-[220px] flex-shrink-0',
            value: isTableLoading ? (
                <Skeleton className="h-3.5 w-20" aria-hidden="true" />
            ) : (
                formatNumber(metrics?.total)
            ),
            description: isTableLoading ? (
                <Skeleton className="h-3 w-32" aria-hidden="true" />
            ) : (
                'Review safety requirements'
            ),
            valueClassName: isTableLoading ? undefined : 'text-amber-600',
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
                id: String(column.id),
                label: column.label,
                sortable: Boolean(column.sortKey),
                sortKey: column.sortKey,
                align: column.align,
            })),
            { id: 'actions', label: 'Actions', align: 'center' as const },
        ],
        [],
    );

    const tableRows = cargoTypeData.length > 0
        ? cargoTypeData.map((type, index) => (
              <TableRow key={type.id} className="hover:bg-muted/50">
                  <TableCell className="text-center font-medium">{rowOffset + index + 1}</TableCell>
                  <TableCell className="font-semibold">{type.name}</TableCell>
                  <TableCell>
                      <Badge className={getCategoryBadgeClass(type.category)}>{type.category}</Badge>
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                      {formatWeight(type.weight_per_cubic_meter)}
                  </TableCell>
                  <TableCell className="text-center">
                      {type.requires_special_equipment ? (
                          <Badge className="bg-rose-500 text-white hover:bg-rose-600">Required</Badge>
                      ) : (
                          <span className="text-muted-foreground">Not required</span>
                      )}
                  </TableCell>
                  <TableCell className="text-center">
                      <ListingRowActionsMenu
                          actions={[
                              canViewCargoType && {
                                  label: 'View',
                                  icon: <Eye className="h-4 w-4" />,
                                  href: `/cargo-types/${type.id}`,
                              },
                              canEditCargoType && {
                                  label: 'Edit',
                                  icon: <Edit className="h-4 w-4" />,
                                  href: `/cargo-types/${type.id}/edit`,
                              },
                              canDeleteCargoType && {
                                  label: 'Delete',
                                  icon: <Trash2 className="h-4 w-4" />,
                                  danger: true,
                                  disabled: isDeleting && selectedType?.id === type.id,
                                  onSelect: () => handleDeleteClick(type),
                              },
                          ]}
                      />
                  </TableCell>
              </TableRow>
          ))
        : (
            <TableRow>
                <TableCell colSpan={tableColumns.length} className="py-8 text-center text-muted-foreground">
                    No cargo types found.
                    {canCreateCargoType && (
                        <Link href="/cargo-types/create" className="ml-1 text-primary underline">
                            Create one
                        </Link>
                    )}
                </TableCell>
            </TableRow>
        );

    const mobileItems = React.useMemo(
        () =>
            cargoTypeData.map((type, index) => ({
                record: type,
                position: rowOffset + index + 1,
            })),
        [cargoTypeData, rowOffset],
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
                    <img src="/images/loading-spinner.svg" alt="Loading cargo types" className="h-12 w-12" />
                    <span className="text-sm text-muted-foreground">Loading cargo types...</span>
                </div>
            )}
        </div>
    );

    const mobileContent = (
        <ListingMobileItemList
            items={mobileItems}
            getKey={(item) => item.record.id}
            renderTitle={(item) => (
                <div className="flex items-center gap-2">
                    <span className="text-xs uppercase tracking-wide text-muted-foreground">#{item.position}</span>
                    <span className="text-base">{item.record.name}</span>
                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
            )}
            renderSubtitle={(item) => item.record.category}
            renderContent={(item) => (
                <div className="space-y-3 text-sm text-muted-foreground">
                    <div className="flex items-center justify-between">
                        <span className="font-medium text-slate-600 dark:text-slate-300">Weight / m³</span>
                        <span className="text-right text-slate-900 dark:text-slate-100">
                            {formatWeight(item.record.weight_per_cubic_meter)}
                        </span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="font-medium text-slate-600 dark:text-slate-300">Special equipment</span>
                        <span className="text-right text-slate-900 dark:text-slate-100">
                            {item.record.requires_special_equipment ? 'Required' : 'Not required'}
                        </span>
                    </div>
                    {(item.record.handling_requirements || item.record.safety_requirements) && (
                        <div className="space-y-1">
                            {item.record.handling_requirements && (
                                <div>
                                    <span className="text-xs uppercase text-muted-foreground">Handling</span>
                                    <p className="text-sm text-slate-900 dark:text-slate-100">
                                        {item.record.handling_requirements}
                                    </p>
                                </div>
                            )}
                            {item.record.safety_requirements && (
                                <div>
                                    <span className="text-xs uppercase text-muted-foreground">Safety</span>
                                    <p className="text-sm text-slate-900 dark:text-slate-100">
                                        {item.record.safety_requirements}
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
            renderFooter={(item) => (
                <div className="flex w-full flex-wrap items-center justify-end gap-2">
                    {canViewCargoType && (
                        <Button asChild size="sm" variant="outline" className="flex-1 sm:flex-auto">
                            <Link href={`/cargo-types/${item.record.id}`}>
                                <Eye className="mr-2 h-4 w-4" />
                                View
                            </Link>
                        </Button>
                    )}
                    {canEditCargoType && (
                        <Button asChild size="sm" variant="secondary" className="flex-1 sm:flex-none">
                            <Link href={`/cargo-types/${item.record.id}/edit`}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                            </Link>
                        </Button>
                    )}
                    {canDeleteCargoType && (
                        <Button
                            size="sm"
                            variant="destructive"
                            className="flex-1 sm:flex-none"
                            onClick={() => handleDeleteClick(item.record)}
                            disabled={isDeleting && selectedType?.id === item.record.id}
                        >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                        </Button>
                    )}
                </div>
            )}
            emptyState={(
                <div className="py-8 text-center text-muted-foreground">
                    No cargo types found.
                    {canCreateCargoType && (
                        <Link href="/cargo-types/create" className="ml-1 text-primary underline">
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
                placeholder: 'Search cargo types...',
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
            <Select value={selectedCategory} onValueChange={handleCategoryChange}>
                <SelectTrigger className="w-full min-w-[200px] sm:w-auto">
                    <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All categories</SelectItem>
                    {categoryOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                            {option.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
            <Select value={selectedSpecialEquipment} onValueChange={handleSpecialEquipmentChange}>
                <SelectTrigger className="w-full min-w-[200px] sm:w-auto">
                    <SelectValue placeholder="Special equipment" />
                </SelectTrigger>
                <SelectContent>
                    {SPECIAL_EQUIPMENT_OPTIONS.map((option) => (
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
            {canExportCargoTypes && (
                <Button variant="outline" onClick={handleExport} className="gap-2">
                    <Download className="h-4 w-4" />
                    Export CSV
                </Button>
            )}
            {canCreateCargoType && (
                <Button asChild>
                    <Link href="/cargo-types/create">
                        <Plus className="mr-2 h-4 w-4" />
                        Add Cargo Type
                    </Link>
                </Button>
            )}
        </>
    );

    return (
        <>
            <ListPageLayout
                headTitle="Cargo Types"
                title="Cargo Types"
                description={`Manage cargo configurations. Total: ${formatNumber(totalRecords)}`}
                breadcrumbs={breadcrumbs}
                actions={headerActions}
                stats={statsSection}
                tableTitle="Cargo Types"
                tableDescription="All registered cargo categories"
                tableHeaderExtras={tableHeaderExtras}
                pagination={
                    !isTableLoading && cargoTypes?.links ? (
                        <ListingPaginationFooter
                            className="mt-4"
                            links={cargoTypes.links}
                            from={cargoTypes.from ?? undefined}
                            to={cargoTypes.to ?? undefined}
                            total={cargoTypes.total ?? undefined}
                        />
                    ) : null
                }
            >
                <div className="hidden md:block">{tableContent}</div>

                <div className="relative space-y-3 md:hidden">
                    {mobileContent}

                    {isTableLoading && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-background/80 backdrop-blur-sm">
                            <img src="/images/loading-spinner.svg" alt="Loading cargo types" className="h-10 w-10" />
                            <span className="text-sm text-muted-foreground">Loading cargo types...</span>
                        </div>
                    )}
                </div>
            </ListPageLayout>

            <DeleteConfirmationDialog
                open={deleteDialogOpen}
                onOpenChange={(open) => {
                    setDeleteDialogOpen(open);
                    if (!open) {
                        setSelectedType(null);
                        setDeleteError(null);
                    }
                }}
                title="Delete Cargo Type"
                description="Are you sure you want to delete this cargo type? This action cannot be undone."
                itemName={selectedType ? selectedType.name : undefined}
                onConfirm={handleDeleteConfirm}
                isLoading={isDeleting}
                errorMessage={deleteError}
            />
        </>
    );
}

