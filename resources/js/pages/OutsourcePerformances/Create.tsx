import { FormPageLayout } from '@/components/forms/form-page-layout';
import { FormSection } from '@/components/forms/form-section';
import { FormField } from '@/components/forms/form-field';
import { FormActionsBar } from '@/components/forms/form-actions-bar';
import { UnsavedChangesBadge } from '@/components/forms/unsaved-changes-badge';
import { ScrollToTopFab } from '@/components/forms/scroll-to-top-fab';
import { useCallback, useEffect, useMemo, useRef, useState, type FormEventHandler } from 'react';
import { Link, useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { SearchableEntityCombobox } from '@/components/searchable-entity-combobox';
import { PlaceCombobox } from '@/components/place-combobox';
import { useToast } from '@/hooks/use-toast';
import { useRemoteLookup } from '@/hooks/use-remote-lookup';
import { search as operationsSearch } from '@/routes/operations';
import { validateOutsourcePerformance, type ValidationErrors } from '@/lib/validation';
import { cn } from '@/lib/utils';
import type { BreadcrumbItem } from '@/types';
import { AlertCircle, ArrowLeft, CheckCircle, ClipboardList, Loader2, MapPin, Package, Save, Wallet } from 'lucide-react';
import { useTranslation } from 'react-i18next';

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
  fullName?: string;
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
  const { t } = useTranslation();
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

  const statusOptionValues = useMemo(
    () => (statusOptions.length ? statusOptions : [{ label: t('outsourcePerformances.status.active'), value: 'active' }]),
    [statusOptions, t],
  );

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
        title: t('outsourcePerformances.form.validation.toastTitle'),
        description: backendMessages.join('\n'),
      });
    }
  }, [errors, t, toast]);

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
            message: t('outsourcePerformances.form.distanceStatus.applied', { value: formattedDistance }),
          });
        } else {
          setData('distance_km', '0.00');
          recalculateTonKilometers({ ...nextState, distance_km: '0.00' });
          setDistanceStatus({
            found: false,
            message:
              result.note ??
              t('outsourcePerformances.form.distanceStatus.missing'),
          });
        }
      } catch (error) {
        console.error('Distance auto-fill failed:', error);
        setData('distance_km', '0.00');
        recalculateTonKilometers({ ...nextState, distance_km: '0.00' });
        setDistanceStatus({
          found: false,
          message: t('outsourcePerformances.form.distanceStatus.failed'),
        });
      } finally {
        setDistanceLoading(false);
      }
    },
    [recalculateTonKilometers, setData, t],
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
        setDistanceStatus(null);
        if (!nextState.from_place_id || !nextState.to_place_id) {
          setDistanceLoading(false);
          setData('distance_km', '');
          recalculateTonKilometers({ ...nextState, distance_km: '' });
        } else {
          void handleDistanceAutoFill(nextState.from_place_id, nextState.to_place_id, nextState);
        }
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
        title: t('outsourcePerformances.form.validation.reviewTitle'),
        description: t('outsourcePerformances.form.validation.reviewDescription'),
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
          title: t('outsourcePerformances.form.create.successTitle'),
          description: t('outsourcePerformances.form.create.successDescription'),
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
  const hasErrors = Object.keys(clientErrors).length > 0 || Object.keys(errors).length > 0;
  const breadcrumbs = useMemo<BreadcrumbItem[]>(
    () => [
      { title: t('outsourcePerformances.title'), href: '/outsource-performances' },
      { title: t('outsourcePerformances.form.create.breadcrumb'), href: '/outsource-performances/create' },
    ],
    [t],
  );

  return (
    <FormPageLayout
      title={t('outsourcePerformances.form.create.title')}
      headTitle={t('outsourcePerformances.form.create.headTitle')}
      description={t('outsourcePerformances.form.create.description')}
      breadcrumbs={breadcrumbs}
      icon={<CheckCircle className="h-5 w-5" />}
      headerAside={
        <>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/outsource-performances">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t('outsourcePerformances.form.create.backToList')}
            </Link>
          </Button>
          {isDirty && <UnsavedChangesBadge />}
          <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
            {t('outsourcePerformances.form.create.badge')}
          </Badge>
        </>
      }
    >
      {hasErrors && (
        <div className="px-6 pt-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{t('outsourcePerformances.form.validation.resolve')}</AlertDescription>
          </Alert>
        </div>
      )}

      {generalError && (
        <div className="px-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{generalError}</AlertDescription>
          </Alert>
        </div>
      )}

      <form
        onSubmit={submit}
        className="flex flex-1 flex-col gap-8 overflow-y-auto p-6 pb-24"
        style={{ minHeight: 0 }}
        noValidate
      >

        <FormSection
          title={t('outsourcePerformances.form.sections.overview.title')}
          description={t('outsourcePerformances.form.sections.overview.description')}
          icon={
            <div className="rounded-lg bg-indigo-100 p-2 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400">
              <ClipboardList className="h-4 w-4" />
            </div>
          }
          contentClassName="gap-6 md:grid-cols-3"
        >
          <div className="space-y-2">
            <FormField label={t('outsourcePerformances.form.fields.vendor.label')} required error={clientErrors.outsource_id}>
              <Select value={data.outsource_id} onValueChange={value => handleFieldChange('outsource_id', value)}>
                <SelectTrigger id="outsource_id" className={clientErrors.outsource_id ? 'border-red-500 focus-visible:border-red-500 focus-visible:ring-red-200' : ''}>
                  <SelectValue placeholder={t('outsourcePerformances.form.fields.vendor.placeholder')} />
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
              label={t('outsourcePerformances.form.fields.operation.label')}
              required
              value={data.operation_id}
              items={operationsLookup.items}
              getValue={operation => operation.id}
              getLabel={operation => operation.operationid}
              getDescription={operation => operation.customer?.name}
              getKeywords={operation => [operation.operationid, operation.customer?.name]}
              placeholder={t('outsourcePerformances.form.fields.operation.placeholder')}
              searchPlaceholder={t('outsourcePerformances.form.fields.operation.searchPlaceholder')}
              searchValue={operationsLookup.query}
              onSearchChange={operationsLookup.setQuery}
              isLoading={operationsLookup.isLoading}
              loadingMessage={t('outsourcePerformances.form.fields.operation.loading')}
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

          <FormField label={t('outsourcePerformances.form.fields.tripNumber.label')} required error={clientErrors.trip_number}>
            <Input
              id="trip_number"
              value={data.trip_number}
              onChange={event => handleFieldChange('trip_number', event.target.value)}
              placeholder={t('outsourcePerformances.form.fields.tripNumber.placeholder')}
            />
          </FormField>

          <FormField label={t('outsourcePerformances.form.fields.dispatchDate.label')} required error={clientErrors.dispatch_date}>
            <Input
              id="dispatch_date"
              type="datetime-local"
              value={data.dispatch_date || ''}
              onChange={event => handleFieldChange('dispatch_date', event.target.value)}
              className={cn(
                'w-full h-11',
                clientErrors.dispatch_date ? 'border-red-500 focus-visible:border-red-500 focus-visible:ring-red-200' : undefined,
              )}
            />
          </FormField>

          <FormField label={t('outsourcePerformances.form.fields.status.label')} required error={clientErrors.status}>
            <Select value={data.status} onValueChange={value => handleFieldChange('status', value)}>
              <SelectTrigger id="status" className={clientErrors.status ? 'border-red-500 focus-visible:border-red-500 focus-visible:ring-red-200' : ''}>
                <SelectValue placeholder={t('outsourcePerformances.form.fields.status.placeholder')} />
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
        </FormSection>

        <FormSection
          title={t('outsourcePerformances.form.sections.route.title')}
          description={t('outsourcePerformances.form.sections.route.description')}
          icon={
            <div className="rounded-lg bg-sky-100 p-2 text-sky-600 dark:bg-sky-900/30 dark:text-sky-400">
              <MapPin className="h-4 w-4" />
            </div>
          }
          contentClassName="gap-6 md:grid-cols-2"
        >
          <PlaceCombobox
            id="from_place_id"
            label={t('outsourcePerformances.form.fields.origin.label')}
            required
            value={data.from_place_id}
            places={places}
            placeholder={t('outsourcePerformances.form.fields.origin.placeholder')}
            onSelect={value => handleFieldChange('from_place_id', value)}
            error={clientErrors.from_place_id}
          />
          <PlaceCombobox
            id="to_place_id"
            label={t('outsourcePerformances.form.fields.destination.label')}
            required
            value={data.to_place_id}
            places={places}
            placeholder={t('outsourcePerformances.form.fields.destination.placeholder')}
            onSelect={value => handleFieldChange('to_place_id', value)}
            error={clientErrors.to_place_id}
          />
          <div className="space-y-4 md:col-span-2">
            {distanceLoading && (
              <p className="flex items-center gap-2 rounded-lg border border-dashed bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" />
                {t('outsourcePerformances.form.distanceStatus.resolving')}
              </p>
            )}

            {distanceStatus && (
              <Alert variant={distanceStatus.found ? 'default' : 'destructive'}>
                {distanceStatus.found ? <CheckCircle className="h-4 w-4 text-emerald-500" /> : <AlertCircle className="h-4 w-4" />}
                <AlertTitle>
                  {distanceStatus.found
                    ? t('outsourcePerformances.form.distanceStatus.appliedTitle')
                    : t('outsourcePerformances.form.distanceStatus.missingTitle')}
                </AlertTitle>
                <AlertDescription>{distanceStatus.message}</AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              <FormField label={t('outsourcePerformances.form.fields.distance.label')} error={clientErrors.distance_km}>
                <Input
                  id="distance_km"
                  value={data.distance_km}
                  onChange={event => handleFieldChange('distance_km', event.target.value)}
                  placeholder={t('outsourcePerformances.form.fields.distance.placeholder')}
                />
              </FormField>

              <FormField label={t('outsourcePerformances.form.fields.cargo.label')} error={clientErrors.cargo_volume_mt}>
                <Input
                  id="cargo_volume_mt"
                  value={data.cargo_volume_mt}
                  onChange={event => handleFieldChange('cargo_volume_mt', event.target.value)}
                  placeholder={t('outsourcePerformances.form.fields.cargo.placeholder')}
                />
              </FormField>

              <FormField label={t('outsourcePerformances.form.fields.tonkm.label')}>
                <Input id="tonkm" value={data.tonkm} readOnly className="bg-muted text-muted-foreground" />
              </FormField>
            </div>
          </div>
        </FormSection>

        <FormSection
          title={t('outsourcePerformances.form.sections.cost.title')}
          description={t('outsourcePerformances.form.sections.cost.description')}
          icon={
            <div className="rounded-lg bg-amber-100 p-2 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
              <Wallet className="h-4 w-4" />
            </div>
          }
          contentClassName="gap-6 md:grid-cols-2"
        >
          <FormField label={t('outsourcePerformances.form.fields.cost.label')} error={clientErrors.cost}>
            <Input
              id="cost"
              value={data.cost}
              onChange={event => handleFieldChange('cost', event.target.value)}
              placeholder={t('outsourcePerformances.form.fields.cost.placeholder')}
            />
          </FormField>

          <FormField label={t('outsourcePerformances.form.fields.remarks.label')}>
            <Textarea
              id="remarks"
              value={data.remarks}
              onChange={event => handleFieldChange('remarks', event.target.value)}
              placeholder={t('outsourcePerformances.form.fields.remarks.placeholder')}
              className="min-h-[112px]"
            />
          </FormField>

          <div className="rounded-lg border border-dashed bg-muted/50 p-4 text-sm text-muted-foreground md:col-span-2">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              <span>{t('outsourcePerformances.form.tip')}</span>
            </div>
          </div>
        </FormSection>
      </form>

      <FormActionsBar>
        <Button type="button" variant="outline" asChild>
          <Link href="/outsource-performances">{t('outsourcePerformances.actions.cancel')}</Link>
        </Button>
        <Button type="submit" disabled={processing} onClick={submit}>
          {processing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t('outsourcePerformances.form.actions.saving')}
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              {t('outsourcePerformances.form.actions.save')}
            </>
          )}
        </Button>
      </FormActionsBar>

      <ScrollToTopFab />
    </FormPageLayout>
  );
}
