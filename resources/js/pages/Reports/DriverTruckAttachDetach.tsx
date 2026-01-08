import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { type BreadcrumbItem } from '@/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Link2, Clock, Users, UserMinus, Truck, ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { ReportPageLayout } from '@/components/report/report-page-layout';

interface Row {
    id: number;
    driver_name: string;
    truck_plate: string;
    assigned_date?: string | null;
    assigned_display?: string | null;
    assigned_relative?: string | null;
    unassigned_date?: string | null;
    unassigned_display?: string | null;
    unassigned_relative?: string | null;
    is_attached: boolean;
}

interface Summary {
    totalAssignments: number;
    attached: number;
    detached: number;
    currentActive: number;
    availableDrivers: number;
    availableTrucks: number;
}

interface CurrentAssignment {
    id: number;
    driver: { id: number; name: string; mobile?: string | null } | null;
    truck: { id: number; plate: string; status?: string | null } | null;
    assignedDate?: string | null;
    assignedDisplay?: string | null;
    assignedRelative?: string | null;
    daysActive?: number | null;
}

interface AvailableDriver {
    id: number;
    name: string;
    mobile?: string | null;
    hireDate?: string | null;
    hireDisplay?: string | null;
    lastDetachedDate?: string | null;
    lastDetachedDisplay?: string | null;
    lastDetachedRelative?: string | null;
}

interface AvailableTruck {
    id: number;
    plate: string;
    status?: string | null;
    serviceStartDate?: string | null;
    serviceStartDisplay?: string | null;
    lastDetachedDate?: string | null;
    lastDetachedDisplay?: string | null;
    lastDetachedRelative?: string | null;
}

interface DriverTruckAttachDetachProps {
    rows: Row[];
    summary: Summary;
    currentAssignments: CurrentAssignment[];
    availableDrivers: AvailableDriver[];
    availableTrucks: AvailableTruck[];
}

export default function DriverTruckAttachDetach({ rows, summary, currentAssignments, availableDrivers, availableTrucks }: DriverTruckAttachDetachProps) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Reports', href: '/reports/driver-truck-attach-detach' },
        { title: 'Attach / Detach History', href: '/reports/driver-truck-attach-detach' },
    ];

    const dateTimeFormatter = useMemo(() => new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }), []);
    const dateFormatter = useMemo(() => new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }), []);

    const formatDateTime = (value?: string | null, fallback?: string | null): string => {
        if (fallback) {
            return fallback;
        }

        if (!value) {
            return '—';
        }

        const parsed = new Date(value);

        if (Number.isNaN(parsed.getTime())) {
            return '—';
        }

        return dateTimeFormatter.format(parsed);
    };

    const formatDate = (value?: string | null, fallback?: string | null): string => {
        if (fallback) {
            return fallback;
        }

        if (!value) {
            return '—';
        }

        const parsed = new Date(value);

        if (Number.isNaN(parsed.getTime())) {
            return '—';
        }

        return dateFormatter.format(parsed);
    };

    const formatRelative = (value?: string | null): string => value ?? '—';

    const formatDuration = (start?: string | null, end?: string | null): string => {
        if (!start) {
            return '—';
        }

        const startDate = new Date(start);
        const endDate = end ? new Date(end) : new Date();

        if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
            return '—';
        }

        const diffMs = endDate.getTime() - startDate.getTime();

        if (diffMs <= 0) {
            return '—';
        }

        const totalMinutes = Math.floor(diffMs / 60000);
        const days = Math.floor(totalMinutes / (60 * 24));
        const hours = Math.floor((totalMinutes - days * 24 * 60) / 60);
        const minutes = totalMinutes - days * 24 * 60 - hours * 60;

        const segments: string[] = [];

        if (days > 0) {
            segments.push(`${days}d`);
        }

        if (hours > 0) {
            segments.push(`${hours}h`);
        }

        if (minutes > 0 && segments.length < 2) {
            segments.push(`${minutes}m`);
        }

        if (segments.length === 0) {
            return '<1m';
        }

        return segments.join(' ');
    };

    const metrics = useMemo(
        () => [
            {
                label: 'Total Assignments',
                value: summary.totalAssignments,
                Icon: Link2,
                iconClasses: 'bg-sky-100 text-sky-600 dark:bg-sky-500/20 dark:text-sky-200',
            },
            {
                label: 'Active Attachments',
                value: summary.currentActive,
                Icon: Clock,
                iconClasses: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-200',
            },
            {
                label: 'Detached Records',
                value: summary.detached,
                Icon: UserMinus,
                iconClasses: 'bg-rose-100 text-rose-600 dark:bg-rose-500/20 dark:text-rose-200',
            },
            {
                label: 'Available Drivers',
                value: summary.availableDrivers,
                Icon: Users,
                iconClasses: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-200',
            },
            {
                label: 'Available Trucks',
                value: summary.availableTrucks,
                Icon: Truck,
                iconClasses: 'bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-200',
            },
        ],
        [summary]
    );

    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'detached'>('all');
    const [perPage, setPerPage] = useState(25);
    const [page, setPage] = useState(1);

    const filteredRows = useMemo(() => {
        const normalizedQuery = searchQuery.trim().toLowerCase();
        return rows.filter((row) => {
            const matchesStatus =
                statusFilter === 'all' || (statusFilter === 'active' ? row.is_attached : !row.is_attached);

            if (!matchesStatus) {
                return false;
            }

            if (normalizedQuery.length === 0) {
                return true;
            }

            const searchableFields = [
                row.driver_name ?? '',
                row.truck_plate ?? '',
                row.assigned_display ?? '',
                row.unassigned_display ?? '',
            ];

            return searchableFields.some((field) => field.toLowerCase().includes(normalizedQuery));
        });
    }, [rows, searchQuery, statusFilter]);

    useEffect(() => {
        setPage(1);
    }, [searchQuery, statusFilter, perPage]);

    const totalPages = useMemo(() => {
        const pageCount = Math.ceil(filteredRows.length / perPage);
        return pageCount > 0 ? pageCount : 1;
    }, [filteredRows.length, perPage]);

    useEffect(() => {
        if (page > totalPages) {
            setPage(totalPages);
        }
    }, [page, totalPages]);

    const startIndex = (page - 1) * perPage;
    const paginatedRows = useMemo(
        () => filteredRows.slice(startIndex, startIndex + perPage),
        [filteredRows, startIndex, perPage]
    );

    const totalCount = filteredRows.length;
    const showingFrom = totalCount === 0 ? 0 : startIndex + 1;
    const showingTo = totalCount === 0 ? 0 : startIndex + paginatedRows.length;
    const perPageOptions = [25, 50, 100, 200];

    return (
        <ReportPageLayout
            title="Driver-Truck Attach / Detach History"
            breadcrumbs={breadcrumbs}
            icon={<Link2 className="h-6 w-6" />}
            summarySection={
                <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                        {metrics.map(({ label, value, Icon, iconClasses }) => (
                            <Card key={label} className="border border-slate-200 bg-white/95 shadow-sm dark:border-slate-800/70 dark:bg-slate-900/70">
                                <CardContent className="flex items-center gap-3 p-4">
                                    <span className={`flex h-10 w-10 items-center justify-center rounded-full ${iconClasses}`}>
                                        <Icon className="h-5 w-5" />
                                    </span>
                                    <div className="space-y-0.5">
                                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</p>
                                        <p className="text-lg font-semibold text-slate-900 dark:text-slate-50">{value.toLocaleString()}</p>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                </section>
            }
            canExport={false}
            contentClassName="p-0"
        >
            <div className="space-y-6 p-6">
                <section className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
                        <Card className="border border-slate-200 bg-white/95 shadow-sm dark:border-slate-800/70 dark:bg-slate-900/70">
                            <CardHeader className="space-y-2 border-b border-slate-200/60 pb-5 dark:border-slate-800/60">
                                <CardTitle className="text-lg font-semibold text-slate-900 dark:text-slate-50">{`${currentAssignments.length.toLocaleString()} Current Attachments`}</CardTitle>
                                <CardDescription className="text-sm">Drivers paired with trucks and actively in service.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-3 p-6 max-h-96 overflow-y-auto pr-4">
                                {currentAssignments.length > 0 ? (
                                    currentAssignments.map((assignment) => (
                                        <div key={assignment.id} className="rounded-xl border border-slate-200/70 bg-slate-50/70 p-4 dark:border-slate-800/60 dark:bg-slate-950/30">
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="space-y-1">
                                                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{assignment.driver?.name ?? 'Driver removed'}</p>
                                                    <p className="text-xs text-slate-500 dark:text-slate-400">{assignment.driver?.mobile ?? 'No contact on file'}</p>
                                                </div>
                                                <div className="text-right space-y-1">
                                                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{assignment.truck?.plate ?? 'Truck removed'}</p>
                                                    <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">{assignment.truck?.status ?? 'Status unknown'}</p>
                                                </div>
                                            </div>
                                            <div className="mt-3 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                                                <span>Assigned {formatDate(assignment.assignedDate, assignment.assignedDisplay)}</span>
                                                <span>{formatRelative(assignment.assignedRelative)}</span>
                                            </div>
                                            <div className="mt-1 text-xs font-medium text-emerald-600 dark:text-emerald-300">
                                                {typeof assignment.daysActive === 'number' ? (assignment.daysActive > 0 ? `${assignment.daysActive}d active` : '<1d active') : '—'}
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-sm text-muted-foreground">No active attachments right now.</p>
                                )}
                            </CardContent>
                        </Card>

                        <Card className="border border-slate-200 bg-white/95 shadow-sm dark:border-slate-800/70 dark:bg-slate-900/70">
                            <CardHeader className="space-y-2 border-b border-slate-200/60 pb-5 dark:border-slate-800/60">
                                <CardTitle className="text-lg font-semibold text-slate-900 dark:text-slate-50">{`${availableDrivers.length.toLocaleString()} Available Drivers`}</CardTitle>
                                <CardDescription className="text-sm">Drivers ready to be attached to a truck.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-3 p-6 max-h-96 overflow-y-auto pr-4">
                                {availableDrivers.length > 0 ? (
                                    <ul className="space-y-3">
                                        {availableDrivers.map((driver) => (
                                            <li key={driver.id} className="flex items-center justify-between gap-4 rounded-xl border border-slate-200/70 bg-white/80 px-4 py-3 dark:border-slate-800/60 dark:bg-slate-950/30">
                                                <div>
                                                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{driver.name}</p>
                                                    <p className="text-xs text-slate-500 dark:text-slate-400">{driver.mobile ?? 'No contact available'}</p>
                                                </div>
                                                <div className="text-right space-y-1">
                                                    <div>
                                                        <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">Last detached</p>
                                                        <p className="text-xs text-slate-500 dark:text-slate-400">{formatDateTime(driver.lastDetachedDate, driver.lastDetachedDisplay)}</p>
                                                        <p className="text-[0.65rem] text-slate-400 dark:text-slate-500">{driver.lastDetachedRelative ?? 'No detach history yet'}</p>
                                                    </div>
                                                    <p className="text-[0.65rem] text-slate-400 dark:text-slate-500">Hired {formatDate(driver.hireDate, driver.hireDisplay)}</p>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="text-sm text-muted-foreground">All drivers are currently assigned.</p>
                                )}
                            </CardContent>
                        </Card>

                        <Card className="border border-slate-200 bg-white/95 shadow-sm dark:border-slate-800/70 dark:bg-slate-900/70">
                            <CardHeader className="space-y-2 border-b border-slate-200/60 pb-5 dark:border-slate-800/60">
                                <CardTitle className="text-lg font-semibold text-slate-900 dark:text-slate-50">{`${availableTrucks.length.toLocaleString()} Available Trucks`}</CardTitle>
                                <CardDescription className="text-sm">Trucks currently released and unassigned.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-3 p-6 max-h-96 overflow-y-auto pr-4">
                                {availableTrucks.length > 0 ? (
                                    <ul className="space-y-3">
                                        {availableTrucks.map((truck) => (
                                            <li key={truck.id} className="flex items-center justify-between gap-4 rounded-xl border border-slate-200/70 bg-white/80 px-4 py-3 dark:border-slate-800/60 dark:bg-slate-950/30">
                                                <div className="space-y-1">
                                                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{truck.plate}</p>
                                                    <Badge variant="outline" className="border-slate-300 text-[0.65rem] uppercase tracking-wide text-slate-600 dark:border-slate-700 dark:text-slate-300">
                                                        {truck.status ?? 'Unknown'}
                                                    </Badge>
                                                </div>
                                                <div className="text-right space-y-1">
                                                    <div>
                                                        <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">Last detached</p>
                                                        <p className="text-xs text-slate-500 dark:text-slate-400">{formatDateTime(truck.lastDetachedDate, truck.lastDetachedDisplay)}</p>
                                                        <p className="text-[0.65rem] text-slate-400 dark:text-slate-500">{truck.lastDetachedRelative ?? 'No detach history yet'}</p>
                                                    </div>
                                                    <p className="text-[0.65rem] text-slate-400 dark:text-slate-500">In service since {formatDate(truck.serviceStartDate, truck.serviceStartDisplay)}</p>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="text-sm text-muted-foreground">All trucks are currently attached.</p>
                                )}
                            </CardContent>
                        </Card>
                    </section>

                    <Card className="border border-slate-200 bg-white/95 shadow-sm dark:border-slate-800/70 dark:bg-slate-900/70">
                        <CardHeader className="space-y-3 border-b border-slate-200/60 pb-5 dark:border-slate-700/60">
                            <div className="space-y-1">
                                <CardTitle className="text-lg font-semibold text-slate-900 dark:text-slate-50">Assignment History</CardTitle>
                                <CardDescription className="text-sm">Complete record of driver-truck assignments and detachments.</CardDescription>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="flex flex-col gap-4 border-b border-slate-200/60 px-6 py-5 dark:border-slate-700/60">
                                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                                    <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center">
                                        <div className="relative flex-1 min-w-[200px]">
                                            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                            <Input
                                                value={searchQuery}
                                                onChange={(event) => setSearchQuery(event.target.value)}
                                                placeholder="Search by driver, truck, or dates"
                                                className="pl-9"
                                            />
                                        </div>
                                        <Select
                                            value={statusFilter}
                                            onValueChange={(value: 'all' | 'active' | 'detached') => setStatusFilter(value)}
                                        >
                                            <SelectTrigger className="w-full sm:w-48">
                                                <SelectValue placeholder="Status" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">All statuses</SelectItem>
                                                <SelectItem value="active">Active attachments</SelectItem>
                                                <SelectItem value="detached">Detached records</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                    <span className="text-xs text-slate-500 dark:text-slate-400">
                                        Showing {showingFrom.toLocaleString()}-{showingTo.toLocaleString()} of {totalCount.toLocaleString()} records
                                    </span>
                                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                                        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                                            <span>Rows</span>
                                            <Select
                                                value={perPage.toString()}
                                                onValueChange={(value) => setPerPage(Number(value))}
                                            >
                                                <SelectTrigger className="h-8 w-20">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {perPageOptions.map((option) => (
                                                        <SelectItem key={option} value={option.toString()}>
                                                            {option}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setPage((current) => Math.max(1, current - 1))}
                                                disabled={page <= 1}
                                                className="h-8 w-8 p-0"
                                            >
                                                <ChevronLeft className="h-4 w-4" />
                                            </Button>
                                            <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                                                Page {page.toLocaleString()} of {totalPages.toLocaleString()}
                                            </span>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                                                disabled={page >= totalPages || totalCount === 0}
                                                className="h-8 w-8 p-0"
                                            >
                                                <ChevronRight className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader className="bg-slate-50/60 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-900/60 dark:text-slate-400">
                                        <TableRow className="divide-x divide-slate-200/40 dark:divide-slate-800/50">
                                            <TableHead className="whitespace-nowrap">Driver</TableHead>
                                            <TableHead className="whitespace-nowrap">Truck</TableHead>
                                            <TableHead className="whitespace-nowrap text-right">Assigned</TableHead>
                                            <TableHead className="whitespace-nowrap text-right">Unassigned</TableHead>
                                            <TableHead className="whitespace-nowrap text-right">Duration</TableHead>
                                            <TableHead className="whitespace-nowrap text-right">Status</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {paginatedRows.length > 0 ? (
                                            paginatedRows.map((r) => (
                                                <TableRow key={r.id} className="divide-x divide-slate-100 hover:bg-slate-50/70 dark:divide-slate-800/50 dark:hover:bg-slate-900/50">
                                                    <TableCell className="whitespace-nowrap font-medium text-slate-900 dark:text-slate-100">{r.driver_name}</TableCell>
                                                    <TableCell className="whitespace-nowrap text-slate-600 dark:text-slate-400">{r.truck_plate}</TableCell>
                                                    <TableCell className="whitespace-nowrap text-right">
                                                        <div className="flex flex-col items-end gap-0.5">
                                                            <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">{formatDateTime(r.assigned_date, r.assigned_display)}</span>
                                                            <span className="text-xs text-slate-500 dark:text-slate-400">{formatRelative(r.assigned_relative)}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="whitespace-nowrap text-right">
                                                        <div className="flex flex-col items-end gap-0.5">
                                                            <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">{formatDateTime(r.unassigned_date, r.unassigned_display)}</span>
                                                            <span className="text-xs text-slate-500 dark:text-slate-400">{formatRelative(r.unassigned_relative)}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="whitespace-nowrap text-right text-slate-600 dark:text-slate-400">{formatDuration(r.assigned_date, r.unassigned_date)}</TableCell>
                                                    <TableCell className="whitespace-nowrap text-right">
                                                        {r.is_attached ? (
                                                            <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200">Active</Badge>
                                                        ) : (
                                                            <Badge variant="outline" className="border-rose-200 text-rose-600 dark:border-rose-500/40 dark:text-rose-200">Detached</Badge>
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        ) : (
                                            <TableRow>
                                                <TableCell colSpan={6} className="py-10 text-center text-sm text-muted-foreground">
                                                    No assignment history matches your filters.
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
            </div>
        </ReportPageLayout>
    );
}








