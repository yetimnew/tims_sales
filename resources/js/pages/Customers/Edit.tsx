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
import { useState, useRef, useEffect, useMemo } from 'react';
import { Building2, CheckCircle, Phone, UserCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation();
  const breadcrumbs = useMemo<BreadcrumbItem[]>(
    () => [
      { title: t('customers.breadcrumb'), href: '/customers' },
      { title: t('customers.form.edit.breadcrumb'), href: '#' },
    ],
    [t],
  );

  const { data, setData, put, processing, errors } = useForm({
    name: customer.name,
    contact_person: customer.contact_person || '',
    phone: customer.phone || '',
    email: customer.email || '',
    address: customer.address || '',
    status: customer.status,
  });

  const [isDirty, setIsDirty] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    const form = formRef.current;
    if (!form) return;

    const handleScroll = () => {
      setShowScrollTop(form.scrollTop > 300);
    };

    form.addEventListener('scroll', handleScroll);
    return () => form.removeEventListener('scroll', handleScroll);
  }, []);

  const handleScrollToTop = () => {
    formRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

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
      title={t('customers.form.edit.title')}
      headTitle={t('customers.form.edit.headTitle', { name: customer.name })}
      description={t('customers.form.edit.description', { name: customer.name })}
      breadcrumbs={breadcrumbs}
      icon={<Building2 className="h-5 w-5" />}
      headerAside={isDirty && <UnsavedChangesBadge />}
    >
      <form ref={formRef} onSubmit={handleSubmit} className="flex flex-1 flex-col gap-6 overflow-y-auto p-6 pb-24" noValidate>
        <FormSection title={t('customers.form.sections.profile.title')} description={t('customers.form.sections.profile.descriptionEdit')} icon={<UserCircle className="h-4 w-4" />}>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <FormField id="name" label={t('customers.form.fields.name.label')} required error={errors.name}>
              <Input id="name" value={data.name} onChange={e => handleFieldChange('name', e.target.value)} placeholder={t('customers.form.fields.name.placeholder')} />
            </FormField>

            <FormField id="contact_person" label={t('customers.form.fields.contactPerson.label')} error={errors.contact_person}>
              <Input id="contact_person" value={data.contact_person} onChange={e => handleFieldChange('contact_person', e.target.value)} placeholder={t('customers.form.fields.contactPerson.placeholder')} />
            </FormField>

            <FormField id="phone" label={t('customers.form.fields.phone.label')} error={errors.phone}>
              <Input id="phone" value={data.phone} onChange={e => handleFieldChange('phone', e.target.value)} placeholder={t('customers.form.fields.phone.placeholder')} type="tel" />
            </FormField>

            <FormField id="email" label={t('customers.form.fields.email.label')} error={errors.email}>
              <Input id="email" value={data.email} onChange={e => handleFieldChange('email', e.target.value)} placeholder={t('customers.form.fields.email.placeholder')} type="email" />
            </FormField>

            <FormField id="status" label={t('customers.form.fields.status.label')} required error={errors.status}>
              <Select value={data.status} onValueChange={value => handleFieldChange('status', value)}>
                <SelectTrigger>
                  <SelectValue placeholder={t('customers.form.fields.status.placeholder')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">{t('customers.status.active')}</SelectItem>
                  <SelectItem value="inactive">{t('customers.status.inactive')}</SelectItem>
                </SelectContent>
              </Select>
            </FormField>

            <div className="md:col-span-2">
              <FormField id="address" label={t('customers.form.fields.address.label')} error={errors.address}>
                <Textarea id="address" value={data.address} onChange={e => handleFieldChange('address', e.target.value)} placeholder={t('customers.form.fields.address.placeholder')} rows={3} />
              </FormField>
            </div>
          </div>
        </FormSection>
      </form>

      <FormActionsBar
        left={
          <Button type="button" variant="outline" asChild>
            <Link href="/customers">{t('customers.actions.cancel')}</Link>
          </Button>
        }
        right={
          <Button type="submit" disabled={processing} onClick={handleSubmit}>
            {processing ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-white" />
                {t('customers.form.edit.submitting')}
              </>
            ) : (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                {t('customers.form.edit.submit')}
              </>
            )}
          </Button>
        }
      />

      <ScrollToTopFab visible={showScrollTop} onClick={handleScrollToTop} />
    </FormPageLayout>
  );
}
