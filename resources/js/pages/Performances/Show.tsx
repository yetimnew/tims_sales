import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import AppLayout from '@/layouts/app-layout';
import { Head, Link } from '@inertiajs/react';
import { type BreadcrumbItem } from '@/types';
import {
    Activity, TrendingUp, DollarSign, Zap, Edit2, Trash2, ArrowLeft,
    CheckCircle, Clock, MapPin, User, Truck, Building2, Route,
    Fuel, Package, Calendar, FileText, AlertCircle, TrendingDown,
    Download, Printer, Mail, Copy, BarChart3, Target, Navigation
} from 'lucide-react';
import { useState } from 'react';
import { DeleteConfirmationDialog } from '@/components/delete-confirmation-dialog';
import { ActivityLogTable } from '@/components/activity-log-table';

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
}

export default function PerformancesShow({ performance, activityLogs }: ShowProps) {
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

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
        const icons: Record<string, JSX.Element> = {
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
            <div className="flex h-full flex-1 flex-col gap-3 overflow-hidden p-4">
                {/* Compact Hero Header */}
                <Card className="shadow-lg border-0 bg-gradient-to-br from-purple-50 via-white to-pink-50 dark:from-purple-950/20 dark:via-background dark:to-pink-950/20">
                    <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <Link
                                    href="/performances"
                                    className="text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    <ArrowLeft className="h-5 w-5" />
                                </Link>
                                <div>
                                    <div className="flex items-center gap-3">
                                        <h1 className="text-2xl font-bold text-foreground">Performance Details</h1>
                                        <Badge className={`${getStatusColor(performance.satus)} border font-semibold`}>
                                            {getStatusIcon(performance.satus)}
                                            <span className="ml-1">{performance.satus?.charAt(0).toUpperCase() + performance.satus?.slice(1)}</span>
                                        </Badge>
                                        <Badge className={`${getLoadTypeColor(performance.LoadType)} border font-semibold`}>
                                            {performance.LoadType}
                                        </Badge>
                                    </div>
                                    <p className="text-muted-foreground mt-1 text-sm">
                                        Trip <span className="font-semibold text-purple-600">{performance.trip}</span> • FO: {performance.FOnumber}
                                    </p>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <Button variant="outline" size="sm" className="gap-2">
                                    <Download className="h-4 w-4" />
                                    Export
                                </Button>
                                <Button variant="outline" size="sm" className="gap-2">
                                    <Printer className="h-4 w-4" />
                                    Print
                                </Button>
                            </div>
                        </div>

                        {/* Route Visualization */}
                        <div className="flex items-center gap-4 p-4 bg-white/50 dark:bg-slate-900/50 rounded-lg border border-purple-200 dark:border-purple-800">
                            <div className="flex items-center gap-3 flex-1">
                                <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                                    <MapPin className="h-5 w-5 text-purple-600" />
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground">Origin</p>
                                    <p className="font-semibold text-foreground">{performance.origin?.name || 'N/A'}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="h-px w-12 bg-gradient-to-r from-purple-400 to-pink-400"></div>
                                <Navigation className="h-5 w-5 text-purple-500" />
                                <div className="h-px w-12 bg-gradient-to-r from-purple-400 to-pink-400"></div>
                            </div>
                            <div className="flex items-center gap-3 flex-1 justify-end">
                                <div className="text-right">
                                    <p className="text-xs text-muted-foreground">Destination</p>
                                    <p className="font-semibold text-foreground">{performance.destination?.name || 'N/A'}</p>
                                </div>
                                <div className="p-3 bg-pink-100 dark:bg-pink-900/30 rounded-lg">
                                    <MapPin className="h-5 w-5 text-pink-600" />
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Key Metrics Dashboard - Compact */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                    {/* Total Distance */}
                    <Card className="border-l-4 border-l-purple-500 shadow-sm hover:shadow-md transition-shadow">
                        <CardContent className="p-3">
                            <div className="flex items-center justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                    <p className="text-[10px] text-muted-foreground font-medium truncate">Total Distance</p>
                                    <p className="text-xl font-bold text-foreground">{totalDistance.toFixed(2)}</p>
                                    <p className="text-[10px] text-muted-foreground">km</p>
                                </div>
                                <div className="p-1.5 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex-shrink-0">
                                    <Route className="h-4 w-4 text-purple-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Ton-KM Efficiency */}
                    <Card className="border-l-4 border-l-cyan-500 shadow-sm hover:shadow-md transition-shadow">
                        <CardContent className="p-3">
                            <div className="flex items-center justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                    <p className="text-[10px] text-muted-foreground font-medium truncate">Ton-KM</p>
                                    <p className="text-xl font-bold text-foreground">{tonKm.toFixed(2)}</p>
                                    <p className="text-[10px] text-muted-foreground">efficiency</p>
                                </div>
                                <div className="p-1.5 bg-cyan-100 dark:bg-cyan-900/30 rounded-lg flex-shrink-0">
                                    <Target className="h-4 w-4 text-cyan-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Total Cost */}
                    <Card className="border-l-4 border-l-green-500 shadow-sm hover:shadow-md transition-shadow">
                        <CardContent className="p-3">
                            <div className="flex items-center justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                    <p className="text-[10px] text-muted-foreground font-medium truncate">Total Cost</p>
                                    <p className="text-xl font-bold text-foreground">{totalCost.toFixed(2)}</p>
                                    <p className="text-[10px] text-muted-foreground">Birr</p>
                                </div>
                                <div className="p-1.5 bg-green-100 dark:bg-green-900/30 rounded-lg flex-shrink-0">
                                    <DollarSign className="h-4 w-4 text-green-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Fuel Efficiency */}
                    <Card className="border-l-4 border-l-orange-500 shadow-sm hover:shadow-md transition-shadow">
                        <CardContent className="p-3">
                            <div className="flex items-center justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                    <p className="text-[10px] text-muted-foreground font-medium truncate">Fuel Eff.</p>
                                    <p className="text-xl font-bold text-foreground">{fuelEfficiency.toFixed(2)}</p>
                                    <p className="text-[10px] text-muted-foreground">km/L</p>
                                </div>
                                <div className="p-1.5 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex-shrink-0">
                                    <Fuel className="h-4 w-4 text-orange-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Cost per KM */}
                    <Card className="border-l-4 border-l-blue-500 shadow-sm hover:shadow-md transition-shadow">
                        <CardContent className="p-3">
                            <div className="flex items-center justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                    <p className="text-[10px] text-muted-foreground font-medium truncate">Cost/KM</p>
                                    <p className="text-xl font-bold text-foreground">{costPerKm.toFixed(2)}</p>
                                    <p className="text-[10px] text-muted-foreground">Birr/km</p>
                                </div>
                                <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex-shrink-0">
                                    <BarChart3 className="h-4 w-4 text-blue-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 flex-1 overflow-hidden">
                    {/* Left Column - Entity Cards */}
                    <div className="space-y-3 overflow-y-auto">
                        {/* Driver Card */}
                        <Card className="shadow-md border-l-4 border-l-blue-500">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                                        <User className="h-4 w-4 text-blue-600" />
                                    </div>
                                    Driver Information
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div>
                                    <p className="text-xs text-muted-foreground">Name</p>
                                    <p className="font-semibold text-foreground">{performance.driverTruck?.driver?.name || 'N/A'}</p>
                                </div>
                                {performance.driverTruck?.driver?.license && (
                                    <div>
                                        <p className="text-xs text-muted-foreground">License</p>
                                        <p className="text-sm text-foreground">{performance.driverTruck.driver.license}</p>
                                    </div>
                                )}
                                {performance.driverTruck?.driver?.phone && (
                                    <div>
                                        <p className="text-xs text-muted-foreground">Phone</p>
                                        <p className="text-sm text-foreground">{performance.driverTruck.driver.phone}</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Truck Card */}
                        <Card className="shadow-md border-l-4 border-l-green-500">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                    <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                                        <Truck className="h-4 w-4 text-green-600" />
                                    </div>
                                    Truck Information
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div>
                                    <p className="text-xs text-muted-foreground">Plate Number</p>
                                    <p className="font-semibold text-foreground">{performance.driverTruck?.truck?.plate || 'N/A'}</p>
                                </div>
                                {performance.driverTruck?.truck?.model && (
                                    <div>
                                        <p className="text-xs text-muted-foreground">Model</p>
                                        <p className="text-sm text-foreground">{performance.driverTruck.truck.model}</p>
                                    </div>
                                )}
                                {performance.driverTruck?.truck?.capacity && (
                                    <div>
                                        <p className="text-xs text-muted-foreground">Capacity</p>
                                        <p className="text-sm text-foreground">{performance.driverTruck.truck.capacity} MT</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Customer Card */}
                        <Card className="shadow-md border-l-4 border-l-purple-500">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                    <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                                        <Building2 className="h-4 w-4 text-purple-600" />
                                    </div>
                                    Customer Information
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div>
                                    <p className="text-xs text-muted-foreground">Company Name</p>
                                    <p className="font-semibold text-foreground">{performance.operation?.customer?.name || 'N/A'}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground">Operation ID</p>
                                    <p className="text-sm text-foreground">{performance.operation?.operationid || 'N/A'}</p>
                                </div>
                                {performance.operation?.customer?.email && (
                                    <div>
                                        <p className="text-xs text-muted-foreground">Email</p>
                                        <p className="text-sm text-foreground">{performance.operation.customer.email}</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Quick Actions */}
                        <Card className="shadow-md border-l-4 border-l-amber-500">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                    <Zap className="h-4 w-4 text-amber-600" />
                                    Quick Actions
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                <Button variant="outline" size="sm" className="w-full justify-start gap-2">
                                    <Copy className="h-4 w-4" />
                                    Duplicate Trip
                                </Button>
                                <Button variant="outline" size="sm" className="w-full justify-start gap-2">
                                    <Mail className="h-4 w-4" />
                                    Send Report
                                </Button>
                                <Button variant="outline" size="sm" className="w-full justify-start gap-2">
                                    <FileText className="h-4 w-4" />
                                    Generate Invoice
                                </Button>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Column - Detailed Tabs */}
                    <div className="lg:col-span-2 overflow-hidden flex flex-col">
                        <Card className="shadow-lg border-0 bg-gradient-to-br from-background to-muted/20 flex-1 flex flex-col overflow-hidden">
                            <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 border-b pb-4">
                                <CardTitle className="flex items-center gap-2">
                                    <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                                        <Activity className="h-5 w-5 text-purple-600" />
                                    </div>
                                    Detailed Information
                                </CardTitle>
                                <CardDescription>Complete performance metrics and analysis</CardDescription>
                            </CardHeader>
                            <CardContent className="p-6 flex-1 overflow-auto">
                                <Tabs defaultValue="details" className="w-full h-full flex flex-col">
                                    <TabsList className="grid w-full grid-cols-4 bg-muted/50 p-1 rounded-lg mb-4">
                                        <TabsTrigger value="details" className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                                            <Activity className="h-4 w-4" />
                                            <span className="hidden sm:inline">Details</span>
                                        </TabsTrigger>
                                        <TabsTrigger value="financial" className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                                            <DollarSign className="h-4 w-4" />
                                            <span className="hidden sm:inline">Financial</span>
                                        </TabsTrigger>
                                        <TabsTrigger value="route" className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                                            <MapPin className="h-4 w-4" />
                                            <span className="hidden sm:inline">Route</span>
                                        </TabsTrigger>
                                        <TabsTrigger value="activity" className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                                            <CheckCircle className="h-4 w-4" />
                                            <span className="hidden sm:inline">Activity</span>
                                        </TabsTrigger>
                                    </TabsList>

                                    {/* TAB 1: DETAILS */}
                                    <TabsContent value="details" className="space-y-6 flex-1 overflow-auto">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                                                            {new Date(performance.DateDispach).toLocaleDateString('en-US', {
                                                                year: 'numeric',
                                                                month: 'long',
                                                                day: 'numeric'
                                                            })}
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
                                                                    style={{ width: `${Math.min((cvm / (performance.driverTruck?.truck?.capacity || 100)) * 100, 100)}%` }}
                                                                ></div>
                                                            </div>
                                                            <span className="text-xs font-medium">
                                                                {((cvm / (performance.driverTruck?.truck?.capacity || 100)) * 100).toFixed(0)}%
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
                                    <TabsContent value="financial" className="space-y-6 flex-1 overflow-auto">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                                    <TabsContent value="route" className="space-y-6 flex-1 overflow-auto">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                                    <TabsContent value="activity" className="space-y-4 flex-1 overflow-auto">
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
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 justify-end">
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

                {/* Delete Confirmation Dialog */}
                <DeleteConfirmationDialog
                    isOpen={deleteDialogOpen}
                    onClose={() => setDeleteDialogOpen(false)}
                    onConfirm={() => {
                        window.location.href = `/performances/${performance.id}?_method=DELETE`;
                    }}
                    title="Delete Performance Record"
                    description={`Are you sure you want to delete performance record "${performance.trip}"? This action cannot be undone.`}
                    confirmText="Delete"
                    cancelText="Cancel"
                />
            </div>
        </AppLayout>
    );
}
