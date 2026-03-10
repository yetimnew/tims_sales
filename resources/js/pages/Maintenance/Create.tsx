import { FormPageLayout } from '@/components/forms/form-page-layout';
import { FormSection } from '@/components/forms/form-section';
import { FormField } from '@/components/forms/form-field';
import { FormActionsBar } from '@/components/forms/form-actions-bar';
import { UnsavedChangesBadge } from '@/components/forms/unsaved-changes-badge';
import { ScrollToTopFab } from '@/components/forms/scroll-to-top-fab';
import { useMemo, useState, type FormEventHandler } from 'react';
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
import { AlertCircle, ClipboardList, Info, Lightbulb, Wrench } from 'lucide-react';

type MaintenanceStatus = 'scheduled' | 'in_progress' | 'completed';

const breadcrumbs: BreadcrumbItem[] = [
  { title: 'Maintenance', href: '/maintenance' },
  { title: 'Schedule', href: '/maintenance/create' },
];

interface MechanicOption {
  id: number;
  name: string;
  email?: string | null;
}

interface StatusOption {
  value: MaintenanceStatus;
  label: string;
}

const fallbackStatusOptions: StatusOption[] = [
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
];

const UNASSIGNED_MECHANIC_VALUE = '__unassigned__';

interface MaintenanceCreateProps {
  trucks: Array<{ id: number; plate: string }>;
  maintenanceTypes: Array<{ id: number; name: string; category?: string | null }>;
  mechanics: MechanicOption[];
  statusOptions: StatusOption[];
}

type MaintenanceField = 'truck_id' | 'maintenance_type_id' | 'scheduled_date' | 'status';

export default function MaintenanceCreate({ trucks, maintenanceTypes, mechanics, statusOptions }: MaintenanceCreateProps) {
  // Removed direct toast usage; only controller/session notifications will be shown
  const resolvedStatusOptions: StatusOption[] =
    Array.isArray(statusOptions) && statusOptions.length > 0 ? statusOptions : fallbackStatusOptions;

  const defaultStatus = (resolvedStatusOptions[0]?.value ?? 'scheduled') as MaintenanceStatus;
  const { data, setData, post, processing, errors, reset } = useForm({
    truck_id: '',
    maintenance_type_id: '',
    scheduled_date: '',
    completed_date: '',
    status: defaultStatus,
    odometer_reading: '',
    cost: '',
    description: '',
    work_performed: '',
    parts_replaced: '',
    service_provider: '',
    assigned_mechanic_id: '',
  });

  const [frontendErrors, setFrontendErrors] = useState<Record<string, string>>({});
  const [isDirty, setIsDirty] = useState(false);
  const [truckSearch, setTruckSearch] = useState('');
  const [typeSearch, setTypeSearch] = useState('');

  const safeTrucks = useMemo(() => (Array.isArray(trucks) ? trucks : []), [trucks]);
  const safeTypes = useMemo(() => (Array.isArray(maintenanceTypes) ? maintenanceTypes : []), [maintenanceTypes]);
  const safeMechanics = useMemo(() => (Array.isArray(mechanics) ? mechanics : []), [mechanics]);
  const safeStatusOptions = resolvedStatusOptions;

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

  const selectedType = useMemo(
    () => safeTypes.find(type => type.id.toString() === data.maintenance_type_id) ?? null,
    [safeTypes, data.maintenance_type_id],
  );

  const selectedMechanic = useMemo(
    () => safeMechanics.find(mechanic => mechanic.id.toString() === data.assigned_mechanic_id) ?? null,
    [safeMechanics, data.assigned_mechanic_id],
  );

  const validators: Record<MaintenanceField, (value: string) => string> = {
    truck_id: maintenanceValidation.truck_id,
    maintenance_type_id: maintenanceValidation.maintenance_type_id,
    scheduled_date: maintenanceValidation.scheduled_date,
    status: maintenanceValidation.status,
  };

  const validateField = (field: MaintenanceField, value: string) => {
    const message = validators[field](value);
    setFrontendErrors(prev => {
      const next = { ...prev };
      if (message) {
        next[field] = message;
      } else {
        delete next[field];
      }
      return next;
    });
    return message;
  };

  const getFieldError = (field: MaintenanceField | keyof typeof data) => {
    const key = field as keyof typeof data;
    return (errors[key] as string | undefined) || frontendErrors[key as string] || '';
  };

  const handleSelectChange = (field: MaintenanceField, value: string) => {
    setData(field, value);
    validateField(field, value);
    setIsDirty(true);
  };

  const handleDateChange = (value: string) => {
    setData('scheduled_date', value);
    validateField('scheduled_date', value);
    setIsDirty(true);
  };

  const handleInputChange = (field: keyof typeof data, value: string) => {
    setData(field, value);
    setIsDirty(true);
  };

  const submit: FormEventHandler = event => {
    event.preventDefault();
    const pendingErrors: Record<string, string> = {};
    (Object.keys(validators) as MaintenanceField[]).forEach(field => {
      const value = data[field];
      const message = validators[field](value);
      if (message) {
        pendingErrors[field] = message;
      }
    });

    if (Object.keys(pendingErrors).length) {
      setFrontendErrors(prev => ({ ...prev, ...pendingErrors }));
      return;
    }

    post('/maintenance', {
      preserveScroll: true,
      onSuccess: () => {
        setFrontendErrors({});
        setIsDirty(false);
        reset();
      },
    });
  };

  const hasFrontendErrors = Boolean(Object.keys(frontendErrors).length);
  const hasBackendErrors = Boolean(Object.keys(errors).length);
  const showValidationBanner = hasFrontendErrors || hasBackendErrors;

  return (
    <FormPageLayout
      title="Schedule Maintenance"
      headTitle="Schedule Maintenance"
      description="Plan preventative or corrective work before issues escalate."
      breadcrumbs={breadcrumbs}
      icon={<Wrench className="h-5 w-5" />}
      headerAside={isDirty && <UnsavedChangesBadge />}
    >
      <form onSubmit={submit} className="flex flex-1 flex-col gap-6 overflow-y-auto p-6 pb-24" noValidate>
        {showValidationBanner && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>Resolve the highlighted fields to schedule this maintenance task.</AlertDescription>
          </Alert>
        )}

        <FormSection
          title="Asset & Template"
          description="Select the truck and maintenance template. Use the inline search to filter large lists quickly."
          icon={<ClipboardList className="h-4 w-4" />}
        >
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="truck_id">
                <span className="text-red-500">*</span> Truck
              </Label>
              <Select
                value={data.truck_id}
                onValueChange={value => handleSelectChange('truck_id', value)}
                onOpenChange={open => {
                  if (!open) setTruckSearch('');
                }}
              >
                <SelectTrigger id="truck_id" className={getFieldError('truck_id') ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Select truck" />
                </SelectTrigger>
                <SelectContent className="max-h-72">
                  <div className="sticky top-0 z-10 bg-background p-2 shadow-sm">
                    <Input
                      autoComplete="off"
                      value={truckSearch}
                      onChange={event => setTruckSearch(event.target.value)}
                      placeholder="Search trucks by plate..."
                      className="h-9"
                    />
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
                <p className="flex items-center gap-1 text-sm text-destructive">
                  <AlertCircle className="h-3 w-3" />
                  {getFieldError('truck_id')}
                </p>
              )}

              {selectedTruck && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm dark:border-amber-900/40 dark:bg-amber-900/20">
                  <h4 className="mb-2 font-semibold text-amber-800 dark:text-amber-200">Selected Truck</h4>
                  <p className="text-amber-800 dark:text-amber-100">
                    <strong>Plate:</strong> {selectedTruck.plate}
                  </p>
                  <p className="mt-2 text-xs text-amber-700/80 dark:text-amber-200/70">Service history will be linked automatically.</p>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="maintenance_type_id">
                <span className="text-red-500">*</span> Maintenance Type
              </Label>
              <Select
                value={data.maintenance_type_id}
                onValueChange={value => handleSelectChange('maintenance_type_id', value)}
                onOpenChange={open => {
                  if (!open) setTypeSearch('');
                }}
              >
                <SelectTrigger id="maintenance_type_id" className={getFieldError('maintenance_type_id') ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Select maintenance type" />
                </SelectTrigger>
                <SelectContent className="max-h-72">
                  <div className="sticky top-0 z-10 bg-background p-2 shadow-sm">
                    <Input
                      autoComplete="off"
                      value={typeSearch}
                      onChange={event => setTypeSearch(event.target.value)}
                      placeholder="Search by name or category..."
                      className="h-9"
                    />
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
                <p className="flex items-center gap-1 text-sm text-destructive">
                  <AlertCircle className="h-3 w-3" />
                  {getFieldError('maintenance_type_id')}
                </p>
              )}

              {selectedType && (
                <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm dark:border-blue-900/40 dark:bg-blue-900/30">
                  <h4 className="mb-2 font-semibold text-blue-900 dark:text-blue-100">Template Insight</h4>
                  <p className="text-blue-900 dark:text-blue-100">{selectedType.name}</p>
                  <p className="mt-2 text-xs text-blue-800/80 dark:text-blue-200/80">Category: {selectedType.category || '—'}</p>
                </div>
              )}
            </div>
          </div>
        </FormSection>

        <FormSection
          title="Scheduling & Notes"
          description="Set the target date, assign a mechanic, and capture any early diagnostics."
          icon={<Info className="h-4 w-4" />}
        >
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <FormField label="Scheduled Date" required error={getFieldError('scheduled_date')} hint="Must be today or in the future.">
                <Input id="scheduled_date" type="date" value={data.scheduled_date} onChange={event => handleDateChange(event.target.value)} />
              </FormField>

              <FormField label="Status" required error={getFieldError('status')} hint="Defaults to scheduled for new work orders.">
                <Select value={data.status} onValueChange={value => handleSelectChange('status', value)}>
                  <SelectTrigger id="status" className={getFieldError('status') ? 'border-red-500' : ''}>
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
                <Select
                  value={data.assigned_mechanic_id === '' ? UNASSIGNED_MECHANIC_VALUE : data.assigned_mechanic_id}
                  onValueChange={value => handleInputChange('assigned_mechanic_id', value === UNASSIGNED_MECHANIC_VALUE ? '' : value)}
                >
                  <SelectTrigger id="assigned_mechanic_id" className={errors.assigned_mechanic_id ? 'border-red-500' : ''}>
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
                {errors.assigned_mechanic_id && (
                  <p className="flex items-center gap-1 text-sm text-destructive">
                    <AlertCircle className="h-3 w-3" />
                    {errors.assigned_mechanic_id}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">Leave blank to assign later.</p>

                {selectedMechanic && (
                  <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm dark:border-emerald-900/40 dark:bg-emerald-900/20">
                    <h4 className="mb-1 font-semibold text-emerald-800 dark:text-emerald-200">Selected Mechanic</h4>
                    <p className="text-emerald-800 dark:text-emerald-100">{selectedMechanic.name}</p>
                    {selectedMechanic.email && <p className="text-xs text-emerald-700/80 dark:text-emerald-200/70">{selectedMechanic.email}</p>}
                  </div>
                )}
              </div>

              <FormField label="Service Provider (optional)" hint="Record where the maintenance will be performed.">
                <Input
                  id="service_provider"
                  value={data.service_provider}
                  onChange={event => handleInputChange('service_provider', event.target.value)}
                  placeholder="External workshop or vendor"
                />
              </FormField>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              <FormField label="Completion Date (optional)">
                <Input
                  id="completed_date"
                  type="date"
                  value={data.completed_date}
                  onChange={event => handleInputChange('completed_date', event.target.value)}
                />
              </FormField>

              <FormField label="Odometer Reading (km)">
                <Input
                  id="odometer_reading"
                  type="number"
                  min="0"
                  value={data.odometer_reading}
                  onChange={event => handleInputChange('odometer_reading', event.target.value)}
                />
              </FormField>

              <FormField label="Estimated Cost (optional)">
                <Input
                  id="cost"
                  type="number"
                  min="0"
                  step="0.01"
                  value={data.cost}
                  onChange={event => handleInputChange('cost', event.target.value)}
                />
              </FormField>
            </div>

            <FormField label="Work Notes">
              <Textarea
                id="description"
                value={data.description}
                onChange={event => handleInputChange('description', event.target.value)}
                placeholder="Outline the symptoms, planned checks, or parts to procure."
                rows={4}
              />
            </FormField>

            <FormField label="Planned Work (optional)">
              <Textarea
                id="work_performed"
                rows={3}
                value={data.work_performed}
                onChange={event => handleInputChange('work_performed', event.target.value)}
                placeholder="Describe the maintenance tasks that will be carried out."
              />
            </FormField>

            <FormField label="Parts Needed or Replaced (optional)">
              <Textarea
                id="parts_replaced"
                rows={3}
                value={data.parts_replaced}
                onChange={event => handleInputChange('parts_replaced', event.target.value)}
                placeholder="List parts or consumables to prepare."
              />
            </FormField>

            <div className="rounded-lg border border-dashed border-blue-300 bg-blue-50 p-4 text-sm text-blue-900 dark:border-blue-800/60 dark:bg-blue-900/20 dark:text-blue-100">
              <div className="flex items-center gap-2 font-medium">
                <Lightbulb className="h-4 w-4" />
                Predictive scheduling insights
              </div>
              <p className="mt-2 text-xs leading-relaxed">
                Interval-based suggestions (next due date & odometer) will appear here once maintenance types include interval settings.
                Configure them to unlock proactive recommendations.
              </p>
            </div>
          </div>
        </FormSection>
      </form>

      <FormActionsBar>
        <Button type="button" variant="outline" asChild>
          <Link href="/maintenance">Cancel</Link>
        </Button>
        <Button
          type="submit"
          disabled={processing || hasFrontendErrors || !data.truck_id || !data.maintenance_type_id || !data.scheduled_date || !data.status}
          onClick={submit}
        >
          {processing ? (
            <>
              <div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-white" />
              Scheduling...
            </>
          ) : (
            <>
              <ClipboardList className="mr-2 h-4 w-4" />
              Schedule Maintenance
            </>
          )}
        </Button>
      </FormActionsBar>

      <ScrollToTopFab />
    </FormPageLayout>
  );
}
