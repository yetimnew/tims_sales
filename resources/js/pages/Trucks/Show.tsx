import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, Wrench, BarChart3, History, CheckCircle, XCircle, DollarSign, Calendar, Clock, Activity, Settings, Hash } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { Head, Link, router } from '@inertiajs/react';
import { type BreadcrumbItem } from '@/types';
import { Edit, Trash2, ArrowLeft } from 'lucide-react';
import { DeleteConfirmationDialog } from '@/components/delete-confirmation-dialog';
import { ActivityLogTable } from '@/components/activity-log-table';
import { useState } from 'react';

interface VehicleType {
    id: number;
    name: string;
}

interface ActivityLog {
    id: number;
    description: string;
    causer?: {
        name?: string;
    };
    created_at: string;
    properties?: Record<string, any>;
}

interface DriverTruck {
    id: number;
    driver_id: number;
    driverid: string;
    date_recived: string;
    date_detach?: string;
    is_attached: boolean;
    status: string;
    driver: {
        id: number;
        name: string;
        driverid: string;
    };
}

interface Truck {
    id: number;
    plate: string;
    vehicletype_id: number;
    chasisNumber?: string;
    engineNumber?: string;
    tyreSyze?: string;
    serviceIntervalKM?: number;
    purchasePrice?: number;
    productionDate?: string;
    serviceStartDate?: string;
    status: string;
    created_at?: string;
    updated_at?: string;
    vehicleType?: VehicleType;
    drivers?: any[];
    performances?: any[];
    driverTrucks?: DriverTruck[];
    activityLogs?: ActivityLog[];
}

interface TrucksShowProps {
    truck: Truck;
    activityLogs?: ActivityLog[];
    counts?: {
        drivers: number;
        performances: number;
        driverAssignments: number;
        maintenance: number;
    };
    performanceSummary?: {
        total_records: number;
        total_distance_km: number;
        total_fuel_liters: number;
        fuel_cost_birr: number;
        avg_distance_per_record: number;
        avg_fuel_efficiency_km_per_liter: number | null;
    };
    maintenanceSummary?: {
        total_records: number;
        completed: number;
        scheduled: number;
        overdue: number;
        total_cost: number;
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Trucks',
        href: '/trucks',
    },
];

export default function TrucksShow({ truck, activityLogs = [], counts, performanceSummary, maintenanceSummary }: TrucksShowProps) {
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDeleteConfirm = () => {
        setIsDeleting(true);
        router.delete(`/trucks/${truck.id}`, {
            onSuccess: () => {
                setDeleteDialogOpen(false);
                setIsDeleting(false);
            },
            onError: () => {
                setIsDeleting(false);
            },
        });
    };

    const formatCurrency = (value?: number) => {
        if (!value) return 'N/A';
        return `$${Number(value).toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        })}`;
    };

    const formatDate = (date?: string) => {
        if (!date) return 'N/A';
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    const getStatusBadgeColor = (status: string | undefined | null) => {
        if (!status) return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';

        switch (status) {
            case 'active':
                return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
            case 'maintenance':
                return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
            case 'inactive':
                return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
            default:
                return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`View Truck - ${truck.plate}`} />
            <div className="flex flex-1 min-h-0 flex-col gap-6 rounded-xl p-4">
                {/* Enhanced Professional Header */}
                <div className="bg-gradient-to-r from-slate-50 to-blue-50 dark:from-slate-900 dark:to-blue-950/20 rounded-lg p-6 border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => router.get('/trucks')}
                                className="flex items-center gap-2 hover:bg-slate-100 dark:hover:bg-slate-800 border-slate-300 dark:border-slate-600"
                            >
                                <ArrowLeft className="h-4 w-4" />
                                Back to Trucks
                            </Button>
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                                    <CheckCircle className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{truck.plate}</h1>
                                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Comprehensive truck details and management</p>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-sm font-medium">
                                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                Fleet Management
                            </div>
                            <div className="flex gap-2">
                                <Button variant="outline" asChild className="hover:bg-blue-50 hover:border-blue-300 border-slate-300 dark:border-slate-600">
                                    <Link href={`/trucks/${truck.id}/edit`}>
                                        <Edit className="mr-2 h-4 w-4" />
                                        Edit Truck
                                    </Link>
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={() => setDeleteDialogOpen(true)}
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 hover:border-red-300"
                                >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete Truck
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>

                <Tabs defaultValue="overview" className="flex-1 overflow-hidden flex flex-col">
                    <TabsList className="grid w-full grid-cols-4 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
                        <TabsTrigger value="overview" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:border data-[state=active]:border-slate-200 dark:data-[state=active]:bg-slate-700 dark:data-[state=active]:border-slate-600 rounded-lg transition-all duration-200 font-medium">
                            <CheckCircle className="h-4 w-4" />
                            Overview
                        </TabsTrigger>
                        <TabsTrigger value="maintenance" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:border data-[state=active]:border-slate-200 dark:data-[state=active]:bg-slate-700 dark:data-[state=active]:border-slate-600 rounded-lg transition-all duration-200 font-medium">
                            <Wrench className="h-4 w-4" />
                            Maintenance
                        </TabsTrigger>
                        <TabsTrigger value="performance" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:border data-[state=active]:border-slate-200 dark:data-[state=active]:bg-slate-700 dark:data-[state=active]:border-slate-600 rounded-lg transition-all duration-200 font-medium">
                            <BarChart3 className="h-4 w-4" />
                            Performance
                        </TabsTrigger>
                        <TabsTrigger value="history" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:border data-[state=active]:border-slate-200 dark:data-[state=active]:bg-slate-700 dark:data-[state=active]:border-slate-600 rounded-lg transition-all duration-200 font-medium">
                            <History className="h-4 w-4" />
                            History
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview" className="space-y-6 h-full overflow-y-auto">
                        <div className="flex flex-col lg:flex-row gap-6">
                            {/* Main Details */}
                            <div className="flex-1 space-y-6">
                                {/* Enhanced Basic Information */}
                                <Card className="shadow-lg border-0 bg-gradient-to-br from-background to-muted/20">
                                    <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-b">
                                        <CardTitle className="flex items-center gap-2 text-xl">
                                            <CheckCircle className="h-5 w-5 text-blue-600" />
                                            Basic Information
                                        </CardTitle>
                                        <CardDescription className="text-base">
                                            Core truck details and specifications
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="grid gap-4">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <p className="text-sm font-medium text-muted-foreground">Status</p>
                                                    <Badge className={`mt-1 flex items-center gap-1 w-fit ${getStatusBadgeColor(truck.status)}`}>
                                                        {truck.status === 'active' && <CheckCircle className="h-3 w-3" />}
                                                        {truck.status === 'maintenance' && <Wrench className="h-3 w-3" />}
                                                        {truck.status === 'inactive' && <XCircle className="h-3 w-3" />}
                                                        {truck.status ? truck.status.charAt(0).toUpperCase() + truck.status.slice(1) : 'Unknown'}
                                                    </Badge>
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-muted-foreground">Vehicle Type</p>
                                                    <p className="mt-1 text-sm font-semibold">{truck.vehicleType?.name || 'Unknown'}</p>
                                                </div>
                                            </div>

                                            <div className="border-t pt-4">
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <p className="text-sm font-medium text-muted-foreground">Chassis Number</p>
                                                        <p className="mt-1 text-sm font-mono">{truck.chasisNumber || 'N/A'}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium text-muted-foreground">Engine Number</p>
                                                        <p className="mt-1 text-sm font-mono">{truck.engineNumber || 'N/A'}</p>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="border-t pt-4">
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <p className="text-sm font-medium text-muted-foreground">Tyre Size</p>
                                                        <p className="mt-1 text-sm">{truck.tyreSyze || 'N/A'}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium text-muted-foreground">Service Interval</p>
                                                        <p className="mt-1 text-sm">{truck.serviceIntervalKM ? truck.serviceIntervalKM.toLocaleString() + ' KM' : 'N/A'}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Financial Information */}
                                <Card className="shadow-lg border-0 bg-gradient-to-br from-background to-muted/20">
                                    <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-b">
                                        <CardTitle className="flex items-center gap-2 text-xl">
                                            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                                                <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400" />
                                            </div>
                                            Financial Information
                                        </CardTitle>
                                        <CardDescription className="text-base">
                                            Purchase and pricing details
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="p-6">
                                        <div className="space-y-6">
                                            {/* Purchase Price */}
                                            <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                                                <div>
                                                    <p className="text-sm font-medium text-green-700 dark:text-green-300">Purchase Price</p>
                                                    <p className="mt-1 text-2xl font-bold text-green-800 dark:text-green-200">{formatCurrency(truck.purchasePrice)}</p>
                                                </div>
                                                <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                                                    <DollarSign className="h-6 w-6 text-green-600 dark:text-green-400" />
                                                </div>
                                            </div>

                                            {/* Dates Grid */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <Calendar className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                                                        <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Production Date</p>
                                                    </div>
                                                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{formatDate(truck.productionDate)}</p>
                                                </div>
                                                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <Clock className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                                                        <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Service Start</p>
                                                    </div>
                                                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{formatDate(truck.serviceStartDate)}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Timestamps */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Record Information</CardTitle>
                                        <CardDescription>System-generated metadata</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="grid gap-4 text-sm">
                                            <div>
                                                <p className="font-medium text-muted-foreground">Created</p>
                                                <p className="mt-1">{formatDate(truck.created_at)}</p>
                                            </div>
                                            <div>
                                                <p className="font-medium text-muted-foreground">Last Updated</p>
                                                <p className="mt-1">{formatDate(truck.updated_at)}</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Sidebar */}
                            <div className="w-full lg:w-80 space-y-4">
                                {/* Quick Actions Section */}
                                <Card className="shadow-lg border-0 bg-gradient-to-br from-background to-muted/20">
                                    <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 border-b">
                                        <CardTitle className="flex items-center gap-2 text-xl">
                                            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                                                <Wrench className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                                            </div>
                                            Quick Actions
                                        </CardTitle>
                                        <CardDescription className="text-base">
                                            Common operations and management tasks
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="grid grid-cols-2 gap-3">
                                            <Button
                                                variant="outline"
                                                asChild
                                                className="h-auto p-3 flex flex-col items-center gap-2 hover:bg-blue-50 hover:border-blue-300 border-slate-300 dark:border-slate-600 dark:hover:bg-blue-950/20"
                                            >
                                                <Link href={`/maintenance/create?truck_id=${truck.id}`}>
                                                    <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                                                        <Wrench className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                                    </div>
                                                    <div className="text-center">
                                                        <p className="text-xs font-medium">Schedule Maintenance</p>
                                                        <p className="text-xs text-muted-foreground">Add service record</p>
                                                    </div>
                                                </Link>
                                            </Button>
                                            <Button
                                                variant="outline"
                                                asChild
                                                className="h-auto p-3 flex flex-col items-center gap-2 hover:bg-green-50 hover:border-green-300 border-slate-300 dark:border-slate-600 dark:hover:bg-green-950/20"
                                            >
                                                <Link href={`/performances?truck_id=${truck.id}`}>
                                                    <div className="p-1.5 bg-green-100 dark:bg-green-900/30 rounded-lg">
                                                        <BarChart3 className="h-4 w-4 text-green-600 dark:text-green-400" />
                                                    </div>
                                                    <div className="text-center">
                                                        <p className="text-xs font-medium">View Performance</p>
                                                        <p className="text-xs text-muted-foreground">Analytics & reports</p>
                                                    </div>
                                                </Link>
                                            </Button>
                                            <Button
                                                variant="outline"
                                                asChild
                                                className="h-auto p-3 flex flex-col items-center gap-2 hover:bg-purple-50 hover:border-purple-300 border-slate-300 dark:border-slate-600 dark:hover:bg-purple-950/20"
                                            >
                                                <Link href={`/trucks/${truck.id}/edit`}>
                                                    <div className="p-1.5 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                                                        <Settings className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                                                    </div>
                                                    <div className="text-center">
                                                        <p className="text-xs font-medium">Truck Settings</p>
                                                        <p className="text-xs text-muted-foreground">Configure options</p>
                                                    </div>
                                                </Link>
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                                {/* Status Card */}
                                <Card className="shadow-lg border-0 bg-gradient-to-br from-background to-muted/20">
                                    <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-b">
                                        <CardTitle className="flex items-center gap-2 text-lg">
                                            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                                                <CheckCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                            </div>
                                            Quick Status
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-4">
                                        <div className="space-y-4">
                                            <div className="rounded-lg bg-blue-50 dark:bg-blue-950/20 p-4 border border-blue-200 dark:border-blue-800">
                                                <p className="text-sm font-medium text-blue-700 dark:text-blue-300">Current Status</p>
                                                <Badge className={`mt-2 flex items-center gap-1 w-fit ${getStatusBadgeColor(truck.status)}`}>
                                                    {truck.status === 'active' && <CheckCircle className="h-3 w-3" />}
                                                    {truck.status === 'maintenance' && <Wrench className="h-3 w-3" />}
                                                    {truck.status === 'inactive' && <XCircle className="h-3 w-3" />}
                                                    {truck.status ? truck.status.charAt(0).toUpperCase() + truck.status.slice(1) : 'Unknown'}
                                                </Badge>
                                            </div>
                                            <div className="rounded-lg bg-slate-50 dark:bg-slate-800/50 p-4 border border-slate-200 dark:border-slate-700">
                                                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Plate Number</p>
                                                <p className="mt-2 text-lg font-mono font-bold text-slate-900 dark:text-slate-100">{truck.plate}</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                {counts && (
                                    <Card className="shadow-lg border-0 bg-gradient-to-br from-background to-muted/20">
                                        <CardHeader className="bg-gradient-to-r from-indigo-50 to-violet-50 dark:from-indigo-950/20 dark:to-violet-950/20 border-b">
                                            <CardTitle className="flex items-center gap-2 text-lg">
                                                <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                                                    <Hash className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                                                </div>
                                                Related Counts
                                            </CardTitle>
                                            <CardDescription>Summary of related records</CardDescription>
                                        </CardHeader>
                                        <CardContent className="p-4 space-y-3 text-sm">
                                            <div className="flex items-center justify-between">
                                                <span className="text-muted-foreground">Drivers</span>
                                                <span className="font-semibold">{counts.drivers}</span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-muted-foreground">Performances</span>
                                                <span className="font-semibold">{counts.performances}</span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-muted-foreground">Driver Assignments</span>
                                                <span className="font-semibold">{counts.driverAssignments}</span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-muted-foreground">Maintenance</span>
                                                <span className="font-semibold">{counts.maintenance}</span>
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}

                                {/* Driver Assignments */}
                                {truck.driverTrucks && truck.driverTrucks.length > 0 && (
                                    <Card className="shadow-lg border-0 bg-gradient-to-br from-background to-muted/20">
                                        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-b">
                                            <CardTitle className="flex items-center gap-2 text-lg">
                                                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                                                    <CheckCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                                </div>
                                                Driver Assignments
                                            </CardTitle>
                                            <CardDescription>Current and past driver assignments for this truck</CardDescription>
                                        </CardHeader>
                                        <CardContent className="p-4">
                                            <div className="space-y-3">
                                                {truck.driverTrucks.map((assignment: DriverTruck) => (
                                                    <div
                                                        key={assignment.id}
                                                        className="rounded-lg border border-blue-200 dark:border-blue-800 p-3 hover:bg-blue-50 dark:hover:bg-blue-950/20 transition-colors duration-200"
                                                    >
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-3">
                                                                <div>
                                                                    <p className="font-medium text-sm text-blue-800 dark:text-blue-200">{assignment.driver.name}</p>
                                                                    <p className="text-xs text-muted-foreground">
                                                                        ID: {assignment.driver.driverid}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <Badge variant={assignment.is_attached ? "default" : "secondary"}>
                                                                {assignment.is_attached ? 'Active' : 'Detached'}
                                                            </Badge>
                                                        </div>
                                                        <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                                                            <div>
                                                                <span className="font-medium">Assigned:</span> {new Date(assignment.date_recived).toLocaleDateString()}
                                                            </div>
                                                            {assignment.date_detach && (
                                                                <div>
                                                                    <span className="font-medium">Detached:</span> {new Date(assignment.date_detach).toLocaleDateString()}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="mt-4 pt-3 border-t border-blue-200 dark:border-blue-800">
                                                <Link href="/driver-trucks" className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 hover:underline">
                                                    View all assignments →
                                                </Link>
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}

                                {/* Recent Performances */}
                                {truck.performances && truck.performances.length > 0 && (
                                    <Card className="shadow-lg border-0 bg-gradient-to-br from-background to-muted/20">
                                        <CardHeader className="bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20 border-b">
                                            <CardTitle className="flex items-center gap-2 text-lg">
                                                <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                                                    <Activity className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                                                </div>
                                                Recent Activities
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="p-4">
                                            <div className="rounded-lg bg-orange-50 dark:bg-orange-950/20 p-4 border border-orange-200 dark:border-orange-800">
                                                <p className="text-sm text-orange-700 dark:text-orange-300">
                                                    {truck.performances.length} performance record{truck.performances.length !== 1 ? 's' : ''} available
                                                </p>
                                                <div className="mt-2 flex items-center gap-2">
                                                    <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                                                    <span className="text-xs text-orange-600 dark:text-orange-400 font-medium">Active monitoring</span>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="maintenance" className="space-y-6 h-full overflow-y-auto">
                        <Card className="shadow-lg border-0 bg-gradient-to-br from-background to-muted/10">
                            <CardHeader className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-950/20 dark:to-indigo-950/20 border-b">
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <Wrench className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                                    Maintenance Overview
                                </CardTitle>
                                <CardDescription>Track scheduled and completed services</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {maintenanceSummary && (
                                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                        <div className="p-3 rounded-lg bg-purple-50 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-800 text-center">
                                            <p className="text-xs text-muted-foreground">Total</p>
                                            <p className="text-lg font-semibold">{maintenanceSummary.total_records}</p>
                                        </div>
                                        <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 text-center">
                                            <p className="text-xs text-muted-foreground">Completed</p>
                                            <p className="text-lg font-semibold">{maintenanceSummary.completed}</p>
                                        </div>
                                        <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 text-center">
                                            <p className="text-xs text-muted-foreground">Scheduled</p>
                                            <p className="text-lg font-semibold">{maintenanceSummary.scheduled}</p>
                                        </div>
                                        <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-center">
                                            <p className="text-xs text-muted-foreground">Overdue</p>
                                            <p className="text-lg font-semibold">{maintenanceSummary.overdue}</p>
                                        </div>
                                        <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 text-center">
                                            <p className="text-xs text-muted-foreground">Total Cost</p>
                                            <p className="text-lg font-semibold">{maintenanceSummary.total_cost.toLocaleString()}</p>
                                        </div>
                                    </div>
                                )}

                                {truck.maintenanceRecords && truck.maintenanceRecords.length > 0 ? (
                                    <div className="space-y-3 max-h-[480px] overflow-y-auto pr-2 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-600">
                                        {truck.maintenanceRecords.slice(0, 10).map((rec: any) => (
                                            <div key={rec.id} className="p-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 flex flex-col gap-2">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <Badge className="text-xs" variant={rec.status === 'completed' ? 'default' : rec.is_overdue ? 'destructive' : 'secondary'}>
                                                            {rec.status}
                                                        </Badge>
                                                        <span className="text-sm font-medium">{rec.maintenance_type_id ? `Type #${rec.maintenance_type_id}` : 'Maintenance'}</span>
                                                    </div>
                                                    <span className="text-xs text-muted-foreground">Odometer: {rec.odometer_reading ?? 'N/A'}</span>
                                                </div>
                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-muted-foreground">
                                                    <div>
                                                        <span className="font-medium">Scheduled:</span> {rec.scheduled_date || 'N/A'}
                                                    </div>
                                                    <div>
                                                        <span className="font-medium">Completed:</span> {rec.completed_date || '—'}
                                                    </div>
                                                    <div>
                                                        <span className="font-medium">Cost:</span> {rec.cost ? rec.cost.toLocaleString() : 'N/A'}
                                                    </div>
                                                    <div>
                                                        <span className="font-medium">Provider:</span> {rec.service_provider || 'N/A'}
                                                    </div>
                                                </div>
                                                {rec.description && (
                                                    <p className="text-xs line-clamp-3">{rec.description}</p>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-8">
                                        <Wrench className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                        <h3 className="text-lg font-semibold mb-2">No maintenance records</h3>
                                        <p className="text-muted-foreground mb-4">Maintenance records will appear here when they are created.</p>
                                        <Button variant="outline">
                                            <Wrench className="mr-2 h-4 w-4" />
                                            Schedule Maintenance
                                        </Button>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="performance" className="space-y-6 h-full overflow-y-auto">
                        <div className="flex flex-col lg:flex-row gap-6">
                            {/* Metrics Summary */}
                            <div className="flex-1 space-y-6">
                                <Card className="shadow-lg border-0 bg-gradient-to-br from-background to-muted/20">
                                    <CardHeader className="bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20 border-b">
                                        <CardTitle className="flex items-center gap-2 text-xl">
                                            <BarChart3 className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                                            Performance Overview
                                        </CardTitle>
                                        <CardDescription className="text-base">Operational performance and fuel efficiency</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        {performanceSummary ? (
                                            <div className="grid gap-4 md:grid-cols-3">
                                                <div className="p-4 rounded-lg bg-orange-50 dark:bg-orange-900/30 border border-orange-200 dark:border-orange-800">
                                                    <p className="text-xs text-muted-foreground">Records</p>
                                                    <p className="mt-1 text-2xl font-bold">{performanceSummary.total_records}</p>
                                                </div>
                                                <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800">
                                                    <p className="text-xs text-muted-foreground">Distance (KM)</p>
                                                    <p className="mt-1 text-2xl font-bold">{performanceSummary.total_distance_km.toLocaleString()}</p>
                                                </div>
                                                <div className="p-4 rounded-lg bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800">
                                                    <p className="text-xs text-muted-foreground">Fuel (L)</p>
                                                    <p className="mt-1 text-2xl font-bold">{performanceSummary.total_fuel_liters.toLocaleString()}</p>
                                                </div>
                                                <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800">
                                                    <p className="text-xs text-muted-foreground">Fuel Cost</p>
                                                    <p className="mt-1 text-2xl font-bold">{performanceSummary.fuel_cost_birr.toLocaleString()}</p>
                                                </div>
                                                <div className="p-4 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-800">
                                                    <p className="text-xs text-muted-foreground">Avg Dist/Record</p>
                                                    <p className="mt-1 text-2xl font-bold">{performanceSummary.avg_distance_per_record.toLocaleString()}</p>
                                                </div>
                                                <div className="p-4 rounded-lg bg-teal-50 dark:bg-teal-900/30 border border-teal-200 dark:border-teal-800">
                                                    <p className="text-xs text-muted-foreground">KM / Liter</p>
                                                    <p className="mt-1 text-2xl font-bold">{performanceSummary.avg_fuel_efficiency_km_per_liter ?? 'N/A'}</p>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="text-center py-8">
                                                <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                                <h3 className="text-lg font-semibold mb-2">No performance data</h3>
                                                <p className="text-muted-foreground mb-4">Performance metrics will be displayed here when available.</p>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>

                                {/* Recent Performance Records */}
                                <Card className="shadow-lg border-0 bg-gradient-to-br from-background to-muted/20">
                                    <CardHeader className="bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20 border-b">
                                        <CardTitle className="flex items-center gap-2 text-lg">
                                            <Activity className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                                            Recent Performance Records
                                        </CardTitle>
                                        <CardDescription>Latest operational entries</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        {truck.performances && truck.performances.length > 0 ? (
                                            <div className="space-y-3">
                                                {truck.performances.slice(0, 10).map((perf: any) => (
                                                    <div key={perf.id} className="p-4 rounded-lg border border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-950/20 flex flex-col gap-2">
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-sm font-medium">Performance #{perf.id}</span>
                                                            <Badge variant="secondary" className="text-xs">{perf.load_phase || 'N/A'}</Badge>
                                                        </div>
                                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-muted-foreground">
                                                            <div><span className="font-medium">Distance WCargo:</span> {perf.DistanceWCargo ?? '0'}</div>
                                                            <div><span className="font-medium">Distance WOCargo:</span> {perf.DistanceWOCargo ?? '0'}</div>
                                                            <div><span className="font-medium">Fuel (L):</span> {perf.fuelInLitter ?? '0'}</div>
                                                            <div><span className="font-medium">Fuel (Birr):</span> {perf.fuelInBirr ?? '0'}</div>
                                                        </div>
                                                        {perf.comment && <p className="text-xs line-clamp-3">{perf.comment}</p>}
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-center py-8">
                                                <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                                <h3 className="text-lg font-semibold mb-2">No performance records</h3>
                                                <p className="text-muted-foreground mb-4">Records will appear here once they are created.</p>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Sidebar mimic for consistency (optional quick stats) */}
                            <div className="w-full lg:w-80 space-y-4">
                                <Card className="shadow-lg border-0 bg-gradient-to-br from-background to-muted/20">
                                    <CardHeader className="bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20 border-b">
                                        <CardTitle className="flex items-center gap-2 text-lg">
                                            <BarChart3 className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                                            Quick Metrics
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-4 space-y-3 text-sm">
                                        {performanceSummary ? (
                                            <>
                                                <div className="flex items-center justify-between"><span className="text-muted-foreground">Distance (KM)</span><span className="font-semibold">{performanceSummary.total_distance_km.toLocaleString()}</span></div>
                                                <div className="flex items-center justify-between"><span className="text-muted-foreground">Fuel (L)</span><span className="font-semibold">{performanceSummary.total_fuel_liters.toLocaleString()}</span></div>
                                                <div className="flex items-center justify-between"><span className="text-muted-foreground">Fuel Cost</span><span className="font-semibold">{performanceSummary.fuel_cost_birr.toLocaleString()}</span></div>
                                                <div className="flex items-center justify-between"><span className="text-muted-foreground">Avg Dist/Record</span><span className="font-semibold">{performanceSummary.avg_distance_per_record.toLocaleString()}</span></div>
                                                <div className="flex items-center justify-between"><span className="text-muted-foreground">KM / Liter</span><span className="font-semibold">{performanceSummary.avg_fuel_efficiency_km_per_liter ?? 'N/A'}</span></div>
                                            </>
                                        ) : (
                                            <p className="text-muted-foreground">No metrics available.</p>
                                        )}
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="history" className="space-y-6 h-full overflow-y-auto">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <History className="h-5 w-5" />
                                    Activity History
                                </CardTitle>
                                <CardDescription>Complete audit trail of all truck activities</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {activityLogs && activityLogs.length > 0 ? (
                                    <ActivityLogTable logs={activityLogs} />
                                ) : (
                                    <div className="text-center py-8">
                                        <History className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                        <h3 className="text-lg font-semibold mb-2">No activity history</h3>
                                        <p className="text-muted-foreground">
                                            Activity logs will appear here as changes are made
                                        </p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>

            {/* Delete Confirmation Dialog */}
            <DeleteConfirmationDialog
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
                title="Delete Truck"
                description="Are you sure you want to delete this truck? This action cannot be undone and will remove all associated records."
                itemName={truck.plate}
                onConfirm={handleDeleteConfirm}
                isLoading={isDeleting}
            />
        </AppLayout>
    );
}



