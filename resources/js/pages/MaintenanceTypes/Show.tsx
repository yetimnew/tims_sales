import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, CheckCircle, XCircle, Settings, Edit, Trash2, History, BarChart3, Wrench, ArrowLeft, DollarSign, Calendar, Activity } from 'lucide-react';
import { DeleteConfirmationDialog } from '@/components/delete-confirmation-dialog';
import { ActivityLogTable } from '@/components/activity-log-table';
import { toast } from '@/hooks/use-toast';
import { BreadcrumbItem } from '@/types';

interface MaintenanceType {
    id: number;
    name: string;
    category: string;
    interval_km: number | null;
    interval_months: number | null;
    estimated_cost: number | null;
    description: string | null;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

interface MaintenanceTypesShowProps {
    maintenanceType: MaintenanceType;
    activityLogs?: any[];
}

export default function MaintenanceTypesShow({ maintenanceType, activityLogs = [] }: MaintenanceTypesShowProps) {
    // Debug logging
    console.log('MaintenanceTypesShow rendered with:', { maintenanceType, activityLogs });

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Maintenance Types',
            href: '/maintenance-types',
        },
        {
            title: maintenanceType?.name || 'Maintenance Type',
            href: `/maintenance-types/${maintenanceType?.id}`,
        },
    ];
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDeleteConfirm = () => {
        setIsDeleting(true);
        router.delete(`/maintenance-types/${maintenanceType.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                setDeleteDialogOpen(false);
                setIsDeleting(false);
                toast({
                    title: '✅ Maintenance Type Deleted',
                    description: `${maintenanceType.name} has been removed successfully.`,
                });
            },
            onError: (errors) => {
                setIsDeleting(false);
                if (errors && typeof errors === 'object') {
                    const errorMessages = Object.values(errors).flat().join('\n');
                    toast({
                        title: '❌ Delete Failed',
                        description: errorMessages || 'Unable to delete this maintenance type. Please try again.',
                        variant: 'destructive',
                    });
                } else {
                    toast({
                        title: '❌ Delete Failed',
                        description: 'An unexpected error occurred while deleting the maintenance type. Please try again.',
                        variant: 'destructive',
                    });
                }
            },
        });
    };

    const getCategoryBadgeVariant = (category: string) => {
        switch (category.toLowerCase()) {
            case 'preventive': return 'default';
            case 'corrective': return 'secondary';
            case 'emergency': return 'destructive';
            default: return 'outline';
        }
    };

    // Early return if maintenanceType is not available
    if (!maintenanceType) {
        return (
            <AppLayout breadcrumbs={breadcrumbs}>
                <Head title="Maintenance Type" />
                <div className="flex h-full flex-1 flex-col gap-6 overflow-hidden rounded-xl p-4">
                    <div className="bg-gradient-to-r from-slate-50 to-blue-50 dark:from-slate-900 dark:to-blue-950/20 rounded-lg p-6 border border-slate-200 dark:border-slate-700">
                        <div className="text-center">
                            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Loading...</h1>
                            <p className="text-slate-600 dark:text-slate-400 mt-2">Please wait while we load the maintenance type details.</p>
                        </div>
                    </div>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={maintenanceType.name} />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-hidden rounded-xl p-4">
                {/* Header */}
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
                                Back to Maintenance Types
                            </Button>
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                                    <Settings className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{maintenanceType.name}</h1>
                                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                                        Maintenance type details and activity history
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <Badge variant={getCategoryBadgeVariant(maintenanceType.category)} className="px-3 py-1">
                                {maintenanceType.category}
                            </Badge>
                            <Badge variant={maintenanceType.is_active ? 'default' : 'secondary'} className="px-3 py-1">
                                {maintenanceType.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex flex-1 gap-6 overflow-hidden">
                    {/* Main Content Area */}
                    <div className="flex-1 overflow-hidden">
                        <Tabs defaultValue="overview" className="flex-1 overflow-hidden flex flex-col">
                            <TabsList className="grid w-full grid-cols-3 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
                                <TabsTrigger value="overview" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:border data-[state=active]:border-slate-200 dark:data-[state=active]:bg-slate-700 dark:data-[state=active]:border-slate-600 rounded-lg transition-all duration-200 font-medium">
                                    <CheckCircle className="h-4 w-4" />
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

                            {/* Overview Tab */}
                            <TabsContent value="overview" className="flex-1 overflow-hidden mt-6">
                                <div className="space-y-6">
                                    {/* Basic Information */}
                                    <Card className="shadow-lg border-0 bg-gradient-to-br from-background to-muted/20">
                                        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-b">
                                            <CardTitle className="flex items-center gap-2 text-xl">
                                                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                                                    <CheckCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                                </div>
                                                Basic Information
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="p-6">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div className="space-y-4">
                                                    <div className="rounded-lg bg-slate-50 dark:bg-slate-800/50 p-4 border border-slate-200 dark:border-slate-700">
                                                        <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Name</p>
                                                        <p className="mt-2 text-lg font-mono font-bold text-slate-900 dark:text-slate-100">{maintenanceType.name}</p>
                                                    </div>
                                                    <div className="rounded-lg bg-slate-50 dark:bg-slate-800/50 p-4 border border-slate-200 dark:border-slate-700">
                                                        <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Category</p>
                                                        <Badge variant={getCategoryBadgeVariant(maintenanceType.category)} className="mt-2">
                                                            {maintenanceType.category}
                                                        </Badge>
                                                    </div>
                                                    <div className="rounded-lg bg-slate-50 dark:bg-slate-800/50 p-4 border border-slate-200 dark:border-slate-700">
                                                        <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Status</p>
                                                        <Badge variant={maintenanceType.is_active ? 'default' : 'secondary'} className="mt-2">
                                                            {maintenanceType.is_active ? 'Active' : 'Inactive'}
                                                        </Badge>
                                                    </div>
                                                </div>
                                                <div className="space-y-4">
                                                    <div className="rounded-lg bg-slate-50 dark:bg-slate-800/50 p-4 border border-slate-200 dark:border-slate-700">
                                                        <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Interval KM</p>
                                                        <p className="mt-2 text-lg font-mono font-bold text-slate-900 dark:text-slate-100">
                                                            {maintenanceType.interval_km ? `${maintenanceType.interval_km.toLocaleString()} km` : 'N/A'}
                                                        </p>
                                                    </div>
                                                    <div className="rounded-lg bg-slate-50 dark:bg-slate-800/50 p-4 border border-slate-200 dark:border-slate-700">
                                                        <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Interval Months</p>
                                                        <p className="mt-2 text-lg font-mono font-bold text-slate-900 dark:text-slate-100">
                                                            {maintenanceType.interval_months ? `${maintenanceType.interval_months} months` : 'N/A'}
                                                        </p>
                                                    </div>
                                                    <div className="rounded-lg bg-slate-50 dark:bg-slate-800/50 p-4 border border-slate-200 dark:border-slate-700">
                                                        <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Estimated Cost</p>
                                                        <p className="mt-2 text-lg font-mono font-bold text-slate-900 dark:text-slate-100">
                                                            {maintenanceType.estimated_cost ? `$${maintenanceType.estimated_cost.toLocaleString()}` : 'N/A'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                            {maintenanceType.description && (
                                                <div className="mt-6 rounded-lg bg-slate-50 dark:bg-slate-800/50 p-4 border border-slate-200 dark:border-slate-700">
                                                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Description</p>
                                                    <p className="mt-2 text-slate-900 dark:text-slate-100 whitespace-pre-wrap">{maintenanceType.description}</p>
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>

                                    {/* Record Information */}
                                    <Card className="shadow-lg border-0 bg-gradient-to-br from-background to-muted/20">
                                        <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-b">
                                            <CardTitle className="flex items-center gap-2 text-xl">
                                                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                                                    <Activity className="h-5 w-5 text-green-600 dark:text-green-400" />
                                                </div>
                                                Record Information
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="p-6">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div className="rounded-lg bg-green-50 dark:bg-green-950/20 p-4 border border-green-200 dark:border-green-800">
                                                    <p className="text-sm font-medium text-green-700 dark:text-green-300">Created At</p>
                                                    <p className="mt-2 text-lg font-mono font-bold text-green-900 dark:text-green-100">
                                                        {maintenanceType?.created_at ? new Date(maintenanceType.created_at).toLocaleDateString() : 'N/A'}
                                                    </p>
                                                </div>
                                                <div className="rounded-lg bg-blue-50 dark:bg-blue-950/20 p-4 border border-blue-200 dark:border-blue-800">
                                                    <p className="text-sm font-medium text-blue-700 dark:text-blue-300">Last Updated</p>
                                                    <p className="mt-2 text-lg font-mono font-bold text-blue-900 dark:text-blue-100">
                                                        {maintenanceType?.updated_at ? new Date(maintenanceType.updated_at).toLocaleDateString() : 'N/A'}
                                                    </p>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>
                            </TabsContent>

                            {/* Analytics Tab */}
                            <TabsContent value="analytics" className="flex-1 overflow-hidden mt-6">
                                <div className="space-y-6">
                                    <Card className="shadow-lg border-0 bg-gradient-to-br from-background to-muted/20">
                                        <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 border-b">
                                            <CardTitle className="flex items-center gap-2 text-xl">
                                                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                                                    <BarChart3 className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                                                </div>
                                                Usage Analytics
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="p-6">
                                            <div className="text-center py-12">
                                                <Wrench className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                                                <h3 className="text-lg font-semibold mb-2">Analytics Coming Soon</h3>
                                                <p className="text-muted-foreground">
                                                    Detailed usage statistics and maintenance frequency analysis will be available here.
                                                </p>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>
                            </TabsContent>

                            {/* History Tab */}
                            <TabsContent value="history" className="flex-1 overflow-hidden mt-6">
                                <Card className="shadow-lg border-0 bg-gradient-to-br from-background to-muted/20">
                                    <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border-b">
                                        <CardTitle className="flex items-center gap-2 text-xl">
                                            <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                                                <History className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                                            </div>
                                            Activity History
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-6">
                                        <ActivityLogTable activityLogs={activityLogs} />
                                    </CardContent>
                                </Card>
                            </TabsContent>
                        </Tabs>
                    </div>

                    {/* Sidebar */}
                    <div className="w-full lg:w-80 space-y-4">
                        {/* Actions Card */}
                        <Card className="shadow-lg border-0 bg-gradient-to-br from-background to-muted/20">
                            <CardHeader className="bg-gradient-to-r from-slate-50 to-gray-50 dark:from-slate-950/20 dark:to-gray-950/20 border-b">
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <div className="p-2 bg-slate-100 dark:bg-slate-900/30 rounded-lg">
                                        <Settings className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                                    </div>
                                    Quick Actions
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-4">
                                <div className="space-y-3">
                                    <Button asChild className="w-full justify-start">
                                        <Link href={`/maintenance-types/${maintenanceType.id}/edit`}>
                                            <Edit className="mr-2 h-4 w-4" />
                                            Edit Maintenance Type
                                        </Link>
                                    </Button>
                                    <Button
                                        variant="destructive"
                                        className="w-full justify-start"
                                        onClick={() => setDeleteDialogOpen(true)}
                                    >
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Delete Maintenance Type
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
                                        <p className="text-sm font-medium text-blue-700 dark:text-blue-300">Maintenance Type</p>
                                        <p className="mt-2 text-lg font-mono font-bold text-blue-900 dark:text-blue-100">{maintenanceType.name}</p>
                                    </div>
                                    <div className="rounded-lg bg-green-50 dark:bg-green-950/20 p-4 border border-green-200 dark:border-green-800">
                                        <p className="text-sm font-medium text-green-700 dark:text-green-300">Category</p>
                                        <Badge variant={getCategoryBadgeVariant(maintenanceType.category)} className="mt-2">
                                            {maintenanceType.category}
                                        </Badge>
                                    </div>
                                    <div className="rounded-lg bg-slate-50 dark:bg-slate-800/50 p-4 border border-slate-200 dark:border-slate-700">
                                        <p className="text-sm font-medium text-slate-700 dark:text-slate-300">System ID</p>
                                        <p className="mt-2 text-sm font-mono text-slate-900 dark:text-slate-100">#{maintenanceType.id}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Delete Confirmation Dialog */}
                <DeleteConfirmationDialog
                    open={deleteDialogOpen}
                    onOpenChange={setDeleteDialogOpen}
                    title="Delete Maintenance Type"
                    description="Are you sure you want to delete this maintenance type? This action cannot be undone."
                    itemName={maintenanceType.name}
                    onConfirm={handleDeleteConfirm}
                    isLoading={isDeleting}
                />
            </div>
        </AppLayout>
    );
}
