import { FormPageLayout } from '@/components/forms/form-page-layout';
import { FormSection } from '@/components/forms/form-section';
import { FormField } from '@/components/forms/form-field';
import { FormActionsBar } from '@/components/forms/form-actions-bar';
import { UnsavedChangesBadge } from '@/components/forms/unsaved-changes-badge';
import { ScrollToTopFab } from '@/components/forms/scroll-to-top-fab';
import { useCallback, useEffect, useMemo, useRef, useState, type FormEventHandler } from 'react';
import { Link, useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { SearchableEntityCombobox } from '@/components/searchable-entity-combobox';
import { PlaceCombobox } from '@/components/place-combobox';
import { useToast } from '@/hooks/use-toast';
import { useRemoteLookup } from '@/hooks/use-remote-lookup';
import { search as operationsSearch } from '@/routes/operations';
import { DatePicker } from '@/components/ui/date-picker';
import { validateOutsourcePerformance, type ValidationErrors } from '@/lib/validation';
import { cn } from '@/lib/utils';
import type { BreadcrumbItem } from '@/types';
import { AlertCircle, CheckCircle, ClipboardList, Loader2, MapPin, Package, Save, Wallet } from 'lucide-react';

interface OutsourceOption {
  id: number;
  name: string;
}

interface OperationOption {
  id: number;
  operationid: string;
  customer?: {
    id: number;
    name: string;
  } | null;
}

interface PlaceOption {
  id: number;
  name: string;
}

interface StatusOption {
  label: string;
  value: string;
}

interface OutsourcePerformancesCreateProps {
  outsources: OutsourceOption[];
  statusOptions: StatusOption[];
  places: PlaceOption[];
}

type OutsourcePerformanceFormData = {
  outsource_id: string;
  operation_id: string;
  trip_number: string;
  dispatch_date: string;
  from_place_id: string;
  to_place_id: string;
  distance_km: string;
  cargo_volume_mt: string;
  tonkm: string;
  cost: string;
  remarks: string;
  status: string;
};

const breadcrumbs: BreadcrumbItem[] = [
  { title: 'Outsource Performances', href: '/outsource-performances' },
  { title: 'Create', href: '/outsource-performances/create' },
];

type DistanceStatus = {
  found: boolean;
  message: string;
} | null;

const RECENT_OUTSOURCE_PERFORMANCE_KEY = 'outsource_performance_recent_selections';

interface RecentSelections {
  outsources: string[];
  operations: string[];
}

const computeTonKilometers = (distance: string, cargo: string): string => {
  const distanceValue = Number(distance || 0);
  const cargoValue = Number(cargo || 0);

  if (!Number.isFinite(distanceValue) || !Number.isFinite(cargoValue)) {
    return '0.00';
  }

  const tonKm = distanceValue * cargoValue;
  if (tonKm <= 0) {
    return '0.00';
  }

  return tonKm.toFixed(2);
};

export default function OutsourcePerformancesCreate({ outsources, statusOptions, places }: OutsourcePerformancesCreateProps) {
  const { toast } = useToast();
  const defaultStatus = statusOptions[0]?.value ?? 'active';

  const initialFormState: OutsourcePerformanceFormData = {
    outsource_id: '',
    operation_id: '',
    trip_number: '',
    dispatch_date: '',
    from_place_id: '',
    to_place_id: '',
    distance_km: '',
    cargo_volume_mt: '',
    tonkm: '0.00',
    cost: '',
    remarks: '',
    status: defaultStatus,
  };

  const initialValuesRef = useRef<OutsourcePerformanceFormData>(initialFormState);

  const { data, setData, post, processing, errors, reset, transform } = useForm<OutsourcePerformanceFormData>({
    ...initialValuesRef.current,
  });

  const [clientErrors, setClientErrors] = useState<ValidationErrors>({});
  const [distanceStatus, setDistanceStatus] = useState<DistanceStatus>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [distanceLoading, setDistanceLoading] = useState(false);
  const [recent, setRecent] = useState<RecentSelections>({ outsources: [], operations: [] });

  const operationSelectedIds = useMemo(() => {
    const ids = new Set<string>();
    if (data.operation_id) {
      ids.add(data.operation_id);
    }
    recent.operations.forEach(id => {
      if (id) {
        ids.add(id);
      }
    });
    return Array.from(ids);
  }, [data.operation_id, recent.operations]);

  const operationsLookup = useRemoteLookup<OperationOption>({
    endpoint: operationsSearch.url(),
    getId: operation => operation.id,
    selectedIds: operationSelectedIds,
    limit: 20,
  });

  const statusOptionValues = useMemo(() => (statusOptions.length ? statusOptions : [{ label: 'Active', value: 'active' }]), [statusOptions]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(RECENT_OUTSOURCE_PERFORMANCE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as RecentSelections;
        setRecent({
          outsources: Array.isArray(parsed.outsources) ? parsed.outsources.slice(0, 6) : [],
          operations: Array.isArray(parsed.operations) ? parsed.operations.slice(0, 6) : [],
        });
      }
    } catch (error) {
      console.warn('Unable to load recent selections:', error);
    }
  }, []);

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

  const recalculateTonKilometers = useCallback(
    (nextState: OutsourcePerformanceFormData) => {
      const computed = computeTonKilometers(nextState.distance_km, nextState.cargo_volume_mt);
      setData('tonkm', computed);
    },
    [setData],
  );

  const handleDistanceAutoFill = useCallback(
    async (originId: string, destinationId: string, nextState: OutsourcePerformanceFormData) => {
      if (!originId || !destinationId) {
        setDistanceStatus(null);
        setDistanceLoading(false);
        return;
      }

      if (originId === destinationId) {
        setData('distance_km', '');
        recalculateTonKilometers({ ...nextState, distance_km: '' });
        setDistanceStatus({
          found: false,
          message: 'Origin and destination are the same. Distance cleared for manual entry.',
        });
        setDistanceLoading(false);
        return;
      }

      setDistanceLoading(true);
      setDistanceStatus(null);

      try {
        const params = new URLSearchParams({
          from_place_id: originId,
          to_place_id: destinationId,
        });

        const response = await fetch(`/performances/calculate-distance?${params.toString()}`, {
          method: 'GET',
          headers: {
            Accept: 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
          },
          credentials: 'same-origin',
        });

        if (!response.ok) {
          throw new Error(`Distance lookup failed with status ${response.status}`);
        }

        const result = (await response.json()) as { distance?: number | string; found?: boolean; note?: string };
        const numericDistance = typeof result.distance === 'number' ? result.distance : Number(result.distance ?? 0);

        const safeDistance = Number.isFinite(numericDistance) ? numericDistance : 0;
        const formattedDistance = safeDistance.toFixed(2);

        if (result.found) {
          setData('distance_km', formattedDistance);
          recalculateTonKilometers({ ...nextState, distance_km: formattedDistance });
          setDistanceStatus({
            found: true,
            message: `Distance auto-filled from registered route (${formattedDistance} km).`,
          });
        } else {
          setData('distance_km', '');
          recalculateTonKilometers({ ...nextState, distance_km: '' });
          setDistanceStatus({
            found: false,
            message: result.note ?? 'No registered distance for this route. Please enter it manually.',
          });
        }
      } catch (error) {
        console.error('Distance auto-fill failed:', error);
        setData('distance_km', '');
        recalculateTonKilometers({ ...nextState, distance_km: '' });
        setDistanceStatus({
          found: false,
          message: 'Unable to resolve distance automatically. Please enter it manually.',
        });
      } finally {
        setDistanceLoading(false);
      }
    },
    [recalculateTonKilometers, setData],
  );

  const setFieldError = useCallback((field: keyof OutsourcePerformanceFormData, message: string | undefined) => {
    setClientErrors(previous => {
      const next = { ...previous };
      if (message) {
        next[field] = message;
      } else {
        delete next[field];
      }
      return next;
    });
  }, []);

  const handleFieldChange = useCallback(
    <K extends keyof OutsourcePerformanceFormData>(field: K, value: OutsourcePerformanceFormData[K]) => {
      const nextState: OutsourcePerformanceFormData = { ...data, [field]: value } as OutsourcePerformanceFormData;
      setData(field, value);
      setIsDirty(true);

      if (clientErrors[field]) {
        setFieldError(field, undefined);
      }

      if (field === 'distance_km' || field === 'cargo_volume_mt') {
        recalculateTonKilometers(nextState);
      }

      if (field === 'outsource_id' && typeof value === 'string') {
        setRecent(previous => {
          const nextOutsources = [value, ...previous.outsources.filter(item => item !== value)].slice(0, 6);
          const updated = { ...previous, outsources: nextOutsources };
          try {
            localStorage.setItem(RECENT_OUTSOURCE_PERFORMANCE_KEY, JSON.stringify(updated));
          } catch (error) {
            console.warn('Unable to persist recent selections:', error);
          }
          return updated;
        });
      }

      if (field === 'operation_id' && typeof value === 'string') {
        setRecent(previous => {
          const nextOperations = [value, ...previous.operations.filter(item => item !== value)].slice(0, 6);
          const updated = { ...previous, operations: nextOperations };
          try {
            localStorage.setItem(RECENT_OUTSOURCE_PERFORMANCE_KEY, JSON.stringify(updated));
          } catch (error) {
            console.warn('Unable to persist recent selections:', error);
          }
          return updated;
        });
      }

      if (field === 'from_place_id' || field === 'to_place_id') {
        if (!nextState.from_place_id || !nextState.to_place_id || nextState.from_place_id === nextState.to_place_id) {
          setDistanceStatus(
            nextState.from_place_id && nextState.to_place_id && nextState.from_place_id === nextState.to_place_id
              ? {
                  found: false,
                  message: 'Origin and destination match. Distance cleared for manual entry.',
                }
              : null,
          );
          setDistanceLoading(false);
          setData('distance_km', '');
          recalculateTonKilometers({ ...nextState, distance_km: '' });
          return;
        }

        void handleDistanceAutoFill(nextState.from_place_id, nextState.to_place_id, nextState);
      }
    },
    [clientErrors, data, handleDistanceAutoFill, recalculateTonKilometers, setData, setFieldError],
  );

  const validateClient = useCallback((payload: OutsourcePerformanceFormData) => {
    const results = validateOutsourcePerformance(payload);
    setClientErrors(results);
    return Object.keys(results).length === 0;
  }, []);

  const submit: FormEventHandler = event => {
    event.preventDefault();

    const trimmed: OutsourcePerformanceFormData = {
      outsource_id: data.outsource_id.trim(),
      operation_id: data.operation_id.trim(),
      trip_number: data.trip_number.trim(),
      dispatch_date: data.dispatch_date.trim(),
      from_place_id: data.from_place_id.trim(),
      to_place_id: data.to_place_id.trim(),
      distance_km: data.distance_km.trim(),
      cargo_volume_mt: data.cargo_volume_mt.trim(),
      tonkm: data.tonkm.trim(),
      cost: data.cost.trim(),
      remarks: data.remarks.trim(),
      status: data.status.trim(),
    };

    if (!validateClient(trimmed)) {
      toast({
        variant: 'destructive',
        title: 'Please review the form',
        description: 'Some fields need your attention before submission.',
      });
      return;
    }

    transform(() => ({
      ...trimmed,
      distance_km: trimmed.distance_km || null,
      cargo_volume_mt: trimmed.cargo_volume_mt || null,
      tonkm: trimmed.tonkm || null,
      cost: trimmed.cost || null,
      remarks: trimmed.remarks || null,
    }));

    post('/outsource-performances', {
      preserveScroll: true,
      onSuccess: () => {
        toast({
          title: '✅ Trip Logged',
          description: 'The outsource performance record has been saved successfully.',
        });
        setClientErrors({});
        setDistanceStatus(null);
        setIsDirty(false);
        reset(initialValuesRef.current);
      },
      onError: () => {
        transform(data => data);
      },
      onFinish: () => {
        transform(data => data);
      },
    });
  };

  useEffect(() => {
    const initial = initialValuesRef.current;
    const dirty = (Object.keys(initial) as Array<keyof OutsourcePerformanceFormData>).some(key => data[key] !== initial[key]);
    setIsDirty(dirty);
  }, [data]);

  const generalError = errors.error ? String(errors.error) : '';

  return (
    <FormPageLayout
      title="Log Outsource Trip"
      headTitle="Log Outsource Trip"
      description="Capture vendor dispatch metrics, route details, and cost insights in one streamlined form."
      breadcrumbs={breadcrumbs}
      icon={<CheckCircle className="h-5 w-5" />}
      headerAside={isDirty && <UnsavedChangesBadge />}
    >
      <form onSubmit={submit} className="flex flex-1 flex-col gap-6 overflow-y-auto p-6 pb-24" noValidate>
        {generalError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{generalError}</AlertDescription>
          </Alert>
        )}

        <FormSection title="Trip Overview" description="Link the vendor, operation, and trip identifiers." icon={<ClipboardList className="h-4 w-4" />}>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="space-y-2">
              <FormField label="Vendor" required error={clientErrors.outsource_id}>
                <Select value={data.outsource_id} onValueChange={value => handleFieldChange('outsource_id', value)}>
                  <SelectTrigger id="outsource_id" className={clientErrors.outsource_id ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Select vendor" />
                  </SelectTrigger>
                  <SelectContent>
                    {outsources.map(option => (
                      <SelectItem key={option.id} value={option.id.toString()}>
                        {option.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>
              {recent.outsources.length > 0 && (
                <div className="flex flex-wrap gap-1 pt-1">
                  {recent.outsources.map(id => {
                    const option = outsources.find(outsource => outsource.id.toString() === id);
                    if (!option) {
                      return null;
                    }

                    const isActive = data.outsource_id === id;
                    return (
                      <button
                        type="button"
                        key={id}
                        onClick={() => handleFieldChange('outsource_id', id)}
                        className={`rounded px-2 py-0.5 text-xs transition ${
                          isActive
                            ? 'border-indigo-600 bg-indigo-600 text-white shadow-sm'
                            : 'border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                        }`}
                      >
                        {option.name}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <SearchableEntityCombobox
                id="operation_id"
                label="Operation"
                required
                value={data.operation_id}
                items={operationsLookup.items}
                getValue={operation => operation.id}
                getLabel={operation => operation.operationid}
                getDescription={operation => operation.customer?.name}
                getKeywords={operation => [operation.operationid, operation.customer?.name]}
                placeholder="Search operation..."
                searchPlaceholder="Search operations..."
                searchValue={operationsLookup.query}
                onSearchChange={operationsLookup.setQuery}
                isLoading={operationsLookup.isLoading}
                loadingMessage="Searching operations..."
                onSelect={value => {
                  handleFieldChange('operation_id', value);
                  operationsLookup.setQuery('');
                }}
                error={typeof clientErrors.operation_id === 'string' ? clientErrors.operation_id : undefined}
              />
              {recent.operations.length > 0 && (
                <div className="flex flex-wrap gap-1 pt-1">
                  {recent.operations.map(id => {
                    const option = operationsLookup.getCachedItem(id);
                    if (!option) {
                      return null;
                    }

                    const label = option.customer?.name ? `${option.operationid} — ${option.customer.name}` : option.operationid;

                    const isActive = data.operation_id === id;
                    return (
                      <button
                        type="button"
                        key={id}
                        onClick={() => handleFieldChange('operation_id', id)}
                        className={`rounded px-2 py-0.5 text-xs transition ${
                          isActive
                            ? 'border-emerald-600 bg-emerald-600 text-white shadow-sm'
                            : 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <FormField label="Trip Number" required error={clientErrors.trip_number}>
              <Input
                id="trip_number"
                value={data.trip_number}
                onChange={event => handleFieldChange('trip_number', event.target.value)}
                placeholder="e.g., OUT-TRIP-2309"
              />
            </FormField>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="space-y-2">
              <Label>
                Dispatch Date & Time <span className="text-red-500">*</span>
              </Label>
              <Input
                type="datetime-local"
                value={data.dispatch_date || ''}
                onChange={event => handleFieldChange('dispatch_date', event.target.value)}
                className={cn(
                  'w-full h-11',
                  clientErrors.dispatch_date ? 'border-red-500 focus-visible:border-red-500 focus-visible:ring-red-500/20' : undefined,
                )}
              />
              {clientErrors.dispatch_date && (
                <p className="flex items-center gap-1 text-xs text-destructive">
                  <AlertCircle className="h-3 w-3" />
                  {clientErrors.dispatch_date}
                </p>
              )}
            </div>

            <FormField label="Trip Status" required error={clientErrors.status}>
              <Select value={data.status} onValueChange={value => handleFieldChange('status', value)}>
                <SelectTrigger id="status" className={clientErrors.status ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {statusOptionValues.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
          </div>
        </FormSection>

        <FormSection
          title="Route & Distance"
          description="Select the origin and destination to auto-resolve registered distances."
          icon={<MapPin className="h-4 w-4" />}
        >
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <PlaceCombobox
                id="from_place_id"
                label="Origin"
                required
                value={data.from_place_id}
                places={places}
                placeholder="Select origin"
                onSelect={value => handleFieldChange('from_place_id', value)}
                error={clientErrors.from_place_id}
              />
              <PlaceCombobox
                id="to_place_id"
                label="Destination"
                required
                value={data.to_place_id}
                places={places}
                placeholder="Select destination"
                onSelect={value => handleFieldChange('to_place_id', value)}
                error={clientErrors.to_place_id}
              />
            </div>

            {distanceLoading && (
              <p className="flex items-center gap-2 rounded-lg border border-dashed bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" />
                Resolving registered distance...
              </p>
            )}

            {distanceStatus && (
              <Alert variant={distanceStatus.found ? 'default' : 'destructive'}>
                {distanceStatus.found ? <CheckCircle className="h-4 w-4 text-emerald-500" /> : <AlertCircle className="h-4 w-4" />}
                <AlertTitle>{distanceStatus.found ? 'Distance applied' : 'Distance missing'}</AlertTitle>
                <AlertDescription>{distanceStatus.message}</AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              <FormField label="Distance (km)" error={clientErrors.distance_km}>
                <Input
                  id="distance_km"
                  value={data.distance_km}
                  onChange={event => handleFieldChange('distance_km', event.target.value)}
                  placeholder="e.g., 540"
                />
              </FormField>

              <FormField label="Cargo Volume (MT)" error={clientErrors.cargo_volume_mt}>
                <Input
                  id="cargo_volume_mt"
                  value={data.cargo_volume_mt}
                  onChange={event => handleFieldChange('cargo_volume_mt', event.target.value)}
                  placeholder="e.g., 32.5"
                />
              </FormField>

              <FormField label="Ton-Kilometres">
                <Input id="tonkm" value={data.tonkm} readOnly className="bg-muted text-muted-foreground" />
              </FormField>
            </div>
          </div>
        </FormSection>

        <FormSection title="Cost & Notes" description="Record spend and supporting remarks for context." icon={<Wallet className="h-4 w-4" />}>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <FormField label="Trip Cost" error={clientErrors.cost}>
              <Input
                id="cost"
                value={data.cost}
                onChange={event => handleFieldChange('cost', event.target.value)}
                placeholder="e.g., 125000"
              />
            </FormField>

            <FormField label="Remarks">
              <Textarea
                id="remarks"
                value={data.remarks}
                onChange={event => handleFieldChange('remarks', event.target.value)}
                placeholder="Add optional context such as special conditions or vendor notes"
                className="min-h-[112px]"
              />
            </FormField>
          </div>

          <div className="rounded-lg border border-dashed bg-muted/50 p-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              <span>Tip: leave cost and cargo fields blank if they are not yet confirmed. You can update them after the trip closes.</span>
            </div>
          </div>
        </FormSection>
      </form>

      <FormActionsBar>
        <Button type="button" variant="outline" asChild>
          <Link href="/outsource-performances">Cancel</Link>
        </Button>
        <Button type="submit" disabled={processing} onClick={submit}>
          {processing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Trip
            </>
          )}
        </Button>
      </FormActionsBar>

      <ScrollToTopFab />
    </FormPageLayout>
  );
}
