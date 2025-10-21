import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import AppLayout from '@/layouts/app-layout';
import { Head, Link } from '@inertiajs/react';
import { type BreadcrumbItem } from '@/types';
import {
    Users,
    Plus,
    Eye,
    Edit,
    Trash2,
    Calendar,
    MapPin,
    Phone
} from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Drivers',
        href: '/drivers',
    },
];

interface DriverData {
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
    created_at: string;
}

interface DriversIndexProps {
    drivers: {
        data: DriverData[];
        links: any[];
        meta: any;
    };
}

export default function DriversIndex({ drivers }: DriversIndexProps) {
    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'active':
                return <Badge variant="default">Active</Badge>;
            case 'inactive':
                return <Badge variant="secondary">Inactive</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    const getSexBadge = (sex: string) => {
        switch (sex) {
            case 'male':
                return <Badge variant="outline">Male</Badge>;
            case 'female':
                return <Badge variant="outline">Female</Badge>;
            default:
                return <Badge variant="outline">{sex}</Badge>;
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Drivers" />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl p-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Drivers</h1>
                        <p className="text-muted-foreground">
                            Manage your driver workforce
                        </p>
                    </div>
                    <Button asChild>
                        <Link href="/drivers/create">
                            <Plus className="h-4 w-4 mr-2" />
                            Add Driver
                        </Link>
                    </Button>
                </div>

                {/* Drivers List */}
                <Card>
                    <CardHeader>
                        <CardTitle>Driver Directory</CardTitle>
                        <CardDescription>
                            {drivers.meta.total} drivers in your workforce
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {drivers.data.map((driver) => (
                                <div key={driver.id} className="flex items-center justify-between p-4 border rounded-lg">
                                    <div className="space-y-1">
                                        <div className="font-medium">{driver.name}</div>
                                        <div className="text-sm text-muted-foreground">
                                            ID: {driver.driverid}
                                        </div>
                                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                            {getSexBadge(driver.sex)}
                                            {driver.zone && (
                                                <span className="flex items-center gap-1">
                                                    <MapPin className="h-3 w-3" />
                                                    {driver.zone}
                                                </span>
                                            )}
                                            {driver.mobile && (
                                                <span className="flex items-center gap-1">
                                                    <Phone className="h-3 w-3" />
                                                    {driver.mobile}
                                                </span>
                                            )}
                                        </div>
                                        {driver.hireddate && (
                                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                                <Calendar className="h-3 w-3" />
                                                Hired: {new Date(driver.hireddate).toLocaleDateString()}
                                            </div>
                                        )}
                                    </div>
                                    <div className="text-right space-y-2">
                                        {getStatusBadge(driver.status)}
                                        <div className="flex gap-2">
                                            <Button asChild size="sm" variant="outline">
                                                <Link href={`/drivers/${driver.id}`}>
                                                    <Eye className="h-4 w-4" />
                                                </Link>
                                            </Button>
                                            <Button asChild size="sm" variant="outline">
                                                <Link href={`/drivers/${driver.id}/edit`}>
                                                    <Edit className="h-4 w-4" />
                                                </Link>
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Pagination */}
                        {drivers.links && drivers.links.length > 3 && (
                            <div className="flex items-center justify-center space-x-2 mt-6">
                                {drivers.links.map((link, index) => (
                                    <Button
                                        key={index}
                                        asChild
                                        variant={link.active ? "default" : "outline"}
                                        size="sm"
                                        disabled={!link.url}
                                    >
                                        <Link href={link.url || '#'}>
                                            <span dangerouslySetInnerHTML={{ __html: link.label }} />
                                        </Link>
                                    </Button>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}

