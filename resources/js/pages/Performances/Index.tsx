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
import * as React from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Performances', href: '/performances' },
];

interface Performance {
    id: number;
    trip: string;
    LoadType: string;
    FOnumber: string;
    DateDispach: string;
    DistanceWCargo?: number;
    tonkm?: number;
    CargoVolumMT?: number;
    fuelInBirr?: number;
    satus: string;
    created_at?: string;
}

interface PerformancesIndexProps {
    performances: {
        data: Performance[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
        from: number;
        to: number;
    };
    totalCount?: number;
}

export default function PerformancesIndex({ performances, totalCount }: PerformancesIndexProps) {
    const { hasPermission } = usePermissions();
    const [searchTerm, setSearchTerm] = React.useState('');
    const [sortBy, setSortBy] = React.useState('trip');
    const [sortDirection, setSortDirection] = React.useState('asc');
    const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
    const [selectedPerf, setSelectedPerf] = React.useState<Performance | null>(null);
    const [isDeleting, setIsDeleting] = React.useState(false);

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setSearchTerm(value);
        router.get('/performances',
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
        router.get('/performances',
            { search: searchTerm, sort: column, direction: newDirection },
            { preserveState: false }
        );
    };

    const handleDeleteClick = (perf: Performance) => {
        setSelectedPerf(perf);
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = () => {
        if (!selectedPerf) return;
        setIsDeleting(true);
        router.delete(`/performances/${selectedPerf.id}`, {
            onSuccess: () => {
                setDeleteDialogOpen(false);
                setSelectedPerf(null);
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

    const perfCount = totalCount || performances?.total || 0;
    const perPage = performances?.per_page || 15;
    const currentPage = performances?.current_page || 1;
    const totalPages = performances?.last_page || 1;

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
            case 'ongoing': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
            case 'cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
            default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
        }
    };

    const getLoadTypeColor = (type: string) => {
        switch (type) {
            case 'main': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
            case 'return': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
            case 'empty': return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
            default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Performances" />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-hidden rounded-xl p-4">
                {/* Header Section */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Performances</h1>
                        <p className="text-muted-foreground">
                            Manage your fleet of {perfCount} performance{perfCount !== 1 ? 's' : ''}
                        </p>
                    </div>
                    <div className="flex gap-2">
                        {hasPermission('performances.export') && (
                            <Button variant="outline" onClick={() => {
                                const params = new URLSearchParams({
                                    search: searchTerm,
                                    sort: sortBy,
                                    direction: sortDirection,
                                });
                                window.location.href = `/performances/export/csv?${params.toString()}`;
                            }}>
                                <FileDown className="mr-2 h-4 w-4" />
                                Export CSV
                            </Button>
                        )}
                        {hasPermission('performances.create') && (
                            <Button asChild>
                                <Link href="/performances/create">
                                    <Plus className="mr-2 h-4 w-4" />
                                    Add Performance
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
                                <CardTitle>Performance Inventory</CardTitle>
                                <CardDescription>
                                    {perfCount} total performance{perfCount !== 1 ? 's' : ''} in system
                                </CardDescription>
                            </div>
                            <div className="relative w-64">
                                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search performances..."
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
                                            onClick={() => handleSort('trip')}
                                        >
                                            <div className="flex items-center">
                                                Trip <SortIcon column="trip" />
                                            </div>
                                        </TableHead>
                                        <TableHead
                                            className="cursor-pointer select-none hover:bg-muted/70 transition-colors"
                                            onClick={() => handleSort('FOnumber')}
                                        >
                                            <div className="flex items-center">
                                                FO Number <SortIcon column="FOnumber" />
                                            </div>
                                        </TableHead>
                                        <TableHead
                                            className="cursor-pointer select-none hover:bg-muted/70 transition-colors"
                                            onClick={() => handleSort('DateDispach')}
                                        >
                                            <div className="flex items-center">
                                                Date <SortIcon column="DateDispach" />
                                            </div>
                                        </TableHead>
                                        <TableHead>Load Type</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Distance (km)</TableHead>
                                        <TableHead>Cost (Birr)</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {performances.data && performances.data.length > 0 ? (
                                        performances.data.map((perf) => (
                                            <TableRow key={perf.id} className="hover:bg-muted/50">
                                                <TableCell className="font-medium">{perf.trip}</TableCell>
                                                <TableCell>{perf.FOnumber}</TableCell>
                                                <TableCell>{new Date(perf.DateDispach).toLocaleDateString()}</TableCell>
                                                <TableCell>
                                                    <Badge className={getLoadTypeColor(perf.LoadType)}>
                                                        {perf.LoadType.charAt(0).toUpperCase() + perf.LoadType.slice(1)}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge className={getStatusColor(perf.satus)}>
                                                        {perf.satus.charAt(0).toUpperCase() + perf.satus.slice(1)}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>{perf.DistanceWCargo?.toFixed(2) || '-'}</TableCell>
                                                <TableCell>{perf.fuelInBirr?.toFixed(2) || '-'}</TableCell>
                                                <TableCell className="text-right space-x-2">
                                                    {hasPermission('performances.show') && (
                                                        <Link href={`/performances/${perf.id}`}>
                                                            <Button variant="ghost" size="icon">
                                                                <Eye className="h-4 w-4" />
                                                            </Button>
                                                        </Link>
                                                    )}
                                                    {hasPermission('performances.edit') && (
                                                        <Link href={`/performances/${perf.id}/edit`}>
                                                            <Button variant="ghost" size="icon">
                                                                <Edit className="h-4 w-4" />
                                                            </Button>
                                                        </Link>
                                                    )}
                                                    {hasPermission('performances.destroy') && (
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => handleDeleteClick(perf)}
                                                        >
                                                            <Trash2 className="h-4 w-4 text-destructive" />
                                                        </Button>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={8} className="py-8 text-center text-muted-foreground">
                                                No performances found.
                                                {hasPermission('performances.create') && (
                                                    <Link href="/performances/create" className="ml-1 text-primary underline">
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
                                    Showing {performances?.from || 1} to {performances?.to || perfCount} of {perfCount} performances
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        disabled={currentPage === 1}
                                        onClick={() => {
                                            const page = currentPage - 1;
                                            router.get('/performances', {
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
                                            router.get('/performances', {
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
                title="Delete Performance"
                description="Are you sure you want to delete this performance? This action cannot be undone."
                itemName={selectedPerf?.trip}
                onConfirm={handleDeleteConfirm}
                isLoading={isDeleting}
            />
        </AppLayout>
    );
}

