import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { Head, Link, router } from '@inertiajs/react';
import { type BreadcrumbItem } from '@/types';
import { ArrowLeft } from 'lucide-react';
import * as React from 'react';
import { validateDriverSafety } from '@/lib/validation';
import type { ValidationErrors } from '@/lib/validation';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Driver Safety',
        href: '/driver-safety',
    },
    {
        title: 'Edit',
        href: '#',
    },
];

interface Driver {
    id: number;
    name: string;
}

interface SafetyRecord {
    id: number;
    driver_id: number;
    incident_date: string;
    incident_type: string;
    description: string;
    severity: string;
    damage_cost?: number;
    location?: string;
    resolution?: string;
}

interface DriverSafetyEditProps {
    driverSafety: SafetyRecord;
    drivers: Driver[];
}

interface FormData {
    driver_id: string;
    incident_date: string;
    incident_type: string;
    description: string;
    severity: string;
    damage_cost: string;
    location: string;
    resolution: string;
}

export default function DriverSafetyEdit({
    driverSafety,
    drivers,
}: DriverSafetyEditProps) {
    const [formData, setFormData] = React.useState<FormData>({
        driver_id: driverSafety.driver_id.toString(),
        incident_date: driverSafety.incident_date,
        incident_type: driverSafety.incident_type,
        description: driverSafety.description,
        severity: driverSafety.severity,
        damage_cost: driverSafety.damage_cost?.toString() || '',
        location: driverSafety.location || '',
        resolution: driverSafety.resolution || '',
    });

    const [errors, setErrors] = React.useState<ValidationErrors>({});
    const [isSubmitting, setIsSubmitting] = React.useState(false);

    const handleInputChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
        if (errors[name]) {
            setErrors((prev) => {
                const newErrors = { ...prev };
                delete newErrors[name];
                return newErrors;
            });
        }
    };

    const handleSelectChange = (name: string, value: string) => {
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
        if (errors[name]) {
            setErrors((prev) => {
                const newErrors = { ...prev };
                delete newErrors[name];
                return newErrors;
            });
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const validationErrors = validateDriverSafety(formData);
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
        }

        setIsSubmitting(true);

        const dataToSubmit = {
            ...formData,
            damage_cost: formData.damage_cost ? parseFloat(formData.damage_cost) : null,
        };

        router.put(`/driver-safety/${driverSafety.id}`, dataToSubmit, {
            onError: (errors) => {
                setErrors(errors);
                setIsSubmitting(false);
            },
            onSuccess: () => {
                setIsSubmitting(false);
            },
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit Safety Record #${driverSafety.id}`} />

            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <Link href="/driver-safety" className="text-gray-600 hover:text-gray-900">
                        <ArrowLeft size={20} />
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold">Edit Safety Record</h1>
                        <p className="text-gray-600 mt-1">Update the safety incident details</p>
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Safety Incident Details</CardTitle>
                        <CardDescription>
                            Update the details of the safety incident
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-2">
                                        Driver *
                                    </label>
                                    <Select
                                        value={formData.driver_id}
                                        onValueChange={(value) =>
                                            handleSelectChange('driver_id', value)
                                        }
                                    >
                                        <SelectTrigger
                                            className={
                                                errors.driver_id ? 'border-red-500' : ''
                                            }
                                        >
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {drivers.map((driver) => (
                                                <SelectItem
                                                    key={driver.id}
                                                    value={driver.id.toString()}
                                                >
                                                    {driver.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {errors.driver_id && (
                                        <p className="text-red-500 text-sm mt-1">
                                            {errors.driver_id}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2">
                                        Incident Date *
                                    </label>
                                    <Input
                                        type="date"
                                        name="incident_date"
                                        value={formData.incident_date}
                                        onChange={handleInputChange}
                                        className={
                                            errors.incident_date ? 'border-red-500' : ''
                                        }
                                    />
                                    {errors.incident_date && (
                                        <p className="text-red-500 text-sm mt-1">
                                            {errors.incident_date}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-2">
                                        Incident Type *
                                    </label>
                                    <Select
                                        value={formData.incident_type}
                                        onValueChange={(value) =>
                                            handleSelectChange('incident_type', value)
                                        }
                                    >
                                        <SelectTrigger
                                            className={
                                                errors.incident_type
                                                    ? 'border-red-500'
                                                    : ''
                                            }
                                        >
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="accident">
                                                Accident
                                            </SelectItem>
                                            <SelectItem value="violation">
                                                Violation
                                            </SelectItem>
                                            <SelectItem value="warning">
                                                Warning
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                    {errors.incident_type && (
                                        <p className="text-red-500 text-sm mt-1">
                                            {errors.incident_type}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2">
                                        Severity *
                                    </label>
                                    <Select
                                        value={formData.severity}
                                        onValueChange={(value) =>
                                            handleSelectChange('severity', value)
                                        }
                                    >
                                        <SelectTrigger
                                            className={
                                                errors.severity ? 'border-red-500' : ''
                                            }
                                        >
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="minor">
                                                Minor
                                            </SelectItem>
                                            <SelectItem value="major">
                                                Major
                                            </SelectItem>
                                            <SelectItem value="critical">
                                                Critical
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                    {errors.severity && (
                                        <p className="text-red-500 text-sm mt-1">
                                            {errors.severity}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    Description *
                                </label>
                                <Textarea
                                    name="description"
                                    placeholder="Describe the incident in detail"
                                    value={formData.description}
                                    onChange={handleInputChange}
                                    rows={4}
                                    className={
                                        errors.description ? 'border-red-500' : ''
                                    }
                                />
                                {errors.description && (
                                    <p className="text-red-500 text-sm mt-1">
                                        {errors.description}
                                    </p>
                                )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-2">
                                        Location
                                    </label>
                                    <Input
                                        type="text"
                                        name="location"
                                        placeholder="Location of incident"
                                        value={formData.location}
                                        onChange={handleInputChange}
                                        className={
                                            errors.location ? 'border-red-500' : ''
                                        }
                                    />
                                    {errors.location && (
                                        <p className="text-red-500 text-sm mt-1">
                                            {errors.location}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2">
                                        Damage Cost ($)
                                    </label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        name="damage_cost"
                                        placeholder="0.00"
                                        value={formData.damage_cost}
                                        onChange={handleInputChange}
                                        className={
                                            errors.damage_cost ? 'border-red-500' : ''
                                        }
                                    />
                                    {errors.damage_cost && (
                                        <p className="text-red-500 text-sm mt-1">
                                            {errors.damage_cost}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    Resolution
                                </label>
                                <Textarea
                                    name="resolution"
                                    placeholder="How was the incident resolved?"
                                    value={formData.resolution}
                                    onChange={handleInputChange}
                                    rows={3}
                                    className={
                                        errors.resolution ? 'border-red-500' : ''
                                    }
                                />
                                {errors.resolution && (
                                    <p className="text-red-500 text-sm mt-1">
                                        {errors.resolution}
                                    </p>
                                )}
                            </div>

                            <div className="flex gap-4 pt-4">
                                <Button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="px-6"
                                >
                                    {isSubmitting ? 'Updating...' : 'Update Record'}
                                </Button>
                                <Link href="/driver-safety">
                                    <Button type="button" variant="outline">
                                        Cancel
                                    </Button>
                                </Link>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}

