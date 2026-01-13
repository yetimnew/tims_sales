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
import { validateZone, type ValidationErrors } from '@/lib/validation';
import { toast } from '@/hooks/use-toast';
import { AlertCircle, Building2, CheckCircle, Flag, Layers, MapPin } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface RegionOption {
  id: number;
  name: string;
}

interface Zone {
  id: number;
  name: string;
  region_id: number;
  status: 'active' | 'inactive';
  code?: string | null;
  description?: string | null;
  administrative_center?: string | null;
  area_km2?: number | string | null;
  population?: number | string | null;
  latitude?: number | string | null;
  longitude?: number | string | null;
  elevation_m?: number | string | null;
  accessibility_score?: number | string | null;
  infrastructure_notes?: string | null;
  climate_profile?: string | null;
}

type ZoneFormData = {
  name: string;
  region_id: string;
  status: 'active' | 'inactive';
  code: string;
  description: string;
  administrative_center: string;
  area_km2: string;
  population: string;
  latitude: string;
  longitude: string;
  elevation_m: string;
  accessibility_score: string;
  infrastructure_notes: string;
  climate_profile: string;
};

interface ZonesEditProps {
  zone: Zone;
  regions: RegionOption[];
}

export default function ZonesEdit({ zone, regions }: ZonesEditProps) {
  const { t } = useTranslation();

  const breadcrumbs = useMemo<BreadcrumbItem[]>(
    () => [
      { title: t('zones.title'), href: '/zones' },
      { title: t('zones.form.edit.breadcrumb'), href: `/zones/${zone.id}/edit` },
    ],
    [t, zone.id],
  );

  const { data, setData, put, processing, errors } = useForm<ZoneFormData>({
    name: zone.name,
    region_id: zone.region_id.toString(),
    status: zone.status,
    code: zone.code ?? '',
    description: zone.description ?? '',
    administrative_center: zone.administrative_center ?? '',
    area_km2: zone.area_km2 !== null && zone.area_km2 !== undefined ? String(zone.area_km2) : '',
    population: zone.population !== null && zone.population !== undefined ? String(zone.population) : '',
    latitude: zone.latitude !== null && zone.latitude !== undefined ? String(zone.latitude) : '',
    longitude: zone.longitude !== null && zone.longitude !== undefined ? String(zone.longitude) : '',
    elevation_m: zone.elevation_m !== null && zone.elevation_m !== undefined ? String(zone.elevation_m) : '',
    accessibility_score: zone.accessibility_score !== null && zone.accessibility_score !== undefined ? String(zone.accessibility_score) : '',
    infrastructure_notes: zone.infrastructure_notes ?? '',
    climate_profile: zone.climate_profile ?? '',
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
        title: t('zones.form.validation.title'),
        description: errorMessages.join(', '),
        variant: 'destructive',
      });
    }
  }, [errors, t]);

  const setFieldError = useCallback((field: keyof ZoneFormData, message: string) => {
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
    (field: keyof ZoneFormData, value: string) => {
      const nextValues: ZoneFormData = { ...data, [field]: value } as ZoneFormData;
      const fieldErrors = validateZone(nextValues);
      setFieldError(field, fieldErrors[field] ?? '');
    },
    [data, setFieldError],
  );

  const handleFieldChange = useCallback(
    (field: keyof ZoneFormData, value: string) => {
      setData(field, value as ZoneFormData[keyof ZoneFormData]);
      validateField(field, value);
      setIsDirty(true);
    },
    [setData, validateField],
  );

  const submit: FormEventHandler = event => {
    event.preventDefault();

    const validationResults = validateZone(data);
    if (Object.keys(validationResults).length > 0) {
      setFrontendErrors(validationResults);
      return;
    }

    put(`/zones/${zone.id}`, {
      preserveScroll: true,
      onSuccess: () => {
        setFrontendErrors({});
        setIsDirty(false);
      },
    });
  };

  const getFieldError = useCallback((field: keyof ZoneFormData) => errors[field] || frontendErrors[field] || '', [errors, frontendErrors]);

  return (
    <FormPageLayout
      title={t('zones.form.edit.title')}
      headTitle={t('zones.form.edit.headTitle', { name: zone.name })}
      description={t('zones.form.edit.description')}
      breadcrumbs={breadcrumbs}
      icon={<Layers className="h-5 w-5" />}
      headerAside={isDirty && <UnsavedChangesBadge />}
    >
      <form onSubmit={submit} className="flex flex-1 flex-col gap-6 overflow-y-auto p-6 pb-24" noValidate>
        {hasErrors && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{t('zones.form.validation.inlineEdit')}</AlertDescription>
          </Alert>
        )}

        <FormSection
          title={t('zones.form.sections.identity.title')}
          description={t('zones.form.sections.identity.descriptionEdit')}
          icon={<Building2 className="h-4 w-4" />}
        >
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <FormField label={t('zones.form.fields.name.label')} required error={getFieldError('name')}>
              <Input
                id="name"
                type="text"
                value={data.name}
                onChange={event => handleFieldChange('name', event.target.value)}
                placeholder={t('zones.form.fields.name.placeholder')}
              />
            </FormField>

            <FormField label={t('zones.form.fields.region.label')} required error={getFieldError('region_id')}>
              <Select value={data.region_id} onValueChange={value => handleFieldChange('region_id', value)}>
                <SelectTrigger className={getFieldError('region_id') ? 'border-red-500' : ''}>
                  <SelectValue placeholder={t('zones.form.fields.region.placeholder')} />
                </SelectTrigger>
                <SelectContent>
                  {regions.map(regionOption => (
                    <SelectItem key={regionOption.id} value={regionOption.id.toString()}>
                      {regionOption.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>

            <FormField label={t('zones.form.fields.status.label')} required error={getFieldError('status')}>
              <Select value={data.status} onValueChange={value => handleFieldChange('status', value)}>
                <SelectTrigger className={getFieldError('status') ? 'border-red-500' : ''}>
                  <SelectValue placeholder={t('zones.form.fields.status.placeholder')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">{t('zones.status.active')}</SelectItem>
                  <SelectItem value="inactive">{t('zones.status.inactive')}</SelectItem>
                </SelectContent>
              </Select>
            </FormField>

            <FormField label={t('zones.form.fields.code.label')} error={getFieldError('code')}>
              <Input
                id="code"
                type="text"
                value={data.code}
                onChange={event => handleFieldChange('code', event.target.value)}
                placeholder={t('zones.form.fields.code.placeholder')}
              />
            </FormField>

            <div className="md:col-span-2">
              <FormField label={t('zones.form.fields.administrativeCenter.label')} error={getFieldError('administrative_center')}>
                <Input
                  id="administrative_center"
                  type="text"
                  value={data.administrative_center}
                  onChange={event => handleFieldChange('administrative_center', event.target.value)}
                  placeholder={t('zones.form.fields.administrativeCenter.placeholder')}
                />
              </FormField>
            </div>
          </div>
        </FormSection>

        <FormSection
          title={t('zones.form.sections.geography.title')}
          description={t('zones.form.sections.geography.descriptionEdit')}
          icon={<MapPin className="h-4 w-4" />}
        >
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <FormField label={t('zones.form.fields.area.label')} error={getFieldError('area_km2')}>
              <Input
                id="area_km2"
                type="number"
                step="0.01"
                value={data.area_km2}
                onChange={event => handleFieldChange('area_km2', event.target.value)}
                placeholder={t('zones.form.fields.area.placeholder')}
              />
            </FormField>

            <FormField label={t('zones.form.fields.population.label')} error={getFieldError('population')}>
              <Input
                id="population"
                type="number"
                step="1"
                value={data.population}
                onChange={event => handleFieldChange('population', event.target.value)}
                placeholder={t('zones.form.fields.population.placeholder')}
              />
            </FormField>

            <FormField label={t('zones.form.fields.elevation.label')} error={getFieldError('elevation_m')}>
              <Input
                id="elevation_m"
                type="number"
                step="0.01"
                value={data.elevation_m}
                onChange={event => handleFieldChange('elevation_m', event.target.value)}
                placeholder={t('zones.form.fields.elevation.placeholder')}
              />
            </FormField>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <FormField label={t('zones.form.fields.latitude.label')} error={getFieldError('latitude')}>
              <Input
                id="latitude"
                type="number"
                step="0.000001"
                value={data.latitude}
                onChange={event => handleFieldChange('latitude', event.target.value)}
                placeholder={t('zones.form.fields.latitude.placeholder')}
              />
            </FormField>

            <FormField label={t('zones.form.fields.longitude.label')} error={getFieldError('longitude')}>
              <Input
                id="longitude"
                type="number"
                step="0.000001"
                value={data.longitude}
                onChange={event => handleFieldChange('longitude', event.target.value)}
                placeholder={t('zones.form.fields.longitude.placeholder')}
              />
            </FormField>
          </div>
        </FormSection>

        <FormSection
          title={t('zones.form.sections.infrastructure.title')}
          description={t('zones.form.sections.infrastructure.descriptionEdit')}
          icon={<Flag className="h-4 w-4" />}
        >
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <FormField label={t('zones.form.fields.accessibility.label')} error={getFieldError('accessibility_score')}>
              <Input
                id="accessibility_score"
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={data.accessibility_score}
                onChange={event => handleFieldChange('accessibility_score', event.target.value)}
                placeholder={t('zones.form.fields.accessibility.placeholder')}
              />
            </FormField>

            <FormField label={t('zones.form.fields.description.label')}>
              <Textarea
                id="description"
                value={data.description}
                onChange={event => handleFieldChange('description', event.target.value)}
                placeholder={t('zones.form.fields.description.placeholder')}
                className="min-h-[100px]"
              />
            </FormField>
          </div>

          <FormField label={t('zones.form.fields.infrastructureNotes.label')}>
            <Textarea
              id="infrastructure_notes"
              value={data.infrastructure_notes}
              onChange={event => handleFieldChange('infrastructure_notes', event.target.value)}
              placeholder={t('zones.form.fields.infrastructureNotes.placeholder')}
              className="min-h-[120px]"
            />
          </FormField>

          <FormField label={t('zones.form.fields.climateProfile.label')}>
            <Textarea
              id="climate_profile"
              value={data.climate_profile}
              onChange={event => handleFieldChange('climate_profile', event.target.value)}
              placeholder={t('zones.form.fields.climateProfile.placeholder')}
              className="min-h-[120px]"
            />
          </FormField>
        </FormSection>
      </form>

      <FormActionsBar dirtyLabel={t('zones.form.unsaved')}>
        <Button type="button" variant="outline" asChild>
          <Link href="/zones">{t('zones.actions.cancel')}</Link>
        </Button>
        <Button type="submit" disabled={processing || Object.keys(frontendErrors).length > 0 || Boolean(Object.keys(errors).length > 0)} onClick={submit}>
          {processing ? (
            <>
              <div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-white" />
              {t('zones.form.edit.submitting')}
            </>
          ) : (
            <>
              <CheckCircle className="mr-2 h-4 w-4" />
              {t('zones.form.edit.submit')}
            </>
          )}
        </Button>
      </FormActionsBar>

      <ScrollToTopFab />
    </FormPageLayout>
  );
}
