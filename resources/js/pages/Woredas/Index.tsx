testimport * as React from 'react';import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { Link, router } from '@inertiajs/react';import { Button } from '@/components/ui/button';

import { type BreadcrumbItem } from '@/types';import { Input } from '@/components/ui/input';

import { usePermissions } from '@/hooks/use-permissions';import {

import ListPageLayout from '@/components/layouts/list-page-layout';    Table,

import { DeleteConfirmationDialog } from '@/components/delete-confirmation-dialog';    TableBody,

import { InertiaPagination } from '@/components/ui/pagination';    TableCell,

import { Button } from '@/components/ui/button';    TableHead,

import { Input } from '@/components/ui/input';    TableHeader,

import {    TableRow,

    Card,} from '@/components/ui/table';

    CardContent,import ListPageLayout from '@/components/layouts/list-page-layout';

    CardHeader,import { DeleteConfirmationDialog } from '@/components/delete-confirmation-dialog';

    CardTitle,import { usePermissions } from '@/hooks/use-permissions';

} from '@/components/ui/card';import { Link, router } from '@inertiajs/react';

import {import { type BreadcrumbItem } from '@/types';

    Table,import {

    TableBody,    Plus,

    TableCell,    Eye,

    TableHead,    Edit,

    TableHeader,    Trash2,

    TableRow,    Search,

} from '@/components/ui/table';    ArrowUpDown,

import {    );

    AlertTriangle,                <Button asChild>

    ArrowUpDown,                    <Link href="/woredas/create">

    Edit,                        <Plus className="mr-2 h-4 w-4" />

    Eye,                        Add Woreda

    FileDown,                    </Link>

    Globe,                </Button>

    Layers,            )}

    MapPin,        </>

    Plus,    );

    Search,

    Trash2,    const statsSection = (

} from 'lucide-react';        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">

            <Card>

const breadcrumbs: BreadcrumbItem[] = [                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">

    {                    <CardTitle className="text-sm font-medium">Total Woredas</CardTitle>

        title: 'Woredas',                    <MapPin className="h-4 w-4 text-blue-600" />

        href: '/woredas',                </CardHeader>

    },                <CardContent>

];                    <div className="text-2xl font-bold text-blue-600">{woredaCount}</div>

                    <p className="text-xs text-muted-foreground">Active administrative areas</p>

interface WoredaData {                </CardContent>

    id: number;            </Card>

    name: string;            <Card>

    zone?: {                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">

        name: string;                    <CardTitle className="text-sm font-medium">Zones Covered</CardTitle>

        region?: {                    <Layers className="h-4 w-4 text-emerald-600" />

            name: string;                </CardHeader>

        };                <CardContent>

    };                    <div className="text-2xl font-bold text-emerald-600">{uniqueZones.length}</div>

}                    <p className="text-xs text-muted-foreground">Distinct zones represented</p>

                </CardContent>

interface WoredasIndexProps {            </Card>

    woredas: {            <Card>

        data: WoredaData[];                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">

        current_page: number;                    <CardTitle className="text-sm font-medium">Regions</CardTitle>

        last_page: number;                    <Globe className="h-4 w-4 text-indigo-600" />

        total: number;                </CardHeader>

        from: number;                <CardContent>

        to: number;                    <div className="text-2xl font-bold text-indigo-600">{uniqueRegions.length}</div>

        links?: {                    <p className="text-xs text-muted-foreground">Regional distribution snapshot</p>

            first?: string;                </CardContent>

            last?: string;            </Card>

            prev?: string;            <Card>

            next?: string;                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">

        };                    <CardTitle className="text-sm font-medium">Unlinked</CardTitle>

    };                    <AlertTriangle className="h-4 w-4 text-amber-600" />

    totalCount?: number;                </CardHeader>

}                <CardContent>

                    <div className="text-2xl font-bold text-amber-600">{withoutZone}</div>

export default function WoredasIndex({ woredas, totalCount }: WoredasIndexProps) {                    <p className="text-xs text-muted-foreground">Woredas missing zone mapping</p>

    const { hasPermission } = usePermissions();                </CardContent>

    const [searchTerm, setSearchTerm] = React.useState('');            </Card>

    const [sortBy, setSortBy] = React.useState('name');        </div>

    const [sortDirection, setSortDirection] = React.useState<'asc' | 'desc'>('asc');    );

    const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);

    const [selectedWoreda, setSelectedWoreda] = React.useState<WoredaData | null>(null);    const tableHeaderExtras = (

    const [isDeleting, setIsDeleting] = React.useState(false);        <div className="relative w-64">

            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />

    const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {            <Input

        const value = event.target.value;                placeholder="Search woredas..."

        setSearchTerm(value);                value={searchTerm}

                onChange={handleSearch}

        router.get(                className="pl-10"

            '/woredas',            />

            { search: value, sort: sortBy, direction: sortDirection },        </div>

            { preserveState: true, replace: false },    );

        );

    };    const renderHeaderCell = (column: string, label: string) => (

        <TableHead

    const handleSort = (column: string) => {            key={column}

        let direction: 'asc' | 'desc' = 'asc';            className="bg-background cursor-pointer select-none transition-colors hover:bg-muted/70"

            onClick={() => handleSort(column)}

        if (sortBy === column && sortDirection === 'asc') {        >

            direction = 'desc';            <div className="flex items-center gap-2">

        }                {label}

                <ArrowUpDown

        setSortBy(column);                    size={14}

        setSortDirection(direction);                    className={sortBy === column ? 'text-primary' : 'text-muted-foreground opacity-50'}

                    style={sortBy === column && sortDirection === 'desc' ? { transform: 'rotate(180deg)' } : undefined}

        router.get(                />

            '/woredas',            </div>

            { search: searchTerm, sort: column, direction },        </TableHead>

            { preserveState: true, replace: false },    );

        );

    };    const tableContent = (

        <Table>

    const handleDeleteClick = (woreda: WoredaData) => {            <TableHeader>

        setSelectedWoreda(woreda);                <TableRow className="sticky top-0 z-20 border-b bg-background">

        setDeleteDialogOpen(true);                    {renderHeaderCell('id', 'ID')}

    };                    {renderHeaderCell('name', 'Name')}

                    {renderHeaderCell('zone_id', 'Zone')}

    const handleDeleteConfirm = () => {                    <TableHead className="bg-background text-right">Actions</TableHead>

        if (!selectedWoreda) return;                </TableRow>

            </TableHeader>

        setIsDeleting(true);            <TableBody>

        router.delete(`/woredas/${selectedWoreda.id}`, {                {woredas.data.length > 0 ? (

            onSuccess: () => {                    woredas.data.map((woreda) => (

                setDeleteDialogOpen(false);                        <TableRow key={woreda.id} className="hover:bg-muted/50">

                setSelectedWoreda(null);                            <TableCell className="font-medium">{woreda.id}</TableCell>

                setIsDeleting(false);                            <TableCell className="font-semibold text-foreground">{woreda.name}</TableCell>

            },                            <TableCell>

            onError: () => {                                <div>

                setIsDeleting(false);                                    <div className="font-medium text-foreground">{woreda.zone?.name || '—'}</div>

            },                                    {woreda.zone?.region && (

        });                                        <div className="text-xs text-muted-foreground">

    };                                            {woreda.zone.region.name}

                                        </div>

    const woredaCount = totalCount || woredas?.total || 0;                                    )}

    const currentPage = woredas?.current_page || 1;                                </div>

    const totalPages = woredas?.last_page || 1;                            </TableCell>

    const uniqueZones = Array.from(new Set(woredas?.data?.map((item) => item.zone?.name).filter(Boolean))) as string[];                            <TableCell className="text-right">

    const uniqueRegions = Array.from(                                <div className="flex justify-end gap-2">

        new Set(woredas?.data?.map((item) => item.zone?.region?.name).filter(Boolean)),                                    {hasPermission('woredas.show') && (

    ) as string[];                                        <Button asChild size="sm" variant="ghost">

    const withoutZone = woredas?.data?.filter((item) => !item.zone?.name).length || 0;                                            <Link href={`/woredas/${woreda.id}`}>

                                                <Eye className="h-4 w-4" />

    const headerActions = (                                            </Link>

        <>                                        </Button>

            {hasPermission('woredas.export') && (                                    )}

                <Button                                    {hasPermission('woredas.edit') && (

                    variant="outline"                                        <Button asChild size="sm" variant="ghost">

                    onClick={() => {                                            <Link href={`/woredas/${woreda.id}/edit`}>

                        const params = new URLSearchParams({                                                <Edit className="h-4 w-4" />

                            search: searchTerm,                                            </Link>

                            sort: sortBy,                                        </Button>

                            direction: sortDirection,                                    )}

                        });                                    {hasPermission('woredas.destroy') && (

                        window.location.href = `/woredas/export?${params.toString()}`;                                        <Button

                    }}                                            size="sm"

                >                                            variant="ghost"

                    <FileDown className="mr-2 h-4 w-4" />                                            onClick={() => handleDeleteClick(woreda)}

                    Export CSV                                        >

                </Button>                                            <Trash2 className="h-4 w-4" />

            )}                                        </Button>

            {hasPermission('woredas.create') && (                                    )}

                <Button asChild>                                </div>

                    <Link href="/woredas/create">                            </TableCell>

                        <Plus className="mr-2 h-4 w-4" />                        </TableRow>

                        Add Woreda                    ))

                    </Link>                ) : (

                </Button>                    <TableRow>

            )}                        <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">

        </>                            No woredas found.

    );                            {hasPermission('woredas.create') && (

                                <Link href="/woredas/create" className="ml-1 text-primary underline">

    const statsSection = (                                    Create one

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">                                </Link>

            <Card>                            )}

                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">                        </TableCell>

                    <CardTitle className="text-sm font-medium">Total Woredas</CardTitle>                    </TableRow>

                    <MapPin className="h-4 w-4 text-blue-600" />                )}

                </CardHeader>            </TableBody>

                <CardContent>        </Table>

                    <div className="text-2xl font-bold text-blue-600">{woredaCount}</div>    );

                    <p className="text-xs text-muted-foreground">Active administrative areas</p>

                </CardContent>    return (

            </Card>        <>

            <Card>            <ListPageLayout

                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">                headTitle="Woredas"

                    <CardTitle className="text-sm font-medium">Zones Covered</CardTitle>                title="Woredas"

                    <Layers className="h-4 w-4 text-emerald-600" />                description={`Manage your portfolio of ${woredaCount} woreda${woredaCount !== 1 ? 's' : ''}`}

                </CardHeader>                breadcrumbs={breadcrumbs}

                <CardContent>                actions={headerActions}

                    <div className="text-2xl font-bold text-emerald-600">{uniqueZones.length}</div>                stats={statsSection}

                    <p className="text-xs text-muted-foreground">Distinct zones represented</p>                tableTitle="Woreda Inventory"

                </CardContent>                tableDescription="Track administrative divisions and their parent zones"

            </Card>                tableHeaderExtras={tableHeaderExtras}

            <Card>                tableContainerClassName="max-h-[55vh]"

                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">                pagination={

                    <CardTitle className="text-sm font-medium">Regions</CardTitle>                    <InertiaPagination

                    <Globe className="h-4 w-4 text-indigo-600" />                        from={woredas.from}

                </CardHeader>                        to={woredas.to}

                <CardContent>                        total={woredaCount}

                    <div className="text-2xl font-bold text-indigo-600">{uniqueRegions.length}</div>                        links={woredas.links as any}

                    <p className="text-xs text-muted-foreground">Regional distribution snapshot</p>                        currentPage={currentPage}

                </CardContent>                        lastPage={totalPages}

            </Card>                        className="px-6 pb-6 pt-4"

            <Card>                    />

                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">                }

                    <CardTitle className="text-sm font-medium">Unlinked</CardTitle>            >

                    <AlertTriangle className="h-4 w-4 text-amber-600" />                {tableContent}

                </CardHeader>            </ListPageLayout>

                <CardContent>

                    <div className="text-2xl font-bold text-amber-600">{withoutZone}</div>            <DeleteConfirmationDialog

                    <p className="text-xs text-muted-foreground">Woredas missing zone mapping</p>                open={deleteDialogOpen}

                </CardContent>                onOpenChange={setDeleteDialogOpen}

            </Card>                title="Delete Woreda"

        </div>                description="Are you sure you want to delete this woreda? This action cannot be undone."

    );                itemName={selectedWoreda?.name}

                onConfirm={handleDeleteConfirm}

    const tableHeaderExtras = (                isLoading={isDeleting}

        <div className="relative w-64">            />

            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />        </>

            <Input                            </div>

                placeholder="Search woredas..."                        </div>

                value={searchTerm}                    </CardHeader>

                onChange={handleSearch}                    <CardContent className="flex-1 overflow-auto">

                className="pl-10"                        <div className="rounded-lg border">

            />                            <Table>

        </div>                                <TableHeader>

    );                                    <TableRow className="bg-muted/50">

                                        <TableHead

    const renderHeaderCell = (column: string, label: string) => (                                            className="cursor-pointer select-none hover:bg-muted/70 transition-colors"

        <TableHead                                            onClick={() => handleSort('id')}

            key={column}                                        >

            className="bg-background cursor-pointer select-none transition-colors hover:bg-muted/70"                                            <div className="flex items-center">

            onClick={() => handleSort(column)}                                                ID <SortIcon column="id" />

        >                                            </div>

            <div className="flex items-center gap-2">                                        </TableHead>

                {label}                                        <TableHead

                <ArrowUpDown                                            className="cursor-pointer select-none hover:bg-muted/70 transition-colors"

                    size={14}                                            onClick={() => handleSort('name')}

                    className={sortBy === column ? 'text-primary' : 'text-muted-foreground opacity-50'}                                        >

                    style={sortBy === column && sortDirection === 'desc' ? { transform: 'rotate(180deg)' } : undefined}                                            <div className="flex items-center">

                />                                                Name <SortIcon column="name" />

            </div>                                            </div>

        </TableHead>                                        </TableHead>

    );                                        <TableHead

                                            className="cursor-pointer select-none hover:bg-muted/70 transition-colors"

    const tableContent = (                                            onClick={() => handleSort('zone_id')}

        <Table>                                        >

            <TableHeader>                                            <div className="flex items-center">

                <TableRow className="sticky top-0 z-20 border-b bg-background">                                                Zone <SortIcon column="zone_id" />

                    {renderHeaderCell('id', 'ID')}                                            </div>

                    {renderHeaderCell('name', 'Name')}                                        </TableHead>

                    {renderHeaderCell('zone_id', 'Zone')}                                        <TableHead>Actions</TableHead>

                    <TableHead className="bg-background text-right">Actions</TableHead>                                    </TableRow>

                </TableRow>                                </TableHeader>

            </TableHeader>                                <TableBody>

            <TableBody>                                    {woredas.data.length > 0 ? (

                {woredas.data.length > 0 ? (                                        woredas.data.map((woreda) => (

                    woredas.data.map((woreda) => (                                            <TableRow key={woreda.id}>

                        <TableRow key={woreda.id} className="hover:bg-muted/50">                                                <TableCell className="font-medium">{woreda.id}</TableCell>

                            <TableCell className="font-medium">{woreda.id}</TableCell>                                                <TableCell className="font-medium">{woreda.name}</TableCell>

                            <TableCell className="font-semibold text-foreground">{woreda.name}</TableCell>                                                <TableCell>

                            <TableCell>                                                    <div>

                                <div>                                                        <div className="font-medium">{woreda.zone?.name || 'N/A'}</div>

                                    <div className="font-medium text-foreground">{woreda.zone?.name || '—'}</div>                                                        {woreda.zone?.region && (

                                    {woreda.zone?.region && (                                                            <div className="text-sm text-muted-foreground">

                                        <div className="text-xs text-muted-foreground">{woreda.zone.region.name}</div>                                                                {woreda.zone.region.name}

                                    )}                                                            </div>

                                </div>                                                        )}

                            </TableCell>                                                    </div>

                            <TableCell className="text-right">                                                </TableCell>

                                <div className="flex justify-end gap-2">                                                <TableCell>

                                    {hasPermission('woredas.show') && (                                                    <div className="flex items-center space-x-2">

                                        <Button asChild size="sm" variant="ghost">                                                        {hasPermission('woredas.show') && (

                                            <Link href={`/woredas/${woreda.id}`}>                                                            <Link href={`/woredas/${woreda.id}`}>

                                                <Eye className="h-4 w-4" />                                                                <Button size="sm" variant="ghost">

                                            </Link>                                                                    <Eye className="h-4 w-4" />

                                        </Button>                                                                </Button>

                                    )}                                                            </Link>

                                    {hasPermission('woredas.edit') && (                                                        )}

                                        <Button asChild size="sm" variant="ghost">                                                        {hasPermission('woredas.edit') && (

                                            <Link href={`/woredas/${woreda.id}/edit`}>                                                            <Link href={`/woredas/${woreda.id}/edit`}>

                                                <Edit className="h-4 w-4" />                                                                <Button size="sm" variant="ghost">

                                            </Link>                                                                    <Edit className="h-4 w-4" />

                                        </Button>                                                                </Button>

                                    )}                                                            </Link>

                                    {hasPermission('woredas.destroy') && (                                                        )}

                                        <Button                                                        {hasPermission('woredas.destroy') && (

                                            size="sm"                                                            <Button

                                            variant="ghost"                                                                size="sm"

                                            onClick={() => handleDeleteClick(woreda)}                                                                variant="ghost"

                                        >                                                                onClick={() => handleDeleteClick(woreda)}

                                            <Trash2 className="h-4 w-4" />                                                            >

                                        </Button>                                                                <Trash2 className="h-4 w-4" />

                                    )}                                                            </Button>

                                </div>                                                        )}

                            </TableCell>                                                    </div>

                        </TableRow>                                                </TableCell>

                    ))                                            </TableRow>

                ) : (                                        ))

                    <TableRow>                                    ) : (

                        <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">                                        <TableRow>

                            No woredas found.                                            <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">

                            {hasPermission('woredas.create') && (                                                No woredas found.

                                <Link href="/woredas/create" className="ml-1 text-primary underline">                                                {hasPermission('woredas.create') && (

                                    Create one                                                    <Link href="/woredas/create" className="ml-1 text-primary underline">

                                </Link>                                                        Create one

                            )}                                                    </Link>

                        </TableCell>                                                )}

                    </TableRow>                                            </TableCell>

                )}                                        </TableRow>

            </TableBody>                                    )}

        </Table>                                </TableBody>

    );                            </Table>

                        </div>

    return (

        <>                        {/* Pagination */}

            <ListPageLayout                        <InertiaPagination

                headTitle="Woredas"                          from={woredas.from}

                title="Woredas"                          to={woredas.to}

                description={`Manage your portfolio of ${woredaCount} woreda${woredaCount !== 1 ? 's' : ''}`}                          total={woredaCount}

                breadcrumbs={breadcrumbs}                          links={(woredas as any).links as any}

                actions={headerActions}                          currentPage={currentPage}

                stats={statsSection}                          lastPage={totalPages}

                tableTitle="Woreda Inventory"                        />

                tableDescription="Track administrative divisions and their parent zones"                    </CardContent>

                tableHeaderExtras={tableHeaderExtras}                </Card>

                tableContainerClassName="max-h-[55vh]"            </div>

                pagination={

                    <InertiaPagination            {/* Delete Confirmation Dialog */}

                        from={woredas.from}            <DeleteConfirmationDialog

                        to={woredas.to}                open={deleteDialogOpen}

                        total={woredaCount}                onOpenChange={setDeleteDialogOpen}

                        links={woredas.links as any}                title="Delete Woreda"

                        currentPage={currentPage}                description="Are you sure you want to delete this woreda? This action cannot be undone."

                        lastPage={totalPages}                itemName={selectedWoreda?.name}

                        className="px-6 pb-6 pt-4"                onConfirm={handleDeleteConfirm}

                    />                isLoading={isDeleting}

                }            />

            >        </AppLayout>

                {tableContent}    );

            </ListPageLayout>}


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
