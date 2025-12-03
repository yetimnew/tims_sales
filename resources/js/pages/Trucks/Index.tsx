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
import { DeleteConfirmationDialog } from '@/components/delete-confirmation-dialog';
import { usePermissions } from '@/hooks/use-permissions';
import { Link, router } from '@inertiajs/react';
import { toast } from '@/hooks/use-toast';
import { type BreadcrumbItem } from '@/types';
import { Plus, Eye, Edit, Trash2, Search, ArrowUpDown, Truck, CheckCircle, Wrench, XCircle, DollarSign, ChevronRight, Gauge, TrendingUp, Users } from 'lucide-react';
import { InertiaPagination } from '@/components/ui/pagination';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
    vehicleType: {
        id: number;
        name: string;
    } | null;
    chasisNumber?: string;
    engineNumber?: string;
    serviceIntervalKM?: number;
    purchasePrice?: number;
    status: string;
    created_at?: string;
}

interface PaginationMeta {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
}

interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

interface UtilizationMetrics {
    window_days: number;
    service_days: number;
    idle_days: number;
    unknown_days: number;
    total_days: number;
    utilization_rate: number | null;
    idle_rate: number | null;
}

interface FinancialMetrics {
    window_days: number;
    total_revenue: number;
    total_cost: number;
    total_profit: number;
    avg_revenue_per_truck: number;
    ton_km: number;
    ton_km_per_birr: number | null;
}

interface StaffingMetrics {
    window_days: number;
    average_tenure_days: number | null;
    assignment_count: number;
    truck_count_with_assignments: number;
    short_tenure_threshold_days: number;
    high_churn_truck_count: number;
    high_churn_trucks: Array<{
        truck_id: number;
        truck_plate: string | null;
        average_tenure_days: number;
        assignment_count: number;
    }>;
    flagged_truck_ids: number[];
}

interface TrucksIndexProps {
    trucks: {
        data: TruckData[];
        meta: PaginationMeta;
        links: PaginationLink[];
    };
    metrics?: {
        total: number;
        active: number;
        maintenance: number;
        fleet_value: number;
        utilization?: UtilizationMetrics | null;
        financial?: FinancialMetrics | null;
        staffing?: StaffingMetrics | null;
    } | null;
    filters: {
        search?: string | null;
        status?: string | null;
        vehicle_type?: number | string | null;
        sort?: string | null;
        direction?: 'asc' | 'desc' | null;
        per_page?: number | null;
    };
    statusOptions: Array<{ label: string; value: string }>;
    vehicleTypes: Array<{ id: number; name: string }>;
    perPageOptions: number[];
}

type NavigateOverrides = {
    search?: string;
    status?: string;
    vehicle_type?: string | number;
    sort?: string;
    direction?: 'asc' | 'desc';
    page?: number;
    per_page?: number;
};

const columns: Array<{ key: string; label: string }> = [
    { key: 'plate', label: 'Plate' },
    { key: 'vehicleType', label: 'Vehicle Type' },
    { key: 'chasisNumber', label: 'Chassis' },
    { key: 'engineNumber', label: 'Engine' },
    { key: 'serviceIntervalKM', label: 'Service (KM)' },
    { key: 'purchasePrice', label: 'Price' },
    { key: 'status', label: 'Status' },
];

const etbCurrencyFormatter = new Intl.NumberFormat('en-ET', {
    style: 'currency',
    currency: 'ETB',
    maximumFractionDigits: 2,
});

const formatETBCurrency = (value?: number | null, options?: Intl.NumberFormatOptions): string => {
    if (value === null || value === undefined || Number.isNaN(Number(value))) {
        return '—';
    }

    if (options) {
        return new Intl.NumberFormat('en-ET', {
            style: 'currency',
            currency: 'ETB',
            maximumFractionDigits: 2,
            ...options,
        }).format(value);
    }

    return etbCurrencyFormatter.format(value);
};

export default function TrucksIndex({ trucks, metrics, filters, statusOptions, vehicleTypes, perPageOptions }: TrucksIndexProps) {
    const { hasPermission } = usePermissions();
    const [searchTerm, setSearchTerm] = React.useState(filters?.search ?? '');
    const [selectedStatus, setSelectedStatus] = React.useState(filters?.status ?? 'all');
    const [selectedVehicleType, setSelectedVehicleType] = React.useState(
        filters?.vehicle_type ? String(filters.vehicle_type) : 'all',
    );
    const [sortBy, setSortBy] = React.useState(filters?.sort ?? 'created_at');
    const [sortDirection, setSortDirection] = React.useState<'asc' | 'desc'>(filters?.direction ?? 'desc');
    const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
    const [selectedTruck, setSelectedTruck] = React.useState<TruckData | null>(null);
    const [isDeleting, setIsDeleting] = React.useState(false);
    const [deleteError, setDeleteError] = React.useState<string | null>(null);
    const availablePerPageOptions = React.useMemo(() => (perPageOptions?.length ? perPageOptions : [10, 15, 25, 50]), [perPageOptions]);
    const resolvedPerPage = React.useMemo(() => {
        const candidate = filters?.per_page;
        if (typeof candidate === 'number' && availablePerPageOptions.includes(candidate)) {
            return candidate;
        }

        return availablePerPageOptions[0] ?? 10;
    }, [filters?.per_page, availablePerPageOptions]);
    const [perPage, setPerPage] = React.useState<string>(() => String(resolvedPerPage));

    React.useEffect(() => {
        setPerPage(String(resolvedPerPage));
    }, [resolvedPerPage]);

    const truckCount = metrics?.total ?? trucks?.meta?.total ?? trucks?.data?.length ?? 0;
    const currentPage = trucks?.meta?.current_page ?? 1;
    const lastPage = trucks?.meta?.last_page ?? 1;
    const perPageCountRaw = trucks?.meta?.per_page ?? Number(perPage);
    const perPageCount = Number.isFinite(perPageCountRaw) && perPageCountRaw > 0
        ? Number(perPageCountRaw)
        : trucks?.data?.length || 1;
    const rowOffset = (currentPage - 1) * perPageCount;
    const activeCount = metrics?.active ?? 0;
    const maintenanceCount = metrics?.maintenance ?? 0;
    const fleetValue = metrics?.fleet_value ?? 0;
    const utilization = metrics?.utilization ?? null;
    const financial = metrics?.financial ?? null;
    const staffing = metrics?.staffing ?? null;
    const utilizationRateValue = utilization?.utilization_rate ?? null;
    const utilizationRateDisplay = utilizationRateValue !== null
        ? `${(utilizationRateValue * 100).toFixed(0)}%`
        : '—';
    const utilizationValueClass = utilizationRateValue === null
        ? 'text-slate-500'
        : utilizationRateValue >= 0.75
            ? 'text-green-600'
            : utilizationRateValue >= 0.5
                ? 'text-yellow-600'
                : 'text-red-600';
    const utilizationDescription = utilization
        ? `Service ${utilization.service_days}d · Idle ${utilization.idle_days}d · Unknown ${utilization.unknown_days}d`
        : 'Utilization data pending';

    const financialWindowDays = financial?.window_days ?? 30;
    const revenueDisplay = formatETBCurrency(financial?.total_revenue ?? 0, {
        notation: 'compact',
        maximumFractionDigits: 2,
    });
    const tonKmPerBirrDisplay = financial?.ton_km_per_birr !== null && financial?.ton_km_per_birr !== undefined
        ? `${financial.ton_km_per_birr.toFixed(2)} ton-km / ETB`
        : 'Ton-km per birr pending';
    const churnWindowDays = staffing?.window_days ?? 180;
    const averageTenureDisplay = staffing?.average_tenure_days !== null && staffing?.average_tenure_days !== undefined
        ? `${staffing.average_tenure_days.toFixed(1)} days`
        : 'Average tenure pending';
    const highChurnCount = staffing?.high_churn_truck_count ?? 0;
    const highChurnThreshold = staffing?.short_tenure_threshold_days ?? 0;
    const highChurnDescription = highChurnCount > 0
        ? `${highChurnCount} truck${highChurnCount === 1 ? '' : 's'} below ${highChurnThreshold}d`
        : 'Stable driver assignments';
    const churnValueClass = highChurnCount > 0 ? 'text-rose-600' : 'text-slate-600';

    const handleNavigate = React.useCallback((overrides: NavigateOverrides = {}) => {
        const hasOverride = (key: keyof NavigateOverrides) => Object.prototype.hasOwnProperty.call(overrides, key);

        const nextSearch = hasOverride('search')
            ? overrides.search
            : (searchTerm.trim() ? searchTerm.trim() : undefined);
        const nextStatus = hasOverride('status')
            ? overrides.status
            : (selectedStatus !== 'all' ? selectedStatus : undefined);
        const nextVehicleType = hasOverride('vehicle_type')
            ? overrides.vehicle_type
            : (selectedVehicleType !== 'all' ? selectedVehicleType : undefined);
        const nextSort = hasOverride('sort') ? overrides.sort ?? sortBy : sortBy;
        const nextDirection = hasOverride('direction') ? overrides.direction ?? sortDirection : sortDirection;
        const nextPerPage = hasOverride('per_page') ? overrides.per_page : Number(perPage);
        const nextPage = hasOverride('page') ? overrides.page : undefined;

        const params: Record<string, string | number | undefined> = {
            search: nextSearch && nextSearch !== '' ? nextSearch : undefined,
            status: nextStatus && nextStatus !== 'all' ? nextStatus : undefined,
            vehicle_type: nextVehicleType && nextVehicleType !== 'all' ? nextVehicleType : undefined,
            sort: nextSort,
            direction: nextDirection,
            page: nextPage,
            per_page: typeof nextPerPage === 'number' && Number.isFinite(nextPerPage) && nextPerPage > 0 ? nextPerPage : undefined,
        };

        Object.keys(params).forEach((key) => {
            if (params[key] === undefined) {
                delete params[key];
            }
        });

        router.get('/trucks', params, { preserveState: true, replace: false });
    }, [searchTerm, selectedStatus, selectedVehicleType, sortBy, sortDirection, perPage]);

    const handleSearchChange = (value: string) => {
        setSearchTerm(value);
        handleNavigate({ search: value.trim() ? value.trim() : undefined, page: 1 });
    };

    const handleStatusChange = (value: string) => {
        setSelectedStatus(value);
        handleNavigate({ status: value !== 'all' ? value : undefined, page: 1 });
    };

    const handleVehicleTypeChange = (value: string) => {
        setSelectedVehicleType(value);
        handleNavigate({ vehicle_type: value !== 'all' ? value : undefined, page: 1 });
    };

    const handlePerPageChange = (value: string) => {
        setPerPage(value);
        const numericValue = Number(value);
        handleNavigate({ per_page: Number.isNaN(numericValue) ? undefined : numericValue, page: 1 });
    };

    const handleSort = (column: string) => {
        const newDirection: 'asc' | 'desc' = sortBy === column && sortDirection === 'asc' ? 'desc' : 'asc';

        setSortBy(column);
        setSortDirection(newDirection);

        handleNavigate({ sort: column, direction: newDirection });
    };

    const handleDeleteClick = (truck: TruckData) => {
        setSelectedTruck(truck);
        setDeleteDialogOpen(true);
        setDeleteError(null);
    };

    const handleDeleteConfirm = () => {
        if (!selectedTruck) return;

        setIsDeleting(true);
        router.delete(`/trucks/${selectedTruck.id}`, {
            onSuccess: () => {
                setDeleteDialogOpen(false);
                setSelectedTruck(null);
                setIsDeleting(false);
                setDeleteError(null);
            },
            onError: (errors) => {
                setIsDeleting(false);
                if (errors && typeof errors === 'object') {
                    const messages = Object.values(errors)
                        .flatMap((value) => (Array.isArray(value) ? value : [value]))
                        .filter((value) => Boolean(value))
                        .join('\n');

                    const fallback = 'Failed to delete truck. Please review the requirements and try again.';
                    setDeleteError(messages || fallback);

                    toast({
                        title: '❌ Delete Failed',
                        description: messages || fallback,
                        variant: 'destructive',
                    });
                } else {
                    const fallback = 'An unexpected error occurred while deleting the truck. Please try again.';
                    setDeleteError(fallback);
                    toast({
                        title: '❌ Delete Failed',
                        description: fallback,
                        variant: 'destructive',
                    });
                }
            },
        });
    };

    const headerActions = (
        <>
            {hasPermission('trucks.create') && (
                <Button asChild>
                    <Link href="/trucks/create">
                        <Plus className="mr-2 h-4 w-4" />
                        Add Truck
                    </Link>
                </Button>
            )}
        </>
    );

    const fleetValueDisplay = formatETBCurrency(fleetValue, {
        notation: 'compact',
        maximumFractionDigits: 2,
    });

    const statsCards = [
        {
            title: 'Total Trucks',
            value: truckCount,
            description: 'All vehicles',
            icon: <Truck className="h-3.5 w-3.5 text-blue-600" />,
            valueClassName: 'text-blue-600',
        },
        {
            title: 'Active',
            value: activeCount,
            description: 'Operational',
            icon: <CheckCircle className="h-3.5 w-3.5 text-green-600" />,
            valueClassName: 'text-green-600',
        },
        {
            title: 'Fleet Value',
            value: fleetValueDisplay,
            description: 'Total fleet value',
            icon: <DollarSign className="h-3.5 w-3.5 text-purple-600" />,
            valueClassName: 'text-purple-600',
        },
        {
            title: `Revenue (${financialWindowDays}d)`,
            value: revenueDisplay,
            description: tonKmPerBirrDisplay,
            icon: <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />,
            valueClassName: 'text-emerald-600',
        },
        {
            title: `Driver Churn (${churnWindowDays}d)`,
            value: averageTenureDisplay,
            description: highChurnDescription,
            icon: <Users className="h-3.5 w-3.5 text-rose-600" />,
            valueClassName: churnValueClass,
        },
        {
            title: `Utilization (${utilization?.window_days ?? 30}d)`,
            value: utilizationRateDisplay,
            description: utilizationDescription,
            icon: <Gauge className="h-3.5 w-3.5 text-slate-600" />,
            valueClassName: utilizationValueClass,
        },
    ];

    const statsSection = (
        <div className="flex w-full gap-2 overflow-x-auto pb-1">
            {statsCards.map((card) => (
                <Card
                    key={card.title}
                    className="min-w-[180px] flex-1 border border-slate-200/70 bg-white/90 shadow-sm dark:border-slate-800/50 dark:bg-slate-900/60"
                >
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 p-2">
                        <CardTitle className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            {card.title}
                        </CardTitle>
                        {card.icon}
                    </CardHeader>
                    <CardContent className="px-2 pb-2 pt-0">
                        <div className={`text-sm font-semibold ${card.valueClassName}`}>{card.value}</div>
                        <p className="text-[11px] text-muted-foreground">{card.description}</p>
                    </CardContent>
                </Card>
            ))}
        </div>
    );

    const tableHeaderExtras = (
        <div className="flex w-full flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="relative w-full md:max-w-sm">
                <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search trucks..."
                    value={searchTerm}
                    onChange={(event) => handleSearchChange(event.target.value)}
                    className="w-full pl-10"
                />
            </div>
            <div className="flex w-full flex-col gap-3 sm:flex-row sm:flex-wrap md:w-auto md:flex-nowrap md:items-center md:justify-end md:gap-4">
                <Select value={selectedStatus} onValueChange={handleStatusChange}>
                    <SelectTrigger className="w-full min-w-[150px] sm:w-auto">
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
                <Select value={selectedVehicleType} onValueChange={handleVehicleTypeChange}>
                    <SelectTrigger className="w-full min-w-[180px] sm:w-auto">
                        <SelectValue placeholder="Vehicle type" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All vehicle types</SelectItem>
                        {vehicleTypes.map((type) => (
                            <SelectItem key={type.id} value={String(type.id)}>
                                {type.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <div className="flex w-full items-center justify-between gap-2 text-sm text-muted-foreground sm:w-auto md:w-auto md:justify-start">
                    <span className="text-xs uppercase tracking-wide text-muted-foreground sm:text-sm">Rows</span>
                    <Select value={perPage} onValueChange={handlePerPageChange}>
                        <SelectTrigger className="w-full sm:w-[130px] md:w-[120px]">
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
        </div>
    );

    const renderHeaderCell = (column: string, label: string) => (
        <TableHead
            key={column}
            className="sticky top-0 z-20 cursor-pointer select-none bg-background transition-colors hover:bg-muted/70"
            onClick={() => handleSort(column)}
        >
            <div className="flex items-center gap-2">
                {label}
                <ArrowUpDown
                    size={14}
                    className={sortBy === column ? 'text-primary' : 'text-muted-foreground opacity-50'}
                />
            </div>
        </TableHead>
    );

    // TODO: Evaluate row virtualization or infinite scrolling once fleet size impacts render costs.
    const tableContent = (
        <Table>
            <TableHeader className="[&_tr]:sticky [&_tr]:top-0 [&_tr]:z-20 [&_tr]:bg-background [&_tr]:shadow-sm">
                <TableRow className="border-b bg-background">
                    <TableHead className="sticky top-0 z-20 w-12 bg-background text-center">#</TableHead>
                    {columns.map(({ key, label }) => renderHeaderCell(key, label))}
                    <TableHead className="sticky top-0 z-20 bg-background text-center">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {trucks?.data && trucks.data.length > 0 ? (
                    trucks.data.map((truck, index) => (
                        <TableRow key={truck.id} className="hover:bg-muted/50">
                            <TableCell className="text-center font-medium">
                                {rowOffset + index + 1}
                            </TableCell>
                            <TableCell className="font-medium">
                                {truck.plate}
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                                {truck.vehicleType?.name || 'N/A'}
                            </TableCell>
                            <TableCell className="text-muted-foreground text-sm">
                                {truck.chasisNumber || '—'}
                            </TableCell>
                            <TableCell className="text-muted-foreground text-sm">
                                {truck.engineNumber || '—'}
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                                {truck.serviceIntervalKM
                                    ? `${truck.serviceIntervalKM.toLocaleString()} km`
                                    : '—'
                                }
                            </TableCell>
                            <TableCell className="font-medium">
                                {formatETBCurrency(truck.purchasePrice)}
                            </TableCell>
                            <TableCell>
                                <Badge
                                    className={`flex items-center gap-1 w-fit ${
                                        truck.status === 'active'
                                            ? 'bg-green-100 text-green-800 border-green-200 hover:bg-green-200'
                                            : truck.status === 'maintenance'
                                            ? 'bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-200'
                                            : 'bg-red-100 text-red-800 border-red-200 hover:bg-red-200'
                                    }`}
                                >
                                    {truck.status === 'active' && <CheckCircle className="h-3 w-3" />}
                                    {truck.status === 'maintenance' && <Wrench className="h-3 w-3" />}
                                    {truck.status === 'inactive' && <XCircle className="h-3 w-3" />}
                                    {truck.status.charAt(0).toUpperCase() + truck.status.slice(1)}
                                </Badge>
                            </TableCell>
                            <TableCell className="text-center">
                                <div className="flex justify-center gap-2">
                                    <Button asChild size="sm" variant="ghost">
                                        <Link href={`/trucks/${truck.id}`}>
                                            <Eye className="h-4 w-4" />
                                        </Link>
                                    </Button>
                                    {hasPermission('trucks.edit') && (
                                        <Button asChild size="sm" variant="ghost">
                                            <Link href={`/trucks/${truck.id}/edit`}>
                                                <Edit className="h-4 w-4" />
                                            </Link>
                                        </Button>
                                    )}
                                    {hasPermission('trucks.destroy') && (
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => handleDeleteClick(truck)}
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
                        <TableCell colSpan={8} className="py-8 text-center text-muted-foreground">
                            No trucks found.
                            {hasPermission('trucks.create') && (
                                <Link href="/trucks/create" className="ml-1 text-primary underline">
                                    Create one
                                </Link>
                            )}
                        </TableCell>
                    </TableRow>
                )}
            </TableBody>
        </Table>
    );

    const mobileContent = trucks?.data && trucks.data.length > 0 ? (
        <div className="flex flex-col gap-3">
            {trucks.data.map((truck, index) => (
                <Card key={truck.id} className="border border-slate-200/70 shadow-sm dark:border-slate-800">
                    <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0 p-4">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                <span>#{rowOffset + index + 1}</span>
                                <span className="hidden sm:inline-flex">Truck</span>
                            </div>
                            <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                                {truck.plate}
                                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                            </CardTitle>
                            <p className="text-sm text-muted-foreground">
                                {truck.vehicleType?.name || 'Vehicle type pending'}
                            </p>
                        </div>
                        <Badge
                            className={`flex items-center gap-1 whitespace-nowrap ${
                                truck.status === 'active'
                                    ? 'bg-green-100 text-green-800 border-green-200 hover:bg-green-200'
                                    : truck.status === 'maintenance'
                                    ? 'bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-200'
                                    : 'bg-red-100 text-red-800 border-red-200 hover:bg-red-200'
                            }`}
                        >
                            {truck.status === 'active' && <CheckCircle className="h-3 w-3" />}
                            {truck.status === 'maintenance' && <Wrench className="h-3 w-3" />}
                            {truck.status === 'inactive' && <XCircle className="h-3 w-3" />}
                            {truck.status.charAt(0).toUpperCase() + truck.status.slice(1)}
                        </Badge>
                    </CardHeader>
                    <CardContent className="space-y-4 p-4 pt-0">
                        <div className="grid grid-cols-1 gap-3 text-sm text-muted-foreground">
                            <div className="flex items-center justify-between">
                                <span className="font-medium text-slate-600 dark:text-slate-300">Chassis</span>
                                <span className="text-right font-semibold text-slate-900 dark:text-slate-100">
                                    {truck.chasisNumber || '—'}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="font-medium text-slate-600 dark:text-slate-300">Engine</span>
                                <span className="text-right font-semibold text-slate-900 dark:text-slate-100">
                                    {truck.engineNumber || '—'}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="font-medium text-slate-600 dark:text-slate-300">Service Interval</span>
                                <span className="text-right font-semibold text-slate-900 dark:text-slate-100">
                                    {truck.serviceIntervalKM
                                        ? `${truck.serviceIntervalKM.toLocaleString()} km`
                                        : '—'}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="font-medium text-slate-600 dark:text-slate-300">Purchase Price</span>
                                <span className="text-right font-semibold text-slate-900 dark:text-slate-100">
                                    {formatETBCurrency(truck.purchasePrice)}
                                </span>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center justify-end gap-2">
                            <Button asChild size="sm" variant="outline" className="flex-1 sm:flex-auto">
                                <Link href={`/trucks/${truck.id}`}>
                                    <Eye className="mr-2 h-4 w-4" />
                                    View
                                </Link>
                            </Button>
                            {hasPermission('trucks.edit') && (
                                <Button asChild size="sm" variant="secondary" className="flex-1 sm:flex-none">
                                    <Link href={`/trucks/${truck.id}/edit`}>
                                        <Edit className="mr-2 h-4 w-4" />
                                        Edit
                                    </Link>
                                </Button>
                            )}
                            {hasPermission('trucks.destroy') && (
                                <Button
                                    size="sm"
                                    variant="destructive"
                                    className="flex-1 sm:flex-none"
                                    onClick={() => handleDeleteClick(truck)}
                                    disabled={isDeleting && selectedTruck?.id === truck.id}
                                >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete
                                </Button>
                            )}
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    ) : (
        <Card className="border border-slate-200/70 shadow-sm dark:border-slate-800">
            <CardContent className="py-8 text-center text-muted-foreground">
                No trucks found.
                {hasPermission('trucks.create') && (
                    <Link href="/trucks/create" className="ml-1 text-primary underline">
                        Create one
                    </Link>
                )}
            </CardContent>
        </Card>
    );

    return (
        <>
            <ListPageLayout
                headTitle="Trucks"
                title="Trucks"
                description={`Manage your fleet of ${truckCount} truck${truckCount !== 1 ? 's' : ''}`}
                breadcrumbs={breadcrumbs}
                actions={headerActions}
                stats={statsSection}
                tableTitle="Truck Inventory"
                tableDescription="Manage and track all vehicles in your fleet"
                tableHeaderExtras={tableHeaderExtras}
                pagination={
                    <InertiaPagination
                        className="mt-4"
                        links={trucks.links}
                        from={trucks.meta?.from ?? undefined}
                        to={trucks.meta?.to ?? undefined}
                        total={trucks.meta?.total ?? undefined}
                        currentPage={currentPage}
                        lastPage={lastPage}
                    />
                }
            >
                <div className="hidden md:block">
                    {tableContent}
                </div>
                <div className="md:hidden">
                    {mobileContent}
                </div>
            </ListPageLayout>

            <DeleteConfirmationDialog
                open={deleteDialogOpen}
                onOpenChange={(open) => {
                    setDeleteDialogOpen(open);
                    if (!open) {
                        setSelectedTruck(null);
                        setDeleteError(null);
                    }
                }}
                title="Delete Truck"
                description="Are you sure you want to delete this truck? This action cannot be undone."
                itemName={selectedTruck?.plate}
                onConfirm={handleDeleteConfirm}
                isLoading={isDeleting}
                errorMessage={deleteError}
                confirmLabel="Delete Truck"
            />
        </>
    );
}
