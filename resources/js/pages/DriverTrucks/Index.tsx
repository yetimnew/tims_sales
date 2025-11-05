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
import { Plus, Eye, Edit, Search, ArrowUpDown, Trash2, FileDown, Truck, User, UserCheck, UserX } from 'lucide-react';
import { InertiaPagination } from '@/components/ui/pagination';
import * as React from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Driver-Truck Assignments',
        href: '/driver-trucks',
    },
];

interface DriverTruckData {
    id: number;
    driver: {
        id: number;
        name: string;
        driverid: string;
    };
    truck: {
        id: number;
        plate: string;
    };
    assigned_at?: string;
    status: string;
}

interface DriverTrucksIndexProps {
    driverTrucks: {
        data: DriverTruckData[];
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
}

const columns: Array<{ key: string; label: string }> = [
    { key: 'driver', label: 'Driver' },
    { key: 'truck', label: 'Truck' },
    { key: 'assigned_at', label: 'Assigned Date' },
    { key: 'status', label: 'Status' },
];

export default function DriverTrucksIndex({ driverTrucks }: DriverTrucksIndexProps) {
    const { hasPermission } = usePermissions();
    const [searchTerm, setSearchTerm] = React.useState('');
    const [sortColumn, setSortColumn] = React.useState<string>('assigned_at');
    const [sortDirection, setSortDirection] = React.useState<'asc' | 'desc'>('asc');

    const totalAssignments = driverTrucks?.total || 0;
    const currentPage = driverTrucks?.current_page || 1;
    const lastPage = driverTrucks?.last_page || 1;

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setSearchTerm(value);
        router.get('/driver-trucks', { search: value, page: 1, sort: sortColumn, direction: sortDirection }, { preserveState: true });
    };

    const handleSort = (column: string) => {
        const newDirection = sortColumn === column && sortDirection === 'asc' ? 'desc' : 'asc';
        setSortColumn(column);
        setSortDirection(newDirection);
        router.get('/driver-trucks', { sort: column, direction: newDirection, search: searchTerm }, { preserveState: true });
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
            {hasPermission('driver-trucks.create') && (
                <Button asChild>
                    <Link href="/driver-trucks/create">
                        <Plus className="mr-2 h-4 w-4" />
                        Assign Driver to Truck
                    </Link>
                </Button>
            )}
        </>
    );

    const statsSection = (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Assignments</CardTitle>
                    <UserCheck className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-blue-600">{totalAssignments}</div>
                    <p className="text-xs text-muted-foreground">Driver-Truck pairs</p>
                </CardContent>
            </Card>
        </div>
    );

    const tableHeaderExtras = (
        <div className="relative w-64">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
                placeholder="Search assignments..."
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
                {driverTrucks?.data && driverTrucks.data.length > 0 ? (
                    driverTrucks.data.map((assignment) => (
                        <TableRow key={assignment.id} className="hover:bg-muted/50">
                            <TableCell className="font-medium">
                                {assignment.driver.name} ({assignment.driver.driverid})
                            </TableCell>
                            <TableCell className="font-mono text-muted-foreground">
                                {assignment.truck.plate}
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                                {assignment.assigned_at
                                    ? new Date(assignment.assigned_at).toLocaleDateString()
                                    : '-'}
                            </TableCell>
                            <TableCell>
                                <Badge variant="outline">{assignment.status}</Badge>
                            </TableCell>
                            <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                    <Button asChild size="sm" variant="ghost">
                                        <Link href={`/driver-trucks/${assignment.id}`}>
                                            <Eye className="h-4 w-4" />
                                        </Link>
                                    </Button>
                                    {hasPermission('driver-trucks.edit') && (
                                        <Button asChild size="sm" variant="ghost">
                                            <Link href={`/driver-trucks/${assignment.id}/edit`}>
                                                <Edit className="h-4 w-4" />
                                            </Link>
                                        </Button>
                                    )}
                                    {hasPermission('driver-trucks.destroy') && (
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => {
                                                if (confirm('Are you sure you want to delete this assignment?')) {
                                                    router.delete(`/driver-trucks/${assignment.id}`);
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
                        <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                            No assignments found.
                            {hasPermission('driver-trucks.create') && (
                                <Link href="/driver-trucks/create" className="ml-1 text-primary underline">
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
            headTitle="Driver-Truck Assignments"
            title="Driver-Truck Assignments"
            description={`Manage all driver-truck assignments. Total: ${totalAssignments}`}
            breadcrumbs={breadcrumbs}
            actions={headerActions}
            stats={statsSection}
            tableTitle="Assignments"
            tableDescription="List of all driver-truck assignments"
            tableHeaderExtras={tableHeaderExtras}
            pagination={
                <InertiaPagination
                    from={driverTrucks.from}
                    to={driverTrucks.to}
                    total={totalAssignments}
                    links={driverTrucks.links}
                    currentPage={currentPage}
                    lastPage={lastPage}
                    className="mt-0 p-4 border-t bg-muted/30 flex-shrink-0"
                />
            }
        >
            {tableContent}
        </ListPageLayout>
    );
}
