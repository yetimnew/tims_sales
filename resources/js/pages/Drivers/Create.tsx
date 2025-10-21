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
        title: 'Drivers',
        href: '/drivers',
    },
    {
        title: 'Create',
        href: '/drivers/create',
    },
];

export default function DriversCreate() {
    const { data, setData, post, processing, errors } = useForm({
        driverid: '',
        name: '',
        sex: '',
        birthdate: '',
        zone: '',
        woreda: '',
        kebele: '',
        housenumber: '',
        mobile: '',
        hireddate: '',
        status: 'active',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post('/drivers');
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Create Driver" />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl p-4">
                {/* Header */}
                <div>
                    <h1 className="text-2xl font-bold">Create Driver</h1>
                    <p className="text-muted-foreground">
                        Add a new driver to your workforce
                    </p>
                </div>

                {/* Form */}
                <Card>
                    <CardHeader>
                        <CardTitle>Driver Information</CardTitle>
                        <CardDescription>
                            Enter the information for the new driver
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
                                        onChange={(e) => setData('driverid', e.target.value.toUpperCase())}
                                        placeholder="e.g., DRV001"
                                        className={errors.driverid ? 'border-red-500' : ''}
                                    />
                                    {errors.driverid && (
                                        <p className="text-sm text-red-500">{errors.driverid}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="name">Full Name *</Label>
                                    <Input
                                        id="name"
                                        type="text"
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                        placeholder="e.g., John Doe"
                                        className={errors.name ? 'border-red-500' : ''}
                                    />
                                    {errors.name && (
                                        <p className="text-sm text-red-500">{errors.name}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="sex">Gender *</Label>
                                    <Select
                                        value={data.sex}
                                        onValueChange={(value) => setData('sex', value)}
                                    >
                                        <SelectTrigger className={errors.sex ? 'border-red-500' : ''}>
                                            <SelectValue placeholder="Select gender" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="male">Male</SelectItem>
                                            <SelectItem value="female">Female</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    {errors.sex && (
                                        <p className="text-sm text-red-500">{errors.sex}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="birthdate">Birth Date</Label>
                                    <Input
                                        id="birthdate"
                                        type="date"
                                        value={data.birthdate}
                                        onChange={(e) => setData('birthdate', e.target.value)}
                                        className={errors.birthdate ? 'border-red-500' : ''}
                                    />
                                    {errors.birthdate && (
                                        <p className="text-sm text-red-500">{errors.birthdate}</p>
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
                                        className={errors.zone ? 'border-red-500' : ''}
                                    />
                                    {errors.zone && (
                                        <p className="text-sm text-red-500">{errors.zone}</p>
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
                                        className={errors.woreda ? 'border-red-500' : ''}
                                    />
                                    {errors.woreda && (
                                        <p className="text-sm text-red-500">{errors.woreda}</p>
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
                                        className={errors.kebele ? 'border-red-500' : ''}
                                    />
                                    {errors.kebele && (
                                        <p className="text-sm text-red-500">{errors.kebele}</p>
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
                                        className={errors.housenumber ? 'border-red-500' : ''}
                                    />
                                    {errors.housenumber && (
                                        <p className="text-sm text-red-500">{errors.housenumber}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="mobile">Mobile Number</Label>
                                    <Input
                                        id="mobile"
                                        type="tel"
                                        value={data.mobile}
                                        onChange={(e) => setData('mobile', e.target.value)}
                                        placeholder="e.g., +251 9XX XXX XXX"
                                        className={errors.mobile ? 'border-red-500' : ''}
                                    />
                                    {errors.mobile && (
                                        <p className="text-sm text-red-500">{errors.mobile}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="hireddate">Hired Date</Label>
                                    <Input
                                        id="hireddate"
                                        type="date"
                                        value={data.hireddate}
                                        onChange={(e) => setData('hireddate', e.target.value)}
                                        className={errors.hireddate ? 'border-red-500' : ''}
                                    />
                                    {errors.hireddate && (
                                        <p className="text-sm text-red-500">{errors.hireddate}</p>
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
                                    {processing ? 'Creating...' : 'Create Driver'}
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



