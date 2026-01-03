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
import { validateRegion, type ValidationErrors } from '@/lib/validation';
import { toast } from '@/hooks/use-toast';
import { AlertCircle, CheckCircle, Compass, Globe2, Layers, Map } from 'lucide-react';

interface Region {
  id: number;
  name: string;
  status: 'active' | 'inactive';
  code?: string | null;
  capital?: string | null;
  area_km2?: number | string | null;
  population?: number | string | null;
  latitude?: number | string | null;
  longitude?: number | string | null;
  elevation_m?: number | string | null;
  accessibility_score?: number | string | null;
  last_surveyed_at?: string | null;
  description?: string | null;
  infrastructure_notes?: string | null;
  climate_profile?: string | null;
}

interface RegionEditProps {
  region: Region;
}

type RegionFormData = {
  name: string;
  status: 'active' | 'inactive';
  code: string;
  capital: string;
  area_km2: string;
  population: string;
  latitude: string;
  longitude: string;
  elevation_m: string;
  accessibility_score: string;
  last_surveyed_at: string;
  description: string;
  infrastructure_notes: string;
  climate_profile: string;
};

export default function RegionsEdit({ region }: RegionEditProps) {
  const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Regions', href: '/regions' },
    { title: 'Edit', href: `/regions/${region.id}/edit` },
  ];

  const { data, setData, put, processing, errors } = useForm<RegionFormData>({
    name: region.name ?? '',
    status: region.status,
    code: region.code ?? '',
    capital: region.capital ?? '',
    area_km2: region.area_km2 !== null && region.area_km2 !== undefined ? String(region.area_km2) : '',
    population: region.population !== null && region.population !== undefined ? String(region.population) : '',
    latitude: region.latitude !== null && region.latitude !== undefined ? String(region.latitude) : '',
    longitude: region.longitude !== null && region.longitude !== undefined ? String(region.longitude) : '',
    elevation_m: region.elevation_m !== null && region.elevation_m !== undefined ? String(region.elevation_m) : '',
    accessibility_score:
      region.accessibility_score !== null && region.accessibility_score !== undefined ? String(region.accessibility_score) : '',
    last_surveyed_at: region.last_surveyed_at ?? '',
    description: region.description ?? '',
    infrastructure_notes: region.infrastructure_notes ?? '',
    climate_profile: region.climate_profile ?? '',
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

  const setFieldError = useCallback((field: keyof RegionFormData, message: string) => {
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
    (field: keyof RegionFormData, value: string) => {
      const nextValues: RegionFormData = { ...data, [field]: value } as RegionFormData;
      const fieldErrors = validateRegion(nextValues);
      setFieldError(field, fieldErrors[field] ?? '');
    },
    [data, setFieldError],
  );

  const handleFieldChange = useCallback(
    (field: keyof RegionFormData, value: string) => {
      setData(field, value as RegionFormData[keyof RegionFormData]);
      validateField(field, value);
      setIsDirty(true);
    },
    [setData, validateField],
  );

  const submit: FormEventHandler = event => {
    event.preventDefault();

    const validationResults = validateRegion(data);
    if (Object.keys(validationResults).length > 0) {
      setFrontendErrors(validationResults);
      return;
    }

    put(`/regions/${region.id}`, {
      preserveScroll: true,
      onSuccess: () => {
        setFrontendErrors({});
        setIsDirty(false);
      },
    });
  };

  const getFieldError = useCallback((field: keyof RegionFormData) => errors[field] || frontendErrors[field] || '', [errors, frontendErrors]);

  return (
    <FormPageLayout
      title="Update Region"
      headTitle={`Edit ${region.name}`}
      description="Refine administrative data and geospatial insights to keep logistics planning current."
      breadcrumbs={breadcrumbs}
      icon={<Map className="h-5 w-5" />}
      headerAside={isDirty && <UnsavedChangesBadge />}
    >
      <form onSubmit={submit} className="flex flex-1 flex-col gap-6 overflow-y-auto p-6 pb-24" noValidate>
        {hasErrors && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>Review the highlighted fields and correct validation issues before saving the region update.</AlertDescription>
          </Alert>
        )}

        <FormSection title="Region Identity" description="Ensure naming and governance metadata stays aligned with the latest records." icon={<Globe2 className="h-4 w-4" />}>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <FormField label="Region Name" required error={getFieldError('name')}>
              <Input id="name" type="text" value={data.name} onChange={event => handleFieldChange('name', event.target.value)} placeholder="e.g., Oromia" />
            </FormField>

            <FormField label="Region Code" error={getFieldError('code')}>
              <Input id="code" type="text" value={data.code} onChange={event => handleFieldChange('code', event.target.value)} placeholder="e.g., OR-01" />
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

            <FormField label="Capital City" error={getFieldError('capital')}>
              <Input id="capital" type="text" value={data.capital} onChange={event => handleFieldChange('capital', event.target.value)} placeholder="e.g., Adama" />
            </FormField>
          </div>
        </FormSection>

        <FormSection title="Geographic Profile" description="Update the region footprint, demographics, and positioning for analytics." icon={<Compass className="h-4 w-4" />}>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <FormField label="Area (km²)" error={getFieldError('area_km2')}>
              <Input id="area_km2" type="number" step="0.01" value={data.area_km2} onChange={event => handleFieldChange('area_km2', event.target.value)} placeholder="e.g., 35363" />
            </FormField>

            <FormField label="Population" error={getFieldError('population')}>
              <Input id="population" type="number" step="1" value={data.population} onChange={event => handleFieldChange('population', event.target.value)} placeholder="e.g., 4800000" />
            </FormField>

            <FormField label="Elevation (m)" error={getFieldError('elevation_m')}>
              <Input id="elevation_m" type="number" step="0.01" value={data.elevation_m} onChange={event => handleFieldChange('elevation_m', event.target.value)} placeholder="e.g., 1325" />
            </FormField>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <FormField label="Latitude" error={getFieldError('latitude')}>
              <Input id="latitude" type="number" step="0.000001" value={data.latitude} onChange={event => handleFieldChange('latitude', event.target.value)} placeholder="e.g., 8.980603" />
            </FormField>

            <FormField label="Longitude" error={getFieldError('longitude')}>
              <Input id="longitude" type="number" step="0.000001" value={data.longitude} onChange={event => handleFieldChange('longitude', event.target.value)} placeholder="e.g., 38.757761" />
            </FormField>
          </div>
        </FormSection>

        <FormSection title="Infrastructure & Climate" description="Capture readiness signals, climate context, and operational notes." icon={<Layers className="h-4 w-4" />}>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <FormField label="Accessibility Score" error={getFieldError('accessibility_score')}>
              <Input
                id="accessibility_score"
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={data.accessibility_score}
                onChange={event => handleFieldChange('accessibility_score', event.target.value)}
                placeholder="0 - 100"
              />
            </FormField>

            <FormField label="Last Surveyed" error={getFieldError('last_surveyed_at')}>
              <Input id="last_surveyed_at" type="date" value={data.last_surveyed_at} onChange={event => handleFieldChange('last_surveyed_at', event.target.value)} />
            </FormField>
          </div>

          <FormField label="Description">
            <Textarea
              id="description"
              value={data.description}
              onChange={event => handleFieldChange('description', event.target.value)}
              placeholder="Regional overview, economic focus, or key logistics partners"
              className="min-h-[100px]"
            />
          </FormField>

          <FormField label="Infrastructure Notes">
            <Textarea
              id="infrastructure_notes"
              value={data.infrastructure_notes}
              onChange={event => handleFieldChange('infrastructure_notes', event.target.value)}
              placeholder="Connectivity, utilities, telecom coverage, or known constraints"
              className="min-h-[120px]"
            />
          </FormField>

          <FormField label="Climate Profile">
            <Textarea
              id="climate_profile"
              value={data.climate_profile}
              onChange={event => handleFieldChange('climate_profile', event.target.value)}
              placeholder="Seasonal patterns, temperature ranges, or weather alerts"
              className="min-h-[120px]"
            />
          </FormField>
        </FormSection>
      </form>

      <FormActionsBar>
        <Button type="button" variant="outline" asChild>
          <Link href="/regions">Cancel</Link>
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
              Update Region
            </>
          )}
        </Button>
      </FormActionsBar>

      <ScrollToTopFab />
    </FormPageLayout>
  );
}
