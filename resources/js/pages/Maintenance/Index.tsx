import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { InertiaPagination } from '@/components/ui/pagination';
import { Input } from '@/components/ui/input';
import * as React from 'react';
import { DeleteConfirmationDialog } from '@/components/delete-confirmation-dialog';
import { AlertTriangle, ArrowUpDown, CheckCircle, Clock, DollarSign, Eye, FileDown, Plus, User, Wrench, Edit, Search, Trash2 } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Maintenance',
        href: '/maintenance',
    },
];

interface MaintenanceRecord {
    id: number;
    scheduled_date: string;
    completed_date?: string | null;
    status: string;
    cost?: number | null;
    description?: string | null;
    truck?: {
        id: number;
        plate: string;
    } | null;
    maintenanceType?: {
        id: number;
        name: string;
        category?: string | null;
    } | null;
    assignedMechanic?: {
        id: number;
        name: string;
    } | null;
}

interface MaintenanceIndexProps {
    maintenanceRecords: {
        data: MaintenanceRecord[];
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
    metrics: {
        total: number;
        scheduled: number;
        in_progress: number;
        completed: number;
        overdue: number;
        total_cost: number;
        average_cost: number;
    };
    filters: {
        search?: string | null;
        status?: string | null;
        maintenance_type?: number | string | null;
        sort?: string | null;
        direction?: 'asc' | 'desc' | null;
        per_page?: number | null;
    };
    statusOptions: Array<{ label: string; value: string }>;
    maintenanceTypeOptions: Array<{ id: number; name: string }>;
    perPageOptions: number[];
}

const columns: Array<{ key: string; label: string; sortable?: boolean; sortKey?: string }> = [
    { key: 'truck', label: 'Truck' },
    { key: 'maintenanceType', label: 'Type' },
    { key: 'category', label: 'Category' },
    { key: 'scheduled_date', label: 'Scheduled', sortable: true, sortKey: 'scheduled_date' },
    { key: 'completed_date', label: 'Completed', sortable: true, sortKey: 'completed_date' },
    { key: 'cost', label: 'Cost', sortable: true, sortKey: 'cost' },
    { key: 'status', label: 'Status', sortable: true, sortKey: 'status' },
    { key: 'mechanic', label: 'Mechanic' },
];

const toNumeric = (value: number | string | null | undefined): number | null => {
    if (value === null || value === undefined) {
        return null;
    }

    const numeric = typeof value === 'string' ? Number(value) : value;
    if (!Number.isFinite(numeric)) {
        return null;
    }

    return numeric;
};

const formatNumber = (value: number | string | null | undefined) => {
    const numeric = toNumeric(value);
    if (numeric === null) {
        return '0';
    }

    return numeric.toLocaleString();
};

const formatCurrency = (value: number | string | null | undefined) => {
    const numeric = toNumeric(value);
    if (numeric === null) {
        return '$0.00';
    }

    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(numeric);
};

const formatDate = (value?: string | null) => {
    if (!value) {
        return '—';
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return '—';
    }

    return date.toLocaleDateString();
};

const getStatusBadge = (status: string) => {
    switch (status) {
        case 'scheduled':
            return (
                <Badge className="flex w-fit items-center gap-1 border border-amber-200 bg-amber-100 text-amber-800 hover:bg-amber-200">
                    <Clock className="h-3 w-3" />
                    Scheduled
                </Badge>
            );
        case 'in_progress':
            return (
                <Badge className="flex w-fit items-center gap-1 border border-blue-200 bg-blue-100 text-blue-800 hover:bg-blue-200">
                    <Wrench className="h-3 w-3" />
                    In Progress
                </Badge>
            );
        case 'completed':
            return (
                <Badge className="flex w-fit items-center gap-1 border border-emerald-200 bg-emerald-100 text-emerald-800 hover:bg-emerald-200">
                    <CheckCircle className="h-3 w-3" />
                    Completed
                </Badge>
            );
        case 'overdue':
            return (
                <Badge className="flex w-fit items-center gap-1 border border-red-200 bg-red-100 text-red-800 hover:bg-red-200">
                    <AlertTriangle className="h-3 w-3" />
                    Overdue
                </Badge>
            );
        default:
            return <Badge className="w-fit capitalize" variant="outline">{status}</Badge>;
    }
};

const getCategoryClass = (category?: string | null) => {
    switch (category) {
        case 'Preventive':
            return 'text-blue-600';
        case 'Corrective':
            return 'text-orange-600';
        case 'Emergency':
            return 'text-red-600';
        default:
            return 'text-muted-foreground';
    }
};

export default function MaintenanceIndex({ maintenanceRecords, metrics, filters, statusOptions, maintenanceTypeOptions, perPageOptions }: MaintenanceIndexProps) {
    const { hasPermission } = usePermissions();
    const [searchTerm, setSearchTerm] = React.useState(filters?.search ?? '');
    const [selectedStatus, setSelectedStatus] = React.useState(filters?.status ?? 'all');
    const [selectedType, setSelectedType] = React.useState(
        filters?.maintenance_type ? String(filters.maintenance_type) : 'all',
    );
    const [sortColumn, setSortColumn] = React.useState<string>(filters?.sort ?? 'scheduled_date');
    const [sortDirection, setSortDirection] = React.useState<'asc' | 'desc'>(filters?.direction ?? 'desc');
    const availablePerPageOptions = React.useMemo(() => (perPageOptions?.length ? perPageOptions : [15, 25, 50, 100]), [perPageOptions]);
    const resolvedPerPage = React.useMemo(() => {
        const candidate = filters?.per_page;
        if (typeof candidate === 'number' && availablePerPageOptions.includes(candidate)) {
            return candidate;
        }

        return availablePerPageOptions[0] ?? 15;
    }, [filters?.per_page, availablePerPageOptions]);
    const [perPage, setPerPage] = React.useState<string>(() => String(resolvedPerPage));
    const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
    const [recordToDelete, setRecordToDelete] = React.useState<MaintenanceRecord | null>(null);
    const [isDeleting, setIsDeleting] = React.useState(false);

    React.useEffect(() => {
        setPerPage(String(resolvedPerPage));
    }, [resolvedPerPage]);

    const maintenanceData = maintenanceRecords?.data ?? [];
    const totalRecords = metrics?.total ?? maintenanceRecords?.total ?? 0;
    const currentPage = maintenanceRecords?.current_page ?? 1;
    const lastPage = maintenanceRecords?.last_page ?? 1;

    const handleNavigate = React.useCallback((overrides: Partial<{ search?: string; status?: string; maintenance_type?: string | number; sort?: string; direction?: 'asc' | 'desc'; page?: number; per_page?: number }>) => {
        const perPageValue = overrides.per_page !== undefined ? overrides.per_page : Number(perPage);
        const params: Record<string, string | number | undefined> = {
            search: overrides.search !== undefined ? overrides.search : (searchTerm.trim() ? searchTerm.trim() : undefined),
            status: overrides.status !== undefined ? overrides.status : (selectedStatus !== 'all' ? selectedStatus : undefined),
            maintenance_type: overrides.maintenance_type !== undefined ? overrides.maintenance_type : (selectedType !== 'all' ? selectedType : undefined),
            sort: overrides.sort ?? sortColumn,
            direction: overrides.direction ?? sortDirection,
            page: overrides.page,
            per_page: perPageValue,
        };

        Object.keys(params).forEach((key) => {
            const value = params[key];
            if (
                value === undefined ||
                value === null ||
                value === '' ||
                (key === 'per_page' && (typeof value !== 'number' || !Number.isFinite(value) || value <= 0))
            ) {
                delete params[key];
            }
        });

        router.get('/maintenance', params, { preserveState: true, replace: false });
    }, [searchTerm, selectedStatus, selectedType, sortColumn, sortDirection, perPage]);

    const handleSearchChange = (value: string) => {
        setSearchTerm(value);
        handleNavigate({ search: value.trim() ? value.trim() : undefined, page: 1 });
    };

    const handleStatusChange = (value: string) => {
        setSelectedStatus(value);
        handleNavigate({ status: value !== 'all' ? value : undefined, page: 1 });
    };

    const handleTypeChange = (value: string) => {
        setSelectedType(value);
        handleNavigate({ maintenance_type: value !== 'all' ? value : undefined, page: 1 });
    };

    const handlePerPageChange = (value: string) => {
        setPerPage(value);
        const numericValue = Number(value);
        handleNavigate({ per_page: Number.isNaN(numericValue) ? undefined : numericValue, page: 1 });
    };

    const handleSort = (column: string) => {
        const newDirection: 'asc' | 'desc' = sortColumn === column && sortDirection === 'asc' ? 'desc' : 'asc';
        setSortColumn(column);
        setSortDirection(newDirection);
        handleNavigate({ sort: column, direction: newDirection });
    };

    const handleExport = React.useCallback(() => {
        const params = new URLSearchParams();
        if (searchTerm.trim()) {
            params.set('search', searchTerm.trim());
        }
        if (selectedStatus !== 'all') {
            params.set('status', selectedStatus);
        }
        if (selectedType !== 'all') {
            params.set('maintenance_type', selectedType);
        }
        params.set('sort', sortColumn);
        params.set('direction', sortDirection);

        const queryString = params.toString();
        window.location.href = queryString ? `/maintenance/export/csv?${queryString}` : '/maintenance/export/csv';
    }, [searchTerm, selectedStatus, selectedType, sortColumn, sortDirection]);

    const handleDeleteDialogChange = React.useCallback((open: boolean) => {
        setDeleteDialogOpen(open);
        if (!open) {
            setRecordToDelete(null);
        }
    }, []);

    const handleDeleteConfirm = React.useCallback(() => {
        if (!recordToDelete) {
            return;
        }

        setIsDeleting(true);
        router.delete(`/maintenance/${recordToDelete.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                setDeleteDialogOpen(false);
                setRecordToDelete(null);
            },
            onError: () => {
                setIsDeleting(false);
            },
            onFinish: () => {
                setIsDeleting(false);
            },
        });
    }, [recordToDelete]);

    const deleteDialogItemName = React.useMemo(() => {
        if (!recordToDelete) {
            return undefined;
        }

        const typeName = recordToDelete.maintenanceType?.name ?? 'Maintenance';
        const truckPlate = recordToDelete.truck?.plate ?? 'Truck';
        const scheduled = recordToDelete.scheduled_date ? formatDate(recordToDelete.scheduled_date) : null;

        return scheduled ? `${typeName} for ${truckPlate} (${scheduled})` : `${typeName} for ${truckPlate}`;
    }, [recordToDelete]);

    const headerActions = (
        <>
            {hasPermission('maintenance.export') && (
                <Button variant="outline" onClick={handleExport}>
                    <FileDown className="mr-2 h-4 w-4" />
                    Export CSV
                </Button>
            )}
            {hasPermission('maintenance.create') && (
                <Button asChild>
                    <Link href="/maintenance/create">
                        <Plus className="mr-2 h-4 w-4" />
                        Schedule Maintenance
                    </Link>
                </Button>
            )}
        </>
    );

    const statsCards = [
        {
            title: 'Total Records',
            value: formatNumber(metrics?.total ?? 0),
            description: 'All maintenance entries',
            icon: <Wrench className="h-3.5 w-3.5 text-blue-600" />,
            valueClassName: 'text-blue-600',
        },
        {
            title: 'Scheduled',
            value: formatNumber(metrics?.scheduled ?? 0),
            description: `${formatNumber(metrics?.overdue ?? 0)} overdue`,
            icon: <Clock className="h-3.5 w-3.5 text-amber-600" />,
            valueClassName: 'text-amber-600',
        },
        {
            title: 'Completed',
            value: formatNumber(metrics?.completed ?? 0),
            description: `Avg cost ${formatCurrency(metrics?.average_cost ?? 0)}`,
            icon: <CheckCircle className="h-3.5 w-3.5 text-emerald-600" />,
            valueClassName: 'text-emerald-600',
        },
        {
            title: 'Total Cost',
            value: formatCurrency(metrics?.total_cost ?? 0),
            description: `${formatNumber(metrics?.in_progress ?? 0)} in progress`,
            icon: <DollarSign className="h-3.5 w-3.5 text-purple-600" />,
            valueClassName: 'text-purple-600',
        },
    ];

    const statsSection = (
        <div className="hidden gap-2 md:grid md:grid-cols-2 xl:grid-cols-4">
            {statsCards.map((card) => (
                <Card key={card.title} className="gap-2 border border-slate-200 py-2 shadow-sm sm:py-3">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 p-1.5 sm:p-2">
                        <CardTitle className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                            {card.title}
                        </CardTitle>
                        {card.icon}
                    </CardHeader>
                    <CardContent className="px-2 pb-2 pt-0 sm:px-3 sm:pb-2">
                        <div className={`text-sm font-semibold sm:text-base ${card.valueClassName}`}>{card.value}</div>
                        <p className="text-[11px] text-muted-foreground">{card.description}</p>
                    </CardContent>
                </Card>
            ))}
        </div>
    );

    const tableHeaderExtras = (
        <div className="flex flex-wrap items-center gap-2">
            <div className="relative w-[260px] max-w-full">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search maintenance records..."
                    value={searchTerm}
                    onChange={(event) => handleSearchChange(event.target.value)}
                    className="pl-10"
                />
            </div>
            <Select value={selectedStatus} onValueChange={handleStatusChange}>
                <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    {statusOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                            {option.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
            <Select value={selectedType} onValueChange={handleTypeChange}>
                <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Maintenance type" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All types</SelectItem>
                    {maintenanceTypeOptions.map((type) => (
                        <SelectItem key={type.id} value={String(type.id)}>
                            {type.name}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <span className="hidden sm:inline">Rows</span>
                <Select value={perPage} onValueChange={handlePerPageChange}>
                    <SelectTrigger className="w-[110px]">
                        <SelectValue placeholder="Per page" />
                    </SelectTrigger>
                    <SelectContent>
                        {availablePerPageOptions.map((option) => (
                            <SelectItem key={option} value={String(option)}>
                                {option} / page
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
        </div>
    );

    const renderHeaderCell = (column: { key: string; label: string; sortable?: boolean; sortKey?: string }) => {
        const sortable = column.sortable ?? false;
        const columnKey = column.sortKey ?? column.key;
        const isActive = sortColumn === columnKey;

        if (!sortable) {
            return (
                <TableHead key={column.key} className="sticky top-0 z-20 bg-background text-muted-foreground">
                    {column.label}
                </TableHead>
            );
        }

        return (
            <TableHead
                key={column.key}
                className="sticky top-0 z-20 cursor-pointer select-none bg-background transition-colors hover:bg-muted/70"
                onClick={() => handleSort(columnKey)}
            >
                <div className="flex items-center gap-2">
                    {column.label}
                    <ArrowUpDown size={14} className={isActive ? 'text-primary' : 'text-muted-foreground opacity-50'} />
                </div>
            </TableHead>
        );
    };

    const rowOffset = React.useMemo(() => {
        const firstRecordIndex = maintenanceRecords?.from ?? 0;
        if (typeof firstRecordIndex !== 'number' || Number.isNaN(firstRecordIndex)) {
            return 0;
        }

        return Math.max(firstRecordIndex - 1, 0);
    }, [maintenanceRecords?.from]);

    const tableContent = (
        <Table>
            <TableHeader className="[&_tr]:sticky [&_tr]:top-0 [&_tr]:z-20 [&_tr]:bg-background [&_tr]:shadow-sm">
                <TableRow className="border-b bg-background">
                    <TableHead className="sticky top-0 z-20 w-12 bg-background text-center">#</TableHead>
                    {columns.map((column) => renderHeaderCell(column))}
                    <TableHead className="sticky top-0 z-20 bg-background text-center">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {maintenanceData.length > 0 ? (
                    maintenanceData.map((record, index) => (
                        <TableRow key={record.id} className="hover:bg-muted/50">
                            <TableCell className="text-center font-medium">
                                {rowOffset + index + 1}
                            </TableCell>
                            <TableCell className="font-mono font-medium">
                                {record.truck?.plate || '—'}
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                                {record.maintenanceType?.name || '—'}
                            </TableCell>
                            <TableCell className={`${getCategoryClass(record.maintenanceType?.category)} text-sm font-medium`}>
                                {record.maintenanceType?.category || '—'}
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                                {formatDate(record.scheduled_date)}
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                                {formatDate(record.completed_date)}
                            </TableCell>
                            <TableCell className="font-medium">
                                {record.cost === null || record.cost === undefined ? '—' : formatCurrency(record.cost)}
                            </TableCell>
                            <TableCell>{getStatusBadge(record.status)}</TableCell>
                            <TableCell className="text-muted-foreground">
                                {record.assignedMechanic?.name ? (
                                    <span className="flex items-center gap-1">
                                        <User className="h-3.5 w-3.5 text-muted-foreground" />
                                        {record.assignedMechanic.name}
                                    </span>
                                ) : '—'}
                            </TableCell>
                            <TableCell className="text-center">
                                <div className="flex justify-center gap-2">
                                    <Button asChild size="sm" variant="ghost">
                                        <Link href={`/maintenance/${record.id}`}>
                                            <Eye className="h-4 w-4" />
                                        </Link>
                                    </Button>
                                    {hasPermission('maintenance.edit') && (
                                        <Button asChild size="sm" variant="ghost">
                                            <Link href={`/maintenance/${record.id}/edit`}>
                                                <Edit className="h-4 w-4" />
                                            </Link>
                                        </Button>
                                    )}
                                    {hasPermission('maintenance.delete') && (
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant="ghost"
                                            className="text-destructive hover:bg-destructive/10"
                                            onClick={() => {
                                                setRecordToDelete(record);
                                                setDeleteDialogOpen(true);
                                            }}
                                            disabled={isDeleting && recordToDelete?.id === record.id}
                                            aria-label="Delete maintenance record"
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
                        <TableCell colSpan={columns.length + 2} className="py-8 text-center text-muted-foreground">
                            No maintenance records found.
                            {hasPermission('maintenance.create') && (
                                <Link href="/maintenance/create" className="ml-1 text-primary underline">
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
            headTitle="Maintenance"
            title="Maintenance"
            description={`Manage maintenance records and schedules. Total: ${totalRecords}`}
            breadcrumbs={breadcrumbs}
            actions={headerActions}
            stats={statsSection}
            tableTitle="Maintenance Records"
            tableDescription="Track scheduled and completed maintenance"
            tableHeaderExtras={tableHeaderExtras}
            pagination={
                <InertiaPagination
                    className="mt-4"
                    links={maintenanceRecords.links}
                    from={maintenanceRecords.from}
                    to={maintenanceRecords.to}
                    total={maintenanceRecords.total}
                    currentPage={currentPage}
                    lastPage={lastPage}
                />
            }
        >
            {tableContent}
            <DeleteConfirmationDialog
                open={deleteDialogOpen}
                onOpenChange={handleDeleteDialogChange}
                title="Delete Maintenance Record"
                description="This action will permanently remove the maintenance record and its related details."
                itemName={deleteDialogItemName}
                onConfirm={handleDeleteConfirm}
                isLoading={isDeleting}
            />
        </ListPageLayout>
    );
}






