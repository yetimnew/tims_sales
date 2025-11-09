import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
import { DeleteConfirmationDialog } from '@/components/delete-confirmation-dialog';
import { usePermissions } from '@/hooks/use-permissions';
import { Link, router } from '@inertiajs/react';
import { type BreadcrumbItem } from '@/types';
import { Plus, Eye, Edit, Trash2, Search, ArrowUpDown, FileDown, Truck, CheckCircle, Package, Settings } from 'lucide-react';
import { InertiaPagination } from '@/components/ui/pagination';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import * as React from 'react';
import { useToast } from '@/hooks/use-toast';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Vehicle Types',
        href: '/vehicletypes',
    },
];

interface VehicleType {
    id: number;
    name: string;
    description?: string;
    trucks_count: number;
    active_trucks_count: number;
    created_at: string;
}

interface VehicleTypesIndexProps {
    vehicleTypes: {
        data: VehicleType[];
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
    metrics: {
        total: number;
        with_trucks: number;
        without_trucks: number;
        total_trucks: number;
        active_trucks: number;
    };
    filters: {
        search?: string | null;
        sort?: string | null;
        direction?: 'asc' | 'desc' | null;
        per_page?: number | null;
    };
    perPageOptions: number[];
}

const columns: Array<{ key: keyof VehicleType | 'actions'; label: string; sortable?: boolean; sortKey?: string }> = [
    { key: 'name', label: 'Vehicle Type', sortable: true },
    { key: 'description', label: 'Description' },
    { key: 'trucks_count', label: 'Total Trucks', sortable: true },
    { key: 'active_trucks_count', label: 'Active Trucks', sortable: true },
    { key: 'created_at', label: 'Created', sortable: true },
    { key: 'actions', label: 'Actions' },
];

const formatNumber = (value: number | null | undefined) => {
    if (typeof value !== 'number' || Number.isNaN(value)) {
        return '0';
    }

    return value.toLocaleString();
};

export default function VehicleTypesIndex({ vehicleTypes, metrics, filters, perPageOptions }: VehicleTypesIndexProps) {
    const { hasPermission } = usePermissions();
    const { toast } = useToast();
    const [searchTerm, setSearchTerm] = React.useState(filters?.search ?? '');
    const [sortColumn, setSortColumn] = React.useState<string>(filters?.sort ?? 'name');
    const [sortDirection, setSortDirection] = React.useState<'asc' | 'desc'>(filters?.direction ?? 'asc');
    const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
    const [selectedVehicleType, setSelectedVehicleType] = React.useState<VehicleType | null>(null);
    const [isDeleting, setIsDeleting] = React.useState(false);
    const availablePerPageOptions = React.useMemo(() => (perPageOptions?.length ? perPageOptions : [15, 25, 50, 100]), [perPageOptions]);
    const resolvedPerPage = React.useMemo(() => {
        const candidate = filters?.per_page;
        if (typeof candidate === 'number' && availablePerPageOptions.includes(candidate)) {
            return candidate;
        }

        return availablePerPageOptions[0] ?? 15;
    }, [filters?.per_page, availablePerPageOptions]);
    const [perPage, setPerPage] = React.useState<string>(() => String(resolvedPerPage));

    React.useEffect(() => {
        setPerPage(String(resolvedPerPage));
    }, [resolvedPerPage]);

    const vehicleTypeData = vehicleTypes?.data ?? [];
    const totalVehicleTypes = metrics?.total ?? vehicleTypes?.total ?? 0;
    const currentPage = vehicleTypes?.current_page ?? 1;
    const lastPage = vehicleTypes?.last_page ?? 1;

    const handleNavigate = React.useCallback((overrides: Partial<{ search?: string; sort?: string; direction?: 'asc' | 'desc'; page?: number; per_page?: number }>) => {
        const perPageValue = overrides.per_page !== undefined ? overrides.per_page : Number(perPage);
        const params: Record<string, string | number | undefined> = {
            search: overrides.search !== undefined ? overrides.search : (searchTerm.trim() ? searchTerm.trim() : undefined),
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

        router.get('/vehicletypes', params, { preserveState: true, replace: false });
    }, [searchTerm, sortColumn, sortDirection, perPage]);

    const handleSearchChange = (value: string) => {
        setSearchTerm(value);
        handleNavigate({ search: value.trim() ? value.trim() : undefined, page: 1 });
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

    const handleDeleteClick = (vehicleType: VehicleType) => {
        setSelectedVehicleType(vehicleType);
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = () => {
        if (!selectedVehicleType) {
            return;
        }

        setIsDeleting(true);
        router.delete(`/vehicletypes/${selectedVehicleType.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                setDeleteDialogOpen(false);
                setSelectedVehicleType(null);
                setIsDeleting(false);
                toast({
                    title: 'Vehicle type removed',
                    description: 'The vehicle type was deleted successfully.',
                });
            },
            onError: (errors) => {
                setIsDeleting(false);
                const errorMessages = errors && typeof errors === 'object'
                    ? Object.values(errors).flat().join('\n')
                    : 'Failed to delete vehicle type.';
                toast({
                    title: 'Delete failed',
                    description: errorMessages,
                    variant: 'destructive',
                });
            },
        });
    };

    const handleExport = React.useCallback(() => {
        const params = new URLSearchParams();
        if (searchTerm.trim()) {
            params.set('search', searchTerm.trim());
        }
        params.set('sort', sortColumn);
        params.set('direction', sortDirection);

        const queryString = params.toString();
        window.location.href = queryString ? `/vehicletypes/export/csv?${queryString}` : '/vehicletypes/export/csv';
    }, [searchTerm, sortColumn, sortDirection]);

    const headerActions = (
        <>
            {hasPermission('vehicletypes.export') && (
                <Button variant="outline" onClick={handleExport}>
                    <FileDown className="mr-2 h-4 w-4" />
                    Export CSV
                </Button>
            )}
            {hasPermission('vehicletypes.create') && (
                <Button asChild>
                    <Link href="/vehicletypes/create">
                        <Plus className="mr-2 h-4 w-4" />
                        Add Vehicle Type
                    </Link>
                </Button>
            )}
        </>
    );

    const statsCards = [
        {
            title: 'Vehicle Types',
            value: formatNumber(metrics?.total ?? 0),
            description: `${formatNumber(metrics?.with_trucks ?? 0)} types with trucks`,
            icon: <Settings className="h-3.5 w-3.5 text-blue-600" />,
            valueClassName: 'text-blue-600',
        },
        {
            title: 'Total Trucks',
            value: formatNumber(metrics?.total_trucks ?? 0),
            description: 'Across filtered types',
            icon: <Truck className="h-3.5 w-3.5 text-emerald-600" />,
            valueClassName: 'text-emerald-600',
        },
        {
            title: 'Active Trucks',
            value: formatNumber(metrics?.active_trucks ?? 0),
            description: 'Currently active',
            icon: <CheckCircle className="h-3.5 w-3.5 text-purple-600" />,
            valueClassName: 'text-purple-600',
        },
        {
            title: 'Empty Types',
            value: formatNumber(metrics?.without_trucks ?? 0),
            description: 'No trucks assigned',
            icon: <Package className="h-3.5 w-3.5 text-amber-600" />,
            valueClassName: 'text-amber-600',
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
                    placeholder="Search vehicle types..."
                    value={searchTerm}
                    onChange={(event) => handleSearchChange(event.target.value)}
                    className="pl-10"
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

    const renderHeaderCell = (column: { key: keyof VehicleType | 'actions'; label: string; sortable?: boolean; sortKey?: string }) => {
        const sortable = column.sortable ?? false;
        const columnKey = column.sortKey ?? column.key;
        const isActive = sortColumn === columnKey;

        return (
            <TableHead
                key={column.key}
                className={`sticky top-0 z-20 bg-background ${sortable ? 'cursor-pointer hover:bg-muted/70' : 'cursor-default'} select-none transition-colors`}
                onClick={sortable ? () => handleSort(String(columnKey)) : undefined}
            >
                <div className="flex items-center gap-2">
                    {column.label}
                    {sortable && (
                        <ArrowUpDown
                            size={14}
                            className={isActive ? 'text-primary' : 'text-muted-foreground opacity-50'}
                        />
                    )}
                </div>
            </TableHead>
        );
    };

    const tableContent = (
        <Table>
            <TableHeader className="[&_tr]:sticky [&_tr]:top-0 [&_tr]:z-20 [&_tr]:bg-background [&_tr]:shadow-sm">
                <TableRow className="border-b bg-background">
                    {columns.map((column) =>
                        column.key === 'actions' ? (
                            <TableHead key={column.key} className="sticky top-0 z-20 bg-background text-center">
                                {column.label}
                            </TableHead>
                        ) : (renderHeaderCell(column))
                    )}
                </TableRow>
            </TableHeader>
            <TableBody>
                {vehicleTypeData.length > 0 ? (
                    vehicleTypeData.map((vehicleType) => (
                        <TableRow key={vehicleType.id} className="hover:bg-muted/50">
                            <TableCell className="font-medium">{vehicleType.name}</TableCell>
                            <TableCell className="text-muted-foreground">
                                {vehicleType.description || '—'}
                            </TableCell>
                            <TableCell className="font-medium">
                                {formatNumber(vehicleType.trucks_count)}
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                                {formatNumber(vehicleType.active_trucks_count)}
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                                {vehicleType.created_at ? new Date(vehicleType.created_at).toLocaleDateString() : '—'}
                            </TableCell>
                            <TableCell className="text-center">
                                <div className="flex justify-center gap-2">
                                    <Button asChild size="sm" variant="ghost">
                                        <Link href={`/vehicletypes/${vehicleType.id}`}>
                                            <Eye className="h-4 w-4" />
                                        </Link>
                                    </Button>
                                    {hasPermission('vehicletypes.edit') && (
                                        <Button asChild size="sm" variant="ghost">
                                            <Link href={`/vehicletypes/${vehicleType.id}/edit`}>
                                                <Edit className="h-4 w-4" />
                                            </Link>
                                        </Button>
                                    )}
                                    {hasPermission('vehicletypes.destroy') && (
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => handleDeleteClick(vehicleType)}
                                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
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
                        <TableCell colSpan={columns.length} className="py-8 text-center text-muted-foreground">
                            No vehicle types found.
                            {hasPermission('vehicletypes.create') && (
                                <Link href="/vehicletypes/create" className="ml-1 text-primary underline">
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
                headTitle="Vehicle Types"
                title="Vehicle Types"
                description={`Manage vehicle types and categories. Total: ${totalVehicleTypes}`}
                breadcrumbs={breadcrumbs}
                actions={headerActions}
                stats={statsSection}
                tableTitle="Vehicle Types"
                tableDescription="Manage your fleet of vehicle types"
                tableHeaderExtras={tableHeaderExtras}
                pagination={
                    <InertiaPagination
                        className="mt-4"
                        links={vehicleTypes.links}
                        from={vehicleTypes.from}
                        to={vehicleTypes.to}
                        total={vehicleTypes.total}
                        currentPage={currentPage}
                        lastPage={lastPage}
                    />
                }
            >
                {tableContent}
            </ListPageLayout>

            <DeleteConfirmationDialog
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
                title="Delete Vehicle Type"
                description="Are you sure you want to delete this vehicle type? This action cannot be undone."
                itemName={selectedVehicleType?.name || ''}
                onConfirm={handleDeleteConfirm}
                isLoading={isDeleting}
            />
        </>
    );
}



