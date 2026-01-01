import { FormPageLayout } from '@/components/forms/form-page-layout';
import { FormSection } from '@/components/forms/form-section';
import { FormField } from '@/components/forms/form-field';
import { FormActionsBar } from '@/components/forms/form-actions-bar';
import { UnsavedChangesBadge } from '@/components/forms/unsaved-changes-badge';
import { ScrollToTopFab } from '@/components/forms/scroll-to-top-fab';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { validatePlace, type ValidationErrors } from '@/lib/validation';
import { toast } from '@/hooks/use-toast';
import { type BreadcrumbItem } from '@/types';
import { Link, useForm } from '@inertiajs/react';
import { AlertCircle, ArrowLeft, Compass, FileText, MapPin, Navigation } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState, type FormEventHandler } from 'react';

interface WoredaOption {
  id: number;
  name: string;
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
};

interface PlacesCreateProps {
  woredas: WoredaOption[];
}

const breadcrumbs: BreadcrumbItem[] = [
  { title: 'Places', href: '/places' },
  { title: 'Create', href: '/places/create' },
];

export default function PlacesCreate({ woredas }: PlacesCreateProps) {
  const { data, setData, post, processing, errors, reset, clearErrors } = useForm<PlaceFormData>({
    name: '',
    status: 'active',
    code: '',
    woreda_id: '',
    latitude: '',
    longitude: '',
    elevation_m: '',
    population: '',
    is_logistics_hub: false,
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
    [data, setFieldError]
  );

  const handleFieldChange = useCallback(
    (field: keyof PlaceFormData, value: string) => {
      setData(field, value as PlaceFormData[keyof PlaceFormData]);
      clearErrors(field);
      validateField(field, value);
      setIsDirty(true);
    },
    [setData, clearErrors, validateField]
  );

  const handleCheckboxChange = useCallback(
    (checked: boolean) => {
      setData('is_logistics_hub', checked);
      setIsDirty(true);
    },
    [setData]
  );

  const submit: FormEventHandler = event => {
    event.preventDefault();

    const validationResults = validatePlace(data);
    if (Object.keys(validationResults).length > 0) {
      setFrontendErrors(validationResults);
      toast({
        title: '⚠️ Validation Error',
        description: 'Please resolve the highlighted fields before submitting.',
        variant: 'destructive',
      });
      return;
    }

    post('/places', {
      preserveScroll: true,
      onSuccess: () => {
        setFrontendErrors({});
        setIsDirty(false);
        reset();
        toast({
          title: '✅ Place Created',
          description: 'The place has been registered successfully.',
        });
      },
    });
  };

  const getFieldError = useCallback(
    (field: keyof PlaceFormData) => {
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
      title="Register New Place"
      headTitle="Create Place"
      description="Capture granular destination data, accessibility signals, and logistics capabilities for routing."
      breadcrumbs={breadcrumbs}
      icon={<Navigation className="h-5 w-5" />}
      headerAside={
        <>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/places">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Places
            </Link>
          </Button>
          {isDirty && <UnsavedChangesBadge />}
          <div className="flex items-center gap-2 rounded-full bg-rose-100 px-3 py-1.5 text-sm font-medium text-rose-700 dark:bg-rose-900/30 dark:text-rose-300">
            <div className="h-2 w-2 animate-pulse rounded-full bg-rose-500" />
            Location Intelligence
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
          title="Place Identity"
          description="Define how this location appears across planning and operations."
          icon={
            <div className="rounded-lg bg-rose-100 p-2 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400">
              <MapPin className="h-4 w-4" />
            </div>
          }
          contentClassName="gap-6 md:grid-cols-2"
        >
          <FormField id="name" label="Place Name" required error={getFieldError('name')}>
            <Input
              id="name"
              value={data.name}
              onChange={event => handleFieldChange('name', event.target.value)}
              placeholder="e.g., Modjo Dry Port"
              className={getFieldError('name') ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}
            />
          </FormField>

          <FormField id="woreda_id" label="Woreda" required error={getFieldError('woreda_id')}>
            <Select value={data.woreda_id} onValueChange={value => handleFieldChange('woreda_id', value)}>
              <SelectTrigger className={getFieldError('woreda_id') ? 'border-red-500 focus:ring-red-500/20' : ''}>
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

          <FormField id="code" label="Place Code" error={getFieldError('code')}>
            <Input
              id="code"
              value={data.code}
              onChange={event => handleFieldChange('code', event.target.value)}
              placeholder="e.g., PL-204"
              className={getFieldError('code') ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}
            />
          </FormField>

          <div className="flex items-center gap-3 rounded-md border border-slate-200/70 bg-slate-50 px-3 py-2 text-sm text-slate-700 dark:border-slate-800/60 dark:bg-slate-900/30 dark:text-slate-300 md:col-span-2">
            <Checkbox
              id="is_logistics_hub"
              checked={data.is_logistics_hub}
              onCheckedChange={value => handleCheckboxChange(Boolean(value))}
            />
            <Label htmlFor="is_logistics_hub" className="cursor-pointer">
              Mark as logistics hub (key fulfillment or consolidation point)
            </Label>
          </div>
        </FormSection>

        <FormSection
          title="Geo Coordinates & Scale"
          description="Provide accurate coordinates and coverage for routing accuracy."
          icon={
            <div className="rounded-lg bg-rose-100 p-2 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400">
              <Compass className="h-4 w-4" />
            </div>
          }
          contentClassName="gap-6 md:grid-cols-3"
        >
          <FormField id="latitude" label="Latitude" error={getFieldError('latitude')}>
            <Input
              id="latitude"
              type="number"
              step="0.000001"
              value={data.latitude}
              onChange={event => handleFieldChange('latitude', event.target.value)}
              placeholder="e.g., 8.980603"
              className={getFieldError('latitude') ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}
            />
          </FormField>

          <FormField id="longitude" label="Longitude" error={getFieldError('longitude')}>
            <Input
              id="longitude"
              type="number"
              step="0.000001"
              value={data.longitude}
              onChange={event => handleFieldChange('longitude', event.target.value)}
              placeholder="e.g., 38.757761"
              className={getFieldError('longitude') ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}
            />
          </FormField>

          <FormField id="elevation_m" label="Elevation (m)" error={getFieldError('elevation_m')}>
            <Input
              id="elevation_m"
              type="number"
              step="0.01"
              value={data.elevation_m}
              onChange={event => handleFieldChange('elevation_m', event.target.value)}
              placeholder="e.g., 2145"
              className={getFieldError('elevation_m') ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}
            />
          </FormField>

          <FormField id="population" label="Population" error={getFieldError('population')} className="md:col-span-1">
            <Input
              id="population"
              type="number"
              step="1"
              value={data.population}
              onChange={event => handleFieldChange('population', event.target.value)}
              placeholder="e.g., 45000"
              className={getFieldError('population') ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}
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
          title="Operational Insights"
          description="Document infrastructure readiness and road intelligence for dispatch teams."
          icon={
            <div className="rounded-lg bg-rose-100 p-2 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400">
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
              placeholder="Purpose, services available, or notable details about this location"
              className={`min-h-[100px] ${getFieldError('description') ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}`}
            />
          </FormField>

          <FormField id="infrastructure_notes" label="Infrastructure Notes" error={getFieldError('infrastructure_notes')}>
            <Textarea
              id="infrastructure_notes"
              value={data.infrastructure_notes}
              onChange={event => handleFieldChange('infrastructure_notes', event.target.value)}
              placeholder="Utilities, storage capacity, security, or communication coverage"
              className={`min-h-[120px] ${getFieldError('infrastructure_notes') ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}`}
            />
          </FormField>

          <FormField id="road_quality_notes" label="Road Quality Notes" error={getFieldError('road_quality_notes')}>
            <Textarea
              id="road_quality_notes"
              value={data.road_quality_notes}
              onChange={event => handleFieldChange('road_quality_notes', event.target.value)}
              placeholder="Surface conditions, seasonal risks, or alternate routes"
              className={`min-h-[120px] ${getFieldError('road_quality_notes') ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}`}
            />
          </FormField>
        </FormSection>

        <FormActionsBar
          processing={processing}
          disabled={processing || Object.keys(frontendErrors).length > 0}
          cancelHref="/places"
          submitLabel="Create Place"
          isDirty={isDirty}
        />
      </form>

      <ScrollToTopFab show={showScrollTop} onClick={handleScrollToTop} />
    </FormPageLayout>
  );
}
