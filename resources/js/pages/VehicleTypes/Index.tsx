import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import ReactPaginate from 'react-paginate';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import ListPageLayout from '@/components/layouts/list-page-layout';
import { Head, Link, router } from '@inertiajs/react';
import { type BreadcrumbItem } from '@/types';
import {
    Settings,
    Plus,
    Eye,
    Edit,
    Trash2,
    Truck,
    Download,
    Search,
    ChevronLeft,
    ChevronRight
} from 'lucide-react';
import { InertiaPagination } from '@/components/ui/pagination';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { DeleteConfirmationDialog } from '@/components/delete-confirmation-dialog';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Vehicle Types',
        href: '/vehicletypes',
    },
];

interface VehicleType {
    id: number;
    name: string;
    description?: string;
    trucks_count: number;
    created_at: string;
}

interface VehicleTypesIndexProps {
    vehicleTypes: {
        data: VehicleType[];
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
}

export default function VehicleTypesIndex({ vehicleTypes }: VehicleTypesIndexProps) {
    const { toast } = useToast();
    const [search, setSearch] = useState('');
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [selectedVehicleType, setSelectedVehicleType] = useState<VehicleType | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const vehicleTypeData = vehicleTypes?.data || [];
    const totalVehicleTypes = vehicleTypes?.total || 0;
    const currentPage = vehicleTypes?.current_page || 1;
    const perPage = vehicleTypes?.per_page || 15;
    const lastPage = vehicleTypes?.last_page || 1;

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get('/vehicletypes', { search }, { preserveState: true });
    };

    const handleDelete = (vehicleType: VehicleType) => {
        setSelectedVehicleType(vehicleType);
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = () => {
        if (!selectedVehicleType) return;
        setIsDeleting(true);
        router.delete(`/vehicletypes/${selectedVehicleType.id}`, {
            onSuccess: () => {
                setDeleteDialogOpen(false);
                setIsDeleting(false);
                setSelectedVehicleType(null);
                toast({ id: 'vehicle-type-delete-success', title: 'Success', description: 'Vehicle type deleted successfully.', variant: 'default' });
            },
            onError: () => {
                setIsDeleting(false);
                toast({ id: 'vehicle-type-delete-error', title: 'Error', description: 'Failed to delete vehicle type.', variant: 'destructive' });
            },
        });
    };

    const headerActions = (
        <>
            <Button variant="outline" asChild>
                <Link href="/vehicletypes/export/csv">
                    <Download className="h-4 w-4 mr-2" />
                    Export CSV
                </Link>
            </Button>
            <Button asChild>
                <Link href="/vehicletypes/create">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Vehicle Type
                </Link>
            </Button>
        </>
    );

    const statsSection = (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Vehicle Types</CardTitle>
                    <Truck className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-blue-600">{totalVehicleTypes}</div>
                    <p className="text-xs text-muted-foreground">Types in your fleet</p>
                </CardContent>
            </Card>
        </div>
    );

    const tableHeaderExtras = (
        <div className="relative w-64">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
                type="text"
                placeholder="Search vehicle types..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
            />
        </div>
    );

    const tableContent = (
        <Table>
            <TableHeader>
                <TableRow className="sticky top-0 z-50 bg-background border-b">
                    <TableHead>Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Associated Trucks</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right bg-background">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {vehicleTypeData.length === 0 ? (
                    <TableRow>
                        <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                            No vehicle types found.
                        </TableCell>
                    </TableRow>
                ) : (
                    vehicleTypeData.map((vehicleType) => (
                        <TableRow key={vehicleType.id} className="hover:bg-muted/50">
                            <TableCell className="font-medium">{vehicleType.name}</TableCell>
                            <TableCell>{vehicleType.description || '-'}</TableCell>
                            <TableCell>
                                <div className="flex items-center gap-2">
                                    <Truck className="h-4 w-4 text-muted-foreground" />
                                    <span>{vehicleType.trucks_count}</span>
                                </div>
                            </TableCell>
                            <TableCell>
                                {new Date(vehicleType.created_at).toLocaleDateString()}
                            </TableCell>
                            <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                    <Button asChild size="sm" variant="ghost">
                                        <Link href={`/vehicletypes/${vehicleType.id}`}>
                                            <Eye className="h-4 w-4" />
                                        </Link>
                                    </Button>
                                    <Button asChild size="sm" variant="ghost">
                                        <Link href={`/vehicletypes/${vehicleType.id}/edit`}>
                                            <Edit className="h-4 w-4" />
                                        </Link>
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => handleDelete(vehicleType)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </TableCell>
                        </TableRow>
                    ))
                )}
            </TableBody>
        </Table>
    );

    return (
        <ListPageLayout
            headTitle="Vehicle Types"
            title="Vehicle Types"
            description={`Manage vehicle types and categories. Total: ${totalVehicleTypes}`}
            breadcrumbs={breadcrumbs}
            actions={headerActions}
            stats={statsSection}
            tableTitle="Vehicle Types"
            tableDescription="Manage your fleet of vehicle types"
            tableHeaderExtras={tableHeaderExtras}
            pagination={
                <div className="mt-4 flex items-center justify-between w-full">
                    <div className="text-sm text-muted-foreground">
                        Showing <span className="font-semibold text-foreground">{vehicleTypes.from}</span> to <span className="font-semibold text-foreground">{vehicleTypes.to}</span> of <span className="font-semibold text-foreground">{vehicleTypes.total}</span> vehicle types
                    </div>
                    <div>
                        <ReactPaginate
                            pageCount={vehicleTypes.last_page}
                            forcePage={vehicleTypes.current_page - 1}
                            onPageChange={({ selected }) => {
                                router.get('/vehicletypes', {
                                    page: selected + 1,
                                    // Add search/sort params if present
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
            <DeleteConfirmationDialog
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
                title="Delete Vehicle Type"
                description="Are you sure you want to delete this vehicle type? This action cannot be undone."
                itemName={selectedVehicleType?.name || ''}
                onConfirm={handleDeleteConfirm}
                isLoading={isDeleting}
            />
        </ListPageLayout>
    );
}



