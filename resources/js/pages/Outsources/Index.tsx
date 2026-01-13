import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, router } from '@inertiajs/react';
import { type BreadcrumbItem } from '@/types';
import { usePermissions } from '@/hooks/use-permissions';
import ListPageLayout from '@/components/layouts/list-page-layout';
import { DeleteConfirmationDialog } from '@/components/delete-confirmation-dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { ListingStatsHeader, type ListingStatDefinition } from '@/components/listing/stats-header';
import { ListingFilterBar } from '@/components/listing/filter-bar';
import { ListingTableShell, type ListingTableColumn } from '@/components/listing/data-table-shell';
import { ListingMobileItemList } from '@/components/listing/mobile-item-list';
import { ListingLoadingPlaceholder } from '@/components/listing/loading-placeholder';
import { ListingRowActionsMenu } from '@/components/listing/row-actions-menu';
import { ListingPaginationFooter } from '@/components/listing/pagination-footer';
import { useListingLoading } from '@/hooks/use-listing-loading';
import { TableCell, TableRow } from '@/components/ui/table';
import {
    Building2,
    ClipboardList,
    Layers,
    Plus,
    Search,
    Users2,
    Eye,
    Edit,
    Trash2,
    ChevronRight,
    Phone,
    Mail,
    UserCircle,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface OutsourceRecord {
    id: number;
    name: string;
    contact_person?: string | null;
    phone?: string | null;
    email?: string | null;
    service_type?: string | null;
    status: string;
    outsource_performances_count?: number;
    created_at?: string;
}

interface OutsourceIndexProps {
    outsources: {
        data: OutsourceRecord[];
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
        totalVendors?: number;
        activeVendors?: number;
        averageTripsPerVendor?: number;
        serviceCategoryCount?: number;
    };
    filters?: {
        search?: string | null;
        status?: string | null;
        service_type?: string | null;
        sort?: string | null;
        direction?: 'asc' | 'desc' | null;
        per_page?: number | null;
    };
    statusOptions?: Array<{ label: string; value: string }>;
    serviceTypeOptions?: Array<{ label: string; value: string }>;
    perPageOptions?: number[];
}

type ColumnKey =
    | 'name'
    | 'service_type'
    | 'contact_person'
    | 'phone'
    | 'email'
    | 'status'
    | 'outsource_performances_count';

interface ColumnDefinition {
    id: ColumnKey;
    labelKey: string;
    sortKey?: string;
    align?: 'center' | 'right';
}

const COLUMN_DEFINITIONS: ColumnDefinition[] = [
    { id: 'name', labelKey: 'outsources.index.columns.name', sortKey: 'name' },
    { id: 'service_type', labelKey: 'outsources.index.columns.serviceType', sortKey: 'service_type' },
    { id: 'contact_person', labelKey: 'outsources.index.columns.contact', sortKey: 'contact_person' },
    { id: 'phone', labelKey: 'outsources.index.columns.phone', sortKey: 'phone' },
    { id: 'email', labelKey: 'outsources.index.columns.email', sortKey: 'email' },
    { id: 'status', labelKey: 'outsources.index.columns.status', sortKey: 'status', align: 'center' },
    {
        id: 'outsource_performances_count',
        labelKey: 'outsources.index.columns.trips',
        sortKey: 'outsource_performances_count',
        align: 'right',
    },
];

const SKELETON_FLAG_KEY = 'outsources.index.shouldShowSkeleton';

export default function OutsourcesIndex({
    outsources,
    metrics,
    filters,
    statusOptions,
    serviceTypeOptions,
    perPageOptions,
}: OutsourceIndexProps) {
    const { t, i18n } = useTranslation();
    const { hasPermission } = usePermissions();
    const { toast } = useToast();
    const locale = i18n.language || 'en-US';

    const breadcrumbs = useMemo<BreadcrumbItem[]>(
        () => [
            {
                title: t('outsources.title'),
                href: '/outsources',
            },
        ],
        [t],
    );

    const dateFormatter = useMemo(
        () =>
            new Intl.DateTimeFormat(locale, {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
            }),
        [locale],
    );

    const decimalFormatter = useMemo(
        () =>
            new Intl.NumberFormat(locale, {
                minimumFractionDigits: 0,
                maximumFractionDigits: 1,
            }),
        [locale],
    );

    const notAvailableLabel = t('outsources.index.fallbacks.notAvailable');

    const [searchTerm, setSearchTerm] = useState(filters?.search ?? '');
    const [selectedStatus, setSelectedStatus] = useState(filters?.status ?? 'all');
    const [selectedServiceType, setSelectedServiceType] = useState(filters?.service_type ?? 'all');
    const [sortColumn, setSortColumn] = useState(filters?.sort ?? 'name');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>(filters?.direction ?? 'asc');
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [selectedOutsource, setSelectedOutsource] = useState<OutsourceRecord | null>(null);
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

    const totalVendors = metrics?.totalVendors ?? outsources?.total ?? 0;
    const activeVendors = metrics?.activeVendors ?? 0;
    const averageTripsPerVendor = metrics?.averageTripsPerVendor ?? 0;
    const serviceCategoryCount = metrics?.serviceCategoryCount ?? 0;

    const isDataReady = Array.isArray(outsources?.data);
    const { isLoading } = useListingLoading({
        storageKey: SKELETON_FLAG_KEY,
        isDataReady,
        onlySamePath: true,
        targetPath: '/outsources',
        initialIsLoading: true,
    });

    const rowOffset = Math.max((outsources?.from ?? 1) - 1, 0);

    const formatNumberValue = useCallback(
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

    const perPageSelectOptions = useMemo(
        () =>
            availablePerPageOptions.map((option) => ({
                value: String(option),
                label: t('outsources.index.filters.perPageOption', { value: option }),
            })),
        [availablePerPageOptions, t],
    );

    const tableColumns: ListingTableColumn[] = useMemo(
        () => [
            { id: 'index', label: t('outsources.index.table.index'), align: 'center' },
            ...COLUMN_DEFINITIONS.map((column) => ({
                id: column.id,
                label: t(column.labelKey),
                sortKey: column.sortKey ?? column.id,
                sortable: true,
                align: column.align,
            })),
            { id: 'actions', label: t('outsources.index.table.actions'), align: 'center' },
        ],
        [t],
    );

    const statsDefinitions: ListingStatDefinition[] = useMemo(
        () => [
            {
                id: 'vendors-total',
                label: t('outsources.index.stats.total.label'),
                icon: <Building2 className="h-3.5 w-3.5 text-indigo-600" />,
                value: isLoading ? <Skeleton className="h-4 w-16" /> : formatNumberValue(totalVendors),
                description: isLoading ? (
                    <Skeleton className="h-3 w-24" />
                ) : (
                    t('outsources.index.stats.total.description', {
                        count: formatNumberValue(totalVendors),
                    })
                ),
                valueClassName: isLoading ? undefined : 'text-indigo-600',
            },
            {
                id: 'vendors-active',
                label: t('outsources.index.stats.active.label'),
                icon: <Users2 className="h-3.5 w-3.5 text-emerald-600" />,
                value: isLoading ? <Skeleton className="h-4 w-14" /> : formatNumberValue(activeVendors),
                description: isLoading ? (
                    <Skeleton className="h-3 w-20" />
                ) : (
                    t('outsources.index.stats.active.description')
                ),
                valueClassName: isLoading ? undefined : 'text-emerald-600',
            },
            {
                id: 'vendors-trips',
                label: t('outsources.index.stats.tripsAverage.label'),
                icon: <ClipboardList className="h-3.5 w-3.5 text-rose-600" />,
                value: isLoading ? <Skeleton className="h-4 w-20" /> : decimalFormatter.format(averageTripsPerVendor),
                description: isLoading ? (
                    <Skeleton className="h-3 w-24" />
                ) : (
                    t('outsources.index.stats.tripsAverage.description')
                ),
                valueClassName: isLoading ? undefined : 'text-rose-600',
            },
            {
                id: 'vendors-service-lines',
                label: t('outsources.index.stats.serviceLines.label'),
                icon: <Layers className="h-3.5 w-3.5 text-amber-600" />,
                value: isLoading ? <Skeleton className="h-4 w-16" /> : formatNumberValue(serviceCategoryCount),
                description: isLoading ? (
                    <Skeleton className="h-3 w-24" />
                ) : (
                    t('outsources.index.stats.serviceLines.description')
                ),
                valueClassName: isLoading ? undefined : 'text-amber-600',
            },
        ],
        [
            activeVendors,
            averageTripsPerVendor,
            decimalFormatter,
            formatNumberValue,
            isLoading,
            serviceCategoryCount,
            t,
            totalVendors,
        ],
    );

    const handleNavigate = useCallback(
        (overrides: Partial<{
            search?: string;
            status?: string;
            service_type?: string;
            sort?: string;
            direction?: 'asc' | 'desc';
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
                service_type:
                    overrides.service_type !== undefined
                        ? overrides.service_type
                        : selectedServiceType !== 'all'
                            ? selectedServiceType
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

            router.get('/outsources', params, {
                preserveState: true,
                preserveScroll: true,
                replace: false,
            });
        },
        [perPage, searchTerm, selectedServiceType, selectedStatus, sortColumn, sortDirection],
    );

    const handleSearchChange = (value: string) => {
        setSearchTerm(value);
        handleNavigate({ search: value.trim() ? value.trim() : undefined, page: 1 });
    };

    const handleStatusChange = (value: string) => {
        setSelectedStatus(value);
        handleNavigate({ status: value !== 'all' ? value : undefined, page: 1 });
    };

    const handleServiceTypeChange = (value: string) => {
        setSelectedServiceType(value);
        handleNavigate({ service_type: value !== 'all' ? value : undefined, page: 1 });
    };

    const handlePerPageChange = (value: string) => {
        setPerPage(value);
        const numericValue = Number(value);
        handleNavigate({ per_page: Number.isNaN(numericValue) ? undefined : numericValue, page: 1 });
    };

    const renderStatusBadge = useCallback(
        (status: string): JSX.Element => {
            const normalized = status?.toLowerCase?.();
            if (normalized === 'active') {
                return (
                    <Badge className="flex w-fit items-center gap-1 border-emerald-200 bg-emerald-100 text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-900/30 dark:text-emerald-200">
                        {t('outsources.status.active')}
                    </Badge>
                );
            }

            const label = normalized === 'inactive' ? t('outsources.status.inactive') : status || t('outsources.status.unknown');

            return (
                <Badge className="flex w-fit items-center gap-1 border-rose-200 bg-rose-100 text-rose-700 dark:border-rose-900/40 dark:bg-rose-900/30 dark:text-rose-200">
                    {label}
                </Badge>
            );
        },
        [t],
    );

    const handleSortToggle = useCallback(
        (columnId: string) => {
            const definition = COLUMN_DEFINITIONS.find((column) => {
                const key = column.sortKey ?? column.id;
                return key === columnId;
            });

            if (!definition) {
                return;
            }

            const nextColumn = definition.sortKey ?? definition.id;
            const nextDirection: 'asc' | 'desc' =
                sortColumn === nextColumn && sortDirection === 'asc' ? 'desc' : 'asc';

            setSortColumn(nextColumn);
            setSortDirection(nextDirection);
            handleNavigate({ sort: nextColumn, direction: nextDirection });
        },
        [handleNavigate, sortColumn, sortDirection],
    );

    const handleDeleteClick = (outsource: OutsourceRecord) => {
        setSelectedOutsource(outsource);
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = () => {
        if (!selectedOutsource) {
            return;
        }

        setIsDeleting(true);
        router.delete(`/outsources/${selectedOutsource.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                setDeleteDialogOpen(false);
                setSelectedOutsource(null);
                setIsDeleting(false);
                toast({
                    title: t('outsources.delete.successTitle'),
                    description: t('outsources.delete.successDescription', {
                        name: selectedOutsource.name,
                    }),
                });
            },
            onError: (errors) => {
                setIsDeleting(false);
                const fallback = t('outsources.delete.failedDescription');
                if (errors && typeof errors === 'object') {
                    const messages = Object.values(errors).flat().join('\n');
                    toast({
                        title: t('outsources.delete.failedTitle'),
                        description: messages || fallback,
                        variant: 'destructive',
                    });
                } else {
                    toast({
                        title: t('outsources.delete.failedTitle'),
                        description: fallback,
                        variant: 'destructive',
                    });
                }
            },
        });
    };

    const headerActions = (
        <>
            {hasPermission('outsources.create') && (
                <Button asChild>
                    <Link href="/outsources/create">
                        <Plus className="mr-2 h-4 w-4" />
                        {t('outsources.actions.add')}
                    </Link>
                </Button>
            )}
        </>
    );

    const tableHeaderExtras = (
        <ListingFilterBar
            search={{
                value: searchTerm,
                placeholder: t('outsources.index.filters.searchPlaceholder'),
                onChange: handleSearchChange,
                icon: <Search className="h-4 w-4" />,
            }}
            perPage={{
                value: perPage,
                label: t('outsources.index.filters.rowsLabel'),
                onChange: handlePerPageChange,
                options: perPageSelectOptions,
            }}
        >
            <Select value={selectedStatus} onValueChange={handleStatusChange}>
                <SelectTrigger className="w-full min-w-[140px] sm:w-auto">
                    <SelectValue placeholder={t('outsources.index.filters.statusPlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">{t('outsources.index.filters.statusAll')}</SelectItem>
                    {statusOptions?.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                            {option.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
            <Select value={selectedServiceType} onValueChange={handleServiceTypeChange}>
                <SelectTrigger className="w-full min-w-[160px] sm:w-auto">
                    <SelectValue placeholder={t('outsources.index.filters.servicePlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">{t('outsources.index.filters.serviceAll')}</SelectItem>
                    {serviceTypeOptions?.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                            {option.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </ListingFilterBar>
    );

    const renderColumnValue = useCallback(
        (outsource: OutsourceRecord, column: ColumnKey): JSX.Element | string => {
            switch (column) {
                case 'name':
                    return (
                        <div className="flex flex-col">
                            <span className="font-medium text-foreground">{outsource.name}</span>
                            {outsource.created_at && (
                                <span className="text-xs text-muted-foreground">
                                    {t('outsources.index.columns.joinedOn', {
                                        date: dateFormatter.format(new Date(outsource.created_at)),
                                    })}
                                </span>
                            )}
                        </div>
                    );
                case 'service_type':
                    return (
                        <span className="text-sm text-muted-foreground">
                            {outsource.service_type || notAvailableLabel}
                        </span>
                    );
                case 'contact_person':
                    return (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <UserCircle className="h-4 w-4 text-slate-400" />
                            <span>{outsource.contact_person || notAvailableLabel}</span>
                        </div>
                    );
                case 'phone':
                    return (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Phone className="h-4 w-4 text-slate-400" />
                            <span>{outsource.phone || notAvailableLabel}</span>
                        </div>
                    );
                case 'email':
                    return (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Mail className="h-4 w-4 text-slate-400" />
                            <span>{outsource.email || notAvailableLabel}</span>
                        </div>
                    );
                case 'status':
                    return renderStatusBadge(outsource.status);
                case 'outsource_performances_count':
                    return (
                        <span className="font-semibold text-foreground">
                            {formatNumberValue(outsource.outsource_performances_count)}
                        </span>
                    );
                default:
                    return notAvailableLabel;
            }
        },
        [dateFormatter, formatNumberValue, notAvailableLabel, renderStatusBadge, t],
    );

    const tableRows = useMemo(() => {
        if (!outsources?.data?.length) {
            return (
                <TableRow>
                    <TableCell colSpan={tableColumns.length} className="py-8 text-center text-muted-foreground">
                        {t('outsources.index.empty.title')}
                        {hasPermission('outsources.create') && (
                            <Link href="/outsources/create" className="ml-1 text-primary underline">
                                {t('outsources.index.empty.createAction')}
                            </Link>
                        )}
                    </TableCell>
                </TableRow>
            );
        }

        return outsources.data.map((outsource, index) => (
            <TableRow key={outsource.id} className="hover:bg-muted/50">
                <TableCell className="text-center text-sm font-semibold text-muted-foreground">
                    {rowOffset + index + 1}
                </TableCell>
                {COLUMN_DEFINITIONS.map((column) => (
                    <TableCell
                        key={`${outsource.id}-${column.id}`}
                        className={
                            column.align === 'right'
                                ? 'text-right'
                                : column.align === 'center'
                                    ? 'text-center'
                                    : undefined
                        }
                    >
                        {renderColumnValue(outsource, column.id)}
                    </TableCell>
                ))}
                <TableCell className="text-center">
                    <ListingRowActionsMenu
                        actions={[
                            {
                                label: t('outsources.actions.view'),
                                icon: <Eye className="h-4 w-4" />,
                                href: `/outsources/${outsource.id}`,
                            },
                            hasPermission('outsources.edit') && {
                                label: t('outsources.actions.edit'),
                                icon: <Edit className="h-4 w-4" />,
                                href: `/outsources/${outsource.id}/edit`,
                            },
                            hasPermission('outsources.destroy') && {
                                label: t('outsources.actions.delete'),
                                icon: <Trash2 className="h-4 w-4" />,
                                danger: true,
                                disabled: isDeleting && selectedOutsource?.id === outsource.id,
                                onSelect: () => handleDeleteClick(outsource),
                            },
                        ]}
                    />
                </TableCell>
            </TableRow>
        ));
    }, [
        hasPermission,
        isDeleting,
        outsources?.data,
        renderColumnValue,
        rowOffset,
        selectedOutsource?.id,
        tableColumns.length,
        t,
    ]);

    const mobileItems = useMemo(
        () =>
            (outsources?.data ?? []).map((record, index) => ({
                record,
                position: rowOffset + index + 1,
            })),
        [outsources?.data, rowOffset],
    );

    const mobileList = (
        <ListingMobileItemList
            items={mobileItems}
            getKey={(item) => item.record.id}
            renderTitle={(item) => (
                <div className="flex items-center gap-2">
                    <span className="text-xs uppercase tracking-wide text-muted-foreground">
                        {t('outsources.index.mobile.position', { value: item.position })}
                    </span>
                    <span className="text-base font-semibold text-foreground">{item.record.name}</span>
                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
            )}
            renderSubtitle={(item) => item.record.service_type || t('outsources.index.fallbacks.serviceTypeUnknown')}
            renderContent={(item) => (
                <div className="space-y-3 text-sm text-muted-foreground">
                    <div className="flex items-center justify-between">
                        <span className="font-medium text-slate-600 dark:text-slate-300">
                            {t('outsources.index.mobile.contact')}
                        </span>
                        <span className="text-right text-slate-900 dark:text-slate-100">
                            {item.record.contact_person || notAvailableLabel}
                        </span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="font-medium text-slate-600 dark:text-slate-300">
                            {t('outsources.index.mobile.phone')}
                        </span>
                        <span className="text-right text-slate-900 dark:text-slate-100">
                            {item.record.phone || notAvailableLabel}
                        </span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="font-medium text-slate-600 dark:text-slate-300">
                            {t('outsources.index.mobile.email')}
                        </span>
                        <span className="text-right text-slate-900 dark:text-slate-100">
                            {item.record.email || notAvailableLabel}
                        </span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="font-medium text-slate-600 dark:text-slate-300">
                            {t('outsources.index.mobile.status')}
                        </span>
                        <span className="text-right text-slate-900 dark:text-slate-100">
                            {renderStatusBadge(item.record.status)}
                        </span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="font-medium text-slate-600 dark:text-slate-300">
                            {t('outsources.index.mobile.trips')}
                        </span>
                        <span className="text-right text-slate-900 dark:text-slate-100">
                            {formatNumberValue(item.record.outsource_performances_count)}
                        </span>
                    </div>
                </div>
            )}
            renderFooter={(item) => (
                <div className="flex w-full flex-wrap items-center gap-2">
                    <Button asChild size="sm" variant="outline" className="flex-1 sm:flex-auto">
                        <Link href={`/outsources/${item.record.id}`}>
                            <Eye className="mr-2 h-4 w-4" />
                            {t('outsources.actions.view')}
                        </Link>
                    </Button>
                    {hasPermission('outsources.edit') && (
                        <Button asChild size="sm" variant="secondary" className="flex-1 sm:flex-none">
                            <Link href={`/outsources/${item.record.id}/edit`}>
                                <Edit className="mr-2 h-4 w-4" />
                                {t('outsources.actions.edit')}
                            </Link>
                        </Button>
                    )}
                    {hasPermission('outsources.destroy') && (
                        <Button
                            size="sm"
                            variant="destructive"
                            className="flex-1 sm:flex-none"
                            onClick={() => handleDeleteClick(item.record)}
                            disabled={isDeleting && selectedOutsource?.id === item.record.id}
                        >
                            <Trash2 className="mr-2 h-4 w-4" />
                            {t('outsources.actions.delete')}
                        </Button>
                    )}
                </div>
            )}
            emptyState={
                isLoading ? (
                    <ListingLoadingPlaceholder showStats={false} filterItemCount={2} rowCount={4} className="p-4" />
                ) : (
                    <div className="py-8 text-center text-muted-foreground">
                        {t('outsources.index.empty.title')}
                        {hasPermission('outsources.create') && (
                            <Link href="/outsources/create" className="ml-1 text-primary underline">
                                {t('outsources.index.empty.createAction')}
                            </Link>
                        )}
                    </div>
                )
            }
        />
    );

    return (
        <>
            <ListPageLayout
                headTitle={t('outsources.index.headTitle')}
                title={t('outsources.index.title')}
                description={t('outsources.index.description', {
                    total: formatNumberValue(totalVendors),
                })}
                breadcrumbs={breadcrumbs}
                actions={headerActions}
                stats={<ListingStatsHeader stats={statsDefinitions} orientation="row" />}
                tableTitle={t('outsources.index.table.title')}
                tableDescription={t('outsources.index.table.description')}
                tableHeaderExtras={tableHeaderExtras}
                pagination={
                    !isLoading && outsources?.links ? (
                        <ListingPaginationFooter
                            className="mt-4"
                            links={outsources.links}
                            from={outsources.from ?? undefined}
                            to={outsources.to ?? undefined}
                            total={outsources.total ?? undefined}
                            extra={
                                <Badge variant="outline" className="bg-white/80 text-xs text-slate-600 dark:bg-slate-900/80 dark:text-slate-300">
                                    {t('outsources.index.pagination.activeBadge', {
                                        count: formatNumberValue(activeVendors),
                                    })}
                                </Badge>
                            }
                        />
                    ) : null
                }
            >
                {isLoading ? (
                    <ListingLoadingPlaceholder filterItemCount={3} rowCount={6} className="p-6" />
                ) : (
                    <>
                        <div className="hidden md:block">
                            <ListingTableShell
                                columns={tableColumns}
                                sort={{ column: sortColumn, direction: sortDirection, onToggle: handleSortToggle }}
                            >
                                {tableRows}
                            </ListingTableShell>
                        </div>
                        <div className="p-2 md:hidden">{mobileList}</div>
                    </>
                )}
            </ListPageLayout>

            <DeleteConfirmationDialog
                open={deleteDialogOpen}
                onOpenChange={(open) => {
                    setDeleteDialogOpen(open);
                    if (!open) {
                        setSelectedOutsource(null);
                        setIsDeleting(false);
                    }
                }}
                title={t('outsources.delete.title')}
                description={t('outsources.delete.description')}
                itemName={selectedOutsource?.name ?? undefined}
                onConfirm={handleDeleteConfirm}
                isLoading={isDeleting}
            />
        </>
    );
}
