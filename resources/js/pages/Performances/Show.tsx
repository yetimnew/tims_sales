import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import AppLayout from '@/layouts/app-layout';
import { Head, Link } from '@inertiajs/react';
import { type BreadcrumbItem } from '@/types';
import {
    Activity, DollarSign, Edit2, Trash2, ArrowLeft,
    CheckCircle, Clock, MapPin, User, Truck, Building2, Route,
    Fuel, Package, Calendar, FileText, AlertCircle,
    Download, Printer, BarChart3, Target, Navigation,
    ExternalLink, Phone, PieChart as PieIcon
} from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { DeleteConfirmationDialog } from '@/components/delete-confirmation-dialog';
import { ActivityLogTable } from '@/components/activity-log-table';
import { Area, AreaChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis } from 'recharts';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Performances', href: '/performances' },
    { title: 'Show', href: '#' },
];

interface Performance {
    id: number;
    trip: string;
    FOnumber: string;
    LoadType: string;
    DateDispach: string;
    satus: string;
    operation_id: number;
    driver_truck_id: number;
    orgion_id: number;
    destination_id: number;
    DistanceWCargo: number;
    DistanceWOCargo: number;
    tonkm: number;
    CargoVolumMT: number;
    fuelInLitter: number;
    fuelInBirr: number;
    perdiem: number;
    other: number;
    comment: string;
    is_returned: boolean;
    returned_date: string;
    operation?: {
        id: number;
        operationid: string;
        customer: {
            id: number;
            name: string;
            email?: string;
            phone?: string;
        };
    };
    driverTruck?: {
        id: number;
        driver: {
            id: number;
            name: string;
            license?: string;
            phone?: string;
        };
        truck: {
            id: number;
            plate: string;
            model?: string;
            capacity?: number;
        };
    };
    origin?: {
        id: number;
        name: string;
    };
    destination?: {
        id: number;
        name: string;
    };
}

interface ShowProps {
    performance: Performance;
    activityLogs?: any[];
    operationInsights?: OperationInsights | null;
}

interface OperationInsights {
    overview: {
        plannedVolume: number | null;
        totalTrips: number;
        completedTrips: number;
        ongoingTrips: number;
        totalTonnage: number;
        remainingTonnage: number;
        completionRate: number | null;
    };
    performanceShare: {
        tonnageShare: number | null;
        distanceShare: number | null;
        costShare: number | null;
        plannedContribution: number | null;
        tonnage: number;
        distance: number;
        cost: number;
        tonKm: number;
    };
    trends: {
        recentTrips: Array<{
            id: number;
            trip: string;
            date: string;
            tonnage: number;
            distance: number;
            cost: number;
            highlight: boolean;
        }>;
        statusBreakdown: Array<{
            label: string;
            value: number;
        }>;
    };
}

export default function PerformancesShow({ performance, activityLogs, operationInsights }: ShowProps) {
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

    const formatDisplayDate = (value?: string | null) => {
        if (!value) return 'N/A';
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) {
            return 'N/A';
        }
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    const formatNumberDisplay = (value?: number | null) => {
        if (value === null || value === undefined) return 'N/A';
        return Number(value).toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });
    };

    const formatCurrencyDisplay = (value?: number | null) => {
        if (value === null || value === undefined) return 'N/A';
        return `${Number(value).toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        })} Birr`;
    };

    const formatPercentDisplay = (value?: number | null) => {
        if (value === null || value === undefined) return 'N/A';
        return `${Number(value).toFixed(1)}%`;
    };

    const formatShareLabel = (value?: number | null) => {
        if (value === null || value === undefined) return 'N/A';
        return `${Number(value).toFixed(1)}%`;
    };

    // Ensure all values are numbers for calculations
    const dwc = parseFloat(performance.DistanceWCargo as any) || 0;
    const dwo = parseFloat(performance.DistanceWOCargo as any) || 0;
    const cvm = parseFloat(performance.CargoVolumMT as any) || 0;
    const fib = parseFloat(performance.fuelInBirr as any) || 0;
    const per = parseFloat(performance.perdiem as any) || 0;
    const oth = parseFloat(performance.other as any) || 0;
    const fil = parseFloat(performance.fuelInLitter as any) || 0;

    const totalDistance = dwc + dwo;
    const tonKm = dwc * cvm;
    const totalCost = fib + per + oth;
    const fuelEfficiency = fil > 0 ? (totalDistance / fil) : 0;
    const costPerKm = totalDistance > 0 ? (totalCost / totalDistance) : 0;

    const operationRef = performance.operation;
    const driver = performance.driverTruck?.driver;
    const truck = performance.driverTruck?.truck;
    const operationLink = operationRef ? `/operations/${operationRef.id}` : undefined;
    const dispatchDateLabel = formatDisplayDate(performance.DateDispach);
    const returnedDateLabel = performance.is_returned ? formatDisplayDate(performance.returned_date) : 'Pending';
    const truckCapacity = truck?.capacity ?? 0;
    const loadUtilization = truckCapacity > 0 ? Math.min((cvm / truckCapacity) * 100, 100) : null;
    const loadUtilizationLabel = loadUtilization !== null ? `${loadUtilization.toFixed(0)}%` : 'N/A';
    const distanceMixLabel = `${dwc.toFixed(0)} km / ${dwo.toFixed(0)} km`;
    const originName = performance.origin?.name || 'N/A';
    const destinationName = performance.destination?.name || 'N/A';

    const operationOverview = operationInsights?.overview;
    const performanceShare = operationInsights?.performanceShare;
    const operationTrends = operationInsights?.trends;

    const completionRate = operationOverview?.completionRate;
    const completionLabel = completionRate !== null && completionRate !== undefined
        ? `${completionRate.toFixed(1)}%`
        : 'N/A';
    const completionBarWidth = completionRate !== null && completionRate !== undefined
        ? Math.max(0, Math.min(completionRate, 100))
        : 0;
    const statusData = operationTrends?.statusBreakdown ?? [];
    const hasStatusData = statusData.some((item) => item.value > 0);
    const timelineData = operationTrends?.recentTrips ?? [];
    const hasTimelineData = timelineData.length > 0;
    const piePalette = ['#6366f1', '#22c55e', '#f97316'];
    const statusPalette = ['#22c55e', '#f97316', '#0ea5e9'];

    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            'active': 'bg-blue-100 text-blue-800 border-blue-200',
            'inactive': 'bg-gray-100 text-gray-800 border-gray-200',
            'completed': 'bg-green-100 text-green-800 border-green-200',
            'cancelled': 'bg-red-100 text-red-800 border-red-200',
            'in_progress': 'bg-blue-100 text-blue-800 border-blue-200',
            'pending': 'bg-yellow-100 text-yellow-800 border-yellow-200',
            'returned': 'bg-green-100 text-green-800 border-green-200',
        };
        return colors[status?.toLowerCase()] || 'bg-gray-100 text-gray-800 border-gray-200';
    };

    const getLoadTypeColor = (type: string) => {
        const colors: Record<string, string> = {
            'main': 'bg-purple-100 text-purple-800 border-purple-200',
            'return': 'bg-orange-100 text-orange-800 border-orange-200',
            'empty': 'bg-gray-100 text-gray-800 border-gray-200',
        };
        return colors[type?.toLowerCase()] || 'bg-gray-100 text-gray-800 border-gray-200';
    };

    const getStatusIcon = (status: string) => {
        const icons: Record<string, ReactNode> = {
            'completed': <CheckCircle className="h-3.5 w-3.5" />,
            'returned': <CheckCircle className="h-3.5 w-3.5" />,
            'in_progress': <Clock className="h-3.5 w-3.5" />,
            'active': <Activity className="h-3.5 w-3.5" />,
            'pending': <Clock className="h-3.5 w-3.5" />,
            'cancelled': <AlertCircle className="h-3.5 w-3.5" />,
        };
        return icons[status?.toLowerCase()] || <Activity className="h-3.5 w-3.5" />;
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Performance ${performance.trip}`} />
            <div className="flex flex-1 flex-col overflow-hidden p-4">
                <div className="flex flex-1 flex-col gap-6 overflow-y-auto pr-1 pb-6">
                    {/* Header */}
                    <Card className="border shadow-sm">
                        <CardContent className="flex flex-col gap-6 p-6">
                            <div className="flex flex-wrap items-start justify-between gap-4">
                                <div className="flex items-center gap-3">
                                    <Link
                                        href="/performances"
                                        className="transition-colors text-muted-foreground hover:text-foreground"
                                    >
                                        <ArrowLeft className="h-5 w-5" />
                                    </Link>
                                    <div>
                                        <div className="flex flex-wrap items-center gap-3">
                                            <h1 className="text-2xl font-semibold text-foreground">Performance Details</h1>
                                            <Badge className={`${getStatusColor(performance.satus)} border font-medium`}>
                                                {getStatusIcon(performance.satus)}
                                                <span className="ml-1">
                                                    {performance.satus?.charAt(0).toUpperCase() + performance.satus?.slice(1)}
                                                </span>
                                            </Badge>
                                            <Badge className={`${getLoadTypeColor(performance.LoadType)} border font-medium`}>
                                                {performance.LoadType}
                                            </Badge>
                                        </div>
                                        <p className="mt-1 text-sm text-muted-foreground">
                                            Trip <span className="font-semibold text-primary">{performance.trip}</span> • FO: {performance.FOnumber}
                                        </p>
                                        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                                            {operationRef && operationLink && (
                                                <Link
                                                    href={operationLink}
                                                    className="inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1 font-medium text-foreground transition-colors hover:text-primary"
                                                >
                                                    <Building2 className="h-3.5 w-3.5 text-purple-600" />
                                                    Operation {operationRef.operationid}
                                                    <ExternalLink className="h-3 w-3" />
                                                </Link>
                                            )}
                                            {driver?.name && (
                                                <span className="inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1 font-medium text-foreground">
                                                    <User className="h-3.5 w-3.5 text-blue-600" />
                                                    {driver.name}
                                                </span>
                                            )}
                                            {truck?.plate && (
                                                <span className="inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1 font-medium text-foreground">
                                                    <Truck className="h-3.5 w-3.5 text-amber-600" />
                                                    {truck.plate}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Route Visualization */}
                            <div className="flex flex-wrap items-center gap-4 rounded-lg border bg-muted/30 p-4">
                                <div className="min-w-[160px] flex-1 flex flex-col gap-2 md:flex-row md:items-center md:gap-3">
                                    <div className="rounded-lg bg-primary/10 p-3">
                                        <MapPin className="h-5 w-5 text-purple-600" />
                                    </div>
                                    <div className="md:mt-0">
                                        <p className="text-xs text-muted-foreground">Origin</p>
                                        <p className="font-semibold text-foreground">{performance.origin?.name || 'N/A'}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="h-px w-12 bg-gradient-to-r from-purple-400/60 to-pink-400/60" />
                                    <Navigation className="h-5 w-5 text-purple-500" />
                                    <div className="h-px w-12 bg-gradient-to-r from-purple-400/60 to-pink-400/60" />
                                </div>
                                <div className="min-w-[160px] flex flex-1 flex-col-reverse gap-2 md:flex-row md:items-center md:justify-end md:gap-3">
                                    <div className="text-right md:order-1 md:mt-0">
                                        <p className="text-xs text-muted-foreground">Destination</p>
                                        <p className="font-semibold text-foreground">{performance.destination?.name || 'N/A'}</p>
                                    </div>
                                    <div className="rounded-lg bg-pink-100 p-3 dark:bg-pink-900/30">
                                        <MapPin className="h-5 w-5 text-pink-600" />
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Main Layout */}
                    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.32fr)] xl:grid-cols-[minmax(0,1fr)_minmax(320px,0.32fr)]">
                        <div className="space-y-6">
                            {/* Detailed Information */}
                            <Card className="border shadow-sm">
                                <CardHeader className="border-b bg-muted/30">
                                    <CardTitle className="flex items-center gap-2 text-base font-semibold">
                                        <div className="rounded-lg bg-purple-100 p-2 dark:bg-purple-900/30">
                                            <Activity className="h-5 w-5 text-purple-600" />
                                        </div>
                                        Detailed Information
                                    </CardTitle>
                                    <CardDescription>Complete performance metrics and analysis</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6 p-6">
                                    <Tabs defaultValue="details" className="flex flex-col gap-4">
                                        <TabsList className="grid w-full grid-cols-2 gap-2 rounded-lg bg-muted/60 p-2 sm:grid-cols-4">
                                            <TabsTrigger value="details" className="flex items-center gap-2 text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm">
                                                <Activity className="h-4 w-4" />
                                                <span className="hidden sm:inline">Details</span>
                                            </TabsTrigger>
                                            <TabsTrigger value="financial" className="flex items-center gap-2 text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm">
                                                <DollarSign className="h-4 w-4" />
                                                <span className="hidden sm:inline">Financial</span>
                                            </TabsTrigger>
                                            <TabsTrigger value="route" className="flex items-center gap-2 text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm">
                                                <MapPin className="h-4 w-4" />
                                                <span className="hidden sm:inline">Route</span>
                                            </TabsTrigger>
                                            <TabsTrigger value="activity" className="flex items-center gap-2 text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm">
                                                <CheckCircle className="h-4 w-4" />
                                                <span className="hidden sm:inline">Activity</span>
                                            </TabsTrigger>
                                        </TabsList>

                                        {/* TAB 1: DETAILS */}
                                        <TabsContent value="details" className="space-y-6">
                                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                                {/* Trip Information */}
                                                <div className="space-y-4">
                                                    <h3 className="font-semibold text-foreground flex items-center gap-2 text-sm">
                                                        <div className="p-1.5 bg-purple-100 dark:bg-purple-900/30 rounded">
                                                            <Activity className="h-3.5 w-3.5 text-purple-600" />
                                                        </div>
                                                        Trip Information
                                                    </h3>
                                                    <div className="space-y-3 pl-4 border-l-2 border-purple-200">
                                                        <div>
                                                            <p className="text-xs text-muted-foreground">Trip Name</p>
                                                            <p className="font-medium text-foreground">{performance.trip}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-xs text-muted-foreground">FO Number</p>
                                                            <p className="font-medium text-foreground">{performance.FOnumber}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-xs text-muted-foreground">Dispatch Date</p>
                                                            <p className="font-medium text-foreground flex items-center gap-1">
                                                                <Calendar className="h-3 w-3" />
                                                                {dispatchDateLabel}
                                                            </p>
                                                        </div>
                                                        <div>
                                                            <p className="text-xs text-muted-foreground">Load Type</p>
                                                            <Badge className={`${getLoadTypeColor(performance.LoadType)} border mt-1`}>
                                                                {performance.LoadType}
                                                            </Badge>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Cargo Information */}
                                                <div className="space-y-4">
                                                    <h3 className="font-semibold text-foreground flex items-center gap-2 text-sm">
                                                        <div className="p-1.5 bg-cyan-100 dark:bg-cyan-900/30 rounded">
                                                            <Package className="h-3.5 w-3.5 text-cyan-600" />
                                                        </div>
                                                        Cargo Information
                                                    </h3>
                                                    <div className="space-y-3 pl-4 border-l-2 border-cyan-200">
                                                        <div>
                                                            <p className="text-xs text-muted-foreground">Cargo Volume</p>
                                                            <p className="font-medium text-foreground">{cvm.toFixed(2)} MT</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-xs text-muted-foreground">Ton-KM Efficiency</p>
                                                            <p className="font-medium text-foreground">{tonKm.toFixed(2)} ton-km</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-xs text-muted-foreground">Load Utilization</p>
                                                            <div className="flex items-center gap-2 mt-1">
                                                                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                                                                    <div
                                                                        className="h-full bg-gradient-to-r from-cyan-500 to-cyan-600"
                                                                        style={{ width: `${loadUtilization ?? 0}%` }}
                                                                    ></div>
                                                                </div>
                                                                <span className="text-xs font-medium">
                                                                    {loadUtilizationLabel}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <p className="text-xs text-muted-foreground">Return Status</p>
                                                            <p className="font-medium text-foreground flex items-center gap-1">
                                                                {performance.is_returned ? (
                                                                    <>
                                                                        <CheckCircle className="h-3 w-3 text-green-600" />
                                                                        Returned
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <Clock className="h-3 w-3 text-yellow-600" />
                                                                        Not Returned
                                                                    </>
                                                                )}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Status & Notes */}
                                                <div className="space-y-4 md:col-span-2">
                                                    <h3 className="font-semibold text-foreground flex items-center gap-2 text-sm">
                                                        <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 rounded">
                                                            <FileText className="h-3.5 w-3.5 text-blue-600" />
                                                        </div>
                                                        Status & Comments
                                                    </h3>
                                                    <div className="space-y-3 pl-4 border-l-2 border-blue-200">
                                                        <div>
                                                            <p className="text-xs text-muted-foreground">Current Status</p>
                                                            <Badge className={`${getStatusColor(performance.satus)} border mt-1`}>
                                                                {getStatusIcon(performance.satus)}
                                                                <span className="ml-1">{performance.satus?.charAt(0).toUpperCase() + performance.satus?.slice(1)}</span>
                                                            </Badge>
                                                        </div>
                                                        <div>
                                                            <p className="text-xs text-muted-foreground">Comments</p>
                                                            <p className="font-medium text-foreground text-sm mt-1 p-3 bg-muted/30 rounded-lg border">
                                                                {performance.comment || 'No comments provided'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </TabsContent>

                                        {/* TAB 2: FINANCIAL */}
                                        <TabsContent value="financial" className="flex-1 overflow-auto pr-1">
                                            <div className="grid grid-cols-1 gap-6 pb-4 md:grid-cols-2">
                                                {/* Cost Breakdown */}
                                                <div className="space-y-4">
                                                    <h3 className="font-semibold text-foreground flex items-center gap-2 text-sm">
                                                        <div className="p-1.5 bg-green-100 dark:bg-green-900/30 rounded">
                                                            <DollarSign className="h-3.5 w-3.5 text-green-600" />
                                                        </div>
                                                        Cost Breakdown
                                                    </h3>
                                                    <div className="space-y-3">
                                                        <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg border">
                                                            <span className="text-sm text-muted-foreground">Fuel Cost</span>
                                                            <span className="font-semibold text-foreground">{fib.toFixed(2)} Birr</span>
                                                        </div>
                                                        <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg border">
                                                            <span className="text-sm text-muted-foreground">Per Diem</span>
                                                            <span className="font-semibold text-foreground">{per.toFixed(2)} Birr</span>
                                                        </div>
                                                        <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg border">
                                                            <span className="text-sm text-muted-foreground">Other Costs</span>
                                                            <span className="font-semibold text-foreground">{oth.toFixed(2)} Birr</span>
                                                        </div>
                                                        <Separator />
                                                        <div className="flex justify-between items-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border-2 border-green-200">
                                                            <span className="font-semibold text-foreground">Total Cost</span>
                                                            <span className="text-xl font-bold text-green-600">{totalCost.toFixed(2)} Birr</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Performance Metrics */}
                                                <div className="space-y-4">
                                                    <h3 className="font-semibold text-foreground flex items-center gap-2 text-sm">
                                                        <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 rounded">
                                                            <BarChart3 className="h-3.5 w-3.5 text-blue-600" />
                                                        </div>
                                                        Performance Metrics
                                                    </h3>
                                                    <div className="space-y-3">
                                                        <div className="p-4 bg-muted/30 rounded-lg border">
                                                            <p className="text-xs text-muted-foreground mb-1">Cost per Kilometer</p>
                                                            <p className="text-2xl font-bold text-blue-600">{costPerKm.toFixed(2)}</p>
                                                            <p className="text-xs text-muted-foreground mt-1">Birr/km</p>
                                                        </div>
                                                        <div className="p-4 bg-muted/30 rounded-lg border">
                                                            <p className="text-xs text-muted-foreground mb-1">Fuel Efficiency</p>
                                                            <p className="text-2xl font-bold text-orange-600">{fuelEfficiency.toFixed(2)}</p>
                                                            <p className="text-xs text-muted-foreground mt-1">km/liter</p>
                                                        </div>
                                                        <div className="p-4 bg-muted/30 rounded-lg border">
                                                            <p className="text-xs text-muted-foreground mb-1">Fuel Consumed</p>
                                                            <p className="text-2xl font-bold text-purple-600">{fil.toFixed(2)}</p>
                                                            <p className="text-xs text-muted-foreground mt-1">liters</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </TabsContent>

                                        {/* TAB 3: ROUTE */}
                                        <TabsContent value="route" className="flex-1 overflow-auto pr-1">
                                            <div className="grid grid-cols-1 gap-6 pb-4 md:grid-cols-2">
                                                <div className="space-y-4">
                                                    <h3 className="font-semibold text-foreground flex items-center gap-2 text-sm">
                                                        <div className="p-1.5 bg-purple-100 dark:bg-purple-900/30 rounded">
                                                            <Route className="h-3.5 w-3.5 text-purple-600" />
                                                        </div>
                                                        Distance Analysis
                                                    </h3>
                                                    <div className="space-y-4 p-4 bg-muted/30 rounded-lg border">
                                                        <div className="flex justify-between items-center">
                                                            <span className="text-sm text-muted-foreground">With Cargo</span>
                                                            <span className="font-semibold text-foreground">{dwc.toFixed(2)} km</span>
                                                        </div>
                                                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                                                            <div
                                                                className="h-full bg-gradient-to-r from-purple-500 to-purple-600"
                                                                style={{width: `${Math.min(dwc / (totalDistance || 1) * 100, 100)}%`}}
                                                            ></div>
                                                        </div>
                                                        <div className="flex justify-between items-center">
                                                            <span className="text-sm text-muted-foreground">Without Cargo</span>
                                                            <span className="font-semibold text-foreground">{dwo.toFixed(2)} km</span>
                                                        </div>
                                                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                                                            <div
                                                                className="h-full bg-gradient-to-r from-amber-500 to-amber-600"
                                                                style={{width: `${Math.min(dwo / (totalDistance || 1) * 100, 100)}%`}}
                                                            ></div>
                                                        </div>
                                                        <Separator />
                                                        <div className="flex justify-between items-center pt-2">
                                                            <span className="font-semibold text-foreground">Total Distance</span>
                                                            <span className="text-lg font-bold text-purple-600">{totalDistance.toFixed(2)} km</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="space-y-4">
                                                    <h3 className="font-semibold text-foreground flex items-center gap-2 text-sm">
                                                        <div className="p-1.5 bg-orange-100 dark:bg-orange-900/30 rounded">
                                                            <Fuel className="h-3.5 w-3.5 text-orange-600" />
                                                        </div>
                                                        Fuel Analysis
                                                    </h3>
                                                    <div className="space-y-4 p-4 bg-muted/30 rounded-lg border">
                                                        <div>
                                                            <p className="text-xs text-muted-foreground mb-2">Fuel Consumed</p>
                                                            <p className="text-3xl font-bold text-orange-600">{fil.toFixed(2)} L</p>
                                                        </div>
                                                        <Separator />
                                                        <div>
                                                            <p className="text-xs text-muted-foreground mb-1">Efficiency Rate</p>
                                                            <div className="flex items-center gap-2">
                                                                <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
                                                                    <div
                                                                        className="h-full bg-gradient-to-r from-green-500 to-green-600"
                                                                        style={{ width: `${Math.min(fuelEfficiency * 10, 100)}%` }}
                                                                    ></div>
                                                                </div>
                                                                <span className="text-sm font-semibold">{fuelEfficiency.toFixed(2)} km/L</span>
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <p className="text-xs text-muted-foreground mb-1">Fuel Cost</p>
                                                            <p className="text-lg font-semibold text-foreground">{fib.toFixed(2)} Birr</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </TabsContent>

                                        {/* TAB 4: ACTIVITY LOG */}
                                        <TabsContent value="activity" className="flex-1 overflow-auto pr-1">
                                            {activityLogs && activityLogs.length > 0 ? (
                                                <ActivityLogTable logs={activityLogs} />
                                            ) : (
                                                <div className="p-12 text-center">
                                                    <div className="inline-flex p-4 bg-muted/50 rounded-full mb-4">
                                                        <CheckCircle className="h-12 w-12 text-muted-foreground opacity-50" />
                                                    </div>
                                                    <p className="text-muted-foreground font-medium">No activity logged yet</p>
                                                    <p className="text-sm text-muted-foreground mt-1">Activity will appear here when actions are performed</p>
                                                </div>
                                            )}
                                        </TabsContent>
                                    </Tabs>
                                </CardContent>
                            </Card>

                            {operationInsights && (
                                <Card className="border shadow-sm">
                                    <CardHeader className="border-b bg-muted/30">
                                        <CardTitle className="flex items-center gap-2 text-base font-semibold">
                                            <div className="rounded-lg bg-indigo-100 p-2 dark:bg-indigo-900/30">
                                                <PieIcon className="h-5 w-5 text-indigo-600" />
                                            </div>
                                            Operation Context
                                        </CardTitle>
                                        <CardDescription>How this trip contributes to the overarching operation</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-6 p-6">
                                        <div className="grid gap-6 lg:grid-cols-[minmax(0,0.7fr)_minmax(0,0.3fr)]">
                                            <div className="space-y-6">
                                                <div className="rounded-xl border border-slate-200 bg-white/80 p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900/40">
                                                    <div className="flex items-center justify-between">
                                                        <div>
                                                            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Operation Progress</p>
                                                            <p className="mt-1 text-sm text-muted-foreground">Delivered tonnage against the planned volume</p>
                                                        </div>
                                                        <span className="inline-flex items-center rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-200">
                                                            {completionLabel}
                                                        </span>
                                                    </div>
                                                    <div className="mt-4 h-3 w-full overflow-hidden rounded-full bg-muted">
                                                        <div
                                                            className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-fuchsia-500 transition-all"
                                                            style={{ width: `${completionBarWidth}%` }}
                                                        />
                                                    </div>
                                                    <div className="mt-3 grid gap-3 text-xs text-muted-foreground sm:grid-cols-3">
                                                        <div className="rounded-lg bg-muted/40 p-3">
                                                            <p className="font-semibold text-foreground">{operationOverview?.totalTonnage !== undefined ? formatNumberDisplay(operationOverview?.totalTonnage) : 'N/A'} MT</p>
                                                            <p className="mt-1">Delivered so far</p>
                                                        </div>
                                                        <div className="rounded-lg bg-muted/40 p-3">
                                                            <p className="font-semibold text-foreground">{operationOverview?.remainingTonnage !== undefined ? formatNumberDisplay(operationOverview?.remainingTonnage) : 'N/A'} MT</p>
                                                            <p className="mt-1">Outstanding volume</p>
                                                        </div>
                                                        <div className="rounded-lg bg-muted/40 p-3">
                                                            <p className="font-semibold text-foreground">{operationOverview?.plannedVolume ? formatNumberDisplay(operationOverview.plannedVolume) : 'N/A'} MT</p>
                                                            <p className="mt-1">Original plan</p>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="rounded-xl border border-slate-200 bg-white/80 p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900/40">
                                                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Performance Contribution</p>
                                                    <div className="mt-4 space-y-4">
                                                        {[
                                                            {
                                                                label: 'Tonnage Share',
                                                                value: performanceShare?.tonnageShare,
                                                            },
                                                            {
                                                                label: 'Distance Share',
                                                                value: performanceShare?.distanceShare,
                                                            },
                                                            {
                                                                label: 'Cost Share',
                                                                value: performanceShare?.costShare,
                                                            },
                                                            {
                                                                label: 'Plan Contribution',
                                                                value: performanceShare?.plannedContribution,
                                                            },
                                                        ].map((item) => (
                                                            <div key={item.label} className="space-y-2">
                                                                <div className="flex items-center justify-between text-sm">
                                                                    <span className="text-muted-foreground">{item.label}</span>
                                                                    <span className="font-semibold text-foreground">{formatShareLabel(item.value)}</span>
                                                                </div>
                                                                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                                                                    <div
                                                                        className="h-full rounded-full bg-gradient-to-r from-purple-500 to-purple-700"
                                                                        style={{ width: `${Math.max(0, Math.min(item.value ?? 0, 100))}%` }}
                                                                    />
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                    <div className="mt-4 grid gap-3 text-xs text-muted-foreground sm:grid-cols-3">
                                                        <div className="rounded-lg bg-muted/30 p-3">
                                                            <p className="text-[11px] uppercase tracking-wide">Trip Tonnage</p>
                                                            <p className="mt-1 text-sm font-semibold text-foreground">
                                                                {performanceShare?.tonnage !== undefined && performanceShare?.tonnage !== null
                                                                    ? `${formatNumberDisplay(performanceShare.tonnage)} MT`
                                                                    : 'N/A'}
                                                            </p>
                                                        </div>
                                                        <div className="rounded-lg bg-muted/30 p-3">
                                                            <p className="text-[11px] uppercase tracking-wide">Trip Distance</p>
                                                            <p className="mt-1 text-sm font-semibold text-foreground">
                                                                {performanceShare?.distance !== undefined && performanceShare?.distance !== null
                                                                    ? `${formatNumberDisplay(performanceShare.distance)} km`
                                                                    : 'N/A'}
                                                            </p>
                                                        </div>
                                                        <div className="rounded-lg bg-muted/30 p-3">
                                                            <p className="text-[11px] uppercase tracking-wide">Trip Cost</p>
                                                            <p className="mt-1 text-sm font-semibold text-foreground">{formatCurrencyDisplay(performanceShare?.cost)}</p>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="rounded-xl border border-slate-200 bg-white/80 p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900/40">
                                                    <div className="flex items-center justify-between">
                                                        <div>
                                                            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Operation Timeline</p>
                                                            <p className="mt-1 text-xs text-muted-foreground">Recent trips for this operation</p>
                                                        </div>
                                                        <span className="text-xs text-muted-foreground">Last {timelineData.length} records</span>
                                                    </div>
                                                    <div className="mt-4 h-52">
                                                        {hasTimelineData ? (
                                                            <ResponsiveContainer width="100%" height="100%">
                                                                <AreaChart data={timelineData} margin={{ top: 10, right: 12, left: -12, bottom: 0 }}>
                                                                    <defs>
                                                                        <linearGradient id="performanceTonnage" x1="0" y1="0" x2="0" y2="1">
                                                                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.6} />
                                                                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0.1} />
                                                                        </linearGradient>
                                                                        <linearGradient id="performanceDistance" x1="0" y1="0" x2="0" y2="1">
                                                                            <stop offset="5%" stopColor="#22c55e" stopOpacity={0.4} />
                                                                            <stop offset="95%" stopColor="#22c55e" stopOpacity={0.05} />
                                                                        </linearGradient>
                                                                    </defs>
                                                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.25)" />
                                                                    <XAxis dataKey="date" tick={{ fill: 'rgba(71, 85, 105, 0.9)', fontSize: 12 }} axisLine={false} tickLine={false} />
                                                                    <Tooltip
                                                                        cursor={{ fill: 'rgba(99, 102, 241, 0.08)' }}
                                                                        contentStyle={{
                                                                            backgroundColor: 'var(--background)',
                                                                            borderRadius: '0.75rem',
                                                                            border: '1px solid hsl(var(--border))',
                                                                            boxShadow: '0 10px 30px rgba(15, 23, 42, 0.15)',
                                                                        }}
                                                                        formatter={(value, name, props) => {
                                                                            const label = props?.payload?.trip ? `Trip ${props.payload.trip}` : name;
                                                                            const suffix = name === 'Distance (km)' ? ' km' : name === 'Tonnage (MT)' ? ' MT' : '';
                                                                            return [`${Number(value).toFixed(2)}${suffix}`, label];
                                                                        }}
                                                                        labelFormatter={(_, payload) => {
                                                                            if (!payload || payload.length === 0) return '';
                                                                            const trip = payload[0]?.payload?.trip;
                                                                            return trip ? `Trip ${trip}` : 'Trip';
                                                                        }}
                                                                    />
                                                                    <Area type="monotone" dataKey="tonnage" name="Tonnage (MT)" stroke="#6366f1" strokeWidth={2} fill="url(#performanceTonnage)" />
                                                                    <Area type="monotone" dataKey="distance" name="Distance (km)" stroke="#22c55e" strokeWidth={2} fill="url(#performanceDistance)" />
                                                                </AreaChart>
                                                            </ResponsiveContainer>
                                                        ) : (
                                                            <div className="flex h-full items-center justify-center rounded-lg bg-muted/40 text-sm text-muted-foreground">
                                                                No historical trip data
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="space-y-6">
                                                <div className="rounded-xl border border-slate-200 bg-white/80 p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900/40">
                                                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Trip Performance Snapshot</p>
                                                    <div className="mt-3 space-y-3 text-sm">
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-muted-foreground">Ton-KM</span>
                                                            <span className="font-semibold text-foreground">
                                                                {performanceShare?.tonKm !== undefined && performanceShare?.tonKm !== null
                                                                    ? `${formatNumberDisplay(performanceShare.tonKm)} ton-km`
                                                                    : 'N/A'}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-muted-foreground">Cost Efficiency</span>
                                                            <span className="font-semibold text-foreground">
                                                                {Number.isFinite(costPerKm)
                                                                    ? `${formatNumberDisplay(costPerKm)} Birr/km`
                                                                    : 'N/A'}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-muted-foreground">Return Rate</span>
                                                            <span className="font-semibold text-foreground">{formatPercentDisplay(operationOverview?.totalTrips && operationOverview.totalTrips > 0 ? (operationOverview.completedTrips / operationOverview.totalTrips) * 100 : null)}</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="rounded-xl border border-slate-200 bg-white/80 p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900/40">
                                                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Status Mix</p>
                                                    <div className="mt-4 h-48">
                                                        {hasStatusData ? (
                                                            <ResponsiveContainer width="100%" height="100%">
                                                                <PieChart>
                                                                    <Pie
                                                                        data={statusData}
                                                                        dataKey="value"
                                                                        nameKey="label"
                                                                        innerRadius={50}
                                                                        outerRadius={80}
                                                                        paddingAngle={4}
                                                                        stroke="none"
                                                                    >
                                                                        {statusData.map((entry, index) => (
                                                                            <Cell key={entry.label} fill={statusPalette[index % statusPalette.length]} />
                                                                        ))}
                                                                    </Pie>
                                                                    <Tooltip
                                                                        formatter={(value, name) => [`${value}`, name as string]}
                                                                        contentStyle={{
                                                                            backgroundColor: 'var(--background)',
                                                                            borderRadius: '0.75rem',
                                                                            border: '1px solid hsl(var(--border))',
                                                                            boxShadow: '0 10px 30px rgba(15, 23, 42, 0.15)',
                                                                        }}
                                                                    />
                                                                </PieChart>
                                                            </ResponsiveContainer>
                                                        ) : (
                                                            <div className="flex h-full items-center justify-center rounded-lg bg-muted/40 text-sm text-muted-foreground">
                                                                No status distribution available
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="mt-4 space-y-2 text-xs text-muted-foreground">
                                                        {statusData.map((entry, index) => (
                                                            <div key={entry.label} className="flex items-center justify-between">
                                                                <div className="flex items-center gap-2">
                                                                    <span
                                                                        className="h-2.5 w-2.5 rounded-full"
                                                                        style={{ backgroundColor: statusPalette[index % statusPalette.length] }}
                                                                    />
                                                                    <span className="font-medium text-foreground">{entry.label}</span>
                                                                </div>
                                                                <span className="font-semibold text-foreground">{entry.value}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}
                        </div>

                        <div className="space-y-6">
                            <Card className="border shadow-sm">
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-sm font-semibold">Performance Snapshot</CardTitle>
                                    <CardDescription>Key metrics at a glance</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                        <div className="rounded-lg border bg-muted/40 p-3">
                                            <div className="flex items-center justify-between">
                                                <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Total Distance</p>
                                                <div className="rounded-md bg-purple-100 p-1.5 dark:bg-purple-900/30">
                                                    <Route className="h-4 w-4 text-purple-600" />
                                                </div>
                                            </div>
                                            <p className="mt-2 text-lg font-semibold text-foreground">{totalDistance.toFixed(2)} km</p>
                                        </div>
                                        <div className="rounded-lg border bg-muted/40 p-3">
                                            <div className="flex items-center justify-between">
                                                <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Ton-KM</p>
                                                <div className="rounded-md bg-cyan-100 p-1.5 dark:bg-cyan-900/30">
                                                    <Target className="h-4 w-4 text-cyan-600" />
                                                </div>
                                            </div>
                                            <p className="mt-2 text-lg font-semibold text-foreground">{tonKm.toFixed(2)}</p>
                                        </div>
                                        <div className="rounded-lg border bg-muted/40 p-3">
                                            <div className="flex items-center justify-between">
                                                <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Total Cost</p>
                                                <div className="rounded-md bg-green-100 p-1.5 dark:bg-green-900/30">
                                                    <DollarSign className="h-4 w-4 text-green-600" />
                                                </div>
                                            </div>
                                            <p className="mt-2 text-lg font-semibold text-foreground">{totalCost.toFixed(2)} Birr</p>
                                        </div>
                                        <div className="rounded-lg border bg-muted/40 p-3">
                                            <div className="flex items-center justify-between">
                                                <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Fuel Efficiency</p>
                                                <div className="rounded-md bg-orange-100 p-1.5 dark:bg-orange-900/30">
                                                    <Fuel className="h-4 w-4 text-orange-600" />
                                                </div>
                                            </div>
                                            <p className="mt-2 text-lg font-semibold text-foreground">{fuelEfficiency.toFixed(2)} km/L</p>
                                        </div>
                                        <div className="rounded-lg border bg-muted/40 p-3 sm:col-span-2">
                                            <div className="flex items-center justify-between">
                                                <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Cost per KM</p>
                                                <div className="rounded-md bg-blue-100 p-1.5 dark:bg-blue-900/30">
                                                    <BarChart3 className="h-4 w-4 text-blue-600" />
                                                </div>
                                            </div>
                                            <p className="mt-2 text-lg font-semibold text-foreground">{costPerKm.toFixed(2)} Birr/km</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="border shadow-sm">
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-sm font-semibold">Operational Relationships</CardTitle>
                                    <CardDescription>Entity map for this performance record</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-5 text-sm">
                                    <div className="space-y-3">
                                        <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Operation Record</p>
                                        <div className="rounded-lg border bg-muted/40 p-3">
                                            <div className="flex items-start gap-3">
                                                <div className="rounded-md bg-purple-100 p-2 dark:bg-purple-900/30">
                                                    <Building2 className="h-4 w-4 text-purple-600" />
                                                </div>
                                                <div className="min-w-0 space-y-1">
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <p className="font-medium text-foreground">
                                                            {operationRef?.operationid ?? 'No operation linked'}
                                                        </p>
                                                        {operationLink && (
                                                            <Link
                                                                href={operationLink}
                                                                className="inline-flex items-center gap-1 text-xs font-medium text-purple-600 transition-colors hover:text-purple-700"
                                                            >
                                                                View operation
                                                                <ExternalLink className="h-3 w-3" />
                                                            </Link>
                                                        )}
                                                    </div>
                                                    <p className="text-xs text-muted-foreground">
                                                        {operationRef?.customer?.name
                                                            ? `Customer: ${operationRef.customer.name}`
                                                            : 'Attach a customer to improve reporting'}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="mt-3 flex flex-wrap gap-2 text-[11px] uppercase tracking-wide text-muted-foreground">
                                                <span className="inline-flex items-center gap-1 rounded-full bg-white/60 px-2.5 py-1 font-medium dark:bg-slate-900/40">
                                                    <MapPin className="h-3 w-3" />
                                                    {originName} → {destinationName}
                                                </span>
                                                <span className="inline-flex items-center gap-1 rounded-full bg-white/60 px-2.5 py-1 font-medium dark:bg-slate-900/40">
                                                    <Route className="h-3 w-3" />
                                                    {distanceMixLabel}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <Separator />
                                    <div className="grid gap-3 sm:grid-cols-2">
                                        <div className="rounded-lg border bg-muted/40 p-3">
                                            <div className="flex items-start gap-3">
                                                <div className="rounded-md bg-blue-100 p-2 dark:bg-blue-900/30">
                                                    <User className="h-4 w-4 text-blue-600" />
                                                </div>
                                                <div className="min-w-0 space-y-1">
                                                    <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Driver</p>
                                                    <p className="font-medium text-foreground">{driver?.name ?? 'Unassigned driver'}</p>
                                                    <div className="space-y-1 text-xs text-muted-foreground">
                                                        {driver?.phone && (
                                                            <div className="flex items-center gap-1">
                                                                <Phone className="h-3 w-3" />
                                                                {driver.phone}
                                                            </div>
                                                        )}
                                                        {driver?.license && (
                                                            <div className="flex items-center gap-1">
                                                                <FileText className="h-3 w-3" />
                                                                License: {driver.license}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="rounded-lg border bg-muted/40 p-3">
                                            <div className="flex items-start gap-3">
                                                <div className="rounded-md bg-amber-100 p-2 dark:bg-amber-900/30">
                                                    <Truck className="h-4 w-4 text-amber-600" />
                                                </div>
                                                <div className="min-w-0 space-y-1">
                                                    <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Truck</p>
                                                    <p className="font-medium text-foreground">{truck?.plate ?? 'Unassigned truck'}</p>
                                                    <div className="space-y-1 text-xs text-muted-foreground">
                                                        {truck?.model && <p>Model: {truck.model}</p>}
                                                        {truckCapacity > 0 && <p>Capacity: {truckCapacity} MT</p>}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <Separator />
                                    <div className="space-y-3 text-xs text-muted-foreground">
                                        <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Lifecycle Checkpoints</p>
                                        <div className="flex items-center justify-between text-foreground">
                                            <span className="flex items-center gap-2 text-foreground">
                                                <Calendar className="h-3.5 w-3.5 text-purple-600" />
                                                Dispatch
                                            </span>
                                            <span className="font-medium text-foreground">{dispatchDateLabel}</span>
                                        </div>
                                        <div className="flex items-center justify-between text-foreground">
                                            <span className="flex items-center gap-2 text-foreground">
                                                <Clock className="h-3.5 w-3.5 text-amber-600" />
                                                Return
                                            </span>
                                            <span className="font-medium text-foreground">
                                                {performance.is_returned ? returnedDateLabel : 'Pending return'}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between text-foreground">
                                            <span className="flex items-center gap-2 text-foreground">
                                                <Route className="h-3.5 w-3.5 text-blue-600" />
                                                Distance Mix
                                            </span>
                                            <span className="font-medium text-foreground">{distanceMixLabel}</span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="border shadow-sm">
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-sm font-semibold">Quick Actions</CardTitle>
                                    <CardDescription>Download or share this record</CardDescription>
                                </CardHeader>
                                <CardContent className="flex flex-col gap-2">
                                    <Button variant="secondary" className="w-full justify-start gap-2">
                                        <Download className="h-4 w-4" />
                                        Export Report
                                    </Button>
                                    <Button variant="outline" className="w-full justify-start gap-2">
                                        <Printer className="h-4 w-4" />
                                        Print View
                                    </Button>
                                </CardContent>
                            </Card>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-end gap-3">
                        <Link href={`/performances/${performance.id}/edit`}>
                            <Button className="gap-2 bg-purple-600 hover:bg-purple-700">
                                <Edit2 className="h-4 w-4" />
                                Edit Performance
                            </Button>
                        </Link>
                        <Button
                            variant="outline"
                            onClick={() => setDeleteDialogOpen(true)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 hover:border-red-300 gap-2"
                        >
                            <Trash2 className="h-4 w-4" />
                            Delete
                        </Button>
                    </div>
                </div>

                {/* Delete Confirmation Dialog */}
                <DeleteConfirmationDialog
                    open={deleteDialogOpen}
                    onOpenChange={setDeleteDialogOpen}
                    onConfirm={() => {
                        window.location.href = `/performances/${performance.id}?_method=DELETE`;
                    }}
                    title="Delete Performance Record"
                    description={`Are you sure you want to delete performance record "${performance.trip}"? This action cannot be undone.`}
                />
            </div>
        </AppLayout>
    );
}
