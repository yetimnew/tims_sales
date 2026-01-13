import { FormPageLayout } from '@/components/forms/form-page-layout';
import { FormSection } from '@/components/forms/form-section';
import { FormField } from '@/components/forms/form-field';
import { FormActionsBar } from '@/components/forms/form-actions-bar';
import { UnsavedChangesBadge } from '@/components/forms/unsaved-changes-badge';
import { ScrollToTopFab } from '@/components/forms/scroll-to-top-fab';
import { useCallback, useEffect, useMemo, useRef, useState, type FormEventHandler } from 'react';
import { Link, router, useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { SearchableEntityCombobox } from '@/components/searchable-entity-combobox';
import { PlaceCombobox } from '@/components/place-combobox';
import { DeleteConfirmationDialog } from '@/components/delete-confirmation-dialog';
import { useToast } from '@/hooks/use-toast';
import { usePermissions } from '@/hooks/use-permissions';
import { useRemoteLookup } from '@/hooks/use-remote-lookup';
import { search as operationsSearch } from '@/routes/operations';
import { validateOutsourcePerformance, type ValidationErrors } from '@/lib/validation';
import { cn } from '@/lib/utils';
import type { BreadcrumbItem } from '@/types';
import { AlertCircle, CheckCircle, ClipboardList, MapPin, Package, Pencil, RefreshCcw, Trash2, Wallet } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface OutsourceOption {
  id: number;
  name: string;
}

interface OperationOption {
  id: number;
  operationid: string;
  customer?:
    | {
        id: number;
        name: string;
      }
    | null;
}

interface PlaceOption {
  id: number;
  name: string;
}

interface StatusOption {
  label: string;
  value: string;
}

interface OutsourcePerformanceResource {
  id: number;
  outsource_id: number;
  operation_id: number;
  trip_number: string;
  dispatch_date: string | null;
  from_place_id: number;
  to_place_id: number;
  distance_km: number | null;
  cargo_volume_mt: number | null;
  tonkm: number | null;
  cost: number | null;
  remarks: string | null;
  status: string | null;
  outsource?: OutsourceOption | null;
  operation?: OperationOption | null;
}

interface OutsourcePerformancesEditProps {
  outsourcePerformance: OutsourcePerformanceResource;
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

export default function OutsourcePerformancesEdit({ outsourcePerformance, outsources, statusOptions, places }: OutsourcePerformancesEditProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { hasPermission } = usePermissions();

  const breadcrumbs = useMemo<BreadcrumbItem[]>(
    () => [
      { title: t('outsourcePerformances.title'), href: '/outsource-performances' },
      { title: t('outsourcePerformances.form.edit.showBreadcrumb'), href: `/outsource-performances/${outsourcePerformance.id}` },
      { title: t('outsourcePerformances.form.edit.breadcrumb'), href: `/outsource-performances/${outsourcePerformance.id}/edit` },
    ],
    [outsourcePerformance.id, t],
  );

  const initialFormState: OutsourcePerformanceFormData = {
    outsource_id: outsourcePerformance.outsource_id?.toString() ?? '',
    operation_id: outsourcePerformance.operation_id?.toString() ?? '',
    trip_number: outsourcePerformance.trip_number ?? '',
    dispatch_date: outsourcePerformance.dispatch_date ?? '',
    from_place_id: outsourcePerformance.from_place_id?.toString() ?? '',
    to_place_id: outsourcePerformance.to_place_id?.toString() ?? '',
    distance_km: outsourcePerformance.distance_km !== null && outsourcePerformance.distance_km !== undefined ? Number(outsourcePerformance.distance_km).toFixed(2) : '',
    cargo_volume_mt: outsourcePerformance.cargo_volume_mt !== null && outsourcePerformance.cargo_volume_mt !== undefined ? Number(outsourcePerformance.cargo_volume_mt).toFixed(2) : '',
    tonkm: outsourcePerformance.tonkm !== null && outsourcePerformance.tonkm !== undefined ? Number(outsourcePerformance.tonkm).toFixed(2) : '0.00',
    cost: outsourcePerformance.cost !== null && outsourcePerformance.cost !== undefined ? Number(outsourcePerformance.cost).toFixed(2) : '',
    remarks: outsourcePerformance.remarks ?? '',
    status: outsourcePerformance.status ?? statusOptions[0]?.value ?? 'active',
  };

  const initialValuesRef = useRef<OutsourcePerformanceFormData>({ ...initialFormState });

  const { data, setData, put, errors, reset, transform, setDefaults } = useForm<OutsourcePerformanceFormData>({ ...initialValuesRef.current });

  const [clientErrors, setClientErrors] = useState<ValidationErrors>({});
  const [distanceStatus, setDistanceStatus] = useState<DistanceStatus>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  const operationSelectedIds = useMemo(() => (data.operation_id ? [data.operation_id] : []), [data.operation_id]);

  const operationsLookup = useRemoteLookup<OperationOption>({
    endpoint: operationsSearch.url(),
    getId: operation => operation.id,
    selectedIds: operationSelectedIds,
    limit: 20,
  });

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

  const handleDistanceAutoFill = useCallback(
    async (originId: string, destinationId: string, nextState: OutsourcePerformanceFormData) => {
      if (!originId || !destinationId) {
        return;
      }

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

        const tonKm = computeTonKilometers(formattedDistance, nextState.cargo_volume_mt);
        setData(previous => ({
          ...previous,
          distance_km: formattedDistance,
          tonkm: tonKm,
        }));

        setDistanceStatus({
          found: Boolean(result.found),
          message: result.found
            ? t('outsourcePerformances.form.distanceStatus.applied', { value: formattedDistance })
            : result.note ?? t('outsourcePerformances.form.distanceStatus.missing'),
        });
      } catch (error) {
        console.error('Distance auto-fill failed:', error);
        const tonKm = computeTonKilometers('0.00', nextState.cargo_volume_mt);
        setData(previous => ({
          ...previous,
          distance_km: '0.00',
          tonkm: tonKm,
        }));
        setDistanceStatus({
          found: false,
          message: t('outsourcePerformances.form.distanceStatus.failed'),
        });
      }
    },
    [setData, t],
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
      const nextState: OutsourcePerformanceFormData = {
        ...data,
        [field]: value,
      } as OutsourcePerformanceFormData;

      nextState.tonkm = computeTonKilometers(nextState.distance_km, nextState.cargo_volume_mt);

      setData(() => ({ ...nextState }));

      if (clientErrors[field]) {
        setFieldError(field, undefined);
      }

      if (field === 'from_place_id' || field === 'to_place_id') {
        if (!nextState.from_place_id || !nextState.to_place_id) {
          setDistanceStatus(null);
          setData(previous => ({
            ...previous,
            distance_km: '',
            tonkm: computeTonKilometers('', nextState.cargo_volume_mt),
          }));
          return;
        }

        void handleDistanceAutoFill(nextState.from_place_id, nextState.to_place_id, nextState);
      }
    },
    [clientErrors, data, handleDistanceAutoFill, setData, setFieldError],
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

    put(`/outsource-performances/${outsourcePerformance.id}`, {
      preserveScroll: true,
      onSuccess: () => {
        toast({
          title: t('outsourcePerformances.form.edit.successTitle'),
          description: t('outsourcePerformances.form.edit.successDescription'),
        });
        setClientErrors({});
        setDistanceStatus(null);
        initialValuesRef.current = { ...trimmed };
        setDefaults({ ...trimmed });
        reset();
        setData(() => ({ ...trimmed }));
        setIsDirty(false);
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

  const resetForm = () => {
    reset();
    setData(() => ({ ...initialValuesRef.current }));
    setClientErrors({});
    setDistanceStatus(null);
    setIsDirty(false);
  };

  const handleDeleteConfirm = () => {
    setIsDeleting(true);
    router.delete(`/outsource-performances/${outsourcePerformance.id}`, {
      onSuccess: () => {
        setDeleteDialogOpen(false);
        setIsDeleting(false);
      },
      onError: () => {
        setIsDeleting(false);
      },
    });
  };

  const renderStatusAlert = () => {
    if (!distanceStatus) {
      return null;
    }

    const Icon = distanceStatus.found ? CheckCircle : AlertCircle;

    return (
      <Alert variant={distanceStatus.found ? 'default' : 'destructive'}>
        <Icon className="h-4 w-4" />
        <AlertDescription>{distanceStatus.message}</AlertDescription>
      </Alert>
    );
  };

  return (
    <FormPageLayout
      title={t('outsourcePerformances.form.edit.title')}
      headTitle={t('outsourcePerformances.form.edit.headTitle', { trip: outsourcePerformance.trip_number })}
      description={t('outsourcePerformances.form.edit.description')}
      breadcrumbs={breadcrumbs}
      icon={<Pencil className="h-5 w-5" />}
      headerAside={
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={resetForm}>
            <RefreshCcw className="mr-2 h-4 w-4" />
            {t('outsourcePerformances.form.edit.reset')}
          </Button>
          {isDirty && <UnsavedChangesBadge />}
          {hasPermission('outsource-performances.destroy') && (
            <Button type="button" variant="destructive" size="sm" onClick={() => setDeleteDialogOpen(true)}>
              <Trash2 className="h-4 w-4 mr-2" />
              {t('outsourcePerformances.actions.delete')}
            </Button>
          )}
        </div>
      }
    >
      <form onSubmit={submit} className="flex flex-1 flex-col gap-8 overflow-y-auto p-6 pb-24" noValidate>
        <FormSection
          title={t('outsourcePerformances.form.sections.overview.title')}
          description={t('outsourcePerformances.form.edit.overviewDescription')}
          icon={<ClipboardList className="h-4 w-4" />}
        >
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <FormField label={t('outsourcePerformances.form.fields.vendor.label')} required error={clientErrors.outsource_id}>
              <Select value={data.outsource_id} onValueChange={value => handleFieldChange('outsource_id', value)}>
                <SelectTrigger className={clientErrors.outsource_id ? 'border-red-500' : ''}>
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
            </div>

            <FormField label={t('outsourcePerformances.form.fields.tripNumber.label')} required error={clientErrors.trip_number}>
              <Input id="trip_number" value={data.trip_number} onChange={event => handleFieldChange('trip_number', event.target.value)} className={clientErrors.trip_number ? 'border-red-500' : ''} />
            </FormField>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="space-y-2">
              <span className="flex items-center gap-1 text-sm font-medium text-slate-700 dark:text-slate-200">
                {t('outsourcePerformances.form.fields.dispatchDate.label')} <span className="text-red-500">*</span>
              </span>
              <Input
                type="datetime-local"
                value={data.dispatch_date || ''}
                onChange={event => handleFieldChange('dispatch_date', event.target.value)}
                className={cn('w-full h-11', clientErrors.dispatch_date ? 'border-red-500 focus-visible:border-red-500 focus-visible:ring-red-500/20' : undefined)}
              />
              {clientErrors.dispatch_date && (
                <p className="flex items-center gap-1 text-xs text-red-500">
                  <AlertCircle className="h-3 w-3" />
                  {clientErrors.dispatch_date}
                </p>
              )}
            </div>
          </div>
        </FormSection>

        <FormSection
          title={t('outsourcePerformances.form.sections.route.title')}
          description={t('outsourcePerformances.form.edit.routeDescription')}
          icon={<MapPin className="h-4 w-4" />}
        >
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <PlaceCombobox id="from_place_id" label={t('outsourcePerformances.form.fields.origin.label')} required value={data.from_place_id} places={places} placeholder={t('outsourcePerformances.form.fields.origin.placeholder')} onSelect={value => handleFieldChange('from_place_id', value)} error={clientErrors.from_place_id} />
            <PlaceCombobox id="to_place_id" label={t('outsourcePerformances.form.fields.destination.label')} required value={data.to_place_id} places={places} placeholder={t('outsourcePerformances.form.fields.destination.placeholder')} onSelect={value => handleFieldChange('to_place_id', value)} error={clientErrors.to_place_id} />
          </div>

          {renderStatusAlert()}

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <FormField label={t('outsourcePerformances.form.fields.distance.label')} error={clientErrors.distance_km}>
              <Input id="distance_km" value={data.distance_km} onChange={event => handleFieldChange('distance_km', event.target.value)} />
            </FormField>

            <FormField label={t('outsourcePerformances.form.fields.cargo.label')} error={clientErrors.cargo_volume_mt}>
              <Input id="cargo_volume_mt" value={data.cargo_volume_mt} onChange={event => handleFieldChange('cargo_volume_mt', event.target.value)} />
            </FormField>

            <FormField label={t('outsourcePerformances.form.fields.tonkm.label')}>
              <Input id="tonkm" value={data.tonkm} readOnly className="bg-slate-50 text-slate-700 dark:bg-slate-900/40 dark:text-slate-200" />
            </FormField>
          </div>
        </FormSection>

        <FormSection
          title={t('outsourcePerformances.form.sections.cost.title')}
          description={t('outsourcePerformances.form.edit.costDescription')}
          icon={<Wallet className="h-4 w-4" />}
        >
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <FormField label={t('outsourcePerformances.form.fields.cost.label')} error={clientErrors.cost}>
              <Input id="cost" value={data.cost} onChange={event => handleFieldChange('cost', event.target.value)} />
            </FormField>

            <FormField label={t('outsourcePerformances.form.fields.remarks.label')}>
              <Textarea id="remarks" value={data.remarks} onChange={event => handleFieldChange('remarks', event.target.value)} placeholder={t('outsourcePerformances.form.edit.remarksPlaceholder')} className="min-h-[112px]" />
            </FormField>
          </div>
        </FormSection>

        <section className="space-y-4 rounded-xl border border-dashed border-slate-300/70 bg-slate-50/70 p-5 text-sm text-muted-foreground dark:border-slate-700/70 dark:bg-slate-900/40">
          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
            <Package className="h-4 w-4" />
            <span>{t('outsourcePerformances.form.edit.tip')}</span>
          </div>
        </section>
      </form>

      <FormActionsBar>
        <Button type="button" variant="outline" asChild>
          <Link href={`/outsource-performances/${outsourcePerformance.id}`}>{t('outsourcePerformances.actions.cancel')}</Link>
        </Button>
        <Button type="submit" disabled={Object.keys(clientErrors).length > 0} onClick={submit}>
          <CheckCircle className="mr-2 h-4 w-4" />
          {t('outsourcePerformances.form.actions.saveChanges')}
        </Button>
      </FormActionsBar>

      <ScrollToTopFab />

      <DeleteConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title={t('outsourcePerformances.form.edit.deleteTitle')}
        description={t('outsourcePerformances.form.edit.deleteDescription')}
        itemName={outsourcePerformance.trip_number}
        onConfirm={handleDeleteConfirm}
        isLoading={isDeleting}
      />
    </FormPageLayout>
  );
}
