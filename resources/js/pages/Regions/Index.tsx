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
import {
    Plus,
    Eye,
    Edit,
    Trash2,
    Search,
    ArrowUpDown,
    FileDown,
    Globe,
    CheckCircle,
    XCircle,
    Layers,
    Building,
} from 'lucide-react';
import ReactPaginate from 'react-paginate';
import * as React from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Regions',
        href: '/regions',
    },
];

interface RegionData {
    id: number;
    name: string;
    code?: string;
    status: 'active' | 'inactive';
    zones_count?: number;
    created_at?: string;
    capital?: string | null;
    area_km2?: number | string | null;
    population?: number | string | null;
    accessibility_score?: number | string | null;
    last_surveyed_at?: string | null;
}

interface RegionsIndexProps {
    regions: {
        data: RegionData[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
        from: number;
        to: number;
    };
    totalCount?: number;
}

const columns: Array<{ key: keyof RegionData; label: string; sortable?: boolean }> = [
    { key: 'name', label: 'Region', sortable: true },
    { key: 'code', label: 'Code', sortable: true },
    { key: 'status', label: 'Status', sortable: false },
    { key: 'capital', label: 'Capital', sortable: false },
    { key: 'population', label: 'Population', sortable: true },
    { key: 'accessibility_score', label: 'Accessibility', sortable: true },
    { key: 'zones_count', label: 'Zones', sortable: true },
    { key: 'last_surveyed_at', label: 'Last Surveyed', sortable: false },
];

export default function RegionsIndex({ regions, totalCount }: RegionsIndexProps) {
    const { hasPermission } = usePermissions();
    const [searchTerm, setSearchTerm] = React.useState('');
    const [sortBy, setSortBy] = React.useState('name');
    const [sortDirection, setSortDirection] = React.useState<'asc' | 'desc'>('asc');
    const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
    const [selectedRegion, setSelectedRegion] = React.useState<RegionData | null>(null);
    const [isDeleting, setIsDeleting] = React.useState(false);

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setSearchTerm(value);

        router.get(
            '/regions',
            { search: value, sort: sortBy, direction: sortDirection },
            { preserveState: true, replace: false },
        );
    };

    const handleSort = (column: string) => {
        const newDirection: 'asc' | 'desc' = sortBy === column && sortDirection === 'asc' ? 'desc' : 'asc';

        setSortBy(column);
        setSortDirection(newDirection);

        router.get(
            '/regions',
            { search: searchTerm, sort: column, direction: newDirection },
            { preserveState: true, replace: false },
        );
    };

    const handleDeleteClick = (region: RegionData) => {
        setSelectedRegion(region);
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = () => {
        if (!selectedRegion) return;

        setIsDeleting(true);
        router.delete(`/regions/${selectedRegion.id}`, {
            onSuccess: () => {
                setDeleteDialogOpen(false);
                setSelectedRegion(null);
                setIsDeleting(false);
            },
            onError: () => {
                setIsDeleting(false);
            },
        });
    };

    const regionCount = totalCount || regions?.total || 0;
    const currentPage = regions?.current_page || 1;
    const totalPages = regions?.last_page || 1;
    const activeCount = regions?.data?.filter(region => region.status === 'active').length || 0;
    const inactiveCount = regions?.data?.filter(region => region.status === 'inactive').length || 0;
    const totalZones = regions?.data?.reduce((sum, region) => sum + (region.zones_count ?? 0), 0) || 0;
    const headerActions = (
        <>
            {hasPermission('regions.export') && (
                <Button
                    variant="outline"
                    onClick={() => {
                        const params = new URLSearchParams({
                            search: searchTerm,
                            sort: sortBy,
                            direction: sortDirection,
                        });
                        window.location.href = `/regions/export?${params.toString()}`;
                    }}
                >
                    <FileDown className="mr-2 h-4 w-4" />
                    Export CSV
                </Button>
            )}
            {hasPermission('regions.create') && (
                <Button asChild>
                    <Link href="/regions/create">
                        <Plus className="mr-2 h-4 w-4" />
                        Add Region
                    </Link>
                </Button>
            )}
        </>
    );

    const statsSection = (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Regions</CardTitle>
                    <Globe className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-blue-600">{regionCount}</div>
                    <p className="text-xs text-muted-foreground">Active geographies tracked</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Active Regions</CardTitle>
                    <CheckCircle className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-green-600">{activeCount}</div>
                    <p className="text-xs text-muted-foreground">Operational regions</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Inactive Regions</CardTitle>
                    <XCircle className="h-4 w-4 text-red-600" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-red-600">{inactiveCount}</div>
                    <p className="text-xs text-muted-foreground">Awaiting validation</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Mapped Zones</CardTitle>
                    <Layers className="h-4 w-4 text-indigo-600" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-indigo-600">{totalZones}</div>
                    <p className="text-xs text-muted-foreground">Zones linked to these regions</p>
                </CardContent>
            </Card>
        </div>
    );

    const tableHeaderExtras = (
        <div className="relative w-64">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
                placeholder="Search regions..."
                value={searchTerm}
                onChange={handleSearch}
                className="pl-10"
            />
        </div>
    );

    const statusClassName = (status: RegionData['status']) =>
        status === 'active'
            ? 'bg-green-100 text-green-800 border-green-200 hover:bg-green-200'
            : 'bg-slate-200 text-slate-700 border-slate-300 hover:bg-slate-300';

    const formatPopulation = (value?: number | string | null) => {
        if (value === null || value === undefined || value === '') return '—';
        const numeric = Number(value);
        if (Number.isNaN(numeric)) return '—';
        return numeric.toLocaleString();
    };

    const renderHeaderCell = (column: string, label: string, sortable: boolean) => (
        <TableHead
            key={column}
            className={`bg-background ${sortable ? 'cursor-pointer select-none transition-colors hover:bg-muted/70' : 'text-right'}`}
            onClick={() => sortable && handleSort(column)}
        >
            <div className={`flex items-center gap-2 ${sortable ? '' : 'justify-end'}`}>
                {label}
                {sortable && (
                    <ArrowUpDown
                        size={14}
                        className={sortBy === column ? 'text-primary' : 'text-muted-foreground opacity-50'}
                        style={sortBy === column && sortDirection === 'desc' ? { transform: 'rotate(180deg)' } : undefined}
                    />
                )}
            </div>
        </TableHead>
    );

    const tableContent = (
        <Table>
            <TableHeader>
                <TableRow className="sticky top-0 z-20 border-b bg-background">
                    {columns.map(column => renderHeaderCell(column.key, column.label, column.sortable ?? true))}
                    <TableHead className="bg-background text-right">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {regions.data.length > 0 ? (
                    regions.data.map(region => (
                        <TableRow key={region.id} className="hover:bg-muted/50">
                            <TableCell className="font-semibold text-foreground">
                                <div className="flex items-center gap-2">
                                    <Building className="h-4 w-4 text-primary" />
                                    {region.name}
                                </div>
                            </TableCell>
                            <TableCell className="text-muted-foreground">{region.code || '—'}</TableCell>
                            <TableCell>
                                <Badge className={`flex items-center gap-1 w-fit border ${statusClassName(region.status)}`}>
                                    {region.status.charAt(0).toUpperCase() + region.status.slice(1)}
                                </Badge>
                            </TableCell>
                            <TableCell className="text-muted-foreground">{region.capital || '—'}</TableCell>
                            <TableCell className="text-muted-foreground">{formatPopulation(region.population)}</TableCell>
                            <TableCell className="text-muted-foreground">{region.accessibility_score ?? '—'}</TableCell>
                            <TableCell className="text-muted-foreground">{region.zones_count ?? 0}</TableCell>
                            <TableCell className="text-muted-foreground">
                                {region.last_surveyed_at ? new Date(region.last_surveyed_at).toLocaleDateString() : '—'}
                            </TableCell>
                            <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                    {hasPermission('regions.show') && (
                                        <Button asChild size="sm" variant="ghost">
                                            <Link href={`/regions/${region.id}`}>
                                                <Eye className="h-4 w-4" />
                                            </Link>
                                        </Button>
                                    )}
                                    {hasPermission('regions.edit') && (
                                        <Button asChild size="sm" variant="ghost">
                                            <Link href={`/regions/${region.id}/edit`}>
                                                <Edit className="h-4 w-4" />
                                            </Link>
                                        </Button>
                                    )}
                                    {hasPermission('regions.destroy') && (
                                        <Button size="sm" variant="ghost" onClick={() => handleDeleteClick(region)}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    )}
                                </div>
                            </TableCell>
                        </TableRow>
                    ))
                ) : (
                    <TableRow>
                        <TableCell colSpan={columns.length + 1} className="py-8 text-center text-muted-foreground">
                            No regions found.
                            {hasPermission('regions.create') && (
                                <Link href="/regions/create" className="ml-1 text-primary underline">
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
                headTitle="Regions"
                title="Regions"
                description={`Manage your network of ${regionCount} region${regionCount !== 1 ? 's' : ''}`}
                breadcrumbs={breadcrumbs}
                actions={headerActions}
                stats={statsSection}
                tableTitle="Region Inventory"
                tableDescription="Monitor coverage, readiness, and survey data across the country"
                tableHeaderExtras={tableHeaderExtras}
                pagination={
                    <div className="mt-4 flex w-full items-center justify-between">
                        <div className="text-sm text-muted-foreground">
                            Showing <span className="font-semibold text-foreground">{regions.from}</span> to{' '}
                            <span className="font-semibold text-foreground">{regions.to}</span> of{' '}
                            <span className="font-semibold text-foreground">{regionCount}</span> regions
                        </div>
                        <ReactPaginate
                            pageCount={totalPages}
                            forcePage={currentPage - 1}
                            onPageChange={({ selected }) => {
                                router.get(
                                    '/regions',
                                    {
                                        page: selected + 1,
                                        search: searchTerm,
                                        sort: sortBy,
                                        direction: sortDirection,
                                    },
                                    { preserveState: true },
                                );
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
                            previousLabel={'<'}
                            nextLabel={'>'}
                        />
                    </div>
                }
            >
                {tableContent}
            </ListPageLayout>

            <DeleteConfirmationDialog
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
                title="Delete Region"
                description="Are you sure you want to delete this region? This action cannot be undone."
                itemName={selectedRegion?.name}
                onConfirm={handleDeleteConfirm}
                isLoading={isDeleting}
            />
        </>
    );
}
