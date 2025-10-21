import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import AppLayout from '@/layouts/app-layout';
import { Head, useForm } from '@inertiajs/react';
import { type BreadcrumbItem } from '@/types';
import { FormEventHandler, useEffect, useState } from 'react';
import { validateVehicleType, type ValidationErrors } from '@/lib/validation';
import { useToast } from '@/hooks/use-toast';
import { CircleAlert } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Vehicle Types',
        href: '/vehicletypes',
    },
    {
        title: 'Create',
        href: '/vehicletypes/create',
    },
];

export default function VehicleTypesCreate() {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        description: '',
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
            name: data.name,
            description: data.description,
            [fieldName]: value,
        };

        const allErrors = validateVehicleType(validationData);
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
        const allErrors = validateVehicleType({
            name: data.name,
            description: data.description,
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

        post('/vehicletypes');
    };

    const hasErrors = Object.keys(errors).length > 0 || Object.keys(frontendErrors).length > 0;
    const allErrors = { ...frontendErrors, ...errors };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Create Vehicle Type" />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl p-4">
                {/* Header */}
                <div>
                    <h1 className="text-2xl font-bold">Create Vehicle Type</h1>
                    <p className="text-muted-foreground">
                        Add a new vehicle type to the system
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
                        <CardTitle>Vehicle Type Details</CardTitle>
                        <CardDescription>
                            Enter the information for the new vehicle type
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={submit} className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="name">Name *</Label>
                                <Input
                                    id="name"
                                    type="text"
                                    value={data.name}
                                    onChange={(e) => handleFieldChange('name', e.target.value)}
                                    placeholder="e.g., Heavy Truck, Light Truck"
                                    className={allErrors.name ? 'border-red-500' : ''}
                                />
                                {allErrors.name && (
                                    <p className="text-sm text-red-500">{allErrors.name}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description">Description</Label>
                                <Textarea
                                    id="description"
                                    value={data.description}
                                    onChange={(e) => handleFieldChange('description', e.target.value)}
                                    placeholder="Optional description of the vehicle type"
                                    rows={3}
                                    className={allErrors.description ? 'border-red-500' : ''}
                                />
                                {allErrors.description && (
                                    <p className="text-sm text-red-500">{allErrors.description}</p>
                                )}
                            </div>

                            <div className="flex gap-2">
                                <Button type="submit" disabled={processing || hasErrors}>
                                    {processing ? 'Creating...' : 'Create Vehicle Type'}
                                </Button>
                                <Button type="button" variant="outline" asChild>
                                    <a href="/vehicletypes">Cancel</a>
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}



