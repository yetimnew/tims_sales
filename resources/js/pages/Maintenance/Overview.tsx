import { useMemo, type ComponentType } from 'react';
import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { useListingLoading } from '@/hooks/use-listing-loading';
import { formatCurrency } from '@/lib/formatters/currency';
import { ArrowUpRight, CalendarClock, ClipboardList, Clock4, DollarSign, ListChecks, ShieldAlert, Wrench } from 'lucide-react';

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

interface CostByTypeEntry {
    maintenance_type: MaintenanceParty;
    total_records: number;
    total_cost: number;
}

interface StatusBreakdownEntry {
    status: string | null;
    total: number;
}

interface MaintenanceStatistics {
    total_scheduled: number;
    total_completed: number;
    total_overdue: number;
    total_cost: number;
    average_cost: number;
}

interface MaintenanceOverviewProps {
    statistics: MaintenanceStatistics;
    recentMaintenance: MaintenanceRecordSummary[];
    upcomingMaintenance: MaintenanceRecordSummary[];
    overdueMaintenance: MaintenanceRecordSummary[];
    costByType: CostByTypeEntry[];
    statusBreakdown: StatusBreakdownEntry[];
    timeWindowDays: number;
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Maintenance Overview',
        href: '/maintenance-overview',
    },
];

const TABLE_LOADING_STORAGE_KEY = 'maintenance.overview.table-loading';

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

export default function MaintenanceOverview({
    statistics,
    recentMaintenance,
    upcomingMaintenance,
    overdueMaintenance,
    costByType,
    statusBreakdown,
    timeWindowDays,
}: MaintenanceOverviewProps) {
    const totalRecords = useMemo(() => {
        return (statusBreakdown ?? []).reduce((sum, entry) => sum + (entry.total ?? 0), 0);
    }, [statusBreakdown]);

    const isDataReady = Array.isArray(recentMaintenance) && Array.isArray(upcomingMaintenance) && Array.isArray(overdueMaintenance);
    const { isLoading: isOverviewLoading } = useListingLoading({
        storageKey: TABLE_LOADING_STORAGE_KEY,
        isDataReady,
        minimumDuration: 200,
        onlySamePath: true,
        initialIsLoading: false,
    });

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Maintenance Overview" />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-hidden rounded-xl p-4">
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <StatCard
                        title="Scheduled"
                        icon={CalendarClock}
                        value={statistics?.total_scheduled ?? 0}
                        description={`Active maintenance events queued for the fleet.`}
                        accent="from-blue-500/10 to-blue-500/0"
                    />
                    <StatCard
                        title="Completed"
                        icon={ListChecks}
                        value={statistics?.total_completed ?? 0}
                        description="Jobs completed to date."
                        accent="from-emerald-500/10 to-emerald-500/0"
                    />
                    <StatCard
                        title="Overdue"
                        icon={ShieldAlert}
                        value={statistics?.total_overdue ?? 0}
                        description="Items requiring attention."
                        accent="from-rose-500/10 to-rose-500/0"
                        highlight
                    />
                    <StatCard
                        title="Total Spend"
                        icon={DollarSign}
                        value={formatCurrency(statistics?.total_cost ?? 0)}
                        description={`Average per job ${formatCurrency(statistics?.average_cost ?? 0)}`}
                        accent="from-amber-500/10 to-amber-500/0"
                        isMonetary
                    />
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                    <Card className="border border-slate-200/80 bg-white/90 shadow-sm dark:border-slate-800/60 dark:bg-slate-900/60">
                        <CardHeader className="flex flex-row items-center justify-between gap-4">
                            <div>
                                <CardTitle className="flex items-center gap-2 text-base font-semibold">
                                    <Wrench className="h-4 w-4" /> Upcoming Maintenance
                                </CardTitle>
                                <p className="text-sm text-muted-foreground">Next {timeWindowDays}-day window</p>
                            </div>
                            <Badge variant="outline" className="border-blue-500/40 bg-blue-500/10 text-blue-600 dark:border-blue-500/30 dark:text-blue-300">
                                {upcomingMaintenance.length} Scheduled
                            </Badge>
                        </CardHeader>
                        <CardContent className="relative space-y-4">
                            {upcomingMaintenance.length === 0 ? (
                                <EmptyState message="No maintenance scheduled in this window." />
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Truck</TableHead>
                                            <TableHead>Type</TableHead>
                                            <TableHead>Date</TableHead>
                                            <TableHead>Status</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {upcomingMaintenance.map((item) => (
                                            <TableRow key={item.id}>
                                                <TableCell className="whitespace-nowrap font-medium">{item.truck?.plate ?? 'Unassigned'}</TableCell>
                                                <TableCell>{item.maintenance_type?.name ?? '—'}</TableCell>
                                                <TableCell>{formatDate(item.scheduled_date)}</TableCell>
                                                <TableCell>
                                                    <Badge variant="secondary" className="capitalize">
                                                        {formatStatus(item.status)}
                                                    </Badge>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}

                            {isOverviewLoading && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-background/80 backdrop-blur-sm">
                                    <img src="/images/loading-spinner.svg" alt="Loading maintenance overview" className="h-10 w-10" />
                                    <span className="text-sm text-muted-foreground">Loading maintenance overview...</span>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="border border-slate-200/80 bg-white/90 shadow-sm dark:border-slate-800/60 dark:bg-slate-900/60">
                        <CardHeader className="flex flex-row items-center justify-between gap-4">
                            <div>
                                <CardTitle className="flex items-center gap-2 text-base font-semibold">
                                    <ShieldAlert className="h-4 w-4" /> Overdue & Risk
                                </CardTitle>
                                <p className="text-sm text-muted-foreground">Top overdue tasks</p>
                            </div>
                            <Badge variant="outline" className="border-rose-500/50 bg-rose-500/10 text-rose-600 dark:border-rose-500/40 dark:text-rose-300">
                                {overdueMaintenance.length} Overdue
                            </Badge>
                        </CardHeader>
                        <CardContent className="relative space-y-4">
                            {overdueMaintenance.length === 0 ? (
                                <EmptyState message="Excellent! Nothing is overdue." />
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Truck</TableHead>
                                            <TableHead>Type</TableHead>
                                            <TableHead>Scheduled</TableHead>
                                            <TableHead>Days Late</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {overdueMaintenance.map((item) => (
                                            <TableRow key={item.id}>
                                                <TableCell className="whitespace-nowrap font-medium">{item.truck?.plate ?? 'Unassigned'}</TableCell>
                                                <TableCell>{item.maintenance_type?.name ?? '—'}</TableCell>
                                                <TableCell>{formatDate(item.scheduled_date)}</TableCell>
                                                <TableCell>
                                                    <Badge variant="destructive" className="font-semibold">
                                                        {Math.abs(item.days_until_scheduled ?? 0)}
                                                    </Badge>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}

                            {isOverviewLoading && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-background/80 backdrop-blur-sm">
                                    <img src="/images/loading-spinner.svg" alt="Loading maintenance overview" className="h-10 w-10" />
                                    <span className="text-sm text-muted-foreground">Loading maintenance overview...</span>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                <div className="grid gap-4 xl:grid-cols-5">
                    <Card className="xl:col-span-3 border border-slate-200/80 bg-white/90 shadow-sm dark:border-slate-800/60 dark:bg-slate-900/60">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base font-semibold">
                                <ClipboardList className="h-4 w-4" /> Recent Maintenance Activity
                            </CardTitle>
                            <p className="text-sm text-muted-foreground">Latest updates across the fleet.</p>
                        </CardHeader>
                        <CardContent className="relative space-y-4">
                            {recentMaintenance.length === 0 ? (
                                <EmptyState message="No recent activity recorded." />
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Truck</TableHead>
                                            <TableHead>Type</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Scheduled</TableHead>
                                            <TableHead>Completed</TableHead>
                                            <TableHead className="text-right">Cost</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {recentMaintenance.map((item) => (
                                            <TableRow key={item.id}>
                                                <TableCell className="whitespace-nowrap font-medium">{item.truck?.plate ?? 'Unassigned'}</TableCell>
                                                <TableCell>{item.maintenance_type?.name ?? '—'}</TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className="capitalize">
                                                        {formatStatus(item.status)}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>{formatDate(item.scheduled_date)}</TableCell>
                                                <TableCell>{formatDate(item.completed_date)}</TableCell>
                                                <TableCell className="text-right">{formatCurrency(item.cost)}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}

                            {isOverviewLoading && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-background/80 backdrop-blur-sm">
                                    <img src="/images/loading-spinner.svg" alt="Loading maintenance overview" className="h-10 w-10" />
                                    <span className="text-sm text-muted-foreground">Loading maintenance overview...</span>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="xl:col-span-2 border border-slate-200/80 bg-white/90 shadow-sm dark:border-slate-800/60 dark:bg-slate-900/60">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base font-semibold">
                                <DollarSign className="h-4 w-4" /> Cost Concentration by Type
                            </CardTitle>
                            <p className="text-sm text-muted-foreground">Top spend categories.</p>
                        </CardHeader>
                        <CardContent className="relative space-y-4">
                            {costByType.length === 0 ? (
                                <EmptyState message="Cost data will appear once maintenance is recorded." />
                            ) : (
                                <div className="space-y-3">
                                    {costByType.map((entry) => (
                                        <div key={`${entry.maintenance_type.id ?? 'unknown'}-${entry.maintenance_type.name ?? 'type'}`} className="rounded-lg border border-slate-200 bg-white/80 p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
                                            <div className="flex items-center justify-between gap-3">
                                                <div>
                                                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{entry.maintenance_type.name ?? 'Unknown Type'}</p>
                                                    <p className="text-xs text-muted-foreground">{entry.total_records} record(s)</p>
                                                </div>
                                                <Badge variant="outline" className="border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:border-emerald-500/30 dark:text-emerald-300">
                                                    {formatCurrency(entry.total_cost)}
                                                </Badge>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {isOverviewLoading && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-background/80 backdrop-blur-sm">
                                    <img src="/images/loading-spinner.svg" alt="Loading maintenance overview" className="h-10 w-10" />
                                    <span className="text-sm text-muted-foreground">Loading maintenance overview...</span>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                <Card className="border border-slate-200/80 bg-white/90 shadow-sm dark:border-slate-800/60 dark:bg-slate-900/60">
                    <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2 text-base font-semibold">
                                <Clock4 className="h-4 w-4" /> Status Distribution
                            </CardTitle>
                            <p className="text-sm text-muted-foreground">How maintenance tasks are distributed today.</p>
                        </div>
                        <Button variant="outline" size="sm" className="gap-2" asChild>
                            <a href="/maintenance">View Maintenance List <ArrowUpRight className="h-3 w-3" /></a>
                        </Button>
                    </CardHeader>
                    <CardContent className="relative">
                        {statusBreakdown.length === 0 ? (
                            <EmptyState message="No maintenance records yet." />
                        ) : (
                            <div className="flex flex-wrap items-center gap-4">
                                {statusBreakdown.map((entry) => {
                                    const percentage = totalRecords > 0 ? Math.round((entry.total / totalRecords) * 100) : 0;
                                    return (
                                        <div key={entry.status ?? 'unknown'} className="flex min-w-[160px] flex-col gap-1 rounded-lg border border-slate-200/80 bg-white/70 p-4 shadow-sm dark:border-slate-800/60 dark:bg-slate-900/60">
                                            <span className="text-xs uppercase tracking-wide text-muted-foreground">{formatStatus(entry.status)}</span>
                                            <Separator className="my-1" />
                                            <span className="text-2xl font-semibold text-slate-900 dark:text-slate-100">{entry.total}</span>
                                            <span className="text-xs text-muted-foreground">{percentage}% of records</span>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {isOverviewLoading && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-background/80 backdrop-blur-sm">
                                <img src="/images/loading-spinner.svg" alt="Loading maintenance overview" className="h-10 w-10" />
                                <span className="text-sm text-muted-foreground">Loading maintenance overview...</span>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}

interface StatCardProps {
    title: string;
    icon: ComponentType<{ className?: string }>;
    value: number | string;
    description?: string;
    accent?: string;
    highlight?: boolean;
    isMonetary?: boolean;
}

function StatCard({ title, icon: Icon, value, description, accent, highlight, isMonetary }: StatCardProps) {
    return (
        <Card className={`relative overflow-hidden border border-slate-200/80 bg-white/95 shadow-sm dark:border-slate-800/60 dark:bg-slate-900/70 ${highlight ? 'ring-1 ring-rose-500/30' : ''}`}>
            <div className={`absolute inset-0 bg-gradient-to-br ${accent ?? 'from-slate-500/5 to-slate-500/0'}`} aria-hidden="true" />
            <CardHeader className="relative z-10 flex flex-row items-center gap-4">
                <div className={`rounded-xl p-2 ${highlight ? 'bg-rose-500/10 text-rose-600 dark:text-rose-300' : 'bg-slate-100 text-slate-600 dark:bg-slate-800/80 dark:text-slate-200'}`}>
                    <Icon className="h-5 w-5" />
                </div>
                <div className="grid gap-1">
                    <CardTitle className="text-sm font-semibold text-slate-600 dark:text-slate-300">{title}</CardTitle>
                    <span className={`text-2xl font-semibold ${highlight ? 'text-rose-600 dark:text-rose-300' : 'text-slate-900 dark:text-slate-100'}`}>
                        {isMonetary ? value : value?.toString() ?? '0'}
                    </span>
                    {description && <p className="text-xs text-muted-foreground">{description}</p>}
                </div>
            </CardHeader>
        </Card>
    );
}

function EmptyState({ message }: { message: string }) {
    return (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-200/70 bg-slate-50/40 p-6 text-center text-sm text-muted-foreground dark:border-slate-800/60 dark:bg-slate-900/40">
            <CalendarClock className="mb-2 h-5 w-5" />
            <p>{message}</p>
        </div>
    );
}
