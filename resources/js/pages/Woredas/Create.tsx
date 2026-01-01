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
import { validateWoreda, type ValidationErrors } from '@/lib/validation';
import { toast } from '@/hooks/use-toast';
import { type BreadcrumbItem } from '@/types';
import { Link, useForm } from '@inertiajs/react';
import { AlertCircle, ArrowLeft, Building2, FileText, Map } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState, type FormEventHandler } from 'react';

interface ZoneOption {
  id: number;
  name: string;
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

interface WoredasCreateProps {
  zones: ZoneOption[];
}

const breadcrumbs: BreadcrumbItem[] = [
  { title: 'Woredas', href: '/woredas' },
  { title: 'Create', href: '/woredas/create' },
];

export default function WoredasCreate({ zones }: WoredasCreateProps) {
  const { data, setData, post, processing, errors, reset, clearErrors } = useForm<WoredaFormData>({
    name: '',
    status: 'active',
    code: '',
    zone_id: '',
    administrative_center: '',
    area_km2: '',
    population: '',
    latitude: '',
    longitude: '',
    elevation_m: '',
    accessibility_score: '',
    description: '',
    infrastructure_notes: '',
    road_quality_notes: '',
  });

  const [frontendErrors, setFrontendErrors] = useState<ValidationErrors>({});
  const [isDirty, setIsDirty] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const scrollContainerRef = useRef<HTMLFormElement | null>(null);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => setShowScrollTop(container.scrollTop > 240);
    handleScroll();
    container.addEventListener('scroll', handleScroll);

    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

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
    [data, setFieldError]
  );

  const handleFieldChange = useCallback(
    (field: keyof WoredaFormData, value: string) => {
      setData(field, value as WoredaFormData[keyof WoredaFormData]);
      clearErrors(field);
      validateField(field, value);
      setIsDirty(true);
    },
    [setData, clearErrors, validateField]
  );

  const submit: FormEventHandler = event => {
    event.preventDefault();

    const validationResults = validateWoreda(data);
    if (Object.keys(validationResults).length > 0) {
      setFrontendErrors(validationResults);
      toast({
        title: '⚠️ Validation Error',
        description: 'Please resolve the highlighted fields before submitting.',
        variant: 'destructive',
      });
      return;
    }

    post('/woredas', {
      preserveScroll: true,
      onSuccess: () => {
        setFrontendErrors({});
        setIsDirty(false);
        reset();
        toast({
          title: '✅ Woreda Created',
          description: 'The woreda has been registered successfully.',
        });
      },
    });
  };

  const getFieldError = useCallback(
    (field: keyof WoredaFormData) => {
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
      title="Register New Woreda"
      headTitle="Create Woreda"
      description="Document administrative districts with spatial context and infrastructure readiness for deployment planning."
      breadcrumbs={breadcrumbs}
      icon={<Map className="h-5 w-5" />}
      headerAside={
        <>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/woredas">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Woredas
            </Link>
          </Button>
          {isDirty && <UnsavedChangesBadge />}
          <div className="flex items-center gap-2 rounded-full bg-sky-100 px-3 py-1.5 text-sm font-medium text-sky-700 dark:bg-sky-900/30 dark:text-sky-300">
            <div className="h-2 w-2 animate-pulse rounded-full bg-sky-500" />
            District Coverage
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
            <AlertDescription>
              Please correct the validation errors before submitting the form.
            </AlertDescription>
          </Alert>
        )}

        <FormSection
          title="Woreda Identity"
          description="Capture core governance and classification details for the woreda."
          icon={
            <div className="rounded-lg bg-sky-100 p-2 text-sky-600 dark:bg-sky-900/30 dark:text-sky-400">
              <Building2 className="h-4 w-4" />
            </div>
          }
          contentClassName="gap-6 md:grid-cols-2"
        >
          <FormField id="name" label="Woreda Name" required error={getFieldError('name')}>
            <Input
              id="name"
              value={data.name}
              onChange={event => handleFieldChange('name', event.target.value)}
              placeholder="e.g., Adaba"
              className={getFieldError('name') ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}
            />
          </FormField>

          <FormField id="zone_id" label="Zone" required error={getFieldError('zone_id')}>
            <Select value={data.zone_id} onValueChange={value => handleFieldChange('zone_id', value)}>
              <SelectTrigger className={getFieldError('zone_id') ? 'border-red-500 focus:ring-red-500/20' : ''}>
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

          <FormField id="status" label="Status" required error={getFieldError('status')}>
            <Select value={data.status} onValueChange={value => handleFieldChange('status', value)}>
              <SelectTrigger className={getFieldError('status') ? 'border-red-500 focus:ring-red-500/20' : ''}>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </FormField>

          <FormField id="code" label="Woreda Code" error={getFieldError('code')}>
            <Input
              id="code"
              value={data.code}
              onChange={event => handleFieldChange('code', event.target.value)}
              placeholder="e.g., AD-01"
              className={getFieldError('code') ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}
            />
          </FormField>

          <FormField id="administrative_center" label="Administrative Center" error={getFieldError('administrative_center')} className="md:col-span-2">
            <Input
              id="administrative_center"
              value={data.administrative_center}
              onChange={event => handleFieldChange('administrative_center', event.target.value)}
              placeholder="Primary governance hub"
              className={getFieldError('administrative_center') ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}
            />
          </FormField>
        </FormSection>

        <FormSection
          title="Geographic Profile"
          description="Outline the spatial footprint and demographic scale for this woreda."
          icon={
            <div className="rounded-lg bg-sky-100 p-2 text-sky-600 dark:bg-sky-900/30 dark:text-sky-400">
              <Map className="h-4 w-4" />
            </div>
          }
          contentClassName="gap-6 md:grid-cols-3"
        >
          <FormField id="area_km2" label="Area (km²)" error={getFieldError('area_km2')}>
            <Input
              id="area_km2"
              type="number"
              step="0.01"
              value={data.area_km2}
              onChange={event => handleFieldChange('area_km2', event.target.value)}
              placeholder="e.g., 1250"
              className={getFieldError('area_km2') ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}
            />
          </FormField>

          <FormField id="population" label="Population" error={getFieldError('population')}>
            <Input
              id="population"
              type="number"
              step="1"
              value={data.population}
              onChange={event => handleFieldChange('population', event.target.value)}
              placeholder="e.g., 82000"
              className={getFieldError('population') ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}
            />
          </FormField>

          <FormField id="elevation_m" label="Elevation (m)" error={getFieldError('elevation_m')}>
            <Input
              id="elevation_m"
              type="number"
              step="0.01"
              value={data.elevation_m}
              onChange={event => handleFieldChange('elevation_m', event.target.value)}
              placeholder="e.g., 1325"
              className={getFieldError('elevation_m') ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}
            />
          </FormField>

          <FormField id="latitude" label="Latitude" error={getFieldError('latitude')} className="md:col-span-1">
            <Input
              id="latitude"
              type="number"
              step="0.000001"
              value={data.latitude}
              onChange={event => handleFieldChange('latitude', event.target.value)}
              placeholder="e.g., 7.123456"
              className={getFieldError('latitude') ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}
            />
          </FormField>

          <FormField id="longitude" label="Longitude" error={getFieldError('longitude')} className="md:col-span-1">
            <Input
              id="longitude"
              type="number"
              step="0.000001"
              value={data.longitude}
              onChange={event => handleFieldChange('longitude', event.target.value)}
              placeholder="e.g., 39.987654"
              className={getFieldError('longitude') ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}
            />
          </FormField>

          <FormField id="accessibility_score" label="Accessibility Score" error={getFieldError('accessibility_score')} className="md:col-span-1">
            <Input
              id="accessibility_score"
              type="number"
              min="0"
              max="100"
              step="0.01"
              value={data.accessibility_score}
              onChange={event => handleFieldChange('accessibility_score', event.target.value)}
              placeholder="0 - 100"
              className={getFieldError('accessibility_score') ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}
            />
          </FormField>
        </FormSection>

        <FormSection
          title="Infrastructure & Logistics"
          description="Document readiness signals and deployment context for this woreda."
          icon={
            <div className="rounded-lg bg-sky-100 p-2 text-sky-600 dark:bg-sky-900/30 dark:text-sky-400">
              <FileText className="h-4 w-4" />
            </div>
          }
          contentClassName="gap-6 md:grid-cols-1"
        >
          <FormField id="description" label="Description" error={getFieldError('description')}>
            <Textarea
              id="description"
              value={data.description}
              onChange={event => handleFieldChange('description', event.target.value)}
              placeholder="Brief narrative on economic focus or network role"
              className={`min-h-[100px] ${getFieldError('description') ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}`}
            />
          </FormField>

          <FormField id="infrastructure_notes" label="Infrastructure Notes" error={getFieldError('infrastructure_notes')}>
            <Textarea
              id="infrastructure_notes"
              value={data.infrastructure_notes}
              onChange={event => handleFieldChange('infrastructure_notes', event.target.value)}
              placeholder="Connectivity, utilities, telecom coverage, or constraints"
              className={`min-h-[120px] ${getFieldError('infrastructure_notes') ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}`}
            />
          </FormField>

          <FormField id="road_quality_notes" label="Road Quality Notes" error={getFieldError('road_quality_notes')}>
            <Textarea
              id="road_quality_notes"
              value={data.road_quality_notes}
              onChange={event => handleFieldChange('road_quality_notes', event.target.value)}
              placeholder="Road conditions, seasonal access, or maintenance schedules"
              className={`min-h-[120px] ${getFieldError('road_quality_notes') ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}`}
            />
          </FormField>
        </FormSection>

        <FormActionsBar
          processing={processing}
          disabled={processing || Object.keys(frontendErrors).length > 0}
          cancelHref="/woredas"
          submitLabel="Create Woreda"
          isDirty={isDirty}
        />
      </form>

      <ScrollToTopFab show={showScrollTop} onClick={handleScrollToTop} />
    </FormPageLayout>
  );
}
