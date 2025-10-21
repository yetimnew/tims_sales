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

interface Zone {
  id: number
  name: string
  region_id: number
  region?: { name: string }
  created_at: string
}

interface RegionOption {
  id: number
  name: string
}

interface ZonesIndexProps {
  zones: {
    data: Zone[]
    meta: { total: number; per_page: number; current_page: number; last_page: number }
  }
  regions: RegionOption[]
}

export default function ZonesIndex({ zones, regions }: ZonesIndexProps) {
  const { toast } = useToast()
  const { hasPermission } = usePermissions()
  const [search, setSearch] = useState('')
  const [sortColumn, setSortColumn] = useState('name')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [deleteConfirmation, setDeleteConfirmation] = useState<{ id: number; name: string } | null>(null)

  const filtered = useMemo(() => {
    let items = zones?.data || []

    if (search.trim()) {
      const query = search.toLowerCase()
      items = items.filter(
        item =>
          item.name.toLowerCase().includes(query) ||
          item.region?.name.toLowerCase().includes(query)
      )
    }

    items.sort((a, b) => {
      let aVal: any = sortColumn === 'region' ? a.region?.name : a[sortColumn as keyof Zone]
      let bVal: any = sortColumn === 'region' ? b.region?.name : b[sortColumn as keyof Zone]
      if (typeof aVal === 'string') {
        aVal = aVal?.toLowerCase()
        bVal = bVal?.toLowerCase()
      }
      return sortOrder === 'asc' ? (aVal > bVal ? 1 : -1) : aVal < bVal ? 1 : -1
    })

    return items
  }, [search, sortColumn, sortOrder, zones])

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(column)
      setSortOrder('asc')
    }
  }

  const handleDelete = (zone: Zone) => {
    setDeleteConfirmation({ id: zone.id, name: zone.name })
  }

  const confirmDelete = () => {
    if (!deleteConfirmation) return
    router.delete(route('zones.destroy', deleteConfirmation.id), {
      onSuccess: () => {
        toast({ title: 'Success', description: 'Zone deleted successfully', variant: 'success' })
        setDeleteConfirmation(null)
      },
      onError: () => {
        toast({ title: 'Error', description: 'Failed to delete zone', variant: 'destructive' })
      },
    })
  }

  return (
    <>
      <div className="flex h-full flex-1 flex-col gap-6 overflow-hidden rounded-xl p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Zones</h1>
            <p className="text-muted-foreground">Manage your zones</p>
          </div>
          {hasPermission('zones.create') && (
            <Link href={route('zones.create')}>
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add Zone
              </Button>
            </Link>
          )}
        </div>

        <Card className="flex flex-1 flex-col overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
            <div className="relative w-64">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search zones..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardHeader>

          <CardContent className="flex flex-1 flex-col overflow-auto">
            {filtered.length > 0 ? (
              <div className="rounded-lg border">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead
                        onClick={() => handleSort('name')}
                        className="cursor-pointer select-none hover:bg-muted/70 transition-colors"
                      >
                        Name
                      </TableHead>
                      <TableHead
                        onClick={() => handleSort('region')}
                        className="cursor-pointer select-none hover:bg-muted/70 transition-colors"
                      >
                        Region
                      </TableHead>
                      <TableHead
                        onClick={() => handleSort('created_at')}
                        className="cursor-pointer select-none hover:bg-muted/70 transition-colors"
                      >
                        Created
                      </TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map(zone => (
                      <TableRow key={zone.id}>
                        <TableCell className="font-medium">{zone.name}</TableCell>
                        <TableCell className="text-muted-foreground">{zone.region?.name || '-'}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {new Date(zone.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right space-x-2">
                          {hasPermission('zones.show') && (
                            <Link href={route('zones.show', zone.id)}>
                              <Button variant="ghost" size="icon">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </Link>
                          )}
                          {hasPermission('zones.edit') && (
                            <Link href={route('zones.edit', zone.id)}>
                              <Button variant="ghost" size="icon">
                                <SquarePen className="h-4 w-4" />
                              </Button>
                            </Link>
                          )}
                          {hasPermission('zones.destroy') && (
                            <Button variant="ghost" size="icon" onClick={() => handleDelete(zone)}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="flex items-center justify-center py-12">
                <p className="text-muted-foreground">
                  No zones found.{' '}
                  {hasPermission('zones.create') && (
                    <Link href={route('zones.create')} className="text-primary hover:underline">
                      Create one
                    </Link>
                  )}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <DeleteConfirmationDialog
        open={!!deleteConfirmation}
        title="Delete Zone"
        description="Are you sure you want to delete this zone? This action cannot be undone."
        itemName={deleteConfirmation?.name}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteConfirmation(null)}
      />
    </>
  )
}

ZonesIndex.layout = (page: React.ReactNode) => <AppLayout children={page} />
