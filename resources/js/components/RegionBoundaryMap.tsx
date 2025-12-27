import { useEffect, useMemo } from 'react'
import { MapContainer, TileLayer, GeoJSON, useMap, CircleMarker, Popup } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import {
  defaultCenter,
  extractFeatures,
  parseCoordinate,
  type GeoJsonInput,
  type NormalizedFeature,
  type BoundaryLevel,
} from '@/components/boundary-map-utils'

interface RegionBoundaryInfo {
  name: string
  boundary_geojson?: GeoJsonInput
  latitude?: number | string | null
  longitude?: number | string | null
}

interface WoredaBoundaryInfo {
  id: number
  name: string
  status?: 'active' | 'inactive'
  boundary_geojson?: GeoJsonInput
}

interface ZoneBoundaryInfo {
  id: number
  name: string
  status?: 'active' | 'inactive'
  boundary_geojson?: GeoJsonInput
  woredas?: WoredaBoundaryInfo[]
}

interface RegionBoundaryMapProps {
  region: RegionBoundaryInfo
  zones: ZoneBoundaryInfo[]
  height?: string
}

const levelStyles: Record<BoundaryLevel, L.PathOptions> = {
  region: {
    color: '#2563eb',
    weight: 2,
    fillColor: '#60a5fa',
    fillOpacity: 0.08,
  },
  zone: {
    color: '#16a34a',
    dashArray: '6 4',
    weight: 1.5,
    fillColor: '#bbf7d0',
    fillOpacity: 0.05,
  },
  woreda: {
    color: '#f97316',
    dashArray: '4 6',
    weight: 1,
    fillColor: '#fed7aa',
    fillOpacity: 0.04,
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

    map.setView(coordinate, Math.max(map.getZoom(), 7))
  }, [coordinate, map])

  return null
}

export function RegionBoundaryMap({ region, zones, height = '420px' }: RegionBoundaryMapProps) {
  const features = useMemo(() => {
    const collection: NormalizedFeature[] = []

    collection.push(
      ...extractFeatures(region.boundary_geojson, 'region', region.name)
    )

    zones.forEach(zone => {
      collection.push(
        ...extractFeatures(zone.boundary_geojson, 'zone', zone.name, zone.id, zone.status)
      )

      zone.woredas?.forEach(woreda => {
        collection.push(
          ...extractFeatures(woreda.boundary_geojson, 'woreda', woreda.name, woreda.id, woreda.status)
        )
      })
    })

    return collection
  }, [region.boundary_geojson, region.name, zones])

  const hasBoundaries = features.length > 0
  const latitude = parseCoordinate(region.latitude)
  const longitude = parseCoordinate(region.longitude)
  const regionCoordinate = latitude !== null && longitude !== null ? [latitude, longitude] as [number, number] : null

  if (!hasBoundaries && !regionCoordinate) {
    return (
      <div className="flex h-64 items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50 text-center dark:border-slate-700 dark:bg-slate-900/40">
        <div>
          <p className="text-sm font-medium text-foreground">No geospatial data available</p>
          <p className="mt-1 text-sm text-muted-foreground">Provide boundary GeoJSON or latitude/longitude to visualize the region.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-lg border">
      <MapContainer
        center={regionCoordinate ?? defaultCenter}
        zoom={hasBoundaries ? 6 : 8}
        style={{ height, width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {hasBoundaries && <MapBounds features={features} />}
        {!hasBoundaries && regionCoordinate && <MapCenter coordinate={regionCoordinate} />}

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
                  `Layer: ${properties?.level ?? 'region'}`,
                ]
                  .filter(Boolean)
                  .join('<br />'),
              )
            }}
          />
        ))}

        {regionCoordinate && (
          <CircleMarker
            center={regionCoordinate}
            radius={6}
            pathOptions={{ color: '#1d4ed8', weight: 2, fillOpacity: 0.4, fillColor: '#3b82f6' }}
          >
            <Popup>
              <strong>{region.name}</strong>
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
