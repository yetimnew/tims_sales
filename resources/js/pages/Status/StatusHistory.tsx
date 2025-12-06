import AppLayout from '@/layouts/app-layout'
import { Head, Link, router } from '@inertiajs/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DatePicker } from '@/components/ui/date-picker'
import { ArrowLeft, Clock, Tag } from 'lucide-react'

interface TimelineItem {
  id: number
  status: { id: number; name: string }
  changed_by?: { id: number; name: string }
  notes?: string
  status_date: string
  created_at?: string
}

interface Paginated<T> {
  data: T[]
  current_page: number
  last_page: number
  from: number
  to: number
  total: number
  links?: { url: string | null; label: string; active: boolean }[]
}

type TruckSummary = { id: number; plate: string }

export default function StatusHistory({ truck, history, filters }: { truck: TruckSummary; history: Paginated<TimelineItem>; filters: { from?: string; to?: string } }) {
  const handleDateChange = (key: 'from' | 'to') => (next: string | null) => {
    const params: Record<string, string> = {}

    const fromValue = key === 'from' ? next ?? '' : filters?.from ?? ''
    const toValue = key === 'to' ? next ?? '' : filters?.to ?? ''

    if (fromValue) {
      params.from = fromValue
    }

    if (toValue) {
      params.to = toValue
    }

    router.get(`/trucks/${truck.id}/status-history`, params, {
      preserveScroll: true,
      preserveState: true,
    })
  }

  return (
    <AppLayout breadcrumbs={[{ title: 'Trucks', href: '/trucks' }, { title: `History ${truck?.plate}`, href: '#' }]}>
      <Head title={`Status History - ${truck?.plate}`} />
      <div className="flex h-full flex-1 flex-col gap-6 overflow-hidden rounded-xl p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/trucks">
              <Button variant="outline" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
            </Link>
            <h1 className="text-2xl font-bold">{truck?.plate} • Status History</h1>
          </div>
        </div>

        <Card className="flex-1 overflow-hidden">
          <CardHeader>
            <CardTitle className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Filter</span>
                <DatePicker
                  className="w-40"
                  fieldClassName="h-8 text-sm"
                  buttonClassName="h-7 w-7"
                  value={filters?.from ?? ''}
                  onChange={handleDateChange('from')}
                />
                <DatePicker
                  className="w-40"
                  fieldClassName="h-8 text-sm"
                  buttonClassName="h-7 w-7"
                  value={filters?.to ?? ''}
                  onChange={handleDateChange('to')}
                />
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="max-h-[70vh] overflow-auto p-4">
              {history?.data?.length ? (
                <ul className="space-y-3">
                  {history.data.map(item => (
                    <li key={item.id} className="rounded-md border p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge className="bg-blue-500 text-white"><Tag className="h-3 w-3 mr-1" /> {item.status?.name}</Badge>
                          {item.changed_by?.name && <span className="text-sm text-muted-foreground">by {item.changed_by.name}</span>}
                        </div>
                        <div className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" /> {item.status_date}</div>
                      </div>
                      {item.notes && <p className="mt-2 text-sm text-gray-700">{item.notes}</p>}
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="p-8 text-center text-muted-foreground">No history found.</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
}

StatusHistory.layout = (page: React.ReactNode) => <AppLayout children={page} />


