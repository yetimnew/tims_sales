import { useState } from 'react'
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

interface Place {
  id: number
  name: string
  code?: string
  woreda_id: number
  woreda?: { name: string }
  latitude?: number
  longitude?: number
  created_at: string
}

interface PlacesIndexProps {
  places: {
    data: Place[]
    meta: { total: number; per_page: number; current_page: number; last_page: number }
  }
}

export default function PlacesIndex({ places }: PlacesIndexProps) {
  const { toast } = useToast()
  const { hasPermission } = usePermissions()
  const [search, setSearch] = useState('')
  const [sortColumn, setSortColumn] = useState('name')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [deleteConfirmation, setDeleteConfirmation] = useState<{ id: number; name: string } | null>(null)

  const handleSort = (column: string) => {
    const newOrder = sortColumn === column && sortOrder === 'asc' ? 'desc' : 'asc'
    setSortColumn(column)
    setSortOrder(newOrder)
    router.get(
      route('places.index'),
      { search, sort: column, direction: newOrder },
      { preserveState: true, preserveScroll: true }
    )
  }

  const handleSearch = (value: string) => {
    setSearch(value)
    router.get(
      route('places.index'),
      { search: value, sort: sortColumn, direction: sortOrder },
      { preserveState: true, preserveScroll: true }
    )
  }

  const handleExport = () => {
    window.location.href = route('places.export', { search, sort: sortColumn, direction: sortOrder })
  }

  const handleDelete = (place: Place) => {
    setDeleteConfirmation({ id: place.id, name: place.name })
  }

  const confirmDelete = () => {
    if (!deleteConfirmation) return
    router.delete(route('places.destroy', deleteConfirmation.id), {
      onSuccess: () => {
        toast({ title: 'Success', description: 'Place deleted successfully', variant: 'success' })
        setDeleteConfirmation(null)
      },
      onError: () => {
        toast({ title: 'Error', description: 'Failed to delete place', variant: 'destructive' })
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
            <h1 className="text-2xl font-bold">Places</h1>
            <p className="text-muted-foreground">
              Manage your {places?.meta?.total || 0} places
            </p>
          </div>
          <div className="flex gap-2">
            {hasPermission('places.export') && (
              <Button onClick={handleExport} variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Export CSV
              </Button>
            )}
            {hasPermission('places.create') && (
              <Button asChild>
                <Link href={route('places.create')}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Place
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
                placeholder="Search places..."
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
                    <TableHead>Woreda</TableHead>
                    <TableHead>Coordinates</TableHead>
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
                  {places?.data && places.data.length > 0 ? (
                    places.data.map((place) => (
                      <TableRow key={place.id}>
                        <TableCell className="font-medium">{place.name}</TableCell>
                        <TableCell className="text-muted-foreground">{place.code || 'N/A'}</TableCell>
                        <TableCell className="text-muted-foreground">{place.woreda?.name || 'N/A'}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {place.latitude && place.longitude
                            ? `${place.latitude.toFixed(4)}, ${place.longitude.toFixed(4)}`
                            : 'N/A'}
                        </TableCell>
                        <TableCell className="text-muted-foreground">{formatDate(place.created_at)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            {hasPermission('places.show') && (
                              <Button variant="ghost" size="icon" asChild>
                                <Link href={route('places.show', place.id)}>
                                  <Eye className="h-4 w-4" />
                                </Link>
                              </Button>
                            )}
                            {hasPermission('places.edit') && (
                              <Button variant="ghost" size="icon" asChild>
                                <Link href={route('places.edit', place.id)}>
                                  <SquarePen className="h-4 w-4" />
                                </Link>
                              </Button>
                            )}
                            {hasPermission('places.destroy') && (
                              <Button variant="ghost" size="icon" onClick={() => handleDelete(place)}>
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
                        No places found.{' '}
                        {hasPermission('places.create') && (
                          <Link href={route('places.create')} className="text-primary hover:underline">
                            Create one
                          </Link>
                        )}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {places?.meta && places.meta.last_page > 1 && (
              <div className="mt-6 flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  Showing {places.meta.current_page} of {places.meta.last_page} pages
                </div>
                <div className="flex gap-2">
                  {places.meta.current_page > 1 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        router.get(route('places.index'), {
                          page: places.meta.current_page - 1,
                          search,
                          sort: sortColumn,
                          direction: sortOrder,
                        })
                      }
                    >
                      Previous
                    </Button>
                  )}
                  {places.meta.current_page < places.meta.last_page && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        router.get(route('places.index'), {
                          page: places.meta.current_page + 1,
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
        title="Delete Place"
        description="Are you sure you want to delete this place? This action cannot be undone."
      />
    </>
  )
}

PlacesIndex.layout = (page: React.ReactNode) => <AppLayout children={page} />

