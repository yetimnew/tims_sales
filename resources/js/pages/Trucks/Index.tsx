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
import { Head, Link, router } from '@inertiajs/react';
import { type BreadcrumbItem } from '@/types';
import { Plus, Eye, Edit, Trash2, Search, ArrowUpDown, ChevronLeft, ChevronRight } from 'lucide-react';
import * as React from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Trucks',
        href: '/trucks',
    },
];

interface TruckData {
    id: number;
    plate: string;
    chasisNumber?: string;
    engineNumber?: string;
    tyreSyze?: string;
    serviceIntervalKM?: number;
    purchasePrice?: number;
    productionDate?: string;
    serviceStartDate?: string;
    status: string;
    vehicleType: {
        id: number;
        name: string;
    };
    created_at: string;
}

interface TrucksIndexProps {
    trucks: {
        data: TruckData[];
        links: any[];
        meta: any;
    };
}

export default function TrucksIndex({ trucks }: TrucksIndexProps) {
    const [searchTerm, setSearchTerm] = React.useState('');
    const [sortColumn, setSortColumn] = React.useState<string | null>(null);
    const [sortDirection, setSortDirection] = React.useState<'asc' | 'desc'>('asc');

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'active':
                return <Badge variant="default">Active</Badge>;
            case 'inactive':
                return <Badge variant="secondary">Inactive</Badge>;
            case 'maintenance':
                return <Badge variant="outline">Maintenance</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    const truckData = trucks?.data || [];
    const totalTrucks = trucks?.meta?.total || 0;
    const currentPage = trucks?.meta?.current_page || 1;
    const perPage = trucks?.meta?.per_page || 10;
    const lastPage = trucks?.meta?.last_page || 1;

    // Handle search
    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setSearchTerm(value);
        router.get('/trucks', { search: value, page: 1 }, { preserveState: true });
    };

    // Handle sorting
    const handleSort = (column: string) => {
        const newDirection = sortColumn === column && sortDirection === 'asc' ? 'desc' : 'asc';
        setSortColumn(column);
        setSortDirection(newDirection);
        router.get('/trucks', { sort: column, direction: newDirection, search: searchTerm }, { preserveState: true });
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
            <Head title="Trucks" />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-hidden rounded-xl p-4">
                {/* Header Section */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Trucks</h1>
                        <p className="text-muted-foreground">
                            Manage your fleet of {totalTrucks} trucks
                        </p>
                    </div>
                    <Button asChild>
                        <Link href="/trucks/create">
                            <Plus className="mr-2 h-4 w-4" />
                            Add Truck
                        </Link>
                    </Button>
                </div>

                {/* Table Section */}
                <Card className="flex flex-1 flex-col overflow-hidden">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle>Fleet Overview</CardTitle>
                                <CardDescription>
                                    Complete list of all trucks in your fleet
                                </CardDescription>
                            </div>
                            <div className="relative w-64">
                                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search trucks..."
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
                                        <SortableHead column="plate">Plate</SortableHead>
                                        <SortableHead column="vehicleType">Vehicle Type</SortableHead>
                                        <SortableHead column="chasisNumber">Chassis #</SortableHead>
                                        <SortableHead column="engineNumber">Engine #</SortableHead>
                                        <SortableHead column="serviceIntervalKM">Service (KM)</SortableHead>
                                        <SortableHead column="purchasePrice">Purchase Price</SortableHead>
                                        <SortableHead column="status">Status</SortableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {truckData.length > 0 ? (
                                        truckData.map((truck) => (
                                            <TableRow key={truck.id} className="hover:bg-muted/50">
                                                <TableCell className="font-medium font-mono">
                                                    {truck.plate}
                                                </TableCell>
                                                <TableCell>
                                                    {truck.vehicleType?.name || 'Unknown Type'}
                                                </TableCell>
                                                <TableCell className="text-muted-foreground">
                                                    {truck.chasisNumber || '-'}
                                                </TableCell>
                                                <TableCell className="text-muted-foreground">
                                                    {truck.engineNumber || '-'}
                                                </TableCell>
                                                <TableCell className="text-muted-foreground">
                                                    {truck.serviceIntervalKM
                                                        ? `${truck.serviceIntervalKM.toLocaleString()} KM`
                                                        : '-'
                                                    }
                                                </TableCell>
                                                <TableCell className="font-medium">
                                                    {truck.purchasePrice
                                                        ? `$${truck.purchasePrice.toLocaleString()}`
                                                        : '-'
                                                    }
                                                </TableCell>
                                                <TableCell>
                                                    {getStatusBadge(truck.status)}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <Button asChild size="sm" variant="ghost">
                                                            <Link href={`/trucks/${truck.id}`}>
                                                                <Eye className="h-4 w-4" />
                                                            </Link>
                                                        </Button>
                                                        <Button asChild size="sm" variant="ghost">
                                                            <Link href={`/trucks/${truck.id}/edit`}>
                                                                <Edit className="h-4 w-4" />
                                                            </Link>
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            className="text-destructive hover:text-destructive"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={8} className="py-8 text-center text-muted-foreground">
                                                No trucks found.
                                                <Link href="/trucks/create" className="ml-1 text-primary underline">
                                                    Create one
                                                </Link>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Enhanced Pagination */}
                        {trucks.links && trucks.links.length > 3 && (
                            <div className="mt-6 flex items-center justify-between">
                                <div className="text-sm text-muted-foreground">
                                    Showing {(currentPage - 1) * perPage + 1} to{' '}
                                    {Math.min(currentPage * perPage, totalTrucks)} of {totalTrucks} trucks
                                </div>
                                <div className="flex gap-2">
                                    {/* Previous Button */}
                                    {currentPage > 1 && (
                                        <Button asChild variant="outline" size="sm">
                                            <Link href={trucks.links[0].url || '#'}>
                                                <ChevronLeft className="mr-1 h-4 w-4" />
                                                Previous
                                            </Link>
                                        </Button>
                                    )}

                                    {/* Page Numbers */}
                                    {trucks.links.map((link, index) => {
                                        // Skip first (prev) and last (next) links
                                        if (index === 0 || index === trucks.links.length - 1) {
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
                                            <Link href={trucks.links[trucks.links.length - 1].url || '#'}>
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
