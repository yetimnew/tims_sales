import { useMemo, useState } from 'react'
import { Head, Link, router } from '@inertiajs/react'
import {
  ArrowLeft,
  Edit,
  Trash2,
  MapPinned,
  Building2,
  Users,
  Navigation,
  Mountain,
  Ruler,
  ThermometerSun,
  HardHat,
  BarChart3,
  Calendar,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { DeleteConfirmationDialog } from '@/components/delete-confirmation-dialog'
import { ActivityLogTable } from '@/components/activity-log-table'
import { useToast } from '@/hooks/use-toast'
import AppLayout from '@/layouts/app-layout'
import type { BreadcrumbItem } from '@/types'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface ZoneSummary {
  id: number
  name: string
  status?: 'active' | 'inactive'
}

interface PlaceSummary {
  id: number
  name: string
  status?: 'active' | 'inactive'
  is_logistics_hub?: boolean
}

interface Woreda {
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
  road_quality_notes?: string | null
  created_at: string
  updated_at: string
  zone?: ZoneSummary | null
  places?: PlaceSummary[]
}

interface ActivityLogEntry {
  id: number
  description: string
  created_at: string
  event?: string | null
  causer?: { id: number; name: string } | null
  properties?: {
    old?: Record<string, unknown>
    attributes?: Record<string, unknown>
  } | null
}

interface WoredasShowProps {
  woreda: Woreda
  activityLogs?: ActivityLogEntry[]
}

const statusBadgeClass = (status: string) =>
  status === 'active'
    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200'
    : 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-200'

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

const resolveActivityAction = (event?: string | null): 'created' | 'updated' | 'deleted' => {
  if (event === 'created' || event === 'updated' || event === 'deleted') {
    return event
  }
  return 'updated'
}

export default function WoredasShow({ woreda, activityLogs = [] }: WoredasShowProps) {
  const { toast } = useToast()
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const breadcrumbs = useMemo<BreadcrumbItem[]>(
    () => [
      { title: 'Woredas', href: '/woredas' },
      { title: woreda.name || `Woreda ${woreda.id}`, href: `/woredas/${woreda.id}` },
    ],
    [woreda.id, woreda.name],
  )

  const places = woreda.places ?? []
  const activityLogRows = useMemo(
    () =>
      activityLogs.map(log => ({
        id: log.id,
        action: resolveActivityAction(log.event),
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
    router.delete(`/woredas/${woreda.id}`, {
      preserveScroll: true,
      onSuccess: () => {
        toast({ title: '✅ Woreda Deleted', description: `${woreda.name} was removed successfully.` })
        setDeleteDialogOpen(false)
        setIsDeleting(false)
      },
      onError: (errors) => {
        const errorMessage = errors && typeof errors === 'object' && 'message' in errors
          ? String(errors.message)
          : 'Unable to delete this woreda right now. Try again later.'
        toast({
          title: '❌ Delete Failed',
          description: errorMessage,
          variant: 'destructive',
        })
        setIsDeleting(false)
      },
    })
  }

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title={`Woreda • ${woreda.name}`} />
      <div className="flex h-full flex-1 flex-col gap-6 overflow-hidden rounded-xl p-4">
        <div className="rounded-lg border border-slate-200 bg-gradient-to-r from-slate-50 to-emerald-50 p-6 shadow-sm dark:border-slate-700 dark:from-slate-900 dark:to-emerald-950/30">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.get('/woredas')}
                className="flex items-center gap-2 border-slate-300 hover:bg-slate-100 dark:border-slate-600 dark:hover:bg-slate-800"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Woredas
              </Button>
              <div className="flex items-center gap-4">
                <div className="rounded-xl bg-emerald-100 p-3 dark:bg-emerald-900/30">
                  <MapPinned className="h-6 w-6 text-emerald-700 dark:text-emerald-300" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{woreda.name}</h1>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {woreda.description || 'Woreda profile, infrastructure readiness, and logistics data.'}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Badge className={`text-sm font-medium ${statusBadgeClass(woreda.status)}`}>
                      {woreda.status.charAt(0).toUpperCase() + woreda.status.slice(1)}
                    </Badge>
                    {woreda.zone && (
                      <Badge variant="outline" className="flex items-center gap-2 text-sm font-medium">
                        <Navigation className="h-3.5 w-3.5" /> Zone: {woreda.zone.name}
                      </Badge>
                    )}
                    {woreda.administrative_center && (
                      <Badge variant="outline" className="flex items-center gap-2 text-sm font-medium">
                        <Building2 className="h-3.5 w-3.5" /> Admin Center: {woreda.administrative_center}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" asChild className="gap-2 hover:border-emerald-300 hover:bg-emerald-50">
                <Link href={`/woredas/${woreda.id}/edit`}>
                  <Edit className="h-4 w-4" />
                  Edit Woreda
                </Link>
              </Button>
              <Button
                variant="outline"
                onClick={() => setDeleteDialogOpen(true)}
                disabled={isDeleting}
                className="gap-2 border-red-200 text-red-600 hover:border-red-300 hover:bg-red-50 dark:border-red-800 dark:text-red-300 dark:hover:bg-red-900/30"
              >
                <Trash2 className="h-4 w-4" />
                {isDeleting ? 'Deleting…' : 'Delete'}
              </Button>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-4 text-sm text-slate-600 dark:text-slate-400">
            <span className="inline-flex items-center gap-2">
              <Navigation className="h-4 w-4" />
              {formatCoordinate(woreda.latitude)}, {formatCoordinate(woreda.longitude)}
            </span>
            <span className="inline-flex items-center gap-2">
              <Users className="h-4 w-4" />
              {places.length} mapped places
            </span>
          </div>
        </div>

        <Tabs defaultValue="overview" className="flex flex-1 flex-col overflow-hidden">
          <TabsList className="grid w-full grid-cols-3 gap-2 rounded-xl border border-slate-200 bg-slate-100 p-2 dark:border-slate-700 dark:bg-slate-800">
            <TabsTrigger value="overview" className="flex items-center justify-center gap-2 rounded-lg data-[state=active]:border data-[state=active]:border-slate-200 data-[state=active]:bg-white data-[state=active]:shadow dark:data-[state=active]:border-slate-600 dark:data-[state=active]:bg-slate-700">
              <MapPinned className="h-4 w-4" /> Overview
            </TabsTrigger>
            <TabsTrigger value="places" className="flex items-center justify-center gap-2 rounded-lg data-[state=active]:border data-[state=active]:border-slate-200 data-[state=active]:bg-white data-[state=active]:shadow dark:data-[state=active]:border-slate-600 dark:data-[state=active]:bg-slate-700">
              <Users className="h-4 w-4" /> Places
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
                  <Users className="h-4 w-4 text-emerald-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-semibold text-emerald-600">{formatNumber(woreda.population)}</div>
                  <p className="text-xs text-muted-foreground">Residents within the woreda</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Area</CardTitle>
                  <Ruler className="h-4 w-4 text-emerald-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-semibold text-emerald-600">{formatNumber(woreda.area_km2)} km²</div>
                  <p className="text-xs text-muted-foreground">Land coverage footprint</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Accessibility</CardTitle>
                  <ThermometerSun className="h-4 w-4 text-amber-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-semibold text-amber-600">{formatNumber(woreda.accessibility_score)}</div>
                  <p className="text-xs text-muted-foreground">Mobility index (0-100)</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Elevation</CardTitle>
                  <Mountain className="h-4 w-4 text-indigo-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-semibold text-indigo-600">{formatNumber(woreda.elevation_m)} m</div>
                  <p className="text-xs text-muted-foreground">Above sea level</p>
                </CardContent>
              </Card>
            </div>

            <div className="flex flex-col gap-6 lg:flex-row">
              <div className="flex-1 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <MapPinned className="h-5 w-5" />
                      Geographic Profile
                    </CardTitle>
                    <CardDescription>Administrative context and spatial characteristics</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <dl className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div>
                        <dt className="text-sm font-medium text-muted-foreground">Woreda Code</dt>
                        <dd className="text-base font-semibold text-foreground">{woreda.code ?? 'N/A'}</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-muted-foreground">Zone</dt>
                        <dd className="text-base font-semibold text-emerald-600 dark:text-emerald-300">
                          {woreda.zone ? (
                            <Link href={`/zones/${woreda.zone.id}`} className="hover:underline">
                              {woreda.zone.name}
                            </Link>
                          ) : (
                            'N/A'
                          )}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-muted-foreground">Administrative Center</dt>
                        <dd className="text-base text-foreground">{woreda.administrative_center ?? 'N/A'}</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-muted-foreground">Places Mapped</dt>
                        <dd className="text-base text-foreground">{places.length}</dd>
                      </div>
                    </dl>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <HardHat className="h-5 w-5" />
                      Infrastructure & Logistics
                    </CardTitle>
                    <CardDescription>Operational readiness and site conditions</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900/60">
                      <p className="text-sm font-medium text-muted-foreground">Infrastructure Notes</p>
                      <p className="mt-2 text-sm text-foreground">
                        {woreda.infrastructure_notes ?? 'No infrastructure notes have been recorded for this woreda.'}
                      </p>
                    </div>
                    <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900/60">
                      <p className="text-sm font-medium text-muted-foreground">Road Quality Notes</p>
                      <p className="mt-2 text-sm text-foreground">
                        {woreda.road_quality_notes ?? 'Road quality notes not documented yet.'}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="w-full space-y-6 lg:w-80">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold">Snapshot</CardTitle>
                    <CardDescription>Quick reference data</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-3">
                      <MapPinned className="h-4 w-4" />
                      <div>
                        <p className="text-xs uppercase text-muted-foreground">Woreda ID</p>
                        <p className="font-medium text-foreground">{woreda.id}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Navigation className="h-4 w-4" />
                      <div>
                        <p className="text-xs uppercase text-muted-foreground">Coordinates</p>
                        <p className="font-medium text-foreground">
                          {formatCoordinate(woreda.latitude)}
                          <br />
                          {formatCoordinate(woreda.longitude)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Calendar className="h-4 w-4" />
                      <div>
                        <p className="text-xs uppercase text-muted-foreground">Created</p>
                        <p className="font-medium text-foreground">{formatDate(woreda.created_at)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Calendar className="h-4 w-4" />
                      <div>
                        <p className="text-xs uppercase text-muted-foreground">Last Updated</p>
                        <p className="font-medium text-foreground">{formatDate(woreda.updated_at)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="places" className="flex-1 space-y-6 overflow-y-auto pb-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Users className="h-5 w-5" />
                  Places within {woreda.name}
                </CardTitle>
                <CardDescription>Connected logistics nodes in this woreda</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {places.length > 0 ? (
                  places.map(place => (
                    <div key={place.id} className="flex flex-col gap-2 rounded border border-slate-200 p-3 dark:border-slate-700">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-foreground">{place.name}</p>
                          <p className="text-xs text-muted-foreground">{place.status ?? 'Status unknown'}</p>
                        </div>
                        <Button asChild size="sm" variant="outline" className="gap-1 border-emerald-200 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-200">
                          <Link href={`/places/${place.id}`}>View</Link>
                        </Button>
                      </div>
                      {place.is_logistics_hub && (
                        <Badge className="w-fit border border-amber-300 bg-amber-100/80 text-amber-700 dark:border-amber-900/40 dark:bg-amber-900/30 dark:text-amber-200">
                          Priority logistics hub
                        </Badge>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No places mapped to this woreda yet.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="flex-1 space-y-6 overflow-y-auto pb-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <BarChart3 className="h-5 w-5" />
                  Activity Timeline
                </CardTitle>
                <CardDescription>Recent lifecycle events and audit history</CardDescription>
              </CardHeader>
              <CardContent>
                {activityLogRows.length > 0 ? (
                  <ActivityLogTable logs={activityLogRows} />
                ) : (
                  <p className="text-sm text-muted-foreground">No activity recorded for this woreda yet.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <DeleteConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDelete}
        isLoading={isDeleting}
        itemName={woreda.name}
        title="Delete Woreda"
        description="Are you sure you want to delete this woreda? This action cannot be undone."
      />
    </AppLayout>
  )
}

