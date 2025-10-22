import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { Head, Link, useForm } from '@inertiajs/react';
import { type BreadcrumbItem } from '@/types';
import { ArrowLeft } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Performances', href: '/performances' },
    { title: 'Edit', href: '#' },
];

interface Performance {
    id: number; trip: string; LoadType: string; FOnumber: string; DateDispach: string;
    DistanceWCargo?: number; DistanceWOCargo?: number; tonkm?: number; CargoVolumMT?: number;
    fuelInLitter?: number; fuelInBirr?: number; perdiem?: number; other?: number; comment?: string;
    satus: string; is_returned: boolean; operation_id: number; driver_truck_id: number;
    orgion_id: number; destination_id: number;
}

export default function PerformancesEdit({ performance }: { performance: Performance }) {
    const { data, setData, patch, processing, errors } = useForm({
        trip: performance.trip,
        LoadType: performance.LoadType,
        FOnumber: performance.FOnumber,
        DateDispach: performance.DateDispach,
        DistanceWCargo: performance.DistanceWCargo || '',
        tonkm: performance.tonkm || '',
        DistanceWOCargo: performance.DistanceWOCargo || '',
        CargoVolumMT: performance.CargoVolumMT || '',
        fuelInLitter: performance.fuelInLitter || '',
        fuelInBirr: performance.fuelInBirr || '',
        perdiem: performance.perdiem || '',
        other: performance.other || '',
        comment: performance.comment || '',
        satus: performance.satus,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        patch(`/performances/${performance.id}`);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit Performance #${performance.id}`} />
            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <Link href="/performances" className="text-gray-600 hover:text-gray-900">
                        <ArrowLeft size={20} />
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold">Edit Performance Record</h1>
                        <p className="text-gray-600 mt-1">Update trip {performance.trip}</p>
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Performance Details</CardTitle>
                        <CardDescription>Update the performance record information</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <Label htmlFor="trip">Trip Name *</Label>
                                    <Input id="trip" value={data.trip} onChange={e => setData('trip', e.target.value)} />
                                    {errors.trip && <p className="text-red-500 text-sm mt-1">{errors.trip}</p>}
                                </div>
                                <div>
                                    <Label htmlFor="FOnumber">FO Number *</Label>
                                    <Input id="FOnumber" value={data.FOnumber} onChange={e => setData('FOnumber', e.target.value)} />
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
                                <Button type="submit" disabled={processing}>Update Performance</Button>
                                <Link href="/performances"><Button variant="outline">Cancel</Button></Link>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}

