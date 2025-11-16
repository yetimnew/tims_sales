import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import ListPageLayout from '@/components/layouts/list-page-layout';
import { DeleteConfirmationDialog } from '@/components/delete-confirmation-dialog';
import { usePermissions } from '@/hooks/use-permissions';
import { Link, router } from '@inertiajs/react';
import { type BreadcrumbItem } from '@/types';
import { toast } from '@/hooks/use-toast';
import { Plus, Eye, Edit, Trash2, Search, ArrowUpDown, FileDown, Users, CheckCircle, XCircle, Briefcase } from 'lucide-react';
import { InertiaPagination } from '@/components/ui/pagination';
import * as React from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Customers',
        href: '/customers',
    },
];

interface CustomerData {
    id: number;
    name: string;
    contact_person?: string;
    phone?: string;
    email?: string;
    address?: string;
    status: string;
    created_at?: string;
    operations_count?: number;
}

interface CustomersIndexProps {
    customers: {
        data: CustomerData[];
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

const perPageFallback = [10, 15, 25, 50];

const sortableColumns = new Set(['name', 'status', 'operations_count', 'created_at']);

const columns: Array<{ key: keyof CustomerData | 'status' | 'actions' | 'operations_count' | 'created_at' | 'name'; label: string; sortable?: boolean }> = [
    { key: 'name', label: 'Customer', sortable: true },
    { key: 'contact_person', label: 'Relationship Owner' },
    { key: 'phone', label: 'Phone' },
    { key: 'email', label: 'Email' },
    { key: 'operations_count', label: 'Operations', sortable: true },
    { key: 'status', label: 'Status', sortable: true },
    { key: 'created_at', label: 'Created', sortable: true },
];

export default function CustomersIndex({ customers, metrics, filters, statusOptions, perPageOptions }: CustomersIndexProps) {
    const { hasPermission } = usePermissions();
    const [searchTerm, setSearchTerm] = React.useState(filters?.search ?? '');
    const [selectedStatus, setSelectedStatus] = React.useState(filters?.status ?? 'all');
    const [sortBy, setSortBy] = React.useState(filters?.sort ?? 'name');
    const [sortDirection, setSortDirection] = React.useState<'asc' | 'desc'>(filters?.direction ?? 'asc');
    const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
    const [selectedCustomer, setSelectedCustomer] = React.useState<CustomerData | null>(null);
    const [isDeleting, setIsDeleting] = React.useState(false);
    const availablePerPageOptions = React.useMemo(() => (perPageOptions?.length ? perPageOptions : perPageFallback), [perPageOptions]);
    const resolvedPerPage = React.useMemo(() => {
        const candidate = filters?.per_page;
        if (typeof candidate === 'number' && availablePerPageOptions.includes(candidate)) {
            return candidate;
        }

        return availablePerPageOptions[0] ?? 15;
    }, [filters?.per_page, availablePerPageOptions]);
    const [perPage, setPerPage] = React.useState<string>(() => String(resolvedPerPage));

    React.useEffect(() => {
        setPerPage(String(resolvedPerPage));
    }, [resolvedPerPage]);

    React.useEffect(() => {
        if (selectedCustomer && !deleteDialogOpen) {
            setSelectedCustomer(null);
        }
    }, [deleteDialogOpen, selectedCustomer]);

    const customerCount = metrics?.total ?? customers.total;
    const currentPage = customers.current_page;
    const lastPage = customers.last_page;

    const statusFilterOptions = React.useMemo(() => {
        const base = statusOptions?.length ? statusOptions : [
            { label: 'Active', value: 'active' },
            { label: 'Inactive', value: 'inactive' },
        ];

        return base;
    }, [statusOptions]);

    const handleNavigate = React.useCallback((overrides: Partial<{ search?: string; status?: string; sort?: string; direction?: 'asc' | 'desc'; page?: number; per_page?: number }>) => {
        const params: Record<string, string | number | undefined> = {};

        if (Object.prototype.hasOwnProperty.call(overrides, 'search')) {
            params.search = overrides.search;
        } else {
            params.search = searchTerm.trim() ? searchTerm.trim() : undefined;
        }

        if (Object.prototype.hasOwnProperty.call(overrides, 'status')) {
            params.status = overrides.status;
        } else {
            params.status = selectedStatus !== 'all' ? selectedStatus : undefined;
        }

        if (Object.prototype.hasOwnProperty.call(overrides, 'sort')) {
            params.sort = overrides.sort;
        } else {
            params.sort = sortBy;
        }

        if (Object.prototype.hasOwnProperty.call(overrides, 'direction')) {
            params.direction = overrides.direction;
        } else {
            params.direction = sortDirection;
        }

        if (Object.prototype.hasOwnProperty.call(overrides, 'page')) {
            params.page = overrides.page;
        }

        if (Object.prototype.hasOwnProperty.call(overrides, 'per_page')) {
            params.per_page = overrides.per_page;
        } else {
            params.per_page = Number(perPage);
        }

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

        router.get('/customers', params, { preserveState: true, replace: false });
    }, [searchTerm, selectedStatus, sortBy, sortDirection, perPage]);

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
        const numeric = Number(value);
        handleNavigate({ per_page: Number.isNaN(numeric) ? undefined : numeric, page: 1 });
    };

    const handleSort = (column: string) => {
        if (!sortableColumns.has(column)) {
            return;
        }

        const newDirection: 'asc' | 'desc' = sortBy === column && sortDirection === 'asc' ? 'desc' : 'asc';
        setSortBy(column);
        setSortDirection(newDirection);
        handleNavigate({ sort: column, direction: newDirection });
    };

    const renderHeaderCell = (column: string, label: string, sortable?: boolean) => {
        if (!sortable) {
            return (
                <TableHead key={column} className="sticky top-0 z-20 bg-background">
                    {label}
                </TableHead>
            );
        }

        return (
            <TableHead
                key={column}
                className="sticky top-0 z-20 cursor-pointer select-none bg-background transition-colors hover:bg-muted/70"
                onClick={() => handleSort(column)}
            >
                <div className="flex items-center gap-2">
                    {label}
                    <ArrowUpDown
                        size={14}
                        className={sortBy === column ? 'text-primary' : 'text-muted-foreground opacity-50'}
                    />
                </div>
            </TableHead>
        );
    };

    const formatDate = (value?: string | null) => {
        if (!value) {
            return '—';
        }

        try {
            return new Date(value).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
            });
        } catch (error) {
            console.error('Failed to format date', error);
            return value;
        }
    };

    const headerActions = (
        <>
            {hasPermission('customers.export') && (
                <Button
                    variant="outline"
                    onClick={() => {
                        const params = new URLSearchParams();
                        if (searchTerm.trim()) {
                            params.set('search', searchTerm.trim());
                        }
                        if (selectedStatus !== 'all') {
                            params.set('status', selectedStatus);
                        }
                        params.set('sort', sortBy);
                        params.set('direction', sortDirection);
                        if (perPage) {
                            params.set('per_page', perPage);
                        }

                        const queryString = params.toString();
                        window.location.href = queryString
                            ? `/customers/export/csv?${queryString}`
                            : '/customers/export/csv';
                    }}
                >
                    <FileDown className="mr-2 h-4 w-4" />
                    Export CSV
                </Button>
            )}
            {hasPermission('customers.create') && (
                <Button asChild>
                    <Link href="/customers/create">
                        <Plus className="mr-2 h-4 w-4" />
                        Add Customer
                    </Link>
                </Button>
            )}
        </>
    );

    const statsCards = [
        {
            title: 'Total Customers',
            value: customerCount,
            description: 'Full commercial portfolio',
            icon: <Users className="h-3.5 w-3.5 text-blue-600" />,
            valueClassName: 'text-blue-600',
        },
        {
            title: 'Active Accounts',
            value: metrics?.active ?? 0,
            description: 'Currently engaged',
            icon: <CheckCircle className="h-3.5 w-3.5 text-emerald-600" />,
            valueClassName: 'text-emerald-600',
        },
        {
            title: 'Inactive Accounts',
            value: metrics?.inactive ?? 0,
            description: 'On pause or churned',
            icon: <XCircle className="h-3.5 w-3.5 text-rose-600" />,
            valueClassName: 'text-rose-600',
        },
        {
            title: 'With Operations',
            value: metrics?.with_operations ?? 0,
            description: 'Accounts driving volume',
            icon: <Briefcase className="h-3.5 w-3.5 text-indigo-600" />,
            valueClassName: 'text-indigo-600',
        },
    ];

    const statsSection = (
        <div className="hidden gap-2 md:grid md:grid-cols-2 xl:grid-cols-4">
            {statsCards.map((card) => (
                <Card key={card.title} className="gap-2 border border-slate-200 py-2 shadow-sm dark:border-slate-800">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 px-2 pb-1">
                        <CardTitle className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                            {card.title}
                        </CardTitle>
                        {card.icon}
                    </CardHeader>
                    <CardContent className="px-2 pb-2 pt-0">
                        <div className={`text-sm font-semibold sm:text-base ${card.valueClassName}`}>{card.value}</div>
                        <p className="text-[11px] text-muted-foreground">{card.description}</p>
                    </CardContent>
                </Card>
            ))}
        </div>
    );

    const tableHeaderExtras = (
        <div className="flex flex-wrap items-center gap-2">
            <div className="relative w-[260px] max-w-full">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search customers..."
                    value={searchTerm}
                    onChange={(event) => handleSearchChange(event.target.value)}
                    className="pl-10"
                />
            </div>
            <Select value={selectedStatus} onValueChange={handleStatusChange}>
                <SelectTrigger className="w-[160px]">
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
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <span className="hidden sm:inline">Rows</span>
                <Select value={perPage} onValueChange={handlePerPageChange}>
                    <SelectTrigger className="w-[120px]">
                        <SelectValue placeholder="Per page" />
                    </SelectTrigger>
                    <SelectContent>
                        {availablePerPageOptions.map((option) => (
                            <SelectItem key={option} value={String(option)}>
                                {option} / page
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
        </div>
    );

    const tableContent = (
        <Table>
            <TableHeader className="[&_tr]:sticky [&_tr]:top-0 [&_tr]:z-20 [&_tr]:bg-background [&_tr]:shadow-sm">
                <TableRow className="border-b bg-background">
                    {columns.map(({ key, label, sortable }) => renderHeaderCell(String(key), label, sortable))}
                    <TableHead className="sticky top-0 z-20 bg-background text-center">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {customers?.data && customers.data.length > 0 ? (
                    customers.data.map((customer) => (
                        <TableRow key={customer.id} className="hover:bg-muted/50">
                            <TableCell className="font-medium text-foreground">{customer.name}</TableCell>
                            <TableCell className="text-muted-foreground text-sm">{customer.contact_person || 'N/A'}</TableCell>
                            <TableCell className="text-muted-foreground text-sm">{customer.phone || '—'}</TableCell>
                            <TableCell className="text-muted-foreground text-sm truncate max-w-[180px]">{customer.email || '—'}</TableCell>
                            <TableCell>
                                <Badge variant="outline" className="border-slate-200 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-200">
                                    {customer.operations_count ?? 0}
                                </Badge>
                            </TableCell>
                            <TableCell>
                                <Badge
                                    className={`flex w-fit items-center gap-1 ${
                                        customer.status === 'active'
                                            ? 'border-emerald-200 bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:border-emerald-900/50 dark:bg-emerald-900/30 dark:text-emerald-200'
                                            : 'border-rose-200 bg-rose-100 text-rose-700 hover:bg-rose-200 dark:border-rose-900/50 dark:bg-rose-900/30 dark:text-rose-200'
                                    }`}
                                >
                                    {customer.status === 'active' && <CheckCircle className="h-3 w-3" />}
                                    {customer.status === 'inactive' && <XCircle className="h-3 w-3" />}
                                    {customer.status.charAt(0).toUpperCase() + customer.status.slice(1)}
                                </Badge>
                            </TableCell>
                            <TableCell className="text-muted-foreground text-sm">
                                {formatDate(customer.created_at)}
                            </TableCell>
                            <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                    {hasPermission('customers.show') && (
                                        <Button asChild size="sm" variant="ghost">
                                            <Link href={`/customers/${customer.id}`}>
                                                <Eye className="h-4 w-4" />
                                            </Link>
                                        </Button>
                                    )}
                                    {hasPermission('customers.edit') && (
                                        <Button asChild size="sm" variant="ghost">
                                            <Link href={`/customers/${customer.id}/edit`}>
                                                <Edit className="h-4 w-4" />
                                            </Link>
                                        </Button>
                                    )}
                                    {hasPermission('customers.destroy') && (
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => {
                                                setSelectedCustomer(customer);
                                                setDeleteDialogOpen(true);
                                            }}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    )}
                                </div>
                            </TableCell>
                        </TableRow>
                    ))
                ) : (
                    <TableRow>
                        <TableCell colSpan={columns.length + 1} className="py-8 text-center text-muted-foreground">
                            No customers found.
                            {hasPermission('customers.create') && (
                                <Link href="/customers/create" className="ml-1 text-primary underline">
                                    Create one
                                </Link>
                            )}
                        </TableCell>
                    </TableRow>
                )}
            </TableBody>
        </Table>
    );

    const handleDeleteConfirm = async () => {
        if (!selectedCustomer) return;
        setIsDeleting(true);
        router.delete(`/customers/${selectedCustomer.id}`, {
            onSuccess: () => {
                setDeleteDialogOpen(false);
                setSelectedCustomer(null);
                setIsDeleting(false);
            },
            onError: (errorBag) => {
                setIsDeleting(false);
                if (errorBag && typeof errorBag === 'object') {
                    const messages = Object.values(errorBag).flat().join(', ');
                    if (messages) {
                        toast({
                            title: 'Delete failed',
                            description: messages,
                            variant: 'destructive',
                        });
                    }
                }
            },
        });
    };

    const buildPageHref = React.useCallback((page: number) => {
        const params = new URLSearchParams();
        if (searchTerm.trim()) {
            params.set('search', searchTerm.trim());
        }
        if (selectedStatus !== 'all') {
            params.set('status', selectedStatus);
        }
        if (sortBy) {
            params.set('sort', sortBy);
        }
        if (sortDirection) {
            params.set('direction', sortDirection);
        }
        if (perPage) {
            params.set('per_page', perPage);
        }
        params.set('page', String(page));

        const queryString = params.toString();
        return queryString ? `/customers?${queryString}` : `/customers?page=${page}`;
    }, [searchTerm, selectedStatus, sortBy, sortDirection, perPage]);

    return (
        <>
            <ListPageLayout
                headTitle="Customers"
                title="Customers"
                description={`Manage ${customerCount} customer${customerCount !== 1 ? 's' : ''} and monitor relationship health.`}
                breadcrumbs={breadcrumbs}
                actions={headerActions}
                stats={statsSection}
                tableTitle="Customer Portfolio"
                tableDescription="Track commercial accounts, their status, and operational engagement."
                tableHeaderExtras={tableHeaderExtras}
                pagination={
                    <InertiaPagination
                        from={customers.from}
                        to={customers.to}
                        total={customers.total}
                        links={customers.links}
                        currentPage={currentPage}
                        lastPage={lastPage}
                        buildHref={buildPageHref}
                    />
                }
            >
                {tableContent}
            </ListPageLayout>

            <DeleteConfirmationDialog
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
                title="Delete Customer"
                description="Are you sure you want to delete this customer? This action cannot be undone."
                itemName={selectedCustomer?.name}
                onConfirm={handleDeleteConfirm}
                isLoading={isDeleting}
            />
        </>
    );
}
