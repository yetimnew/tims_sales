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
} from 'lucide-react';

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

type ColumnDefinition = {
    id: keyof CargoTypeSummary | 'weight';
    label: string;
    sortKey?: string;
    align?: 'center' | 'right';
};

const formatWeight = (value?: number | null, fallback = '—'): string => {
    if (typeof value !== 'number' || Number.isNaN(value)) {
        return fallback;
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
    const { t } = useTranslation();
    const { hasPermission } = usePermissions();
    const canViewCargoType = hasPermission('cargotypes.show');
    const canEditCargoType = hasPermission('cargotypes.edit');
    const canDeleteCargoType = hasPermission('cargotypes.destroy');
    const canCreateCargoType = hasPermission('cargotypes.create');

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

    const breadcrumbs = React.useMemo<BreadcrumbItem[]>(
        () => [
            {
                title: t('cargoTypes.breadcrumb'),
                href: '/cargo-types',
            },
        ],
        [t],
    );

    const columnDefinitions = React.useMemo<ColumnDefinition[]>(
        () => [
            { id: 'name', label: t('cargoTypes.columns.name'), sortKey: 'name' },
            { id: 'category', label: t('cargoTypes.columns.category'), sortKey: 'category' },
            { id: 'weight', label: t('cargoTypes.columns.weight'), sortKey: 'weight_per_cubic_meter', align: 'right' },
            { id: 'requires_special_equipment', label: t('cargoTypes.columns.specialEquipment'), sortKey: 'requires_special_equipment', align: 'center' },
        ],
        [t],
    );

    const specialEquipmentOptions = React.useMemo(
        () => [
            { label: t('cargoTypes.filters.allTypes'), value: 'all' },
            { label: t('cargoTypes.filters.requiresSpecialEquipment'), value: '1' },
            { label: t('cargoTypes.filters.noSpecialEquipment'), value: '0' },
        ],
        [t],
    );

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
    const notAvailableLabel = t('cargoTypes.fallbacks.notAvailable');

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
                    title: t('cargoTypes.delete.successTitle'),
                    description: t('cargoTypes.delete.successDescription'),
                });
            },
            onError: (errors) => {
                setIsDeleting(false);

                const fallback = t('cargoTypes.delete.failedDescription');
                if (errors && typeof errors === 'object') {
                    const messages = Object.values(errors)
                        .flatMap((value) => (Array.isArray(value) ? value : [value]))
                        .filter((value) => Boolean(value))
                        .join('\n');

                    setDeleteError(messages || fallback);

                    toast({
                        title: t('cargoTypes.delete.failedTitle'),
                        description: messages || fallback,
                        variant: 'destructive',
                    });
                } else {
                    setDeleteError(fallback);

                    toast({
                        title: t('cargoTypes.delete.failedTitle'),
                        description: fallback,
                        variant: 'destructive',
                    });
                }
            },
        });
    };

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
            label: t('cargoTypes.stats.total.label'),
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
                t('cargoTypes.stats.total.description', { count: metrics?.distinct_categories ?? 0 })
            ),
            valueClassName: isTableLoading ? undefined : 'text-blue-600',
        },
        {
            id: 'special-equipment',
            label: t('cargoTypes.stats.specialEquipment.label'),
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
                t('cargoTypes.stats.specialEquipment.description', { count: metrics?.without_special_equipment ?? 0 })
            ),
            valueClassName: isTableLoading ? undefined : 'text-purple-600',
        },
        {
            id: 'average-weight',
            label: t('cargoTypes.stats.averageWeight.label'),
            icon: <Scale className="h-3.5 w-3.5 text-emerald-600" />,
            className: 'min-w-[220px] flex-shrink-0',
            value: isTableLoading ? (
                <Skeleton className="h-3.5 w-24" aria-hidden="true" />
            ) : (
                metrics?.average_weight
                    ? `${metrics.average_weight.toFixed(2)} kg`
                    : t('cargoTypes.stats.averageWeight.fallback')
            ),
            description: isTableLoading ? (
                <Skeleton className="h-3 w-28" aria-hidden="true" />
            ) : (
                t('cargoTypes.stats.averageWeight.description')
            ),
            valueClassName: isTableLoading ? undefined : 'text-emerald-600',
        },
        {
            id: 'handling-notes',
            label: t('cargoTypes.stats.handlingNotes.label'),
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
                t('cargoTypes.stats.handlingNotes.description')
            ),
            valueClassName: isTableLoading ? undefined : 'text-amber-600',
        },
    ];

    const statsSection = <ListingStatsHeader stats={statsDefinitions} orientation="row" />;

    const perPageSelectOptions = React.useMemo(
        () =>
            availablePerPageOptions.map((option) => ({
                value: String(option),
                label: t('cargoTypes.filters.perPageOption', { value: option }),
            })),
        [availablePerPageOptions, t],
    );

    const tableColumns = React.useMemo(
        () => [
            { id: 'index', label: t('cargoTypes.table.index'), align: 'center' as const },
            ...columnDefinitions.map((column) => ({
                id: String(column.id),
                label: column.label,
                sortable: Boolean(column.sortKey),
                sortKey: column.sortKey,
                align: column.align,
            })),
            { id: 'actions', label: t('cargoTypes.table.actions'), align: 'center' as const },
        ],
        [columnDefinitions, t],
    );

    const tableRows = isTableLoading
        ? Array.from({ length: 8 }).map((_, index) => (
              <TableRow key={`skeleton-${index}`} aria-hidden="true">
                  <TableCell className="text-center">
                      <Skeleton className="h-4 w-6 mx-auto" />
                  </TableCell>
                  <TableCell>
                      <Skeleton className="h-4 w-32" />
                  </TableCell>
                  <TableCell>
                      <Skeleton className="h-6 w-24 rounded-full" />
                  </TableCell>
                  <TableCell className="text-right">
                      <Skeleton className="h-4 w-20 ml-auto" />
                  </TableCell>
                  <TableCell className="text-center">
                      <Skeleton className="h-6 w-24 mx-auto rounded-full" />
                  </TableCell>
                  <TableCell className="text-center">
                      <Skeleton className="h-8 w-8 mx-auto rounded" />
                  </TableCell>
              </TableRow>
          ))
        : cargoTypeData.length > 0
            ? cargoTypeData.map((type, index) => (
                  <TableRow key={type.id} className="hover:bg-muted/50">
                      <TableCell className="text-center font-medium">{rowOffset + index + 1}</TableCell>
                      <TableCell className="font-semibold">{type.name}</TableCell>
                      <TableCell>
                          <Badge className={getCategoryBadgeClass(type.category)}>{type.category}</Badge>
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                          {formatWeight(type.weight_per_cubic_meter, notAvailableLabel)}
                      </TableCell>
                      <TableCell className="text-center">
                          {type.requires_special_equipment ? (
                              <Badge className="bg-rose-500 text-white hover:bg-rose-600">{t('cargoTypes.specialEquipment.required')}</Badge>
                          ) : (
                              <span className="text-muted-foreground">{t('cargoTypes.specialEquipment.notRequired')}</span>
                          )}
                      </TableCell>
                      <TableCell className="text-center">
                          <ListingRowActionsMenu
                              actions={[
                                  canViewCargoType && {
                                      label: t('cargoTypes.actions.view'),
                                      icon: <Eye className="h-4 w-4" />,
                                      href: `/cargo-types/${type.id}`,
                                  },
                                  canEditCargoType && {
                                      label: t('cargoTypes.actions.edit'),
                                      icon: <Edit className="h-4 w-4" />,
                                      href: `/cargo-types/${type.id}/edit`,
                                  },
                                  canDeleteCargoType && {
                                      label: t('cargoTypes.actions.delete'),
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
                        {t('cargoTypes.empty.title')}
                        {canCreateCargoType && (
                            <Link href="/cargo-types/create" className="ml-1 text-primary underline">
                                {t('cargoTypes.empty.createAction')}
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
        <ListingTableShell
            columns={tableColumns}
            sort={{ column: sortColumn, direction: sortDirection, onToggle: handleSort }}
        >
            {tableRows}
        </ListingTableShell>
    );

    const mobileContent = isTableLoading ? (
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
            renderSubtitle={() => <Skeleton className="h-3 w-24" />}
            renderContent={() => (
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <Skeleton className="h-3 w-24" />
                        <Skeleton className="h-3 w-20" />
                    </div>
                    <div className="flex items-center justify-between">
                        <Skeleton className="h-3 w-32" />
                        <Skeleton className="h-3 w-24" />
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
                        {t('cargoTypes.mobile.position', { value: item.position })}
                    </span>
                    <span className="text-base">{item.record.name}</span>
                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
            )}
            renderSubtitle={(item) => item.record.category}
            renderContent={(item) => (
                <div className="space-y-3 text-sm text-muted-foreground">
                    <div className="flex items-center justify-between">
                        <span className="font-medium text-slate-600 dark:text-slate-300">
                            {t('cargoTypes.mobile.weight')}
                        </span>
                        <span className="text-right text-slate-900 dark:text-slate-100">
                            {formatWeight(item.record.weight_per_cubic_meter, notAvailableLabel)}
                        </span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="font-medium text-slate-600 dark:text-slate-300">
                            {t('cargoTypes.mobile.specialEquipment')}
                        </span>
                        <span className="text-right text-slate-900 dark:text-slate-100">
                            {item.record.requires_special_equipment
                                ? t('cargoTypes.specialEquipment.required')
                                : t('cargoTypes.specialEquipment.notRequired')}
                        </span>
                    </div>
                    {(item.record.handling_requirements || item.record.safety_requirements) && (
                        <div className="space-y-1">
                            {item.record.handling_requirements && (
                                <div>
                                    <span className="text-xs uppercase text-muted-foreground">
                                        {t('cargoTypes.mobile.handling')}
                                    </span>
                                    <p className="text-sm text-slate-900 dark:text-slate-100">
                                        {item.record.handling_requirements}
                                    </p>
                                </div>
                            )}
                            {item.record.safety_requirements && (
                                <div>
                                    <span className="text-xs uppercase text-muted-foreground">
                                        {t('cargoTypes.mobile.safety')}
                                    </span>
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
                                {t('cargoTypes.actions.view')}
                            </Link>
                        </Button>
                    )}
                    {canEditCargoType && (
                        <Button asChild size="sm" variant="secondary" className="flex-1 sm:flex-none">
                            <Link href={`/cargo-types/${item.record.id}/edit`}>
                                <Edit className="mr-2 h-4 w-4" />
                                {t('cargoTypes.actions.edit')}
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
                            {t('cargoTypes.actions.delete')}
                        </Button>
                    )}
                </div>
            )}
            emptyState={(
                <div className="py-8 text-center text-muted-foreground">
                    {t('cargoTypes.empty.title')}
                    {canCreateCargoType && (
                        <Link href="/cargo-types/create" className="ml-1 text-primary underline">
                            {t('cargoTypes.empty.createAction')}
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
                placeholder: t('cargoTypes.filters.searchPlaceholder'),
                onChange: handleSearchChange,
                icon: <Search className="h-4 w-4" />,
            }}
            perPage={{
                value: perPage,
                label: t('cargoTypes.filters.rowsLabel'),
                onChange: handlePerPageChange,
                options: perPageSelectOptions,
            }}
        >
            <Select value={selectedCategory} onValueChange={handleCategoryChange}>
                <SelectTrigger className="w-full min-w-[200px] sm:w-auto">
                    <SelectValue placeholder={t('cargoTypes.filters.category')} />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">{t('cargoTypes.filters.allCategories')}</SelectItem>
                    {categoryOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                            {option.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
            <Select value={selectedSpecialEquipment} onValueChange={handleSpecialEquipmentChange}>
                <SelectTrigger className="w-full min-w-[200px] sm:w-auto">
                    <SelectValue placeholder={t('cargoTypes.filters.specialEquipment')} />
                </SelectTrigger>
                <SelectContent>
                    {specialEquipmentOptions.map((option) => (
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
            {canCreateCargoType && (
                <Button asChild>
                    <Link href="/cargo-types/create">
                        <Plus className="mr-2 h-4 w-4" />
                        {t('cargoTypes.actions.add')}
                    </Link>
                </Button>
            )}
        </>
    );

    return (
        <>
            <ListPageLayout
                headTitle={t('cargoTypes.title')}
                title={t('cargoTypes.title')}
                description={t('cargoTypes.description', { count: totalRecords })}
                breadcrumbs={breadcrumbs}
                actions={headerActions}
                stats={statsSection}
                tableTitle={t('cargoTypes.table.title')}
                tableDescription={t('cargoTypes.table.description')}
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
                title={t('cargoTypes.delete.title')}
                description={t('cargoTypes.delete.description')}
                itemName={selectedType ? selectedType.name : undefined}
                onConfirm={handleDeleteConfirm}
                isLoading={isDeleting}
                errorMessage={deleteError}
            />
        </>
    );
}
