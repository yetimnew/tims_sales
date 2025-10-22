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
import AppLayout from '@/layouts/app-layout';
import { DeleteConfirmationDialog } from '@/components/delete-confirmation-dialog';
import { usePermissions } from '@/hooks/use-permissions';
import { Head, Link, router } from '@inertiajs/react';
import { type BreadcrumbItem } from '@/types';
import { Plus, Eye, Edit, Trash2, Search, ArrowUpDown, ChevronLeft, ChevronRight, FileDown, Square } from 'lucide-react';
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
            { preserveState: false }
        );
    };

  const handleSort = (column: string) => {
        let newDirection: 'asc' | 'desc' = 'asc';
        if (sortBy === column && sortDirection === 'asc') {
            newDirection = 'desc';
        }
        setSortBy(column);
        setSortDirection(newDirection);
        router.get(
            '/customers',
            { search: searchTerm, sort: column, direction: newDirection },
            { preserveState: false }
        );
    };

    const SortIcon = ({ column }: { column: string }) => {
        if (sortBy !== column) {
            return <ArrowUpDown className="ml-2 h-4 w-4 text-muted-foreground" />;
        }
        return (
            <ArrowUpDown
                className={`ml-2 h-4 w-4 ${sortDirection === 'asc' ? 'rotate-180' : ''}`}
            />
        );
    };

    const handleDeleteClick = (customer: CustomerData) => {
        setSelectedCustomer(customer);
        setDeleteDialogOpen(true);
    };

    const handleDeactivateClick = (customer: CustomerData) => {
        if (confirm(`Are you sure you want to deactivate customer ${customer.name}?`)) {
            router.post(`/customers/${customer.id}/deactivate`, {}, {
                onSuccess: () => {
                    // Success handled by toast notification
                },
            });
        }
    };

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
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Customers" />
      <div className="flex h-full flex-1 flex-col gap-6 overflow-hidden rounded-xl p-4">
                {/* Header Section */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Customers</h1>
                        <p className="text-muted-foreground">
                            Manage your fleet of {customerCount} customer{customerCount !== 1 ? 's' : ''}
                        </p>
          </div>
                    <div className="flex gap-2">
                        {hasPermission('customers.export') && (
                            <Button variant="outline" onClick={() => {
                                const params = new URLSearchParams({
                                    search: searchTerm,
                                    sort: sortBy,
                                    direction: sortDirection,
                                });
                                window.location.href = `/customers/export/csv?${params.toString()}`;
                            }}>
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
                    </div>
        </div>

                {/* Table Section */}
        <Card className="flex flex-1 flex-col overflow-hidden">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle>Customer Inventory</CardTitle>
                                <CardDescription>
                                    {customerCount} total customer{customerCount !== 1 ? 's' : ''} in system
                                </CardDescription>
                            </div>
            <div className="relative w-64">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search customers..."
                                    value={searchTerm}
                                    onChange={handleSearch}
                className="pl-10"
              />
                            </div>
            </div>
          </CardHeader>
                    <CardContent className="flex-1 overflow-auto">
              <div className="rounded-lg border">
                <Table>
                                <TableHeader>
                                    <TableRow className="bg-muted/50">
                      <TableHead
                                            className="cursor-pointer select-none hover:bg-muted/70 transition-colors"
                        onClick={() => handleSort('name')}
                      >
                                            <div className="flex items-center">
                                                Name <SortIcon column="name" />
                                            </div>
                      </TableHead>
                                        <TableHead>Contact Person</TableHead>
                      <TableHead>Phone</TableHead>
                                        <TableHead>Email</TableHead>
                      <TableHead
                                            className="cursor-pointer select-none hover:bg-muted/70 transition-colors"
                                            onClick={() => handleSort('status')}
                      >
                                            <div className="flex items-center">
                                                Status <SortIcon column="status" />
                                            </div>
                      </TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                                    {customers?.data && customers.data.length > 0 ? (
                                        customers.data.map((customer) => (
                                            <TableRow key={customer.id} className="hover:bg-muted/50">
                                                <TableCell className="font-medium">
                                                    {customer.name}
                                                </TableCell>
                        <TableCell className="text-muted-foreground">
                                                    {customer.contact_person || 'N/A'}
                                                </TableCell>
                                                <TableCell className="text-muted-foreground text-sm">
                                                    {customer.phone || '—'}
                                                </TableCell>
                                                <TableCell className="text-muted-foreground text-sm">
                                                    {customer.email || '—'}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge
                                                        variant={customer.status === 'active' ? 'default' : 'secondary'}
                                                    >
                                                        {customer.status}
                                                    </Badge>
                        </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex justify-end gap-1">
                          {hasPermission('customers.show') && (
                                                            <Link href={`/customers/${customer.id}`}>
                                                                <Button size="sm" variant="ghost">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </Link>
                          )}
                          {hasPermission('customers.edit') && (
                                                            <Link href={`/customers/${customer.id}/edit`}>
                                                                <Button size="sm" variant="ghost">
                                                                    <Edit className="h-4 w-4" />
                              </Button>
                            </Link>
                          )}
                          {hasPermission('customers.deactivate') && customer.status === 'active' && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeactivateClick(customer)}
                            >
                              <Square className="h-4 w-4" />
                            </Button>
                          )}
                          {hasPermission('customers.destroy') && (
                            <Button
                                                                size="sm"
                              variant="ghost"
                                                                onClick={() => handleDeleteClick(customer)}
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
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="mt-6 flex items-center justify-between">
                                <div className="text-sm text-muted-foreground">
                                    Showing {customers?.from || 1} to {customers?.to || customerCount} of {customerCount} customers
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        disabled={currentPage === 1}
                                        onClick={() => {
                                            const page = currentPage - 1;
                                            router.get('/customers', {
                                                page,
                                                search: searchTerm,
                                                sort: sortBy,
                                                direction: sortDirection,
                                            });
                                        }}
                                    >
                                        <ChevronLeft className="mr-1 h-4 w-4" />
                                        Previous
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        disabled={currentPage === totalPages}
                                        onClick={() => {
                                            const page = currentPage + 1;
                                            router.get('/customers', {
                                                page,
                                                search: searchTerm,
                                                sort: sortBy,
                                                direction: sortDirection,
                                            });
                                        }}
                                    >
                                        Next
                                        <ChevronRight className="ml-1 h-4 w-4" />
                                    </Button>
                                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

            {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
        title="Delete Customer"
        description="Are you sure you want to delete this customer? This action cannot be undone."
                itemName={selectedCustomer?.name}
                onConfirm={handleDeleteConfirm}
                isLoading={isDeleting}
            />
        </AppLayout>
    );
}
