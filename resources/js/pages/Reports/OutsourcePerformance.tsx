import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/components/ui/command';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import ListPageLayout from '@/components/layouts/list-page-layout';
import { ListingStatsHeader, type ListingStatDefinition } from '@/components/listing/stats-header';
import { ListingFilterBar } from '@/components/listing/filter-bar';
import { ListingTableShell, type ListingTableColumn } from '@/components/listing/data-table-shell';
import { ListingMobileItemList } from '@/components/listing/mobile-item-list';
import { ListingLoadingPlaceholder } from '@/components/listing/loading-placeholder';
import { useListingLoading } from '@/hooks/use-listing-loading';
import { router } from '@inertiajs/react';
import { type BreadcrumbItem } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import { TableCell, TableRow } from '@/components/ui/table';
import * as React from 'react';
import {
    ArrowDownRight,
    ArrowUpRight,
    Building2,
    CircleDollarSign,
    Filter,
    TrendingDown,
    TrendingUp,
    ChevronRight,
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
    {
        title: 'Reports',
        href: '/reports/outsource-performance',
    },
    {
        title: 'Outsource Performance',
        href: '/reports/outsource-performance',
    },
];

const SKELETON_FLAG_KEY = 'reports.outsource-performance.shouldShowSkeleton';

const TABLE_COLUMNS: ListingTableColumn[] = [
    { id: 'vendor', label: 'Vendor' },
    { id: 'status', label: 'Status' },
    { id: 'trips', label: 'Trips', align: 'right' },
    { id: 'completed', label: 'Completed', align: 'right' },
    { id: 'completionRate', label: 'Completion %', align: 'right' },
    { id: 'distance', label: 'Distance (km)', align: 'right' },
    { id: 'tonkm', label: 'Ton-km', align: 'right' },
    { id: 'cost', label: 'Cost', align: 'right' },
    { id: 'costPerKm', label: 'Cost / Km', align: 'right' },
    { id: 'costPerTonKm', label: 'Cost / Ton-km', align: 'right' },
    { id: 'deltaPerKm', label: 'Δ Cost / Km', align: 'right' },
    { id: 'deltaTotal', label: 'Δ Total', align: 'right' },
    { id: 'avgCost', label: 'Avg Cost / Trip', align: 'right' },
    { id: 'avgDistance', label: 'Avg Distance / Trip', align: 'right' },
];

const formatNumber = (value: number | null | undefined): string => {
    if (typeof value !== 'number' || Number.isNaN(value)) {
        return '0';
    }

    return value.toLocaleString();
};

const formatDecimal = (value: number | null | undefined, fractionDigits = 2): string => {
    if (typeof value !== 'number' || Number.isNaN(value)) {
        return '—';
    }

    return value.toLocaleString(undefined, {
        minimumFractionDigits: fractionDigits,
        maximumFractionDigits: fractionDigits,
    });
};

const formatCurrency = (value: number | null | undefined): string => {
    if (typeof value !== 'number' || Number.isNaN(value)) {
        return new Intl.NumberFormat(undefined, {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(0);
    }

    return new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(value);
};

const formatOptionalDecimal = (value: number | null, suffix?: string): string => {
    if (value === null || value === undefined || Number.isNaN(value)) {
        return '—';
    }

    return `${formatDecimal(value)}${suffix ?? ''}`;
};

const formatOptionalCurrency = (value: number | null, suffix?: string): string => {
    if (value === null || value === undefined || Number.isNaN(value)) {
        return '—';
    }

    return `${formatCurrency(value)}${suffix ?? ''}`;
};

const formatOptionalPercent = (value: number | null): string => {
    if (value === null || value === undefined || Number.isNaN(value)) {
        return '—';
    }

    return `${formatDecimal(value)}%`;
};

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
    const [from, setFrom] = React.useState(filters?.from ?? '');
    const [to, setTo] = React.useState(filters?.to ?? '');
    const [selectedVendors, setSelectedVendors] = React.useState<number[]>(filters?.outsource_ids ?? []);
    const [selectedStatuses, setSelectedStatuses] = React.useState<string[]>(filters?.statuses ?? []);
    const [vendorSearch, setVendorSearch] = React.useState('');
    const [vendorSelectorOpen, setVendorSelectorOpen] = React.useState(false);
    const [statusSelectorOpen, setStatusSelectorOpen] = React.useState(false);

    const isDataReady = Array.isArray(breakdown);
    const { isLoading } = useListingLoading({
        storageKey: SKELETON_FLAG_KEY,
        isDataReady,
    });

    const allVendorsIncluded = selectedVendors.length === 0;
    const allStatusesIncluded = selectedStatuses.length === 0;

    const selectedVendorNames = React.useMemo(
        () => options.vendors.filter((vendor) => selectedVendors.includes(vendor.id)).map((vendor) => vendor.name),
        [options.vendors, selectedVendors],
    );

    const filteredVendorOptions = React.useMemo(() => {
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

        router.get('/reports/outsource-performance', {}, {
            preserveState: false,
            preserveScroll: true,
        });
    };

    const visibleVendorBadges = selectedVendorNames.slice(0, 4);
    const extraVendorCount = Math.max(selectedVendorNames.length - visibleVendorBadges.length, 0);

    const summaryStats: ListingStatDefinition[] = [
        {
            id: 'external-spend',
            label: 'External Spend',
            icon: <CircleDollarSign className="h-3.5 w-3.5 text-emerald-500" />,
            value: isLoading ? <Skeleton className="h-5 w-24" /> : formatCurrency(summary?.total_outsourced_cost ?? 0),
            description: 'Total paid to outsource partners',
            valueClassName: isLoading ? undefined : 'text-emerald-600',
        },
        {
            id: 'cost-per-km',
            label: 'Cost / Km',
            icon: <TrendingUp className="h-3.5 w-3.5 text-indigo-500" />,
            value: isLoading ? <Skeleton className="h-5 w-20" /> : formatOptionalCurrency(summary?.outsourced_cost_per_km, ' / km'),
            description: 'Average outsource kilometre rate',
            valueClassName: isLoading ? undefined : 'text-indigo-600',
        },
        {
            id: 'delta',
            label: 'Δ vs Internal',
            icon: <ArrowUpRight className="h-3.5 w-3.5 text-rose-500" />,
            value: isLoading ? <Skeleton className="h-5 w-20" /> : formatOptionalCurrency(summary?.cost_delta_per_km, ' / km'),
            description: 'Difference to internal cost baseline',
            valueClassName: isLoading ? undefined : 'text-rose-600',
        },
        {
            id: 'completion',
            label: 'Completion Rate',
            icon: <Building2 className="h-3.5 w-3.5 text-amber-500" />,
            value: isLoading
                ? <Skeleton className="h-5 w-16" />
                : formatOptionalPercent(
                      summary?.average_completion_rate_pct ?? totals?.average_completion_rate_pct ?? null,
                  ),
            description: 'Finished outsource trips vs dispatched',
            valueClassName: isLoading ? undefined : 'text-amber-600',
        },
        {
            id: 'avg-cost-trip',
            label: 'Avg Cost / Trip',
            icon: <TrendingDown className="h-3.5 w-3.5 text-sky-500" />,
            value: isLoading ? <Skeleton className="h-5 w-20" /> : formatOptionalCurrency(summary?.average_cost_per_trip),
            description: 'Spend per completed trip',
            valueClassName: isLoading ? undefined : 'text-slate-700',
        },
    ];

    const highlightData = highlights ?? {
        highest_cost_per_km: [],
        best_completion_rate: [],
        largest_spend: [],
    };

    const generateVendorBadges = () => (
        <div className="flex flex-wrap gap-2">
            {allVendorsIncluded && (
                <Badge variant="outline" className="border-dashed text-muted-foreground">
                    All vendors included
                </Badge>
            )}
            {!allVendorsIncluded &&
                visibleVendorBadges.map((name) => (
                    <Badge
                        key={name}
                        variant="secondary"
                        className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-100"
                    >
                        {name}
                    </Badge>
                ))}
            {!allVendorsIncluded && extraVendorCount > 0 && (
                <Badge variant="outline" className="border-dashed text-muted-foreground">
                    +{extraVendorCount} more
                </Badge>
            )}
        </div>
    );

    const filtersCard = (
        <Card className="flex h-full flex-col border border-slate-200/80 shadow-sm dark:border-slate-800/70">
            <CardHeader className="space-y-2">
                <CardTitle className="text-lg font-semibold">Filters</CardTitle>
                <CardDescription>Adjust the date window and included vendors.</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 space-y-6">
                <div className="space-y-2">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Date range</span>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <Input
                            type="date"
                            value={from}
                            onChange={(event) => setFrom(event.target.value)}
                        />
                        <Input
                            type="date"
                            value={to}
                            onChange={(event) => setTo(event.target.value)}
                        />
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
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={handleSelectAllVendors}
                                    >
                                        {selectedVendors.length === options.vendors.length && options.vendors.length > 0
                                            ? 'Unselect all'
                                            : 'Select all'}
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
                                        <CommandItem
                                            onSelect={() => setSelectedVendors([])}
                                            className="flex items-center gap-2"
                                        >
                                            <Checkbox checked={allVendorsIncluded} />
                                            <span className="font-medium">All vendors</span>
                                            {allVendorsIncluded && (
                                                <Badge variant="secondary" className="ml-auto">
                                                    Active
                                                </Badge>
                                            )}
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
                                                        <Badge
                                                            variant="outline"
                                                            className="ml-auto capitalize text-xs"
                                                        >
                                                            {vendor.status}
                                                        </Badge>
                                                    )}
                                                    {checked && (
                                                        <Badge variant="secondary" className="ml-2">
                                                            Included
                                                        </Badge>
                                                    )}
                                                </CommandItem>
                                            );
                                        })}
                                    </CommandGroup>
                                </CommandList>
                            </Command>
                        </PopoverContent>
                    </Popover>
                    {generateVendorBadges()}
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
                                        <CommandItem
                                            onSelect={() => setSelectedStatuses([])}
                                            className="flex items-center gap-2"
                                        >
                                            <Checkbox checked={allStatusesIncluded} />
                                            <span className="font-medium">All statuses</span>
                                            {allStatusesIncluded && (
                                                <Badge variant="secondary" className="ml-auto">
                                                    Active
                                                </Badge>
                                            )}
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
                                                    {checked && (
                                                        <Badge variant="secondary" className="ml-auto">
                                                            Included
                                                        </Badge>
                                                    )}
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
                        {!allStatusesIncluded &&
                            selectedStatuses.map((status) => (
                                <Badge
                                    key={status}
                                    variant="secondary"
                                    className="capitalize bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-100"
                                >
                                    {status}
                                </Badge>
                            ))}
                    </div>
                </div>
            </CardContent>
            <CardContent className="flex flex-col gap-3 border-t border-slate-200/80 bg-slate-50/60 pt-4 dark:border-slate-800/70 dark:bg-slate-900/40">
                <Button type="button" variant="outline" onClick={handleReset}>
                    Reset
                </Button>
                <Button type="button" onClick={handleApplyFilters}>
                    Apply filters
                </Button>
            </CardContent>
        </Card>
    );

    const baselineCard = (
        <Card className="border border-slate-200/80 shadow-sm dark:border-slate-800/70">
            <CardHeader>
                <CardTitle className="text-base font-semibold">Internal baseline</CardTitle>
                <CardDescription>Internal fleet performance for comparison.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Trips</span>
                    <span className="font-semibold text-slate-900 dark:text-slate-100">
                        {isLoading ? <Skeleton className="h-4 w-16" /> : formatNumber(baseline?.trip_count ?? 0)}
                    </span>
                </div>
                <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Distance</span>
                    <span className="font-semibold text-slate-900 dark:text-slate-100">
                        {isLoading ? <Skeleton className="h-4 w-20" /> : `${formatDecimal(baseline?.distance_km ?? 0)} km`}
                    </span>
                </div>
                <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Cost</span>
                    <span className="font-semibold text-slate-900 dark:text-slate-100">
                        {isLoading ? <Skeleton className="h-4 w-24" /> : formatCurrency(baseline?.cost ?? 0)}
                    </span>
                </div>
                <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Cost / Km</span>
                    <span className="font-semibold text-slate-900 dark:text-slate-100">
                        {isLoading
                            ? <Skeleton className="h-4 w-24" />
                            : formatOptionalCurrency(baseline?.cost_per_km, ' / km')}
                    </span>
                </div>
            </CardContent>
        </Card>
    );

    const highlightsCard = (
        <Card className="border border-slate-200/80 shadow-sm dark:border-slate-800/70">
            <CardHeader>
                <CardTitle className="text-base font-semibold">Highlights</CardTitle>
                <CardDescription>Top performers by key metrics.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 text-sm">
                <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Highest cost / km
                    </p>
                    {isLoading && <Skeleton className="h-24 w-full" />}
                    {!isLoading && highlightData.highest_cost_per_km.length === 0 && (
                        <p className="text-muted-foreground">No data available.</p>
                    )}
                    {!isLoading &&
                        highlightData.highest_cost_per_km.map((vendor) => (
                            <div
                                key={vendor.outsource_id}
                                className="flex items-center justify-between rounded-lg border border-slate-200/80 px-3 py-2 dark:border-slate-800/70"
                            >
                                <div>
                                    <p className="font-semibold text-slate-900 dark:text-slate-100">{vendor.name}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {formatOptionalCurrency(vendor.cost_per_km, ' / km')}
                                    </p>
                                </div>
                                <ArrowUpRight className="h-4 w-4 text-rose-500" />
                            </div>
                        ))}
                </div>
                <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Best completion
                    </p>
                    {isLoading && <Skeleton className="h-24 w-full" />}
                    {!isLoading && highlightData.best_completion_rate.length === 0 && (
                        <p className="text-muted-foreground">No data available.</p>
                    )}
                    {!isLoading &&
                        highlightData.best_completion_rate.map((vendor) => (
                            <div
                                key={vendor.outsource_id}
                                className="flex items-center justify-between rounded-lg border border-slate-200/80 px-3 py-2 dark:border-slate-800/70"
                            >
                                <div>
                                    <p className="font-semibold text-slate-900 dark:text-slate-100">{vendor.name}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {formatOptionalPercent(vendor.completion_rate_pct)}
                                    </p>
                                </div>
                                <ArrowUpRight className="h-4 w-4 text-emerald-500" />
                            </div>
                        ))}
                </div>
                <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Largest spend
                    </p>
                    {isLoading && <Skeleton className="h-24 w-full" />}
                    {!isLoading && highlightData.largest_spend.length === 0 && (
                        <p className="text-muted-foreground">No data available.</p>
                    )}
                    {!isLoading &&
                        highlightData.largest_spend.map((vendor) => (
                            <div
                                key={vendor.outsource_id}
                                className="flex items-center justify-between rounded-lg border border-slate-200/80 px-3 py-2 dark:border-slate-800/70"
                            >
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
    );

    const trendCard = (
        <Card className="border border-slate-200/80 shadow-sm dark:border-slate-800/70">
            <CardHeader>
                <CardTitle className="text-base font-semibold">Monthly trend</CardTitle>
                <CardDescription>Track spend and completion shifts.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
                {isLoading && (
                    <>
                        {Array.from({ length: 3 }).map((_, index) => (
                            <Skeleton key={index} className="h-20 w-full" />
                        ))}
                    </>
                )}
                {!isLoading && trend.length === 0 && (
                    <p className="text-muted-foreground">No trend data for the selected filters.</p>
                )}
                {!isLoading &&
                    trend.map((row) => (
                        <div
                            key={row.period}
                            className="flex flex-col gap-1 rounded-lg border border-slate-200/80 px-3 py-2 dark:border-slate-800/70"
                        >
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                    {row.period}
                                </span>
                                <Badge variant="outline" className="text-xs">
                                    {formatOptionalPercent(row.completion_rate_pct)}
                                </Badge>
                            </div>
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                                <span>Trips</span>
                                <span className="font-semibold text-slate-900 dark:text-slate-100">
                                    {formatNumber(row.trips)}
                                </span>
                            </div>
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                                <span>Cost</span>
                                <span className="font-semibold text-slate-900 dark:text-slate-100">
                                    {formatCurrency(row.total_cost)}
                                </span>
                            </div>
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                                <span>Cost / Km</span>
                                <span className="font-semibold text-slate-900 dark:text-slate-100">
                                    {formatOptionalCurrency(row.cost_per_km, ' / km')}
                                </span>
                            </div>
                        </div>
                    ))}
            </CardContent>
        </Card>
    );

    const tableRows = React.useMemo(() => {
        if (breakdown.length === 0) {
            return (
                <TableRow>
                    <TableCell colSpan={TABLE_COLUMNS.length} className="py-10 text-center text-muted-foreground">
                        No outsource activity for the selected criteria.
                    </TableCell>
                </TableRow>
            );
        }

        return breakdown.map((vendor) => (
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
        ));
    }, [breakdown]);

    const mobileItems = React.useMemo(
        () =>
            breakdown.map((vendor, index) => ({
                vendor,
                index: index + 1,
            })),
        [breakdown],
    );

    const mobileList = (
        <ListingMobileItemList
            items={mobileItems}
            getKey={(item) => item.vendor.outsource_id}
            renderTitle={(item) => (
                <div className="flex items-center gap-2">
                    <span className="text-xs uppercase tracking-wide text-muted-foreground">#{item.index}</span>
                    <span className="text-base font-semibold text-foreground">{item.vendor.name}</span>
                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
            )}
            renderSubtitle={(item) => item.vendor.status ?? 'Status unknown'}
            renderContent={(item) => (
                <div className="space-y-3 text-sm text-muted-foreground">
                    <div className="flex items-center justify-between">
                        <span className="font-medium text-slate-600 dark:text-slate-300">Trips</span>
                        <span className="text-right font-semibold text-slate-900 dark:text-slate-100">
                            {formatNumber(item.vendor.trips)}
                        </span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="font-medium text-slate-600 dark:text-slate-300">Completion</span>
                        <span className="text-right font-semibold text-slate-900 dark:text-slate-100">
                            {formatOptionalPercent(item.vendor.completion_rate_pct)}
                        </span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="font-medium text-slate-600 dark:text-slate-300">Cost</span>
                        <span className="text-right font-semibold text-slate-900 dark:text-slate-100">
                            {formatCurrency(item.vendor.total_cost)}
                        </span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="font-medium text-slate-600 dark:text-slate-300">Cost / Km</span>
                        <span className="text-right font-semibold text-slate-900 dark:text-slate-100">
                            {formatOptionalCurrency(item.vendor.cost_per_km, ' / km')}
                        </span>
                    </div>
                </div>
            )}
            emptyState={
                isLoading ? (
                    <ListingLoadingPlaceholder
                        showStats={false}
                        filterItemCount={0}
                        rowCount={4}
                        className="p-4"
                    />
                ) : (
                    <div className="py-8 text-center text-muted-foreground">
                        No outsource activity for the selected criteria.
                    </div>
                )
            }
        />
    );

    const tableFooter = (
        <div className="flex flex-wrap items-center gap-4 border-t border-slate-200/80 bg-slate-50/60 px-4 py-3 text-sm dark:border-slate-800/70 dark:bg-slate-900/40">
            <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-white/80 text-xs text-slate-600 dark:bg-slate-900/80 dark:text-slate-300">
                    Trips: {formatNumber(totals?.trips ?? 0)}
                </Badge>
                <Badge variant="outline" className="bg-white/80 text-xs text-slate-600 dark:bg-slate-900/80 dark:text-slate-300">
                    Vendors: {formatNumber(totals?.vendor_count ?? 0)}
                </Badge>
            </div>
            <div className="flex flex-1 flex-wrap items-center gap-4 text-xs text-muted-foreground">
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
        </div>
    );

    const tableHeaderExtras = (
        <ListingFilterBar className="gap-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>Date range:</span>
                <span className="font-semibold text-foreground">{from || '—'}</span>
                <span>to</span>
                <span className="font-semibold text-foreground">{to || '—'}</span>
            </div>
        </ListingFilterBar>
    );

    return (
        <ListPageLayout
            headTitle="Outsource Performance"
            title="Outsource Performance"
            description="Compare outsource hauliers against your internal baseline to monitor cost efficiency, reliability, and spend concentration."
            breadcrumbs={breadcrumbs}
            actions={(
                <>
                    <Button type="button" variant="outline" onClick={handleReset}>
                        Reset
                    </Button>
                    <Button type="button" onClick={handleApplyFilters}>
                        Generate report
                    </Button>
                </>
            )}
            stats={(
                <div className="flex flex-col gap-6">
                    <div className="grid gap-6 lg:grid-cols-[minmax(320px,360px)_1fr]">
                        {filtersCard}
                        <Card className="border border-slate-200/80 shadow-sm dark:border-slate-800/70">
                            <CardHeader>
                                <CardTitle className="text-lg font-semibold">Vendor snapshot</CardTitle>
                                <CardDescription>Key outsourcing metrics for the selected period.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ListingStatsHeader stats={summaryStats} orientation="row" />
                            </CardContent>
                        </Card>
                    </div>
                    <div className="grid gap-6 xl:grid-cols-3">
                        {baselineCard}
                        {highlightsCard}
                        {trendCard}
                    </div>
                </div>
            )}
            tableTitle="Vendor breakdown"
            tableDescription="Detailed metrics comparing performance, cost efficiency, and reliability across outsource partners."
            tableHeaderExtras={tableHeaderExtras}
            tableContainerClassName="max-h-[60vh]"
            pagination={undefined}
        >
            {isLoading && (
                <ListingLoadingPlaceholder
                    showStats={false}
                    filterItemCount={0}
                    rowCount={6}
                    className="p-6"
                />
            )}

            {!isLoading && (
                <>
                    <div className="hidden md:block">
                        <ListingTableShell columns={TABLE_COLUMNS}>{tableRows}</ListingTableShell>
                    </div>
                    <div className="md:hidden p-2">{mobileList}</div>
                    {tableFooter}
                </>
            )}
        </ListPageLayout>
    );
}
