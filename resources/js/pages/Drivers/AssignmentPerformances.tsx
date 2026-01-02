import { useMemo } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { InertiaPagination } from '@/components/ui/pagination';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
    Activity,
    ArrowLeft,
    ArrowUpRight,
    BarChart3,
    Calendar,
    Flame,
    Gauge,
    Navigation,
    Truck,
} from 'lucide-react';

type DriverSummary = {
    id: number;
    name: string;
    driverid?: string | null;
};

type AssignmentSummary = {
    id: number;
    driver_id: number;
    driverid?: string | null;
    truck_id?: number | null;
    plate?: string | null;
    status?: string | null;
    is_attached: boolean;
    date_recived?: string | null;
    date_detach?: string | null;
    truck?: {
        id: number;
        plate: string;
    } | null;
};

type PerformanceRow = {
    id: number;
    driver_truck_id?: number | null;
    DateDispach?: string | null;
    DistanceWCargo?: number | null;
    DistanceWOCargo?: number | null;
    total_distance_km?: number | null;
    fuelInLitter?: number | null;
    fuelInBirr?: number | null;
    cargo_volume_mt?: number | null;
    cargo_weight_tons?: number | null;
    tonkm?: number | null;
    load_phase?: string | null;
    satus?: string | null;
    is_returned?: boolean;
    returned_date?: string | null;
    trip_duration_days?: number | null;
    comment?: string | null;
    origin?: { id: number; name: string } | null;
    destination?: { id: number; name: string } | null;
    operation?: { id: number; number?: string | null; status?: string | null } | null;
};

type PaginatedPerformances = {
    data: PerformanceRow[];
    meta: {
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
        from: number | null;
        to: number | null;
    };
    links: Array<{ url: string | null; label: string; active: boolean }>;
};

type SummaryMetrics = {
    total_records: number;
    returned_trips: number;
    active_trips: number;
    total_distance_km: number;
    distance_with_cargo: number;
    distance_without_cargo: number;
    total_cargo_tonnage: number;
    total_ton_km: number;
    avg_fuel_efficiency: number | null;
    total_fuel_liters: number;
    total_fuel_cost: number;
    first_dispatch?: string | null;
    last_dispatch?: string | null;
};

type DriversAssignmentPerformancesProps = {
    driver: DriverSummary;
    assignment: AssignmentSummary;
    summary: SummaryMetrics;
    performances: PaginatedPerformances;
    perPage: number;
    perPageOptions: number[];
};

const numberFormatter = new Intl.NumberFormat('en-ET');
const currencyFormatter = new Intl.NumberFormat('en-ET', {
    style: 'currency',
    currency: 'ETB',
    maximumFractionDigits: 2,
});
const longDateFormatter = new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
});
const shortDateFormatter = new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
});
const dateTimeFormatter = new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
});

const formatNumber = (value?: number | null, options?: Intl.NumberFormatOptions): string => {
    if (value === null || value === undefined || Number.isNaN(Number(value))) {
        return 'N/A';
    }

    if (options) {
        return new Intl.NumberFormat('en-ET', options).format(value);
    }

    return numberFormatter.format(value);
};

const formatKilometers = (value?: number | null, maximumFractionDigits = 0): string => {
    if (value === null || value === undefined || Number.isNaN(Number(value))) {
        return 'N/A';
    }

    return `${formatNumber(value, {
        minimumFractionDigits: maximumFractionDigits,
        maximumFractionDigits,
    })} KM`;
};

const formatTons = (value?: number | null, maximumFractionDigits = 1): string => {
    if (value === null || value === undefined || Number.isNaN(Number(value))) {
        return 'N/A';
    }

    return `${formatNumber(value, {
        minimumFractionDigits: value > 0 && value < 1 ? maximumFractionDigits : 0,
        maximumFractionDigits,
    })} t`;
};

const formatCurrency = (value?: number | null): string => {
    if (value === null || value === undefined || Number.isNaN(Number(value))) {
        return 'N/A';
    }

    return currencyFormatter.format(value);
};

const formatDate = (value?: string | null, formatter: Intl.DateTimeFormat = longDateFormatter): string => {
    if (!value) {
        return 'N/A';
    }

    const parsed = new Date(value);

    if (Number.isNaN(parsed.getTime())) {
        return 'N/A';
    }

    return formatter.format(parsed);
};

const formatDays = (value?: number | null, maximumFractionDigits = 0): string => {
    if (value === null || value === undefined || Number.isNaN(Number(value))) {
        return 'N/A';
    }

    const rounded = Number(value.toFixed(maximumFractionDigits));

    if (rounded === 1) {
        return '1 day';
    }

    const formatted = rounded % 1 === 0 ? `${rounded}` : rounded.toFixed(maximumFractionDigits);

    return `${formatted} days`;
};

const statusBadgeTone = (status?: string | null) => {
    if (!status) {
        return 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-200';
    }

    switch (status.toLowerCase()) {
        case 'completed':
        case 'returned':
        case 'active':
            return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200';
        case 'in transit':
        case 'in-progress':
        case 'open':
            return 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200';
        case 'delayed':
        case 'issue':
            return 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200';
        default:
            return 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-200';
    }
};

export default function DriversAssignmentPerformances({
    driver,
    assignment,
    summary,
    performances,
    perPage,
    perPageOptions,
}: DriversAssignmentPerformancesProps) {
    const breadcrumbs: BreadcrumbItem[] = useMemo(() => [
        { title: 'Drivers', href: '/drivers' },
        { title: driver.name, href: `/drivers/${driver.id}` },
        {
            title: 'Assignment performances',
            href: `/drivers/${driver.id}/assignments/${assignment.id}/performances`,
        },
    ], [driver.id, driver.name, assignment.id]);

    const assignmentStatusLabel = assignment.status
        ? `${assignment.status.charAt(0).toUpperCase()}${assignment.status.slice(1)}`
        : assignment.is_attached
            ? 'Attached'
            : 'Detached';

    const handlePerPageChange = (value: string) => {
        router.get(
            `/drivers/${driver.id}/assignments/${assignment.id}/performances`,
            { per_page: value },
            { preserveScroll: true, preserveState: true },
        );
    };

    const meta = performances.meta;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${driver.name} · ${assignment.plate ?? 'Assignment'} · Performances`} />
            <div className="flex min-h-0 flex-1 flex-col gap-6 rounded-xl p-4">
                <div className="rounded-lg border border-slate-200 bg-gradient-to-r from-slate-50 via-blue-50 to-indigo-50 p-6 dark:border-slate-700 dark:from-slate-900 dark:via-blue-950/20 dark:to-indigo-950/30">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
                            <Button
                                variant="outline"
                                size="sm"
                                asChild
                                className="w-full gap-2 border-slate-300 hover:bg-slate-100 dark:border-slate-600 dark:hover:bg-slate-800 lg:w-auto"
                            >
                                <Link href={`/drivers/${driver.id}`}>
                                    <ArrowLeft className="h-4 w-4" />
                                    Back to driver
                                </Link>
                            </Button>
                            <div className="flex items-center gap-4">
                                <div className="rounded-xl bg-blue-100 p-3 dark:bg-blue-900/30">
                                    <Truck className="h-6 w-6 text-blue-600 dark:text-blue-300" />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                                        {driver.name} · {assignment.plate ?? 'Assignment'}
                                    </h1>
                                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                                        Performance records for this driver and truck pairing
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-3">
                            <Badge className={`${assignment.is_attached ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200' : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-200'}`}>
                                {assignment.is_attached ? 'Attached' : 'Detached'}
                            </Badge>
                            <Badge className={`${statusBadgeTone(assignment.status)}`}>
                                {assignmentStatusLabel}
                            </Badge>
                        </div>
                    </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-3">
                    <Card className="border-0 bg-gradient-to-br from-background to-muted/20 shadow-lg lg:col-span-2">
                        <CardHeader className="border-b bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <Calendar className="h-5 w-5 text-indigo-600" /> Assignment timeline
                            </CardTitle>
                            <CardDescription>Lifecycle information for this pairing</CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-4 md:grid-cols-2">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Driver</p>
                                <p className="mt-1 text-base font-semibold text-slate-900 dark:text-slate-100">{driver.name}</p>
                                {driver.driverid && (
                                    <p className="text-xs text-muted-foreground">ID: {driver.driverid}</p>
                                )}
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Truck</p>
                                <p className="mt-1 text-base font-semibold text-slate-900 dark:text-slate-100">{assignment.plate ?? 'Unknown truck'}</p>
                                {assignment.truck?.id && (
                                    <p className="text-xs text-muted-foreground">Truck ID: {assignment.truck.id}</p>
                                )}
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Assigned on</p>
                                <p className="mt-1 text-sm">{formatDate(assignment.date_recived)}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Detached on</p>
                                <p className="mt-1 text-sm">{formatDate(assignment.date_detach)}</p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-0 bg-gradient-to-br from-background to-muted/20 shadow-lg">
                        <CardHeader className="border-b bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-950/20 dark:to-green-950/20">
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <BarChart3 className="h-5 w-5 text-emerald-600" /> Summary snapshot
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 text-sm">
                            <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">Total records</span>
                                <span className="font-semibold">{formatNumber(summary.total_records)}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">Completed trips</span>
                                <span className="font-semibold">{formatNumber(summary.returned_trips)}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">Active trips</span>
                                <span className="font-semibold">{formatNumber(summary.active_trips)}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">Distance (KM)</span>
                                <span className="font-semibold">{formatKilometers(summary.total_distance_km, 0)}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">Cargo moved</span>
                                <span className="font-semibold">{formatTons(summary.total_cargo_tonnage, 1)}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">Fuel efficiency</span>
                                <span className="font-semibold">{summary.avg_fuel_efficiency ? `${summary.avg_fuel_efficiency.toFixed(2)} KM/L` : 'N/A'}</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Card className="border-0 bg-gradient-to-br from-background to-muted/20 shadow-lg">
                    <CardHeader className="border-b bg-gradient-to-r from-amber-50 via-orange-50 to-yellow-50 dark:from-amber-950/20 dark:via-orange-950/20 dark:to-yellow-950/20">
                        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                            <div>
                                <CardTitle className="flex items-center gap-2 text-xl">
                                    <Activity className="h-5 w-5 text-amber-600" /> Performance records
                                </CardTitle>
                                <CardDescription>Operational history for the selected assignment</CardDescription>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="hidden text-sm text-muted-foreground md:block">
                                    Dispatch window: {formatDate(summary.first_dispatch, shortDateFormatter)} – {formatDate(summary.last_dispatch, shortDateFormatter)}
                                </div>
                                <Select value={String(perPage)} onValueChange={handlePerPageChange}>
                                    <SelectTrigger className="w-32">
                                        <SelectValue placeholder="Per page" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {perPageOptions.map(option => (
                                            <SelectItem key={option} value={String(option)}>
                                                Show {option}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            <div className="rounded-lg border border-amber-200 bg-amber-50/70 p-4 text-sm dark:border-amber-800 dark:bg-amber-900/20">
                                <div className="flex items-center gap-2 text-xs uppercase text-muted-foreground">
                                    <Navigation className="h-4 w-4" /> Loaded distance
                                </div>
                                <div className="mt-2 text-lg font-semibold text-amber-900 dark:text-amber-100">
                                    {formatKilometers(summary.distance_with_cargo, 1)}
                                </div>
                            </div>
                            <div className="rounded-lg border border-blue-200 bg-blue-50/70 p-4 text-sm dark:border-blue-800 dark:bg-blue-900/20">
                                <div className="flex items-center gap-2 text-xs uppercase text-muted-foreground">
                                    <Gauge className="h-4 w-4" /> Empty distance
                                </div>
                                <div className="mt-2 text-lg font-semibold text-blue-900 dark:text-blue-100">
                                    {formatKilometers(summary.distance_without_cargo, 1)}
                                </div>
                            </div>
                            <div className="rounded-lg border border-emerald-200 bg-emerald-50/70 p-4 text-sm dark:border-emerald-800 dark:bg-emerald-900/20">
                                <div className="flex items-center gap-2 text-xs uppercase text-muted-foreground">
                                    <Flame className="h-4 w-4" /> Fuel used
                                </div>
                                <div className="mt-2 text-lg font-semibold text-emerald-900 dark:text-emerald-100">
                                    {formatNumber(summary.total_fuel_liters, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} L
                                </div>
                            </div>
                            <div className="rounded-lg border border-indigo-200 bg-indigo-50/70 p-4 text-sm dark:border-indigo-800 dark:bg-indigo-900/20">
                                <div className="flex items-center gap-2 text-xs uppercase text-muted-foreground">
                                    <BarChart3 className="h-4 w-4" /> Ton-KM
                                </div>
                                <div className="mt-2 text-lg font-semibold text-indigo-900 dark:text-indigo-100">
                                    {formatNumber(summary.total_ton_km, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </div>
                            </div>
                        </div>

                        {performances.data.length > 0 ? (
                            <div className="rounded-xl border border-slate-200 dark:border-slate-700">
                                <div className="overflow-x-auto">
                                    <div className="max-h-[28rem] overflow-y-auto">
                                        <Table className="min-w-[1100px]">
                                    <TableHeader className="bg-slate-50/80 dark:bg-slate-900/40">
                                        <TableRow>
                                            <TableHead className="w-[140px]">Dispatch</TableHead>
                                            <TableHead>Route</TableHead>
                                            <TableHead className="text-right">Distance</TableHead>
                                            <TableHead className="text-right">Fuel</TableHead>
                                            <TableHead className="text-right">Cargo</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead className="text-right">Ton-KM</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {performances.data.map((row) => {
                                            const route = [row.origin?.name, row.destination?.name].filter(Boolean).join(' → ') || 'N/A';
                                            const statusTone = row.is_returned ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200' : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200';

                                            return (
                                                <TableRow key={row.id} className="bg-white/70 transition hover:bg-blue-50/60 dark:bg-slate-900/60 dark:hover:bg-blue-950/30">
                                                    <TableCell className="font-medium text-slate-900 dark:text-slate-100">
                                                        <div>{formatDate(row.DateDispach, dateTimeFormatter)}</div>
                                                        <div className="text-xs text-muted-foreground">Duration {formatDays(row.trip_duration_days, 0)}</div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="text-sm font-medium text-slate-900 dark:text-slate-100">{route}</div>
                                                        {row.operation?.number && (
                                                            <div className="text-xs text-muted-foreground">Op #{row.operation.number}</div>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-right text-sm font-semibold">
                                                        {formatKilometers(row.total_distance_km, 1)}
                                                        <div className="text-xs text-muted-foreground">
                                                            Loaded {formatKilometers(row.DistanceWCargo, 1)}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-right text-sm font-semibold">
                                                        {formatNumber(row.fuelInLitter, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} L
                                                        <div className="text-xs text-muted-foreground">{formatCurrency(row.fuelInBirr)}</div>
                                                    </TableCell>
                                                    <TableCell className="text-right text-sm font-semibold">
                                                        {formatTons(row.cargo_weight_tons ?? row.cargo_volume_mt, 1)}
                                                    </TableCell>
                                                    <TableCell className="text-sm">
                                                        <div className="flex flex-col gap-2">
                                                            <Badge className={statusTone}>{row.is_returned ? 'Returned' : 'In transit'}</Badge>
                                                            {row.satus && <Badge className={statusBadgeTone(row.satus)}>{row.satus}</Badge>}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-right text-sm font-semibold">
                                                        {formatNumber(row.tonkm, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <Button variant="ghost" size="sm" asChild>
                                                            <Link href={`/performances/${row.id}`} className="inline-flex items-center gap-1">
                                                                View
                                                                <ArrowUpRight className="h-4 w-4" />
                                                            </Link>
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                        </Table>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="py-12 text-center text-muted-foreground">
                                <Activity className="mx-auto mb-4 h-12 w-12 opacity-60" />
                                <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">No performance records found</p>
                                <p className="mt-2 text-sm">Records will appear here once performances are captured for this assignment.</p>
                            </div>
                        )}

                        <InertiaPagination
                            links={performances.links}
                            from={meta.from ?? undefined}
                            to={meta.to ?? undefined}
                            total={meta.total}
                            currentPage={meta.current_page}
                            lastPage={meta.last_page}
                        />
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
