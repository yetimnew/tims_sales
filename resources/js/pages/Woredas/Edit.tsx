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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { validateWoreda, type ValidationErrors } from '@/lib/validation';
import { toast } from '@/hooks/use-toast';
import { AlertCircle, Building2, CheckCircle, FileText, Map } from 'lucide-react';

interface ZoneOption {
  id: number;
  name: string;
}

interface Woreda {
  id: number;
  name: string;
  status: 'active' | 'inactive';
  code?: string | null;
  zone_id: number;
  administrative_center?: string | null;
  area_km2?: number | string | null;
  population?: number | string | null;
  latitude?: number | string | null;
  longitude?: number | string | null;
  elevation_m?: number | string | null;
  accessibility_score?: number | string | null;
  description?: string | null;
  infrastructure_notes?: string | null;
  road_quality_notes?: string | null;
}

type WoredaFormData = {
  name: string;
  status: 'active' | 'inactive';
  code: string;
  zone_id: string;
  administrative_center: string;
  area_km2: string;
  population: string;
  latitude: string;
  longitude: string;
  elevation_m: string;
  accessibility_score: string;
  description: string;
  infrastructure_notes: string;
  road_quality_notes: string;
};

interface WoredasEditProps {
  woreda: Woreda;
  zones: ZoneOption[];
}

export default function WoredasEdit({ woreda, zones }: WoredasEditProps) {
  const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Woredas', href: '/woredas' },
    { title: 'Edit', href: `/woredas/${woreda.id}/edit` },
  ];

  const { data, setData, put, processing, errors } = useForm<WoredaFormData>({
    name: woreda.name || '',
    status: woreda.status ?? 'active',
    code: woreda.code ?? '',
    zone_id: woreda.zone_id ? woreda.zone_id.toString() : '',
    administrative_center: woreda.administrative_center ?? '',
    area_km2: woreda.area_km2 !== null && woreda.area_km2 !== undefined ? String(woreda.area_km2) : '',
    population: woreda.population !== null && woreda.population !== undefined ? String(woreda.population) : '',
    latitude: woreda.latitude !== null && woreda.latitude !== undefined ? String(woreda.latitude) : '',
    longitude: woreda.longitude !== null && woreda.longitude !== undefined ? String(woreda.longitude) : '',
    elevation_m: woreda.elevation_m !== null && woreda.elevation_m !== undefined ? String(woreda.elevation_m) : '',
    accessibility_score: woreda.accessibility_score !== null && woreda.accessibility_score !== undefined ? String(woreda.accessibility_score) : '',
    description: woreda.description ?? '',
    infrastructure_notes: woreda.infrastructure_notes ?? '',
    road_quality_notes: woreda.road_quality_notes ?? '',
  });

  const [frontendErrors, setFrontendErrors] = useState<ValidationErrors>({});
  const [isDirty, setIsDirty] = useState(false);

  const hasErrors = useMemo(() => Object.keys(errors).length > 0 || Object.keys(frontendErrors).length > 0, [errors, frontendErrors]);

  useEffect(() => {
    const errorMessages = Object.values(errors)
      .flatMap(message => (Array.isArray(message) ? message : message ? [message] : []))
      .filter((message): message is string => Boolean(message));

    if (errorMessages.length > 0) {
      toast({
        title: '⚠️ Validation Error',
        description: errorMessages.join(', '),
        variant: 'destructive',
      });
    }
  }, [errors]);

  const setFieldError = useCallback((field: keyof WoredaFormData, message: string) => {
    setFrontendErrors(prev => {
      const next = { ...prev };
      if (message) {
        next[field] = message;
      } else {
        delete next[field];
      }
      return next;
    });
  }, []);

  const validateField = useCallback(
    (field: keyof WoredaFormData, value: string) => {
      const nextValues: WoredaFormData = { ...data, [field]: value } as WoredaFormData;
      const fieldErrors = validateWoreda(nextValues);
      setFieldError(field, fieldErrors[field] ?? '');
    },
    [data, setFieldError],
  );

  const handleFieldChange = useCallback(
    (field: keyof WoredaFormData, value: string) => {
      setData(field, value as WoredaFormData[keyof WoredaFormData]);
      validateField(field, value);
      setIsDirty(true);
    },
    [setData, validateField],
  );

  const submit: FormEventHandler = event => {
    event.preventDefault();

    const validationResults = validateWoreda(data);
    if (Object.keys(validationResults).length > 0) {
      setFrontendErrors(validationResults);
      return;
    }

    put(`/woredas/${woreda.id}`, {
      preserveScroll: true,
      onSuccess: () => {
        setFrontendErrors({});
        setIsDirty(false);
      },
    });
  };

  const getFieldError = useCallback((field: keyof WoredaFormData) => errors[field] || frontendErrors[field] || '', [errors, frontendErrors]);

  return (
    <FormPageLayout
      title="Update Woreda"
      headTitle={`Edit ${woreda.name}`}
      description="Keep district intelligence synchronized with the latest field information."
      breadcrumbs={breadcrumbs}
      icon={<Map className="h-5 w-5" />}
      headerAside={isDirty && <UnsavedChangesBadge />}
    >
      <form onSubmit={submit} className="flex flex-1 flex-col gap-6 overflow-y-auto p-6 pb-24" noValidate>
        {hasErrors && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>Review the highlighted fields and correct validation issues before saving the woreda update.</AlertDescription>
          </Alert>
        )}

        <FormSection title="Woreda Identity" description="Confirm governance and classification details for the woreda." icon={<Building2 className="h-4 w-4" />}>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <FormField label="Woreda Name" required error={getFieldError('name')}>
              <Input id="name" type="text" value={data.name} onChange={event => handleFieldChange('name', event.target.value)} placeholder="e.g., Adaba" />
            </FormField>

            <FormField label="Zone" required error={getFieldError('zone_id')}>
              <Select value={data.zone_id} onValueChange={value => handleFieldChange('zone_id', value)}>
                <SelectTrigger className={getFieldError('zone_id') ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Select a zone" />
                </SelectTrigger>
                <SelectContent>
                  {zones.map(zone => (
                    <SelectItem key={zone.id} value={zone.id.toString()}>
                      {zone.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>

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

            <FormField label="Woreda Code" error={getFieldError('code')}>
              <Input id="code" type="text" value={data.code} onChange={event => handleFieldChange('code', event.target.value)} placeholder="e.g., WB-14" />
            </FormField>

            <div className="md:col-span-2">
              <FormField label="Administrative Center" error={getFieldError('administrative_center')}>
                <Input
                  id="administrative_center"
                  type="text"
                  value={data.administrative_center}
                  onChange={event => handleFieldChange('administrative_center', event.target.value)}
                  placeholder="Primary governance hub"
                />
              </FormField>
            </div>
          </div>
        </FormSection>

        <FormSection title="Spatial Footprint" description="Update geographic metrics that drive coverage analytics." icon={<Map className="h-4 w-4" />}>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <FormField label="Area (km²)" error={getFieldError('area_km2')}>
              <Input id="area_km2" type="number" step="0.01" value={data.area_km2} onChange={event => handleFieldChange('area_km2', event.target.value)} placeholder="e.g., 8450" />
            </FormField>

            <FormField label="Population" error={getFieldError('population')}>
              <Input id="population" type="number" step="1" value={data.population} onChange={event => handleFieldChange('population', event.target.value)} placeholder="e.g., 120000" />
            </FormField>

            <FormField label="Elevation (m)" error={getFieldError('elevation_m')}>
              <Input id="elevation_m" type="number" step="0.01" value={data.elevation_m} onChange={event => handleFieldChange('elevation_m', event.target.value)} placeholder="e.g., 1800" />
            </FormField>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <FormField label="Latitude" error={getFieldError('latitude')}>
              <Input id="latitude" type="number" step="0.000001" value={data.latitude} onChange={event => handleFieldChange('latitude', event.target.value)} placeholder="e.g., 7.123456" />
            </FormField>

            <FormField label="Longitude" error={getFieldError('longitude')}>
              <Input id="longitude" type="number" step="0.000001" value={data.longitude} onChange={event => handleFieldChange('longitude', event.target.value)} placeholder="e.g., 39.987654" />
            </FormField>
          </div>
        </FormSection>

        <FormSection title="Infrastructure Intelligence" description="Capture readiness signals and surface route quality considerations." icon={<FileText className="h-4 w-4" />}>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <FormField label="Accessibility Score" error={getFieldError('accessibility_score')}>
              <Input
                id="accessibility_score"
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={data.accessibility_score}
                onChange={event => handleFieldChange('accessibility_score', event.target.value)}
                placeholder="0 - 100"
              />
            </FormField>

            <FormField label="Description">
              <Textarea
                id="description"
                value={data.description}
                onChange={event => handleFieldChange('description', event.target.value)}
                placeholder="Brief narrative on service coverage or economic relevance"
                className="min-h-[100px]"
              />
            </FormField>
          </div>

          <FormField label="Infrastructure Notes">
            <Textarea
              id="infrastructure_notes"
              value={data.infrastructure_notes}
              onChange={event => handleFieldChange('infrastructure_notes', event.target.value)}
              placeholder="Connectivity, utilities, telecom coverage, or constraints"
              className="min-h-[120px]"
            />
          </FormField>

          <FormField label="Road Quality Notes">
            <Textarea
              id="road_quality_notes"
              value={data.road_quality_notes}
              onChange={event => handleFieldChange('road_quality_notes', event.target.value)}
              placeholder="Surface conditions, seasonal disruptions, or detours"
              className="min-h-[120px]"
            />
          </FormField>
        </FormSection>
      </form>

      <FormActionsBar>
        <Button type="button" variant="outline" asChild>
          <Link href="/woredas">Cancel</Link>
        </Button>
        <Button type="submit" disabled={processing || Object.keys(frontendErrors).length > 0 || Boolean(Object.keys(errors).length > 0)} onClick={submit}>
          {processing ? (
            <>
              <div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-white" />
              Updating...
            </>
          ) : (
            <>
              <CheckCircle className="mr-2 h-4 w-4" />
              Update Woreda
            </>
          )}
        </Button>
      </FormActionsBar>

      <ScrollToTopFab />
    </FormPageLayout>
  );
}
