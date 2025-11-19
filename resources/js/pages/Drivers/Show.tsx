import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, BarChart3, History, Activity, ShieldCheck, CheckCircle, XCircle, Calendar, User, ArrowLeft, Edit, Trash2, Hash, FileText, Settings, Truck } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { Head, Link, router } from '@inertiajs/react';
import { type BreadcrumbItem } from '@/types';
import { DeleteConfirmationDialog } from '@/components/delete-confirmation-dialog';
import { ActivityLogTable } from '@/components/activity-log-table';
import { useState } from 'react';

interface ActivityLog {
    id: number;
    description: string;
    causer?: { name?: string };
    created_at: string;
    properties?: Record<string, any>;
}

interface DriverTruck {
    id: number;
    truck_id: number;
    plate?: string;
    date_recived: string;
    date_detach?: string;
    is_attached: boolean | number;
    status: string | number;
    truck?: { id: number; plate: string };
}

interface Driver {
    id: number;
    driverid: string;
    name: string;
    sex: string;
    birthdate?: string;
    zone?: string;
    woreda?: string;
    kebele?: string;
    housenumber?: string;
    mobile?: string;
    hireddate?: string;
    status: string;
    created_at?: string;
    updated_at?: string;
    performances?: any[];
    driverTrucks?: DriverTruck[];
    safetyRecords?: any[];
}

interface DriversShowProps {
    driver: Driver;
    activityLogs?: ActivityLog[];
    performanceSummary?: {
        total_records: number;
        total_distance_km: number;
        total_trips: number;
        total_cargo_tonnage: number;
        avg_fuel_efficiency: number | null;
        avg_customer_rating: number | null;
        safety_incidents: number;
    };
    safetySummary?: {
        total_records: number;
        accidents: number;
        violations: number;
        warnings: number;
        critical: number;
        major: number;
        minor: number;
        total_damage_cost: number;
    };
    counts?: {
        trucks: number;
        assignments: number;
        performances: number;
        performance_records: number;
        safety_records: number;
        fuel_records: number;
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Drivers', href: '/drivers' },
];

export default function DriversShow({ driver, activityLogs = [], performanceSummary, safetySummary, counts }: DriversShowProps) {
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDeleteConfirm = () => {
        setIsDeleting(true);
        router.delete(`/drivers/${driver.id}`, {
            onSuccess: () => {
                setDeleteDialogOpen(false);
                setIsDeleting(false);
            },
            onError: () => setIsDeleting(false),
        });
    };

    const formatDate = (date?: string) => {
        if (!date) return 'N/A';
        return new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    };

    const getStatusBadgeColor = (status: string) => {
        switch (status) {
            case 'active':
                return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
            case 'inactive':
                return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
            default:
                return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
        }
    };

    const getSexBadgeColor = (sex: string) => {
        const value = sex.toLowerCase();
        switch (value) {
            case 'male':
                return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
            case 'female':
                return 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200';
            default:
                return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`View Driver - ${driver.name}`} />
            <div className="flex flex-1 min-h-0 flex-col gap-6 rounded-xl p-4">
                {/* Header */}
                <div className="bg-gradient-to-r from-slate-50 to-indigo-50 dark:from-slate-900 dark:to-indigo-950/30 rounded-lg p-6 border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => router.get('/drivers')}
                                className="flex items-center gap-2 hover:bg-slate-100 dark:hover:bg-slate-800 border-slate-300 dark:border-slate-600"
                            >
                                <ArrowLeft className="h-4 w-4" /> Back to Drivers
                            </Button>
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl">
                                    <User className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{driver.name}</h1>
                                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Comprehensive driver profile and performance</p>
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" asChild className="hover:bg-indigo-50 hover:border-indigo-300 border-slate-300 dark:border-slate-600">
                                <Link href={`/drivers/${driver.id}/edit`}><Edit className="mr-2 h-4 w-4" /> Edit Driver</Link>
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => setDeleteDialogOpen(true)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 hover:border-red-300"
                            >
                                <Trash2 className="mr-2 h-4 w-4" /> Delete Driver
                            </Button>
                        </div>
                    </div>
                </div>

                <Tabs defaultValue="overview" className="flex-1 overflow-hidden flex flex-col">
                    <TabsList className="grid w-full grid-cols-4 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
                        <TabsTrigger value="overview" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:border data-[state=active]:border-slate-200 dark:data-[state=active]:bg-slate-700 dark:data-[state=active]:border-slate-600 rounded-lg transition-all duration-200 font-medium">
                            <CheckCircle className="h-4 w-4" /> Overview
                        </TabsTrigger>
                        <TabsTrigger value="performance" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:border data-[state=active]:border-slate-200 dark:data-[state=active]:bg-slate-700 dark:data-[state=active]:border-slate-600 rounded-lg transition-all duration-200 font-medium">
                            <BarChart3 className="h-4 w-4" /> Performance
                        </TabsTrigger>
                        <TabsTrigger value="safety" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:border data-[state=active]:border-slate-200 dark:data-[state=active]:bg-slate-700 dark:data-[state=active]:border-slate-600 rounded-lg transition-all duration-200 font-medium">
                            <ShieldCheck className="h-4 w-4" /> Safety
                        </TabsTrigger>
                        <TabsTrigger value="history" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:border data-[state=active]:border-slate-200 dark:data-[state=active]:bg-slate-700 dark:data-[state=active]:border-slate-600 rounded-lg transition-all duration-200 font-medium">
                            <History className="h-4 w-4" /> History
                        </TabsTrigger>
                    </TabsList>

                    {/* Overview */}
                    <TabsContent value="overview" className="space-y-6 h-full overflow-y-auto">
                        <div className="flex flex-col lg:flex-row gap-6">
                            <div className="flex-1 space-y-6">
                                <Card className="shadow-lg border-0 bg-gradient-to-br from-background to-muted/20">
                                    <CardHeader className="bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-950/20 dark:to-blue-950/20 border-b">
                                        <CardTitle className="flex items-center gap-2 text-xl"><User className="h-5 w-5 text-indigo-600" /> Basic Information</CardTitle>
                                        <CardDescription className="text-base">Personal and professional details</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="grid gap-4">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <p className="text-sm font-medium text-muted-foreground">Status</p>
                                                    <Badge className={`mt-1 flex items-center gap-1 w-fit ${getStatusBadgeColor(driver.status)}`}>{driver.status}</Badge>
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-muted-foreground">Gender</p>
                                                    <Badge className={`mt-1 flex items-center gap-1 w-fit ${getSexBadgeColor(driver.sex)}`}>{driver.sex}</Badge>
                                                </div>
                                            </div>
                                            <div className="border-t pt-4">
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <p className="text-sm font-medium text-muted-foreground">Driver ID</p>
                                                        <p className="mt-1 text-sm font-mono">{driver.driverid}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium text-muted-foreground">Mobile</p>
                                                        <p className="mt-1 text-sm">{driver.mobile || 'N/A'}</p>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="border-t pt-4">
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <p className="text-sm font-medium text-muted-foreground">Zone</p>
                                                        <p className="mt-1 text-sm">{driver.zone || 'N/A'}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium text-muted-foreground">Woreda</p>
                                                        <p className="mt-1 text-sm">{driver.woreda || 'N/A'}</p>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="border-t pt-4">
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <p className="text-sm font-medium text-muted-foreground">Kebele</p>
                                                        <p className="mt-1 text-sm">{driver.kebele || 'N/A'}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium text-muted-foreground">House Number</p>
                                                        <p className="mt-1 text-sm">{driver.housenumber || 'N/A'}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                                <Card className="shadow-lg border-0 bg-gradient-to-br from-background to-muted/20">
                                    <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-b">
                                        <CardTitle className="flex items-center gap-2 text-xl"><Calendar className="h-5 w-5 text-green-600" /> Employment Information</CardTitle>
                                        <CardDescription className="text-base">Hiring and employment details</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="grid gap-4">
                                            <div>
                                                <p className="text-sm font-medium text-muted-foreground">Birthdate</p>
                                                <p className="mt-1 text-sm">{formatDate(driver.birthdate)}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-muted-foreground">Hired Date</p>
                                                <p className="mt-1 text-sm">{formatDate(driver.hireddate)}</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Record Information</CardTitle>
                                        <CardDescription>System-generated metadata</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="grid gap-4 text-sm">
                                            <div>
                                                <p className="font-medium text-muted-foreground">Created</p>
                                                <p className="mt-1">{formatDate(driver.created_at)}</p>
                                            </div>
                                            <div>
                                                <p className="font-medium text-muted-foreground">Last Updated</p>
                                                <p className="mt-1">{formatDate(driver.updated_at)}</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                            <div className="w-full lg:w-80 space-y-4">
                                <Card className="shadow-lg border-0 bg-gradient-to-br from-background to-muted/20">
                                    <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 border-b">
                                        <CardTitle className="flex items-center gap-2 text-lg">
                                            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                                                <Activity className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                                            </div>
                                            Quick Actions
                                        </CardTitle>
                                        <CardDescription className="text-base">Common driver operations</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="grid grid-cols-2 gap-3">
                                            <Button
                                                variant="outline"
                                                asChild
                                                className="h-auto p-3 flex flex-col items-center gap-2 hover:bg-blue-50 hover:border-blue-300 border-slate-300 dark:border-slate-600 dark:hover:bg-blue-950/20"
                                            >
                                                <Link href={`/driver-trucks/create?driver_id=${driver.id}`}>
                                                    <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                                                        <Truck className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                                    </div>
                                                    <div className="text-center">
                                                        <p className="text-xs font-medium">Assign To Truck</p>
                                                        <p className="text-xs text-muted-foreground">Manage deployments</p>
                                                    </div>
                                                </Link>
                                            </Button>
                                            <Button
                                                variant="outline"
                                                asChild
                                                className="h-auto p-3 flex flex-col items-center gap-2 hover:bg-green-50 hover:border-green-300 border-slate-300 dark:border-slate-600 dark:hover:bg-green-950/20"
                                            >
                                                <Link href={`/driver-performance/create?driver_id=${driver.id}`}>
                                                    <div className="p-1.5 bg-green-100 dark:bg-green-900/30 rounded-lg">
                                                        <BarChart3 className="h-4 w-4 text-green-600 dark:text-green-400" />
                                                    </div>
                                                    <div className="text-center">
                                                        <p className="text-xs font-medium">Log Performance</p>
                                                        <p className="text-xs text-muted-foreground">Record metrics</p>
                                                    </div>
                                                </Link>
                                            </Button>
                                            <Button
                                                variant="outline"
                                                asChild
                                                className="h-auto p-3 flex flex-col items-center gap-2 hover:bg-orange-50 hover:border-orange-300 border-slate-300 dark:border-slate-600 dark:hover:bg-orange-950/20"
                                            >
                                                <Link href={`/reports/drivers?driver_id=${driver.id}`}>
                                                    <div className="p-1.5 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                                                        <FileText className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                                                    </div>
                                                    <div className="text-center">
                                                        <p className="text-xs font-medium">Driver Reports</p>
                                                        <p className="text-xs text-muted-foreground">Open analytics</p>
                                                    </div>
                                                </Link>
                                            </Button>
                                            <Button
                                                variant="outline"
                                                asChild
                                                className="h-auto p-3 flex flex-col items-center gap-2 hover:bg-purple-50 hover:border-purple-300 border-slate-300 dark:border-slate-600 dark:hover:bg-purple-950/20"
                                            >
                                                <Link href={`/drivers/${driver.id}/edit`}>
                                                    <div className="p-1.5 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                                                        <Settings className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                                                    </div>
                                                    <div className="text-center">
                                                        <p className="text-xs font-medium">Driver Settings</p>
                                                        <p className="text-xs text-muted-foreground">Adjust profile</p>
                                                    </div>
                                                </Link>
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                                <Card className="shadow-lg border-0 bg-gradient-to-br from-background to-muted/20">
                                    <CardHeader className="bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-950/20 dark:to-blue-950/20 border-b">
                                        <CardTitle className="flex items-center gap-2 text-lg"><CheckCircle className="h-4 w-4 text-indigo-600" /> Quick Status</CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-4 space-y-4">
                                        <div className="rounded-lg bg-indigo-50 dark:bg-indigo-950/20 p-4 border border-indigo-200 dark:border-indigo-800">
                                            <p className="text-sm font-medium text-indigo-700 dark:text-indigo-300">Current Status</p>
                                            <Badge className={`mt-2 flex items-center gap-1 w-fit ${getStatusBadgeColor(driver.status)}`}>{driver.status}</Badge>
                                        </div>
                                        <div className="rounded-lg bg-slate-50 dark:bg-slate-800/50 p-4 border border-slate-200 dark:border-slate-700">
                                            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Driver Name</p>
                                            <p className="mt-2 text-lg font-mono font-bold text-slate-900 dark:text-slate-100">{driver.name}</p>
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
                                            <CardDescription>Summary of linked records</CardDescription>
                                        </CardHeader>
                                        <CardContent className="p-4 space-y-3 text-sm">
                                            <div className="flex items-center justify-between">
                                                <span className="text-muted-foreground">Trucks</span>
                                                <span className="font-semibold">{counts.trucks}</span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-muted-foreground">Assignments</span>
                                                <span className="font-semibold">{counts.assignments}</span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-muted-foreground">Performances</span>
                                                <span className="font-semibold">{counts.performances}</span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-muted-foreground">Performance Records</span>
                                                <span className="font-semibold">{counts.performance_records}</span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-muted-foreground">Safety Records</span>
                                                <span className="font-semibold">{counts.safety_records}</span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-muted-foreground">Fuel Records</span>
                                                <span className="font-semibold">{counts.fuel_records}</span>
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}
                                {driver.driverTrucks && driver.driverTrucks.length > 0 && (
                                    <Card className="shadow-lg border-0 bg-gradient-to-br from-background to-muted/20">
                                        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-b">
                                            <CardTitle className="flex items-center gap-2 text-lg"><Hash className="h-4 w-4 text-blue-600" /> Truck Assignments</CardTitle>
                                            <CardDescription>Recent assignments</CardDescription>
                                        </CardHeader>
                                        <CardContent className="p-4 space-y-3 max-h-[360px] overflow-y-auto pr-2">
                                            {driver.driverTrucks.slice(0, 10).map((assignment: any) => (
                                                <div key={assignment.id} className="rounded-lg border border-blue-200 dark:border-blue-800 p-3 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-colors">
                                                    <div className="flex items-center justify-between">
                                                        <div>
                                                            <p className="font-medium text-sm text-blue-800 dark:text-blue-200">{assignment.truck?.plate || assignment.plate || 'N/A'}</p>
                                                            <p className="text-xs text-muted-foreground">Status: {assignment.status}</p>
                                                        </div>
                                                        <Badge variant={assignment.is_attached ? 'default' : 'secondary'}>{assignment.is_attached ? 'Active' : 'Detached'}</Badge>
                                                    </div>
                                                </div>
                                            ))}
                                        </CardContent>
                                    </Card>
                                )}
                            </div>
                        </div>
                    </TabsContent>

                    {/* Performance */}
                    <TabsContent value="performance" className="space-y-6 h-full overflow-y-auto">
                        <div className="flex flex-col lg:flex-row gap-6">
                            <div className="flex-1 space-y-6">
                                <Card className="shadow-lg border-0 bg-gradient-to-br from-background to-muted/20">
                                    <CardHeader className="bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20 border-b">
                                        <CardTitle className="flex items-center gap-2 text-xl"><BarChart3 className="h-5 w-5 text-orange-600" /> Performance Overview</CardTitle>
                                        <CardDescription className="text-base">Aggregated operational metrics</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        {performanceSummary ? (
                                            <div className="grid gap-4 md:grid-cols-3">
                                                <div className="p-4 rounded-lg bg-orange-50 dark:bg-orange-900/30 border border-orange-200 dark:border-orange-800"><p className="text-xs text-muted-foreground">Records</p><p className="mt-1 text-2xl font-bold">{performanceSummary.total_records}</p></div>
                                                <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800"><p className="text-xs text-muted-foreground">Distance (KM)</p><p className="mt-1 text-2xl font-bold">{performanceSummary.total_distance_km.toLocaleString()}</p></div>
                                                <div className="p-4 rounded-lg bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800"><p className="text-xs text-muted-foreground">Trips</p><p className="mt-1 text-2xl font-bold">{performanceSummary.total_trips}</p></div>
                                                <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800"><p className="text-xs text-muted-foreground">Cargo (T)</p><p className="mt-1 text-2xl font-bold">{performanceSummary.total_cargo_tonnage.toLocaleString()}</p></div>
                                                <div className="p-4 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-800"><p className="text-xs text-muted-foreground">Fuel Eff (KM/L)</p><p className="mt-1 text-2xl font-bold">{performanceSummary.avg_fuel_efficiency ?? 'N/A'}</p></div>
                                                <div className="p-4 rounded-lg bg-teal-50 dark:bg-teal-900/30 border border-teal-200 dark:border-teal-800"><p className="text-xs text-muted-foreground">Avg Rating</p><p className="mt-1 text-2xl font-bold">{performanceSummary.avg_customer_rating ?? 'N/A'}</p></div>
                                            </div>
                                        ) : (
                                            <div className="text-center py-8"><BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" /><h3 className="text-lg font-semibold mb-2">No performance data</h3><p className="text-muted-foreground mb-4">Performance metrics will be displayed here when available.</p></div>
                                        )}
                                    </CardContent>
                                </Card>
                                <Card className="shadow-lg border-0 bg-gradient-to-br from-background to-muted/20">
                                    <CardHeader className="bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20 border-b">
                                        <CardTitle className="flex items-center gap-2 text-lg"><Activity className="h-4 w-4 text-orange-600" /> Recent Performance Records</CardTitle>
                                        <CardDescription>Latest operational entries (via assignments)</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        {driver.performances && driver.performances.length > 0 ? (
                                            <div className="space-y-3">
                                                {driver.performances.slice(0, 10).map((perf: any) => (
                                                    <div key={perf.id} className="p-4 rounded-lg border border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-950/20 flex flex-col gap-2">
                                                        <div className="flex items-center justify-between"><span className="text-sm font-medium">Performance #{perf.id}</span><Badge variant="secondary" className="text-xs">{perf.load_phase || 'N/A'}</Badge></div>
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
                                            <div className="text-center py-8"><BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" /><h3 className="text-lg font-semibold mb-2">No performance records</h3><p className="text-muted-foreground mb-4">Records will appear here once they are created.</p></div>
                                        )}
                                    </CardContent>
                                </Card>
                            </div>
                            <div className="w-full lg:w-80 space-y-4">
                                <Card className="shadow-lg border-0 bg-gradient-to-br from-background to-muted/20">
                                    <CardHeader className="bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20 border-b">
                                        <CardTitle className="flex items-center gap-2 text-lg"><BarChart3 className="h-4 w-4 text-orange-600" /> Quick Metrics</CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-4 space-y-3 text-sm">
                                        {performanceSummary ? (
                                            <>
                                                <div className="flex items-center justify-between"><span className="text-muted-foreground">Distance (KM)</span><span className="font-semibold">{performanceSummary.total_distance_km.toLocaleString()}</span></div>
                                                <div className="flex items-center justify-between"><span className="text-muted-foreground">Trips</span><span className="font-semibold">{performanceSummary.total_trips}</span></div>
                                                <div className="flex items-center justify-between"><span className="text-muted-foreground">Cargo (T)</span><span className="font-semibold">{performanceSummary.total_cargo_tonnage.toLocaleString()}</span></div>
                                                <div className="flex items-center justify-between"><span className="text-muted-foreground">Fuel Eff</span><span className="font-semibold">{performanceSummary.avg_fuel_efficiency ?? 'N/A'}</span></div>
                                                <div className="flex items-center justify-between"><span className="text-muted-foreground">Avg Rating</span><span className="font-semibold">{performanceSummary.avg_customer_rating ?? 'N/A'}</span></div>
                                                <div className="flex items-center justify-between"><span className="text-muted-foreground">Safety Incidents</span><span className="font-semibold">{performanceSummary.safety_incidents}</span></div>
                                            </>
                                        ) : <p className="text-muted-foreground">No metrics available.</p>}
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    </TabsContent>

                    {/* Safety */}
                    <TabsContent value="safety" className="space-y-6 h-full overflow-y-auto">
                        <Card className="shadow-lg border-0 bg-gradient-to-br from-background to-muted/10">
                            <CardHeader className="bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-950/20 dark:to-rose-950/20 border-b">
                                <CardTitle className="flex items-center gap-2 text-lg"><ShieldCheck className="h-5 w-5 text-red-600 dark:text-red-400" /> Safety Overview</CardTitle>
                                <CardDescription>Incidents and safety performance</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {safetySummary ? (
                                    <div className="grid grid-cols-2 md:grid-cols-7 gap-4">
                                        <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-center"><p className="text-xs text-muted-foreground">Total</p><p className="text-lg font-semibold">{safetySummary.total_records}</p></div>
                                        <div className="p-3 rounded-lg bg-orange-50 dark:bg-orange-900/30 border border-orange-200 dark:border-orange-800 text-center"><p className="text-xs text-muted-foreground">Accidents</p><p className="text-lg font-semibold">{safetySummary.accidents}</p></div>
                                        <div className="p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 text-center"><p className="text-xs text-muted-foreground">Violations</p><p className="text-lg font-semibold">{safetySummary.violations}</p></div>
                                        <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 text-center"><p className="text-xs text-muted-foreground">Warnings</p><p className="text-lg font-semibold">{safetySummary.warnings}</p></div>
                                        <div className="p-3 rounded-lg bg-purple-50 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-800 text-center"><p className="text-xs text-muted-foreground">Critical</p><p className="text-lg font-semibold">{safetySummary.critical}</p></div>
                                        <div className="p-3 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-800 text-center"><p className="text-xs text-muted-foreground">Major</p><p className="text-lg font-semibold">{safetySummary.major}</p></div>
                                        <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 text-center"><p className="text-xs text-muted-foreground">Minor</p><p className="text-lg font-semibold">{safetySummary.minor}</p></div>
                                    </div>
                                ) : (
                                    <div className="text-center py-8"><ShieldCheck className="h-12 w-12 text-muted-foreground mx-auto mb-4" /><h3 className="text-lg font-semibold mb-2">No safety data</h3><p className="text-muted-foreground mb-4">Safety metrics will appear when records exist.</p></div>
                                )}
                                {driver.safetyRecords && driver.safetyRecords.length > 0 ? (
                                    <div className="space-y-3 max-h-[480px] overflow-y-auto pr-2 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-600">
                                        {driver.safetyRecords.slice(0, 15).map((rec: any) => (
                                            <div key={rec.id} className="p-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 flex flex-col gap-2">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <Badge className="text-xs" variant="secondary">{rec.incident_type}</Badge>
                                                        <span className="text-sm font-medium capitalize">{rec.severity} severity</span>
                                                    </div>
                                                    <span className="text-xs text-muted-foreground">Date: {rec.incident_date || 'N/A'}</span>
                                                </div>
                                                {rec.description && <p className="text-xs line-clamp-3">{rec.description}</p>}
                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-muted-foreground">
                                                    <div><span className="font-medium">Location:</span> {rec.location || 'N/A'}</div>
                                                    <div><span className="font-medium">Damage:</span> {rec.damage_cost ? rec.damage_cost.toLocaleString() : '0'}</div>
                                                    <div><span className="font-medium">Reported By:</span> {rec.reported_by || 'N/A'}</div>
                                                    <div><span className="font-medium">Resolution:</span> {rec.resolution || '—'}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-8"><AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" /><h3 className="text-lg font-semibold mb-2">No safety records</h3><p className="text-muted-foreground mb-4">Safety incidents will appear here when logged.</p></div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* History */}
                    <TabsContent value="history" className="space-y-6 h-full overflow-y-auto">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2"><History className="h-5 w-5" /> Activity History</CardTitle>
                                <CardDescription>Audit trail of driver changes</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {activityLogs && activityLogs.length > 0 ? (
                                    <ActivityLogTable logs={activityLogs} />
                                ) : (
                                    <div className="text-center py-8"><History className="h-12 w-12 text-muted-foreground mx-auto mb-4" /><h3 className="text-lg font-semibold mb-2">No activity history</h3><p className="text-muted-foreground">Activity logs will appear here as changes are made.</p></div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
            <DeleteConfirmationDialog
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
                title="Delete Driver"
                description="Are you sure you want to delete this driver? This action cannot be undone and will remove all associated records."
                itemName={driver.name}
                onConfirm={handleDeleteConfirm}
                isLoading={isDeleting}
            />
        </AppLayout>
    );
}
