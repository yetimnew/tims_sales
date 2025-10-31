import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { type BreadcrumbItem } from '@/types';
import { ArrowLeft, Save, AlertTriangle, Truck, User, UserX } from 'lucide-react';
import { useState } from 'react';

interface DriverTruck {
    id: number;
    driver_id: number;
    truck_id: number;
    plate: string;
    driverid: string;
    date_recived: string;
    is_attached: boolean;
    status: number;
    driver: {
        id: number;
        name: string;
        driverid: string;
    };
    truck: {
        id: number;
        plate: string;
    };
}

interface Props {
    driverTruck: DriverTruck;
}

export default function Detach({ driverTruck }: Props) {
    const { errors } = usePage().props;
    const [formData, setFormData] = useState({
        date_detach: new Date().toISOString().split('T')[0],
        reason: '',
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
            title: `${driverTruck.driver.name} - ${driverTruck.truck.plate}`,
            href: `/driver-trucks/${driverTruck.id}`,
        },
        {
            title: 'Detach Driver',
            href: `/driver-trucks/${driverTruck.id}/detach`,
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
        router.post(`/driver-trucks/${driverTruck.id}/detach`, formData);
    };

    // Calculate duration from original assignment date to detach date
    const getDuration = () => {
        try {
            const start = new Date(driverTruck.date_recived);
            const end = new Date(formData.date_detach);
            const diff = end.getTime() - start.getTime();

            if (diff < 0) return 'Invalid date range';

            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

            return `${days} days, ${hours} hours, ${minutes} minutes`;
        } catch {
            return 'Unable to calculate';
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Detach: ${driverTruck.driver.name} - ${driverTruck.truck.plate}`} />

            <div className="flex h-full flex-1 flex-col gap-4 overflow-y-auto rounded-xl p-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href={`/driver-trucks/${driverTruck.id}`}>
                            <Button variant="ghost" size="sm">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back to Assignment
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold">Detach Driver from Truck</h1>
                            <p className="text-muted-foreground">
                                {driverTruck.driver.name} - {driverTruck.truck.plate}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Warning Alert */}
                <Card className="border-orange-200 bg-orange-50">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3 text-orange-700">
                            <AlertTriangle className="h-5 w-5 flex-shrink-0" />
                            <div>
                                <h4 className="font-medium">Important Notice</h4>
                                <p className="text-sm mt-1">
                                    Detaching this driver will make the truck available for reassignment and mark this assignment as inactive.
                                    The driver will become available for assignment to other trucks.
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Current Assignment Summary */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <User className="h-5 w-5" />
                            Current Assignment Details
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-6 md:grid-cols-2">
                            <div className="space-y-4">
                                <div>
                                    <Label className="text-sm font-medium text-muted-foreground">Driver</Label>
                                    <div className="flex items-center gap-2 p-3 border rounded-lg bg-muted/50">
                                        <User className="h-4 w-4" />
                                        <div>
                                            <p className="font-medium">{driverTruck.driver.name}</p>
                                            <p className="text-sm text-muted-foreground">ID: {driverTruck.driver.driverid}</p>
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <Label className="text-sm font-medium text-muted-foreground">Truck</Label>
                                    <div className="flex items-center gap-2 p-3 border rounded-lg bg-muted/50">
                                        <Truck className="h-4 w-4" />
                                        <div>
                                            <p className="font-medium">{driverTruck.truck.plate}</p>
                                            <p className="text-sm text-muted-foreground">Plate: {driverTruck.plate}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <Label className="text-sm font-medium text-muted-foreground">Assigned Date</Label>
                                    <div className="p-3 border rounded-lg bg-muted/50">
                                        <p className="font-medium">{new Date(driverTruck.date_recived).toLocaleDateString()}</p>
                                    </div>
                                </div>
                                <div>
                                    <Label className="text-sm font-medium text-muted-foreground">Assignment Duration</Label>
                                    <div className="p-3 border rounded-lg bg-muted/50">
                                        <p className="font-medium text-blue-600">{getDuration()}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Detachment Form */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <UserX className="h-5 w-5" />
                            Detachment Details
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="date_detach">Detachment Date *</Label>
                                <Input
                                    id="date_detach"
                                    type="date"
                                    value={formData.date_detach}
                                    onChange={(e) => handleInputChange('date_detach', e.target.value)}
                                />
                                {errors.date_detach && (
                                    <p className="text-sm text-red-500">{errors.date_detach}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="reason">Reason for Detachment *</Label>
                                <Textarea
                                    id="reason"
                                    placeholder="Please provide a detailed reason for detaching this driver from the truck..."
                                    value={formData.reason}
                                    onChange={(e) => handleInputChange('reason', e.target.value)}
                                    rows={4}
                                    required
                                />
                                {errors.reason && (
                                    <p className="text-sm text-red-500">{errors.reason}</p>
                                )}
                                <p className="text-xs text-muted-foreground">
                                    This reason will be recorded in the system for audit purposes.
                                </p>
                            </div>
                        </div>

                        {/* Preview */}
                        <div className="rounded-lg border p-4 bg-red-50 border-red-200">
                            <h4 className="font-medium mb-3 text-red-900">Detachment Summary</h4>
                            <div className="space-y-2 text-sm text-red-800">
                                <p><strong>Driver:</strong> {driverTruck.driver.name} ({driverTruck.driver.driverid})</p>
                                <p><strong>Truck:</strong> {driverTruck.truck.plate}</p>
                                <p><strong>Detachment Date:</strong> {new Date(formData.date_detach).toLocaleDateString()}</p>
                                <p><strong>Total Duration:</strong> {getDuration()}</p>
                                {formData.reason && (
                                    <p><strong>Reason:</strong> {formData.reason}</p>
                                )}
                            </div>
                            <div className="mt-3 p-2 bg-red-100 rounded text-red-900 text-sm">
                                <strong>Note:</strong> After detachment, this truck will be available for reassignment and this driver will be available for assignment to other trucks.
                            </div>
                        </div>

                        <div className="flex justify-end gap-4 pt-4 border-t">
                            <Link href={`/driver-trucks/${driverTruck.id}`}>
                                <Button variant="outline">
                                    Cancel
                                </Button>
                            </Link>
                            <Button
                                onClick={handleSubmit}
                                variant="destructive"
                                disabled={!formData.date_detach || !formData.reason.trim()}
                            >
                                <UserX className="mr-2 h-4 w-4" />
                                Detach Driver
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
