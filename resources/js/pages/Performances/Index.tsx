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
import ListPageLayout from '@/components/layouts/list-page-layout';
import { DeleteConfirmationDialog } from '@/components/delete-confirmation-dialog';
import { usePermissions } from '@/hooks/use-permissions';
import { Link, router } from '@inertiajs/react';
import { type BreadcrumbItem } from '@/types';
import { Plus, Eye, Edit, Trash2, Search, ArrowUpDown, FileDown, Activity, CheckCircle, XCircle } from 'lucide-react';
import ReactPaginate from 'react-paginate';
import * as React from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Performances',
        href: '/performances',
    },
];

interface Performance {
    id: number;
    trip: string;
    FOnumber: string;
    DateDispach?: string;
    LoadType: string;
    satus: string;
    DistanceWCargo?: number | string;
    fuelInBirr?: number | string;
}

interface PerformancesIndexProps {
    performances: {
        data: Performance[];
        current_page: number;
        last_page: number;
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
    const [sortDirection, setSortDirection] = React.useState<'asc' | 'desc'>('asc');
    const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
    const [selectedPerf, setSelectedPerf] = React.useState<Performance | null>(null);
    const [isDeleting, setIsDeleting] = React.useState(false);

    const perfCount = totalCount || performances?.total || 0;
    const currentPage = performances?.current_page || 1;
    const totalPages = performances?.last_page || 1;

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setSearchTerm(value);
        router.get('/performances', { search: value, sort: sortBy, direction: sortDirection }, { preserveState: true });
    };

    const handleSort = (column: string) => {
        const newDirection: 'asc' | 'desc' = sortBy === column && sortDirection === 'asc' ? 'desc' : 'asc';
        setSortBy(column);
        setSortDirection(newDirection);
        router.get('/performances', { search: searchTerm, sort: column, direction: newDirection }, { preserveState: true });
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

    const columns: Array<{ key: keyof Performance | 'status'; label: string }> = [
        { key: 'trip', label: 'Trip' },
        { key: 'FOnumber', label: 'FO Number' },
        { key: 'DateDispach', label: 'Date' },
        { key: 'LoadType', label: 'Load Type' },
        { key: 'satus', label: 'Status' },
        { key: 'DistanceWCargo', label: 'Distance (km)' },
        { key: 'fuelInBirr', label: 'Cost (Birr)' },
    ];

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
                >
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
        </>
    );

    const statsSection = (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Performances</CardTitle>
                    <Activity className="h-4 w-4 text-purple-600" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-purple-600">{perfCount}</div>
                    <p className="text-xs text-muted-foreground">All records</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Active</CardTitle>
                    <CheckCircle className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-green-600">{performances?.data?.filter(p => p.satus === 'active').length || 0}</div>
                    <p className="text-xs text-muted-foreground">Currently active</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Completed</CardTitle>
                    <CheckCircle className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-blue-600">{performances?.data?.filter(p => p.satus === 'completed').length || 0}</div>
                    <p className="text-xs text-muted-foreground">Completed records</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Failed</CardTitle>
                    <XCircle className="h-4 w-4 text-red-600" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-red-600">{performances?.data?.filter(p => p.satus === 'failed').length || 0}</div>
                    <p className="text-xs text-muted-foreground">Failed records</p>
                </CardContent>
            </Card>
        </div>
    );

    const tableHeaderExtras = (
        <div className="relative w-64">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
                placeholder="Search performances..."
                value={searchTerm}
                onChange={handleSearch}
                className="pl-10"
            />
        </div>
    );

    const getStatusBadge = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'completed':
                return <Badge variant="default">Completed</Badge>;
            case 'active':
                return <Badge variant="secondary">Active</Badge>;
            case 'failed':
                return <Badge variant="outline">Failed</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    const tableContent = (
        <Table>
            <TableHeader>
                <TableRow className="sticky top-0 z-50 bg-background border-b">
                    {columns.map(({ key, label }) => renderHeaderCell(key, label))}
                    <TableHead className="text-right bg-background">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {performances.data && performances.data.length > 0 ? (
                    performances.data.map((perf) => (
                        <TableRow key={perf.id} className="hover:bg-muted/50">
                            <TableCell className="font-medium">{perf.trip}</TableCell>
                            <TableCell>{perf.FOnumber}</TableCell>
                            <TableCell>{perf.DateDispach ? new Date(perf.DateDispach).toLocaleDateString() : '-'}</TableCell>
                            <TableCell>
                                <Badge className="flex items-center gap-1 w-fit">
                                    {perf.LoadType.charAt(0).toUpperCase() + perf.LoadType.slice(1)}
                                </Badge>
                            </TableCell>
                            <TableCell>{getStatusBadge(perf.satus)}</TableCell>
                            <TableCell>{perf.DistanceWCargo ? Number(perf.DistanceWCargo).toFixed(2) : '-'}</TableCell>
                            <TableCell>{perf.fuelInBirr ? Number(perf.fuelInBirr).toFixed(2) : '-'}</TableCell>
                            <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                    <Button asChild size="sm" variant="ghost">
                                        <Link href={`/performances/${perf.id}`}>
                                            <Eye className="h-4 w-4" />
                                        </Link>
                                    </Button>
                                    {hasPermission('performances.edit') && (
                                        <Button asChild size="sm" variant="ghost">
                                            <Link href={`/performances/${perf.id}/edit`}>
                                                <Edit className="h-4 w-4" />
                                            </Link>
                                        </Button>
                                    )}
                                    {hasPermission('performances.destroy') && (
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => handleDeleteClick(perf)}
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
    );

    return (
        <>
            <ListPageLayout
                headTitle="Performances"
                title="Performances"
                description={`Manage your fleet performance (${perfCount})`}
                breadcrumbs={breadcrumbs}
                actions={headerActions}
                stats={statsSection}
                tableTitle="Performance Records"
                tableDescription="Manage and track all performance records"
                tableHeaderExtras={tableHeaderExtras}
                pagination={
                    <div className="mt-4 flex items-center justify-between w-full">
                        <div className="text-sm text-muted-foreground">
                            Showing <span className="font-semibold text-foreground">{performances.from}</span> to <span className="font-semibold text-foreground">{performances.to}</span> of <span className="font-semibold text-foreground">{perfCount}</span> performances
                        </div>
                        <div>
                            <ReactPaginate
                                pageCount={totalPages}
                                forcePage={currentPage - 1}
                                onPageChange={({ selected }) => {
                                    router.get('/performances', {
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
                title="Delete Performance"
                description="Are you sure you want to delete this performance? This action cannot be undone."
                itemName={selectedPerf?.trip}
                onConfirm={handleDeleteConfirm}
                isLoading={isDeleting}
            />
        </>
    );
}

