import { Head, router, useForm } from '@inertiajs/react'
import AppLayout from '@/layouts/app-layout'
import { type BreadcrumbItem } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import { Eye, Filter, MapPin, Receipt, ShieldCheck } from 'lucide-react'
import * as React from 'react'

type FuelMobileRecord = {
    id: number
    fuel_date: string | null
    fuel_station: string | null
    fuel_type: string
    fuel_quantity_liters: number | null
    fuel_price_per_liter: number | null
    total_cost: number | null
    odometer_reading: number | null
    receipt_number: string | null
    receipt_image_url: string | null
    notes: string | null
    latitude: number | null
    longitude: number | null
    location_accuracy_m: number | null
    location_timestamp: string | null
    truck: { id: number | null; plate: string | null }
    driver: { id: number | null; name: string | null; driverid: string | null }
    reviewed_at: string | null
    review_note: string | null
    reviewed_by: string | null
    created_at: string | null
}

type Paginated<T> = {
    data: T[]
    links?: { url: string | null; label: string; active: boolean }[]
}

type Filters = {
    review_status?: string
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Fuel Records', href: '/fuel' },
    { title: 'Fuel Mobile Review', href: '/fuel/mobile-review' },
]

const formatDateTime = (value: string | null) => {
    if (!value) return '—'
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return '—'

    return date.toLocaleString()
}

const formatCurrency = (value: number | null) =>
    value === null ? '—' : new Intl.NumberFormat('en-US', { style: 'currency', currency: 'ETB' }).format(value)

export default function FuelMobileReview({
    records,
    filters,
}: {
    records: Paginated<FuelMobileRecord>
    filters: Filters
}) {
    const [selectedRecord, setSelectedRecord] = React.useState<FuelMobileRecord | null>(null)
    const form = useForm<{ review_note: string }>({ review_note: '' })

    const applyFilters = (next: Partial<Filters>) => {
        const merged = { ...filters, ...next }
        const params: Record<string, string> = {}
        if (merged.review_status && merged.review_status !== 'all') {
            params.review_status = merged.review_status
        }

        router.get('/fuel/mobile-review', params, {
            preserveState: true,
            preserveScroll: true,
        })
    }

    const openReview = (record: FuelMobileRecord) => {
        setSelectedRecord(record)
        form.setData('review_note', record.review_note ?? '')
    }

    const submitReview = () => {
        if (!selectedRecord) return

        form.post(`/fuel/${selectedRecord.id}/mark-mobile-reviewed`, {
            preserveScroll: true,
            onSuccess: () => setSelectedRecord(null),
        })
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Fuel Mobile Review" />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-hidden rounded-xl p-4">
                <div className="flex items-center gap-3 rounded-xl border bg-background p-4 shadow-sm">
                    <div className="rounded-xl bg-blue-500/10 p-2 text-blue-600">
                        <Receipt className="h-5 w-5" />
                    </div>
                    <div>
                        <h1 className="text-xl font-semibold">Mobile Fuel Review</h1>
                        <p className="text-sm text-muted-foreground">
                            Review fuel submissions from the mobile app, including receipt image, location snapshot, and odometer.
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
                        <Select value={filters.review_status ?? 'pending'} onValueChange={(value) => applyFilters({ review_status: value })}>
                            <SelectTrigger className="max-w-xs">
                                <SelectValue placeholder="Review status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="pending">Pending review</SelectItem>
                                <SelectItem value="reviewed">Reviewed</SelectItem>
                                <SelectItem value="all">All records</SelectItem>
                            </SelectContent>
                        </Select>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base">Submissions</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {records.data.length === 0 ? (
                            <div className="rounded-lg border border-dashed p-10 text-center text-muted-foreground">
                                No mobile fuel submissions found.
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Driver / Truck</TableHead>
                                        <TableHead>Fuel</TableHead>
                                        <TableHead>Proof</TableHead>
                                        <TableHead>Review</TableHead>
                                        <TableHead className="text-right">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {records.data.map((record) => (
                                        <TableRow key={record.id}>
                                            <TableCell>
                                                <div className="space-y-1">
                                                    <div>{record.fuel_date ?? '—'}</div>
                                                    <div className="text-xs text-muted-foreground">{formatDateTime(record.created_at)}</div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="space-y-1">
                                                    <div>{record.driver.name ?? '—'}</div>
                                                    <div className="text-xs text-muted-foreground">
                                                        {record.driver.driverid ?? '—'} • {record.truck.plate ?? 'Unassigned'}
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="space-y-1 text-sm">
                                                    <div className="capitalize">{record.fuel_type}</div>
                                                    <div>{record.fuel_quantity_liters?.toFixed(2) ?? '—'} L</div>
                                                    <div>{formatCurrency(record.total_cost)}</div>
                                                    <div className="text-xs text-muted-foreground">{record.fuel_station ?? '—'}</div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="space-y-1 text-sm">
                                                    <div className="flex items-center gap-2">
                                                        <Receipt className="h-4 w-4 text-muted-foreground" />
                                                        <span>{record.receipt_image_url ? 'Receipt attached' : 'No receipt image'}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <MapPin className="h-4 w-4 text-muted-foreground" />
                                                        <span>{record.latitude !== null && record.longitude !== null ? 'Location captured' : 'No location'}</span>
                                                    </div>
                                                    <div>Odometer: {record.odometer_reading ?? '—'}</div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {record.reviewed_at ? (
                                                    <div className="space-y-1">
                                                        <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">Reviewed</Badge>
                                                        <div className="text-xs text-muted-foreground">
                                                            {record.reviewed_by ?? '—'} • {formatDateTime(record.reviewed_at)}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">Pending</Badge>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="outline" size="sm" onClick={() => openReview(record)}>
                                                    <Eye className="mr-2 h-4 w-4" />
                                                    Review
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>
            </div>

            <Dialog open={selectedRecord !== null} onOpenChange={(open) => !open && setSelectedRecord(null)}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Review Mobile Fuel Submission</DialogTitle>
                    </DialogHeader>

                    {selectedRecord && (
                        <div className="space-y-4">
                            <Card>
                                <CardContent className="space-y-3 p-4 text-sm">
                                    <div><strong>Driver:</strong> {selectedRecord.driver.name ?? '—'}</div>
                                    <div><strong>Truck:</strong> {selectedRecord.truck.plate ?? '—'}</div>
                                    <div><strong>Station:</strong> {selectedRecord.fuel_station ?? '—'}</div>
                                    <div><strong>Total Cost:</strong> {formatCurrency(selectedRecord.total_cost)}</div>
                                    <div><strong>Odometer:</strong> {selectedRecord.odometer_reading ?? '—'}</div>
                                    {selectedRecord.notes && <div><strong>Notes:</strong> {selectedRecord.notes}</div>}
                                    {selectedRecord.latitude !== null && selectedRecord.longitude !== null && (
                                        <div>
                                            <strong>Location:</strong> {selectedRecord.latitude}, {selectedRecord.longitude}
                                        </div>
                                    )}
                                    {selectedRecord.receipt_image_url && (
                                        <a
                                            href={selectedRecord.receipt_image_url}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="inline-flex items-center gap-2 text-sm text-primary underline"
                                        >
                                            <Receipt className="h-4 w-4" />
                                            Open receipt image
                                        </a>
                                    )}
                                </CardContent>
                            </Card>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Review note</label>
                                <Textarea
                                    value={form.data.review_note}
                                    onChange={(event) => form.setData('review_note', event.target.value)}
                                    placeholder="Optional review note"
                                />
                            </div>
                        </div>
                    )}

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setSelectedRecord(null)}>
                            Close
                        </Button>
                        <Button onClick={submitReview} disabled={form.processing}>
                            <ShieldCheck className="mr-2 h-4 w-4" />
                            Mark Reviewed
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    )
}
