import type { ComponentType } from 'react';

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
    Wrench
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

const PIE_COLORS = ['#0ea5e9', '#22c55e', '#f97316', '#eab308', '#6366f1', '#a855f7'];
const STATUS_COLOR_MAP: Record<string, string> = {
    completed: 'bg-emerald-500/15 text-emerald-600',
    in_progress: 'bg-amber-500/15 text-amber-600',
    pending: 'bg-slate-500/15 text-slate-600',
    cancelled: 'bg-rose-500/15 text-rose-600',
    returned: 'bg-sky-500/15 text-sky-600',
    active: 'bg-emerald-500/15 text-emerald-600',
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

    const tone = value > 0 ? 'text-emerald-600' : 'text-rose-600';
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
    const badgeClass = STATUS_COLOR_MAP[normalized] ?? 'bg-slate-500/15 text-slate-600';

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
    topCustomers,
    recentPerformances,
}: DashboardProps) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />
            <div className="flex flex-1 flex-col gap-8 p-4 lg:p-6">
                <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Network Intelligence Center</h1>
                        <p className="text-muted-foreground">Consolidated view across fleet utilisation, financial recovery, and safety performance.</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <Button asChild variant="outline" size="sm">
                            <Link href="/performances">View Performances</Link>
                        </Button>
                        <Button asChild size="sm">
                            <Link href="/performances/create">New Performance</Link>
                        </Button>
                    </div>
                </header>

                <section className="space-y-4">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            <h2 className="text-lg font-semibold">Executive Snapshot</h2>
                            <p className="text-sm text-muted-foreground">Rolling 30-day perspective on throughput and service delivery.</p>
                        </div>
                        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Updated {new Date().toLocaleDateString()}</span>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                        {executiveSummary.metrics.map(metric => {
                            const Icon = METRIC_ICONS[metric.key] ?? TrendingUp;
                            const displayValue = metric.unit === '%' ? formatPercent(metric.value) : formatNumber(metric.value);

                            return (
                                <Card key={metric.key} className="relative overflow-hidden">
                                    <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                                        <div>
                                            <CardTitle className="text-sm font-medium">{metric.label}</CardTitle>
                                            {metric.unit && metric.unit !== '%' && (
                                                <CardDescription>{metric.unit}</CardDescription>
                                            )}
                                        </div>
                                        <Icon className="h-5 w-5 text-muted-foreground" />
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-3xl font-semibold">{displayValue}</span>
                                            {metric.unit === '%' && <span className="text-sm text-muted-foreground">achieved</span>}
                                        </div>
                                        {renderTrendIndicator(metric.change)}
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>

                    <div className="grid gap-4 lg:grid-cols-3">
                        <Card className="lg:col-span-2">
                            <CardHeader className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                                <div>
                                    <CardTitle>Fleet & Workforce Readiness</CardTitle>
                                    <CardDescription>Availability across trucks, drivers, and open assignments.</CardDescription>
                                </div>
                                <div className="flex flex-wrap gap-6 text-sm text-muted-foreground">
                                    {renderDelta('Fleet utilisation vs total', executiveSummary.metrics.find(m => m.key === 'tonnage')?.change ?? null)}
                                    {renderDelta('Return rate trend', executiveSummary.metrics.find(m => m.key === 'returnRate')?.change ?? null)}
                                </div>
                            </CardHeader>
                            <CardContent className="grid gap-6 lg:grid-cols-2">
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <Gauge className="h-9 w-9 text-sky-500" />
                                        <div>
                                            <p className="text-sm text-muted-foreground">Fleet availability</p>
                                            <div className="flex items-baseline gap-2">
                                                <span className="text-2xl font-semibold">{formatPercent(executiveSummary.fleet.fleetAvailability)}</span>
                                                <span className="text-xs text-muted-foreground">{integerFormatter.format(executiveSummary.fleet.activeTrucks)} / {integerFormatter.format(executiveSummary.fleet.totalTrucks)} trucks</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="h-2 rounded-full bg-muted">
                                        <div className="h-full rounded-full bg-sky-500" style={{ width: getProgressWidth(executiveSummary.fleet.fleetAvailability) }} />
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
                                        <Users className="h-9 w-9 text-emerald-500" />
                                        <div>
                                            <p className="text-sm text-muted-foreground">Driver availability</p>
                                            <div className="flex items-baseline gap-2">
                                                <span className="text-2xl font-semibold">{formatPercent(executiveSummary.drivers.availability)}</span>
                                                <span className="text-xs text-muted-foreground">{integerFormatter.format(executiveSummary.drivers.active)} / {integerFormatter.format(executiveSummary.drivers.total)} drivers</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="h-2 rounded-full bg-muted">
                                        <div className="h-full rounded-full bg-emerald-500" style={{ width: getProgressWidth(executiveSummary.drivers.availability) }} />
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <ClipboardList className="h-9 w-9 text-violet-500" />
                                        <div>
                                            <p className="text-sm text-muted-foreground">Open operations</p>
                                            <div className="text-2xl font-semibold">{integerFormatter.format(executiveSummary.operations.open)}</div>
                                            <p className="text-xs text-muted-foreground">{integerFormatter.format(executiveSummary.operations.total)} total contracts</p>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader>
                                <CardTitle>Service Highlights</CardTitle>
                                <CardDescription>Change over previous 30 days.</CardDescription>
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

                <section className="space-y-4">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            <h2 className="text-lg font-semibold">Network Performance</h2>
                            <p className="text-sm text-muted-foreground">Demand coverage, corridor performance, and status mix.</p>
                        </div>
                    </div>

                    <div className="grid gap-4 xl:grid-cols-3">
                        <Card className="xl:col-span-2">
                            <CardHeader>
                                <CardTitle>Tonnage & Trips (30d)</CardTitle>
                                <CardDescription>Tonnage moved per day with trip counts overlay.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {networkOverview.dailyTrend.length === 0 ? (
                                    renderEmptyState('No performance data recorded for the selected window.')
                                ) : (
                                    <ResponsiveContainer width="100%" height={320}>
                                        <ComposedChart data={networkOverview.dailyTrend}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="date" />
                                            <YAxis yAxisId="left" orientation="left" stroke="#0ea5e9" />
                                            <YAxis yAxisId="right" orientation="right" stroke="#22c55e" />
                                            <Tooltip />
                                            <Legend />
                                            <Area yAxisId="left" type="monotone" name="Tonnage (MT)" dataKey="tonnage" stroke="#0ea5e9" fill="#0ea5e9" fillOpacity={0.15} />
                                            <Line yAxisId="right" type="monotone" name="Trips" dataKey="trips" stroke="#22c55e" strokeWidth={2} />
                                        </ComposedChart>
                                    </ResponsiveContainer>
                                )}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Status Mix</CardTitle>
                                <CardDescription>Share of performance status for the last 30 days.</CardDescription>
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
                                            <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle>Top Corridors</CardTitle>
                            <CardDescription>Tonnage handled on major origin-destination pairs (30d).</CardDescription>
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
                                        <Bar dataKey="tonnage" name="Tonnage (MT)" fill="#38bdf8" radius={[0, 4, 4, 0]} />
                                        <Bar dataKey="trips" name="Trips" fill="#94a3b8" radius={[0, 4, 4, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            )}
                        </CardContent>
                    </Card>
                </section>

                <section className="space-y-4">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            <h2 className="text-lg font-semibold">Financial Health</h2>
                            <p className="text-sm text-muted-foreground">Revenue recovery, operating cost, and fuel exposure.</p>
                        </div>
                    </div>

                    <div className="grid gap-4 xl:grid-cols-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Revenue (30d)</CardTitle>
                                <CardDescription>Tariff-based income.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <p className="text-3xl font-semibold">{formatCurrency(financialOverview.revenue30d)}</p>
                                {renderTrendIndicator(financialOverview.change.revenue)}
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader>
                                <CardTitle>Operating Cost (30d)</CardTitle>
                                <CardDescription>Fuel, perdiem, and other trip costs.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <p className="text-3xl font-semibold">{formatCurrency(financialOverview.operatingCost30d)}</p>
                                {renderTrendIndicator(financialOverview.change.operatingCost)}
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader>
                                <CardTitle>Margin (30d)</CardTitle>
                                <CardDescription>Revenue minus operating cost.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <p className="text-3xl font-semibold">{formatCurrency(financialOverview.margin30d)}</p>
                                {renderTrendIndicator(financialOverview.change.margin)}
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader>
                                <CardTitle>Cost Recovery</CardTitle>
                                <CardDescription>Farebox coverage of operating cost.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <p className="text-3xl font-semibold">{formatPercent(financialOverview.fareboxRecovery)}</p>
                                {renderTrendIndicator(financialOverview.change.fareboxRecovery)}
                            </CardContent>
                        </Card>
                    </div>

                    <div className="grid gap-4 xl:grid-cols-3">
                        <Card className="xl:col-span-2">
                            <CardHeader>
                                <CardTitle>Revenue vs Cost Trend</CardTitle>
                                <CardDescription>Six-month view across revenue, cost, and net contribution.</CardDescription>
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
                                            <Bar dataKey="revenue" name="Revenue" fill="#22c55e" radius={[4, 4, 0, 0]} />
                                            <Bar dataKey="cost" name="Operating cost" fill="#f97316" radius={[4, 4, 0, 0]} />
                                            <Line type="monotone" dataKey="net" name="Net" stroke="#6366f1" strokeWidth={2} />
                                        </ComposedChart>
                                    </ResponsiveContainer>
                                )}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Cost Breakdown</CardTitle>
                                <CardDescription>Share of spend across cost categories (30d).</CardDescription>
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

                    <Card>
                            <CardHeader className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                                <div>
                                    <CardTitle>Fuel Exposure</CardTitle>
                                    <CardDescription>Spend and uplift trend.</CardDescription>
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
                                        <YAxis yAxisId="left" orientation="left" stroke="#f97316" />
                                        <YAxis yAxisId="right" orientation="right" stroke="#0369a1" />
                                        <Tooltip />
                                        <Legend />
                                        <Bar yAxisId="left" dataKey="cost" name="Fuel cost" fill="#f97316" radius={[4, 4, 0, 0]} />
                                        <Line yAxisId="right" type="monotone" dataKey="volume" name="Volume (L)" stroke="#0369a1" strokeWidth={2} />
                                    </ComposedChart>
                                </ResponsiveContainer>
                            )}
                        </CardContent>
                    </Card>
                </section>

                <section className="space-y-4">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            <h2 className="text-lg font-semibold">Asset & Maintenance</h2>
                            <p className="text-sm text-muted-foreground">Maintenance workload and upcoming jobs.</p>
                        </div>
                    </div>

                    <div className="grid gap-4 xl:grid-cols-3">
                        <Card>
                            <CardHeader>
                                <CardTitle>Maintenance Pulse</CardTitle>
                                <CardDescription>Current status of maintenance queue.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <Wrench className="h-9 w-9 text-sky-500" />
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
                                        <p className="text-sm font-medium text-emerald-600">Completed (30d)</p>
                                        <p className="text-xs text-muted-foreground">Closed work orders</p>
                                    </div>
                                    <span className="text-xl font-semibold text-emerald-600">{integerFormatter.format(assetOverview.maintenance.completed30d)}</span>
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

                        <Card className="xl:col-span-2">
                            <CardHeader>
                                <CardTitle>Maintenance Trend & Upcoming Jobs</CardTitle>
                                <CardDescription>Monthly completions vs scheduled jobs, with next five assignments.</CardDescription>
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
                                            <Bar dataKey="scheduled" name="Scheduled" fill="#38bdf8" radius={[4, 4, 0, 0]} />
                                            <Bar dataKey="completed" name="Completed" fill="#22c55e" radius={[4, 4, 0, 0]} />
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
                                                        <ShieldCheck className="h-5 w-5 text-sky-500" />
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

                <section className="space-y-4">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            <h2 className="text-lg font-semibold">Safety & Compliance</h2>
                            <p className="text-sm text-muted-foreground">Incident rate, severity mix, and leading themes.</p>
                        </div>
                    </div>

                    <div className="grid gap-4 xl:grid-cols-3">
                        <Card>
                            <CardHeader>
                                <CardTitle>Incident Summary (90d)</CardTitle>
                                <CardDescription>Rate normalised per 100 trips.</CardDescription>
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

                        <Card>
                            <CardHeader>
                                <CardTitle>Severity Mix</CardTitle>
                                <CardDescription>Distribution by severity level.</CardDescription>
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

                        <Card>
                            <CardHeader>
                                <CardTitle>Incident Trend</CardTitle>
                                <CardDescription>Rolling six-month incident volume.</CardDescription>
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
                                            <Line type="monotone" dataKey="total" stroke="#ef4444" strokeWidth={2} />
                                        </LineChart>
                                    </ResponsiveContainer>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle>Top Incident Themes</CardTitle>
                            <CardDescription>Most frequent incident types in the last ninety days.</CardDescription>
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

                <section className="space-y-4">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            <h2 className="text-lg font-semibold">Customers & Operations</h2>
                            <p className="text-sm text-muted-foreground">Top partners by tonnage and recent trip activity.</p>
                        </div>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle>Top Customers (90d)</CardTitle>
                            <CardDescription>Trips and tonnage delivered per customer.</CardDescription>
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

                    <Card>
                        <CardHeader className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                            <div>
                                <CardTitle>Recent Performances</CardTitle>
                                <CardDescription>Latest recorded trips with fleet and route details.</CardDescription>
                            </div>
                            <Button asChild variant="outline" size="sm">
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
