import { useState, useMemo } from 'react'
import { Link, router } from '@inertiajs/react'
import { Eye, Trash2, SquarePen, Plus, Search, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { DeleteConfirmationDialog } from '@/components/delete-confirmation-dialog'
import { useToast } from '@/hooks/use-toast'
import { usePermissions } from '@/hooks/use-permissions'
import AppLayout from '@/layouts/app-layout'

interface Woreda {
  id: number
  name: string
  code?: string
  zone_id: number
  zone?: { name: string }
  places_count?: number
  created_at: string
}

interface WoredasIndexProps {
  woredas: {
    data: Woreda[]
    meta: { total: number; per_page: number; current_page: number; last_page: number }
  }
}

export default function WoredasIndex({ woredas }: WoredasIndexProps) {
  const { toast } = useToast()
  const { hasPermission } = usePermissions()
  const [search, setSearch] = useState('')
  const [sortColumn, setSortColumn] = useState('name')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [deleteConfirmation, setDeleteConfirmation] = useState<{ id: number; name: string } | null>(null)

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(column)
      setSortOrder('asc')
    }

    router.get(
      route('woredas.index'),
      { search, sort: column, direction: sortColumn === column ? (sortOrder === 'asc' ? 'desc' : 'asc') : 'asc' },
      { preserveState: true, preserveScroll: true }
    )
  }

  const handleSearch = (value: string) => {
    setSearch(value)
    router.get(
      route('woredas.index'),
      { search: value, sort: sortColumn, direction: sortOrder },
      { preserveState: true, preserveScroll: true }
    )
  }

  const handleExport = () => {
    window.location.href = route('woredas.export', { search, sort: sortColumn, direction: sortOrder })
  }

  const handleDelete = (woreda: Woreda) => {
    setDeleteConfirmation({ id: woreda.id, name: woreda.name })
  }

  const confirmDelete = () => {
    if (!deleteConfirmation) return
    router.delete(route('woredas.destroy', deleteConfirmation.id), {
      onSuccess: () => {
        toast({ title: 'Success', description: 'Woreda deleted successfully', variant: 'success' })
        setDeleteConfirmation(null)
      },
      onError: () => {
        toast({ title: 'Error', description: 'Failed to delete woreda', variant: 'destructive' })
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

  return (
    <>
      <div className="flex h-full flex-1 flex-col gap-6 overflow-hidden rounded-xl p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Woredas</h1>
            <p className="text-muted-foreground">
              Manage your {woredas?.meta?.total || 0} woredas
            </p>
          </div>
          <div className="flex gap-2">
            {hasPermission('woredas.export') && (
              <Button onClick={handleExport} variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Export CSV
              </Button>
            )}
            {hasPermission('woredas.create') && (
              <Button asChild>
                <Link href={route('woredas.create')}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Woreda
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
                placeholder="Search woredas..."
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
                      onClick={() => handleSort('name')}
                      className="cursor-pointer select-none hover:bg-muted/70 transition-colors"
                    >
                      <div className="flex items-center">
                        Name {sortColumn === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
                      </div>
                    </TableHead>
                    <TableHead
                      onClick={() => handleSort('code')}
                      className="cursor-pointer select-none hover:bg-muted/70 transition-colors"
                    >
                      <div className="flex items-center">
                        Code {sortColumn === 'code' && (sortOrder === 'asc' ? '↑' : '↓')}
                      </div>
                    </TableHead>
                    <TableHead>Zone</TableHead>
                    <TableHead
                      onClick={() => handleSort('places_count')}
                      className="cursor-pointer select-none hover:bg-muted/70 transition-colors"
                    >
                      <div className="flex items-center">
                        Places {sortColumn === 'places_count' && (sortOrder === 'asc' ? '↑' : '↓')}
                      </div>
                    </TableHead>
                    <TableHead
                      onClick={() => handleSort('created_at')}
                      className="cursor-pointer select-none hover:bg-muted/70 transition-colors"
                    >
                      <div className="flex items-center">
                        Created {sortColumn === 'created_at' && (sortOrder === 'asc' ? '↑' : '↓')}
                      </div>
                    </TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {woredas?.data && woredas.data.length > 0 ? (
                    woredas.data.map((woreda) => (
                      <TableRow key={woreda.id}>
                        <TableCell className="font-medium">{woreda.name}</TableCell>
                        <TableCell className="text-muted-foreground">{woreda.code || 'N/A'}</TableCell>
                        <TableCell className="text-muted-foreground">{woreda.zone?.name || 'N/A'}</TableCell>
                        <TableCell className="text-muted-foreground">{woreda.places_count || 0}</TableCell>
                        <TableCell className="text-muted-foreground">{formatDate(woreda.created_at)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            {hasPermission('woredas.show') && (
                              <Button variant="ghost" size="icon" asChild>
                                <Link href={route('woredas.show', woreda.id)}>
                                  <Eye className="h-4 w-4" />
                                </Link>
                              </Button>
                            )}
                            {hasPermission('woredas.edit') && (
                              <Button variant="ghost" size="icon" asChild>
                                <Link href={route('woredas.edit', woreda.id)}>
                                  <SquarePen className="h-4 w-4" />
                                </Link>
                              </Button>
                            )}
                            {hasPermission('woredas.destroy') && (
                              <Button variant="ghost" size="icon" onClick={() => handleDelete(woreda)}>
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
                        No woredas found.{' '}
                        {hasPermission('woredas.create') && (
                          <Link href={route('woredas.create')} className="text-primary hover:underline">
                            Create one
                          </Link>
                        )}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {woredas?.meta && woredas.meta.last_page > 1 && (
              <div className="mt-6 flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  Showing {woredas.meta.current_page} of {woredas.meta.last_page} pages
                </div>
                <div className="flex gap-2">
                  {woredas.meta.current_page > 1 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        router.get(route('woredas.index'), {
                          page: woredas.meta.current_page - 1,
                          search,
                          sort: sortColumn,
                          direction: sortOrder,
                        })
                      }
                    >
                      Previous
                    </Button>
                  )}
                  {woredas.meta.current_page < woredas.meta.last_page && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        router.get(route('woredas.index'), {
                          page: woredas.meta.current_page + 1,
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
        title="Delete Woreda"
        description="Are you sure you want to delete this woreda? This action cannot be undone."
      />
    </>
  )
}

WoredasIndex.layout = (page: React.ReactNode) => <AppLayout children={page} />

