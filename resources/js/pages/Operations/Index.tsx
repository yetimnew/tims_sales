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
import { Plus, Eye, Edit, Trash2, Search, ArrowUpDown, FileDown, CheckCircle, XCircle, Square } from 'lucide-react';
import ReactPaginate from 'react-paginate';
import * as React from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Operations',
        href: '/operations',
    },
];

interface OperationData {
    id: number;
    operationid: string;
    customer?: { id: number; name: string };
    description?: string;
    status: string;
    volume?: number;
    km?: number;
    startdate?: string;
    enddate?: string;
    closed?: boolean;
    created_at?: string;
}

interface OperationsIndexProps {
    operations: {
        data: OperationData[];
        current_page: number;
        last_page: number;
        total: number;
        from: number;
        to: number;
        links?: Array<{
            url: string | null;
            label: string;
            active: boolean;
        }>;
    };
    statistics?: {
        total: number;
        active: number;
        inactive: number;
        closed: number;
    };
    totalCount?: number;
}

const columns: Array<{ key: keyof OperationData | 'status'; label: string }> = [
    { key: 'operationid', label: 'Operation ID' },
    { key: 'customer', label: 'Customer' },
    { key: 'status', label: 'Status' },
    { key: 'startdate', label: 'Start Date' },
    { key: 'volume', label: 'Volume (MT)' },
    { key: 'km', label: 'Distance (KM)' },
];

export default function OperationsIndex({ operations, statistics, totalCount }: OperationsIndexProps) {
    const { hasPermission } = usePermissions();
    const [searchTerm, setSearchTerm] = React.useState('');
    const [sortColumn, setSortColumn] = React.useState<string>('operationid');
    const [sortDirection, setSortDirection] = React.useState<'asc' | 'desc'>('asc');

    const operationData = operations?.data || [];
    const opCount = totalCount || operations?.total || 0;
    const currentPage = operations?.current_page || 1;
    const lastPage = operations?.last_page || 1;

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'active':
                return <Badge variant="default">Active</Badge>;
            case 'inactive':
                return <Badge variant="secondary">Inactive</Badge>;
            case 'closed':
                return <Badge variant="outline">Closed</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setSearchTerm(value);
        router.get('/operations', { search: value, page: 1, sort: sortColumn, direction: sortDirection }, { preserveState: true });
    };

    const handleSort = (column: string) => {
        const newDirection = sortColumn === column && sortDirection === 'asc' ? 'desc' : 'asc';
        setSortColumn(column);
        setSortDirection(newDirection);
        router.get('/operations', { sort: column, direction: newDirection, search: searchTerm }, { preserveState: true });
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
            {hasPermission('operations.export') && (
                <Button
                    variant="outline"
                    onClick={() => {
                        const params = new URLSearchParams({
                            search: searchTerm,
                            sort: sortColumn || 'operationid',
                            direction: sortDirection,
                        });
                        window.location.href = `/operations/export/csv?${params.toString()}`;
                    }}
                >
                    <FileDown className="mr-2 h-4 w-4" />
                    Export CSV
                </Button>
            )}
            {hasPermission('operations.create') && (
                <Button asChild>
                    <Link href="/operations/create">
                        <Plus className="mr-2 h-4 w-4" />
                        Add Operation
                    </Link>
                </Button>
            )}
        </>
    );

    const statsSection = (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Operations</CardTitle>
                    <Square className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{statistics?.total ?? opCount}</div>
                    <p className="text-xs text-muted-foreground">All operations</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Active</CardTitle>
                    <CheckCircle className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-green-600">{statistics?.active ?? 0}</div>
                    <p className="text-xs text-muted-foreground">Currently active</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Inactive</CardTitle>
                    <XCircle className="h-4 w-4 text-red-600" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-red-600">{statistics?.inactive ?? 0}</div>
                    <p className="text-xs text-muted-foreground">Currently inactive</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Closed</CardTitle>
                    <Square className="h-4 w-4 text-gray-600" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-gray-600">{statistics?.closed ?? 0}</div>
                    <p className="text-xs text-muted-foreground">Closed operations</p>
                </CardContent>
            </Card>
        </div>
    );

    const tableHeaderExtras = (
        <div className="relative w-64">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
                placeholder="Search operations..."
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
                {operationData.length > 0 ? (
                    operationData.map((op) => (
                        <TableRow key={op.id} className="hover:bg-muted/50">
                            <TableCell className="font-medium">{op.operationid}</TableCell>
                            <TableCell>{op.customer?.name || '-'}</TableCell>
                            <TableCell>{getStatusBadge(op.status)}</TableCell>
                            <TableCell>{op.startdate ? new Date(op.startdate).toLocaleDateString() : '-'}</TableCell>
                            <TableCell>{op.volume ? Number(op.volume).toFixed(2) : '-'}</TableCell>
                            <TableCell>{op.km ? Number(op.km).toFixed(2) : '-'}</TableCell>
                            <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                    <Button asChild size="sm" variant="ghost">
                                        <Link href={`/operations/${op.id}`}>
                                            <Eye className="h-4 w-4" />
                                        </Link>
                                    </Button>
                                    {hasPermission('operations.edit') && (
                                        <Button asChild size="sm" variant="ghost">
                                            <Link href={`/operations/${op.id}/edit`}>
                                                <Edit className="h-4 w-4" />
                                            </Link>
                                        </Button>
                                    )}
                                    {hasPermission('operations.destroy') && (
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => {
                                                if (confirm('Are you sure you want to delete this operation?')) {
                                                    router.delete(`/operations/${op.id}`);
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
                            No operations found.
                            {hasPermission('operations.create') && (
                                <Link href="/operations/create" className="ml-1 text-primary underline">
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
            headTitle="Operations"
            title="Operations"
            description={`Manage your operations (${opCount})`}
            breadcrumbs={breadcrumbs}
            actions={headerActions}
            stats={statsSection}
            tableTitle="Operations Directory"
            tableDescription="Complete list of all operations"
            tableHeaderExtras={tableHeaderExtras}
            pagination={
                <div className="mt-4 flex items-center justify-between w-full">
                    <div className="text-sm text-muted-foreground">
                        Showing <span className="font-semibold text-foreground">{operations.from}</span> to <span className="font-semibold text-foreground">{operations.to}</span> of <span className="font-semibold text-foreground">{opCount}</span> operations
                    </div>
                    <div>
                        <ReactPaginate
                            pageCount={lastPage}
                            forcePage={currentPage - 1}
                            onPageChange={({ selected }) => {
                                router.get('/operations', {
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
