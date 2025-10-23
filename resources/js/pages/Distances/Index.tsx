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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { DeleteConfirmationDialog } from '@/components/delete-confirmation-dialog';
import { usePermissions } from '@/hooks/use-permissions';
import { Head, Link, router } from '@inertiajs/react';
import { type BreadcrumbItem } from '@/types';
import { Plus, Eye, Edit, Trash2, Search, ArrowUpDown, ChevronLeft, ChevronRight, FileDown, Filter, X } from 'lucide-react';
import * as React from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Distances',
        href: '/distances',
    },
];

interface DistanceData {
    id: number;
    from_place_id: number;
    to_place_id: number;
    distance_km: number;
    estimated_time_hours: number;
    route_type?: string;
    toll_road?: boolean;
    restricted_for_heavy_vehicles?: boolean;
    from_place?: {
        name: string;
        woreda?: {
            name: string;
            zone?: {
                name: string;
                region?: { name: string };
            };
        };
    };
    to_place?: {
        name: string;
        woreda?: {
            name: string;
            zone?: {
                name: string;
                region?: { name: string };
            };
        };
    };
    created_at?: string;
}

interface DistancesIndexProps {
    distances: {
        data: DistanceData[];
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

export default function DistancesIndex({ distances, totalCount }: DistancesIndexProps) {
    const { hasPermission } = usePermissions();
    const [searchTerm, setSearchTerm] = React.useState('');
    const [sortBy, setSortBy] = React.useState('distance_km');
    const [sortDirection, setSortDirection] = React.useState('asc');
    const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
    const [selectedDistance, setSelectedDistance] = React.useState<DistanceData | null>(null);
    const [isDeleting, setIsDeleting] = React.useState(false);

    // Advanced filter states
    const [showFilters, setShowFilters] = React.useState(false);
    const [filters, setFilters] = React.useState({
        distanceMin: '',
        distanceMax: '',
        timeMin: '',
        timeMax: '',
        routeType: 'all',
        tollRoad: 'all',
        heavyVehicleRestricted: 'all',
        region: '',
        zone: ''
    });

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setSearchTerm(value);

        router.get('/distances',
            { search: value, sort: sortBy, direction: sortDirection, ...filters },
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

        router.get('/distances',
            { search: searchTerm, sort: column, direction: newDirection, ...filters },
            { preserveState: false }
        );
    };

    const handleFilterChange = (key: string, value: string) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const clearFilters = () => {
        setFilters({
            distanceMin: '',
            distanceMax: '',
            timeMin: '',
            timeMax: '',
            routeType: 'all',
            tollRoad: 'all',
            heavyVehicleRestricted: 'all',
            region: '',
            zone: ''
        });
        router.get('/distances',
            { search: searchTerm, sort: sortBy, direction: sortDirection },
            { preserveState: false }
        );
    };

    const applyFilters = () => {
        router.get('/distances',
            { search: searchTerm, sort: sortBy, direction: sortDirection, ...filters },
            { preserveState: false }
        );
    };

    const handleDeleteClick = (distance: DistanceData) => {
        setSelectedDistance(distance);
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = () => {
        if (!selectedDistance) return;

        setIsDeleting(true);
        router.delete(`/distances/${selectedDistance.id}`, {
            onSuccess: () => {
                setDeleteDialogOpen(false);
                setSelectedDistance(null);
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

    const distanceCount = totalCount || distances?.total || 0;
    const perPage = distances?.per_page || 15;
    const currentPage = distances?.current_page || 1;
    const totalPages = distances?.last_page || 1;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Distances" />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-hidden rounded-xl p-4">
                {/* Header Section */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">Distances</h1>
                        <p className="text-muted-foreground mt-2">
                            Manage your {distanceCount} distance record{distanceCount !== 1 ? 's' : ''} between places
                        </p>
                    </div>
                    <div className="flex gap-2">
                        {hasPermission('distances.export') && (
                            <Button
                                variant="outline"
                                onClick={() => router.get('/distances/export', { search: searchTerm, sort: sortBy, direction: sortDirection, ...filters })}
                            >
                                <FileDown className="mr-2 h-4 w-4" />
                                Export CSV
                            </Button>
                        )}
                        {hasPermission('distances.create') && (
                            <Link href="/distances/create">
                                <Button>
                                    <Plus className="mr-2 h-4 w-4" />
                                    Add Distance
                                </Button>
                            </Link>
                        )}
                    </div>
                </div>

                {/* Search and Filters */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        placeholder="Search distances..."
                                        value={searchTerm}
                                        onChange={handleSearch}
                                        className="pl-10 w-80"
                                    />
                                </div>
                                <Button
                                    onClick={() => setShowFilters(!showFilters)}
                                    variant={showFilters ? "default" : "outline"}
                                >
                                    <Filter className="mr-2 h-4 w-4" />
                                    Filters
                                </Button>
                            </div>
                        </div>

                        {/* Advanced Filters */}
                        {showFilters && (
                            <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {/* Distance Range */}
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Distance Range (KM)</label>
                                        <div className="flex space-x-2">
                                            <Input
                                                placeholder="Min"
                                                value={filters.distanceMin}
                                                onChange={(e) => handleFilterChange('distanceMin', e.target.value)}
                                                type="number"
                                            />
                                            <Input
                                                placeholder="Max"
                                                value={filters.distanceMax}
                                                onChange={(e) => handleFilterChange('distanceMax', e.target.value)}
                                                type="number"
                                            />
                                        </div>
                                    </div>

                                    {/* Time Range */}
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Time Range (Hours)</label>
                                        <div className="flex space-x-2">
                                            <Input
                                                placeholder="Min"
                                                value={filters.timeMin}
                                                onChange={(e) => handleFilterChange('timeMin', e.target.value)}
                                                type="number"
                                                step="0.1"
                                            />
                                            <Input
                                                placeholder="Max"
                                                value={filters.timeMax}
                                                onChange={(e) => handleFilterChange('timeMax', e.target.value)}
                                                type="number"
                                                step="0.1"
                                            />
                                        </div>
                                    </div>

                                    {/* Route Type */}
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Route Type</label>
                                        <Select value={filters.routeType} onValueChange={(value) => handleFilterChange('routeType', value)}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="All Types" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">All Types</SelectItem>
                                                <SelectItem value="primary">Primary</SelectItem>
                                                <SelectItem value="secondary">Secondary</SelectItem>
                                                <SelectItem value="alternative">Alternative</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {/* Toll Road */}
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Toll Road</label>
                                        <Select value={filters.tollRoad} onValueChange={(value) => handleFilterChange('tollRoad', value)}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="All" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">All</SelectItem>
                                                <SelectItem value="true">Yes</SelectItem>
                                                <SelectItem value="false">No</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {/* Heavy Vehicle Restriction */}
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Heavy Vehicle Restricted</label>
                                        <Select value={filters.heavyVehicleRestricted} onValueChange={(value) => handleFilterChange('heavyVehicleRestricted', value)}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="All" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">All</SelectItem>
                                                <SelectItem value="true">Yes</SelectItem>
                                                <SelectItem value="false">No</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {/* Region */}
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Region</label>
                                        <Input
                                            placeholder="Filter by region"
                                            value={filters.region}
                                            onChange={(e) => handleFilterChange('region', e.target.value)}
                                        />
                                    </div>
                                </div>

                                {/* Filter Actions */}
                                <div className="flex items-center justify-between mt-4">
                                    <div className="flex items-center space-x-2">
                                        <Button onClick={applyFilters} size="sm">
                                            Apply Filters
                                        </Button>
                                        <Button onClick={clearFilters} variant="outline" size="sm">
                                            <X className="mr-2 h-4 w-4" />
                                            Clear All
                                        </Button>
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                        {Object.values(filters).filter(v => v !== '' && v !== 'all').length} filter(s) active
                                    </div>
                                </div>
                            </div>
                        )}
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead
                                            className="cursor-pointer hover:bg-muted/50"
                                            onClick={() => handleSort('id')}
                                        >
                                            ID
                                            <SortIcon column="id" />
                                        </TableHead>
                                        <TableHead
                                            className="cursor-pointer hover:bg-muted/50"
                                            onClick={() => handleSort('from_place_id')}
                                        >
                                            From Place
                                            <SortIcon column="from_place_id" />
                                        </TableHead>
                                        <TableHead
                                            className="cursor-pointer hover:bg-muted/50"
                                            onClick={() => handleSort('to_place_id')}
                                        >
                                            To Place
                                            <SortIcon column="to_place_id" />
                                        </TableHead>
                                        <TableHead
                                            className="cursor-pointer hover:bg-muted/50"
                                            onClick={() => handleSort('distance_km')}
                                        >
                                            Distance (KM)
                                            <SortIcon column="distance_km" />
                                        </TableHead>
                                        <TableHead
                                            className="cursor-pointer hover:bg-muted/50"
                                            onClick={() => handleSort('estimated_time_hours')}
                                        >
                                            Time (Hours)
                                            <SortIcon column="estimated_time_hours" />
                                        </TableHead>
                                        <TableHead
                                            className="cursor-pointer hover:bg-muted/50"
                                            onClick={() => handleSort('route_type')}
                                        >
                                            Route Type
                                            <SortIcon column="route_type" />
                                        </TableHead>
                                        <TableHead>Features</TableHead>
                                        <TableHead>Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {distances.data.length > 0 ? (
                                        distances.data.map((distance) => (
                                            <TableRow key={distance.id}>
                                                <TableCell className="font-medium">{distance.id}</TableCell>
                                                <TableCell>
                                                    <div>
                                                        <div className="font-medium">{distance.from_place?.name || 'N/A'}</div>
                                                        {distance.from_place?.woreda && (
                                                            <div className="text-sm text-muted-foreground">
                                                                {distance.from_place.woreda.name}, {distance.from_place.woreda.zone?.name}
                                                            </div>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div>
                                                        <div className="font-medium">{distance.to_place?.name || 'N/A'}</div>
                                                        {distance.to_place?.woreda && (
                                                            <div className="text-sm text-muted-foreground">
                                                                {distance.to_place.woreda.name}, {distance.to_place.woreda.zone?.name}
                                                            </div>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="font-medium">{Number(distance.distance_km).toFixed(2)}</TableCell>
                                                <TableCell className="font-medium">{Number(distance.estimated_time_hours).toFixed(2)}</TableCell>
                                                <TableCell>
                                                    {distance.route_type && (
                                                        <Badge variant="outline" className="capitalize">
                                                            {distance.route_type}
                                                        </Badge>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-wrap gap-1">
                                                        {distance.toll_road && (
                                                            <Badge variant="destructive" className="text-xs">
                                                                Toll
                                                            </Badge>
                                                        )}
                                                        {distance.restricted_for_heavy_vehicles && (
                                                            <Badge variant="secondary" className="text-xs">
                                                                Heavy Restricted
                                                            </Badge>
                                                        )}
                                                        {!distance.toll_road && !distance.restricted_for_heavy_vehicles && (
                                                            <Badge variant="outline" className="text-xs">
                                                                Standard
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center space-x-2">
                                                        {hasPermission('distances.show') && (
                                                            <Link href={`/distances/${distance.id}`}>
                                                                <Button size="sm" variant="ghost">
                                                                    <Eye className="h-4 w-4" />
                                                                </Button>
                                                            </Link>
                                                        )}
                                                        {hasPermission('distances.edit') && (
                                                            <Link href={`/distances/${distance.id}/edit`}>
                                                                <Button size="sm" variant="ghost">
                                                                    <Edit className="h-4 w-4" />
                                                                </Button>
                                                            </Link>
                                                        )}
                                                        {hasPermission('distances.destroy') && (
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                onClick={() => handleDeleteClick(distance)}
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
                                                No distances found.
                                                {hasPermission('distances.create') && (
                                                    <Link href="/distances/create" className="ml-1 text-primary underline">
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
                        {distances.last_page > 1 && (
                            <div className="mt-6 flex items-center justify-between">
                                <div className="text-sm text-muted-foreground">
                                    Showing {distances.from || 1} to {distances.to || distanceCount} of {distanceCount} distances
                                </div>
                                <div className="flex gap-2">
                                    {/* Previous Button */}
                                    {currentPage > 1 && (
                                        <Button asChild variant="outline" size="sm">
                                            <Link href={distances.links[0].url || '#'}>
                                                <ChevronLeft className="mr-1 h-4 w-4" />
                                                Previous
                                            </Link>
                                        </Button>
                                    )}

                                    {/* Page Numbers */}
                                    {distances.links.map((link, index) => {
                                        // Skip first (prev) and last (next) links
                                        if (index === 0 || index === distances.links.length - 1) {
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
                                            <Link href={distances.links[distances.links.length - 1].url || '#'}>
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
                title="Delete Distance"
                description="Are you sure you want to delete this distance? This action cannot be undone."
                itemName={selectedDistance ? `${selectedDistance.from_place?.name} → ${selectedDistance.to_place?.name}` : ''}
                onConfirm={handleDeleteConfirm}
                isLoading={isDeleting}
            />
        </AppLayout>
    );
}
