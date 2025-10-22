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
    { title: 'Operations', href: '/operations' },
];

interface Operation {
    id: number;
    operationid: string;
    customer?: { id: number; name: string };
    description?: string;
    status: string;
    volume?: number;
    km?: number;
    startdate?: string;
    enddate?: string;
    closed?: boolean;
    created_at?: string;
}

interface OperationsIndexProps {
    operations: {
        data: Operation[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
        from: number;
        to: number;
    };
    totalCount?: number;
}

export default function OperationsIndex({ operations, totalCount }: OperationsIndexProps) {
    const { hasPermission } = usePermissions();
    const [searchTerm, setSearchTerm] = React.useState('');
    const [sortBy, setSortBy] = React.useState('operationid');
    const [sortDirection, setSortDirection] = React.useState('asc');
    const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
    const [selectedOp, setSelectedOp] = React.useState<Operation | null>(null);
    const [isDeleting, setIsDeleting] = React.useState(false);

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setSearchTerm(value);
        router.get('/operations',
            { search: value, sort: sortBy, direction: sortDirection },
            { preserveState: false }
        );
    };

    const handleSort = (column: string) => {
        let newDirection = 'asc';
        if (sortBy === column && sortDirection === 'asc') {
            newDirection = 'desc';
        }
        setSortBy(column);
        setSortDirection(newDirection);
        router.get('/operations',
            { search: searchTerm, sort: column, direction: newDirection },
            { preserveState: false }
        );
    };

    const handleDeleteClick = (op: Operation) => {
        setSelectedOp(op);
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = () => {
        if (!selectedOp) return;
        setIsDeleting(true);
        router.delete(`/operations/${selectedOp.id}`, {
            onSuccess: () => {
                setDeleteDialogOpen(false);
                setSelectedOp(null);
                setIsDeleting(false);
            },
            onError: () => {
                setIsDeleting(false);
            },
        });
    };

    const handleDeactivateClick = (op: Operation) => {
        if (confirm(`Are you sure you want to deactivate operation ${op.operationid}?`)) {
            router.post(`/operations/${op.id}/deactivate`, {}, {
                onSuccess: () => {
                    // Success handled by toast notification
                },
            });
        }
    };

    const SortIcon = ({ column }: { column: string }) => {
        if (sortBy !== column) {
            return <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />;
        }
        return (
            <ArrowUpDown
                className={`ml-2 h-4 w-4 transition-transform ${
                    sortDirection === 'desc' ? 'rotate-180' : ''
                }`}
            />
        );
    };

    const opCount = totalCount || operations?.total || 0;
    const currentPage = operations?.current_page || 1;
    const totalPages = operations?.last_page || 1;


    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Operations" />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-hidden rounded-xl p-4">
                {/* Header Section */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Operations</h1>
                        <p className="text-muted-foreground">
                            Manage your fleet of {opCount} operation{opCount !== 1 ? 's' : ''}
                        </p>
                    </div>
                    <div className="flex gap-2">
                        {hasPermission('operations.export') && (
                            <Button variant="outline" onClick={() => {
                                const params = new URLSearchParams({
                                    search: searchTerm,
                                    sort: sortBy,
                                    direction: sortDirection,
                                });
                                window.location.href = `/operations/export/csv?${params.toString()}`;
                            }}>
                                <FileDown className="mr-2 h-4 w-4" />
                                Export CSV
                            </Button>
                        )}
                        {hasPermission('operations.create') && (
                            <Button asChild>
                                <Link href="/operations/create">
                                    <Plus className="mr-2 h-4 w-4" />
                                    Add Operation
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
                                <CardTitle>Operation Inventory</CardTitle>
                                <CardDescription>
                                    {opCount} total operation{opCount !== 1 ? 's' : ''} in system
                                </CardDescription>
                            </div>
                            <div className="relative w-64">
                                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search operations..."
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
                                            onClick={() => handleSort('operationid')}
                                        >
                                            <div className="flex items-center">
                                                Operation ID <SortIcon column="operationid" />
                                            </div>
                                        </TableHead>
                                        <TableHead>Customer</TableHead>
                                        <TableHead
                                            className="cursor-pointer select-none hover:bg-muted/70 transition-colors"
                                            onClick={() => handleSort('status')}
                                        >
                                            <div className="flex items-center">
                                                Status <SortIcon column="status" />
                                            </div>
                                        </TableHead>
                                        <TableHead>Start Date</TableHead>
                                        <TableHead>Volume (MT)</TableHead>
                                        <TableHead>Distance (KM)</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {operations.data && operations.data.length > 0 ? (
                                        operations.data.map((op) => (
                                            <TableRow key={op.id} className="hover:bg-muted/50">
                                                <TableCell className="font-medium">{op.operationid}</TableCell>
                                                <TableCell>{op.customer?.name || '-'}</TableCell>
                                                <TableCell>
                                                    <Badge
                                                        variant={op.status === 'active' ? 'default' : 'secondary'}
                                                    >
                                                        {op.status.charAt(0).toUpperCase() + op.status.slice(1)}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>{op.startdate ? new Date(op.startdate).toLocaleDateString() : '-'}</TableCell>
                                                <TableCell>{op.volume ? Number(op.volume).toFixed(2) : '-'}</TableCell>
                                                <TableCell>{op.km ? Number(op.km).toFixed(2) : '-'}</TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <Button asChild size="sm" variant="ghost">
                                                            <Link href={`/operations/${op.id}`}>
                                                                <Eye className="h-4 w-4" />
                                                            </Link>
                                                        </Button>
                                                        {hasPermission('operations.edit') && (
                                                            <Button asChild size="sm" variant="ghost">
                                                                <Link href={`/operations/${op.id}/edit`}>
                                                                    <Edit className="h-4 w-4" />
                                                                </Link>
                                                            </Button>
                                                        )}
                                                        {hasPermission('operations.deactivate') && op.status === 'active' && (
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                onClick={() => handleDeactivateClick(op)}
                                                            >
                                                                <Square className="h-4 w-4" />
                                                            </Button>
                                                        )}
                                                        {hasPermission('operations.destroy') && (
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                onClick={() => handleDeleteClick(op)}
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
                                            <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                                                No operations found.
                                                {hasPermission('operations.create') && (
                                                    <Link href="/operations/create" className="ml-1 text-primary underline">
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
                                    Showing {operations?.from || 1} to {operations?.to || opCount} of {opCount} operations
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        disabled={currentPage === 1}
                                        onClick={() => {
                                            const page = currentPage - 1;
                                            router.get('/operations', {
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
                                            router.get('/operations', {
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
                title="Delete Operation"
                description="Are you sure you want to delete this operation? This action cannot be undone."
                itemName={selectedOp?.operationid}
                onConfirm={handleDeleteConfirm}
                isLoading={isDeleting}
            />
        </AppLayout>
    );
}
