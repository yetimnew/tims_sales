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
    ArrowUpDown,
    Building2,
    ClipboardList,
    Layers,
    Plus,
    Search,
    Users2,
    Eye,
    Edit,
    Trash2,
} from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Outsourcing',
        href: '/outsources',
    },
];

interface OutsourceRecord {
    id: number;
    name: string;
    contact_person?: string | null;
    phone?: string | null;
    email?: string | null;
    service_type?: string | null;
    status: string;
    outsource_performances_count?: number;
    created_at?: string;
}

interface OutsourceIndexProps {
    outsources: {
        data: OutsourceRecord[];
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
        totalVendors?: number;
        activeVendors?: number;
        averageTripsPerVendor?: number;
        serviceCategoryCount?: number;
    };
    filters?: {
        search?: string | null;
        status?: string | null;
        service_type?: string | null;
        sort?: string | null;
        direction?: 'asc' | 'desc' | null;
        per_page?: number | null;
    };
    statusOptions?: Array<{ label: string; value: string }>;
    serviceTypeOptions?: Array<{ label: string; value: string }>;
    perPageOptions?: number[];
}

interface ColumnDefinition {
    key: keyof OutsourceRecord | 'actions';
    label: string;
    sortable?: boolean;
    sortKey?: string;
}

const columns: ColumnDefinition[] = [
    { key: 'name', label: 'Vendor', sortable: true },
    { key: 'service_type', label: 'Service Type', sortable: true },
    { key: 'contact_person', label: 'Contact', sortable: true },
    { key: 'phone', label: 'Phone', sortable: true },
    { key: 'email', label: 'Email', sortable: true },
    { key: 'status', label: 'Status', sortable: true },
    { key: 'outsource_performances_count', label: 'Trips', sortable: true, sortKey: 'outsource_performances_count' },
];

const dateFormatter = new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
});

const decimalFormatter = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
});

export default function OutsourcesIndex({
    outsources,
    metrics,
    filters,
    statusOptions,
    serviceTypeOptions,
    perPageOptions,
}: OutsourceIndexProps) {
    const { hasPermission } = usePermissions();
    const { toast } = useToast();

    const [searchTerm, setSearchTerm] = useState(filters?.search ?? '');
    const [selectedStatus, setSelectedStatus] = useState(filters?.status ?? 'all');
    const [selectedServiceType, setSelectedServiceType] = useState(filters?.service_type ?? 'all');
    const [sortColumn, setSortColumn] = useState(filters?.sort ?? 'name');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>(filters?.direction ?? 'asc');
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [selectedOutsource, setSelectedOutsource] = useState<OutsourceRecord | null>(null);
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

    const totalVendors = metrics?.totalVendors ?? outsources?.total ?? 0;
    const activeVendors = metrics?.activeVendors ?? 0;
    const averageTripsPerVendor = metrics?.averageTripsPerVendor ?? 0;
    const serviceCategoryCount = metrics?.serviceCategoryCount ?? 0;

    const handleNavigate = useCallback((overrides: Partial<{ search?: string; status?: string; service_type?: string; sort?: string; direction?: 'asc' | 'desc'; page?: number; per_page?: number }>) => {
        const params: Record<string, string | number | undefined> = {
            search: overrides.search !== undefined
                ? overrides.search
                : (searchTerm.trim() ? searchTerm.trim() : undefined),
            status: overrides.status !== undefined
                ? overrides.status
                : (selectedStatus !== 'all' ? selectedStatus : undefined),
            service_type: overrides.service_type !== undefined
                ? overrides.service_type
                : (selectedServiceType !== 'all' ? selectedServiceType : undefined),
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

        router.get('/outsources', params, {
            preserveState: true,
            replace: false,
        });
    }, [searchTerm, selectedStatus, selectedServiceType, sortColumn, sortDirection, perPage]);

    const handleSearchChange = (value: string) => {
        setSearchTerm(value);
        handleNavigate({ search: value.trim() ? value.trim() : undefined, page: 1 });
    };

    const handleStatusChange = (value: string) => {
        setSelectedStatus(value);
        handleNavigate({ status: value !== 'all' ? value : undefined, page: 1 });
    };

    const handleServiceTypeChange = (value: string) => {
        setSelectedServiceType(value);
        handleNavigate({ service_type: value !== 'all' ? value : undefined, page: 1 });
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

        const sortKey = column.sortKey ?? (column.key as string);
        const nextDirection: 'asc' | 'desc' = sortColumn === sortKey && sortDirection === 'asc' ? 'desc' : 'asc';

        setSortColumn(sortKey);
        setSortDirection(nextDirection);
        handleNavigate({ sort: sortKey, direction: nextDirection });
    };

    const handleDeleteClick = (outsource: OutsourceRecord) => {
        setSelectedOutsource(outsource);
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = () => {
        if (!selectedOutsource) {
            return;
        }

        setIsDeleting(true);
        router.delete(`/outsources/${selectedOutsource.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                setDeleteDialogOpen(false);
                setSelectedOutsource(null);
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
            {hasPermission('outsources.create') && (
                <Button asChild>
                    <Link href="/outsources/create">
                        <Plus className="mr-2 h-4 w-4" />
                        Add Vendor
                    </Link>
                </Button>
            )}
        </>
    );

    const statsCards = [
        {
            title: 'Vendors',
            value: totalVendors,
            description: 'Total outsourcing partners',
            icon: <Building2 className="h-3.5 w-3.5 text-indigo-600" />,
            valueClassName: 'text-indigo-600',
        },
        {
            title: 'Active',
            value: activeVendors,
            description: 'Currently engaged',
            icon: <Users2 className="h-3.5 w-3.5 text-emerald-600" />,
            valueClassName: 'text-emerald-600',
        },
        {
            title: 'Avg Trips / Vendor',
            value: decimalFormatter.format(averageTripsPerVendor),
            description: 'Performance coverage',
            icon: <ClipboardList className="h-3.5 w-3.5 text-rose-600" />,
            valueClassName: 'text-rose-600',
        },
        {
            title: 'Service Lines',
            value: serviceCategoryCount,
            description: 'Unique service categories',
            icon: <Layers className="h-3.5 w-3.5 text-amber-600" />,
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
            <div className="relative w-[260px] max-w-full">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search vendors or contacts"
                    value={searchTerm}
                    onChange={(event) => handleSearchChange(event.target.value)}
                    className="pl-10"
                />
            </div>
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
            <Select value={selectedServiceType} onValueChange={handleServiceTypeChange}>
                <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Service type" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All services</SelectItem>
                    {serviceTypeOptions?.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                            {option.label}
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

    const renderHeaderCell = (column: ColumnDefinition) => {
        if (column.sortable === false) {
            return (
                <TableHead key={column.key as string} className="sticky top-0 z-20 bg-background">
                    {column.label}
                </TableHead>
            );
        }

        const sortKey = column.sortKey ?? (column.key as string);
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

    const tableContent = (
        <Table>
            <TableHeader className="[&_tr]:sticky [&_tr]:top-0 [&_tr]:z-20 [&_tr]:bg-background [&_tr]:shadow-sm">
                <TableRow className="border-b bg-background">
                    <TableHead className="sticky top-0 z-20 w-12 text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground">No.</TableHead>
                    {columns.map((column) => renderHeaderCell(column))}
                    <TableHead className="sticky top-0 z-20 bg-background text-center">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {outsources?.data && outsources.data.length > 0 ? (
                    outsources.data.map((outsource, index) => {
                        const rowNumber = (outsources.from ?? 1) + index;

                        return (
                            <TableRow key={outsource.id} className="hover:bg-muted/50">
                                <TableCell className="w-12 text-center text-sm font-semibold text-muted-foreground">
                                    {rowNumber}
                                </TableCell>
                                <TableCell className="font-medium">
                                    <div className="flex flex-col">
                                        <span>{outsource.name}</span>
                                        {outsource.created_at && (
                                            <span className="text-xs text-muted-foreground">
                                                Joined {dateFormatter.format(new Date(outsource.created_at))}
                                            </span>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell className="text-sm text-muted-foreground">
                                    {outsource.service_type ? outsource.service_type : '—'}
                                </TableCell>
                                <TableCell className="text-sm text-muted-foreground">
                                    {outsource.contact_person || '—'}
                                </TableCell>
                                <TableCell className="text-sm text-muted-foreground">
                                    {outsource.phone || '—'}
                                </TableCell>
                                <TableCell className="text-sm text-muted-foreground">
                                    {outsource.email || '—'}
                                </TableCell>
                                <TableCell>{renderStatusBadge(outsource.status)}</TableCell>
                                <TableCell className="font-semibold">
                                    {outsource.outsource_performances_count ?? 0}
                                </TableCell>
                                <TableCell className="text-center">
                                    <div className="flex justify-center gap-2">
                                        <Button asChild size="sm" variant="ghost">
                                            <Link href={`/outsources/${outsource.id}`}>
                                                <Eye className="h-4 w-4" />
                                            </Link>
                                        </Button>
                                        {hasPermission('outsources.edit') && (
                                            <Button asChild size="sm" variant="ghost">
                                                <Link href={`/outsources/${outsource.id}/edit`}>
                                                    <Edit className="h-4 w-4" />
                                                </Link>
                                            </Button>
                                        )}
                                        {hasPermission('outsources.destroy') && (
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                className="text-destructive hover:bg-destructive/10"
                                                onClick={() => handleDeleteClick(outsource)}
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
                        <TableCell colSpan={columns.length + 2} className="py-8 text-center text-muted-foreground">
                            No outsourcing vendors found.
                            {hasPermission('outsources.create') && (
                                <Link href="/outsources/create" className="ml-1 text-primary underline">
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
                headTitle="Outsourcing"
                title="Outsourcing Vendors"
                description={`Manage ${totalVendors} outsourcing partner${totalVendors === 1 ? '' : 's'} and their performance footprint.`}
                breadcrumbs={breadcrumbs}
                actions={headerActions}
                stats={statsSection}
                tableTitle="Vendor Directory"
                tableDescription="Track vendor capabilities, contacts, and trip coverage"
                tableHeaderExtras={tableHeaderExtras}
                pagination={
                    <InertiaPagination
                        className="mt-4"
                        links={outsources.links}
                        from={outsources.from}
                        to={outsources.to}
                        total={outsources.total}
                        currentPage={outsources.current_page}
                        lastPage={outsources.last_page}
                    />
                }
            >
                {tableContent}
            </ListPageLayout>

            <DeleteConfirmationDialog
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
                title="Delete Vendor"
                description="Are you sure you want to delete this vendor? This action cannot be undone."
                itemName={selectedOutsource?.name}
                onConfirm={handleDeleteConfirm}
                isLoading={isDeleting}
            />
        </>
    );
}
