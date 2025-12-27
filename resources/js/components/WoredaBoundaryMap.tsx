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
  boundary_geojson?: GeoJsonInput
}

interface ZoneSummary {
  id: number
  name: string
  status?: 'active' | 'inactive'
  boundary_geojson?: GeoJsonInput
  region?: RegionSummary | null
}

interface WoredaDetail {
  id: number
  name: string
  status?: 'active' | 'inactive'
  boundary_geojson?: GeoJsonInput
  latitude?: number | string | null
  longitude?: number | string | null
}

interface WoredaBoundaryMapProps {
  woreda: WoredaDetail
  zone?: ZoneSummary | null
  height?: string
}

const levelStyles: Record<'region' | 'zone' | 'woreda', L.PathOptions> = {
  region: {
    color: '#1f2937',
    dashArray: '2 6',
    weight: 1.5,
    fillColor: '#bfdbfe',
    fillOpacity: 0.03,
  },
  zone: {
    color: '#16a34a',
    dashArray: '4 6',
    weight: 1.5,
    fillColor: '#bbf7d0',
    fillOpacity: 0.05,
  },
  woreda: {
    color: '#f97316',
    weight: 2,
    fillColor: '#fed7aa',
    fillOpacity: 0.08,
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

    map.setView(coordinate, Math.max(map.getZoom(), 9))
  }, [coordinate, map])

  return null
}

export function WoredaBoundaryMap({ woreda, zone, height = '320px' }: WoredaBoundaryMapProps) {
  const features = useMemo(() => {
    const collection: NormalizedFeature[] = []

    if (zone?.region?.boundary_geojson) {
      collection.push(
        ...extractFeatures(zone.region.boundary_geojson, 'region', zone.region.name)
      )
    }

    if (zone?.boundary_geojson) {
      collection.push(
        ...extractFeatures(zone.boundary_geojson, 'zone', zone.name, zone.id, zone.status)
      )
    }

    collection.push(
      ...extractFeatures(woreda.boundary_geojson, 'woreda', woreda.name, woreda.id, woreda.status)
    )

    return collection
  }, [woreda.boundary_geojson, woreda.id, woreda.name, woreda.status, zone?.boundary_geojson, zone?.id, zone?.name, zone?.status, zone?.region?.boundary_geojson, zone?.region?.name])

  const hasBoundaries = features.length > 0
  const latitude = parseCoordinate(woreda.latitude)
  const longitude = parseCoordinate(woreda.longitude)
  const coordinate = latitude !== null && longitude !== null ? [latitude, longitude] as [number, number] : null

  if (!hasBoundaries && !coordinate) {
    return (
      <div className="flex h-56 items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50 text-center dark:border-slate-700 dark:bg-slate-900/40">
        <div>
          <p className="text-sm font-medium text-foreground">No geospatial data available</p>
          <p className="mt-1 text-sm text-muted-foreground">Provide boundary GeoJSON or latitude/longitude to visualize the woreda.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-lg border">
      <MapContainer
        center={coordinate ?? defaultCenter}
        zoom={hasBoundaries ? 8 : 10}
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
            style={() => levelStyles[feature.properties.level]}
            onEachFeature={(geoFeature, layer) => {
              const properties = geoFeature.properties as NormalizedFeature['properties'] | undefined
              const name = properties?.name ?? 'Boundary'
              const status = properties?.status ? `Status: ${properties.status}` : null

              layer.bindPopup(
                [
                  `<strong>${name}</strong>`,
                  status,
                  `Layer: ${properties?.level ?? 'woreda'}`,
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
            pathOptions={{ color: '#047857', weight: 2, fillOpacity: 0.45, fillColor: '#34d399' }}
          >
            <Popup>
              <strong>{woreda.name}</strong>
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
