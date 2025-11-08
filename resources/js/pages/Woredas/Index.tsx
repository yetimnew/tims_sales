import * as React from 'react';
import { Link, router } from '@inertiajs/react';
import { type BreadcrumbItem } from '@/types';
import { usePermissions } from '@/hooks/use-permissions';
import ListPageLayout from '@/components/layouts/list-page-layout';
import { DeleteConfirmationDialog } from '@/components/delete-confirmation-dialog';
import { InertiaPagination } from '@/components/ui/pagination';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    AlertTriangle,
    ArrowUpDown,
    Edit,
    Eye,
    FileDown,
    Globe,
    Layers,
    MapPin,
    Plus,
    Search,
    Trash2,
} from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Woredas',
        href: '/woredas',
    },
];

interface WoredaData {
    id: number;
    name: string;
    zone?: {
        name: string;
        region?: {
            name: string;
        };
    };
}

interface WoredasIndexProps {
    woredas: {
        data: WoredaData[];
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

export default function WoredasIndex({ woredas, totalCount }: WoredasIndexProps) {
    const { hasPermission } = usePermissions();
    const [searchTerm, setSearchTerm] = React.useState('');
    const [sortBy, setSortBy] = React.useState('name');
    const [sortDirection, setSortDirection] = React.useState<'asc' | 'desc'>('asc');
    const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
    const [selectedWoreda, setSelectedWoreda] = React.useState<WoredaData | null>(null);
    const [isDeleting, setIsDeleting] = React.useState(false);

    const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
        const value = event.target.value;
        setSearchTerm(value);

        router.get(
            '/woredas',
            { search: value, sort: sortBy, direction: sortDirection },
            { preserveState: true, replace: false },
        );
    };

    const handleSort = (column: string) => {
        let direction: 'asc' | 'desc' = 'asc';

        if (sortBy === column && sortDirection === 'asc') {
            direction = 'desc';
        }

        setSortBy(column);
        setSortDirection(direction);

        router.get(
            '/woredas',
            { search: searchTerm, sort: column, direction },
            { preserveState: true, replace: false },
        );
    };

    const handleDeleteClick = (woreda: WoredaData) => {
        setSelectedWoreda(woreda);
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = () => {
        if (!selectedWoreda) return;

        setIsDeleting(true);
        router.delete(`/woredas/${selectedWoreda.id}`, {
            onSuccess: () => {
                setDeleteDialogOpen(false);
                setSelectedWoreda(null);
                setIsDeleting(false);
            },
            onError: () => {
                setIsDeleting(false);
            },
        });
    };

    const woredaCount = totalCount || woredas?.total || 0;
    const currentPage = woredas?.current_page || 1;
    const totalPages = woredas?.last_page || 1;
    const zonesRepresented = Array.from(new Set(woredas?.data?.map((item) => item.zone?.name).filter(Boolean))) as string[];
    const regionsRepresented = Array.from(new Set(woredas?.data?.map((item) => item.zone?.region?.name).filter(Boolean))) as string[];
    const unlinkedWoredas = woredas?.data?.filter((item) => !item.zone?.name).length || 0;

    const headerActions = (
        <>
            {hasPermission('woredas.export') && (
                <Button
                    variant="outline"
                    onClick={() => {
                        const params = new URLSearchParams({
                            search: searchTerm,
                            sort: sortBy,
                            direction: sortDirection,
                        });
                        window.location.href = `/woredas/export?${params.toString()}`;
                    }}
                >
                    <FileDown className="mr-2 h-4 w-4" />
                    Export CSV
                </Button>
            )}
            {hasPermission('woredas.create') && (
                <Button asChild>
                    <Link href="/woredas/create">
                        <Plus className="mr-2 h-4 w-4" />
                        Add Woreda
                    </Link>
                </Button>
            )}
        </>
    );

    const statsSection = (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Woredas</CardTitle>
                    <MapPin className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-blue-600">{woredaCount}</div>
                    <p className="text-xs text-muted-foreground">Administrative areas on record</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Zones Covered</CardTitle>
                    <Layers className="h-4 w-4 text-emerald-600" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-emerald-600">{zonesRepresented.length}</div>
                    <p className="text-xs text-muted-foreground">Distinct zones represented</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Regions</CardTitle>
                    <Globe className="h-4 w-4 text-indigo-600" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-indigo-600">{regionsRepresented.length}</div>
                    <p className="text-xs text-muted-foreground">Regional reach snapshot</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Unlinked</CardTitle>
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-amber-600">{unlinkedWoredas}</div>
                    <p className="text-xs text-muted-foreground">Require zone assignment</p>
                </CardContent>
            </Card>
        </div>
    );

    const tableHeaderExtras = (
        <div className="relative w-64">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
                placeholder="Search woredas..."
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
                    {renderHeaderCell('zone_id', 'Zone')}
                    <TableHead className="bg-background text-right">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {woredas.data.length > 0 ? (
                    woredas.data.map((woreda) => (
                        <TableRow key={woreda.id} className="hover:bg-muted/50">
                            <TableCell className="font-medium">{woreda.id}</TableCell>
                            <TableCell className="font-semibold text-foreground">{woreda.name}</TableCell>
                            <TableCell>
                                <div>
                                    <div className="font-medium text-foreground">{woreda.zone?.name || '—'}</div>
                                    {woreda.zone?.region && (
                                        <div className="text-xs text-muted-foreground">{woreda.zone.region.name}</div>
                                    )}
                                </div>
                            </TableCell>
                            <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                    {hasPermission('woredas.show') && (
                                        <Button asChild size="sm" variant="ghost">
                                            <Link href={`/woredas/${woreda.id}`}>
                                                <Eye className="h-4 w-4" />
                                            </Link>
                                        </Button>
                                    )}
                                    {hasPermission('woredas.edit') && (
                                        <Button asChild size="sm" variant="ghost">
                                            <Link href={`/woredas/${woreda.id}/edit`}>
                                                <Edit className="h-4 w-4" />
                                            </Link>
                                        </Button>
                                    )}
                                    {hasPermission('woredas.destroy') && (
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => handleDeleteClick(woreda)}
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
                            No woredas found.
                            {hasPermission('woredas.create') && (
                                <Link href="/woredas/create" className="ml-1 text-primary underline">
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
                headTitle="Woredas"
                title="Woredas"
                description={`Manage your portfolio of ${woredaCount} woreda${woredaCount !== 1 ? 's' : ''}`}
                breadcrumbs={breadcrumbs}
                actions={headerActions}
                stats={statsSection}
                tableTitle="Woreda Inventory"
                tableDescription="Track administrative divisions and their parent zones"
                tableHeaderExtras={tableHeaderExtras}
                tableContainerClassName="max-h-[55vh]"
                pagination={
                    <InertiaPagination
                        from={woredas.from}
                        to={woredas.to}
                        total={woredaCount}
                        links={woredas.links as any}
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
                title="Delete Woreda"
                description="Are you sure you want to delete this woreda? This action cannot be undone."
                itemName={selectedWoreda?.name}
                onConfirm={handleDeleteConfirm}
                isLoading={isDeleting}
            />
        </>
    );
}

