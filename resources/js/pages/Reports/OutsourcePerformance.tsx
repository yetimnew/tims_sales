import { useMemo, useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    ArrowDownRight,
    ArrowUpRight,
    Building2,
    CircleDollarSign,
    Filter,
    TrendingDown,
    TrendingUp,
} from 'lucide-react';

interface OutsourceOption {
    id: number;
    name: string;
    status?: string | null;
}

interface OutsourcePerformanceFilters {
    from: string;
    to: string;
    outsource_ids?: number[];
    statuses?: string[];
}

interface OutsourcePerformanceTotals {
    trips: number;
    completed_trips: number;
    vendor_count: number;
    distance_km: number;
    cost: number;
    tonkm: number;
    cost_per_km: number | null;
    average_completion_rate_pct: number | null;
}

interface OutsourcePerformanceSummary {
    outsourced_cost_per_km: number | null;
    internal_cost_per_km: number | null;
    cost_delta_per_km: number | null;
    projected_cost_delta: number | null;
    average_cost_per_trip: number | null;
    average_distance_per_trip: number | null;
    average_completion_rate_pct: number | null;
    total_outsourced_cost: number;
}

interface OutsourcePerformanceBreakdownRow {
    outsource_id: number;
    name: string;
    status?: string | null;
    trips: number;
    completed_trips: number;
    completion_rate_pct: number | null;
    total_distance_km: number;
    total_cost: number;
    total_tonkm: number;
    cost_per_km: number | null;
    cost_per_tonkm: number | null;
    cost_delta_per_km: number | null;
    total_cost_delta: number | null;
    average_cost_per_trip: number | null;
    average_distance_per_trip: number | null;
}

interface OutsourcePerformanceTrendRow {
    period: string;
    trips: number;
    total_distance_km: number;
    total_cost: number;
    total_tonkm: number;
    cost_per_km: number | null;
    cost_per_tonkm: number | null;
    completion_rate_pct: number | null;
}

interface OutsourcePerformanceHighlights {
    highest_cost_per_km: OutsourcePerformanceBreakdownRow[];
    best_completion_rate: OutsourcePerformanceBreakdownRow[];
    largest_spend: OutsourcePerformanceBreakdownRow[];
}

interface OutsourcePerformanceBaseline {
    trip_count: number;
    distance_km: number;
    cost: number;
    cost_per_km: number | null;
}

interface OutsourcePerformanceOptions {
    vendors: OutsourceOption[];
    statuses: string[];
}

interface OutsourcePerformanceProps {
    filters: OutsourcePerformanceFilters;
    options: OutsourcePerformanceOptions;
    baseline: OutsourcePerformanceBaseline;
    totals: OutsourcePerformanceTotals;
    summary: OutsourcePerformanceSummary;
    breakdown: OutsourcePerformanceBreakdownRow[];
    trend: OutsourcePerformanceTrendRow[];
    highlights: OutsourcePerformanceHighlights;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Reports', href: '/reports/outsource-performance' },
    { title: 'Outsource Performance', href: '/reports/outsource-performance' },
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

const formatOptionalDecimal = (value: number | null, suffix?: string) =>
    value === null ? '—' : `${formatDecimal(value)}${suffix ?? ''}`;

const formatOptionalCurrency = (value: number | null, suffix?: string) =>
    value === null ? '—' : `${formatCurrency(value)}${suffix ?? ''}`;

const formatOptionalPercent = (value: number | null) =>
    value === null ? '—' : `${formatDecimal(value)}%`;

export default function OutsourcePerformance({
    filters,
    options,
    baseline,
    totals,
    summary,
    breakdown = [],
    trend = [],
    highlights,
}: OutsourcePerformanceProps) {
    const [from, setFrom] = useState(filters?.from ?? '');
    const [to, setTo] = useState(filters?.to ?? '');
    const [selectedVendors, setSelectedVendors] = useState<number[]>(filters?.outsource_ids ?? []);
    const [selectedStatuses, setSelectedStatuses] = useState<string[]>(filters?.statuses ?? []);
    const [vendorSearch, setVendorSearch] = useState('');
    const [vendorSelectorOpen, setVendorSelectorOpen] = useState(false);
    const [statusSelectorOpen, setStatusSelectorOpen] = useState(false);

    const allVendorsIncluded = selectedVendors.length === 0;
    const allStatusesIncluded = selectedStatuses.length === 0;

    const selectedVendorNames = useMemo(
        () => options.vendors.filter((vendor) => selectedVendors.includes(vendor.id)).map((vendor) => vendor.name),
        [options.vendors, selectedVendors],
    );

    const filteredVendorOptions = useMemo(() => {
        if (!vendorSearch.trim()) {
            return options.vendors;
        }

        const query = vendorSearch.trim().toLowerCase();
        return options.vendors.filter((vendor) => vendor.name.toLowerCase().includes(query));
    }, [vendorSearch, options.vendors]);

    const handleToggleVendor = (id: number) => {
        setSelectedVendors((current) =>
            current.includes(id) ? current.filter((vendorId) => vendorId !== id) : [...current, id],
        );
    };

    const handleToggleStatus = (status: string) => {
        setSelectedStatuses((current) =>
            current.includes(status)
                ? current.filter((currentStatus) => currentStatus !== status)
                : [...current, status],
        );
    };

    const handleSelectAllVendors = () => {
        if (selectedVendors.length === options.vendors.length && options.vendors.length > 0) {
            setSelectedVendors([]);
            return;
        }

        setSelectedVendors(options.vendors.map((vendor) => vendor.id));
    };

    const handleClearVendors = () => setSelectedVendors([]);
    const handleClearStatuses = () => setSelectedStatuses([]);

    const handleApplyFilters = () => {
        setVendorSelectorOpen(false);
        setStatusSelectorOpen(false);

        const params: Record<string, string | number | Array<string | number>> = {};

        if (from) {
            params.from = from;
        }

        if (to) {
            params.to = to;
        }

        if (selectedVendors.length > 0) {
            params.outsource_ids = selectedVendors;
        }

        if (selectedStatuses.length > 0) {
            params.statuses = selectedStatuses;
        }

        router.get('/reports/outsource-performance', params, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleReset = () => {
        setFrom(filters?.from ?? '');
        setTo(filters?.to ?? '');
        setSelectedVendors(filters?.outsource_ids ?? []);
        setSelectedStatuses(filters?.statuses ?? []);
        setVendorSearch('');
        setVendorSelectorOpen(false);
        setStatusSelectorOpen(false);

        router.get('/reports/outsource-performance', {}, { preserveState: false, preserveScroll: true });
    };

    const visibleVendorBadges = selectedVendorNames.slice(0, 4);
    const extraVendorCount = Math.max(selectedVendorNames.length - visibleVendorBadges.length, 0);

    const summaryCards = [
        {
            title: 'External Spend',
            value: formatCurrency(summary?.total_outsourced_cost ?? 0),
            helper: 'Total amount paid to outsource partners',
            icon: <CircleDollarSign className="h-4 w-4 text-emerald-500" />,
        },
        {
            title: 'Cost / Km',
            value: formatOptionalCurrency(summary?.outsourced_cost_per_km, ' / km'),
            helper: 'Average outsource cost for one kilometre',
            icon: <TrendingUp className="h-4 w-4 text-indigo-500" />,
        },
        {
            title: 'Δ vs Internal',
            value: formatOptionalCurrency(summary?.cost_delta_per_km, ' / km'),
            helper: 'Difference to internal fleet baseline',
            icon: <ArrowUpRight className="h-4 w-4 text-rose-500" />,
        },
        {
            title: 'Completion Rate',
            value: formatOptionalPercent(summary?.average_completion_rate_pct ?? totals?.average_completion_rate_pct ?? null),
            helper: 'Finished outsource trips vs dispatched',
            icon: <Building2 className="h-4 w-4 text-amber-500" />,
        },
        {
            title: 'Avg Cost / Trip',
            value: formatOptionalCurrency(summary?.average_cost_per_trip, ''),
            helper: 'Spend per completed outsource journey',
            icon: <TrendingDown className="h-4 w-4 text-sky-500" />,
        },
    ];

    const highlightData = highlights ?? {
        highest_cost_per_km: [],
        best_completion_rate: [],
        largest_spend: [],
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Outsource Performance" />
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-slate-100/60 dark:bg-slate-900/40">
                <div className="flex flex-1 flex-col gap-6 overflow-y-auto p-4 pb-10 sm:p-6 lg:p-10">
                    <header className="rounded-2xl border border-slate-200 bg-white/95 px-6 py-6 shadow-sm backdrop-blur dark:border-slate-800/70 dark:bg-slate-900/70">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                            <div className="space-y-2">
                                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500 dark:text-slate-400">Vendor Lens</p>
                                <h1 className="text-3xl font-semibold text-slate-900 dark:text-slate-50">Outsource Vendor Performance</h1>
                                <p className="max-w-3xl text-sm text-slate-600 dark:text-slate-300">
                                    Compare third-party hauliers against your internal fleet baseline. Monitor cost per kilometre, delivery completion, and spending concentration to negotiate better contracts or rebalance workloads.
                                </p>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                                <Button type="button" variant="outline" className="gap-2" onClick={handleReset}>
                                    Reset
                                </Button>
                                <Button type="button" className="gap-2" onClick={handleApplyFilters}>
                                    Generate report
                                </Button>
                            </div>
                        </div>
                    </header>

                    <section className="grid gap-6 lg:grid-cols-[360px_1fr]">
                        <Card className="flex h-full flex-col border border-slate-200 bg-white/95 shadow-sm dark:border-slate-800/70 dark:bg-slate-900/70">
                            <CardHeader className="space-y-2">
                                <CardTitle className="text-lg font-semibold text-slate-900 dark:text-slate-50">Filters</CardTitle>
                                <CardDescription className="text-sm">Limit to specific vendors or statuses to focus the comparison.</CardDescription>
                            </CardHeader>
                            <CardContent className="flex-1 space-y-6">
                                <div className="space-y-2">
                                    <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Date range</span>
                                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                        <Input type="date" value={from} onChange={(event) => setFrom(event.target.value)} />
                                        <Input type="date" value={to} onChange={(event) => setTo(event.target.value)} />
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Vendors</span>
                                    <Popover open={vendorSelectorOpen} onOpenChange={setVendorSelectorOpen}>
                                        <PopoverTrigger asChild>
                                            <Button type="button" variant="outline" className="w-full justify-between">
                                                <span className="flex items-center gap-2 text-sm">
                                                    {allVendorsIncluded ? 'All vendors' : `${selectedVendors.length} selected`}
                                                </span>
                                                <Filter className="h-3.5 w-3.5 text-slate-400" />
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-96 p-0" align="start">
                                            <div className="flex items-center justify-between px-3 py-2">
                                                <div className="flex items-center gap-2">
                                                    <Button type="button" variant="ghost" size="sm" onClick={handleSelectAllVendors}>
                                                        {selectedVendors.length === options.vendors.length && options.vendors.length > 0 ? 'Unselect all' : 'Select all'}
                                                    </Button>
                                                    <Button type="button" variant="ghost" size="sm" onClick={handleClearVendors}>
                                                        Clear
                                                    </Button>
                                                </div>
                                            </div>
                                            <Separator />
                                            <Command>
                                                <div className="flex items-center px-3 py-2">
                                                    <CommandInput
                                                        placeholder="Search vendor..."
                                                        value={vendorSearch}
                                                        onValueChange={setVendorSearch}
                                                    />
                                                </div>
                                                <CommandList className="max-h-64">
                                                    <CommandEmpty>No vendors found.</CommandEmpty>
                                                    <CommandGroup heading="Vendors">
                                                        <CommandItem onSelect={() => setSelectedVendors([])} className="flex items-center gap-2">
                                                            <Checkbox checked={allVendorsIncluded} />
                                                            <span className="font-medium">All vendors</span>
                                                            {allVendorsIncluded && <Badge variant="secondary" className="ml-auto">Active</Badge>}
                                                        </CommandItem>
                                                        {filteredVendorOptions.map((vendor) => {
                                                            const checked = selectedVendors.includes(vendor.id);

                                                            return (
                                                                <CommandItem
                                                                    key={vendor.id}
                                                                    onSelect={() => handleToggleVendor(vendor.id)}
                                                                    className="flex items-center gap-2"
                                                                >
                                                                    <Checkbox checked={checked} />
                                                                    <span className="font-medium">{vendor.name}</span>
                                                                    {vendor.status && (
                                                                        <Badge variant="outline" className="ml-auto capitalize text-xs">
                                                                            {vendor.status}
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
                                        {allVendorsIncluded && (
                                            <Badge variant="outline" className="border-dashed text-muted-foreground">
                                                All vendors included
                                            </Badge>
                                        )}
                                        {!allVendorsIncluded && visibleVendorBadges.map((name) => (
                                            <Badge key={name} variant="secondary" className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-100">
                                                {name}
                                            </Badge>
                                        ))}
                                        {!allVendorsIncluded && extraVendorCount > 0 && (
                                            <Badge variant="outline" className="border-dashed text-muted-foreground">
                                                +{extraVendorCount} more
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Statuses</span>
                                    <Popover open={statusSelectorOpen} onOpenChange={setStatusSelectorOpen}>
                                        <PopoverTrigger asChild>
                                            <Button type="button" variant="outline" className="w-full justify-between">
                                                <span className="flex items-center gap-2 text-sm">
                                                    {allStatusesIncluded ? 'All statuses' : `${selectedStatuses.length} selected`}
                                                </span>
                                                <Filter className="h-3.5 w-3.5 text-slate-400" />
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-80 p-0" align="start">
                                            <div className="flex items-center justify-between px-3 py-2">
                                                <Button type="button" variant="ghost" size="sm" onClick={handleClearStatuses}>
                                                    Clear
                                                </Button>
                                            </div>
                                            <Separator />
                                            <Command>
                                                <CommandList className="max-h-48">
                                                    <CommandEmpty>No statuses found.</CommandEmpty>
                                                    <CommandGroup heading="Statuses">
                                                        <CommandItem onSelect={() => setSelectedStatuses([])} className="flex items-center gap-2">
                                                            <Checkbox checked={allStatusesIncluded} />
                                                            <span className="font-medium">All statuses</span>
                                                            {allStatusesIncluded && <Badge variant="secondary" className="ml-auto">Active</Badge>}
                                                        </CommandItem>
                                                        {options.statuses.map((status) => {
                                                            const checked = selectedStatuses.includes(status);

                                                            return (
                                                                <CommandItem
                                                                    key={status}
                                                                    onSelect={() => handleToggleStatus(status)}
                                                                    className="flex items-center gap-2 capitalize"
                                                                >
                                                                    <Checkbox checked={checked} />
                                                                    <span className="font-medium">{status}</span>
                                                                    {checked && <Badge variant="secondary" className="ml-auto">Included</Badge>}
                                                                </CommandItem>
                                                            );
                                                        })}
                                                    </CommandGroup>
                                                </CommandList>
                                            </Command>
                                        </PopoverContent>
                                    </Popover>
                                    <div className="flex flex-wrap gap-2">
                                        {allStatusesIncluded && (
                                            <Badge variant="outline" className="border-dashed text-muted-foreground">
                                                All statuses included
                                            </Badge>
                                        )}
                                        {!allStatusesIncluded && selectedStatuses.map((status) => (
                                            <Badge key={status} variant="secondary" className="capitalize bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-100">
                                                {status}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter className="flex flex-col gap-3 sm:flex-row sm:justify-between">
                                <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={handleReset}>
                                    Reset
                                </Button>
                                <Button type="button" className="w-full sm:w-auto" onClick={handleApplyFilters}>
                                    Apply filters
                                </Button>
                            </CardFooter>
                        </Card>

                        <Card className="flex h-full flex-col border border-slate-200 bg-white/95 shadow-sm dark:border-slate-800/70 dark:bg-slate-900/70">
                            <CardHeader className="space-y-2">
                                <CardTitle className="text-lg font-semibold text-slate-900 dark:text-slate-50">Vendor Snapshot</CardTitle>
                                <CardDescription className="text-sm">Key outsourcing metrics for the selected period.</CardDescription>
                            </CardHeader>
                            <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                                {summaryCards.map((card) => (
                                    <Card
                                        key={card.title}
                                        className="border border-slate-200/80 bg-white/90 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800/70 dark:bg-slate-950/60"
                                    >
                                        <CardHeader className="flex flex-row items-start justify-between space-y-0 p-4">
                                            <div className="space-y-1">
                                                <CardTitle className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                                    {card.title}
                                                </CardTitle>
                                                <div className="text-xl font-semibold text-slate-900 dark:text-slate-50">{card.value}</div>
                                            </div>
                                            {card.icon}
                                        </CardHeader>
                                        <CardContent className="px-4 pb-4">
                                            <p className="text-xs text-muted-foreground">{card.helper}</p>
                                        </CardContent>
                                    </Card>
                                ))}
                            </CardContent>
                        </Card>
                    </section>

                    <section className="grid gap-6 xl:grid-cols-3">
                        <Card className="border border-slate-200 bg-white/95 shadow-sm dark:border-slate-800/70 dark:bg-slate-900/70">
                            <CardHeader>
                                <CardTitle className="text-base font-semibold text-slate-900 dark:text-slate-50">Internal baseline</CardTitle>
                                <CardDescription className="text-sm">Current internal fleet spend over the same window.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-3 text-sm">
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground">Trips</span>
                                    <span className="font-semibold text-slate-900 dark:text-slate-100">{formatNumber(baseline?.trip_count ?? 0)}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground">Distance</span>
                                    <span className="font-semibold text-slate-900 dark:text-slate-100">{formatDecimal(baseline?.distance_km ?? 0)} km</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground">Cost</span>
                                    <span className="font-semibold text-slate-900 dark:text-slate-100">{formatCurrency(baseline?.cost ?? 0)}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground">Cost / Km</span>
                                    <span className="font-semibold text-slate-900 dark:text-slate-100">{formatOptionalCurrency(baseline?.cost_per_km, ' / km')}</span>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border border-slate-200 bg-white/95 shadow-sm dark:border-slate-800/70 dark:bg-slate-900/70">
                            <CardHeader>
                                <CardTitle className="text-base font-semibold text-slate-900 dark:text-slate-50">Highlights</CardTitle>
                                <CardDescription className="text-sm">Vendors ranking highest on key indicators.</CardDescription>
                            </CardHeader>
                            <CardContent className="grid gap-4 text-sm">
                                <div className="space-y-2">
                                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Highest cost / km</p>
                                    {highlightData.highest_cost_per_km.length === 0 && (
                                        <p className="text-muted-foreground">No data available.</p>
                                    )}
                                    {highlightData.highest_cost_per_km.map((vendor) => (
                                        <div key={vendor.outsource_id} className="flex items-center justify-between rounded-lg border border-slate-200/80 px-3 py-2 dark:border-slate-800/70">
                                            <div>
                                                <p className="font-semibold text-slate-900 dark:text-slate-100">{vendor.name}</p>
                                                <p className="text-xs text-muted-foreground">{formatOptionalCurrency(vendor.cost_per_km, ' / km')}</p>
                                            </div>
                                            <ArrowUpRight className="h-4 w-4 text-rose-500" />
                                        </div>
                                    ))}
                                </div>
                                <div className="space-y-2">
                                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Best completion</p>
                                    {highlightData.best_completion_rate.length === 0 && (
                                        <p className="text-muted-foreground">No data available.</p>
                                    )}
                                    {highlightData.best_completion_rate.map((vendor) => (
                                        <div key={vendor.outsource_id} className="flex items-center justify-between rounded-lg border border-slate-200/80 px-3 py-2 dark:border-slate-800/70">
                                            <div>
                                                <p className="font-semibold text-slate-900 dark:text-slate-100">{vendor.name}</p>
                                                <p className="text-xs text-muted-foreground">{formatOptionalPercent(vendor.completion_rate_pct)}</p>
                                            </div>
                                            <ArrowUpRight className="h-4 w-4 text-emerald-500" />
                                        </div>
                                    ))}
                                </div>
                                <div className="space-y-2">
                                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Largest spend</p>
                                    {highlightData.largest_spend.length === 0 && (
                                        <p className="text-muted-foreground">No data available.</p>
                                    )}
                                    {highlightData.largest_spend.map((vendor) => (
                                        <div key={vendor.outsource_id} className="flex items-center justify-between rounded-lg border border-slate-200/80 px-3 py-2 dark:border-slate-800/70">
                                            <div>
                                                <p className="font-semibold text-slate-900 dark:text-slate-100">{vendor.name}</p>
                                                <p className="text-xs text-muted-foreground">{formatCurrency(vendor.total_cost)}</p>
                                            </div>
                                            <CircleDollarSign className="h-4 w-4 text-slate-500" />
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border border-slate-200 bg-white/95 shadow-sm dark:border-slate-800/70 dark:bg-slate-900/70">
                            <CardHeader>
                                <CardTitle className="text-base font-semibold text-slate-900 dark:text-slate-50">Monthly trend</CardTitle>
                                <CardDescription className="text-sm">Monitor spend and completion rate shifts over time.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-3 text-sm">
                                {trend.length === 0 && <p className="text-muted-foreground">No trend data for the selected filters.</p>}
                                {trend.map((row) => (
                                    <div key={row.period} className="flex flex-col gap-1 rounded-lg border border-slate-200/80 px-3 py-2 dark:border-slate-800/70">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{row.period}</span>
                                            <Badge variant="outline" className="text-xs">
                                                {formatOptionalPercent(row.completion_rate_pct)}
                                            </Badge>
                                        </div>
                                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                                            <span>Trips</span>
                                            <span className="font-semibold text-slate-900 dark:text-slate-100">{formatNumber(row.trips)}</span>
                                        </div>
                                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                                            <span>Cost</span>
                                            <span className="font-semibold text-slate-900 dark:text-slate-100">{formatCurrency(row.total_cost)}</span>
                                        </div>
                                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                                            <span>Cost / Km</span>
                                            <span className="font-semibold text-slate-900 dark:text-slate-100">{formatOptionalCurrency(row.cost_per_km, ' / km')}</span>
                                        </div>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    </section>

                    <section className="grid gap-6">
                        <Card className="border border-slate-200 bg-white/95 shadow-sm dark:border-slate-800/70 dark:bg-slate-900/70">
                            <CardHeader>
                                <CardTitle className="text-lg font-semibold text-slate-900 dark:text-slate-50">Vendor breakdown</CardTitle>
                                <CardDescription className="text-sm">
                                    Detailed metrics to compare performance, cost efficiency, and reliability across all included outsource partners.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="max-h-[60vh] overflow-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="sticky top-0 z-10 bg-white/95 backdrop-blur dark:bg-slate-900/80">
                                                <TableHead>Vendor</TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead className="text-right">Trips</TableHead>
                                                <TableHead className="text-right">Completed</TableHead>
                                                <TableHead className="text-right">Completion %</TableHead>
                                                <TableHead className="text-right">Distance (km)</TableHead>
                                                <TableHead className="text-right">Ton-km</TableHead>
                                                <TableHead className="text-right">Cost</TableHead>
                                                <TableHead className="text-right">Cost / Km</TableHead>
                                                <TableHead className="text-right">Cost / Ton-km</TableHead>
                                                <TableHead className="text-right">Δ Cost / Km</TableHead>
                                                <TableHead className="text-right">Δ Total</TableHead>
                                                <TableHead className="text-right">Avg Cost / Trip</TableHead>
                                                <TableHead className="text-right">Avg Distance / Trip</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {breakdown.length === 0 && (
                                                <TableRow>
                                                    <TableCell colSpan={14} className="py-10 text-center text-muted-foreground">
                                                        No outsource activity for the selected criteria.
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                            {breakdown.map((vendor) => (
                                                <TableRow key={vendor.outsource_id}>
                                                    <TableCell className="font-semibold text-slate-900 dark:text-slate-100">{vendor.name}</TableCell>
                                                    <TableCell className="capitalize text-muted-foreground">{vendor.status ?? '—'}</TableCell>
                                                    <TableCell className="text-right font-medium">{formatNumber(vendor.trips)}</TableCell>
                                                    <TableCell className="text-right">{formatNumber(vendor.completed_trips)}</TableCell>
                                                    <TableCell className="text-right">{formatOptionalPercent(vendor.completion_rate_pct)}</TableCell>
                                                    <TableCell className="text-right">{formatDecimal(vendor.total_distance_km)}</TableCell>
                                                    <TableCell className="text-right">{formatDecimal(vendor.total_tonkm)}</TableCell>
                                                    <TableCell className="text-right">{formatCurrency(vendor.total_cost)}</TableCell>
                                                    <TableCell className="text-right">{formatOptionalCurrency(vendor.cost_per_km, ' / km')}</TableCell>
                                                    <TableCell className="text-right">{formatOptionalCurrency(vendor.cost_per_tonkm, ' / ton-km')}</TableCell>
                                                    <TableCell className="text-right">{formatOptionalCurrency(vendor.cost_delta_per_km, ' / km')}</TableCell>
                                                    <TableCell className="text-right">{formatOptionalCurrency(vendor.total_cost_delta)}</TableCell>
                                                    <TableCell className="text-right">{formatOptionalCurrency(vendor.average_cost_per_trip)}</TableCell>
                                                    <TableCell className="text-right">{formatOptionalDecimal(vendor.average_distance_per_trip, ' km')}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </CardContent>
                            <CardFooter className="flex flex-wrap items-center gap-4 border-t border-slate-200/80 bg-slate-50/60 px-4 py-3 text-sm dark:border-slate-800/70 dark:bg-slate-900/40">
                                <div className="flex items-center gap-2">
                                    <Badge variant="outline" className="bg-white/80 text-xs text-slate-600 dark:bg-slate-900/80 dark:text-slate-300">
                                        Trips: {formatNumber(totals?.trips ?? 0)}
                                    </Badge>
                                    <Badge variant="outline" className="bg-white/80 text-xs text-slate-600 dark:bg-slate-900/80 dark:text-slate-300">
                                        Vendors: {formatNumber(totals?.vendor_count ?? 0)}
                                    </Badge>
                                </div>
                                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                    <span className="flex items-center gap-1">
                                        <ArrowUpRight className="h-3.5 w-3.5 text-emerald-500" />
                                        Completion: {formatOptionalPercent(totals?.average_completion_rate_pct ?? null)}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <CircleDollarSign className="h-3.5 w-3.5 text-slate-500" />
                                        Cost / km: {formatOptionalCurrency(totals?.cost_per_km, ' / km')}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <ArrowDownRight className="h-3.5 w-3.5 text-amber-500" />
                                        Distance: {formatDecimal(totals?.distance_km ?? 0)} km
                                    </span>
                                </div>
                            </CardFooter>
                        </Card>
                    </section>
                </div>
            </div>
        </AppLayout>
    );
}












