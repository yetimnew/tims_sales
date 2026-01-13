import { FormPageLayout } from '@/components/forms/form-page-layout';
import { UnsavedChangesBadge } from '@/components/forms/unsaved-changes-badge';
import { useMemo, useState } from 'react';
import { Link, useForm } from '@inertiajs/react';
import { ArrowLeft, MapPin, Route, Save, Navigation, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { InteractiveMap } from '@/components/InteractiveMap';
import type { BreadcrumbItem } from '@/types';
import { useTranslation } from 'react-i18next';

interface Place {
  id: number;
  name: string;
  latitude?: number;
  longitude?: number;
  woreda?: {
    name: string;
    zone?: {
      name: string;
      region?: { name: string };
    };
  };
}

interface DistancesCreateProps {
  places: Place[];
}

type ValidatableField = 'from_place_id' | 'to_place_id' | 'distance_km' | 'estimated_time_hours';

export default function DistancesCreate({ places }: DistancesCreateProps) {
  const { t } = useTranslation();
  const placesWithCoordinates = useMemo(
    () => places.filter(place => place.latitude !== undefined && place.longitude !== undefined).length,
    [places],
  );
  const coordinateCoverage = places.length > 0 ? Math.round((placesWithCoordinates / places.length) * 100) : 0;

  const [selectedFromPlace, setSelectedFromPlace] = useState<Place | null>(null);
  const [selectedToPlace, setSelectedToPlace] = useState<Place | null>(null);
  const [routePoints, setRoutePoints] = useState<[number, number][]>([]);
  const [calculatedDistance, setCalculatedDistance] = useState<number>(0);
  const [calculatedTime, setCalculatedTime] = useState<number>(0);
  const [frontendErrors, setFrontendErrors] = useState<Record<string, string>>({});
  const [isDirty, setIsDirty] = useState(false);

  const { data, setData, post, processing, errors, reset } = useForm({
    from_place_id: '',
    to_place_id: '',
    distance_km: '',
    estimated_time_hours: '',
    route_description: '',
    route_type: 'primary',
    estimated_travel_time_minutes: '',
    road_condition_factor: '1.0',
    toll_road: false,
    toll_cost: '',
    restricted_for_heavy_vehicles: false,
    route_notes: '',
  });

  const hasErrors = useMemo(
    () => Object.keys(errors).length > 0 || Object.keys(frontendErrors).length > 0,
    [errors, frontendErrors]
  );

  const getFieldError = (field: keyof typeof data) => frontendErrors[field as string] || (errors[field] as string | undefined);

  const validateField = (field: ValidatableField, value: string) => {
    const fieldErrors: Record<string, string> = {};

    switch (field) {
      case 'from_place_id':
        if (!value) fieldErrors.from_place_id = t('distances.form.validation.fromRequired');
        break;
      case 'to_place_id':
        if (!value) fieldErrors.to_place_id = t('distances.form.validation.toRequired');
        else if (value === data.from_place_id) {
          fieldErrors.to_place_id = t('distances.form.validation.toDifferent');
        }
        break;
      case 'distance_km':
        if (!value) fieldErrors.distance_km = t('distances.form.validation.distanceRequired');
        else if (Number.isNaN(Number(value)) || Number(value) <= 0) {
          fieldErrors.distance_km = t('distances.form.validation.distancePositive');
        }
        break;
      case 'estimated_time_hours':
        if (!value) fieldErrors.estimated_time_hours = t('distances.form.validation.timeRequired');
        else if (Number.isNaN(Number(value)) || Number(value) <= 0) {
          fieldErrors.estimated_time_hours = t('distances.form.validation.timePositive');
        }
        break;
      default:
        break;
    }

    return fieldErrors;
  };

  const applyValidation = (field: ValidatableField, value: string) => {
    const validationResult = validateField(field, value);
    setFrontendErrors(prev => {
      const updated = { ...prev };

      if (Object.keys(validationResult).length === 0) {
        delete updated[field as string];
      }

      Object.entries(validationResult).forEach(([key, message]) => {
        if (message) {
          updated[key] = message;
        } else {
          delete updated[key];
        }
      });

      return updated;
    });
  };

  const handleFromPlaceChange = (placeId: string) => {
    setData('from_place_id', placeId);
    const place = places.find(p => p.id.toString() === placeId);
    setSelectedFromPlace(place || null);
    applyValidation('from_place_id', placeId);
    if (data.to_place_id) {
      applyValidation('to_place_id', data.to_place_id);
    }
    setIsDirty(true);
  };

  const handleToPlaceChange = (placeId: string) => {
    setData('to_place_id', placeId);
    const place = places.find(p => p.id.toString() === placeId);
    setSelectedToPlace(place || null);
    applyValidation('to_place_id', placeId);
    setIsDirty(true);
  };

  const handleRouteChange = (points: [number, number][]) => {
    setRoutePoints(points);
    if (points.length === 0) {
      setCalculatedDistance(0);
      setCalculatedTime(0);
    }
    setIsDirty(true);
  };

  const handleDistanceChange = (distance: number) => {
    setCalculatedDistance(distance);
    const value = distance > 0 ? distance.toFixed(2) : '';
    setData('distance_km', value);
    applyValidation('distance_km', value);
    setIsDirty(true);
  };

  const handleTimeChange = (time: number) => {
    setCalculatedTime(time);
    const value = time > 0 ? time.toFixed(1) : '';
    setData('estimated_time_hours', value);
    applyValidation('estimated_time_hours', value);
    setIsDirty(true);
  };

  const handleManualDistanceChange = (value: string) => {
    setData('distance_km', value);
    applyValidation('distance_km', value);
    setIsDirty(true);
  };

  const handleManualTimeChange = (value: string) => {
    setData('estimated_time_hours', value);
    applyValidation('estimated_time_hours', value);
    setIsDirty(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const submissionErrors: Record<string, string> = {};
    const fieldsToValidate: ValidatableField[] = ['from_place_id', 'to_place_id', 'distance_km', 'estimated_time_hours'];
    fieldsToValidate.forEach(field => {
      const result = validateField(field, data[field]);
      Object.assign(submissionErrors, result);
    });

    if (Object.keys(submissionErrors).length > 0) {
      setFrontendErrors(prev => ({ ...prev, ...submissionErrors }));
      toast({
        title: t('distances.form.validation.toastTitle'),
        description: t('distances.form.validation.resolve'),
        variant: 'destructive',
      });
      return;
    }

    post('/distances', {
      preserveScroll: true,
      onSuccess: () => {
        reset();
        setFrontendErrors({});
        setSelectedFromPlace(null);
        setSelectedToPlace(null);
        setRoutePoints([]);
        setCalculatedDistance(0);
        setCalculatedTime(0);
        setIsDirty(false);
        toast({
          title: t('distances.form.create.successTitle'),
          description: t('distances.form.create.successDescription'),
        });
      },
    });
  };

  const distanceDisplay = data.distance_km
    ? t('distances.form.create.stats.currentDraftValue', {
        value: Number(data.distance_km).toLocaleString(undefined, { maximumFractionDigits: 2 }),
      })
    : t('distances.form.create.stats.currentDraftFallback');
  const timeDisplay = data.estimated_time_hours
    ? t('distances.form.create.stats.currentDraftTime', { value: Number(data.estimated_time_hours).toFixed(1) })
    : t('distances.form.create.stats.currentDraftTimeFallback');
  const fromPlaceError = getFieldError('from_place_id');
  const toPlaceError = getFieldError('to_place_id');
  const distanceError = getFieldError('distance_km');
  const estimatedTimeError = getFieldError('estimated_time_hours');
  const breadcrumbs = useMemo<BreadcrumbItem[]>(
    () => [
      { title: t('distances.title'), href: '/distances' },
      { title: t('distances.form.create.breadcrumb'), href: '/distances/create' },
    ],
    [t],
  );

  return (
    <FormPageLayout
      title={t('distances.form.create.title')}
      headTitle={t('distances.form.create.headTitle')}
      description={t('distances.form.create.description')}
      breadcrumbs={breadcrumbs}
      icon={<MapPin className="h-5 w-5" />}
      headerAside={
        <>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/distances">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t('distances.form.create.backToList')}
            </Link>
          </Button>
          {isDirty && <UnsavedChangesBadge />}
          <div className="flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1.5 text-sm font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
            <div className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
            {t('distances.form.create.badge')}
          </div>
        </>
      }
    >
      <div className="flex flex-1 flex-col gap-6 overflow-hidden p-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg border border-emerald-200 bg-white/90 p-4 shadow-sm dark:border-emerald-900/40 dark:bg-emerald-950/20">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {t('distances.form.create.stats.placesAvailable')}
            </p>
            <p className="mt-1 text-lg font-semibold text-emerald-700 dark:text-emerald-300">{places.length}</p>
            <p className="text-xs text-muted-foreground">
              {t('distances.form.create.stats.withCoordinates', { count: placesWithCoordinates })}
            </p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white/90 p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900/40">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {t('distances.form.create.stats.coverage')}
            </p>
            <p className="mt-1 text-lg font-semibold text-slate-900 dark:text-slate-100">
              {t('distances.form.create.stats.coverageValue', { value: coordinateCoverage })}
            </p>
            <p className="text-xs text-muted-foreground">{t('distances.form.create.stats.ready')}</p>
          </div>
          <div className="rounded-lg border border-blue-200 bg-white/90 p-4 shadow-sm dark:border-blue-900/40 dark:bg-blue-950/20">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {t('distances.form.create.stats.currentDraft')}
            </p>
            <p className="mt-1 text-lg font-semibold text-blue-700 dark:text-blue-300">{distanceDisplay}</p>
            <p className="text-xs text-muted-foreground">{timeDisplay}</p>
          </div>
        </div>

        <Tabs defaultValue="form" className="flex flex-1 flex-col overflow-hidden">
          <TabsList className="grid w-full grid-cols-1 gap-2 rounded-xl border border-slate-200 bg-slate-100 p-1 dark:border-slate-700 dark:bg-slate-800 sm:grid-cols-3">
            <TabsTrigger value="form" className="flex items-center justify-center gap-2">
              <Save className="h-4 w-4" />
              {t('distances.form.create.tabs.form')}
            </TabsTrigger>
            <TabsTrigger value="map" className="flex items-center justify-center gap-2">
              <Navigation className="h-4 w-4" />
              {t('distances.form.create.tabs.map')}
            </TabsTrigger>
            <TabsTrigger value="preview" className="flex items-center justify-center gap-2">
              <Route className="h-4 w-4" />
              {t('distances.form.create.tabs.preview')}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="form" className="mt-4 flex flex-1 flex-col overflow-hidden">
            <Card className="flex flex-1 flex-col border-0 shadow-lg">
              <CardHeader>
                <CardTitle>{t('distances.form.create.form.title')}</CardTitle>
                <CardDescription>{t('distances.form.create.form.description')}</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col overflow-hidden p-0">
                {hasErrors && (
                  <div className="px-6 pt-6">
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{t('distances.form.validation.resolveForm')}</AlertDescription>
                      </Alert>
                  </div>
                )}

                <form
                  onSubmit={handleSubmit}
                  className="flex flex-1 flex-col gap-6 overflow-y-auto p-6 pb-24"
                  style={{ minHeight: 0 }}
                  noValidate
                >
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="from_place_id">{t('distances.form.fields.fromPlace.label')}</Label>
                      <Select value={data.from_place_id} onValueChange={handleFromPlaceChange}>
                        <SelectTrigger id="from_place_id" className={fromPlaceError ? 'border-red-500' : ''}>
                          <SelectValue placeholder={t('distances.form.fields.fromPlace.placeholder')} />
                        </SelectTrigger>
                        <SelectContent>
                          {places.map(place => (
                            <SelectItem key={place.id} value={place.id.toString()}>
                              {place.name} {place.latitude && place.longitude ? '📍' : ''}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {fromPlaceError && <p className="text-sm text-destructive">{fromPlaceError}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="to_place_id">{t('distances.form.fields.toPlace.label')}</Label>
                      <Select value={data.to_place_id} onValueChange={handleToPlaceChange}>
                        <SelectTrigger id="to_place_id" className={toPlaceError ? 'border-red-500' : ''}>
                          <SelectValue placeholder={t('distances.form.fields.toPlace.placeholder')} />
                        </SelectTrigger>
                        <SelectContent>
                          {places
                            .filter(place => place.id.toString() !== data.from_place_id)
                            .map(place => (
                              <SelectItem key={place.id} value={place.id.toString()}>
                                {place.name} {place.latitude && place.longitude ? '📍' : ''}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                      {toPlaceError && <p className="text-sm text-destructive">{toPlaceError}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="distance_km">{t('distances.form.fields.distance.label')}</Label>
                      <Input
                        id="distance_km"
                        type="number"
                        step="0.01"
                        min="0"
                        value={data.distance_km}
                        onChange={e => handleManualDistanceChange(e.target.value)}
                        placeholder={t('distances.form.fields.distance.placeholder')}
                        readOnly={routePoints.length > 0}
                      />
                      {calculatedDistance > 0 ? (
                        <p className="text-sm text-green-600">{t('distances.form.fields.distance.calculated')}</p>
                      ) : (
                        <p className="text-xs text-muted-foreground">{t('distances.form.fields.distance.manual')}</p>
                      )}
                      {distanceError && <p className="text-sm text-destructive">{distanceError}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="estimated_time_hours">{t('distances.form.fields.time.label')}</Label>
                      <Input
                        id="estimated_time_hours"
                        type="number"
                        step="0.1"
                        min="0"
                        value={data.estimated_time_hours}
                        onChange={e => handleManualTimeChange(e.target.value)}
                        placeholder={t('distances.form.fields.time.placeholder')}
                        readOnly={routePoints.length > 0}
                      />
                      {calculatedTime > 0 ? (
                        <p className="text-sm text-green-600">{t('distances.form.fields.time.calculated')}</p>
                      ) : (
                        <p className="text-xs text-muted-foreground">{t('distances.form.fields.time.manual')}</p>
                      )}
                      {estimatedTimeError && <p className="text-sm text-destructive">{estimatedTimeError}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="route_type">{t('distances.form.fields.routeType.label')}</Label>
                      <Select value={data.route_type} onValueChange={value => { setData('route_type', value); setIsDirty(true); }}>
                        <SelectTrigger id="route_type">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="primary">{t('distances.form.fields.routeType.primary')}</SelectItem>
                          <SelectItem value="secondary">{t('distances.form.fields.routeType.secondary')}</SelectItem>
                          <SelectItem value="alternative">{t('distances.form.fields.routeType.alternative')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="road_condition_factor">{t('distances.form.fields.roadCondition.label')}</Label>
                      <Input
                        id="road_condition_factor"
                        type="number"
                        step="0.1"
                        min="0.5"
                        max="2.0"
                        value={data.road_condition_factor}
                        onChange={e => { setData('road_condition_factor', e.target.value); setIsDirty(true); }}
                        placeholder={t('distances.form.fields.roadCondition.placeholder')}
                      />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="route_description">{t('distances.form.fields.routeDescription.label')}</Label>
                      <Textarea
                        id="route_description"
                        value={data.route_description}
                        onChange={e => { setData('route_description', e.target.value); setIsDirty(true); }}
                        placeholder={t('distances.form.fields.routeDescription.placeholder')}
                        rows={3}
                      />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="route_notes">{t('distances.form.fields.routeNotes.label')}</Label>
                      <Textarea
                        id="route_notes"
                        value={data.route_notes}
                        onChange={e => { setData('route_notes', e.target.value); setIsDirty(true); }}
                        placeholder={t('distances.form.fields.routeNotes.placeholder')}
                        rows={3}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div className="space-y-4">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="toll_road"
                          checked={data.toll_road}
                          onCheckedChange={checked => { setData('toll_road', Boolean(checked)); setIsDirty(true); }}
                        />
                        <Label htmlFor="toll_road">{t('distances.form.fields.tollRoad.label')}</Label>
                      </div>
                      {data.toll_road && (
                        <div className="space-y-2">
                          <Label htmlFor="toll_cost">{t('distances.form.fields.tollRoad.costLabel')}</Label>
                          <Input
                            id="toll_cost"
                            type="number"
                            step="0.01"
                            min="0"
                            value={data.toll_cost}
                            onChange={e => { setData('toll_cost', e.target.value); setIsDirty(true); }}
                            placeholder={t('distances.form.fields.tollRoad.costPlaceholder')}
                          />
                        </div>
                      )}
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="restricted_for_heavy_vehicles"
                          checked={data.restricted_for_heavy_vehicles}
                          onCheckedChange={checked => { setData('restricted_for_heavy_vehicles', Boolean(checked)); setIsDirty(true); }}
                        />
                        <Label htmlFor="restricted_for_heavy_vehicles">
                          {t('distances.form.fields.heavyVehicle.label')}
                        </Label>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <Button type="submit" disabled={processing}>
                      <Save className="mr-2 h-4 w-4" />
                      {processing ? t('distances.form.actions.creating') : t('distances.form.actions.create')}
                    </Button>
                    <Button type="button" variant="outline" asChild>
                      <Link href="/distances">{t('distances.actions.cancel')}</Link>
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="map" className="mt-4 flex flex-1 flex-col overflow-hidden">
            <Card className="flex flex-1 flex-col border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Navigation className="h-5 w-5 text-emerald-600" />
                  {t('distances.form.create.map.title')}
                </CardTitle>
                <CardDescription>{t('distances.form.create.map.description')}</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col space-y-4 overflow-y-auto p-6">
                <InteractiveMap
                  places={places}
                  selectedFromPlace={selectedFromPlace}
                  selectedToPlace={selectedToPlace}
                  onRouteChange={handleRouteChange}
                  onDistanceChange={handleDistanceChange}
                  onTimeChange={handleTimeChange}
                  height="500px"
                  showRouteDrawing={true}
                  showPlaceMarkers={true}
                />
                <p className="text-sm text-muted-foreground">
                  {t('distances.form.create.map.note')}
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="preview" className="mt-4 flex flex-1 flex-col overflow-hidden">
            <Card className="flex flex-1 flex-col border-0 shadow-lg">
              <CardHeader>
                <CardTitle>{t('distances.form.create.preview.title')}</CardTitle>
                <CardDescription>{t('distances.form.create.preview.description')}</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col overflow-y-auto p-6">
                <div className="space-y-4">
                  {routePoints.length > 0 ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div>
                          <h4 className="font-semibold text-slate-900 dark:text-slate-100">
                            {t('distances.form.create.preview.fromLabel')} {selectedFromPlace?.name || t('distances.form.create.preview.notSelected')}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            {selectedFromPlace?.woreda?.name || t('distances.form.create.preview.notAvailable')}
                          </p>
                        </div>
                        <div>
                          <h4 className="font-semibold text-slate-900 dark:text-slate-100">
                            {t('distances.form.create.preview.toLabel')} {selectedToPlace?.name || t('distances.form.create.preview.notSelected')}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            {selectedToPlace?.woreda?.name || t('distances.form.create.preview.notAvailable')}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                        <Card>
                          <CardContent className="p-4 text-center">
                            <p className="text-sm text-muted-foreground">{t('distances.form.create.preview.routePoints')}</p>
                            <p className="text-2xl font-bold">{routePoints.length}</p>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="p-4 text-center">
                            <p className="text-sm text-muted-foreground">{t('distances.form.create.preview.totalDistance')}</p>
                            <p className="text-2xl font-bold">{calculatedDistance.toFixed(2)} km</p>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="p-4 text-center">
                            <p className="text-sm text-muted-foreground">{t('distances.form.create.preview.estimatedTime')}</p>
                            <p className="text-2xl font-bold">{calculatedTime.toFixed(1)} hours</p>
                          </CardContent>
                        </Card>
                      </div>

                      <div className="space-y-2">
                        <h4 className="font-semibold text-slate-900 dark:text-slate-100">
                          {t('distances.form.create.preview.detailsTitle')}
                        </h4>
                        <div className="space-y-1 text-sm text-muted-foreground">
                          <p>
                            <strong>{t('distances.form.create.preview.details.routeType')}:</strong> {data.route_type}
                          </p>
                          <p>
                            <strong>{t('distances.form.create.preview.details.roadCondition')}:</strong> {data.road_condition_factor}
                          </p>
                          <p>
                            <strong>{t('distances.form.create.preview.details.tollRoad')}:</strong>{' '}
                            {data.toll_road ? t('distances.boolean.yes') : t('distances.boolean.no')}
                          </p>
                          {data.toll_road && data.toll_cost && (
                            <p>
                              <strong>{t('distances.form.create.preview.details.tollCost')}:</strong> {data.toll_cost} ETB
                            </p>
                          )}
                          <p>
                            <strong>{t('distances.form.create.preview.details.heavyVehicle')}:</strong>{' '}
                            {data.restricted_for_heavy_vehicles ? t('distances.boolean.yes') : t('distances.boolean.no')}
                          </p>
                          <p>
                            <strong>{t('distances.form.create.preview.details.routePoints')}:</strong>{' '}
                            {t('distances.form.create.preview.details.routePointsSaved', { count: routePoints.length })}
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="py-8 text-center">
                      <Route className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                      <p className="text-muted-foreground">
                        {t('distances.form.create.preview.empty')}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </FormPageLayout>
  );
}
