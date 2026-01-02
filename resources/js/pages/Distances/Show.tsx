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

const formatHierarchy = (hierarchy?: HierarchySummary | null) => {
  if (!hierarchy) return '—';
  const parts = [hierarchy.name, hierarchy.zone?.name, hierarchy.zone?.region?.name].filter(Boolean);
  return parts.join(', ') || '—';
};

export default function DistancesShow({ distance }: DistancesShowProps) {
  const { hasPermission } = usePermissions();
  const breadcrumbs = useMemo<BreadcrumbItem[]>(
    () => [
      { title: 'Distances', href: '/distances' },
      {
        title: `${distance.from_place?.name ?? 'Origin'} → ${distance.to_place?.name ?? 'Destination'}`,
        href: `/distances/${distance.id}`,
      },
    ],
    [distance.id, distance.from_place?.name, distance.to_place?.name],
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

  const distanceTitle = `${distance.from_place?.name ?? 'Unknown'} → ${distance.to_place?.name ?? 'Unknown'}`;
  const avgSpeed = (Number(distance.distance_km) / Number(distance.estimated_time_hours)).toFixed(1);

  const kpiSummary: DetailSummaryItem[] = [
    { label: 'Distance', value: `${Number(distance.distance_km).toFixed(2)} km`, helper: 'Route length' },
    { label: 'Estimated Time', value: `${Number(distance.estimated_time_hours).toFixed(2)} hrs`, helper: 'Travel duration' },
    { label: 'Average Speed', value: `${avgSpeed} km/h`, helper: 'Calculated pace' },
    { label: 'Route Type', value: distance.route_type || 'Standard', helper: 'Road classification' },
  ];

  return (
    <DetailPageLayout
      title={distanceTitle}
      subtitle="Route distance and logistics corridor specifications."
      breadcrumbs={breadcrumbs}
      headTitle={`Distance Details: ${distanceTitle}`}
      icon={<Route className="h-6 w-6 text-blue-700 dark:text-blue-300" />}
      iconWrapperClassName="bg-blue-100 dark:bg-blue-900/30"
      leading={
        <Button variant="outline" size="sm" asChild>
          <Link href="/distances">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Distances
          </Link>
        </Button>
      }
      actions={
        hasPermission('distances.edit') ? (
          <Button asChild>
            <Link href={`/distances/${distance.id}/edit`}>
              <Navigation className="h-4 w-4 mr-2" />
              Edit Distance
            </Link>
          </Button>
        ) : null
      }
    >
      <DetailSummaryGrid items={kpiSummary} />

      <div className="grid gap-6 lg:grid-cols-2">
        <DetailSectionCard title="Route Map" description="Visual representation of the route" icon={<MapPin className="h-5 w-5" />}>
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
                <p className="text-muted-foreground">Map not available - missing coordinates</p>
              </div>
            </div>
          )}
        </DetailSectionCard>

        <div className="space-y-6">
          <DetailSectionCard title="Distance Information" description="Origin and destination details" icon={<Route className="h-5 w-5" />}>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold uppercase text-muted-foreground">From Place</label>
                <p className="mt-1 text-lg font-semibold">{distance.from_place?.name || 'N/A'}</p>
                <p className="text-sm text-muted-foreground">{formatHierarchy(distance.from_place?.woreda)}</p>
              </div>

              <div>
                <label className="text-xs font-semibold uppercase text-muted-foreground">To Place</label>
                <p className="mt-1 text-lg font-semibold">{distance.to_place?.name || 'N/A'}</p>
                <p className="text-sm text-muted-foreground">{formatHierarchy(distance.to_place?.woreda)}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg border p-3">
                  <label className="text-xs font-semibold uppercase text-muted-foreground">Distance</label>
                  <p className="mt-1 flex items-center text-lg font-semibold">
                    <Route className="mr-1 h-4 w-4" />
                    {Number(distance.distance_km).toFixed(2)} km
                  </p>
                </div>
                <div className="rounded-lg border p-3">
                  <label className="text-xs font-semibold uppercase text-muted-foreground">Estimated Time</label>
                  <p className="mt-1 flex items-center text-lg font-semibold">
                    <Clock className="mr-1 h-4 w-4" />
                    {Number(distance.estimated_time_hours).toFixed(2)} hrs
                  </p>
                </div>
              </div>
            </div>
          </DetailSectionCard>

          <DetailSectionCard title="Route Details" description="Road conditions and restrictions" icon={<Navigation className="h-5 w-5" />}>
            <div className="space-y-3">
              {distance.road_condition_factor && (
                <div className="rounded-lg border p-3">
                  <label className="text-xs font-semibold uppercase text-muted-foreground">Road Condition Factor</label>
                  <p className="mt-1 text-sm font-semibold">{Number(distance.road_condition_factor).toFixed(2)}</p>
                </div>
              )}

              {distance.toll_road && (
                <div className="rounded-lg border p-3">
                  <label className="text-xs font-semibold uppercase text-muted-foreground">Toll Road</label>
                  <Badge className="mt-1" variant={distance.toll_road ? 'destructive' : 'secondary'}>
                    {distance.toll_road ? 'Yes' : 'No'}
                  </Badge>
                  {distance.toll_cost && <p className="mt-1 text-sm text-muted-foreground">Cost: {Number(distance.toll_cost).toFixed(2)} ETB</p>}
                </div>
              )}

              {distance.restricted_for_heavy_vehicles && (
                <div className="rounded-lg border p-3">
                  <label className="text-xs font-semibold uppercase text-muted-foreground">Heavy Vehicle Restriction</label>
                  <Badge className="mt-1" variant={distance.restricted_for_heavy_vehicles ? 'destructive' : 'secondary'}>
                    {distance.restricted_for_heavy_vehicles ? 'Restricted' : 'Allowed'}
                  </Badge>
                </div>
              )}

              {distance.route_description && (
                <div className="rounded-lg border p-3">
                  <label className="text-xs font-semibold uppercase text-muted-foreground">Route Description</label>
                  <p className="mt-1 text-sm">{distance.route_description}</p>
                </div>
              )}

              {distance.route_notes && (
                <div className="rounded-lg border p-3">
                  <label className="text-xs font-semibold uppercase text-muted-foreground">Route Notes</label>
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
