import { useState } from 'react'
import { Link, router } from '@inertiajs/react'
import { Eye, Trash2, SquarePen, Plus, Search, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { InertiaPagination } from '@/components/ui/pagination'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { DeleteConfirmationDialog } from '@/components/delete-confirmation-dialog'
import { useToast } from '@/hooks/use-toast'
import { usePermissions } from '@/hooks/use-permissions'
import AppLayout from '@/layouts/app-layout'

interface FuelRecord {
  id: number
  truck_id: number
  driver_id: number
  fuel_date: string
  fuel_quantity_liters: number
  fuel_price_per_liter: number
  total_cost: number
  fuel_type: string
  fuel_station?: string
  truck?: { plate: string }
  driver?: { name: string }
  created_at: string
}

interface FuelIndexProps {
  fuelRecords: {
    data: FuelRecord[]
    current_page: number
    last_page: number
    per_page: number
    total: number
    from: number
    to: number
    links?: Array<{ url: string | null; label: string; active?: boolean }>
  }
}

export default function FuelIndex({ fuelRecords }: FuelIndexProps) {
  const { toast } = useToast()
  const { hasPermission } = usePermissions()
  const [search, setSearch] = useState('')
  const [sortColumn, setSortColumn] = useState('fuel_date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [deleteConfirmation, setDeleteConfirmation] = useState<{ id: number; name: string } | null>(null)

  const handleSort = (column: string) => {
    const newOrder = sortColumn === column && sortOrder === 'asc' ? 'desc' : 'asc'
    setSortColumn(column)
    setSortOrder(newOrder)
    router.get(
      route('fuel.index'),
      { search, sort: column, direction: newOrder },
      { preserveState: true, preserveScroll: true }
    )
  }

  const handleSearch = (value: string) => {
    setSearch(value)
    router.get(
      route('fuel.index'),
      { search: value, sort: sortColumn, direction: sortOrder },
      { preserveState: true, preserveScroll: true }
    )
  }

  const handleExport = () => {
    window.location.href = route('fuel.export', { search, sort: sortColumn, direction: sortOrder })
  }

  const handleDelete = (fuel: FuelRecord) => {
    setDeleteConfirmation({ id: fuel.id, name: `${fuel.truck?.plate || 'Fuel'} - ${fuel.fuel_date}` })
  }

  const confirmDelete = () => {
    if (!deleteConfirmation) return
    router.delete(route('fuel.destroy', deleteConfirmation.id), {
      onSuccess: () => {
        toast({ title: 'Success', description: 'Fuel record deleted successfully', variant: 'success' })
        setDeleteConfirmation(null)
      },
      onError: () => {
        toast({ title: 'Error', description: 'Failed to delete fuel record', variant: 'destructive' })
      },
    })
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'ETB',
      minimumFractionDigits: 2,
    }).format(amount)
  }

  const getFuelTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      Diesel: 'bg-blue-500',
      Petrol: 'bg-orange-500',
      Gas: 'bg-green-500',
    }
    return colors[type] || 'bg-gray-500'
  }

  return (
    <>
      <div className="flex h-full flex-1 flex-col gap-6 overflow-hidden rounded-xl p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Fuel Records</h1>
            <p className="text-muted-foreground mt-2">
              Manage your {fuelRecords?.total || 0} fuel records
            </p>
          </div>
          <div className="flex gap-2">
            {hasPermission('fuel.export') && (
              <Button onClick={handleExport} variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Export CSV
              </Button>
            )}
            {hasPermission('fuel.create') && (
              <Button asChild>
                <Link href={route('fuel.create')}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Fuel Record
                </Link>
              </Button>
            )}
          </div>
        </div>

        <Card className="flex flex-1 flex-col overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <div className="relative w-64">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search fuel records..."
                className="pl-9"
                value={search}
                onChange={(e) => handleSearch(e.target.value)}
              />
            </div>
          </CardHeader>

          <CardContent className="flex-1 overflow-auto">
            <div className="rounded-lg border">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead
                      onClick={() => handleSort('fuel_date')}
                      className="cursor-pointer select-none hover:bg-muted/70 transition-colors"
                    >
                      <div className="flex items-center">
                        Date {sortColumn === 'fuel_date' && (sortOrder === 'asc' ? '↑' : '↓')}
                      </div>
                    </TableHead>
                    <TableHead>Truck</TableHead>
                    <TableHead>Driver</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead
                      onClick={() => handleSort('fuel_quantity_liters')}
                      className="cursor-pointer select-none hover:bg-muted/70 transition-colors"
                    >
                      <div className="flex items-center">
                        Quantity (L) {sortColumn === 'fuel_quantity_liters' && (sortOrder === 'asc' ? '↑' : '↓')}
                      </div>
                    </TableHead>
                    <TableHead
                      onClick={() => handleSort('total_cost')}
                      className="cursor-pointer select-none hover:bg-muted/70 transition-colors"
                    >
                      <div className="flex items-center">
                        Total Cost {sortColumn === 'total_cost' && (sortOrder === 'asc' ? '↑' : '↓')}
                      </div>
                    </TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fuelRecords?.data && fuelRecords.data.length > 0 ? (
                    fuelRecords.data.map((fuel) => (
                      <TableRow key={fuel.id}>
                        <TableCell className="font-medium">{formatDate(fuel.fuel_date)}</TableCell>
                        <TableCell className="text-muted-foreground">{fuel.truck?.plate || 'N/A'}</TableCell>
                        <TableCell className="text-muted-foreground">{fuel.driver?.name || 'N/A'}</TableCell>
                        <TableCell>
                          <Badge className={getFuelTypeBadge(fuel.fuel_type)}>
                            {fuel.fuel_type}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{fuel.fuel_quantity_liters.toFixed(2)}</TableCell>
                        <TableCell className="font-semibold">{formatCurrency(fuel.total_cost)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            {hasPermission('fuel.show') && (
                              <Button variant="ghost" size="icon" asChild>
                                <Link href={route('fuel.show', fuel.id)}>
                                  <Eye className="h-4 w-4" />
                                </Link>
                              </Button>
                            )}
                            {hasPermission('fuel.edit') && (
                              <Button variant="ghost" size="icon" asChild>
                                <Link href={route('fuel.edit', fuel.id)}>
                                  <SquarePen className="h-4 w-4" />
                                </Link>
                              </Button>
                            )}
                            {hasPermission('fuel.destroy') && (
                              <Button variant="ghost" size="icon" onClick={() => handleDelete(fuel)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="h-24 text-center">
                        No fuel records found.{' '}
                        {hasPermission('fuel.create') && (
                          <Link href={route('fuel.create')} className="text-primary hover:underline">
                            Create one
                          </Link>
                        )}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            <InertiaPagination
              from={fuelRecords.from}
              to={fuelRecords.to}
              total={fuelRecords.total}
              links={fuelRecords.links}
              currentPage={fuelRecords.current_page}
              lastPage={fuelRecords.last_page}
            />
          </CardContent>
        </Card>
      </div>

      <DeleteConfirmationDialog
        open={!!deleteConfirmation}
        onClose={() => setDeleteConfirmation(null)}
        onConfirm={confirmDelete}
        itemName={deleteConfirmation?.name || ''}
        title="Delete Fuel Record"
        description="Are you sure you want to delete this fuel record? This action cannot be undone."
      />
    </>
  )
}

FuelIndex.layout = (page: React.ReactNode) => <AppLayout children={page} />

