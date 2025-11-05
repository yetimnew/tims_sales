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
import { toast } from '@/hooks/use-toast';
import { type BreadcrumbItem } from '@/types';
import { Plus, Eye, Edit, Trash2, Search, ArrowUpDown, FileDown, Truck, CheckCircle, Wrench, XCircle, DollarSign } from 'lucide-react';
import { InertiaPagination } from '@/components/ui/pagination';
import ReactPaginate from 'react-paginate';
import * as React from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Trucks',
        href: '/trucks',
    },
];

interface TruckData {
    id: number;
    plate: string;
    vehicleType: {
        id: number;
        name: string;
    } | null;
    chasisNumber?: string;
    engineNumber?: string;
    serviceIntervalKM?: number;
    purchasePrice?: number;
    status: string;
    created_at?: string;
}

interface TrucksIndexProps {
    trucks: {
        data: TruckData[];
        current_page: number;
        last_page: number;
        total: number;
        from: number;
        to: number;
        links: Array<{
            url: string | null;
            label: string;
            active: boolean;
        }>;
    };
    totalCount?: number;
}

const columns: Array<{ key: string; label: string }> = [
    { key: 'plate', label: 'Plate' },
    { key: 'vehicleType', label: 'Vehicle Type' },
    { key: 'chasisNumber', label: 'Chassis' },
    { key: 'engineNumber', label: 'Engine' },
    { key: 'serviceIntervalKM', label: 'Service (KM)' },
    { key: 'purchasePrice', label: 'Price' },
    { key: 'status', label: 'Status' },
];

export default function TrucksIndex({ trucks, totalCount }: TrucksIndexProps) {
    const { hasPermission } = usePermissions();
    const [searchTerm, setSearchTerm] = React.useState('');
    const [sortBy, setSortBy] = React.useState('plate');
    const [sortDirection, setSortDirection] = React.useState<'asc' | 'desc'>('asc');
    const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
    const [selectedTruck, setSelectedTruck] = React.useState<TruckData | null>(null);
    const [isDeleting, setIsDeleting] = React.useState(false);

    const truckCount = totalCount || trucks?.total || 0;
    const currentPage = trucks?.current_page || 1;
    const totalPages = trucks?.last_page || 1;

    const activeCount = trucks?.data?.filter(truck => truck.status === 'active').length || 0;
    const maintenanceCount = trucks?.data?.filter(truck => truck.status === 'maintenance').length || 0;
    const totalValue = trucks?.data?.reduce((sum, truck) => {
        const price = parseFloat(String(truck.purchasePrice ?? 0));
        return sum + price;
    }, 0) || 0;

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setSearchTerm(value);

        router.get(
            '/trucks',
            { search: value, sort: sortBy, direction: sortDirection },
            { preserveState: true, replace: false },
        );
    };

    const handleSort = (column: string) => {
        const newDirection: 'asc' | 'desc' = sortBy === column && sortDirection === 'asc' ? 'desc' : 'asc';

        setSortBy(column);
        setSortDirection(newDirection);

        router.get(
            '/trucks',
            { search: searchTerm, sort: column, direction: newDirection },
            { preserveState: true, replace: false },
        );
    };

    const handleDeleteClick = (truck: TruckData) => {
        setSelectedTruck(truck);
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = () => {
        if (!selectedTruck) return;

        setIsDeleting(true);
        router.delete(`/trucks/${selectedTruck.id}`, {
            onSuccess: () => {
                setDeleteDialogOpen(false);
                setSelectedTruck(null);
                setIsDeleting(false);
            },
            onError: (errors) => {
                setIsDeleting(false);
                if (errors && typeof errors === 'object') {
                    const errorMessages = Object.values(errors).flat().join('\n');
                    if (errorMessages) {
                        toast({
                            id: 'delete-failed',
                            title: '❌ Delete Failed',
                            description: errorMessages,
                            variant: 'destructive',
                        });
                    }
                }
            },
        });
    };

    const headerActions = (
        <>
            {hasPermission('trucks.export') && (
                <Button
                    variant="outline"
                    onClick={() => {
                        const params = new URLSearchParams({
                            search: searchTerm,
                            sort: sortBy,
                            direction: sortDirection,
                        });
                        window.location.href = `/trucks/export/csv?${params.toString()}`;
                    }}
                >
                    <FileDown className="mr-2 h-4 w-4" />
                    Export CSV
                </Button>
            )}
            {hasPermission('trucks.create') && (
                <Button asChild>
                    <Link href="/trucks/create">
                        <Plus className="mr-2 h-4 w-4" />
                        Add Truck
                    </Link>
                </Button>
            )}
        </>
    );

    const statsSection = (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Trucks</CardTitle>
                    <Truck className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-blue-600">{truckCount}</div>
                    <p className="text-xs text-muted-foreground">All vehicles</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Active</CardTitle>
                    <CheckCircle className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-green-600">{activeCount}</div>
                    <p className="text-xs text-muted-foreground">Operational</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Maintenance</CardTitle>
                    <Wrench className="h-4 w-4 text-yellow-600" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-yellow-600">{maintenanceCount}</div>
                    <p className="text-xs text-muted-foreground">Under repair</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Fleet Value</CardTitle>
                    <DollarSign className="h-4 w-4 text-purple-600" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-purple-600">${(totalValue / 1000000).toFixed(1)}M</div>
                    <p className="text-xs text-muted-foreground">Total fleet value</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Inactive</CardTitle>
                    <XCircle className="h-4 w-4 text-red-600" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-red-600">{trucks?.data?.filter(truck => truck.status === 'inactive').length || 0}</div>
                    <p className="text-xs text-muted-foreground">Inactive trucks</p>
                </CardContent>
            </Card>
        </div>
    );

    const tableHeaderExtras = (
        <div className="relative w-64">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
                placeholder="Search trucks..."
                value={searchTerm}
                onChange={handleSearch}
                className="pl-10"
            />
        </div>
    );

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

    const tableContent = (
        <Table>
            <TableHeader>
                <TableRow className="sticky top-0 z-50 bg-background border-b">
                    {columns.map(({ key, label }) => renderHeaderCell(key, label))}
                    <TableHead className="text-right bg-background">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {trucks?.data && trucks.data.length > 0 ? (
                    trucks.data.map((truck) => (
                        <TableRow key={truck.id} className="hover:bg-muted/50">
                            <TableCell className="font-medium">
                                {truck.plate}
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                                {truck.vehicleType?.name || 'N/A'}
                            </TableCell>
                            <TableCell className="text-muted-foreground text-sm">
                                {truck.chasisNumber || '—'}
                            </TableCell>
                            <TableCell className="text-muted-foreground text-sm">
                                {truck.engineNumber || '—'}
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                                {truck.serviceIntervalKM
                                    ? `${truck.serviceIntervalKM.toLocaleString()} km`
                                    : '—'
                                }
                            </TableCell>
                            <TableCell className="font-medium">
                                {truck.purchasePrice
                                    ? new Intl.NumberFormat('en-US', {
                                        style: 'currency',
                                        currency: 'USD',
                                        maximumFractionDigits: 0,
                                    }).format(Number(truck.purchasePrice))
                                    : '—'
                                }
                            </TableCell>
                            <TableCell>
                                <Badge
                                    className={`flex items-center gap-1 w-fit ${
                                        truck.status === 'active'
                                            ? 'bg-green-100 text-green-800 border-green-200 hover:bg-green-200'
                                            : truck.status === 'maintenance'
                                            ? 'bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-200'
                                            : 'bg-red-100 text-red-800 border-red-200 hover:bg-red-200'
                                    }`}
                                >
                                    {truck.status === 'active' && <CheckCircle className="h-3 w-3" />}
                                    {truck.status === 'maintenance' && <Wrench className="h-3 w-3" />}
                                    {truck.status === 'inactive' && <XCircle className="h-3 w-3" />}
                                    {truck.status.charAt(0).toUpperCase() + truck.status.slice(1)}
                                </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                    <Button asChild size="sm" variant="ghost">
                                        <Link href={`/trucks/${truck.id}`}>
                                            <Eye className="h-4 w-4" />
                                        </Link>
                                    </Button>
                                    {hasPermission('trucks.edit') && (
                                        <Button asChild size="sm" variant="ghost">
                                            <Link href={`/trucks/${truck.id}/edit`}>
                                                <Edit className="h-4 w-4" />
                                            </Link>
                                        </Button>
                                    )}
                                    {hasPermission('trucks.destroy') && (
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => handleDeleteClick(truck)}
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
                            No trucks found.
                            {hasPermission('trucks.create') && (
                                <Link href="/trucks/create" className="ml-1 text-primary underline">
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
                headTitle="Trucks"
                title="Trucks"
                description={`Manage your fleet of ${truckCount} truck${truckCount !== 1 ? 's' : ''}`}
                breadcrumbs={breadcrumbs}
                actions={headerActions}
                stats={statsSection}
                tableTitle="Truck Inventory"
                tableDescription="Manage and track all vehicles in your fleet"
                tableHeaderExtras={tableHeaderExtras}
                pagination={
                    <div className="mt-4 flex items-center justify-between w-full">
                        <div className="text-sm text-muted-foreground">
                            Showing <span className="font-semibold text-foreground">{trucks.from}</span> to <span className="font-semibold text-foreground">{trucks.to}</span> of <span className="font-semibold text-foreground">{truckCount}</span> trucks
                        </div>
                        <div>
                            <ReactPaginate
                                pageCount={totalPages}
                                forcePage={currentPage - 1}
                                onPageChange={({ selected }) => {
                                    router.get('/trucks', {
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
                title="Delete Truck"
                description="Are you sure you want to delete this truck? This action cannot be undone."
                itemName={selectedTruck?.plate}
                onConfirm={handleDeleteConfirm}
                isLoading={isDeleting}
            />
        </>
    );
}
