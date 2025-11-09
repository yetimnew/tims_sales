import { useMemo } from 'react';
import type { FormEvent } from 'react';
import { Head, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { BreadcrumbItem } from '@/types';
import {
    Area,
    AreaChart,
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Legend,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis
} from 'recharts';
import {
    Calendar,
    RefreshCw,
    TrendingDown,
    TrendingUp,
    Navigation2,
    Target,
    Fuel,
    Truck
} from 'lucide-react';

interface CockpitProps {
    filters: {
        startDate?: string | null;
        endDate?: string | null;
    };
    summary: {
        totalRevenue: number;
        totalCost: number;
        netProfit: number;
        costPerTon: number;
        totalTonnage: number;
        totalTrips: number;
        completedTrips: number;
        openTrips: number;
        avgTripDistance: number;
        avgLoadedDistance: number;
        avgTonKm: number;
    };
    financialTrend: Array<{
        period: string;
        revenue: number;
        cost: number;
        profit: number;
    }>;
    costBreakdown: Array<{
        name: string;
        value: number;
    }>;
    tripCompletion: {
        targetTrips: number;
        completedTrips: number;
        openTrips: number;
        completionRate: number;
    };
    routeEfficiency: Array<{
        id: string;
        origin: string;
        destination: string;
        totalTrips: number;
        avgDistance: number;
        avgTonKm: number;
        totalTonnage: number;
    }>;
    underperformingTrips: Array<{
        id: number;
        trip?: string | null;
        status?: string | null;
        driver?: string | null;
        truck?: string | null;
        origin?: string | null;
        destination?: string | null;
        tonnage?: number | null;
        tonKm?: number | null;
        ageDays?: number | null;
    }>;
    driverOutliers: Array<{
        driverTruckId: number | null;
        driver: string;
        truck: string;
        fuelPerTon: number | null;
        totalFuelCost: number;
        totalTonnage: number;
    }>;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Analytics', href: '/analytics/cockpit' }
];

const costColors = ['#0ea5e9', '#22c55e', '#f97316', '#a855f7', '#6366f1', '#facc15'];

export default function Cockpit(props: CockpitProps) {
    const {
        filters,
        summary,
        financialTrend,
        costBreakdown,
        tripCompletion,
        routeEfficiency,
        underperformingTrips,
        driverOutliers
    } = props;

    const { data, setData, get, processing } = useForm({
        start_date: filters.startDate ?? '',
        end_date: filters.endDate ?? '',
    });

    const formatAmount = useMemo(() => new Intl.NumberFormat(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }), []);

    const formatCompact = useMemo(() => new Intl.NumberFormat(undefined, {
        notation: 'compact',
        maximumFractionDigits: 1,
    }), []);

    const submitFilters = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        get('/analytics/cockpit', {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    const applyPreset = (days: number) => {
        const end = new Date();
        const start = new Date();
        start.setDate(end.getDate() - (days - 1));

        const startValue = start.toISOString().slice(0, 10);
        const endValue = end.toISOString().slice(0, 10);

        setData(prev => ({ ...prev, start_date: startValue, end_date: endValue }));
        // Delay submit to allow state update before dispatching the request.
        requestAnimationFrame(() => {
            get('/analytics/cockpit', {
                preserveState: true,
                preserveScroll: true,
                replace: true,
            });
        });
    };

    const resetFilters = () => {
    setData(() => ({ start_date: '', end_date: '' }));
        requestAnimationFrame(() => {
            get('/analytics/cockpit', {
                preserveState: false,
                preserveScroll: true,
                replace: true,
            });
        });
    };

    const tripCompletionData = useMemo(() => [
        {
            name: 'Trips',
            completed: tripCompletion.completedTrips,
            open: tripCompletion.openTrips,
            target: tripCompletion.targetTrips,
        }
    ], [tripCompletion]);

    const positiveMargin = summary.netProfit >= 0;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Fleet Analytics Cockpit" />
            <div className="flex flex-1 flex-col gap-6 overflow-y-auto p-4">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Fleet Analytics Cockpit</h1>
                        <p className="text-muted-foreground">Monitor revenue, trip efficiency, and operational outliers in one view.</p>
                    </div>
                    <form onSubmit={submitFilters} className="flex flex-col gap-2 rounded-lg border border-border/80 bg-background/80 p-3 shadow-sm sm:flex-row sm:items-end sm:gap-3">
                        <div className="flex flex-col gap-1">
                            <label htmlFor="start_date" className="text-xs font-medium uppercase text-muted-foreground">Start Date</label>
                            <Input
                                id="start_date"
                                type="date"
                                value={data.start_date}
                                onChange={event => setData('start_date', event.target.value)}
                                max={data.end_date || undefined}
                            />
                        </div>
                        <div className="flex flex-col gap-1">
                            <label htmlFor="end_date" className="text-xs font-medium uppercase text-muted-foreground">End Date</label>
                            <Input
                                id="end_date"
                                type="date"
                                value={data.end_date}
                                onChange={event => setData('end_date', event.target.value)}
                                min={data.start_date || undefined}
                                max={new Date().toISOString().slice(0, 10)}
                            />
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            <Button type="submit" disabled={processing}>
                                <Calendar className="mr-2 h-4 w-4" />Apply
                            </Button>
                            <Button type="button" variant="outline" onClick={() => applyPreset(30)} disabled={processing}>
                                30d
                            </Button>
                            <Button type="button" variant="outline" onClick={() => applyPreset(90)} disabled={processing}>
                                90d
                            </Button>
                            <Button type="button" variant="ghost" onClick={resetFilters} disabled={processing}>
                                <RefreshCw className="mr-2 h-4 w-4" />Reset
                            </Button>
                        </div>
                    </form>
                </div>

                <div className="grid gap-4 lg:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                            <TrendingUp className="h-4 w-4 text-emerald-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{formatAmount.format(summary.totalRevenue)}</div>
                            <p className="text-xs text-muted-foreground">Across {formatCompact.format(summary.totalTrips)} trips</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
                            <TrendingDown className="h-4 w-4 text-red-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{formatAmount.format(summary.totalCost)}</div>
                            <p className="text-xs text-muted-foreground">Cost per ton {formatAmount.format(summary.costPerTon)}</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
                            {positiveMargin ? (
                                <TrendingUp className="h-4 w-4 text-emerald-500" />
                            ) : (
                                <TrendingDown className="h-4 w-4 text-red-500" />
                            )}
                        </CardHeader>
                        <CardContent>
                            <div className={`text-2xl font-bold ${positiveMargin ? 'text-emerald-600' : 'text-red-600'}`}>
                                {formatAmount.format(summary.netProfit)}
                            </div>
                            <p className="text-xs text-muted-foreground">Tonnage moved {formatCompact.format(summary.totalTonnage)} MT</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Avg Trip Distance</CardTitle>
                            <Navigation2 className="h-4 w-4 text-sky-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{summary.avgTripDistance.toFixed(1)} km</div>
                            <p className="text-xs text-muted-foreground">Loaded distance {summary.avgLoadedDistance.toFixed(1)} km</p>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid gap-4 lg:grid-cols-3">
                    <Card className="lg:col-span-2">
                        <CardHeader>
                            <CardTitle>Financial Trend</CardTitle>
                            <CardDescription>Revenue, cost, and profit by period</CardDescription>
                        </CardHeader>
                        <CardContent className="h-72">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={financialTrend}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="period" />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Area type="monotone" dataKey="revenue" stroke="#22c55e" fill="#22c55e" fillOpacity={0.2} name="Revenue" />
                                    <Area type="monotone" dataKey="cost" stroke="#e11d48" fill="#e11d48" fillOpacity={0.15} name="Cost" />
                                    <Area type="monotone" dataKey="profit" stroke="#6366f1" fill="#6366f1" fillOpacity={0.1} name="Profit" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle>Cost Breakdown</CardTitle>
                            <CardDescription>Distribution of operational expenses</CardDescription>
                        </CardHeader>
                        <CardContent className="flex flex-col gap-4">
                            <div className="h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie data={costBreakdown} dataKey="value" nameKey="name" outerRadius={90} label>
                                            {costBreakdown.map((entry, index) => (
                                                <Cell key={entry.name} fill={costColors[index % costColors.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip formatter={(value: number) => formatAmount.format(value)} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                                {costBreakdown.map((item, index) => (
                                    <div key={item.name} className="flex items-center gap-2">
                                        <span className="size-2 rounded-full" style={{ backgroundColor: costColors[index % costColors.length] }} />
                                        <span className="text-muted-foreground">{item.name}</span>
                                        <span className="ml-auto font-medium">{formatAmount.format(item.value)}</span>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid gap-4 lg:grid-cols-3">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle>Trip Completion</CardTitle>
                                <CardDescription>Target vs actual trips returned</CardDescription>
                            </div>
                            <Badge
                                variant="secondary"
                                className={tripCompletion.completionRate >= 90 ? 'bg-emerald-600 text-white hover:bg-emerald-600/90' : undefined}
                            >
                                {tripCompletion.completionRate.toFixed(1)}% on-time
                            </Badge>
                        </CardHeader>
                        <CardContent className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={tripCompletionData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" hide />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Bar dataKey="target" fill="#818cf8" name="Target" />
                                    <Bar dataKey="completed" stackId="a" fill="#22c55e" name="Completed" />
                                    <Bar dataKey="open" stackId="a" fill="#f97316" name="Open" />
                                </BarChart>
                            </ResponsiveContainer>
                            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                                <div className="flex items-center gap-2">
                                    <Target className="h-4 w-4 text-indigo-500" />
                                    <span className="text-muted-foreground">Target trips</span>
                                    <span className="ml-auto font-semibold">{tripCompletion.targetTrips}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Truck className="h-4 w-4 text-emerald-500" />
                                    <span className="text-muted-foreground">Completed</span>
                                    <span className="ml-auto font-semibold">{tripCompletion.completedTrips}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Fuel className="h-4 w-4 text-orange-500" />
                                    <span className="text-muted-foreground">Open trips</span>
                                    <span className="ml-auto font-semibold">{tripCompletion.openTrips}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Navigation2 className="h-4 w-4 text-sky-500" />
                                    <span className="text-muted-foreground">Avg ton-km</span>
                                    <span className="ml-auto font-semibold">{summary.avgTonKm.toFixed(1)}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="lg:col-span-2">
                        <CardHeader>
                            <CardTitle>Top Route Efficiency</CardTitle>
                            <CardDescription>Routes ranked by trips and average ton-km</CardDescription>
                        </CardHeader>
                        <CardContent className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Route</TableHead>
                                        <TableHead className="text-right">Trips</TableHead>
                                        <TableHead className="text-right">Avg Distance (km)</TableHead>
                                        <TableHead className="text-right">Avg Ton-Km</TableHead>
                                        <TableHead className="text-right">Tonnage (MT)</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {routeEfficiency.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={5} className="py-6 text-center text-sm text-muted-foreground">
                                                No route analytics available for the selected window.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                    {routeEfficiency.map(route => (
                                        <TableRow key={route.id}>
                                            <TableCell className="font-medium">{route.origin} → {route.destination}</TableCell>
                                            <TableCell className="text-right">{route.totalTrips}</TableCell>
                                            <TableCell className="text-right">{route.avgDistance.toFixed(1)}</TableCell>
                                            <TableCell className="text-right">{route.avgTonKm.toFixed(1)}</TableCell>
                                            <TableCell className="text-right">{route.totalTonnage.toFixed(1)}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Underperforming Trips</CardTitle>
                            <CardDescription>Flagged for low ton-km or overdue return</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {underperformingTrips.length === 0 && (
                                <p className="text-sm text-muted-foreground">No underperforming trips detected for this range.</p>
                            )}
                            {underperformingTrips.map(item => (
                                <div key={item.id} className="rounded-lg border p-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <div className="text-sm font-semibold">{item.trip || 'Unnamed Trip'}</div>
                                            <div className="text-xs text-muted-foreground">
                                                {item.origin || 'Unknown'} → {item.destination || 'Unknown'}
                                            </div>
                                        </div>
                                        <Badge variant="outline">{item.status || 'Pending'}</Badge>
                                    </div>
                                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                                        <span>Driver: <span className="font-medium text-foreground">{item.driver || 'Unassigned'}</span></span>
                                        <span>Truck: <span className="font-medium text-foreground">{item.truck || 'Unassigned'}</span></span>
                                        <span>Ton-Km: <span className="font-medium text-foreground">{item.tonKm != null ? item.tonKm.toFixed(1) : 'n/a'}</span></span>
                                        <span>Tonnage: <span className="font-medium text-foreground">{item.tonnage != null ? `${item.tonnage.toFixed(1)} MT` : 'n/a'}</span></span>
                                        <span>Age: <span className="font-medium text-foreground">{item.ageDays != null ? `${item.ageDays} days` : 'n/a'}</span></span>
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle>Fuel Cost Outliers</CardTitle>
                            <CardDescription>Drivers with the highest ETB per transported tonne</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {driverOutliers.length === 0 && (
                                <p className="text-sm text-muted-foreground">No fuel outliers detected.</p>
                            )}
                            {driverOutliers.map(outlier => (
                                <div key={`${outlier.driverTruckId}-${outlier.driver}`} className="rounded-lg border p-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <div className="text-sm font-semibold">{outlier.driver}</div>
                                            <div className="text-xs text-muted-foreground">Truck {outlier.truck}</div>
                                        </div>
                                        <Badge variant="secondary">{outlier.fuelPerTon != null ? `${outlier.fuelPerTon.toFixed(2)} ETB / t` : 'n/a'}</Badge>
                                    </div>
                                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                                        <span>Fuel Spend: <span className="font-medium text-foreground">{formatAmount.format(outlier.totalFuelCost)}</span></span>
                                        <span>Tonnage: <span className="font-medium text-foreground">{outlier.totalTonnage.toFixed(1)} MT</span></span>
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}
