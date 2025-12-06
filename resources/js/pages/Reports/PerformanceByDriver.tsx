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
import { Activity, Award, Download, FileDigit, FileSpreadsheet, FileType2, Filter, GaugeCircle, RefreshCcw, Search, User, ChevronDown, ChevronUp } from 'lucide-react';
import { usePermissions } from '@/hooks/use-permissions';

interface DriverOption {
    id: number;
    name: string;
}

interface DriverReportRow {
    driver_id: number | null;
    driver_name: string;
    trips: number;
    tonnage: number;
    ton_km: number;
    distance_wc: number;
    distance_wo: number;
    distance_total: number;
    fuel_cost: number;
    perdiem: number;
    other_cost: number;
    expense: number;
    revenue: number;
    profit: number;
    margin_percent: number | null;
}

interface DriverReportSummary {
    trips: number;
    tonnage: number;
    ton_km: number;
    distance_wc: number;
    distance_wo: number;
    distance_total: number;
    fuel_cost: number;
    perdiem: number;
    other_cost: number;
    expense: number;
    revenue: number;
    profit: number;
    margin_percent: number | null;
}

interface Filters {
    from: string;
    to: string;
    driver_ids?: number[];
}

interface PerformanceByDriverProps {
    filters: Filters;
    rows: DriverReportRow[];
    summary: DriverReportSummary;
    drivers: DriverOption[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Reports', href: '/reports/performance-by-driver' },
    { title: 'Performance by Driver', href: '/reports/performance-by-driver' },
];

const formatNumber = (value: number) => value.toLocaleString();

const formatDecimal = (value: number) => value.toLocaleString(undefined, { maximumFractionDigits: 2, minimumFractionDigits: 2 });

const formatCurrency = (value: number) => new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(value);

const formatPercentage = (value: number | null) => (value === null ? '—' : `${value.toFixed(2)}%`);

export default function PerformanceByDriver({ filters, rows = [], summary, drivers }: PerformanceByDriverProps) {
    const { hasPermission } = usePermissions();
    const canExport = hasPermission('reports.performance-by-driver.export');
    const [from, setFrom] = useState(filters?.from ?? '');
    const [to, setTo] = useState(filters?.to ?? '');
    const [selectedDrivers, setSelectedDrivers] = useState<number[]>(filters?.driver_ids ?? []);
    const [driverSearch, setDriverSearch] = useState('');
    const [driverSelectorOpen, setDriverSelectorOpen] = useState(false);
    const [filtersOpen, setFiltersOpen] = useState(false);

    const noDriverFilter = selectedDrivers.length === 0;

    const selectedDriverNames = useMemo(
        () => drivers.filter((option) => selectedDrivers.includes(option.id)).map((option) => option.name ?? 'Unassigned'),
        [drivers, selectedDrivers],
    );

    const filteredDriverOptions = useMemo(() => {
        if (!driverSearch.trim()) {
            return drivers;
        }

        const term = driverSearch.trim().toLowerCase();
        return drivers.filter((option) => (option.name ?? '').toLowerCase().includes(term));
    }, [driverSearch, drivers]);

    const activeFilterCount = useMemo(() => {
        let count = 0;

        if (from && from !== (filters?.from ?? '')) count += 1;
        if (to && to !== (filters?.to ?? '')) count += 1;
        if (selectedDrivers.length > 0) count += 1;

        return count;
    }, [from, to, selectedDrivers, filters?.from, filters?.to]);

    const handleToggleDriver = (id: number) => {
        setSelectedDrivers((current) => (current.includes(id) ? current.filter((driverId) => driverId !== id) : [...current, id]));
    };

    const handleSelectAllDrivers = () => {
        if (noDriverFilter || selectedDrivers.length === drivers.length) {
            setSelectedDrivers(drivers.map((option) => option.id));
        } else {
            setSelectedDrivers([]);
        }
    };

    const handleClearDrivers = () => setSelectedDrivers([]);

    const handleApplyFilters = () => {
        setDriverSelectorOpen(false);
        setFiltersOpen(false);
        const params: Record<string, unknown> = {
            from,
            to,
        };

        if (selectedDrivers.length > 0) {
            params.driver_ids = selectedDrivers;
        }

        router.get('/reports/performance-by-driver', params, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleReset = () => {
        setFrom(filters?.from ?? '');
        setTo(filters?.to ?? '');
        setSelectedDrivers(filters?.driver_ids ?? []);
        setDriverSelectorOpen(false);
        setFiltersOpen(false);
        router.get('/reports/performance-by-driver', {}, { preserveState: false, preserveScroll: true });
    };

    const handleExport = (format: 'csv' | 'xlsx' | 'pdf') => {
        if (!canExport) {
            return;
        }

        const params = new URLSearchParams();

        if (from) params.set('from', from);
        if (to) params.set('to', to);

        if (selectedDrivers.length > 0) {
            selectedDrivers.forEach((driverId) => {
                params.append('driver_ids[]', String(driverId));
            });
        }

        const query = params.toString();
        const url = `/reports/performance-by-driver/export/${format}${query ? `?${query}` : ''}`;
        window.location.href = url;
    };

    const summaryCards = [
        {
            title: 'Total Trips',
            value: formatNumber(summary?.trips ?? 0),
            helper: 'Completed dispatches for the period',
            icon: <Activity className="h-3.5 w-3.5 text-blue-600" />,
            valueClassName: 'text-blue-600',
        },
        {
            title: 'Tonnage (MT)',
            value: formatDecimal(summary?.tonnage ?? 0),
            helper: 'Aggregate cargo carried',
            icon: <Award className="h-3.5 w-3.5 text-indigo-600" />,
            valueClassName: 'text-indigo-600',
        },
        {
            title: 'Driver Revenue',
            value: formatCurrency(summary?.revenue ?? 0),
            helper: 'Gross revenue across selected drivers',
            icon: <User className="h-3.5 w-3.5 text-emerald-600" />,
            valueClassName: 'text-emerald-600',
        },
        {
            title: 'Net Margin',
            value: `${formatCurrency(summary?.profit ?? 0)} · ${formatPercentage(summary?.margin_percent ?? null)}`,
            helper: 'Contribution after costs',
            icon: <GaugeCircle className="h-3.5 w-3.5 text-teal-600" />,
            valueClassName: 'text-teal-600',
        },
    ];

    const visibleDriverBadges = selectedDriverNames.slice(0, 4);
    const extraDriverCount = Math.max(selectedDriverNames.length - visibleDriverBadges.length, 0);

    const appliedFrom = filters?.from ?? '';
    const appliedTo = filters?.to ?? '';
    const appliedDriverCount = filters?.driver_ids?.length ?? 0;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Performance by Driver" />
            <div className="flex flex-1 min-h-0 flex-col overflow-hidden bg-slate-100/60 dark:bg-slate-900/40">
                <div className="flex flex-1 flex-col gap-6 overflow-y-auto p-4 pb-10 sm:p-6 lg:p-10">
                    <header className="rounded-2xl border border-slate-200 bg-white/95 px-6 py-6 shadow-sm backdrop-blur dark:border-slate-800/70 dark:bg-slate-900/70">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                            <div className="space-y-2">
                                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500 dark:text-slate-400">Driver Intelligence</p>
                                <h1 className="text-3xl font-semibold text-slate-900 dark:text-slate-50">Performance by Driver</h1>
                                <p className="max-w-3xl text-sm text-slate-600 dark:text-slate-300">
                                    Compare utilisation, earnings, and cost efficiency for each driver. Refine the window, focus on specific drivers, and export polished reports for your operational reviews.
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
                                    <DialogContent className="w-full sm:max-w-4xl lg:max-w-5xl sm:rounded-2xl">
                                        <DialogHeader className="text-left">
                                            <DialogTitle>Filter performance by driver</DialogTitle>
                                            <DialogDescription>Adjust the reporting window and focus on specific drivers before generating the report.</DialogDescription>
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
                                                                        <Button type="button" variant="ghost" size="sm" onClick={handleSelectAllDrivers}>
                                                                            {selectedDrivers.length === drivers.length && drivers.length > 0 ? 'Unselect all' : 'Select all'}
                                                                        </Button>
                                                                        <Button type="button" variant="ghost" size="sm" onClick={handleClearDrivers}>
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
                                                                            {filteredDriverOptions.map((option) => {
                                                                                const checked = selectedDrivers.includes(option.id);

                                                                                return (
                                                                                    <CommandItem
                                                                                        key={option.id}
                                                                                        onSelect={() => handleToggleDriver(option.id)}
                                                                                        className="flex items-center gap-2"
                                                                                    >
                                                                                        <Checkbox checked={checked} />
                                                                                        <span className="font-medium">{option.name ?? 'Unassigned'}</span>
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
                                                            {noDriverFilter && (
                                                                <Badge variant="outline" className="border-dashed text-muted-foreground">
                                                                    All drivers included
                                                                </Badge>
                                                            )}
                                                            {!noDriverFilter && visibleDriverBadges.map((name) => (
                                                                <Badge key={name} variant="secondary" className="bg-slate-100 text-slate-700">
                                                                    {name}
                                                                </Badge>
                                                            ))}
                                                            {!noDriverFilter && extraDriverCount > 0 && (
                                                                <Badge variant="outline" className="border-dashed text-muted-foreground">
                                                                    +{extraDriverCount} more
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
                        {summaryCards.map((card) => (
                            <Card key={card.title} className="border border-slate-200 bg-white/95 shadow-sm transition dark:border-slate-800/70 dark:bg-slate-900/70">
                                <CardContent className="flex items-start gap-4 p-4">
                                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-600 dark:bg-slate-800/60 dark:text-slate-200">
                                        {card.icon}
                                    </span>
                                    <div className="space-y-1">
                                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{card.title}</p>
                                        <p className={`text-lg font-semibold text-slate-900 dark:text-slate-50 ${card.valueClassName ?? ''}`}>{card.value}</p>
                                        <p className="text-xs text-muted-foreground">{card.helper}</p>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </section>

                    <Card className="border border-slate-200 bg-white/95 shadow-sm dark:border-slate-800/70 dark:bg-slate-900/70">
                        <CardHeader className="space-y-3 border-b border-slate-200/60 pb-5 dark:border-slate-700/60">
                            <div className="space-y-1">
                                <CardTitle className="text-lg font-semibold text-slate-900 dark:text-slate-50">Driver Performance Detail</CardTitle>
                                <CardDescription className="text-sm">Utilisation, cost, and contribution by driver.</CardDescription>
                            </div>
                            <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                                <Badge variant="outline">From {appliedFrom || '—'}</Badge>
                                <Badge variant="outline">To {appliedTo || '—'}</Badge>
                                <Badge variant="outline">
                                    {appliedDriverCount > 0 ? `${appliedDriverCount} driver${appliedDriverCount > 1 ? 's' : ''}` : 'All drivers'}
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader className="bg-slate-50/60 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-900/60 dark:text-slate-400">
                                        <TableRow className="divide-x divide-slate-200/40 dark:divide-slate-800/50">
                                            <TableHead className="whitespace-nowrap">Driver</TableHead>
                                            <TableHead className="whitespace-nowrap text-right">Trips</TableHead>
                                            <TableHead className="whitespace-nowrap text-right">Tonnage (MT)</TableHead>
                                            <TableHead className="whitespace-nowrap text-right">Ton-KM</TableHead>
                                            <TableHead className="whitespace-nowrap text-right">Distance (WC)</TableHead>
                                            <TableHead className="whitespace-nowrap text-right">Distance (WO)</TableHead>
                                            <TableHead className="whitespace-nowrap text-right">Total Distance</TableHead>
                                            <TableHead className="whitespace-nowrap text-right">Fuel Cost</TableHead>
                                            <TableHead className="whitespace-nowrap text-right">Perdiem</TableHead>
                                            <TableHead className="whitespace-nowrap text-right">Other Cost</TableHead>
                                            <TableHead className="whitespace-nowrap text-right">Total Expense</TableHead>
                                            <TableHead className="whitespace-nowrap text-right">Revenue</TableHead>
                                            <TableHead className="whitespace-nowrap text-right">Profit</TableHead>
                                            <TableHead className="whitespace-nowrap text-right">Margin %</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {rows.length > 0 ? (
                                            rows.map((row) => (
                                                <TableRow key={`${row.driver_id}-${row.driver_name}`} className="divide-x divide-slate-100 hover:bg-slate-50/70 dark:divide-slate-800/50 dark:hover:bg-slate-900/50">
                                                    <TableCell className="whitespace-nowrap font-medium text-slate-900 dark:text-slate-100">{row.driver_name}</TableCell>
                                                    <TableCell className="whitespace-nowrap text-right">{formatNumber(row.trips)}</TableCell>
                                                    <TableCell className="whitespace-nowrap text-right">{formatDecimal(row.tonnage)}</TableCell>
                                                    <TableCell className="whitespace-nowrap text-right">{formatDecimal(row.ton_km)}</TableCell>
                                                    <TableCell className="whitespace-nowrap text-right">{formatDecimal(row.distance_wc)}</TableCell>
                                                    <TableCell className="whitespace-nowrap text-right">{formatDecimal(row.distance_wo)}</TableCell>
                                                    <TableCell className="whitespace-nowrap text-right">{formatDecimal(row.distance_total)}</TableCell>
                                                    <TableCell className="whitespace-nowrap text-right">{formatCurrency(row.fuel_cost)}</TableCell>
                                                    <TableCell className="whitespace-nowrap text-right">{formatCurrency(row.perdiem)}</TableCell>
                                                    <TableCell className="whitespace-nowrap text-right">{formatCurrency(row.other_cost)}</TableCell>
                                                    <TableCell className="whitespace-nowrap text-right">{formatCurrency(row.expense)}</TableCell>
                                                    <TableCell className="whitespace-nowrap text-right">{formatCurrency(row.revenue)}</TableCell>
                                                    <TableCell className="whitespace-nowrap text-right">{formatCurrency(row.profit)}</TableCell>
                                                    <TableCell className="whitespace-nowrap text-right">{formatPercentage(row.margin_percent)}</TableCell>
                                                </TableRow>
                                            ))
                                        ) : (
                                            <TableRow>
                                                <TableCell colSpan={14} className="py-10 text-center text-muted-foreground">
                                                    No data for the selected filters. Adjust your filters and generate the report again.
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                    {rows.length > 0 && (
                                        <TableFooter>
                                            <TableRow className="bg-slate-50/70 font-semibold dark:bg-slate-900/60">
                                                <TableCell>Total</TableCell>
                                                <TableCell className="text-right">{formatNumber(summary?.trips ?? 0)}</TableCell>
                                                <TableCell className="text-right">{formatDecimal(summary?.tonnage ?? 0)}</TableCell>
                                                <TableCell className="text-right">{formatDecimal(summary?.ton_km ?? 0)}</TableCell>
                                                <TableCell className="text-right">{formatDecimal(summary?.distance_wc ?? 0)}</TableCell>
                                                <TableCell className="text-right">{formatDecimal(summary?.distance_wo ?? 0)}</TableCell>
                                                <TableCell className="text-right">{formatDecimal(summary?.distance_total ?? 0)}</TableCell>
                                                <TableCell className="text-right">{formatCurrency(summary?.fuel_cost ?? 0)}</TableCell>
                                                <TableCell className="text-right">{formatCurrency(summary?.perdiem ?? 0)}</TableCell>
                                                <TableCell className="text-right">{formatCurrency(summary?.other_cost ?? 0)}</TableCell>
                                                <TableCell className="text-right">{formatCurrency(summary?.expense ?? 0)}</TableCell>
                                                <TableCell className="text-right">{formatCurrency(summary?.revenue ?? 0)}</TableCell>
                                                <TableCell className="text-right">{formatCurrency(summary?.profit ?? 0)}</TableCell>
                                                <TableCell className="text-right">{formatPercentage(summary?.margin_percent ?? null)}</TableCell>
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








