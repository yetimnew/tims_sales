import { useState, useMemo } from 'react'
import { Link, router, Head } from '@inertiajs/react'
import { Eye, Trash2, SquarePen, Plus, Search, FileDown, Shield, CheckCircle, ArrowUpDown, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { InertiaPagination } from '@/components/ui/pagination'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { DeleteConfirmationDialog } from '@/components/delete-confirmation-dialog'
import { useToast } from '@/hooks/use-toast'
import { usePermissions } from '@/hooks/use-permissions'
import AppLayout from '@/layouts/app-layout'
import { type BreadcrumbItem } from '@/types'

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Roles',
        href: '/roles',
    },
];

interface Role {
  id: number
  name: string
  guard_name: string
  permissions: Array<{ name: string }>
  created_at: string
}

interface RolesIndexProps {
  roles: {
    data: Role[]
    current_page: number
    last_page: number
    per_page: number
    total: number
    from: number
    to: number
    links: Array<{
      url: string | null
      label: string
      active: boolean
    }>
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
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState('name')
  const [sortDirection, setSortDirection] = useState('asc')
  const [deleteConfirmation, setDeleteConfirmation] = useState<{ id: number; name: string } | null>(null)

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchTerm(value)

    router.get('/roles',
      { search: value, sort: sortBy, direction: sortDirection },
      { preserveState: true, replace: false }
    )
  }

  const handleSort = (column: string) => {
    let newDirection = 'asc'
    if (sortBy === column && sortDirection === 'asc') {
      newDirection = 'desc'
    }

    setSortBy(column)
    setSortDirection(newDirection)

    router.get('/roles',
      { search: searchTerm, sort: column, direction: newDirection },
      { preserveState: true, replace: false }
    )
  }

  const SortIcon = ({ column }: { column: string }) => {
    if (sortBy !== column) {
      return <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />
    }
    return (
      <ArrowUpDown
        className={`ml-2 h-4 w-4 transition-transform ${
          sortDirection === 'desc' ? 'rotate-180' : ''
        }`}
      />
    )
  }

  const roleCount = roles?.total || 0
  const perPage = roles?.per_page || 15
  const currentPage = roles?.current_page || 1
  const totalPages = roles?.last_page || 1

  const handleDelete = (role: Role) => {
    setDeleteConfirmation({ id: role.id, name: role.name })
  }

  const confirmDelete = () => {
    if (!deleteConfirmation) return
    router.delete(`/roles/${deleteConfirmation.id}`, {
      onSuccess: () => {
        toast({
          id: 'role-deleted',
          title: 'Success',
          description: 'Role deleted successfully'
        })
        setDeleteConfirmation(null)
      },
      onError: () => {
        toast({
          id: 'role-delete-error',
          title: 'Error',
          description: 'Failed to delete role',
          variant: 'destructive'
        })
      },
    })
  }

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Roles" />
      <div className="flex h-full flex-1 flex-col gap-6 overflow-hidden rounded-xl p-4">
        {/* Header Section */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Role Management</h1>
            <p className="text-muted-foreground mt-2">
              Manage system roles and permissions
            </p>
          </div>
          <div className="flex gap-2">
            {hasPermission('roles.export') && (
              <Button variant="outline" onClick={() => {
                window.location.href = '/roles/export/csv';
              }}>
                <FileDown className="mr-2 h-4 w-4" />
                Export CSV
              </Button>
            )}
            {hasPermission('roles.create') && (
              <Button asChild>
                <Link href="/roles/create">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Role
                </Link>
              </Button>
            )}
          </div>
        </div>

        <Card className="flex flex-1 flex-col overflow-hidden">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Role Directory</CardTitle>
                <CardDescription>
                  {roleCount} total role{roleCount !== 1 ? 's' : ''} in system
                </CardDescription>
              </div>
              <div className="flex items-center gap-4">
                <div className="relative w-80">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name..."
                    value={searchTerm}
                    onChange={handleSearch}
                    className="pl-10 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex-1 p-0 flex flex-col overflow-hidden">
            <div className="rounded-lg border overflow-auto max-h-[55vh] relative flex-1">
              <Table>
                <TableHeader>
                  <TableRow className="sticky top-0 z-50 bg-background border-b">
                    <TableHead
                      className="cursor-pointer select-none hover:bg-muted/70 transition-colors bg-background"
                      onClick={() => handleSort('name')}
                    >
                      <div className="flex items-center">
                        Name <SortIcon column="name" />
                      </div>
                    </TableHead>
                    <TableHead className="bg-background">Guard</TableHead>
                    <TableHead className="bg-background">Permissions</TableHead>
                    <TableHead
                      className="cursor-pointer select-none hover:bg-muted/70 transition-colors bg-background"
                      onClick={() => handleSort('created_at')}
                    >
                      <div className="flex items-center">
                        Created <SortIcon column="created_at" />
                      </div>
                    </TableHead>
                    <TableHead className="text-center bg-background">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {roles?.data && roles.data.length > 0 ? (
                    roles.data.map(role => (
                      <TableRow key={role.id} className="hover:bg-muted/50">
                        <TableCell className="font-medium">
                          <Badge className={`flex items-center gap-1 w-fit ${getRoleBadgeColor(role.name)}`}>
                            <Shield className="h-3 w-3" />
                            {role.name.charAt(0).toUpperCase() + role.name.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">{role.guard_name}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {role.permissions && role.permissions.length > 0 ? (
                              <>
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
                              </>
                            ) : (
                              <span className="text-muted-foreground text-sm">No permissions</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {role.created_at ? new Date(role.created_at).toLocaleDateString() : '—'}
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex justify-center gap-2">
                            <Button asChild size="sm" variant="ghost">
                              <Link href={`/roles/${role.id}`}>
                                <Eye className="h-4 w-4" />
                              </Link>
                            </Button>
                            {hasPermission('roles.edit') && (
                              <Button asChild size="sm" variant="ghost">
                                <Link href={`/roles/${role.id}/edit`}>
                                  <SquarePen className="h-4 w-4" />
                                </Link>
                              </Button>
                            )}
                            {hasPermission('roles.destroy') && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDelete(role)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="py-16">
                        <div className="flex flex-col items-center justify-center text-center">
                          <div className="h-20 w-20 bg-muted/50 rounded-full flex items-center justify-center mb-6">
                            <Shield className="h-10 w-10 text-muted-foreground" />
                          </div>
                          <h3 className="text-xl font-semibold mb-2">No roles found</h3>
                          <p className="text-muted-foreground mb-6 max-w-md">
                            {searchTerm
                              ? `No roles match "${searchTerm}". Try adjusting your search terms.`
                              : "Get started by adding your first role to the system. Manage access and permissions effectively."
                            }
                          </p>
                          {hasPermission('roles.create') && (
                            <Button asChild size="lg" className="shadow-lg">
                              <Link href="/roles/create">
                                <Plus className="mr-2 h-4 w-4" />
                                {searchTerm ? 'Clear Search & Add Role' : 'Add First Role'}
                              </Link>
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            <InertiaPagination
              from={roles?.from}
              to={roles?.to}
              total={roleCount}
              links={roles?.links}
              currentPage={currentPage}
              lastPage={totalPages}
              className="mt-0 p-4 border-t bg-muted/30 flex-shrink-0"
            />
          </CardContent>
        </Card>

        <DeleteConfirmationDialog
          open={!!deleteConfirmation}
          onOpenChange={(open) => !open && setDeleteConfirmation(null)}
          title="Delete Role"
          description="Are you sure you want to delete this role? This action cannot be undone."
          itemName={deleteConfirmation?.name}
          onConfirm={confirmDelete}
        />
      </div>
    </AppLayout>
  )
}

