import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import AppLayout from '@/layouts/app-layout';
import { Head, useForm } from '@inertiajs/react';
import { type BreadcrumbItem } from '@/types';
import { FormEventHandler, useEffect, useState } from 'react';
import { validateFinancial, type ValidationErrors } from '@/lib/validation';
import { useToast } from '@/hooks/use-toast';
import { CircleAlert } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Financial',
        href: '/financial',
    },
    {
        title: 'Edit',
        href: '#',
    },
];

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
}

interface FinancialEditProps {
    financial: FinancialRecord;
    trucks: Array<{ id: number; plate: string }>;
}

export default function FinancialEdit({ financial, trucks }: FinancialEditProps) {
    const { data, setData, put, processing, errors } = useForm({
        truck_id: financial.truck_id.toString(),
        record_date: financial.record_date,
        period_type: financial.period_type,
        revenue: financial.revenue.toString(),
        fuel_cost: financial.fuel_cost.toString(),
        maintenance_cost: financial.maintenance_cost.toString(),
        driver_salary: financial.driver_salary.toString(),
        insurance_cost: financial.insurance_cost.toString(),
        depreciation: financial.depreciation.toString(),
        other_costs: financial.other_costs.toString(),
    });

    const { toast } = useToast();
    const [frontendErrors, setFrontendErrors] = useState<ValidationErrors>({});

    useEffect(() => {
        if (Object.keys(errors).length > 0) {
            toast({
                variant: 'destructive',
                title: 'Validation Error',
                description: 'Please fix the errors below',
            });
        }
    }, [errors, toast]);

    const validateField = (fieldName: string, value: string) => {
        const validationData = {
            truck_id: data.truck_id,
            record_date: data.record_date,
            revenue: data.revenue,
            fuel_cost: data.fuel_cost,
            maintenance_cost: data.maintenance_cost,
            driver_salary: data.driver_salary,
            insurance_cost: data.insurance_cost,
            depreciation: data.depreciation,
            other_costs: data.other_costs,
            period_type: data.period_type,
            [fieldName]: value,
        };

        const allErrors = validateFinancial(validationData);
        const fieldError = allErrors[fieldName] || '';

        setFrontendErrors(prev => {
            const updated = { ...prev };
            if (fieldError) {
                updated[fieldName] = fieldError;
            } else {
                delete updated[fieldName];
            }
            return updated;
        });
    };

    const handleFieldChange = (fieldName: string, value: string) => {
        setData(fieldName as any, value);
        validateField(fieldName, value);
    };

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        // Run full validation
        const allErrors = validateFinancial({
            truck_id: data.truck_id,
            record_date: data.record_date,
            revenue: data.revenue,
            fuel_cost: data.fuel_cost,
            maintenance_cost: data.maintenance_cost,
            driver_salary: data.driver_salary,
            insurance_cost: data.insurance_cost,
            depreciation: data.depreciation,
            other_costs: data.other_costs,
            period_type: data.period_type,
        });

        if (Object.keys(allErrors).length > 0) {
            setFrontendErrors(allErrors);
            toast({
                variant: 'destructive',
                title: 'Validation Error',
                description: 'Please fix all errors before submitting',
            });
            return;
        }

        put(`/financial/${financial.id}`);
    };

    const hasErrors = Object.keys(errors).length > 0 || Object.keys(frontendErrors).length > 0;
    const allErrors = { ...frontendErrors, ...errors };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Edit Financial Record" />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl p-4">
                {/* Header */}
                <div>
                    <h1 className="text-2xl font-bold">Edit Financial Record</h1>
                    <p className="text-muted-foreground">
                        Update the financial record information
                    </p>
                </div>

                {hasErrors && (
                    <Alert variant="destructive">
                        <CircleAlert className="h-4 w-4" />
                        <AlertDescription>
                            Please fix the errors below before submitting the form
                        </AlertDescription>
                    </Alert>
                )}

                {/* Form */}
                <Card>
                    <CardHeader>
                        <CardTitle>Financial Record</CardTitle>
                        <CardDescription>
                            Update revenue and cost information
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={submit} className="space-y-6">
                            {/* Main Fields */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="truck_id">Truck *</Label>
                                    <Select
                                        value={data.truck_id}
                                        onValueChange={(value) => handleFieldChange('truck_id', value)}
                                    >
                                        <SelectTrigger className={allErrors.truck_id ? 'border-red-500' : ''}>
                                            <SelectValue placeholder="Select truck" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {trucks.map(truck => (
                                                <SelectItem key={truck.id} value={truck.id.toString()}>
                                                    {truck.plate}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {allErrors.truck_id && (
                                        <p className="text-sm text-red-500">{allErrors.truck_id}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="record_date">Record Date *</Label>
                                    <Input
                                        id="record_date"
                                        type="date"
                                        value={data.record_date}
                                        onChange={(e) => handleFieldChange('record_date', e.target.value)}
                                        className={allErrors.record_date ? 'border-red-500' : ''}
                                    />
                                    {allErrors.record_date && (
                                        <p className="text-sm text-red-500">{allErrors.record_date}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="period_type">Period Type *</Label>
                                    <Select
                                        value={data.period_type}
                                        onValueChange={(value) => handleFieldChange('period_type', value)}
                                    >
                                        <SelectTrigger className={allErrors.period_type ? 'border-red-500' : ''}>
                                            <SelectValue placeholder="Select period" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="daily">Daily</SelectItem>
                                            <SelectItem value="weekly">Weekly</SelectItem>
                                            <SelectItem value="monthly">Monthly</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    {allErrors.period_type && (
                                        <p className="text-sm text-red-500">{allErrors.period_type}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="revenue">Revenue *</Label>
                                    <Input
                                        id="revenue"
                                        type="number"
                                        step="0.01"
                                        value={data.revenue}
                                        onChange={(e) => handleFieldChange('revenue', e.target.value)}
                                        placeholder="0.00"
                                        className={allErrors.revenue ? 'border-red-500' : ''}
                                    />
                                    {allErrors.revenue && (
                                        <p className="text-sm text-red-500">{allErrors.revenue}</p>
                                    )}
                                </div>
                            </div>

                            {/* Costs Section */}
                            <div className="border-t pt-6">
                                <h3 className="text-lg font-semibold mb-4">Costs Breakdown</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="fuel_cost">Fuel Cost *</Label>
                                        <Input
                                            id="fuel_cost"
                                            type="number"
                                            step="0.01"
                                            value={data.fuel_cost}
                                            onChange={(e) => handleFieldChange('fuel_cost', e.target.value)}
                                            placeholder="0.00"
                                            className={allErrors.fuel_cost ? 'border-red-500' : ''}
                                        />
                                        {allErrors.fuel_cost && (
                                            <p className="text-sm text-red-500">{allErrors.fuel_cost}</p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="maintenance_cost">Maintenance Cost *</Label>
                                        <Input
                                            id="maintenance_cost"
                                            type="number"
                                            step="0.01"
                                            value={data.maintenance_cost}
                                            onChange={(e) => handleFieldChange('maintenance_cost', e.target.value)}
                                            placeholder="0.00"
                                            className={allErrors.maintenance_cost ? 'border-red-500' : ''}
                                        />
                                        {allErrors.maintenance_cost && (
                                            <p className="text-sm text-red-500">{allErrors.maintenance_cost}</p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="driver_salary">Driver Salary *</Label>
                                        <Input
                                            id="driver_salary"
                                            type="number"
                                            step="0.01"
                                            value={data.driver_salary}
                                            onChange={(e) => handleFieldChange('driver_salary', e.target.value)}
                                            placeholder="0.00"
                                            className={allErrors.driver_salary ? 'border-red-500' : ''}
                                        />
                                        {allErrors.driver_salary && (
                                            <p className="text-sm text-red-500">{allErrors.driver_salary}</p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="insurance_cost">Insurance Cost *</Label>
                                        <Input
                                            id="insurance_cost"
                                            type="number"
                                            step="0.01"
                                            value={data.insurance_cost}
                                            onChange={(e) => handleFieldChange('insurance_cost', e.target.value)}
                                            placeholder="0.00"
                                            className={allErrors.insurance_cost ? 'border-red-500' : ''}
                                        />
                                        {allErrors.insurance_cost && (
                                            <p className="text-sm text-red-500">{allErrors.insurance_cost}</p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="depreciation">Depreciation *</Label>
                                        <Input
                                            id="depreciation"
                                            type="number"
                                            step="0.01"
                                            value={data.depreciation}
                                            onChange={(e) => handleFieldChange('depreciation', e.target.value)}
                                            placeholder="0.00"
                                            className={allErrors.depreciation ? 'border-red-500' : ''}
                                        />
                                        {allErrors.depreciation && (
                                            <p className="text-sm text-red-500">{allErrors.depreciation}</p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="other_costs">Other Costs *</Label>
                                        <Input
                                            id="other_costs"
                                            type="number"
                                            step="0.01"
                                            value={data.other_costs}
                                            onChange={(e) => handleFieldChange('other_costs', e.target.value)}
                                            placeholder="0.00"
                                            className={allErrors.other_costs ? 'border-red-500' : ''}
                                        />
                                        {allErrors.other_costs && (
                                            <p className="text-sm text-red-500">{allErrors.other_costs}</p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <Button type="submit" disabled={processing || hasErrors}>
                                    {processing ? 'Updating...' : 'Update Financial Record'}
                                </Button>
                                <Button type="button" variant="outline" asChild>
                                    <a href="/financial">Cancel</a>
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
