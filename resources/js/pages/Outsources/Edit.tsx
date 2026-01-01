import { FormPageLayout } from '@/components/forms/form-page-layout';
import { FormSection } from '@/components/forms/form-section';
import { FormField } from '@/components/forms/form-field';
import { FormActionsBar } from '@/components/forms/form-actions-bar';
import { UnsavedChangesBadge } from '@/components/forms/unsaved-changes-badge';
import { ScrollToTopFab } from '@/components/forms/scroll-to-top-fab';
import { useCallback, useEffect, useMemo, useState, type FormEventHandler } from 'react';
import { Link, router, useForm } from '@inertiajs/react';
import { type BreadcrumbItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { DeleteConfirmationDialog } from '@/components/delete-confirmation-dialog';
import { useToast } from '@/hooks/use-toast';
import { validateOutsource, type ValidationErrors } from '@/lib/validation';
import { AlertCircle, Building2, CheckCircle, MapPin, Phone, Trash2, UserCircle2 } from 'lucide-react';
import { usePermissions } from '@/hooks/use-permissions';

type Option = {
  label: string;
  value: string;
};

interface OutsourceResource {
  id: number;
  name: string;
  contact_person: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  service_type: string | null;
  status: string | null;
}

interface OutsourcesEditProps {
  outsource: OutsourceResource;
  statusOptions?: Option[];
  serviceTypeOptions?: Option[];
}

type OutsourceFormData = {
  name: string;
  contact_person: string;
  phone: string;
  email: string;
  address: string;
  service_type: string;
  status: string;
};

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function OutsourcesEdit({ outsource, statusOptions, serviceTypeOptions }: OutsourcesEditProps) {
  const { hasPermission } = usePermissions();
  const { toast } = useToast();
  const breadcrumbs = useMemo<BreadcrumbItem[]>(
    () => [
      { title: 'Outsourcing', href: '/outsources' },
      { title: outsource.name || `Vendor ${outsource.id}`, href: `/outsources/${outsource.id}` },
      { title: 'Edit', href: `/outsources/${outsource.id}/edit` },
    ],
    [outsource.id, outsource.name],
  );

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

  const initialStatus = outsource.status ?? resolvedStatusOptions[0]?.value ?? 'active';

  const { data, setData, put, processing, errors, transform } = useForm<OutsourceFormData>({
    name: outsource.name ?? '',
    contact_person: outsource.contact_person ?? '',
    phone: outsource.phone ?? '',
    email: outsource.email ?? '',
    address: outsource.address ?? '',
    service_type: outsource.service_type ?? '',
    status: initialStatus,
  });

  const [frontendErrors, setFrontendErrors] = useState<ValidationErrors>({});
  const [isDirty, setIsDirty] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

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
        description: 'Some fields need your attention before saving.',
      });
      return;
    }

    transform(() => trimmedData);

    put(`/outsources/${outsource.id}`, {
      preserveScroll: true,
      onSuccess: () => {
        setFrontendErrors({});
        setIsDirty(false);
        toast({
          title: '✅ Vendor Updated',
          description: 'The vendor record has been saved successfully.',
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

  const getFieldError = useCallback((field: keyof OutsourceFormData | 'email' | 'status') => errors[field] || frontendErrors[field] || '', [errors, frontendErrors]);

  const generalErrorValue = (errors as Record<string, string | string[] | undefined>).error;
  const generalError = Array.isArray(generalErrorValue) ? generalErrorValue.join('\n') : generalErrorValue ?? '';

  const handleDeleteConfirm = () => {
    setIsDeleting(true);
    router.delete(`/outsources/${outsource.id}`, {
      preserveScroll: true,
      onSuccess: () => {
        setDeleteDialogOpen(false);
        setIsDeleting(false);
        toast({
          title: '✅ Vendor Deleted',
          description: 'The vendor was deleted successfully.',
        });
      },
      onError: errors => {
        setIsDeleting(false);
        const errorMessage = errors && typeof errors === 'object' && 'message' in errors ? String(errors.message) : 'Failed to delete vendor. Please try again.';
        toast({
          title: '❌ Delete Failed',
          description: errorMessage,
          variant: 'destructive',
        });
      },
    });
  };

  const canDelete = hasPermission('outsources.destroy');
  const canUpdate = hasPermission('outsources.update');

  return (
    <>
      <FormPageLayout
        title={`Edit ${outsource.name}`}
        headTitle={`Edit ${outsource.name}`}
        description="Update onboarding, contact, and service information for this outsource partner."
        breadcrumbs={breadcrumbs}
        icon={<Building2 className="h-5 w-5" />}
        headerAside={
          <div className="flex items-center gap-2">
            {isDirty && <UnsavedChangesBadge />}
            {canDelete && (
              <Button type="button" variant="destructive" size="sm" onClick={() => setDeleteDialogOpen(true)}>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            )}
          </div>
        }
      >
        <form onSubmit={submit} className="flex flex-1 flex-col gap-6 overflow-y-auto p-6 pb-24" noValidate>
          {generalError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{generalError}</AlertDescription>
            </Alert>
          )}

          <FormSection title="Vendor Identity" description="Keep these attributes current so dispatch analytics remain accurate." icon={<UserCircle2 className="h-4 w-4" />}>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <FormField label="Vendor Name" required error={getFieldError('name')}>
                <Input id="name" type="text" value={data.name} onChange={event => handleFieldChange('name', event.target.value)} placeholder="e.g., Horizon Freight PLC" />
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

            <FormField label="Service Type" hint={resolvedServiceTypes.length > 0 ? 'Tap a chip below to reuse a common service category.' : undefined}>
              <Input
                id="service_type"
                type="text"
                value={data.service_type}
                onChange={event => handleFieldChange('service_type', event.target.value)}
                placeholder="e.g., Long-haul transport"
              />
              {resolvedServiceTypes.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {resolvedServiceTypes.map(option => (
                    <Badge key={option.value} variant={option.value === data.service_type ? 'default' : 'outline'} className="cursor-pointer" onClick={() => handleFieldChange('service_type', option.value)}>
                      {option.label}
                    </Badge>
                  ))}
                </div>
              )}
            </FormField>
          </FormSection>

          <FormSection title="Contact Details" description="Provide up-to-date contacts for coordination and escalation." icon={<Phone className="h-4 w-4" />}>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <FormField label="Primary Contact" required error={getFieldError('contact_person')}>
                <Input id="contact_person" type="text" value={data.contact_person} onChange={event => handleFieldChange('contact_person', event.target.value)} placeholder="e.g., Meron Bekele" />
              </FormField>

              <FormField label="Phone Number" error={getFieldError('phone')}>
                <Input id="phone" type="tel" value={data.phone} onChange={event => handleFieldChange('phone', event.target.value)} placeholder="e.g., +251 911 123 456" />
              </FormField>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <FormField label="Email" error={getFieldError('email')}>
                <Input id="email" type="email" value={data.email} onChange={event => handleFieldChange('email', event.target.value)} placeholder="e.g., ops@horizonfreight.com" />
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
          </FormSection>

          <FormSection title="Quick Hints" description={resolvedServiceTypes.length === 0 ? 'Service categories will appear here automatically once at least one vendor shares them.' : 'Matching service labels help align performance analytics and comparison dashboards.'} icon={<MapPin className="h-4 w-4" />} />
        </form>

        <FormActionsBar>
          <Button type="button" variant="outline" asChild>
            <Link href={`/outsources/${outsource.id}`}>Cancel</Link>
          </Button>
          <Button type="submit" disabled={!canUpdate || processing || Object.keys(frontendErrors).length > 0 || Boolean(Object.keys(errors).length > 0)} onClick={submit}>
            {processing ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-white" />
                Saving...
              </>
            ) : (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
        </FormActionsBar>

        <ScrollToTopFab />
      </FormPageLayout>

      <DeleteConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete vendor?"
        description="This action will permanently remove the vendor and historical analytics will exclude it going forward."
        onConfirm={handleDeleteConfirm}
        isLoading={isDeleting}
      />
    </>
  );
}
