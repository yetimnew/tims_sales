import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import ListPageLayout from '@/components/layouts/list-page-layout';
import { DeleteConfirmationDialog } from '@/components/delete-confirmation-dialog';
import { usePermissions } from '@/hooks/use-permissions';
import { Link, router } from '@inertiajs/react';
import { type BreadcrumbItem } from '@/types';
import { Plus, Eye, Edit, Trash2, Search, ArrowUpDown, FileDown, Square, CheckCircle, XCircle } from 'lucide-react';
import ReactPaginate from 'react-paginate';
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
    };
    totalCount?: number;
}

export default function CustomersIndex({ customers, totalCount }: CustomersIndexProps) {
    const { hasPermission } = usePermissions();
    const [searchTerm, setSearchTerm] = React.useState('');
    const [sortBy, setSortBy] = React.useState('name');
    const [sortDirection, setSortDirection] = React.useState<'asc' | 'desc'>('asc');
    const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
    const [selectedCustomer, setSelectedCustomer] = React.useState<CustomerData | null>(null);
    const [isDeleting, setIsDeleting] = React.useState(false);

    const customerCount = totalCount ?? customers.total;
    const currentPage = customers.current_page;
    const totalPages = customers.last_page;

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setSearchTerm(value);
        router.get(
            '/customers',
            { search: value, sort: sortBy, direction: sortDirection },
            { preserveState: true, replace: false }
        );
    };

    const handleSort = (column: string) => {
        const newDirection: 'asc' | 'desc' = sortBy === column && sortDirection === 'asc' ? 'desc' : 'asc';
        setSortBy(column);
        setSortDirection(newDirection);
        router.get(
            '/customers',
            { search: searchTerm, sort: column, direction: newDirection },
            { preserveState: true, replace: false }
        );
    };

    const renderHeaderCell = (column: string, label: string) => (
        <TableHead
            key={column}
            className="cursor-pointer select-none hover:bg-muted/70 transition-colors bg-background"
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

    const headerActions = (
        <>
            {hasPermission('customers.export') && (
                <Button
                    variant="outline"
                    onClick={() => {
                        const params = new URLSearchParams({
                            search: searchTerm,
                            sort: sortBy,
                            direction: sortDirection,
                        });
                        window.location.href = `/customers/export/csv?${params.toString()}`;
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

    const statsSection = (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
                    <Square className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-blue-600">{customerCount}</div>
                    <p className="text-xs text-muted-foreground">All customers</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Active</CardTitle>
                    <CheckCircle className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-green-600">{customers?.data?.filter(c => c.status === 'active').length || 0}</div>
                    <p className="text-xs text-muted-foreground">Currently active</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Inactive</CardTitle>
                    <XCircle className="h-4 w-4 text-red-600" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-red-600">{customers?.data?.filter(c => c.status === 'inactive').length || 0}</div>
                    <p className="text-xs text-muted-foreground">Inactive customers</p>
                </CardContent>
            </Card>
        </div>
    );

    const tableHeaderExtras = (
        <div className="relative w-64">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
                placeholder="Search customers..."
                value={searchTerm}
                onChange={handleSearch}
                className="pl-10"
            />
        </div>
    );

    const tableContent = (
        <Table>
            <TableHeader>
                <TableRow className="sticky top-0 z-50 bg-background border-b">
                    {renderHeaderCell('name', 'Name')}
                    <TableHead>Contact Person</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Email</TableHead>
                    {renderHeaderCell('status', 'Status')}
                    <TableHead className="text-right bg-background">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {customers?.data && customers.data.length > 0 ? (
                    customers.data.map((customer) => (
                        <TableRow key={customer.id} className="hover:bg-muted/50">
                            <TableCell className="font-medium">{customer.name}</TableCell>
                            <TableCell className="text-muted-foreground">{customer.contact_person || 'N/A'}</TableCell>
                            <TableCell className="text-muted-foreground text-sm">{customer.phone || '—'}</TableCell>
                            <TableCell className="text-muted-foreground text-sm">{customer.email || '—'}</TableCell>
                            <TableCell>
                                <Badge variant={customer.status === 'active' ? 'default' : 'secondary'}>
                                    {customer.status}
                                </Badge>
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
                                            onClick={() => setSelectedCustomer(customer) || setDeleteDialogOpen(true)}
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
                        <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
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
            onError: () => {
                setIsDeleting(false);
            },
        });
    };

    return (
        <>
            <ListPageLayout
                headTitle="Customers"
                title="Customers"
                description={`Manage your fleet of ${customerCount} customer${customerCount !== 1 ? 's' : ''}`}
                breadcrumbs={breadcrumbs}
                actions={headerActions}
                stats={statsSection}
                tableTitle="Customer Inventory"
                tableDescription="Manage and track all customers"
                tableHeaderExtras={tableHeaderExtras}
                pagination={
                    <div className="mt-4 flex items-center justify-between w-full">
                        <div className="text-sm text-muted-foreground">
                            Showing <span className="font-semibold text-foreground">{customers.from}</span> to <span className="font-semibold text-foreground">{customers.to}</span> of <span className="font-semibold text-foreground">{customerCount}</span> customers
                        </div>
                        <div>
                            <ReactPaginate
                                pageCount={totalPages}
                                forcePage={currentPage - 1}
                                onPageChange={({ selected }) => {
                                    router.get('/customers', {
                                        page: selected + 1,
                                        search: searchTerm,
                                        sort: sortBy,
                                        direction: sortDirection,
                                    }, { preserveState: true });
                                }}
                                marginPagesDisplayed={2}
                                pageRangeDisplayed={5}
                                containerClassName="flex gap-2"
                                pageClassName="px-3 py-1 rounded border text-sm bg-background text-muted-foreground hover:bg-muted"
                                activeClassName="bg-primary text-white"
                                previousClassName="px-3 py-1 rounded border text-sm"
                                nextClassName="px-3 py-1 rounded border text-sm"
                                breakClassName="px-3 py-1 rounded border text-sm"
                                disabledClassName="pointer-events-none opacity-50"
                                previousLabel={"<"}
                                nextLabel={">"}
                            />
                        </div>
                    </div>
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
