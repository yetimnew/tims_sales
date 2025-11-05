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
import { usePermissions } from '@/hooks/use-permissions';
import { Link, router } from '@inertiajs/react';
import { type BreadcrumbItem } from '@/types';
import { Plus, Eye, Edit, Search, ArrowUpDown, Trash2, FileDown, Users, UserCheck, UserX, User, MapPin as MapPinIcon, Phone } from 'lucide-react';
import { InertiaPagination } from '@/components/ui/pagination';
import ReactPaginate from 'react-paginate';
import * as React from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Drivers',
        href: '/drivers',
    },
];

interface DriverData {
    id: number;
    driverid: string;
    name: string;
    sex: string;
    zone?: string;
    mobile?: string;
    hireddate?: string;
    status: string;
}

interface DriversIndexProps {
    drivers: {
        data: DriverData[];
        current_page: number;
        last_page: number;
        total: number;
        from: number;
        to: number;
        links: Array<{
            url: string | null;
            label: string;
            active: boolean;
        }>;
    };
    statistics: {
        total: number;
        active: number;
        inactive: number;
        male: number;
        female: number;
    };
}

const columns: Array<{ key: keyof DriverData | 'status'; label: string }> = [
    { key: 'name', label: 'Name' },
    { key: 'driverid', label: 'Driver ID' },
    { key: 'sex', label: 'Gender' },
    { key: 'zone', label: 'Location' },
    { key: 'mobile', label: 'Phone' },
    { key: 'hireddate', label: 'Hired Date' },
    { key: 'status', label: 'Status' },
];

export default function DriversIndex({ drivers, statistics }: DriversIndexProps) {
    const { hasPermission } = usePermissions();
    const [searchTerm, setSearchTerm] = React.useState('');
    const [sortColumn, setSortColumn] = React.useState<string>('name');
    const [sortDirection, setSortDirection] = React.useState<'asc' | 'desc'>('asc');

    const driverData = drivers?.data || [];
    const totalDrivers = drivers?.total || 0;
    const currentPage = drivers?.current_page || 1;
    const lastPage = drivers?.last_page || 1;

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'active':
                return <Badge variant="default">Active</Badge>;
            case 'inactive':
                return <Badge variant="secondary">Inactive</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    const getSexBadge = (sex: string) => {
        switch (sex) {
            case 'male':
                return <Badge variant="outline">👨 Male</Badge>;
            case 'female':
                return <Badge variant="outline">👩 Female</Badge>;
            default:
                return <Badge variant="outline">{sex}</Badge>;
        }
    };

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setSearchTerm(value);
        router.get('/drivers', { search: value, page: 1, sort: sortColumn, direction: sortDirection }, { preserveState: true });
    };

    const handleSort = (column: string) => {
        const newDirection = sortColumn === column && sortDirection === 'asc' ? 'desc' : 'asc';
        setSortColumn(column);
        setSortDirection(newDirection);
        router.get('/drivers', { sort: column, direction: newDirection, search: searchTerm }, { preserveState: true });
    };

    const renderHeaderCell = (column: string, label: string) => (
        <TableHead
            key={column}
            className="cursor-pointer select-none hover:bg-muted/70 transition-colors bg-background"
            onClick={() => handleSort(column)}
        >
            <div className="flex items-center gap-2">
                {label}
                <ArrowUpDown
                    size={14}
                    className={sortColumn === column ? 'text-primary' : 'text-muted-foreground opacity-50'}
                />
            </div>
        </TableHead>
    );

    const headerActions = (
        <>
            {hasPermission('drivers.export') && (
                <Button
                    variant="outline"
                    onClick={() => {
                        const params = new URLSearchParams({
                            search: searchTerm,
                            sort: sortColumn || 'name',
                            direction: sortDirection,
                        });
                        window.location.href = `/drivers/export/csv?${params.toString()}`;
                    }}
                >
                    <FileDown className="mr-2 h-4 w-4" />
                    Export CSV
                </Button>
            )}
            {hasPermission('drivers.create') && (
                <Button asChild>
                    <Link href="/drivers/create">
                        <Plus className="mr-2 h-4 w-4" />
                        Add Driver
                    </Link>
                </Button>
            )}
        </>
    );

    const statsSection = (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Drivers</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{statistics?.total ?? 0}</div>
                    <p className="text-xs text-muted-foreground">Workforce size</p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Active</CardTitle>
                    <UserCheck className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-green-600">{statistics?.active ?? 0}</div>
                    <p className="text-xs text-muted-foreground">Currently active</p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Inactive</CardTitle>
                    <UserX className="h-4 w-4 text-red-600" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-red-600">{statistics?.inactive ?? 0}</div>
                    <p className="text-xs text-muted-foreground">Currently inactive</p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Male</CardTitle>
                    <User className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-blue-600">{statistics?.male ?? 0}</div>
                    <p className="text-xs text-muted-foreground">👨 Male drivers</p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Female</CardTitle>
                    <User className="h-4 w-4 text-pink-600" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-pink-600">{statistics?.female ?? 0}</div>
                    <p className="text-xs text-muted-foreground">👩 Female drivers</p>
                </CardContent>
            </Card>
        </div>
    );

    const tableHeaderExtras = (
        <div className="relative w-64">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
                placeholder="Search drivers..."
                value={searchTerm}
                onChange={handleSearch}
                className="pl-10"
            />
        </div>
    );

    const tableContent = (
        <Table>
            <TableHeader>
                <TableRow className="sticky top-0 z-50 bg-background border-b">
                    {columns.map(({ key, label }) => renderHeaderCell(key, label))}
                    <TableHead className="text-right bg-background">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {driverData.length > 0 ? (
                    driverData.map((driver) => (
                        <TableRow key={driver.id} className="hover:bg-muted/50">
                            <TableCell className="font-medium">
                                {driver.name}
                            </TableCell>
                            <TableCell className="font-mono text-muted-foreground">
                                {driver.driverid}
                            </TableCell>
                            <TableCell>
                                {getSexBadge(driver.sex)}
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                                <div className="flex items-center gap-1">
                                    <MapPinIcon className="h-3 w-3" />
                                    {driver.zone || '-'}
                                </div>
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                                {driver.mobile ? (
                                    <div className="flex items-center gap-1">
                                        <Phone className="h-3 w-3" />
                                        {driver.mobile}
                                    </div>
                                ) : (
                                    '-'
                                )}
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                                {driver.hireddate
                                    ? new Date(driver.hireddate).toLocaleDateString()
                                    : '-'
                                }
                            </TableCell>
                            <TableCell>
                                {getStatusBadge(driver.status)}
                            </TableCell>
                            <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                    <Button asChild size="sm" variant="ghost">
                                        <Link href={`/drivers/${driver.id}`}>
                                            <Eye className="h-4 w-4" />
                                        </Link>
                                    </Button>
                                    {hasPermission('drivers.edit') && (
                                        <Button asChild size="sm" variant="ghost">
                                            <Link href={`/drivers/${driver.id}/edit`}>
                                                <Edit className="h-4 w-4" />
                                            </Link>
                                        </Button>
                                    )}
                                    {hasPermission('drivers.destroy') && (
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => {
                                                if (confirm('Are you sure you want to delete this driver?')) {
                                                    router.delete(`/drivers/${driver.id}`);
                                                }
                                            }}
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
                            No drivers found.
                            {hasPermission('drivers.create') && (
                                <Link href="/drivers/create" className="ml-1 text-primary underline">
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
        <ListPageLayout
            headTitle="Drivers"
            title="Drivers"
            description={`Manage your workforce of ${totalDrivers} driver${totalDrivers !== 1 ? 's' : ''}`}
            breadcrumbs={breadcrumbs}
            actions={headerActions}
            stats={statsSection}
            tableTitle="Driver Directory"
            tableDescription="Complete list of all drivers in your workforce"
            tableHeaderExtras={tableHeaderExtras}
            pagination={
                <div className="mt-4 flex items-center justify-between w-full">
                    <div className="text-sm text-muted-foreground">
                        Showing <span className="font-semibold text-foreground">{drivers.from}</span> to <span className="font-semibold text-foreground">{drivers.to}</span> of <span className="font-semibold text-foreground">{totalDrivers}</span> drivers
                    </div>
                    <div>
                        <ReactPaginate
                            pageCount={lastPage}
                            forcePage={currentPage - 1}
                            onPageChange={({ selected }) => {
                                router.get('/drivers', {
                                    page: selected + 1,
                                    search: searchTerm,
                                    sort: sortColumn,
                                    direction: sortDirection,
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
        </ListPageLayout>
    );
}
