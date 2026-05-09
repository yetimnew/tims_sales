import React from 'react'
import AppLayout from '@/layouts/app-layout'
import { Head, Link, router } from '@inertiajs/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DatePicker } from '@/components/ui/date-picker'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { ArrowLeft, Clock3, Filter, Map, MapPin, MessageSquare, UserRound } from 'lucide-react'

type DriverOption = {
  id: number
  name: string
  driverid: string
}

type HistoryItem = {
  id: number
  driver?: {
    id: number
    name: string
    driverid: string
  } | null
  status_type: string
  status_value: string
  notes?: string | null
  created_at?: string | null
  updated_at?: string | null
  location?: {
    latitude: number
    longitude: number
    accuracy?: number | null
    speed?: number | null
    heading?: number | null
    timestamp?: string | null
  } | null
}

type Paginated<T> = {
  data: T[]
  links?: { url: string | null; label: string; active: boolean }[]
}

type Filters = {
  driver_id?: string
  status_type?: string
  from?: string
  to?: string
}

const formatDateTime = (value?: string | null): string => {
  if (!value) return 'N/A'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'N/A'

  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const formatCoordinate = (value?: number | null): string => {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return 'N/A'
  return value.toFixed(6)
}

const getStatusTypeBadgeClass = (statusType: string): string => {
  switch (statusType) {
    case 'work':
      return 'bg-blue-100 text-blue-700 border-blue-200'
    case 'truck':
      return 'bg-orange-100 text-orange-700 border-orange-200'
    case 'trip':
      return 'bg-purple-100 text-purple-700 border-purple-200'
    default:
      return 'bg-slate-100 text-slate-700 border-slate-200'
  }
}

const getStatusTypeLabel = (statusType: string): string => {
  switch (statusType) {
    case 'work':
      return 'Work'
    case 'truck':
      return 'Truck'
    case 'trip':
      return 'Trip'
    default:
      return statusType
  }
}

export default function DriverStatusHistory({
  history,
  drivers,
  filters,
}: {
  history: Paginated<HistoryItem>
  drivers: DriverOption[]
  filters: Filters
}) {
  const [openMapId, setOpenMapId] = React.useState<number | null>(null)

  const applyFilters = (next: Partial<Filters>) => {
    const params: Record<string, string> = {}
    const merged = { ...filters, ...next }

    if (merged.driver_id) params.driver_id = merged.driver_id
    if (merged.status_type) params.status_type = merged.status_type
    if (merged.from) params.from = merged.from
    if (merged.to) params.to = merged.to

    router.get('/driver-status-history', params, {
      preserveScroll: true,
      preserveState: true,
    })
  }

  const toggleMap = (itemId: number) => {
    setOpenMapId((current) => (current === itemId ? null : itemId))
  }

  return (
    <>
      <Head title="Driver Status History" />

      <div className="flex h-full flex-1 flex-col gap-6 p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <Button variant="outline" size="icon" asChild>
              <Link href="/statustypes">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">Driver Status History</h1>
              <p className="text-sm text-muted-foreground">
                Review driver-entered status updates, comments, and captured locations.
              </p>
            </div>
          </div>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Filter className="h-4 w-4" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-4">
              <Select value={filters.driver_id ?? 'all'} onValueChange={(value) => applyFilters({ driver_id: value === 'all' ? '' : value })}>
                <SelectTrigger>
                  <SelectValue placeholder="All drivers" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All drivers</SelectItem>
                  {drivers.map((driver) => (
                    <SelectItem key={driver.id} value={String(driver.id)}>
                      {driver.name} ({driver.driverid})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filters.status_type ?? 'all'} onValueChange={(value) => applyFilters({ status_type: value === 'all' ? '' : value })}>
                <SelectTrigger>
                  <SelectValue placeholder="All status types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All status types</SelectItem>
                  <SelectItem value="work">Work</SelectItem>
                  <SelectItem value="truck">Truck</SelectItem>
                  <SelectItem value="trip">Trip</SelectItem>
                </SelectContent>
              </Select>

              <DatePicker
                className="h-10 justify-start text-left"
                value={filters.from ?? ''}
                onChange={(next) => applyFilters({ from: next ?? '' })}
              />

              <DatePicker
                className="h-10 justify-start text-left"
                value={filters.to ?? ''}
                onChange={(next) => applyFilters({ to: next ?? '' })}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Status Updates</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {history.data.length > 0 ? (
              history.data.map((item) => (
                <div key={item.id} className="rounded-lg border bg-card p-4 shadow-sm">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline" className={getStatusTypeBadgeClass(item.status_type)}>
                          {getStatusTypeLabel(item.status_type)}
                        </Badge>
                        <Badge variant="secondary">{item.status_value}</Badge>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <UserRound className="h-4 w-4" />
                          <span>{item.driver?.name ?? 'Unknown Driver'}</span>
                          <span>({item.driver?.driverid ?? 'N/A'})</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock3 className="h-4 w-4" />
                          <span>{formatDateTime(item.created_at)}</span>
                        </div>
                      </div>
                    </div>

                    {item.location && (
                      <div className="min-w-[260px] rounded-md border bg-muted/40 p-3 text-sm">
                        <div className="mb-2 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 font-medium">
                            <MapPin className="h-4 w-4" />
                            Location Snapshot
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => toggleMap(item.id)}
                          >
                            <Map className="mr-1 h-4 w-4" />
                            {openMapId === item.id ? 'Hide Map' : 'Show Map'}
                          </Button>
                        </div>
                        <div className="grid gap-1 text-muted-foreground">
                          <div>Lat: {formatCoordinate(item.location.latitude)}</div>
                          <div>Lng: {formatCoordinate(item.location.longitude)}</div>
                          <div>Accuracy: {item.location.accuracy ?? 'N/A'}</div>
                          <div>Time: {formatDateTime(item.location.timestamp)}</div>
                        </div>
                      </div>
                    )}
                  </div>

                  {item.location && openMapId === item.id && (
                    <div className="mt-4 overflow-hidden rounded-md border">
                      <MapContainer
                        center={[item.location.latitude, item.location.longitude]}
                        zoom={15}
                        style={{ height: '280px', width: '100%' }}
                      >
                        <TileLayer
                          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        <CircleMarker
                          center={[item.location.latitude, item.location.longitude]}
                          radius={8}
                          pathOptions={{ color: '#2563eb', weight: 2, fillOpacity: 0.5, fillColor: '#60a5fa' }}
                        >
                          <Popup>
                            <strong>{item.driver?.name ?? 'Driver'}</strong>
                            <br />
                            {getStatusTypeLabel(item.status_type)}: {item.status_value}
                            <br />
                            Lat: {formatCoordinate(item.location.latitude)}
                            <br />
                            Lng: {formatCoordinate(item.location.longitude)}
                            <br />
                            Time: {formatDateTime(item.location.timestamp)}
                          </Popup>
                        </CircleMarker>
                      </MapContainer>
                    </div>
                  )}

                  <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px]">
                    <div className="rounded-md border border-dashed p-3">
                      <div className="mb-2 flex items-center gap-2 text-sm font-medium">
                        <MessageSquare className="h-4 w-4" />
                        Comment
                      </div>
                      <div className="whitespace-pre-wrap text-sm text-muted-foreground">
                        {item.notes?.trim() ? item.notes : 'No comment provided.'}
                      </div>
                    </div>

                    <div className="rounded-md border p-3 text-sm">
                      <div className="grid gap-2">
                        <div>
                          <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Recorded</div>
                          <div>{formatDateTime(item.created_at)}</div>
                        </div>
                        <div>
                          <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Updated</div>
                          <div>{formatDateTime(item.updated_at)}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-lg border border-dashed p-10 text-center text-muted-foreground">
                No driver status history found.
              </div>
            )}

            {history.links && history.links.length > 3 && (
              <div className="flex flex-wrap items-center gap-2 pt-2">
                {history.links.map((link, index) => (
                  <Button
                    key={`${link.label}-${index}`}
                    variant={link.active ? 'default' : 'outline'}
                    size="sm"
                    disabled={!link.url}
                    onClick={() => link.url && router.visit(link.url, { preserveScroll: true, preserveState: true })}
                  >
                    <span dangerouslySetInnerHTML={{ __html: link.label }} />
                  </Button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  )
}

DriverStatusHistory.layout = (page: React.ReactNode) => (
  <AppLayout
    breadcrumbs={[
      { title: 'Status Management', href: '/statustypes' },
      { title: 'Driver Status History', href: '/driver-status-history' },
    ]}
  >
    {page}
  </AppLayout>
)
