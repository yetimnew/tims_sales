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
    {
        title: 'Places',
        href: '/places',
    },
];

interface PlaceData {
    id: number;
    name: string;
    latitude?: number;
    longitude?: number;
    woreda?: {
        name: string;
        zone?: {
            name: string;
            region?: {
                name: string;
            };
        };
    };
    created_at?: string;
}

interface PlacesIndexProps {
    places: {
        data: PlaceData[];
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

export default function PlacesIndex({ places, totalCount }: PlacesIndexProps) {
    const { hasPermission } = usePermissions();
    const [searchTerm, setSearchTerm] = React.useState('');
    const [sortBy, setSortBy] = React.useState('name');
    const [sortDirection, setSortDirection] = React.useState('asc');
    const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
    const [selectedPlace, setSelectedPlace] = React.useState<PlaceData | null>(null);
    const [isDeleting, setIsDeleting] = React.useState(false);

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setSearchTerm(value);

        router.get('/places',
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

        router.get('/places',
            { search: searchTerm, sort: column, direction: newDirection },
            { preserveState: false }
        );
    };

    const handleDeleteClick = (place: PlaceData) => {
        setSelectedPlace(place);
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = () => {
        if (!selectedPlace) return;

        setIsDeleting(true);
        router.delete(`/places/${selectedPlace.id}`, {
            onSuccess: () => {
                setDeleteDialogOpen(false);
                setSelectedPlace(null);
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

    const placeCount = totalCount || places?.total || 0;
    const perPage = places?.per_page || 15;
    const currentPage = places?.current_page || 1;
    const totalPages = places?.last_page || 1;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Places" />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-hidden rounded-xl p-4">
                {/* Header Section */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Places</h1>
                        <p className="text-muted-foreground">
                            Manage your {placeCount} place{placeCount !== 1 ? 's' : ''}
                        </p>
                    </div>
                    <div className="flex gap-2">
                        {hasPermission('places.export') && (
                            <Button
                                variant="outline"
                                onClick={() => router.get('/places/export', { search: searchTerm, sort: sortBy, direction: sortDirection })}
                            >
                                <FileDown className="mr-2 h-4 w-4" />
                                Export CSV
                            </Button>
                        )}
                        {hasPermission('places.create') && (
                            <Link href="/places/create">
                                <Button>
                                    <Plus className="mr-2 h-4 w-4" />
                                    Add Place
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
                                <CardTitle>Place Inventory</CardTitle>
                                <CardDescription>
                                    {placeCount} total place{placeCount !== 1 ? 's' : ''} in system
                                </CardDescription>
                            </div>
                            <div className="relative w-64">
                                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search places..."
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
                                            onClick={() => handleSort('latitude')}
                                        >
                                            <div className="flex items-center">
                                                Coordinates <SortIcon column="latitude" />
                                            </div>
                                        </TableHead>
                                        <TableHead
                                            className="cursor-pointer select-none hover:bg-muted/70 transition-colors"
                                            onClick={() => handleSort('woreda_id')}
                                        >
                                            <div className="flex items-center">
                                                Location <SortIcon column="woreda_id" />
                                            </div>
                                        </TableHead>
                                        <TableHead>Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {places.data.length > 0 ? (
                                        places.data.map((place) => (
                                            <TableRow key={place.id}>
                                                <TableCell className="font-medium">{place.id}</TableCell>
                                                <TableCell className="font-medium">{place.name}</TableCell>
                                                <TableCell>
                                                    {place.latitude && place.longitude ? (
                                                        <div className="text-sm">
                                                            {Number(place.latitude).toFixed(4)}, {Number(place.longitude).toFixed(4)}
                                                        </div>
                                                    ) : (
                                                        <span className="text-muted-foreground">N/A</span>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <div>
                                                        <div className="font-medium">{place.woreda?.name || 'N/A'}</div>
                                                        {place.woreda?.zone && (
                                                            <div className="text-sm text-muted-foreground">
                                                                {place.woreda.zone.name}
                                                                {place.woreda.zone.region && `, ${place.woreda.zone.region.name}`}
                                                            </div>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center space-x-2">
                                                        {hasPermission('places.show') && (
                                                            <Link href={`/places/${place.id}`}>
                                                                <Button size="sm" variant="ghost">
                                                                    <Eye className="h-4 w-4" />
                                                                </Button>
                                                            </Link>
                                                        )}
                                                        {hasPermission('places.edit') && (
                                                            <Link href={`/places/${place.id}/edit`}>
                                                                <Button size="sm" variant="ghost">
                                                                    <Edit className="h-4 w-4" />
                                                                </Button>
                                                            </Link>
                                                        )}
                                                        {hasPermission('places.destroy') && (
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                onClick={() => handleDeleteClick(place)}
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
                                            <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                                                No places found.
                                                {hasPermission('places.create') && (
                                                    <Link href="/places/create" className="ml-1 text-primary underline">
                                                        Create one
                                                    </Link>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Enhanced Pagination */}
                        {places.last_page > 1 && (
                            <div className="mt-6 flex items-center justify-between">
                                <div className="text-sm text-muted-foreground">
                                    Showing {places.from || 1} to {places.to || placeCount} of {placeCount} places
                                </div>
                                <div className="flex gap-2">
                                    {/* Previous Button */}
                                    {currentPage > 1 && (
                                        <Button asChild variant="outline" size="sm">
                                            <Link href={places.links[0].url || '#'}>
                                                <ChevronLeft className="mr-1 h-4 w-4" />
                                                Previous
                                            </Link>
                                        </Button>
                                    )}

                                    {/* Page Numbers */}
                                    {places.links.map((link, index) => {
                                        // Skip first (prev) and last (next) links
                                        if (index === 0 || index === places.links.length - 1) {
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
                                    {currentPage < totalPages && (
                                        <Button asChild variant="outline" size="sm">
                                            <Link href={places.links[places.links.length - 1].url || '#'}>
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
            </div>

            {/* Delete Confirmation Dialog */}
            <DeleteConfirmationDialog
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
                title="Delete Place"
                description="Are you sure you want to delete this place? This action cannot be undone."
                itemName={selectedPlace?.name}
                onConfirm={handleDeleteConfirm}
                isLoading={isDeleting}
            />
        </AppLayout>
    );
}
