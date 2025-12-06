import { useMemo, useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { ReportHero } from '@/components/reports/report-hero';
import { ReportPageShell } from '@/components/reports/report-page-shell';
import { ReportSectionCard } from '@/components/reports/report-section-card';
import { ReportSummaryGrid } from '@/components/reports/report-summary-grid';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CircleDollarSign, Droplet, Filter, Gauge, TrendingDown, TrendingUp } from 'lucide-react';

interface TruckOption {
    id: number;
    plate: string;
    status?: string | null;
}

interface FuelEfficiencyFilters {
    from: string;
    to: string;
    truck_ids?: number[];
}

interface FuelEfficiencyTotals {
    total_liters: number;
    total_cost: number;
    total_distance_km: number;
    refuel_events: number;
    truck_count: number;
}

interface FuelEfficiencySummary {
    fleet_efficiency_km_per_liter: number | null;
    fleet_cost_per_km: number | null;
    average_cost_per_liter: number | null;
    average_liters_per_event: number | null;
    average_cost_per_event: number | null;
    average_distance_per_event: number | null;
}

interface FuelEfficiencyBreakdownRow {
    truck_id: number;
    plate: string;
    status?: string | null;
    refuel_events: number;
    total_liters: number;
    total_cost: number;
    distance_km: number | null;
    efficiency_km_per_liter: number | null;
    cost_per_km: number | null;
    cost_per_liter: number | null;
    avg_liters_per_event: number | null;
    avg_cost_per_event: number | null;
    first_fill_on: string | null;
    last_fill_on: string | null;
    has_distance: boolean;
}

interface FuelEfficiencyTrendRow {
    period: string;
    total_liters: number;
    total_cost: number;
    average_price_per_liter: number | null;
    refuel_events: number;
    average_liters_per_event: number | null;
}

interface FuelEfficiencyHighlights {
    best_efficiency: FuelEfficiencyBreakdownRow[];
    highest_cost_per_km: FuelEfficiencyBreakdownRow[];
}

interface FuelEfficiencyProps {
    filters: FuelEfficiencyFilters;
    totals: FuelEfficiencyTotals;
    summary: FuelEfficiencySummary;
    breakdown: FuelEfficiencyBreakdownRow[];
    trend: FuelEfficiencyTrendRow[];
    highlights: FuelEfficiencyHighlights;
    trucks: TruckOption[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Reports', href: '/reports/fuel-efficiency' },
    { title: 'Fuel Efficiency & Cost', href: '/reports/fuel-efficiency' },
];

const formatNumber = (value: number) => value.toLocaleString();

const formatDecimal = (value: number) =>
    value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const formatCurrency = (value: number) =>
    new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
    }).format(value);

const formatOptionalDecimal = (value: number | null, unit?: string) =>
    value === null ? '—' : `${formatDecimal(value)}${unit ?? ''}`;

const formatOptionalCurrency = (value: number | null, suffix?: string) =>
    value === null ? '—' : `${formatCurrency(value)}${suffix ?? ''}`;

export default function FuelEfficiency({
    filters,
    totals,
    summary,
    breakdown = [],
    trend = [],
    highlights,
    trucks = [],
}: FuelEfficiencyProps) {
    const highlightData = highlights ?? { best_efficiency: [], highest_cost_per_km: [] };

    const [from, setFrom] = useState(filters?.from ?? '');
    const [to, setTo] = useState(filters?.to ?? '');
    const [selectedTrucks, setSelectedTrucks] = useState<number[]>(filters?.truck_ids ?? []);
    const [truckSearch, setTruckSearch] = useState('');
    const [truckSelectorOpen, setTruckSelectorOpen] = useState(false);

    const noTruckFilter = selectedTrucks.length === 0;

    const selectedTruckPlates = useMemo(
        () => trucks.filter((truck) => selectedTrucks.includes(truck.id)).map((truck) => truck.plate),
        [trucks, selectedTrucks],
    );

    const filteredTruckOptions = useMemo(() => {
        if (!truckSearch.trim()) {
            return trucks;
        }

        const query = truckSearch.trim().toLowerCase();
        return trucks.filter((truck) => truck.plate.toLowerCase().includes(query));
    }, [truckSearch, trucks]);

    const handleToggleTruck = (id: number) => {
        setSelectedTrucks((current) =>
            current.includes(id) ? current.filter((truckId) => truckId !== id) : [...current, id],
        );
    };

    const handleSelectAll = () => {
        if (selectedTrucks.length === trucks.length && trucks.length > 0) {
            setSelectedTrucks([]);
            return;
        }

        setSelectedTrucks(trucks.map((truck) => truck.id));
    };

    const handleClearTrucks = () => setSelectedTrucks([]);

    const handleApplyFilters = () => {
        setTruckSelectorOpen(false);

        const params: Record<string, string | number | Array<string | number>> = {};

        if (from) {
            params.from = from;
        }

        if (to) {
            params.to = to;
        }

        if (selectedTrucks.length > 0) {
            params.truck_ids = selectedTrucks;
        }

        router.get('/reports/fuel-efficiency', params, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleReset = () => {
        setFrom(filters?.from ?? '');
        setTo(filters?.to ?? '');
        setSelectedTrucks(filters?.truck_ids ?? []);
        setTruckSearch('');
        setTruckSelectorOpen(false);

        router.get('/reports/fuel-efficiency', {}, { preserveState: false, preserveScroll: true });
    };

    const summaryItems = [
        {
            key: 'total-cost',
            label: 'Total cost',
            value: formatCurrency(totals?.total_cost ?? 0),
            helper: 'Fuel spend in the selected window',
            icon: <CircleDollarSign className="h-3.5 w-3.5" />,
            iconWrapperClassName: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-200',
        },
        {
            key: 'total-liters',
            label: 'Total liters',
            value: `${formatDecimal(totals?.total_liters ?? 0)} L`,
            helper: 'Liters purchased across all included trucks',
            icon: <Droplet className="h-3.5 w-3.5" />,
            iconWrapperClassName: 'bg-blue-50 text-blue-600 dark:bg-blue-500/20 dark:text-blue-200',
        },
        {
            key: 'total-distance',
            label: 'Total distance',
            value: `${formatDecimal(totals?.total_distance_km ?? 0)} km`,
            helper: 'Distance estimated from odometer readings',
            icon: <Gauge className="h-3.5 w-3.5" />,
            iconWrapperClassName: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-200',
        },
        {
            key: 'fleet-efficiency',
            label: 'Fleet km / L',
            value:
                summary?.fleet_efficiency_km_per_liter !== null
                    ? `${formatDecimal(summary.fleet_efficiency_km_per_liter)} km / L`
                    : '—',
            helper: 'Distance achieved per litre across the selection',
            icon: <TrendingUp className="h-3.5 w-3.5" />,
            iconWrapperClassName: 'bg-amber-50 text-amber-600 dark:bg-amber-500/20 dark:text-amber-200',
        },
        {
            key: 'cost-per-km',
            label: 'Cost / km',
            value:
                summary?.fleet_cost_per_km !== null
                    ? `${formatCurrency(summary.fleet_cost_per_km)} / km`
                    : '—',
            helper: 'Average fuel spend needed to cover one kilometre',
            icon: <TrendingDown className="h-3.5 w-3.5" />,
            iconWrapperClassName: 'bg-rose-50 text-rose-600 dark:bg-rose-500/20 dark:text-rose-200',
        },
    ];

    const appliedFrom = filters?.from ?? '';
    const appliedTo = filters?.to ?? '';
    const appliedTruckCount = filters?.truck_ids?.length ?? 0;

    const visibleTruckBadges = selectedTruckPlates.slice(0, 4);
    const extraTruckCount = Math.max(selectedTruckPlates.length - visibleTruckBadges.length, 0);

    const detailBadgeItems = [
        { key: 'from', label: `From ${appliedFrom || '—'}` },
        { key: 'to', label: `To ${appliedTo || '—'}` },
        {
            key: 'trucks',
            label:
                appliedTruckCount > 0
                    ? `${appliedTruckCount} truck${appliedTruckCount > 1 ? 's' : ''}`
                    : 'All trucks',
        },
    ];

    const highlightBadgeItems = [
        {
            key: 'best-count',
            label: `${highlightData.best_efficiency.length} best performers`,
        },
        {
            key: 'costly-count',
            label: `${highlightData.highest_cost_per_km.length} costly outliers`,
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Fuel Efficiency & Cost" />
            <ReportPageShell>
                <ReportHero
                    eyebrow="Fuel Lens"
                    title="Fuel efficiency & cost"
                    description="Benchmark trucks by consumption, spend, and distance covered. Combine refuelling data with odometer readings to surface outliers and opportunities to optimise routes or driver habits."
                    actions={
                        <>
                            <Button type="button" variant="outline" className="gap-2" onClick={handleReset}>
                                Reset
                            </Button>
                            <Button type="button" className="gap-2" onClick={handleApplyFilters}>
                                Generate report
                            </Button>
                        </>
                    }
                />

                <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
                    <ReportSectionCard
                        title="Filters"
                        description="Refine by date and fleet subset."
                        contentClassName="flex flex-col gap-6 p-6"
                    >
                        <div className="space-y-2">
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Date range</span>
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                <Input type="date" value={from} onChange={(event) => setFrom(event.target.value)} />
                                <Input type="date" value={to} onChange={(event) => setTo(event.target.value)} />
                            </div>
                        </div>
                        <div className="space-y-3">
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Trucks</span>
                            <Popover open={truckSelectorOpen} onOpenChange={setTruckSelectorOpen}>
                                <PopoverTrigger asChild>
                                    <Button type="button" variant="outline" className="w-full justify-between">
                                        <span className="flex items-center gap-2 text-sm">
                                            {noTruckFilter ? 'All trucks' : `${selectedTrucks.length} selected`}
                                        </span>
                                        <Filter className="h-3.5 w-3.5 text-slate-400" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-96 p-0" align="start">
                                    <div className="flex items-center justify-between px-3 py-2">
                                        <div className="flex items-center gap-2">
                                            <Button type="button" variant="ghost" size="sm" onClick={handleSelectAll}>
                                                {selectedTrucks.length === trucks.length && trucks.length > 0 ? 'Unselect all' : 'Select all'}
                                            </Button>
                                            <Button type="button" variant="ghost" size="sm" onClick={handleClearTrucks}>
                                                Clear
                                            </Button>
                                        </div>
                                    </div>
                                    <Separator />
                                    <Command>
                                        <div className="flex items-center px-3 py-2">
                                            <CommandInput
                                                placeholder="Search truck plate..."
                                                value={truckSearch}
                                                onValueChange={setTruckSearch}
                                            />
                                        </div>
                                        <CommandList className="max-h-64">
                                            <CommandEmpty>No trucks found.</CommandEmpty>
                                            <CommandGroup heading="Trucks">
                                                <CommandItem onSelect={() => setSelectedTrucks([])} className="flex items-center gap-2">
                                                    <Checkbox checked={noTruckFilter} />
                                                    <span className="font-medium">All trucks</span>
                                                    {noTruckFilter && <Badge variant="secondary" className="ml-auto">Active</Badge>}
                                                </CommandItem>
                                                {filteredTruckOptions.map((option) => {
                                                    const checked = selectedTrucks.includes(option.id);

                                                    return (
                                                        <CommandItem
                                                            key={option.id}
                                                            onSelect={() => handleToggleTruck(option.id)}
                                                            className="flex items-center gap-2"
                                                        >
                                                            <Checkbox checked={checked} />
                                                            <span className="font-medium">{option.plate}</span>
                                                            {option.status && (
                                                                <Badge variant="outline" className="ml-auto capitalize text-xs">
                                                                    {option.status}
                                                                </Badge>
                                                            )}
                                                            {checked && <Badge variant="secondary" className="ml-2">Included</Badge>}
                                                        </CommandItem>
                                                    );
                                                })}
                                            </CommandGroup>
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                            <div className="flex flex-wrap gap-2">
                                {noTruckFilter && (
                                    <Badge variant="outline" className="border-dashed text-muted-foreground">
                                        All trucks included
                                    </Badge>
                                )}
                                {!noTruckFilter &&
                                    visibleTruckBadges.map((plate) => (
                                        <Badge key={plate} variant="secondary" className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-100">
                                            {plate}
                                        </Badge>
                                    ))}
                                {!noTruckFilter && extraTruckCount > 0 && (
                                    <Badge variant="outline" className="border-dashed text-muted-foreground">
                                        +{extraTruckCount} more
                                    </Badge>
                                )}
                            </div>
                        </div>
                        <div className="flex flex-col gap-3 border-t border-slate-200/60 pt-6 sm:flex-row sm:justify-between dark:border-slate-700/60">
                            <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={handleReset}>
                                Reset
                            </Button>
                            <Button type="button" className="w-full sm:w-auto" onClick={handleApplyFilters}>
                                Apply filters
                            </Button>
                        </div>
                    </ReportSectionCard>

                    <ReportSectionCard
                        title="Fleet snapshot"
                        description="Key fuel metrics across all included trucks."
                        contentClassName="p-6"
                    >
                        <ReportSummaryGrid items={summaryItems} className="gap-4 md:grid-cols-2 xl:grid-cols-5" />
                    </ReportSectionCard>
                </div>

                <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
                    <ReportSectionCard
                        title="Per-truck efficiency"
                        description="Detailed consumption, spend, and efficiency by truck."
                        badgeItems={detailBadgeItems}
                        contentClassName="p-0"
                    >
                        <div className="overflow-x-auto">
                            <Table>
                                        <TableHeader className="bg-slate-50/60 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-900/60 dark:text-slate-400">
                                            <TableRow className="divide-x divide-slate-200/40 dark:divide-slate-800/50">
                                                <TableHead className="whitespace-nowrap">Truck</TableHead>
                                                <TableHead className="whitespace-nowrap">Status</TableHead>
                                                <TableHead className="whitespace-nowrap text-right">Refuels</TableHead>
                                                <TableHead className="whitespace-nowrap text-right">Liters</TableHead>
                                                <TableHead className="whitespace-nowrap text-right">Total Cost</TableHead>
                                                <TableHead className="whitespace-nowrap text-right">Distance (km)</TableHead>
                                                <TableHead className="whitespace-nowrap text-right">Km / L</TableHead>
                                                <TableHead className="whitespace-nowrap text-right">Cost / Km</TableHead>
                                                <TableHead className="whitespace-nowrap text-right">Cost / L</TableHead>
                                                <TableHead className="whitespace-nowrap text-right">Avg L / Refuel</TableHead>
                                                <TableHead className="whitespace-nowrap text-right">Avg Cost / Refuel</TableHead>
                                                <TableHead className="whitespace-nowrap text-right">Last Refuel</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {breakdown.length === 0 && (
                                                <TableRow>
                                                    <TableCell colSpan={12} className="py-6 text-center text-sm text-muted-foreground">
                                                        No data available for the selected filters.
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                            {breakdown.map((row) => (
                                                <TableRow key={row.truck_id} className="divide-x divide-slate-100/60 dark:divide-slate-800/60">
                                                    <TableCell className="whitespace-nowrap font-medium text-slate-900 dark:text-slate-50">
                                                        {row.plate}
                                                    </TableCell>
                                                    <TableCell className="whitespace-nowrap capitalize text-slate-600 dark:text-slate-300">
                                                        {row.status ?? '—'}
                                                    </TableCell>
                                                    <TableCell className="whitespace-nowrap text-right">{formatNumber(row.refuel_events)}</TableCell>
                                                    <TableCell className="whitespace-nowrap text-right">{formatDecimal(row.total_liters)}</TableCell>
                                                    <TableCell className="whitespace-nowrap text-right">{formatCurrency(row.total_cost)}</TableCell>
                                                    <TableCell className="whitespace-nowrap text-right">{formatOptionalDecimal(row.distance_km, ' km')}</TableCell>
                                                    <TableCell className="whitespace-nowrap text-right">{formatOptionalDecimal(row.efficiency_km_per_liter, ' km/L')}</TableCell>
                                                    <TableCell className="whitespace-nowrap text-right">{formatOptionalCurrency(row.cost_per_km, ' / km')}</TableCell>
                                                    <TableCell className="whitespace-nowrap text-right">{formatOptionalCurrency(row.cost_per_liter, ' / L')}</TableCell>
                                                    <TableCell className="whitespace-nowrap text-right">{formatOptionalDecimal(row.avg_liters_per_event, ' L')}</TableCell>
                                                    <TableCell className="whitespace-nowrap text-right">{formatOptionalCurrency(row.avg_cost_per_event)}</TableCell>
                                                    <TableCell className="whitespace-nowrap text-right">{row.last_fill_on ?? '—'}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                        {breakdown.length > 0 && (
                                            <TableFooter>
                                                <TableRow className="divide-x divide-slate-200/40 bg-slate-50/70 font-semibold dark:divide-slate-800/60 dark:bg-slate-900/70">
                                                    <TableCell colSpan={2}>
                                                        Totals ({formatNumber(totals?.truck_count ?? 0)} trucks)
                                                    </TableCell>
                                                    <TableCell className="text-right">{formatNumber(totals?.refuel_events ?? 0)}</TableCell>
                                                    <TableCell className="text-right">{formatDecimal(totals?.total_liters ?? 0)}</TableCell>
                                                    <TableCell className="text-right">{formatCurrency(totals?.total_cost ?? 0)}</TableCell>
                                                    <TableCell className="text-right">{formatDecimal(totals?.total_distance_km ?? 0)} km</TableCell>
                                                    <TableCell className="text-right">{formatOptionalDecimal(summary?.fleet_efficiency_km_per_liter, ' km/L')}</TableCell>
                                                    <TableCell className="text-right">{formatOptionalCurrency(summary?.fleet_cost_per_km, ' / km')}</TableCell>
                                                    <TableCell className="text-right">{formatOptionalCurrency(summary?.average_cost_per_liter, ' / L')}</TableCell>
                                                    <TableCell className="text-right">{formatOptionalDecimal(summary?.average_liters_per_event, ' L')}</TableCell>
                                                    <TableCell className="text-right">{formatOptionalCurrency(summary?.average_cost_per_event)}</TableCell>
                                                    <TableCell className="text-right">{formatOptionalDecimal(summary?.average_distance_per_event, ' km')}</TableCell>
                                                </TableRow>
                                            </TableFooter>
                                        )}
                            </Table>
                        </div>
                    </ReportSectionCard>

                    <div className="grid gap-6">
                        <ReportSectionCard
                            title="Highlights"
                            description="Top performers and cost hotspots."
                            badgeItems={highlightBadgeItems}
                            contentClassName="grid gap-6 p-6 md:grid-cols-2"
                        >
                            <div className="space-y-3">
                                <div className="text-sm font-semibold text-slate-700 dark:text-slate-200">Best efficiency</div>
                                {highlightData.best_efficiency.length === 0 && (
                                    <p className="text-sm text-muted-foreground">No efficiency winners yet.</p>
                                )}
                                {highlightData.best_efficiency.length > 0 && (
                                    <ol className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
                                        {highlightData.best_efficiency.map((row, index) => (
                                            <li
                                                key={row.truck_id}
                                                className="flex items-center justify-between rounded-lg border border-slate-200/70 bg-slate-50/60 px-3 py-2 dark:border-slate-800/60 dark:bg-slate-900/60"
                                            >
                                                <span className="font-medium text-slate-900 dark:text-slate-50">
                                                    {index + 1}. {row.plate}
                                                </span>
                                                <span>{formatOptionalDecimal(row.efficiency_km_per_liter, ' km/L')}</span>
                                            </li>
                                        ))}
                                    </ol>
                                )}
                            </div>
                            <div className="space-y-3">
                                <div className="text-sm font-semibold text-slate-700 dark:text-slate-200">Highest cost per km</div>
                                {highlightData.highest_cost_per_km.length === 0 && (
                                    <p className="text-sm text-muted-foreground">No costly outliers detected.</p>
                                )}
                                {highlightData.highest_cost_per_km.length > 0 && (
                                    <ol className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
                                        {highlightData.highest_cost_per_km.map((row, index) => (
                                            <li
                                                key={row.truck_id}
                                                className="flex items-center justify-between rounded-lg border border-slate-200/70 bg-rose-50/60 px-3 py-2 dark:border-rose-900/40 dark:bg-rose-950/30"
                                            >
                                                <span className="font-medium text-slate-900 dark:text-slate-50">
                                                    {index + 1}. {row.plate}
                                                </span>
                                                <span>{formatOptionalCurrency(row.cost_per_km, ' / km')}</span>
                                            </li>
                                        ))}
                                    </ol>
                                )}
                            </div>
                        </ReportSectionCard>

                        <ReportSectionCard
                            title="Refuel trend"
                            description="Month-over-month litres and cost."
                            contentClassName="p-0"
                        >
                            <div className="max-h-[320px] overflow-auto">
                                <Table>
                                    <div className="space-y-3">
                                            <TableHeader className="bg-slate-50/60 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-900/60 dark:text-slate-400">
                                                <TableRow>
                                                    <TableHead>Period</TableHead>
                                                    <TableHead className="text-right">Refuels</TableHead>
                                                    <TableHead className="text-right">Liters</TableHead>
                                                    <TableHead className="text-right">Liters / Refuel</TableHead>
                                                    <TableHead className="text-right">Total Cost</TableHead>
                                                    <TableHead className="text-right">Avg Price / L</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {trend.length === 0 && (
                                                    <TableRow>
                                                        <TableCell colSpan={6} className="py-6 text-center text-sm text-muted-foreground">
                                                            No trend data available for the selected filters.
                                                        </TableCell>
                                                    </TableRow>
                                                )}
                                                {trend.map((row) => (
                                                    <TableRow key={row.period}>
                                                        <TableCell>{row.period}</TableCell>
                                                        <TableCell className="text-right">{formatNumber(row.refuel_events)}</TableCell>
                                                        <TableCell className="text-right">{formatDecimal(row.total_liters)}</TableCell>
                                                        <TableCell className="text-right">{formatOptionalDecimal(row.average_liters_per_event, ' L')}</TableCell>
                                                        <TableCell className="text-right">{formatCurrency(row.total_cost)}</TableCell>
                                                        <TableCell className="text-right">{formatOptionalCurrency(row.average_price_per_liter, ' / L')}</TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                    </div>
                                </Table>
                            </div>
                        </ReportSectionCard>
                    </div>
                </div>
            </ReportPageShell>
        </AppLayout>
    );
}


