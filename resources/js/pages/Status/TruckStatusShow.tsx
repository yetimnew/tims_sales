import AppLayout from '@/layouts/app-layout'
import { Head, Link } from '@inertiajs/react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Clock, PieChart, TrendingUp } from 'lucide-react'
import type { BreadcrumbItem } from '@/types'
import * as React from 'react'

interface DriverSummary {
  id: number
  name: string
}

interface StatusTypeSummary {
  id: number
  name: string
}

interface StatusSummary {
  id: number
  name: string
  statustype_id?: number | null
  status_type?: StatusTypeSummary | null
}

interface HistoryEntry {
  id: number
  status_id: number | null
  status: StatusSummary | null
  status_date: string | null
  notes?: string | null
  changed_at?: string | null
  changed_by?: DriverSummary | null
}

interface StatusCountEntry {
  status_id: number | null
  status_name: string | null
  status_type?: string | null
  occurrences: number
  percentage?: number
}

interface SummaryPayload {
  window_start: string
  window_end: string
  window_days: number
  total_records: number
  days_with_status: number
  distinct_statuses: number
  current_status: string | null
  current_status_changed_at: string | null
  status_counts: StatusCountEntry[]
}

interface TruckPayload {
  id: number
  plate: string
  status: string | null
  vehicleType?: string | null
  driver?: DriverSummary | null
}

interface TruckStatusShowProps {
  truck: TruckPayload
  recentStatusHistory: HistoryEntry[]
  recentStatusSummary: SummaryPayload
}

const breadcrumbs: BreadcrumbItem[] = [
  {
    title: 'Truck Status Board',
    href: '/truck-status-board',
  },
]

const formatDate = (value: string | null | undefined, options?: Intl.DateTimeFormatOptions) => {
  if (!value) return null

  const parsed = new Date(value)

  if (Number.isNaN(parsed.getTime())) {
    return value
  }

  return parsed.toLocaleString(undefined, options)
}

export default function TruckStatusShow({ truck, recentStatusHistory, recentStatusSummary }: TruckStatusShowProps) {
  const statusTimeline = React.useMemo(() => {
    return recentStatusHistory.reduce<Record<string, HistoryEntry[]>>((grouped, entry) => {
      const key = entry.status_date ?? 'Unknown date'
      if (!grouped[key]) {
        grouped[key] = []
      }
      grouped[key].push(entry)
      return grouped
    }, {})
  }, [recentStatusHistory])

  const orderedDates = React.useMemo(() => {
    return Object.keys(statusTimeline).sort((a, b) => {
      if (a === 'Unknown date') return 1
      if (b === 'Unknown date') return -1
      return new Date(b).getTime() - new Date(a).getTime()
    })
  }, [statusTimeline])

  const currentStatusChangedAt = formatDate(recentStatusSummary.current_status_changed_at, {
    dateStyle: 'medium',
    timeStyle: 'short',
  })

  return (
    <AppLayout breadcrumbs={[...breadcrumbs, { title: `${truck.plate} • Status Overview`, href: '#' }] }>
      <Head title={`Status Overview - ${truck.plate}`} />
      <div className="flex flex-1 flex-col gap-6 rounded-xl p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <Link href="/truck-status-board">
                <Button variant="outline" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
              </Link>
              <h1 className="text-2xl font-semibold text-slate-900">{truck.plate} • Status Overview</h1>
              {truck.status && (
                <Badge variant="secondary" className="text-xs">
                  {truck.status}
                </Badge>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              {truck.vehicleType && <span>{truck.vehicleType}</span>}
              {truck.driver && (
                <span className="flex items-center gap-1">
                  <span className="text-slate-400">•</span>
                  <span>Assigned to {truck.driver.name}</span>
                </span>
              )}
              <span className="flex items-center gap-1">
                <span className="text-slate-400">•</span>
                <span>Tracking last {recentStatusSummary.window_days} days</span>
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>{formatDate(recentStatusSummary.window_start, { dateStyle: 'medium' })}</span>
            <span>to</span>
            <span>{formatDate(recentStatusSummary.window_end, { dateStyle: 'medium' })}</span>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">Current Status</CardTitle>
              <CardDescription>Latest captured state from the status board</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              <span className="text-lg font-semibold">{recentStatusSummary.current_status ?? 'No status recorded'}</span>
              {currentStatusChangedAt && (
                <span className="text-xs text-muted-foreground">Updated on {currentStatusChangedAt}</span>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">Updates Logged</CardTitle>
              <CardDescription>Total entries captured within the window</CardDescription>
            </CardHeader>
            <CardContent className="flex items-end justify-between">
              <div className="flex flex-col">
                <span className="text-3xl font-bold text-slate-900">{recentStatusSummary.total_records}</span>
                <span className="text-xs text-muted-foreground">days with updates: {recentStatusSummary.days_with_status}</span>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-500" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">Distinct Statuses</CardTitle>
              <CardDescription>Unique statuses recorded recently</CardDescription>
            </CardHeader>
            <CardContent className="flex items-end justify-between">
              <span className="text-3xl font-bold text-slate-900">{recentStatusSummary.distinct_statuses}</span>
              <PieChart className="h-8 w-8 text-emerald-500" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">Board Actions</CardTitle>
              <CardDescription>Quick navigation</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <Button asChild variant="outline">
                <Link href="/truck-status-board">Back to board</Link>
              </Button>
              <Button asChild>
                <Link href={`/trucks/${truck.id}`}>Open truck profile</Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Status distribution</CardTitle>
            <CardDescription>How often each status appears in the recent window</CardDescription>
          </CardHeader>
          <CardContent>
            {recentStatusSummary.status_counts.length ? (
              <div className="flex flex-wrap gap-3">
                {recentStatusSummary.status_counts.map((entry) => (
                  <div key={`${entry.status_id}-${entry.status_name}`} className="flex items-center gap-2 rounded-full border border-slate-200 px-4 py-1.5">
                    <Badge variant="outline" className="border-transparent bg-blue-50 text-blue-600">
                      {entry.status_name ?? 'Unknown'}
                    </Badge>
                    <span className="text-sm font-medium text-slate-900">{entry.occurrences}</span>
                    {typeof entry.percentage === 'number' && (
                      <span className="text-xs text-muted-foreground">({entry.percentage}%)</span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-md border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-sm text-muted-foreground">
                No status activity recorded in this window.
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="flex-1">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Recent timeline</CardTitle>
            <CardDescription>The most recent status changes captured per day</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {orderedDates.length ? (
              orderedDates.map((dateKey) => (
                <div key={dateKey} className="rounded-lg border border-slate-200">
                  <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-2">
                    <span className="text-sm font-semibold text-slate-900">{formatDate(dateKey, { dateStyle: 'full' }) ?? dateKey}</span>
                    <Badge variant="secondary">{statusTimeline[dateKey].length} update{statusTimeline[dateKey].length === 1 ? '' : 's'}</Badge>
                  </div>
                  <div className="space-y-4 p-4">
                    {statusTimeline[dateKey].map((entry) => (
                      <div key={entry.id} className="space-y-2">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <Badge className="bg-indigo-500 text-white">
                              {entry.status?.name ?? 'Unknown status'}
                            </Badge>
                            {entry.changed_by?.name && (
                              <span className="text-sm text-muted-foreground">by {entry.changed_by.name}</span>
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {formatDate(entry.changed_at, { dateStyle: 'medium', timeStyle: 'short' }) ?? 'Time not captured'}
                          </span>
                        </div>
                        {entry.notes && (
                          <div className="rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-700">
                            {entry.notes}
                          </div>
                        )}
                        <Separator />
                      </div>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-md border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-sm text-muted-foreground">
                No recent status changes found for this truck.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
}

TruckStatusShow.layout = (page: React.ReactNode) => <AppLayout children={page} />
