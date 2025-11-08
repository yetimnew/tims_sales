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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
    Filter,
    X,
    Route,
    TimerReset,
    Navigation,
    ShieldAlert,
} from 'lucide-react';
import { InertiaPagination } from '@/components/ui/pagination';
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

    const initialFilters = React.useMemo(() => ({
        distanceMin: '',
        distanceMax: '',
        timeMin: '',
        timeMax: '',
        routeType: 'all',
        tollRoad: 'all',
        heavyVehicleRestricted: 'all',
        region: '',
        zone: '',
    }), []);

    const [showFilters, setShowFilters] = React.useState(false);
    const [filters, setFilters] = React.useState(initialFilters);

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setSearchTerm(value);

        router.get(
            '/distances',
            { search: value, sort: sortBy, direction: sortDirection, ...filters },
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
            '/distances',
            { search: searchTerm, sort: column, direction: newDirection, ...filters },
            { preserveState: true, replace: false },
        );
    };

    const handleFilterChange = (key: string, value: string) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const clearFilters = () => {
        const reset = { ...initialFilters };
        setFilters(reset);
        router.get(
            '/distances',
            { search: searchTerm, sort: sortBy, direction: sortDirection, ...reset },
            { preserveState: true, replace: false },
        );
    };

    const applyFilters = () => {
        router.get(
            '/distances',
            { search: searchTerm, sort: sortBy, direction: sortDirection, ...filters },
            { preserveState: true, replace: false },
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

    const distanceCount = totalCount || distances?.total || 0;
    const currentPage = distances?.current_page || 1;
    const totalPages = distances?.last_page || 1;
    const pageItems = distances?.data || [];
    const totalDistanceKm = pageItems.reduce((sum, distance) => sum + Number(distance.distance_km ?? 0), 0);
    const totalTimeHours = pageItems.reduce((sum, distance) => sum + Number(distance.estimated_time_hours ?? 0), 0);
    const avgDistance = pageItems.length ? totalDistanceKm / pageItems.length : 0;
    const avgTime = pageItems.length ? totalTimeHours / pageItems.length : 0;
    const tollCount = pageItems.filter((distance) => distance.toll_road).length;
    const restrictedCount = pageItems.filter((distance) => distance.restricted_for_heavy_vehicles).length;
    const activeFiltersCount = Object.values(filters).filter((value) => value !== '' && value !== 'all').length;

    const headerActions = (
        <>
            {hasPermission('distances.export') && (
                <Button
                    variant="outline"
                    onClick={() => {
                        const params = new URLSearchParams({
                            search: searchTerm,
                            sort: sortBy,
                            direction: sortDirection,
                            ...filters,
                        });
                        window.location.href = `/distances/export?${params.toString()}`;
                    }}
                >
                    <FileDown className="mr-2 h-4 w-4" />
                    Export CSV
                </Button>
            )}
            {hasPermission('distances.create') && (
                <Button asChild>
                    <Link href="/distances/create">
                        <Plus className="mr-2 h-4 w-4" />
                        Add Distance
                    </Link>
                </Button>
            )}
        </>
    );

    const statsSection = (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Records</CardTitle>
                    <Route className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-blue-600">{distanceCount}</div>
                    <p className="text-xs text-muted-foreground">Routes tracked overall</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Avg Distance</CardTitle>
                    <Navigation className="h-4 w-4 text-emerald-600" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-emerald-600">{avgDistance.toFixed(1)} km</div>
                    <p className="text-xs text-muted-foreground">Based on current view</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Avg Transit</CardTitle>
                    <TimerReset className="h-4 w-4 text-indigo-600" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-indigo-600">{avgTime.toFixed(1)} hr</div>
                    <p className="text-xs text-muted-foreground">Estimated time per leg</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Restrictions</CardTitle>
                    <ShieldAlert className="h-4 w-4 text-amber-600" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-amber-600">{restrictedCount}</div>
                    <p className="text-xs text-muted-foreground">
                        Heavy vehicle limits · {tollCount} toll route{tollCount === 1 ? '' : 's'}
                    </p>
                </CardContent>
            </Card>
        </div>
    );

    const tableHeaderExtras = (
        <div className="flex items-center gap-2">
            <div className="relative w-64">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search distances..."
                    value={searchTerm}
                    onChange={handleSearch}
                    className="pl-10"
                />
            </div>
            <Button
                onClick={() => setShowFilters((prev) => !prev)}
                variant={showFilters ? 'default' : 'outline'}
            >
                <Filter className="mr-2 h-4 w-4" />
                Filters
                {activeFiltersCount > 0 && (
                    <span className="ml-2 rounded-full bg-white/80 px-2 py-0.5 text-xs font-semibold text-primary">
                        {activeFiltersCount}
                    </span>
                )}
            </Button>
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

    const tableContent = (
        <div className="min-w-full">
            {showFilters && (
                <div className="space-y-4 border-b border-border bg-muted/40 p-4">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Distance Range (KM)</label>
                            <div className="flex gap-2">
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
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Time Range (Hours)</label>
                            <div className="flex gap-2">
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
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Region</label>
                            <Input
                                placeholder="Filter by region"
                                value={filters.region}
                                onChange={(e) => handleFilterChange('region', e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Zone</label>
                            <Input
                                placeholder="Filter by zone"
                                value={filters.zone}
                                onChange={(e) => handleFilterChange('zone', e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex gap-2">
                            <Button onClick={applyFilters} size="sm">
                                Apply Filters
                            </Button>
                            <Button onClick={clearFilters} variant="outline" size="sm">
                                <X className="mr-2 h-4 w-4" />
                                Clear All
                            </Button>
                        </div>
                        <div className="text-sm text-muted-foreground">
                            {activeFiltersCount} filter{activeFiltersCount === 1 ? '' : 's'} active
                        </div>
                    </div>
                </div>
            )}

            <Table>
                <TableHeader>
                    <TableRow className="sticky top-0 z-20 border-b bg-background">
                        {renderHeaderCell('id', 'ID')}
                        {renderHeaderCell('from_place_id', 'From Place')}
                        {renderHeaderCell('to_place_id', 'To Place')}
                        {renderHeaderCell('distance_km', 'Distance (KM)')}
                        {renderHeaderCell('estimated_time_hours', 'Time (Hours)')}
                        {renderHeaderCell('route_type', 'Route Type')}
                        <TableHead className="bg-background">Features</TableHead>
                        <TableHead className="bg-background text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {pageItems.length > 0 ? (
                        pageItems.map((distance) => (
                            <TableRow key={distance.id} className="hover:bg-muted/50">
                                <TableCell className="font-medium">{distance.id}</TableCell>
                                <TableCell>
                                    <div>
                                        <div className="font-medium text-foreground">{distance.from_place?.name || '—'}</div>
                                        {distance.from_place?.woreda && (
                                            <div className="text-xs text-muted-foreground">
                                                {distance.from_place.woreda.name}
                                                {distance.from_place.woreda.zone && `, ${distance.from_place.woreda.zone.name}`}
                                            </div>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div>
                                        <div className="font-medium text-foreground">{distance.to_place?.name || '—'}</div>
                                        {distance.to_place?.woreda && (
                                            <div className="text-xs text-muted-foreground">
                                                {distance.to_place.woreda.name}
                                                {distance.to_place.woreda.zone && `, ${distance.to_place.woreda.zone.name}`}
                                            </div>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell className="font-semibold text-foreground">{Number(distance.distance_km).toFixed(2)}</TableCell>
                                <TableCell className="font-semibold text-foreground">{Number(distance.estimated_time_hours).toFixed(2)}</TableCell>
                                <TableCell>
                                    {distance.route_type ? (
                                        <Badge variant="outline" className="capitalize">
                                            {distance.route_type}
                                        </Badge>
                                    ) : (
                                        <span className="text-xs text-muted-foreground">—</span>
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
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-2">
                                        {hasPermission('distances.show') && (
                                            <Button asChild size="sm" variant="ghost">
                                                <Link href={`/distances/${distance.id}`}>
                                                    <Eye className="h-4 w-4" />
                                                </Link>
                                            </Button>
                                        )}
                                        {hasPermission('distances.edit') && (
                                            <Button asChild size="sm" variant="ghost">
                                                <Link href={`/distances/${distance.id}/edit`}>
                                                    <Edit className="h-4 w-4" />
                                                </Link>
                                            </Button>
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
    );

    return (
        <>
            <ListPageLayout
                headTitle="Distances"
                title="Distances"
                description={`Manage ${distanceCount} route${distanceCount !== 1 ? 's' : ''} between operational places`}
                breadcrumbs={breadcrumbs}
                actions={headerActions}
                stats={statsSection}
                tableTitle="Distance Inventory"
                tableDescription="Analyse connectivity and travel characteristics"
                tableHeaderExtras={tableHeaderExtras}
                tableContainerClassName="max-h-[55vh]"
                pagination={
                    <InertiaPagination
                        from={distances.from}
                        to={distances.to}
                        total={distanceCount}
                        links={distances.links as any}
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
                title="Delete Distance"
                description="Are you sure you want to delete this distance? This action cannot be undone."
                itemName={selectedDistance ? `${selectedDistance.from_place?.name ?? 'Origin'} → ${selectedDistance.to_place?.name ?? 'Destination'}` : ''}
                onConfirm={handleDeleteConfirm}
                isLoading={isDeleting}
            />
        </>
    );
}
