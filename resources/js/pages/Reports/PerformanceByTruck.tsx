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
import { Activity, BarChart3, CircleDollarSign, Download, FileDigit, FileSpreadsheet, FileType2, Filter, GaugeCircle, RefreshCcw, Search, Truck, ChevronDown, ChevronUp, Layers, ShieldCheck } from 'lucide-react';
import { usePermissions } from '@/hooks/use-permissions';

interface TruckOption {
    id: number;
    plate: string;
}

interface VehicleTypeOption {
    id: number;
    name: string;
}

interface ReportRow {
    truck_id: number | null;
    plate: string;
    trips: number;
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
    truck_status?: string | null;
    vehicle_type?: string | null;
}

interface ReportSummary {
    trips: number;
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
    from: string;
    to: string;
    truck_ids?: number[];
    vehicle_type_ids?: number[];
    statuses?: string[];
}

interface PerformanceByTruckProps {
    filters: Filters;
    rows: ReportRow[];
    summary: ReportSummary;
    trucks: TruckOption[];
    vehicleTypes: VehicleTypeOption[];
    statuses: string[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Reports', href: '/reports/performance-by-truck' },
    { title: 'Performance by Truck', href: '/reports/performance-by-truck' },
];

const formatInteger = (value: number) => value.toLocaleString();

const formatDecimal = (value: number) => value.toLocaleString(undefined, { maximumFractionDigits: 2, minimumFractionDigits: 2 });

const formatCurrency = (value: number) => new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(value);

const formatPercentage = (value: number | null) => (value === null ? '—' : `${value.toFixed(2)}%`);

const formatStatusLabel = (value: string) =>
    value
        .split(/[_\s-]+/)
        .filter(Boolean)
        .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
        .join(' ');

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

const getStatusBadgeClass = (status: string): string => {
    const normalized = status.toLowerCase();

    if (normalized === 'active') {
        return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200';
    }

    if (normalized === 'maintenance') {
        return 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-200';
    }

    if (normalized === 'inactive') {
        return 'bg-slate-200 text-slate-700 dark:bg-slate-800/80 dark:text-slate-200';
    }

    return 'bg-slate-100 text-slate-600 dark:bg-slate-800/80 dark:text-slate-200';
};

export default function PerformanceByTruck({ filters, rows = [], summary, trucks, vehicleTypes, statuses }: PerformanceByTruckProps) {
    const { hasPermission } = usePermissions();
    const canExport = hasPermission('reports.performance-by-truck.export');
    const [from, setFrom] = useState(filters?.from ?? '');
    const [to, setTo] = useState(filters?.to ?? '');
    const [selectedTrucks, setSelectedTrucks] = useState<number[]>(filters?.truck_ids ?? []);
    const [selectedVehicleTypes, setSelectedVehicleTypes] = useState<number[]>(filters?.vehicle_type_ids ?? []);
    const [selectedStatuses, setSelectedStatuses] = useState<string[]>(filters?.statuses ?? []);
    const [truckSearch, setTruckSearch] = useState('');
    const [vehicleTypeSearch, setVehicleTypeSearch] = useState('');
    const [statusSearch, setStatusSearch] = useState('');
    const [truckSelectorOpen, setTruckSelectorOpen] = useState(false);
    const [vehicleTypeSelectorOpen, setVehicleTypeSelectorOpen] = useState(false);
    const [statusSelectorOpen, setStatusSelectorOpen] = useState(false);
    const [filtersOpen, setFiltersOpen] = useState(false);

    const safeRows = Array.isArray(rows) ? rows : [];
    const totalStatuses = Array.isArray(statuses) ? statuses.length : 0;

    const activeFilterCount = useMemo(() => {
        let count = 0;

        if (from && from !== (filters?.from ?? '')) count += 1;
        if (to && to !== (filters?.to ?? '')) count += 1;
        if (selectedTrucks.length > 0) count += 1;
        if (selectedVehicleTypes.length > 0) count += 1;
        if (selectedStatuses.length > 0) count += 1;

        return count;
    }, [from, to, selectedTrucks, selectedVehicleTypes, selectedStatuses, filters?.from, filters?.to]);

    const noTruckFilter = selectedTrucks.length === 0;
    const noVehicleTypeFilter = selectedVehicleTypes.length === 0;
    const noStatusFilter = selectedStatuses.length === 0;

    const selectedTruckNames = useMemo(
        () => trucks.filter((truckOption) => selectedTrucks.includes(truckOption.id)).map((option) => option.plate),
        [selectedTrucks, trucks],
    );

    const selectedVehicleTypeNames = useMemo(
        () => vehicleTypes.filter((typeOption) => selectedVehicleTypes.includes(typeOption.id)).map((option) => option.name),
        [selectedVehicleTypes, vehicleTypes],
    );

    const filteredTruckOptions = useMemo(() => {
        if (!truckSearch.trim()) {
            return trucks;
        }

        const term = truckSearch.trim().toLowerCase();
        return trucks.filter((truckOption) => truckOption.plate.toLowerCase().includes(term));
    }, [truckSearch, trucks]);

    const filteredVehicleTypeOptions = useMemo(() => {
        if (!vehicleTypeSearch.trim()) {
            return vehicleTypes;
        }

        const term = vehicleTypeSearch.trim().toLowerCase();
        return vehicleTypes.filter((typeOption) => typeOption.name.toLowerCase().includes(term));
    }, [vehicleTypeSearch, vehicleTypes]);

    const filteredStatusOptions = useMemo(() => {
        const list = Array.isArray(statuses) ? statuses : [];

        if (!statusSearch.trim()) {
            return list;
        }

        const term = statusSearch.trim().toLowerCase();
        return list.filter((status) => status.toLowerCase().includes(term));
    }, [statusSearch, statuses]);

    const handleToggleTruck = (id: number) => {
        setSelectedTrucks((current) => (current.includes(id) ? current.filter((truckId) => truckId !== id) : [...current, id]));
    };

    const handleSelectAll = () => {
        if (noTruckFilter || selectedTrucks.length === trucks.length) {
            setSelectedTrucks(trucks.map((truckOption) => truckOption.id));
        } else {
            setSelectedTrucks([]);
        }
    };

    const handleClearTrucks = () => setSelectedTrucks([]);

    const handleToggleVehicleType = (id: number) => {
        setSelectedVehicleTypes((current) => (current.includes(id) ? current.filter((typeId) => typeId !== id) : [...current, id]));
    };

    const handleVehicleTypesSelectAll = () => {
        if (noVehicleTypeFilter || selectedVehicleTypes.length === vehicleTypes.length) {
            setSelectedVehicleTypes(vehicleTypes.map((typeOption) => typeOption.id));
        } else {
            setSelectedVehicleTypes([]);
        }
    };

    const handleClearVehicleTypes = () => setSelectedVehicleTypes([]);

    const handleToggleStatus = (status: string) => {
        setSelectedStatuses((current) => (current.includes(status) ? current.filter((item) => item !== status) : [...current, status]));
    };

    const handleStatusesSelectAll = () => {
        if (noStatusFilter || (totalStatuses > 0 && selectedStatuses.length === totalStatuses)) {
            setSelectedStatuses(Array.isArray(statuses) ? [...statuses] : []);
        } else {
            setSelectedStatuses([]);
        }
    };

    const handleClearStatuses = () => setSelectedStatuses([]);

    const handleApplyFilters = () => {
        setTruckSelectorOpen(false);
        setVehicleTypeSelectorOpen(false);
        setStatusSelectorOpen(false);
        setFiltersOpen(false);
        const params: Record<string, unknown> = {
            from,
            to,
        };

        if (selectedTrucks.length > 0) {
            params.truck_ids = selectedTrucks;
        }

        if (selectedVehicleTypes.length > 0) {
            params.vehicle_type_ids = selectedVehicleTypes;
        }

        if (selectedStatuses.length > 0) {
            params.statuses = selectedStatuses;
        }

        router.get('/reports/performance-by-truck', params, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleReset = () => {
        setFrom(filters?.from ?? '');
        setTo(filters?.to ?? '');
        setSelectedTrucks(filters?.truck_ids ?? []);
        setSelectedVehicleTypes(filters?.vehicle_type_ids ?? []);
        setSelectedStatuses(filters?.statuses ?? []);
        setTruckSearch('');
        setVehicleTypeSearch('');
        setStatusSearch('');
        setTruckSelectorOpen(false);
        setVehicleTypeSelectorOpen(false);
        setStatusSelectorOpen(false);
        setFiltersOpen(false);
        router.get('/reports/performance-by-truck', {}, { preserveState: false, preserveScroll: true });
    };

    const handleExport = (format: 'csv' | 'xlsx' | 'pdf') => {
        if (!canExport) {
            return;
        }

        const params = new URLSearchParams();

        if (from) params.set('from', from);
        if (to) params.set('to', to);

        if (selectedTrucks.length > 0) {
            selectedTrucks.forEach((truckId) => {
                params.append('truck_ids[]', String(truckId));
            });
        }

        if (selectedVehicleTypes.length > 0) {
            selectedVehicleTypes.forEach((typeId) => {
                params.append('vehicle_type_ids[]', String(typeId));
            });
        }

        if (selectedStatuses.length > 0) {
            selectedStatuses.forEach((status) => {
                params.append('statuses[]', status);
            });
        }

        const query = params.toString();
        const url = `/reports/performance-by-truck/export/${format}${query ? `?${query}` : ''}`;
        window.location.href = url;
    };

    const summaryCards = useMemo<Array<{ label: string; value: string; helper: string; icon: LucideIcon; tone: string }>>(
        () => [
            {
                label: 'Total trips',
                value: formatInteger(summary?.trips ?? safeRows.length),
                helper: 'Completed dispatches in range',
                icon: Activity,
                tone: 'bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-200',
            },
            {
                label: 'Tonnage (MT)',
                value: formatDecimal(summary?.tonnage ?? 0),
                helper: 'Cargo moved across all trips',
                icon: BarChart3,
                tone: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-200',
            },
            {
                label: 'Fleet revenue',
                value: formatCurrency(summary?.revenue ?? 0),
                helper: 'Gross revenue for selected slice',
                icon: CircleDollarSign,
                tone: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-200',
            },
            {
                label: 'Margin',
                value: formatPercentage(summary?.margin_percent ?? null),
                helper: formatCurrency(summary?.profit ?? 0),
                icon: GaugeCircle,
                tone: 'bg-teal-100 text-teal-600 dark:bg-teal-500/20 dark:text-teal-200',
            },
        ],
        [safeRows.length, summary?.margin_percent, summary?.profit, summary?.revenue, summary?.tonnage, summary?.trips],
    );

    const visibleTruckBadges = selectedTruckNames.slice(0, 4);
    const extraTruckCount = Math.max(selectedTruckNames.length - visibleTruckBadges.length, 0);

    const visibleVehicleTypeBadges = selectedVehicleTypeNames.slice(0, 4);
    const extraVehicleTypeCount = Math.max(selectedVehicleTypeNames.length - visibleVehicleTypeBadges.length, 0);

    const visibleStatusValues = selectedStatuses.slice(0, 4);
    const extraStatusCount = Math.max(selectedStatuses.length - visibleStatusValues.length, 0);

    const appliedFrom = filters?.from ?? '';
    const appliedTo = filters?.to ?? '';
    const appliedTruckCount = filters?.truck_ids?.length ?? 0;
    const appliedVehicleTypeCount = filters?.vehicle_type_ids?.length ?? 0;
    const appliedStatusCount = filters?.statuses?.length ?? 0;
    const summaryMargin = summary?.margin_percent ?? null;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Performance by Truck" />
            <div className="flex flex-1 min-h-0 flex-col overflow-hidden bg-slate-100/60 dark:bg-slate-900/40">
                <div className="flex flex-1 flex-col gap-6 overflow-y-auto p-4 pb-10 sm:p-6 lg:p-10">
                    <header className="rounded-2xl border border-slate-200 bg-white/95 px-6 py-6 shadow-sm backdrop-blur dark:border-slate-800/70 dark:bg-slate-900/70">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                            <div className="space-y-2">
                                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500 dark:text-slate-400">Fleet Reporting</p>
                                <h1 className="text-3xl font-semibold text-slate-900 dark:text-slate-50">Performance by Truck</h1>
                                <p className="max-w-3xl text-sm text-slate-600 dark:text-slate-300">
                                    Monitor utilisation, cost and profitability by truck. Refine the dataset with precise filters and export polished reports for finance or operations.
                                </p>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                                <Dialog open={filtersOpen} onOpenChange={setFiltersOpen}>
                                    <DialogTrigger asChild>
                                        <Button type="button" variant="outline" className="gap-2">
                                            <Filter className="h-4 w-4" />
                                            Filters
                                            {activeFilterCount > 0 && (
                                                <Badge variant="secondary" className="h-5 min-w-[2rem] justify-center px-2 text-xs font-semibold">
                                                    {activeFilterCount}
                                                </Badge>
                                            )}
                                            {filtersOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="w-full sm:max-w-5xl lg:max-w-6xl sm:rounded-2xl">
                                        <DialogHeader className="text-left">
                                            <DialogTitle>Filter performance by truck</DialogTitle>
                                            <DialogDescription>Adjust the date window and focus on specific trucks, vehicle types, or statuses before generating the report.</DialogDescription>
                                        </DialogHeader>
                                        <div className="grid gap-6">
                                            <div className="grid gap-6 rounded-xl border border-slate-200 bg-white/95 p-6 shadow-sm dark:border-slate-800/70 dark:bg-slate-900/70">
                                                <div className="grid gap-6 lg:grid-cols-3">
                                                    <div className="flex flex-col gap-3">
                                                        <span className="text-sm font-medium text-slate-700 dark:text-slate-200">From date</span>
                                                        <div className="flex flex-col gap-2">
                                                            <Input type="date" value={from} onChange={(event) => setFrom(event.target.value)} />
                                                            <p className="text-xs text-muted-foreground">Beginning of the reporting window.</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex flex-col gap-3">
                                                        <span className="text-sm font-medium text-slate-700 dark:text-slate-200">To date</span>
                                                        <div className="flex flex-col gap-2">
                                                            <Input type="date" value={to} onChange={(event) => setTo(event.target.value)} />
                                                            <p className="text-xs text-muted-foreground">End of the reporting window.</p>
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
                                                                        <Search className="mr-2 h-4 w-4 text-muted-foreground" />
                                                                        <CommandInput placeholder="Search plate..." value={truckSearch} onValueChange={setTruckSearch} />
                                                                    </div>
                                                                    <CommandList className="max-h-64">
                                                                        <CommandEmpty>No trucks found.</CommandEmpty>
                                                                        <CommandGroup heading="Fleet">
                                                                            <CommandItem onSelect={() => setSelectedTrucks([])} className="flex items-center gap-2">
                                                                                <Checkbox checked={noTruckFilter} />
                                                                                <span className="font-medium">All trucks</span>
                                                                                {noTruckFilter && <Badge variant="secondary" className="ml-auto">Active</Badge>}
                                                                            </CommandItem>
                                                                            {filteredTruckOptions.map((truckOption) => {
                                                                                const checked = selectedTrucks.includes(truckOption.id);

                                                                                return (
                                                                                    <CommandItem key={truckOption.id} onSelect={() => handleToggleTruck(truckOption.id)} className="flex items-center gap-2">
                                                                                        <Checkbox checked={checked} />
                                                                                        <span className="font-medium">{truckOption.plate}</span>
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
                                                            {noTruckFilter && (
                                                                <Badge variant="outline" className="border-dashed text-muted-foreground">
                                                                    All trucks included
                                                                </Badge>
                                                            )}
                                                            {!noTruckFilter && visibleTruckBadges.map((plate) => (
                                                                <Badge key={plate} variant="secondary" className="bg-slate-100 text-slate-700">
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
                                                </div>
                                                <div className="grid gap-6 lg:grid-cols-2">
                                                    <div className="flex flex-col gap-3">
                                                        <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Vehicle types</span>
                                                        <Popover open={vehicleTypeSelectorOpen} onOpenChange={setVehicleTypeSelectorOpen}>
                                                            <PopoverTrigger asChild>
                                                                <Button type="button" variant="outline" className="w-full justify-between">
                                                                    <span className="flex items-center gap-2 text-sm">
                                                                        <Layers className="h-4 w-4 text-slate-500" />
                                                                        {noVehicleTypeFilter ? 'All vehicle types' : `${selectedVehicleTypes.length} selected`}
                                                                    </span>
                                                                    <Filter className="h-3.5 w-3.5 text-slate-400" />
                                                                </Button>
                                                            </PopoverTrigger>
                                                            <PopoverContent className="w-80 p-0" align="start">
                                                                <div className="flex items-center justify-between px-3 py-2">
                                                                    <div className="flex items-center gap-2">
                                                                        <Button type="button" variant="ghost" size="sm" onClick={handleVehicleTypesSelectAll}>
                                                                            {selectedVehicleTypes.length === vehicleTypes.length && vehicleTypes.length > 0 ? 'Unselect all' : 'Select all'}
                                                                        </Button>
                                                                        <Button type="button" variant="ghost" size="sm" onClick={handleClearVehicleTypes}>
                                                                            Clear
                                                                        </Button>
                                                                    </div>
                                                                </div>
                                                                <Separator />
                                                                <Command>
                                                                    <div className="flex items-center px-3 py-2">
                                                                        <Search className="mr-2 h-4 w-4 text-muted-foreground" />
                                                                        <CommandInput placeholder="Search type..." value={vehicleTypeSearch} onValueChange={setVehicleTypeSearch} />
                                                                    </div>
                                                                    <CommandList className="max-h-64">
                                                                        <CommandEmpty>No vehicle types found.</CommandEmpty>
                                                                        <CommandGroup heading="Vehicle types">
                                                                            <CommandItem onSelect={() => setSelectedVehicleTypes([])} className="flex items-center gap-2">
                                                                                <Checkbox checked={noVehicleTypeFilter} />
                                                                                <span className="font-medium">All vehicle types</span>
                                                                                {noVehicleTypeFilter && <Badge variant="secondary" className="ml-auto">Active</Badge>}
                                                                            </CommandItem>
                                                                            {filteredVehicleTypeOptions.map((typeOption) => {
                                                                                const checked = selectedVehicleTypes.includes(typeOption.id);

                                                                                return (
                                                                                    <CommandItem key={typeOption.id} onSelect={() => handleToggleVehicleType(typeOption.id)} className="flex items-center gap-2">
                                                                                        <Checkbox checked={checked} />
                                                                                        <span className="font-medium">{typeOption.name}</span>
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
                                                            {noVehicleTypeFilter && (
                                                                <Badge variant="outline" className="border-dashed text-muted-foreground">
                                                                    All vehicle types included
                                                                </Badge>
                                                            )}
                                                            {!noVehicleTypeFilter && visibleVehicleTypeBadges.map((name) => (
                                                                <Badge key={name} variant="secondary" className="bg-slate-100 text-slate-700">
                                                                    {name}
                                                                </Badge>
                                                            ))}
                                                            {!noVehicleTypeFilter && extraVehicleTypeCount > 0 && (
                                                                <Badge variant="outline" className="border-dashed text-muted-foreground">
                                                                    +{extraVehicleTypeCount} more
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="flex flex-col gap-3">
                                                        <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Statuses</span>
                                                        <Popover open={statusSelectorOpen} onOpenChange={setStatusSelectorOpen}>
                                                            <PopoverTrigger asChild>
                                                                <Button type="button" variant="outline" className="w-full justify-between">
                                                                    <span className="flex items-center gap-2 text-sm">
                                                                        <ShieldCheck className="h-4 w-4 text-slate-500" />
                                                                        {noStatusFilter ? 'All statuses' : `${selectedStatuses.length} selected`}
                                                                    </span>
                                                                    <Filter className="h-3.5 w-3.5 text-slate-400" />
                                                                </Button>
                                                            </PopoverTrigger>
                                                            <PopoverContent className="w-80 p-0" align="start">
                                                                <div className="flex items-center justify-between px-3 py-2">
                                                                    <div className="flex items-center gap-2">
                                                                        <Button type="button" variant="ghost" size="sm" onClick={handleStatusesSelectAll}>
                                                                            {selectedStatuses.length === totalStatuses && totalStatuses > 0 ? 'Unselect all' : 'Select all'}
                                                                        </Button>
                                                                        <Button type="button" variant="ghost" size="sm" onClick={handleClearStatuses}>
                                                                            Clear
                                                                        </Button>
                                                                    </div>
                                                                </div>
                                                                <Separator />
                                                                <Command>
                                                                    <div className="flex items-center px-3 py-2">
                                                                        <Search className="mr-2 h-4 w-4 text-muted-foreground" />
                                                                        <CommandInput placeholder="Search status..." value={statusSearch} onValueChange={setStatusSearch} />
                                                                    </div>
                                                                    <CommandList className="max-h-64">
                                                                        <CommandEmpty>No statuses found.</CommandEmpty>
                                                                        <CommandGroup heading="Truck statuses">
                                                                            <CommandItem onSelect={() => setSelectedStatuses([])} className="flex items-center gap-2">
                                                                                <Checkbox checked={noStatusFilter} />
                                                                                <span className="font-medium">All statuses</span>
                                                                                {noStatusFilter && <Badge variant="secondary" className="ml-auto">Active</Badge>}
                                                                            </CommandItem>
                                                                            {filteredStatusOptions.map((status) => {
                                                                                const checked = selectedStatuses.includes(status);

                                                                                return (
                                                                                    <CommandItem key={status} onSelect={() => handleToggleStatus(status)} className="flex items-center gap-2">
                                                                                        <Checkbox checked={checked} />
                                                                                        <span className="font-medium">{formatStatusLabel(status)}</span>
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
                                                            {noStatusFilter && (
                                                                <Badge variant="outline" className="border-dashed text-muted-foreground">
                                                                    All statuses included
                                                                </Badge>
                                                            )}
                                                            {!noStatusFilter && visibleStatusValues.map((status) => (
                                                                <Badge key={status} className={getStatusBadgeClass(status)}>
                                                                    {formatStatusLabel(status)}
                                                                </Badge>
                                                            ))}
                                                            {!noStatusFilter && extraStatusCount > 0 && (
                                                                <Badge variant="outline" className="border-dashed text-muted-foreground">
                                                                    +{extraStatusCount} more
                                                                </Badge>
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
                                {canExport && (
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
                                )}
                                <Button type="button" variant="outline" className="gap-2" onClick={handleReset}>
                                    <RefreshCcw className="h-4 w-4" />
                                    Reset
                                </Button>
                            </div>
                        </div>
                    </header>
                    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                        {summaryCards.map((card) => {
                            const Icon = card.icon;

                            return (
                                <Card key={card.label} className="border border-slate-200 bg-white/95 shadow-sm transition dark:border-slate-800/70 dark:bg-slate-900/70">
                                    <CardContent className="flex items-start gap-4 p-4">
                                        <span className={`flex h-10 w-10 items-center justify-center rounded-full ${card.tone}`}>
                                            <Icon className="h-5 w-5" />
                                        </span>
                                        <div className="space-y-1">
                                            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{card.label}</p>
                                            <p className="text-lg font-semibold text-slate-900 dark:text-slate-50">{card.value}</p>
                                            <p className="text-xs text-muted-foreground">{card.helper}</p>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </section>

                    <Card className="border border-slate-200 bg-white/95 shadow-sm dark:border-slate-800/70 dark:bg-slate-900/70">
                        <CardHeader className="space-y-3 border-b border-slate-200/60 pb-5 dark:border-slate-700/60">
                            <div className="space-y-1">
                                <CardTitle className="text-lg font-semibold text-slate-900 dark:text-slate-50">Truck Performance Detail</CardTitle>
                                <CardDescription className="text-sm">Revenue, expense, and utilisation metrics per truck.</CardDescription>
                            </div>
                            <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                                <Badge variant="outline">From {appliedFrom || '—'}</Badge>
                                <Badge variant="outline">To {appliedTo || '—'}</Badge>
                                <Badge variant="outline">
                                    {appliedTruckCount > 0 ? `${appliedTruckCount} truck${appliedTruckCount > 1 ? 's' : ''}` : 'All trucks'}
                                </Badge>
                                <Badge variant="outline">
                                    {appliedVehicleTypeCount > 0
                                        ? `${appliedVehicleTypeCount} vehicle type${appliedVehicleTypeCount > 1 ? 's' : ''}`
                                        : 'All vehicle types'}
                                </Badge>
                                <Badge variant="outline">
                                    {appliedStatusCount > 0 ? `${appliedStatusCount} status${appliedStatusCount > 1 ? 'es' : ''}` : 'All statuses'}
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader className="bg-slate-50/60 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-900/60 dark:text-slate-400">
                                        <TableRow className="divide-x divide-slate-200/40 dark:divide-slate-800/50">
                                            <TableHead className="whitespace-nowrap">Plate</TableHead>
                                            <TableHead className="whitespace-nowrap text-right">Trips</TableHead>
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
                                        {safeRows.length > 0 ? (
                                            safeRows.map((row) => {
                                                const marginValue = row.margin_percent ?? null;
                                                const profitTone = getFinancialTone(row.profit);

                                                return (
                                                    <TableRow
                                                        key={`${row.truck_id}-${row.plate}`}
                                                        className="divide-x divide-slate-200/40 odd:bg-white even:bg-slate-50/40 hover:bg-slate-100/60 dark:divide-slate-800/50 dark:odd:bg-slate-900/40 dark:even:bg-slate-900/20 dark:hover:bg-slate-800/50"
                                                    >
                                                        <TableCell className="min-w-[160px] space-y-1 text-left align-top">
                                                            <span className="block text-sm font-semibold text-slate-800 dark:text-slate-50">{row.plate}</span>
                                                            {(row.vehicle_type || row.truck_status) && (
                                                                <div className="flex flex-wrap gap-1">
                                                                    {row.vehicle_type && (
                                                                        <Badge variant="secondary" className="text-xs font-medium bg-slate-100 text-slate-700 dark:bg-slate-800/70 dark:text-slate-200">
                                                                            {row.vehicle_type}
                                                                        </Badge>
                                                                    )}
                                                                    {row.truck_status && (
                                                                        <Badge className={`text-xs font-medium ${getStatusBadgeClass(row.truck_status)}`}>
                                                                            {formatStatusLabel(row.truck_status)}
                                                                        </Badge>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </TableCell>
                                                        <TableCell className="whitespace-nowrap text-right text-sm text-slate-700 dark:text-slate-100">{formatInteger(row.trips)}</TableCell>
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
                                            })
                                        ) : (
                                            <TableRow>
                                                <TableCell colSpan={16} className="py-10 text-center text-muted-foreground">
                                                    No data for the selected filters. Adjust your filters and generate the report again.
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                    {safeRows.length > 0 && (
                                        <TableFooter>
                                            <TableRow className="divide-x divide-slate-200/60 bg-slate-100/80 font-semibold dark:divide-slate-800/50 dark:bg-slate-900/60">
                                                <TableCell>Total</TableCell>
                                                <TableCell className="text-right">{formatInteger(summary?.trips ?? 0)}</TableCell>
                                                <TableCell className="text-right">{formatDecimal(summary?.tonnage ?? 0)}</TableCell>
                                                <TableCell className="text-right">{formatDecimal(summary?.ton_km ?? 0)}</TableCell>
                                                <TableCell className="text-right">{formatDecimal(summary?.distance_wc ?? 0)}</TableCell>
                                                <TableCell className="text-right">{formatDecimal(summary?.distance_wo ?? 0)}</TableCell>
                                                <TableCell className="text-right">{formatDecimal(summary?.distance_total ?? 0)}</TableCell>
                                                <TableCell className="text-right">{formatDecimal(summary?.fuel_litres ?? 0)}</TableCell>
                                                <TableCell className="text-right">{formatCurrency(summary?.fuel_cost ?? 0)}</TableCell>
                                                <TableCell className="text-right">{formatCurrency(summary?.perdiem ?? 0)}</TableCell>
                                                <TableCell className="text-right">{formatCurrency(summary?.work_on_going ?? 0)}</TableCell>
                                                <TableCell className="text-right">{formatCurrency(summary?.other_cost ?? 0)}</TableCell>
                                                <TableCell className="text-right">{formatCurrency(summary?.expense ?? 0)}</TableCell>
                                                <TableCell className="text-right">{formatCurrency(summary?.revenue ?? 0)}</TableCell>
                                                <TableCell className={`text-right ${getFinancialTone(summary?.profit ?? 0)}`}>{formatCurrency(summary?.profit ?? 0)}</TableCell>
                                                <TableCell className="text-right">
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
                                    )}
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}








