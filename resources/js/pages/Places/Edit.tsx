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
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { validatePlace, type ValidationErrors } from '@/lib/validation';
import { toast } from '@/hooks/use-toast';
import { AlertCircle, CheckCircle, Compass, FileText, MapPin, Navigation } from 'lucide-react';

interface WoredaOption {
  id: number;
  name: string;
}

interface Place {
  id: number;
  name: string;
  status: 'active' | 'inactive';
  code?: string | null;
  woreda_id: number;
  latitude?: number | string | null;
  longitude?: number | string | null;
  elevation_m?: number | string | null;
  population?: number | string | null;
  is_logistics_hub?: boolean | null;
  accessibility_score?: number | string | null;
  description?: string | null;
  infrastructure_notes?: string | null;
  road_quality_notes?: string | null;
  boundary_geojson?: unknown;
}

type PlaceFormData = {
  name: string;
  status: 'active' | 'inactive';
  code: string;
  woreda_id: string;
  latitude: string;
  longitude: string;
  elevation_m: string;
  population: string;
  is_logistics_hub: boolean;
  accessibility_score: string;
  description: string;
  infrastructure_notes: string;
  road_quality_notes: string;
  boundary_geojson: string;
};

interface PlacesEditProps {
  place: Place;
  woredas: WoredaOption[];
}

export default function PlacesEdit({ place, woredas }: PlacesEditProps) {
  const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Places', href: '/places' },
    { title: 'Edit', href: `/places/${place.id}/edit` },
  ];

  const { data, setData, put, processing, errors } = useForm<PlaceFormData>({
    name: place.name ?? '',
    status: place.status ?? 'active',
    code: place.code ?? '',
    woreda_id: place.woreda_id ? String(place.woreda_id) : '',
    latitude: place.latitude !== null && place.latitude !== undefined ? String(place.latitude) : '',
    longitude: place.longitude !== null && place.longitude !== undefined ? String(place.longitude) : '',
    elevation_m: place.elevation_m !== null && place.elevation_m !== undefined ? String(place.elevation_m) : '',
    population: place.population !== null && place.population !== undefined ? String(place.population) : '',
    is_logistics_hub: Boolean(place.is_logistics_hub),
    accessibility_score: place.accessibility_score !== null && place.accessibility_score !== undefined ? String(place.accessibility_score) : '',
    description: place.description ?? '',
    infrastructure_notes: place.infrastructure_notes ?? '',
    road_quality_notes: place.road_quality_notes ?? '',
    boundary_geojson: place.boundary_geojson ? JSON.stringify(place.boundary_geojson, null, 2) : '',
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

  const setFieldError = useCallback((field: keyof PlaceFormData, message: string) => {
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
    (field: keyof PlaceFormData, value: string) => {
      const nextValues: PlaceFormData = { ...data, [field]: value } as PlaceFormData;
      const fieldErrors = validatePlace(nextValues);
      setFieldError(field, fieldErrors[field] ?? '');
    },
    [data, setFieldError],
  );

  const handleFieldChange = useCallback(
    (field: keyof PlaceFormData, value: string) => {
      setData(field, value as PlaceFormData[keyof PlaceFormData]);
      validateField(field, value);
      setIsDirty(true);
    },
    [setData, validateField],
  );

  const handleCheckboxChange = useCallback(
    (checked: boolean) => {
      setData('is_logistics_hub', checked);
      setIsDirty(true);
    },
    [setData],
  );

  const submit: FormEventHandler = event => {
    event.preventDefault();

    const validationResults = validatePlace(data);
    if (Object.keys(validationResults).length > 0) {
      setFrontendErrors(validationResults);
      return;
    }

    put(`/places/${place.id}`, {
      preserveScroll: true,
      onSuccess: () => {
        setFrontendErrors({});
        setIsDirty(false);
      },
    });
  };

  const getFieldError = useCallback((field: keyof PlaceFormData) => errors[field] || frontendErrors[field] || '', [errors, frontendErrors]);

  return (
    <FormPageLayout
      title="Update Place"
      headTitle={`Edit ${place.name}`}
      description="Ensure location intelligence stays accurate for planning and dispatch workflows."
      breadcrumbs={breadcrumbs}
      icon={<Navigation className="h-5 w-5" />}
      headerAside={isDirty && <UnsavedChangesBadge />}
    >
      <form onSubmit={submit} className="flex flex-1 flex-col gap-6 overflow-y-auto p-6 pb-24" noValidate>
        {hasErrors && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>Please review the highlighted fields and correct the validation errors before saving the place record.</AlertDescription>
          </Alert>
        )}

        <FormSection title="Place Identity" description="Maintain the core identity shown across operations and reporting." icon={<MapPin className="h-4 w-4" />}>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <FormField label="Place Name" required error={getFieldError('name')}>
              <Input id="name" type="text" value={data.name} onChange={event => handleFieldChange('name', event.target.value)} placeholder="e.g., Modjo Dry Port" />
            </FormField>

            <FormField label="Woreda" required error={getFieldError('woreda_id')}>
              <Select value={data.woreda_id} onValueChange={value => handleFieldChange('woreda_id', value)}>
                <SelectTrigger className={getFieldError('woreda_id') ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Select a woreda" />
                </SelectTrigger>
                <SelectContent>
                  {woredas.map(woreda => (
                    <SelectItem key={woreda.id} value={woreda.id.toString()}>
                      {woreda.name}
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

            <FormField label="Place Code" error={getFieldError('code')}>
              <Input id="code" type="text" value={data.code} onChange={event => handleFieldChange('code', event.target.value)} placeholder="e.g., PL-204" />
            </FormField>

            <div className="md:col-span-2">
              <div className="flex items-center gap-3 rounded-md border border-slate-200/70 bg-slate-50 px-3 py-2 text-sm text-slate-700 dark:border-slate-800/60 dark:bg-slate-900/30 dark:text-slate-300">
                <Checkbox id="is_logistics_hub" checked={data.is_logistics_hub} onCheckedChange={value => handleCheckboxChange(Boolean(value))} />
                <Label htmlFor="is_logistics_hub" className="cursor-pointer">
                  Mark as logistics hub (key fulfillment or consolidation point)
                </Label>
              </div>
            </div>
          </div>
        </FormSection>

        <FormSection title="Geo Coordinates & Scale" description="Keep coordinates and scale precise for routing accuracy." icon={<Compass className="h-4 w-4" />}>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <FormField label="Latitude" error={getFieldError('latitude')}>
              <Input id="latitude" type="number" step="0.000001" value={data.latitude} onChange={event => handleFieldChange('latitude', event.target.value)} placeholder="e.g., 8.980603" />
            </FormField>

            <FormField label="Longitude" error={getFieldError('longitude')}>
              <Input id="longitude" type="number" step="0.000001" value={data.longitude} onChange={event => handleFieldChange('longitude', event.target.value)} placeholder="e.g., 38.757761" />
            </FormField>

            <FormField label="Elevation (m)" error={getFieldError('elevation_m')}>
              <Input id="elevation_m" type="number" step="0.01" value={data.elevation_m} onChange={event => handleFieldChange('elevation_m', event.target.value)} placeholder="e.g., 2145" />
            </FormField>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <FormField label="Population" error={getFieldError('population')}>
              <Input id="population" type="number" step="1" value={data.population} onChange={event => handleFieldChange('population', event.target.value)} placeholder="e.g., 45000" />
            </FormField>

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
          </div>

          <FormField label="Boundary GeoJSON" hint="Optional — leave blank to rely on coordinates only.">
            <Textarea
              id="boundary_geojson"
              value={data.boundary_geojson}
              onChange={event => handleFieldChange('boundary_geojson', event.target.value)}
              placeholder="Paste GeoJSON Feature or FeatureCollection describing the place boundary"
              className="min-h-[160px] font-mono text-xs"
            />
          </FormField>
        </FormSection>

        <FormSection title="Operational Insights" description="Document infrastructure readiness and road intelligence." icon={<FileText className="h-4 w-4" />}>
          <FormField label="Description">
            <Textarea
              id="description"
              value={data.description}
              onChange={event => handleFieldChange('description', event.target.value)}
              placeholder="Purpose, services available, or notable details about this location"
              className="min-h-[100px]"
            />
          </FormField>

          <FormField label="Infrastructure Notes">
            <Textarea
              id="infrastructure_notes"
              value={data.infrastructure_notes}
              onChange={event => handleFieldChange('infrastructure_notes', event.target.value)}
              placeholder="Utilities, storage capacity, security, or communication coverage"
              className="min-h-[120px]"
            />
          </FormField>

          <FormField label="Road Quality Notes">
            <Textarea
              id="road_quality_notes"
              value={data.road_quality_notes}
              onChange={event => handleFieldChange('road_quality_notes', event.target.value)}
              placeholder="Surface conditions, seasonal risks, or alternate routes"
              className="min-h-[120px]"
            />
          </FormField>
        </FormSection>
      </form>

      <FormActionsBar>
        <Button type="button" variant="outline" asChild>
          <Link href="/places">Cancel</Link>
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
              Update Place
            </>
          )}
        </Button>
      </FormActionsBar>

      <ScrollToTopFab />
    </FormPageLayout>
  );
}
