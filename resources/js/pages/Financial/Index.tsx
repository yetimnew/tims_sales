import { useState } from 'react'
import { Link, router } from '@inertiajs/react'
import { Eye, Trash2, SquarePen, Plus, Search, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { DeleteConfirmationDialog } from '@/components/delete-confirmation-dialog'
import { useToast } from '@/hooks/use-toast'
import { usePermissions } from '@/hooks/use-permissions'
import AppLayout from '@/layouts/app-layout'

interface FinancialRecord {
  id: number
  truck_id: number
  record_date: string
  period_type: string
  revenue: number
  fuel_cost: number
  maintenance_cost: number
  driver_salary: number
  insurance_cost: number
  depreciation: number
  other_costs: number
  net_profit: number
  truck?: { plate: string }
  created_at: string
}

interface FinancialIndexProps {
  financialRecords: {
    data: FinancialRecord[]
    current_page: number
    last_page: number
    per_page: number
    total: number
    from: number
    to: number
    links?: {
      first?: string
      last?: string
      prev?: string
      next?: string
    }
  }
}

export default function FinancialIndex({ financialRecords }: FinancialIndexProps) {
  const { toast } = useToast()
  const { hasPermission } = usePermissions()
  const [search, setSearch] = useState('')
  const [sortColumn, setSortColumn] = useState('record_date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [deleteConfirmation, setDeleteConfirmation] = useState<{ id: number; name: string } | null>(null)

  const handleSort = (column: string) => {
    const newOrder = sortColumn === column && sortOrder === 'asc' ? 'desc' : 'asc'
    setSortColumn(column)
    setSortOrder(newOrder)
    router.get(
      route('financial.index'),
      { search, sort: column, direction: newOrder },
      { preserveState: true, preserveScroll: true }
    )
  }

  const handleSearch = (value: string) => {
    setSearch(value)
    router.get(
      route('financial.index'),
      { search: value, sort: sortColumn, direction: sortOrder },
      { preserveState: true, preserveScroll: true }
    )
  }

  const handleExport = () => {
    window.location.href = route('financial.export', { search, sort: sortColumn, direction: sortOrder })
  }

  const handleDelete = (financial: FinancialRecord) => {
    setDeleteConfirmation({ id: financial.id, name: `${financial.truck?.plate || 'Financial'} - ${financial.record_date}` })
  }

  const confirmDelete = () => {
    if (!deleteConfirmation) return
    router.delete(route('financial.destroy', deleteConfirmation.id), {
      onSuccess: () => {
        toast({ title: 'Success', description: 'Financial record deleted successfully', variant: 'success' })
        setDeleteConfirmation(null)
      },
      onError: () => {
        toast({ title: 'Error', description: 'Failed to delete financial record', variant: 'destructive' })
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

  const getPeriodBadge = (type: string) => {
    const colors: Record<string, string> = {
      Daily: 'bg-blue-500',
      Weekly: 'bg-green-500',
      Monthly: 'bg-purple-500',
      Quarterly: 'bg-orange-500',
      Yearly: 'bg-red-500',
    }
    return colors[type] || 'bg-gray-500'
  }

  const getProfitColor = (profit: number) => {
    return profit >= 0 ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'
  }

  return (
    <>
      <div className="flex h-full flex-1 flex-col gap-6 overflow-hidden rounded-xl p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Financial Records</h1>
            <p className="text-muted-foreground">
              Manage your {financialRecords?.total || 0} financial records
            </p>
          </div>
          <div className="flex gap-2">
            {hasPermission('financial.export') && (
              <Button onClick={handleExport} variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Export CSV
              </Button>
            )}
            {hasPermission('financial.create') && (
              <Button asChild>
                <Link href={route('financial.create')}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Financial Record
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
                placeholder="Search financial records..."
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
                      onClick={() => handleSort('record_date')}
                      className="cursor-pointer select-none hover:bg-muted/70 transition-colors"
                    >
                      <div className="flex items-center">
                        Date {sortColumn === 'record_date' && (sortOrder === 'asc' ? '↑' : '↓')}
                      </div>
                    </TableHead>
                    <TableHead>Truck</TableHead>
                    <TableHead
                      onClick={() => handleSort('period_type')}
                      className="cursor-pointer select-none hover:bg-muted/70 transition-colors"
                    >
                      <div className="flex items-center">
                        Period {sortColumn === 'period_type' && (sortOrder === 'asc' ? '↑' : '↓')}
                      </div>
                    </TableHead>
                    <TableHead
                      onClick={() => handleSort('revenue')}
                      className="cursor-pointer select-none hover:bg-muted/70 transition-colors"
                    >
                      <div className="flex items-center">
                        Revenue {sortColumn === 'revenue' && (sortOrder === 'asc' ? '↑' : '↓')}
                      </div>
                    </TableHead>
                    <TableHead
                      onClick={() => handleSort('net_profit')}
                      className="cursor-pointer select-none hover:bg-muted/70 transition-colors"
                    >
                      <div className="flex items-center">
                        Net Profit {sortColumn === 'net_profit' && (sortOrder === 'asc' ? '↑' : '↓')}
                      </div>
                    </TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {financialRecords?.data && financialRecords.data.length > 0 ? (
                    financialRecords.data.map((financial) => (
                      <TableRow key={financial.id}>
                        <TableCell className="font-medium">{formatDate(financial.record_date)}</TableCell>
                        <TableCell className="text-muted-foreground">{financial.truck?.plate || 'N/A'}</TableCell>
                        <TableCell>
                          <Badge className={getPeriodBadge(financial.period_type)}>
                            {financial.period_type}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-semibold">{formatCurrency(financial.revenue)}</TableCell>
                        <TableCell className={getProfitColor(financial.net_profit)}>
                          {formatCurrency(financial.net_profit)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            {hasPermission('financial.show') && (
                              <Button variant="ghost" size="icon" asChild>
                                <Link href={route('financial.show', financial.id)}>
                                  <Eye className="h-4 w-4" />
                                </Link>
                              </Button>
                            )}
                            {hasPermission('financial.edit') && (
                              <Button variant="ghost" size="icon" asChild>
                                <Link href={route('financial.edit', financial.id)}>
                                  <SquarePen className="h-4 w-4" />
                                </Link>
                              </Button>
                            )}
                            {hasPermission('financial.destroy') && (
                              <Button variant="ghost" size="icon" onClick={() => handleDelete(financial)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center">
                        No financial records found.{' '}
                        {hasPermission('financial.create') && (
                          <Link href={route('financial.create')} className="text-primary hover:underline">
                            Create one
                          </Link>
                        )}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {financialRecords?.last_page && financialRecords.last_page > 1 && (
              <div className="mt-6 flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  Showing {financialRecords.current_page} of {financialRecords.last_page} pages
                </div>
                <div className="flex gap-2">
                  {financialRecords.current_page > 1 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        router.get(route('financial.index'), {
                          page: financialRecords.current_page - 1,
                          search,
                          sort: sortColumn,
                          direction: sortOrder,
                        })
                      }
                    >
                      Previous
                    </Button>
                  )}
                  {financialRecords.current_page < financialRecords.last_page && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        router.get(route('financial.index'), {
                          page: financialRecords.current_page + 1,
                          search,
                          sort: sortColumn,
                          direction: sortOrder,
                        })
                      }
                    >
                      Next
                    </Button>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <DeleteConfirmationDialog
        open={!!deleteConfirmation}
        onClose={() => setDeleteConfirmation(null)}
        onConfirm={confirmDelete}
        itemName={deleteConfirmation?.name || ''}
        title="Delete Financial Record"
        description="Are you sure you want to delete this financial record? This action cannot be undone."
      />
    </>
  )
}

FinancialIndex.layout = (page: React.ReactNode) => <AppLayout children={page} />

