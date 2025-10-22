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

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Cargo Types',
        href: '/cargo-types',
    },
    {
        title: 'Create',
        href: '/cargo-types/create',
    },
];

interface FormData {
    name: string;
    category: string;
    weight_per_cubic_meter: string;
    handling_requirements: string;
    safety_requirements: string;
    requires_special_equipment: boolean;
}

export default function CargoTypesCreate() {
    const [formData, setFormData] = React.useState<FormData>({
        name: '',
        category: 'Construction',
        weight_per_cubic_meter: '',
        handling_requirements: '',
        safety_requirements: '',
        requires_special_equipment: false,
    });

    const [errors, setErrors] = React.useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = React.useState(false);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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

    const handleCheckChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData((prev) => ({
            ...prev,
            requires_special_equipment: e.target.checked,
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        router.post('/cargo-types', formData, {
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
            <Head title="Create Cargo Type" />

            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <Link href="/cargo-types" className="text-gray-600 hover:text-gray-900">
                        <ArrowLeft size={20} />
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold">Create Cargo Type</h1>
                        <p className="text-gray-600 mt-1">Add a new cargo type to the system</p>
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Cargo Type Details</CardTitle>
                        <CardDescription>
                            Fill in the information for the new cargo type
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    Name *
                                </label>
                                <Input
                                    type="text"
                                    name="name"
                                    placeholder="e.g., Cement, Steel, Gravel"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    className={errors.name ? 'border-red-500' : ''}
                                />
                                {errors.name && (
                                    <p className="text-red-500 text-sm mt-1">{errors.name}</p>
                                )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-2">
                                        Category *
                                    </label>
                                    <Select
                                        value={formData.category}
                                        onValueChange={(value) =>
                                            handleSelectChange('category', value)
                                        }
                                    >
                                        <SelectTrigger
                                            className={errors.category ? 'border-red-500' : ''}
                                        >
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Construction">
                                                Construction
                                            </SelectItem>
                                            <SelectItem value="Agricultural">
                                                Agricultural
                                            </SelectItem>
                                            <SelectItem value="Industrial">
                                                Industrial
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                    {errors.category && (
                                        <p className="text-red-500 text-sm mt-1">
                                            {errors.category}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2">
                                        Weight per m³ (kg)
                                    </label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        name="weight_per_cubic_meter"
                                        placeholder="0.00"
                                        value={formData.weight_per_cubic_meter}
                                        onChange={handleInputChange}
                                        className={
                                            errors.weight_per_cubic_meter ? 'border-red-500' : ''
                                        }
                                    />
                                    {errors.weight_per_cubic_meter && (
                                        <p className="text-red-500 text-sm mt-1">
                                            {errors.weight_per_cubic_meter}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    Handling Requirements
                                </label>
                                <Textarea
                                    name="handling_requirements"
                                    placeholder="Describe special handling requirements..."
                                    value={formData.handling_requirements}
                                    onChange={handleInputChange}
                                    rows={3}
                                    className={
                                        errors.handling_requirements ? 'border-red-500' : ''
                                    }
                                />
                                {errors.handling_requirements && (
                                    <p className="text-red-500 text-sm mt-1">
                                        {errors.handling_requirements}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    Safety Requirements
                                </label>
                                <Textarea
                                    name="safety_requirements"
                                    placeholder="Describe safety requirements..."
                                    value={formData.safety_requirements}
                                    onChange={handleInputChange}
                                    rows={3}
                                    className={
                                        errors.safety_requirements ? 'border-red-500' : ''
                                    }
                                />
                                {errors.safety_requirements && (
                                    <p className="text-red-500 text-sm mt-1">
                                        {errors.safety_requirements}
                                    </p>
                                )}
                            </div>

                            <div className="flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    id="requires_special_equipment"
                                    name="requires_special_equipment"
                                    checked={formData.requires_special_equipment}
                                    onChange={handleCheckChange}
                                    className="rounded"
                                />
                                <label
                                    htmlFor="requires_special_equipment"
                                    className="text-sm font-medium cursor-pointer"
                                >
                                    Requires Special Equipment
                                </label>
                            </div>

                            <div className="flex gap-4 pt-4">
                                <Button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="px-6"
                                >
                                    {isSubmitting ? 'Creating...' : 'Create Cargo Type'}
                                </Button>
                                <Link href="/cargo-types">
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
