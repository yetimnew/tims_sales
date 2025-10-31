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
import { Plus, Eye, Edit, Trash2, Search, ArrowUpDown, ChevronLeft, ChevronRight, FileDown } from 'lucide-react';
import { InertiaPagination } from '@/components/ui/pagination';
import * as React from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Woredas',
        href: '/woredas',
    },
];

interface WoredaData {
    id: number;
    name: string;
    zone?: {
        name: string;
        region?: {
            name: string;
        };
    };
    created_at?: string;
}

interface WoredasIndexProps {
    woredas: {
        data: WoredaData[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
        from: number;
        to: number;
        links?: {
            first?: string;
            last?: string;
            prev?: string;
            next?: string;
        };
    };
    totalCount?: number;
}

export default function WoredasIndex({ woredas, totalCount }: WoredasIndexProps) {
    const { hasPermission } = usePermissions();
    const [searchTerm, setSearchTerm] = React.useState('');
    const [sortBy, setSortBy] = React.useState('name');
    const [sortDirection, setSortDirection] = React.useState('asc');
    const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
    const [selectedWoreda, setSelectedWoreda] = React.useState<WoredaData | null>(null);
    const [isDeleting, setIsDeleting] = React.useState(false);

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setSearchTerm(value);

        router.get('/woredas',
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

        router.get('/woredas',
            { search: searchTerm, sort: column, direction: newDirection },
            { preserveState: false }
        );
    };

    const handleDeleteClick = (woreda: WoredaData) => {
        setSelectedWoreda(woreda);
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = () => {
        if (!selectedWoreda) return;

        setIsDeleting(true);
        router.delete(`/woredas/${selectedWoreda.id}`, {
            onSuccess: () => {
                setDeleteDialogOpen(false);
                setSelectedWoreda(null);
                setIsDeleting(false);
            },
            onError: () => {
                setIsDeleting(false);
            },
        });
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

    const woredaCount = totalCount || woredas?.total || 0;
    const perPage = woredas?.per_page || 15;
    const currentPage = woredas?.current_page || 1;
    const totalPages = woredas?.last_page || 1;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Woredas" />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-hidden rounded-xl p-4">
                {/* Header Section */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">Woredas</h1>
                        <p className="text-muted-foreground mt-2">
                            Manage your {woredaCount} woreda{woredaCount !== 1 ? 's' : ''}
                        </p>
                    </div>
                    <div className="flex gap-2">
                        {hasPermission('woredas.export') && (
                            <Button
                                variant="outline"
                                onClick={() => router.get('/woredas/export', { search: searchTerm, sort: sortBy, direction: sortDirection })}
                            >
                                <FileDown className="mr-2 h-4 w-4" />
                                Export CSV
                            </Button>
                        )}
                        {hasPermission('woredas.create') && (
                            <Link href="/woredas/create">
                                <Button>
                                    <Plus className="mr-2 h-4 w-4" />
                                    Add Woreda
                                </Button>
                            </Link>
                        )}
                    </div>
                </div>

                {/* Table Section */}
                <Card className="flex flex-1 flex-col overflow-hidden">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle>Woreda Inventory</CardTitle>
                                <CardDescription>
                                    {woredaCount} total woreda{woredaCount !== 1 ? 's' : ''} in system
                                </CardDescription>
                            </div>
                            <div className="relative w-64">
                                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search woredas..."
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
                                            onClick={() => handleSort('id')}
                                        >
                                            <div className="flex items-center">
                                                ID <SortIcon column="id" />
                                            </div>
                                        </TableHead>
                                        <TableHead
                                            className="cursor-pointer select-none hover:bg-muted/70 transition-colors"
                                            onClick={() => handleSort('name')}
                                        >
                                            <div className="flex items-center">
                                                Name <SortIcon column="name" />
                                            </div>
                                        </TableHead>
                                        <TableHead
                                            className="cursor-pointer select-none hover:bg-muted/70 transition-colors"
                                            onClick={() => handleSort('zone_id')}
                                        >
                                            <div className="flex items-center">
                                                Zone <SortIcon column="zone_id" />
                                            </div>
                                        </TableHead>
                                        <TableHead>Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {woredas.data.length > 0 ? (
                                        woredas.data.map((woreda) => (
                                            <TableRow key={woreda.id}>
                                                <TableCell className="font-medium">{woreda.id}</TableCell>
                                                <TableCell className="font-medium">{woreda.name}</TableCell>
                                                <TableCell>
                                                    <div>
                                                        <div className="font-medium">{woreda.zone?.name || 'N/A'}</div>
                                                        {woreda.zone?.region && (
                                                            <div className="text-sm text-muted-foreground">
                                                                {woreda.zone.region.name}
                                                            </div>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center space-x-2">
                                                        {hasPermission('woredas.show') && (
                                                            <Link href={`/woredas/${woreda.id}`}>
                                                                <Button size="sm" variant="ghost">
                                                                    <Eye className="h-4 w-4" />
                                                                </Button>
                                                            </Link>
                                                        )}
                                                        {hasPermission('woredas.edit') && (
                                                            <Link href={`/woredas/${woreda.id}/edit`}>
                                                                <Button size="sm" variant="ghost">
                                                                    <Edit className="h-4 w-4" />
                                                                </Button>
                                                            </Link>
                                                        )}
                                                        {hasPermission('woredas.destroy') && (
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                onClick={() => handleDeleteClick(woreda)}
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
                                            <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                                                No woredas found.
                                                {hasPermission('woredas.create') && (
                                                    <Link href="/woredas/create" className="ml-1 text-primary underline">
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
                        <InertiaPagination
                          from={woredas.from}
                          to={woredas.to}
                          total={woredaCount}
                          links={(woredas as any).links as any}
                          currentPage={currentPage}
                          lastPage={totalPages}
                        />
                    </CardContent>
                </Card>
            </div>

            {/* Delete Confirmation Dialog */}
            <DeleteConfirmationDialog
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
                title="Delete Woreda"
                description="Are you sure you want to delete this woreda? This action cannot be undone."
                itemName={selectedWoreda?.name}
                onConfirm={handleDeleteConfirm}
                isLoading={isDeleting}
            />
        </AppLayout>
    );
}
