import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { Head, Link, useForm } from '@inertiajs/react';
import { type BreadcrumbItem } from '@/types';
import { ArrowLeft } from 'lucide-react';
import { useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Performances', href: '/performances' },
    { title: 'Create', href: '#' },
];

export default function PerformancesCreate() {
    const { data, setData, post, processing, errors } = useForm({
        trip: '',
        LoadType: 'main',
        FOnumber: '',
        operation_id: '',
        driver_truck_id: '',
        DateDispach: new Date().toISOString().split('T')[0],
        orgion_id: '',
        destination_id: '',
        DistanceWCargo: '',
        tonkm: '',
        DistanceWOCargo: '',
        CargoVolumMT: '',
        fuelInLitter: '',
        fuelInBirr: '',
        perdiem: '',
        workOnGoing: '',
        other: '',
        comment: '',
        satus: 'active',
        is_returned: false,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/performances');
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Create Performance" />
            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <Link href="/performances" className="text-gray-600 hover:text-gray-900">
                        <ArrowLeft size={20} />
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold">New Performance Record</h1>
                        <p className="text-gray-600 mt-1">Create a new trip performance record</p>
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Performance Details</CardTitle>
                        <CardDescription>Fill in all required fields</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <Label htmlFor="trip">Trip Name *</Label>
                                    <Input id="trip" value={data.trip} onChange={e => setData('trip', e.target.value)} placeholder="e.g., Trip-001" />
                                    {errors.trip && <p className="text-red-500 text-sm mt-1">{errors.trip}</p>}
                                </div>
                                <div>
                                    <Label htmlFor="FOnumber">FO Number *</Label>
                                    <Input id="FOnumber" value={data.FOnumber} onChange={e => setData('FOnumber', e.target.value)} placeholder="FO number" />
                                    {errors.FOnumber && <p className="text-red-500 text-sm mt-1">{errors.FOnumber}</p>}
                                </div>
                                <div>
                                    <Label htmlFor="DateDispach">Dispatch Date *</Label>
                                    <Input id="DateDispach" type="date" value={data.DateDispach} onChange={e => setData('DateDispach', e.target.value)} />
                                    {errors.DateDispach && <p className="text-red-500 text-sm mt-1">{errors.DateDispach}</p>}
                                </div>
                                <div>
                                    <Label htmlFor="LoadType">Load Type *</Label>
                                    <select value={data.LoadType} onChange={e => setData('LoadType', e.target.value)} className="w-full border rounded px-3 py-2">
                                        <option value="main">Main</option>
                                        <option value="return">Return</option>
                                        <option value="empty">Empty</option>
                                    </select>
                                    {errors.LoadType && <p className="text-red-500 text-sm mt-1">{errors.LoadType}</p>}
                                </div>
                                <div>
                                    <Label htmlFor="operation_id">Operation ID *</Label>
                                    <Input id="operation_id" type="number" value={data.operation_id} onChange={e => setData('operation_id', e.target.value)} />
                                    {errors.operation_id && <p className="text-red-500 text-sm mt-1">{errors.operation_id}</p>}
                                </div>
                                <div>
                                    <Label htmlFor="driver_truck_id">Driver-Truck ID *</Label>
                                    <Input id="driver_truck_id" type="number" value={data.driver_truck_id} onChange={e => setData('driver_truck_id', e.target.value)} />
                                    {errors.driver_truck_id && <p className="text-red-500 text-sm mt-1">{errors.driver_truck_id}</p>}
                                </div>
                                <div>
                                    <Label htmlFor="orgion_id">Origin Place ID *</Label>
                                    <Input id="orgion_id" type="number" value={data.orgion_id} onChange={e => setData('orgion_id', e.target.value)} />
                                    {errors.orgion_id && <p className="text-red-500 text-sm mt-1">{errors.orgion_id}</p>}
                                </div>
                                <div>
                                    <Label htmlFor="destination_id">Destination Place ID *</Label>
                                    <Input id="destination_id" type="number" value={data.destination_id} onChange={e => setData('destination_id', e.target.value)} />
                                    {errors.destination_id && <p className="text-red-500 text-sm mt-1">{errors.destination_id}</p>}
                                </div>
                                <div>
                                    <Label htmlFor="DistanceWCargo">Distance with Cargo (km)</Label>
                                    <Input id="DistanceWCargo" type="number" step="0.01" value={data.DistanceWCargo} onChange={e => setData('DistanceWCargo', e.target.value)} />
                                </div>
                                <div>
                                    <Label htmlFor="DistanceWOCargo">Distance without Cargo (km)</Label>
                                    <Input id="DistanceWOCargo" type="number" step="0.01" value={data.DistanceWOCargo} onChange={e => setData('DistanceWOCargo', e.target.value)} />
                                </div>
                                <div>
                                    <Label htmlFor="CargoVolumMT">Cargo Volume (MT)</Label>
                                    <Input id="CargoVolumMT" type="number" step="0.01" value={data.CargoVolumMT} onChange={e => setData('CargoVolumMT', e.target.value)} />
                                </div>
                                <div>
                                    <Label htmlFor="fuelInLitter">Fuel (Liters)</Label>
                                    <Input id="fuelInLitter" type="number" step="0.01" value={data.fuelInLitter} onChange={e => setData('fuelInLitter', e.target.value)} />
                                </div>
                                <div>
                                    <Label htmlFor="fuelInBirr">Fuel Cost (Birr)</Label>
                                    <Input id="fuelInBirr" type="number" step="0.01" value={data.fuelInBirr} onChange={e => setData('fuelInBirr', e.target.value)} />
                                </div>
                                <div>
                                    <Label htmlFor="tonkm">Ton-KM</Label>
                                    <Input id="tonkm" type="number" step="0.01" value={data.tonkm} onChange={e => setData('tonkm', e.target.value)} />
                                </div>
                                <div>
                                    <Label htmlFor="perdiem">Per Diem (Birr)</Label>
                                    <Input id="perdiem" type="number" step="0.01" value={data.perdiem} onChange={e => setData('perdiem', e.target.value)} />
                                </div>
                                <div>
                                    <Label htmlFor="other">Other Costs (Birr)</Label>
                                    <Input id="other" type="number" step="0.01" value={data.other} onChange={e => setData('other', e.target.value)} />
                                </div>
                                <div>
                                    <Label htmlFor="satus">Status *</Label>
                                    <select value={data.satus} onChange={e => setData('satus', e.target.value)} className="w-full border rounded px-3 py-2">
                                        <option value="active">Active</option>
                                        <option value="completed">Completed</option>
                                        <option value="cancelled">Cancelled</option>
                                    </select>
                                </div>
                                <div className="md:col-span-2">
                                    <Label htmlFor="comment">Comments</Label>
                                    <textarea id="comment" value={data.comment} onChange={e => setData('comment', e.target.value)} placeholder="Additional notes..." rows={3} className="w-full border rounded px-3 py-2" />
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <Button type="submit" disabled={processing}>Create Performance</Button>
                                <Link href="/performances"><Button variant="outline">Cancel</Button></Link>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}

