import React, { useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import { CircleAlert, Settings, Save, HelpCircle, ArrowLeft, CheckCircle, FileText, DollarSign, Calendar, Edit } from 'lucide-react';
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

interface MaintenanceTypesEditProps {
    maintenanceType: MaintenanceType;
    errors?: Record<string, string>;
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Maintenance Types',
        href: '/maintenance-types',
    },
    {
        title: 'Edit',
        href: `/maintenance-types/${maintenanceType.id}/edit`,
    },
];

export default function MaintenanceTypesEdit({ maintenanceType, errors }: MaintenanceTypesEditProps) {
    const { data, setData, put, processing, errors: formErrors, hasErrors } = useForm({
        name: maintenanceType.name,
        category: maintenanceType.category,
        interval_km: maintenanceType.interval_km?.toString() || '',
        interval_months: maintenanceType.interval_months?.toString() || '',
        estimated_cost: maintenanceType.estimated_cost?.toString() || '',
        description: maintenanceType.description || '',
        is_active: maintenanceType.is_active,
    });

    const [allErrors, setAllErrors] = useState<Record<string, string>>({});

    React.useEffect(() => {
        if (errors) {
            setAllErrors(errors);
        }
    }, [errors]);

    const handleFieldChange = (field: string, value: any) => {
        setData(field, value);
        if (allErrors[field]) {
            const newErrors = { ...allErrors };
            delete newErrors[field];
            setAllErrors(newErrors);
        }
    };

    const validateMaintenanceType = () => {
        const newErrors: Record<string, string> = {};

        if (!data.name.trim()) {
            newErrors.name = 'Maintenance type name is required';
        }

        if (!data.category) {
            newErrors.category = 'Category is required';
        }

        if (data.interval_km && (isNaN(Number(data.interval_km)) || Number(data.interval_km) <= 0)) {
            newErrors.interval_km = 'Interval KM must be a positive number';
        }

        if (data.interval_months && (isNaN(Number(data.interval_months)) || Number(data.interval_months) <= 0)) {
            newErrors.interval_months = 'Interval months must be a positive number';
        }

        if (data.estimated_cost && (isNaN(Number(data.estimated_cost)) || Number(data.estimated_cost) < 0)) {
            newErrors.estimated_cost = 'Estimated cost must be a non-negative number';
        }

        setAllErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateMaintenanceType()) {
            return;
        }

        put(`/maintenance-types/${maintenanceType.id}`);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit ${maintenanceType.name}`} />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-hidden rounded-xl p-4">
                {/* Enhanced Professional Header */}
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
                                Back to Maintenance Type
                            </Button>
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                                    <Edit className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Edit Maintenance Type</h1>
                                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Update information for "{maintenanceType.name}"</p>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 rounded-full text-sm font-medium">
                                <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                                Editing Mode
                            </div>
                        </div>
                    </div>
                </div>

                {hasErrors && (
                    <Alert variant="destructive" className="border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/20">
                        <CircleAlert className="h-4 w-4" />
                        <AlertDescription className="text-red-800 dark:text-red-200">
                            Please fix the errors below before submitting the form
                        </AlertDescription>
                    </Alert>
                )}

                {/* Form */}
                <Card className="shadow-lg border-0 bg-gradient-to-br from-background to-muted/20">
                    <CardHeader className="bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20 border-b">
                        <CardTitle className="flex items-center gap-2 text-xl">
                            <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                                <Edit className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                            </div>
                            Update Maintenance Type Information
                        </CardTitle>
                        <CardDescription className="text-base">
                            Modify the details for this maintenance type in your fleet management system
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-6">
                        <form onSubmit={submit} className="space-y-8">
                            {/* Name Field */}
                            <div className="space-y-4">
                                <div className="rounded-lg bg-slate-50 dark:bg-slate-800/50 p-4 border border-slate-200 dark:border-slate-700">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="p-1.5 bg-slate-100 dark:bg-slate-900/30 rounded-lg">
                                            <Settings className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                                        </div>
                                        <div>
                                            <Label htmlFor="name" className="text-sm font-medium text-slate-700 dark:text-slate-300">Maintenance Type Name *</Label>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Required field - must be unique</p>
                                        </div>
                                    </div>
                                    <Input
                                        id="name"
                                        type="text"
                                        value={data.name}
                                        onChange={(e) => handleFieldChange('name', e.target.value)}
                                        placeholder="e.g., Oil Change, Brake Service, Engine Overhaul"
                                        className={`transition-colors focus:ring-2 focus:ring-orange-500 ${allErrors.name ? 'border-red-500 focus:ring-red-500' : ''}`}
                                    />
                                    {allErrors.name && (
                                        <div className="flex items-center gap-2 mt-2 text-red-600 dark:text-red-400">
                                            <CircleAlert className="h-4 w-4" />
                                            <p className="text-sm">{allErrors.name}</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Category Field */}
                            <div className="space-y-4">
                                <div className="rounded-lg bg-slate-50 dark:bg-slate-800/50 p-4 border border-slate-200 dark:border-slate-700">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="p-1.5 bg-slate-100 dark:bg-slate-900/30 rounded-lg">
                                            <CheckCircle className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                                        </div>
                                        <div>
                                            <Label htmlFor="category" className="text-sm font-medium text-slate-700 dark:text-slate-300">Category *</Label>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Select the type of maintenance activity</p>
                                        </div>
                                    </div>
                                    <Select value={data.category} onValueChange={(value) => handleFieldChange('category', value)}>
                                        <SelectTrigger className={`transition-colors focus:ring-2 focus:ring-orange-500 ${allErrors.category ? 'border-red-500 focus:ring-red-500' : ''}`}>
                                            <SelectValue placeholder="Select a category" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Preventive">Preventive</SelectItem>
                                            <SelectItem value="Corrective">Corrective</SelectItem>
                                            <SelectItem value="Emergency">Emergency</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    {allErrors.category && (
                                        <div className="flex items-center gap-2 mt-2 text-red-600 dark:text-red-400">
                                            <CircleAlert className="h-4 w-4" />
                                            <p className="text-sm">{allErrors.category}</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Intervals */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Interval KM */}
                                <div className="space-y-4">
                                    <div className="rounded-lg bg-slate-50 dark:bg-slate-800/50 p-4 border border-slate-200 dark:border-slate-700">
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="p-1.5 bg-slate-100 dark:bg-slate-900/30 rounded-lg">
                                                <Settings className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                                            </div>
                                            <div>
                                                <Label htmlFor="interval_km" className="text-sm font-medium text-slate-700 dark:text-slate-300">Interval KM</Label>
                                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Optional - distance-based maintenance interval</p>
                                            </div>
                                        </div>
                                        <Input
                                            id="interval_km"
                                            type="number"
                                            value={data.interval_km}
                                            onChange={(e) => handleFieldChange('interval_km', e.target.value)}
                                            placeholder="e.g., 5000"
                                            min="1"
                                            className={`transition-colors focus:ring-2 focus:ring-orange-500 ${allErrors.interval_km ? 'border-red-500 focus:ring-red-500' : ''}`}
                                        />
                                        {allErrors.interval_km && (
                                            <div className="flex items-center gap-2 mt-2 text-red-600 dark:text-red-400">
                                                <CircleAlert className="h-4 w-4" />
                                                <p className="text-sm">{allErrors.interval_km}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Interval Months */}
                                <div className="space-y-4">
                                    <div className="rounded-lg bg-slate-50 dark:bg-slate-800/50 p-4 border border-slate-200 dark:border-slate-700">
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="p-1.5 bg-slate-100 dark:bg-slate-900/30 rounded-lg">
                                                <Calendar className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                                            </div>
                                            <div>
                                                <Label htmlFor="interval_months" className="text-sm font-medium text-slate-700 dark:text-slate-300">Interval Months</Label>
                                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Optional - time-based maintenance interval</p>
                                            </div>
                                        </div>
                                        <Input
                                            id="interval_months"
                                            type="number"
                                            value={data.interval_months}
                                            onChange={(e) => handleFieldChange('interval_months', e.target.value)}
                                            placeholder="e.g., 6"
                                            min="1"
                                            className={`transition-colors focus:ring-2 focus:ring-orange-500 ${allErrors.interval_months ? 'border-red-500 focus:ring-red-500' : ''}`}
                                        />
                                        {allErrors.interval_months && (
                                            <div className="flex items-center gap-2 mt-2 text-red-600 dark:text-red-400">
                                                <CircleAlert className="h-4 w-4" />
                                                <p className="text-sm">{allErrors.interval_months}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Estimated Cost */}
                            <div className="space-y-4">
                                <div className="rounded-lg bg-slate-50 dark:bg-slate-800/50 p-4 border border-slate-200 dark:border-slate-700">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="p-1.5 bg-slate-100 dark:bg-slate-900/30 rounded-lg">
                                            <DollarSign className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                                        </div>
                                        <div>
                                            <Label htmlFor="estimated_cost" className="text-sm font-medium text-slate-700 dark:text-slate-300">Estimated Cost</Label>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Optional - average cost for this maintenance type</p>
                                        </div>
                                    </div>
                                    <Input
                                        id="estimated_cost"
                                        type="number"
                                        value={data.estimated_cost}
                                        onChange={(e) => handleFieldChange('estimated_cost', e.target.value)}
                                        placeholder="e.g., 150.00"
                                        min="0"
                                        step="0.01"
                                        className={`transition-colors focus:ring-2 focus:ring-orange-500 ${allErrors.estimated_cost ? 'border-red-500 focus:ring-red-500' : ''}`}
                                    />
                                    {allErrors.estimated_cost && (
                                        <div className="flex items-center gap-2 mt-2 text-red-600 dark:text-red-400">
                                            <CircleAlert className="h-4 w-4" />
                                            <p className="text-sm">{allErrors.estimated_cost}</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Description Field */}
                            <div className="space-y-4">
                                <div className="rounded-lg bg-slate-50 dark:bg-slate-800/50 p-4 border border-slate-200 dark:border-slate-700">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="p-1.5 bg-slate-100 dark:bg-slate-900/30 rounded-lg">
                                            <FileText className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                                        </div>
                                        <div>
                                            <Label htmlFor="description" className="text-sm font-medium text-slate-700 dark:text-slate-300">Description</Label>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Optional - provide additional details about this maintenance type</p>
                                        </div>
                                    </div>
                                    <Textarea
                                        id="description"
                                        value={data.description}
                                        onChange={(e) => handleFieldChange('description', e.target.value)}
                                        placeholder="Describe the maintenance procedure, parts involved, or special requirements..."
                                        rows={4}
                                        className={`transition-colors focus:ring-2 focus:ring-orange-500 ${allErrors.description ? 'border-red-500 focus:ring-red-500' : ''}`}
                                    />
                                    {allErrors.description && (
                                        <div className="flex items-center gap-2 mt-2 text-red-600 dark:text-red-400">
                                            <CircleAlert className="h-4 w-4" />
                                            <p className="text-sm">{allErrors.description}</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex items-center justify-between pt-6 border-t border-slate-200 dark:border-slate-700">
                                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                                    <HelpCircle className="h-4 w-4" />
                                    <span>Fields marked with * are required</span>
                                </div>
                                <div className="flex gap-3">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => window.history.back()}
                                        className="hover:bg-slate-50 hover:border-slate-300"
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={processing || hasErrors}
                                        className="bg-orange-600 hover:bg-orange-700 text-white px-6"
                                    >
                                        <Save className="mr-2 h-4 w-4" />
                                        {processing ? 'Updating...' : 'Update Maintenance Type'}
                                    </Button>
                                </div>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
