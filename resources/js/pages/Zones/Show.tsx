import { useMemo, useState } from 'react'
import { Head, Link, router } from '@inertiajs/react'
import {
  ArrowLeft,
  Edit,
  Trash2,
  Layers,
  MapPin,
  Building2,
  Compass,
  Globe2,
  Users,
  ThermometerSun,
  BarChart3,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { DeleteConfirmationDialog } from '@/components/delete-confirmation-dialog'
import { ActivityLogTable } from '@/components/activity-log-table'
import { usePermissions } from '@/hooks/use-permissions'
import AppLayout from '@/layouts/app-layout'
import type { BreadcrumbItem } from '@/types'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ZoneBoundaryMap } from '@/components/ZoneBoundaryMap'
import type { GeoJsonInput } from '@/components/boundary-map-utils'

interface RegionSummary {
  id: number
  name: string
  status?: 'active' | 'inactive'
  boundary_geojson?: GeoJsonInput
}

interface WoredaSummary {
  id: number
  name: string
  status?: 'active' | 'inactive'
  population?: number | string | null
  boundary_geojson?: GeoJsonInput
}

interface Zone {
  id: number
  name: string
  code?: string | null
  status: 'active' | 'inactive'
  description?: string | null
  administrative_center?: string | null
  area_km2?: number | string | null
  population?: number | string | null
  latitude?: number | string | null
  longitude?: number | string | null
  elevation_m?: number | string | null
  accessibility_score?: number | string | null
  infrastructure_notes?: string | null
  climate_profile?: string | null
  boundary_geojson?: GeoJsonInput
  created_at: string
  updated_at: string
  region?: RegionSummary | null
  woredas?: WoredaSummary[]
}

interface ActivityLog {
  id: number
  description: string
  created_at: string
  event?: 'created' | 'updated' | 'deleted'
  causer?: {
    id: number
    name: string
  } | null
  properties?: {
    old?: Record<string, unknown>
    attributes?: Record<string, unknown>
  } | null
}

interface ZoneShowProps {
  zone: Zone
  activityLogs?: ActivityLog[]
}

const getStatusBadgeStyles = (status: string) =>
  status === 'active'
    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200'
    : 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-200'

const formatNumber = (value?: number | string | null, options?: Intl.NumberFormatOptions) => {
  if (value === null || value === undefined || value === '') return 'N/A'
  const numeric = Number(value)
  if (Number.isNaN(numeric)) return 'N/A'
  return numeric.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
    ...options,
  })
}

const formatCoordinate = (value?: number | string | null) => {
  if (value === null || value === undefined || value === '') return 'N/A'
  const numeric = Number(value)
  if (Number.isNaN(numeric)) return 'N/A'
  return `${numeric.toFixed(5)}°`
}

const formatDate = (value?: string | null) => {
  if (!value) return 'N/A'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'N/A'
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export default function ZonesShow({ zone, activityLogs = [] }: ZoneShowProps) {
  const { hasPermission } = usePermissions()
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const breadcrumbs = useMemo<BreadcrumbItem[]>(
    () => [
      { title: 'Zones', href: '/zones' },
      { title: zone.name || `Zone ${zone.id}`, href: `/zones/${zone.id}` },
    ],
    [zone.id, zone.name],
  )

  const woredas = zone.woredas ?? []
  const activeWoredas = woredas.filter(w => w.status === 'active').length
  const activityLogRows = useMemo(
    () =>
      activityLogs.map(log => ({
        id: log.id,
        action: log.event ?? 'updated',
        description: log.description,
        user: log.causer ? { name: log.causer.name } : undefined,
        created_at: log.created_at,
        old_values: log.properties?.old ?? undefined,
        new_values: log.properties?.attributes ?? undefined,
      })),
    [activityLogs],
  )

  const handleDelete = () => {
    setIsDeleting(true)
    router.delete(`/zones/${zone.id}`, {
      preserveScroll: true,
      onSuccess: () => {
        setDeleteDialogOpen(false)
      },
      onFinish: () => {
        setIsDeleting(false)
      },
    })
  }

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title={`Zone: ${zone.name}`} />

      <div className="flex h-full flex-1 flex-col gap-6 overflow-hidden rounded-xl p-4">
        <div className="rounded-lg border border-slate-200 bg-gradient-to-r from-slate-50 to-cyan-50 p-6 shadow-sm dark:border-slate-700 dark:from-slate-900 dark:to-cyan-950/30">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.get('/zones')}
                className="flex items-center gap-2 border-slate-300 hover:bg-slate-100 dark:border-slate-600 dark:hover:bg-slate-800"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Zones
              </Button>
              <div className="flex items-center gap-4">
                <div className="rounded-xl bg-cyan-100 p-3 dark:bg-cyan-900/30">
                  <Layers className="h-6 w-6 text-cyan-700 dark:text-cyan-300" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{zone.name}</h1>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {zone.description || 'Zone administration overview and operational metrics.'}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Badge className={`text-sm font-medium ${getStatusBadgeStyles(zone.status)}`}>
                      {zone.status.charAt(0).toUpperCase() + zone.status.slice(1)}
                    </Badge>
                    {zone.region && (
                      <Badge variant="outline" className="flex items-center gap-2 text-sm font-medium">
                        <Globe2 className="h-3.5 w-3.5" /> Region: {zone.region.name}
                      </Badge>
                    )}
                    {zone.administrative_center && (
                      <Badge variant="outline" className="flex items-center gap-2 text-sm font-medium">
                        <Building2 className="h-3.5 w-3.5" /> Admin Center: {zone.administrative_center}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {(hasPermission('zones.edit') || hasPermission('zones.destroy')) && (
              <div className="flex items-center gap-2">
                {hasPermission('zones.edit') && (
                  <Button variant="outline" asChild className="gap-2 hover:border-cyan-300 hover:bg-cyan-50">
                    <Link href={`/zones/${zone.id}/edit`}>
                      <Edit className="h-4 w-4" />
                      Edit Zone
                    </Link>
                  </Button>
                )}
                {hasPermission('zones.destroy') && (
                  <Button
                    variant="outline"
                    onClick={() => setDeleteDialogOpen(true)}
                    className="gap-2 border-red-200 text-red-600 hover:border-red-300 hover:bg-red-50 dark:border-red-800 dark:text-red-300 dark:hover:bg-red-900/30"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </Button>
                )}
              </div>
            )}
          </div>

          <div className="mt-4 flex flex-wrap gap-4 text-sm text-slate-600 dark:text-slate-400">
            <span className="inline-flex items-center gap-2">
              <Compass className="h-4 w-4" />
              {formatCoordinate(zone.latitude)}, {formatCoordinate(zone.longitude)}
            </span>
            <span className="inline-flex items-center gap-2">
              <Users className="h-4 w-4" />
              {woredas.length} mapped woredas
            </span>
          </div>
        </div>

        <Tabs defaultValue="overview" className="flex flex-1 flex-col overflow-hidden">
          <TabsList className="grid w-full grid-cols-3 gap-2 rounded-xl border border-slate-200 bg-slate-100 p-2 dark:border-slate-700 dark:bg-slate-800">
            <TabsTrigger value="overview" className="flex items-center justify-center gap-2 rounded-lg data-[state=active]:border data-[state=active]:border-slate-200 data-[state=active]:bg-white data-[state=active]:shadow dark:data-[state=active]:border-slate-600 dark:data-[state=active]:bg-slate-700">
              <Layers className="h-4 w-4" /> Overview
            </TabsTrigger>
            <TabsTrigger value="woredas" className="flex items-center justify-center gap-2 rounded-lg data-[state=active]:border data-[state=active]:border-slate-200 data-[state=active]:bg-white data-[state=active]:shadow dark:data-[state=active]:border-slate-600 dark:data-[state=active]:bg-slate-700">
              <Users className="h-4 w-4" /> Woredas
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center justify-center gap-2 rounded-lg data-[state=active]:border data-[state=active]:border-slate-200 data-[state=active]:bg-white data-[state=active]:shadow dark:data-[state=active]:border-slate-600 dark:data-[state=active]:bg-slate-700">
              <BarChart3 className="h-4 w-4" /> History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="flex-1 space-y-6 overflow-y-auto pb-6">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Population</CardTitle>
                  <Users className="h-4 w-4 text-cyan-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-semibold text-cyan-600">{formatNumber(zone.population)}</div>
                  <p className="text-xs text-muted-foreground">Reported residents</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Area</CardTitle>
                  <Globe2 className="h-4 w-4 text-emerald-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-semibold text-emerald-600">{formatNumber(zone.area_km2)} km²</div>
                  <p className="text-xs text-muted-foreground">Land footprint</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Accessibility</CardTitle>
                  <ThermometerSun className="h-4 w-4 text-amber-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-semibold text-amber-600">{formatNumber(zone.accessibility_score)}</div>
                  <p className="text-xs text-muted-foreground">Logistics readiness (0-100)</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Woredas</CardTitle>
                  <Layers className="h-4 w-4 text-indigo-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-semibold text-indigo-600">{activeWoredas}</div>
                  <p className="text-xs text-muted-foreground">Of {woredas.length} mapped woredas</p>
                </CardContent>
              </Card>
            </div>

            <div className="flex flex-col gap-6 lg:flex-row">
              <div className="flex-1 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Layers className="h-5 w-5" />
                      Boundary Map
                    </CardTitle>
                    <CardDescription>Visualize the zone footprint with optional region and woreda overlays</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ZoneBoundaryMap
                      zone={{
                        id: zone.id,
                        name: zone.name,
                        status: zone.status,
                        boundary_geojson: zone.boundary_geojson,
                        latitude: zone.latitude,
                        longitude: zone.longitude,
                      }}
                      parentRegion={zone.region?.boundary_geojson
                        ? {
                            name: zone.region.name,
                            boundary_geojson: zone.region.boundary_geojson,
                          }
                        : undefined}
                      woredas={woredas.map(woreda => ({
                        id: woreda.id,
                        name: woreda.name,
                        status: woreda.status,
                        boundary_geojson: woreda.boundary_geojson,
                      }))}
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Layers className="h-5 w-5" />
                      Zone Overview
                    </CardTitle>
                    <CardDescription>Administrative identifiers and geography</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <p className="text-xs font-semibold uppercase text-muted-foreground">Zone Code</p>
                        <p className="mt-1 text-sm font-semibold text-foreground">{zone.code || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase text-muted-foreground">Administrative Center</p>
                        <p className="mt-1 text-sm font-semibold text-foreground">{zone.administrative_center || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase text-muted-foreground">Region</p>
                        <p className="mt-1 text-sm font-semibold text-foreground">{zone.region?.name || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase text-muted-foreground">Elevation</p>
                        <p className="mt-1 text-sm font-semibold text-foreground">{formatNumber(zone.elevation_m)} m</p>
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <p className="text-xs font-semibold uppercase text-muted-foreground">Coordinates</p>
                        <p className="mt-1 text-sm font-semibold text-foreground">
                          {formatCoordinate(zone.latitude)} / {formatCoordinate(zone.longitude)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase text-muted-foreground">Population Density</p>
                        <p className="mt-1 text-sm font-semibold text-foreground">
                          {zone.area_km2 && Number(zone.area_km2) > 0
                            ? `${formatNumber(Number(zone.population ?? 0) / Number(zone.area_km2), {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })} people / km²`
                            : 'N/A'}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {(zone.infrastructure_notes || zone.climate_profile) && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <ThermometerSun className="h-5 w-5" />
                        Environmental Notes
                      </CardTitle>
                      <CardDescription>Infrastructure readiness and climate outlook</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 text-sm leading-relaxed text-muted-foreground">
                      {zone.infrastructure_notes && (
                        <div>
                          <h3 className="text-xs font-semibold uppercase tracking-wide text-foreground">Infrastructure</h3>
                          <p className="mt-2 whitespace-pre-wrap">{zone.infrastructure_notes}</p>
                        </div>
                      )}
                      {zone.climate_profile && (
                        <div>
                          <h3 className="text-xs font-semibold uppercase tracking-wide text-foreground">Climate Profile</h3>
                          <p className="mt-2 whitespace-pre-wrap">{zone.climate_profile}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>

              <div className="w-full space-y-6 lg:w-80">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold">Snapshot</CardTitle>
                    <CardDescription>Quick reference data</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-3">
                      <Layers className="h-4 w-4" />
                      <div>
                        <p className="text-xs uppercase text-muted-foreground">Zone ID</p>
                        <p className="font-medium text-foreground">{zone.id}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Globe2 className="h-4 w-4" />
                      <div>
                        <p className="text-xs uppercase text-muted-foreground">Region</p>
                        <p className="font-medium text-foreground">{zone.region?.name || 'N/A'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <MapPin className="h-4 w-4" />
                      <div>
                        <p className="text-xs uppercase text-muted-foreground">Coordinates</p>
                        <p className="font-medium text-foreground">
                          {formatCoordinate(zone.latitude)}
                          <br />
                          {formatCoordinate(zone.longitude)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold">Record Info</CardTitle>
                    <CardDescription>System tracking details</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm text-muted-foreground">
                    <div className="flex items-center justify-between">
                      <span>Created</span>
                      <span>{formatDate(zone.created_at)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Last Updated</span>
                      <span>{formatDate(zone.updated_at)}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="woredas" className="flex-1 space-y-6 overflow-y-auto pb-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Users className="h-5 w-5" />
                  Woredas within {zone.name}
                </CardTitle>
                <CardDescription>Sub-regional administrations linked to the zone</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {woredas.length > 0 ? (
                  woredas.map(woreda => (
                    <div key={woreda.id} className="flex items-center justify-between rounded border border-slate-200 p-3 dark:border-slate-700">
                      <div>
                        <p className="font-medium text-foreground">{woreda.name}</p>
                        {woreda.population && (
                          <p className="text-xs text-muted-foreground">Population: {formatNumber(woreda.population)}</p>
                        )}
                      </div>
                      {woreda.status && (
                        <Badge className={`text-xs ${getStatusBadgeStyles(woreda.status)}`}>
                          {woreda.status.charAt(0).toUpperCase() + woreda.status.slice(1)}
                        </Badge>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No woredas have been mapped to this zone yet.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="flex-1 space-y-6 overflow-y-auto pb-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <BarChart3 className="h-5 w-5" />
                  Activity History
                </CardTitle>
                <CardDescription>Auditable timeline of changes</CardDescription>
              </CardHeader>
              <CardContent>
                {activityLogRows.length > 0 ? (
                  <ActivityLogTable logs={activityLogRows} />
                ) : (
                  <p className="text-sm text-muted-foreground">No activity recorded for this zone yet.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <DeleteConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Zone"
        description="Are you sure you want to delete this zone? This action cannot be undone."
        itemName={zone.name}
        onConfirm={handleDelete}
        isLoading={isDeleting}
      />
    </AppLayout>
  )
}
