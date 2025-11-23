import { useCallback, useEffect, useMemo, useRef, useState, type FormEventHandler } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { validateWoreda, type ValidationErrors } from '@/lib/validation';
import { toast } from '@/hooks/use-toast';
import {
  AlertCircle,
  ArrowLeft,
  ArrowUp,
  Building2,
  CheckCircle,
  FileText,
  Map,
  Save,
} from 'lucide-react';

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
    {
      title: 'Woredas',
      href: '/woredas',
    },
    {
      title: 'Edit',
      href: `/woredas/${woreda.id}/edit`,
    },
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
    accessibility_score:
      woreda.accessibility_score !== null && woreda.accessibility_score !== undefined
        ? String(woreda.accessibility_score)
        : '',
    description: woreda.description ?? '',
    infrastructure_notes: woreda.infrastructure_notes ?? '',
    road_quality_notes: woreda.road_quality_notes ?? '',
  });

  const [frontendErrors, setFrontendErrors] = useState<ValidationErrors>({});
  const [isDirty, setIsDirty] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const scrollContainerRef = useRef<HTMLFormElement | null>(null);

  const hasErrors = useMemo(
    () => Object.keys(errors).length > 0 || Object.keys(frontendErrors).length > 0,
    [errors, frontendErrors]
  );

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) {
      return;
    }

    const handleScroll = () => {
      setShowScrollTop(container.scrollTop > 240);
    };

    handleScroll();
    container.addEventListener('scroll', handleScroll);

    return () => {
      container.removeEventListener('scroll', handleScroll);
    };
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
      validateField(field, value);
      setIsDirty(true);
    },
    [setData, validateField]
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
        toast({
          title: '✅ Woreda Updated',
          description: 'Woreda details have been saved successfully.',
        });
      },
    });
  };

  const getFieldError = useCallback(
    (field: keyof WoredaFormData) => errors[field] || frontendErrors[field] || '',
    [errors, frontendErrors]
  );

  const handleScrollToTop = () => {
    scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title={`Edit ${woreda.name}`} />
      <div className="flex h-full flex-1 flex-col gap-6 overflow-hidden rounded-xl p-4">
        <Card className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-slate-200/70 bg-white/95 text-card-foreground shadow-xl backdrop-blur-lg dark:border-slate-800/60 dark:bg-slate-900/70">
          <CardHeader className="px-6 pb-0">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex items-start gap-4">
                <div className="rounded-xl bg-sky-100 p-2 text-sky-600 shadow-sm dark:bg-sky-900/30 dark:text-sky-400">
                  <Map className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
                    Update Woreda
                  </CardTitle>
                  <CardDescription className="text-sm text-slate-600 dark:text-slate-400">
                    Keep district intelligence synchronized with the latest field information.
                  </CardDescription>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/woredas">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Woredas
                  </Link>
                </Button>
                {isDirty && (
                  <div className="flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1.5 text-sm font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                    <Save className="h-3 w-3" />
                    Unsaved Changes
                  </div>
                )}
                <div className="flex items-center gap-2 rounded-full bg-sky-100 px-3 py-1.5 text-sm font-medium text-sky-700 dark:bg-sky-900/30 dark:text-sky-300">
                  <div className="h-2 w-2 animate-pulse rounded-full bg-sky-500" />
                  District Coverage
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="flex flex-1 flex-col overflow-hidden p-0">
            <form
              ref={scrollContainerRef}
              onSubmit={submit}
              className="flex flex-1 flex-col gap-8 overflow-y-auto p-6 pb-24"
              style={{ minHeight: 0 }}
              noValidate
            >
              {hasErrors && (
                <div className="flex items-start gap-3 rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-destructive">
                  <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold">Review the highlighted fields</h3>
                    <p className="text-sm opacity-80">Correct validation issues before saving the woreda update.</p>
                  </div>
                </div>
              )}

              <section className="space-y-4 rounded-xl border border-slate-200/60 bg-white/75 p-5 shadow-sm dark:border-slate-800/70 dark:bg-slate-900/35">
                <div className="flex items-center gap-2.5 text-sm">
                  <div className="rounded-md bg-sky-100 p-1.5 text-sky-600 dark:bg-sky-900/30 dark:text-sky-400">
                    <Building2 className="h-4 w-4" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">Woreda Identity</h2>
                    <p className="text-xs text-muted-foreground">Confirm governance and classification details for the woreda.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">
                      Woreda Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="name"
                      type="text"
                      value={data.name}
                      onChange={event => handleFieldChange('name', event.target.value)}
                      placeholder="e.g., Adaba"
                      className={getFieldError('name') ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}
                    />
                    {getFieldError('name') && (
                      <p className="flex items-center gap-1 text-sm text-red-500">
                        <AlertCircle className="h-3 w-3" />
                        {getFieldError('name')}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="zone_id">
                      Zone <span className="text-red-500">*</span>
                    </Label>
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
                    {getFieldError('zone_id') && (
                      <p className="flex items-center gap-1 text-sm text-red-500">
                        <AlertCircle className="h-3 w-3" />
                        {getFieldError('zone_id')}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="status">
                      Status <span className="text-red-500">*</span>
                    </Label>
                    <Select value={data.status} onValueChange={value => handleFieldChange('status', value)}>
                      <SelectTrigger className={getFieldError('status') ? 'border-red-500 focus:ring-red-500/20' : ''}>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                    {getFieldError('status') && (
                      <p className="flex items-center gap-1 text-sm text-red-500">
                        <AlertCircle className="h-3 w-3" />
                        {getFieldError('status')}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="code">Woreda Code</Label>
                    <Input
                      id="code"
                      type="text"
                      value={data.code}
                      onChange={event => handleFieldChange('code', event.target.value)}
                      placeholder="e.g., WB-14"
                      className={getFieldError('code') ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}
                    />
                    {getFieldError('code') && (
                      <p className="flex items-center gap-1 text-sm text-red-500">
                        <AlertCircle className="h-3 w-3" />
                        {getFieldError('code')}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="administrative_center">Administrative Center</Label>
                    <Input
                      id="administrative_center"
                      type="text"
                      value={data.administrative_center}
                      onChange={event => handleFieldChange('administrative_center', event.target.value)}
                      placeholder="Primary governance hub"
                      className={getFieldError('administrative_center') ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}
                    />
                    {getFieldError('administrative_center') && (
                      <p className="flex items-center gap-1 text-sm text-red-500">
                        <AlertCircle className="h-3 w-3" />
                        {getFieldError('administrative_center')}
                      </p>
                    )}
                  </div>
                </div>
              </section>

              <section className="space-y-4 rounded-xl border border-slate-200/60 bg-white/75 p-5 shadow-sm dark:border-slate-800/70 dark:bg-slate-900/35">
                <div className="flex items-center gap-2.5 text-sm">
                  <div className="rounded-md bg-sky-100 p-1.5 text-sky-600 dark:bg-sky-900/30 dark:text-sky-400">
                    <Map className="h-4 w-4" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">Spatial Footprint</h2>
                    <p className="text-xs text-muted-foreground">Update geographic metrics that drive coverage analytics.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="area_km2">Area (km²)</Label>
                    <Input
                      id="area_km2"
                      type="number"
                      step="0.01"
                      value={data.area_km2}
                      onChange={event => handleFieldChange('area_km2', event.target.value)}
                      placeholder="e.g., 8450"
                      className={getFieldError('area_km2') ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}
                    />
                    {getFieldError('area_km2') && (
                      <p className="flex items-center gap-1 text-sm text-red-500">
                        <AlertCircle className="h-3 w-3" />
                        {getFieldError('area_km2')}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="population">Population</Label>
                    <Input
                      id="population"
                      type="number"
                      step="1"
                      value={data.population}
                      onChange={event => handleFieldChange('population', event.target.value)}
                      placeholder="e.g., 120000"
                      className={getFieldError('population') ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}
                    />
                    {getFieldError('population') && (
                      <p className="flex items-center gap-1 text-sm text-red-500">
                        <AlertCircle className="h-3 w-3" />
                        {getFieldError('population')}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="elevation_m">Elevation (m)</Label>
                    <Input
                      id="elevation_m"
                      type="number"
                      step="0.01"
                      value={data.elevation_m}
                      onChange={event => handleFieldChange('elevation_m', event.target.value)}
                      placeholder="e.g., 1800"
                      className={getFieldError('elevation_m') ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}
                    />
                    {getFieldError('elevation_m') && (
                      <p className="flex items-center gap-1 text-sm text-red-500">
                        <AlertCircle className="h-3 w-3" />
                        {getFieldError('elevation_m')}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="latitude">Latitude</Label>
                    <Input
                      id="latitude"
                      type="number"
                      step="0.000001"
                      value={data.latitude}
                      onChange={event => handleFieldChange('latitude', event.target.value)}
                      placeholder="e.g., 7.123456"
                      className={getFieldError('latitude') ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}
                    />
                    {getFieldError('latitude') && (
                      <p className="flex items-center gap-1 text-sm text-red-500">
                        <AlertCircle className="h-3 w-3" />
                        {getFieldError('latitude')}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="longitude">Longitude</Label>
                    <Input
                      id="longitude"
                      type="number"
                      step="0.000001"
                      value={data.longitude}
                      onChange={event => handleFieldChange('longitude', event.target.value)}
                      placeholder="e.g., 39.987654"
                      className={getFieldError('longitude') ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}
                    />
                    {getFieldError('longitude') && (
                      <p className="flex items-center gap-1 text-sm text-red-500">
                        <AlertCircle className="h-3 w-3" />
                        {getFieldError('longitude')}
                      </p>
                    )}
                  </div>
                </div>
              </section>

              <section className="space-y-4 rounded-xl border border-slate-200/60 bg-white/75 p-5 shadow-sm dark:border-slate-800/70 dark:bg-slate-900/35">
                <div className="flex items-center gap-2.5 text-sm">
                  <div className="rounded-md bg-sky-100 p-1.5 text-sky-600 dark:bg-sky-900/30 dark:text-sky-400">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">Infrastructure Intelligence</h2>
                    <p className="text-xs text-muted-foreground">Capture readiness signals and surface route quality considerations.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="accessibility_score">Accessibility Score</Label>
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
                    {getFieldError('accessibility_score') && (
                      <p className="flex items-center gap-1 text-sm text-red-500">
                        <AlertCircle className="h-3 w-3" />
                        {getFieldError('accessibility_score')}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={data.description}
                      onChange={event => handleFieldChange('description', event.target.value)}
                      placeholder="Brief narrative on service coverage or economic relevance"
                      className={`min-h-[100px] ${getFieldError('description') ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}`}
                    />
                    {getFieldError('description') && (
                      <p className="flex items-center gap-1 text-sm text-red-500">
                        <AlertCircle className="h-3 w-3" />
                        {getFieldError('description')}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="infrastructure_notes">Infrastructure Notes</Label>
                  <Textarea
                    id="infrastructure_notes"
                    value={data.infrastructure_notes}
                    onChange={event => handleFieldChange('infrastructure_notes', event.target.value)}
                    placeholder="Connectivity, utilities, telecom coverage, or constraints"
                    className={`min-h-[120px] ${getFieldError('infrastructure_notes') ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}`}
                  />
                  {getFieldError('infrastructure_notes') && (
                    <p className="flex items-center gap-1 text-sm text-red-500">
                      <AlertCircle className="h-3 w-3" />
                      {getFieldError('infrastructure_notes')}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="road_quality_notes">Road Quality Notes</Label>
                  <Textarea
                    id="road_quality_notes"
                    value={data.road_quality_notes}
                    onChange={event => handleFieldChange('road_quality_notes', event.target.value)}
                    placeholder="Surface conditions, seasonal disruptions, or detours"
                    className={`min-h-[120px] ${getFieldError('road_quality_notes') ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}`}
                  />
                  {getFieldError('road_quality_notes') && (
                    <p className="flex items-center gap-1 text-sm text-red-500">
                      <AlertCircle className="h-3 w-3" />
                      {getFieldError('road_quality_notes')}
                    </p>
                  )}
                </div>
              </section>

              <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200/70 bg-white/80 px-6 py-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/40">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                    <span className="text-red-500">*</span>
                    <span>All required fields must be completed</span>
                  </div>
                  {isDirty && (
                    <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400">
                      <Save className="h-3 w-3" />
                      <span>You have unsaved changes</span>
                    </div>
                  )}
                </div>
                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    asChild
                    className="border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700"
                  >
                    <Link href="/woredas">Cancel</Link>
                  </Button>
                  <Button
                    type="submit"
                    disabled={
                      processing
                      || Object.keys(frontendErrors).length > 0
                      || Boolean(Object.keys(errors).length > 0)
                    }
                    className="min-w-[160px] bg-gradient-to-r from-sky-600 to-sky-700 px-6 text-white shadow-lg transition-all duration-200 hover:from-sky-700 hover:to-sky-800 hover:shadow-xl"
                  >
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
                </div>
              </div>
            </form>
          </CardContent>
        </Card>

        {showScrollTop && (
          <Button
            type="button"
            onClick={handleScrollToTop}
            className="fixed bottom-6 right-6 z-50 shadow-lg"
            variant="secondary"
            aria-label="Scroll to top"
          >
            <ArrowUp className="h-4 w-4" />
          </Button>
        )}
      </div>
    </AppLayout>
  );
}

