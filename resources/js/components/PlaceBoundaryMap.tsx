import { useEffect, useMemo } from 'react'
import { MapContainer, TileLayer, GeoJSON, CircleMarker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import {
  defaultCenter,
  extractFeatures,
  parseCoordinate,
  type GeoJsonInput,
  type NormalizedFeature,
} from '@/components/boundary-map-utils'

interface RegionSummary {
  name: string
  status?: 'active' | 'inactive'
  boundary_geojson?: GeoJsonInput
}

interface ZoneSummary {
  id: number
  name: string
  status?: 'active' | 'inactive'
  boundary_geojson?: GeoJsonInput
  region?: RegionSummary | null
}

interface WoredaSummary {
  id: number
  name: string
  status?: 'active' | 'inactive'
  boundary_geojson?: GeoJsonInput
  latitude?: number | string | null
  longitude?: number | string | null
  zone?: ZoneSummary | null
}

interface PlaceDetail {
  id: number
  name: string
  status?: 'active' | 'inactive'
  boundary_geojson?: GeoJsonInput
  latitude?: number | string | null
  longitude?: number | string | null
}

interface PlaceBoundaryMapProps {
  place: PlaceDetail
  woreda?: WoredaSummary | null
  height?: string
}

const levelStyles: Record<'region' | 'zone' | 'woreda' | 'place', L.PathOptions> = {
  region: {
    color: '#1f2937',
    dashArray: '2 6',
    weight: 1.25,
    fillColor: '#bfdbfe',
    fillOpacity: 0.03,
  },
  zone: {
    color: '#16a34a',
    dashArray: '4 6',
    weight: 1.25,
    fillColor: '#bbf7d0',
    fillOpacity: 0.05,
  },
  woreda: {
    color: '#f97316',
    weight: 1.5,
    fillColor: '#fed7aa',
    fillOpacity: 0.08,
  },
  place: {
    color: '#c026d3',
    weight: 2,
    fillColor: '#f5d0fe',
    fillOpacity: 0.14,
  },
}

function MapBounds({ features }: { features: NormalizedFeature[] }) {
  const map = useMap()

  useEffect(() => {
    if (!map || features.length === 0) {
      return
    }

    const layerGroup = L.featureGroup(features.map(feature => L.geoJSON(feature as any)))
    const bounds = layerGroup.getBounds()

    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [32, 32] })
    }
  }, [features, map])

  return null
}

function MapCenter({ coordinate }: { coordinate: [number, number] | null }) {
  const map = useMap()

  useEffect(() => {
    if (!map || !coordinate) {
      return
    }

    map.setView(coordinate, Math.max(map.getZoom(), 12))
  }, [coordinate, map])

  return null
}

export function PlaceBoundaryMap({ place, woreda, height = '320px' }: PlaceBoundaryMapProps) {
  const features = useMemo(() => {
    const collection: NormalizedFeature[] = []

    if (woreda?.zone?.region?.boundary_geojson) {
      collection.push(
        ...extractFeatures(woreda.zone.region.boundary_geojson, 'region', woreda.zone.region.name, undefined, woreda.zone.region.status)
      )
    }

    if (woreda?.zone?.boundary_geojson) {
      collection.push(
        ...extractFeatures(woreda.zone.boundary_geojson, 'zone', woreda.zone.name, woreda.zone.id, woreda.zone.status)
      )
    }

    if (woreda?.boundary_geojson) {
      collection.push(
        ...extractFeatures(woreda.boundary_geojson, 'woreda', woreda.name, woreda.id, woreda.status)
      )
    }

    collection.push(
      ...extractFeatures(place.boundary_geojson, 'place', place.name, place.id, place.status)
    )

    return collection
  }, [place.boundary_geojson, place.id, place.name, place.status, woreda?.boundary_geojson, woreda?.id, woreda?.name, woreda?.status, woreda?.zone?.boundary_geojson, woreda?.zone?.id, woreda?.zone?.name, woreda?.zone?.status, woreda?.zone?.region?.boundary_geojson, woreda?.zone?.region?.name, woreda?.zone?.region?.status])

  const hasBoundaries = features.length > 0
  const latitude = parseCoordinate(place.latitude)
  const longitude = parseCoordinate(place.longitude)
  const coordinate = latitude !== null && longitude !== null ? [latitude, longitude] as [number, number] : null

  if (!hasBoundaries && !coordinate) {
    return (
      <div className="flex h-56 items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50 text-center dark:border-slate-700 dark:bg-slate-900/40">
        <div>
          <p className="text-sm font-medium text-foreground">No geospatial data available</p>
          <p className="mt-1 text-sm text-muted-foreground">Provide boundary GeoJSON or latitude/longitude to visualize the place.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-lg border">
      <MapContainer
        center={coordinate ?? defaultCenter}
        zoom={hasBoundaries ? 11 : 13}
        style={{ height, width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {hasBoundaries && <MapBounds features={features} />}
        {!hasBoundaries && coordinate && <MapCenter coordinate={coordinate} />}

        {features.map((feature, index) => (
          <GeoJSON
            key={`${feature.properties.level}-${feature.properties.sourceId ?? feature.properties.name}-${index}`}
            data={feature as any}
            style={() => levelStyles[feature.properties.level as keyof typeof levelStyles]}
            onEachFeature={(geoFeature, layer) => {
              const properties = geoFeature.properties as NormalizedFeature['properties'] | undefined
              const name = properties?.name ?? 'Boundary'
              const status = properties?.status ? `Status: ${properties.status}` : null

              layer.bindPopup(
                [
                  `<strong>${name}</strong>`,
                  status,
                  `Layer: ${properties?.level ?? 'place'}`,
                ]
                  .filter(Boolean)
                  .join('<br />'),
              )
            }}
          />
        ))}

        {coordinate && (
          <CircleMarker
            center={coordinate}
            radius={6}
            pathOptions={{ color: '#86198f', weight: 2, fillOpacity: 0.5, fillColor: '#d946ef' }}
          >
            <Popup>
              <strong>{place.name}</strong>
              <br />
              Lat: {latitude !== null ? latitude.toFixed(5) : 'N/A'}
              <br />
              Lng: {longitude !== null ? longitude.toFixed(5) : 'N/A'}
            </Popup>
          </CircleMarker>
        )}
      </MapContainer>
    </div>
  )
}
