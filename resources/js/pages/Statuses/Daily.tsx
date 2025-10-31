import AppLayout from '@/layouts/app-layout'
import { Head, Link, router } from '@inertiajs/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { ArrowLeft, Calendar, Truck } from 'lucide-react'

interface TruckRow {
  id: number
  truck: { id: number; plate: string }
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

export default function StatusDaily({ status, date, trucks }: { status: any; date: string; trucks: Paginated<TruckRow> }) {
  return (
    <AppLayout breadcrumbs={[{ title: 'Status Management', href: '#' }, { title: status?.name, href: '#' }]}>
      <Head title={`${status?.name} - ${date}`} />
      <div className="flex h-full flex-1 flex-col gap-6 overflow-hidden rounded-xl p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/truck-status-board">
              <Button variant="outline" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
            </Link>
            <h1 className="text-2xl font-bold">{status?.name} • Daily</h1>
            <Badge variant="secondary">{trucks?.total || 0}</Badge>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <Input type="date" value={date} onChange={(e) => router.get(`/statuses/${status.id}/daily`, { date: e.target.value })} className="h-8 w-40" />
          </div>
        </div>

        <Card className="flex-1 overflow-hidden">
          <CardHeader>
            <CardTitle>Trucks in {status?.name} on {date}</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="max-h-[70vh] overflow-auto p-4">
              {trucks?.data?.length ? (
                <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {trucks.data.map(row => (
                    <li key={row.id} className="rounded-md border p-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Truck className="h-4 w-4 text-blue-600" />
                        <span className="font-medium">{row.truck?.plate}</span>
                      </div>
                      <Link href={`/trucks/${row.truck?.id}/status-history`} className="text-sm text-primary hover:underline">View History</Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="p-8 text-center text-muted-foreground">No trucks in this status on {date}.</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
}

StatusDaily.layout = (page: React.ReactNode) => <AppLayout children={page} />






