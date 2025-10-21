import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { Head, useForm } from '@inertiajs/react';
import { type BreadcrumbItem } from '@/types';
import { FormEventHandler } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Trucks',
        href: '/trucks',
    },
    {
        title: 'Edit',
        href: '#',
    },
];

interface VehicleType {
    id: number;
    name: string;
}

interface Truck {
    id: number;
    plate: string;
    vehicletype_id: number;
    chasisNumber?: string;
    engineNumber?: string;
    tyreSyze?: string;
    serviceIntervalKM?: number;
    purchasePrice?: number;
    productionDate?: string;
    serviceStartDate?: string;
    status: string;
}

interface TrucksEditProps {
    truck: Truck;
    vehicleTypes: VehicleType[];
}

export default function TrucksEdit({ truck, vehicleTypes }: TrucksEditProps) {
    const { data, setData, put, processing, errors } = useForm({
        plate: truck.plate,
        vehicletype_id: truck.vehicletype_id.toString(),
        chasisNumber: truck.chasisNumber || '',
        engineNumber: truck.engineNumber || '',
        tyreSyze: truck.tyreSyze || '',
        serviceIntervalKM: truck.serviceIntervalKM?.toString() || '',
        purchasePrice: truck.purchasePrice?.toString() || '',
        productionDate: truck.productionDate || '',
        serviceStartDate: truck.serviceStartDate || '',
        status: truck.status,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        put(`/trucks/${truck.id}`);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit ${truck.plate}`} />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl p-4">
                {/* Header */}
                <div>
                    <h1 className="text-2xl font-bold">Edit Truck</h1>
                    <p className="text-muted-foreground">
                        Update the truck information for {truck.plate}
                    </p>
                </div>

                {/* Form */}
                <Card>
                    <CardHeader>
                        <CardTitle>Truck Details</CardTitle>
                        <CardDescription>
                            Update the information for this truck
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={submit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="plate">Plate Number *</Label>
                                    <Input
                                        id="plate"
                                        type="text"
                                        value={data.plate}
                                        onChange={(e) => setData('plate', e.target.value.toUpperCase())}
                                        placeholder="e.g., AA-1234"
                                        className={errors.plate ? 'border-red-500' : ''}
                                    />
                                    {errors.plate && (
                                        <p className="text-sm text-red-500">{errors.plate}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="vehicletype_id">Vehicle Type *</Label>
                                    <Select
                                        value={data.vehicletype_id}
                                        onValueChange={(value) => setData('vehicletype_id', value)}
                                    >
                                        <SelectTrigger className={errors.vehicletype_id ? 'border-red-500' : ''}>
                                            <SelectValue placeholder="Select vehicle type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {vehicleTypes.map((type) => (
                                                <SelectItem key={type.id} value={type.id.toString()}>
                                                    {type.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {errors.vehicletype_id && (
                                        <p className="text-sm text-red-500">{errors.vehicletype_id}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="chasisNumber">Chassis Number</Label>
                                    <Input
                                        id="chasisNumber"
                                        type="text"
                                        value={data.chasisNumber}
                                        onChange={(e) => setData('chasisNumber', e.target.value)}
                                        placeholder="Chassis number"
                                        className={errors.chasisNumber ? 'border-red-500' : ''}
                                    />
                                    {errors.chasisNumber && (
                                        <p className="text-sm text-red-500">{errors.chasisNumber}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="engineNumber">Engine Number</Label>
                                    <Input
                                        id="engineNumber"
                                        type="text"
                                        value={data.engineNumber}
                                        onChange={(e) => setData('engineNumber', e.target.value)}
                                        placeholder="Engine number"
                                        className={errors.engineNumber ? 'border-red-500' : ''}
                                    />
                                    {errors.engineNumber && (
                                        <p className="text-sm text-red-500">{errors.engineNumber}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="tyreSyze">Tyre Size</Label>
                                    <Input
                                        id="tyreSyze"
                                        type="text"
                                        value={data.tyreSyze}
                                        onChange={(e) => setData('tyreSyze', e.target.value)}
                                        placeholder="e.g., 315/80R22.5"
                                        className={errors.tyreSyze ? 'border-red-500' : ''}
                                    />
                                    {errors.tyreSyze && (
                                        <p className="text-sm text-red-500">{errors.tyreSyze}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="serviceIntervalKM">Service Interval (KM)</Label>
                                    <Input
                                        id="serviceIntervalKM"
                                        type="number"
                                        value={data.serviceIntervalKM}
                                        onChange={(e) => setData('serviceIntervalKM', e.target.value)}
                                        placeholder="e.g., 10000"
                                        className={errors.serviceIntervalKM ? 'border-red-500' : ''}
                                    />
                                    {errors.serviceIntervalKM && (
                                        <p className="text-sm text-red-500">{errors.serviceIntervalKM}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="purchasePrice">Purchase Price</Label>
                                    <Input
                                        id="purchasePrice"
                                        type="number"
                                        step="0.01"
                                        value={data.purchasePrice}
                                        onChange={(e) => setData('purchasePrice', e.target.value)}
                                        placeholder="e.g., 2500000.00"
                                        className={errors.purchasePrice ? 'border-red-500' : ''}
                                    />
                                    {errors.purchasePrice && (
                                        <p className="text-sm text-red-500">{errors.purchasePrice}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="productionDate">Production Date</Label>
                                    <Input
                                        id="productionDate"
                                        type="date"
                                        value={data.productionDate}
                                        onChange={(e) => setData('productionDate', e.target.value)}
                                        className={errors.productionDate ? 'border-red-500' : ''}
                                    />
                                    {errors.productionDate && (
                                        <p className="text-sm text-red-500">{errors.productionDate}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="serviceStartDate">Service Start Date</Label>
                                    <Input
                                        id="serviceStartDate"
                                        type="date"
                                        value={data.serviceStartDate}
                                        onChange={(e) => setData('serviceStartDate', e.target.value)}
                                        className={errors.serviceStartDate ? 'border-red-500' : ''}
                                    />
                                    {errors.serviceStartDate && (
                                        <p className="text-sm text-red-500">{errors.serviceStartDate}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="status">Status *</Label>
                                    <Select
                                        value={data.status}
                                        onValueChange={(value) => setData('status', value)}
                                    >
                                        <SelectTrigger className={errors.status ? 'border-red-500' : ''}>
                                            <SelectValue placeholder="Select status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="active">Active</SelectItem>
                                            <SelectItem value="inactive">Inactive</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    {errors.status && (
                                        <p className="text-sm text-red-500">{errors.status}</p>
                                    )}
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <Button type="submit" disabled={processing}>
                                    {processing ? 'Updating...' : 'Update Truck'}
                                </Button>
                                <Button type="button" variant="outline" asChild>
                                    <a href="/trucks">Cancel</a>
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}



