import { Link } from '@inertiajs/react';
import { useMemo } from 'react';
import { ArrowLeft, MapPin, Clock, Route, Navigation } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { usePermissions } from '@/hooks/use-permissions';
import { InteractiveMap } from '@/components/InteractiveMap';
import type { BreadcrumbItem } from '@/types';
import { DetailPageLayout } from '@/components/detail/detail-page-layout';
import { DetailSectionCard } from '@/components/detail/detail-section-card';
import { DetailSummaryGrid, type DetailSummaryItem } from '@/components/detail/detail-summary-grid';
import { useTranslation } from 'react-i18next';

interface HierarchySummary {
  name?: string | null;
  zone?: {
    name?: string | null;
    region?: { name?: string | null } | null;
  } | null;
}

interface PlaceSummary {
  id: number;
  name?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  woreda?: HierarchySummary | null;
}

interface Distance {
  id: number;
  from_place_id: number;
  to_place_id: number;
  distance_km: number;
  estimated_time_hours: number;
  route_type?: string | null;
  road_condition_factor?: number | null;
  toll_road?: boolean | null;
  toll_cost?: number | null;
  restricted_for_heavy_vehicles?: boolean | null;
  route_description?: string | null;
  route_notes?: string | null;
  from_place?: PlaceSummary | null;
  to_place?: PlaceSummary | null;
  created_at: string;
  updated_at: string;
}

interface DistancesShowProps {
  distance: Distance;
}

export default function DistancesShow({ distance }: DistancesShowProps) {
  const { t, i18n } = useTranslation();
  const { hasPermission } = usePermissions();
  const locale = i18n.language || 'en-US';
  const notAvailableLabel = t('distances.fallbacks.notAvailable');
  const formatHierarchy = (hierarchy?: HierarchySummary | null) => {
    if (!hierarchy) return notAvailableLabel;
    const parts = [hierarchy.name, hierarchy.zone?.name, hierarchy.zone?.region?.name].filter(Boolean);
    return parts.join(', ') || notAvailableLabel;
  };
  const breadcrumbs = useMemo<BreadcrumbItem[]>(
    () => [
      { title: t('distances.title'), href: '/distances' },
      {
        title: `${distance.from_place?.name ?? t('distances.fallbacks.origin')} → ${distance.to_place?.name ?? t('distances.fallbacks.destination')}`,
        href: `/distances/${distance.id}`,
      },
    ],
    [distance.id, distance.from_place?.name, distance.to_place?.name, t],
  );

  const places = [
    {
      id: distance.from_place?.id || 0,
      name: distance.from_place?.name || '',
      latitude: distance.from_place?.latitude,
      longitude: distance.from_place?.longitude,
      woreda: distance.from_place?.woreda,
    },
    {
      id: distance.to_place?.id || 0,
      name: distance.to_place?.name || '',
      latitude: distance.to_place?.latitude,
      longitude: distance.to_place?.longitude,
      woreda: distance.to_place?.woreda,
    },
  ].filter(place => place.latitude && place.longitude);

  const selectedFromPlace = places[0] || null;
  const selectedToPlace = places[1] || null;

  const distanceTitle = `${distance.from_place?.name ?? t('distances.fallbacks.unknown')} → ${distance.to_place?.name ?? t('distances.fallbacks.unknown')}`;
  const avgSpeed = (Number(distance.distance_km) / Number(distance.estimated_time_hours)).toFixed(1);

  const kpiSummary: DetailSummaryItem[] = [
    {
      label: t('distances.show.kpi.distance.label'),
      value: `${Number(distance.distance_km).toLocaleString(locale, { maximumFractionDigits: 2 })} ${t('distances.units.km')}`,
      helper: t('distances.show.kpi.distance.helper'),
    },
    {
      label: t('distances.show.kpi.time.label'),
      value: `${Number(distance.estimated_time_hours).toLocaleString(locale, { maximumFractionDigits: 2 })} ${t('distances.units.hours')}`,
      helper: t('distances.show.kpi.time.helper'),
    },
    {
      label: t('distances.show.kpi.speed.label'),
      value: `${avgSpeed} ${t('distances.units.kmh')}`,
      helper: t('distances.show.kpi.speed.helper'),
    },
    {
      label: t('distances.show.kpi.routeType.label'),
      value: distance.route_type ? t(`distances.routeTypes.${distance.route_type}`, { defaultValue: distance.route_type }) : t('distances.show.kpi.routeType.default'),
      helper: t('distances.show.kpi.routeType.helper'),
    },
  ];

  return (
    <DetailPageLayout
      title={distanceTitle}
      subtitle={t('distances.show.subtitle')}
      breadcrumbs={breadcrumbs}
      headTitle={t('distances.show.headTitle', { route: distanceTitle })}
      icon={<Route className="h-6 w-6 text-blue-700 dark:text-blue-300" />}
      iconWrapperClassName="bg-blue-100 dark:bg-blue-900/30"
      leading={
        <Button variant="outline" size="sm" asChild>
          <Link href="/distances">
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t('distances.show.actions.back')}
          </Link>
        </Button>
      }
      actions={
        hasPermission('distances.edit') ? (
          <Button asChild>
            <Link href={`/distances/${distance.id}/edit`}>
              <Navigation className="h-4 w-4 mr-2" />
              {t('distances.show.actions.edit')}
            </Link>
          </Button>
        ) : null
      }
    >
      <DetailSummaryGrid items={kpiSummary} />

      <div className="grid gap-6 lg:grid-cols-2">
        <DetailSectionCard
          title={t('distances.show.sections.map.title')}
          description={t('distances.show.sections.map.description')}
          icon={<MapPin className="h-5 w-5" />}
        >
          {selectedFromPlace && selectedToPlace ? (
            <InteractiveMap
              places={places}
              selectedFromPlace={selectedFromPlace}
              selectedToPlace={selectedToPlace}
              onRouteChange={() => {}}
              onDistanceChange={() => {}}
              onTimeChange={() => {}}
              height="400px"
              showRouteDrawing={false}
              showPlaceMarkers={true}
              readOnly={true}
              showDirectRoute={true}
            />
          ) : (
            <div className="flex h-96 items-center justify-center rounded-lg bg-muted">
              <div className="text-center">
                <MapPin className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                <p className="text-muted-foreground">{t('distances.show.mapUnavailable')}</p>
              </div>
            </div>
          )}
        </DetailSectionCard>

        <div className="space-y-6">
          <DetailSectionCard
            title={t('distances.show.sections.info.title')}
            description={t('distances.show.sections.info.description')}
            icon={<Route className="h-5 w-5" />}
          >
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold uppercase text-muted-foreground">{t('distances.show.fields.from')}</label>
                <p className="mt-1 text-lg font-semibold">{distance.from_place?.name || notAvailableLabel}</p>
                <p className="text-sm text-muted-foreground">{formatHierarchy(distance.from_place?.woreda)}</p>
              </div>

              <div>
                <label className="text-xs font-semibold uppercase text-muted-foreground">{t('distances.show.fields.to')}</label>
                <p className="mt-1 text-lg font-semibold">{distance.to_place?.name || notAvailableLabel}</p>
                <p className="text-sm text-muted-foreground">{formatHierarchy(distance.to_place?.woreda)}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg border p-3">
                  <label className="text-xs font-semibold uppercase text-muted-foreground">{t('distances.show.fields.distance')}</label>
                  <p className="mt-1 flex items-center text-lg font-semibold">
                    <Route className="mr-1 h-4 w-4" />
                    {Number(distance.distance_km).toLocaleString(locale, { maximumFractionDigits: 2 })} {t('distances.units.km')}
                  </p>
                </div>
                <div className="rounded-lg border p-3">
                  <label className="text-xs font-semibold uppercase text-muted-foreground">{t('distances.show.fields.time')}</label>
                  <p className="mt-1 flex items-center text-lg font-semibold">
                    <Clock className="mr-1 h-4 w-4" />
                    {Number(distance.estimated_time_hours).toLocaleString(locale, { maximumFractionDigits: 2 })} {t('distances.units.hours')}
                  </p>
                </div>
              </div>
            </div>
          </DetailSectionCard>

          <DetailSectionCard
            title={t('distances.show.sections.details.title')}
            description={t('distances.show.sections.details.description')}
            icon={<Navigation className="h-5 w-5" />}
          >
            <div className="space-y-3">
              {distance.road_condition_factor && (
                <div className="rounded-lg border p-3">
                  <label className="text-xs font-semibold uppercase text-muted-foreground">{t('distances.show.fields.roadCondition')}</label>
                  <p className="mt-1 text-sm font-semibold">{Number(distance.road_condition_factor).toFixed(2)}</p>
                </div>
              )}

              {distance.toll_road && (
                <div className="rounded-lg border p-3">
                  <label className="text-xs font-semibold uppercase text-muted-foreground">{t('distances.show.fields.tollRoad')}</label>
                  <Badge className="mt-1" variant={distance.toll_road ? 'destructive' : 'secondary'}>
                    {distance.toll_road ? t('distances.boolean.yes') : t('distances.boolean.no')}
                  </Badge>
                  {distance.toll_cost && (
                    <p className="mt-1 text-sm text-muted-foreground">
                      {t('distances.show.fields.tollCost', { value: Number(distance.toll_cost).toFixed(2) })}
                    </p>
                  )}
                </div>
              )}

              {distance.restricted_for_heavy_vehicles && (
                <div className="rounded-lg border p-3">
                  <label className="text-xs font-semibold uppercase text-muted-foreground">{t('distances.show.fields.heavyVehicle')}</label>
                  <Badge className="mt-1" variant={distance.restricted_for_heavy_vehicles ? 'destructive' : 'secondary'}>
                    {distance.restricted_for_heavy_vehicles
                      ? t('distances.flags.heavyVehicle.true')
                      : t('distances.flags.heavyVehicle.false')}
                  </Badge>
                </div>
              )}

              {distance.route_description && (
                <div className="rounded-lg border p-3">
                  <label className="text-xs font-semibold uppercase text-muted-foreground">{t('distances.show.fields.routeDescription')}</label>
                  <p className="mt-1 text-sm">{distance.route_description}</p>
                </div>
              )}

              {distance.route_notes && (
                <div className="rounded-lg border p-3">
                  <label className="text-xs font-semibold uppercase text-muted-foreground">{t('distances.show.fields.routeNotes')}</label>
                  <p className="mt-1 text-sm">{distance.route_notes}</p>
                </div>
              )}
            </div>
          </DetailSectionCard>
        </div>
      </div>
    </DetailPageLayout>
  );
}
