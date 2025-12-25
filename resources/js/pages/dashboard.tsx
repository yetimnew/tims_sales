import type { ComponentType } from 'react';
import * as React from 'react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import {
    ArrowDownRight,
    ArrowUpRight,
    BarChart3,
    ClipboardList,
    Clock3,
    DollarSign,
    Flame,
    Gauge,
    Minus,
    Package,
    RefreshCcw,
    ShieldCheck,
    Target,
    TrendingUp,
    Truck,
    Users,
    Wrench,
    Sparkles,
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
    YAxis,
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

type MetricIconMap = Record<string, ComponentType<{ className?: string }>>;
type KpiFormat = 'currency' | 'percent' | 'integer' | 'number';

interface PrimaryKpi {
    key: string;
    label: string;
    value: number | null;
    unit?: string | null;
    format?: KpiFormat | null;
    change: number | null;
}

interface DashboardProps {
    primaryKpis: PrimaryKpi[];
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
        dailyTrend: Array<{ date: string; tonnage: number; trips: number; tonkm: number }>;
        statusBreakdown: Array<{ status: string; label: string; count: number; share: number; color: string }>;
        loadPhaseBreakdown: Array<{ phase: string; label: string; count: number; share: number; color: string }>;
        corridors: Array<{ origin: string; destination: string; label: string; tonnage: number; trips: number }>;
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
        trend: Array<{ period: string; revenue: number; cost: number; net: number }>;
        costBreakdown: Array<{ label: string; value: number }>;
        fuel: {
            totalCost30d: number;
            totalVolume30d: number;
            avgCostPerLiter30d: number | null;
            trend: Array<{ period: string; cost: number; volume: number }>;
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
            trend: Array<{ period: string; completed: number; scheduled: number }>;
            upcoming: Array<{ id: number; truck: string; scheduledDate: string | null; daysUntil: number | null; status: string | null }>;
        };
    };
    safetyOverview: {
        incidents90d: number;
        incidentRatePer100Trips: number | null;
        change: {
            incidents: number | null;
            incidentRate: number | null;
        };
        severityMix: Array<{ severity: string; count: number }>;
        incidentTrend: Array<{ period: string; total: number }>;
        topIncidentTypes: Array<{ type: string; count: number }>;
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
        statusBreakdown: Array<{ status: string; label: string; count: number }>;
        recentUpdates: Array<{ truck: string; status: string; notes: string | null; updatedAt: string | null }>;
        notes: Array<{ truck: string; status: string; notes: string | null }>;
    };
    topCustomers: Array<{ customer: string; trips: number; tonnage: number }>;
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

const METRIC_ICONS: MetricIconMap = {
    tonnage: Package,
    avgDailyTonnage: BarChart3,
    returnRate: RefreshCcw,
    avgCycle: Clock3,
};

const PRIMARY_KPI_ICONS: Record<string, ComponentType<{ className?: string }>> = {
    tonnage30d: Package,
    trips30d: Truck,
    avgLoadPerTrip: Gauge,
    margin30d: DollarSign,
    fareboxRecovery: Target,
    fleetUtilisation: Sparkles,
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
        maximumFractionDigits: value >= 1_000_000 ? 0 : 1,
    }).format(value);
};

const formatFinancialValue = (value: number | null | undefined, type: 'currency' | 'percent'): string => {
    return type === 'currency' ? formatCurrency(value) : formatPercent(value);
};

const getCurrencyParts = (value: number | null | undefined): { unit: string; amount: string } => {
    if (value === null || value === undefined || Number.isNaN(value)) {
        return { unit: 'ETB', amount: '—' };
    }

    const formatter = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'ETB',
        maximumFractionDigits: Math.abs(value) >= 1_000_000 ? 0 : 1,
    });

    const parts = formatter.formatToParts(value);
    const currency = parts.find(part => part.type === 'currency')?.value ?? 'ETB';
    const sign = parts.some(part => part.type === 'minusSign') ? '-' : '';
    const digits = parts
        .filter(part => ['integer', 'group', 'decimal', 'fraction'].includes(part.type))
        .map(part => part.value)
        .join('');

    return {
        unit: currency,
        amount: `${sign}${digits}`,
    };
};

const formatCompactCurrency = (value: number | null | undefined): string => {
    if (value === null || value === undefined || Number.isNaN(value)) {
        return '—';
    }

    const absolute = Math.abs(value);
    const sign = value < 0 ? '-' : '';

    const formatScaled = (input: number): string => {
        if (input >= 100) {
            const rounded = Math.min(Math.round(input), 999);

            return new Intl.NumberFormat('en-US', {
                maximumFractionDigits: 0,
                minimumFractionDigits: 0,
            }).format(rounded);
        }

        const digits = input >= 10 ? 1 : 2;
        const rounded = Number(input.toFixed(digits));

        return new Intl.NumberFormat('en-US', {
            maximumFractionDigits: digits,
            minimumFractionDigits: 0,
        }).format(rounded);
    };

    if (absolute >= 1_000_000) {
        const scaled = absolute / 1_000_000;
        return `${sign}ETB ${formatScaled(scaled)}m`;
    }

    if (absolute >= 1_000) {
        const scaled = absolute / 1_000;
        const formatted = formatScaled(scaled);
        const numeric = Number(formatted.replace(/,/g, ''));

        if (numeric >= 1000) {
            const millionScaled = absolute / 1_000_000;
            return `${sign}ETB ${formatScaled(millionScaled)}m`;
        }

        return `${sign}ETB ${formatted}k`;
    }

    return formatCurrency(value);
};

const formatChange = (value: number | null | undefined): string => {
    if (value === null || value === undefined || Number.isNaN(value)) {
        return '—';
    }

    const absolute = Math.abs(value).toFixed(1);
    const prefix = value > 0 ? '+' : value < 0 ? '-' : '';

    return `${prefix}${absolute}%`;
};

const formatPrimaryKpiValue = (kpi: PrimaryKpi): string => {
    if (kpi.value === null || kpi.value === undefined || Number.isNaN(kpi.value)) {
        return '—';
    }

    const formatType: KpiFormat = kpi.format ?? (kpi.unit === '%' ? 'percent' : 'number');

    switch (formatType) {
        case 'currency':
            return kpi.key === 'margin30d' ? formatCompactCurrency(kpi.value) : formatCurrency(kpi.value);
        case 'percent':
            return formatPercent(kpi.value);
        case 'integer':
            return integerFormatter.format(Math.round(kpi.value));
        case 'number':
        default:
            return formatNumber(kpi.value);
    }
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
    primaryKpis,
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

    const statusBreakdownTotal = React.useMemo(
        () => networkOverview.statusBreakdown.reduce((sum, entry) => sum + entry.count, 0),
        [networkOverview.statusBreakdown]
    );

    const loadPhaseTotal = React.useMemo(
        () => networkOverview.loadPhaseBreakdown.reduce((sum, entry) => sum + entry.count, 0),
        [networkOverview.loadPhaseBreakdown]
    );

    const dailyTrendWithProductivity = React.useMemo(
        () =>
            networkOverview.dailyTrend.map(entry => ({
                ...entry,
                tonkmThousands: (entry.tonkm ?? 0) / 1_000,
            })),
        [networkOverview.dailyTrend]
    );

    const financialPulseMetrics = React.useMemo(
        () => [
            {
                key: 'revenue',
                label: 'Revenue (30d)',
                value: financialOverview.revenue30d,
                change: financialOverview.change.revenue,
                type: 'currency' as const,
            },
            {
                key: 'operatingCost',
                label: 'Operating cost (30d)',
                value: financialOverview.operatingCost30d,
                change: financialOverview.change.operatingCost,
                type: 'currency' as const,
            },
            {
                key: 'margin',
                label: 'Margin (30d)',
                value: financialOverview.margin30d,
                change: financialOverview.change.margin,
                type: 'currency' as const,
            },
            {
                key: 'fareboxRecovery',
                label: 'Farebox recovery',
                value: financialOverview.fareboxRecovery,
                change: financialOverview.change.fareboxRecovery,
                type: 'percent' as const,
            },
        ],
        [financialOverview]
    );

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />
            <div className={cn(
                'flex flex-1 flex-col gap-8 p-4 lg:p-8',
                'bg-gradient-to-br from-slate-50 via-slate-50 to-blue-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-slate-900',
                'transition-opacity duration-500',
                isVisible ? 'opacity-100' : 'opacity-0'
            )}>
                <header className="space-y-4">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="space-y-3">
                            <div className="flex items-center gap-4">
                                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 via-blue-600 to-indigo-700 shadow-lg ring-4 ring-indigo-100 dark:ring-indigo-900/30">
                                    <BarChart3 className="h-7 w-7 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                                        Executive Dashboard
                                    </h1>
                                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mt-1">
                                        Real-time fleet & financial intelligence
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="max-w-3xl">
                        <p className="text-base text-slate-600 dark:text-slate-400">
                            Monitor network performance, cost recovery, and operational excellence across your fleet.
                        </p>
                    </div>
                </header>

                {/* Primary KPIs Section */}
                <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                    {primaryKpis.length === 0 && (
                        <Card className="sm:col-span-2 lg:col-span-3 xl:col-span-6 border-dashed border-slate-300/70 dark:border-slate-700/70 bg-white dark:bg-slate-800">
                            <CardContent className="flex h-32 items-center justify-center text-sm text-slate-500 dark:text-slate-400">
                                No KPI insights available yet.
                            </CardContent>
                        </Card>
                    )}

                    {primaryKpis.map((kpi, index) => {
                        const Icon = PRIMARY_KPI_ICONS[kpi.key] ?? Sparkles;
                        const displayValue = formatPrimaryKpiValue(kpi);
                        const backgrounds = [
                            'bg-white dark:bg-slate-800',
                            'bg-white dark:bg-slate-800',
                            'bg-white dark:bg-slate-800',
                            'bg-white dark:bg-slate-800',
                            'bg-white dark:bg-slate-800',
                            'bg-white dark:bg-slate-800',
                        ];
                        const borderColors = [
                            'border-slate-200 dark:border-slate-700',
                            'border-slate-200 dark:border-slate-700',
                            'border-slate-200 dark:border-slate-700',
                            'border-slate-200 dark:border-slate-700',
                            'border-slate-200 dark:border-slate-700',
                            'border-slate-200 dark:border-slate-700',
                        ];
                        const iconGradients = [
                            'from-indigo-600 to-indigo-700',
                            'from-emerald-600 to-teal-600',
                            'from-amber-600 to-orange-600',
                            'from-sky-600 to-blue-600',
                            'from-rose-600 to-pink-600',
                            'from-purple-600 to-violet-600',
                        ];

                        return (
                            <Card
                                key={kpi.key}
                                className={cn(
                                    'relative overflow-hidden rounded-xl border shadow-sm hover:shadow-md transition-all duration-300 hover:border-slate-300 dark:hover:border-slate-600',
                                    backgrounds[index % backgrounds.length],
                                    borderColors[index % borderColors.length],
                                )}
                            >
                                <CardContent className="p-5">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="space-y-2 flex-1">
                                            <p className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                                                {kpi.label}
                                            </p>
                                            <div className="flex items-baseline gap-2">
                                                <span className="text-2xl font-bold text-slate-900 dark:text-white leading-none">
                                                    {displayValue}
                                                </span>
                                                {kpi.format !== 'percent' && kpi.format !== 'currency' && kpi.unit && (
                                                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                                                        {kpi.unit}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="text-xs">
                                                {renderTrendIndicator(kpi.change)}
                                            </div>
                                        </div>
                                        <div className={cn('flex h-11 w-11 items-center justify-center rounded-lg bg-gradient-to-br shadow-sm', iconGradients[index % iconGradients.length])}>
                                            <Icon className="h-5 w-5 text-white" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </section>

                <section className="space-y-6">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between border-b border-slate-200/50 dark:border-slate-800/50 pb-6">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-indigo-700 shadow-md">
                                <BarChart3 className="h-5 w-5 text-white" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Key Performance Metrics</h2>
                                <p className="mt-0.5 text-sm text-slate-600 dark:text-slate-400">30-day performance snapshot for management review</p>
                            </div>
                        </div>
                        <div className="inline-flex items-center gap-2 rounded-lg bg-white dark:bg-slate-800 px-4 py-2 border border-slate-200 dark:border-slate-700 shadow-sm">
                            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
                            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                Live • {new Date().toLocaleDateString()}
                            </span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {executiveSummary.metrics.map((metric, index) => {
                            const Icon = METRIC_ICONS[metric.key] ?? TrendingUp;
                            const displayValue = metric.unit === '%' ? formatPercent(metric.value) : formatNumber(metric.value);
                            const iconGradients = [
                                'from-indigo-600 to-indigo-700',
                                'from-emerald-600 to-teal-600',
                                'from-amber-600 to-orange-600',
                                'from-rose-600 to-pink-600',
                            ];

                            return (
                                <Card
                                    key={metric.key}
                                    className="relative overflow-hidden border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 hover:border-slate-300 dark:hover:border-slate-600"
                                >
                                    <CardHeader className="pb-3 pt-5 px-5">
                                        <div className="flex items-start justify-between gap-3">
                                            <CardTitle className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                                                {metric.label}
                                            </CardTitle>
                                            <div className={cn('flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br shadow-sm', iconGradients[index % iconGradients.length])}>
                                                <Icon className="h-4 w-4 text-white" />
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="px-5 pb-5 pt-1">
                                        <div className="space-y-2">
                                            <div className="flex items-baseline gap-2">
                                                <span className="text-3xl font-bold text-slate-900 dark:text-white leading-none">{displayValue}</span>
                                                {metric.unit && metric.unit !== '%' && (
                                                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{metric.unit}</span>
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

                    <div className="grid gap-6 lg:grid-cols-3">
                        <Card className="lg:col-span-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm hover:shadow-md transition-all duration-300 rounded-xl">
                            <CardHeader className="flex flex-col gap-3 bg-gradient-to-r from-slate-50 to-slate-100/50 dark:from-slate-800/40 dark:to-slate-700/40 border-b border-slate-200/40 dark:border-slate-700/40">
                                <div className="flex items-center gap-2">
                                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-600 to-indigo-700 shadow-sm">
                                        <Truck className="h-5 w-5 text-white" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-lg font-bold text-slate-900 dark:text-white">Fleet & Workforce Status</CardTitle>
                                        <CardDescription className="text-sm text-slate-600 dark:text-slate-400">Real-time availability metrics across trucks and drivers.</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="grid gap-8 lg:grid-cols-2 pt-8">
                                <div className="space-y-6">
                                    <div className="flex items-center gap-4">
                                        <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-100 to-indigo-50 dark:from-indigo-950/50 dark:to-indigo-900/30">
                                            <Gauge className="h-7 w-7 text-indigo-600 dark:text-indigo-400" />
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted-foreground font-medium">Fleet availability</p>
                                            <div className="flex items-baseline gap-2 mt-1">
                                                <span className="text-3xl font-black text-slate-900 dark:text-white">{formatPercent(executiveSummary.fleet.fleetAvailability)}</span>
                                                <span className="text-xs text-muted-foreground font-semibold">{integerFormatter.format(executiveSummary.fleet.activeTrucks)} / {integerFormatter.format(executiveSummary.fleet.totalTrucks)} trucks</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="h-3 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                                            <div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-blue-500" style={{ width: getProgressWidth(executiveSummary.fleet.fleetAvailability) }} />
                                        </div>
                                        <p className="text-xs text-muted-foreground">Operational readiness</p>
                                    </div>
                                    <div className="flex items-center gap-4 p-4 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/50 dark:border-blue-800/50">
                                        <Truck className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                                        <div>
                                            <p className="text-sm font-semibold text-blue-900 dark:text-blue-100">Active assignments (30d)</p>
                                            <p className="text-2xl font-black text-blue-700 dark:text-blue-300">{integerFormatter.format(executiveSummary.fleet.utilizedAssignments30d)}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-6">
                                    <div className="flex items-center gap-4">
                                        <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-amber-100 to-amber-50 dark:from-amber-950/50 dark:to-amber-900/30">
                                            <Users className="h-7 w-7 text-amber-600 dark:text-amber-400" />
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted-foreground font-medium">Driver availability</p>
                                            <div className="flex items-baseline gap-2 mt-1">
                                                <span className="text-3xl font-black text-slate-900 dark:text-white">{formatPercent(executiveSummary.drivers.availability)}</span>
                                                <span className="text-xs text-muted-foreground font-semibold">{integerFormatter.format(executiveSummary.drivers.active)} / {integerFormatter.format(executiveSummary.drivers.total)} drivers</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="h-3 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                                            <div className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500" style={{ width: getProgressWidth(executiveSummary.drivers.availability) }} />
                                        </div>
                                        <p className="text-xs text-muted-foreground">Workforce allocation</p>
                                    </div>
                                    <div className="flex items-center gap-4 p-4 rounded-xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200/50 dark:border-rose-800/50">
                                        <ClipboardList className="h-6 w-6 text-rose-600 dark:text-rose-400" />
                                        <div>
                                            <p className="text-sm font-semibold text-rose-900 dark:text-rose-100">Open operations</p>
                                            <p className="text-2xl font-black text-rose-700 dark:text-rose-300">{integerFormatter.format(executiveSummary.operations.open)}</p>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm hover:shadow-md transition-all duration-300 rounded-xl">
                            <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100/50 dark:from-slate-800/40 dark:to-slate-700/40 border-b border-slate-200/40 dark:border-slate-700/40">
                                <div className="flex items-center gap-2">
                                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-600 to-teal-600 shadow-sm">
                                        <TrendingUp className="h-5 w-5 text-white" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-lg font-bold text-slate-900 dark:text-white">Performance Trends</CardTitle>
                                        <CardDescription className="text-sm text-slate-600 dark:text-slate-400">30-day change analysis</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-5 pt-6">
                                {['tonnage', 'avgDailyTonnage', 'returnRate', 'avgCycle'].map(key => {
                                    const metric = executiveSummary.metrics.find(item => item.key === key);
                                    if (!metric) {
                                        return null;
                                    }

                                    return (
                                        <div key={metric.key} className="flex items-center justify-between p-3 rounded-xl bg-slate-50/50 dark:bg-slate-800/30 border border-slate-200/40 dark:border-slate-700/40 hover:border-indigo-200/50 dark:hover:border-indigo-700/50 transition-colors">
                                            <div>
                                                <p className="text-sm font-semibold text-slate-900 dark:text-white">{metric.label}</p>
                                                <p className="text-xs text-muted-foreground">{metric.unit || 'Value'}</p>
                                            </div>
                                            {renderTrendIndicator(metric.change)}
                                        </div>
                                    );
                                })}
                            </CardContent>
                        </Card>
                    </div>
                </section>
                )}

                <section className="space-y-6">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between border-b border-slate-200/50 dark:border-slate-800/50 pb-4">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 shadow-md">
                                <Package className="h-5 w-5 text-white" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Network Performance</h2>
                                <p className="text-sm text-slate-600 dark:text-slate-400">Demand coverage, corridor performance, and status mix.</p>
                            </div>
                        </div>
                    </div>

                    <div className="grid gap-4 xl:grid-cols-3">
                        <Card className="xl:col-span-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm hover:shadow-md transition-all duration-200 rounded-xl">
                            <CardHeader className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                                <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white">Tonnage & Trips (30d)</CardTitle>
                                <CardDescription className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">Daily tonnage with trip count and ton-km productivity overlays.</CardDescription>
                            </CardHeader>
                            <CardContent className="pt-6">
                                {dailyTrendWithProductivity.length === 0 ? (
                                    renderEmptyState('No performance data recorded for the selected window.')
                                ) : (
                                    <ResponsiveContainer width="100%" height={360}>
                                        <ComposedChart data={dailyTrendWithProductivity}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="date" />
                                            <YAxis yAxisId="left" orientation="left" stroke="#4338ca" />
                                            <YAxis yAxisId="right" orientation="right" stroke="#14b8a6" />
                                            <YAxis yAxisId="productivity" orientation="right" stroke="#f97316" hide />
                                            <Tooltip />
                                            <Legend />
                                            <Area yAxisId="left" type="monotone" name="Tonnage (MT)" dataKey="tonnage" stroke="#4338ca" fill="#4338ca" fillOpacity={0.18} />
                                            <Line yAxisId="right" type="monotone" name="Trips" dataKey="trips" stroke="#14b8a6" strokeWidth={2} />
                                            <Line yAxisId="productivity" type="monotone" name="Ton-km (000s)" dataKey="tonkmThousands" stroke="#f97316" strokeWidth={2} dot={false} />
                                        </ComposedChart>
                                    </ResponsiveContainer>
                                )}
                            </CardContent>
                        </Card>

                        <Card className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm hover:shadow-md transition-all duration-200 rounded-xl">
                            <CardHeader className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                                <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white">Status Mix</CardTitle>
                                <CardDescription className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">Share of performance status for the last 30 days.</CardDescription>
                            </CardHeader>
                            <CardContent className="pt-6">
                                {networkOverview.statusBreakdown.length === 0 ? (
                                    renderEmptyState('Status mix unavailable – log new performances to populate.')
                                ) : (
                                    <div className="grid gap-6 md:grid-cols-[1.35fr_1fr] md:items-center">
                                        <ResponsiveContainer width="100%" height={320}>
                                            <PieChart>
                                                <Pie
                                                    data={networkOverview.statusBreakdown}
                                                    dataKey="count"
                                                    nameKey="label"
                                                    innerRadius={75}
                                                    outerRadius={120}
                                                    paddingAngle={2}
                                                >
                                                    {networkOverview.statusBreakdown.map(item => (
                                                        <Cell key={item.status} fill={item.color} />
                                                    ))}
                                                </Pie>
                                                <Tooltip
                                                    formatter={(value: unknown, _name: string, context) => {
                                                        const payload = context?.payload as typeof networkOverview.statusBreakdown[number] | undefined;
                                                        const formattedCount = typeof value === 'number' ? integerFormatter.format(value) : value;
                                                        const shareLabel = payload ? `${numberFormatter.format(payload.share)}% share` : '';
                                                        return [`${formattedCount} trips`, shareLabel];
                                                    }}
                                                    labelFormatter={(label: string) => label}
                                                />
                                            </PieChart>
                                        </ResponsiveContainer>

                                        <div className="space-y-4">
                                            <div>
                                                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Tracked trips</p>
                                                <p className="text-2xl font-semibold text-slate-900 dark:text-white">
                                                    {integerFormatter.format(statusBreakdownTotal)}
                                                </p>
                                            </div>
                                            <ul className="space-y-3">
                                                {networkOverview.statusBreakdown.map(item => (
                                                    <li key={item.status} className="flex items-center justify-between gap-3">
                                                        <div className="flex items-center gap-2">
                                                            <span
                                                                aria-hidden
                                                                className="inline-flex h-2.5 w-2.5 rounded-full"
                                                                style={{ backgroundColor: item.color }}
                                                            />
                                                            <span className="text-sm font-medium text-slate-800 dark:text-slate-100">
                                                                {item.label}
                                                            </span>
                                                        </div>
                                                        <span className="text-sm text-slate-600 dark:text-slate-300">
                                                            {numberFormatter.format(item.share)}% · {integerFormatter.format(item.count)}
                                                        </span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        <Card className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm hover:shadow-md transition-all duration-200 rounded-xl">
                            <CardHeader className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                                <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white">Load Phase Mix</CardTitle>
                                <CardDescription className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">Trips grouped by main vs return loads (30d).</CardDescription>
                            </CardHeader>
                            <CardContent className="pt-6">
                                {networkOverview.loadPhaseBreakdown.length === 0 ? (
                                    renderEmptyState('Load phase data unavailable – capture trips with load phase details to populate.')
                                ) : (
                                    <div className="grid gap-6 md:grid-cols-[1.35fr_1fr] md:items-center">
                                        <ResponsiveContainer width="100%" height={320}>
                                            <PieChart>
                                                <Pie
                                                    data={networkOverview.loadPhaseBreakdown}
                                                    dataKey="count"
                                                    nameKey="label"
                                                    innerRadius={75}
                                                    outerRadius={120}
                                                    paddingAngle={2}
                                                >
                                                    {networkOverview.loadPhaseBreakdown.map(item => (
                                                        <Cell key={item.phase} fill={item.color} />
                                                    ))}
                                                </Pie>
                                                <Tooltip
                                                    formatter={(value: unknown, _name: string, context) => {
                                                        const payload = context?.payload as typeof networkOverview.loadPhaseBreakdown[number] | undefined;
                                                        const formattedCount = typeof value === 'number' ? integerFormatter.format(value) : value;
                                                        const shareLabel = payload ? `${numberFormatter.format(payload.share)}% share` : '';
                                                        return [`${formattedCount} trips`, shareLabel];
                                                    }}
                                                    labelFormatter={(label: string) => label}
                                                />
                                            </PieChart>
                                        </ResponsiveContainer>

                                        <div className="space-y-4">
                                            <div>
                                                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Captured trips</p>
                                                <p className="text-2xl font-semibold text-slate-900 dark:text-white">
                                                    {integerFormatter.format(loadPhaseTotal)}
                                                </p>
                                            </div>
                                            <ul className="space-y-3">
                                                {networkOverview.loadPhaseBreakdown.map(item => (
                                                    <li key={item.phase} className="flex items-center justify-between gap-3">
                                                        <div className="flex items-center gap-2">
                                                            <span
                                                                aria-hidden
                                                                className="inline-flex h-2.5 w-2.5 rounded-full"
                                                                style={{ backgroundColor: item.color }}
                                                            />
                                                            <span className="text-sm font-medium text-slate-800 dark:text-slate-100">
                                                                {item.label}
                                                            </span>
                                                        </div>
                                                        <span className="text-sm text-slate-600 dark:text-slate-300">
                                                            {numberFormatter.format(item.share)}% · {integerFormatter.format(item.count)}
                                                        </span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    <Card className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm hover:shadow-md transition-all duration-200 rounded-xl">
                        <CardHeader className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                            <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white">Top Corridors</CardTitle>
                            <CardDescription className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">Tonnage handled on major origin-destination pairs (30d).</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6">
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
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between border-b border-slate-200/50 dark:border-slate-800/50 pb-4">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-600 to-teal-600 shadow-md">
                                <DollarSign className="h-5 w-5 text-white" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Financial Overview</h2>
                                <p className="text-sm text-slate-600 dark:text-slate-400">Revenue, costs, and financial metrics.</p>
                            </div>
                        </div>
                    </div>
                    <div className="grid gap-4 xl:grid-cols-3">
                        <Card className="xl:col-span-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm hover:shadow-md transition-all duration-200 rounded-xl">
                            <CardHeader className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                                <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white">Revenue vs Cost Trend</CardTitle>
                                <CardDescription className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">Six-month view across revenue, cost, and net contribution.</CardDescription>
                            </CardHeader>
                            <CardContent className="pt-6">
                                {financialOverview.trend.length === 0 ? (
                                    renderEmptyState('No financial entries captured yet.')
                                ) : (
                                    <ResponsiveContainer width="100%" height={360}>
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

                        <Card className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm hover:shadow-md transition-all duration-200 rounded-xl">
                            <CardHeader className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                                <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white">Cost Breakdown</CardTitle>
                                <CardDescription className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">Share of spend across cost categories (30d).</CardDescription>
                            </CardHeader>
                            <CardContent className="pt-6">
                                {financialOverview.costBreakdown.length === 0 ? (
                                    renderEmptyState('Cost breakdown unavailable. Add financial records to populate.')
                                ) : (
                                    <>
                                        <ResponsiveContainer width="100%" height={280}>
                                            <PieChart>
                                                <Pie data={financialOverview.costBreakdown} dataKey="value" nameKey="label" innerRadius={65} outerRadius={105} paddingAngle={4}>
                                                    {financialOverview.costBreakdown.map((entry, index) => (
                                                        <Cell key={entry.label} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                                                    ))}
                                                </Pie>
                                                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                                            </PieChart>
                                        </ResponsiveContainer>
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
                                    </>
                                )}
                            </CardContent>
                        </Card>

                        <Card className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm hover:shadow-md transition-all duration-200 rounded-xl">
                            <CardHeader className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                                <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white">Financial Pulse</CardTitle>
                                <CardDescription className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">Month-over-month shifts in core financials.</CardDescription>
                            </CardHeader>
                            <CardContent className="pt-6">
                                <div className="grid gap-3">
                                    {financialPulseMetrics.map(metric => (
                                        <div
                                            key={metric.key}
                                            className="flex items-center justify-between gap-4 rounded-lg border border-slate-200/70 dark:border-slate-700/60 bg-white/50 p-3 dark:bg-slate-900/40"
                                        >
                                            <div>
                                                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                                                    {metric.label}
                                                </p>
                                                <p className="text-lg font-semibold text-slate-900 dark:text-white">
                                                    {formatFinancialValue(metric.value, metric.type)}
                                                </p>
                                            </div>
                                            {renderDelta('Vs previous 30d', metric.change)}
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <Card className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm hover:shadow-md transition-all duration-200 rounded-xl">
                            <CardHeader className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                                <div>
                                    <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white">Fuel Exposure</CardTitle>
                                    <CardDescription className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">Spend and uplift trend.</CardDescription>
                                </div>
                                {(() => {
                                    const fuelCost = getCurrencyParts(financialOverview.fuel.totalCost30d);
                                    const totalVolume = formatNumber(financialOverview.fuel.totalVolume30d, { maximumFractionDigits: 0 });
                                    const avgCost = financialOverview.fuel.avgCostPerLiter30d === null
                                        ? '—'
                                        : `${formatCurrency(financialOverview.fuel.avgCostPerLiter30d)} /L`;

                                    return (
                                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                            <Flame className="h-5 w-5 text-rose-500" />
                                            <span className="flex flex-wrap items-center gap-3">
                                                <span className="flex items-baseline gap-1">
                                                    <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                                                        {fuelCost.unit}
                                                    </span>
                                                    <span className="font-semibold text-slate-900 dark:text-slate-100">
                                                        {fuelCost.amount}
                                                    </span>
                                                </span>
                                                <span>{totalVolume} L</span>
                                                <span>{avgCost}</span>
                                            </span>
                                        </div>
                                    );
                                })()}
                        </CardHeader>
                        <CardContent className="pt-6">
                            {financialOverview.fuel.trend.length === 0 ? (
                                renderEmptyState('Fuel records unavailable for the selected window.')
                            ) : (
                                <ResponsiveContainer width="100%" height={360}>
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
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between border-b border-slate-200/50 dark:border-slate-800/50 pb-4">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-600 to-orange-600 shadow-md">
                                <Wrench className="h-5 w-5 text-white" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Asset & Maintenance</h2>
                                <p className="text-sm text-slate-600 dark:text-slate-400">Maintenance workload and upcoming jobs.</p>
                            </div>
                        </div>
                    </div>

                    <div className="grid gap-4 xl:grid-cols-3">
                        <Card className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm hover:shadow-md transition-all duration-200 rounded-xl">
                            <CardHeader className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                                <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white">Maintenance Pulse</CardTitle>
                                <CardDescription className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">Current status of maintenance queue.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4 pt-6">
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

                        <Card className="xl:col-span-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm hover:shadow-md transition-all duration-200 rounded-xl">
                            <CardHeader className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                                <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white">Maintenance Trend & Upcoming Jobs</CardTitle>
                                <CardDescription className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">Monthly completions vs scheduled jobs, with next five assignments.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6 pt-6">
                                {assetOverview.maintenance.trend.length === 0 ? (
                                    renderEmptyState('Maintenance trend not yet recorded.')
                                ) : (
                                    <ResponsiveContainer width="100%" height={300}>
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
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between border-b border-slate-200/50 dark:border-slate-800/50 pb-4">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-rose-600 to-red-600 shadow-md">
                                <ShieldCheck className="h-5 w-5 text-white" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Safety & Compliance</h2>
                                <p className="text-sm text-slate-600 dark:text-slate-400">Incident rate, severity mix, and leading themes.</p>
                            </div>
                        </div>
                    </div>

                    <div className="grid gap-4 xl:grid-cols-3">
                        <Card className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm hover:shadow-md transition-all duration-200 rounded-xl">
                            <CardHeader className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                                <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white">Incident Summary (90d)</CardTitle>
                                <CardDescription className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">Rate normalised per 100 trips.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4 pt-6">
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

                        <Card className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm hover:shadow-md transition-all duration-200 rounded-xl">
                            <CardHeader className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                                <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white">Severity Mix</CardTitle>
                                <CardDescription className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">Distribution by severity level.</CardDescription>
                            </CardHeader>
                            <CardContent className="pt-6">
                                {safetyOverview.severityMix.length === 0 ? (
                                    renderEmptyState('No safety events reported in this window.')
                                ) : (
                                    <ResponsiveContainer width="100%" height={280}>
                                        <PieChart>
                                            <Pie data={safetyOverview.severityMix} dataKey="count" nameKey="severity" innerRadius={65} outerRadius={105} paddingAngle={4}>
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

                        <Card className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm hover:shadow-md transition-all duration-200 rounded-xl">
                            <CardHeader className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                                <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white">Incident Trend</CardTitle>
                                <CardDescription className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">Rolling six-month incident volume.</CardDescription>
                            </CardHeader>
                            <CardContent className="pt-6">
                                {safetyOverview.incidentTrend.length === 0 ? (
                                    renderEmptyState('Trend data unavailable.')
                                ) : (
                                    <ResponsiveContainer width="100%" height={280}>
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

                    <Card className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm hover:shadow-md transition-all duration-200 rounded-xl">
                        <CardHeader className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                            <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white">Top Incident Themes</CardTitle>
                            <CardDescription className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">Most frequent incident types in the last ninety days.</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6">
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
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between border-b border-slate-200/50 dark:border-slate-800/50 pb-4">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-600 to-violet-600 shadow-md">
                                <Users className="h-5 w-5 text-white" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Customers & Operations</h2>
                                <p className="text-sm text-slate-600 dark:text-slate-400">Top partners by tonnage and recent trip activity.</p>
                            </div>
                        </div>
                    </div>

                    <Card className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm hover:shadow-md transition-all duration-200 rounded-xl">
                        <CardHeader className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                            <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white">Top Customers (90d)</CardTitle>
                            <CardDescription className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">Trips and tonnage delivered per customer.</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6">
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

                    <Card className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm hover:shadow-md transition-all duration-200 rounded-xl">
                        <CardHeader className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                            <div>
                                <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white">Recent Performances</CardTitle>
                                <CardDescription className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">Latest recorded trips with fleet and route details.</CardDescription>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-6">
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

                {statusSummary && (
                    <section className="max-w-2xl">
                        <Card className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm hover:shadow-md transition-all duration-300 rounded-xl">
                            <CardHeader className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                                <div className="flex items-center justify-between gap-2">
                                    <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white">Status Breakdown</CardTitle>
                                    <Badge className="bg-indigo-600 text-white border-0 text-xs font-semibold">
                                        {statusSummaryDateLabel ?? 'Pending'}
                                    </Badge>
                                </div>
                                <CardDescription className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">Today's operational status distribution</CardDescription>
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
                                                <div key={entry.status} className="space-y-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 p-4 transition-all duration-200 hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-sm">
                                                    <div className="flex items-center justify-between gap-2">
                                                        <div>
                                                            <p className="text-sm font-semibold text-slate-900 dark:text-white">{entry.label}</p>
                                                            <p className="text-xs text-slate-600 dark:text-slate-400">{integerFormatter.format(entry.count)} entries</p>
                                                        </div>
                                                        <span className="text-lg font-bold text-slate-900 dark:text-white">{share.toFixed(1)}%</span>
                                                    </div>
                                                    <div className="h-2 w-full rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
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
                    </section>
                )}
            </div>
        </AppLayout>
    );
}
