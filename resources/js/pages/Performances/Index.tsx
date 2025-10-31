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
import { Plus, Eye, Edit, Trash2, Search, ArrowUpDown, ChevronLeft, ChevronRight, FileDown, Square, Activity, TrendingUp, CheckCircle, Clock, XCircle } from 'lucide-react';
import { InertiaPagination } from '@/components/ui/pagination';
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

    const handleDeactivateClick = (perf: Performance) => {
        if (confirm(`Are you sure you want to deactivate performance ${perf.trip}?`)) {
            router.post(`/performances/${perf.id}/deactivate`, {}, {
                onSuccess: () => {
                    // Success handled by toast notification
                },
            });
        }
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

    const getStatusBadgeColor = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'completed':
                return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
            case 'in_progress':
            case 'active':
                return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
            case 'pending':
                return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
            case 'cancelled':
            case 'failed':
                return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
            default:
                return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'completed':
                return <CheckCircle className="h-3 w-3" />;
            case 'in_progress':
            case 'active':
                return <Clock className="h-3 w-3" />;
            case 'pending':
                return <Clock className="h-3 w-3" />;
            case 'cancelled':
            case 'failed':
                return <XCircle className="h-3 w-3" />;
            default:
                return null;
        }
    };

    const getLoadTypeBadgeColor = (loadType: string) => {
        switch (loadType?.toLowerCase()) {
            case 'main':
                return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
            case 'return':
                return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
            case 'empty':
                return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
            default:
                return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Performances" />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-hidden rounded-xl p-4">
                {/* Header Section */}
                <Card className="shadow-lg border-0 bg-gradient-to-br from-background to-muted/20">
                    <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 border-b">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-xl shadow-sm">
                                    <Activity className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                                </div>
                                <div>
                                    <CardTitle className="text-2xl font-bold">Performances</CardTitle>
                                    <CardDescription className="text-base mt-1">
                                        Track and manage performance metrics
                                    </CardDescription>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                                    <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
                                    <span className="text-sm font-medium text-purple-700 dark:text-purple-300">
                                        {perfCount} Total
                                    </span>
                                </div>
                                {hasPermission('performances.export') && (
                                    <Button
                                        variant="outline"
                                        onClick={() => {
                                            const params = new URLSearchParams({
                                                search: searchTerm,
                                                sort: sortBy,
                                                direction: sortDirection,
                                            });
                                            window.location.href = `/performances/export/csv?${params.toString()}`;
                                        }}
                                        className="border-purple-300 dark:border-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20"
                                    >
                                        <FileDown className="mr-2 h-4 w-4" />
                                        Export
                                    </Button>
                                )}
                                {hasPermission('performances.create') && (
                                    <Button
                                        asChild
                                        className="bg-purple-600 hover:bg-purple-700 text-white shadow-md hover:shadow-lg transition-all duration-200"
                                    >
                                        <Link href="/performances/create">
                                            <Plus className="mr-2 h-4 w-4" />
                                            Add Performance
                                        </Link>
                                    </Button>
                                )}
                            </div>
                        </div>
                    </CardHeader>
                </Card>

                {/* Table Section */}
                <Card className="flex flex-1 flex-col overflow-hidden shadow-lg border-0 bg-gradient-to-br from-background to-muted/20">
                    <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-b">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                                    <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div>
                                    <CardTitle className="text-xl">Performance Records</CardTitle>
                                    <CardDescription className="text-base">
                                        {perfCount} total record{perfCount !== 1 ? 's' : ''} in system
                                    </CardDescription>
                                </div>
                            </div>
                            <div className="relative w-72">
                                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search by trip, FO number..."
                                    value={searchTerm}
                                    onChange={handleSearch}
                                    className="pl-10 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
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
                                                    <Badge className={`flex items-center gap-1 w-fit ${getLoadTypeBadgeColor(perf.LoadType)}`}>
                                                        {perf.LoadType.charAt(0).toUpperCase() + perf.LoadType.slice(1)}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge className={`flex items-center gap-1 w-fit ${getStatusBadgeColor(perf.satus)}`}>
                                                        {getStatusIcon(perf.satus)}
                                                        {perf.satus.charAt(0).toUpperCase() + perf.satus.slice(1)}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>{perf.DistanceWCargo ? Number(perf.DistanceWCargo).toFixed(2) : '-'}</TableCell>
                                                <TableCell>{perf.fuelInBirr ? Number(perf.fuelInBirr).toFixed(2) : '-'}</TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <Button
                                                            asChild
                                                            size="sm"
                                                            variant="ghost"
                                                            className="hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200"
                                                        >
                                                            <Link href={`/performances/${perf.id}`}>
                                                                <Eye className="h-4 w-4" />
                                                            </Link>
                                                        </Button>
                                                        {hasPermission('performances.edit') && (
                                                            <Button
                                                                asChild
                                                                size="sm"
                                                                variant="ghost"
                                                                className="hover:bg-green-50 dark:hover:bg-green-900/20 hover:text-green-600 dark:hover:text-green-400 transition-colors duration-200"
                                                            >
                                                                <Link href={`/performances/${perf.id}/edit`}>
                                                                    <Edit className="h-4 w-4" />
                                                                </Link>
                                                            </Button>
                                                        )}
                                                        {hasPermission('performances.deactivate') && perf.satus === 'active' && (
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                onClick={() => handleDeactivateClick(perf)}
                                                                className="hover:bg-yellow-50 dark:hover:bg-yellow-900/20 hover:text-yellow-600 dark:hover:text-yellow-400 transition-colors duration-200"
                                                            >
                                                                <Square className="h-4 w-4" />
                                                            </Button>
                                                        )}
                                                        {hasPermission('performances.destroy') && (
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                onClick={() => handleDeleteClick(perf)}
                                                                className="hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 transition-colors duration-200"
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
                                            <TableCell colSpan={8} className="py-12">
                                                <div className="flex flex-col items-center justify-center gap-4">
                                                    <div className="p-4 bg-purple-100 dark:bg-purple-900/30 rounded-full">
                                                        <Activity className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                                                    </div>
                                                    <div className="text-center">
                                                        <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                                                            No performances found
                                                        </p>
                                                        <p className="text-sm text-muted-foreground mt-1">
                                                            {searchTerm ? 'Try adjusting your search criteria' : 'Get started by creating your first performance record'}
                                                        </p>
                                                    </div>
                                                    {hasPermission('performances.create') && !searchTerm && (
                                                        <Button asChild className="mt-2 bg-purple-600 hover:bg-purple-700">
                                                            <Link href="/performances/create">
                                                                <Plus className="mr-2 h-4 w-4" />
                                                                Create Performance
                                                            </Link>
                                                        </Button>
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Pagination */}
                        <InertiaPagination
                          from={performances?.from}
                          to={performances?.to}
                          total={perfCount}
                          links={(performances as any).links as any}
                          currentPage={currentPage}
                          lastPage={totalPages}
                          className="mt-0 p-4 border-t bg-muted/30 flex-shrink-0"
                        />
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

