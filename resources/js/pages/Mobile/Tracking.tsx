import React from 'react'
import AppLayout from '@/layouts/app-layout'
import { Head, router } from '@inertiajs/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { DatePicker } from '@/components/ui/date-picker'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { Clock3, Crosshair, Filter, Gauge, Map, MapPin, Navigation, UserRound } from 'lucide-react'

type DriverOption = {
  id: number
  name: string
  driverid: string
}

type LocationItem = {
  id: number
  driver?: {
    id: number
    name: string
    driverid: string
  } | null
  latitude: number
  longitude: number
  accuracy?: number | null
  speed?: number | null
  heading?: number | null
  timestamp?: string | null
  created_at?: string | null
}

type Paginated<T> = {
  data: T[]
  links?: { url: string | null; label: string; active: boolean }[]
}

type Filters = {
  driver_id?: string
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

const formatMetric = (value?: number | null, suffix = ''): string => {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return 'N/A'
  return `${Number(value).toFixed(1)}${suffix}`
}

export default function Tracking({
  locations,
  drivers,
  filters,
}: {
  locations: Paginated<LocationItem>
  drivers: DriverOption[]
  filters: Filters
}) {
  const [openMapId, setOpenMapId] = React.useState<number | null>(locations.data[0]?.id ?? null)

  const applyFilters = (next: Partial<Filters>) => {
    const merged = { ...filters, ...next }
    const params: Record<string, string> = {}

    if (merged.driver_id) params.driver_id = merged.driver_id
    if (merged.from) params.from = merged.from
    if (merged.to) params.to = merged.to

    router.get('/mobile/tracking', params, {
      preserveScroll: true,
      preserveState: true,
    })
  }

  const toggleMap = (itemId: number) => {
    setOpenMapId((current) => (current === itemId ? null : itemId))
  }

  return (
    <>
      <Head title="Mobile Tracking" />

      <div className="flex h-full flex-1 flex-col gap-6 p-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Mobile Tracking</h1>
          <p className="text-sm text-muted-foreground">
            Review location points reported from the mobile app.
          </p>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Filter className="h-4 w-4" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-3">
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
            <CardTitle className="text-base">Reported Locations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {locations.data.length > 0 ? (
              locations.data.map((item) => (
                <div key={item.id} className="rounded-lg border bg-card p-4 shadow-sm">
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
                        <div className="flex items-center gap-2 font-medium">
                          <UserRound className="h-4 w-4" />
                          <span>{item.driver?.name ?? 'Unknown Driver'}</span>
                          <span className="text-muted-foreground">({item.driver?.driverid ?? 'N/A'})</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Clock3 className="h-4 w-4" />
                          <span>{formatDateTime(item.timestamp ?? item.created_at)}</span>
                        </div>
                      </div>

                      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                        <div className="rounded-md border bg-muted/30 p-3 text-sm">
                          <div className="mb-1 flex items-center gap-2 font-medium">
                            <MapPin className="h-4 w-4" />
                            Coordinates
                          </div>
                          <div className="text-muted-foreground">Lat: {formatCoordinate(item.latitude)}</div>
                          <div className="text-muted-foreground">Lng: {formatCoordinate(item.longitude)}</div>
                        </div>

                        <div className="rounded-md border bg-muted/30 p-3 text-sm">
                          <div className="mb-1 flex items-center gap-2 font-medium">
                            <Crosshair className="h-4 w-4" />
                            Accuracy
                          </div>
                          <div className="text-muted-foreground">{formatMetric(item.accuracy, ' m')}</div>
                        </div>

                        <div className="rounded-md border bg-muted/30 p-3 text-sm">
                          <div className="mb-1 flex items-center gap-2 font-medium">
                            <Gauge className="h-4 w-4" />
                            Speed
                          </div>
                          <div className="text-muted-foreground">{formatMetric(item.speed, ' m/s')}</div>
                        </div>

                        <div className="rounded-md border bg-muted/30 p-3 text-sm">
                          <div className="mb-1 flex items-center gap-2 font-medium">
                            <Navigation className="h-4 w-4" />
                            Heading
                          </div>
                          <div className="text-muted-foreground">{formatMetric(item.heading, '°')}</div>
                        </div>
                      </div>
                    </div>

                    <div className="flex shrink-0 items-start">
                      <Button type="button" variant="outline" size="sm" onClick={() => toggleMap(item.id)}>
                        <Map className="mr-2 h-4 w-4" />
                        {openMapId === item.id ? 'Hide Map' : 'Show Map'}
                      </Button>
                    </div>
                  </div>

                  {openMapId === item.id && (
                    <div className="mt-4 overflow-hidden rounded-md border">
                      <MapContainer
                        center={[item.latitude, item.longitude]}
                        zoom={15}
                        style={{ height: '300px', width: '100%' }}
                      >
                        <TileLayer
                          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        <CircleMarker
                          center={[item.latitude, item.longitude]}
                          radius={8}
                          pathOptions={{ color: '#16a34a', weight: 2, fillOpacity: 0.5, fillColor: '#4ade80' }}
                        >
                          <Popup>
                            <strong>{item.driver?.name ?? 'Driver'}</strong>
                            <br />
                            Lat: {formatCoordinate(item.latitude)}
                            <br />
                            Lng: {formatCoordinate(item.longitude)}
                            <br />
                            Accuracy: {formatMetric(item.accuracy, ' m')}
                            <br />
                            Time: {formatDateTime(item.timestamp ?? item.created_at)}
                          </Popup>
                        </CircleMarker>
                      </MapContainer>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="rounded-lg border border-dashed p-10 text-center text-muted-foreground">
                No mobile tracking records found.
              </div>
            )}

            {locations.links && locations.links.length > 3 && (
              <div className="flex flex-wrap items-center gap-2 pt-2">
                {locations.links.map((link, index) => (
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

Tracking.layout = (page: React.ReactNode) => (
  <AppLayout
    breadcrumbs={[
      { title: 'Mobile', href: '/mobile/tracking' },
      { title: 'Tracking', href: '/mobile/tracking' },
    ]}
  >
    {page}
  </AppLayout>
)
