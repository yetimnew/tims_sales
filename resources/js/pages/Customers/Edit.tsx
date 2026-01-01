import { FormPageLayout } from '@/components/forms/form-page-layout';
import { FormSection } from '@/components/forms/form-section';
import { FormField } from '@/components/forms/form-field';
import { FormActionsBar } from '@/components/forms/form-actions-bar';
import { UnsavedChangesBadge } from '@/components/forms/unsaved-changes-badge';
import { ScrollToTopFab } from '@/components/forms/scroll-to-top-fab';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Link, useForm } from '@inertiajs/react';
import { type BreadcrumbItem } from '@/types';
import { useState } from 'react';
import { Building2, CheckCircle, Phone, UserCircle } from 'lucide-react';

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
  const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Customers', href: '/customers' },
    { title: 'Edit', href: '#' },
  ];

  const { data, setData, put, processing, errors } = useForm({
    name: customer.name,
    contact_person: customer.contact_person || '',
    phone: customer.phone || '',
    email: customer.email || '',
    address: customer.address || '',
    status: customer.status,
  });

  const [isDirty, setIsDirty] = useState(false);

  const handleFieldChange = (field: string, value: string) => {
    setData(field as any, value);
    setIsDirty(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    put(`/customers/${customer.id}`, {
      preserveScroll: true,
      onSuccess: () => {
        setIsDirty(false);
      },
    });
  };

  return (
    <FormPageLayout
      title="Edit Customer"
      headTitle={`Edit Customer: ${customer.name}`}
      description={`Update ${customer.name}`}
      breadcrumbs={breadcrumbs}
      icon={<Building2 className="h-5 w-5" />}
      headerAside={isDirty && <UnsavedChangesBadge />}
    >
      <form onSubmit={handleSubmit} className="flex flex-1 flex-col gap-6 overflow-y-auto p-6 pb-24" noValidate>
        <FormSection title="Customer Information" description="Update customer details" icon={<UserCircle className="h-4 w-4" />}>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <FormField label="Customer Name" required error={errors.name}>
              <Input id="name" value={data.name} onChange={e => handleFieldChange('name', e.target.value)} placeholder="Customer name" />
            </FormField>

            <FormField label="Contact Person" error={errors.contact_person}>
              <Input id="contact_person" value={data.contact_person} onChange={e => handleFieldChange('contact_person', e.target.value)} placeholder="Contact person name" />
            </FormField>

            <FormField label="Phone Number" error={errors.phone}>
              <Input id="phone" value={data.phone} onChange={e => handleFieldChange('phone', e.target.value)} placeholder="Phone number" type="tel" />
            </FormField>

            <FormField label="Email Address" error={errors.email}>
              <Input id="email" value={data.email} onChange={e => handleFieldChange('email', e.target.value)} placeholder="Email address" type="email" />
            </FormField>

            <FormField label="Status" required error={errors.status}>
              <Select value={data.status} onValueChange={value => handleFieldChange('status', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </FormField>

            <div className="md:col-span-2">
              <FormField label="Address" error={errors.address}>
                <Textarea id="address" value={data.address} onChange={e => handleFieldChange('address', e.target.value)} placeholder="Customer address" rows={3} />
              </FormField>
            </div>
          </div>
        </FormSection>
      </form>

      <FormActionsBar>
        <Button type="button" variant="outline" asChild>
          <Link href="/customers">Cancel</Link>
        </Button>
        <Button type="submit" disabled={processing} onClick={handleSubmit}>
          {processing ? (
            <>
              <div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-white" />
              Updating...
            </>
          ) : (
            <>
              <CheckCircle className="mr-2 h-4 w-4" />
              Update Customer
            </>
          )}
        </Button>
      </FormActionsBar>

      <ScrollToTopFab />
    </FormPageLayout>
  );
}
