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
import { ListingStatsHeader, type ListingStatDefinition } from '@/components/listing/stats-header';
import { ListingFilterBar } from '@/components/listing/filter-bar';
import { ListingTableShell, type ListingTableColumn } from '@/components/listing/data-table-shell';
import { ListingMobileItemList } from '@/components/listing/mobile-item-list';
import { ListingRowActionsMenu } from '@/components/listing/row-actions-menu';
import { ListingPaginationFooter } from '@/components/listing/pagination-footer';
import { useListingLoading } from '@/hooks/use-listing-loading';
import { TableCell, TableRow } from '@/components/ui/table';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
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

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Outsourcing',
        href: '/outsources',
    },
];

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
    label: string;
    sortKey?: string;
    align?: 'center' | 'right';
}

const COLUMN_DEFINITIONS: ColumnDefinition[] = [
    { id: 'name', label: 'Vendor', sortKey: 'name' },
    { id: 'service_type', label: 'Service Type', sortKey: 'service_type' },
    { id: 'contact_person', label: 'Contact', sortKey: 'contact_person' },
    { id: 'phone', label: 'Phone', sortKey: 'phone' },
    { id: 'email', label: 'Email', sortKey: 'email' },
    { id: 'status', label: 'Status', sortKey: 'status', align: 'center' },
    { id: 'outsource_performances_count', label: 'Trips', sortKey: 'outsource_performances_count', align: 'right' },
];

const dateFormatter = new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
});

const decimalFormatter = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
});

const SKELETON_FLAG_KEY = 'outsources.index.shouldShowSkeleton';

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

const renderStatusBadge = (status: string): JSX.Element => {
    const normalized = status?.toLowerCase();

    if (normalized === 'active') {
        return (
            <Badge className="flex w-fit items-center gap-1 border-emerald-200 bg-emerald-100 text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-900/30 dark:text-emerald-200">
                Active
            </Badge>
        );
    }

    return (
        <Badge className="flex w-fit items-center gap-1 border-rose-200 bg-rose-100 text-rose-700 dark:border-rose-900/40 dark:bg-rose-900/30 dark:text-rose-200">
            {status || 'Inactive'}
        </Badge>
    );
};

export default function OutsourcesIndex({
    outsources,
    metrics,
    filters,
    statusOptions,
    serviceTypeOptions,
    perPageOptions,
}: OutsourceIndexProps) {
    const { hasPermission } = usePermissions();

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

    const statusSegments = useMemo(() => {
        const segments: Array<{ value: string; label: string }> = [];
        const seen = new Set<string>();

        const pushSegment = (value: string, label: string) => {
            if (!value || seen.has(value)) {
                return;
            }

            segments.push({ value, label });
            seen.add(value);
        };

        const options = statusOptions ?? [];

        pushSegment(
            'active',
            options.find((option) => option.value === 'active')?.label ?? 'Active',
        );
        pushSegment(
            'inactive',
            options.find((option) => option.value === 'inactive')?.label ?? 'Inactive',
        );

        options.forEach((option) => {
            pushSegment(option.value, option.label);
        });

        pushSegment('all', 'All');

        return segments;
    }, [statusOptions]);

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
                sortKey: column.sortKey ?? column.id,
                sortable: true,
                align: column.align,
            })),
            { id: 'actions', label: 'Actions', align: 'center' },
        ],
        [],
    );

    const statsDefinitions: ListingStatDefinition[] = [
        {
            id: 'vendors-total',
            label: 'Vendors',
            icon: <Building2 className="h-3.5 w-3.5 text-indigo-600" />,
            value: isLoading ? <Skeleton className="h-4 w-16" /> : formatNumberValue(totalVendors),
            description: isLoading ? <Skeleton className="h-3 w-24" /> : 'Total outsourcing partners',
            valueClassName: isLoading ? undefined : 'text-indigo-600',
        },
        {
            id: 'vendors-active',
            label: 'Active',
            icon: <Users2 className="h-3.5 w-3.5 text-emerald-600" />,
            value: isLoading ? <Skeleton className="h-4 w-14" /> : formatNumberValue(activeVendors),
            description: isLoading ? <Skeleton className="h-3 w-20" /> : 'Currently engaged',
            valueClassName: isLoading ? undefined : 'text-emerald-600',
        },
        {
            id: 'vendors-trips',
            label: 'Avg Trips / Vendor',
            icon: <ClipboardList className="h-3.5 w-3.5 text-rose-600" />,
            value: isLoading ? <Skeleton className="h-4 w-20" /> : decimalFormatter.format(averageTripsPerVendor),
            description: isLoading ? <Skeleton className="h-3 w-24" /> : 'Performance coverage',
            valueClassName: isLoading ? undefined : 'text-rose-600',
        },
        {
            id: 'vendors-service-lines',
            label: 'Service Lines',
            icon: <Layers className="h-3.5 w-3.5 text-amber-600" />,
            value: isLoading ? <Skeleton className="h-4 w-16" /> : formatNumberValue(serviceCategoryCount),
            description: isLoading ? <Skeleton className="h-3 w-24" /> : 'Unique service categories',
            valueClassName: isLoading ? undefined : 'text-amber-600',
        },
    ];

    const statsSection = <ListingStatsHeader stats={statsDefinitions} orientation="row" />;

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
        if (!value) {
            return;
        }

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
            },
            onFinish: () => {
                setIsDeleting(false);
            },
        });
    };

    const headerActions = (
        <>
            {hasPermission('outsources.create') && (
                <Button asChild>
                    <Link href="/outsources/create">
                        <Plus className="mr-2 h-4 w-4" />
                        Add Vendor
                    </Link>
                </Button>
            )}
        </>
    );

    const tableHeaderExtras = (
        <ListingFilterBar
            search={{
                value: searchTerm,
                placeholder: 'Search vendors...',
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
            <ToggleGroup
                type="single"
                value={selectedStatus}
                onValueChange={handleStatusChange}
                variant="outline"
                size="sm"
                className="flex flex-wrap gap-px rounded-md"
            >
                {statusSegments.map((segment) => (
                    <ToggleGroupItem
                        key={segment.value}
                        value={segment.value}
                        className="px-3 py-1 text-sm font-medium capitalize data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
                    >
                        {segment.value === 'all' ? 'All' : segment.label}
                    </ToggleGroupItem>
                ))}
            </ToggleGroup>
            <Select value={selectedServiceType} onValueChange={handleServiceTypeChange}>
                <SelectTrigger className="w-full min-w-[180px] sm:w-auto">
                    <SelectValue placeholder="Service type" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All services</SelectItem>
                    {serviceTypeOptions?.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                            {option.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </ListingFilterBar>
    );

    const renderColumnValue = useCallback((outsource: OutsourceRecord, column: ColumnKey): JSX.Element | string => {
        switch (column) {
            case 'name':
                return (
                    <div className="flex flex-col">
                        <span className="font-medium text-foreground">{outsource.name}</span>
                        {outsource.created_at && (
                            <span className="text-xs text-muted-foreground">
                                Joined {dateFormatter.format(new Date(outsource.created_at))}
                            </span>
                        )}
                    </div>
                );
            case 'service_type':
                return <span className="text-sm text-muted-foreground">{outsource.service_type || '—'}</span>;
            case 'contact_person':
                return (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <UserCircle className="h-4 w-4 text-slate-400" />
                        <span>{outsource.contact_person || '—'}</span>
                    </div>
                );
            case 'phone':
                return (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Phone className="h-4 w-4 text-slate-400" />
                        <span>{outsource.phone || '—'}</span>
                    </div>
                );
            case 'email':
                return (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Mail className="h-4 w-4 text-slate-400" />
                        <span>{outsource.email || '—'}</span>
                    </div>
                );
            case 'status':
                return renderStatusBadge(outsource.status);
            case 'outsource_performances_count':
                return <span className="font-semibold text-foreground">{formatNumberValue(outsource.outsource_performances_count)}</span>;
            default:
                return '—';
        }
    }, []);

    const tableRows = useMemo(() => {
        if (!outsources?.data?.length) {
            return (
                <TableRow>
                    <TableCell colSpan={tableColumns.length} className="py-8 text-center text-muted-foreground">
                        No outsourcing vendors found.
                        {hasPermission('outsources.create') && (
                            <Link href="/outsources/create" className="ml-1 text-primary underline">
                                Create one
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
                                label: 'View',
                                icon: <Eye className="h-4 w-4" />,
                                href: `/outsources/${outsource.id}`,
                            },
                            hasPermission('outsources.edit') && {
                                label: 'Edit',
                                icon: <Edit className="h-4 w-4" />,
                                href: `/outsources/${outsource.id}/edit`,
                            },
                            hasPermission('outsources.destroy') && {
                                label: 'Delete',
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
                    <span className="text-xs uppercase tracking-wide text-muted-foreground">#{item.position}</span>
                    <span className="text-base font-semibold text-foreground">{item.record.name}</span>
                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
            )}
            renderSubtitle={(item) => item.record.service_type || 'Service type unknown'}
            renderContent={(item) => (
                <div className="space-y-3 text-sm text-muted-foreground">
                    <div className="flex items-center justify-between">
                        <span className="font-medium text-slate-600 dark:text-slate-300">Contact</span>
                        <span className="text-right text-slate-900 dark:text-slate-100">
                            {item.record.contact_person || '—'}
                        </span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="font-medium text-slate-600 dark:text-slate-300">Phone</span>
                        <span className="text-right text-slate-900 dark:text-slate-100">
                            {item.record.phone || '—'}
                        </span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="font-medium text-slate-600 dark:text-slate-300">Email</span>
                        <span className="text-right text-slate-900 dark:text-slate-100">
                            {item.record.email || '—'}
                        </span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="font-medium text-slate-600 dark:text-slate-300">Status</span>
                        <span className="text-right text-slate-900 dark:text-slate-100">
                            {renderStatusBadge(item.record.status)}
                        </span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="font-medium text-slate-600 dark:text-slate-300">Trips</span>
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
                            View
                        </Link>
                    </Button>
                    {hasPermission('outsources.edit') && (
                        <Button asChild size="sm" variant="secondary" className="flex-1 sm:flex-none">
                            <Link href={`/outsources/${item.record.id}/edit`}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
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
                            Delete
                        </Button>
                    )}
                </div>
            )}
            emptyState={(
                <div className="py-8 text-center text-muted-foreground">
                    No outsourcing vendors found.
                    {hasPermission('outsources.create') && (
                        <Link href="/outsources/create" className="ml-1 text-primary underline">
                            Create one
                        </Link>
                    )}
                </div>
            )}
        />
    );

    return (
        <>
            <ListPageLayout
                headTitle="Outsourcing"
                title="Outsourcing Vendors"
                description={`Manage ${formatNumberValue(totalVendors)} outsourcing partner${totalVendors === 1 ? '' : 's'} and their performance footprint.`}
                breadcrumbs={breadcrumbs}
                actions={headerActions}
                stats={statsSection}
                tableTitle="Vendor Directory"
                tableDescription="Track vendor capabilities, contacts, and trip coverage"
                tableHeaderExtras={tableHeaderExtras}
                pagination={
                    outsources?.links ? (
                        <ListingPaginationFooter
                            className="mt-4"
                            links={outsources.links}
                            from={outsources.from ?? undefined}
                            to={outsources.to ?? undefined}
                            total={outsources.total ?? undefined}
                            extra={
                                <Badge variant="outline" className="bg-white/80 text-xs text-slate-600 dark:bg-slate-900/80 dark:text-slate-300">
                                    Active: {formatNumberValue(activeVendors)}
                                </Badge>
                            }
                        />
                    ) : null
                }
            >
                <div className="hidden md:block">
                    <div className="relative">
                        <ListingTableShell
                            columns={tableColumns}
                            sort={{ column: sortColumn, direction: sortDirection, onToggle: handleSortToggle }}
                        >
                            {tableRows}
                        </ListingTableShell>

                        {isLoading && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-background/80 backdrop-blur-sm">
                                <img src="/images/loading-spinner.svg" alt="Loading vendors" className="h-12 w-12" />
                                <span className="text-sm text-muted-foreground">Loading vendors...</span>
                            </div>
                        )}
                    </div>
                </div>

                <div className="relative space-y-3 p-2 md:hidden">
                    {mobileList}

                    {isLoading && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-background/80 backdrop-blur-sm">
                            <img src="/images/loading-spinner.svg" alt="Loading vendors" className="h-10 w-10" />
                            <span className="text-sm text-muted-foreground">Loading vendors...</span>
                        </div>
                    )}
                </div>
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
                title="Delete Vendor"
                description="Are you sure you want to delete this vendor? This action cannot be undone."
                itemName={selectedOutsource?.name ?? undefined}
                onConfirm={handleDeleteConfirm}
                isLoading={isDeleting}
            />
        </>
    );
}
