import { useState, useMemo } from 'react'
import { Link, router } from '@inertiajs/react'
import { Eye, Trash2, SquarePen, Plus, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { DeleteConfirmationDialog } from '@/components/delete-confirmation-dialog'
import { useToast } from '@/hooks/use-toast'
import { usePermissions } from '@/hooks/use-permissions'
import AppLayout from '@/layouts/app-layout'

interface Role {
  id: number
  name: string
  guard_name: string
  permissions: Array<{ name: string }>
  created_at: string
}

interface PaginationMeta {
  total: number
  per_page: number
  current_page: number
  last_page: number
}

interface RolesIndexProps {
  roles: {
    data: Role[]
    meta: PaginationMeta
  }
}

const getRoleBadgeColor = (roleName: string) => {
  const colors: Record<string, string> = {
    admin: 'bg-red-100 text-red-800',
    manager: 'bg-blue-100 text-blue-800',
    user: 'bg-green-100 text-green-800',
  }
  return colors[roleName] || 'bg-gray-100 text-gray-800'
}

export default function RolesIndex({ roles }: RolesIndexProps) {
  const { toast } = useToast()
  const { hasPermission } = usePermissions()
  const [search, setSearch] = useState('')
  const [sortColumn, setSortColumn] = useState('name')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [deleteConfirmation, setDeleteConfirmation] = useState<{ id: number; name: string } | null>(null)

  const filtered = useMemo(() => {
    let items = roles?.data || []

    if (search.trim()) {
      const query = search.toLowerCase()
      items = items.filter(
        item =>
          item.name.toLowerCase().includes(query) ||
          item.permissions.some(permission => permission.name.toLowerCase().includes(query))
      )
    }

    items.sort((a, b) => {
      let aVal: any = a[sortColumn as keyof Role]
      let bVal: any = b[sortColumn as keyof Role]

      if (sortColumn === 'name') {
        aVal = aVal?.toLowerCase()
        bVal = bVal?.toLowerCase()
      }

      return sortOrder === 'asc' ? (aVal > bVal ? 1 : -1) : aVal < bVal ? 1 : -1
    })

    return items
  }, [search, sortColumn, sortOrder, roles])

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(column)
      setSortOrder('asc')
    }
  }

  const handleDelete = (role: Role) => {
    setDeleteConfirmation({ id: role.id, name: role.name })
  }

  const confirmDelete = () => {
    if (!deleteConfirmation) return
    router.delete(route('roles.destroy', deleteConfirmation.id), {
      onSuccess: () => {
        toast({ title: 'Success', description: 'Role deleted successfully', variant: 'success' })
        setDeleteConfirmation(null)
      },
      onError: () => {
        toast({ title: 'Error', description: 'Failed to delete role', variant: 'destructive' })
      },
    })
  }

  return (
    <>
      <div className="flex h-full flex-1 flex-col gap-6 overflow-hidden rounded-xl p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Roles</h1>
            <p className="text-muted-foreground">Manage system roles and permissions</p>
          </div>
          {hasPermission('roles.create') && (
            <Link href={route('roles.create')}>
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add Role
              </Button>
            </Link>
          )}
        </div>

        <Card className="flex flex-1 flex-col overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
            <div className="relative w-64">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search roles..."
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
                      <TableHead>Guard</TableHead>
                      <TableHead>Permissions</TableHead>
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
                    {filtered.map(role => (
                      <TableRow key={role.id}>
                        <TableCell className="font-medium">
                          <Badge className={getRoleBadgeColor(role.name)}>
                            {role.name}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{role.guard_name}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {role.permissions.slice(0, 3).map(permission => (
                              <Badge key={permission.name} variant="outline" className="text-xs">
                                {permission.name.split('.')[0]}
                              </Badge>
                            ))}
                            {role.permissions.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{role.permissions.length - 3} more
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {new Date(role.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right space-x-2">
                          {hasPermission('roles.show') && (
                            <Link href={route('roles.show', role.id)}>
                              <Button variant="ghost" size="icon">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </Link>
                          )}
                          {hasPermission('roles.edit') && (
                            <Link href={route('roles.edit', role.id)}>
                              <Button variant="ghost" size="icon">
                                <SquarePen className="h-4 w-4" />
                              </Button>
                            </Link>
                          )}
                          {hasPermission('roles.destroy') && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(role)}
                            >
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
                  No roles found.{' '}
                  {hasPermission('roles.create') && (
                    <Link href={route('roles.create')} className="text-primary hover:underline">
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
        title="Delete Role"
        description="Are you sure you want to delete this role? This action cannot be undone."
        itemName={deleteConfirmation?.name}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteConfirmation(null)}
      />
    </>
  )
}

RolesIndex.layout = (page: React.ReactNode) => <AppLayout children={page} />

