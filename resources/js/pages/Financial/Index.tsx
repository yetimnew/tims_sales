import { useMemo, useState } from 'react'
import { Link, router } from '@inertiajs/react'
import { Eye, Trash2, SquarePen, Plus, Search, TrendingUp, Wallet, PiggyBank, CalendarClock } from 'lucide-react'
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
    links?: Array<{ url: string | null; label: string; active?: boolean }>
  }
  statistics: {
    total_records: number
    total_revenue: number
    total_costs: number
    total_profit: number
    average_profit_margin: number | null
    profitable_trucks: number
    last_recorded_at: string | null
  }
  filters: {
    search: string
    sort: string
    direction: 'asc' | 'desc'
  }
}

export default function FinancialIndex({ financialRecords, statistics, filters }: FinancialIndexProps) {
  const { toast } = useToast()
  const { hasPermission } = usePermissions()
  const [search, setSearch] = useState(filters?.search ?? '')
  const [sortColumn, setSortColumn] = useState(filters?.sort ?? 'record_date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>(filters?.direction ?? 'desc')
  const [deleteConfirmation, setDeleteConfirmation] = useState<{ id: number; name: string } | null>(null)

  const handleSort = (column: string) => {
    const newOrder = sortColumn === column && sortOrder === 'asc' ? 'desc' : 'asc'
    setSortColumn(column)
    setSortOrder(newOrder)
    router.get(
      '/financial',
      { search, sort: column, direction: newOrder },
      { preserveState: true, preserveScroll: true }
    )
  }

  const handleSearch = (value: string) => {
    setSearch(value)
    router.get(
      '/financial',
      { search: value, sort: sortColumn, direction: sortOrder },
      { preserveState: true, preserveScroll: true }
    )
  }

  const handleDelete = (financial: FinancialRecord) => {
    setDeleteConfirmation({ id: financial.id, name: `${financial.truck?.plate || 'Financial'} - ${financial.record_date}` })
  }

  const confirmDelete = () => {
    if (!deleteConfirmation) return
    router.delete(`/financial/${deleteConfirmation.id}`, {
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

  const formatPercent = (value: number | null | undefined) => {
    if (value === null || value === undefined) {
      return '—'
    }

    return `${value.toFixed(1)}%`
  }

  const getPeriodStyles = (type: string) => {
    const normalized = type?.toLowerCase() ?? ''
    const styles: Record<string, string> = {
      daily: 'bg-blue-100 text-blue-700 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-900/40',
      weekly: 'bg-emerald-100 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900/40',
      monthly: 'bg-purple-100 text-purple-700 border border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-900/40',
      quarterly: 'bg-amber-100 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900/40',
      yearly: 'bg-rose-100 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900/40',
    }
    return styles[normalized] ?? 'bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-900/60 dark:text-slate-200 dark:border-slate-800'
  }

  const formatPeriodLabel = (type: string) => {
    if (!type) {
      return 'Unknown'
    }

    return type
      .toLowerCase()
      .split('_')
      .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
      .join(' ')
  }

  const getProfitColor = (profit: number) => {
    return profit >= 0 ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'
  }

  const statHighlights = useMemo(
    () => [
      {
        key: 'totalRevenue',
        label: 'Total Revenue',
        value: statistics?.total_revenue ?? 0,
        icon: Wallet,
        tone: 'text-emerald-600 dark:text-emerald-300',
      },
      {
        key: 'totalCosts',
        label: 'Total Costs',
        value: statistics?.total_costs ?? 0,
        icon: PiggyBank,
        tone: 'text-amber-600 dark:text-amber-300',
      },
      {
        key: 'totalProfit',
        label: 'Net Profit',
        value: statistics?.total_profit ?? 0,
        icon: TrendingUp,
        tone: 'text-indigo-600 dark:text-indigo-300',
      },
    ],
    [statistics?.total_costs, statistics?.total_profit, statistics?.total_revenue]
  )

  return (
    <>
      <div className="flex h-full flex-1 flex-col gap-6 overflow-hidden rounded-xl p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Financial Records</h1>
            <p className="text-muted-foreground mt-2">
              Manage your {financialRecords?.total || 0} financial records
            </p>
          </div>
          <div className="flex gap-2">
            {hasPermission('financial.create') && (
              <Button asChild>
                <Link href="/financial/create">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Financial Record
                </Link>
              </Button>
            )}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {statHighlights.map((stat) => {
            const Icon = stat.icon
            return (
              <Card key={stat.key} className="border border-slate-200/60 dark:border-slate-800/60 shadow-sm">
                <CardContent className="flex items-center justify-between gap-6 py-5">
                  <div className="space-y-1">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">{stat.label}</p>
                    <p className={`text-xl font-semibold ${stat.tone}`}>{formatCurrency(stat.value)}</p>
                  </div>
                  <span className="rounded-full bg-slate-100 p-2 dark:bg-slate-800/80">
                    <Icon className={`h-5 w-5 ${stat.tone}`} />
                  </span>
                </CardContent>
              </Card>
            )
          })}

          <Card className="border border-slate-200/60 dark:border-slate-800/60 shadow-sm">
            <CardContent className="flex h-full flex-col justify-center gap-2 py-5">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Average Margin</p>
              <p className="text-xl font-semibold text-teal-600 dark:text-teal-300">
                {formatPercent(statistics?.average_profit_margin)}
              </p>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Profitable Fleets</span>
                <span className="font-semibold text-slate-700 dark:text-slate-200">{statistics?.profitable_trucks ?? 0}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <CalendarClock className="h-3.5 w-3.5" />
                <span>Last entry: {statistics?.last_recorded_at ? formatDate(statistics.last_recorded_at) : '—'}</span>
              </div>
            </CardContent>
          </Card>
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
                          <Badge className={getPeriodStyles(financial.period_type)}>
                            {formatPeriodLabel(financial.period_type)}
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
                                <Link href={`/financial/${financial.id}`}>
                                  <Eye className="h-4 w-4" />
                                </Link>
                              </Button>
                            )}
                            {hasPermission('financial.edit') && (
                              <Button variant="ghost" size="icon" asChild>
                                <Link href={`/financial/${financial.id}/edit`}>
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
                          <Link href="/financial/create" className="text-primary hover:underline">
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
              from={financialRecords.from}
              to={financialRecords.to}
              total={financialRecords.total}
              links={financialRecords.links}
              currentPage={financialRecords.current_page}
              lastPage={financialRecords.last_page}
            />
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

