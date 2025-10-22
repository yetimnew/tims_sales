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
import { Plus, Eye, Edit, Trash2, Search, ArrowUpDown, ChevronLeft, ChevronRight, FileDown, Truck, CheckCircle, Wrench, XCircle, DollarSign, Activity } from 'lucide-react';
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

export default function TrucksIndex({ trucks, totalCount }: TrucksIndexProps) {
    const { hasPermission } = usePermissions();
    const [searchTerm, setSearchTerm] = React.useState('');
    const [sortBy, setSortBy] = React.useState('plate');
    const [sortDirection, setSortDirection] = React.useState('asc');
    const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
    const [selectedTruck, setSelectedTruck] = React.useState<TruckData | null>(null);
    const [isDeleting, setIsDeleting] = React.useState(false);

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setSearchTerm(value);

        router.get('/trucks',
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

        router.get('/trucks',
            { search: searchTerm, sort: column, direction: newDirection },
            { preserveState: false }
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

    const truckCount = totalCount || trucks?.total || 0;

    const perPage = trucks?.per_page || 15;
    const currentPage = trucks?.current_page || 1;
    const totalPages = trucks?.last_page || 1;

    // Calculate stats for dashboard cards
    const activeCount = trucks?.data?.filter(truck => truck.status === 'active').length || 0;
    const maintenanceCount = trucks?.data?.filter(truck => truck.status === 'maintenance').length || 0;
    const inactiveCount = trucks?.data?.filter(truck => truck.status === 'inactive').length || 0;
    const totalValue = trucks?.data?.reduce((sum, truck) => sum + (truck.purchasePrice || 0), 0) || 0;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Trucks" />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-hidden rounded-xl p-4">
                {/* Header Section */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Trucks</h1>
                        <p className="text-muted-foreground">
                            Manage your fleet of {truckCount} truck{truckCount !== 1 ? 's' : ''}
                        </p>
                    </div>
                    <div className="flex gap-2">
                        {hasPermission('trucks.export') && (
                            <Button variant="outline" onClick={() => {
                                const params = new URLSearchParams({
                                    search: searchTerm,
                                    sort: sortBy,
                                    direction: sortDirection,
                                });
                                window.location.href = `/trucks/export/csv?${params.toString()}`;
                            }}>
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
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center">
                                <Truck className="h-8 w-8 text-blue-600" />
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-muted-foreground">Total Trucks</p>
                                    <p className="text-2xl font-bold">{truckCount}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    
                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center">
                                <CheckCircle className="h-8 w-8 text-green-600" />
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-muted-foreground">Active</p>
                                    <p className="text-2xl font-bold">{activeCount}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    
                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center">
                                <Wrench className="h-8 w-8 text-yellow-600" />
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-muted-foreground">Maintenance</p>
                                    <p className="text-2xl font-bold">{maintenanceCount}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    
                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center">
                                <DollarSign className="h-8 w-8 text-purple-600" />
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-muted-foreground">Total Value</p>
                                    <p className="text-2xl font-bold">${totalValue.toLocaleString()}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Table Section */}
                <Card className="flex flex-1 flex-col overflow-hidden">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle>Truck Inventory</CardTitle>
                                <CardDescription>
                                    {truckCount} total truck{truckCount !== 1 ? 's' : ''} in system
                                </CardDescription>
                            </div>
                            <div className="relative w-64">
                                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search trucks..."
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
                                            onClick={() => handleSort('plate')}
                                        >
                                            <div className="flex items-center">
                                                Plate <SortIcon column="plate" />
                                            </div>
                                        </TableHead>
                                        <TableHead
                                            className="cursor-pointer select-none hover:bg-muted/70 transition-colors"
                                            onClick={() => handleSort('vehicleType')}
                                        >
                                            <div className="flex items-center">
                                                Vehicle Type <SortIcon column="vehicleType" />
                                            </div>
                                        </TableHead>
                                        <TableHead>Chassis</TableHead>
                                        <TableHead>Engine</TableHead>
                                        <TableHead
                                            className="cursor-pointer select-none hover:bg-muted/70 transition-colors"
                                            onClick={() => handleSort('serviceIntervalKM')}
                                        >
                                            <div className="flex items-center">
                                                Service (KM) <SortIcon column="serviceIntervalKM" />
                                            </div>
                                        </TableHead>
                                        <TableHead
                                            className="cursor-pointer select-none hover:bg-muted/70 transition-colors"
                                            onClick={() => handleSort('purchasePrice')}
                                        >
                                            <div className="flex items-center">
                                                Price <SortIcon column="purchasePrice" />
                                            </div>
                                        </TableHead>
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
                                                    {truck.serviceIntervalKM?.toLocaleString() || '—'} km
                                                </TableCell>
                                                <TableCell className="font-medium">
                                                    ${Number(truck.purchasePrice || 0).toLocaleString('en-US', {
                                                        minimumFractionDigits: 2,
                                                        maximumFractionDigits: 2,
                                                    })}
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
                                            <TableCell colSpan={8} className="py-12">
                                                <div className="flex flex-col items-center justify-center">
                                                    <Truck className="h-12 w-12 text-muted-foreground mb-4" />
                                                    <h3 className="text-lg font-semibold mb-2">No trucks found</h3>
                                                    <p className="text-muted-foreground text-center mb-4">
                                                        Get started by adding your first truck to the fleet
                                                    </p>
                                                    {hasPermission('trucks.create') && (
                                                        <Button asChild>
                                                            <Link href="/trucks/create">
                                                                <Plus className="mr-2 h-4 w-4" />
                                                                Add First Truck
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
                        {totalPages > 1 && (
                            <div className="mt-6 flex items-center justify-between">
                                <div className="text-sm text-muted-foreground">
                                    Showing {trucks?.from || 1} to {trucks?.to || truckCount} of {truckCount} trucks
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        disabled={currentPage === 1}
                                        onClick={() => {
                                            const page = currentPage - 1;
                                            router.get('/trucks', {
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
                                            router.get('/trucks', {
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
                title="Delete Truck"
                description="Are you sure you want to delete this truck? This action cannot be undone."
                itemName={selectedTruck?.plate}
                onConfirm={handleDeleteConfirm}
                isLoading={isDeleting}
            />
        </AppLayout>
    );
}
