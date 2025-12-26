import { Head, Link } from '@inertiajs/react'
import { useMemo } from 'react'
import {
  ArrowLeft,
  MapPin,
  Clock,
  Route,
  Navigation,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { usePermissions } from '@/hooks/use-permissions'
import { InteractiveMap } from '@/components/InteractiveMap'
import AppLayout from '@/layouts/app-layout'
import type { BreadcrumbItem } from '@/types'

interface HierarchySummary {
  name?: string | null
  zone?: {
    name?: string | null
    region?: { name?: string | null } | null
  } | null
}

interface PlaceSummary {
  id: number
  name?: string | null
  latitude?: number | null
  longitude?: number | null
  woreda?: HierarchySummary | null
}

interface Distance {
  id: number
  from_place_id: number
  to_place_id: number
  distance_km: number
  estimated_time_hours: number
  route_type?: string | null
  road_condition_factor?: number | null
  toll_road?: boolean | null
  toll_cost?: number | null
  restricted_for_heavy_vehicles?: boolean | null
  route_description?: string | null
  route_notes?: string | null
  from_place?: PlaceSummary | null
  to_place?: PlaceSummary | null
  created_at: string
  updated_at: string
}

interface DistancesShowProps {
  distance: Distance
}

const formatHierarchy = (hierarchy?: HierarchySummary | null) => {
  if (!hierarchy) return '—'
  const parts = [hierarchy.name, hierarchy.zone?.name, hierarchy.zone?.region?.name].filter(Boolean)
  return parts.join(', ') || '—'
}

export default function DistancesShow({ distance }: DistancesShowProps) {
  const { hasPermission } = usePermissions()
  const breadcrumbs = useMemo<BreadcrumbItem[]>(
    () => [
      { title: 'Distances', href: '/distances' },
      {
        title: `${distance.from_place?.name ?? 'Origin'} → ${distance.to_place?.name ?? 'Destination'}`,
        href: `/distances/${distance.id}`,
      },
    ],
    [distance.id, distance.from_place?.name, distance.to_place?.name],
  )

  const places = [
    {
      id: distance.from_place?.id || 0,
      name: distance.from_place?.name || '',
      latitude: distance.from_place?.latitude,
      longitude: distance.from_place?.longitude,
      woreda: distance.from_place?.woreda
    },
    {
      id: distance.to_place?.id || 0,
      name: distance.to_place?.name || '',
      latitude: distance.to_place?.latitude,
      longitude: distance.to_place?.longitude,
      woreda: distance.to_place?.woreda
    }
  ].filter(place => place.latitude && place.longitude)

  const selectedFromPlace = places[0] || null
  const selectedToPlace = places[1] || null

  const distanceTitle = `${distance.from_place?.name ?? 'Unknown'} → ${distance.to_place?.name ?? 'Unknown'}`

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title={`Distance Details: ${distanceTitle}`} />
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link
              href="/distances"
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Distances
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Distance Details
              </h1>
              <p className="text-gray-600">
                {distance.from_place?.name} → {distance.to_place?.name}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {hasPermission('distances.edit') && (
              <Link href={`/distances/${distance.id}/edit`}>
                <Button>
                  <Navigation className="mr-2 h-4 w-4" />
                  Edit Distance
                </Button>
              </Link>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Interactive Map */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <MapPin className="w-5 h-5 mr-2" />
                Route Map
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedFromPlace && selectedToPlace ? (
                <InteractiveMap
                  places={places}
                  selectedFromPlace={selectedFromPlace}
                  selectedToPlace={selectedToPlace}
                  onRouteChange={() => {}} // Read-only mode
                  onDistanceChange={() => {}} // Read-only mode
                  onTimeChange={() => {}} // Read-only mode
                  height="400px"
                  showRouteDrawing={false} // Disable drawing in show mode
                  showPlaceMarkers={true}
                  readOnly={true} // Read-only mode
                  showDirectRoute={true} // Show direct route line
                />
              ) : (
                <div className="h-96 flex items-center justify-center bg-gray-50 rounded-lg">
                  <div className="text-center">
                    <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">Map not available - missing coordinates</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Distance Information */}
          <div className="space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle>Distance Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">From Place</label>
                  <p className="text-lg font-semibold">{distance.from_place?.name || 'N/A'}</p>
                  <p className="text-sm text-gray-600">{formatHierarchy(distance.from_place?.woreda)}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">To Place</label>
                  <p className="text-lg font-semibold">{distance.to_place?.name || 'N/A'}</p>
                  <p className="text-sm text-gray-600">{formatHierarchy(distance.to_place?.woreda)}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Distance</label>
                    <p className="text-lg font-semibold flex items-center">
                      <Route className="w-4 h-4 mr-1" />
                      {Number(distance.distance_km).toFixed(2)} KM
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Estimated Time</label>
                    <p className="text-lg font-semibold flex items-center">
                      <Clock className="w-4 h-4 mr-1" />
                      {Number(distance.estimated_time_hours).toFixed(2)} Hours
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Route Details */}
            <Card>
              <CardHeader>
                <CardTitle>Route Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {distance.route_type && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Route Type</label>
                    <Badge variant="outline">{distance.route_type}</Badge>
                  </div>
                )}

                {distance.road_condition_factor && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Road Condition Factor</label>
                    <p className="text-sm">{Number(distance.road_condition_factor).toFixed(2)}</p>
                  </div>
                )}

                {distance.toll_road && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Toll Road</label>
                    <Badge variant={distance.toll_road ? "destructive" : "secondary"}>
                      {distance.toll_road ? "Yes" : "No"}
                    </Badge>
                    {distance.toll_cost && (
                      <p className="text-sm text-gray-600 mt-1">
                        Cost: {Number(distance.toll_cost).toFixed(2)} ETB
                      </p>
                    )}
                  </div>
                )}

                {distance.restricted_for_heavy_vehicles && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Heavy Vehicle Restriction</label>
                    <Badge variant={distance.restricted_for_heavy_vehicles ? "destructive" : "secondary"}>
                      {distance.restricted_for_heavy_vehicles ? "Restricted" : "Allowed"}
                    </Badge>
                  </div>
                )}

                {distance.route_description && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Route Description</label>
                    <p className="text-sm text-gray-700">{distance.route_description}</p>
                  </div>
                )}

                {distance.route_notes && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Route Notes</label>
                    <p className="text-sm text-gray-700">{distance.route_notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Info */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Distance ID</span>
                  <span className="text-sm font-medium">#{distance.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Created</span>
                  <span className="text-sm font-medium">
                    {new Date(distance.created_at).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Last Updated</span>
                  <span className="text-sm font-medium">
                    {new Date(distance.updated_at).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Average Speed</span>
                  <span className="text-sm font-medium">
                    {(Number(distance.distance_km) / Number(distance.estimated_time_hours)).toFixed(1)} KM/H
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
