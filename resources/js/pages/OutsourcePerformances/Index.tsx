import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, router } from '@inertiajs/react';
import { type BreadcrumbItem } from '@/types';
import { usePermissions } from '@/hooks/use-permissions';
import ListPageLayout from '@/components/layouts/list-page-layout';
import { DeleteConfirmationDialog } from '@/components/delete-confirmation-dialog';
import { InertiaPagination } from '@/components/ui/pagination';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
    Activity,
    ArrowUpDown,
    Calendar,
    Coins,
    MapPin,
    Plus,
    Search,
    TrendingUp,
    Eye,
    Edit,
    Trash2,
} from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Outsource Performances',
        href: '/outsource-performances',
    },
];

interface OutsourceSummary {
    id: number;
    name: string;
}

interface PlaceSummary {
    id?: number;
    name?: string | null;
}

interface OutsourcePerformanceRecord {
    id: number;
    trip_number: string;
    dispatch_date?: string | null;
    distance_km?: number | string | null;
    cargo_volume_mt?: number | string | null;
    tonkm?: number | string | null;
    cost?: number | string | null;
    status: string;
    remarks?: string | null;
    outsource?: OutsourceSummary | null;
    from_place?: PlaceSummary | null;
    to_place?: PlaceSummary | null;
    fromPlace?: PlaceSummary | null;
    toPlace?: PlaceSummary | null;
}

interface OutsourcePerformanceIndexProps {
    outsourcePerformances: {
        data: OutsourcePerformanceRecord[];
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
    metrics?: {
        totalRecords?: number;
        totalDistance?: number;
        totalCargo?: number;
        totalCost?: number;
        activeRecords?: number;
    };
    filters?: {
        search?: string | null;
        status?: string | null;
        outsource_id?: number | string | null;
        dispatched_from?: string | null;
        dispatched_to?: string | null;
        sort?: string | null;
        direction?: 'asc' | 'desc' | null;
        per_page?: number | null;
    };
    statusOptions?: Array<{ label: string; value: string }>;
    outsourceOptions?: Array<{ label: string; value: number }>;
    perPageOptions?: number[];
}

interface ColumnDefinition {
    key: string;
    label: string;
    sortable?: boolean;
    sortKey?: string;
}

type SortDirection = 'asc' | 'desc';

const columns: ColumnDefinition[] = [
    { key: 'trip_number', label: 'Trip #', sortable: true },
    { key: 'dispatch_date', label: 'Dispatch Date', sortable: true },
    { key: 'vendor', label: 'Vendor', sortable: false },
    { key: 'route', label: 'Route', sortable: false },
    { key: 'distance_km', label: 'Distance (km)', sortable: true },
    { key: 'cargo_volume_mt', label: 'Cargo (MT)', sortable: true },
    { key: 'tonkm', label: 'Ton-Km', sortable: true },
    { key: 'cost', label: 'Cost', sortable: true },
    { key: 'status', label: 'Status', sortable: true },
];

const dateFormatter = new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
});

const decimalFormatter = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
});

const currencyFormatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'ETB',
    maximumFractionDigits: 2,
});

export default function OutsourcePerformancesIndex({
    outsourcePerformances,
    metrics,
    filters,
    statusOptions,
    outsourceOptions,
    perPageOptions,
}: OutsourcePerformanceIndexProps) {
    const { hasPermission } = usePermissions();
    const { toast } = useToast();

    const [searchTerm, setSearchTerm] = useState(filters?.search ?? '');
    const [selectedStatus, setSelectedStatus] = useState(filters?.status ?? 'all');
    const [selectedOutsource, setSelectedOutsource] = useState(
        filters?.outsource_id ? String(filters.outsource_id) : 'all',
    );
    const [dateFrom, setDateFrom] = useState(filters?.dispatched_from ?? '');
    const [dateTo, setDateTo] = useState(filters?.dispatched_to ?? '');
    const [sortColumn, setSortColumn] = useState(filters?.sort ?? 'dispatch_date');
    const [sortDirection, setSortDirection] = useState<SortDirection>(filters?.direction ?? 'desc');
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [selectedRecord, setSelectedRecord] = useState<OutsourcePerformanceRecord | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const availablePerPageOptions = useMemo(
        () => (perPageOptions?.length ? perPageOptions : [10, 15, 25, 50]),
        [perPageOptions],
    );

    const resolvedPerPage = useMemo(() => {
        const candidate = filters?.per_page;
        if (typeof candidate === 'number' && availablePerPageOptions.includes(candidate)) {
            return candidate;
        }

        return availablePerPageOptions[0] ?? 15;
    }, [filters?.per_page, availablePerPageOptions]);

    const [perPage, setPerPage] = useState<string>(() => String(resolvedPerPage));

    useEffect(() => {
        setPerPage(String(resolvedPerPage));
    }, [resolvedPerPage]);

    const totalRecords = metrics?.totalRecords ?? outsourcePerformances?.total ?? 0;
    const totalDistance = metrics?.totalDistance ?? 0;
    const totalCargo = metrics?.totalCargo ?? 0;
    const totalCost = metrics?.totalCost ?? 0;
    const activeRecords = metrics?.activeRecords ?? 0;

    const handleNavigate = useCallback((overrides: Partial<{
        search?: string;
        status?: string;
        outsource_id?: string | number;
        dispatched_from?: string;
        dispatched_to?: string;
        sort?: string;
        direction?: SortDirection;
        page?: number;
        per_page?: number;
    }>) => {
        const params: Record<string, string | number | undefined> = {
            search: overrides.search !== undefined
                ? overrides.search
                : (searchTerm.trim() ? searchTerm.trim() : undefined),
            status: overrides.status !== undefined
                ? overrides.status
                : (selectedStatus !== 'all' ? selectedStatus : undefined),
            outsource_id: overrides.outsource_id !== undefined
                ? overrides.outsource_id
                : (selectedOutsource !== 'all' ? selectedOutsource : undefined),
            dispatched_from: overrides.dispatched_from !== undefined
                ? overrides.dispatched_from
                : (dateFrom || undefined),
            dispatched_to: overrides.dispatched_to !== undefined
                ? overrides.dispatched_to
                : (dateTo || undefined),
            sort: overrides.sort ?? sortColumn,
            direction: overrides.direction ?? sortDirection,
            page: overrides.page,
            per_page: overrides.per_page !== undefined ? overrides.per_page : Number(perPage),
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

        router.get('/outsource-performances', params, {
            preserveState: true,
            replace: false,
        });
    }, [searchTerm, selectedStatus, selectedOutsource, dateFrom, dateTo, sortColumn, sortDirection, perPage]);

    const handleSearchChange = (value: string) => {
        setSearchTerm(value);
        handleNavigate({ search: value.trim() ? value.trim() : undefined, page: 1 });
    };

    const handleStatusChange = (value: string) => {
        setSelectedStatus(value);
        handleNavigate({ status: value !== 'all' ? value : undefined, page: 1 });
    };

    const handleOutsourceChange = (value: string) => {
        setSelectedOutsource(value);
        handleNavigate({ outsource_id: value !== 'all' ? value : undefined, page: 1 });
    };

    const handleDateChange = (type: 'from' | 'to', value: string) => {
        if (type === 'from') {
            setDateFrom(value);
            handleNavigate({ dispatched_from: value || undefined, page: 1 });
        } else {
            setDateTo(value);
            handleNavigate({ dispatched_to: value || undefined, page: 1 });
        }
    };

    const handlePerPageChange = (value: string) => {
        setPerPage(value);
        const numericValue = Number(value);
        handleNavigate({ per_page: Number.isNaN(numericValue) ? undefined : numericValue, page: 1 });
    };

    const handleSort = (column: ColumnDefinition) => {
        if (column.sortable === false) {
            return;
        }

        const sortKey = column.sortKey ?? column.key;
        const nextDirection: SortDirection = sortColumn === sortKey && sortDirection === 'asc' ? 'desc' : 'asc';

        setSortColumn(sortKey);
        setSortDirection(nextDirection);
        handleNavigate({ sort: sortKey, direction: nextDirection });
    };

    const handleDeleteClick = (record: OutsourcePerformanceRecord) => {
        setSelectedRecord(record);
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = () => {
        if (!selectedRecord) {
            return;
        }

        setIsDeleting(true);
        router.delete(`/outsource-performances/${selectedRecord.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                setDeleteDialogOpen(false);
                setSelectedRecord(null);
                setIsDeleting(false);
            },
            onError: (errors) => {
                setIsDeleting(false);
                if (errors && typeof errors === 'object') {
                    const messages = Object.values(errors).flat().join('\n');
                    if (messages) {
                        toast({
                            title: 'Delete failed',
                            description: messages,
                            variant: 'destructive',
                        });
                    }
                }
            },
        });
    };

    const headerActions = (
        <>
            {hasPermission('outsource-performances.create') && (
                <Button asChild>
                    <Link href="/outsource-performances/create">
                        <Plus className="mr-2 h-4 w-4" />
                        Log Trip
                    </Link>
                </Button>
            )}
        </>
    );

    const statsCards = [
        {
            title: 'Trips Logged',
            value: totalRecords,
            description: 'Total outsource trips',
            icon: <Activity className="h-3.5 w-3.5 text-indigo-600" />,
            valueClassName: 'text-indigo-600',
        },
        {
            title: 'Active Trips',
            value: activeRecords,
            description: 'Currently open records',
            icon: <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />,
            valueClassName: 'text-emerald-600',
        },
        {
            title: 'Distance Covered',
            value: `${decimalFormatter.format(totalDistance ?? 0)} km`,
            description: 'Total logged kilometres',
            icon: <MapPin className="h-3.5 w-3.5 text-rose-600" />,
            valueClassName: 'text-rose-600',
        },
        {
            title: 'Total Cost',
            value: currencyFormatter.format(totalCost ?? 0),
            description: 'Aggregate spend',
            icon: <Coins className="h-3.5 w-3.5 text-amber-600" />,
            valueClassName: 'text-amber-600',
        },
    ];

    const statsSection = (
        <div className="hidden gap-2 md:grid md:grid-cols-2 xl:grid-cols-4">
            {statsCards.map((card) => (
                <Card key={card.title} className="gap-2 border border-slate-200 py-2 shadow-sm dark:border-slate-800">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 px-2 pb-1">
                        <CardTitle className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                            {card.title}
                        </CardTitle>
                        {card.icon}
                    </CardHeader>
                    <CardContent className="px-2 pb-2 pt-0">
                        <div className={`text-sm font-semibold sm:text-base ${card.valueClassName}`}>{card.value}</div>
                        <p className="text-[11px] text-muted-foreground">{card.description}</p>
                    </CardContent>
                </Card>
            ))}
        </div>
    );

    const tableHeaderExtras = (
        <div className="flex flex-wrap items-center gap-2">
            <div className="relative w-[240px] max-w-full">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search trips or vendors"
                    value={searchTerm}
                    onChange={(event) => handleSearchChange(event.target.value)}
                    className="pl-10"
                />
            </div>
            <Select value={selectedOutsource} onValueChange={handleOutsourceChange}>
                <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Vendor" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All vendors</SelectItem>
                    {outsourceOptions?.map((option) => (
                        <SelectItem key={option.value} value={String(option.value)}>
                            {option.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
            <Select value={selectedStatus} onValueChange={handleStatusChange}>
                <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    {statusOptions?.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                            {option.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
            <div className="flex items-center gap-2">
                <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <Input
                        type="date"
                        value={dateFrom}
                        onChange={(event) => handleDateChange('from', event.target.value)}
                        className="w-[150px]"
                    />
                </div>
                <span className="text-muted-foreground">–</span>
                <Input
                    type="date"
                    value={dateTo}
                    onChange={(event) => handleDateChange('to', event.target.value)}
                    className="w-[150px]"
                />
            </div>
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

    const renderHeaderCell = (column: ColumnDefinition) => {
        if (column.sortable === false) {
            return (
                <TableHead key={column.key} className="sticky top-0 z-20 bg-background">
                    {column.label}
                </TableHead>
            );
        }

        const sortKey = column.sortKey ?? column.key;
        const isActive = sortColumn === sortKey;

        return (
            <TableHead
                key={sortKey}
                className="sticky top-0 z-20 cursor-pointer select-none bg-background transition-colors hover:bg-muted/70"
                onClick={() => handleSort(column)}
            >
                <div className="flex items-center gap-2">
                    {column.label}
                    <ArrowUpDown size={14} className={isActive ? 'text-primary' : 'text-muted-foreground opacity-50'} />
                </div>
            </TableHead>
        );
    };

    const renderStatusBadge = (status: string) => {
        const normalized = status.toLowerCase();
        if (normalized === 'active') {
            return (
                <Badge className="w-fit border-emerald-200 bg-emerald-100 text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-900/30 dark:text-emerald-200">
                    Active
                </Badge>
            );
        }

        return (
            <Badge className="w-fit border-rose-200 bg-rose-100 text-rose-700 dark:border-rose-900/40 dark:bg-rose-900/30 dark:text-rose-200">
                {status || 'Inactive'}
            </Badge>
        );
    };

    const renderNumber = (value?: number | string | null, suffix = '') => {
        if (value === null || value === undefined || value === '') {
            return '—';
        }

        const numeric = Number(value);
        if (!Number.isFinite(numeric)) {
            return '—';
        }

        return `${decimalFormatter.format(numeric)}${suffix}`;
    };

    const tableContent = (
        <Table>
            <TableHeader className="[&_tr]:sticky [&_tr]:top-0 [&_tr]:z-20 [&_tr]:bg-background [&_tr]:shadow-sm">
                <TableRow className="border-b bg-background">
                    {columns.map((column) => renderHeaderCell(column))}
                    <TableHead className="sticky top-0 z-20 bg-background text-center">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {outsourcePerformances?.data && outsourcePerformances.data.length > 0 ? (
                    outsourcePerformances.data.map((record) => {
                        const vendor = record.outsource?.name ?? '—';
                        const fromPlace = record.from_place?.name ?? record.fromPlace?.name ?? '—';
                        const toPlace = record.to_place?.name ?? record.toPlace?.name ?? '—';

                        return (
                            <TableRow key={record.id} className="hover:bg-muted/50">
                                <TableCell className="font-semibold">{record.trip_number}</TableCell>
                                <TableCell className="text-sm text-muted-foreground">
                                    {record.dispatch_date
                                        ? dateFormatter.format(new Date(record.dispatch_date))
                                        : '—'}
                                </TableCell>
                                <TableCell className="text-sm text-muted-foreground">
                                    {vendor}
                                </TableCell>
                                <TableCell className="text-xs text-muted-foreground">
                                    <div className="flex flex-col">
                                        <span>{fromPlace}</span>
                                        <span className="text-muted-foreground">→ {toPlace}</span>
                                    </div>
                                </TableCell>
                                <TableCell className="font-medium">
                                    {renderNumber(record.distance_km, ' km')}
                                </TableCell>
                                <TableCell className="font-medium">
                                    {renderNumber(record.cargo_volume_mt, ' MT')}
                                </TableCell>
                                <TableCell className="font-medium">
                                    {renderNumber(record.tonkm)}
                                </TableCell>
                                <TableCell className="font-medium">
                                    {record.cost === null || record.cost === undefined || record.cost === ''
                                        ? '—'
                                        : currencyFormatter.format(Number(record.cost))}
                                </TableCell>
                                <TableCell>{renderStatusBadge(record.status)}</TableCell>
                                <TableCell className="text-center">
                                    <div className="flex justify-center gap-2">
                                        <Button asChild size="sm" variant="ghost">
                                            <Link href={`/outsource-performances/${record.id}`}>
                                                <Eye className="h-4 w-4" />
                                            </Link>
                                        </Button>
                                        {hasPermission('outsource-performances.edit') && (
                                            <Button asChild size="sm" variant="ghost">
                                                <Link href={`/outsource-performances/${record.id}/edit`}>
                                                    <Edit className="h-4 w-4" />
                                                </Link>
                                            </Button>
                                        )}
                                        {hasPermission('outsource-performances.destroy') && (
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                className="text-destructive hover:bg-destructive/10"
                                                onClick={() => handleDeleteClick(record)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </div>
                                </TableCell>
                            </TableRow>
                        );
                    })
                ) : (
                    <TableRow>
                        <TableCell colSpan={columns.length + 1} className="py-8 text-center text-muted-foreground">
                            No outsource performance records found.
                            {hasPermission('outsource-performances.create') && (
                                <Link href="/outsource-performances/create" className="ml-1 text-primary underline">
                                    Log one
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
                headTitle="Outsource Performances"
                title="Outsource Performances"
                description={`Monitor ${totalRecords} recorded outsource trip${totalRecords === 1 ? '' : 's'} and their impact.`}
                breadcrumbs={breadcrumbs}
                actions={headerActions}
                stats={statsSection}
                tableTitle="Outsource Trip Ledger"
                tableDescription="Analyse partner performance across distance, volume, and spend"
                tableHeaderExtras={tableHeaderExtras}
                pagination={
                    <InertiaPagination
                        className="mt-4"
                        links={outsourcePerformances.links}
                        from={outsourcePerformances.from}
                        to={outsourcePerformances.to}
                        total={outsourcePerformances.total}
                        currentPage={outsourcePerformances.current_page}
                        lastPage={outsourcePerformances.last_page}
                    />
                }
            >
                {tableContent}
            </ListPageLayout>

            <DeleteConfirmationDialog
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
                title="Delete Trip"
                description="Are you sure you want to delete this outsource performance record? This action cannot be undone."
                itemName={selectedRecord?.trip_number}
                onConfirm={handleDeleteConfirm}
                isLoading={isDeleting}
            />
        </>
    );
}
