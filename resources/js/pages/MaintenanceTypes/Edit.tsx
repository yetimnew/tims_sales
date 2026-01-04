import { FormPageLayout } from '@/components/forms/form-page-layout';
import { FormSection } from '@/components/forms/form-section';
import { FormField } from '@/components/forms/form-field';
import { FormActionsBar } from '@/components/forms/form-actions-bar';
import { UnsavedChangesBadge } from '@/components/forms/unsaved-changes-badge';
import { ScrollToTopFab } from '@/components/forms/scroll-to-top-fab';
import { FormEventHandler, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useForm } from '@inertiajs/react';
import { type BreadcrumbItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, BadgeCheck, CheckCircle, ClipboardEdit, Info } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { validateMaintenanceType, type ValidationErrors } from '@/lib/validation';

type MaintenanceTypeResource = {
  id: number;
  name: string;
  category: string;
  interval_km: number | null;
  interval_months: number | null;
  estimated_cost: number | null;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

type MaintenanceTypeFormData = {
  name: string;
  category: string;
  interval_km: string;
  interval_months: string;
  estimated_cost: string;
  description: string;
  is_active: boolean;
};

type MaintenanceTypesEditProps = {
  maintenanceType: MaintenanceTypeResource;
};

const categoryOptions = ['Preventive', 'Corrective', 'Emergency'] as const;

export default function MaintenanceTypesEdit({ maintenanceType }: MaintenanceTypesEditProps) {
  const breadcrumbs: BreadcrumbItem[] = useMemo(
    () => [
      { title: 'Maintenance Types', href: '/maintenance-types' },
      { title: maintenanceType.name, href: `/maintenance-types/${maintenanceType.id}` },
      { title: 'Edit', href: `/maintenance-types/${maintenanceType.id}/edit` },
    ],
    [maintenanceType.id, maintenanceType.name],
  );

  const initialFormData: MaintenanceTypeFormData = {
    name: maintenanceType.name ?? '',
    category: maintenanceType.category ?? '',
    interval_km: maintenanceType.interval_km ? String(maintenanceType.interval_km) : '',
    interval_months: maintenanceType.interval_months ? String(maintenanceType.interval_months) : '',
    estimated_cost: maintenanceType.estimated_cost ? String(maintenanceType.estimated_cost) : '',
    description: maintenanceType.description ?? '',
    is_active: Boolean(maintenanceType.is_active),
  };

  const { data, setData, put, processing, errors } = useForm<MaintenanceTypeFormData>(initialFormData);
  const initialDataRef = useRef(initialFormData);

  const [frontendErrors, setFrontendErrors] = useState<ValidationErrors>({});
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    const backendMessages = Object.values(errors).filter((message): message is string => Boolean(message));
    if (backendMessages.length) {
      toast({
        title: '⚠️ Validation Error',
        description: backendMessages.join(', '),
        variant: 'destructive',
      });
    }
  }, [errors]);

  const syncValidation = (draft: MaintenanceTypeFormData) => {
    const nextErrors = validateMaintenanceType(draft);
    setFrontendErrors(nextErrors);
  };

  const sanitizeValue = <K extends keyof MaintenanceTypeFormData>(field: K, value: MaintenanceTypeFormData[K] | string): MaintenanceTypeFormData[K] => {
    if (typeof value !== 'string') {
      return value as MaintenanceTypeFormData[K];
    }
    let sanitized = value;
    if (field === 'interval_km' || field === 'interval_months') {
      sanitized = value.replace(/[^0-9]/g, '');
    } else if (field === 'estimated_cost') {
      sanitized = value.replace(/[^0-9.]/g, '');
    }
    return sanitized as MaintenanceTypeFormData[K];
  };

  const evaluateDirty = (draft: MaintenanceTypeFormData) => {
    return (Object.keys(draft) as Array<keyof MaintenanceTypeFormData>).some(key => draft[key] !== initialDataRef.current[key]);
  };

  const handleFieldChange = <K extends keyof MaintenanceTypeFormData>(field: K, value: MaintenanceTypeFormData[K] | string) => {
    const sanitized = sanitizeValue(field, value);
    setData(field, sanitized);
    const draft = { ...data, [field]: sanitized } as MaintenanceTypeFormData;
    syncValidation(draft);
    setIsDirty(evaluateDirty(draft));
  };

  const submit: FormEventHandler = event => {
    event.preventDefault();
    const allErrors = validateMaintenanceType(data);
    if (Object.keys(allErrors).length) {
      setFrontendErrors(allErrors);
      toast({
        title: '⚠️ Validation Error',
        description: 'Please resolve the highlighted fields before saving.',
        variant: 'destructive',
      });
      return;
    }

    put(`/maintenance-types/${maintenanceType.id}`, {
      preserveScroll: true,
      onSuccess: () => {
        toast({
          title: '✅ Maintenance Type Updated',
          description: `${data.name} has been updated successfully.`,
        });
        initialDataRef.current = { ...data };
        setFrontendErrors({});
        setIsDirty(false);
      },
      onError: serverErrors => {
        setFrontendErrors(prev => ({ ...prev, ...serverErrors }));
      },
    });
  };

  const getFieldError = (field: keyof MaintenanceTypeFormData) => {
    const frontendError = frontendErrors[field];
    const backendError = errors[field];
    return (typeof frontendError === 'string' && frontendError) || (typeof backendError === 'string' && backendError) || '';
  };

  const hasErrors = Object.values(frontendErrors).some(Boolean) || Object.values(errors).some(Boolean);

  return (
    <FormPageLayout
      title="Edit Maintenance Type"
      headTitle={`Edit ${maintenanceType.name}`}
      description="Keep maintenance categories aligned with the updated backend rules."
      breadcrumbs={breadcrumbs}
      icon={<ClipboardEdit className="h-5 w-5" />}
      headerAside={
        <div className="flex items-center gap-2">
          {isDirty && <UnsavedChangesBadge />}
          <div className="flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1.5 text-sm font-medium text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400">
            <BadgeCheck className="h-4 w-4" />
            {data.is_active ? 'Active' : 'Inactive'}
          </div>
        </div>
      }
    >
      <form onSubmit={submit} className="flex flex-1 flex-col gap-6 overflow-y-auto p-6 pb-24" noValidate>
        {hasErrors && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>Please resolve the highlighted fields before submitting the form.</AlertDescription>
          </Alert>
        )}

        <FormSection title="Maintenance Type Details" description="Update the essentials and optional scheduling hints." icon={<Info className="h-4 w-4" />}>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <FormField label="Name" required error={getFieldError('name')}>
              <Input id="name" type="text" value={data.name} onChange={event => handleFieldChange('name', event.target.value)} placeholder="e.g. Oil Change, Brake Inspection" />
            </FormField>

            <FormField label="Category" required error={getFieldError('category')}>
              <Select value={data.category} onValueChange={value => handleFieldChange('category', value)}>
                <SelectTrigger className={getFieldError('category') ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categoryOptions.map(option => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <FormField label="Interval (KM)" error={getFieldError('interval_km')}>
              <Input id="interval_km" inputMode="numeric" value={data.interval_km} onChange={event => handleFieldChange('interval_km', event.target.value)} placeholder="e.g. 5000" />
            </FormField>

            <FormField label="Interval (Months)" error={getFieldError('interval_months')}>
              <Input id="interval_months" inputMode="numeric" value={data.interval_months} onChange={event => handleFieldChange('interval_months', event.target.value)} placeholder="e.g. 6" />
            </FormField>

            <FormField label="Estimated Cost" error={getFieldError('estimated_cost')}>
              <Input id="estimated_cost" inputMode="decimal" value={data.estimated_cost} onChange={event => handleFieldChange('estimated_cost', event.target.value)} placeholder="e.g. 150.00" />
            </FormField>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <FormField label="Description" error={getFieldError('description')}>
              <Textarea id="description" value={data.description} onChange={event => handleFieldChange('description', event.target.value)} placeholder="Add procedure highlights and parts covered." rows={4} className="resize-none" />
            </FormField>

            <FormField label="Status" error={getFieldError('is_active')}>
              <Select value={String(data.is_active)} onValueChange={value => handleFieldChange('is_active', value === 'true')}>
                <SelectTrigger className={getFieldError('is_active') ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Active</SelectItem>
                  <SelectItem value="false">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </FormField>
          </div>
        </FormSection>
      </form>

      <FormActionsBar>
        <Button type="button" variant="outline" asChild>
          <Link href="/maintenance-types">Cancel</Link>
        </Button>
        <Button type="submit" disabled={processing || hasErrors || !isDirty} onClick={submit}>
          {processing ? (
            <>
              <div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-white" />
              Saving...
            </>
          ) : (
            <>
              <CheckCircle className="mr-2 h-4 w-4" />
              Update Maintenance Type
            </>
          )}
        </Button>
      </FormActionsBar>

      <ScrollToTopFab />
    </FormPageLayout>
  );
}
