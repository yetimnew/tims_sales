import { useMemo, useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Activity, Flame, Globe, Map as MapIcon, MapPin, TrendingUp } from 'lucide-react';
import { ReportHero } from '@/components/reports/report-hero';
import { ReportPageShell } from '@/components/reports/report-page-shell';
import { ReportSectionCard } from '@/components/reports/report-section-card';
import { ReportSummaryGrid } from '@/components/reports/report-summary-grid';

interface GeoRow {
    name: string;
    trips: number;
    tonnage: number;
    revenue: number;
}

interface RegionTrend {
    region: string;
    series: { month: string; revenue: number }[];
}

interface GeographyHeatmapsProps {
    filters: { from: string; to: string };
    regions: GeoRow[];
    zones: GeoRow[];
    woredas: GeoRow[];
    places: GeoRow[];
    regionTrends: RegionTrend[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Reports', href: '/reports/geography-heatmaps' },
    { title: 'Geographic Heatmaps', href: '/reports/geography-heatmaps' },
];

const formatNumber = (value: number) => value.toLocaleString();
const formatDecimal = (value: number) => value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const formatCurrency = (value: number) => new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(value);

export default function GeographyHeatmaps({ filters, regions, zones, woredas, places, regionTrends }: GeographyHeatmapsProps) {
    const [from, setFrom] = useState(filters?.from ?? '');
    const [to, setTo] = useState(filters?.to ?? '');

    const { totals, topRegions, momentum } = useMemo(() => {
        const sumRows = (rows: GeoRow[]) =>
            rows.reduce(
                (acc, row) => ({
                    trips: acc.trips + (row.trips ?? 0),
                    tonnage: acc.tonnage + (row.tonnage ?? 0),
                    revenue: acc.revenue + (row.revenue ?? 0),
                }),
                { trips: 0, tonnage: 0, revenue: 0 },
            );

        const regionTotals = sumRows(regions);
        const sortedRegions = [...regions].sort((a, b) => b.revenue - a.revenue);
        const topThree = sortedRegions.slice(0, 3);

        const momentumInsights = regionTrends.map((trend) => {
            if (trend.series.length < 2) {
                return {
                    region: trend.region,
                    change: null,
                    latest: trend.series.at(-1)?.revenue ?? 0,
                };
            }

            const first = trend.series[0].revenue;
            const last = trend.series[trend.series.length - 1].revenue;
            const change = first === 0 ? null : ((last - first) / first) * 100;

            return {
                region: trend.region,
                change,
                latest: last,
            };
        });

        const sortedMomentum = momentumInsights.sort((a, b) => (b.change ?? -Infinity) - (a.change ?? -Infinity)).slice(0, 3);

        return {
            totals: regionTotals,
            topRegions: topThree,
            momentum: sortedMomentum,
        };
    }, [regions, regionTrends]);

    const tables = useMemo(
        () => [
            { id: 'regions', title: 'Regions', subtitle: 'Macro performance across the network.', rows: regions },
            { id: 'zones', title: 'Zones', subtitle: 'Operational lens for key corridors.', rows: zones },
            { id: 'woredas', title: 'Woredas', subtitle: 'Local distribution hubs and districts.', rows: woredas },
            { id: 'places', title: 'Places', subtitle: 'Individual depots, warehouses, and delivery points.', rows: places },
        ],
        [regions, zones, woredas, places],
    );

    const mapHotspots = useMemo(() => {
        const anchorPositions = [
            { top: '18%', left: '26%' },
            { top: '46%', left: '62%' },
            { top: '68%', left: '38%' },
        ];

        return topRegions.map((region, index) => ({
            region: region.name,
            revenue: region.revenue,
            trips: region.trips,
            tonnage: region.tonnage,
            position: anchorPositions[index] ?? { top: `${24 + index * 18}%`, left: `${34 + index * 12}%` },
        }));
    }, [topRegions]);

    const formatDate = (date: Date) => date.toISOString().slice(0, 10);

    const handleApply = () => {
        router.get('/reports/geography-heatmaps', { from, to }, { preserveState: true, preserveScroll: true });
    };

    const handleReset = () => {
        setFrom(filters?.from ?? '');
        setTo(filters?.to ?? '');
        router.get('/reports/geography-heatmaps', {}, { preserveState: false, preserveScroll: true });
    };

    const setQuickRange = (days: number) => {
        const end = new Date();
        const start = new Date();
        start.setDate(end.getDate() - Math.max(days - 1, 0));

        setFrom(formatDate(start));
        setTo(formatDate(end));
    };

    const summaryItems = [
        {
            key: 'total-trips',
            label: 'Total trips',
            value: formatNumber(totals.trips),
            helper: 'Dispatches executed across all regions',
            icon: <Activity className="h-3.5 w-3.5" />,
            iconWrapperClassName: 'bg-sky-50 text-sky-600 dark:bg-sky-500/20 dark:text-sky-200',
        },
        {
            key: 'aggregate-tonnage',
            label: 'Aggregate tonnage',
            value: formatDecimal(totals.tonnage),
            helper: 'Freight carried (metric tons)',
            icon: <MapPin className="h-3.5 w-3.5" />,
            iconWrapperClassName: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-200',
        },
        {
            key: 'gross-revenue',
            label: 'Gross revenue',
            value: formatCurrency(totals.revenue),
            helper: 'Weighted by all geographic clusters',
            icon: <TrendingUp className="h-3.5 w-3.5" />,
            iconWrapperClassName: 'bg-amber-50 text-amber-600 dark:bg-amber-500/20 dark:text-amber-200',
        },
        {
            key: 'top-region',
            label: 'Top performing region',
            value: topRegions[0]?.name ?? '—',
            helper: topRegions[0]
                ? `${formatCurrency(topRegions[0].revenue)} · ${formatNumber(topRegions[0].trips)} trips`
                : 'Awaiting data',
            icon: <Flame className="h-3.5 w-3.5" />,
            iconWrapperClassName: 'bg-rose-50 text-rose-600 dark:bg-rose-500/20 dark:text-rose-200',
        },
    ];

    const detailBadges = [
        { key: 'from', label: `From ${filters?.from || '—'}` },
        { key: 'to', label: `To ${filters?.to || '—'}` },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Geographic Heatmaps" />
            <ReportPageShell>
                <ReportHero
                    eyebrow="Geo intelligence"
                    title="Geographic heatmaps"
                    description="Surface the corridors that deliver the strongest contribution. Blend spatial and financial metrics, explore hotspots, and spot momentum shifts before they ripple into your operations."
                    actions={
                        <>
                            <Button type="button" variant="outline" onClick={() => setQuickRange(7)}>
                                Last 7 days
                            </Button>
                            <Button type="button" variant="outline" onClick={() => setQuickRange(30)}>
                                Last 30 days
                            </Button>
                            <Button
                                type="button"
                                variant="ghost"
                                className="text-slate-500 hover:text-slate-700 dark:text-slate-300"
                                onClick={handleReset}
                            >
                                Reset
                            </Button>
                        </>
                    }
                />

                <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
                    <ReportSectionCard
                        title="Filters"
                        description="Focus on a window or replay historic performance."
                        contentClassName="flex flex-col gap-6 p-6"
                    >
                        <div className="space-y-2">
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Date range</span>
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                <Input type="date" value={from} onChange={(event) => setFrom(event.target.value)} />
                                <Input type="date" value={to} onChange={(event) => setTo(event.target.value)} />
                            </div>
                            <p className="text-xs text-muted-foreground">Need precise control? Set the range manually and apply.</p>
                        </div>
                        <Separator className="border-dashed" />
                        <div className="space-y-3">
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Quick presets</span>
                            <div className="flex flex-wrap gap-2">
                                {[7, 14, 30, 90].map((days) => (
                                    <Badge
                                        key={days}
                                        variant="outline"
                                        className="cursor-pointer border-slate-300/70 hover:border-slate-400 dark:border-slate-700"
                                        onClick={() => setQuickRange(days)}
                                    >
                                        {days}-day view
                                    </Badge>
                                ))}
                            </div>
                        </div>
                        <div className="flex flex-col gap-3 border-t border-slate-200/60 pt-6 sm:flex-row sm:justify-between dark:border-slate-700/60">
                            <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={handleReset}>
                                Reset
                            </Button>
                            <Button type="button" className="w-full sm:w-auto" onClick={handleApply}>
                                Apply filters
                            </Button>
                        </div>
                    </ReportSectionCard>

                    <ReportSectionCard
                        title="Signal overview"
                        description="Key throughput and revenue indicators for the selected window."
                        contentClassName="p-6"
                    >
                        <ReportSummaryGrid items={summaryItems} className="gap-4 md:grid-cols-2" />
                    </ReportSectionCard>
                </div>

                <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
                    <ReportSectionCard
                        title="Heatmap explorer"
                        description="Hover over hotspots to view the revenue pulse of each corridor."
                        contentClassName="p-6"
                    >
                        <div className="relative overflow-hidden rounded-2xl border border-slate-200/70 bg-gradient-to-br from-slate-100 via-slate-200 to-slate-50 p-6 shadow-inner dark:border-slate-800/60 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
                            <div
                                className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'160\' height=\'160\'%3E%3Cpath d=\'M0 80h160M80 0v160\' fill=\'none\' stroke=\'%23cbd5f5\' stroke-opacity=\'0.22\' stroke-width=\'1\'/%3E%3C/svg%3E')] opacity-60 dark:opacity-20"
                                aria-hidden
                            />
                            <div className="relative z-10 flex flex-col gap-4">
                                <div className="flex flex-wrap items-center gap-2">
                                    <Badge variant="secondary" className="bg-white/80 text-slate-700 shadow-sm dark:bg-slate-900/70 dark:text-slate-200">
                                        <Globe className="mr-1.5 h-3.5 w-3.5" /> Spatial Pulse
                                    </Badge>
                                    <Badge variant="outline" className="border-dashed border-slate-400/80 text-slate-500 dark:border-slate-700 dark:text-slate-300">
                                        {from || 'Start'} → {to || 'End'}
                                    </Badge>
                                </div>
                                <div className="relative h-[260px] w-full rounded-2xl bg-gradient-to-br from-blue-200/60 via-emerald-200/40 to-amber-100/70 dark:from-slate-800 dark:via-slate-800/60 dark:to-slate-900">
                                    <div
                                        className="absolute inset-0 opacity-70"
                                        style={{
                                            background:
                                                'radial-gradient(circle at 20% 30%, rgba(59,130,246,0.35), transparent 45%), radial-gradient(circle at 80% 40%, rgba(16,185,129,0.3), transparent 48%), radial-gradient(circle at 50% 75%, rgba(251,191,36,0.35), transparent 50%)',
                                        }}
                                    />
                                    {mapHotspots.map((spot) => (
                                        <div
                                            key={spot.region}
                                            className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1"
                                            style={{ top: spot.position.top, left: spot.position.left }}
                                        >
                                            <span className="rounded-full bg-white/90 px-2.5 py-1 text-xs font-semibold text-slate-800 shadow dark:bg-slate-900/90 dark:text-slate-200">
                                                {spot.region}
                                            </span>
                                            <div className="h-16 w-16 rounded-full bg-gradient-to-br from-rose-500/70 via-orange-400/60 to-yellow-300/70 blur-lg" />
                                            <span className="text-[11px] font-medium uppercase tracking-wide text-slate-600 dark:text-slate-400">
                                                {formatCurrency(spot.revenue)}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                                <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                                    <span className="inline-flex items-center gap-2">
                                        <span className="h-2.5 w-8 rounded-full bg-blue-500/70" /> Cool
                                    </span>
                                    <span className="inline-flex items-center gap-2">
                                        <span className="h-2.5 w-8 rounded-full bg-emerald-500/70" /> Warm
                                    </span>
                                    <span className="inline-flex items-center gap-2">
                                        <span className="h-2.5 w-8 rounded-full bg-orange-500/80" /> Hot
                                    </span>
                                    <span className="inline-flex items-center gap-2">
                                        <span className="h-2.5 w-8 rounded-full bg-rose-500/90" /> Blazing
                                    </span>
                                </div>
                            </div>
                        </div>
                    </ReportSectionCard>

                    <ReportSectionCard
                        title="Momentum watchlist"
                        description="Regions with the sharpest month-over-month movement."
                        contentClassName="flex flex-col gap-4 p-6"
                    >
                        {momentum.length > 0 ? (
                            momentum.map((item) => (
                                <div
                                    key={item.region}
                                    className="rounded-xl border border-slate-200/70 bg-white/90 p-4 shadow-sm dark:border-slate-800/60 dark:bg-slate-950/60"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
                                                <MapIcon className="h-5 w-5 text-slate-600 dark:text-slate-200" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{item.region}</p>
                                                <p className="text-xs text-muted-foreground">Latest revenue · {formatCurrency(item.latest)}</p>
                                            </div>
                                        </div>
                                        <Badge
                                            variant={item.change !== null && item.change >= 0 ? 'secondary' : 'outline'}
                                            className={
                                                item.change !== null && item.change >= 0
                                                    ? 'bg-emerald-500/15 text-emerald-600'
                                                    : 'border-rose-500/40 text-rose-500'
                                            }
                                        >
                                            {item.change === null ? 'Stable' : `${item.change >= 0 ? '+' : ''}${item.change.toFixed(1)}%`}
                                        </Badge>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-sm text-muted-foreground">No regional trend data captured for this window.</p>
                        )}
                        <p className="text-xs text-muted-foreground">
                            Trends compare the first and last data point in each regional series for the applied range.
                        </p>
                    </ReportSectionCard>
                </div>

                <ReportSectionCard
                    title="Geographic detail"
                    description="Drill into every layer of the network, from macro to micro."
                    badgeItems={detailBadges}
                    contentClassName="p-0"
                >
                    <Tabs defaultValue="regions" className="w-full">
                        <TabsList className="flex w-full flex-wrap justify-start gap-2 border-b border-slate-200/60 bg-transparent px-4 py-3 dark:border-slate-800/60">
                            {tables.map((table) => (
                                <TabsTrigger
                                    key={table.id}
                                    value={table.id}
                                    className="rounded-full bg-slate-100 px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-slate-600 data-[state=active]:bg-slate-900 data-[state=active]:text-white dark:bg-slate-800/70 dark:text-slate-300 dark:data-[state=active]:bg-slate-50 dark:data-[state=active]:text-slate-900"
                                >
                                    {table.title}
                                </TabsTrigger>
                            ))}
                        </TabsList>
                        {tables.map((table) => (
                            <TabsContent key={table.id} value={table.id} className="p-4">
                                <p className="mb-4 text-xs uppercase tracking-wide text-muted-foreground">{table.subtitle}</p>
                                <div className="overflow-hidden rounded-2xl border border-slate-200/70 dark:border-slate-800/60">
                                    <div className="max-h-[420px] overflow-auto">
                                        <Table>
                                            <TableHeader className="bg-slate-50/70 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-900/60 dark:text-slate-400">
                                                <TableRow>
                                                    <TableHead className="whitespace-nowrap">Name</TableHead>
                                                    <TableHead className="whitespace-nowrap text-right">Trips</TableHead>
                                                    <TableHead className="whitespace-nowrap text-right">Tonnage (MT)</TableHead>
                                                    <TableHead className="whitespace-nowrap text-right">Revenue</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {table.rows.length > 0 ? (
                                                    table.rows.map((row) => (
                                                        <TableRow key={`${table.id}-${row.name}`} className="hover:bg-slate-50/70 dark:hover:bg-slate-900/50">
                                                            <TableCell className="font-medium text-slate-900 dark:text-slate-100">{row.name}</TableCell>
                                                            <TableCell className="text-right text-slate-600 dark:text-slate-300">{formatNumber(row.trips)}</TableCell>
                                                            <TableCell className="text-right text-slate-600 dark:text-slate-300">{formatDecimal(row.tonnage)}</TableCell>
                                                            <TableCell className="text-right font-medium text-slate-900 dark:text-slate-100">{formatCurrency(row.revenue)}</TableCell>
                                                        </TableRow>
                                                    ))
                                                ) : (
                                                    <TableRow>
                                                        <TableCell colSpan={4} className="py-10 text-center text-muted-foreground">
                                                            No data available for this level.
                                                        </TableCell>
                                                    </TableRow>
                                                )}
                                            </TableBody>
                                        </Table>
                                    </div>
                                </div>
                            </TabsContent>
                        ))}
                    </Tabs>
                </ReportSectionCard>
            </ReportPageShell>
        </AppLayout>
    );
}








