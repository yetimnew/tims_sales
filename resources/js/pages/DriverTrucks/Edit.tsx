import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { route } from 'ziggy-js';
import driverTrucks from '../../routes/driver-trucks/index';
import { type BreadcrumbItem } from '@/types';
import { ArrowLeft, Save, Truck, User } from 'lucide-react';
import { useState } from 'react';

interface DriverTruck {
    id: number;
    driver_id: number;
    truck_id: number;
    plate: string;
    driverid: string;
    date_recived: string;
    is_attached: boolean;
    status: string;
    driver: {
        id: number;
        name: string;
        driverid: string;
    };
    truck: {
        id: number;
        plate: string;
        vehicletype: {
            name: string;
        };
    };
}

interface Truck {
    id: number;
    plate: string;
    status: string;
    vehicletype: {
        name: string;
    };
}

interface Driver {
    id: number;
    name: string;
    driverid: string;
    status: string;
}

interface EditProps {
    driverTruck: DriverTruck;
    trucks: Truck[];
    drivers: Driver[];
}

export default function Edit({ driverTruck, trucks, drivers }: EditProps) {
    const { errors } = usePage().props;

    // Add null checks to prevent white space errors
    if (!driverTruck || !driverTruck.driver || !driverTruck.truck) {
        return (
            <AppLayout breadcrumbs={[]}>
                <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                        <h2 className="text-lg font-semibold text-gray-900">Loading...</h2>
                        <p className="text-gray-600">Please wait while we load the assignment data.</p>
                    </div>
                </div>
            </AppLayout>
        );
    }

    const [formData, setFormData] = useState({
        truck_id: driverTruck.truck_id?.toString() || '',
        driver_id: driverTruck.driver_id?.toString() || '',
        date_recived: driverTruck.date_recived ? driverTruck.date_recived.split('T')[0] : new Date().toISOString().split('T')[0],
    });

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Fleet Management',
            href: '#',
        },
        {
            title: 'Driver-Truck Assignments',
            href: '/driver-trucks',
        },
        {
            title: 'Edit Assignment',
            href: `/driver-trucks/${driverTruck.id}/edit`,
        },
    ];

    const handleInputChange = (name: string, value: string) => {
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const selectedTruck = trucks?.find((truck) => truck?.id?.toString() === formData.truck_id);
    const selectedDriver = drivers?.find((driver) => driver?.id?.toString() === formData.driver_id);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        router.put(driverTrucks.update(driverTruck.id).url, formData);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit Assignment - ${driverTruck.driver.name} & ${driverTruck.truck.plate}`} />
            <div className="flex flex-1 flex-col gap-6">
                <div className="flex items-center justify-between">
                    <Link href={driverTrucks.show(driverTruck.id).url}>
                        <Button variant="outline" size="sm" className="flex items-center gap-2">
                            <ArrowLeft className="h-4 w-4" />
                            Back to Assignment
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold">Edit Driver-Truck Assignment</h1>
                        <p className="text-muted-foreground">
                            Update assignment for {driverTruck.driver.name} and {driverTruck.truck.plate}
                        </p>
                    </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="grid gap-6 md:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Truck className="h-5 w-5" />
                                Select Truck
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="truck_id">Available Trucks</Label>
                                <Select
                                    value={formData.truck_id}
                                    onValueChange={(value) => handleInputChange('truck_id', value)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Choose a truck" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {trucks && trucks.length > 0 ? (
                                            trucks.map((truck) => (
                                                <SelectItem key={truck?.id || 'unknown'} value={truck?.id?.toString() || ''}>
                                                    {truck?.plate || 'Unknown'} ({truck?.vehicletype?.name || 'Unknown'})
                                                </SelectItem>
                                            ))
                                        ) : (
                                            <SelectItem value="no-trucks" disabled>
                                                No available trucks found
                                            </SelectItem>
                                        )}
                                    </SelectContent>
                                </Select>
                                {errors.truck_id && (
                                    <p className="text-sm text-red-500">{errors.truck_id}</p>
                                )}
                            </div>

                            {selectedTruck && (
                                <div className="rounded-lg border p-4 bg-muted/50">
                                    <h4 className="font-medium mb-2">Selected Truck</h4>
                                    <p className="text-sm text-muted-foreground">
                                        <strong>Plate:</strong> {selectedTruck.plate}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        <strong>Type:</strong> {selectedTruck.vehicletype?.name || 'Unknown'}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        <strong>Status:</strong> {selectedTruck.status.charAt(0).toUpperCase() + selectedTruck.status.slice(1)}
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <User className="h-5 w-5" />
                                Select Driver
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="driver_id">Available Drivers</Label>
                                <Select
                                    value={formData.driver_id}
                                    onValueChange={(value) => handleInputChange('driver_id', value)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Choose a driver" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {drivers && drivers.length > 0 ? (
                                            drivers.map((driver) => (
                                                <SelectItem key={driver?.id || 'unknown'} value={driver?.id?.toString() || ''}>
                                                    {driver?.name || 'Unknown'} (ID: {driver?.driverid || 'Unknown'})
                                                </SelectItem>
                                            ))
                                        ) : (
                                            <SelectItem value="no-drivers" disabled>
                                                No available drivers found
                                            </SelectItem>
                                        )}
                                    </SelectContent>
                                </Select>
                                {errors.driver_id && (
                                    <p className="text-sm text-red-500">{errors.driver_id}</p>
                                )}
                            </div>

                            {selectedDriver && (
                                <div className="rounded-lg border p-4 bg-muted/50">
                                    <h4 className="font-medium mb-2">Selected Driver</h4>
                                    <p className="text-sm text-muted-foreground">
                                        <strong>Name:</strong> {selectedDriver.name}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        <strong>Driver ID:</strong> {selectedDriver.driverid}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        <strong>Status:</strong> {selectedDriver.status.charAt(0).toUpperCase() + selectedDriver.status.slice(1)}
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="md:col-span-2">
                        <CardHeader>
                            <CardTitle>Assignment Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="date_recived">Assignment Date</Label>
                                <Input
                                    id="date_recived"
                                    type="date"
                                    value={formData.date_recived}
                                    onChange={(e) => handleInputChange('date_recived', e.target.value)}
                                />
                                {errors.date_recived && (
                                    <p className="text-sm text-red-500">{errors.date_recived}</p>
                                )}
                            </div>
                            <div className="flex justify-end gap-2">
                                <Link href={driverTrucks.show(driverTruck.id).url}>
                                    <Button type="button" variant="outline">
                                        Cancel
                                    </Button>
                                </Link>
                                <Button type="submit" disabled={!formData.truck_id || !formData.driver_id}>
                                    <Save className="mr-2 h-4 w-4" />
                                    Update Assignment
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </form>
            </div>
        </AppLayout>
    );
}
