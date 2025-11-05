import React from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, Fuel, Truck, User, MapPin, Calendar, DollarSign, FileText, Edit, Trash2, Hash, Activity, TrendingUp, BarChart3, History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ActivityLogTable } from '@/components/activity-log-table';
import { DeleteConfirmationDialog } from '@/components/delete-confirmation-dialog';
import { toast } from '@/hooks/use-toast';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { usePermissions } from '@/hooks/use-permissions';

interface FuelRecord {
    id: number;
    fuel_date: string;
    fuel_quantity_liters: number;
    fuel_price_per_liter: number;
    total_cost: number;
    fuel_station: string;
    fuel_type: string;
    odometer_reading?: number;
    receipt_number?: string;
    notes?: string;
    driverTruck?: {
        id: number;
        truck?: {
            id: number;
            plate: string;
            model: string;
        };
        driver?: {
            id: number;
            name: string;
            license_number: string;
        };
    };
    user?: {
        id: number;
        name: string;
    };
    created_at: string;
    updated_at: string;
}

interface FuelRecordsShowProps {
    fuelRecord: FuelRecord | null;
    activityLogs?: any[];
}

const breadcrumbs = (fuelRecord: FuelRecord | null): BreadcrumbItem[] => [
    {
        title: 'Fuel Records',
        href: '/fuel-records',
    },
    {
        title: fuelRecord?.fuel_station || 'Fuel Record',
        href: fuelRecord ? `/fuel-records/${fuelRecord.id}` : '/fuel-records',
    },
];

export default function FuelRecordsShow({ fuelRecord, activityLogs = [] }: FuelRecordsShowProps) {
    const { hasPermission } = usePermissions();

    // Debug logging
    console.log('FuelRecordsShow rendered with:', { fuelRecord, activityLogs });

    // Early return if fuelRecord is not available
    if (!fuelRecord) {
        return (
            <AppLayout breadcrumbs={breadcrumbs(fuelRecord)}>
                <Head title="Fuel Record" />
                <div className="flex h-full flex-1 flex-col gap-6 overflow-hidden rounded-xl p-4">
                    <div className="bg-gradient-to-r from-slate-50 to-blue-50 dark:from-slate-900 dark:to-blue-950/20 rounded-lg p-6 border border-slate-200 dark:border-slate-700">
                        <div className="text-center">
                            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Loading...</h1>
                            <p className="text-slate-600 dark:text-slate-400 mt-2">Please wait while we load the fuel record details.</p>
                        </div>
                    </div>
                </div>
            </AppLayout>
        );
    }

    const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
    const [isDeleting, setIsDeleting] = React.useState(false);

    const handleDeleteClick = () => {
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = () => {
        setIsDeleting(true);
        router.delete(`/fuel-records/${fuelRecord.id}`, {
            onSuccess: () => {
                setDeleteDialogOpen(false);
                setIsDeleting(false);
            },
            onError: (errors) => {
                setIsDeleting(false);
                if (errors && typeof errors === 'object') {
                    const errorMessages = Object.values(errors).flat().join('\n');
                    if (errorMessages) {
                        toast({
                            title: '❌ Delete Failed',
                            description: errorMessages,
                            variant: 'destructive',
                        });
                    }
                }
            },
        });
    };

    const getFuelTypeBadgeVariant = (fuelType: string) => {
        switch (fuelType.toLowerCase()) {
            case 'diesel': return 'default';
            case 'petrol': return 'secondary';
            default: return 'outline';
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs(fuelRecord)}>
            <Head title={`Fuel Record - ${fuelRecord.fuel_station}`} />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-hidden rounded-xl p-4">
                {/* Header Section */}
                <div className="bg-gradient-to-r from-slate-50 to-blue-50 dark:from-slate-900 dark:to-blue-950/20 rounded-lg p-6 border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => window.history.back()}
                                className="flex items-center gap-2 hover:bg-slate-100 dark:hover:bg-slate-800 border-slate-300 dark:border-slate-600"
                            >
                                <ArrowLeft className="h-4 w-4" />
                                Back to Fuel Records
                            </Button>
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                                    <Fuel className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{fuelRecord.fuel_station}</h1>
                                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                                        Fuel record on {new Date(fuelRecord.fuel_date).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <Badge variant={getFuelTypeBadgeVariant(fuelRecord.fuel_type)} className="text-sm">
                                {fuelRecord.fuel_type}
                            </Badge>
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-sm font-medium">
                                <DollarSign className="h-4 w-4" />
                                {fuelRecord.total_cost.toLocaleString()} ETB
                            </div>
                        </div>
                    </div>
                </div>

                <Tabs defaultValue="overview" className="flex-1 overflow-hidden flex flex-col">
                    <TabsList className="grid w-full grid-cols-3 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
                        <TabsTrigger value="overview" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:border data-[state=active]:border-slate-200 dark:data-[state=active]:bg-slate-700 dark:data-[state=active]:border-slate-600 rounded-lg transition-all duration-200 font-medium">
                            <Activity className="h-4 w-4" />
                            Overview
                        </TabsTrigger>
                        <TabsTrigger value="analytics" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:border data-[state=active]:border-slate-200 dark:data-[state=active]:bg-slate-700 dark:data-[state=active]:border-slate-600 rounded-lg transition-all duration-200 font-medium">
                            <BarChart3 className="h-4 w-4" />
                            Analytics
                        </TabsTrigger>
                        <TabsTrigger value="history" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:border data-[state=active]:border-slate-200 dark:data-[state=active]:bg-slate-700 dark:data-[state=active]:border-slate-600 rounded-lg transition-all duration-200 font-medium">
                            <History className="h-4 w-4" />
                            History
                        </TabsTrigger>
                    </TabsList>

                    <div className="flex-1 overflow-hidden flex flex-col lg:flex-row gap-6 mt-6">
                        {/* Main Content */}
                        <div className="flex-1 overflow-hidden flex flex-col">
                            <TabsContent value="overview" className="flex-1 overflow-hidden flex flex-col mt-0">
                                {/* Fuel Record Information */}
                                <Card className="shadow-lg border-0 bg-gradient-to-br from-background to-muted/20 mb-6">
                                    <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-b">
                                        <CardTitle className="flex items-center gap-2 text-xl">
                                            <Fuel className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                            Fuel Record Details
                                        </CardTitle>
                                        <CardDescription className="text-base">
                                            Complete information about this fuel consumption record
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="p-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                            {/* Fuel Date */}
                                            <div className="rounded-lg bg-slate-50 dark:bg-slate-800/50 p-4 border border-slate-200 dark:border-slate-700">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <div className="p-1.5 bg-slate-100 dark:bg-slate-900/30 rounded-lg">
                                                        <Calendar className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                                                    </div>
                                                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Fuel Date</span>
                                                </div>
                                                <p className="text-lg font-mono font-bold text-slate-900 dark:text-slate-100">
                                                    {new Date(fuelRecord.fuel_date).toLocaleDateString()}
                                                </p>
                                            </div>

                                            {/* Fuel Station */}
                                            <div className="rounded-lg bg-slate-50 dark:bg-slate-800/50 p-4 border border-slate-200 dark:border-slate-700">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <div className="p-1.5 bg-slate-100 dark:bg-slate-900/30 rounded-lg">
                                                        <MapPin className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                                                    </div>
                                                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Fuel Station</span>
                                                </div>
                                                <p className="text-lg font-mono font-bold text-slate-900 dark:text-slate-100">
                                                    {fuelRecord.fuel_station}
                                                </p>
                                            </div>

                                            {/* Fuel Type */}
                                            <div className="rounded-lg bg-slate-50 dark:bg-slate-800/50 p-4 border border-slate-200 dark:border-slate-700">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <div className="p-1.5 bg-slate-100 dark:bg-slate-900/30 rounded-lg">
                                                        <Fuel className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                                                    </div>
                                                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Fuel Type</span>
                                                </div>
                                                <Badge variant={getFuelTypeBadgeVariant(fuelRecord.fuel_type)} className="text-base px-3 py-1">
                                                    {fuelRecord.fuel_type}
                                                </Badge>
                                            </div>

                                            {/* Quantity */}
                                            <div className="rounded-lg bg-slate-50 dark:bg-slate-800/50 p-4 border border-slate-200 dark:border-slate-700">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <div className="p-1.5 bg-slate-100 dark:bg-slate-900/30 rounded-lg">
                                                        <Fuel className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                                                    </div>
                                                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Quantity</span>
                                                </div>
                                                <p className="text-lg font-mono font-bold text-slate-900 dark:text-slate-100">
                                                    {fuelRecord.fuel_quantity_liters} L
                                                </p>
                                            </div>

                                            {/* Price per Liter */}
                                            <div className="rounded-lg bg-slate-50 dark:bg-slate-800/50 p-4 border border-slate-200 dark:border-slate-700">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <div className="p-1.5 bg-slate-100 dark:bg-slate-900/30 rounded-lg">
                                                        <DollarSign className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                                                    </div>
                                                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Price/Liter</span>
                                                </div>
                                                <p className="text-lg font-mono font-bold text-slate-900 dark:text-slate-100">
                                                    {fuelRecord.fuel_price_per_liter.toFixed(2)} ETB
                                                </p>
                                            </div>

                                            {/* Total Cost */}
                                            <div className="rounded-lg bg-green-50 dark:bg-green-950/20 p-4 border border-green-200 dark:border-green-800">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <div className="p-1.5 bg-green-100 dark:bg-green-900/30 rounded-lg">
                                                        <DollarSign className="h-4 w-4 text-green-600 dark:text-green-400" />
                                                    </div>
                                                    <span className="text-sm font-medium text-green-700 dark:text-green-300">Total Cost</span>
                                                </div>
                                                <p className="text-lg font-mono font-bold text-green-900 dark:text-green-100">
                                                    {fuelRecord.total_cost.toLocaleString()} ETB
                                                </p>
                                            </div>
                                        </div>

                                        {/* Additional Information */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                                            {fuelRecord.odometer_reading && (
                                                <div className="rounded-lg bg-slate-50 dark:bg-slate-800/50 p-4 border border-slate-200 dark:border-slate-700">
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <div className="p-1.5 bg-slate-100 dark:bg-slate-900/30 rounded-lg">
                                                            <TrendingUp className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                                                        </div>
                                                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Odometer Reading</span>
                                                    </div>
                                                    <p className="text-lg font-mono font-bold text-slate-900 dark:text-slate-100">
                                                        {fuelRecord.odometer_reading.toLocaleString()} km
                                                    </p>
                                                </div>
                                            )}

                                            {fuelRecord.receipt_number && (
                                                <div className="rounded-lg bg-slate-50 dark:bg-slate-800/50 p-4 border border-slate-200 dark:border-slate-700">
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <div className="p-1.5 bg-slate-100 dark:bg-slate-900/30 rounded-lg">
                                                            <FileText className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                                                        </div>
                                                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Receipt Number</span>
                                                    </div>
                                                    <p className="text-lg font-mono font-bold text-slate-900 dark:text-slate-100">
                                                        {fuelRecord.receipt_number}
                                                    </p>
                                                </div>
                                            )}
                                        </div>

                                        {/* Notes */}
                                        {fuelRecord.notes && (
                                            <div className="rounded-lg bg-slate-50 dark:bg-slate-800/50 p-4 border border-slate-200 dark:border-slate-700 mt-6">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <div className="p-1.5 bg-slate-100 dark:bg-slate-900/30 rounded-lg">
                                                        <FileText className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                                                    </div>
                                                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Notes</span>
                                                </div>
                                                <p className="text-base text-slate-900 dark:text-slate-100 whitespace-pre-wrap">
                                                    {fuelRecord.notes}
                                                </p>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>

                                {/* Record Information */}
                                <Card className="shadow-lg border-0 bg-gradient-to-br from-background to-muted/20">
                                    <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 border-b">
                                        <CardTitle className="flex items-center gap-2 text-xl">
                                            <Hash className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                                            Record Information
                                        </CardTitle>
                                        <CardDescription className="text-base">
                                            System information and metadata for this fuel record
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="p-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="rounded-lg bg-slate-50 dark:bg-slate-800/50 p-4 border border-slate-200 dark:border-slate-700">
                                                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Created</p>
                                                <p className="mt-2 text-lg font-mono font-bold text-slate-900 dark:text-slate-100">
                                                    {new Date(fuelRecord.created_at).toLocaleString()}
                                                </p>
                                            </div>
                                            <div className="rounded-lg bg-slate-50 dark:bg-slate-800/50 p-4 border border-slate-200 dark:border-slate-700">
                                                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Last Updated</p>
                                                <p className="mt-2 text-lg font-mono font-bold text-slate-900 dark:text-slate-100">
                                                    {new Date(fuelRecord.updated_at).toLocaleString()}
                                                </p>
                                            </div>
                                            <div className="rounded-lg bg-slate-50 dark:bg-slate-800/50 p-4 border border-slate-200 dark:border-slate-700">
                                                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">System ID</p>
                                                <p className="mt-2 text-sm font-mono text-slate-900 dark:text-slate-100">#{fuelRecord.id}</p>
                                            </div>
                                            <div className="rounded-lg bg-slate-50 dark:bg-slate-800/50 p-4 border border-slate-200 dark:border-slate-700">
                                                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Created By</p>
                                                <p className="mt-2 text-lg font-mono font-bold text-slate-900 dark:text-slate-100">
                                                    {fuelRecord.user?.name || 'Unknown'}
                                                </p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            <TabsContent value="analytics" className="flex-1 overflow-hidden flex flex-col mt-0">
                                <Card className="shadow-lg border-0 bg-gradient-to-br from-background to-muted/20">
                                    <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-b">
                                        <CardTitle className="flex items-center gap-2 text-xl">
                                            <BarChart3 className="h-5 w-5 text-green-600 dark:text-green-400" />
                                            Fuel Analytics
                                        </CardTitle>
                                        <CardDescription className="text-base">
                                            Consumption analysis and insights for this fuel record
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="p-6">
                                        <div className="text-center py-12">
                                            <BarChart3 className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                                            <h3 className="text-lg font-semibold text-muted-foreground mb-2">Analytics Coming Soon</h3>
                                            <p className="text-muted-foreground">
                                                Advanced fuel consumption analytics and efficiency calculations will be available here.
                                            </p>
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            <TabsContent value="history" className="flex-1 overflow-hidden flex flex-col mt-0">
                                <ActivityLogTable activityLogs={activityLogs} />
                            </TabsContent>
                        </div>

                        {/* Sidebar */}
                        <div className="w-full lg:w-80 space-y-4">
                            {/* Vehicle & Driver Info */}
                            <Card className="shadow-lg border-0 bg-gradient-to-br from-background to-muted/20">
                                <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-b">
                                    <CardTitle className="flex items-center gap-2 text-lg">
                                        <Truck className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                        Vehicle & Driver
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-4">
                                    <div className="space-y-4">
                                        <div className="rounded-lg bg-slate-50 dark:bg-slate-800/50 p-4 border border-slate-200 dark:border-slate-700">
                                            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Truck</p>
                                            <p className="mt-2 text-lg font-mono font-bold text-slate-900 dark:text-slate-100">
                                                {fuelRecord.driverTruck?.truck?.plate}
                                            </p>
                                            <p className="text-sm text-slate-600 dark:text-slate-400">
                                                {fuelRecord.driverTruck?.truck?.model}
                                            </p>
                                        </div>
                                        <div className="rounded-lg bg-slate-50 dark:bg-slate-800/50 p-4 border border-slate-200 dark:border-slate-700">
                                            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Driver</p>
                                            <p className="mt-2 text-lg font-mono font-bold text-slate-900 dark:text-slate-100">
                                                {fuelRecord.driverTruck?.driver?.name}
                                            </p>
                                            <p className="text-sm text-slate-600 dark:text-slate-400">
                                                License: {fuelRecord.driverTruck?.driver?.license_number}
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Quick Actions */}
                            <Card className="shadow-lg border-0 bg-gradient-to-br from-background to-muted/20">
                                <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 border-b">
                                    <CardTitle className="flex items-center gap-2 text-lg">
                                        <Edit className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                                        Quick Actions
                                    </CardTitle>
                                    <CardDescription className="text-base">
                                        Common operations and management tasks
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="p-4">
                                    <div className="space-y-3">
                                        {hasPermission('fuel-records.edit') && (
                                            <Button asChild className="w-full justify-start">
                                                <Link href={`/fuel-records/${fuelRecord.id}/edit`}>
                                                    <Edit className="mr-2 h-4 w-4" />
                                                    Edit Record
                                                </Link>
                                            </Button>
                                        )}
                                        {hasPermission('fuel-records.destroy') && (
                                            <Button
                                                variant="destructive"
                                                className="w-full justify-start"
                                                onClick={handleDeleteClick}
                                            >
                                                <Trash2 className="mr-2 h-4 w-4" />
                                                Delete Record
                                            </Button>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </Tabs>

                {/* Delete Confirmation Dialog */}
                <DeleteConfirmationDialog
                    open={deleteDialogOpen}
                    onOpenChange={setDeleteDialogOpen}
                    title="Delete Fuel Record"
                    description={`Are you sure you want to delete the fuel record from ${fuelRecord.fuel_station}? This action cannot be undone.`}
                    itemName={`${fuelRecord.fuel_station} - ${fuelRecord.total_cost.toLocaleString()} ETB`}
                    onConfirm={handleDeleteConfirm}
                    isLoading={isDeleting}
                />
            </div>
        </AppLayout>
    );
}
