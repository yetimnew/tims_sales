import React from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { Plus, Eye, Edit, Search, ArrowUpDown, Trash2, FileDown, Fuel, DollarSign, Calendar, TrendingUp, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { InertiaPagination } from '@/components/ui/pagination';
import { usePermissions } from '@/hooks/use-permissions';
import { DeleteConfirmationDialog } from '@/components/delete-confirmation-dialog';
import { toast } from '@/hooks/use-toast';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Fuel Records',
        href: '/fuel-records',
    },
];

interface FuelRecord {
    id: number;
    fuel_date: string;
    fuel_quantity_liters: number;
    fuel_price_per_liter: number;
    total_cost: number;
    fuel_station: string;
    fuel_type: string;
    odometer_reading?: number;
    receipt_number?: string;
    notes?: string;
    driverTruck?: {
        id: number;
        truck?: {
            id: number;
            plate: string;
        };
        driver?: {
            id: number;
            name: string;
        };
    };
    user?: {
        id: number;
        name: string;
    };
    created_at: string;
    updated_at: string;
}

interface FuelRecordsIndexProps {
    fuelRecords?: {
        data: FuelRecord[];
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
    statistics?: {
        total_records: number;
        total_cost: number;
        total_quantity: number;
        avg_price_per_liter: number;
        diesel_count: number;
        petrol_count: number;
    };
    filters?: {
        search: string;
        sort: string;
        direction: string;
    };
}

export default function FuelRecordsIndex({ fuelRecords, statistics, filters }: FuelRecordsIndexProps) {
    const { hasPermission } = usePermissions();

    const defaultFuelRecords = {
        data: [],
        current_page: 1,
        last_page: 1,
        per_page: 15,
        total: 0,
        from: 0,
        to: 0,
        links: [],
    };

    const defaultStatistics = {
        total_records: 0,
        total_cost: 0,
        total_quantity: 0,
        avg_price_per_liter: 0,
        diesel_count: 0,
        petrol_count: 0,
    };

    const defaultFilters = {
        search: '',
        sort: 'fuel_date',
        direction: 'desc',
    };

    const safeFuelRecords = fuelRecords || defaultFuelRecords;
    const safeStatistics = statistics || defaultStatistics;
    const safeFilters = filters || defaultFilters;

    const [searchTerm, setSearchTerm] = React.useState(safeFilters.search || '');
    const [sortColumn, setSortColumn] = React.useState<string | null>(null);
    const [sortDirection, setSortDirection] = React.useState<'asc' | 'desc'>('desc');
    const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
    const [selectedFuelRecord, setSelectedFuelRecord] = React.useState<FuelRecord | null>(null);
    const [isDeleting, setIsDeleting] = React.useState(false);

    const fuelRecordData = safeFuelRecords?.data || [];
    const totalFuelRecords = safeFuelRecords?.total || 0;
    const currentPage = safeFuelRecords?.current_page || 1;
    const lastPage = safeFuelRecords?.last_page || 1;

    // Handle search
    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setSearchTerm(value);
        router.get('/fuel-records', { search: value, page: 1 }, { preserveState: true });
    };

    // Handle sorting
    const handleSort = (column: string) => {
        const newDirection = sortColumn === column && sortDirection === 'asc' ? 'desc' : 'asc';
        setSortColumn(column);
        setSortDirection(newDirection);
        router.get('/fuel-records', {
            search: searchTerm,
            sort: column,
            direction: newDirection,
            page: currentPage
        }, { preserveState: true });
    };

    const SortableHead = ({ column, children }: { column: string; children: React.ReactNode }) => {
        const isActive = sortColumn === column;
        return (
            <TableHead
                className="cursor-pointer select-none hover:bg-muted/70 transition-colors"
                onClick={() => handleSort(column)}
            >
                <div className="flex items-center">
                    {children}
                    <ArrowUpDown className={`ml-2 h-4 w-4 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                </div>
            </TableHead>
        );
    };

    const handleDeleteClick = (fuelRecord: FuelRecord) => {
        setSelectedFuelRecord(fuelRecord);
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = () => {
        if (!selectedFuelRecord) return;

        setIsDeleting(true);
        router.delete(`/fuel-records/${selectedFuelRecord.id}`, {
            onSuccess: () => {
                setDeleteDialogOpen(false);
                setSelectedFuelRecord(null);
                setIsDeleting(false);
            },
            onError: (errors) => {
                setIsDeleting(false);
                if (errors && typeof errors === 'object') {
                    const errorMessages = Object.values(errors).flat().join('\n');
                    if (errorMessages) {
                        toast({
                            title: '❌ Delete Failed',
                            description: errorMessages,
                            variant: 'destructive',
                        });
                    }
                }
            },
        });
    };

    const getFuelTypeBadgeVariant = (fuelType: string) => {
        switch (fuelType.toLowerCase()) {
            case 'diesel': return 'default';
            case 'petrol': return 'secondary';
            default: return 'outline';
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Fuel Records" />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-hidden rounded-xl p-4">
                {/* Header Section */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">Fuel Records</h1>
                        <p className="text-muted-foreground mt-2">
                            Manage your fuel consumption records of {totalFuelRecords} entries
                        </p>
                    </div>
                    <div className="flex gap-2">
                        {hasPermission('fuel-records.view') && totalFuelRecords > 0 && (
                            <Button variant="outline" onClick={() => {
                                const params = new URLSearchParams({
                                    search: searchTerm,
                                    sort: sortColumn || 'fuel_date',
                                    direction: sortDirection,
                                });
                                window.location.href = `/fuel-records/export/csv?${params.toString()}`;
                            }}>
                                <FileDown className="mr-2 h-4 w-4" />
                                Export CSV
                            </Button>
                        )}
                        {hasPermission('fuel-records.create') && (
                            <Button asChild>
                                <Link href="/fuel-records/create">
                                    <Plus className="mr-2 h-4 w-4" />
                                    Add Fuel Record
                                </Link>
                            </Button>
                        )}
                    </div>
                </div>

                {/* Statistics Dashboard */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Records</CardTitle>
                            <Activity className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{safeStatistics.total_records.toLocaleString()}</div>
                            <p className="text-xs text-muted-foreground">Fuel entries logged</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{safeStatistics.total_cost.toLocaleString()} ETB</div>
                            <p className="text-xs text-muted-foreground">Total fuel expenditure</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Quantity</CardTitle>
                            <Fuel className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{safeStatistics.total_quantity.toLocaleString()} L</div>
                            <p className="text-xs text-muted-foreground">Liters consumed</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Avg Price/Liter</CardTitle>
                            <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{safeStatistics.avg_price_per_liter.toFixed(2)} ETB</div>
                            <p className="text-xs text-muted-foreground">Average fuel price</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Diesel</CardTitle>
                            <Fuel className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{safeStatistics.diesel_count}</div>
                            <p className="text-xs text-muted-foreground">Diesel fuel records</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Petrol</CardTitle>
                            <Fuel className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{safeStatistics.petrol_count}</div>
                            <p className="text-xs text-muted-foreground">Petrol fuel records</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Table Section */}
                <Card className="flex flex-1 flex-col overflow-hidden">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle>Fuel Records Directory</CardTitle>
                                <CardDescription>
                                    Complete list of all fuel consumption records in your system
                                </CardDescription>
                            </div>
                            <div className="relative w-64">
                                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search fuel records..."
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
                                        <SortableHead column="fuel_date">Date</SortableHead>
                                        <TableHead>Truck</TableHead>
                                        <TableHead>Driver</TableHead>
                                        <TableHead>Station</TableHead>
                                        <SortableHead column="fuel_type">Type</SortableHead>
                                        <SortableHead column="fuel_quantity_liters">Quantity</SortableHead>
                                        <SortableHead column="fuel_price_per_liter">Price/Liter</SortableHead>
                                        <SortableHead column="total_cost">Total Cost</SortableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {fuelRecordData.length > 0 ? (
                                        fuelRecordData.map((fuelRecord) => (
                                            <TableRow key={fuelRecord.id} className="hover:bg-muted/50">
                                                <TableCell className="font-medium">
                                                    <div className="flex items-center gap-2">
                                                        <Calendar className="h-4 w-4 text-muted-foreground" />
                                                        {new Date(fuelRecord.fuel_date).toLocaleDateString()}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="font-medium">{fuelRecord.driverTruck?.truck?.plate}</div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="font-medium">{fuelRecord.driverTruck?.driver?.name}</div>
                                                </TableCell>
                                                <TableCell className="text-muted-foreground">
                                                    {fuelRecord.fuel_station}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant={getFuelTypeBadgeVariant(fuelRecord.fuel_type)}>
                                                        {fuelRecord.fuel_type}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-1">
                                                        <Fuel className="h-4 w-4 text-muted-foreground" />
                                                        <span className="font-medium">{fuelRecord.fuel_quantity_liters} L</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-1">
                                                        <DollarSign className="h-4 w-4 text-green-600" />
                                                        <span className="font-medium">{fuelRecord.fuel_price_per_liter.toFixed(2)}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-1">
                                                        <DollarSign className="h-4 w-4 text-green-600" />
                                                        <span className="font-medium">{fuelRecord.total_cost.toLocaleString()}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex justify-end gap-2">
                                                        {hasPermission('fuel-records.show') && (
                                                            <Button asChild size="sm" variant="ghost">
                                                                <Link href={`/fuel-records/${fuelRecord.id}`}>
                                                                    <Eye className="h-4 w-4" />
                                                                </Link>
                                                            </Button>
                                                        )}
                                                        {hasPermission('fuel-records.edit') && (
                                                            <Button asChild size="sm" variant="ghost">
                                                                <Link href={`/fuel-records/${fuelRecord.id}/edit`}>
                                                                    <Edit className="h-4 w-4" />
                                                                </Link>
                                                            </Button>
                                                        )}
                                                        {hasPermission('fuel-records.destroy') && (
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                onClick={() => handleDeleteClick(fuelRecord)}
                                                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
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
                                            <TableCell colSpan={9} className="py-8 text-center text-muted-foreground">
                                                No fuel records found.
                                                {hasPermission('fuel-records.create') && (
                                                    <Link href="/fuel-records/create" className="ml-1 text-primary underline">
                                                        Create one
                                                    </Link>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                        {totalFuelRecords > 0 && (
                            <div className="border-t">
                                <InertiaPagination
                                    links={safeFuelRecords.links}
                                    currentPage={currentPage}
                                    lastPage={lastPage}
                                    from={safeFuelRecords.from}
                                    to={safeFuelRecords.to}
                                    total={safeFuelRecords.total}
                                />
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Delete Confirmation Dialog */}
                <DeleteConfirmationDialog
                    open={deleteDialogOpen}
                    onOpenChange={setDeleteDialogOpen}
                    title="Delete Fuel Record"
                    description="Are you sure you want to delete this fuel record? This action cannot be undone."
                    itemName={`${selectedFuelRecord?.fuel_station} - ${selectedFuelRecord?.total_cost?.toLocaleString()} ETB`}
                    onConfirm={handleDeleteConfirm}
                    isLoading={isDeleting}
                />
            </div>
        </AppLayout>
    );
}
