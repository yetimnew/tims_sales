import { FormPageLayout } from '@/components/forms/form-page-layout';
import { FormSection } from '@/components/forms/form-section';
import { FormField } from '@/components/forms/form-field';
import { FormActionsBar } from '@/components/forms/form-actions-bar';
import { UnsavedChangesBadge } from '@/components/forms/unsaved-changes-badge';
import { ScrollToTopFab } from '@/components/forms/scroll-to-top-fab';
import { useMemo, useState, useCallback, type FormEventHandler } from 'react';
import { Link, useForm } from '@inertiajs/react';
import { type BreadcrumbItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { DatePicker } from '@/components/ui/date-picker';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { validateOperation, type ValidationErrors } from '@/lib/validation';
import { cn } from '@/lib/utils';
import { AlertCircle, Calendar, ClipboardList, Rocket, CheckCircle } from 'lucide-react';

interface Customer {
  id: number;
  name: string;
}

interface Region {
  id: number;
  name: string;
}

interface Zone {
  id: number;
  name: string;
  region_id: number;
  status?: string | null;
}

interface Woreda {
  id: number;
  name: string;
  zone_id: number;
  status?: string | null;
}

interface Place {
  id: number;
  name: string;
  woreda_id: number;
  status?: string | null;
}

interface DestinationScopeOption {
  value: OperationFormData['destination_scope'];
  label: string;
}

interface CargoTypeOption {
  id: number;
  name: string;
  category?: string | null;
}

interface CargoServiceTypeOption {
  value: OperationFormData['cargo_service_type'];
  label: string;
}

interface OperationsCreateProps {
  customers: Customer[];
  regions: Region[];
  zones: Zone[];
  woredas: Woreda[];
  places: Place[];
  destinationScopes: DestinationScopeOption[];
  cargoTypes: CargoTypeOption[];
  cargoServiceTypes: CargoServiceTypeOption[];
}

type OperationFormData = {
  operationid: string;
  customer_id: string;
  startdate: string;
  volume: string;
  cargo_type_id: string;
  cargo_service_type: 'relief' | 'commercial';
  km: string;
  tariff: string;
  remark: string;
  status: 'active' | 'inactive';
  destination_scope: 'region' | 'zone' | 'woreda' | 'place';
  destination_id: string;
};

const breadcrumbs: BreadcrumbItem[] = [
  { title: 'Operations', href: '/operations' },
  { title: 'Create', href: '/operations/create' },
];

type RecentSelections = {
  customers: string[];
  cargoTypes: string[];
};

const RECENT_SELECTIONS_KEY = 'operations_recent_selections';

export default function OperationsCreate({
  customers,
  regions,
  zones,
  woredas,
  places,
  destinationScopes,
  cargoTypes,
  cargoServiceTypes,
}: OperationsCreateProps) {
  const { data, setData, post, processing, errors, reset } = useForm<OperationFormData>({
    operationid: '',
    customer_id: '',
    startdate: '',
    volume: '',
    cargo_type_id: '',
    cargo_service_type: 'commercial',
    km: '',
    tariff: '',
    remark: '',
    status: 'active',
    destination_scope: 'region',
    destination_id: '',
  });

  const [frontendErrors, setFrontendErrors] = useState<ValidationErrors>({});
  const [isDirty, setIsDirty] = useState(false);

  const readRecentSelections = (): RecentSelections => {
    if (typeof window === 'undefined') {
      return { customers: [], cargoTypes: [] };
    }

    try {
      const storedValue = window.localStorage.getItem(RECENT_SELECTIONS_KEY);
      if (!storedValue) {
        return { customers: [], cargoTypes: [] };
      }

      const parsed: Partial<RecentSelections> = JSON.parse(storedValue);
      return {
        customers: Array.isArray(parsed.customers) ? parsed.customers.slice(0, 5) : [],
        cargoTypes: Array.isArray(parsed.cargoTypes) ? parsed.cargoTypes.slice(0, 5) : [],
      };
    } catch (error) {
      console.error('Failed to load recent selections', error);
      return { customers: [], cargoTypes: [] };
    }
  };

  const [recentCustomers, setRecentCustomers] = useState<string[]>(() => readRecentSelections().customers);
  const [recentCargoTypes, setRecentCargoTypes] = useState<string[]>(() => readRecentSelections().cargoTypes);

  const hasErrors = useMemo(() => Object.keys(errors).length > 0 || Object.keys(frontendErrors).length > 0, [errors, frontendErrors]);

  const persistRecentSelections = useCallback(
    (next: RecentSelections) => {
      if (typeof window === 'undefined') {
        return;
      }

      try {
        window.localStorage.setItem(RECENT_SELECTIONS_KEY, JSON.stringify(next));
      } catch (error) {
        console.error('Failed to persist recent selections', error);
      }
    },
    [],
  );

  const updateRecentSelection = useCallback(
    (field: 'customer' | 'cargoType', value: string) => {
      if (!value) {
        return;
      }

      if (field === 'customer') {
        setRecentCustomers(prev => {
          const next = [value, ...prev.filter(existing => existing !== value)].slice(0, 5);
          persistRecentSelections({ customers: next, cargoTypes: recentCargoTypes });
          return next;
        });
      } else {
        setRecentCargoTypes(prev => {
          const next = [value, ...prev.filter(existing => existing !== value)].slice(0, 5);
          persistRecentSelections({ customers: recentCustomers, cargoTypes: next });
          return next;
        });
      }
    },
    [persistRecentSelections, recentCargoTypes, recentCustomers],
  );

  const setFieldError = (field: keyof OperationFormData, message: string) => {
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

  const validateField = (field: keyof OperationFormData, value: string) => {
    const nextValues: OperationFormData = { ...data, [field]: value } as OperationFormData;
    const fieldErrors = validateOperation(nextValues);
    setFieldError(field, fieldErrors[field] ?? '');
  };

  const handleFieldChange = (field: keyof OperationFormData, value: string) => {
    if (field === 'destination_scope') {
      setData('destination_scope', value as OperationFormData['destination_scope']);
      setData('destination_id', '');
      setFieldError('destination_id', '');
      validateField(field, value);
      setIsDirty(true);
      return;
    }

    setData(field, value as OperationFormData[keyof OperationFormData]);
    validateField(field, value);
    setIsDirty(true);

    if (field === 'customer_id') {
      updateRecentSelection('customer', value);
    }

    if (field === 'cargo_type_id') {
      updateRecentSelection('cargoType', value);
    }
  };

  const submit: FormEventHandler = event => {
    event.preventDefault();

    const validationResults = validateOperation(data);
    const nextErrors: ValidationErrors = { ...validationResults };

    if (!destinationIsValid) {
      nextErrors.destination_id = 'Destination selection is required';
    }

    if (Object.keys(nextErrors).length > 0) {
      setFrontendErrors(nextErrors);
      return;
    }

    post('/operations', {
      preserveScroll: true,
      onSuccess: () => {
        setFrontendErrors({});
        setIsDirty(false);
        reset();
        setData('status', 'active');
        setData('cargo_type_id', '');
        setData('cargo_service_type', 'commercial');
        setData('destination_scope', 'region');
        setData('destination_id', '');
        setFieldError('destination_id', '');
      },
    });
  };

  const getFieldError = (field: keyof OperationFormData) => {
    const baseError = errors[field] || frontendErrors[field] || '';
    if (field === 'destination_id' && !destinationIsValid) {
      return baseError || 'Destination selection is required';
    }

    return baseError;
  };

  const safeCustomers = useMemo(() => (Array.isArray(customers) ? customers : []), [customers]);
  const safeRegions = useMemo(() => (Array.isArray(regions) ? regions : []), [regions]);
  const safeZones = useMemo(() => (Array.isArray(zones) ? zones : []), [zones]);
  const safeWoredas = useMemo(() => (Array.isArray(woredas) ? woredas : []), [woredas]);
  const safePlaces = useMemo(() => (Array.isArray(places) ? places : []), [places]);
  const safeCargoTypes = useMemo(() => (Array.isArray(cargoTypes) ? cargoTypes : []), [cargoTypes]);
  const safeCargoServiceTypes = useMemo(() => (Array.isArray(cargoServiceTypes) ? cargoServiceTypes : []), [cargoServiceTypes]);
  const destinationScopeOptions = useMemo(() => (Array.isArray(destinationScopes) ? destinationScopes : []), [destinationScopes]);

  const destinationOptions = useMemo(() => {
    switch (data.destination_scope) {
      case 'region':
        return safeRegions.map(region => ({ value: region.id.toString(), label: region.name }));
      case 'zone':
        return safeZones.map(zone => ({ value: zone.id.toString(), label: zone.name }));
      case 'woreda':
        return safeWoredas.map(woreda => ({ value: woreda.id.toString(), label: woreda.name }));
      case 'place':
        return safePlaces.map(place => ({ value: place.id.toString(), label: place.name }));
      default:
        return [];
    }
  }, [data.destination_scope, safeRegions, safeZones, safeWoredas, safePlaces]);

  const selectedDestinationScopeLabel = useMemo(
    () => destinationScopeOptions.find(option => option.value === data.destination_scope)?.label ?? null,
    [destinationScopeOptions, data.destination_scope],
  );

  const destinationIsValid = !data.destination_id || destinationOptions.some(option => option.value === data.destination_id);

  const destinationSelectValue = destinationIsValid ? data.destination_id : '';



  return (
    <FormPageLayout
      title="Register New Operation"
      headTitle="Create Operation"
      description="Configure a customer engagement, logistics scope, and commercial profile in a single workflow."
      breadcrumbs={breadcrumbs}
      icon={<ClipboardList className="h-5 w-5" />}
      headerAside={isDirty && <UnsavedChangesBadge />}
    >
      <form onSubmit={submit} className="flex flex-1 flex-col gap-6 overflow-y-auto p-6 pb-24" noValidate>
        {hasErrors && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>Please review the highlighted fields and correct the validation errors before submitting.</AlertDescription>
          </Alert>
        )}

        <FormSection
          title="Operation Overview"
          description="Identify the operation and connect it to the customer ecosystem."
          icon={<Rocket className="h-4 w-4" />}
        >
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <FormField label="Operation ID" required error={getFieldError('operationid')}>
              <Input
                id="operationid"
                type="text"
                value={data.operationid}
                onChange={event => handleFieldChange('operationid', event.target.value)}
                placeholder="e.g., OP-2025-0042"
              />
            </FormField>

            <div className="space-y-2">
              <FormField label="Customer" required error={getFieldError('customer_id')}>
                <Select value={data.customer_id} onValueChange={value => handleFieldChange('customer_id', value)}>
                  <SelectTrigger className={getFieldError('customer_id') ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Select a customer" />
                  </SelectTrigger>
                  <SelectContent className="max-h-72">
                    {safeCustomers.map(customer => (
                      <SelectItem key={customer.id} value={customer.id.toString()}>
                        {customer.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>
              {!getFieldError('customer_id') && recentCustomers.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  <p className="text-xs text-muted-foreground">Recent:</p>
                  {recentCustomers
                    .map(customerId => safeCustomers.find(customer => customer.id.toString() === customerId))
                    .filter((customer): customer is Customer => Boolean(customer))
                    .map(customer => (
                      <Button
                        key={customer.id}
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs"
                        onClick={() => handleFieldChange('customer_id', customer.id.toString())}
                      >
                        {customer.name}
                      </Button>
                    ))}
                </div>
              )}
            </div>

            <FormField label="Status" required error={getFieldError('status')}>
              <Select value={data.status} onValueChange={value => handleFieldChange('status', value)}>
                <SelectTrigger className={getFieldError('status') ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </FormField>

            <FormField label="Destination Scope" required error={getFieldError('destination_scope')}>
              <Select value={data.destination_scope} onValueChange={value => handleFieldChange('destination_scope', value)}>
                <SelectTrigger className={getFieldError('destination_scope') ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Select scope" />
                </SelectTrigger>
                <SelectContent>
                  {destinationScopeOptions.map(scope => (
                    <SelectItem key={scope.value} value={scope.value}>
                      {scope.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>

            <div className="space-y-2">
              <FormField label="Destination" required error={getFieldError('destination_id')}>
                <Select
                  value={destinationSelectValue}
                  onValueChange={value => handleFieldChange('destination_id', value)}
                  disabled={destinationOptions.length === 0}
                >
                  <SelectTrigger className={getFieldError('destination_id') ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Select destination" />
                  </SelectTrigger>
                  <SelectContent className="max-h-72">
                    {destinationOptions.length > 0 ? (
                      destinationOptions.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="__empty" disabled>
                        No options available
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </FormField>
              <p className="text-xs text-muted-foreground">
                {selectedDestinationScopeLabel
                  ? `Showing ${selectedDestinationScopeLabel.toLowerCase()} destinations.`
                  : 'Select a destination scope to populate options.'}
              </p>
            </div>
          </div>
        </FormSection>

        <FormSection
          title="Scheduling & Cargo Profile"
          description="Define timelines, service type, and planned throughput for this engagement."
          icon={<Calendar className="h-4 w-4" />}
        >
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label>
                Start Date <span className="text-red-500">*</span>
              </Label>
              <DatePicker
                value={data.startdate || ''}
                onChange={next => handleFieldChange('startdate', next ?? '')}
                placeholder="Select start date"
                className={cn(
                  'w-full justify-start text-left h-11',
                  getFieldError('startdate') ? 'border-red-500 focus-visible:border-red-500 focus-visible:ring-red-500/20' : undefined,
                )}
              />
              {getFieldError('startdate') && (
                <p className="flex items-center gap-1 text-sm text-destructive">
                  <AlertCircle className="h-3 w-3" />
                  {getFieldError('startdate')}
                </p>
              )}
            </div>

            <FormField label="Cargo Service Type" required error={getFieldError('cargo_service_type')}>
              <Select value={data.cargo_service_type} onValueChange={value => handleFieldChange('cargo_service_type', value)}>
                <SelectTrigger className={getFieldError('cargo_service_type') ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Select service type" />
                </SelectTrigger>
                <SelectContent>
                  {safeCargoServiceTypes.map(service => (
                    <SelectItem key={service.value} value={service.value}>
                      {service.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>

            <div className="space-y-2">
              <FormField label="Cargo Type" required error={getFieldError('cargo_type_id')}>
                <Select value={data.cargo_type_id} onValueChange={value => handleFieldChange('cargo_type_id', value)}>
                  <SelectTrigger className={getFieldError('cargo_type_id') ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Select cargo type" />
                  </SelectTrigger>
                  <SelectContent className="max-h-72">
                    {safeCargoTypes.map(type => (
                      <SelectItem key={type.id} value={type.id.toString()}>
                        {type.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>
              {recentCargoTypes.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <p className="text-xs text-muted-foreground">Recent:</p>
                  {recentCargoTypes
                    .map(typeId => safeCargoTypes.find(type => type.id.toString() === typeId))
                    .filter((type): type is CargoTypeOption => Boolean(type))
                    .map(type => (
                      <Button
                        key={type.id}
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs"
                        onClick={() => handleFieldChange('cargo_type_id', type.id.toString())}
                      >
                        {type.name}
                      </Button>
                    ))}
                </div>
              )}
            </div>

            <FormField label="Planned Volume (MT)" required error={getFieldError('volume')}>
              <Input
                id="volume"
                type="number"
                step="0.01"
                value={data.volume}
                onChange={event => handleFieldChange('volume', event.target.value)}
                placeholder="e.g., 1200"
              />
            </FormField>

            <FormField label="Distance (KM)" required error={getFieldError('km')}>
              <Input
                id="km"
                type="number"
                step="0.01"
                value={data.km}
                onChange={event => handleFieldChange('km', event.target.value)}
                placeholder="e.g., 520"
              />
            </FormField>
          </div>
        </FormSection>

        <FormSection
          title="Commercial Parameters"
          description="Set tariff assumptions and capture supporting notes for the ops & finance teams."
          icon={<CheckCircle className="h-4 w-4" />}
        >
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <FormField label="Tariff (per ton-km)" required error={getFieldError('tariff')}>
              <Input
                id="tariff"
                type="number"
                step="0.01"
                value={data.tariff}
                onChange={event => handleFieldChange('tariff', event.target.value)}
                placeholder="e.g., 2.75"
              />
            </FormField>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="remark">Description / Notes</Label>
              <Textarea
                id="remark"
                value={data.remark}
                onChange={event => handleFieldChange('remark', event.target.value)}
                placeholder="Add any commercial clauses, delivery SLAs, or operational reminders"
                className="min-h-[120px]"
              />
              {getFieldError('remark') && (
                <p className="flex items-center gap-1 text-sm text-destructive">
                  <AlertCircle className="h-3 w-3" />
                  {getFieldError('remark')}
                </p>
              )}
            </div>
          </div>
        </FormSection>
      </form>

      <FormActionsBar>
        <Button type="button" variant="outline" asChild>
          <Link href="/operations">Cancel</Link>
        </Button>
        <Button
          type="submit"
          disabled={processing || Object.keys(frontendErrors).length > 0 || !data.destination_id || !data.cargo_type_id}
          onClick={submit}
        >
          {processing ? (
            <>
              <div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-white" />
              Creating...
            </>
          ) : (
            <>
              <CheckCircle className="mr-2 h-4 w-4" />
              Create Operation
            </>
          )}
        </Button>
      </FormActionsBar>

      <ScrollToTopFab />
    </FormPageLayout>
  );
}
