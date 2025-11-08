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
    Globe,
    Map,
    AlertCircle,
    CalendarClock,
} from 'lucide-react';
import { InertiaPagination } from '@/components/ui/pagination';
import * as React from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Zones',
        href: '/zones',
    },
];

interface ZoneData {
    id: number;
    name: string;
    region?: {
        name: string;
    };
    created_at?: string;
}

interface ZonesIndexProps {
    zones: {
        data: ZoneData[];
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

export default function ZonesIndex({ zones, totalCount }: ZonesIndexProps) {
    const { hasPermission } = usePermissions();
    const [searchTerm, setSearchTerm] = React.useState('');
    const [sortBy, setSortBy] = React.useState('name');
    const [sortDirection, setSortDirection] = React.useState('asc');
    const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
    const [selectedZone, setSelectedZone] = React.useState<ZoneData | null>(null);
    const [isDeleting, setIsDeleting] = React.useState(false);

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setSearchTerm(value);

        router.get(
            '/zones',
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
            '/zones',
            { search: searchTerm, sort: column, direction: newDirection },
            { preserveState: true, replace: false },
        );
    };

    const handleDeleteClick = (zone: ZoneData) => {
        setSelectedZone(zone);
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = () => {
        if (!selectedZone) return;

        setIsDeleting(true);
        router.delete(`/zones/${selectedZone.id}`, {
            onSuccess: () => {
                setDeleteDialogOpen(false);
                setSelectedZone(null);
                setIsDeleting(false);
            },
            onError: () => {
                setIsDeleting(false);
            },
        });
    };

    const zoneCount = totalCount || zones?.total || 0;
    const currentPage = zones?.current_page || 1;
    const totalPages = zones?.last_page || 1;
    const uniqueRegions = Array.from(new Set(zones?.data?.map((zone) => zone.region?.name).filter(Boolean))) as string[];
    const unassignedZones = zones?.data?.filter((zone) => !zone.region?.name).length || 0;
    const lastUpdated = zones?.data?.reduce<string | null>((latest, zone) => {
        if (!zone.created_at) return latest;
        if (!latest) return zone.created_at;
        return new Date(zone.created_at) > new Date(latest) ? zone.created_at : latest;
    }, null);

    const headerActions = (
        <>
            {hasPermission('zones.export') && (
                <Button
                    variant="outline"
                    onClick={() => {
                        const params = new URLSearchParams({
                            search: searchTerm,
                            sort: sortBy,
                            direction: sortDirection,
                        });
                        window.location.href = `/zones/export?${params.toString()}`;
                    }}
                >
                    <FileDown className="mr-2 h-4 w-4" />
                    Export CSV
                </Button>
            )}
            {hasPermission('zones.create') && (
                <Button asChild>
                    <Link href="/zones/create">
                        <Plus className="mr-2 h-4 w-4" />
                        Add Zone
                    </Link>
                </Button>
            )}
        </>
    );

    const statsSection = (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Zones</CardTitle>
                    <Globe className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-blue-600">{zoneCount}</div>
                    <p className="text-xs text-muted-foreground">Geographic segments tracked</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Regions Covered</CardTitle>
                    <Map className="h-4 w-4 text-emerald-600" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-emerald-600">{uniqueRegions.length}</div>
                    <p className="text-xs text-muted-foreground">Distinct regions represented</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Unassigned Zones</CardTitle>
                    <AlertCircle className="h-4 w-4 text-amber-600" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-amber-600">{unassignedZones}</div>
                    <p className="text-xs text-muted-foreground">Missing region linkage</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Latest Addition</CardTitle>
                    <CalendarClock className="h-4 w-4 text-indigo-600" />
                </CardHeader>
                <CardContent>
                    <div className="text-lg font-semibold text-indigo-600">
                        {lastUpdated ? new Date(lastUpdated).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A'}
                    </div>
                    <p className="text-xs text-muted-foreground">Most recent zone onboarded</p>
                </CardContent>
            </Card>
        </div>
    );

    const tableHeaderExtras = (
        <div className="relative w-64">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
                placeholder="Search zones..."
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

    const tableContent = (
        <Table>
            <TableHeader>
                <TableRow className="sticky top-0 z-20 border-b bg-background">
                    {renderHeaderCell('id', 'ID')}
                    {renderHeaderCell('name', 'Name')}
                    {renderHeaderCell('region_id', 'Region')}
                    <TableHead className="bg-background text-right">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {zones.data.length > 0 ? (
                    zones.data.map((zone) => (
                        <TableRow key={zone.id} className="hover:bg-muted/50">
                            <TableCell className="font-medium">{zone.id}</TableCell>
                            <TableCell className="font-semibold text-foreground">{zone.name}</TableCell>
                            <TableCell className="text-muted-foreground">{zone.region?.name || '—'}</TableCell>
                            <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                    {hasPermission('zones.show') && (
                                        <Button asChild size="sm" variant="ghost">
                                            <Link href={`/zones/${zone.id}`}>
                                                <Eye className="h-4 w-4" />
                                            </Link>
                                        </Button>
                                    )}
                                    {hasPermission('zones.edit') && (
                                        <Button asChild size="sm" variant="ghost">
                                            <Link href={`/zones/${zone.id}/edit`}>
                                                <Edit className="h-4 w-4" />
                                            </Link>
                                        </Button>
                                    )}
                                    {hasPermission('zones.destroy') && (
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => handleDeleteClick(zone)}
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
                        <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                            No zones found.
                            {hasPermission('zones.create') && (
                                <Link href="/zones/create" className="ml-1 text-primary underline">
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
                headTitle="Zones"
                title="Zones"
                description={`Manage your catalogue of ${zoneCount} zone${zoneCount !== 1 ? 's' : ''}`}
                breadcrumbs={breadcrumbs}
                actions={headerActions}
                stats={statsSection}
                tableTitle="Zone Inventory"
                tableDescription="Monitor coverage across regions"
                tableHeaderExtras={tableHeaderExtras}
                tableContainerClassName="max-h-[55vh]"
                pagination={
                    <InertiaPagination
                        from={zones.from}
                        to={zones.to}
                        total={zoneCount}
                        links={zones.links as any}
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
                title="Delete Zone"
                description="Are you sure you want to delete this zone? This action cannot be undone."
                itemName={selectedZone?.name}
                onConfirm={handleDeleteConfirm}
                isLoading={isDeleting}
            />
        </>
    );
}
