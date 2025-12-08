import { useMemo } from 'react';
import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertTriangle, ArrowUpRight, CalendarClock, Clock3, Filter, RefreshCcw, Wrench } from 'lucide-react';

interface MaintenanceParty {
    id: number | null;
    name: string | null;
}

interface MaintenanceTruck {
    id: number | null;
    plate: string | null;
}

interface MaintenanceRecordSummary {
    id: number;
    truck: MaintenanceTruck;
    maintenance_type: MaintenanceParty;
    scheduled_date: string | null;
    completed_date: string | null;
    status: string | null;
    cost: number | null;
    odometer_reading: number | null;
    assigned_mechanic: MaintenanceParty;
    description: string | null;
    days_until_scheduled: number | null;
    is_overdue: boolean;
}

interface MaintenanceAlertsProps {
    overdueMaintenance: MaintenanceRecordSummary[];
    upcomingMaintenance: MaintenanceRecordSummary[];
    filters: {
        days: number;
    };
    summary: {
        total_overdue: number;
        total_upcoming: number;
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Maintenance Alerts',
        href: '/maintenance/alerts',
    },
];

const windowOptions = [7, 14, 21, 30, 45, 60];

const formatStatus = (status: string | null) => {
    if (!status) return 'Unknown';
    return status.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
};

const formatDate = (value: string | null) => {
    if (!value) return '—';
    try {
        const date = new Date(value);
        return new Intl.DateTimeFormat(undefined, { year: 'numeric', month: 'short', day: 'numeric' }).format(date);
    } catch {
        return value;
    }
};

export default function MaintenanceAlerts({ overdueMaintenance, upcomingMaintenance, filters, summary }: MaintenanceAlertsProps) {
    const currentWindow = filters?.days ?? 7;

    const upcomingByType = useMemo(() => {
        const accumulator = new Map<string, number>();
        upcomingMaintenance.forEach((item) => {
            const key = item.maintenance_type?.name ?? 'Unspecified';
            accumulator.set(key, (accumulator.get(key) ?? 0) + 1);
        });
        return Array.from(accumulator.entries())
            .map(([name, total]) => ({ name, total }))
            .sort((a, b) => b.total - a.total);
    }, [upcomingMaintenance]);

    const handleWindowChange = (value: string) => {
        const days = Number(value);
        router.get('/maintenance/alerts', { days }, { preserveState: true, preserveScroll: true, replace: true });
    };

    const handleRefresh = () => {
        router.get('/maintenance/alerts', { days: currentWindow }, { preserveState: true, preserveScroll: true, replace: true });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Maintenance Alerts" />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-hidden rounded-xl p-4">
                <div className="flex flex-col gap-4 rounded-xl border border-slate-200/80 bg-white/95 p-4 shadow-sm dark:border-slate-800/60 dark:bg-slate-900/70 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-center gap-3">
                        <div className="rounded-xl bg-amber-500/10 p-2 text-amber-600 dark:bg-amber-500/20 dark:text-amber-300">
                            <AlertTriangle className="h-5 w-5" />
                        </div>
                        <div>
                            <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Maintenance Alerts Center</h1>
                            <p className="text-sm text-muted-foreground">Track overdue work and prepare for upcoming maintenance within a configurable window.</p>
                        </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                        <Select value={String(currentWindow)} onValueChange={handleWindowChange}>
                            <SelectTrigger className="w-[140px]">
                                <SelectValue><span className="flex items-center gap-2 text-sm"><Filter className="h-4 w-4" /> {currentWindow} days</span></SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                                {windowOptions.map((option) => (
                                    <SelectItem key={option} value={String(option)}>
                                        Next {option} days
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Button variant="outline" size="sm" className="gap-2" onClick={handleRefresh}>
                            <RefreshCcw className="h-4 w-4" /> Refresh
                        </Button>
                        <Button size="sm" className="gap-2" asChild>
                            <a href="/maintenance">
                                Go to Maintenance <ArrowUpRight className="h-3 w-3" />
                            </a>
                        </Button>
                    </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                    <Card className="border border-rose-500/20 bg-rose-500/5 shadow-sm dark:border-rose-500/30 dark:bg-rose-500/10">
                        <CardHeader className="flex flex-row items-center justify-between gap-4">
                            <div>
                                <CardTitle className="flex items-center gap-2 text-base font-semibold">
                                    <AlertTriangle className="h-4 w-4" /> Overdue Maintenance
                                </CardTitle>
                                <p className="text-sm text-rose-700/80 dark:text-rose-200/80">Resolve these to avoid downtime.</p>
                            </div>
                            <Badge variant="destructive" className="text-xs font-semibold">
                                {summary?.total_overdue ?? overdueMaintenance.length} overdue
                            </Badge>
                        </CardHeader>
                        <CardContent>
                            {overdueMaintenance.length === 0 ? (
                                <EmptyState message="No overdue maintenance tasks. Keep it up!" />
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Truck</TableHead>
                                            <TableHead>Type</TableHead>
                                            <TableHead>Scheduled</TableHead>
                                            <TableHead>Days Late</TableHead>
                                            <TableHead>Status</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {overdueMaintenance.map((item) => (
                                            <TableRow key={item.id}>
                                                <TableCell className="font-medium">{item.truck?.plate ?? 'Unassigned'}</TableCell>
                                                <TableCell>{item.maintenance_type?.name ?? '—'}</TableCell>
                                                <TableCell>{formatDate(item.scheduled_date)}</TableCell>
                                                <TableCell>
                                                    <Badge variant="destructive" className="font-semibold">
                                                        {Math.abs(item.days_until_scheduled ?? 0)}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className="capitalize text-rose-600">
                                                        {formatStatus(item.status)}
                                                    </Badge>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="border border-emerald-500/20 bg-emerald-500/5 shadow-sm dark:border-emerald-500/30 dark:bg-emerald-500/10">
                        <CardHeader className="flex flex-row items-center justify-between gap-4">
                            <div>
                                <CardTitle className="flex items-center gap-2 text-base font-semibold">
                                    <CalendarClock className="h-4 w-4" /> Upcoming Maintenance
                                </CardTitle>
                                <p className="text-sm text-emerald-700/80 dark:text-emerald-200/80">Plan resources ahead of schedule.</p>
                            </div>
                            <Badge variant="outline" className="border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:border-emerald-500/30 dark:text-emerald-300">
                                {summary?.total_upcoming ?? upcomingMaintenance.length} upcoming
                            </Badge>
                        </CardHeader>
                        <CardContent>
                            {upcomingMaintenance.length === 0 ? (
                                <EmptyState message="No upcoming maintenance within this window." />
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Truck</TableHead>
                                            <TableHead>Type</TableHead>
                                            <TableHead>Scheduled</TableHead>
                                            <TableHead>Days Until</TableHead>
                                            <TableHead>Status</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {upcomingMaintenance.map((item) => (
                                            <TableRow key={item.id}>
                                                <TableCell className="font-medium">{item.truck?.plate ?? 'Unassigned'}</TableCell>
                                                <TableCell>{item.maintenance_type?.name ?? '—'}</TableCell>
                                                <TableCell>{formatDate(item.scheduled_date)}</TableCell>
                                                <TableCell>
                                                    <Badge variant="secondary" className="font-semibold text-emerald-600 dark:text-emerald-300">
                                                        {Math.abs(item.days_until_scheduled ?? 0)}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className="capitalize">
                                                        {formatStatus(item.status)}
                                                    </Badge>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>
                </div>

                <div className="grid gap-4 lg:grid-cols-3">
                    <Card className="lg:col-span-2 border border-slate-200/80 bg-white/95 shadow-sm dark:border-slate-800/60 dark:bg-slate-900/70">
                        <CardHeader className="flex flex-row items-center justify-between gap-4">
                            <div>
                                <CardTitle className="flex items-center gap-2 text-base font-semibold">
                                    <Wrench className="h-4 w-4" /> Upcoming by Maintenance Type
                                </CardTitle>
                                <p className="text-sm text-muted-foreground">Where your next workload is concentrated.</p>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {upcomingByType.length === 0 ? (
                                <EmptyState message="No scheduled maintenance within the selected window." />
                            ) : (
                                <div className="space-y-3">
                                    {upcomingByType.map((entry) => (
                                        <div key={entry.name} className="flex items-center justify-between rounded-lg border border-slate-200/80 bg-white/80 p-4 shadow-sm dark:border-slate-800/60 dark:bg-slate-900/70">
                                            <div>
                                                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{entry.name}</p>
                                                <p className="text-xs text-muted-foreground">Upcoming jobs</p>
                                            </div>
                                            <Badge variant="outline" className="border-blue-500/40 bg-blue-500/10 text-blue-600 dark:border-blue-500/30 dark:text-blue-300">
                                                {entry.total}
                                            </Badge>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="border border-slate-200/80 bg-white/95 shadow-sm dark:border-slate-800/60 dark:bg-slate-900/70">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base font-semibold">
                                <Clock3 className="h-4 w-4" /> Quick Check
                            </CardTitle>
                            <p className="text-sm text-muted-foreground">Sanity metrics at a glance.</p>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <MetricRow label="Overdue" value={summary?.total_overdue ?? overdueMaintenance.length} badgeVariant="destructive" />
                            <MetricRow label="Upcoming" value={summary?.total_upcoming ?? upcomingMaintenance.length} badgeVariant="secondary" />
                            <MetricRow label="Window" value={`${currentWindow} days`} />
                            <div className="rounded-lg border border-dashed border-slate-200/80 bg-slate-50/60 p-4 text-xs text-muted-foreground dark:border-slate-800/60 dark:bg-slate-900/60">
                                Tip: adjust the window to align with workshop capacity planning.
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}

function MetricRow({ label, value, badgeVariant = 'outline' }: { label: string; value: string | number; badgeVariant?: 'outline' | 'secondary' | 'destructive' }) {
    return (
        <div className="flex items-center justify-between gap-2">
            <span className="text-sm text-muted-foreground">{label}</span>
            <Badge variant={badgeVariant} className="text-sm font-semibold">
                {value}
            </Badge>
        </div>
    );
}

function EmptyState({ message }: { message: string }) {
    return (
        <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-slate-200/70 bg-slate-50/40 p-6 text-center text-sm text-muted-foreground dark:border-slate-800/60 dark:bg-slate-900/40">
            <CalendarClock className="h-5 w-5" />
            <p>{message}</p>
        </div>
    );
}
