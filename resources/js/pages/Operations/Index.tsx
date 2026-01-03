import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { TableCell, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
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
import { Link, router, useForm } from '@inertiajs/react';
import { type BreadcrumbItem } from '@/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import * as React from 'react';
import {
    CheckCircle,
    Eye,
    Gauge,
    Plus,
    Search,
    Square,
    SquarePen,
    Trash2,
    XCircle,
    ChevronRight,
    Lock,
    Unlock,
} from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Operations',
        href: '/operations',
    },
];

interface OperationCustomer {
    id: number;
    name: string;
}

interface OperationData {
    id: number;
    operationid: string;
    customer?: OperationCustomer | null;
    description?: string | null;
    volume?: number | null;
    km?: number | null;
    startdate?: string | null;
    enddate?: string | null;
    closed?: boolean | null;
    created_at?: string | null;
    deliveredVolume?: number | null;
    remainingVolume?: number | null;
    volumeCompletion?: number | null;
}

interface OperationsIndexProps {
    operations: {
        data: OperationData[];
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
        active: number;
        inactive: number;
        closed: number;
        open: number;
    };
    filters: {
        search?: string | null;
        status?: string | null;
        customer?: string | number | null;
        sort?: string | null;
        direction?: 'asc' | 'desc' | null;
        per_page?: number | null;
    };
    statusOptions: Array<{ label: string; value: string }>;
    customerOptions: Array<{ id: number; name: string }>;
    perPageOptions: number[];
    totalCount?: number;
}

const SKELETON_FLAG_KEY = 'operations.index.shouldShowSkeleton';

const COLUMN_DEFINITIONS: Array<{
    id:
        | 'operationid'
        | 'customer'
        | 'startdate'
        | 'volume'
        | 'km'
        | 'tonnageProgress'
        | 'closed';
    label: string;
    sortKey?: string;
    align?: 'center' | 'right';
}> = [
    { id: 'operationid', label: 'Operation ID', sortKey: 'operationid' },
    { id: 'customer', label: 'Customer' },
    { id: 'startdate', label: 'Start Date', sortKey: 'startdate' },
    { id: 'volume', label: 'Volume (MT)', sortKey: 'volume', align: 'right' },
    { id: 'km', label: 'Distance (KM)', sortKey: 'km', align: 'right' },
    { id: 'tonnageProgress', label: 'Uplift Progress' },
    { id: 'closed', label: 'Closed', sortKey: 'closed', align: 'center' },
];

const formatNumberValue = (value?: number | null, fractionDigits = 2): string => {
    if (value === null || value === undefined || Number.isNaN(Number(value))) {
        return '—';
    }

    return Number(value).toLocaleString('en-US', {
        minimumFractionDigits: fractionDigits,
        maximumFractionDigits: fractionDigits,
    });
};

const clampPercentage = (value: number) => Math.max(0, Math.min(value, 100));

const formatDateValue = (value?: string | null): string => {
    if (!value) {
        return '—';
    }

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
        return '—';
    }

    return parsed.toLocaleDateString();
};

const formatDateForInput = (value?: string | null): string => {
    if (!value) {
        return new Date().toISOString().slice(0, 10);
    }

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
        return new Date().toISOString().slice(0, 10);
    }

    return parsed.toISOString().slice(0, 10);
};

const formatCount = (value?: number | null): string => {
    if (typeof value !== 'number' || Number.isNaN(value)) {
        return '0';
    }

    return value.toLocaleString();
};

const renderTonnageProgress = (operation: OperationData): React.ReactNode => {
    const planned = operation.volume ?? null;
    const delivered = operation.deliveredVolume ?? null;
    const remaining = operation.remainingVolume ?? null;
    const completion = operation.volumeCompletion ?? null;
    const progressWidth = completion !== null ? `${clampPercentage(completion)}%` : '0%';

    if ((planned === null || planned === 0) && (delivered === null || delivered === 0)) {
        return <span className="text-muted-foreground">—</span>;
    }

    return (
        <div className="min-w-[200px] space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Delivered</span>
                <span className="font-medium text-foreground">
                    {delivered !== null ? `${formatNumberValue(delivered)} MT` : 'N/A'}
                </span>
            </div>
            <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted">
                <div className="h-2 rounded-full bg-primary transition-all" style={{ width: progressWidth }} />
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{completion !== null ? `${completion.toFixed(1)}%` : 'No plan set'}</span>
                {planned !== null && remaining !== null ? (
                    <span>Remaining {formatNumberValue(Math.max(remaining, 0))} MT</span>
                ) : (
                    <span className="invisible">placeholder</span>
                )}
            </div>
        </div>
    );
};

const getClosedBadge = (closed?: boolean | null): React.ReactNode => {
    if (closed) {
        return <Badge className="bg-slate-500 text-white hover:bg-slate-600">Closed</Badge>;
    }

    return <Badge className="bg-blue-500 text-white hover:bg-blue-600">Open</Badge>;
};

export default function OperationsIndex({
    operations,
    metrics,
    filters,
    statusOptions,
    customerOptions,
    perPageOptions,
    totalCount,
}: OperationsIndexProps) {
    const { hasPermission } = usePermissions();
    const canCreateOperation = hasPermission('operations.create');
    const canViewOperation = hasPermission('operations.show');
    const canEditOperation = hasPermission('operations.edit');
    const canDeleteOperation = hasPermission('operations.destroy');
    const canCloseOperation = hasPermission('operations.close');
    const canReopenOperation = hasPermission('operations.reopen');

    const [searchTerm, setSearchTerm] = React.useState(filters?.search ?? '');
    const [selectedStatus, setSelectedStatus] = React.useState(filters?.status ?? 'all');
    const [selectedCustomer, setSelectedCustomer] = React.useState(
        filters?.customer ? String(filters.customer) : 'all',
    );
    const [sortColumn, setSortColumn] = React.useState<string>(filters?.sort ?? 'operationid');
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
    const [selectedOperation, setSelectedOperation] = React.useState<OperationData | null>(null);
    const [isDeleting, setIsDeleting] = React.useState(false);
    const [closeDialogOpen, setCloseDialogOpen] = React.useState(false);
    const [operationToClose, setOperationToClose] = React.useState<OperationData | null>(null);
    const [reopenDialogOpen, setReopenDialogOpen] = React.useState(false);
    const [operationToReopen, setOperationToReopen] = React.useState<OperationData | null>(null);

    const closeForm = useForm<{ closed_date: string; comment: string }>({
        closed_date: '',
        comment: '',
    });

    const reopenForm = useForm<{ comment: string }>({
        comment: '',
    });

    const isDataReady = Array.isArray(operations?.data);
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

    const operationData = operations?.data ?? [];
    const totalRecords = totalCount ?? metrics?.total ?? operations?.total ?? operationData.length ?? 0;
    const currentPage = operations?.current_page ?? 1;
    const perPageCountRaw = operations?.per_page ?? Number(perPage);
    const perPageCount =
        Number.isFinite(perPageCountRaw) && perPageCountRaw && perPageCountRaw > 0
            ? Number(perPageCountRaw)
            : operationData.length || 1;
    const rowOffset = (currentPage - 1) * perPageCount;

    const handleNavigate = React.useCallback(
        (overrides: {
            search?: string;
            status?: string;
            customer?: string;
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

            const nextCustomer = hasOverride('customer')
                ? overrides.customer
                : selectedCustomer !== 'all'
                    ? selectedCustomer
                    : undefined;

            const nextSort = hasOverride('sort') ? overrides.sort ?? sortColumn : sortColumn;
            const nextDirection = hasOverride('direction') ? overrides.direction ?? sortDirection : sortDirection;
            const nextPerPage = hasOverride('per_page') ? overrides.per_page : Number(perPage);
            const nextPage = hasOverride('page') ? overrides.page : undefined;

            const params: Record<string, string | number | undefined> = {
                search: nextSearch && nextSearch !== '' ? nextSearch : undefined,
                status: nextStatus && nextStatus !== 'all' ? nextStatus : undefined,
                customer: nextCustomer && nextCustomer !== 'all' ? nextCustomer : undefined,
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

            router.get('/operations', params, { preserveState: true, replace: false });
        },
        [perPage, searchTerm, selectedStatus, selectedCustomer, sortColumn, sortDirection],
    );

    const handleSearchChange = (value: string) => {
        setSearchTerm(value);
        handleNavigate({ search: value.trim() ? value.trim() : undefined, page: 1 });
    };

    const handleStatusChange = (value: string) => {
        setSelectedStatus(value);
        handleNavigate({ status: value !== 'all' ? value : undefined, page: 1 });
    };

    const handleCustomerChange = (value: string) => {
        setSelectedCustomer(value);
        handleNavigate({ customer: value !== 'all' ? value : undefined, page: 1 });
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

    const handleDeleteClick = (operation: OperationData) => {
        setSelectedOperation(operation);
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = () => {
        if (!selectedOperation) {
            return;
        }

        setIsDeleting(true);

        router.delete(`/operations/${selectedOperation.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                setDeleteDialogOpen(false);
                setSelectedOperation(null);
                setIsDeleting(false);
                toast({
                    title: '✅ Operation Deleted',
                    description: 'The operation was removed successfully.',
                });
            },
            onError: (errors) => {
                setIsDeleting(false);

                const fallback = 'Failed to delete operation. Please try again.';
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

    const handleCloseOperationClick = (operation: OperationData) => {
        setOperationToClose(operation);
        closeForm.clearErrors();
        closeForm.setData((current) => ({
            ...current,
            closed_date: formatDateForInput(operation.enddate),
            comment: '',
        }));
        setCloseDialogOpen(true);
    };

    const handleCloseDialogChange = (open: boolean) => {
        setCloseDialogOpen(open);
        if (!open) {
            setOperationToClose(null);
            closeForm.reset();
            closeForm.clearErrors();
        }
    };

    const handleCloseSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!operationToClose) {
            return;
        }

        closeForm.post(`/operations/${operationToClose.id}/close`, {
            preserveScroll: true,
            onSuccess: () => {
                toast({
                    title: '✅ Operation Closed',
                    description: `${operationToClose.operationid} marked as closed.`,
                });
                handleCloseDialogChange(false);
            },
            onError: (errors) => {
                const fallback = 'Failed to close operation. Please review the form and try again.';

                if (errors && typeof errors === 'object') {
                    const errorMessages = Object.values(errors)
                        .flatMap((value) => (Array.isArray(value) ? value : [value]))
                        .filter(Boolean)
                        .join('\n');

                    toast({
                        title: '❌ Close Failed',
                        description: errorMessages || fallback,
                        variant: 'destructive',
                    });
                } else {
                    toast({
                        title: '❌ Close Failed',
                        description: fallback,
                        variant: 'destructive',
                    });
                }
            },
        });
    };

    const handleReopenOperationClick = (operation: OperationData) => {
        setOperationToReopen(operation);
        reopenForm.clearErrors();
        reopenForm.setData((current) => ({
            ...current,
            comment: '',
        }));
        setReopenDialogOpen(true);
    };

    const handleReopenDialogChange = (open: boolean) => {
        setReopenDialogOpen(open);
        if (!open) {
            setOperationToReopen(null);
            reopenForm.reset();
            reopenForm.clearErrors();
        }
    };

    const handleReopenSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!operationToReopen) {
            return;
        }

        reopenForm.post(`/operations/${operationToReopen.id}/reopen`, {
            preserveScroll: true,
            onSuccess: () => {
                toast({
                    title: '✅ Operation Reopened',
                    description: `${operationToReopen.operationid} is active again.`,
                });
                handleReopenDialogChange(false);
            },
            onError: (errors) => {
                const fallback = 'Failed to reopen operation. Please try again.';

                if (errors && typeof errors === 'object') {
                    const errorMessages = Object.values(errors)
                        .flatMap((value) => (Array.isArray(value) ? value : [value]))
                        .filter(Boolean)
                        .join('\n');

                    toast({
                        title: '❌ Reopen Failed',
                        description: errorMessages || fallback,
                        variant: 'destructive',
                    });
                } else {
                    toast({
                        title: '❌ Reopen Failed',
                        description: fallback,
                        variant: 'destructive',
                    });
                }
            },
        });
    };

    const statsDefinitions = [
        {
            id: 'total-operations',
            label: 'Total Operations',
            icon: <Square className="h-3.5 w-3.5 text-slate-500" />,
            className: 'min-w-0',
            value: isTableLoading ? (
                <Skeleton className="h-3.5 w-20" aria-hidden="true" />
            ) : (
                formatCount(totalRecords)
            ),
            description: isTableLoading ? (
                <Skeleton className="h-3 w-32" aria-hidden="true" />
            ) : (
                `${formatCount(metrics?.open)} currently open`
            ),
            valueClassName: isTableLoading ? undefined : 'text-slate-600',
        },
        {
            id: 'active-operations',
            label: 'Active',
            icon: <CheckCircle className="h-3.5 w-3.5 text-emerald-600" />,
            className: 'min-w-0',
            value: isTableLoading ? (
                <Skeleton className="h-3.5 w-16" aria-hidden="true" />
            ) : (
                formatCount(metrics?.active)
            ),
            description: isTableLoading ? (
                <Skeleton className="h-3 w-28" aria-hidden="true" />
            ) : (
                'Operations in motion'
            ),
            valueClassName: isTableLoading ? undefined : 'text-emerald-600',
        },
        {
            id: 'inactive-operations',
            label: 'Inactive',
            icon: <XCircle className="h-3.5 w-3.5 text-rose-500" />,
            className: 'min-w-0',
            value: isTableLoading ? (
                <Skeleton className="h-3.5 w-16" aria-hidden="true" />
            ) : (
                formatCount(metrics?.inactive)
            ),
            description: isTableLoading ? (
                <Skeleton className="h-3 w-28" aria-hidden="true" />
            ) : (
                'Temporarily paused'
            ),
            valueClassName: isTableLoading ? undefined : 'text-rose-500',
        },
        {
            id: 'closed-operations',
            label: 'Closed',
            icon: <Gauge className="h-3.5 w-3.5 text-purple-600" />,
            className: 'min-w-0',
            value: isTableLoading ? (
                <Skeleton className="h-3.5 w-16" aria-hidden="true" />
            ) : (
                formatCount(metrics?.closed)
            ),
            description: isTableLoading ? (
                <Skeleton className="h-3 w-32" aria-hidden="true" />
            ) : (
                'Completed and archived'
            ),
            valueClassName: isTableLoading ? undefined : 'text-purple-600',
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

    const tableRows = isTableLoading
        ? Array.from({ length: 8 }).map((_, index) => (
              <TableRow key={`skeleton-${index}`} aria-hidden="true">
                  <TableCell className="text-center">
                      <Skeleton className="h-4 w-6 mx-auto" />
                  </TableCell>
                  <TableCell>
                      <Skeleton className="h-4 w-24" />
                  </TableCell>
                  <TableCell>
                      <Skeleton className="h-4 w-32" />
                  </TableCell>
                  <TableCell>
                      <Skeleton className="h-4 w-20" />
                  </TableCell>
                  <TableCell className="text-right">
                      <Skeleton className="h-4 w-16 ml-auto" />
                  </TableCell>
                  <TableCell className="text-right">
                      <Skeleton className="h-4 w-16 ml-auto" />
                  </TableCell>
                  <TableCell>
                      <Skeleton className="h-12 w-48" />
                  </TableCell>
                  <TableCell className="text-center">
                      <Skeleton className="h-6 w-16 mx-auto rounded-full" />
                  </TableCell>
                  <TableCell className="text-center">
                      <Skeleton className="h-8 w-8 mx-auto rounded" />
                  </TableCell>
              </TableRow>
          ))
        : operationData.length > 0
            ? operationData.map((operation, index) => (
                  <TableRow key={operation.id} className="hover:bg-muted/50">
                      <TableCell className="text-center font-medium">{rowOffset + index + 1}</TableCell>
                      <TableCell className="font-medium">{operation.operationid}</TableCell>
                      <TableCell className="text-muted-foreground">{operation.customer?.name || '—'}</TableCell>
                      <TableCell className="text-muted-foreground">{formatDateValue(operation.startdate)}</TableCell>
                      <TableCell className="text-right font-medium">{formatNumberValue(operation.volume)}</TableCell>
                      <TableCell className="text-right text-muted-foreground">{formatNumberValue(operation.km)}</TableCell>
                      <TableCell>{renderTonnageProgress(operation)}</TableCell>
                      <TableCell className="text-center">{getClosedBadge(operation.closed)}</TableCell>
                      <TableCell className="text-center">
                          <ListingRowActionsMenu
                              actions={[
                                  canViewOperation && {
                                      label: 'View',
                                      icon: <Eye className="h-4 w-4" />,
                                      href: `/operations/${operation.id}`,
                                  },
                                  canEditOperation && {
                                      label: 'Edit',
                                      icon: <SquarePen className="h-4 w-4" />,
                                      href: `/operations/${operation.id}/edit`,
                                  },
                                  canCloseOperation && !operation.closed && {
                                      label: 'Close',
                                      icon: <Lock className="h-4 w-4" />,
                                      onSelect: () => handleCloseOperationClick(operation),
                                  },
                                  canReopenOperation && operation.closed && {
                                      label: 'Reopen',
                                      icon: <Unlock className="h-4 w-4" />,
                                      onSelect: () => handleReopenOperationClick(operation),
                                  },
                                  canDeleteOperation && {
                                      label: 'Delete',
                                      icon: <Trash2 className="h-4 w-4" />,
                                      danger: true,
                                      disabled: isDeleting && selectedOperation?.id === operation.id,
                                      onSelect: () => handleDeleteClick(operation),
                                  },
                              ].filter(Boolean)}
                          />
                      </TableCell>
                  </TableRow>
              ))
            : (
                <TableRow>
                    <TableCell colSpan={tableColumns.length} className="py-8 text-center text-muted-foreground">
                        No operations found.
                        {canCreateOperation && (
                            <Link href="/operations/create" className="ml-1 text-primary underline">
                                Create one
                            </Link>
                        )}
                    </TableCell>
                </TableRow>
            );

    const mobileItems = React.useMemo(
        () =>
            operationData.map((operation, index) => ({
                record: operation,
                position: rowOffset + index + 1,
            })),
        [operationData, rowOffset],
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
            renderSubtitle={() => <Skeleton className="h-3 w-40" />}
            renderContent={() => (
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <Skeleton className="h-3 w-20" />
                        <Skeleton className="h-3 w-24" />
                    </div>
                    <div className="flex items-center justify-between">
                        <Skeleton className="h-3 w-16" />
                        <Skeleton className="h-3 w-20" />
                    </div>
                    <div className="flex items-center justify-between">
                        <Skeleton className="h-3 w-20" />
                        <Skeleton className="h-3 w-24" />
                    </div>
                    <Skeleton className="h-12 w-full" />
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
                    <span className="text-base">{item.record.operationid}</span>
                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
            )}
            renderSubtitle={(item) => item.record.customer?.name || 'Unassigned customer'}
            renderContent={(item) => (
                <div className="space-y-3 text-sm text-muted-foreground">
                    <div className="flex items-center justify-between">
                        <span className="font-medium text-slate-600 dark:text-slate-300">Start Date</span>
                        <span className="text-right text-slate-900 dark:text-slate-100">
                            {formatDateValue(item.record.startdate)}
                        </span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="font-medium text-slate-600 dark:text-slate-300">Volume</span>
                        <span className="text-right text-slate-900 dark:text-slate-100">
                            {formatNumberValue(item.record.volume)} MT
                        </span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="font-medium text-slate-600 dark:text-slate-300">Distance</span>
                        <span className="text-right text-slate-900 dark:text-slate-100">
                            {formatNumberValue(item.record.km, 0)} KM
                        </span>
                    </div>
                    <div>{renderTonnageProgress(item.record)}</div>
                </div>
            )}
            renderFooter={(item) => (
                <div className="flex w-full flex-wrap items-center justify-end gap-2">
                    {canViewOperation && (
                        <Button asChild size="sm" variant="outline" className="flex-1 sm:flex-auto">
                            <Link href={`/operations/${item.record.id}`}>
                                <Eye className="mr-2 h-4 w-4" />
                                View
                            </Link>
                        </Button>
                    )}
                    {canEditOperation && (
                        <Button asChild size="sm" variant="secondary" className="flex-1 sm:flex-none">
                            <Link href={`/operations/${item.record.id}/edit`}>
                                <SquarePen className="mr-2 h-4 w-4" />
                                Edit
                            </Link>
                        </Button>
                    )}
                    {canCloseOperation && !item.record.closed && (
                        <Button
                            size="sm"
                            variant="outline"
                            className="flex-1 sm:flex-none"
                            onClick={() => handleCloseOperationClick(item.record)}
                        >
                            <Lock className="mr-2 h-4 w-4" />
                            Close
                        </Button>
                    )}
                    {canReopenOperation && item.record.closed && (
                        <Button
                            size="sm"
                            variant="outline"
                            className="flex-1 sm:flex-none"
                            onClick={() => handleReopenOperationClick(item.record)}
                        >
                            <Unlock className="mr-2 h-4 w-4" />
                            Reopen
                        </Button>
                    )}
                    {canDeleteOperation && (
                        <Button
                            size="sm"
                            variant="destructive"
                            className="flex-1 sm:flex-none"
                            onClick={() => handleDeleteClick(item.record)}
                            disabled={isDeleting && selectedOperation?.id === item.record.id}
                        >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                        </Button>
                    )}
                </div>
            )}
            emptyState={(
                <div className="py-8 text-center text-muted-foreground">
                    No operations found.
                    {canCreateOperation && (
                        <Link href="/operations/create" className="ml-1 text-primary underline">
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

    const tableHeaderExtras = (
        <ListingFilterBar
            search={{
                value: searchTerm,
                placeholder: 'Search operations...',
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
                <SelectTrigger className="w-full min-w-[180px] sm:w-auto">
                    <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    {statusOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                            {option.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
            <Select value={selectedCustomer} onValueChange={handleCustomerChange}>
                <SelectTrigger className="w-full min-w-[220px] sm:w-auto">
                    <SelectValue placeholder="Customer" />
                </SelectTrigger>
                <SelectContent className="max-h-72">
                    <SelectItem value="all">All customers</SelectItem>
                    {customerOptions.map((customer) => (
                        <SelectItem key={customer.id} value={String(customer.id)}>
                            {customer.name}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </ListingFilterBar>
    );

    const headerActions = (
        <>
            {canCreateOperation && (
                <Button asChild>
                    <Link href="/operations/create">
                        <Plus className="mr-2 h-4 w-4" />
                        Add Operation
                    </Link>
                </Button>
            )}
        </>
    );

    return (
        <>
            <ListPageLayout
                headTitle="Operations"
                title="Operations"
                description={`Manage your operations (${formatCount(totalRecords)})`}
                breadcrumbs={breadcrumbs}
                actions={headerActions}
                stats={statsSection}
                tableTitle="Operations Directory"
                tableDescription="Complete list of all operations"
                tableHeaderExtras={tableHeaderExtras}
                pagination={
                    !isTableLoading && operations?.links ? (
                        <ListingPaginationFooter
                            className="mt-4"
                            links={operations.links}
                            from={operations.from ?? undefined}
                            to={operations.to ?? undefined}
                            total={operations.total ?? undefined}
                        />
                    ) : null
                }
            >
                <div className="hidden md:block">{tableContent}</div>

                <div className="relative space-y-3 md:hidden">
                    {mobileContent}
                </div>
            </ListPageLayout>

            <Dialog open={closeDialogOpen} onOpenChange={handleCloseDialogChange}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Close Operation</DialogTitle>
                        <DialogDescription>
                            Provide the closure details for
                            {' '}
                            {operationToClose ? operationToClose.operationid : 'this operation'}.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleCloseSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="closed_date">Closed Date</Label>
                            <Input
                                id="closed_date"
                                type="date"
                                value={closeForm.data.closed_date}
                                onChange={(event) => closeForm.setData('closed_date', event.target.value)}
                                max={new Date().toISOString().slice(0, 10)}
                                required
                            />
                            {closeForm.errors.closed_date && (
                                <p className="text-sm text-destructive">{closeForm.errors.closed_date}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="closure-comment">Comment</Label>
                            <Textarea
                                id="closure-comment"
                                value={closeForm.data.comment}
                                onChange={(event) => closeForm.setData('comment', event.target.value)}
                                placeholder="Summarise why this operation is closing"
                                rows={4}
                                required
                            />
                            {closeForm.errors.comment && (
                                <p className="text-sm text-destructive">{closeForm.errors.comment}</p>
                            )}
                        </div>

                        <DialogFooter className="gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => handleCloseDialogChange(false)}
                                disabled={closeForm.processing}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={closeForm.processing}>
                                {closeForm.processing ? 'Closing...' : 'Close Operation'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog open={reopenDialogOpen} onOpenChange={handleReopenDialogChange}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Reopen Operation</DialogTitle>
                        <DialogDescription>
                            Confirm that you want to reopen
                            {' '}
                            {operationToReopen ? operationToReopen.operationid : 'this operation'}.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleReopenSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="reopen-comment">Comment (optional)</Label>
                            <Textarea
                                id="reopen-comment"
                                value={reopenForm.data.comment}
                                onChange={(event) => reopenForm.setData('comment', event.target.value)}
                                placeholder="Share context for reopening"
                                rows={3}
                            />
                            {reopenForm.errors.comment && (
                                <p className="text-sm text-destructive">{reopenForm.errors.comment}</p>
                            )}
                        </div>

                        <DialogFooter className="gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => handleReopenDialogChange(false)}
                                disabled={reopenForm.processing}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={reopenForm.processing}>
                                {reopenForm.processing ? 'Reopening...' : 'Reopen Operation'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <DeleteConfirmationDialog
                open={deleteDialogOpen}
                onOpenChange={(open) => {
                    setDeleteDialogOpen(open);
                    if (!open) {
                        setSelectedOperation(null);
                        setIsDeleting(false);
                    }
                }}
                title="Delete Operation"
                description="Are you sure you want to delete this operation? This action cannot be undone."
                itemName={selectedOperation ? selectedOperation.operationid : undefined}
                onConfirm={handleDeleteConfirm}
                isLoading={isDeleting}
            />
        </>
    );
}

