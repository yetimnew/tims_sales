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
import { usePermissions } from '@/hooks/use-permissions';
import { Head, Link, router } from '@inertiajs/react';
import { type BreadcrumbItem } from '@/types';
import { Plus, Eye, Edit, MapPin, Phone, Search, ArrowUpDown, ChevronLeft, ChevronRight, Trash2, FileDown } from 'lucide-react';
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
    birthdate?: string;
    zone?: string;
    woreda?: string;
    kebele?: string;
    housenumber?: string;
    mobile?: string;
    hireddate?: string;
    status: string;
    created_at: string;
}

interface DriversIndexProps {
    drivers: {
        data: DriverData[];
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

export default function DriversIndex({ drivers }: DriversIndexProps) {
    const { hasPermission } = usePermissions();
    const [searchTerm, setSearchTerm] = React.useState('');
    const [sortColumn, setSortColumn] = React.useState<string | null>(null);
    const [sortDirection, setSortDirection] = React.useState<'asc' | 'desc'>('asc');

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

    const driverData = drivers?.data || [];
    const totalDrivers = drivers?.total || 0;
    const currentPage = drivers?.current_page || 1;
    const perPage = drivers?.per_page || 10;
    const lastPage = drivers?.last_page || 1;

    // Handle search
    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setSearchTerm(value);
        router.get('/drivers', { search: value, page: 1 }, { preserveState: true });
    };

    // Handle sorting
    const handleSort = (column: string) => {
        const newDirection = sortColumn === column && sortDirection === 'asc' ? 'desc' : 'asc';
        setSortColumn(column);
        setSortDirection(newDirection);
        router.get('/drivers', { sort: column, direction: newDirection, search: searchTerm }, { preserveState: true });
    };

    // Sort icon component
    const SortIcon = ({ column, isActive }: { column: string; isActive: boolean }) => (
        <ArrowUpDown
            className={`ml-2 inline h-4 w-4 ${
                isActive ? 'text-primary' : 'text-muted-foreground opacity-50'
            }`}
        />
    );

    // Sortable header cell
    const SortableHead = ({
        column,
        children,
    }: {
        column: string;
        children: React.ReactNode;
    }) => (
        <TableHead
            className="cursor-pointer select-none hover:bg-muted/70 transition-colors"
            onClick={() => handleSort(column)}
        >
            <div className="flex items-center">
                {children}
                <SortIcon column={column} isActive={sortColumn === column} />
            </div>
        </TableHead>
    );

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Drivers" />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-hidden rounded-xl p-4">
                {/* Header Section */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Drivers</h1>
                        <p className="text-muted-foreground">
                            Manage your workforce of {totalDrivers} drivers
                        </p>
                    </div>
                    <div className="flex gap-2">
                        {hasPermission('drivers.export') && (
                            <Button variant="outline" onClick={() => {
                                const params = new URLSearchParams({
                                    search: searchTerm,
                                    sort: sortColumn || 'name',
                                    direction: sortDirection,
                                });
                                window.location.href = `/drivers/export/csv?${params.toString()}`;
                            }}>
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
                    </div>
                </div>

                {/* Table Section */}
                <Card className="flex flex-1 flex-col overflow-hidden">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle>Driver Directory</CardTitle>
                                <CardDescription>
                                    Complete list of all drivers in your workforce
                                </CardDescription>
                            </div>
                            <div className="relative w-64">
                                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search drivers..."
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
                                        <SortableHead column="name">Name</SortableHead>
                                        <SortableHead column="driverid">Driver ID</SortableHead>
                                        <SortableHead column="sex">Gender</SortableHead>
                                        <SortableHead column="zone">Location</SortableHead>
                                        <SortableHead column="mobile">Phone</SortableHead>
                                        <SortableHead column="hireddate">Hired Date</SortableHead>
                                        <SortableHead column="status">Status</SortableHead>
                                        <TableHead className="text-right">Actions</TableHead>
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
                                                        <MapPin className="h-3 w-3" />
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
                        </div>

                        {/* Enhanced Pagination */}
                        {drivers.last_page > 1 && (
                            <div className="mt-6 flex items-center justify-between">
                                <div className="text-sm text-muted-foreground">
                                    Showing {drivers.from || 1} to {drivers.to || totalDrivers} of {totalDrivers} drivers
                                </div>
                                <div className="flex gap-2">
                                    {/* Previous Button */}
                                    {currentPage > 1 && (
                                        <Button asChild variant="outline" size="sm">
                                            <Link href={drivers.links[0].url || '#'}>
                                                <ChevronLeft className="mr-1 h-4 w-4" />
                                                Previous
                                            </Link>
                                        </Button>
                                    )}

                                    {/* Page Numbers */}
                                    {drivers.links.map((link, index) => {
                                        // Skip first (prev) and last (next) links
                                        if (index === 0 || index === drivers.links.length - 1) {
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
                                            <Link href={drivers.links[drivers.links.length - 1].url || '#'}>
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
        </AppLayout>
    );
}



