import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import AppLayout from '@/layouts/app-layout';
import { Head, useForm } from '@inertiajs/react';
import { type BreadcrumbItem } from '@/types';
import { FormEventHandler, useEffect, useState } from 'react';
import { validateMaintenance, type ValidationErrors } from '@/lib/validation';
import { useToast } from '@/hooks/use-toast';
import { CircleAlert } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Maintenance',
        href: '/maintenance',
    },
    {
        title: 'Create',
        href: '/maintenance/create',
    },
];

interface MaintenanceCreateProps {
    trucks: Array<{ id: number; plate: string }>;
    maintenanceTypes: Array<{ id: number; name: string }>;
}

export default function MaintenanceCreate({ trucks, maintenanceTypes }: MaintenanceCreateProps) {
    const { data, setData, post, processing, errors } = useForm({
        truck_id: '',
        maintenance_type_id: '',
        scheduled_date: '',
        description: '',
        assigned_mechanic_id: '',
        status: 'scheduled',
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
            maintenance_type_id: data.maintenance_type_id,
            scheduled_date: data.scheduled_date,
            status: data.status,
            [fieldName]: value,
        };

        const allErrors = validateMaintenance(validationData);
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
        const allErrors = validateMaintenance({
            truck_id: data.truck_id,
            maintenance_type_id: data.maintenance_type_id,
            scheduled_date: data.scheduled_date,
            status: data.status,
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

        post('/maintenance');
    };

    const hasErrors = Object.keys(errors).length > 0 || Object.keys(frontendErrors).length > 0;
    const allErrors = { ...frontendErrors, ...errors };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Schedule Maintenance" />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl p-4">
                {/* Header */}
                <div>
                    <h1 className="text-2xl font-bold">Schedule Maintenance</h1>
                    <p className="text-muted-foreground">
                        Schedule a maintenance record for a truck
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
                        <CardTitle>Maintenance Details</CardTitle>
                        <CardDescription>
                            Enter the maintenance record information
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={submit} className="space-y-6">
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
                                    <Label htmlFor="maintenance_type_id">Maintenance Type *</Label>
                                    <Select
                                        value={data.maintenance_type_id}
                                        onValueChange={(value) => handleFieldChange('maintenance_type_id', value)}
                                    >
                                        <SelectTrigger className={allErrors.maintenance_type_id ? 'border-red-500' : ''}>
                                            <SelectValue placeholder="Select maintenance type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {maintenanceTypes.map(type => (
                                                <SelectItem key={type.id} value={type.id.toString()}>
                                                    {type.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {allErrors.maintenance_type_id && (
                                        <p className="text-sm text-red-500">{allErrors.maintenance_type_id}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="scheduled_date">Scheduled Date *</Label>
                                    <Input
                                        id="scheduled_date"
                                        type="date"
                                        value={data.scheduled_date}
                                        onChange={(e) => handleFieldChange('scheduled_date', e.target.value)}
                                        className={allErrors.scheduled_date ? 'border-red-500' : ''}
                                    />
                                    {allErrors.scheduled_date && (
                                        <p className="text-sm text-red-500">{allErrors.scheduled_date}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="status">Status *</Label>
                                    <Select
                                        value={data.status}
                                        onValueChange={(value) => handleFieldChange('status', value)}
                                    >
                                        <SelectTrigger className={allErrors.status ? 'border-red-500' : ''}>
                                            <SelectValue placeholder="Select status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="scheduled">Scheduled</SelectItem>
                                            <SelectItem value="in_progress">In Progress</SelectItem>
                                            <SelectItem value="completed">Completed</SelectItem>
                                            <SelectItem value="overdue">Overdue</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    {allErrors.status && (
                                        <p className="text-sm text-red-500">{allErrors.status}</p>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description">Description</Label>
                                <Textarea
                                    id="description"
                                    value={data.description}
                                    onChange={(e) => setData('description', e.target.value)}
                                    placeholder="Detailed description of maintenance work..."
                                    rows={3}
                                />
                            </div>

                            <div className="flex gap-2">
                                <Button type="submit" disabled={processing || hasErrors}>
                                    {processing ? 'Scheduling...' : 'Schedule Maintenance'}
                                </Button>
                                <Button type="button" variant="outline" asChild>
                                    <a href="/maintenance">Cancel</a>
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
