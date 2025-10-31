import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AppLayout from '@/layouts/app-layout';
import { Head, useForm } from '@inertiajs/react';
import { type BreadcrumbItem } from '@/types';
import { FormEventHandler, useEffect, useState } from 'react';
import { validateDriver, type ValidationErrors } from '@/lib/validation';
import { toast } from '@/hooks/use-toast';
import { AlertCircle, Info, User, MapPin, Calendar, CheckCircle, HelpCircle, Save, User as UserIcon, Hash } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Drivers',
        href: '/drivers',
    },
    {
        title: 'Edit',
        href: '#',
    },
];

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
}

interface DriversEditProps {
    driver: Driver;
}

export default function DriversEdit({ driver }: DriversEditProps) {
    const { data, setData, put, processing, errors } = useForm({
        driverid: driver.driverid,
        name: driver.name,
        sex: driver.sex,
        birthdate: driver.birthdate || '',
        zone: driver.zone || '',
        woreda: driver.woreda || '',
        kebele: driver.kebele || '',
        housenumber: driver.housenumber || '',
        mobile: driver.mobile || '',
        hireddate: driver.hireddate || '',
        status: driver.status,
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
            driverid: data.driverid,
            mobile: data.mobile,
            hireddate: data.hireddate,
            status: data.status,
            [fieldName]: value,
        };

        const allErrors = validateDriver(validationData);
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
        const allErrors = validateDriver({
            name: data.name,
            driverid: data.driverid,
            mobile: data.mobile,
            hireddate: data.hireddate,
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

        put(`/drivers/${driver.id}`);
    };

    const hasErrors = Object.keys(errors).length > 0 || Object.keys(frontendErrors).length > 0;
    const allErrors = { ...frontendErrors, ...errors };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit ${driver.name}`} />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl p-4">
                {/* Header */}
                <div>
                    <h1 className="text-2xl font-bold">Edit Driver</h1>
                    <p className="text-muted-foreground">
                        Update the driver information
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
                        <CardTitle>Driver Information</CardTitle>
                        <CardDescription>
                            Update the information for {driver.name}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={submit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="driverid">Driver ID *</Label>
                                    <Input
                                        id="driverid"
                                        type="text"
                                        value={data.driverid}
                                        onChange={(e) => handleFieldChange('driverid', e.target.value.toUpperCase())}
                                        placeholder="e.g., DRV001"
                                        className={allErrors.driverid ? 'border-red-500' : ''}
                                    />
                                    {allErrors.driverid && (
                                        <p className="text-sm text-red-500">{allErrors.driverid}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="name">Full Name *</Label>
                                    <Input
                                        id="name"
                                        type="text"
                                        value={data.name}
                                        onChange={(e) => handleFieldChange('name', e.target.value)}
                                        placeholder="e.g., John Doe"
                                        className={allErrors.name ? 'border-red-500' : ''}
                                    />
                                    {allErrors.name && (
                                        <p className="text-sm text-red-500">{allErrors.name}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="sex">Gender *</Label>
                                    <Select
                                        value={data.sex}
                                        onValueChange={(value) => setData('sex', value)}
                                    >
                                        <SelectTrigger className={allErrors.sex ? 'border-red-500' : ''}>
                                            <SelectValue placeholder="Select gender" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="male">Male</SelectItem>
                                            <SelectItem value="female">Female</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    {allErrors.sex && (
                                        <p className="text-sm text-red-500">{allErrors.sex}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="birthdate">Birth Date</Label>
                                    <Input
                                        id="birthdate"
                                        type="date"
                                        value={data.birthdate}
                                        onChange={(e) => setData('birthdate', e.target.value)}
                                        className={allErrors.birthdate ? 'border-red-500' : ''}
                                    />
                                    {allErrors.birthdate && (
                                        <p className="text-sm text-red-500">{allErrors.birthdate}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="zone">Zone</Label>
                                    <Input
                                        id="zone"
                                        type="text"
                                        value={data.zone}
                                        onChange={(e) => setData('zone', e.target.value)}
                                        placeholder="e.g., Addis Ababa"
                                        className={allErrors.zone ? 'border-red-500' : ''}
                                    />
                                    {allErrors.zone && (
                                        <p className="text-sm text-red-500">{allErrors.zone}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="woreda">Woreda</Label>
                                    <Input
                                        id="woreda"
                                        type="text"
                                        value={data.woreda}
                                        onChange={(e) => setData('woreda', e.target.value)}
                                        placeholder="e.g., Kirkos"
                                        className={allErrors.woreda ? 'border-red-500' : ''}
                                    />
                                    {allErrors.woreda && (
                                        <p className="text-sm text-red-500">{allErrors.woreda}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="kebele">Kebele</Label>
                                    <Input
                                        id="kebele"
                                        type="text"
                                        value={data.kebele}
                                        onChange={(e) => setData('kebele', e.target.value)}
                                        placeholder="e.g., Kebele 01"
                                        className={allErrors.kebele ? 'border-red-500' : ''}
                                    />
                                    {allErrors.kebele && (
                                        <p className="text-sm text-red-500">{allErrors.kebele}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="housenumber">House Number</Label>
                                    <Input
                                        id="housenumber"
                                        type="text"
                                        value={data.housenumber}
                                        onChange={(e) => setData('housenumber', e.target.value)}
                                        placeholder="e.g., H-123"
                                        className={allErrors.housenumber ? 'border-red-500' : ''}
                                    />
                                    {allErrors.housenumber && (
                                        <p className="text-sm text-red-500">{allErrors.housenumber}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="mobile">Mobile Number</Label>
                                    <Input
                                        id="mobile"
                                        type="tel"
                                        value={data.mobile}
                                        onChange={(e) => handleFieldChange('mobile', e.target.value)}
                                        placeholder="e.g., +251 9XX XXX XXX"
                                        className={allErrors.mobile ? 'border-red-500' : ''}
                                    />
                                    {allErrors.mobile && (
                                        <p className="text-sm text-red-500">{allErrors.mobile}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="hireddate">Hired Date</Label>
                                    <Input
                                        id="hireddate"
                                        type="date"
                                        value={data.hireddate}
                                        onChange={(e) => handleFieldChange('hireddate', e.target.value)}
                                        className={allErrors.hireddate ? 'border-red-500' : ''}
                                    />
                                    {allErrors.hireddate && (
                                        <p className="text-sm text-red-500">{allErrors.hireddate}</p>
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
                                            <SelectItem value="active">Active</SelectItem>
                                            <SelectItem value="inactive">Inactive</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    {allErrors.status && (
                                        <p className="text-sm text-red-500">{allErrors.status}</p>
                                    )}
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <Button type="submit" disabled={processing || hasErrors}>
                                    {processing ? 'Updating...' : 'Update Driver'}
                                </Button>
                                <Button type="button" variant="outline" asChild>
                                    <a href="/drivers">Cancel</a>
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
