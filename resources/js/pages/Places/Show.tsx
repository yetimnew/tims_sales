import { useMemo, useState } from 'react'
import { Head, Link, router } from '@inertiajs/react'
import {
  ArrowLeft,
  Edit,
  Trash2,
  MapPin,
  Landmark,
  ScrollText,
  Compass,
  Pin,
  Calendar,
  Navigation,
  Users,
  Mountain,
  ThermometerSun,
  Warehouse,
  ShieldCheck,
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

interface Woreda {
  id: number
  name: string
  zone: {
    id: number
    name: string
    region: {
      id: number
      name: string
    }
  }
}

interface Place {
  id: number
  name: string
  status: 'active' | 'inactive'
  code?: string | null
  woreda_id: number
  woreda: Woreda
  latitude?: number | string | null
  longitude?: number | string | null
  elevation_m?: number | string | null
  population?: number | string | null
  is_logistics_hub?: boolean | null
  accessibility_score?: number | string | null
  description?: string | null
  infrastructure_notes?: string | null
  road_quality_notes?: string | null
  created_at: string
  updated_at: string
}

interface ActivityLog {
  id: number
  description: string
  created_at: string
  event?: 'created' | 'updated' | 'deleted'
  causer?: { id: number; name: string } | null
  properties?: {
    old?: Record<string, unknown>
    attributes?: Record<string, unknown>
  } | null
}

interface PlacesShowProps {
  place: Place
  activityLogs: ActivityLog[]
}

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Places', href: '/places' }]

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

export default function PlacesShow({ place, activityLogs }: PlacesShowProps) {
  const { toast } = useToast()
  const { hasPermission } = usePermissions()
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

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

  const handleDelete = () => setDeleteDialogOpen(true)

  const confirmDelete = () => {
    setIsDeleting(true)
    router.delete(`/places/${place.id}`, {
      onSuccess: () => {
        toast({ title: 'Place deleted', description: `${place.name} was removed successfully.` })
        setDeleteDialogOpen(false)
      },
      onError: () => {
        toast({
          title: 'Deletion failed',
          description: 'Unable to delete the place. Try again later.',
          variant: 'destructive',
        })
      },
      onFinish: () => setIsDeleting(false),
    })
  }

  const coordinatesProvided = place.latitude !== null && place.latitude !== undefined && place.longitude !== null && place.longitude !== undefined
  const coordinateLabel = `${formatCoordinate(place.latitude)} / ${formatCoordinate(place.longitude)}`

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title={`Place: ${place.name}`} />

      <div className="flex h-full flex-1 flex-col gap-6 overflow-hidden rounded-xl p-4">
        <div className="rounded-lg border border-slate-200 bg-gradient-to-r from-slate-50 to-purple-50 p-6 shadow-sm dark:border-slate-700 dark:from-slate-900 dark:to-purple-950/30">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                asChild
                className="flex items-center gap-2 border-slate-300 hover:bg-slate-100 dark:border-slate-600 dark:hover:bg-slate-800"
              >
                <Link href="/places" className="flex items-center gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Back to Places
                </Link>
              </Button>
              <div className="flex items-center gap-4">
                <div className="rounded-xl bg-purple-100 p-3 dark:bg-purple-900/30">
                  <MapPin className="h-6 w-6 text-purple-700 dark:text-purple-300" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{place.name}</h1>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Strategic location overview with operational readiness metrics.
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Badge className={`text-sm font-medium ${getStatusBadgeStyles(place.status)}`}>
                      {place.status.charAt(0).toUpperCase() + place.status.slice(1)}
                    </Badge>
                    {place.is_logistics_hub && (
                      <Badge variant="secondary" className="flex items-center gap-2 bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-200">
                        <Warehouse className="h-3.5 w-3.5" /> Logistics Hub
                      </Badge>
                    )}
                    <Badge variant="outline" className="flex items-center gap-2 text-sm font-medium">
                      <Landmark className="h-3.5 w-3.5" /> ID: {place.id}
                    </Badge>
                    <Badge variant="outline" className="flex items-center gap-2 text-sm font-medium">
                      <Compass className="h-3.5 w-3.5" /> {coordinatesProvided ? coordinateLabel : 'Coordinates unavailable'}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>

            {(hasPermission('places.edit') || hasPermission('places.destroy')) && (
              <div className="flex flex-wrap items-center gap-2">
                {hasPermission('places.edit') && (
                  <Button variant="outline" asChild className="gap-2 hover:border-purple-300 hover:bg-purple-50">
                    <Link href={`/places/${place.id}/edit`}>
                      <Edit className="h-4 w-4" />
                      Edit Place
                    </Link>
                  </Button>
                )}
                {hasPermission('places.destroy') && (
                  <Button
                    variant="outline"
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="gap-2 border-red-200 text-red-600 hover:border-red-300 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-70 dark:border-red-800 dark:text-red-300 dark:hover:bg-red-900/30"
                  >
                    <Trash2 className="h-4 w-4" />
                    {isDeleting ? 'Deleting…' : 'Delete'}
                  </Button>
                )}
              </div>
            )}
          </div>

          <div className="mt-4 flex flex-wrap gap-4 text-sm text-slate-600 dark:text-slate-400">
            <span className="inline-flex items-center gap-2">
              <ScrollText className="h-4 w-4" />
              {place.description || 'No description provided.'}
            </span>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr),20rem] lg:items-start">
          <div className="space-y-6">
            <Card className="shadow-lg border-0 bg-gradient-to-br from-background to-muted/20">
              <CardHeader className="border-b bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-950/20 dark:to-indigo-950/20">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <ShieldCheck className="h-5 w-5 text-purple-600 dark:text-purple-300" />
                  Location KPIs
                </CardTitle>
                <CardDescription>Operational health indicators</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900/60">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Population</p>
                      <p className="mt-2 text-2xl font-semibold text-purple-600">{formatNumber(place.population)}</p>
                    </div>
                    <Users className="h-5 w-5 text-purple-500" />
                  </div>
                  <p className="mt-3 text-xs text-muted-foreground">Estimated residents</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900/60">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Elevation</p>
                      <p className="mt-2 text-2xl font-semibold text-indigo-600">{formatNumber(place.elevation_m)} m</p>
                    </div>
                    <Mountain className="h-5 w-5 text-indigo-500" />
                  </div>
                  <p className="mt-3 text-xs text-muted-foreground">Above sea level</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900/60">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Accessibility</p>
                      <p className="mt-2 text-2xl font-semibold text-amber-600">{formatNumber(place.accessibility_score)}</p>
                    </div>
                    <ThermometerSun className="h-5 w-5 text-amber-500" />
                  </div>
                  <p className="mt-3 text-xs text-muted-foreground">Mobility index (0-100)</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900/60">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Logistics Focus</p>
                      <p className="mt-2 text-lg font-semibold text-foreground">
                        {place.is_logistics_hub ? 'Primary distribution hub' : 'Standard waypoint'}
                      </p>
                    </div>
                    <Warehouse className="h-5 w-5 text-purple-500" />
                  </div>
                  <p className="mt-3 text-xs text-muted-foreground">Role in network</p>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg border-0">
              <CardHeader className="border-b bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-950/20 dark:to-indigo-950/20">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <MapPin className="h-5 w-5 text-purple-600" />
                  Administrative Context
                </CardTitle>
                <CardDescription>Linked hierarchy for this place</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-xs font-semibold uppercase text-muted-foreground">Place Code</p>
                  <p className="mt-2 text-base font-semibold text-foreground">{place.code || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase text-muted-foreground">Status</p>
                  <p className="mt-2 inline-flex items-center gap-2 text-base font-semibold text-foreground">
                    <span className={`rounded-full px-3 py-1 text-xs font-medium ${getStatusBadgeStyles(place.status)}`}>
                      {place.status.charAt(0).toUpperCase() + place.status.slice(1)}
                    </span>
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase text-muted-foreground">Woreda</p>
                  <Link href={`/woredas/${place.woreda.id}`} className="mt-2 inline-flex items-center gap-1 text-base font-semibold text-purple-600 hover:underline dark:text-purple-300">
                    <Navigation className="h-4 w-4" />
                    {place.woreda.name}
                  </Link>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase text-muted-foreground">Zone</p>
                  <Link href={`/zones/${place.woreda.zone.id}`} className="mt-2 inline-flex items-center gap-1 text-base font-semibold text-purple-600 hover:underline dark:text-purple-300">
                    <Pin className="h-4 w-4" />
                    {place.woreda.zone.name}
                  </Link>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase text-muted-foreground">Region</p>
                  <Link href={`/regions/${place.woreda.zone.region.id}`} className="mt-2 inline-flex items-center gap-1 text-base font-semibold text-purple-600 hover:underline dark:text-purple-300">
                    <Landmark className="h-4 w-4" />
                    {place.woreda.zone.region.name}
                  </Link>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase text-muted-foreground">Coordinates</p>
                  <p className="mt-2 text-base font-semibold text-foreground">{coordinatesProvided ? coordinateLabel : 'Not captured'}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg border-0">
              <CardHeader className="border-b bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-900/40 dark:to-slate-900/10">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <ScrollText className="h-5 w-5" />
                  Operational Notes
                </CardTitle>
                <CardDescription>Site context and logistics considerations</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-sm text-muted-foreground">
                <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900/60">
                  <p className="text-xs font-semibold uppercase text-muted-foreground">Description</p>
                  <p className="mt-2 text-sm text-foreground">
                    {place.description || 'No description provided.'}
                  </p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900/60">
                  <p className="text-xs font-semibold uppercase text-muted-foreground">Infrastructure Notes</p>
                  <p className="mt-2 text-sm text-foreground">
                    {place.infrastructure_notes || 'No infrastructure notes recorded for this place.'}
                  </p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900/60">
                  <p className="text-xs font-semibold uppercase text-muted-foreground">Road Quality Notes</p>
                  <p className="mt-2 text-sm text-foreground">
                    {place.road_quality_notes || 'No road quality notes documented yet.'}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg border-0">
              <CardHeader className="border-b bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-900/40 dark:to-slate-900/10">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <ScrollText className="h-5 w-5" />
                  Activity History
                </CardTitle>
                <CardDescription>Auditable timeline of changes</CardDescription>
              </CardHeader>
              <CardContent>
                {activityLogRows.length > 0 ? (
                  <ActivityLogTable logs={activityLogRows} />
                ) : (
                  <p className="text-sm text-muted-foreground">No activity recorded for this place yet.</p>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="shadow-lg border-0">
              <CardHeader className="border-b bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-950/20 dark:to-indigo-950/20">
                <CardTitle className="text-lg font-semibold">Snapshot</CardTitle>
                <CardDescription>Quick reference values</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-sm text-muted-foreground">
                <div className="flex items-center justify-between">
                  <span>Place ID</span>
                  <Badge variant="secondary" className="px-2 py-1">{place.id}</Badge>
                </div>
                <div>
                  <p className="text-xs uppercase text-muted-foreground">Coordinates</p>
                  <p className="mt-1 font-medium text-foreground">{coordinatesProvided ? coordinateLabel : 'Not captured'}</p>
                </div>
                <div>
                  <p className="text-xs uppercase text-muted-foreground">Created</p>
                  <p className="mt-1 font-medium text-foreground">{formatDate(place.created_at)}</p>
                </div>
                <div>
                  <p className="text-xs uppercase text-muted-foreground">Last Updated</p>
                  <p className="mt-1 font-medium text-foreground">{formatDate(place.updated_at)}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <DeleteConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Place"
        description={`Are you sure you want to delete ${place.name}? This action cannot be undone.`}
        itemName={place.name}
        onConfirm={confirmDelete}
      />
    </AppLayout>
  )
}
