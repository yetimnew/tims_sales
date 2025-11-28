import { useMemo, useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import type { LucideIcon } from 'lucide-react';
import { BarChart3, ChevronDown, ChevronUp, CircleDollarSign, ClipboardList, Download, FileDigit, FileSpreadsheet, FileType2, Filter, Flame, MapPin, PackageCheck, RefreshCcw, Route, Search, TrendingUp, Truck, User } from 'lucide-react';

interface OptionBase {
    id: number;
    name: string;
    status?: string | null;
}

interface OperationOption {
    id: number;
    code: string;
    status?: string | null;
    customer?: string | null;
}

interface DestinationOption extends OptionBase {}

interface DriverOption extends OptionBase {}

interface TruckOption extends OptionBase {
    plate: string;
}

interface PerformanceRow {
    id: number;
    fo_number: string;
    dispatch_date?: string | null;
    driver_name: string;
    truck_plate: string;
    vehicle_type?: string | null;
    operation_code: string;
    customer_name?: string | null;
    origin_name: string;
    destination_name: string;
    tonnage: number;
    ton_km: number;
    distance_wc: number;
    distance_wo: number;
    distance_total: number;
    fuel_litres: number;
    fuel_cost: number;
    perdiem: number;
    work_on_going: number;
    other_cost: number;
    expense: number;
    revenue: number;
    profit: number;
    margin_percent: number | null;
}

interface Summary {
    records: number;
    tonnage: number;
    ton_km: number;
    distance_wc: number;
    distance_wo: number;
    distance_total: number;
    fuel_litres: number;
    fuel_cost: number;
    perdiem: number;
    work_on_going: number;
    other_cost: number;
    expense: number;
    revenue: number;
    profit: number;
    margin_percent: number | null;
}

interface Filters {
    from?: string | null;
    to?: string | null;
    driver_ids?: number[];
    truck_ids?: number[];
    operation_ids?: number[];
    destination_ids?: number[];
    limit?: number;
}

interface PerformanceAllProps {
    filters: Filters;
    rows: PerformanceRow[];
    summary: Summary;
    options: {
        drivers: DriverOption[];
        trucks: TruckOption[];
        operations: OperationOption[];
        destinations: DestinationOption[];
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Reports', href: '/reports/performance-all' },
    { title: 'Performance (All)', href: '/reports/performance-all' },
];

const formatDecimal = (value: number) => value.toLocaleString(undefined, { maximumFractionDigits: 2, minimumFractionDigits: 2 });

const formatInteger = (value: number) => value.toLocaleString();

const formatCurrency = (value: number) => new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(value);

const formatPercentage = (value: number | null) => (value === null ? '—' : `${value.toFixed(2)}%`);

const toParamsArray = (key: string, values: number[], params: URLSearchParams) => {
    values.forEach((value) => params.append(`${key}[]`, String(value)));
};

const getFinancialTone = (value: number): string => {
    if (value > 0) {
        return 'text-emerald-600 dark:text-emerald-400';
    }

    if (value < 0) {
        return 'text-rose-600 dark:text-rose-400';
    }

    return 'text-slate-600 dark:text-slate-300';
};

const getMarginChipClass = (value: number | null): string => {
    if (value === null) {
        return 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400';
    }

    if (value > 0) {
        return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200';
    }

    if (value < 0) {
        return 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-200';
    }

    return 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-200';
};

export default function PerformanceAll({ filters, rows = [], summary, options }: PerformanceAllProps) {
    const driverOptions = Array.isArray(options?.drivers) ? options.drivers : [];
    const truckOptions = Array.isArray(options?.trucks) ? options.trucks : [];
    const operationOptions = Array.isArray(options?.operations) ? options.operations : [];
    const destinationOptions = Array.isArray(options?.destinations) ? options.destinations : [];

    const safeRows = Array.isArray(rows) ? rows : [];

    const [from, setFrom] = useState(filters?.from ?? '');
    const [to, setTo] = useState(filters?.to ?? '');
    const [limit, setLimit] = useState<number>(filters?.limit ?? 200);
    const [selectedDrivers, setSelectedDrivers] = useState<number[]>(filters?.driver_ids ?? []);
    const [selectedTrucks, setSelectedTrucks] = useState<number[]>(filters?.truck_ids ?? []);
    const [selectedOperations, setSelectedOperations] = useState<number[]>(filters?.operation_ids ?? []);
    const [selectedDestinations, setSelectedDestinations] = useState<number[]>(filters?.destination_ids ?? []);

    const [driverSearch, setDriverSearch] = useState('');
    const [truckSearch, setTruckSearch] = useState('');
    const [operationSearch, setOperationSearch] = useState('');
    const [destinationSearch, setDestinationSearch] = useState('');

    const [filtersOpen, setFiltersOpen] = useState(false);
    const [driverSelectorOpen, setDriverSelectorOpen] = useState(false);
    const [truckSelectorOpen, setTruckSelectorOpen] = useState(false);
    const [operationSelectorOpen, setOperationSelectorOpen] = useState(false);
    const [destinationSelectorOpen, setDestinationSelectorOpen] = useState(false);

    const noDriverFilter = selectedDrivers.length === 0;
    const noTruckFilter = selectedTrucks.length === 0;
    const noOperationFilter = selectedOperations.length === 0;
    const noDestinationFilter = selectedDestinations.length === 0;

    const selectedDriverNames = useMemo(
        () => driverOptions.filter((option) => selectedDrivers.includes(option.id)).map((option) => option.name ?? 'Unassigned'),
        [driverOptions, selectedDrivers],
    );

    const selectedTruckPlates = useMemo(
        () => truckOptions.filter((option) => selectedTrucks.includes(option.id)).map((option) => option.plate ?? '—'),
        [truckOptions, selectedTrucks],
    );

    const selectedOperationCodes = useMemo(
        () => operationOptions.filter((option) => selectedOperations.includes(option.id)).map((option) => option.code ?? '—'),
        [operationOptions, selectedOperations],
    );

    const selectedDestinationNames = useMemo(
        () => destinationOptions.filter((option) => selectedDestinations.includes(option.id)).map((option) => option.name ?? '—'),
        [destinationOptions, selectedDestinations],
    );

    const filteredDrivers = useMemo(() => {
        if (!driverSearch.trim()) return driverOptions;
        const term = driverSearch.trim().toLowerCase();
        return driverOptions.filter((option) => (option.name ?? '').toLowerCase().includes(term));
    }, [driverSearch, driverOptions]);

    const filteredTrucks = useMemo(() => {
        if (!truckSearch.trim()) return truckOptions;
        const term = truckSearch.trim().toLowerCase();
        return truckOptions.filter((option) => (option.plate ?? '').toLowerCase().includes(term));
    }, [truckSearch, truckOptions]);

    const filteredOperations = useMemo(() => {
        if (!operationSearch.trim()) return operationOptions;
        const term = operationSearch.trim().toLowerCase();
        return operationOptions.filter((option) => option.code.toLowerCase().includes(term) || (option.customer ?? '').toLowerCase().includes(term));
    }, [operationSearch, operationOptions]);

    const filteredDestinations = useMemo(() => {
        if (!destinationSearch.trim()) return destinationOptions;
        const term = destinationSearch.trim().toLowerCase();
        return destinationOptions.filter((option) => option.name.toLowerCase().includes(term));
    }, [destinationSearch, destinationOptions]);

    const activeFilterCount = useMemo(() => {
        let count = 0;

        if (from && from !== (filters?.from ?? '')) count += 1;
        if (to && to !== (filters?.to ?? '')) count += 1;
        if (limit !== (filters?.limit ?? 200)) count += 1;
        if (selectedDrivers.length > 0) count += 1;
        if (selectedTrucks.length > 0) count += 1;
        if (selectedOperations.length > 0) count += 1;
        if (selectedDestinations.length > 0) count += 1;

        return count;
    }, [from, to, limit, selectedDrivers, selectedTrucks, selectedOperations, selectedDestinations, filters?.from, filters?.to, filters?.limit]);

    const kpiCards = useMemo<Array<{ label: string; value: string; icon: LucideIcon; tone: string }>>(
        () => [
            {
                label: 'Dispatches',
                value: formatInteger(summary?.records ?? safeRows.length),
                icon: ClipboardList,
                tone: 'bg-sky-100 text-sky-600 dark:bg-sky-500/20 dark:text-sky-200',
            },
            {
                label: 'Total tonnage (MT)',
                value: formatDecimal(summary?.tonnage ?? 0),
                icon: BarChart3,
                tone: 'bg-violet-100 text-violet-600 dark:bg-violet-500/20 dark:text-violet-200',
            },
            {
                label: 'Distance (km)',
                value: formatDecimal(summary?.distance_total ?? 0),
                icon: Route,
                tone: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-200',
            },
            {
                label: 'Fuel (L)',
                value: formatDecimal(summary?.fuel_litres ?? 0),
                icon: Flame,
                tone: 'bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-200',
            },
            {
                label: 'Revenue',
                value: formatCurrency(summary?.revenue ?? 0),
                icon: CircleDollarSign,
                tone: 'bg-cyan-100 text-cyan-600 dark:bg-cyan-500/20 dark:text-cyan-200',
            },
            {
                label: 'Margin %',
                value: formatPercentage(summary?.margin_percent ?? null),
                icon: TrendingUp,
                tone: 'bg-rose-100 text-rose-600 dark:bg-rose-500/20 dark:text-rose-200',
            },
        ],
        [safeRows.length, summary],
    );

    const toggleSelection = (current: number[], id: number, setState: (value: number[]) => void) => {
        setState(current.includes(id) ? current.filter((value) => value !== id) : [...current, id]);
    };

    const handleApplyFilters = () => {
        setFiltersOpen(false);
        setDriverSelectorOpen(false);
        setTruckSelectorOpen(false);
        setOperationSelectorOpen(false);
        setDestinationSelectorOpen(false);

        const params: Record<string, unknown> = {
            from,
            to,
            limit,
        };

        if (selectedDrivers.length > 0) params.driver_ids = selectedDrivers;
        if (selectedTrucks.length > 0) params.truck_ids = selectedTrucks;
        if (selectedOperations.length > 0) params.operation_ids = selectedOperations;
        if (selectedDestinations.length > 0) params.destination_ids = selectedDestinations;

        router.get('/reports/performance-all', params, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleReset = () => {
        setFrom(filters?.from ?? '');
        setTo(filters?.to ?? '');
        setLimit(filters?.limit ?? 200);
        setSelectedDrivers(filters?.driver_ids ?? []);
        setSelectedTrucks(filters?.truck_ids ?? []);
        setSelectedOperations(filters?.operation_ids ?? []);
        setSelectedDestinations(filters?.destination_ids ?? []);
        setFiltersOpen(false);
        setDriverSelectorOpen(false);
        setTruckSelectorOpen(false);
        setOperationSelectorOpen(false);
        setDestinationSelectorOpen(false);
        router.get('/reports/performance-all', {}, { preserveState: false, preserveScroll: true });
    };

    const handleExport = (format: 'csv' | 'xlsx' | 'pdf') => {
        const params = new URLSearchParams();

        if (from) params.set('from', from);
        if (to) params.set('to', to);
        if (limit) params.set('limit', String(limit));

        if (selectedDrivers.length > 0) toParamsArray('driver_ids', selectedDrivers, params);
        if (selectedTrucks.length > 0) toParamsArray('truck_ids', selectedTrucks, params);
        if (selectedOperations.length > 0) toParamsArray('operation_ids', selectedOperations, params);
        if (selectedDestinations.length > 0) toParamsArray('destination_ids', selectedDestinations, params);

        const query = params.toString();
        const url = `/reports/performance-all/export/${format}${query ? `?${query}` : ''}`;
        window.location.href = url;
    };

    const appliedFrom = filters?.from ?? '';
    const appliedTo = filters?.to ?? '';
    const appliedDriverCount = filters?.driver_ids?.length ?? 0;
    const appliedTruckCount = filters?.truck_ids?.length ?? 0;
    const appliedOperationCount = filters?.operation_ids?.length ?? 0;
    const appliedDestinationCount = filters?.destination_ids?.length ?? 0;
    const summaryMargin = summary?.margin_percent ?? null;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Performance (All)" />
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-slate-100/60 dark:bg-slate-900/40">
                <div className="flex flex-1 flex-col gap-6 overflow-y-auto p-4 pb-10 sm:p-6 lg:p-10">
                    <header className="rounded-2xl border border-slate-200 bg-white/95 px-6 py-6 shadow-sm backdrop-blur dark:border-slate-800/70 dark:bg-slate-900/70">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                            <div className="space-y-2">
                                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500 dark:text-slate-400">Performance Intelligence</p>
                                <h1 className="text-3xl font-semibold text-slate-900 dark:text-slate-50">Performance (All Dispatches)</h1>
                                <p className="max-w-3xl text-sm text-slate-600 dark:text-slate-300">
                                    Review every dispatch outcome across drivers, trucks, operations, and destinations. Refine the window, focus on specific assets, and export ready-to-share reports for your operations team.
                                </p>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                                <Dialog open={filtersOpen} onOpenChange={setFiltersOpen}>
                                    <DialogTrigger asChild>
                                        <Button type="button" variant="outline" className="gap-2">
                                            <Filter className="h-4 w-4" />
                                            Filters
                                            {activeFilterCount > 0 && <Badge variant="secondary" className="h-5 min-w-[2rem] justify-center px-2 text-xs font-semibold">{activeFilterCount}</Badge>}
                                            {filtersOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="w-full sm:max-w-6xl lg:max-w-7xl sm:rounded-2xl">
                                        <DialogHeader className="text-left">
                                            <DialogTitle>Filter dispatch performance</DialogTitle>
                                            <DialogDescription>Adjust the date window, asset selections, and other filters before regenerating the report.</DialogDescription>
                                        </DialogHeader>
                                        <div className="grid gap-6">
                                            <div className="grid gap-8 rounded-xl border border-slate-200 bg-white/95 p-6 shadow-sm dark:border-slate-800/70 dark:bg-slate-900/70">
                                                <div className="flex flex-wrap items-start gap-6">
                                                    <div className="flex min-w-[260px] flex-1 flex-col gap-3">
                                                        <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Date window</span>
                                                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                                            <div className="flex flex-col gap-2">
                                                                <Input type="date" value={from} onChange={(event) => setFrom(event.target.value)} />
                                                                <p className="text-xs text-muted-foreground">Start date.</p>
                                                            </div>
                                                            <div className="flex flex-col gap-2">
                                                                <Input type="date" value={to} onChange={(event) => setTo(event.target.value)} />
                                                                <p className="text-xs text-muted-foreground">End date.</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex min-w-[220px] flex-col gap-3">
                                                        <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Result limit</span>
                                                        <Input
                                                            type="number"
                                                            min={50}
                                                            max={5000}
                                                            step={50}
                                                            value={limit}
                                                            onChange={(event) => setLimit(Number(event.target.value))}
                                                        />
                                                        <p className="text-xs text-muted-foreground">Dispatch cap for results.</p>
                                                    </div>
                                                </div>
                                                <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
                                                    <div className="flex flex-col gap-3">
                                                        <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Drivers</span>
                                                        <Popover open={driverSelectorOpen} onOpenChange={setDriverSelectorOpen}>
                                                            <PopoverTrigger asChild>
                                                                <Button type="button" variant="outline" className="w-full justify-between">
                                                                    <span className="flex items-center gap-2 text-sm">
                                                                        <User className="h-4 w-4 text-slate-500" />
                                                                        {noDriverFilter ? 'All drivers' : `${selectedDrivers.length} selected`}
                                                                    </span>
                                                                    <Filter className="h-3.5 w-3.5 text-slate-400" />
                                                                </Button>
                                                            </PopoverTrigger>
                                                            <PopoverContent className="w-80 p-0" align="start">
                                                                <div className="flex items-center justify-between px-3 py-2">
                                                                    <div className="flex items-center gap-2">
                                                                        <Button
                                                                            type="button"
                                                                            variant="ghost"
                                                                            size="sm"
                                                                            onClick={() => setSelectedDrivers(noDriverFilter || selectedDrivers.length === driverOptions.length ? [] : driverOptions.map((option) => option.id))}
                                                                        >
                                                                            {selectedDrivers.length === driverOptions.length && driverOptions.length > 0 ? 'Unselect all' : 'Select all'}
                                                                        </Button>
                                                                        <Button type="button" variant="ghost" size="sm" onClick={() => setSelectedDrivers([])}>
                                                                            Clear
                                                                        </Button>
                                                                    </div>
                                                                </div>
                                                                <Separator />
                                                                <Command>
                                                                    <div className="flex items-center px-3 py-2">
                                                                        <Search className="mr-2 h-4 w-4 text-muted-foreground" />
                                                                        <CommandInput placeholder="Search driver..." value={driverSearch} onValueChange={setDriverSearch} />
                                                                    </div>
                                                                    <CommandList className="max-h-64">
                                                                        <CommandEmpty>No drivers found.</CommandEmpty>
                                                                        <CommandGroup heading="Drivers">
                                                                            <CommandItem onSelect={() => setSelectedDrivers([])} className="flex items-center gap-2">
                                                                                <Checkbox checked={noDriverFilter} />
                                                                                <span className="font-medium">All drivers</span>
                                                                                {noDriverFilter && <Badge variant="secondary" className="ml-auto">Active</Badge>}
                                                                            </CommandItem>
                                                                            {filteredDrivers.map((option) => {
                                                                                const checked = selectedDrivers.includes(option.id);

                                                                                return (
                                                                                    <CommandItem key={option.id} onSelect={() => toggleSelection(selectedDrivers, option.id, setSelectedDrivers)} className="flex items-center gap-2">
                                                                                        <Checkbox checked={checked} />
                                                                                        <span className="font-medium">{option.name ?? 'Unassigned'}</span>
                                                                                        {option.status && <Badge variant="outline" className="ml-auto border-dashed text-xs">{option.status}</Badge>}
                                                                                    </CommandItem>
                                                                                );
                                                                            })}
                                                                        </CommandGroup>
                                                                    </CommandList>
                                                                </Command>
                                                            </PopoverContent>
                                                        </Popover>
                                                        <div className="flex flex-wrap gap-2">
                                                            {noDriverFilter && <Badge variant="outline" className="border-dashed text-muted-foreground">All drivers included</Badge>}
                                                            {!noDriverFilter && selectedDriverNames.slice(0, 4).map((name) => (
                                                                <Badge key={name} variant="secondary" className="bg-slate-100 text-slate-700">
                                                                    {name}
                                                                </Badge>
                                                            ))}
                                                            {!noDriverFilter && selectedDriverNames.length > 4 && (
                                                                <Badge variant="outline" className="border-dashed text-muted-foreground">+{selectedDriverNames.length - 4} more</Badge>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="flex flex-col gap-3">
                                                        <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Trucks</span>
                                                        <Popover open={truckSelectorOpen} onOpenChange={setTruckSelectorOpen}>
                                                            <PopoverTrigger asChild>
                                                                <Button type="button" variant="outline" className="w-full justify-between">
                                                                    <span className="flex items-center gap-2 text-sm">
                                                                        <Truck className="h-4 w-4 text-slate-500" />
                                                                        {noTruckFilter ? 'All trucks' : `${selectedTrucks.length} selected`}
                                                                    </span>
                                                                    <Filter className="h-3.5 w-3.5 text-slate-400" />
                                                                </Button>
                                                            </PopoverTrigger>
                                                            <PopoverContent className="w-80 p-0" align="start">
                                                                <div className="flex items-center justify-between px-3 py-2">
                                                                    <div className="flex items-center gap-2">
                                                                        <Button
                                                                            type="button"
                                                                            variant="ghost"
                                                                            size="sm"
                                                                            onClick={() => setSelectedTrucks(noTruckFilter || selectedTrucks.length === truckOptions.length ? [] : truckOptions.map((option) => option.id))}
                                                                        >
                                                                            {selectedTrucks.length === truckOptions.length && truckOptions.length > 0 ? 'Unselect all' : 'Select all'}
                                                                        </Button>
                                                                        <Button type="button" variant="ghost" size="sm" onClick={() => setSelectedTrucks([])}>
                                                                            Clear
                                                                        </Button>
                                                                    </div>
                                                                </div>
                                                                <Separator />
                                                                <Command>
                                                                    <div className="flex items-center px-3 py-2">
                                                                        <Search className="mr-2 h-4 w-4 text-muted-foreground" />
                                                                        <CommandInput placeholder="Search truck..." value={truckSearch} onValueChange={setTruckSearch} />
                                                                    </div>
                                                                    <CommandList className="max-h-64">
                                                                        <CommandEmpty>No trucks found.</CommandEmpty>
                                                                        <CommandGroup heading="Trucks">
                                                                            <CommandItem onSelect={() => setSelectedTrucks([])} className="flex items-center gap-2">
                                                                                <Checkbox checked={noTruckFilter} />
                                                                                <span className="font-medium">All trucks</span>
                                                                                {noTruckFilter && <Badge variant="secondary" className="ml-auto">Active</Badge>}
                                                                            </CommandItem>
                                                                            {filteredTrucks.map((option) => {
                                                                                const checked = selectedTrucks.includes(option.id);

                                                                                return (
                                                                                    <CommandItem key={option.id} onSelect={() => toggleSelection(selectedTrucks, option.id, setSelectedTrucks)} className="flex items-center gap-2">
                                                                                        <Checkbox checked={checked} />
                                                                                        <span className="font-medium">{option.plate ?? '—'}</span>
                                                                                        {option.status && <Badge variant="outline" className="ml-auto border-dashed text-xs">{option.status}</Badge>}
                                                                                    </CommandItem>
                                                                                );
                                                                            })}
                                                                        </CommandGroup>
                                                                    </CommandList>
                                                                </Command>
                                                            </PopoverContent>
                                                        </Popover>
                                                        <div className="flex flex-wrap gap-2">
                                                            {noTruckFilter && <Badge variant="outline" className="border-dashed text-muted-foreground">All trucks included</Badge>}
                                                            {!noTruckFilter && selectedTruckPlates.slice(0, 4).map((plate) => (
                                                                <Badge key={plate} variant="secondary" className="bg-slate-100 text-slate-700">
                                                                    {plate}
                                                                </Badge>
                                                            ))}
                                                            {!noTruckFilter && selectedTruckPlates.length > 4 && (
                                                                <Badge variant="outline" className="border-dashed text-muted-foreground">+{selectedTruckPlates.length - 4} more</Badge>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="flex flex-col gap-3">
                                                        <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Operations</span>
                                                        <Popover open={operationSelectorOpen} onOpenChange={setOperationSelectorOpen}>
                                                            <PopoverTrigger asChild>
                                                                <Button type="button" variant="outline" className="w-full justify-between">
                                                                    <span className="flex items-center gap-2 text-sm">
                                                                        <PackageCheck className="h-4 w-4 text-slate-500" />
                                                                        {noOperationFilter ? 'All operations' : `${selectedOperations.length} selected`}
                                                                    </span>
                                                                    <Filter className="h-3.5 w-3.5 text-slate-400" />
                                                                </Button>
                                                            </PopoverTrigger>
                                                            <PopoverContent className="w-80 p-0" align="start">
                                                                <div className="flex items-center justify-between px-3 py-2">
                                                                    <div className="flex items-center gap-2">
                                                                        <Button
                                                                            type="button"
                                                                            variant="ghost"
                                                                            size="sm"
                                                                            onClick={() => setSelectedOperations(noOperationFilter || selectedOperations.length === operationOptions.length ? [] : operationOptions.map((option) => option.id))}
                                                                        >
                                                                            {selectedOperations.length === operationOptions.length && operationOptions.length > 0 ? 'Unselect all' : 'Select all'}
                                                                        </Button>
                                                                        <Button type="button" variant="ghost" size="sm" onClick={() => setSelectedOperations([])}>
                                                                            Clear
                                                                        </Button>
                                                                    </div>
                                                                </div>
                                                                <Separator />
                                                                <Command>
                                                                    <div className="flex items-center px-3 py-2">
                                                                        <Search className="mr-2 h-4 w-4 text-muted-foreground" />
                                                                        <CommandInput placeholder="Search operation..." value={operationSearch} onValueChange={setOperationSearch} />
                                                                    </div>
                                                                    <CommandList className="max-h-64">
                                                                        <CommandEmpty>No operations found.</CommandEmpty>
                                                                        <CommandGroup heading="Operations">
                                                                            <CommandItem onSelect={() => setSelectedOperations([])} className="flex items-center gap-2">
                                                                                <Checkbox checked={noOperationFilter} />
                                                                                <span className="font-medium">All operations</span>
                                                                            </CommandItem>
                                                                            {filteredOperations.map((option) => {
                                                                                const checked = selectedOperations.includes(option.id);

                                                                                return (
                                                                                    <CommandItem key={option.id} onSelect={() => toggleSelection(selectedOperations, option.id, setSelectedOperations)} className="flex items-center gap-2">
                                                                                        <Checkbox checked={checked} />
                                                                                        <div className="flex flex-col">
                                                                                            <span className="font-medium">{option.code}</span>
                                                                                            {option.customer && <span className="text-[11px] text-muted-foreground">{option.customer}</span>}
                                                                                        </div>
                                                                                        {option.status && <Badge variant="outline" className="ml-auto border-dashed text-xs">{option.status}</Badge>}
                                                                                    </CommandItem>
                                                                                );
                                                                            })}
                                                                        </CommandGroup>
                                                                    </CommandList>
                                                                </Command>
                                                            </PopoverContent>
                                                        </Popover>
                                                        <div className="flex flex-wrap gap-2">
                                                            {noOperationFilter && <Badge variant="outline" className="border-dashed text-muted-foreground">All operations included</Badge>}
                                                            {!noOperationFilter && selectedOperationCodes.slice(0, 4).map((code) => (
                                                                <Badge key={code} variant="secondary" className="bg-slate-100 text-slate-700">
                                                                    {code}
                                                                </Badge>
                                                            ))}
                                                            {!noOperationFilter && selectedOperationCodes.length > 4 && (
                                                                <Badge variant="outline" className="border-dashed text-muted-foreground">+{selectedOperationCodes.length - 4} more</Badge>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="flex flex-col gap-3">
                                                        <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Destinations</span>
                                                        <Popover open={destinationSelectorOpen} onOpenChange={setDestinationSelectorOpen}>
                                                            <PopoverTrigger asChild>
                                                                <Button type="button" variant="outline" className="w-full justify-between">
                                                                    <span className="flex items-center gap-2 text-sm">
                                                                        <MapPin className="h-4 w-4 text-slate-500" />
                                                                        {noDestinationFilter ? 'All destinations' : `${selectedDestinations.length} selected`}
                                                                    </span>
                                                                    <Filter className="h-3.5 w-3.5 text-slate-400" />
                                                                </Button>
                                                            </PopoverTrigger>
                                                            <PopoverContent className="w-80 p-0" align="start">
                                                                <div className="flex items-center justify-between px-3 py-2">
                                                                    <div className="flex items-center gap-2">
                                                                        <Button
                                                                            type="button"
                                                                            variant="ghost"
                                                                            size="sm"
                                                                            onClick={() => setSelectedDestinations(noDestinationFilter || selectedDestinations.length === destinationOptions.length ? [] : destinationOptions.map((option) => option.id))}
                                                                        >
                                                                            {selectedDestinations.length === destinationOptions.length && destinationOptions.length > 0 ? 'Unselect all' : 'Select all'}
                                                                        </Button>
                                                                        <Button type="button" variant="ghost" size="sm" onClick={() => setSelectedDestinations([])}>
                                                                            Clear
                                                                        </Button>
                                                                    </div>
                                                                </div>
                                                                <Separator />
                                                                <Command>
                                                                    <div className="flex items-center px-3 py-2">
                                                                        <Search className="mr-2 h-4 w-4 text-muted-foreground" />
                                                                        <CommandInput placeholder="Search destination..." value={destinationSearch} onValueChange={setDestinationSearch} />
                                                                    </div>
                                                                    <CommandList className="max-h-64">
                                                                        <CommandEmpty>No destinations found.</CommandEmpty>
                                                                        <CommandGroup heading="Destinations">
                                                                            <CommandItem onSelect={() => setSelectedDestinations([])} className="flex items-center gap-2">
                                                                                <Checkbox checked={noDestinationFilter} />
                                                                                <span className="font-medium">All destinations</span>
                                                                            </CommandItem>
                                                                            {filteredDestinations.map((option) => {
                                                                                const checked = selectedDestinations.includes(option.id);

                                                                                return (
                                                                                    <CommandItem key={option.id} onSelect={() => toggleSelection(selectedDestinations, option.id, setSelectedDestinations)} className="flex items-center gap-2">
                                                                                        <Checkbox checked={checked} />
                                                                                        <span className="font-medium">{option.name}</span>
                                                                                        {option.status && <Badge variant="outline" className="ml-auto border-dashed text-xs">{option.status}</Badge>}
                                                                                    </CommandItem>
                                                                                );
                                                                            })}
                                                                        </CommandGroup>
                                                                    </CommandList>
                                                                </Command>
                                                            </PopoverContent>
                                                        </Popover>
                                                        <div className="flex flex-wrap gap-2">
                                                            {noDestinationFilter && <Badge variant="outline" className="border-dashed text-muted-foreground">All destinations included</Badge>}
                                                            {!noDestinationFilter && selectedDestinationNames.slice(0, 4).map((name) => (
                                                                <Badge key={name} variant="secondary" className="bg-slate-100 text-slate-700">
                                                                    {name}
                                                                </Badge>
                                                            ))}
                                                            {!noDestinationFilter && selectedDestinationNames.length > 4 && (
                                                                <Badge variant="outline" className="border-dashed text-muted-foreground">+{selectedDestinationNames.length - 4} more</Badge>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <DialogFooter>
                                            <Button type="button" variant="outline" onClick={handleReset}>
                                                Reset
                                            </Button>
                                            <Button type="button" onClick={handleApplyFilters}>
                                                Generate report
                                            </Button>
                                        </DialogFooter>
                                    </DialogContent>
                                </Dialog>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button type="button" variant="secondary" className="gap-2">
                                            <Download className="h-4 w-4" />
                                            Export
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-44">
                                        <DropdownMenuItem onSelect={() => handleExport('csv')} className="gap-2">
                                            <FileDigit className="h-4 w-4 text-amber-500" />
                                            CSV
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onSelect={() => handleExport('xlsx')} className="gap-2">
                                            <FileSpreadsheet className="h-4 w-4 text-emerald-500" />
                                            Excel
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onSelect={() => handleExport('pdf')} className="gap-2">
                                            <FileType2 className="h-4 w-4 text-rose-500" />
                                            PDF
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                                <Button type="button" variant="outline" className="gap-2" onClick={handleReset}>
                                    <RefreshCcw className="h-4 w-4" />
                                    Reset
                                </Button>
                            </div>
                        </div>
                    </header>

                    <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                        {kpiCards.map((card) => {
                            const Icon = card.icon;

                            return (
                                <Card key={card.label} className="border border-slate-200 bg-white/95 shadow-sm dark:border-slate-800/70 dark:bg-slate-900/70">
                                    <CardContent className="flex items-center gap-3 p-4">
                                        <span className={`flex h-10 w-10 items-center justify-center rounded-full ${card.tone}`}>
                                            <Icon className="h-5 w-5" />
                                        </span>
                                        <div className="space-y-0.5">
                                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{card.label}</p>
                                            <p className="text-lg font-semibold text-slate-900 dark:text-slate-50">{card.value}</p>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </section>

                    <Card className="border border-slate-200 bg-white/95 shadow-sm dark:border-slate-800/70 dark:bg-slate-900/70">
                        <CardHeader className="space-y-3 border-b border-slate-200/60 pb-5 dark:border-slate-700/60">
                            <div className="space-y-1">
                                <CardTitle className="text-lg font-semibold text-slate-900 dark:text-slate-50">Dispatch Detail</CardTitle>
                                <CardDescription className="text-sm">Operations, routes, and financial outcomes per dispatch.</CardDescription>
                            </div>
                            <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                                <Badge variant="outline">From {appliedFrom || '—'}</Badge>
                                <Badge variant="outline">To {appliedTo || '—'}</Badge>
                                <Badge variant="outline">{appliedDriverCount > 0 ? `${appliedDriverCount} driver${appliedDriverCount > 1 ? 's' : ''}` : 'All drivers'}</Badge>
                                <Badge variant="outline">{appliedTruckCount > 0 ? `${appliedTruckCount} truck${appliedTruckCount > 1 ? 's' : ''}` : 'All trucks'}</Badge>
                                <Badge variant="outline">{appliedOperationCount > 0 ? `${appliedOperationCount} operation${appliedOperationCount > 1 ? 's' : ''}` : 'All operations'}</Badge>
                                <Badge variant="outline">{appliedDestinationCount > 0 ? `${appliedDestinationCount} destination${appliedDestinationCount > 1 ? 's' : ''}` : 'All destinations'}</Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader className="bg-slate-50/60 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-900/60 dark:text-slate-400">
                                        <TableRow className="divide-x divide-slate-200/40 dark:divide-slate-800/50">
                                            <TableHead className="whitespace-nowrap">FO Number</TableHead>
                                            <TableHead className="whitespace-nowrap">Dispatch Date</TableHead>
                                            <TableHead className="whitespace-nowrap">Driver</TableHead>
                                            <TableHead className="whitespace-nowrap">Truck</TableHead>
                                            <TableHead className="whitespace-nowrap">Vehicle Type</TableHead>
                                            <TableHead className="whitespace-nowrap">Operation</TableHead>
                                            <TableHead className="whitespace-nowrap">Customer</TableHead>
                                            <TableHead className="whitespace-nowrap">Origin</TableHead>
                                            <TableHead className="whitespace-nowrap">Destination</TableHead>
                                            <TableHead className="whitespace-nowrap text-right">Tonnage (MT)</TableHead>
                                            <TableHead className="whitespace-nowrap text-right">Ton-KM</TableHead>
                                            <TableHead className="whitespace-nowrap text-right">Distance (WC)</TableHead>
                                            <TableHead className="whitespace-nowrap text-right">Distance (WO)</TableHead>
                                            <TableHead className="whitespace-nowrap text-right">Total Distance</TableHead>
                                            <TableHead className="whitespace-nowrap text-right">Fuel (L)</TableHead>
                                            <TableHead className="whitespace-nowrap text-right">Fuel Cost</TableHead>
                                            <TableHead className="whitespace-nowrap text-right">Perdiem</TableHead>
                                            <TableHead className="whitespace-nowrap text-right">Work Ongoing</TableHead>
                                            <TableHead className="whitespace-nowrap text-right">Other Cost</TableHead>
                                            <TableHead className="whitespace-nowrap text-right">Total Expense</TableHead>
                                            <TableHead className="whitespace-nowrap text-right">Revenue</TableHead>
                                            <TableHead className="whitespace-nowrap text-right">Profit</TableHead>
                                            <TableHead className="whitespace-nowrap text-right">Margin %</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {safeRows.length === 0 && (
                                            <TableRow>
                                                <TableCell colSpan={23} className="py-6 text-center text-sm text-muted-foreground">
                                                    No dispatch records match the selected filters.
                                                </TableCell>
                                            </TableRow>
                                        )}
                                        {safeRows.map((row) => {
                                            const marginValue = row.margin_percent ?? null;
                                            const profitTone = getFinancialTone(row.profit);

                                            return (
                                                <TableRow
                                                    key={row.id}
                                                    className="divide-x divide-slate-200/40 odd:bg-white even:bg-slate-50/40 hover:bg-slate-100/60 dark:divide-slate-800/50 dark:odd:bg-slate-900/40 dark:even:bg-slate-900/20 dark:hover:bg-slate-800/50"
                                                >
                                                    <TableCell className="whitespace-nowrap text-sm font-medium text-slate-700 dark:text-slate-100">{row.fo_number}</TableCell>
                                                    <TableCell className="whitespace-nowrap text-sm text-slate-600 dark:text-slate-200">{row.dispatch_date ?? '—'}</TableCell>
                                                    <TableCell className="whitespace-nowrap text-sm text-slate-700 dark:text-slate-100">{row.driver_name}</TableCell>
                                                    <TableCell className="whitespace-nowrap text-sm text-slate-700 dark:text-slate-100">{row.truck_plate}</TableCell>
                                                    <TableCell className="whitespace-nowrap text-sm text-slate-600 dark:text-slate-200">{row.vehicle_type ?? '—'}</TableCell>
                                                    <TableCell className="whitespace-nowrap text-sm text-slate-700 dark:text-slate-100">{row.operation_code}</TableCell>
                                                    <TableCell className="whitespace-nowrap text-sm text-slate-600 dark:text-slate-200">{row.customer_name ?? '—'}</TableCell>
                                                    <TableCell className="whitespace-nowrap text-sm text-slate-600 dark:text-slate-200">{row.origin_name}</TableCell>
                                                    <TableCell className="whitespace-nowrap text-sm text-slate-600 dark:text-slate-200">{row.destination_name}</TableCell>
                                                    <TableCell className="whitespace-nowrap text-right text-sm text-slate-700 dark:text-slate-100">{formatDecimal(row.tonnage)}</TableCell>
                                                    <TableCell className="whitespace-nowrap text-right text-sm text-slate-700 dark:text-slate-100">{formatDecimal(row.ton_km)}</TableCell>
                                                    <TableCell className="whitespace-nowrap text-right text-sm text-slate-700 dark:text-slate-100">{formatDecimal(row.distance_wc)}</TableCell>
                                                    <TableCell className="whitespace-nowrap text-right text-sm text-slate-700 dark:text-slate-100">{formatDecimal(row.distance_wo)}</TableCell>
                                                    <TableCell className="whitespace-nowrap text-right text-sm text-slate-700 dark:text-slate-100">{formatDecimal(row.distance_total)}</TableCell>
                                                    <TableCell className="whitespace-nowrap text-right text-sm text-slate-700 dark:text-slate-100">{formatDecimal(row.fuel_litres)}</TableCell>
                                                    <TableCell className="whitespace-nowrap text-right text-sm text-slate-700 dark:text-slate-100">{formatCurrency(row.fuel_cost)}</TableCell>
                                                    <TableCell className="whitespace-nowrap text-right text-sm text-slate-700 dark:text-slate-100">{formatCurrency(row.perdiem)}</TableCell>
                                                    <TableCell className="whitespace-nowrap text-right text-sm text-slate-700 dark:text-slate-100">{formatCurrency(row.work_on_going)}</TableCell>
                                                    <TableCell className="whitespace-nowrap text-right text-sm text-slate-700 dark:text-slate-100">{formatCurrency(row.other_cost)}</TableCell>
                                                    <TableCell className="whitespace-nowrap text-right text-sm text-slate-700 dark:text-slate-100">{formatCurrency(row.expense)}</TableCell>
                                                    <TableCell className="whitespace-nowrap text-right text-sm text-slate-700 dark:text-slate-100">{formatCurrency(row.revenue)}</TableCell>
                                                    <TableCell className={`whitespace-nowrap text-right text-sm font-semibold ${profitTone}`}>{formatCurrency(row.profit)}</TableCell>
                                                    <TableCell className="whitespace-nowrap text-right">
                                                        {marginValue === null ? (
                                                            <span className="text-sm text-muted-foreground">—</span>
                                                        ) : (
                                                            <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold ${getMarginChipClass(marginValue)}`}>
                                                                {formatPercentage(marginValue)}
                                                            </span>
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                    <TableFooter>
                                        <TableRow className="divide-x divide-slate-200/60 bg-slate-100/80 text-sm font-semibold dark:divide-slate-800/50 dark:bg-slate-900/60">
                                            <TableCell className="whitespace-nowrap" colSpan={9}>Totals</TableCell>
                                            <TableCell className="whitespace-nowrap text-right">{formatDecimal(summary?.tonnage ?? 0)}</TableCell>
                                            <TableCell className="whitespace-nowrap text-right">{formatDecimal(summary?.ton_km ?? 0)}</TableCell>
                                            <TableCell className="whitespace-nowrap text-right">{formatDecimal(summary?.distance_wc ?? 0)}</TableCell>
                                            <TableCell className="whitespace-nowrap text-right">{formatDecimal(summary?.distance_wo ?? 0)}</TableCell>
                                            <TableCell className="whitespace-nowrap text-right">{formatDecimal(summary?.distance_total ?? 0)}</TableCell>
                                            <TableCell className="whitespace-nowrap text-right">{formatDecimal(summary?.fuel_litres ?? 0)}</TableCell>
                                            <TableCell className="whitespace-nowrap text-right">{formatCurrency(summary?.fuel_cost ?? 0)}</TableCell>
                                            <TableCell className="whitespace-nowrap text-right">{formatCurrency(summary?.perdiem ?? 0)}</TableCell>
                                            <TableCell className="whitespace-nowrap text-right">{formatCurrency(summary?.work_on_going ?? 0)}</TableCell>
                                            <TableCell className="whitespace-nowrap text-right">{formatCurrency(summary?.other_cost ?? 0)}</TableCell>
                                            <TableCell className="whitespace-nowrap text-right">{formatCurrency(summary?.expense ?? 0)}</TableCell>
                                            <TableCell className="whitespace-nowrap text-right">{formatCurrency(summary?.revenue ?? 0)}</TableCell>
                                            <TableCell className={`whitespace-nowrap text-right ${getFinancialTone(summary?.profit ?? 0)}`}>{formatCurrency(summary?.profit ?? 0)}</TableCell>
                                            <TableCell className="whitespace-nowrap text-right">
                                                {summaryMargin === null ? (
                                                    <span className="text-sm text-muted-foreground">—</span>
                                                ) : (
                                                    <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold ${getMarginChipClass(summaryMargin)}`}>
                                                        {formatPercentage(summaryMargin)}
                                                    </span>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    </TableFooter>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}















