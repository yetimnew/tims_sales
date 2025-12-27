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

interface ParentRegionInfo {
  name: string
  boundary_geojson?: GeoJsonInput
}

interface ZoneDetail {
  id: number
  name: string
  status?: 'active' | 'inactive'
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

interface ZoneBoundaryMapProps {
  zone: ZoneDetail
  woredas: WoredaBoundaryInfo[]
  parentRegion?: ParentRegionInfo
  height?: string
}

const levelStyles: Record<'region' | 'zone' | 'woreda', L.PathOptions> = {
  region: {
    color: '#0f172a',
    weight: 1.5,
    dashArray: '2 6',
    fillColor: '#cbd5f5',
    fillOpacity: 0.03,
  },
  zone: {
    color: '#16a34a',
    weight: 2,
    fillColor: '#86efac',
    fillOpacity: 0.08,
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

    map.setView(coordinate, Math.max(map.getZoom(), 8))
  }, [coordinate, map])

  return null
}

export function ZoneBoundaryMap({ zone, woredas, parentRegion, height = '360px' }: ZoneBoundaryMapProps) {
  const features = useMemo(() => {
    const collection: NormalizedFeature[] = []

    if (parentRegion?.boundary_geojson) {
      collection.push(
        ...extractFeatures(parentRegion.boundary_geojson, 'region', parentRegion.name)
      )
    }

    collection.push(
      ...extractFeatures(zone.boundary_geojson, 'zone', zone.name, zone.id, zone.status)
    )

    woredas.forEach(woreda => {
      collection.push(
        ...extractFeatures(woreda.boundary_geojson, 'woreda', woreda.name, woreda.id, woreda.status)
      )
    })

    return collection
  }, [parentRegion?.boundary_geojson, parentRegion?.name, woredas, zone.boundary_geojson, zone.id, zone.name, zone.status])

  const hasBoundaries = features.length > 0
  const latitude = parseCoordinate(zone.latitude)
  const longitude = parseCoordinate(zone.longitude)
  const coordinate = latitude !== null && longitude !== null ? [latitude, longitude] as [number, number] : null

  if (!hasBoundaries && !coordinate) {
    return (
      <div className="flex h-64 items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50 text-center dark:border-slate-700 dark:bg-slate-900/40">
        <div>
          <p className="text-sm font-medium text-foreground">No geospatial data available</p>
          <p className="mt-1 text-sm text-muted-foreground">Provide boundary GeoJSON or latitude/longitude to visualize the zone.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-lg border">
      <MapContainer
        center={coordinate ?? defaultCenter}
        zoom={hasBoundaries ? 7 : 9}
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
                  `Layer: ${properties?.level ?? 'zone'}`,
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
            pathOptions={{ color: '#0f172a', weight: 2, fillOpacity: 0.4, fillColor: '#2563eb' }}
          >
            <Popup>
              <strong>{zone.name}</strong>
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
