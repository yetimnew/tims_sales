import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { Head, useForm } from '@inertiajs/react';
import { type BreadcrumbItem } from '@/types';
import { toast } from '@/hooks/use-toast';
import { AlertCircle } from 'lucide-react';
import { FormEventHandler, useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Operations',
        href: '/operations',
    },
    {
        title: 'Edit',
        href: '#',
    },
];

interface Customer {
    id: number;
    name: string;
}

interface Region {
    id: number;
    name: string;
}

interface Operation {
    id: number;
    operationid: string;
    customer_id: number;
    region_id: number;
    startdate: string;
    volume: number;
    cargotype: string;
    km: number;
    tariff: number;
    remark?: string;
    status: string;
}

interface OperationsEditProps {
    operation: Operation;
    customers: Customer[];
    regions: Region[];
}

export default function OperationsEdit({ operation, customers, regions }: OperationsEditProps) {
    const { data, setData, put, processing, errors } = useForm({
        operationid: operation.operationid,
        customer_id: operation.customer_id.toString(),
        region_id: operation.region_id.toString(),
        startdate: operation.startdate,
        volume: operation.volume.toString(),
        cargotype: operation.cargotype,
        km: operation.km.toString(),
        tariff: operation.tariff.toString(),
        remark: operation.remark || '',
        status: operation.status,
    });

    const [frontendErrors, setFrontendErrors] = useState<Record<string, string>>({});

    const validateField = (field: string, value: string) => {
        const newErrors: Record<string, string> = {};

        if (field === 'operationid' && !value.trim()) {
            newErrors.operationid = 'Operation ID is required';
        }
        if (field === 'customer_id' && !value) {
            newErrors.customer_id = 'Customer is required';
        }
        if (field === 'region_id' && !value) {
            newErrors.region_id = 'Region is required';
        }
        if (field === 'startdate' && !value) {
            newErrors.startdate = 'Start date is required';
        }
        if (field === 'volume' && (!value || isNaN(Number(value)))) {
            newErrors.volume = 'Volume is required and must be a number';
        }
        if (field === 'cargotype' && !value.trim()) {
            newErrors.cargotype = 'Cargo type is required';
        }
        if (field === 'km' && (!value || isNaN(Number(value)))) {
            newErrors.km = 'Distance is required and must be a number';
        }
        if (field === 'tariff' && (!value || isNaN(Number(value)))) {
            newErrors.tariff = 'Tariff is required and must be a number';
        }
        if (field === 'status' && !value) {
            newErrors.status = 'Status is required';
        }

        setFrontendErrors(prev => ({
            ...prev,
            [field]: newErrors[field] || ''
        }));
    };

    const handleFieldChange = (field: string, value: string) => {
        setData(field as any, value);
        validateField(field, value);
    };

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        const newErrors: Record<string, string> = {};
        if (!data.operationid.trim()) newErrors.operationid = 'Operation ID is required';
        if (!data.customer_id) newErrors.customer_id = 'Customer is required';
        if (!data.status) newErrors.status = 'Status is required';

        if (Object.keys(newErrors).length > 0) {
            setFrontendErrors(newErrors);
            toast({
                title: '⚠️ Validation Error',
                description: 'Please fix the validation errors before submitting',
                variant: 'destructive',
            });
            return;
        }

        put(`/operations/${operation.id}`);
    };

    const hasErrors = Object.keys(errors).length > 0 || Object.keys(frontendErrors).length > 0;
    const getFieldError = (fieldName: string) => errors[fieldName as keyof typeof errors] || frontendErrors[fieldName] || '';

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit ${operation.operationid}`} />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl p-4">
                {/* Header */}
                <div>
                    <h1 className="text-2xl font-bold">Edit Operation</h1>
                    <p className="text-muted-foreground">
                        Update the operation information for {operation.operationid}
                    </p>
                </div>

                {/* Error Alert */}
                {hasErrors && (
                    <div className="flex gap-3 rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive">
                        <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                        <div>
                            <h3 className="font-semibold mb-1">Please fix the following errors:</h3>
                            <ul className="list-inside list-disc space-y-1 text-sm">
                                {Object.entries({ ...errors, ...frontendErrors }).map(([field, message]) => (
                                    <li key={field}>
                                        {typeof message === 'string' ? message : String(message)}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                )}

                {/* Form */}
                <Card>
                    <CardHeader>
                        <CardTitle>Operation Details</CardTitle>
                        <CardDescription>
                            Update the information for this operation
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={submit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="operationid">Operation ID *</Label>
                                    <Input
                                        id="operationid"
                                        type="text"
                                        value={data.operationid}
                                        onChange={(e) => handleFieldChange('operationid', e.target.value)}
                                        placeholder="e.g., OP-2024-001"
                                        className={getFieldError('operationid') ? 'border-red-500 focus:border-red-500' : ''}
                                    />
                                    {getFieldError('operationid') && (
                                        <p className="text-sm text-red-500">{getFieldError('operationid')}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="customer_id">Customer *</Label>
                                    <Select
                                        value={data.customer_id}
                                        onValueChange={(value) => handleFieldChange('customer_id', value)}
                                    >
                                        <SelectTrigger className={getFieldError('customer_id') ? 'border-red-500' : ''}>
                                            <SelectValue placeholder="Select customer" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {customers.map((customer) => (
                                                <SelectItem key={customer.id} value={customer.id.toString()}>
                                                    {customer.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {getFieldError('customer_id') && (
                                        <p className="text-sm text-red-500">{getFieldError('customer_id')}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="region_id">Region *</Label>
                                    <Select
                                        value={data.region_id}
                                        onValueChange={(value) => handleFieldChange('region_id', value)}
                                    >
                                        <SelectTrigger className={getFieldError('region_id') ? 'border-red-500' : ''}>
                                            <SelectValue placeholder="Select region" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {regions.map((region) => (
                                                <SelectItem key={region.id} value={region.id.toString()}>
                                                    {region.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {getFieldError('region_id') && (
                                        <p className="text-sm text-red-500">{getFieldError('region_id')}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="startdate">Start Date *</Label>
                                    <Input
                                        id="startdate"
                                        type="date"
                                        value={data.startdate}
                                        onChange={(e) => handleFieldChange('startdate', e.target.value)}
                                        className={getFieldError('startdate') ? 'border-red-500 focus:border-red-500' : ''}
                                    />
                                    {getFieldError('startdate') && (
                                        <p className="text-sm text-red-500">{getFieldError('startdate')}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="volume">Volume (MT) *</Label>
                                    <Input
                                        id="volume"
                                        type="number"
                                        step="0.01"
                                        value={data.volume}
                                        onChange={(e) => handleFieldChange('volume', e.target.value)}
                                        placeholder="Enter volume in metric tons"
                                        className={getFieldError('volume') ? 'border-red-500 focus:border-red-500' : ''}
                                    />
                                    {getFieldError('volume') && (
                                        <p className="text-sm text-red-500">{getFieldError('volume')}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="cargotype">Cargo Type *</Label>
                                    <Input
                                        id="cargotype"
                                        type="text"
                                        value={data.cargotype}
                                        onChange={(e) => handleFieldChange('cargotype', e.target.value)}
                                        placeholder="Enter cargo type"
                                        className={getFieldError('cargotype') ? 'border-red-500 focus:border-red-500' : ''}
                                    />
                                    {getFieldError('cargotype') && (
                                        <p className="text-sm text-red-500">{getFieldError('cargotype')}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="km">Distance (KM) *</Label>
                                    <Input
                                        id="km"
                                        type="number"
                                        step="0.01"
                                        value={data.km}
                                        onChange={(e) => handleFieldChange('km', e.target.value)}
                                        placeholder="Enter distance in kilometers"
                                        className={getFieldError('km') ? 'border-red-500 focus:border-red-500' : ''}
                                    />
                                    {getFieldError('km') && (
                                        <p className="text-sm text-red-500">{getFieldError('km')}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="tariff">Tariff *</Label>
                                    <Input
                                        id="tariff"
                                        type="number"
                                        step="0.01"
                                        value={data.tariff}
                                        onChange={(e) => handleFieldChange('tariff', e.target.value)}
                                        placeholder="Enter tariff amount"
                                        className={getFieldError('tariff') ? 'border-red-500 focus:border-red-500' : ''}
                                    />
                                    {getFieldError('tariff') && (
                                        <p className="text-sm text-red-500">{getFieldError('tariff')}</p>
                                    )}
                                </div>

                                <div className="space-y-2 md:col-span-2">
                                    <Label htmlFor="remark">Description</Label>
                                    <Input
                                        id="remark"
                                        type="text"
                                        value={data.remark}
                                        onChange={(e) => setData('remark', e.target.value)}
                                        placeholder="Enter operation description"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="status">Status *</Label>
                                    <Select
                                        value={data.status}
                                        onValueChange={(value) => handleFieldChange('status', value)}
                                    >
                                        <SelectTrigger className={getFieldError('status') ? 'border-red-500' : ''}>
                                            <SelectValue placeholder="Select status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="active">Active</SelectItem>
                                            <SelectItem value="inactive">Inactive</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    {getFieldError('status') && (
                                        <p className="text-sm text-red-500">{getFieldError('status')}</p>
                                    )}
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <Button type="submit" disabled={processing || Object.keys(frontendErrors).length > 0}>
                                    {processing ? 'Updating...' : 'Update Operation'}
                                </Button>
                                <Button type="button" variant="outline" asChild>
                                    <a href="/operations">Cancel</a>
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
