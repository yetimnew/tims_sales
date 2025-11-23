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
    AlertTriangle,
    CalendarDays,
    CheckCircle2,
    Clock3,
    DollarSign,
    Filter,
    ShieldAlert,
    Wrench,
} from 'lucide-react';

interface MaintenanceFilters {
    from: string;
    to: string;
    truck_ids?: number[];
    maintenance_type_ids?: number[];
    statuses?: string[];
    service_providers?: string[];
}

interface MaintenanceOptions {
    trucks: { id: number; plate: string; status?: string | null }[];
    maintenance_types: { id: number; name: string; category?: string | null }[];
    statuses: string[];
    service_providers: string[];
}

interface MaintenanceTotals {
    records: number;
    completed: number;
    scheduled: number;
    in_progress: number;
    overdue: number;
    total_cost: number;
    completed_cost: number;
    open_cost: number;
    truck_count: number;
    type_count: number;
    average_completion_days: number | null;
}

interface MaintenanceSummary {
    completion_rate_pct: number | null;
    overdue_rate_pct: number | null;
    average_cost_per_record: number | null;
    average_cost_per_completed: number | null;
    average_completion_days: number | null;
    share_of_cost_tracked_types_pct: number | null;
    upcoming_within_seven_days: number;
}

interface MaintenanceBreakdownRow {
    truck_id: number;
    plate: string;
    status?: string | null;
    records: number;
    completed: number;
    scheduled: number;
    in_progress: number;
    overdue: number;
    completion_rate_pct: number | null;
    overdue_rate_pct: number | null;
    total_cost: number;
    completed_cost: number;
    open_cost: number;
    average_cost: number | null;
    average_completion_days: number | null;
    last_completed_at: string | null;
    next_scheduled_at: string | null;
    max_overdue_days: number | null;
}

interface MaintenanceTypeBreakdownRow {
    maintenance_type_id: number;
    name: string;
    category?: string | null;
    records: number;
    completed: number;
    scheduled: number;
    overdue: number;
    completion_rate_pct: number | null;
    total_cost: number;
    average_cost: number | null;
}

interface MaintenanceTrendRow {
    period: string;
    records: number;
    completed: number;
    scheduled: number;
    overdue: number;
    total_cost: number;
    average_cost_per_record: number | null;
}

interface MaintenanceUpcomingRow {
    id: number;
    truck: { id: number; plate: string; status?: string | null } | null;
    maintenance_type: { id: number | null; name: string | null; category?: string | null } | null;
    scheduled_date: string | null;
    days_until: number | null;
    service_provider?: string | null;
    estimated_cost: number | null;
}

interface MaintenanceHighlights {
    highest_cost_trucks: MaintenanceBreakdownRow[];
    most_overdue_trucks: MaintenanceBreakdownRow[];
    costliest_types: MaintenanceTypeBreakdownRow[];
    upcoming: MaintenanceUpcomingRow[];
}

interface MaintenanceProps {
    filters: MaintenanceFilters;
    options: MaintenanceOptions;
    totals: MaintenanceTotals;
    summary: MaintenanceSummary;
    breakdown: MaintenanceBreakdownRow[];
    type_breakdown: MaintenanceTypeBreakdownRow[];
    trend: MaintenanceTrendRow[];
    upcoming: MaintenanceUpcomingRow[];
    highlights: MaintenanceHighlights;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Reports', href: '/reports/maintenance' },
    { title: 'Maintenance', href: '/reports/maintenance' },
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

const formatOptionalNumber = (value: number | null, suffix?: string) =>
    value === null ? '—' : `${formatDecimal(value)}${suffix ?? ''}`;

const formatOptionalPercent = (value: number | null) =>
    value === null ? '—' : `${formatDecimal(value)}%`;

const formatOptionalCurrency = (value: number | null, suffix?: string) =>
    value === null ? '—' : `${formatCurrency(value)}${suffix ?? ''}`;

export default function MaintenanceReport({
    filters,
    options,
    totals,
    summary,
    breakdown = [],
    type_breakdown: typeBreakdown = [],
    trend = [],
    upcoming = [],
    highlights,
}: MaintenanceProps) {
    const [from, setFrom] = useState(filters?.from ?? '');
    const [to, setTo] = useState(filters?.to ?? '');
    const [selectedTruckIds, setSelectedTruckIds] = useState<number[]>(filters?.truck_ids ?? []);
    const [selectedMaintenanceTypes, setSelectedMaintenanceTypes] = useState<number[]>(filters?.maintenance_type_ids ?? []);
    const [selectedStatuses, setSelectedStatuses] = useState<string[]>(filters?.statuses ?? []);
    const [selectedProviders, setSelectedProviders] = useState<string[]>(filters?.service_providers ?? []);
    const [truckSearch, setTruckSearch] = useState('');
    const [typeSearch, setTypeSearch] = useState('');
    const [truckSelectorOpen, setTruckSelectorOpen] = useState(false);
    const [typeSelectorOpen, setTypeSelectorOpen] = useState(false);
    const [statusSelectorOpen, setStatusSelectorOpen] = useState(false);
    const [providerSelectorOpen, setProviderSelectorOpen] = useState(false);

    const allTrucksIncluded = selectedTruckIds.length === 0;
    const allTypesIncluded = selectedMaintenanceTypes.length === 0;
    const allStatusesIncluded = selectedStatuses.length === 0;
    const allProvidersIncluded = selectedProviders.length === 0;

    const selectedTruckPlates = useMemo(
        () => options.trucks.filter((truck) => selectedTruckIds.includes(truck.id)).map((truck) => truck.plate),
        [options.trucks, selectedTruckIds],
    );

    const selectedTypeNames = useMemo(
        () => options.maintenance_types.filter((type) => selectedMaintenanceTypes.includes(type.id)).map((type) => type.name),
        [options.maintenance_types, selectedMaintenanceTypes],
    );

    const filteredTrucks = useMemo(() => {
        if (!truckSearch.trim()) {
            return options.trucks;
        }

        const query = truckSearch.trim().toLowerCase();
        return options.trucks.filter((truck) => truck.plate.toLowerCase().includes(query));
    }, [options.trucks, truckSearch]);

    const filteredTypes = useMemo(() => {
        if (!typeSearch.trim()) {
            return options.maintenance_types;
        }

        const query = typeSearch.trim().toLowerCase();
        return options.maintenance_types.filter((type) => type.name.toLowerCase().includes(query));
    }, [options.maintenance_types, typeSearch]);

    const handleToggleTruck = (id: number) => {
        setSelectedTruckIds((current) =>
            current.includes(id) ? current.filter((value) => value !== id) : [...current, id],
        );
    };

    const handleToggleType = (id: number) => {
        setSelectedMaintenanceTypes((current) =>
            current.includes(id) ? current.filter((value) => value !== id) : [...current, id],
        );
    };

    const handleToggleStatus = (status: string) => {
        setSelectedStatuses((current) =>
            current.includes(status) ? current.filter((value) => value !== status) : [...current, status],
        );
    };

    const handleToggleProvider = (provider: string) => {
        setSelectedProviders((current) =>
            current.includes(provider) ? current.filter((value) => value !== provider) : [...current, provider],
        );
    };

    const handleApplyFilters = () => {
        setTruckSelectorOpen(false);
        setTypeSelectorOpen(false);
        setStatusSelectorOpen(false);
        setProviderSelectorOpen(false);

        const params: Record<string, string | number | Array<string | number>> = {};

        if (from) {
            params.from = from;
        }

        if (to) {
            params.to = to;
        }

        if (selectedTruckIds.length > 0) {
            params.truck_ids = selectedTruckIds;
        }

        if (selectedMaintenanceTypes.length > 0) {
            params.maintenance_type_ids = selectedMaintenanceTypes;
        }

        if (selectedStatuses.length > 0) {
            params.statuses = selectedStatuses;
        }

        if (selectedProviders.length > 0) {
            params.service_providers = selectedProviders;
        }

        router.get('/reports/maintenance', params, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleReset = () => {
        setFrom(filters?.from ?? '');
        setTo(filters?.to ?? '');
        setSelectedTruckIds(filters?.truck_ids ?? []);
        setSelectedMaintenanceTypes(filters?.maintenance_type_ids ?? []);
        setSelectedStatuses(filters?.statuses ?? []);
        setSelectedProviders(filters?.service_providers ?? []);
        setTruckSearch('');
        setTypeSearch('');
        setTruckSelectorOpen(false);
        setTypeSelectorOpen(false);
        setStatusSelectorOpen(false);
        setProviderSelectorOpen(false);

        router.get('/reports/maintenance', {}, { preserveState: false, preserveScroll: true });
    };

    const visibleTruckBadges = selectedTruckPlates.slice(0, 3);
    const extraTruckBadges = Math.max(selectedTruckPlates.length - visibleTruckBadges.length, 0);

    const visibleTypeBadges = selectedTypeNames.slice(0, 3);
    const extraTypeBadges = Math.max(selectedTypeNames.length - visibleTypeBadges.length, 0);

    const summaryCards = [
        {
            title: 'Maintenance Spend',
            value: formatCurrency(totals?.total_cost ?? 0),
            helper: 'Total spend across selected window',
            icon: <DollarSign className="h-4 w-4 text-emerald-500" />,
        },
        {
            title: 'Completion Rate',
            value: formatOptionalPercent(summary?.completion_rate_pct ?? null),
            helper: 'Closed work orders / total tasks',
            icon: <CheckCircle2 className="h-4 w-4 text-indigo-500" />,
        },
        {
            title: 'Overdue Tasks',
            value: formatNumber(totals?.overdue ?? 0),
            helper: 'Scheduled tasks past their due date',
            icon: <AlertTriangle className="h-4 w-4 text-rose-500" />,
        },
        {
            title: 'Avg Completion (days)',
            value: formatOptionalNumber(summary?.average_completion_days ?? null),
            helper: 'Time between scheduled and completion',
            icon: <Clock3 className="h-4 w-4 text-amber-500" />,
        },
        {
            title: 'Upcoming (7d)',
            value: formatNumber(summary?.upcoming_within_seven_days ?? 0),
            helper: 'Scheduled work within the next week',
            icon: <CalendarDays className="h-4 w-4 text-sky-500" />,
        },
    ];

    const highlightData = highlights ?? {
        highest_cost_trucks: [],
        most_overdue_trucks: [],
        costliest_types: [],
        upcoming: [],
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Maintenance Reports" />
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-slate-100/60 dark:bg-slate-900/40">
                <div className="flex flex-1 flex-col gap-6 overflow-y-auto p-4 pb-10 sm:p-6 lg:p-10">
                    <header className="rounded-2xl border border-slate-200 bg-white/95 px-6 py-6 shadow-sm backdrop-blur dark:border-slate-800/70 dark:bg-slate-900/70">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                            <div className="space-y-2">
                                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500 dark:text-slate-400">Fleet Care</p>
                                <h1 className="text-3xl font-semibold text-slate-900 dark:text-slate-50">Maintenance Operations</h1>
                                <p className="max-w-3xl text-sm text-slate-600 dark:text-slate-300">
                                    Track workshop throughput, completion performance, and supplier spend to keep assets road-ready. Filter by trucks, maintenance types, status, and service providers to focus the analysis.
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
                                <CardDescription className="text-sm">Refine the work orders included in this view.</CardDescription>
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
                                    <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Trucks</span>
                                    <Popover open={truckSelectorOpen} onOpenChange={setTruckSelectorOpen}>
                                        <PopoverTrigger asChild>
                                            <Button type="button" variant="outline" className="w-full justify-between">
                                                <span className="flex items-center gap-2 text-sm">
                                                    {allTrucksIncluded ? 'All trucks' : `${selectedTruckIds.length} selected`}
                                                </span>
                                                <Filter className="h-3.5 w-3.5 text-slate-400" />
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-96 p-0" align="start">
                                            <div className="flex items-center justify-between px-3 py-2">
                                                <div className="flex items-center gap-2">
                                                    <Button type="button" variant="ghost" size="sm" onClick={() => setSelectedTruckIds([])}>
                                                        Clear
                                                    </Button>
                                                </div>
                                            </div>
                                            <Separator />
                                            <Command>
                                                <div className="flex items-center px-3 py-2">
                                                    <CommandInput
                                                        placeholder="Search truck..."
                                                        value={truckSearch}
                                                        onValueChange={setTruckSearch}
                                                    />
                                                </div>
                                                <CommandList className="max-h-64">
                                                    <CommandEmpty>No trucks found.</CommandEmpty>
                                                    <CommandGroup heading="Trucks">
                                                        <CommandItem onSelect={() => setSelectedTruckIds([])} className="flex items-center gap-2">
                                                            <Checkbox checked={allTrucksIncluded} />
                                                            <span className="font-medium">All trucks</span>
                                                            {allTrucksIncluded && <Badge variant="secondary" className="ml-auto">Active</Badge>}
                                                        </CommandItem>
                                                        {filteredTrucks.map((truck) => {
                                                            const checked = selectedTruckIds.includes(truck.id);

                                                            return (
                                                                <CommandItem
                                                                    key={truck.id}
                                                                    onSelect={() => handleToggleTruck(truck.id)}
                                                                    className="flex items-center gap-2"
                                                                >
                                                                    <Checkbox checked={checked} />
                                                                    <span className="font-medium">{truck.plate}</span>
                                                                    {truck.status && (
                                                                        <Badge variant="outline" className="ml-auto capitalize text-xs">
                                                                            {truck.status}
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
                                        {allTrucksIncluded && (
                                            <Badge variant="outline" className="border-dashed text-muted-foreground">
                                                All trucks included
                                            </Badge>
                                        )}
                                        {!allTrucksIncluded && visibleTruckBadges.map((plate) => (
                                            <Badge key={plate} variant="secondary" className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-100">
                                                {plate}
                                            </Badge>
                                        ))}
                                        {!allTrucksIncluded && extraTruckBadges > 0 && (
                                            <Badge variant="outline" className="border-dashed text-muted-foreground">
                                                +{extraTruckBadges} more
                                            </Badge>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Maintenance types</span>
                                    <Popover open={typeSelectorOpen} onOpenChange={setTypeSelectorOpen}>
                                        <PopoverTrigger asChild>
                                            <Button type="button" variant="outline" className="w-full justify-between">
                                                <span className="flex items-center gap-2 text-sm">
                                                    {allTypesIncluded ? 'All types' : `${selectedMaintenanceTypes.length} selected`}
                                                </span>
                                                <Filter className="h-3.5 w-3.5 text-slate-400" />
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-96 p-0" align="start">
                                            <div className="flex items-center justify-between px-3 py-2">
                                                <div className="flex items-center gap-2">
                                                    <Button type="button" variant="ghost" size="sm" onClick={() => setSelectedMaintenanceTypes([])}>
                                                        Clear
                                                    </Button>
                                                </div>
                                            </div>
                                            <Separator />
                                            <Command>
                                                <div className="flex items-center px-3 py-2">
                                                    <CommandInput
                                                        placeholder="Search type..."
                                                        value={typeSearch}
                                                        onValueChange={setTypeSearch}
                                                    />
                                                </div>
                                                <CommandList className="max-h-64">
                                                    <CommandEmpty>No types found.</CommandEmpty>
                                                    <CommandGroup heading="Types">
                                                        <CommandItem onSelect={() => setSelectedMaintenanceTypes([])} className="flex items-center gap-2">
                                                            <Checkbox checked={allTypesIncluded} />
                                                            <span className="font-medium">All types</span>
                                                            {allTypesIncluded && <Badge variant="secondary" className="ml-auto">Active</Badge>}
                                                        </CommandItem>
                                                        {filteredTypes.map((type) => {
                                                            const checked = selectedMaintenanceTypes.includes(type.id);

                                                            return (
                                                                <CommandItem
                                                                    key={type.id}
                                                                    onSelect={() => handleToggleType(type.id)}
                                                                    className="flex items-center gap-2"
                                                                >
                                                                    <Checkbox checked={checked} />
                                                                    <span className="font-medium">{type.name}</span>
                                                                    {type.category && (
                                                                        <Badge variant="outline" className="ml-auto capitalize text-xs">
                                                                            {type.category}
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
                                        {allTypesIncluded && (
                                            <Badge variant="outline" className="border-dashed text-muted-foreground">
                                                All types included
                                            </Badge>
                                        )}
                                        {!allTypesIncluded && visibleTypeBadges.map((name) => (
                                            <Badge key={name} variant="secondary" className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-100">
                                                {name}
                                            </Badge>
                                        ))}
                                        {!allTypesIncluded && extraTypeBadges > 0 && (
                                            <Badge variant="outline" className="border-dashed text-muted-foreground">
                                                +{extraTypeBadges} more
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
                                                <Button type="button" variant="ghost" size="sm" onClick={() => setSelectedStatuses([])}>
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

                                <div className="space-y-3">
                                    <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Service providers</span>
                                    <Popover open={providerSelectorOpen} onOpenChange={setProviderSelectorOpen}>
                                        <PopoverTrigger asChild>
                                            <Button type="button" variant="outline" className="w-full justify-between">
                                                <span className="flex items-center gap-2 text-sm">
                                                    {allProvidersIncluded ? 'All providers' : `${selectedProviders.length} selected`}
                                                </span>
                                                <Filter className="h-3.5 w-3.5 text-slate-400" />
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-80 p-0" align="start">
                                            <div className="flex items-center justify-between px-3 py-2">
                                                <Button type="button" variant="ghost" size="sm" onClick={() => setSelectedProviders([])}>
                                                    Clear
                                                </Button>
                                            </div>
                                            <Separator />
                                            <Command>
                                                <CommandList className="max-h-48">
                                                    <CommandEmpty>No providers found.</CommandEmpty>
                                                    <CommandGroup heading="Providers">
                                                        <CommandItem onSelect={() => setSelectedProviders([])} className="flex items-center gap-2">
                                                            <Checkbox checked={allProvidersIncluded} />
                                                            <span className="font-medium">All providers</span>
                                                            {allProvidersIncluded && <Badge variant="secondary" className="ml-auto">Active</Badge>}
                                                        </CommandItem>
                                                        {options.service_providers.map((provider) => {
                                                            const checked = selectedProviders.includes(provider);

                                                            return (
                                                                <CommandItem
                                                                    key={provider}
                                                                    onSelect={() => handleToggleProvider(provider)}
                                                                    className="flex items-center gap-2"
                                                                >
                                                                    <Checkbox checked={checked} />
                                                                    <span className="font-medium">{provider}</span>
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
                                        {allProvidersIncluded && (
                                            <Badge variant="outline" className="border-dashed text-muted-foreground">
                                                All providers included
                                            </Badge>
                                        )}
                                        {!allProvidersIncluded && selectedProviders.map((provider) => (
                                            <Badge key={provider} variant="secondary" className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-100">
                                                {provider}
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
                                <CardTitle className="text-lg font-semibold text-slate-900 dark:text-slate-50">Workshop Snapshot</CardTitle>
                                <CardDescription className="text-sm">Key indicators for maintenance costs and throughput.</CardDescription>
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
                                <CardTitle className="text-base font-semibold text-slate-900 dark:text-slate-50">Highlights</CardTitle>
                                <CardDescription className="text-sm">Top insights from the current selection.</CardDescription>
                            </CardHeader>
                            <CardContent className="grid gap-4 text-sm">
                                <div className="space-y-2">
                                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Highest spend trucks</p>
                                    {highlightData.highest_cost_trucks.length === 0 && (
                                        <p className="text-muted-foreground">No spend recorded in this range.</p>
                                    )}
                                    {highlightData.highest_cost_trucks.map((truck) => (
                                        <div key={truck.truck_id} className="flex items-center justify-between rounded-lg border border-slate-200/80 px-3 py-2 dark:border-slate-800/70">
                                            <div>
                                                <p className="font-semibold text-slate-900 dark:text-slate-100">{truck.plate}</p>
                                                <p className="text-xs text-muted-foreground">{formatCurrency(truck.total_cost)}</p>
                                            </div>
                                            <Wrench className="h-4 w-4 text-slate-500" />
                                        </div>
                                    ))}
                                </div>
                                <div className="space-y-2">
                                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Most overdue</p>
                                    {highlightData.most_overdue_trucks.length === 0 && (
                                        <p className="text-muted-foreground">No overdue maintenance detected.</p>
                                    )}
                                    {highlightData.most_overdue_trucks.map((truck) => (
                                        <div key={truck.truck_id} className="flex items-center justify-between rounded-lg border border-slate-200/80 px-3 py-2 dark:border-slate-800/70">
                                            <div>
                                                <p className="font-semibold text-slate-900 dark:text-slate-100">{truck.plate}</p>
                                                <p className="text-xs text-muted-foreground">{formatNumber(truck.overdue)} overdue&nbsp;• {formatOptionalNumber(truck.max_overdue_days, ' days')}</p>
                                            </div>
                                            <ShieldAlert className="h-4 w-4 text-rose-500" />
                                        </div>
                                    ))}
                                </div>
                                <div className="space-y-2">
                                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Costliest job types</p>
                                    {highlightData.costliest_types.length === 0 && (
                                        <p className="text-muted-foreground">No maintenance types found.</p>
                                    )}
                                    {highlightData.costliest_types.map((type) => (
                                        <div key={type.maintenance_type_id} className="flex items-center justify-between rounded-lg border border-slate-200/80 px-3 py-2 dark:border-slate-800/70">
                                            <div>
                                                <p className="font-semibold text-slate-900 dark:text-slate-100">{type.name}</p>
                                                <p className="text-xs text-muted-foreground">{formatCurrency(type.total_cost)}</p>
                                            </div>
                                            <DollarSign className="h-4 w-4 text-emerald-500" />
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border border-slate-200 bg-white/95 shadow-sm dark:border-slate-800/70 dark:bg-slate-900/70">
                            <CardHeader>
                                <CardTitle className="text-base font-semibold text-slate-900 dark:text-slate-50">Upcoming work orders</CardTitle>
                                <CardDescription className="text-sm">Scheduled tasks within the next 30 days.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-3 text-sm">
                                {upcoming.length === 0 && <p className="text-muted-foreground">No upcoming maintenance within the next 30 days.</p>}
                                {upcoming.map((item) => (
                                    <div key={item.id} className="flex flex-col gap-1 rounded-lg border border-slate-200/80 px-3 py-2 dark:border-slate-800/70">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{item.scheduled_date ?? 'TBD'}</span>
                                            {item.days_until !== null && (
                                                <Badge variant="outline" className="text-xs">
                                                    {item.days_until} days
                                                </Badge>
                                            )}
                                        </div>
                                        <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                                            {item.truck?.plate ?? 'Unassigned truck'}
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                            {item.maintenance_type?.name ?? 'General maintenance'}
                                            {item.service_provider ? ` • ${item.service_provider}` : ''}
                                        </div>
                                        <div className="text-xs font-medium text-slate-600 dark:text-slate-300">
                                            {formatOptionalCurrency(item.estimated_cost)}
                                        </div>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>

                        <Card className="border border-slate-200 bg-white/95 shadow-sm dark:border-slate-800/70 dark:bg-slate-900/70">
                            <CardHeader>
                                <CardTitle className="text-base font-semibold text-slate-900 dark:text-slate-50">Monthly trend</CardTitle>
                                <CardDescription className="text-sm">Maintenance volume and spend per month.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-3 text-sm">
                                {trend.length === 0 && <p className="text-muted-foreground">No trend data for the selected filters.</p>}
                                {trend.map((row) => (
                                    <div key={row.period} className="flex flex-col gap-1 rounded-lg border border-slate-200/80 px-3 py-2 dark:border-slate-800/70">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{row.period}</span>
                                            <Badge variant="outline" className="text-xs">
                                                {formatNumber(row.records)} tasks
                                            </Badge>
                                        </div>
                                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                                            <span>Completed</span>
                                            <span className="font-semibold text-slate-900 dark:text-slate-100">{formatNumber(row.completed)}</span>
                                        </div>
                                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                                            <span>Cost</span>
                                            <span className="font-semibold text-slate-900 dark:text-slate-100">{formatCurrency(row.total_cost)}</span>
                                        </div>
                                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                                            <span>Avg cost / task</span>
                                            <span className="font-semibold text-slate-900 dark:text-slate-100">{formatOptionalCurrency(row.average_cost_per_record)}</span>
                                        </div>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    </section>

                    <section className="grid gap-6">
                        <Card className="border border-slate-200 bg-white/95 shadow-sm dark:border-slate-800/70 dark:bg-slate-900/70">
                            <CardHeader>
                                <CardTitle className="text-lg font-semibold text-slate-900 dark:text-slate-50">Truck breakdown</CardTitle>
                                <CardDescription className="text-sm">
                                    Cost and completion performance by asset.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="max-h-[60vh] overflow-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="sticky top-0 z-10 bg-white/95 backdrop-blur dark:bg-slate-900/80">
                                                <TableHead>Truck</TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead className="text-right">Tasks</TableHead>
                                                <TableHead className="text-right">Completed</TableHead>
                                                <TableHead className="text-right">Overdue</TableHead>
                                                <TableHead className="text-right">Completion %</TableHead>
                                                <TableHead className="text-right">Total Cost</TableHead>
                                                <TableHead className="text-right">Open Cost</TableHead>
                                                <TableHead className="text-right">Avg Cost</TableHead>
                                                <TableHead className="text-right">Avg Completion (days)</TableHead>
                                                <TableHead className="text-right">Next Scheduled</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {breakdown.length === 0 && (
                                                <TableRow>
                                                    <TableCell colSpan={11} className="py-10 text-center text-muted-foreground">
                                                        No maintenance activity for the selected criteria.
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                            {breakdown.map((truck) => (
                                                <TableRow key={truck.truck_id}>
                                                    <TableCell className="font-semibold text-slate-900 dark:text-slate-100">{truck.plate}</TableCell>
                                                    <TableCell className="capitalize text-muted-foreground">{truck.status ?? '—'}</TableCell>
                                                    <TableCell className="text-right font-medium">{formatNumber(truck.records)}</TableCell>
                                                    <TableCell className="text-right">{formatNumber(truck.completed)}</TableCell>
                                                    <TableCell className="text-right">{formatNumber(truck.overdue)}</TableCell>
                                                    <TableCell className="text-right">{formatOptionalPercent(truck.completion_rate_pct)}</TableCell>
                                                    <TableCell className="text-right">{formatCurrency(truck.total_cost)}</TableCell>
                                                    <TableCell className="text-right">{formatCurrency(truck.open_cost)}</TableCell>
                                                    <TableCell className="text-right">{formatOptionalCurrency(truck.average_cost)}</TableCell>
                                                    <TableCell className="text-right">{formatOptionalNumber(truck.average_completion_days)}</TableCell>
                                                    <TableCell className="text-right">{truck.next_scheduled_at ?? '—'}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </CardContent>
                            <CardFooter className="flex flex-wrap items-center gap-4 border-t border-slate-200/80 bg-slate-50/60 px-4 py-3 text-sm dark:border-slate-800/70 dark:bg-slate-900/40">
                                <div className="flex items-center gap-2">
                                    <Badge variant="outline" className="bg-white/80 text-xs text-slate-600 dark:bg-slate-900/80 dark:text-slate-300">
                                        Tasks: {formatNumber(totals?.records ?? 0)}
                                    </Badge>
                                    <Badge variant="outline" className="bg-white/80 text-xs text-slate-600 dark:bg-slate-900/80 dark:text-slate-300">
                                        Trucks: {formatNumber(totals?.truck_count ?? 0)}
                                    </Badge>
                                </div>
                                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                    <span className="flex items-center gap-1">
                                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                                        Completed: {formatNumber(totals?.completed ?? 0)}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <AlertTriangle className="h-3.5 w-3.5 text-rose-500" />
                                        Overdue: {formatNumber(totals?.overdue ?? 0)}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <DollarSign className="h-3.5 w-3.5 text-slate-500" />
                                        Open cost: {formatCurrency(totals?.open_cost ?? 0)}
                                    </span>
                                </div>
                            </CardFooter>
                        </Card>

                        <Card className="border border-slate-200 bg-white/95 shadow-sm dark:border-slate-800/70 dark:bg-slate-900/70">
                            <CardHeader>
                                <CardTitle className="text-lg font-semibold text-slate-900 dark:text-slate-50">Maintenance type breakdown</CardTitle>
                                <CardDescription className="text-sm">
                                    Frequency and spend per maintenance type.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="max-h-[50vh] overflow-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="sticky top-0 z-10 bg-white/95 backdrop-blur dark:bg-slate-900/80">
                                                <TableHead>Type</TableHead>
                                                <TableHead>Category</TableHead>
                                                <TableHead className="text-right">Tasks</TableHead>
                                                <TableHead className="text-right">Completed</TableHead>
                                                <TableHead className="text-right">Overdue</TableHead>
                                                <TableHead className="text-right">Completion %</TableHead>
                                                <TableHead className="text-right">Total Cost</TableHead>
                                                <TableHead className="text-right">Avg Cost</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {typeBreakdown.length === 0 && (
                                                <TableRow>
                                                    <TableCell colSpan={8} className="py-8 text-center text-muted-foreground">
                                                        No maintenance types found for the selected filters.
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                            {typeBreakdown.map((type) => (
                                                <TableRow key={type.maintenance_type_id}>
                                                    <TableCell className="font-semibold text-slate-900 dark:text-slate-100">{type.name}</TableCell>
                                                    <TableCell className="capitalize text-muted-foreground">{type.category ?? '—'}</TableCell>
                                                    <TableCell className="text-right font-medium">{formatNumber(type.records)}</TableCell>
                                                    <TableCell className="text-right">{formatNumber(type.completed)}</TableCell>
                                                    <TableCell className="text-right">{formatNumber(type.overdue)}</TableCell>
                                                    <TableCell className="text-right">{formatOptionalPercent(type.completion_rate_pct)}</TableCell>
                                                    <TableCell className="text-right">{formatCurrency(type.total_cost)}</TableCell>
                                                    <TableCell className="text-right">{formatOptionalCurrency(type.average_cost)}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </CardContent>
                            <CardFooter className="flex flex-wrap items-center gap-4 border-t border-slate-200/80 bg-slate-50/60 px-4 py-3 text-sm dark:border-slate-800/70 dark:bg-slate-900/40">
                                <div className="flex items-center gap-2">
                                    <Badge variant="outline" className="bg-white/80 text-xs text-slate-600 dark:bg-slate-900/80 dark:text-slate-300">
                                        Types: {formatNumber(totals?.type_count ?? 0)}
                                    </Badge>
                                </div>
                                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                    <span className="flex items-center gap-1">
                                        <DollarSign className="h-3.5 w-3.5 text-emerald-500" />
                                        Spend share tracked: {formatOptionalPercent(summary?.share_of_cost_tracked_types_pct ?? null)}
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



