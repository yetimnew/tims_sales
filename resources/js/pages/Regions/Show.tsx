import { useMemo, useState } from 'react'
import { Head, Link, router } from '@inertiajs/react'
import {
  ArrowLeft,
  Edit,
  Trash2,
  MapPin,
  Compass,
  Building2,
  Globe,
  Layers,
  BarChart3,
  Calendar,
  ThermometerSun,
  Waves,
  Users,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { DeleteConfirmationDialog } from '@/components/delete-confirmation-dialog'
import { ActivityLogTable } from '@/components/activity-log-table'
import { useToast } from '@/hooks/use-toast'
import { usePermissions } from '@/hooks/use-permissions'
import AppLayout from '@/layouts/app-layout'
import type { BreadcrumbItem } from '@/types'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface ZoneSummary {
  id: number
  name: string
  status?: 'active' | 'inactive'
}

interface Region {
  id: number
  name: string
  code?: string | null
  status: 'active' | 'inactive'
  description?: string | null
  capital?: string | null
  area_km2?: number | string | null
  population?: number | string | null
  latitude?: number | string | null
  longitude?: number | string | null
  elevation_m?: number | string | null
  accessibility_score?: number | string | null
  last_surveyed_at?: string | null
  infrastructure_notes?: string | null
  climate_profile?: string | null
  created_at: string
  updated_at: string
  zones?: ZoneSummary[]
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

interface RegionShowProps {
  region: Region
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

const formatCoordinate = (value?: number | string | null) => {
  if (value === null || value === undefined || value === '') return 'N/A'
  const numeric = Number(value)
  if (Number.isNaN(numeric)) return 'N/A'
  return `${numeric.toFixed(5)}°`
}

export default function RegionsShow({ region, activityLogs = [] }: RegionShowProps) {
  const { toast } = useToast()
  const { hasPermission } = usePermissions()
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const breadcrumbs = useMemo<BreadcrumbItem[]>(
    () => [
      { title: 'Regions', href: '/regions' },
      { title: region.name || `Region ${region.id}`, href: `/regions/${region.id}` },
    ],
    [region.id, region.name],
  )

  const zones = region.zones ?? []
  const activeZones = zones.filter(zone => zone.status === 'active').length
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
    router.delete(`/regions/${region.id}`, {
      preserveScroll: true,
      onSuccess: () => {
        toast({ title: '✅ Region Deleted', description: `${region.name} was removed successfully.` })
        setDeleteDialogOpen(false)
        setIsDeleting(false)
      },
      onError: (errors) => {
        const errorMessage = errors && typeof errors === 'object' && 'message' in errors
          ? String(errors.message)
          : 'Unable to delete the region. Try again later.'
        toast({
          title: '❌ Delete Failed',
          description: errorMessage,
          variant: 'destructive'
        })
        setIsDeleting(false)
      },
    })
  }

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title={`Region: ${region.name}`} />

      <div className="flex h-full flex-1 flex-col gap-6 overflow-hidden rounded-xl p-4">
        <div className="rounded-lg border border-slate-200 bg-gradient-to-r from-slate-50 to-blue-50 p-6 shadow-sm dark:border-slate-700 dark:from-slate-900 dark:to-blue-950/30">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.get('/regions')}
                className="flex items-center gap-2 border-slate-300 hover:bg-slate-100 dark:border-slate-600 dark:hover:bg-slate-800"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Regions
              </Button>
              <div className="flex items-center gap-4">
                <div className="rounded-xl bg-blue-100 p-3 dark:bg-blue-900/30">
                  <Globe className="h-6 w-6 text-blue-700 dark:text-blue-300" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{region.name}</h1>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {region.description || 'Administrative profile and regional performance.'}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Badge className={`text-sm font-medium ${getStatusBadgeStyles(region.status)}`}>
                      {region.status.charAt(0).toUpperCase() + region.status.slice(1)}
                    </Badge>
                    <Badge variant="outline" className="flex items-center gap-2 text-sm font-medium">
                      <Layers className="h-3.5 w-3.5" />
                      {zones.length} zones
                    </Badge>
                    {region.capital && (
                      <Badge variant="outline" className="flex items-center gap-2 text-sm font-medium">
                        <Building2 className="h-3.5 w-3.5" />
                        Capital: {region.capital}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {(hasPermission('regions.edit') || hasPermission('regions.destroy')) && (
              <div className="flex items-center gap-2">
                {hasPermission('regions.edit') && (
                  <Button variant="outline" asChild className="gap-2 hover:border-blue-300 hover:bg-blue-50">
                    <Link href={`/regions/${region.id}/edit`}>
                      <Edit className="h-4 w-4" />
                      Edit Region
                    </Link>
                  </Button>
                )}
                {hasPermission('regions.destroy') && (
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
              {formatCoordinate(region.latitude)}, {formatCoordinate(region.longitude)}
            </span>
            <span className="inline-flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Last surveyed: {formatDate(region.last_surveyed_at)}
            </span>
          </div>
        </div>

        <Tabs defaultValue="overview" className="flex flex-1 flex-col overflow-hidden">
          <TabsList className="grid w-full grid-cols-3 rounded-xl border border-slate-200 bg-slate-100 p-1 dark:border-slate-700 dark:bg-slate-800">
            <TabsTrigger value="overview" className="flex items-center justify-center gap-2 rounded-lg px-3 py-2 font-medium transition-all duration-200 data-[state=active]:border data-[state=active]:border-slate-200 data-[state=active]:bg-white data-[state=active]:shadow-md dark:data-[state=active]:border-slate-600 dark:data-[state=active]:bg-slate-700">
              <Globe className="h-4 w-4" /> Overview
            </TabsTrigger>
            <TabsTrigger value="zones" className="flex items-center justify-center gap-2 rounded-lg px-3 py-2 font-medium transition-all duration-200 data-[state=active]:border data-[state=active]:border-slate-200 data-[state=active]:bg-white data-[state=active]:shadow-md dark:data-[state=active]:border-slate-600 dark:data-[state=active]:bg-slate-700">
              <Layers className="h-4 w-4" /> Zones
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center justify-center gap-2 rounded-lg px-3 py-2 font-medium transition-all duration-200 data-[state=active]:border data-[state=active]:border-slate-200 data-[state=active]:bg-white data-[state=active]:shadow-md dark:data-[state=active]:border-slate-600 dark:data-[state=active]:bg-slate-700">
              <BarChart3 className="h-4 w-4" /> History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="flex-1 space-y-6 overflow-y-auto">
            <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[minmax(0,1fr),20rem] lg:items-start">
              <div className="space-y-6">
                <Card className="shadow-lg border-0 bg-gradient-to-br from-background to-muted/20">
                  <CardHeader className="border-b bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <BarChart3 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      Regional KPIs
                    </CardTitle>
                    <CardDescription>Latest administrative health indicators</CardDescription>
                  </CardHeader>
                  <CardContent className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900/60">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Population</p>
                          <p className="mt-2 text-2xl font-semibold text-blue-600">{formatNumber(region.population)}</p>
                        </div>
                        <Users className="h-5 w-5 text-blue-500" />
                      </div>
                      <p className="mt-3 text-xs text-muted-foreground">Reported residents</p>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900/60">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Area</p>
                          <p className="mt-2 text-2xl font-semibold text-emerald-600">{formatNumber(region.area_km2)} km²</p>
                        </div>
                        <Globe className="h-5 w-5 text-emerald-500" />
                      </div>
                      <p className="mt-3 text-xs text-muted-foreground">Land coverage footprint</p>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900/60">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Accessibility</p>
                          <p className="mt-2 text-2xl font-semibold text-amber-600">{formatNumber(region.accessibility_score)}</p>
                        </div>
                        <ThermometerSun className="h-5 w-5 text-amber-500" />
                      </div>
                      <p className="mt-3 text-xs text-muted-foreground">Mobility index (0-100)</p>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900/60">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Active Zones</p>
                          <p className="mt-2 text-2xl font-semibold text-indigo-600">{activeZones}</p>
                        </div>
                        <Layers className="h-5 w-5 text-indigo-500" />
                      </div>
                      <p className="mt-3 text-xs text-muted-foreground">Of {zones.length} mapped zones</p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-lg border-0">
                  <CardHeader className="border-b bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-900/40 dark:to-slate-900/10">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Globe className="h-5 w-5" />
                      Region Overview
                    </CardTitle>
                    <CardDescription>Core identifiers and administrative context</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900/60">
                        <p className="text-xs font-semibold uppercase text-muted-foreground">Region Code</p>
                        <p className="mt-2 text-sm font-semibold text-foreground">{region.code || 'N/A'}</p>
                      </div>
                      <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900/60">
                        <p className="text-xs font-semibold uppercase text-muted-foreground">Capital City</p>
                        <p className="mt-2 text-sm font-semibold text-foreground">{region.capital || 'N/A'}</p>
                      </div>
                      <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900/60">
                        <p className="text-xs font-semibold uppercase text-muted-foreground">Coordinates</p>
                        <p className="mt-2 text-sm font-semibold text-foreground">
                          {formatCoordinate(region.latitude)} / {formatCoordinate(region.longitude)}
                        </p>
                      </div>
                      <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900/60">
                        <p className="text-xs font-semibold uppercase text-muted-foreground">Elevation</p>
                        <p className="mt-2 text-sm font-semibold text-foreground">{formatNumber(region.elevation_m)} m</p>
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900/60">
                        <p className="text-xs font-semibold uppercase text-muted-foreground">Last Surveyed</p>
                        <p className="mt-2 text-sm font-semibold text-foreground">{formatDate(region.last_surveyed_at)}</p>
                      </div>
                      <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900/60">
                        <p className="text-xs font-semibold uppercase text-muted-foreground">Population Density</p>
                        <p className="mt-2 text-sm font-semibold text-foreground">
                          {region.area_km2 && Number(region.area_km2) > 0
                            ? `${formatNumber(Number(region.population ?? 0) / Number(region.area_km2), {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })} people / km²`
                            : 'N/A'}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {(region.infrastructure_notes || region.climate_profile) && (
                  <Card className="shadow-lg border-0">
                    <CardHeader className="border-b bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20">
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <ThermometerSun className="h-5 w-5 text-amber-600" />
                        Environmental Notes
                      </CardTitle>
                      <CardDescription>Infrastructure readiness and climate outlook</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 text-sm leading-relaxed text-muted-foreground">
                      {region.infrastructure_notes && (
                        <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900/60">
                          <h3 className="text-xs font-semibold uppercase tracking-wide text-foreground">Infrastructure</h3>
                          <p className="mt-2 whitespace-pre-wrap">{region.infrastructure_notes}</p>
                        </div>
                      )}
                      {region.climate_profile && (
                        <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900/60">
                          <h3 className="text-xs font-semibold uppercase tracking-wide text-foreground">Climate Profile</h3>
                          <p className="mt-2 whitespace-pre-wrap">{region.climate_profile}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>

              <div className="space-y-4 lg:w-[20rem] lg:space-y-4">
                <Card className="shadow-lg border-0 bg-gradient-to-br from-background to-muted/20">
                  <CardHeader className="border-b bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Layers className="h-5 w-5 text-emerald-600" />
                      Quick Actions
                    </CardTitle>
                    <CardDescription>Shortcuts for regional administration</CardDescription>
                  </CardHeader>
                  <CardContent className="grid gap-2">
                    <Button asChild variant="outline" className="h-auto justify-start gap-3 border-slate-300 py-3 text-sm hover:border-blue-300 hover:bg-blue-50 dark:border-slate-600 dark:hover:border-blue-500 dark:hover:bg-blue-900/30">
                      <Link href={`/regions/${region.id}/edit`}>
                        <Edit className="h-4 w-4" />
                        Edit Region Details
                      </Link>
                    </Button>
                    <Button asChild variant="outline" className="h-auto justify-start gap-3 border-slate-300 py-3 text-sm hover:border-emerald-300 hover:bg-emerald-50 dark:border-slate-600 dark:hover:border-emerald-500 dark:hover:bg-emerald-900/30">
                      <Link href="/zones">
                        <Layers className="h-4 w-4" />
                        Manage Zones
                      </Link>
                    </Button>
                    <Button asChild variant="outline" className="h-auto justify-start gap-3 border-slate-300 py-3 text-sm hover:border-indigo-300 hover:bg-indigo-50 dark:border-slate-600 dark:hover:border-indigo-500 dark:hover:bg-indigo-900/30">
                      <Link href="/zones/create">
                        <MapPin className="h-4 w-4" />
                        Add New Zone
                      </Link>
                    </Button>
                  </CardContent>
                </Card>

                <Card className="shadow-lg border-0 bg-gradient-to-br from-background to-muted/20">
                  <CardHeader className="border-b bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-900/40 dark:to-slate-900/10">
                    <CardTitle className="text-lg font-semibold">Snapshot</CardTitle>
                    <CardDescription>Quick reference data</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-3">
                      <Globe className="h-4 w-4" />
                      <div>
                        <p className="text-xs uppercase text-muted-foreground">Region ID</p>
                        <p className="font-medium text-foreground">{region.id}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <MapPin className="h-4 w-4" />
                      <div>
                        <p className="text-xs uppercase text-muted-foreground">Coordinates</p>
                        <p className="font-medium text-foreground">
                          {formatCoordinate(region.latitude)}
                          <br />
                          {formatCoordinate(region.longitude)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Waves className="h-4 w-4" />
                      <div>
                        <p className="text-xs uppercase text-muted-foreground">Elevation</p>
                        <p className="font-medium text-foreground">{formatNumber(region.elevation_m)} m</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-lg border-0 bg-gradient-to-br from-background to-muted/20">
                  <CardHeader className="border-b bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-900/40 dark:to-slate-900/10">
                    <CardTitle className="text-lg font-semibold">Record Info</CardTitle>
                    <CardDescription>System tracking details</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm text-muted-foreground">
                    <div className="flex items-center justify-between">
                      <span>Created</span>
                      <span>{formatDate(region.created_at)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Last Updated</span>
                      <span>{formatDate(region.updated_at)}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="zones" className="flex-1 space-y-6 overflow-y-auto">
            <Card className="shadow-lg border-0">
              <CardHeader className="border-b bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-900/40 dark:to-slate-900/10">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Layers className="h-5 w-5" />
                  Zones within {region.name}
                </CardTitle>
                <CardDescription>Administrative clusters and their statuses</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {zones.length > 0 ? (
                  zones.map(zone => (
                    <div key={zone.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900/60">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-foreground">{zone.name}</p>
                          {zone.status && (
                            <Badge className={`mt-2 text-xs ${getStatusBadgeStyles(zone.status)}`}>
                              {zone.status.charAt(0).toUpperCase() + zone.status.slice(1)}
                            </Badge>
                          )}
                        </div>
                        <Button asChild size="sm" variant="outline" className="border-slate-300 hover:border-blue-300 hover:bg-blue-50 dark:border-slate-600 dark:hover:border-blue-500 dark:hover:bg-blue-900/30">
                          <Link href={`/zones/${zone.id}`}>Open</Link>
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No zones have been mapped to this region yet.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="flex-1 space-y-6 overflow-y-auto">
            <Card className="shadow-lg border-0">
              <CardHeader className="border-b bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-900/40 dark:to-slate-900/10">
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
                  <p className="text-sm text-muted-foreground">No activity recorded for this region yet.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <DeleteConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Region"
        description="Are you sure you want to delete this region? This action cannot be undone."
        itemName={region.name}
        onConfirm={handleDelete}
        isLoading={isDeleting}
      />
    </AppLayout>
  )
}
