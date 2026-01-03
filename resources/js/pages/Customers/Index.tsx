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
import { Plus, Eye, Edit, Trash2, Search, Users, CheckCircle, XCircle, Briefcase, ChevronRight } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Customers',
        href: '/customers',
    },
];

type ColumnKey =
    | 'name'
    | 'contact_person'
    | 'phone'
    | 'email'
    | 'operations_count'
    | 'status'
    | 'created_at';

interface CustomerData {
    id: number;
    name: string;
    contact_person?: string | null;
    phone?: string | null;
    email?: string | null;
    address?: string | null;
    status: string;
    created_at?: string | null;
    operations_count?: number | null;
}

interface CustomersIndexProps {
    customers: {
        data: CustomerData[];
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
        total?: number;
        active?: number;
        inactive?: number;
        with_operations?: number;
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

const SKELETON_FLAG_KEY = 'customers.index.shouldShowSkeleton';

const COLUMN_DEFINITIONS: Array<{
    id: ColumnKey;
    label: string;
    sortKey?: string;
    align?: 'center' | 'right';
}> = [
    { id: 'name', label: 'Customer', sortKey: 'name' },
    { id: 'contact_person', label: 'Relationship Owner' },
    { id: 'phone', label: 'Phone' },
    { id: 'email', label: 'Email' },
    { id: 'operations_count', label: 'Operations', sortKey: 'operations_count', align: 'center' },
    { id: 'status', label: 'Status', sortKey: 'status', align: 'center' },
    { id: 'created_at', label: 'Created', sortKey: 'created_at' },
];

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

const formatCount = (value?: number | null): string => {
    if (typeof value !== 'number' || Number.isNaN(value)) {
        return '0';
    }

    return value.toLocaleString();
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
            <Badge className="flex items-center gap-1 border-rose-200 bg-rose-100 text-rose-700 hover:bg-rose-200 dark:border-rose-900/50 dark:bg-rose-900/30 dark:text-rose-200">
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

export default function CustomersIndex({ customers, metrics, filters, statusOptions, perPageOptions }: CustomersIndexProps) {
    const { hasPermission } = usePermissions();
    const canViewCustomer = hasPermission('customers.show');
    const canCreateCustomer = hasPermission('customers.create');
    const canEditCustomer = hasPermission('customers.edit');
    const canDeleteCustomer = hasPermission('customers.destroy');

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
    const [selectedCustomer, setSelectedCustomer] = React.useState<CustomerData | null>(null);
    const [isDeleting, setIsDeleting] = React.useState(false);

    const isDataReady = Array.isArray(customers?.data);
    const { isLoading: isTableLoading } = useListingLoading({
        storageKey: SKELETON_FLAG_KEY,
        isDataReady,
        minimumDuration: 200,
        onlySamePath: true,
        initialIsLoading: false,
    });

    React.useEffect(() => {
        setPerPage(String(resolvedPerPage));
    }, [resolvedPerPage]);

    const customerData = customers?.data ?? [];
    const totalRecords = metrics?.total ?? customers?.total ?? customerData.length ?? 0;
    const activeCount = metrics?.active ?? 0;
    const inactiveCount = metrics?.inactive ?? 0;
    const withOperationsCount = metrics?.with_operations ?? 0;
    const rowOffset = Math.max((customers?.from ?? 1) - 1, 0);

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

            router.get('/customers', params, { preserveState: true, replace: false });
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

    const handleDeleteClick = (customer: CustomerData) => {
        setSelectedCustomer(customer);
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = () => {
        if (!selectedCustomer) {
            return;
        }

        setIsDeleting(true);

        router.delete(`/customers/${selectedCustomer.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                setDeleteDialogOpen(false);
                setIsDeleting(false);
                toast({
                    title: '✅ Customer Deleted',
                    description: selectedCustomer.name
                        ? `The customer "${selectedCustomer.name}" was removed successfully.`
                        : 'The customer was removed successfully.',
                });
            },
            onError: (errors) => {
                setIsDeleting(false);
                const fallback = 'Failed to delete customer. Please try again.';
                const errorMessages = errors && typeof errors === 'object'
                    ? Object.values(errors)
                          .flatMap((value) => (Array.isArray(value) ? value : [value]))
                          .filter(Boolean)
                          .join(', ')
                    : fallback;

                toast({
                    title: '❌ Delete Failed',
                    description: errorMessages || fallback,
                    variant: 'destructive',
                });
            },
        });
    };

    const statsDefinitions = [
        {
            id: 'total-customers',
            label: 'Total Customers',
            icon: <Users className="h-3.5 w-3.5 text-blue-600" />,
            className: 'min-w-[220px] flex-shrink-0',
            value: isTableLoading ? (
                <Skeleton className="h-3.5 w-20" aria-hidden="true" />
            ) : (
                totalRecords.toLocaleString()
            ),
            description: isTableLoading ? (
                <Skeleton className="h-3 w-28" aria-hidden="true" />
            ) : (
                'Full portfolio'
            ),
            valueClassName: isTableLoading ? undefined : 'text-blue-600',
        },
        {
            id: 'active-customers',
            label: 'Active Accounts',
            icon: <CheckCircle className="h-3.5 w-3.5 text-emerald-600" />,
            className: 'min-w-[220px] flex-shrink-0',
            value: isTableLoading ? (
                <Skeleton className="h-3.5 w-16" aria-hidden="true" />
            ) : (
                activeCount.toLocaleString()
            ),
            description: isTableLoading ? (
                <Skeleton className="h-3 w-24" aria-hidden="true" />
            ) : (
                'Currently active'
            ),
            valueClassName: isTableLoading ? undefined : 'text-emerald-600',
        },
        {
            id: 'inactive-customers',
            label: 'Inactive',
            icon: <XCircle className="h-3.5 w-3.5 text-rose-600" />,
            className: 'min-w-[220px] flex-shrink-0',
            value: isTableLoading ? (
                <Skeleton className="h-3.5 w-16" aria-hidden="true" />
            ) : (
                inactiveCount.toLocaleString()
            ),
            description: isTableLoading ? (
                <Skeleton className="h-3 w-24" aria-hidden="true" />
            ) : (
                'Off duty'
            ),
            valueClassName: isTableLoading ? undefined : 'text-rose-600',
        },
        {
            id: 'with-operations',
            label: 'With Operations',
            icon: <Briefcase className="h-3.5 w-3.5 text-indigo-600" />,
            className: 'min-w-[220px] flex-shrink-0',
            value: isTableLoading ? (
                <Skeleton className="h-3.5 w-20" aria-hidden="true" />
            ) : (
                withOperationsCount.toLocaleString()
            ),
            description: isTableLoading ? (
                <Skeleton className="h-3 w-28" aria-hidden="true" />
            ) : (
                'Has operations'
            ),
            valueClassName: isTableLoading ? undefined : 'text-indigo-600',
        },
    ];

    const tableColumns = React.useMemo(
        () => [
            { id: 'index', label: '#', align: 'center' as const },
            ...COLUMN_DEFINITIONS.map((col) => ({
                id: col.id,
                label: col.label,
                sortable: Boolean(col.sortKey),
                sortKey: col.sortKey,
                align: col.align,
            })),
            { id: 'actions', label: 'Actions', align: 'center' as const },
        ],
        [],
    );

    const tableRows = isTableLoading
        ? Array.from({ length: 8 }).map((_, index) => (
              <TableRow key={`skeleton-${index}`} aria-hidden="true">
                  <TableCell className="text-center">
                      <Skeleton className="h-4 w-6 mx-auto" />
                  </TableCell>
                  <TableCell>
                      <div className="flex flex-col gap-2">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-3 w-40" />
                      </div>
                  </TableCell>
                  <TableCell>
                      <Skeleton className="h-4 w-28" />
                  </TableCell>
                  <TableCell>
                      <Skeleton className="h-4 w-24" />
                  </TableCell>
                  <TableCell>
                      <Skeleton className="h-4 w-36" />
                  </TableCell>
                  <TableCell className="text-center">
                      <Skeleton className="h-4 w-12 mx-auto" />
                  </TableCell>
                  <TableCell className="text-center">
                      <Skeleton className="h-6 w-20 mx-auto rounded-full" />
                  </TableCell>
                  <TableCell>
                      <Skeleton className="h-4 w-24" />
                  </TableCell>
                  <TableCell className="text-center">
                      <Skeleton className="h-8 w-8 mx-auto rounded" />
                  </TableCell>
              </TableRow>
          ))
        : customerData.length > 0
            ? customerData.map((customer, index) => (
                  <TableRow key={customer.id} className="hover:bg-muted/50">
                      <TableCell className="text-center font-medium">{rowOffset + index + 1}</TableCell>
                      <TableCell className="font-medium">
                          <div className="flex flex-col">
                              <span className="text-base font-semibold text-foreground">{customer.name}</span>
                              <span className="text-sm text-muted-foreground">
                                  {customer.address ? customer.address : 'Address not provided'}
                              </span>
                          </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{customer.contact_person || '—'}</TableCell>
                      <TableCell className="text-muted-foreground">{customer.phone || '—'}</TableCell>
                      <TableCell className="text-muted-foreground">{customer.email || '—'}</TableCell>
                      <TableCell className="text-center font-medium">{formatCount(customer.operations_count)}</TableCell>
                      <TableCell className="text-center">{getStatusBadge(customer.status)}</TableCell>
                      <TableCell className="text-muted-foreground">{formatDateValue(customer.created_at)}</TableCell>
                      <TableCell className="text-center">
                          <ListingRowActionsMenu
                              actions={[
                                  canViewCustomer && {
                                      label: 'View',
                                      icon: <Eye className="h-4 w-4" />,
                                      href: `/customers/${customer.id}`,
                                  },
                                  canEditCustomer && {
                                      label: 'Edit',
                                      icon: <Edit className="h-4 w-4" />,
                                      href: `/customers/${customer.id}/edit`,
                                  },
                                  canDeleteCustomer && {
                                      label: 'Delete',
                                      icon: <Trash2 className="h-4 w-4" />,
                                      danger: true,
                                      disabled: isDeleting && selectedCustomer?.id === customer.id,
                                      onSelect: () => handleDeleteClick(customer),
                                  },
                              ].filter(Boolean)}
                          />
                      </TableCell>
                  </TableRow>
              ))
            : (
                <TableRow>
                    <TableCell colSpan={tableColumns.length} className="py-8 text-center text-muted-foreground">
                        No customers found.
                        {canCreateCustomer && (
                            <Link href="/customers/create" className="ml-1 text-primary underline">
                                Create one
                            </Link>
                        )}
                    </TableCell>
                </TableRow>
            );

    const mobileItems = React.useMemo(() => customerData.map((customer, index) => ({
        position: rowOffset + index + 1,
        record: customer,
    })), [customerData, rowOffset]);

    const perPageSelectOptions = React.useMemo(
        () => availablePerPageOptions.map(option => ({ label: String(option), value: String(option) })),
        [availablePerPageOptions],
    );

    const statsSection = (
        <ListingStatsHeader stats={statsDefinitions} orientation="row" />
    );

    const mobileContent = isTableLoading ? (
        <ListingMobileItemList
            items={Array.from({ length: 5 }).map((_, i) => ({ record: { id: i }, position: i + 1 }))}
            getKey={(item) => `skeleton-${item.position}`}
            renderTitle={() => (
                <div className="flex items-center gap-2">
                    <Skeleton className="h-3 w-8" />
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-3.5 w-3.5 rounded" />
                </div>
            )}
            renderSubtitle={() => <Skeleton className="h-3 w-36" />}
            renderContent={() => (
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <Skeleton className="h-3 w-16" />
                        <Skeleton className="h-3 w-32" />
                    </div>
                    <div className="flex items-center justify-between">
                        <Skeleton className="h-3 w-16" />
                        <Skeleton className="h-3 w-24" />
                    </div>
                    <div className="flex items-center justify-between">
                        <Skeleton className="h-3 w-20" />
                        <Skeleton className="h-3 w-12" />
                    </div>
                    <div className="flex items-center justify-between">
                        <Skeleton className="h-3 w-16" />
                        <Skeleton className="h-3 w-20" />
                    </div>
                    <div className="flex items-center justify-between">
                        <Skeleton className="h-3 w-16" />
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
                    <span className="text-xs uppercase tracking-wide text-muted-foreground">#{item.position}</span>
                    <span className="text-base font-semibold text-foreground">{item.record.name}</span>
                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
            )}
            renderSubtitle={(item) => item.record.contact_person || 'Contact not specified'}
            renderContent={(item) => (
                <div className="space-y-3 text-sm text-muted-foreground">
                    <div className="flex items-center justify-between">
                        <span className="font-medium text-slate-600 dark:text-slate-300">Email</span>
                        <span className="text-right text-slate-900 dark:text-slate-100">
                            {item.record.email || 'Not provided'}
                        </span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="font-medium text-slate-600 dark:text-slate-300">Phone</span>
                        <span className="text-right text-slate-900 dark:text-slate-100">
                            {item.record.phone || 'Not provided'}
                        </span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="font-medium text-slate-600 dark:text-slate-300">Operations</span>
                        <span className="text-right text-slate-900 dark:text-slate-100">
                            {formatCount(item.record.operations_count)}
                        </span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="font-medium text-slate-600 dark:text-slate-300">Status</span>
                        <span className="text-right text-slate-900 dark:text-slate-100">{item.record.status}</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="font-medium text-slate-600 dark:text-slate-300">Joined</span>
                        <span className="text-right text-slate-900 dark:text-slate-100">
                            {formatDateValue(item.record.created_at)}
                        </span>
                    </div>
                </div>
            )}
            renderFooter={(item) => (
                <div className="flex w-full flex-wrap items-center justify-end gap-2">
                    {canViewCustomer && (
                        <Button asChild size="sm" variant="outline" className="flex-1 sm:flex-auto">
                            <Link href={`/customers/${item.record.id}`}>
                                <Eye className="mr-2 h-4 w-4" />
                                View
                            </Link>
                        </Button>
                    )}
                    {canEditCustomer && (
                        <Button asChild size="sm" variant="secondary" className="flex-1 sm:flex-none">
                            <Link href={`/customers/${item.record.id}/edit`}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                            </Link>
                        </Button>
                    )}
                    {canDeleteCustomer && (
                        <Button
                            size="sm"
                            variant="destructive"
                            className="flex-1 sm:flex-none"
                            onClick={() => handleDeleteClick(item.record)}
                            disabled={isDeleting && selectedCustomer?.id === item.record.id}
                        >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                        </Button>
                    )}
                </div>
            )}
            emptyState={(
                <div className="py-8 text-center text-muted-foreground">
                    No customers found.
                    {canCreateCustomer && (
                        <Link href="/customers/create" className="ml-1 text-primary underline">
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
                placeholder: 'Search customers...',
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
            {canCreateCustomer && (
                <Button asChild>
                    <Link href="/customers/create">
                        <Plus className="mr-2 h-4 w-4" />
                        Add Customer
                    </Link>
                </Button>
            )}
        </>
    );

    return (
        <>
            <ListPageLayout
                headTitle="Customers"
                title="Customers"
                description={`Manage ${formatCount(totalRecords)} customer${totalRecords === 1 ? '' : 's'} and monitor relationship health.`}
                breadcrumbs={breadcrumbs}
                actions={headerActions}
                stats={statsSection}
                tableTitle="Customer Portfolio"
                tableDescription="Track commercial accounts, their status, and operational engagement."
                tableHeaderExtras={tableHeaderExtras}
                pagination={
                    !isTableLoading && customers?.links ? (
                        <ListingPaginationFooter
                            className="mt-4"
                            links={customers.links}
                            from={customers.from ?? undefined}
                            to={customers.to ?? undefined}
                            total={customers.total ?? undefined}
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
                        setSelectedCustomer(null);
                        setIsDeleting(false);
                    }
                }}
                title="Delete Customer"
                description="Are you sure you want to delete this customer? This action cannot be undone."
                itemName={selectedCustomer ? selectedCustomer.name : undefined}
                onConfirm={handleDeleteConfirm}
                isLoading={isDeleting}
            />
        </>
    );
}

