import { useState, useMemo } from 'react'
import { Link, router } from '@inertiajs/react'
import { Eye, Trash2, SquarePen, Plus, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { DeleteConfirmationDialog } from '@/components/delete-confirmation-dialog'
import { useToast } from '@/hooks/use-toast'
import { usePermissions } from '@/hooks/use-permissions'
import AppLayout from '@/layouts/app-layout'
import { Badge } from '@/components/ui/badge'

interface StatusType {
  id: number
  name: string
}

interface Status {
  id: number
  name: string
  status_type_id: number
  statusType: StatusType
  description: string
  created_at: string
}

interface StatusesIndexProps {
  statuses: {
    data: Status[]
    meta: { total: number; per_page: number; current_page: number; last_page: number }
  }
}

export default function StatusesIndex({ statuses }: StatusesIndexProps) {
  const { toast } = useToast()
  const { hasPermission } = usePermissions()
  const [search, setSearch] = useState('')
  const [sortColumn, setSortColumn] = useState('name')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [deleteConfirmation, setDeleteConfirmation] = useState<{ id: number; name: string } | null>(null)

  const filtered = useMemo(() => {
    let items = statuses?.data || []

    if (search.trim()) {
      const query = search.toLowerCase()
      items = items.filter(
        item =>
          item.name.toLowerCase().includes(query) ||
          item.description.toLowerCase().includes(query) ||
          item.statusType.name.toLowerCase().includes(query)
      )
    }

    items.sort((a, b) => {
      let aVal: any
      let bVal: any

      if (sortColumn === 'statusType') {
        aVal = a.statusType?.name
        bVal = b.statusType?.name
      } else {
        aVal = a[sortColumn as keyof Status]
        bVal = b[sortColumn as keyof Status]
      }

      if (typeof aVal === 'string') {
        aVal = aVal?.toLowerCase()
        bVal = bVal?.toLowerCase()
      }

      return sortOrder === 'asc' ? (aVal > bVal ? 1 : -1) : aVal < bVal ? 1 : -1
    })

    return items
  }, [search, sortColumn, sortOrder, statuses])

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(column)
      setSortOrder('asc')
    }
  }

  const handleDelete = (status: Status) => {
    setDeleteConfirmation({ id: status.id, name: status.name })
  }

  const confirmDelete = () => {
    if (!deleteConfirmation) return
    router.delete(route('statuses.destroy', deleteConfirmation.id), {
      onSuccess: () => {
        toast({ title: 'Success', description: 'Status deleted successfully', variant: 'success' })
        setDeleteConfirmation(null)
      },
      onError: () => {
        toast({ title: 'Error', description: 'Failed to delete status', variant: 'destructive' })
      },
    })
  }

  const getStatusTypeBadgeColor = (typeName: string) => {
    switch (typeName.toLowerCase()) {
      case 'truck':
        return 'bg-blue-500 text-white'
      case 'driver':
        return 'bg-green-500 text-white'
      case 'maintenance':
        return 'bg-orange-500 text-white'
      case 'operation':
        return 'bg-purple-500 text-white'
      default:
        return 'bg-gray-500 text-white'
    }
  }

  return (
    <>
      <div className="flex h-full flex-1 flex-col gap-6 overflow-hidden rounded-xl p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Statuses</h1>
            <p className="text-muted-foreground">Manage your statuses</p>
          </div>
          <div className="flex gap-2">
            {hasPermission('statuses.export') && (
              <Button variant="outline" onClick={() => router.get(route('statuses.export'))}>
                Export CSV
              </Button>
            )}
            {hasPermission('statuses.create') && (
              <Link href={route('statuses.create')}>
                <Button>
                  <Plus className="mr-2 h-4 w-4" /> Add Status
                </Button>
              </Link>
            )}
          </div>
        </div>

        <Card className="flex flex-1 flex-col overflow-hidden">
          <CardHeader className="relative border-b py-4">
            <div className="flex items-center justify-between">
              <div className="relative w-64">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search statuses..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="pl-9 pr-3"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex-1 overflow-auto p-0">
            <div className="rounded-lg border">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead onClick={() => handleSort('name')} className="cursor-pointer select-none hover:bg-muted/70 transition-colors">
                      <div className="flex items-center">
                        Name {sortColumn === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
                      </div>
                    </TableHead>
                    <TableHead onClick={() => handleSort('statusType')} className="cursor-pointer select-none hover:bg-muted/70 transition-colors">
                      <div className="flex items-center">
                        Status Type {sortColumn === 'statusType' && (sortOrder === 'asc' ? '↑' : '↓')}
                      </div>
                    </TableHead>
                    <TableHead onClick={() => handleSort('description')} className="cursor-pointer select-none hover:bg-muted/70 transition-colors">
                      <div className="flex items-center">
                        Description {sortColumn === 'description' && (sortOrder === 'asc' ? '↑' : '↓')}
                      </div>
                    </TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length > 0 ? (
                    filtered.map(status => (
                      <TableRow key={status.id}>
                        <TableCell className="font-medium">{status.name}</TableCell>
                        <TableCell>
                          <Badge className={getStatusTypeBadgeColor(status.statusType.name)}>
                            {status.statusType.name}
                          </Badge>
                        </TableCell>
                        <TableCell>{status.description}</TableCell>
                        <TableCell className="flex justify-end space-x-2">
                          {hasPermission('statuses.show') && (
                            <Link href={route('statuses.show', status.id)}>
                              <Button variant="ghost" size="icon">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </Link>
                          )}
                          {hasPermission('statuses.edit') && (
                            <Link href={route('statuses.edit', status.id)}>
                              <Button variant="ghost" size="icon">
                                <SquarePen className="h-4 w-4" />
                              </Button>
                            </Link>
                          )}
                          {hasPermission('statuses.destroy') && (
                            <Button variant="ghost" size="icon" onClick={() => handleDelete(status)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="h-24 text-center">
                        No statuses found. {hasPermission('statuses.create') && <Link href={route('statuses.create')} className="text-primary hover:underline">Create one</Link>}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Pagination */}
        {statuses.meta && statuses.meta.last_page > 1 && (
          <div className="flex items-center justify-between px-4 py-3 sm:px-6">
            <div className="flex flex-1 justify-between sm:hidden">
              <Link
                href={statuses.meta.current_page > 1 ? route('statuses.index', { page: statuses.meta.current_page - 1, search, sort: sortColumn, direction: sortOrder }) : '#'}
                className={`relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 ${statuses.meta.current_page === 1 ? 'pointer-events-none opacity-50' : ''}`}
              >
                Previous
              </Link>
              <Link
                href={statuses.meta.current_page < statuses.meta.last_page ? route('statuses.index', { page: statuses.meta.current_page + 1, search, sort: sortColumn, direction: sortOrder }) : '#'}
                className={`relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 ${statuses.meta.current_page === statuses.meta.last_page ? 'pointer-events-none opacity-50' : ''}`}
              >
                Next
              </Link>
            </div>
            <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing <span className="font-medium">{(statuses.meta.current_page - 1) * statuses.meta.per_page + 1}</span> to{' '}
                  <span className="font-medium">{Math.min(statuses.meta.current_page * statuses.meta.per_page, statuses.meta.total)}</span> of{' '}
                  <span className="font-medium">{statuses.meta.total}</span> results
                </p>
              </div>
              <div>
                <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                  {Array.from({ length: statuses.meta.last_page }, (_, i) => (
                    <Link
                      key={i + 1}
                      href={route('statuses.index', { page: i + 1, search, sort: sortColumn, direction: sortOrder })}
                      aria-current={statuses.meta.current_page === i + 1 ? 'page' : undefined}
                      className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                        statuses.meta.current_page === i + 1
                          ? 'z-10 bg-primary text-white focus:z-20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary'
                          : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:outline-offset-0'
                      }`}
                    >
                      {i + 1}
                    </Link>
                  ))}
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      <DeleteConfirmationDialog
        isOpen={!!deleteConfirmation}
        onClose={() => setDeleteConfirmation(null)}
        onConfirm={confirmDelete}
        itemName={deleteConfirmation?.name}
      />
    </>
  )
}

StatusesIndex.layout = (page: React.ReactNode) => <AppLayout children={page} />
