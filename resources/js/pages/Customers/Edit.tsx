import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { Head, Link, useForm } from '@inertiajs/react';
import { type BreadcrumbItem } from '@/types';
import { ArrowLeft } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Customers', href: '/customers' },
    { title: 'Edit', href: '#' },
];

interface Customer {
    id: number;
    name: string;
    contact_person?: string;
    phone?: string;
    email?: string;
    address?: string;
    status: string;
}

export default function CustomersEdit({ customer }: { customer: Customer }) {
    const { data, setData, put, processing, errors } = useForm({
        name: customer.name,
        contact_person: customer.contact_person || '',
        phone: customer.phone || '',
        email: customer.email || '',
        address: customer.address || '',
        status: customer.status,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(`/customers/${customer.id}`);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit Customer: ${customer.name}`} />
            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <Link href="/customers" className="text-gray-600 hover:text-gray-900">
                        <ArrowLeft size={20} />
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold">Edit Customer</h1>
                        <p className="text-gray-600 mt-1">Update {customer.name}</p>
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Customer Information</CardTitle>
                        <CardDescription>Update customer details</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <Label htmlFor="name">Customer Name *</Label>
                                    <Input id="name" value={data.name} onChange={e => setData('name', e.target.value)} placeholder="Customer name" />
                                    {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
                                </div>
                                <div>
                                    <Label htmlFor="contact_person">Contact Person</Label>
                                    <Input id="contact_person" value={data.contact_person} onChange={e => setData('contact_person', e.target.value)} placeholder="Contact person name" />
                                    {errors.contact_person && <p className="text-red-500 text-sm mt-1">{errors.contact_person}</p>}
                                </div>
                                <div>
                                    <Label htmlFor="phone">Phone Number</Label>
                                    <Input id="phone" value={data.phone} onChange={e => setData('phone', e.target.value)} placeholder="Phone number" type="tel" />
                                    {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
                                </div>
                                <div>
                                    <Label htmlFor="email">Email Address</Label>
                                    <Input id="email" value={data.email} onChange={e => setData('email', e.target.value)} placeholder="Email address" type="email" />
                                    {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                                </div>
                                <div className="md:col-span-2">
                                    <Label htmlFor="address">Address</Label>
                                    <textarea id="address" value={data.address} onChange={e => setData('address', e.target.value)} placeholder="Customer address" rows={3} className="w-full border rounded px-3 py-2" />
                                    {errors.address && <p className="text-red-500 text-sm mt-1">{errors.address}</p>}
                                </div>
                                <div>
                                    <Label htmlFor="status">Status *</Label>
                                    <select value={data.status} onChange={e => setData('status', e.target.value)} className="w-full border rounded px-3 py-2">
                                        <option value="active">Active</option>
                                        <option value="inactive">Inactive</option>
                                    </select>
                                    {errors.status && <p className="text-red-500 text-sm mt-1">{errors.status}</p>}
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <Button type="submit" disabled={processing}>Update Customer</Button>
                                <Link href="/customers"><Button variant="outline">Cancel</Button></Link>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}

