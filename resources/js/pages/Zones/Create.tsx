import { FormPageLayout } from '@/components/forms/form-page-layout';
import { FormSection } from '@/components/forms/form-section';
import { FormField } from '@/components/forms/form-field';
import { FormActionsBar } from '@/components/forms/form-actions-bar';
import { UnsavedChangesBadge } from '@/components/forms/unsaved-changes-badge';
import { ScrollToTopFab } from '@/components/forms/scroll-to-top-fab';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { validateZone, type ValidationErrors } from '@/lib/validation';
import { toast } from '@/hooks/use-toast';
import { type BreadcrumbItem } from '@/types';
import { Link, useForm } from '@inertiajs/react';
import { AlertCircle, ArrowLeft, Building2, Flag, Layers, MapPin } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState, type FormEventHandler } from 'react';
import { useTranslation } from 'react-i18next';

interface RegionOption {
  id: number;
  name: string;
}

type ZoneFormData = {
  name: string;
  status: 'active' | 'inactive';
  code: string;
  region_id: string;
  administrative_center: string;
  area_km2: string;
  population: string;
  latitude: string;
  longitude: string;
  elevation_m: string;
  accessibility_score: string;
  description: string;
  infrastructure_notes: string;
  climate_profile: string;
};

interface ZonesCreateProps {
  regions: RegionOption[];
}

export default function ZonesCreate({ regions }: ZonesCreateProps) {
  const { t } = useTranslation();
  const { data, setData, post, processing, errors, reset, clearErrors } = useForm<ZoneFormData>({
    name: '',
    status: 'active',
    code: '',
    region_id: '',
    administrative_center: '',
    area_km2: '',
    population: '',
    latitude: '',
    longitude: '',
    elevation_m: '',
    accessibility_score: '',
    description: '',
    infrastructure_notes: '',
    climate_profile: '',
  });

  const [frontendErrors, setFrontendErrors] = useState<ValidationErrors>({});
  const [isDirty, setIsDirty] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const scrollContainerRef = useRef<HTMLFormElement | null>(null);

  const breadcrumbs = useMemo<BreadcrumbItem[]>(
    () => [
      { title: t('zones.title'), href: '/zones' },
      { title: t('zones.form.create.breadcrumb'), href: '/zones/create' },
    ],
    [t],
  );

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

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => setShowScrollTop(container.scrollTop > 240);
    handleScroll();
    container.addEventListener('scroll', handleScroll);

    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

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
    [data, setFieldError]
  );

  const handleFieldChange = useCallback(
    (field: keyof ZoneFormData, value: string) => {
      setData(field, value as ZoneFormData[keyof ZoneFormData]);
      clearErrors(field);
      validateField(field, value);
      setIsDirty(true);
    },
    [setData, clearErrors, validateField]
  );

  const submit: FormEventHandler = event => {
    event.preventDefault();

    const validationResults = validateZone(data);
    if (Object.keys(validationResults).length > 0) {
      setFrontendErrors(validationResults);
      toast({
        title: t('zones.form.validation.title'),
        description: t('zones.form.validation.resolve'),
        variant: 'destructive',
      });
      return;
    }

    post('/zones', {
      preserveScroll: true,
      onSuccess: () => {
        setFrontendErrors({});
        setIsDirty(false);
        reset();
        toast({
          title: t('zones.form.create.successTitle'),
          description: t('zones.form.create.successDescription'),
        });
      },
    });
  };

  const getFieldError = useCallback(
    (field: keyof ZoneFormData) => {
      const backendError = errors[field];
      if (backendError) {
        return typeof backendError === 'string' ? backendError : String(backendError);
      }
      return frontendErrors[field] || '';
    },
    [errors, frontendErrors]
  );

  const handleScrollToTop = () => {
    scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const hasErrors = useMemo(
    () => Object.keys(errors).length > 0 || Object.keys(frontendErrors).length > 0,
    [errors, frontendErrors]
  );

  return (
    <FormPageLayout
      title={t('zones.form.create.title')}
      headTitle={t('zones.form.create.headTitle')}
      description={t('zones.form.create.description')}
      breadcrumbs={breadcrumbs}
      icon={<Layers className="h-5 w-5" />}
      headerAside={
        <>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/zones">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t('zones.form.create.backToList')}
            </Link>
          </Button>
          {isDirty && <UnsavedChangesBadge />}
          <div className="flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1.5 text-sm font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
            <div className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
            {t('zones.form.badge')}
          </div>
        </>
      }
    >
      <form
        ref={scrollContainerRef}
        onSubmit={submit}
        className="flex flex-1 flex-col gap-8 overflow-y-auto p-6 pb-24"
        style={{ minHeight: 0 }}
      >
        {hasErrors && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{t('zones.form.validation.inlineCreate')}</AlertDescription>
          </Alert>
        )}

        <FormSection
          title={t('zones.form.sections.identity.title')}
          description={t('zones.form.sections.identity.descriptionCreate')}
          icon={
            <div className="rounded-lg bg-emerald-100 p-2 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
              <Building2 className="h-4 w-4" />
            </div>
          }
          contentClassName="gap-6 md:grid-cols-2"
        >
          <FormField id="name" label={t('zones.form.fields.name.label')} required error={getFieldError('name')}>
            <Input
              id="name"
              value={data.name}
              onChange={event => handleFieldChange('name', event.target.value)}
              placeholder={t('zones.form.fields.name.placeholder')}
              className={getFieldError('name') ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}
            />
          </FormField>

          <FormField id="region_id" label={t('zones.form.fields.region.label')} required error={getFieldError('region_id')}>
            <Select value={data.region_id} onValueChange={value => handleFieldChange('region_id', value)}>
              <SelectTrigger className={getFieldError('region_id') ? 'border-red-500 focus:ring-red-500/20' : ''}>
                <SelectValue placeholder={t('zones.form.fields.region.placeholder')} />
              </SelectTrigger>
              <SelectContent>
                {regions.map(region => (
                  <SelectItem key={region.id} value={region.id.toString()}>
                    {region.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>

          <FormField id="status" label={t('zones.form.fields.status.label')} required error={getFieldError('status')}>
            <Select value={data.status} onValueChange={value => handleFieldChange('status', value)}>
              <SelectTrigger className={getFieldError('status') ? 'border-red-500 focus:ring-red-500/20' : ''}>
                <SelectValue placeholder={t('zones.form.fields.status.placeholder')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">{t('zones.status.active')}</SelectItem>
                <SelectItem value="inactive">{t('zones.status.inactive')}</SelectItem>
              </SelectContent>
            </Select>
          </FormField>

          <FormField id="code" label={t('zones.form.fields.code.label')} error={getFieldError('code')}>
            <Input
              id="code"
              value={data.code}
              onChange={event => handleFieldChange('code', event.target.value)}
              placeholder={t('zones.form.fields.code.placeholder')}
              className={getFieldError('code') ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}
            />
          </FormField>

          <FormField id="administrative_center" label={t('zones.form.fields.administrativeCenter.label')} error={getFieldError('administrative_center')} className="md:col-span-2">
            <Input
              id="administrative_center"
              value={data.administrative_center}
              onChange={event => handleFieldChange('administrative_center', event.target.value)}
              placeholder={t('zones.form.fields.administrativeCenter.placeholder')}
              className={getFieldError('administrative_center') ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}
            />
          </FormField>
        </FormSection>

        <FormSection
          title={t('zones.form.sections.geography.title')}
          description={t('zones.form.sections.geography.descriptionCreate')}
          icon={
            <div className="rounded-lg bg-emerald-100 p-2 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
              <MapPin className="h-4 w-4" />
            </div>
          }
          contentClassName="gap-6 md:grid-cols-3"
        >
          <FormField id="area_km2" label={t('zones.form.fields.area.label')} error={getFieldError('area_km2')}>
            <Input
              id="area_km2"
              type="number"
              step="0.01"
              value={data.area_km2}
              onChange={event => handleFieldChange('area_km2', event.target.value)}
              placeholder={t('zones.form.fields.area.placeholder')}
              className={getFieldError('area_km2') ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}
            />
          </FormField>

          <FormField id="population" label={t('zones.form.fields.population.label')} error={getFieldError('population')}>
            <Input
              id="population"
              type="number"
              step="1"
              value={data.population}
              onChange={event => handleFieldChange('population', event.target.value)}
              placeholder={t('zones.form.fields.population.placeholder')}
              className={getFieldError('population') ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}
            />
          </FormField>

          <FormField id="elevation_m" label={t('zones.form.fields.elevation.label')} error={getFieldError('elevation_m')}>
            <Input
              id="elevation_m"
              type="number"
              step="0.01"
              value={data.elevation_m}
              onChange={event => handleFieldChange('elevation_m', event.target.value)}
              placeholder={t('zones.form.fields.elevation.placeholder')}
              className={getFieldError('elevation_m') ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}
            />
          </FormField>

          <FormField id="latitude" label={t('zones.form.fields.latitude.label')} error={getFieldError('latitude')} className="md:col-span-1">
            <Input
              id="latitude"
              type="number"
              step="0.000001"
              value={data.latitude}
              onChange={event => handleFieldChange('latitude', event.target.value)}
              placeholder={t('zones.form.fields.latitude.placeholder')}
              className={getFieldError('latitude') ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}
            />
          </FormField>

          <FormField id="longitude" label={t('zones.form.fields.longitude.label')} error={getFieldError('longitude')} className="md:col-span-1">
            <Input
              id="longitude"
              type="number"
              step="0.000001"
              value={data.longitude}
              onChange={event => handleFieldChange('longitude', event.target.value)}
              placeholder={t('zones.form.fields.longitude.placeholder')}
              className={getFieldError('longitude') ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}
            />
          </FormField>
        </FormSection>

        <FormSection
          title={t('zones.form.sections.infrastructure.title')}
          description={t('zones.form.sections.infrastructure.descriptionCreate')}
          icon={
            <div className="rounded-lg bg-emerald-100 p-2 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
              <Flag className="h-4 w-4" />
            </div>
          }
          contentClassName="gap-6 md:grid-cols-2"
        >
          <FormField id="accessibility_score" label={t('zones.form.fields.accessibility.label')} error={getFieldError('accessibility_score')}>
            <Input
              id="accessibility_score"
              type="number"
              min="0"
              max="100"
              step="0.01"
              value={data.accessibility_score}
              onChange={event => handleFieldChange('accessibility_score', event.target.value)}
              placeholder={t('zones.form.fields.accessibility.placeholder')}
              className={getFieldError('accessibility_score') ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}
            />
          </FormField>

          <FormField id="description" label={t('zones.form.fields.description.label')} error={getFieldError('description')}>
            <Textarea
              id="description"
              value={data.description}
              onChange={event => handleFieldChange('description', event.target.value)}
              placeholder={t('zones.form.fields.description.placeholder')}
              className={`min-h-[100px] ${getFieldError('description') ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}`}
            />
          </FormField>

          <FormField id="infrastructure_notes" label={t('zones.form.fields.infrastructureNotes.label')} error={getFieldError('infrastructure_notes')} className="md:col-span-2">
            <Textarea
              id="infrastructure_notes"
              value={data.infrastructure_notes}
              onChange={event => handleFieldChange('infrastructure_notes', event.target.value)}
              placeholder={t('zones.form.fields.infrastructureNotes.placeholder')}
              className={`min-h-[120px] ${getFieldError('infrastructure_notes') ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}`}
            />
          </FormField>

          <FormField id="climate_profile" label={t('zones.form.fields.climateProfile.label')} error={getFieldError('climate_profile')} className="md:col-span-2">
            <Textarea
              id="climate_profile"
              value={data.climate_profile}
              onChange={event => handleFieldChange('climate_profile', event.target.value)}
              placeholder={t('zones.form.fields.climateProfile.placeholder')}
              className={`min-h-[120px] ${getFieldError('climate_profile') ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}`}
            />
          </FormField>
        </FormSection>

        <FormActionsBar
          processing={processing}
          disabled={processing || Object.keys(frontendErrors).length > 0}
          cancelHref="/zones"
          cancelLabel={t('zones.actions.cancel')}
          submitLabel={processing ? t('zones.form.create.submitting') : t('zones.form.create.submit')}
          isDirty={isDirty}
          dirtyLabel={t('zones.form.unsaved')}
        />
      </form>

      <ScrollToTopFab show={showScrollTop} onClick={handleScrollToTop} />
    </FormPageLayout>
  );
}
