import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
import {
    Plus,
    Eye,
    Edit,
    Trash2,
    Search,
    ArrowUpDown,
    FileDown,
    MapPin,
    Ruler,
    Compass,
    Navigation,
} from 'lucide-react';
import { InertiaPagination } from '@/components/ui/pagination';
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

        router.get(
            '/places',
            { search: value, sort: sortBy, direction: sortDirection },
            { preserveState: true, replace: false },
        );
    };

    const handleSort = (column: string) => {
        let newDirection = 'asc';
        if (sortBy === column && sortDirection === 'asc') {
            newDirection = 'desc';
        }

        setSortBy(column);
        setSortDirection(newDirection);

        router.get(
            '/places',
            { search: searchTerm, sort: column, direction: newDirection },
            { preserveState: true, replace: false },
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

    const placeCount = totalCount || places?.total || 0;
    const currentPage = places?.current_page || 1;
    const totalPages = places?.last_page || 1;
    const geocodedCount = places?.data?.filter((place) => place.latitude && place.longitude).length || 0;
    const uniqueWoredas = Array.from(new Set(places?.data?.map((place) => place.woreda?.name).filter(Boolean))) as string[];
    const uniqueRegions = Array.from(
        new Set(places?.data?.map((place) => place.woreda?.zone?.region?.name).filter(Boolean)),
    ) as string[];
    const averageLatitude = geocodedCount
        ? (places.data.reduce((sum, place) => sum + (place.latitude ?? 0), 0) / geocodedCount).toFixed(2)
        : null;

    const headerActions = (
        <>
            {hasPermission('places.export') && (
                <Button
                    variant="outline"
                    onClick={() => {
                        const params = new URLSearchParams({
                            search: searchTerm,
                            sort: sortBy,
                            direction: sortDirection,
                        });
                        window.location.href = `/places/export?${params.toString()}`;
                    }}
                >
                    <FileDown className="mr-2 h-4 w-4" />
                    Export CSV
                </Button>
            )}
            {hasPermission('places.create') && (
                <Button asChild>
                    <Link href="/places/create">
                        <Plus className="mr-2 h-4 w-4" />
                        Add Place
                    </Link>
                </Button>
            )}
        </>
    );

    const statsSection = (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Places</CardTitle>
                    <MapPin className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-blue-600">{placeCount}</div>
                    <p className="text-xs text-muted-foreground">Locations managed in the system</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Geocoded</CardTitle>
                    <Navigation className="h-4 w-4 text-emerald-600" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-emerald-600">{geocodedCount}</div>
                    <p className="text-xs text-muted-foreground">With latitude & longitude defined</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Coverage</CardTitle>
                    <Ruler className="h-4 w-4 text-indigo-600" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-indigo-600">{uniqueWoredas.length}</div>
                    <p className="text-xs text-muted-foreground">Unique woredas represented</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Avg Latitude</CardTitle>
                    <Compass className="h-4 w-4 text-amber-600" />
                </CardHeader>
                <CardContent>
                    <div className="text-lg font-semibold text-amber-600">{averageLatitude ?? 'N/A'}</div>
                    <p className="text-xs text-muted-foreground">Quick geo sanity check</p>
                </CardContent>
            </Card>
        </div>
    );

    const tableHeaderExtras = (
        <div className="relative w-64">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
                placeholder="Search places..."
                value={searchTerm}
                onChange={handleSearch}
                className="pl-10"
            />
        </div>
    );

    const renderHeaderCell = (column: string, label: string) => (
        <TableHead
            key={column}
            className="bg-background cursor-pointer select-none transition-colors hover:bg-muted/70"
            onClick={() => handleSort(column)}
        >
            <div className="flex items-center gap-2">
                {label}
                <ArrowUpDown
                    size={14}
                    className={sortBy === column ? 'text-primary' : 'text-muted-foreground opacity-50'}
                    style={sortBy === column && sortDirection === 'desc' ? { transform: 'rotate(180deg)' } : undefined}
                />
            </div>
        </TableHead>
    );

    const formatCoordinate = (value?: number | null) => {
        if (value === null || value === undefined) return null;
        return Number(value).toFixed(4);
    };

    const tableContent = (
        <Table>
            <TableHeader>
                <TableRow className="sticky top-0 z-20 border-b bg-background">
                    {renderHeaderCell('id', 'ID')}
                    {renderHeaderCell('name', 'Name')}
                    {renderHeaderCell('latitude', 'Coordinates')}
                    {renderHeaderCell('woreda_id', 'Location')}
                    <TableHead className="bg-background text-right">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {places.data.length > 0 ? (
                    places.data.map((place) => {
                        const lat = formatCoordinate(place.latitude);
                        const lng = formatCoordinate(place.longitude);

                        return (
                            <TableRow key={place.id} className="hover:bg-muted/50">
                                <TableCell className="font-medium">{place.id}</TableCell>
                                <TableCell className="font-semibold text-foreground">{place.name}</TableCell>
                                <TableCell className="text-muted-foreground">
                                    {lat && lng ? `${lat}, ${lng}` : '—'}
                                </TableCell>
                                <TableCell>
                                    <div>
                                        <div className="font-medium text-foreground">{place.woreda?.name || '—'}</div>
                                        {place.woreda?.zone && (
                                            <div className="text-xs text-muted-foreground">
                                                {place.woreda.zone.name}
                                                {place.woreda.zone.region && `, ${place.woreda.zone.region.name}`}
                                            </div>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-2">
                                        {hasPermission('places.show') && (
                                            <Button asChild size="sm" variant="ghost">
                                                <Link href={`/places/${place.id}`}>
                                                    <Eye className="h-4 w-4" />
                                                </Link>
                                            </Button>
                                        )}
                                        {hasPermission('places.edit') && (
                                            <Button asChild size="sm" variant="ghost">
                                                <Link href={`/places/${place.id}/edit`}>
                                                    <Edit className="h-4 w-4" />
                                                </Link>
                                            </Button>
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
                        );
                    })
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
    );

    return (
        <>
            <ListPageLayout
                headTitle="Places"
                title="Places"
                description={`Manage ${placeCount} location${placeCount !== 1 ? 's' : ''} across the network`}
                breadcrumbs={breadcrumbs}
                actions={headerActions}
                stats={statsSection}
                tableTitle="Place Inventory"
                tableDescription={`Coverage across ${uniqueRegions.length} region${uniqueRegions.length !== 1 ? 's' : ''}`}
                tableHeaderExtras={tableHeaderExtras}
                tableContainerClassName="max-h-[55vh]"
                pagination={
                    <InertiaPagination
                        from={places.from}
                        to={places.to}
                        total={placeCount}
                        links={places.links as any}
                        currentPage={currentPage}
                        lastPage={totalPages}
                        className="px-6 pb-6 pt-4"
                    />
                }
            >
                {tableContent}
            </ListPageLayout>

            <DeleteConfirmationDialog
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
                title="Delete Place"
                description="Are you sure you want to delete this place? This action cannot be undone."
                itemName={selectedPlace?.name}
                onConfirm={handleDeleteConfirm}
                isLoading={isDeleting}
            />
        </>
    );

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Places" />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-hidden rounded-xl p-4">
                {/* Header Section */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">Places</h1>
                        <p className="text-muted-foreground mt-2">
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

                        {/* Pagination */}
                        <InertiaPagination
                          from={places.from}
                          to={places.to}
                          total={placeCount}
                          links={(places as any).links as any}
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
                title="Delete Place"
                description="Are you sure you want to delete this place? This action cannot be undone."
                itemName={selectedPlace?.name}
                onConfirm={handleDeleteConfirm}
                isLoading={isDeleting}
            />
        </AppLayout>
    );
}
