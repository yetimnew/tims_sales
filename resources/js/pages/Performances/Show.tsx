import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AppLayout from '@/layouts/app-layout';
import { Head, Link } from '@inertiajs/react';
import { type BreadcrumbItem } from '@/types';
import { Activity, TrendingUp, DollarSign, Zap, Edit2, Trash2, ArrowLeft, CheckCircle, Clock, MapPin } from 'lucide-react';
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
    operation?: any;
    driverTruck?: any;
    origin?: any;
    destination?: any;
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

    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            'active': 'bg-green-100 text-green-800',
            'inactive': 'bg-gray-100 text-gray-800',
            'completed': 'bg-blue-100 text-blue-800',
            'cancelled': 'bg-red-100 text-red-800',
        };
        return colors[status?.toLowerCase()] || 'bg-gray-100 text-gray-800';
    };

    const getLoadTypeColor = (type: string) => {
        const colors: Record<string, string> = {
            'main': 'bg-blue-100 text-blue-800',
            'return': 'bg-amber-100 text-amber-800',
            'empty': 'bg-gray-100 text-gray-800',
        };
        return colors[type?.toLowerCase()] || 'bg-gray-100 text-gray-800';
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Performance ${performance.trip}`} />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-hidden rounded-xl p-4">
                {/* Enhanced Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <Link
                                href="/performances"
                                className="text-muted-foreground hover:text-foreground transition-colors"
                            >
                                <ArrowLeft className="h-5 w-5" />
                            </Link>
                            <h1 className="text-3xl font-bold text-foreground">Performance Details</h1>
                        </div>
                        <p className="text-muted-foreground ml-8">
                            Trip <span className="font-semibold text-blue-600">{performance.trip}</span> - {performance.FOnumber}
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Badge className={`${getStatusColor(performance.satus)} border-0 font-semibold`}>
                            {performance.satus?.charAt(0).toUpperCase() + performance.satus?.slice(1)}
                        </Badge>
                        <Badge className={`${getLoadTypeColor(performance.LoadType)} border-0 font-semibold`}>
                            {performance.LoadType}
                        </Badge>
                    </div>
                </div>

                {/* Key Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {/* Total Distance */}
                    <Card className="border-l-4 border-l-blue-500">
                        <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground font-medium">Total Distance</p>
                                    <p className="text-2xl font-bold text-foreground mt-1">{totalDistance.toFixed(2)} km</p>
                                </div>
                                <TrendingUp className="h-8 w-8 text-blue-500 opacity-20" />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Ton-KM */}
                    <Card className="border-l-4 border-l-cyan-500">
                        <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground font-medium">Efficiency (Ton-KM)</p>
                                    <p className="text-2xl font-bold text-foreground mt-1">{tonKm.toFixed(2)}</p>
                                </div>
                                <Zap className="h-8 w-8 text-cyan-500 opacity-20" />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Total Cost */}
                    <Card className="border-l-4 border-l-green-500">
                        <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground font-medium">Total Cost</p>
                                    <p className="text-2xl font-bold text-foreground mt-1">{totalCost.toFixed(2)} Br</p>
                                </div>
                                <DollarSign className="h-8 w-8 text-green-500 opacity-20" />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Dispatch Date */}
                    <Card className="border-l-4 border-l-purple-500">
                        <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground font-medium">Dispatch Date</p>
                                    <p className="text-2xl font-bold text-foreground mt-1">{new Date(performance.DateDispach).toLocaleDateString()}</p>
                                </div>
                                <Clock className="h-8 w-8 text-purple-500 opacity-20" />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Tabs Section */}
                <Card className="shadow-lg border-0 bg-gradient-to-br from-background to-muted/20 flex-1 flex flex-col overflow-hidden">
                    <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-b">
                        <CardTitle className="flex items-center gap-2">
                            <Activity className="h-5 w-5 text-blue-600" />
                            Trip Details
                        </CardTitle>
                        <CardDescription>Complete performance information and history</CardDescription>
                    </CardHeader>
                    <CardContent className="p-6 flex-1 overflow-auto">
                        <Tabs defaultValue="details" className="w-full space-y-6 h-full flex flex-col">
                            <TabsList className="grid w-full grid-cols-3 bg-muted/50 p-1 rounded-lg">
                                <TabsTrigger value="details" className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                                    <Activity className="h-4 w-4" />
                                    Details
                                </TabsTrigger>
                                <TabsTrigger value="distances" className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                                    <MapPin className="h-4 w-4" />
                                    Distance & Route
                                </TabsTrigger>
                                <TabsTrigger value="activity" className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                                    <CheckCircle className="h-4 w-4" />
                                    Activity Log
                                </TabsTrigger>
                            </TabsList>

                            {/* TAB 1: DETAILS */}
                            <TabsContent value="details" className="space-y-6 flex-1 overflow-auto">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Trip Information */}
                                    <div className="space-y-4">
                                        <h3 className="font-semibold text-foreground flex items-center gap-2">
                                            <Activity className="h-4 w-4 text-blue-600" />
                                            Trip Information
                                        </h3>
                                        <div className="space-y-3 pl-6 border-l-2 border-blue-200">
                                            <div>
                                                <p className="text-sm text-muted-foreground">Trip Name</p>
                                                <p className="font-medium text-foreground">{performance.trip}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-muted-foreground">FO Number</p>
                                                <p className="font-medium text-foreground">{performance.FOnumber}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-muted-foreground">Load Type</p>
                                                <Badge className={`${getLoadTypeColor(performance.LoadType)} border-0 mt-1`}>
                                                    {performance.LoadType}
                                                </Badge>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Cargo Information */}
                                    <div className="space-y-4">
                                        <h3 className="font-semibold text-foreground flex items-center gap-2">
                                            <Zap className="h-4 w-4 text-cyan-600" />
                                            Cargo Information
                                        </h3>
                                        <div className="space-y-3 pl-6 border-l-2 border-cyan-200">
                                            <div>
                                                <p className="text-sm text-muted-foreground">Cargo Volume</p>
                                                <p className="font-medium text-foreground">{cvm.toFixed(2)} MT</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-muted-foreground">Ton-KM Efficiency</p>
                                                <p className="font-medium text-foreground">{tonKm.toFixed(2)} ton-km</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-muted-foreground">Is Returned</p>
                                                <p className="font-medium text-foreground">{performance.is_returned ? '✓ Yes' : '✗ No'}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Financial Information */}
                                    <div className="space-y-4">
                                        <h3 className="font-semibold text-foreground flex items-center gap-2">
                                            <DollarSign className="h-4 w-4 text-green-600" />
                                            Financial Information
                                        </h3>
                                        <div className="space-y-3 pl-6 border-l-2 border-green-200">
                                            <div>
                                                <p className="text-sm text-muted-foreground">Fuel Cost</p>
                                                <p className="font-medium text-foreground">{fib.toFixed(2)} Birr</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-muted-foreground">Per Diem</p>
                                                <p className="font-medium text-foreground">{per.toFixed(2)} Birr</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-muted-foreground">Other Costs</p>
                                                <p className="font-medium text-foreground">{oth.toFixed(2)} Birr</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Status & Comments */}
                                    <div className="space-y-4">
                                        <h3 className="font-semibold text-foreground flex items-center gap-2">
                                            <Clock className="h-4 w-4 text-purple-600" />
                                            Status & Notes
                                        </h3>
                                        <div className="space-y-3 pl-6 border-l-2 border-purple-200">
                                            <div>
                                                <p className="text-sm text-muted-foreground">Status</p>
                                                <Badge className={`${getStatusColor(performance.satus)} border-0 mt-1`}>
                                                    {performance.satus?.charAt(0).toUpperCase() + performance.satus?.slice(1)}
                                                </Badge>
                                            </div>
                                            <div>
                                                <p className="text-sm text-muted-foreground">Comments</p>
                                                <p className="font-medium text-foreground text-sm">{performance.comment || 'No comments'}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </TabsContent>

                            {/* TAB 2: DISTANCE & ROUTE */}
                            <TabsContent value="distances" className="space-y-6 flex-1 overflow-auto">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-4">
                                        <h3 className="font-semibold text-foreground">Distance Information</h3>
                                        <div className="space-y-4 p-4 bg-muted/30 rounded-lg border border-muted">
                                            <div className="flex justify-between items-center">
                                                <span className="text-muted-foreground">With Cargo</span>
                                                <span className="font-semibold text-foreground">{dwc.toFixed(2)} km</span>
                                            </div>
                                            <div className="h-1 bg-muted rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-gradient-to-r from-blue-500 to-blue-600"
                                                    style={{width: `${Math.min(dwc / (totalDistance || 1) * 100, 100)}%`}}
                                                ></div>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-muted-foreground">Without Cargo</span>
                                                <span className="font-semibold text-foreground">{dwo.toFixed(2)} km</span>
                                            </div>
                                            <div className="h-1 bg-muted rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-gradient-to-r from-amber-500 to-amber-600"
                                                    style={{width: `${Math.min(dwo / (totalDistance || 1) * 100, 100)}%`}}
                                                ></div>
                                            </div>
                                            <div className="pt-4 border-t border-muted">
                                                <div className="flex justify-between items-center">
                                                    <span className="font-semibold text-foreground">Total Distance</span>
                                                    <span className="text-lg font-bold text-blue-600">{totalDistance.toFixed(2)} km</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <h3 className="font-semibold text-foreground">Fuel Consumption</h3>
                                        <div className="space-y-4 p-4 bg-muted/30 rounded-lg border border-muted">
                                            <div>
                                                <p className="text-muted-foreground text-sm">Fuel Consumed</p>
                                                <p className="text-2xl font-bold text-green-600">{fil.toFixed(2)} L</p>
                                            </div>
                                            <div className="pt-2 border-t border-muted">
                                                <p className="text-muted-foreground text-sm mb-1">Efficiency</p>
                                                <p className="text-lg font-semibold text-foreground">
                                                    {totalDistance > 0 ? ((totalDistance / fil) * 100).toFixed(2) : 0} km/100L
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </TabsContent>

                            {/* TAB 3: ACTIVITY LOG */}
                            <TabsContent value="activity" className="space-y-4 flex-1 overflow-auto">
                                {activityLogs && activityLogs.length > 0 ? (
                                    <ActivityLogTable logs={activityLogs} />
                                ) : (
                                    <div className="p-8 text-center">
                                        <CheckCircle className="h-12 w-12 text-muted-foreground mx-auto mb-2 opacity-50" />
                                        <p className="text-muted-foreground">No activity logged yet</p>
                                    </div>
                                )}
                            </TabsContent>
                        </Tabs>
                    </CardContent>
                </Card>

                {/* Action Buttons */}
                <div className="flex gap-3 justify-end">
                    <Link href={`/performances/${performance.id}/edit`}>
                        <Button className="gap-2">
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
                        Delete Performance
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

