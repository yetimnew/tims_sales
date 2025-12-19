import type { ComponentType } from 'react';
import * as React from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import {
    ArrowDownRight,
    ArrowUpRight,
    BarChart3,
    ClipboardList,
    Clock3,
    Flame,
    Gauge,
    Minus,
    Package,
    RefreshCcw,
    ShieldCheck,
    TrendingUp,
    Truck,
    Users,
    Wrench,
    Zap,
    Target,
    Sparkles
} from 'lucide-react';
import {
    Area,
    AreaChart,
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    ComposedChart,
    Legend,
    Line,
    LineChart,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis
} from 'recharts';

const PIE_COLORS = ['#4338ca', '#0ea5e9', '#14b8a6', '#f97316', '#facc15', '#7c3aed', '#db2777', '#1d4ed8'];
const STATUS_COLOR_MAP: Record<string, string> = {
    completed: 'bg-teal-500/20 text-teal-700 border border-teal-200 dark:border-teal-900/60 dark:text-teal-300',
    in_progress: 'bg-amber-400/25 text-amber-700 border border-amber-200 dark:border-amber-900/60 dark:text-amber-300',
    pending: 'bg-slate-500/20 text-slate-700 border border-slate-200 dark:border-slate-800 dark:text-slate-300',
    cancelled: 'bg-rose-500/20 text-rose-700 border border-rose-200 dark:border-rose-900/60 dark:text-rose-300',
    returned: 'bg-sky-500/20 text-sky-700 border border-sky-200 dark:border-sky-900/60 dark:text-sky-300',
    active: 'bg-indigo-500/20 text-indigo-700 border border-indigo-200 dark:border-indigo-900/60 dark:text-indigo-300',
};

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
];

interface ExecutiveMetric {
    key: string;
    label: string;
    value: number | null;
    unit?: string;
    change: number | null;
}

interface DashboardProps {
    executiveSummary: {
        metrics: ExecutiveMetric[];
        fleet: {
            totalTrucks: number;
            activeTrucks: number;
            fleetAvailability: number;
            utilizedAssignments30d: number;
            fleetUtilisation: number;
        };
        drivers: {
            total: number;
            active: number;
            availability: number;
        };
        operations: {
            total: number;
            open: number;
        };
    };
    networkOverview: {
        dailyTrend: Array<{ date: string; tonnage: number; trips: number; tonkm: number; }>;
        statusBreakdown: Array<{ status: string; count: number; }>;
        corridors: Array<{ origin: string; destination: string; label: string; tonnage: number; trips: number; }>;
    };
    financialOverview: {
        revenue30d: number;
        operatingCost30d: number;
        margin30d: number;
        fareboxRecovery: number | null;
        avgRevenuePerTon: number | null;
        avgCostPerTon: number | null;
        change: {
            revenue: number | null;
            operatingCost: number | null;
            margin: number | null;
            fareboxRecovery: number | null;
        };
        trend: Array<{ period: string; revenue: number; cost: number; net: number; }>;
        costBreakdown: Array<{ label: string; value: number; }>;
        fuel: {
            totalCost30d: number;
            totalVolume30d: number;
            avgCostPerLiter30d: number | null;
            trend: Array<{ period: string; cost: number; volume: number; }>;
        };
    };
    assetOverview: {
        fleetAvailability: number;
        fleetUtilisation: number;
        driverAvailability: number;
        maintenance: {
            scheduled: number;
            overdue: number;
            completed30d: number;
            averageTurnaroundDays: number | null;
            trend: Array<{ period: string; completed: number; scheduled: number; }>;
            upcoming: Array<{ id: number; truck: string; scheduledDate: string | null; daysUntil: number | null; status: string | null; }>;
        };
    };
    safetyOverview: {
        incidents90d: number;
        incidentRatePer100Trips: number | null;
        change: {
            incidents: number | null;
            incidentRate: number | null;
        };
        severityMix: Array<{ severity: string; count: number; }>;
        incidentTrend: Array<{ period: string; total: number; }>;
        topIncidentTypes: Array<{ type: string; count: number; }>;
    };
    latestTruckStatusSummary: {
        date: string | null;
        overview: {
            trucksTracked: number;
            totalEntries: number;
            coverageRate: number | null;
            operationalShare: number | null;
            maintenanceShare: number | null;
            mostCommonStatus: string | null;
        };
        statusBreakdown: Array<{ status: string; label: string; count: number; }>;
        recentUpdates: Array<{ truck: string; status: string; notes: string | null; updatedAt: string | null; }>;
        notes: Array<{ truck: string; status: string; notes: string | null; }>;
    };
    topCustomers: Array<{ customer: string; trips: number; tonnage: number; }>;
    recentPerformances: Array<{
        id: number;
        trip: string;
        DateDispach: string;
        CargoVolumMT: number;
        satus: string;
        driverTruck?: {
            id: number;
            driver?: {
                id: number;
                name: string;
            } | null;
            truck?: {
                id: number;
                plate: string;
            } | null;
        } | null;
        origin?: {
            id: number;
            name: string;
        } | null;
        destination?: {
            id: number;
            name: string;
        } | null;
    }>;
}

type MetricIconMap = Record<string, ComponentType<{ className?: string }>>;

const METRIC_ICONS: MetricIconMap = {
    tonnage: Package,
    avgDailyTonnage: BarChart3,
    returnRate: RefreshCcw,
    avgCycle: Clock3,
};

const numberFormatter = new Intl.NumberFormat('en-US', { maximumFractionDigits: 1 });
const integerFormatter = new Intl.NumberFormat('en-US');
const dateFormatter = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
const timeFormatter = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: 'numeric' });

const formatNumber = (value: number | null | undefined, options?: Intl.NumberFormatOptions): string => {
    if (value === null || value === undefined || Number.isNaN(value)) {
        return '—';
    }

    return new Intl.NumberFormat('en-US', {
        maximumFractionDigits: 1,
        ...options,
    }).format(value);
};

const formatPercent = (value: number | null | undefined, fractionDigits = 1): string => {
    if (value === null || value === undefined || Number.isNaN(value)) {
        return '—';
    }

    return `${value.toFixed(fractionDigits)}%`;
};

const formatCurrency = (value: number | null | undefined): string => {
    if (value === null || value === undefined || Number.isNaN(value)) {
        return '—';
    }

    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'ETB',
        maximumFractionDigits: value >= 1000000 ? 0 : 1,
    }).format(value);
};

const formatChange = (value: number | null | undefined): string => {
    if (value === null || value === undefined || Number.isNaN(value)) {
        return '—';
    }

    const absolute = Math.abs(value).toFixed(1);
    const prefix = value > 0 ? '+' : value < 0 ? '-' : '';

    return `${prefix}${absolute}%`;
};

const parseDateTime = (value: string | null | undefined): Date | null => {
    if (!value) {
        return null;
    }

    const normalized = value.includes('T') ? value : value.replace(' ', 'T');
    const parsed = new Date(normalized);

    return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const formatTimeOnly = (value: string | null | undefined): string => {
    const parsed = parseDateTime(value);

    if (!parsed) {
        return '—';
    }

    return timeFormatter.format(parsed);
};

const renderTrendIndicator = (value: number | null | undefined) => {
    if (value === null || value === undefined || Number.isNaN(value)) {
        return (
            <span className="flex items-center gap-1 text-sm text-muted-foreground">
                <Minus className="h-4 w-4" />
                Change unavailable
            </span>
        );
    }

    if (value === 0) {
        return (
            <span className="flex items-center gap-1 text-sm text-muted-foreground">
                <Minus className="h-4 w-4" />
                0.0%
            </span>
        );
    }

    const tone = value > 0 ? 'text-teal-600 dark:text-teal-400' : 'text-rose-600 dark:text-rose-400';
    const Icon = value > 0 ? ArrowUpRight : ArrowDownRight;

    return (
        <span className={cn('flex items-center gap-1 text-sm font-medium', tone)}>
            <Icon className="h-4 w-4" />
            {formatChange(value)}
        </span>
    );
};

const renderStatusBadge = (status?: string | null) => {
    if (!status) {
        return <Badge variant="outline">Unknown</Badge>;
    }

    const normalized = status.toLowerCase();
    const badgeClass = STATUS_COLOR_MAP[normalized] ?? 'bg-slate-500/15 text-slate-600 border border-slate-200 dark:text-slate-300 dark:border-slate-700';

    return (
        <span className={cn('inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium capitalize', badgeClass)}>
            {normalized.replaceAll('_', ' ')}
        </span>
    );
};

const renderEmptyState = (message: string) => (
    <div className="flex h-64 items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
        {message}
    </div>
);

const renderDelta = (label: string, value: number | null | undefined) => (
    <div className="flex flex-col gap-1">
        <span className="text-xs text-muted-foreground">{label}</span>
        {renderTrendIndicator(value)}
    </div>
);

const getProgressWidth = (value: number) => `${Math.min(Math.max(value, 0), 100)}%`;

export default function Dashboard({
    executiveSummary,
    networkOverview,
    financialOverview,
    assetOverview,
    safetyOverview,
    latestTruckStatusSummary,
    topCustomers,
    recentPerformances,
}: DashboardProps) {
    const [isVisible, setIsVisible] = React.useState(false);

    React.useEffect(() => {
        setIsVisible(true);
    }, []);

    const statusSummary = latestTruckStatusSummary;
    const totalStatusEntries = statusSummary?.overview.totalEntries ?? 0;
    const hasLatestStatusData = totalStatusEntries > 0;
    const statusSummaryDateLabel = statusSummary?.date
        ? dateFormatter.format(new Date(statusSummary.date))
        : null;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />
            <div className={cn(
                'flex flex-1 flex-col gap-8 p-4 lg:p-8',
                'bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950',
                'transition-opacity duration-500',
                isVisible ? 'opacity-100' : 'opacity-0'
            )}>
                <header className="space-y-6 border-b border-slate-200/50 dark:border-slate-800/50 pb-6">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                        <div className="space-y-3">
                            <div className="flex items-center gap-3">
                                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-blue-600 shadow-lg">
                                    <Sparkles className="h-6 w-6 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-4xl font-black tracking-tighter text-slate-900 dark:text-white leading-tight">
                                        Executive Dashboard
                                    </h1>
                                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                                        Real-time fleet & financial intelligence
                                    </p>
                                </div>
                            </div>
                            <p className="text-base text-slate-600 dark:text-slate-400 pl-0">
                                Monitor network performance, cost recovery, and operational excellence across your fleet.
                            </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-3">
                            <Button asChild variant="outline" size="sm" className="transition-all duration-200 hover:shadow-md hover:border-indigo-300">
                                <Link href="/performances">
                                    <BarChart3 className="mr-2 h-4 w-4" />
                                    View All Trips
                                </Link>
                            </Button>
                            <Button asChild size="sm" className="bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white shadow-md hover:shadow-lg transition-all duration-200">
                                <Link href="/performances/create">
                                    <Zap className="mr-2 h-4 w-4" />
                                    New Trip
                                </Link>
                            </Button>
                        </div>
                    </div>
                </header>

                {statusSummary && (
                    <section className="grid gap-6 xl:grid-cols-3">
                        <div className="relative overflow-hidden rounded-3xl border border-transparent bg-gradient-to-br from-indigo-600 via-indigo-500 to-blue-600 p-8 text-white shadow-2xl hover:shadow-3xl transition-all duration-300">
                            <div className="pointer-events-none absolute -top-32 -right-32 size-64 rounded-full bg-white/10 blur-3xl" />
                            <div className="pointer-events-none absolute -bottom-20 -left-20 size-48 rounded-full bg-blue-400/10 blur-2xl" />
                            <div className="relative space-y-8">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <p className="text-xs font-bold uppercase tracking-widest text-indigo-100/90">🚀 Fleet Live Status</p>
                                        <h2 className="mt-3 text-3xl font-black">
                                            {hasLatestStatusData
                                                ? `${integerFormatter.format(statusSummary.overview.trucksTracked)} Active`
                                                : 'Pending'}
                                        </h2>
                                        <p className="mt-1 text-sm text-indigo-100/70 font-medium">trucks tracked today</p>
                                    </div>
                                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-md border border-white/20">
                                        <Gauge className="h-8 w-8 text-white/90" />
                                    </div>
                                </div>
                                <div className="space-y-2 text-sm text-indigo-100/80">
                                    {statusSummaryDateLabel && (
                                        <p className="font-medium">📅 Status as of {statusSummaryDateLabel}</p>
                                    )}
                                    {hasLatestStatusData && (
                                        <p className="text-indigo-100/60">{integerFormatter.format(statusSummary.overview.totalEntries)} records logged</p>
                                    )}
                                </div>
                                <div className="grid gap-3 sm:grid-cols-2">
                                    <div className="rounded-2xl bg-white/[0.08] p-4 backdrop-blur-md border border-white/10 hover:bg-white/[0.12] transition-colors">
                                        <p className="text-xs font-semibold uppercase tracking-wider text-indigo-100/70">Fleet Coverage</p>
                                        <p className="mt-2 text-2xl font-bold">{formatPercent(statusSummary.overview.coverageRate)}</p>
                                        <p className="text-xs text-indigo-100/60 mt-1">of {integerFormatter.format(executiveSummary.fleet.totalTrucks)} assets</p>
                                    </div>
                                    <div className="rounded-2xl bg-white/[0.08] p-4 backdrop-blur-md border border-white/10 hover:bg-white/[0.12] transition-colors">
                                        <p className="text-xs font-semibold uppercase tracking-wider text-indigo-100/70">Operational</p>
                                        <p className="mt-2 text-2xl font-bold">{formatPercent(statusSummary.overview.operationalShare)}</p>
                                        <p className="text-xs text-indigo-100/60 mt-1">active assignments</p>
                                    </div>
                                    <div className="rounded-2xl bg-white/[0.08] p-4 backdrop-blur-md border border-white/10 hover:bg-white/[0.12] transition-colors">
                                        <p className="text-xs font-semibold uppercase tracking-wider text-indigo-100/70">Maintenance</p>
                                        <p className="mt-2 text-2xl font-bold">{formatPercent(statusSummary.overview.maintenanceShare)}</p>
                                        <p className="text-xs text-indigo-100/60 mt-1">in service queue</p>
                                    </div>
                                    <div className="rounded-2xl bg-white/[0.08] p-4 backdrop-blur-md border border-white/10 hover:bg-white/[0.12] transition-colors">
                                        <p className="text-xs font-semibold uppercase tracking-wider text-indigo-100/70">Dominant Status</p>
                                        <p className="mt-2 text-lg font-bold capitalize">
                                            {statusSummary.overview.mostCommonStatus ?? '—'}
                                        </p>
                                        <p className="text-xs text-indigo-100/60 mt-1">most common</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <Card className="h-full border-slate-200/50 dark:border-slate-700/50 shadow-lg hover:shadow-xl transition-all duration-300 rounded-3xl">
                            <CardHeader className="bg-gradient-to-r from-blue-50/50 to-indigo-50/50 dark:from-slate-800/30 dark:to-slate-700/30 border-b border-slate-200/40 dark:border-slate-700/40">
                                <div className="flex items-center justify-between gap-2">
                                    <CardTitle className="text-lg font-bold">Status Breakdown</CardTitle>
                                    <Badge className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white border-0 text-xs font-bold uppercase">
                                        {statusSummaryDateLabel ?? 'Pending'}
                                    </Badge>
                                </div>
                                <CardDescription className="text-sm mt-1">Today's operational status distribution</CardDescription>
                            </CardHeader>
                            <CardContent className="pt-6">
                                {hasLatestStatusData ? (
                                    <div className="space-y-3">
                                        {statusSummary.statusBreakdown.slice(0, 6).map((entry) => {
                                            const share = totalStatusEntries > 0 ? (entry.count / totalStatusEntries) * 100 : 0;
                                            const statusColors: Record<string, { bg: string; bar: string }> = {
                                                'active': { bg: 'bg-emerald-50/50 dark:bg-emerald-950/30', bar: 'bg-emerald-500' },
                                                'maintenance': { bg: 'bg-orange-50/50 dark:bg-orange-950/30', bar: 'bg-orange-500' },
                                                'pending': { bg: 'bg-slate-50/50 dark:bg-slate-800/30', bar: 'bg-slate-500' },
                                                'returned': { bg: 'bg-blue-50/50 dark:bg-blue-950/30', bar: 'bg-blue-500' },
                                            };
                                            const colors = statusColors[entry.status.toLowerCase()] || { bg: 'bg-indigo-50/50 dark:bg-indigo-950/30', bar: 'bg-indigo-500' };

                                            return (
                                                <div key={entry.status} className={cn('space-y-2 rounded-2xl border border-slate-200/60 p-4 transition-all duration-200 hover:border-indigo-200 hover:shadow-md dark:border-slate-700/60 dark:hover:border-indigo-700', colors.bg)}>
                                                    <div className="flex items-center justify-between gap-2">
                                                        <div>
                                                            <p className="text-sm font-bold text-slate-900 dark:text-white">{entry.label}</p>
                                                            <p className="text-xs text-muted-foreground">{integerFormatter.format(entry.count)} entries</p>
                                                        </div>
                                                        <span className="text-lg font-bold bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">{share.toFixed(1)}%</span>
                                                    </div>
                                                    <div className="h-2.5 w-full rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                                                        <div
                                                            className={cn('h-full rounded-full transition-all duration-500', colors.bar)}
                                                            style={{ width: `${Math.min(share, 100)}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="flex h-full min-h-[12rem] items-center justify-center text-sm text-muted-foreground">
                                        No truck status updates yet.
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        <Card className="h-full border-slate-200/50 dark:border-slate-700/50 shadow-lg hover:shadow-xl transition-all duration-300 rounded-3xl">
                            <CardHeader className="bg-gradient-to-r from-blue-50/50 to-indigo-50/50 dark:from-slate-800/30 dark:to-slate-700/30 border-b border-slate-200/40 dark:border-slate-700/40">
                                <div className="flex items-center justify-between gap-2">
                                    <CardTitle className="text-lg font-bold">Latest Activity</CardTitle>
                                    <ClipboardList className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                                </div>
                                <CardDescription className="text-sm mt-1">Most recent status updates</CardDescription>
                            </CardHeader>
                            <CardContent className="pt-6">
                                {hasLatestStatusData ? (
                                    <div className="space-y-3">
                                        {statusSummary.recentUpdates.map((update, index) => (
                                            <div
                                                key={`${update.truck}-${index}`}
                                                className="rounded-2xl border border-slate-200/60 p-4 transition-all duration-200 hover:border-indigo-200 hover:shadow-md dark:border-slate-700/60 dark:hover:border-indigo-700 bg-slate-50/30 dark:bg-slate-800/20"
                                            >
                                                <div className="flex items-center justify-between text-sm font-bold text-slate-900 dark:text-white">
                                                    <span className="truncate">{update.truck}</span>
                                                    <span className="text-xs font-medium text-muted-foreground ml-2 whitespace-nowrap">{formatTimeOnly(update.updatedAt)}</span>
                                                </div>
                                                <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                                                    <Truck className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                                                    <span className="capitalize font-medium">{update.status ?? 'Unknown'}</span>
                                                </div>
                                                {update.notes && (
                                                    <p className="mt-3 rounded-lg border border-indigo-200/50 bg-indigo-50/70 p-2 text-xs text-indigo-900 dark:border-indigo-900/30 dark:bg-indigo-950/40 dark:text-indigo-300">
                                                        💡 {update.notes}
                                                    </p>
                                                )}
                                            </div>
                                        ))}

                                        {statusSummary.notes.length > 0 && (
                                            <div className="mt-4 space-y-2 rounded-2xl border border-blue-200/50 bg-blue-50/50 p-4 dark:border-blue-900/30 dark:bg-blue-950/30">
                                                <p className="text-xs font-bold uppercase tracking-wider text-blue-700 dark:text-blue-300">📌 Manager Notes</p>
                                                <div className="space-y-2 text-xs">
                                                    {statusSummary.notes.map((note, index) => (
                                                        <div key={`${note.truck}-${index}`} className="rounded-lg bg-white/40 p-2 dark:bg-blue-950/50 border border-blue-200/30 dark:border-blue-900/50">
                                                            <p className="text-xs font-bold uppercase text-blue-700 dark:text-blue-300">{note.truck}</p>
                                                            <p className="mt-1 text-blue-900/80 dark:text-blue-200/80 font-medium">{note.notes}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="flex h-full min-h-[12rem] flex-col items-center justify-center gap-2 text-sm text-muted-foreground">
                                        <ClipboardList className="h-5 w-5" />
                                        <span>No updates recorded yet.</span>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </section>
                )}

                <section className="space-y-6">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Executive Snapshot</h2>
                            <p className="mt-0.5 text-sm text-slate-600 dark:text-slate-400">Rolling 30-day perspective on throughput and service delivery.</p>
                        </div>
                        <span className="rounded-full bg-indigo-100 px-2.5 py-1 text-xs font-medium uppercase tracking-wider text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                            Updated {new Date().toLocaleDateString()}
                        </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                        {executiveSummary.metrics.map((metric, index) => {
                            const Icon = METRIC_ICONS[metric.key] ?? TrendingUp;
                            const displayValue = metric.unit === '%' ? formatPercent(metric.value) : formatNumber(metric.value);
                            const gradients = [
                                'from-indigo-50 via-sky-50 to-white dark:from-indigo-950/30 dark:via-sky-950/20 dark:to-indigo-900/20',
                                'from-teal-50 via-emerald-50 to-white dark:from-teal-950/25 dark:via-emerald-950/20 dark:to-emerald-900/15',
                                'from-amber-50 via-orange-50 to-white dark:from-amber-950/25 dark:via-orange-950/20 dark:to-orange-900/15',
                                'from-rose-50 via-fuchsia-50 to-white dark:from-rose-950/25 dark:via-fuchsia-950/20 dark:to-fuchsia-900/15',
                            ];
                            const iconColors = [
                                'text-indigo-600 dark:text-indigo-300',
                                'text-teal-600 dark:text-teal-300',
                                'text-amber-600 dark:text-amber-300',
                                'text-rose-600 dark:text-rose-300',
                            ];

                            return (
                                <Card
                                    key={metric.key}
                                    className={cn(
                                        'relative overflow-hidden border border-slate-200/60 dark:border-slate-700/60',
                                        'bg-gradient-to-br',
                                        gradients[index % gradients.length],
                                        'hover:shadow-md hover:border-slate-300 dark:hover:border-slate-600',
                                        'transition-all duration-200',
                                        'dark:bg-gradient-to-br'
                                    )}
                                >
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-3 px-4">
                                        <CardTitle className="text-xs font-medium text-slate-600 dark:text-slate-400 leading-tight">
                                            {metric.label}
                                        </CardTitle>
                                        <Icon className={cn('h-4 w-4', iconColors[index % iconColors.length])} />
                                    </CardHeader>
                                    <CardContent className="px-4 pb-3 pt-0">
                                        <div className="space-y-1.5">
                                            <div className="flex items-baseline gap-1.5">
                                                <span className="text-2xl font-bold text-slate-900 dark:text-white leading-none">{displayValue}</span>
                                                {metric.unit === '%' && (
                                                    <span className="text-xs text-slate-500 dark:text-slate-400">achieved</span>
                                                )}
                                            </div>
                                            <div className="text-xs">
                                                {renderTrendIndicator(metric.change)}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>

                    <div className="grid gap-4 lg:grid-cols-3">
                        <Card className="lg:col-span-2 border-slate-200/60 dark:border-slate-700/60 shadow-sm hover:shadow-md transition-all duration-200">
                            <CardHeader className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between bg-gradient-to-r from-slate-50/80 to-slate-100/50 dark:from-slate-800/80 dark:to-slate-700/50 border-b border-slate-200/60 dark:border-slate-700/60">
                                <div>
                                    <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white">Fleet & Workforce Readiness</CardTitle>
                                    <CardDescription className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">Availability across trucks, drivers, and open assignments.</CardDescription>
                                </div>
                                <div className="flex flex-wrap gap-6 text-sm text-slate-600 dark:text-slate-400">
                                    {renderDelta('Fleet utilisation vs total', executiveSummary.metrics.find(m => m.key === 'tonnage')?.change ?? null)}
                                    {renderDelta('Return rate trend', executiveSummary.metrics.find(m => m.key === 'returnRate')?.change ?? null)}
                                </div>
                            </CardHeader>
                            <CardContent className="grid gap-6 lg:grid-cols-2">
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <Gauge className="h-9 w-9 text-indigo-500" />
                                        <div>
                                            <p className="text-sm text-muted-foreground">Fleet availability</p>
                                            <div className="flex items-baseline gap-2">
                                                <span className="text-2xl font-semibold">{formatPercent(executiveSummary.fleet.fleetAvailability)}</span>
                                                <span className="text-xs text-muted-foreground">{integerFormatter.format(executiveSummary.fleet.activeTrucks)} / {integerFormatter.format(executiveSummary.fleet.totalTrucks)} trucks</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="h-2 rounded-full bg-muted">
                                        <div className="h-full rounded-full bg-indigo-500" style={{ width: getProgressWidth(executiveSummary.fleet.fleetAvailability) }} />
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Truck className="h-9 w-9 text-teal-500" />
                                        <div>
                                            <p className="text-sm text-muted-foreground">Active assignments (30d)</p>
                                            <div className="text-2xl font-semibold">{integerFormatter.format(executiveSummary.fleet.utilizedAssignments30d)}</div>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <Users className="h-9 w-9 text-amber-500" />
                                        <div>
                                            <p className="text-sm text-muted-foreground">Driver availability</p>
                                            <div className="flex items-baseline gap-2">
                                                <span className="text-2xl font-semibold">{formatPercent(executiveSummary.drivers.availability)}</span>
                                                <span className="text-xs text-muted-foreground">{integerFormatter.format(executiveSummary.drivers.active)} / {integerFormatter.format(executiveSummary.drivers.total)} drivers</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="h-2 rounded-full bg-muted">
                                        <div className="h-full rounded-full bg-amber-500" style={{ width: getProgressWidth(executiveSummary.drivers.availability) }} />
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <ClipboardList className="h-9 w-9 text-rose-500" />
                                        <div>
                                            <p className="text-sm text-muted-foreground">Open operations</p>
                                            <div className="text-2xl font-semibold">{integerFormatter.format(executiveSummary.operations.open)}</div>
                                            <p className="text-xs text-muted-foreground">{integerFormatter.format(executiveSummary.operations.total)} total contracts</p>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="border-slate-200/60 dark:border-slate-700/60 shadow-sm hover:shadow-md transition-all duration-200">
                            <CardHeader className="bg-gradient-to-r from-slate-50/80 to-slate-100/50 dark:from-slate-800/80 dark:to-slate-700/50 border-b border-slate-200/60 dark:border-slate-700/60">
                                <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white">Service Highlights</CardTitle>
                                <CardDescription className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">Change over previous 30 days.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {['tonnage', 'avgDailyTonnage', 'returnRate', 'avgCycle'].map(key => {
                                    const metric = executiveSummary.metrics.find(item => item.key === key);
                                    if (!metric) {
                                        return null;
                                    }

                                    return (
                                        <div key={metric.key} className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm font-medium">{metric.label}</p>
                                                <p className="text-xs text-muted-foreground">{metric.unit ?? 'Actuals'}</p>
                                            </div>
                                            {renderTrendIndicator(metric.change)}
                                        </div>
                                    );
                                })}
                            </CardContent>
                        </Card>
                    </div>
                </section>

                <section className="space-y-6">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Network Performance</h2>
                            <p className="mt-0.5 text-sm text-slate-600 dark:text-slate-400">Demand coverage, corridor performance, and status mix.</p>
                        </div>
                    </div>

                    <div className="grid gap-4 xl:grid-cols-3">
                        <Card className="xl:col-span-2 border-slate-200/60 dark:border-slate-700/60 shadow-sm hover:shadow-md transition-all duration-200">
                            <CardHeader className="bg-gradient-to-r from-slate-50/80 to-slate-100/50 dark:from-slate-800/80 dark:to-slate-700/50 border-b border-slate-200/60 dark:border-slate-700/60">
                                <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white">Tonnage & Trips (30d)</CardTitle>
                                <CardDescription className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">Tonnage moved per day with trip counts overlay.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {networkOverview.dailyTrend.length === 0 ? (
                                    renderEmptyState('No performance data recorded for the selected window.')
                                ) : (
                                    <ResponsiveContainer width="100%" height={320}>
                                        <ComposedChart data={networkOverview.dailyTrend}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="date" />
                                            <YAxis yAxisId="left" orientation="left" stroke="#4338ca" />
                                            <YAxis yAxisId="right" orientation="right" stroke="#14b8a6" />
                                            <Tooltip />
                                            <Legend />
                                            <Area yAxisId="left" type="monotone" name="Tonnage (MT)" dataKey="tonnage" stroke="#4338ca" fill="#4338ca" fillOpacity={0.18} />
                                            <Line yAxisId="right" type="monotone" name="Trips" dataKey="trips" stroke="#14b8a6" strokeWidth={2} />
                                        </ComposedChart>
                                    </ResponsiveContainer>
                                )}
                            </CardContent>
                        </Card>

                        <Card className="border-slate-200/60 dark:border-slate-700/60 shadow-sm hover:shadow-md transition-all duration-200">
                            <CardHeader className="bg-gradient-to-r from-slate-50/80 to-slate-100/50 dark:from-slate-800/80 dark:to-slate-700/50 border-b border-slate-200/60 dark:border-slate-700/60">
                                <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white">Status Mix</CardTitle>
                                <CardDescription className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">Share of performance status for the last 30 days.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {networkOverview.statusBreakdown.length === 0 ? (
                                    renderEmptyState('Status mix unavailable – log new performances to populate.')
                                ) : (
                                    <ResponsiveContainer width="100%" height={320}>
                                        <BarChart data={networkOverview.statusBreakdown}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="status" tickFormatter={value => value.replaceAll('_', ' ')} />
                                            <YAxis allowDecimals={false} />
                                            <Tooltip labelFormatter={(value: string) => value.replaceAll('_', ' ')} />
                                            <Bar dataKey="count" fill="#4338ca" radius={[4, 4, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    <Card className="border-slate-200/60 dark:border-slate-700/60 shadow-sm hover:shadow-md transition-all duration-200">
                        <CardHeader className="bg-gradient-to-r from-slate-50/80 to-slate-100/50 dark:from-slate-800/80 dark:to-slate-700/50 border-b border-slate-200/60 dark:border-slate-700/60">
                            <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white">Top Corridors</CardTitle>
                            <CardDescription className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">Tonnage handled on major origin-destination pairs (30d).</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {networkOverview.corridors.length === 0 ? (
                                renderEmptyState('No corridor flows recorded in the period.')
                            ) : (
                                <ResponsiveContainer width="100%" height={360}>
                                    <BarChart data={networkOverview.corridors} layout="vertical" margin={{ left: 24 }}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis type="number" />
                                        <YAxis dataKey="label" type="category" width={180} />
                                        <Tooltip />
                                        <Legend />
                                        <Bar dataKey="tonnage" name="Tonnage (MT)" fill="#4338ca" radius={[0, 4, 4, 0]} />
                                        <Bar dataKey="trips" name="Trips" fill="#14b8a6" radius={[0, 4, 4, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            )}
                        </CardContent>
                    </Card>
                </section>

                <section className="space-y-6">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Financial Health</h2>
                            <p className="mt-0.5 text-sm text-slate-600 dark:text-slate-400">Revenue recovery, operating cost, and fuel exposure.</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
                        <Card className="border-slate-200/60 dark:border-slate-700/60 bg-gradient-to-br from-teal-50/80 to-teal-100/50 dark:from-teal-950/30 dark:to-teal-900/20 shadow-sm hover:shadow-md transition-all duration-200">
                            <CardHeader className="pb-2 pt-3 px-4">
                                <CardTitle className="text-sm font-medium text-slate-700 dark:text-slate-300">Revenue (30d)</CardTitle>
                                <CardDescription className="text-xs text-slate-600 dark:text-slate-400">Tariff-based income.</CardDescription>
                            </CardHeader>
                            <CardContent className="px-4 pb-3 pt-0 space-y-1.5">
                                <p className="text-2xl font-bold text-teal-700 dark:text-teal-300 leading-none">{formatCurrency(financialOverview.revenue30d)}</p>
                                <div className="text-xs">{renderTrendIndicator(financialOverview.change.revenue)}</div>
                            </CardContent>
                        </Card>
                        <Card className="border-slate-200/60 dark:border-slate-700/60 bg-gradient-to-br from-amber-50/80 to-amber-100/50 dark:from-amber-950/30 dark:to-amber-900/20 shadow-sm hover:shadow-md transition-all duration-200">
                            <CardHeader className="pb-2 pt-3 px-4">
                                <CardTitle className="text-sm font-medium text-slate-700 dark:text-slate-300">Operating Cost (30d)</CardTitle>
                                <CardDescription className="text-xs text-slate-600 dark:text-slate-400">Fuel, perdiem, and other trip costs.</CardDescription>
                            </CardHeader>
                            <CardContent className="px-4 pb-3 pt-0 space-y-1.5">
                                <p className="text-2xl font-bold text-amber-700 dark:text-amber-300 leading-none">{formatCurrency(financialOverview.operatingCost30d)}</p>
                                <div className="text-xs">{renderTrendIndicator(financialOverview.change.operatingCost)}</div>
                            </CardContent>
                        </Card>
                        <Card className="border-slate-200/60 dark:border-slate-700/60 bg-gradient-to-br from-indigo-50/80 to-indigo-100/50 dark:from-indigo-950/30 dark:to-indigo-900/20 shadow-sm hover:shadow-md transition-all duration-200">
                            <CardHeader className="pb-2 pt-3 px-4">
                                <CardTitle className="text-sm font-medium text-slate-700 dark:text-slate-300">Margin (30d)</CardTitle>
                                <CardDescription className="text-xs text-slate-600 dark:text-slate-400">Revenue minus operating cost.</CardDescription>
                            </CardHeader>
                            <CardContent className="px-4 pb-3 pt-0 space-y-1.5">
                                <p className="text-2xl font-bold text-indigo-700 dark:text-indigo-300 leading-none">{formatCurrency(financialOverview.margin30d)}</p>
                                <div className="text-xs">{renderTrendIndicator(financialOverview.change.margin)}</div>
                            </CardContent>
                        </Card>
                        <Card className="border-slate-200/60 dark:border-slate-700/60 bg-gradient-to-br from-rose-50/80 to-rose-100/50 dark:from-rose-950/30 dark:to-rose-900/20 shadow-sm hover:shadow-md transition-all duration-200">
                            <CardHeader className="pb-2 pt-3 px-4">
                                <CardTitle className="text-sm font-medium text-slate-700 dark:text-slate-300">Cost Recovery</CardTitle>
                                <CardDescription className="text-xs text-slate-600 dark:text-slate-400">Farebox coverage of operating cost.</CardDescription>
                            </CardHeader>
                            <CardContent className="px-4 pb-3 pt-0 space-y-1.5">
                                <p className="text-2xl font-bold text-rose-700 dark:text-rose-300 leading-none">{formatPercent(financialOverview.fareboxRecovery)}</p>
                                <div className="text-xs">{renderTrendIndicator(financialOverview.change.fareboxRecovery)}</div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="grid gap-4 xl:grid-cols-3">
                        <Card className="xl:col-span-2 border-slate-200/60 dark:border-slate-700/60 shadow-sm hover:shadow-md transition-all duration-200">
                            <CardHeader className="bg-gradient-to-r from-slate-50/80 to-slate-100/50 dark:from-slate-800/80 dark:to-slate-700/50 border-b border-slate-200/60 dark:border-slate-700/60">
                                <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white">Revenue vs Cost Trend</CardTitle>
                                <CardDescription className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">Six-month view across revenue, cost, and net contribution.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {financialOverview.trend.length === 0 ? (
                                    renderEmptyState('No financial entries captured yet.')
                                ) : (
                                    <ResponsiveContainer width="100%" height={340}>
                                        <ComposedChart data={financialOverview.trend}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="period" />
                                            <YAxis />
                                            <Tooltip />
                                            <Legend />
                                            <Bar dataKey="revenue" name="Revenue" fill="#14b8a6" radius={[4, 4, 0, 0]} />
                                            <Bar dataKey="cost" name="Operating cost" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                                            <Line type="monotone" dataKey="net" name="Net" stroke="#4338ca" strokeWidth={2} />
                                        </ComposedChart>
                                    </ResponsiveContainer>
                                )}
                            </CardContent>
                        </Card>

                        <Card className="border-slate-200/60 dark:border-slate-700/60 shadow-sm hover:shadow-md transition-all duration-200">
                            <CardHeader className="bg-gradient-to-r from-slate-50/80 to-slate-100/50 dark:from-slate-800/80 dark:to-slate-700/50 border-b border-slate-200/60 dark:border-slate-700/60">
                                <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white">Cost Breakdown</CardTitle>
                                <CardDescription className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">Share of spend across cost categories (30d).</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {financialOverview.costBreakdown.length === 0 ? (
                                    renderEmptyState('Cost breakdown unavailable. Add financial records to populate.')
                                ) : (
                                    <ResponsiveContainer width="100%" height={320}>
                                        <PieChart>
                                            <Pie data={financialOverview.costBreakdown} dataKey="value" nameKey="label" innerRadius={60} outerRadius={100} paddingAngle={4}>
                                                {financialOverview.costBreakdown.map((entry, index) => (
                                                    <Cell key={entry.label} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip formatter={(value: number) => formatCurrency(value)} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                )}
                                <div className="mt-4 grid gap-2 text-sm">
                                    <div className="flex items-center justify-between">
                                        <span>Average revenue per ton</span>
                                        <span className="font-medium">{formatCurrency(financialOverview.avgRevenuePerTon)}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span>Average cost per ton</span>
                                        <span className="font-medium">{formatCurrency(financialOverview.avgCostPerTon)}</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <Card className="border-slate-200/60 dark:border-slate-700/60 shadow-sm hover:shadow-md transition-all duration-200">
                            <CardHeader className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between bg-gradient-to-r from-slate-50/80 to-slate-100/50 dark:from-slate-800/80 dark:to-slate-700/50 border-b border-slate-200/60 dark:border-slate-700/60">
                                <div>
                                    <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white">Fuel Exposure</CardTitle>
                                    <CardDescription className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">Spend and uplift trend.</CardDescription>
                                </div>
                                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                    <Flame className="h-5 w-5 text-rose-500" />
                                    <span>
                                        {formatCurrency(financialOverview.fuel.totalCost30d)} |
                                        {' '}
                                        {formatNumber(financialOverview.fuel.totalVolume30d, { maximumFractionDigits: 0 })} L |
                                        {' '}
                                        {financialOverview.fuel.avgCostPerLiter30d === null
                                            ? '—'
                                            : `${formatCurrency(financialOverview.fuel.avgCostPerLiter30d)} /L`}
                                    </span>
                                </div>
                        </CardHeader>
                        <CardContent>
                            {financialOverview.fuel.trend.length === 0 ? (
                                renderEmptyState('Fuel records unavailable for the selected window.')
                            ) : (
                                <ResponsiveContainer width="100%" height={320}>
                                    <ComposedChart data={financialOverview.fuel.trend}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="period" />
                                        <YAxis yAxisId="left" orientation="left" stroke="#f59e0b" />
                                        <YAxis yAxisId="right" orientation="right" stroke="#14b8a6" />
                                        <Tooltip />
                                        <Legend />
                                        <Bar yAxisId="left" dataKey="cost" name="Fuel cost" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                                        <Line yAxisId="right" type="monotone" dataKey="volume" name="Volume (L)" stroke="#14b8a6" strokeWidth={2} />
                                    </ComposedChart>
                                </ResponsiveContainer>
                            )}
                        </CardContent>
                    </Card>
                </section>

                <section className="space-y-6">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Asset & Maintenance</h2>
                            <p className="mt-0.5 text-sm text-slate-600 dark:text-slate-400">Maintenance workload and upcoming jobs.</p>
                        </div>
                    </div>

                    <div className="grid gap-4 xl:grid-cols-3">
                        <Card className="border-slate-200/60 dark:border-slate-700/60 shadow-sm hover:shadow-md transition-all duration-200">
                            <CardHeader className="bg-gradient-to-r from-slate-50/80 to-slate-100/50 dark:from-slate-800/80 dark:to-slate-700/50 border-b border-slate-200/60 dark:border-slate-700/60">
                                <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white">Maintenance Pulse</CardTitle>
                                <CardDescription className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">Current status of maintenance queue.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <Wrench className="h-9 w-9 text-indigo-500" />
                                        <div>
                                            <p className="text-sm font-medium">Scheduled</p>
                                            <p className="text-muted-foreground">Booked in calendar</p>
                                        </div>
                                    </div>
                                    <span className="text-2xl font-semibold">{integerFormatter.format(assetOverview.maintenance.scheduled)}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-rose-600">Overdue</p>
                                        <p className="text-xs text-muted-foreground">Past schedule</p>
                                    </div>
                                    <span className="text-xl font-semibold text-rose-600">{integerFormatter.format(assetOverview.maintenance.overdue)}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-teal-600">Completed (30d)</p>
                                        <p className="text-xs text-muted-foreground">Closed work orders</p>
                                    </div>
                                    <span className="text-xl font-semibold text-teal-600">{integerFormatter.format(assetOverview.maintenance.completed30d)}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium">Avg turnaround</p>
                                        <p className="text-xs text-muted-foreground">Scheduled to complete</p>
                                    </div>
                                    <span className="text-xl font-semibold">
                                        {assetOverview.maintenance.averageTurnaroundDays === null
                                            ? '—'
                                            : `${formatNumber(assetOverview.maintenance.averageTurnaroundDays)} days`}
                                    </span>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="xl:col-span-2 border-slate-200/60 dark:border-slate-700/60 shadow-sm hover:shadow-md transition-all duration-200">
                            <CardHeader className="bg-gradient-to-r from-slate-50/80 to-slate-100/50 dark:from-slate-800/80 dark:to-slate-700/50 border-b border-slate-200/60 dark:border-slate-700/60">
                                <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white">Maintenance Trend & Upcoming Jobs</CardTitle>
                                <CardDescription className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">Monthly completions vs scheduled jobs, with next five assignments.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {assetOverview.maintenance.trend.length === 0 ? (
                                    renderEmptyState('Maintenance trend not yet recorded.')
                                ) : (
                                    <ResponsiveContainer width="100%" height={280}>
                                        <ComposedChart data={assetOverview.maintenance.trend}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="period" />
                                            <YAxis />
                                            <Tooltip />
                                            <Legend />
                                            <Bar dataKey="scheduled" name="Scheduled" fill="#4338ca" radius={[4, 4, 0, 0]} />
                                            <Bar dataKey="completed" name="Completed" fill="#14b8a6" radius={[4, 4, 0, 0]} />
                                        </ComposedChart>
                                    </ResponsiveContainer>
                                )}

                                <div className="space-y-3">
                                    <h3 className="text-sm font-semibold text-muted-foreground uppercase">Next jobs</h3>
                                    {assetOverview.maintenance.upcoming.length === 0 ? (
                                        <p className="text-sm text-muted-foreground">No upcoming maintenance within the planning horizon.</p>
                                    ) : (
                                        <div className="grid gap-3">
                                            {assetOverview.maintenance.upcoming.map(item => (
                                                <div key={item.id} className="flex items-center justify-between rounded-lg border px-3 py-2">
                                                    <div className="flex items-center gap-3">
                                                        <ShieldCheck className="h-5 w-5 text-indigo-500" />
                                                        <div>
                                                            <p className="text-sm font-medium">Truck {item.truck}</p>
                                                            <p className="text-xs text-muted-foreground">Scheduled {item.scheduledDate ? dateFormatter.format(new Date(item.scheduledDate)) : 'TBC'}</p>
                                                        </div>
                                                    </div>
                                                    <div className="text-right text-sm">
                                                        <p className="font-medium">
                                                            {item.daysUntil === null ? '—' : item.daysUntil > 0 ? `${item.daysUntil} days` : item.daysUntil === 0 ? 'Today' : `${Math.abs(item.daysUntil)} overdue`}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground capitalize">{item.status ?? 'scheduled'}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </section>

                <section className="space-y-6">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Safety & Compliance</h2>
                            <p className="mt-0.5 text-sm text-slate-600 dark:text-slate-400">Incident rate, severity mix, and leading themes.</p>
                        </div>
                    </div>

                    <div className="grid gap-4 xl:grid-cols-3">
                        <Card className="border-slate-200/60 dark:border-slate-700/60 shadow-sm hover:shadow-md transition-all duration-200">
                            <CardHeader className="bg-gradient-to-r from-slate-50/80 to-slate-100/50 dark:from-slate-800/80 dark:to-slate-700/50 border-b border-slate-200/60 dark:border-slate-700/60">
                                <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white">Incident Summary (90d)</CardTitle>
                                <CardDescription className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">Rate normalised per 100 trips.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <ShieldCheck className="h-10 w-10 text-rose-500" />
                                        <div>
                                            <p className="text-sm text-muted-foreground">Recorded incidents</p>
                                            <p className="text-3xl font-semibold">{integerFormatter.format(safetyOverview.incidents90d)}</p>
                                        </div>
                                    </div>
                                    {renderTrendIndicator(safetyOverview.change.incidents)}
                                </div>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-muted-foreground">Rate per 100 trips</p>
                                        <p className="text-2xl font-semibold">{formatPercent(safetyOverview.incidentRatePer100Trips, 2)}</p>
                                    </div>
                                    {renderTrendIndicator(safetyOverview.change.incidentRate)}
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-slate-200/60 dark:border-slate-700/60 shadow-sm hover:shadow-md transition-all duration-200">
                            <CardHeader className="bg-gradient-to-r from-slate-50/80 to-slate-100/50 dark:from-slate-800/80 dark:to-slate-700/50 border-b border-slate-200/60 dark:border-slate-700/60">
                                <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white">Severity Mix</CardTitle>
                                <CardDescription className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">Distribution by severity level.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {safetyOverview.severityMix.length === 0 ? (
                                    renderEmptyState('No safety events reported in this window.')
                                ) : (
                                    <ResponsiveContainer width="100%" height={320}>
                                        <PieChart>
                                            <Pie data={safetyOverview.severityMix} dataKey="count" nameKey="severity" innerRadius={60} outerRadius={100} paddingAngle={4}>
                                                {safetyOverview.severityMix.map((entry, index) => (
                                                    <Cell key={entry.severity} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip formatter={(value: number) => integerFormatter.format(value)} labelFormatter={(label: string) => label.replaceAll('_', ' ')} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                )}
                            </CardContent>
                        </Card>

                        <Card className="border-slate-200/60 dark:border-slate-700/60 shadow-sm hover:shadow-md transition-all duration-200">
                            <CardHeader className="bg-gradient-to-r from-slate-50/80 to-slate-100/50 dark:from-slate-800/80 dark:to-slate-700/50 border-b border-slate-200/60 dark:border-slate-700/60">
                                <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white">Incident Trend</CardTitle>
                                <CardDescription className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">Rolling six-month incident volume.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {safetyOverview.incidentTrend.length === 0 ? (
                                    renderEmptyState('Trend data unavailable.')
                                ) : (
                                    <ResponsiveContainer width="100%" height={320}>
                                        <LineChart data={safetyOverview.incidentTrend}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="period" />
                                            <YAxis allowDecimals={false} />
                                            <Tooltip />
                                            <Line type="monotone" dataKey="total" stroke="#db2777" strokeWidth={2} />
                                        </LineChart>
                                    </ResponsiveContainer>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    <Card className="border-slate-200/60 dark:border-slate-700/60 shadow-sm hover:shadow-md transition-all duration-200">
                        <CardHeader className="bg-gradient-to-r from-slate-50/80 to-slate-100/50 dark:from-slate-800/80 dark:to-slate-700/50 border-b border-slate-200/60 dark:border-slate-700/60">
                            <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white">Top Incident Themes</CardTitle>
                            <CardDescription className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">Most frequent incident types in the last ninety days.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {safetyOverview.topIncidentTypes.length === 0 ? (
                                <p className="text-sm text-muted-foreground">No incident categories to display.</p>
                            ) : (
                                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                    {safetyOverview.topIncidentTypes.map(item => (
                                        <div key={item.type} className="rounded-lg border p-3">
                                            <p className="text-sm font-medium capitalize">{item.type.replaceAll('_', ' ')}</p>
                                            <p className="text-xs text-muted-foreground">Occurrences</p>
                                            <p className="text-xl font-semibold">{integerFormatter.format(item.count)}</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </section>

                <section className="space-y-6">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Customers & Operations</h2>
                            <p className="mt-0.5 text-sm text-slate-600 dark:text-slate-400">Top partners by tonnage and recent trip activity.</p>
                        </div>
                    </div>

                    <Card className="border-slate-200/60 dark:border-slate-700/60 shadow-sm hover:shadow-md transition-all duration-200">
                        <CardHeader className="bg-gradient-to-r from-slate-50/80 to-slate-100/50 dark:from-slate-800/80 dark:to-slate-700/50 border-b border-slate-200/60 dark:border-slate-700/60">
                            <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white">Top Customers (90d)</CardTitle>
                            <CardDescription className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">Trips and tonnage delivered per customer.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {topCustomers.length === 0 ? (
                                renderEmptyState('No customer movements captured in the window.')
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Customer</TableHead>
                                            <TableHead className="text-right">Trips</TableHead>
                                            <TableHead className="text-right">Tonnage (MT)</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {topCustomers.map(customer => (
                                            <TableRow key={customer.customer}>
                                                <TableCell className="font-medium">{customer.customer}</TableCell>
                                                <TableCell className="text-right">{integerFormatter.format(customer.trips)}</TableCell>
                                                <TableCell className="text-right">{numberFormatter.format(customer.tonnage)}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="border-slate-200/60 dark:border-slate-700/60 shadow-sm hover:shadow-md transition-all duration-200">
                        <CardHeader className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between bg-gradient-to-r from-slate-50/80 to-slate-100/50 dark:from-slate-800/80 dark:to-slate-700/50 border-b border-slate-200/60 dark:border-slate-700/60">
                            <div>
                                <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white">Recent Performances</CardTitle>
                                <CardDescription className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">Latest recorded trips with fleet and route details.</CardDescription>
                            </div>
                            <Button asChild variant="outline" size="sm" className="transition-all duration-200 hover:shadow-md">
                                <Link href="/performances">View All Trips</Link>
                            </Button>
                        </CardHeader>
                        <CardContent>
                            {recentPerformances.length === 0 ? (
                                <p className="text-sm text-muted-foreground">No recorded performances yet.</p>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Trip</TableHead>
                                            <TableHead>Fleet</TableHead>
                                            <TableHead>Route</TableHead>
                                            <TableHead className="text-right">Cargo (MT)</TableHead>
                                            <TableHead className="text-right">Dispatched</TableHead>
                                            <TableHead className="text-right">Status</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {recentPerformances.map(performance => (
                                            <TableRow key={performance.id}>
                                                <TableCell className="font-medium">{performance.trip ?? `Trip #${performance.id}`}</TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col text-sm">
                                                        <span>{performance.driverTruck?.driver?.name ?? 'Unknown driver'}</span>
                                                        <span className="text-muted-foreground">{performance.driverTruck?.truck?.plate ?? 'Unknown truck'}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-sm text-muted-foreground">
                                                    {(performance.origin?.name ?? 'Unknown origin')} → {(performance.destination?.name ?? 'Unknown destination')}
                                                </TableCell>
                                                <TableCell className="text-right">{numberFormatter.format(performance.CargoVolumMT)}</TableCell>
                                                <TableCell className="text-right">{performance.DateDispach ? dateFormatter.format(new Date(performance.DateDispach)) : '—'}</TableCell>
                                                <TableCell className="text-right">{renderStatusBadge(performance.satus)}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>
                </section>
            </div>
        </AppLayout>
    );
}
