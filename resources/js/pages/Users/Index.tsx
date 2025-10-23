import { useState, useMemo } from 'react'
import { useForm } from '@inertiajs/react'
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

interface User {
  id: number
  name: string
  email: string
  email_verified_at?: string
  created_at: string
  roles?: Array<{ name: string }>
}

interface PaginationMeta {
  total: number
  per_page: number
  current_page: number
  last_page: number
}

interface UsersIndexProps {
  users: {
    data: User[]
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

export default function UsersIndex({ users }: UsersIndexProps) {
  const { toast } = useToast()
  const { hasPermission } = usePermissions()
  const [search, setSearch] = useState('')
  const [sortColumn, setSortColumn] = useState('name')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [deleteConfirmation, setDeleteConfirmation] = useState<{ id: number; name: string } | null>(null)

  const filtered = useMemo(() => {
    let items = users?.data || []

    if (search.trim()) {
      const query = search.toLowerCase()
      items = items.filter(
        item =>
          item.name.toLowerCase().includes(query) ||
          item.email.toLowerCase().includes(query) ||
          item.roles?.some(role => role.name.toLowerCase().includes(query))
      )
    }

    items.sort((a, b) => {
      let aVal: any = a[sortColumn as keyof User]
      let bVal: any = b[sortColumn as keyof User]

      if (sortColumn === 'name' || sortColumn === 'email') {
        aVal = aVal?.toLowerCase()
        bVal = bVal?.toLowerCase()
      }

      return sortOrder === 'asc' ? (aVal > bVal ? 1 : -1) : aVal < bVal ? 1 : -1
    })

    return items
  }, [search, sortColumn, sortOrder, users])

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(column)
      setSortOrder('asc')
    }
  }

  const handleDelete = (user: User) => {
    setDeleteConfirmation({ id: user.id, name: user.name })
  }

  const confirmDelete = () => {
    if (!deleteConfirmation) return
    router.delete(route('users.destroy', deleteConfirmation.id), {
      onSuccess: () => {
        toast({
          title: 'Success',
          description: 'User deleted successfully',
          variant: 'success',
        })
        setDeleteConfirmation(null)
      },
      onError: () => {
        toast({
          title: 'Error',
          description: 'Failed to delete user',
          variant: 'destructive',
        })
      },
    })
  }

  return (
    <>
      <div className="flex h-full flex-1 flex-col gap-6 overflow-hidden rounded-xl p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Users</h1>
            <p className="text-muted-foreground mt-2">Manage system users and roles</p>
          </div>
          {hasPermission('users.create') && (
            <Link href={route('users.create')}>
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add User
              </Button>
            </Link>
          )}
        </div>

        <Card className="flex flex-1 flex-col overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
            <div className="relative w-64">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
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
                        onClick={() => handleSort('email')}
                        className="cursor-pointer select-none hover:bg-muted/70 transition-colors"
                      >
                        Email
                      </TableHead>
                      <TableHead>Roles</TableHead>
                      <TableHead>Verified</TableHead>
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
                    {filtered.map(user => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {user.roles?.map(role => (
                              <Badge key={role.name} className={getRoleBadgeColor(role.name)}>
                                {role.name}
                              </Badge>
                            )) || <span className="text-muted-foreground">No roles</span>}
                          </div>
                        </TableCell>
                        <TableCell>
                          {user.email_verified_at ? (
                            <Badge className="bg-green-100 text-green-800">Verified</Badge>
                          ) : (
                            <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {new Date(user.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right space-x-2">
                          {hasPermission('users.show') && (
                            <Link href={route('users.show', user.id)}>
                              <Button variant="ghost" size="icon">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </Link>
                          )}
                          {hasPermission('users.edit') && (
                            <Link href={route('users.edit', user.id)}>
                              <Button variant="ghost" size="icon">
                                <SquarePen className="h-4 w-4" />
                              </Button>
                            </Link>
                          )}
                          {hasPermission('users.destroy') && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(user)}
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
                  No users found.{' '}
                  {hasPermission('users.create') && (
                    <Link href={route('users.create')} className="text-primary hover:underline">
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
        title="Delete User"
        description="Are you sure you want to delete this user? This action cannot be undone."
        itemName={deleteConfirmation?.name}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteConfirmation(null)}
      />
    </>
  )
}
UsersIndex.layout = (page: React.ReactNode) => <AppLayout children={page} />
