import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import AppLayout from '@/layouts/app-layout';
import { Head, Link, router } from '@inertiajs/react';
import { type BreadcrumbItem } from '@/types';
import { Edit, Trash2, ArrowLeft, BarChart3 } from 'lucide-react';
import { DeleteConfirmationDialog } from '@/components/delete-confirmation-dialog';
import { ActivityLogTable } from '@/components/activity-log-table';
import { useState } from 'react';

interface ActivityLog {
    id: number;
    action: 'created' | 'updated' | 'deleted';
    description: string;
    user?: { name: string };
    created_at: string;
    old_values?: Record<string, any>;
    new_values?: Record<string, any>;
}

interface FinancialRecord {
    id: number;
    truck_id: number;
    record_date: string;
    period_type: string;
    revenue: number;
    fuel_cost: number;
    maintenance_cost: number;
    driver_salary: number;
    insurance_cost: number;
    depreciation: number;
    other_costs: number;
    net_profit: number;
    created_at?: string;
    updated_at?: string;
    truck?: { id: number; plate: string };
}

interface FinancialShowProps {
    financial: FinancialRecord;
    activityLogs?: ActivityLog[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Financial', href: '/financial' },
];

export default function FinancialShow({ financial, activityLogs = [] }: FinancialShowProps) {
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDeleteConfirm = () => {
        setIsDeleting(true);
        router.delete(`/financial/${financial.id}`, {
            onSuccess: () => {
                setDeleteDialogOpen(false);
                setIsDeleting(false);
            },
            onError: () => {
                setIsDeleting(false);
            },
        });
    };

    const formatDate = (date?: string) => {
        if (!date) return 'N/A';
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    const formatCurrency = (value: number) => {
        return `$${Number(value).toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        })}`;
    };

    const getPeriodBadgeColor = (type: string) => {
        switch (type) {
            case 'daily':
                return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
            case 'weekly':
                return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
            case 'monthly':
                return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
            default:
                return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
        }
    };

    const totalCosts = financial.fuel_cost + financial.maintenance_cost +
                       financial.driver_salary + financial.insurance_cost +
                       financial.depreciation + financial.other_costs;

    const profitMargin = financial.revenue > 0 ? (financial.net_profit / financial.revenue) * 100 : 0;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Financial Record - ${financial.truck?.plate || 'Record'}`} />
            <div className="flex flex-1 flex-col gap-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.get('/financial')}
                            className="flex items-center gap-2"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Back to Financial
                        </Button>
                        <div>
                            <h1 className="text-2xl font-bold flex items-center gap-2">
                                <BarChart3 className="h-6 w-6" />
                                Financial Record - {financial.truck?.plate}
                            </h1>
                            <p className="text-muted-foreground">Period: {formatDate(financial.record_date)}</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" asChild>
                            <Link href={`/financial/${financial.id}/edit`}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                            </Link>
                        </Button>
                        <Button variant="destructive" onClick={() => setDeleteDialogOpen(true)}>
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                        </Button>
                    </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-3">
                    {/* Main Details */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Revenue & Costs Summary */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Financial Summary</CardTitle>
                                <CardDescription>Revenue and cost overview</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid gap-6">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="rounded-lg bg-green-50 p-4 dark:bg-green-900/20">
                                            <p className="text-sm font-medium text-green-600 dark:text-green-400">Revenue</p>
                                            <p className="mt-2 text-2xl font-bold text-green-700 dark:text-green-300">
                                                {formatCurrency(financial.revenue)}
                                            </p>
                                        </div>
                                        <div className="rounded-lg bg-red-50 p-4 dark:bg-red-900/20">
                                            <p className="text-sm font-medium text-red-600 dark:text-red-400">Total Costs</p>
                                            <p className="mt-2 text-2xl font-bold text-red-700 dark:text-red-300">
                                                {formatCurrency(totalCosts)}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="border-t pt-4">
                                        <div className={`rounded-lg p-4 ${financial.net_profit >= 0 ? 'bg-blue-50 dark:bg-blue-900/20' : 'bg-orange-50 dark:bg-orange-900/20'}`}>
                                            <p className={`text-sm font-medium ${financial.net_profit >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-orange-600 dark:text-orange-400'}`}>
                                                Net Profit
                                            </p>
                                            <p className={`mt-2 text-2xl font-bold ${financial.net_profit >= 0 ? 'text-blue-700 dark:text-blue-300' : 'text-orange-700 dark:text-orange-300'}`}>
                                                {formatCurrency(financial.net_profit)}
                                            </p>
                                            <p className="mt-1 text-xs text-muted-foreground">
                                                Profit Margin: {profitMargin.toFixed(2)}%
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Detailed Costs */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Cost Breakdown</CardTitle>
                                <CardDescription>Detailed cost allocation</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid gap-4">
                                    <div className="space-y-3">
                                        {[
                                            { label: 'Fuel Cost', value: financial.fuel_cost },
                                            { label: 'Maintenance Cost', value: financial.maintenance_cost },
                                            { label: 'Driver Salary', value: financial.driver_salary },
                                            { label: 'Insurance Cost', value: financial.insurance_cost },
                                            { label: 'Depreciation', value: financial.depreciation },
                                            { label: 'Other Costs', value: financial.other_costs },
                                        ].map((cost, idx) => (
                                            <div key={idx} className="flex items-center justify-between border-b pb-3 last:border-0">
                                                <p className="text-sm text-muted-foreground">{cost.label}</p>
                                                <p className="text-sm font-semibold">{formatCurrency(cost.value)}</p>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="border-t pt-3">
                                        <div className="flex items-center justify-between">
                                            <p className="font-medium">Total Costs</p>
                                            <p className="text-lg font-bold">{formatCurrency(totalCosts)}</p>
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
                                        <p className="mt-1">{formatDate(financial.created_at)}</p>
                                    </div>
                                    <div>
                                        <p className="font-medium text-muted-foreground">Last Updated</p>
                                        <p className="mt-1">{formatDate(financial.updated_at)}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Quick Info */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Quick Info</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div className="rounded-lg bg-muted p-4">
                                        <p className="text-sm font-medium text-muted-foreground">Truck</p>
                                        <Link href={`/trucks/${financial.truck_id}`} className="mt-2 inline-block text-lg font-mono font-bold text-blue-600 hover:underline dark:text-blue-400">
                                            {financial.truck?.plate}
                                        </Link>
                                    </div>
                                    <div className="rounded-lg bg-muted p-4">
                                        <p className="text-sm font-medium text-muted-foreground">Period Type</p>
                                        <Badge className={`mt-2 ${getPeriodBadgeColor(financial.period_type)}`}>
                                            {financial.period_type.charAt(0).toUpperCase() + financial.period_type.slice(1)}
                                        </Badge>
                                    </div>
                                    <div className={`rounded-lg p-4 ${financial.net_profit >= 0 ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'}`}>
                                        <p className={`text-sm font-medium ${financial.net_profit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                            Profit Status
                                        </p>
                                        <p className={`mt-2 text-lg font-bold ${financial.net_profit >= 0 ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>
                                            {financial.net_profit >= 0 ? 'Profitable' : 'Loss'}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Activity Log */}
                {activityLogs && activityLogs.length > 0 && <ActivityLogTable logs={activityLogs} />}
            </div>

            {/* Delete Confirmation Dialog */}
            <DeleteConfirmationDialog
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
                title="Delete Financial Record"
                description="Are you sure you want to delete this financial record? This action cannot be undone."
                itemName={`${financial.period_type} - ${financial.truck?.plate}`}
                onConfirm={handleDeleteConfirm}
                isLoading={isDeleting}
            />
        </AppLayout>
    );
}
