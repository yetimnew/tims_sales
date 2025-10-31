import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { type BreadcrumbItem } from '@/types';
import { ArrowLeft, Save, AlertTriangle, Truck, User } from 'lucide-react';
import { useState } from 'react';

interface Truck {
    id: number;
    plate: string;
    status: number;
}

interface Driver {
    id: number;
    name: string;
    driverid: string;
    status: number;
}

interface Props {
    trucks: Truck[];
    drivers: Driver[];
    error?: string;
}

export default function Create({ trucks, drivers, error }: Props) {
    const { errors } = usePage().props;

    // Add null checking to prevent white space errors
    if (!Array.isArray(trucks) || !Array.isArray(drivers)) {
        return (
            <AppLayout breadcrumbs={[]}>
                <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                        <h2 className="text-lg font-semibold text-gray-900">Loading...</h2>
                        <p className="text-gray-600">Please wait while we load the available trucks and drivers.</p>
                    </div>
                </div>
            </AppLayout>
        );
    }

    const [formData, setFormData] = useState({
        truck_id: '',
        driver_id: '',
        date_recived: new Date().toISOString().split('T')[0],
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
            title: 'Create Assignment',
            href: '/driver-trucks/create',
        },
    ];

    const handleInputChange = (field: string, value: string) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        router.post('/driver-trucks', formData);
    };

    const selectedTruck = trucks.find(truck => truck.id.toString() === formData.truck_id);
    const selectedDriver = drivers.find(driver => driver.id.toString() === formData.driver_id);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Create Driver-Truck Assignment" />

            <div className="flex h-full flex-1 flex-col gap-4 overflow-y-auto rounded-xl p-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/driver-trucks">
                            <Button variant="ghost" size="sm">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back to Assignments
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold">Create Driver-Truck Assignment</h1>
                            <p className="text-muted-foreground">
                                Assign a driver to a truck
                            </p>
                        </div>
                    </div>
                </div>

                {/* Error Alert */}
                {error && (
                    <Card className="border-red-200 bg-red-50">
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-2 text-red-700">
                                <AlertTriangle className="h-4 w-4" />
                                <span>{error}</span>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Form */}
                <div className="grid gap-6 md:grid-cols-2">
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
                                        {trucks.length > 0 ? (
                                            trucks.map((truck) => (
                                                <SelectItem key={truck.id} value={truck.id.toString()}>
                                                    {truck.plate}
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
                                        <strong>Status:</strong> {selectedTruck.status === 1 ? 'Active' : 'Inactive'}
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
                                        {drivers.length > 0 ? (
                                            drivers.map((driver) => (
                                                <SelectItem key={driver.id} value={driver.id.toString()}>
                                                    {driver.name} (ID: {driver.driverid})
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
                                        <strong>Status:</strong> {selectedDriver.status === 1 ? 'Active' : 'Inactive'}
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                <Card>
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

                        {selectedTruck && selectedDriver && (
                            <div className="rounded-lg border p-4 bg-blue-50 border-blue-200">
                                <h4 className="font-medium mb-2 text-blue-900">Assignment Summary</h4>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <p className="text-blue-700"><strong>Driver:</strong></p>
                                        <p className="text-blue-900">{selectedDriver.name} ({selectedDriver.driverid})</p>
                                    </div>
                                    <div>
                                        <p className="text-blue-700"><strong>Truck:</strong></p>
                                        <p className="text-blue-900">{selectedTruck.plate}</p>
                                    </div>
                                    <div>
                                        <p className="text-blue-700"><strong>Assignment Date:</strong></p>
                                        <p className="text-blue-900">{new Date(formData.date_recived).toLocaleDateString()}</p>
                                    </div>
                                    <div>
                                        <p className="text-blue-700"><strong>Status:</strong></p>
                                        <p className="text-blue-900">Active Assignment</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="flex justify-end gap-4 pt-4">
                            <Link href="/driver-trucks">
                                <Button variant="outline">
                                    Cancel
                                </Button>
                            </Link>
                            <Button
                                onClick={handleSubmit}
                                disabled={!formData.truck_id || !formData.driver_id || !formData.date_recived}
                            >
                                <Save className="mr-2 h-4 w-4" />
                                Create Assignment
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
