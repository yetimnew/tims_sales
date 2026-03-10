import { Head, router, useForm } from '@inertiajs/react'
import AppLayout from '@/layouts/app-layout'
import { type BreadcrumbItem } from '@/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DatePicker } from '@/components/ui/date-picker'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet'
import {
    AlertTriangle,
    CheckCircle2,
    Clock3,
    Filter,
    Map,
    MapPin,
    ShieldAlert,
    ShieldCheck,
    Truck,
    UserRound,
    XCircle,
} from 'lucide-react'
import * as React from 'react'
import 'leaflet/dist/leaflet.css'

type DriverOption = {
    id: number
    name: string
    driverid: string
}

type AlertItem = {
    id: number
    alert_code: string
    status: string
    message: string | null
    location_missing: boolean
    latitude: number | null
    longitude: number | null
    created_at: string | null
    acknowledged_at: string | null
    resolved_at: string | null
    false_alarm_at: string | null
    resolution_notes: string | null
    driver: { id: number; name: string; driverid: string } | null
    truck: { id: number; plate: string | null } | null
    acknowledged_by: string | null
    resolved_by: string | null
    false_alarm_by: string | null
}

type Paginated<T> = {
    data: T[]
    links?: { url: string | null; label: string; active: boolean }[]
}

type Filters = {
    driver_id?: string
    status?: string
    from?: string
    to?: string
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Mobile', href: '/mobile/tracking' },
    { title: 'Emergency', href: '/mobile/emergency-alerts' },
]

const formatDateTime = (value: string | null) => {
    if (!value) return '—'
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return '—'

    return date.toLocaleString()
}

const statusBadge = (status: string) => {
    switch (status) {
        case 'pending':
            return <Badge className="bg-rose-100 text-rose-700 hover:bg-rose-100">Pending</Badge>
        case 'acknowledged':
            return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">Acknowledged</Badge>
        case 'resolved':
            return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">Resolved</Badge>
        case 'false_alarm':
            return <Badge className="bg-slate-200 text-slate-700 hover:bg-slate-200">False alarm</Badge>
        default:
            return <Badge>{status}</Badge>
    }
}

const statusLabel: Record<string, string> = {
    pending: 'Pending response',
    acknowledged: 'Acknowledged by operations',
    resolved: 'Resolved and closed',
    false_alarm: 'Closed as false alarm',
}

export default function EmergencyAlerts({
    alerts,
    drivers,
    filters,
}: {
    alerts: Paginated<AlertItem>
    drivers: DriverOption[]
    filters: Filters
}) {
    const [selectedAlert, setSelectedAlert] = React.useState<AlertItem | null>(null)
    const [openMapId, setOpenMapId] = React.useState<number | null>(alerts.data[0]?.id ?? null)
    const [action, setAction] = React.useState<'resolve' | 'false-alarm' | null>(null)
    const form = useForm<{ resolution_notes: string }>({ resolution_notes: '' })

    const summary = React.useMemo(() => {
        return alerts.data.reduce<Record<string, number>>((counts, alert) => {
            counts[alert.status] = (counts[alert.status] ?? 0) + 1
            return counts
        }, { pending: 0, acknowledged: 0, resolved: 0, false_alarm: 0 })
    }, [alerts.data])

    const applyFilters = (next: Partial<Filters>) => {
        const merged = { ...filters, ...next }
        const params: Record<string, string> = {}

        if (merged.driver_id) params.driver_id = merged.driver_id
        if (merged.status && merged.status !== 'all') params.status = merged.status
        if (merged.from) params.from = merged.from
        if (merged.to) params.to = merged.to

        router.get('/mobile/emergency-alerts', params, {
            preserveScroll: true,
            preserveState: true,
        })
    }

    const openActionDialog = (alert: AlertItem, nextAction: 'resolve' | 'false-alarm') => {
        setSelectedAlert(alert)
        setAction(nextAction)
        form.setData('resolution_notes', alert.resolution_notes ?? '')
    }

    const closeActionDialog = () => {
        setSelectedAlert(null)
        setAction(null)
    }

    const submitAction = () => {
        if (!selectedAlert || !action) return

        const path = action === 'resolve'
            ? `/mobile/emergency-alerts/${selectedAlert.id}/resolve`
            : `/mobile/emergency-alerts/${selectedAlert.id}/false-alarm`

        form.post(path, {
            preserveScroll: true,
            onSuccess: closeActionDialog,
        })
    }

    const acknowledge = (alert: AlertItem) => {
        router.post(`/mobile/emergency-alerts/${alert.id}/acknowledge`, {}, { preserveScroll: true })
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Mobile Emergency Alerts" />

            <div className="flex h-full flex-1 flex-col gap-6 overflow-hidden rounded-xl p-4">
                <div className="rounded-2xl border bg-background p-5 shadow-sm">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex items-center gap-3">
                            <div className="rounded-xl bg-rose-500/10 p-2 text-rose-600">
                                <AlertTriangle className="h-5 w-5" />
                            </div>
                            <div>
                                <h1 className="text-xl font-semibold">Mobile Emergency Alerts</h1>
                                <p className="text-sm text-muted-foreground">
                                    Monitor driver emergency submissions, response progress, and final closure decisions.
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                            <div className="rounded-xl border bg-rose-50/60 p-3">
                                <div className="text-xs font-medium uppercase tracking-wide text-rose-600">Pending</div>
                                <div className="mt-1 text-2xl font-semibold text-rose-700">{summary.pending ?? 0}</div>
                            </div>
                            <div className="rounded-xl border bg-amber-50/60 p-3">
                                <div className="text-xs font-medium uppercase tracking-wide text-amber-600">Acknowledged</div>
                                <div className="mt-1 text-2xl font-semibold text-amber-700">{summary.acknowledged ?? 0}</div>
                            </div>
                            <div className="rounded-xl border bg-emerald-50/60 p-3">
                                <div className="text-xs font-medium uppercase tracking-wide text-emerald-600">Resolved</div>
                                <div className="mt-1 text-2xl font-semibold text-emerald-700">{summary.resolved ?? 0}</div>
                            </div>
                            <div className="rounded-xl border bg-slate-100/80 p-3">
                                <div className="text-xs font-medium uppercase tracking-wide text-slate-600">False Alarm</div>
                                <div className="mt-1 text-2xl font-semibold text-slate-700">{summary.false_alarm ?? 0}</div>
                            </div>
                        </div>
                    </div>
                </div>

                <Card className="border-rose-100/80">
                    <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-base">
                            <ShieldAlert className="h-4 w-4 text-rose-500" />
                            Response Guidance
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-3 md:grid-cols-3">
                        <div className="rounded-xl border bg-muted/30 p-4">
                            <div className="mb-2 font-medium">1. Review pending alerts first</div>
                            <p className="text-sm text-muted-foreground">
                                These are the highest priority incidents. Acknowledge them as soon as operations starts handling the case.
                            </p>
                        </div>
                        <div className="rounded-xl border bg-muted/30 p-4">
                            <div className="mb-2 font-medium">2. Verify location and message</div>
                            <p className="text-sm text-muted-foreground">
                                Use the embedded map and driver message to validate the incident before dispatching or closing it.
                            </p>
                        </div>
                        <div className="rounded-xl border bg-muted/30 p-4">
                            <div className="mb-2 font-medium">3. Close with notes</div>
                            <p className="text-sm text-muted-foreground">
                                Resolve or mark false alarm only after recording clear handling notes for future review.
                            </p>
                        </div>
                    </CardContent>
                </Card>

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

                            <Select value={filters.status ?? 'all'} onValueChange={(value) => applyFilters({ status: value })}>
                                <SelectTrigger>
                                    <SelectValue placeholder="All statuses" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All statuses</SelectItem>
                                    <SelectItem value="pending">Pending</SelectItem>
                                    <SelectItem value="acknowledged">Acknowledged</SelectItem>
                                    <SelectItem value="resolved">Resolved</SelectItem>
                                    <SelectItem value="false_alarm">False alarm</SelectItem>
                                </SelectContent>
                            </Select>

                            <DatePicker className="h-10 justify-start text-left" value={filters.from ?? ''} onChange={(next) => applyFilters({ from: next ?? '' })} />
                            <DatePicker className="h-10 justify-start text-left" value={filters.to ?? ''} onChange={(next) => applyFilters({ to: next ?? '' })} />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base">Emergency Alerts</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {alerts.data.length === 0 ? (
                            <div className="rounded-lg border border-dashed p-10 text-center text-muted-foreground">
                                No emergency alerts found.
                            </div>
                        ) : (
                            alerts.data.map((alert) => (
                                <div
                                    key={alert.id}
                                    className={`rounded-2xl border p-5 shadow-sm transition-colors ${
                                        alert.status === 'pending'
                                            ? 'border-rose-200 bg-rose-50/30'
                                            : alert.status === 'acknowledged'
                                              ? 'border-amber-200 bg-amber-50/20'
                                              : 'bg-card'
                                    }`}
                                >
                                    <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                                        <div className="min-w-0 flex-1 space-y-4">
                                            <div className="space-y-2">
                                                <div className="flex flex-wrap items-center gap-3">
                                                    {statusBadge(alert.status)}
                                                    <span className="font-semibold">{alert.alert_code}</span>
                                                    <span className="text-sm font-medium text-muted-foreground">
                                                        {statusLabel[alert.status] ?? alert.status}
                                                    </span>
                                                </div>

                                                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
                                                    <div className="flex items-center gap-2">
                                                        <UserRound className="h-4 w-4" />
                                                        <span>{alert.driver?.name ?? 'Unknown driver'}</span>
                                                        <span className="text-muted-foreground">({alert.driver?.driverid ?? 'N/A'})</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-muted-foreground">
                                                        <Truck className="h-4 w-4" />
                                                        <span>{alert.truck?.plate ?? 'No truck linked'}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-muted-foreground">
                                                        <Clock3 className="h-4 w-4" />
                                                        <span>{formatDateTime(alert.created_at)}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {alert.message ? (
                                                <div className="rounded-xl border bg-background/80 p-4">
                                                    <div className="mb-2 text-sm font-medium">Driver message</div>
                                                    <p className="text-sm leading-6 text-muted-foreground">{alert.message}</p>
                                                </div>
                                            ) : (
                                                <div className="rounded-xl border border-dashed bg-background/60 p-4 text-sm text-muted-foreground">
                                                    No message was included with this emergency alert.
                                                </div>
                                            )}

                                            <div className="grid gap-3 lg:grid-cols-3">
                                                <div className="rounded-xl border bg-background/70 p-4 text-sm">
                                                    <div className="mb-2 flex items-center gap-2 font-medium">
                                                        <MapPin className="h-4 w-4" />
                                                        Location snapshot
                                                    </div>
                                                    {alert.location_missing ? (
                                                        <div className="font-medium text-amber-600">Location missing</div>
                                                    ) : (
                                                        <>
                                                            <div className="text-muted-foreground">Latitude: {alert.latitude?.toFixed(6) ?? '—'}</div>
                                                            <div className="text-muted-foreground">Longitude: {alert.longitude?.toFixed(6) ?? '—'}</div>
                                                        </>
                                                    )}
                                                </div>

                                                <div className="rounded-xl border bg-background/70 p-4 text-sm">
                                                    <div className="mb-2 flex items-center gap-2 font-medium">
                                                        <ShieldCheck className="h-4 w-4" />
                                                        Response tracking
                                                    </div>
                                                    <div className="text-muted-foreground">
                                                        {alert.acknowledged_at
                                                            ? `Acknowledged by ${alert.acknowledged_by ?? '—'} on ${formatDateTime(alert.acknowledged_at)}`
                                                            : 'Not acknowledged yet'}
                                                    </div>
                                                    <div className="mt-1 text-muted-foreground">
                                                        {alert.resolved_at
                                                            ? `Resolved by ${alert.resolved_by ?? '—'} on ${formatDateTime(alert.resolved_at)}`
                                                            : alert.false_alarm_at
                                                              ? `False alarm by ${alert.false_alarm_by ?? '—'} on ${formatDateTime(alert.false_alarm_at)}`
                                                              : 'Still open'}
                                                    </div>
                                                </div>

                                                <div className="rounded-xl border bg-background/70 p-4 text-sm">
                                                    <div className="mb-2 font-medium">Handling notes</div>
                                                    <div className="text-muted-foreground">
                                                        {alert.resolution_notes ?? 'No handling notes recorded yet.'}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex shrink-0 flex-wrap items-start gap-2 xl:w-[220px] xl:flex-col">
                                            {alert.latitude !== null && alert.longitude !== null && !alert.location_missing && (
                                                <Button type="button" variant="outline" className="xl:w-full" onClick={() => setOpenMapId((current) => current === alert.id ? null : alert.id)}>
                                                    <Map className="mr-2 h-4 w-4" />
                                                    {openMapId === alert.id ? 'Hide map' : 'Open map'}
                                                </Button>
                                            )}

                                            {alert.status === 'pending' && (
                                                <Button type="button" className="xl:w-full" onClick={() => acknowledge(alert)}>
                                                    Acknowledge alert
                                                </Button>
                                            )}

                                            {!['resolved', 'false_alarm'].includes(alert.status) && (
                                                <>
                                                    <Button type="button" variant="outline" className="xl:w-full" onClick={() => openActionDialog(alert, 'resolve')}>
                                                        <CheckCircle2 className="mr-2 h-4 w-4" />
                                                        Mark resolved
                                                    </Button>
                                                    <Button type="button" variant="outline" className="xl:w-full" onClick={() => openActionDialog(alert, 'false-alarm')}>
                                                        <XCircle className="mr-2 h-4 w-4" />
                                                        Mark false alarm
                                                    </Button>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    {openMapId === alert.id && alert.latitude !== null && alert.longitude !== null && (
                                        <div className="mt-5 overflow-hidden rounded-xl border">
                                            <MapContainer center={[alert.latitude, alert.longitude]} zoom={15} style={{ height: '300px', width: '100%' }}>
                                                <TileLayer
                                                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                                />
                                                <CircleMarker center={[alert.latitude, alert.longitude]} radius={8} pathOptions={{ color: '#dc2626', weight: 2, fillOpacity: 0.5, fillColor: '#f87171' }}>
                                                    <Popup>
                                                        <strong>{alert.driver?.name ?? 'Driver'}</strong>
                                                        <br />
                                                        Alert: {alert.alert_code}
                                                        <br />
                                                        Time: {formatDateTime(alert.created_at)}
                                                    </Popup>
                                                </CircleMarker>
                                            </MapContainer>
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </CardContent>
                </Card>

                <Dialog open={selectedAlert !== null && action !== null} onOpenChange={(open) => { if (!open) closeActionDialog() }}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{action === 'resolve' ? 'Resolve emergency alert' : 'Mark as false alarm'}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-3">
                            <p className="text-sm text-muted-foreground">
                                {selectedAlert?.alert_code} — {selectedAlert?.driver?.name ?? 'Unknown driver'}
                            </p>
                            <Textarea
                                value={form.data.resolution_notes}
                                onChange={(event) => form.setData('resolution_notes', event.target.value)}
                                placeholder="Add handling notes for this emergency alert..."
                                rows={5}
                            />
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="ghost" onClick={closeActionDialog}>
                                Cancel
                            </Button>
                            <Button type="button" onClick={submitAction} disabled={form.processing}>
                                Save
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </AppLayout>
    )
}
