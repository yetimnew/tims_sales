import { useMemo, useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableFooter,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import {
    CircleDollarSign,
    Coins,
    Filter,
    Percent,
    PiggyBank,
    TrendingUp,
} from 'lucide-react';

interface CustomerOption {
    id: number;
    name: string;
}

interface CustomerProfitabilityRow {
    customer_id: number;
    customer_name: string;
    operations: number;
    lanes_used: number;
    internal_trips: number;
    outsource_trips: number;
    total_trips: number;
    internal_tonnage: number;
    outsource_tonnage: number;
    total_tonnage: number;
    internal_ton_km: number;
    outsource_ton_km: number;
    total_ton_km: number;
    internal_distance: number;
    outsource_distance: number;
    total_distance: number;
    internal_expense: number;
    outsource_cost: number;
    total_cost: number;
    revenue: number;
    profit: number;
    margin_percent: number | null;
    average_km_per_trip: number | null;
    cost_per_km: number | null;
    revenue_per_ton_km: number | null;
    cost_per_ton_km: number | null;
    profit_per_ton_km: number | null;
    revenue_per_trip: number | null;
    cost_per_trip: number | null;
    tonnage_per_trip: number | null;
    empty_distance_ratio_percent: number | null;
    internal_fuel_cost_per_km: number | null;
    outsource_cost_per_km: number | null;
    outsource_trip_share_percent: number | null;
    outsource_tonnage_share_percent: number | null;
}

interface CustomerProfitabilitySummary {
    customer_count: number;
    operations: number;
    internal_trips: number;
    outsource_trips: number;
    total_trips: number;
    internal_tonnage: number;
    outsource_tonnage: number;
    total_tonnage: number;
    internal_ton_km: number;
    outsource_ton_km: number;
    total_ton_km: number;
    internal_distance: number;
    outsource_distance: number;
    total_distance: number;
    internal_expense: number;
    outsource_cost: number;
    total_cost: number;
    revenue: number;
    profit: number;
    margin_percent: number | null;
    average_km_per_trip: number | null;
    cost_per_km: number | null;
    revenue_per_ton_km: number | null;
    cost_per_ton_km: number | null;
    profit_per_ton_km: number | null;
    revenue_per_trip: number | null;
    cost_per_trip: number | null;
    tonnage_per_trip: number | null;
    outsource_trip_share_percent: number | null;
    outsource_tonnage_share_percent: number | null;
}

interface TrendPoint {
    month: string;
    revenue: number;
    cost: number;
    profit: number;
}

interface Filters {
    from: string;
    to: string;
    customer_ids?: number[];
}

interface Props {
    filters: Filters;
    rows: CustomerProfitabilityRow[];
    summary: CustomerProfitabilitySummary;
    trend: TrendPoint[];
    customers: CustomerOption[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Reports', href: '/reports/customer-profitability' },
    { title: 'Customer Profitability', href: '/reports/customer-profitability' },
];

const formatNumber = (value: number) => value.toLocaleString();

const formatDecimal = (value: number) =>
    value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const formatCurrency = (value: number) =>
    new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(value);

const formatOptionalDecimal = (value: number | null) => (value === null ? '—' : formatDecimal(value));

const formatOptionalCurrency = (value: number | null) => (value === null ? '—' : formatCurrency(value));

const formatPercentage = (value: number | null) => (value === null ? '—' : `${value.toFixed(2)}%`);

export default function CustomerProfitability({ filters, rows = [], summary, trend = [], customers = [] }: Props) {
    const [from, setFrom] = useState(filters?.from ?? '');
    const [to, setTo] = useState(filters?.to ?? '');
    const [selectedCustomers, setSelectedCustomers] = useState<number[]>(filters?.customer_ids ?? []);
    const [customerSearch, setCustomerSearch] = useState('');
    const [customerSelectorOpen, setCustomerSelectorOpen] = useState(false);

    const noCustomerFilter = selectedCustomers.length === 0;

    const selectedCustomerNames = useMemo(
        () => customers.filter((option) => selectedCustomers.includes(option.id)).map((option) => option.name),
        [customers, selectedCustomers],
    );

    const filteredCustomerOptions = useMemo(() => {
        if (!customerSearch.trim()) {
            return customers;
        }

        const query = customerSearch.trim().toLowerCase();
        return customers.filter((option) => option.name.toLowerCase().includes(query));
    }, [customerSearch, customers]);

    const handleToggleCustomer = (id: number) => {
        setSelectedCustomers((current) =>
            current.includes(id) ? current.filter((customerId) => customerId !== id) : [...current, id],
        );
    };

    const handleSelectAll = () => {
        if (noCustomerFilter || selectedCustomers.length === customers.length) {
            setSelectedCustomers(customers.map((option) => option.id));
        } else {
            setSelectedCustomers([]);
        }
    };

    const handleClearCustomers = () => setSelectedCustomers([]);

    const handleApplyFilters = () => {
        setCustomerSelectorOpen(false);

        const params: Record<string, string | number | Array<string | number>> = {};

        if (from) {
            params.from = from;
        }

        if (to) {
            params.to = to;
        }

        if (selectedCustomers.length > 0) {
            params.customer_ids = selectedCustomers;
        }

        router.get('/reports/customer-profitability', params, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleReset = () => {
        setFrom(filters?.from ?? '');
        setTo(filters?.to ?? '');
        setSelectedCustomers(filters?.customer_ids ?? []);
        setCustomerSelectorOpen(false);

        router.get('/reports/customer-profitability', {}, { preserveState: false, preserveScroll: true });
    };

    const summaryCards = [
        {
            title: 'Total Revenue',
            value: formatCurrency(summary?.revenue ?? 0),
            helper: 'Revenue captured within the selected window',
            icon: <CircleDollarSign className="h-4 w-4 text-emerald-500" />,
        },
        {
            title: 'Total Cost',
            value: formatCurrency(summary?.total_cost ?? 0),
            helper: 'Combined internal and outsourced costs',
            icon: <Coins className="h-4 w-4 text-amber-500" />,
        },
        {
            title: 'Total Profit',
            value: formatCurrency(summary?.profit ?? 0),
            helper: 'Revenue minus all captured costs',
            icon: <PiggyBank className="h-4 w-4 text-indigo-500" />,
        },
        {
            title: 'Margin %',
            value: formatPercentage(summary?.margin_percent ?? null),
            helper: 'Share of revenue retained as profit',
            icon: <Percent className="h-4 w-4 text-rose-500" />,
        },
        {
            title: 'Total Tonnage',
            value: formatDecimal(summary?.total_tonnage ?? 0),
            helper: 'Combined internal and outsourced tonnage',
            icon: <TrendingUp className="h-4 w-4 text-blue-500" />,
        },
    ];

    const appliedFrom = filters?.from ?? '';
    const appliedTo = filters?.to ?? '';
    const appliedCustomerCount = filters?.customer_ids?.length ?? 0;

    const visibleCustomerBadges = selectedCustomerNames.slice(0, 4);
    const extraCustomerCount = Math.max(selectedCustomerNames.length - visibleCustomerBadges.length, 0);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Customer Profitability" />
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-slate-100/60 dark:bg-slate-900/40">
                <div className="flex flex-1 flex-col gap-6 overflow-y-auto p-4 pb-10 sm:p-6 lg:p-10">
                    <header className="rounded-2xl border border-slate-200 bg-white/95 px-6 py-6 shadow-sm backdrop-blur dark:border-slate-800/70 dark:bg-slate-900/70">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                            <div className="space-y-2">
                                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500 dark:text-slate-400">Customer Lens</p>
                                <h1 className="text-3xl font-semibold text-slate-900 dark:text-slate-50">Customer Profitability</h1>
                                <p className="max-w-3xl text-sm text-slate-600 dark:text-slate-300">
                                    Analyse profitability, tonnage mix, and utilization by customer. Combine internal and outsourced execution to see who delivers the strongest contribution.
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
                                <CardDescription className="text-sm">Focus on specific customers and date windows.</CardDescription>
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
                                    <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Customers</span>
                                    <Popover open={customerSelectorOpen} onOpenChange={setCustomerSelectorOpen}>
                                        <PopoverTrigger asChild>
                                            <Button type="button" variant="outline" className="w-full justify-between">
                                                <span className="flex items-center gap-2 text-sm">
                                                    {noCustomerFilter ? 'All customers' : `${selectedCustomers.length} selected`}
                                                </span>
                                                <Filter className="h-3.5 w-3.5 text-slate-400" />
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-96 p-0" align="start">
                                            <div className="flex items-center justify-between px-3 py-2">
                                                <div className="flex items-center gap-2">
                                                    <Button type="button" variant="ghost" size="sm" onClick={handleSelectAll}>
                                                        {selectedCustomers.length === customers.length && customers.length > 0 ? 'Unselect all' : 'Select all'}
                                                    </Button>
                                                    <Button type="button" variant="ghost" size="sm" onClick={handleClearCustomers}>
                                                        Clear
                                                    </Button>
                                                </div>
                                            </div>
                                            <Separator />
                                            <Command>
                                                <div className="flex items-center px-3 py-2">
                                                    <CommandInput
                                                        placeholder="Search customer..."
                                                        value={customerSearch}
                                                        onValueChange={setCustomerSearch}
                                                    />
                                                </div>
                                                <CommandList className="max-h-64">
                                                    <CommandEmpty>No customers found.</CommandEmpty>
                                                    <CommandGroup heading="Customers">
                                                        <CommandItem onSelect={() => setSelectedCustomers([])} className="flex items-center gap-2">
                                                            <Checkbox checked={noCustomerFilter} />
                                                            <span className="font-medium">All customers</span>
                                                            {noCustomerFilter && <Badge variant="secondary" className="ml-auto">Active</Badge>}
                                                        </CommandItem>
                                                        {filteredCustomerOptions.map((option) => {
                                                            const checked = selectedCustomers.includes(option.id);

                                                            return (
                                                                <CommandItem
                                                                    key={option.id}
                                                                    onSelect={() => handleToggleCustomer(option.id)}
                                                                    className="flex items-center gap-2"
                                                                >
                                                                    <Checkbox checked={checked} />
                                                                    <span className="font-medium">{option.name}</span>
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
                                        {noCustomerFilter && (
                                            <Badge variant="outline" className="border-dashed text-muted-foreground">
                                                All customers included
                                            </Badge>
                                        )}
                                        {!noCustomerFilter && visibleCustomerBadges.map((name) => (
                                            <Badge key={name} variant="secondary" className="bg-slate-100 text-slate-700">
                                                {name}
                                            </Badge>
                                        ))}
                                        {!noCustomerFilter && extraCustomerCount > 0 && (
                                            <Badge variant="outline" className="border-dashed text-muted-foreground">
                                                +{extraCustomerCount} more
                                            </Badge>
                                        )}
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
                                <CardTitle className="text-lg font-semibold text-slate-900 dark:text-slate-50">Profitability Highlights</CardTitle>
                                <CardDescription className="text-sm">Key economics across all included customers.</CardDescription>
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
                                        <CardContent className="px-4 pb-4 pt-0">
                                            <CardDescription className="text-xs text-muted-foreground">{card.helper}</CardDescription>
                                        </CardContent>
                                    </Card>
                                ))}
                            </CardContent>
                        </Card>
                    </section>

                    <section className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
                        <Card className="border border-slate-200 bg-white/95 shadow-sm dark:border-slate-800/70 dark:bg-slate-900/70">
                            <CardHeader className="space-y-3 border-b border-slate-200/60 pb-4 dark:border-slate-700/60">
                                <div className="space-y-1">
                                    <CardTitle className="text-lg font-semibold text-slate-900 dark:text-slate-50">Customer Contribution</CardTitle>
                                    <CardDescription className="text-sm">Detailed profitability and utilization by customer.</CardDescription>
                                </div>
                                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                                    <Badge variant="outline">From {appliedFrom || '—'}</Badge>
                                    <Badge variant="outline">To {appliedTo || '—'}</Badge>
                                    <Badge variant="outline">
                                        {appliedCustomerCount > 0
                                            ? `${appliedCustomerCount} customer${appliedCustomerCount > 1 ? 's' : ''}`
                                            : 'All customers'}
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader className="bg-slate-50/60 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-900/60 dark:text-slate-400">
                                            <TableRow className="divide-x divide-slate-200/40 dark:divide-slate-800/50">
                                                <TableHead className="whitespace-nowrap">Customer</TableHead>
                                                <TableHead className="whitespace-nowrap text-right">Operations</TableHead>
                                                <TableHead className="whitespace-nowrap text-right">Lanes</TableHead>
                                                <TableHead className="whitespace-nowrap text-right">Internal Trips</TableHead>
                                                <TableHead className="whitespace-nowrap text-right">Outsource Trips</TableHead>
                                                <TableHead className="whitespace-nowrap text-right">Total Trips</TableHead>
                                                <TableHead className="whitespace-nowrap text-right">Total Tonnage (MT)</TableHead>
                                                <TableHead className="whitespace-nowrap text-right">Revenue</TableHead>
                                                <TableHead className="whitespace-nowrap text-right">Total Cost</TableHead>
                                                <TableHead className="whitespace-nowrap text-right">Profit</TableHead>
                                                <TableHead className="whitespace-nowrap text-right">Margin %</TableHead>
                                                <TableHead className="whitespace-nowrap text-right">Revenue / Trip</TableHead>
                                                <TableHead className="whitespace-nowrap text-right">Cost / Trip</TableHead>
                                                <TableHead className="whitespace-nowrap text-right">Cost / Km</TableHead>
                                                <TableHead className="whitespace-nowrap text-right">Outsource Trip Share %</TableHead>
                                                <TableHead className="whitespace-nowrap text-right">Outsource Tonnage Share %</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {rows.length === 0 && (
                                                <TableRow>
                                                    <TableCell colSpan={16} className="py-6 text-center text-sm text-muted-foreground">
                                                        No data available for the selected filters.
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                            {rows.map((row) => (
                                                <TableRow
                                                    key={row.customer_id}
                                                    className="divide-x divide-slate-100/60 dark:divide-slate-800/60"
                                                >
                                                    <TableCell className="whitespace-nowrap font-medium text-slate-900 dark:text-slate-50">
                                                        {row.customer_name}
                                                    </TableCell>
                                                    <TableCell className="whitespace-nowrap text-right">{formatNumber(row.operations)}</TableCell>
                                                    <TableCell className="whitespace-nowrap text-right">{formatNumber(row.lanes_used)}</TableCell>
                                                    <TableCell className="whitespace-nowrap text-right">{formatNumber(row.internal_trips)}</TableCell>
                                                    <TableCell className="whitespace-nowrap text-right">{formatNumber(row.outsource_trips)}</TableCell>
                                                    <TableCell className="whitespace-nowrap text-right">{formatNumber(row.total_trips)}</TableCell>
                                                    <TableCell className="whitespace-nowrap text-right">{formatDecimal(row.total_tonnage)}</TableCell>
                                                    <TableCell className="whitespace-nowrap text-right">{formatCurrency(row.revenue)}</TableCell>
                                                    <TableCell className="whitespace-nowrap text-right">{formatCurrency(row.total_cost)}</TableCell>
                                                    <TableCell className="whitespace-nowrap text-right">{formatCurrency(row.profit)}</TableCell>
                                                    <TableCell className="whitespace-nowrap text-right">{formatPercentage(row.margin_percent)}</TableCell>
                                                    <TableCell className="whitespace-nowrap text-right">{formatOptionalCurrency(row.revenue_per_trip)}</TableCell>
                                                    <TableCell className="whitespace-nowrap text-right">{formatOptionalCurrency(row.cost_per_trip)}</TableCell>
                                                    <TableCell className="whitespace-nowrap text-right">{formatOptionalCurrency(row.cost_per_km)}</TableCell>
                                                    <TableCell className="whitespace-nowrap text-right">{formatPercentage(row.outsource_trip_share_percent)}</TableCell>
                                                    <TableCell className="whitespace-nowrap text-right">{formatPercentage(row.outsource_tonnage_share_percent)}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                        <TableFooter>
                                            <TableRow className="divide-x divide-slate-200/40 bg-slate-50/70 font-semibold dark:divide-slate-800/60 dark:bg-slate-900/70">
                                                <TableCell colSpan={3}>
                                                    Totals ({formatNumber(summary.customer_count)} customers)
                                                </TableCell>
                                                <TableCell className="text-right">{formatNumber(summary.internal_trips)}</TableCell>
                                                <TableCell className="text-right">{formatNumber(summary.outsource_trips)}</TableCell>
                                                <TableCell className="text-right">{formatNumber(summary.total_trips)}</TableCell>
                                                <TableCell className="text-right">{formatDecimal(summary.total_tonnage)}</TableCell>
                                                <TableCell className="text-right">{formatCurrency(summary.revenue)}</TableCell>
                                                <TableCell className="text-right">{formatCurrency(summary.total_cost)}</TableCell>
                                                <TableCell className="text-right">{formatCurrency(summary.profit)}</TableCell>
                                                <TableCell className="text-right">{formatPercentage(summary.margin_percent)}</TableCell>
                                                <TableCell className="text-right">{formatOptionalCurrency(summary.revenue_per_trip)}</TableCell>
                                                <TableCell className="text-right">{formatOptionalCurrency(summary.cost_per_trip)}</TableCell>
                                                <TableCell className="text-right">{formatOptionalCurrency(summary.cost_per_km)}</TableCell>
                                                <TableCell className="text-right">{formatPercentage(summary.outsource_trip_share_percent)}</TableCell>
                                                <TableCell className="text-right">{formatPercentage(summary.outsource_tonnage_share_percent)}</TableCell>
                                            </TableRow>
                                        </TableFooter>
                                    </Table>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border border-slate-200 bg-white/95 shadow-sm dark:border-slate-800/70 dark:bg-slate-900/70">
                            <CardHeader className="space-y-2 border-b border-slate-200/60 pb-4 dark:border-slate-700/60">
                                <CardTitle className="text-lg font-semibold text-slate-900 dark:text-slate-50">Revenue & Margin Trend</CardTitle>
                                <CardDescription className="text-sm">Month-over-month movement in revenue, cost, and profit.</CardDescription>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="max-h-[320px] overflow-auto">
                                    <Table>
                                        <TableHeader className="bg-slate-50/60 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-900/60 dark:text-slate-400">
                                            <TableRow>
                                                <TableHead>Month</TableHead>
                                                <TableHead className="text-right">Revenue</TableHead>
                                                <TableHead className="text-right">Cost</TableHead>
                                                <TableHead className="text-right">Profit</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {trend.length === 0 && (
                                                <TableRow>
                                                    <TableCell colSpan={4} className="py-6 text-center text-sm text-muted-foreground">
                                                        No trend data available for the selected filters.
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                            {trend.map((item) => (
                                                <TableRow key={item.month}>
                                                    <TableCell>{item.month}</TableCell>
                                                    <TableCell className="text-right">{formatCurrency(item.revenue)}</TableCell>
                                                    <TableCell className="text-right">{formatCurrency(item.cost)}</TableCell>
                                                    <TableCell className="text-right">{formatCurrency(item.profit)}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </CardContent>
                        </Card>
                    </section>
                </div>
            </div>
        </AppLayout>
    );
}



