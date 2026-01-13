import AppLayout from '@/layouts/app-layout'
import { Head, Link } from '@inertiajs/react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Clock, PieChart, TrendingUp } from 'lucide-react'
import type { BreadcrumbItem } from '@/types'
import * as React from 'react'
import { useTranslation } from 'react-i18next'

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

const formatDate = (value: string | null | undefined, locale: string, options?: Intl.DateTimeFormatOptions) => {
  if (!value) return null

  const parsed = new Date(value)

  if (Number.isNaN(parsed.getTime())) {
    return value
  }

  return parsed.toLocaleString(locale, options)
}

export default function TruckStatusShow({ truck, recentStatusHistory, recentStatusSummary }: TruckStatusShowProps) {
  const { t, i18n } = useTranslation()
  const locale = i18n.language || 'en-US'
  const statusTimeline = React.useMemo(() => {
    return recentStatusHistory.reduce<Record<string, HistoryEntry[]>>((grouped, entry) => {
      const key = entry.status_date ?? t('truckStatusShow.fallbacks.unknownDate')
      if (!grouped[key]) {
        grouped[key] = []
      }
      grouped[key].push(entry)
      return grouped
    }, {})
  }, [recentStatusHistory, t])

  const orderedDates = React.useMemo(() => {
    return Object.keys(statusTimeline).sort((a, b) => {
      if (a === t('truckStatusShow.fallbacks.unknownDate')) return 1
      if (b === t('truckStatusShow.fallbacks.unknownDate')) return -1
      return new Date(b).getTime() - new Date(a).getTime()
    })
  }, [statusTimeline, t])

  const currentStatusChangedAt = formatDate(recentStatusSummary.current_status_changed_at, locale, {
    dateStyle: 'medium',
    timeStyle: 'short',
  })

  return (
    <AppLayout
      breadcrumbs={[
        { title: t('truckStatusShow.breadcrumbs.board'), href: '/truck-status-board' },
        { title: t('truckStatusShow.breadcrumbs.overview', { plate: truck.plate }), href: '#' },
      ]}
    >
      <Head title={t('truckStatusShow.headTitle', { plate: truck.plate })} />
      <div className="flex flex-1 flex-col gap-6 rounded-xl p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <Link href="/truck-status-board">
                <Button variant="outline" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
              </Link>
              <h1 className="text-2xl font-semibold text-slate-900">{t('truckStatusShow.title', { plate: truck.plate })}</h1>
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
                  <span>{t('truckStatusShow.labels.assignedTo', { name: truck.driver.name })}</span>
                </span>
              )}
              <span className="flex items-center gap-1">
                <span className="text-slate-400">•</span>
                <span>{t('truckStatusShow.labels.trackingWindow', { days: recentStatusSummary.window_days })}</span>
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>{formatDate(recentStatusSummary.window_start, locale, { dateStyle: 'medium' })}</span>
            <span>{t('truckStatusShow.labels.to')}</span>
            <span>{formatDate(recentStatusSummary.window_end, locale, { dateStyle: 'medium' })}</span>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">{t('truckStatusShow.kpi.currentStatus.title')}</CardTitle>
              <CardDescription>{t('truckStatusShow.kpi.currentStatus.description')}</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              <span className="text-lg font-semibold">{recentStatusSummary.current_status ?? t('truckStatusShow.fallbacks.noStatusRecorded')}</span>
              {currentStatusChangedAt && (
                <span className="text-xs text-muted-foreground">{t('truckStatusShow.kpi.currentStatus.updatedOn', { date: currentStatusChangedAt })}</span>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">{t('truckStatusShow.kpi.updatesLogged.title')}</CardTitle>
              <CardDescription>{t('truckStatusShow.kpi.updatesLogged.description')}</CardDescription>
            </CardHeader>
            <CardContent className="flex items-end justify-between">
              <div className="flex flex-col">
                <span className="text-3xl font-bold text-slate-900">{recentStatusSummary.total_records}</span>
                <span className="text-xs text-muted-foreground">{t('truckStatusShow.kpi.updatesLogged.daysWithUpdates', { count: recentStatusSummary.days_with_status })}</span>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-500" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">{t('truckStatusShow.kpi.distinctStatuses.title')}</CardTitle>
              <CardDescription>{t('truckStatusShow.kpi.distinctStatuses.description')}</CardDescription>
            </CardHeader>
            <CardContent className="flex items-end justify-between">
              <span className="text-3xl font-bold text-slate-900">{recentStatusSummary.distinct_statuses}</span>
              <PieChart className="h-8 w-8 text-emerald-500" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">{t('truckStatusShow.kpi.boardActions.title')}</CardTitle>
              <CardDescription>{t('truckStatusShow.kpi.boardActions.description')}</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <Button asChild variant="outline">
                <Link href="/truck-status-board">{t('truckStatusShow.kpi.boardActions.backToBoard')}</Link>
              </Button>
              <Button asChild>
                <Link href={`/trucks/${truck.id}`}>{t('truckStatusShow.kpi.boardActions.openTruckProfile')}</Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">{t('truckStatusShow.distribution.title')}</CardTitle>
            <CardDescription>{t('truckStatusShow.distribution.description')}</CardDescription>
          </CardHeader>
          <CardContent>
            {recentStatusSummary.status_counts.length ? (
              <div className="flex flex-wrap gap-3">
                {recentStatusSummary.status_counts.map((entry) => (
                  <div key={`${entry.status_id}-${entry.status_name}`} className="flex items-center gap-2 rounded-full border border-slate-200 px-4 py-1.5">
                    <Badge variant="outline" className="border-transparent bg-blue-50 text-blue-600">
                      {entry.status_name ?? t('truckStatusShow.fallbacks.unknownStatus')}
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
                {t('truckStatusShow.distribution.empty')}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="flex-1">
          <CardHeader>
            <CardTitle className="text-base font-semibold">{t('truckStatusShow.timeline.title')}</CardTitle>
            <CardDescription>{t('truckStatusShow.timeline.description')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {orderedDates.length ? (
              orderedDates.map((dateKey) => (
                <div key={dateKey} className="rounded-lg border border-slate-200">
                  <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-2">
                    <span className="text-sm font-semibold text-slate-900">{formatDate(dateKey, locale, { dateStyle: 'full' }) ?? dateKey}</span>
                    <Badge variant="secondary">{t('truckStatusShow.timeline.updateCount', { count: statusTimeline[dateKey].length, suffix: statusTimeline[dateKey].length === 1 ? '' : 's' })}</Badge>
                  </div>
                  <div className="space-y-4 p-4">
                    {statusTimeline[dateKey].map((entry) => (
                      <div key={entry.id} className="space-y-2">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <Badge className="bg-indigo-500 text-white">
                              {entry.status?.name ?? t('truckStatusShow.fallbacks.unknownStatus')}
                            </Badge>
                            {entry.changed_by?.name && (
                              <span className="text-sm text-muted-foreground">{t('truckStatusShow.labels.by', { name: entry.changed_by.name })}</span>
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {formatDate(entry.changed_at, locale, { dateStyle: 'medium', timeStyle: 'short' }) ?? t('truckStatusShow.fallbacks.timeNotCaptured')}
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
                {t('truckStatusShow.timeline.empty')}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
}

TruckStatusShow.layout = (page: React.ReactNode) => <AppLayout children={page} />
