// Shared GeoJSON typing helpers for boundary map visualizations
export interface GeoJsonGeometry {
  type: string
  coordinates?: unknown
}

export interface GeoJsonFeature {
  type: 'Feature'
  geometry: GeoJsonGeometry | null
  properties?: Record<string, unknown>
}

export interface GeoJsonFeatureCollection {
  type: 'FeatureCollection'
  features: GeoJsonFeature[]
}

export type GeoJsonInput =
  | GeoJsonFeature
  | GeoJsonFeatureCollection
  | GeoJsonGeometry
  | Record<string, unknown>
  | null
  | undefined

export type BoundaryLevel = 'region' | 'zone' | 'woreda'

export type NormalizedFeature = GeoJsonFeature & {
  properties: {
    name?: string
    level: BoundaryLevel
    status?: string
    sourceId?: number
  }
}

export function isGeoJsonFeature(value: GeoJsonInput): value is GeoJsonFeature {
  return Boolean(value) && typeof value === 'object' && 'type' in (value as Record<string, unknown>) && (value as Record<string, unknown>).type === 'Feature'
}

export function isGeoJsonFeatureCollection(value: GeoJsonInput): value is GeoJsonFeatureCollection {
  return Boolean(value) && typeof value === 'object' && 'type' in (value as Record<string, unknown>) && (value as Record<string, unknown>).type === 'FeatureCollection'
}

export function isGeoJsonGeometry(value: GeoJsonInput): value is GeoJsonGeometry {
  return Boolean(value) && typeof value === 'object' && 'type' in (value as Record<string, unknown>) && (value as Record<string, unknown>).type !== 'Feature' && (value as Record<string, unknown>).type !== 'FeatureCollection'
}

export function decorateFeature(
  feature: GeoJsonFeature,
  level: BoundaryLevel,
  name: string,
  sourceId?: number,
  status?: string,
): NormalizedFeature {
  const properties: Record<string, unknown> = {
    ...(feature.properties ?? {}),
    name,
    level,
  }

  if (status) {
    properties.status = status
  }

  if (sourceId) {
    properties.sourceId = sourceId
  }

  return {
    ...feature,
    properties: properties as NormalizedFeature['properties'],
  }
}

export function extractFeatures(
  input: GeoJsonInput,
  level: BoundaryLevel,
  name: string,
  sourceId?: number,
  status?: string,
): NormalizedFeature[] {
  if (!input) {
    return []
  }

  if (isGeoJsonFeature(input)) {
    const normalized = decorateFeature(input, level, name, sourceId, status)
    return normalized.geometry ? [normalized] : []
  }

  if (isGeoJsonFeatureCollection(input) && Array.isArray(input.features)) {
    return input.features
      .map(feature => decorateFeature(feature, level, name, sourceId, status))
      .filter(feature => Boolean(feature.geometry)) as NormalizedFeature[]
  }

  if (isGeoJsonGeometry(input)) {
    const normalized = decorateFeature(
      {
        type: 'Feature',
        geometry: input,
      },
      level,
      name,
      sourceId,
      status,
    )

    return normalized.geometry ? [normalized] : []
  }

  if (typeof input === 'object' && input !== null) {
    const maybeType = (input as Record<string, unknown>).type

    if (maybeType === 'Feature') {
      const normalized = decorateFeature(input as GeoJsonFeature, level, name, sourceId, status)
      return normalized.geometry ? [normalized] : []
    }

    if (maybeType === 'FeatureCollection' && Array.isArray((input as Record<string, unknown>).features)) {
      const featureCollection = input as GeoJsonFeatureCollection

      return featureCollection.features
        .map(feature => decorateFeature(feature, level, name, sourceId, status))
        .filter(feature => Boolean(feature.geometry)) as NormalizedFeature[]
    }
  }

  return []
}

export function parseCoordinate(value?: number | string | null): number | null {
  if (value === null || value === undefined) {
    return null
  }

  const numeric = typeof value === 'string' ? Number(value) : value
  return Number.isFinite(numeric) ? numeric : null
}

export const defaultCenter: [number, number] = [9.145, 40.4897]
