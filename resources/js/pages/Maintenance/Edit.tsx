import { FormPageLayout } from '@/components/forms/form-page-layout';
import { FormSection } from '@/components/forms/form-section';
import { FormField } from '@/components/forms/form-field';
import { FormActionsBar } from '@/components/forms/form-actions-bar';
import { UnsavedChangesBadge } from '@/components/forms/unsaved-changes-badge';
import { ScrollToTopFab } from '@/components/forms/scroll-to-top-fab';
import { useEffect, useMemo, useState, useTransition, type FormEventHandler } from 'react';
import { Link, useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { maintenanceValidation } from '@/lib/validation';
import { type BreadcrumbItem } from '@/types';
import { AlertCircle, CalendarCheck, ClipboardList, Info, RefreshCcw, Sparkles, Truck, Wrench } from 'lucide-react';

const UNASSIGNED_MECHANIC_VALUE = '__unassigned__';

type MaintenanceStatus = 'scheduled' | 'in_progress' | 'completed' | 'overdue';

interface TruckOption {
  id: number;
  plate: string;
}

interface MaintenanceTypeOption {
  id: number;
  name: string;
  category?: string | null;
}

interface MechanicOption {
  id: number;
  name: string;
  email?: string | null;
}

interface StatusOption {
  value: MaintenanceStatus;
  label: string;
}

interface MaintenanceRecord {
  id: number;
  truck_id: number;
  maintenance_type_id: number;
  scheduled_date: string;
  completed_date?: string | null;
  status: MaintenanceStatus;
  odometer_reading?: number | null;
  cost?: number | string | null;
  description?: string | null;
  work_performed?: string | null;
  parts_replaced?: string | null;
  service_provider?: string | null;
  assigned_mechanic_id?: number | string | null;
}

interface MaintenanceEditProps {
  maintenance: MaintenanceRecord;
  trucks: TruckOption[];
  maintenanceTypes: MaintenanceTypeOption[];
  mechanics: MechanicOption[];
  statusOptions: StatusOption[];
}

const fallbackStatusOptions: StatusOption[] = [
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'overdue', label: 'Overdue' },
];

type MaintenanceField = 'truck_id' | 'maintenance_type_id' | 'scheduled_date' | 'status';

const buildFormState = (record: MaintenanceRecord) => ({
  truck_id: record.truck_id ? record.truck_id.toString() : '',
  maintenance_type_id: record.maintenance_type_id ? record.maintenance_type_id.toString() : '',
  scheduled_date: record.scheduled_date ?? '',
  completed_date: record.completed_date ?? '',
  status: record.status,
  odometer_reading: record.odometer_reading ? record.odometer_reading.toString() : '',
  cost: record.cost !== null && record.cost !== undefined ? record.cost.toString() : '',
  description: record.description ?? '',
  work_performed: record.work_performed ?? '',
  parts_replaced: record.parts_replaced ?? '',
  service_provider: record.service_provider ?? '',
  assigned_mechanic_id: record.assigned_mechanic_id ? record.assigned_mechanic_id.toString() : '',
});

const completedDateMessage = (value: string, scheduledDate: string, status: MaintenanceStatus): string => {
  if (!value) {
    return status === 'completed' ? 'Completion date is required for completed maintenance.' : '';
  }

  if (scheduledDate) {
    const scheduled = new Date(scheduledDate);
    const completed = new Date(value);
    if (Number.isNaN(completed.getTime())) {
      return 'Completion date must be a valid date';
    }
    if (completed < scheduled) {
      return 'Completion date cannot precede the scheduled date';
    }
  }

  return '';
};

export default function MaintenanceEdit({ maintenance, trucks, maintenanceTypes, mechanics, statusOptions }: MaintenanceEditProps) {
  const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Maintenance', href: '/maintenance' },
    { title: 'Edit', href: '#' },
  ];

  const { toast } = useToast();
  const formDefaults = useMemo(() => buildFormState(maintenance), [maintenance]);
  const [, startTransition] = useTransition();
  const { data, setData, setDefaults, put, processing, errors } = useForm(formDefaults);

  const [frontendErrors, setFrontendErrors] = useState<Record<string, string>>({});
  const [isDirty, setIsDirty] = useState(false);
  const [truckSearch, setTruckSearch] = useState('');
  const [typeSearch, setTypeSearch] = useState('');

  const safeTrucks = useMemo(() => (Array.isArray(trucks) ? trucks : []), [trucks]);
  const safeTypes = useMemo(() => (Array.isArray(maintenanceTypes) ? maintenanceTypes : []), [maintenanceTypes]);
  const safeMechanics = useMemo(() => (Array.isArray(mechanics) ? mechanics : []), [mechanics]);
  const safeStatusOptions = useMemo(() => (Array.isArray(statusOptions) && statusOptions.length ? statusOptions : fallbackStatusOptions), [statusOptions]);

  const validators: Record<MaintenanceField, (value: string) => string> = useMemo(
    () => ({
      truck_id: maintenanceValidation.truck_id,
      maintenance_type_id: maintenanceValidation.maintenance_type_id,
      scheduled_date: (value: string) => {
        if (!value) return 'Scheduled date is required';
        return '';
      },
      status: maintenanceValidation.status,
    }),
    [],
  );

  const optionalValidators: Partial<Record<keyof typeof data, (value: string) => string>> = useMemo(
    () => ({
      cost: maintenanceValidation.cost,
      odometer_reading: maintenanceValidation.odometer_reading,
      assigned_mechanic_id: maintenanceValidation.assigned_mechanic_id,
      service_provider: maintenanceValidation.service_provider,
      work_performed: maintenanceValidation.work_performed,
      parts_replaced: maintenanceValidation.parts_replaced,
    }),
    [],
  );

  useEffect(() => {
    startTransition(() => {
      setData(formDefaults);
      setDefaults(formDefaults);
      setFrontendErrors({});
      setIsDirty(false);
    });
  }, [formDefaults, setData, setDefaults, startTransition]);

  useEffect(() => {
    const backendErrors = Object.values(errors)
      .filter(Boolean)
      .map(message => String(message));

    if (backendErrors.length) {
      toast({
        title: '⚠️ Validation Error',
        description: backendErrors.join(', '),
        variant: 'destructive',
      });
    }
  }, [errors, toast]);

  const setFieldErrorMessage = (field: keyof typeof data, message: string) => {
    setFrontendErrors(prev => {
      const next = { ...prev };
      if (message) {
        next[field] = message;
      } else {
        delete next[field];
      }
      return next;
    });
  };

  const validateField = (field: MaintenanceField, value: string) => {
    const message = validators[field](value);
    setFieldErrorMessage(field, message);
    return message;
  };

  const validateOptionalField = (field: keyof typeof data, value: string) => {
    const validator = optionalValidators[field];
    if (!validator) {
      setFieldErrorMessage(field, '');
      return '';
    }

    const message = validator(value);
    setFieldErrorMessage(field, message);
    return message;
  };

  const handleSelectChange = (field: MaintenanceField, value: string) => {
    setData(field, value);
    setIsDirty(true);
    validateField(field, value);

    if (field === 'status') {
      const resolvedMessage = completedDateMessage(data.completed_date, data.scheduled_date, value as MaintenanceStatus);
      setFieldErrorMessage('completed_date', resolvedMessage);
    }
  };

  const handleDateChange = (value: string) => {
    setData('scheduled_date', value);
    setIsDirty(true);
    validateField('scheduled_date', value);
    const resolvedMessage = completedDateMessage(data.completed_date, value, data.status);
    setFieldErrorMessage('completed_date', resolvedMessage);
  };

  const handleCompletedDateChange = (value: string) => {
    setData('completed_date', value);
    setIsDirty(true);
    const message = completedDateMessage(value, data.scheduled_date, data.status);
    setFieldErrorMessage('completed_date', message);
  };

  const handleInputChange = (field: keyof typeof data, value: string) => {
    setData(field, value);
    setIsDirty(true);
    validateOptionalField(field, value);
  };

  const filteredTrucks = useMemo(() => {
    if (!truckSearch.trim()) return safeTrucks;
    const query = truckSearch.toLowerCase();
    return safeTrucks.filter(truck => truck.plate?.toLowerCase().includes(query));
  }, [safeTrucks, truckSearch]);

  const filteredTypes = useMemo(() => {
    if (!typeSearch.trim()) return safeTypes;
    const query = typeSearch.toLowerCase();
    return safeTypes.filter(type => {
      const nameMatch = type.name?.toLowerCase().includes(query);
      const categoryMatch = type.category?.toLowerCase().includes(query) ?? false;
      return Boolean(nameMatch || categoryMatch);
    });
  }, [safeTypes, typeSearch]);

  const selectedTruck = useMemo(() => safeTrucks.find(truck => truck.id.toString() === data.truck_id) ?? null, [safeTrucks, data.truck_id]);

  const selectedType = useMemo(() => safeTypes.find(type => type.id.toString() === data.maintenance_type_id) ?? null, [safeTypes, data.maintenance_type_id]);

  const selectedMechanic = useMemo(() => safeMechanics.find(mechanic => mechanic.id.toString() === data.assigned_mechanic_id) ?? null, [safeMechanics, data.assigned_mechanic_id]);

  const statusLabel = useMemo(() => safeStatusOptions.find(option => option.value === data.status)?.label ?? data.status, [safeStatusOptions, data.status]);

  const scheduledDateLabel = useMemo(
    () =>
      data.scheduled_date
        ? new Date(data.scheduled_date).toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })
        : 'Not yet scheduled',
    [data.scheduled_date],
  );

  const hasFrontendErrors = Boolean(Object.keys(frontendErrors).length);
  const hasBackendErrors = Boolean(Object.keys(errors).length);
  const showValidationBanner = hasFrontendErrors || hasBackendErrors;

  const getFieldError = (field: keyof typeof data) => frontendErrors[field] || (errors[field] as string | undefined) || '';

  const submit: FormEventHandler<HTMLFormElement> = event => {
    event.preventDefault();

    const pendingErrors: Record<string, string> = {};

    (Object.keys(validators) as MaintenanceField[]).forEach(field => {
      const value = data[field];
      const message = validators[field](value);
      if (message) {
        pendingErrors[field] = message;
      }
    });

    Object.keys(optionalValidators).forEach(key => {
      const field = key as keyof typeof data;
      const validator = optionalValidators[field];
      if (!validator) return;
      const value = (data[field] ?? '') as string;
      const message = validator(value);
      if (message) {
        pendingErrors[field] = message;
      }
    });

    const completedMessageValue = completedDateMessage(data.completed_date, data.scheduled_date, data.status);
    if (completedMessageValue) {
      pendingErrors.completed_date = completedMessageValue;
    }

    if (Object.keys(pendingErrors).length) {
      setFrontendErrors(pendingErrors);
      toast({
        title: '⚠️ Validation Error',
        description: 'Please fix the highlighted fields before saving your changes.',
        variant: 'destructive',
      });
      return;
    }

    put(`/maintenance/${maintenance.id}`, {
      preserveScroll: true,
      onSuccess: () => {
        toast({
          title: '✅ Maintenance Record Updated',
          description: 'The maintenance record has been updated successfully.',
        });
        setFrontendErrors({});
        setIsDirty(false);
      },
      onError: () => {
        toast({
          title: 'Update failed',
          description: 'Unable to update maintenance. Review the errors and retry.',
          variant: 'destructive',
        });
      },
    });
  };

  return (
    <FormPageLayout
      title="Update Maintenance"
      headTitle="Update Maintenance"
      description="Refresh service details, assignments, and completion notes for this record."
      breadcrumbs={breadcrumbs}
      icon={<Wrench className="h-5 w-5" />}
      headerAside={
        <div className="flex items-center gap-2">
          {isDirty && <UnsavedChangesBadge />}
          <div className="flex items-center gap-2 rounded-full bg-blue-100 px-3 py-1.5 text-sm font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
            <RefreshCcw className="h-3 w-3" />
            Record #{maintenance.id}
          </div>
        </div>
      }
    >
      <div className="mt-6 grid gap-4 px-6 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border border-blue-200/60 bg-white/80 p-4 shadow-sm dark:border-blue-900/50 dark:bg-blue-950/30">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Selected Truck</p>
          <p className="mt-2 flex items-center gap-2 text-sm font-semibold text-blue-700 dark:text-blue-200">
            <Truck className="h-4 w-4" />
            {selectedTruck?.plate ?? 'Choose a truck'}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200/70 bg-white/80 p-4 shadow-sm dark:border-slate-700/70 dark:bg-slate-900/40">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Maintenance Type</p>
          <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-slate-100">{selectedType?.name ?? 'Select a template'}</p>
        </div>
        <div className="rounded-xl border border-blue-200/60 bg-white/80 p-4 shadow-sm dark:border-blue-900/50 dark:bg-blue-950/30">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Scheduled Date</p>
          <p className="mt-2 flex items-center gap-2 text-sm font-semibold text-blue-700 dark:text-blue-200">
            <CalendarCheck className="h-4 w-4" />
            {scheduledDateLabel}
          </p>
        </div>
        <div className="rounded-xl border border-emerald-200/70 bg-white/80 p-4 shadow-sm dark:border-emerald-900/40 dark:bg-emerald-950/20">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Status</p>
          <p className="mt-2 flex items-center gap-2 text-sm font-medium text-emerald-700 dark:text-emerald-200">
            <Sparkles className="h-4 w-4" />
            {statusLabel}
          </p>
        </div>
      </div>

      <form onSubmit={submit} className="flex flex-1 flex-col gap-8 overflow-y-auto p-6 pb-24" noValidate>
        {showValidationBanner && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>Resolve the highlighted fields to save the maintenance record.</AlertDescription>
          </Alert>
        )}

        <FormSection title="Asset & Template" description="Update the associated truck and maintenance template. Inline search helps you filter long lists quickly." icon={<ClipboardList className="h-4 w-4" />}>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="truck_id">
                <span className="text-red-500">*</span> Truck
              </Label>
              <Select value={data.truck_id} onValueChange={value => handleSelectChange('truck_id', value)} onOpenChange={open => !open && setTruckSearch('')}>
                <SelectTrigger id="truck_id" className={getFieldError('truck_id') ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Select truck" />
                </SelectTrigger>
                <SelectContent className="max-h-72">
                  <div className="sticky top-0 z-10 bg-white p-2 dark:bg-slate-800">
                    <Input autoComplete="off" value={truckSearch} onChange={event => setTruckSearch(event.target.value)} placeholder="Search trucks by plate..." className="h-9" />
                  </div>
                  {filteredTrucks.length ? (
                    filteredTrucks.map(truck => (
                      <SelectItem key={truck.id} value={truck.id.toString()}>
                        {truck.plate}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="no-trucks" disabled>
                      No matching trucks found
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
              {getFieldError('truck_id') && (
                <p className="flex items-center gap-1 text-sm text-red-500">
                  <AlertCircle className="h-3 w-3" />
                  {getFieldError('truck_id')}
                </p>
              )}
              {selectedTruck && (
                <div className="rounded-lg border border-blue-200/60 bg-blue-50/80 p-3 text-sm dark:border-blue-900/40 dark:bg-blue-900/30">
                  <p className="font-semibold text-blue-900 dark:text-blue-100">
                    <strong>Plate:</strong> {selectedTruck.plate}
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="maintenance_type_id">
                <span className="text-red-500">*</span> Maintenance Type
              </Label>
              <Select value={data.maintenance_type_id} onValueChange={value => handleSelectChange('maintenance_type_id', value)} onOpenChange={open => !open && setTypeSearch('')}>
                <SelectTrigger id="maintenance_type_id" className={getFieldError('maintenance_type_id') ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Select maintenance type" />
                </SelectTrigger>
                <SelectContent className="max-h-72">
                  <div className="sticky top-0 z-10 bg-white p-2 dark:bg-slate-800">
                    <Input autoComplete="off" value={typeSearch} onChange={event => setTypeSearch(event.target.value)} placeholder="Search by name or category..." className="h-9" />
                  </div>
                  {filteredTypes.length ? (
                    filteredTypes.map(type => (
                      <SelectItem key={type.id} value={type.id.toString()}>
                        <div className="flex flex-col">
                          <span>{type.name}</span>
                          {type.category && <span className="text-xs text-muted-foreground">{type.category}</span>}
                        </div>
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="no-types" disabled>
                      No matching maintenance types
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
              {getFieldError('maintenance_type_id') && (
                <p className="flex items-center gap-1 text-sm text-red-500">
                  <AlertCircle className="h-3 w-3" />
                  {getFieldError('maintenance_type_id')}
                </p>
              )}
              {selectedType && (
                <div className="rounded-lg border border-emerald-200/70 bg-emerald-50/70 p-3 text-sm dark:border-emerald-900/40 dark:bg-emerald-900/20">
                  <p className="font-semibold text-emerald-800 dark:text-emerald-200">{selectedType.name}</p>
                  <p className="text-xs text-emerald-700/80 dark:text-emerald-200/70">Category: {selectedType.category || '—'}</p>
                </div>
              )}
            </div>
          </div>
        </FormSection>

        <FormSection title="Scheduling & Notes" description="Adjust timing, assignments, and any diagnostics captured during execution." icon={<Info className="h-4 w-4" />}>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <FormField label="Scheduled Date" required error={getFieldError('scheduled_date')}>
              <Input id="scheduled_date" type="date" value={data.scheduled_date} onChange={event => handleDateChange(event.target.value)} />
            </FormField>

            <FormField label="Status" required error={getFieldError('status')} hint="Mark progress as the work advances.">
              <Select value={data.status} onValueChange={value => handleSelectChange('status', value)}>
                <SelectTrigger className={getFieldError('status') ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {safeStatusOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="assigned_mechanic_id">Assigned Mechanic (optional)</Label>
              <Select value={data.assigned_mechanic_id === '' ? UNASSIGNED_MECHANIC_VALUE : data.assigned_mechanic_id} onValueChange={value => handleInputChange('assigned_mechanic_id', value === UNASSIGNED_MECHANIC_VALUE ? '' : value)}>
                <SelectTrigger className={getFieldError('assigned_mechanic_id') ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Assign mechanic" />
                </SelectTrigger>
                <SelectContent className="max-h-72">
                  <SelectItem value={UNASSIGNED_MECHANIC_VALUE}>Unassigned</SelectItem>
                  {safeMechanics.map(mechanic => (
                    <SelectItem key={mechanic.id} value={mechanic.id.toString()}>
                      <div className="flex flex-col">
                        <span>{mechanic.name}</span>
                        {mechanic.email && <span className="text-xs text-muted-foreground">{mechanic.email}</span>}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {getFieldError('assigned_mechanic_id') && (
                <p className="flex items-center gap-1 text-sm text-red-500">
                  <AlertCircle className="h-3 w-3" />
                  {getFieldError('assigned_mechanic_id')}
                </p>
              )}
              {selectedMechanic && (
                <div className="rounded-lg border border-emerald-200/70 bg-emerald-50/70 p-3 text-sm dark:border-emerald-900/40 dark:bg-emerald-900/20">
                  <p className="font-semibold text-emerald-800 dark:text-emerald-200">{selectedMechanic.name}</p>
                  {selectedMechanic.email && <p className="text-xs text-emerald-700/80 dark:text-emerald-200/70">{selectedMechanic.email}</p>}
                </div>
              )}
            </div>

            <FormField label="Service Provider (optional)" hint="Document where the work occurs.">
              <Input id="service_provider" value={data.service_provider} onChange={event => handleInputChange('service_provider', event.target.value)} placeholder="External workshop or vendor" />
            </FormField>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <FormField label="Completion Date (optional)" error={getFieldError('completed_date')}>
              <Input id="completed_date" type="date" value={data.completed_date} onChange={event => handleCompletedDateChange(event.target.value)} />
            </FormField>

            <FormField label="Odometer Reading (km)">
              <Input id="odometer_reading" type="number" min="0" value={data.odometer_reading} onChange={event => handleInputChange('odometer_reading', event.target.value)} />
            </FormField>

            <FormField label="Actual Cost (optional)">
              <Input id="cost" type="number" min="0" step="0.01" value={data.cost} onChange={event => handleInputChange('cost', event.target.value)} />
            </FormField>
          </div>

          <FormField label="Work Notes">
            <Textarea id="description" value={data.description} onChange={event => handleInputChange('description', event.target.value)} placeholder="Diagnostics, follow-up actions, or additional notes." rows={4} className="resize-y" />
          </FormField>

          <FormField label="Work Performed (optional)">
            <Textarea id="work_performed" rows={3} value={data.work_performed} onChange={event => handleInputChange('work_performed', event.target.value)} placeholder="Summarize maintenance tasks completed." className="resize-y" />
          </FormField>

          <FormField label="Parts Replaced (optional)">
            <Textarea id="parts_replaced" rows={3} value={data.parts_replaced} onChange={event => handleInputChange('parts_replaced', event.target.value)} placeholder="List parts or consumables used." className="resize-y" />
          </FormField>

          <div className="rounded-lg border border-dashed border-blue-300/70 bg-blue-50/60 p-4 text-sm text-blue-900 dark:border-blue-800/60 dark:bg-blue-900/20 dark:text-blue-100">
            <div className="flex items-center gap-2 font-medium">
              <Sparkles className="h-4 w-4" />
              Predictive scheduling insights
            </div>
            <p className="mt-2 text-xs leading-relaxed">Interval-based suggestions will surface here once maintenance types include interval settings. Configure them to unlock proactive reminders and forecasting.</p>
          </div>
        </FormSection>
      </form>

      <FormActionsBar>
        <Button type="button" variant="outline" asChild>
          <Link href="/maintenance">Cancel</Link>
        </Button>
        <Button type="submit" disabled={processing || hasFrontendErrors || !data.truck_id || !data.maintenance_type_id || !data.scheduled_date || !data.status} onClick={submit}>
          {processing ? (
            <>
              <div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-white" />
              Saving...
            </>
          ) : (
            <>
              <ClipboardList className="mr-2 h-4 w-4" />
              Save Changes
            </>
          )}
        </Button>
      </FormActionsBar>

      <ScrollToTopFab />
    </FormPageLayout>
  );
}
