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
    customer?: { id: number; name: string } | null;
    description?: string | null;
    status: string;
    volume?: number | null;
    km?: number | null;
    startdate?: string | null;
    enddate?: string | null;
    closed?: boolean;
    created_at?: string | null;
    deliveredVolume?: number | null;
    remainingVolume?: number | null;
    volumeCompletion?: number | null;
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

type ColumnKey = 'operationid' | 'customer' | 'status' | 'startdate' | 'volume' | 'km' | 'tonnageProgress';

const columns: Array<{ key: ColumnKey; label: string; sortable?: boolean }> = [
    { key: 'operationid', label: 'Operation ID' },
    { key: 'customer', label: 'Customer' },
    { key: 'status', label: 'Status' },
    { key: 'startdate', label: 'Start Date' },
    { key: 'volume', label: 'Volume (MT)' },
    { key: 'km', label: 'Distance (KM)' },
    { key: 'tonnageProgress', label: 'Uplift Progress', sortable: false },
];

const formatNumberValue = (value?: number | null, fractionDigits = 2) => {
    if (value === null || value === undefined || Number.isNaN(Number(value))) {
        return '-';
    }

    return Number(value).toLocaleString('en-US', {
        minimumFractionDigits: fractionDigits,
        maximumFractionDigits: fractionDigits,
    });
};

const clampPercentage = (value: number) => Math.max(0, Math.min(value, 100));

const renderTonnageProgress = (operation: OperationData) => {
    const planned = operation.volume ?? null;
    const delivered = operation.deliveredVolume ?? null;
    const remaining = operation.remainingVolume ?? null;
    const completion = operation.volumeCompletion ?? null;
    const progressWidth = completion !== null ? `${clampPercentage(completion)}%` : '0%';

    if ((planned === null || planned === 0) && (delivered === null || delivered === 0)) {
        return <span className="text-muted-foreground">-</span>;
    }

    return (
        <div className="min-w-[200px] space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Delivered</span>
                <span className="font-medium text-foreground">
                    {delivered !== null ? `${formatNumberValue(delivered)} MT` : 'N/A'}
                </span>
            </div>
            <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted">
                <div className="h-2 rounded-full bg-primary transition-all" style={{ width: progressWidth }} />
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{completion !== null ? `${completion.toFixed(1)}%` : 'No plan set'}</span>
                {planned !== null && remaining !== null ? (
                    <span>Remaining {formatNumberValue(Math.max(remaining, 0))} MT</span>
                ) : (
                    <span className="invisible">placeholder</span>
                )}
            </div>
        </div>
    );
};

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

    const renderHeaderCell = (column: ColumnKey, label: string, sortable = true) => (
        <TableHead
            key={column}
            className={`select-none bg-background ${sortable ? 'cursor-pointer transition-colors hover:bg-muted/70' : ''}`}
            onClick={sortable ? () => handleSort(column) : undefined}
        >
            <div className="flex items-center gap-2">
                {label}
                {sortable && (
                    <ArrowUpDown
                        size={14}
                        className={sortColumn === column ? 'text-primary' : 'text-muted-foreground opacity-50'}
                    />
                )}
            </div>
        </TableHead>
    );

    const renderCell = (operation: OperationData, column: ColumnKey): React.ReactNode => {
        switch (column) {
            case 'operationid':
                return <span className="font-medium">{operation.operationid}</span>;
            case 'customer':
                return operation.customer?.name || '-';
            case 'status':
                return getStatusBadge(operation.status);
            case 'startdate':
                return operation.startdate ? new Date(operation.startdate).toLocaleDateString() : '-';
            case 'volume':
                return formatNumberValue(operation.volume);
            case 'km':
                return formatNumberValue(operation.km);
            case 'tonnageProgress':
                return renderTonnageProgress(operation);
            default:
                return null;
        }
    };

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
                    {columns.map(({ key, label, sortable }) => renderHeaderCell(key, label, sortable ?? true))}
                    <TableHead className="text-right bg-background">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {operationData.length > 0 ? (
                    operationData.map((op) => (
                        <TableRow key={op.id} className="hover:bg-muted/50">
                            {columns.map(({ key }) => (
                                <TableCell key={key}>{renderCell(op, key)}</TableCell>
                            ))}
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
