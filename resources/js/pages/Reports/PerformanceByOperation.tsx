import { useMemo, useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import {
    Activity,
    BarChart3,
    Building2,
    Factory,
    FileDigit,
    FileSpreadsheet,
    FileType2,
    Filter,
    Layers3,
    RefreshCcw,
    Search,
    Truck,
} from 'lucide-react';

interface OperationOption {
    id: number;
    code: string;
    customer_name: string;
}

interface CustomerHighlight {
    customer_id: number | null;
    customer_name: string;
    operations: number;
    internal_trips: number;
    outsource_trips: number;
    tonnage: number;
    revenue: number;
    cost: number;
    profit: number;
    margin_percent: number | null;
}

interface MixTrendPoint {
    period: string;
    internal_trips: number;
    outsource_trips: number;
    total_trips: number;
    internal_tonnage: number;
    outsource_tonnage: number;
}

interface OperationReportRow {
    operation_id: number;
    customer_id: number | null;
    operation_code: string;
    customer_name: string;
    status: string | null;
    start_date: string | null;
    end_date: string | null;
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
    tariff: number | null;
    revenue: number;
    profit: number;
    margin_percent: number | null;
    average_km_per_trip: number | null;
    cost_per_km: number | null;
}

interface OperationReportSummary {
    operation_count: number;
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
}

interface Filters {
    from: string;
    to: string;
    operation_ids?: number[];
}

interface PerformanceByOperationProps {
    filters: Filters;
    rows: OperationReportRow[];
    summary: OperationReportSummary;
    operations: OperationOption[];
    customerHighlights?: CustomerHighlight[];
    mixTrend?: MixTrendPoint[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Reports', href: '/reports/performance-by-operation' },
    { title: 'Performance by Operation', href: '/reports/performance-by-operation' },
];

const formatNumber = (value: number) => value.toLocaleString();

const formatDecimal = (value: number) => value.toLocaleString(undefined, { maximumFractionDigits: 2, minimumFractionDigits: 2 });

const formatCurrency = (value: number) =>
    new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(value);

const formatPercentage = (value: number | null) => (value === null ? '—' : `${value.toFixed(2)}%`);

export default function PerformanceByOperation({ filters, rows = [], summary, operations, customerHighlights = [], mixTrend = [] }: PerformanceByOperationProps) {
    const [from, setFrom] = useState(filters?.from ?? '');
    const [to, setTo] = useState(filters?.to ?? '');
    const [selectedOperations, setSelectedOperations] = useState<number[]>(filters?.operation_ids ?? []);
    const [operationSearch, setOperationSearch] = useState('');
    const [operationSelectorOpen, setOperationSelectorOpen] = useState(false);

    const noOperationFilter = selectedOperations.length === 0;

    const selectedOperationCodes = useMemo(
        () => operations.filter((option) => selectedOperations.includes(option.id)).map((option) => option.code),
        [operations, selectedOperations],
    );

    const filteredOperationOptions = useMemo(() => {
        if (!operationSearch.trim()) {
            return operations;
        }

        const term = operationSearch.trim().toLowerCase();
        return operations.filter((option) => option.code.toLowerCase().includes(term) || option.customer_name.toLowerCase().includes(term));
    }, [operationSearch, operations]);

    const handleToggleOperation = (id: number) => {
        setSelectedOperations((current) => (current.includes(id) ? current.filter((operationId) => operationId !== id) : [...current, id]));
    };

    const handleSelectAll = () => {
        if (noOperationFilter || selectedOperations.length === operations.length) {
            setSelectedOperations(operations.map((option) => option.id));
        } else {
            setSelectedOperations([]);
        }
    };

    const handleClearOperations = () => setSelectedOperations([]);

    const handleApplyFilters = () => {
        setOperationSelectorOpen(false);
        const params: Record<string, string | number | Array<string | number>> = {};

        if (from) {
            params.from = from;
        }
        if (to) {
            params.to = to;
        }

        if (selectedOperations.length > 0) {
            params.operation_ids = selectedOperations;
        }

        router.get('/reports/performance-by-operation', params, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleReset = () => {
        setFrom(filters?.from ?? '');
        setTo(filters?.to ?? '');
        setSelectedOperations(filters?.operation_ids ?? []);
        setOperationSelectorOpen(false);
        router.get('/reports/performance-by-operation', {}, { preserveState: false, preserveScroll: true });
    };

    const handleExport = (format: 'csv' | 'xlsx' | 'pdf') => {
        const params = new URLSearchParams();

        if (from) params.set('from', from);
        if (to) params.set('to', to);

        if (selectedOperations.length > 0) {
            selectedOperations.forEach((operationId) => {
                params.append('operation_ids[]', String(operationId));
            });
        }

        const query = params.toString();
        const url = `/reports/performance-by-operation/export/${format}${query ? `?${query}` : ''}`;
        window.location.href = url;
    };

    const summaryCards = [
        {
            title: 'Active Operations',
            value: formatNumber(summary?.operation_count ?? 0),
            helper: 'Operations contributing data within the window',
            icon: <Factory className="h-3.5 w-3.5 text-blue-600" />,
            valueClassName: 'text-blue-600',
        },
        {
            title: 'Internal Trips',
            value: formatNumber(summary?.internal_trips ?? 0),
            helper: `${formatDecimal(summary?.internal_tonnage ?? 0)} MT moved internally`,
            icon: <Activity className="h-3.5 w-3.5 text-sky-600" />,
            valueClassName: 'text-sky-600',
        },
        {
            title: 'Outsource Trips',
            value: formatNumber(summary?.outsource_trips ?? 0),
            helper: `${formatDecimal(summary?.outsource_tonnage ?? 0)} MT via partners`,
            icon: <Truck className="h-3.5 w-3.5 text-purple-600" />,
            valueClassName: 'text-purple-600',
        },
        {
            title: 'Total Tonnage',
            value: formatDecimal(summary?.total_tonnage ?? 0),
            helper: 'Aggregate tonnage across internal & outsource',
            icon: <Layers3 className="h-3.5 w-3.5 text-indigo-600" />,
            valueClassName: 'text-indigo-600',
        },
        {
            title: 'Total Revenue',
            value: formatCurrency(summary?.revenue ?? 0),
            helper: 'Tariff multiplied by delivered tonnage',
            icon: <BarChart3 className="h-3.5 w-3.5 text-emerald-600" />,
            valueClassName: 'text-emerald-600',
        },
        {
            title: 'Net Margin',
            value: `${formatCurrency(summary?.profit ?? 0)} · ${formatPercentage(summary?.margin_percent ?? null)}`,
            helper: 'Revenue less internal and outsource costs',
            icon: <Building2 className="h-3.5 w-3.5 text-teal-600" />,
            valueClassName: 'text-teal-600',
        },
    ];

    const visibleOperationBadges = selectedOperationCodes.slice(0, 4);
    const extraOperationCount = Math.max(selectedOperationCodes.length - visibleOperationBadges.length, 0);

    const appliedFrom = filters?.from ?? '';
    const appliedTo = filters?.to ?? '';
    const appliedOperationCount = filters?.operation_ids?.length ?? 0;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Performance by Operation" />
            <div className="flex flex-1 min-h-0 flex-col overflow-hidden bg-slate-100/60 dark:bg-slate-900/40">
                <div className="flex flex-1 flex-col gap-6 overflow-y-auto p-4 pb-10 sm:p-6 lg:p-10">
                    <header className="rounded-2xl border border-slate-200 bg-white/95 px-6 py-6 shadow-sm backdrop-blur dark:border-slate-800/70 dark:bg-slate-900/70">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                            <div className="space-y-2">
                                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500 dark:text-slate-400">Operations Intelligence</p>
                                <h1 className="text-3xl font-semibold text-slate-900 dark:text-slate-50">Performance by Operation</h1>
                                <p className="max-w-3xl text-sm text-slate-600 dark:text-slate-300">
                                    Compare internal and outsourced execution for every operation. Track throughput, costs, and profitability from a single control panel.
                                </p>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button type="button" variant="secondary" className="gap-2">
                                            Export
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-48">
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

                    <section className="grid gap-6 lg:grid-cols-[360px_1fr]">
                        <Card className="flex h-full flex-col border border-slate-200 bg-white/95 shadow-sm dark:border-slate-800/70 dark:bg-slate-900/70">
                            <CardHeader className="space-y-2">
                                <CardTitle className="text-lg font-semibold text-slate-900 dark:text-slate-50">Filters</CardTitle>
                                <CardDescription className="text-sm">
                                    Set your analysis window and focus on the operations that matter most.
                                </CardDescription>
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
                                    <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Operations</span>
                                    <Popover open={operationSelectorOpen} onOpenChange={setOperationSelectorOpen}>
                                        <PopoverTrigger asChild>
                                            <Button type="button" variant="outline" className="w-full justify-between">
                                                <span className="flex items-center gap-2 text-sm">
                                                    {noOperationFilter ? 'All operations' : `${selectedOperations.length} selected`}
                                                </span>
                                                <Filter className="h-3.5 w-3.5 text-slate-400" />
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-96 p-0" align="start">
                                            <div className="flex items-center justify-between px-3 py-2">
                                                <div className="flex items-center gap-2">
                                                    <Button type="button" variant="ghost" size="sm" onClick={handleSelectAll}>
                                                        {selectedOperations.length === operations.length && operations.length > 0 ? 'Unselect all' : 'Select all'}
                                                    </Button>
                                                    <Button type="button" variant="ghost" size="sm" onClick={handleClearOperations}>
                                                        Clear
                                                    </Button>
                                                </div>
                                            </div>
                                            <Separator />
                                            <Command>
                                                <div className="flex items-center px-3 py-2">
                                                    <Search className="mr-2 h-4 w-4 text-muted-foreground" />
                                                    <CommandInput
                                                        placeholder="Search operation or customer..."
                                                        value={operationSearch}
                                                        onValueChange={setOperationSearch}
                                                    />
                                                </div>
                                                <CommandList className="max-h-64">
                                                    <CommandEmpty>No operations found.</CommandEmpty>
                                                    <CommandGroup heading="Operations">
                                                        <CommandItem onSelect={() => setSelectedOperations([])} className="flex items-center gap-2">
                                                            <Checkbox checked={noOperationFilter} />
                                                            <span className="font-medium">All operations</span>
                                                            {noOperationFilter && <Badge variant="secondary" className="ml-auto">Active</Badge>}
                                                        </CommandItem>
                                                        {filteredOperationOptions.map((option) => {
                                                            const checked = selectedOperations.includes(option.id);

                                                            return (
                                                                <CommandItem
                                                                    key={option.id}
                                                                    onSelect={() => handleToggleOperation(option.id)}
                                                                    className="flex items-center gap-2"
                                                                >
                                                                    <Checkbox checked={checked} />
                                                                    <span className="font-medium">{option.code}</span>
                                                                    <span className="ml-auto text-xs text-muted-foreground">{option.customer_name}</span>
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
                                        {noOperationFilter && (
                                            <Badge variant="outline" className="border-dashed text-muted-foreground">
                                                All operations included
                                            </Badge>
                                        )}
                                        {!noOperationFilter && visibleOperationBadges.map((code) => (
                                            <Badge key={code} variant="secondary" className="bg-slate-100 text-slate-700">
                                                {code}
                                            </Badge>
                                        ))}
                                        {!noOperationFilter && extraOperationCount > 0 && (
                                            <Badge variant="outline" className="border-dashed text-muted-foreground">
                                                +{extraOperationCount} more
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
                                    Generate report
                                </Button>
                            </CardFooter>
                        </Card>

                        <Card className="flex h-full flex-col border border-slate-200 bg-white/95 shadow-sm dark:border-slate-800/70 dark:bg-slate-900/70">
                            <CardHeader className="space-y-2">
                                <CardTitle className="text-lg font-semibold text-slate-900 dark:text-slate-50">Key Metrics</CardTitle>
                                <CardDescription className="text-sm">Blend internal performance with outsource activity for rapid insight.</CardDescription>
                            </CardHeader>
                            <CardContent className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
                                {summaryCards.map((card) => (
                                    <Card key={card.title} className="border border-slate-200/80 bg-white/90 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800/70 dark:bg-slate-950/60">
                                        <CardHeader className="flex flex-row items-start justify-between space-y-0 p-4">
                                            <div className="space-y-1">
                                                <CardTitle className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                                    {card.title}
                                                </CardTitle>
                                                <div className={`text-xl font-semibold text-slate-900 dark:text-slate-50 ${card.valueClassName ?? ''}`}>
                                                    {card.value}
                                                </div>
                                            </div>
                                            {card.icon}
                                        </CardHeader>
                                        <CardContent className="px-4 pb-4 pt-0">
                                            <CardDescription className="text-xs text-muted-foreground">
                                                {card.helper}
                                            </CardDescription>
                                        </CardContent>
                                    </Card>
                                ))}
                            </CardContent>
                        </Card>
                    </section>

                    {(customerHighlights.length > 0 || mixTrend.length > 0) && (
                        <section className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
                            <Card className="border border-slate-200 bg-white/95 shadow-sm dark:border-slate-800/70 dark:bg-slate-900/70">
                                <CardHeader className="space-y-2 border-b border-slate-200/60 pb-4 dark:border-slate-700/60">
                                    <CardTitle className="text-lg font-semibold text-slate-900 dark:text-slate-50">Top Customers by Revenue</CardTitle>
                                    <CardDescription className="text-sm">Identify who drives the largest share of operation throughput.</CardDescription>
                                </CardHeader>
                                <CardContent className="p-0">
                                    <div className="overflow-x-auto">
                                        <Table>
                                            <TableHeader className="bg-slate-50/60 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-900/60 dark:text-slate-400">
                                                <TableRow>
                                                    <TableHead>Customer</TableHead>
                                                    <TableHead className="text-right">Operations</TableHead>
                                                    <TableHead className="text-right">Internal / Outsource Trips</TableHead>
                                                    <TableHead className="text-right">Tonnage (MT)</TableHead>
                                                    <TableHead className="text-right">Revenue</TableHead>
                                                    <TableHead className="text-right">Profit</TableHead>
                                                    <TableHead className="text-right">Margin %</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {customerHighlights.length === 0 && (
                                                    <TableRow>
                                                        <TableCell colSpan={7} className="py-6 text-center text-sm text-muted-foreground">
                                                            No customer revenue highlights available.
                                                        </TableCell>
                                                    </TableRow>
                                                )}
                                                {customerHighlights.map((customer) => (
                                                    <TableRow key={customer.customer_id ?? customer.customer_name} className="divide-x divide-slate-100/60 dark:divide-slate-800/60">
                                                        <TableCell className="max-w-[200px] truncate text-sm font-medium text-slate-900 dark:text-slate-50" title={customer.customer_name}>
                                                            {customer.customer_name}
                                                        </TableCell>
                                                        <TableCell className="text-right text-sm">{formatNumber(customer.operations)}</TableCell>
                                                        <TableCell className="text-right text-xs text-muted-foreground">
                                                            <span className="font-semibold text-foreground">{formatNumber(customer.internal_trips)}</span>
                                                            <span className="mx-1">/</span>
                                                            <span>{formatNumber(customer.outsource_trips)}</span>
                                                        </TableCell>
                                                        <TableCell className="text-right text-sm">{formatDecimal(customer.tonnage)}</TableCell>
                                                        <TableCell className="text-right text-sm">{formatCurrency(customer.revenue)}</TableCell>
                                                        <TableCell className="text-right text-sm">{formatCurrency(customer.profit)}</TableCell>
                                                        <TableCell className="text-right text-xs">
                                                            <span className={customer.margin_percent === null ? 'text-muted-foreground' : customer.margin_percent >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}>
                                                                {formatPercentage(customer.margin_percent)}
                                                            </span>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="border border-slate-200 bg-white/95 shadow-sm dark:border-slate-800/70 dark:bg-slate-900/70">
                                <CardHeader className="space-y-2 border-b border-slate-200/60 pb-4 dark:border-slate-700/60">
                                    <CardTitle className="text-lg font-semibold text-slate-900 dark:text-slate-50">Mix Trend by Month</CardTitle>
                                    <CardDescription className="text-sm">Track internal versus outsource balance over time.</CardDescription>
                                </CardHeader>
                                <CardContent className="p-0">
                                    <div className="max-h-[320px] overflow-auto">
                                        <Table>
                                            <TableHeader className="bg-slate-50/60 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-900/60 dark:text-slate-400">
                                                <TableRow>
                                                    <TableHead>Period</TableHead>
                                                    <TableHead className="text-right">Internal Trips</TableHead>
                                                    <TableHead className="text-right">Outsource Trips</TableHead>
                                                    <TableHead className="text-right">Total Trips</TableHead>
                                                    <TableHead className="text-right">Internal MT</TableHead>
                                                    <TableHead className="text-right">Outsource MT</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {mixTrend.length === 0 && (
                                                    <TableRow>
                                                        <TableCell colSpan={6} className="py-6 text-center text-sm text-muted-foreground">
                                                            No trend data available for the selected filters.
                                                        </TableCell>
                                                    </TableRow>
                                                )}
                                                {mixTrend.map((period) => (
                                                    <TableRow key={period.period} className="divide-x divide-slate-100/60 dark:divide-slate-800/60">
                                                        <TableCell>{period.period}</TableCell>
                                                        <TableCell className="text-right text-sm">{formatNumber(period.internal_trips)}</TableCell>
                                                        <TableCell className="text-right text-sm">{formatNumber(period.outsource_trips)}</TableCell>
                                                        <TableCell className="text-right text-sm">{formatNumber(period.total_trips)}</TableCell>
                                                        <TableCell className="text-right text-sm">{formatDecimal(period.internal_tonnage)}</TableCell>
                                                        <TableCell className="text-right text-sm">{formatDecimal(period.outsource_tonnage)}</TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                </CardContent>
                            </Card>
                        </section>
                    )}

                    <Card className="border border-slate-200 bg-white/95 shadow-sm dark:border-slate-800/70 dark:bg-slate-900/70">
                        <CardHeader className="space-y-3 border-b border-slate-200/60 pb-5 dark:border-slate-700/60">
                            <div className="space-y-1">
                                <CardTitle className="text-lg font-semibold text-slate-900 dark:text-slate-50">Operation Performance Detail</CardTitle>
                                <CardDescription className="text-sm">Internal versus outsource contribution for each operation.</CardDescription>
                            </div>
                            <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                                <Badge variant="outline">From {appliedFrom || '—'}</Badge>
                                <Badge variant="outline">To {appliedTo || '—'}</Badge>
                                <Badge variant="outline">
                                    {appliedOperationCount > 0
                                        ? `${appliedOperationCount} operation${appliedOperationCount > 1 ? 's' : ''}`
                                        : 'All operations'}
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader className="bg-slate-50/60 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-900/60 dark:text-slate-400">
                                        <TableRow className="divide-x divide-slate-200/40 dark:divide-slate-800/50">
                                            <TableHead className="whitespace-nowrap">Operation</TableHead>
                                            <TableHead className="whitespace-nowrap">Customer</TableHead>
                                            <TableHead className="whitespace-nowrap text-right">Internal Trips</TableHead>
                                            <TableHead className="whitespace-nowrap text-right">Outsource Trips</TableHead>
                                            <TableHead className="whitespace-nowrap text-right">Total Trips</TableHead>
                                            <TableHead className="whitespace-nowrap text-right">Internal Tonnage (MT)</TableHead>
                                            <TableHead className="whitespace-nowrap text-right">Outsource Tonnage (MT)</TableHead>
                                            <TableHead className="whitespace-nowrap text-right">Total Tonnage (MT)</TableHead>
                                            <TableHead className="whitespace-nowrap text-right">Total Distance (KM)</TableHead>
                                            <TableHead className="whitespace-nowrap text-right">Avg Km/Trip</TableHead>
                                            <TableHead className="whitespace-nowrap text-right">Cost per Km</TableHead>
                                            <TableHead className="whitespace-nowrap text-right">Internal Expense</TableHead>
                                            <TableHead className="whitespace-nowrap text-right">Outsource Cost</TableHead>
                                            <TableHead className="whitespace-nowrap text-right">Total Cost</TableHead>
                                            <TableHead className="whitespace-nowrap text-right">Revenue</TableHead>
                                            <TableHead className="whitespace-nowrap text-right">Profit</TableHead>
                                            <TableHead className="whitespace-nowrap text-right">Margin %</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {rows.length === 0 && (
                                            <TableRow>
                                                <TableCell colSpan={17} className="py-6 text-center text-sm text-muted-foreground">
                                                    No data available for the selected filters.
                                                </TableCell>
                                            </TableRow>
                                        )}
                                        {rows.map((row) => (
                                            <TableRow key={row.operation_id} className="divide-x divide-slate-100/60 dark:divide-slate-800/60">
                                                <TableCell className="whitespace-nowrap font-medium text-slate-900 dark:text-slate-50">
                                                    {row.operation_code}
                                                </TableCell>
                                                <TableCell className="whitespace-nowrap text-slate-600 dark:text-slate-300">
                                                    {row.customer_name}
                                                </TableCell>
                                                <TableCell className="whitespace-nowrap text-right">{formatNumber(row.internal_trips)}</TableCell>
                                                <TableCell className="whitespace-nowrap text-right">{formatNumber(row.outsource_trips)}</TableCell>
                                                <TableCell className="whitespace-nowrap text-right">{formatNumber(row.total_trips)}</TableCell>
                                                <TableCell className="whitespace-nowrap text-right">{formatDecimal(row.internal_tonnage)}</TableCell>
                                                <TableCell className="whitespace-nowrap text-right">{formatDecimal(row.outsource_tonnage)}</TableCell>
                                                <TableCell className="whitespace-nowrap text-right">{formatDecimal(row.total_tonnage)}</TableCell>
                                                <TableCell className="whitespace-nowrap text-right">{formatDecimal(row.total_distance)}</TableCell>
                                                <TableCell className="whitespace-nowrap text-right">
                                                    {row.average_km_per_trip === null ? '—' : formatDecimal(row.average_km_per_trip)}
                                                </TableCell>
                                                <TableCell className="whitespace-nowrap text-right">
                                                    {row.cost_per_km === null ? '—' : formatCurrency(row.cost_per_km)}
                                                </TableCell>
                                                <TableCell className="whitespace-nowrap text-right">{formatCurrency(row.internal_expense)}</TableCell>
                                                <TableCell className="whitespace-nowrap text-right">{formatCurrency(row.outsource_cost)}</TableCell>
                                                <TableCell className="whitespace-nowrap text-right">{formatCurrency(row.total_cost)}</TableCell>
                                                <TableCell className="whitespace-nowrap text-right">{formatCurrency(row.revenue)}</TableCell>
                                                <TableCell className="whitespace-nowrap text-right">{formatCurrency(row.profit)}</TableCell>
                                                <TableCell className="whitespace-nowrap text-right">{formatPercentage(row.margin_percent)}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                    <TableFooter>
                                        <TableRow className="divide-x divide-slate-200/40 bg-slate-50/70 font-semibold dark:divide-slate-800/60 dark:bg-slate-900/70">
                                            <TableCell colSpan={2}>Totals ({summary.operation_count} operations)</TableCell>
                                            <TableCell className="text-right">{formatNumber(summary.internal_trips)}</TableCell>
                                            <TableCell className="text-right">{formatNumber(summary.outsource_trips)}</TableCell>
                                            <TableCell className="text-right">{formatNumber(summary.total_trips)}</TableCell>
                                            <TableCell className="text-right">{formatDecimal(summary.internal_tonnage)}</TableCell>
                                            <TableCell className="text-right">{formatDecimal(summary.outsource_tonnage)}</TableCell>
                                            <TableCell className="text-right">{formatDecimal(summary.total_tonnage)}</TableCell>
                                            <TableCell className="text-right">{formatDecimal(summary.total_distance)}</TableCell>
                                            <TableCell className="text-right">{summary.average_km_per_trip === null ? '—' : formatDecimal(summary.average_km_per_trip)}</TableCell>
                                            <TableCell className="text-right">{summary.cost_per_km === null ? '—' : formatCurrency(summary.cost_per_km)}</TableCell>
                                            <TableCell className="text-right">{formatCurrency(summary.internal_expense)}</TableCell>
                                            <TableCell className="text-right">{formatCurrency(summary.outsource_cost)}</TableCell>
                                            <TableCell className="text-right">{formatCurrency(summary.total_cost)}</TableCell>
                                            <TableCell className="text-right">{formatCurrency(summary.revenue)}</TableCell>
                                            <TableCell className="text-right">{formatCurrency(summary.profit)}</TableCell>
                                            <TableCell className="text-right">{formatPercentage(summary.margin_percent)}</TableCell>
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
