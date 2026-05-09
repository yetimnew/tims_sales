import { Head, router, useForm } from '@inertiajs/react'
import AppLayout from '@/layouts/app-layout'
import { type BreadcrumbItem } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { CheckCircle2, Clock3, Filter, MessageSquareWarning, ShieldAlert, XCircle } from 'lucide-react'
import * as React from 'react'

type RequestItem = {
  id: number
  truck: { id: number | null; plate: string | null }
  maintenance_type: { id: number | null; name: string | null }
  scheduled_date: string | null
  status: string | null
  request_type: 'issue' | 'service'
  request_message: string | null
  request_created_at: string | null
  driver_acknowledged_at: string | null
  mobile_request_status: 'pending' | 'approved' | 'rejected'
  mobile_request_reviewed_at: string | null
  mobile_request_review_note: string | null
}

type Paginated<T> = {
  data: T[]
  links?: { url: string | null; label: string; active: boolean }[]
}

type Filters = {
  request_type?: string
  request_status?: string
}

const breadcrumbs: BreadcrumbItem[] = [
  { title: 'Maintenance', href: '/maintenance' },
  { title: 'Mobile Requests', href: '/maintenance/mobile-requests' },
]

const formatDateTime = (value: string | null) => {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'

  return date.toLocaleString()
}

const statusBadge = (value: RequestItem['mobile_request_status']) => {
  if (value === 'approved') {
    return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">Approved</Badge>
  }

  if (value === 'rejected') {
    return <Badge className="bg-rose-100 text-rose-700 hover:bg-rose-100">Rejected</Badge>
  }

  return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">Pending</Badge>
}

export default function MobileRequests({
  requests,
  filters,
}: {
  requests: Paginated<RequestItem>
  filters: Filters
}) {
  const [dialogMode, setDialogMode] = React.useState<'approve' | 'reject' | null>(null)
  const [selectedRequest, setSelectedRequest] = React.useState<RequestItem | null>(null)
  const form = useForm<{ review_note: string }>({ review_note: '' })

  const applyFilters = (next: Partial<Filters>) => {
    const merged = { ...filters, ...next }
    const params: Record<string, string> = {}

    if (merged.request_type && merged.request_type !== 'all') params.request_type = merged.request_type
    if (merged.request_status && merged.request_status !== 'all') params.request_status = merged.request_status

    router.get('/maintenance/mobile-requests', params, {
      preserveState: true,
      preserveScroll: true,
    })
  }

  const openDialog = (mode: 'approve' | 'reject', request: RequestItem) => {
    setDialogMode(mode)
    setSelectedRequest(request)
    form.setData('review_note', '')
  }

  const submitDecision = () => {
    if (!selectedRequest || !dialogMode) return

    const endpoint =
      dialogMode === 'approve'
        ? `/maintenance/${selectedRequest.id}/approve-mobile-request`
        : `/maintenance/${selectedRequest.id}/reject-mobile-request`

    form.post(endpoint, {
      preserveScroll: true,
      onSuccess: () => {
        setDialogMode(null)
        setSelectedRequest(null)
      },
    })
  }

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Maintenance Mobile Requests" />
      <div className="flex h-full flex-1 flex-col gap-6 overflow-hidden rounded-xl p-4">
        <div className="flex items-center gap-3 rounded-xl border bg-background p-4 shadow-sm">
          <div className="rounded-xl bg-amber-500/10 p-2 text-amber-600">
            <ShieldAlert className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-semibold">Maintenance Requests From Mobile</h1>
            <p className="text-sm text-muted-foreground">
              Review driver-submitted issue and service requests, then approve or reject them.
            </p>
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
            <div className="grid gap-3 md:grid-cols-2">
              <Select value={filters.request_type ?? 'all'} onValueChange={(value) => applyFilters({ request_type: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="All request types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All request types</SelectItem>
                  <SelectItem value="issue">Issue reports</SelectItem>
                  <SelectItem value="service">Service requests</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filters.request_status ?? 'pending'} onValueChange={(value) => applyFilters({ request_status: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Request status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="all">All statuses</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Requests</CardTitle>
          </CardHeader>
          <CardContent>
            {requests.data.length === 0 ? (
              <div className="rounded-lg border border-dashed p-10 text-center text-muted-foreground">
                No mobile maintenance requests found.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Truck</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Maintenance</TableHead>
                    <TableHead>Message</TableHead>
                    <TableHead>Requested</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requests.data.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.truck?.plate ?? 'Unassigned'}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {item.request_type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div>{item.maintenance_type?.name ?? '—'}</div>
                          <div className="text-xs text-muted-foreground">Scheduled {item.scheduled_date ?? '—'}</div>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-sm">
                        <div className="flex items-start gap-2">
                          <MessageSquareWarning className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                          <div className="space-y-1">
                            <div className="line-clamp-3 text-sm">{item.request_message ?? '—'}</div>
                            {item.driver_acknowledged_at && (
                              <div className="text-xs text-muted-foreground">Acknowledged by driver</div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{formatDateTime(item.request_created_at)}</TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {statusBadge(item.mobile_request_status)}
                          {item.mobile_request_reviewed_at && (
                            <div className="text-xs text-muted-foreground">{formatDateTime(item.mobile_request_reviewed_at)}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        {item.mobile_request_status === 'pending' ? (
                          <div className="flex justify-end gap-2">
                            <Button size="sm" onClick={() => openDialog('approve', item)}>
                              <CheckCircle2 className="mr-1 h-4 w-4" />
                              Approve
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => openDialog('reject', item)}>
                              <XCircle className="mr-1 h-4 w-4" />
                              Reject
                            </Button>
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">{item.mobile_request_review_note ?? 'Reviewed'}</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Dialog open={dialogMode !== null} onOpenChange={(open) => !open && setDialogMode(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{dialogMode === 'approve' ? 'Approve mobile request' : 'Reject mobile request'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="rounded-md border bg-muted/30 p-3 text-sm">
                <div className="font-medium">{selectedRequest?.truck?.plate ?? 'Truck'}</div>
                <div className="mt-1 text-muted-foreground">{selectedRequest?.request_message ?? '—'}</div>
              </div>
              <Textarea
                value={form.data.review_note}
                onChange={(event) => form.setData('review_note', event.target.value)}
                placeholder={dialogMode === 'approve' ? 'Optional approval note' : 'Reason for rejection'}
              />
              {form.errors.review_note && (
                <div className="text-sm text-destructive">{form.errors.review_note}</div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogMode(null)}>
                Cancel
              </Button>
              <Button
                variant={dialogMode === 'approve' ? 'default' : 'destructive'}
                onClick={submitDecision}
                disabled={form.processing}
              >
                {dialogMode === 'approve' ? 'Approve' : 'Reject'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  )
}
