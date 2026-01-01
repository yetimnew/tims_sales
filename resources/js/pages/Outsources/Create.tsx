import { FormPageLayout } from '@/components/forms/form-page-layout';
import { FormSection } from '@/components/forms/form-section';
import { FormField } from '@/components/forms/form-field';
import { FormActionsBar } from '@/components/forms/form-actions-bar';
import { UnsavedChangesBadge } from '@/components/forms/unsaved-changes-badge';
import { ScrollToTopFab } from '@/components/forms/scroll-to-top-fab';
import { useCallback, useEffect, useMemo, useState, type FormEventHandler } from 'react';
import { Link, useForm } from '@inertiajs/react';
import { type BreadcrumbItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { validateOutsource, type ValidationErrors } from '@/lib/validation';
import { useToast } from '@/hooks/use-toast';
import { AlertCircle, Building2, CheckCircle, MapPin, Phone, UserCircle2 } from 'lucide-react';

type Option = {
  label: string;
  value: string;
};

type OutsourceFormData = {
  name: string;
  contact_person: string;
  phone: string;
  email: string;
  address: string;
  service_type: string;
  status: string;
};

type OutsourcesCreateProps = {
  statusOptions?: Option[];
  serviceTypeOptions?: Option[];
};

const breadcrumbs: BreadcrumbItem[] = [
  { title: 'Outsourcing', href: '/outsources' },
  { title: 'Create', href: '/outsources/create' },
];

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function OutsourcesCreate({ statusOptions, serviceTypeOptions }: OutsourcesCreateProps) {
  const resolvedStatusOptions = useMemo<Option[]>(
    () =>
      statusOptions?.length
        ? statusOptions
        : [
            { label: 'Active', value: 'active' },
            { label: 'Inactive', value: 'inactive' },
          ],
    [statusOptions],
  );

  const resolvedServiceTypes = useMemo<Option[]>(() => (serviceTypeOptions?.length ? serviceTypeOptions : []), [serviceTypeOptions]);

  const defaultStatus = resolvedStatusOptions[0]?.value ?? 'active';

  const { toast } = useToast();

  const { data, setData, post, processing, errors, reset, transform, recentlySuccessful } = useForm<OutsourceFormData>({
    name: '',
    contact_person: '',
    phone: '',
    email: '',
    address: '',
    service_type: '',
    status: defaultStatus,
  });

  const [frontendErrors, setFrontendErrors] = useState<ValidationErrors>({});
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    if (Object.keys(errors).length === 0) {
      return;
    }

    const backendMessages = Object.values(errors)
      .flat()
      .map(message => (Array.isArray(message) ? message.join(', ') : String(message)));

    if (backendMessages.length > 0) {
      toast({
        variant: 'destructive',
        title: 'Validation error',
        description: backendMessages.join('\n'),
      });
    }
  }, [errors, toast]);

  const setFieldError = useCallback((field: keyof OutsourceFormData | 'email' | 'status', message: string) => {
    setFrontendErrors(previous => {
      const next = { ...previous };
      if (message) {
        next[field] = message;
      } else {
        delete next[field];
      }

      return next;
    });
  }, []);

  const validateField = useCallback(
    (field: keyof OutsourceFormData, value: string) => {
      const nextValues: OutsourceFormData = { ...data, [field]: value } as OutsourceFormData;
      const fieldErrors = validateOutsource(nextValues);

      if (field === 'email' && value && !emailRegex.test(value)) {
        fieldErrors.email = 'Please enter a valid email address.';
      }

      if (field === 'status' && !value) {
        fieldErrors.status = 'Status is required.';
      }

      if (field === 'service_type' && value.length > 255) {
        fieldErrors.service_type = 'Service type cannot exceed 255 characters.';
      }

      if (field === 'address' && value.length > 500) {
        fieldErrors.address = 'Address cannot exceed 500 characters.';
      }

      setFieldError(field, fieldErrors[field] ?? '');
    },
    [data, setFieldError],
  );

  const handleFieldChange = useCallback(
    (field: keyof OutsourceFormData, value: string) => {
      setData(field, value);
      validateField(field, value);
      setIsDirty(true);
    },
    [setData, validateField],
  );

  const submit: FormEventHandler = event => {
    event.preventDefault();

    const trimmedData: OutsourceFormData = {
      ...data,
      name: data.name.trim(),
      contact_person: data.contact_person.trim(),
      phone: data.phone.trim(),
      email: data.email.trim(),
      address: data.address.trim(),
      service_type: data.service_type.trim(),
      status: data.status.trim(),
    };

    const validationResults: ValidationErrors = validateOutsource(trimmedData);

    if (trimmedData.email && !emailRegex.test(trimmedData.email)) {
      validationResults.email = 'Please enter a valid email address.';
    }

    if (!trimmedData.status) {
      validationResults.status = 'Status is required.';
    }

    if (trimmedData.service_type && trimmedData.service_type.length > 255) {
      validationResults.service_type = 'Service type cannot exceed 255 characters.';
    }

    if (trimmedData.address && trimmedData.address.length > 500) {
      validationResults.address = 'Address cannot exceed 500 characters.';
    }

    if (Object.keys(validationResults).length > 0) {
      setFrontendErrors(validationResults);
      toast({
        variant: 'destructive',
        title: 'Please review the form',
        description: 'Some fields need your attention before submission.',
      });
      return;
    }

    transform(() => trimmedData);

    post('/outsources', {
      preserveScroll: true,
      onSuccess: () => {
        setFrontendErrors({});
        setIsDirty(false);
        reset();
        transform(data => data);
        toast({
          title: '✅ Outsource Created',
          description: 'The vendor has been registered successfully.',
        });
      },
      onError: () => {
        transform(data => data);
      },
      onFinish: () => {
        transform(data => data);
      },
    });
  };

  const getFieldError = useCallback(
    (field: keyof OutsourceFormData | 'email' | 'status') => {
      return errors[field] || frontendErrors[field] || '';
    },
    [errors, frontendErrors],
  );

  const generalError = errors.error ? String(errors.error) : '';

  return (
    <FormPageLayout
      title="Register Outsource Partner"
      headTitle="Register Outsource"
      description="Capture vendor contacts, service specialisations, and onboarding status in one streamlined intake."
      breadcrumbs={breadcrumbs}
      icon={<Building2 className="h-5 w-5" />}
      headerAside={isDirty && <UnsavedChangesBadge />}
    >
      <form onSubmit={submit} className="flex flex-1 flex-col gap-6 overflow-y-auto p-6 pb-24" noValidate>
        {generalError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{generalError}</AlertDescription>
          </Alert>
        )}

        <FormSection
          title="Vendor Identity"
          description="Define how this partner will appear across analytics and dispatch tools."
          icon={<UserCircle2 className="h-4 w-4" />}
        >
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <FormField label="Vendor Name" required error={getFieldError('name')}>
                <Input
                  id="name"
                  type="text"
                  value={data.name}
                  onChange={event => handleFieldChange('name', event.target.value)}
                  placeholder="e.g., Horizon Freight PLC"
                />
              </FormField>

              <FormField label="Status" required error={getFieldError('status')}>
                <Select value={data.status} onValueChange={value => handleFieldChange('status', value)}>
                  <SelectTrigger className={getFieldError('status') ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {resolvedStatusOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>
            </div>

            <div className="space-y-2">
              <FormField label="Service Type" error={getFieldError('service_type')}>
                <Input
                  id="service_type"
                  type="text"
                  value={data.service_type}
                  onChange={event => handleFieldChange('service_type', event.target.value)}
                  placeholder="e.g., Long-haul transport"
                />
              </FormField>
              {resolvedServiceTypes.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {resolvedServiceTypes.map(option => (
                    <Badge
                      key={option.value}
                      variant={option.value === data.service_type ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => handleFieldChange('service_type', option.value)}
                    >
                      {option.label}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
        </FormSection>

        <FormSection
          title="Contact Details"
          description="Provide direct contacts so dispatch and finance teams can coordinate quickly."
          icon={<Phone className="h-4 w-4" />}
        >
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <FormField label="Primary Contact" required error={getFieldError('contact_person')}>
                <Input
                  id="contact_person"
                  type="text"
                  value={data.contact_person}
                  onChange={event => handleFieldChange('contact_person', event.target.value)}
                  placeholder="e.g., Meron Bekele"
                />
              </FormField>

              <FormField label="Phone Number" error={getFieldError('phone')}>
                <Input
                  id="phone"
                  type="tel"
                  value={data.phone}
                  onChange={event => handleFieldChange('phone', event.target.value)}
                  placeholder="e.g., +251 911 123 456"
                />
              </FormField>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <FormField label="Email" error={getFieldError('email')}>
                <Input
                  id="email"
                  type="email"
                  value={data.email}
                  onChange={event => handleFieldChange('email', event.target.value)}
                  placeholder="e.g., ops@horizonfreight.com"
                />
              </FormField>

              <FormField label="Head Office / Dispatch Address">
                <Textarea
                  id="address"
                  value={data.address}
                  onChange={event => handleFieldChange('address', event.target.value)}
                  placeholder="Include key directions or branch details for field teams"
                  className="min-h-[96px]"
                />
              </FormField>
            </div>
          </div>
        </FormSection>

        <FormSection
          title="Quick Hints"
          description="Select a suggested service type or keep the field blank to define a custom specialization."
          icon={<MapPin className="h-4 w-4" />}
        >
          {resolvedServiceTypes.length === 0 ? (
            <p className="text-sm text-muted-foreground">We will surface existing service type suggestions here once vendors are registered.</p>
          ) : (
            <p className="text-sm text-muted-foreground">
              Click a chip in the section above to auto-fill common service categories such as{' '}
              {resolvedServiceTypes
                .slice(0, 3)
                .map(option => option.label)
                .join(', ')}
              .
            </p>
          )}
        </FormSection>
      </form>

      <FormActionsBar>
        <Button type="button" variant="outline" asChild>
          <Link href="/outsources">Cancel</Link>
        </Button>
        <Button
          type="submit"
          disabled={processing || Object.keys(frontendErrors).length > 0 || Boolean(Object.keys(errors).length > 0)}
          onClick={submit}
        >
          {processing ? (
            <>
              <div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-white" />
              Saving...
            </>
          ) : (
            <>
              <CheckCircle className="mr-2 h-4 w-4" />
              Create Vendor
            </>
          )}
        </Button>
      </FormActionsBar>

      <ScrollToTopFab />
    </FormPageLayout>
  );
}
