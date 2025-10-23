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
                toast({ title: 'Success', description: 'Vehicle type deleted successfully.', variant: 'default' });
            },
            onError: () => {
                setIsDeleting(false);
                toast({ title: 'Error', description: 'Failed to delete vehicle type.', variant: 'destructive' });
            },
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Vehicle Types" />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-hidden rounded-xl p-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">Vehicle Types</h1>
                        <p className="text-muted-foreground mt-2">
                            Manage vehicle types and categories
                        </p>
                    </div>
                    <div className="flex gap-2">
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
                    </div>
                </div>

                {/* Search */}
                <Card>
                    <CardContent className="pt-6">
                        <form onSubmit={handleSearch} className="flex gap-2">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    type="text"
                                    placeholder="Search vehicle types..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                            <Button type="submit" variant="outline">
                                Search
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {/* Vehicle Types Table */}
                <Card>
                    <CardHeader>
                        <CardTitle>Vehicle Types</CardTitle>
                        <CardDescription>
                            Manage your fleet of {totalVehicleTypes} vehicle types
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Description</TableHead>
                                        <TableHead>Associated Trucks</TableHead>
                                        <TableHead>Created</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {vehicleTypeData.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center text-muted-foreground">
                                                No vehicle types found.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        vehicleTypeData.map((vehicleType) => (
                                            <TableRow key={vehicleType.id}>
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
                                                        <Button asChild size="sm" variant="outline">
                                                            <Link href={`/vehicletypes/${vehicleType.id}`}>
                                                                <Eye className="h-4 w-4" />
                                                            </Link>
                                                        </Button>
                                                        <Button asChild size="sm" variant="outline">
                                                            <Link href={`/vehicletypes/${vehicleType.id}/edit`}>
                                                                <Edit className="h-4 w-4" />
                                                            </Link>
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="destructive"
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
                        </div>

                        {/* Pagination */}
                        {lastPage > 1 && (
                            <div className="mt-6 flex items-center justify-between">
                                <div className="text-sm text-muted-foreground">
                                    Showing {vehicleTypes.from || 1} to {vehicleTypes.to || totalVehicleTypes} of {totalVehicleTypes} vehicle types
                                </div>
                                <div className="flex gap-2">
                                    {/* Previous Button */}
                                    {currentPage > 1 && (
                                        <Button asChild variant="outline" size="sm">
                                            <Link href={vehicleTypes.links[0].url || '#'}>
                                                <ChevronLeft className="mr-1 h-4 w-4" />
                                                Previous
                                            </Link>
                                        </Button>
                                    )}

                                    {/* Page Numbers */}
                                    {vehicleTypes.links.map((link, index) => {
                                        // Skip first (prev) and last (next) links
                                        if (index === 0 || index === vehicleTypes.links.length - 1) {
                                            return null;
                                        }

                                        return (
                                            <Button
                                                key={index}
                                                asChild
                                                variant={link.active ? 'default' : 'outline'}
                                                size="sm"
                                                disabled={!link.url}
                                            >
                                                <Link href={link.url || '#'}>
                                                    <span dangerouslySetInnerHTML={{ __html: link.label }} />
                                                </Link>
                                            </Button>
                                        );
                                    })}

                                    {/* Next Button */}
                                    {currentPage < lastPage && (
                                        <Button asChild variant="outline" size="sm">
                                            <Link href={vehicleTypes.links[vehicleTypes.links.length - 1].url || '#'}>
                                                Next
                                                <ChevronRight className="ml-1 h-4 w-4" />
                                            </Link>
                                        </Button>
                                    )}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Delete Confirmation Dialog */}
                <DeleteConfirmationDialog
                    open={deleteDialogOpen}
                    onOpenChange={setDeleteDialogOpen}
                    title="Delete Vehicle Type"
                    description="Are you sure you want to delete this vehicle type? This action cannot be undone."
                    itemName={selectedVehicleType?.name || ''}
                    onConfirm={handleDeleteConfirm}
                    isLoading={isDeleting}
                />
            </div>
        </AppLayout>
    );
}



