import type { ComponentType } from 'react';
import * as React from 'react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import AppLayout from '@/layouts/app-layout';
import { usePermissions } from '@/hooks/use-permissions';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import {
    ArrowDownRight,
    ArrowUpRight,
    BarChart3,
    DollarSign,
    Flame,
    Gauge,
    Minus,
    Package,
    ShieldCheck,
    Target,
    Truck,
    Users,
    Wrench,
    Sparkles,
} from 'lucide-react';
import {
    Area,
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

const getBreadcrumbs = (translate: (key: string) => string): BreadcrumbItem[] => [
    {
        title: translate('dashboard.breadcrumb'),
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
        // fareboxRecovery: number | null;
        avgRevenuePerTon: number | null;
        avgCostPerTon: number | null;
        change: {
            revenue: number | null;
            operatingCost: number | null;
            margin: number | null;
            // fareboxRecovery: number | null;
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
            upcoming: Array<{ id: number; truck: string; scheduledDate: string | null; daysUntil: number | null; scheduledRelative: string | null; status: string | null }>;
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

const PRIMARY_KPI_ICONS: Record<string, ComponentType<{ className?: string }>> = {
    tonnage30d: Package,
    trips30d: Truck,
    avgLoadPerTrip: Gauge,
    margin30d: DollarSign,
    // fareboxRecovery: Target,
    fleetUtilisation: Sparkles,
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

const renderTrendIndicator = (
    value: number | null | undefined,
    translate: (key: string, options?: Record<string, unknown>) => string,
) => {
    if (value === null || value === undefined || Number.isNaN(value)) {
        return (
            <span className="flex items-center gap-1 text-sm text-muted-foreground">
                <Minus className="h-4 w-4" />
                {translate('dashboard.kpi.changeUnavailable')}
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

const renderStatusBadge = (
    status: string | null | undefined,
    translate: (key: string, options?: Record<string, unknown>) => string,
) => {
    if (!status) {
        return <Badge variant="outline">{translate('dashboard.status.unknown')}</Badge>;
    }

    const normalized = status.toLowerCase();
    const badgeClass = STATUS_COLOR_MAP[normalized] ?? 'bg-slate-500/15 text-slate-600 border border-slate-200 dark:text-slate-300 dark:border-slate-700';
    const fallbackLabel = normalized.replaceAll('_', ' ');

    return (
        <span className={cn('inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium capitalize', badgeClass)}>
            {translate(`dashboard.status.${normalized}`, { defaultValue: fallbackLabel })}
        </span>
    );
};

const renderEmptyState = (message: string) => (
    <div className="flex h-64 items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
        {message}
    </div>
);

const renderDelta = (
    label: string,
    value: number | null | undefined,
    translate: (key: string, options?: Record<string, unknown>) => string,
) => (
    <div className="flex flex-col gap-1">
        <span className="text-xs text-muted-foreground">{label}</span>
        {renderTrendIndicator(value, translate)}
    </div>
);

export default function Dashboard({
    primaryKpis,
    networkOverview,
    financialOverview,
    assetOverview,
    safetyOverview,
    latestTruckStatusSummary,
    topCustomers,
    recentPerformances,
}: DashboardProps) {
    const { hasPermission } = usePermissions();
    const { t } = useTranslation();
    const breadcrumbs = React.useMemo(() => getBreadcrumbs(t), [t]);
    const canViewDashboard = hasPermission('dashboard.view');
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
                label: t('dashboard.financialPulse.revenue'),
                value: financialOverview.revenue30d,
                change: financialOverview.change.revenue,
                type: 'currency' as const,
            },
            {
                key: 'operatingCost',
                label: t('dashboard.financialPulse.operatingCost'),
                value: financialOverview.operatingCost30d,
                change: financialOverview.change.operatingCost,
                type: 'currency' as const,
            },
            {
                key: 'margin',
                label: t('dashboard.financialPulse.margin'),
                value: financialOverview.margin30d,
                change: financialOverview.change.margin,
                type: 'currency' as const,
            },
            // {
            //     key: 'fareboxRecovery',
            //     label: t('dashboard.financialPulse.fareboxRecovery'),
            //     value: financialOverview.fareboxRecovery,
            //     change: financialOverview.change.fareboxRecovery,
            //     type: 'percent' as const,
            // },
        ],
        [financialOverview, t]
    );

    if (!canViewDashboard) {
        return (
            <AppLayout breadcrumbs={breadcrumbs}>
                <Head title={t('dashboard.title')} />
                <div className="flex flex-1 flex-col items-center justify-center gap-6 p-8 text-center">
                    <img
                        src="/images/dashboard-permission.svg"
                        alt={t('dashboard.accessRestricted.imageAlt')}
                        className="h-60 w-auto max-w-full"
                    />
                    <div className="space-y-2">
                        <h1 className="text-3xl font-semibold text-slate-900 dark:text-white">
                            {t('dashboard.accessRestricted.title')}
                        </h1>
                        <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md">
                            {t('dashboard.accessRestricted.description')}
                        </p>
                    </div>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t('dashboard.title')} />
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
                                        {t('dashboard.header.title')}
                                    </h1>
                                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mt-1">
                                        {t('dashboard.header.subtitle')}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="max-w-3xl">
                        <p className="text-base text-slate-600 dark:text-slate-400">
                            {t('dashboard.header.description')}
                        </p>
                    </div>
                </header>

                {/* Primary KPIs Section */}
                <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                    {primaryKpis.length === 0 && (
                        <Card className="sm:col-span-2 lg:col-span-3 xl:col-span-6 border-dashed border-slate-300/70 dark:border-slate-700/70 bg-white dark:bg-slate-800">
                            <CardContent className="flex h-32 items-center justify-center text-sm text-slate-500 dark:text-slate-400">
                                {t('dashboard.empty.kpis')}
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
                                                {t(`dashboard.kpis.${kpi.key}`, { defaultValue: kpi.label })}
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
                                                {renderTrendIndicator(kpi.change, t)}
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
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between border-b border-slate-200/50 dark:border-slate-800/50 pb-4">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 shadow-md">
                                <Package className="h-5 w-5 text-white" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{t('dashboard.sections.networkPerformance.title')}</h2>
                                <p className="text-sm text-slate-600 dark:text-slate-400">{t('dashboard.sections.networkPerformance.subtitle')}</p>
                            </div>
                        </div>
                    </div>

                    <div className="grid gap-4 xl:grid-cols-3">
                        <Card className="xl:col-span-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm hover:shadow-md transition-all duration-200 rounded-xl">
                            <CardHeader className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                                <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white">{t('dashboard.network.tonnageTrips.title')}</CardTitle>
                                <CardDescription className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">{t('dashboard.network.tonnageTrips.subtitle')}</CardDescription>
                            </CardHeader>
                            <CardContent className="pt-6">
                                {dailyTrendWithProductivity.length === 0 ? (
                                    renderEmptyState(t('dashboard.empty.performanceData'))
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
                                            <Area yAxisId="left" type="monotone" name={t('dashboard.network.tonnageTrips.tonnageLabel')} dataKey="tonnage" stroke="#4338ca" fill="#4338ca" fillOpacity={0.18} />
                                            <Line yAxisId="right" type="monotone" name={t('dashboard.network.tonnageTrips.tripsLabel')} dataKey="trips" stroke="#14b8a6" strokeWidth={2} />
                                            <Line yAxisId="productivity" type="monotone" name={t('dashboard.network.tonnageTrips.tonkmLabel')} dataKey="tonkmThousands" stroke="#f97316" strokeWidth={2} dot={false} />
                                        </ComposedChart>
                                    </ResponsiveContainer>
                                )}
                            </CardContent>
                        </Card>

                        <Card className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm hover:shadow-md transition-all duration-200 rounded-xl">
                            <CardHeader className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                                <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white">{t('dashboard.network.loadPhase.title')}</CardTitle>
                                <CardDescription className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">{t('dashboard.network.loadPhase.subtitle')}</CardDescription>
                            </CardHeader>
                            <CardContent className="pt-6">
                                {networkOverview.loadPhaseBreakdown.length === 0 ? (
                                    renderEmptyState(t('dashboard.empty.loadPhaseData'))
                                ) : (
                                    <div className="flex flex-col gap-6">
                                        <div className="text-center">
                                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{t('dashboard.network.loadPhase.capturedTrips')}</p>
                                            <p className="text-2xl font-semibold text-slate-900 dark:text-white">
                                                {integerFormatter.format(loadPhaseTotal)}
                                            </p>
                                        </div>

                                        <div className="mx-auto w-full max-w-[360px]">
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
                                                            const shareLabel = payload
                                                                ? t('dashboard.network.loadPhase.shareLabel', {
                                                                    share: numberFormatter.format(payload.share),
                                                                })
                                                                : '';
                                                            return [
                                                                t('dashboard.network.loadPhase.tripCountLabel', { countValue: formattedCount }),
                                                                shareLabel,
                                                            ];
                                                        }}
                                                        labelFormatter={(_label: string, payload?: Array<{ payload?: { phase?: string; label?: string } }>) => {
                                                            const rawLabel = payload?.[0]?.payload?.label ?? _label;
                                                            const phaseKey = payload?.[0]?.payload?.phase ?? '';

                                                            return t(`dashboard.network.loadPhase.labels.${phaseKey}`, {
                                                                defaultValue: rawLabel,
                                                            });
                                                        }}
                                                    />
                                                </PieChart>
                                            </ResponsiveContainer>
                                        </div>

                                        <ul className="flex flex-wrap items-center justify-center gap-x-6 gap-y-4 border-t border-slate-200/60 pt-4 text-sm dark:border-slate-700/60">
                                            {networkOverview.loadPhaseBreakdown.map(item => (
                                                <li key={item.phase} className="flex items-center gap-3">
                                                    <span
                                                        aria-hidden
                                                        className="inline-flex h-2.5 w-2.5 rounded-full"
                                                        style={{ backgroundColor: item.color }}
                                                    />
                                                    <div className="flex flex-col">
                                                        <span className="font-medium text-slate-800 dark:text-slate-100">
                                                            {t(`dashboard.network.loadPhase.labels.${item.phase}`, {
                                                                defaultValue: item.label,
                                                            })}
                                                        </span>
                                                        <span className="text-slate-600 dark:text-slate-300">
                                                            {t('dashboard.network.loadPhase.legend', {
                                                                shareValue: numberFormatter.format(item.share),
                                                                countValue: integerFormatter.format(item.count),
                                                            })}
                                                        </span>
                                                    </div>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    <Card className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm hover:shadow-md transition-all duration-200 rounded-xl">
                        <CardHeader className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                            <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white">{t('dashboard.network.corridors.title')}</CardTitle>
                            <CardDescription className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">{t('dashboard.network.corridors.subtitle')}</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6">
                            {networkOverview.corridors.length === 0 ? (
                                renderEmptyState(t('dashboard.empty.corridors'))
                            ) : (
                                <ResponsiveContainer width="100%" height={360}>
                                    <BarChart data={networkOverview.corridors} layout="vertical" margin={{ left: 24 }}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis type="number" />
                                        <YAxis dataKey="label" type="category" width={180} />
                                        <Tooltip />
                                        <Legend />
                                        <Bar dataKey="tonnage" name={t('dashboard.network.corridors.tonnageLabel')} fill="#4338ca" radius={[0, 4, 4, 0]} />
                                        <Bar dataKey="trips" name={t('dashboard.network.corridors.tripsLabel')} fill="#14b8a6" radius={[0, 4, 4, 0]} />
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
                                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{t('dashboard.sections.financialOverview.title')}</h2>
                                <p className="text-sm text-slate-600 dark:text-slate-400">{t('dashboard.sections.financialOverview.subtitle')}</p>
                            </div>
                        </div>
                    </div>
                    <div className="grid gap-4 xl:grid-cols-3">
                        <Card className="xl:col-span-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm hover:shadow-md transition-all duration-200 rounded-xl">
                            <CardHeader className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                                <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white">{t('dashboard.financial.trend.title')}</CardTitle>
                                <CardDescription className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">{t('dashboard.financial.trend.subtitle')}</CardDescription>
                            </CardHeader>
                            <CardContent className="pt-6">
                                {financialOverview.trend.length === 0 ? (
                                    renderEmptyState(t('dashboard.empty.financialTrend'))
                                ) : (
                                    <ResponsiveContainer width="100%" height={360}>
                                        <ComposedChart data={financialOverview.trend}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="period" />
                                            <YAxis />
                                            <Tooltip />
                                            <Legend />
                                            <Bar dataKey="revenue" name={t('dashboard.financial.trend.revenue')} fill="#14b8a6" radius={[4, 4, 0, 0]} />
                                            <Bar dataKey="cost" name={t('dashboard.financial.trend.operatingCost')} fill="#f59e0b" radius={[4, 4, 0, 0]} />
                                            <Line type="monotone" dataKey="net" name={t('dashboard.financial.trend.net')} stroke="#4338ca" strokeWidth={2} />
                                        </ComposedChart>
                                    </ResponsiveContainer>
                                )}
                            </CardContent>
                        </Card>

                        <Card className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm hover:shadow-md transition-all duration-200 rounded-xl">
                            <CardHeader className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                                <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white">{t('dashboard.financial.breakdown.title')}</CardTitle>
                                <CardDescription className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">{t('dashboard.financial.breakdown.subtitle')}</CardDescription>
                            </CardHeader>
                            <CardContent className="pt-6">
                                {financialOverview.costBreakdown.length === 0 ? (
                                    renderEmptyState(t('dashboard.empty.costBreakdown'))
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
                                                <span>{t('dashboard.financial.breakdown.avgRevenuePerTon')}</span>
                                                <span className="font-medium">{formatCurrency(financialOverview.avgRevenuePerTon)}</span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span>{t('dashboard.financial.breakdown.avgCostPerTon')}</span>
                                                <span className="font-medium">{formatCurrency(financialOverview.avgCostPerTon)}</span>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </CardContent>
                        </Card>

                        <Card className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm hover:shadow-md transition-all duration-200 rounded-xl">
                            <CardHeader className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                                <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white">{t('dashboard.financial.pulse.title')}</CardTitle>
                                <CardDescription className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">{t('dashboard.financial.pulse.subtitle')}</CardDescription>
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
                                            {renderDelta(t('dashboard.financial.pulse.deltaLabel'), metric.change, t)}
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm hover:shadow-md transition-all duration-300 rounded-xl">
                            <CardHeader className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                                <div className="flex items-center justify-between gap-2">
                                    <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white">{t('dashboard.statusBreakdown.title')}</CardTitle>
                                    <Badge className="bg-indigo-600 text-white border-0 text-xs font-semibold">
                                        {statusSummaryDateLabel ?? t('dashboard.statusBreakdown.pending')}
                                    </Badge>
                                </div>
                                <CardDescription className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">{t('dashboard.statusBreakdown.subtitle')}</CardDescription>
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
                                                            <p className="text-xs text-slate-600 dark:text-slate-400">
                                                                {t('dashboard.statusBreakdown.entries', { countValue: integerFormatter.format(entry.count) })}
                                                            </p>
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
                                        {t('dashboard.empty.statusUpdates')}
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                    </div>

                    <Card className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm hover:shadow-md transition-all duration-200 rounded-xl">
                            <CardHeader className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                                <div>
                                    <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white">{t('dashboard.financial.fuel.title')}</CardTitle>
                                    <CardDescription className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">{t('dashboard.financial.fuel.subtitle')}</CardDescription>
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
                                renderEmptyState(t('dashboard.empty.fuelRecords'))
                            ) : (
                                <ResponsiveContainer width="100%" height={360}>
                                    <ComposedChart data={financialOverview.fuel.trend}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="period" />
                                        <YAxis yAxisId="left" orientation="left" stroke="#f59e0b" />
                                        <YAxis yAxisId="right" orientation="right" stroke="#14b8a6" />
                                        <Tooltip />
                                        <Legend />
                                        <Bar yAxisId="left" dataKey="cost" name={t('dashboard.financial.fuel.costLabel')} fill="#f59e0b" radius={[4, 4, 0, 0]} />
                                        <Line yAxisId="right" type="monotone" dataKey="volume" name={t('dashboard.financial.fuel.volumeLabel')} stroke="#14b8a6" strokeWidth={2} />
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
                                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{t('dashboard.sections.assetMaintenance.title')}</h2>
                                <p className="text-sm text-slate-600 dark:text-slate-400">{t('dashboard.sections.assetMaintenance.subtitle')}</p>
                            </div>
                        </div>
                    </div>

                    <div className="grid gap-4 xl:grid-cols-3">
                        <Card className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm hover:shadow-md transition-all duration-200 rounded-xl">
                            <CardHeader className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                                <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white">{t('dashboard.maintenance.pulse.title')}</CardTitle>
                                <CardDescription className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">{t('dashboard.maintenance.pulse.subtitle')}</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4 pt-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <Wrench className="h-9 w-9 text-indigo-500" />
                                        <div>
                                            <p className="text-sm font-medium">{t('dashboard.maintenance.pulse.scheduled')}</p>
                                            <p className="text-muted-foreground">{t('dashboard.maintenance.pulse.bookedInCalendar')}</p>
                                        </div>
                                    </div>
                                    <span className="text-2xl font-semibold">{integerFormatter.format(assetOverview.maintenance.scheduled)}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-rose-600">{t('dashboard.maintenance.pulse.overdue')}</p>
                                        <p className="text-xs text-muted-foreground">{t('dashboard.maintenance.pulse.pastSchedule')}</p>
                                    </div>
                                    <span className="text-xl font-semibold text-rose-600">{integerFormatter.format(assetOverview.maintenance.overdue)}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-teal-600">{t('dashboard.maintenance.pulse.completed')}</p>
                                        <p className="text-xs text-muted-foreground">{t('dashboard.maintenance.pulse.closedWorkOrders')}</p>
                                    </div>
                                    <span className="text-xl font-semibold text-teal-600">{integerFormatter.format(assetOverview.maintenance.completed30d)}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium">{t('dashboard.maintenance.pulse.avgTurnaround')}</p>
                                        <p className="text-xs text-muted-foreground">{t('dashboard.maintenance.pulse.scheduledToComplete')}</p>
                                    </div>
                                    <span className="text-xl font-semibold">
                                        {assetOverview.maintenance.averageTurnaroundDays === null
                                            ? '—'
                                            : t('dashboard.maintenance.pulse.daysLabel', {
                                                days: formatNumber(assetOverview.maintenance.averageTurnaroundDays),
                                            })}
                                    </span>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="xl:col-span-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm hover:shadow-md transition-all duration-200 rounded-xl">
                            <CardHeader className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                                <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white">{t('dashboard.maintenance.trend.title')}</CardTitle>
                                <CardDescription className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">{t('dashboard.maintenance.trend.subtitle')}</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6 pt-6">
                                {assetOverview.maintenance.trend.length === 0 ? (
                                    renderEmptyState(t('dashboard.empty.maintenanceTrend'))
                                ) : (
                                    <ResponsiveContainer width="100%" height={300}>
                                        <ComposedChart data={assetOverview.maintenance.trend}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="period" />
                                            <YAxis />
                                            <Tooltip />
                                            <Legend />
                                            <Bar dataKey="scheduled" name={t('dashboard.maintenance.trend.scheduledSeries')} fill="#4338ca" radius={[4, 4, 0, 0]} />
                                            <Bar dataKey="completed" name={t('dashboard.maintenance.trend.completedSeries')} fill="#14b8a6" radius={[4, 4, 0, 0]} />
                                        </ComposedChart>
                                    </ResponsiveContainer>
                                )}

                                <div className="space-y-3">
                                    <h3 className="text-sm font-semibold text-muted-foreground uppercase">{t('dashboard.maintenance.trend.nextJobs')}</h3>
                                    {assetOverview.maintenance.upcoming.length === 0 ? (
                                        <p className="text-sm text-muted-foreground">{t('dashboard.empty.upcomingMaintenance')}</p>
                                    ) : (
                                        <div className="grid gap-3">
                                            {assetOverview.maintenance.upcoming.map(item => {
                                                const daysUntil = item.daysUntil ?? null;
                                                const relativeLabel = item.scheduledRelative
                                                    ?? (daysUntil === null
                                                        ? t('dashboard.maintenance.trend.notScheduled')
                                                        : daysUntil > 0
                                                            ? t('dashboard.maintenance.trend.inDays', { count: daysUntil })
                                                            : daysUntil === 0
                                                                ? t('dashboard.maintenance.trend.today')
                                                                : t('dashboard.maintenance.trend.overdueDays', { count: Math.abs(daysUntil) }));

                                                return (
                                                    <div key={item.id} className="flex items-center justify-between rounded-lg border px-3 py-2">
                                                        <div className="flex items-center gap-3">
                                                            <ShieldCheck className="h-5 w-5 text-indigo-500" />
                                                            <div>
                                                                <p className="text-sm font-medium">{t('dashboard.maintenance.trend.truckLabel', { truck: item.truck })}</p>
                                                                <p className="text-xs text-muted-foreground">
                                                                    {t('dashboard.maintenance.trend.scheduledDateLabel', {
                                                                        date: item.scheduledDate ? dateFormatter.format(new Date(item.scheduledDate)) : t('dashboard.maintenance.trend.tbc'),
                                                                    })}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <div className="text-right text-sm">
                                                            <p className="font-medium">{relativeLabel}</p>
                                                            <p className="text-xs text-muted-foreground capitalize">{item.status ?? t('dashboard.maintenance.trend.scheduledStatus')}</p>
                                                        </div>
                                                    </div>
                                                );
                                            })}
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
                                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{t('dashboard.sections.safetyCompliance.title')}</h2>
                                <p className="text-sm text-slate-600 dark:text-slate-400">{t('dashboard.sections.safetyCompliance.subtitle')}</p>
                            </div>
                        </div>
                    </div>

                    <div className="grid gap-4 xl:grid-cols-3">
                        <Card className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm hover:shadow-md transition-all duration-200 rounded-xl">
                            <CardHeader className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                                <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white">{t('dashboard.safety.summary.title')}</CardTitle>
                                <CardDescription className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">{t('dashboard.safety.summary.subtitle')}</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4 pt-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <ShieldCheck className="h-10 w-10 text-rose-500" />
                                        <div>
                                            <p className="text-sm text-muted-foreground">{t('dashboard.safety.summary.recordedIncidents')}</p>
                                            <p className="text-3xl font-semibold">{integerFormatter.format(safetyOverview.incidents90d)}</p>
                                        </div>
                                    </div>
                                    {renderTrendIndicator(safetyOverview.change.incidents, t)}
                                </div>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-muted-foreground">{t('dashboard.safety.summary.ratePer100')}</p>
                                        <p className="text-2xl font-semibold">{formatPercent(safetyOverview.incidentRatePer100Trips, 2)}</p>
                                    </div>
                                    {renderTrendIndicator(safetyOverview.change.incidentRate, t)}
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm hover:shadow-md transition-all duration-200 rounded-xl">
                            <CardHeader className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                                <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white">{t('dashboard.safety.severity.title')}</CardTitle>
                                <CardDescription className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">{t('dashboard.safety.severity.subtitle')}</CardDescription>
                            </CardHeader>
                            <CardContent className="pt-6">
                                {safetyOverview.severityMix.length === 0 ? (
                                    renderEmptyState(t('dashboard.empty.safetyEvents'))
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
                                <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white">{t('dashboard.safety.trend.title')}</CardTitle>
                                <CardDescription className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">{t('dashboard.safety.trend.subtitle')}</CardDescription>
                            </CardHeader>
                            <CardContent className="pt-6">
                                {safetyOverview.incidentTrend.length === 0 ? (
                                    renderEmptyState(t('dashboard.empty.trendData'))
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

                </section>

                <section className="space-y-6">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between border-b border-slate-200/50 dark:border-slate-800/50 pb-4">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-600 to-violet-600 shadow-md">
                                <Users className="h-5 w-5 text-white" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{t('dashboard.sections.customersOperations.title')}</h2>
                                <p className="text-sm text-slate-600 dark:text-slate-400">{t('dashboard.sections.customersOperations.subtitle')}</p>
                            </div>
                        </div>
                    </div>

                    <Card className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm hover:shadow-md transition-all duration-200 rounded-xl">
                        <CardHeader className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                            <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white">{t('dashboard.customers.top.title')}</CardTitle>
                            <CardDescription className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">{t('dashboard.customers.top.subtitle')}</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6">
                            {topCustomers.length === 0 ? (
                                renderEmptyState(t('dashboard.empty.customers'))
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>{t('dashboard.customers.table.customer')}</TableHead>
                                            <TableHead className="text-right">{t('dashboard.customers.table.trips')}</TableHead>
                                            <TableHead className="text-right">{t('dashboard.customers.table.tonnage')}</TableHead>
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
                                <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white">{t('dashboard.performances.title')}</CardTitle>
                                <CardDescription className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">{t('dashboard.performances.subtitle')}</CardDescription>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-6">
                            {recentPerformances.length === 0 ? (
                                <p className="text-sm text-muted-foreground">{t('dashboard.empty.performances')}</p>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>{t('dashboard.performances.table.trip')}</TableHead>
                                            <TableHead>{t('dashboard.performances.table.fleet')}</TableHead>
                                            <TableHead>{t('dashboard.performances.table.route')}</TableHead>
                                            <TableHead className="text-right">{t('dashboard.performances.table.cargo')}</TableHead>
                                            <TableHead className="text-right">{t('dashboard.performances.table.dispatched')}</TableHead>
                                            <TableHead className="text-right">{t('dashboard.performances.table.status')}</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {recentPerformances.map(performance => (
                                            <TableRow key={performance.id}>
                                                <TableCell className="font-medium">
                                                    {performance.trip ?? t('dashboard.performances.tripFallback', { id: performance.id })}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col text-sm">
                                                        <span>{performance.driverTruck?.driver?.name ?? t('dashboard.performances.unknownDriver')}</span>
                                                        <span className="text-muted-foreground">{performance.driverTruck?.truck?.plate ?? t('dashboard.performances.unknownTruck')}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-sm text-muted-foreground">
                                                    {t('dashboard.performances.routeLabel', {
                                                        origin: performance.origin?.name ?? t('dashboard.performances.unknownOrigin'),
                                                        destination: performance.destination?.name ?? t('dashboard.performances.unknownDestination'),
                                                    })}
                                                </TableCell>
                                                <TableCell className="text-right">{numberFormatter.format(performance.CargoVolumMT)}</TableCell>
                                                <TableCell className="text-right">{performance.DateDispach ? dateFormatter.format(new Date(performance.DateDispach)) : '—'}</TableCell>
                                                <TableCell className="text-right">{renderStatusBadge(performance.satus, t)}</TableCell>
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
