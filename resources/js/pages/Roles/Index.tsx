import { ChangeEvent, useCallback, useEffect, useMemo, useState } from 'react'
import { Link, router } from '@inertiajs/react'
import { Eye, Trash2, SquarePen, Plus, Search, FileDown, Shield, CheckCircle, ArrowUpDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { InertiaPagination } from '@/components/ui/pagination'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { DeleteConfirmationDialog } from '@/components/delete-confirmation-dialog'
import { useToast } from '@/hooks/use-toast'
import { usePermissions } from '@/hooks/use-permissions'
import ListPageLayout from '@/components/layouts/list-page-layout'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
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
  filters?: {
    search?: string | null
    permission_group?: string | null
    sort?: string | null
    direction?: 'asc' | 'desc' | null
    per_page?: number | null
  }
  permissionGroupOptions?: Array<{ label: string; value: string }>
  perPageOptions?: number[]
}

const getRoleBadgeColor = (roleName: string) => {
  const colors: Record<string, string> = {
    admin: 'bg-red-100 text-red-800',
    manager: 'bg-blue-100 text-blue-800',
    user: 'bg-green-100 text-green-800',
  }
  return colors[roleName] || 'bg-gray-100 text-gray-800'
}

export default function RolesIndex({ roles, filters, permissionGroupOptions, perPageOptions }: RolesIndexProps) {
  const { toast } = useToast()
  const { hasPermission } = usePermissions()
  const [searchTerm, setSearchTerm] = useState(filters?.search ?? '')
  const [selectedPermissionGroup, setSelectedPermissionGroup] = useState(filters?.permission_group ?? 'all')
  const [sortBy, setSortBy] = useState(filters?.sort ?? 'name')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>(filters?.direction ?? 'asc')
  const [deleteConfirmation, setDeleteConfirmation] = useState<{ id: number; name: string } | null>(null)

  const availablePerPageOptions = useMemo(() => (
    perPageOptions?.length ? perPageOptions : [10, 15, 25, 50]
  ), [perPageOptions])

  const resolvedPerPage = useMemo(() => {
    const candidate = filters?.per_page ?? roles?.per_page
    if (typeof candidate === 'number' && availablePerPageOptions.includes(candidate)) {
      return candidate
    }

    return availablePerPageOptions[0] ?? 15
  }, [filters?.per_page, roles?.per_page, availablePerPageOptions])

  const [perPage, setPerPage] = useState<string>(() => String(resolvedPerPage))

  useEffect(() => {
    setPerPage(String(resolvedPerPage))
  }, [resolvedPerPage])

  const handleNavigate = useCallback((overrides: Partial<{
    search?: string
    permission_group?: string
    sort?: string
    direction?: 'asc' | 'desc'
    page?: number
    per_page?: number
  }> = {}) => {
    const params: Record<string, string | number | undefined> = {
      search: overrides.search !== undefined
        ? overrides.search
        : (searchTerm.trim() ? searchTerm.trim() : undefined),
      permission_group: overrides.permission_group !== undefined
        ? overrides.permission_group
        : (selectedPermissionGroup !== 'all' ? selectedPermissionGroup : undefined),
      sort: overrides.sort ?? sortBy,
      direction: overrides.direction ?? sortDirection,
      page: overrides.page,
      per_page: overrides.per_page !== undefined
        ? overrides.per_page
        : Number(perPage),
    }

    Object.keys(params).forEach((key) => {
      const value = params[key]
      if (
        value === undefined ||
        value === null ||
        value === '' ||
        (key === 'per_page' && (typeof value !== 'number' || !Number.isFinite(value) || value <= 0))
      ) {
        delete params[key]
      }
    })

    router.get('/roles', params, { preserveState: true, replace: false })
  }, [searchTerm, selectedPermissionGroup, sortBy, sortDirection, perPage])

  const handleSearch = (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value
    setSearchTerm(value)
    handleNavigate({ search: value.trim() ? value.trim() : undefined, page: 1 })
  }

  const handleSort = (column: string) => {
    let newDirection: 'asc' | 'desc' = 'asc'
    if (sortBy === column && sortDirection === 'asc') {
      newDirection = 'desc'
    }

    setSortBy(column)
    setSortDirection(newDirection)
    handleNavigate({ sort: column, direction: newDirection })
  }

  const handlePermissionGroupChange = (value: string) => {
    setSelectedPermissionGroup(value)
    handleNavigate({ permission_group: value !== 'all' ? value : undefined, page: 1 })
  }

  const handlePerPageChange = (value: string) => {
    setPerPage(value)
    const numericValue = Number(value)
    handleNavigate({ per_page: Number.isNaN(numericValue) ? undefined : numericValue, page: 1 })
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

  const permissionsPerRole = roles?.data?.map(role => role.permissions?.length ?? 0) ?? []
  const totalPermissionsAssigned = permissionsPerRole.reduce((sum, count) => sum + count, 0)
  const averagePermissions = roleCount > 0 ? Number((totalPermissionsAssigned / roleCount).toFixed(1)) : 0
  const adminRoles = roles?.data?.filter(role => role.name.toLowerCase().includes('admin')).length ?? 0

  const statsCards = [
    {
      title: 'Total Roles',
      value: roleCount,
      description: 'Defined access groups',
      accentClassName: 'text-indigo-600',
      helperClassName: 'bg-indigo-100 text-indigo-600',
      icon: <Shield className="h-5 w-5" />,
    },
    {
      title: 'Admin Variants',
      value: adminRoles,
      description: 'High-privilege profiles',
      accentClassName: 'text-rose-600',
      helperClassName: 'bg-rose-100 text-rose-600',
      icon: <Shield className="h-5 w-5" />,
    },
    {
      title: 'Avg Permissions',
      value: averagePermissions,
      description: 'Per role on average',
      accentClassName: 'text-emerald-600',
      helperClassName: 'bg-emerald-100 text-emerald-600',
      icon: <CheckCircle className="h-5 w-5" />,
    },
  ]

  const statsSection = (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {statsCards.map(card => (
        <Card key={card.title} className="border border-slate-200/70 shadow-sm transition hover:shadow-md dark:border-slate-800/70">
          <CardContent className="flex items-center justify-between gap-4 p-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{card.title}</p>
              <p className={`mt-2 text-2xl font-semibold ${card.accentClassName}`}>{card.value}</p>
              <p className="text-xs text-muted-foreground">{card.description}</p>
            </div>
            <div className={`flex h-10 w-10 items-center justify-center rounded-full ${card.helperClassName}`}>
              {card.icon}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )

  const headerActions = (
    <>
      {hasPermission('roles.export') && (
        <Button
          variant="outline"
          onClick={() => {
            const params = new URLSearchParams()
            if (searchTerm.trim()) {
              params.set('search', searchTerm.trim())
            }
            if (selectedPermissionGroup !== 'all') {
              params.set('permission_group', selectedPermissionGroup)
            }
            if (sortBy) {
              params.set('sort', sortBy)
            }
            if (sortDirection) {
              params.set('direction', sortDirection)
            }

            const query = params.toString()
            window.location.href = query ? `/roles/export/csv?${query}` : '/roles/export/csv'
          }}
        >
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
    </>
  )

  const tableHeaderExtras = (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative w-[260px] max-w-full">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by name..."
          value={searchTerm}
          onChange={handleSearch}
          className="pl-10"
        />
      </div>
      <Select value={selectedPermissionGroup} onValueChange={handlePermissionGroupChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Permission group" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All groups</SelectItem>
          {(permissionGroupOptions ?? []).map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <div className="flex items-center gap-1 text-sm text-muted-foreground">
        <span className="hidden sm:inline">Rows</span>
        <Select value={perPage} onValueChange={handlePerPageChange}>
          <SelectTrigger className="w-[110px]">
            <SelectValue placeholder="Per page" />
          </SelectTrigger>
          <SelectContent>
            {availablePerPageOptions.map((option) => (
              <SelectItem key={option} value={String(option)}>
                {option} / page
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )

  return (
    <>
      <ListPageLayout
        headTitle="Roles"
        title="Role Management"
        description="Manage system roles and permissions"
        breadcrumbs={breadcrumbs}
        actions={headerActions}
        stats={statsSection}
        tableTitle="Role Directory"
        tableDescription={`${roleCount} total role${roleCount === 1 ? '' : 's'} in system`}
        tableHeaderExtras={tableHeaderExtras}
        pagination={
          <InertiaPagination
            from={roles?.from}
            to={roles?.to}
            total={roleCount}
              links={roles?.links}
            currentPage={currentPage}
            lastPage={totalPages}
            className="mt-0 border-t bg-muted/30 p-4"
          />
        }
      >
        <Table>
          <TableHeader>
            <TableRow className="sticky top-0 z-50 bg-background border-b">
              <TableHead className="w-12 bg-background text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground">No.</TableHead>
              <TableHead
                className="cursor-pointer select-none bg-background transition-colors hover:bg-muted/70"
                onClick={() => handleSort('name')}
              >
                <div className="flex items-center">
                  Name <SortIcon column="name" />
                </div>
              </TableHead>
              <TableHead className="bg-background">Permissions</TableHead>
              <TableHead
                className="cursor-pointer select-none bg-background transition-colors hover:bg-muted/70"
                onClick={() => handleSort('created_at')}
              >
                <div className="flex items-center">
                  Created <SortIcon column="created_at" />
                </div>
              </TableHead>
              <TableHead className="bg-background text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {roles?.data && roles.data.length > 0 ? (
              roles.data.map((role, index) => {
                const rowNumber = (roles.from ?? 1) + index

                return (
                  <TableRow key={role.id} className="hover:bg-muted/50">
                    <TableCell className="w-12 text-center text-sm font-semibold text-muted-foreground">{rowNumber}</TableCell>
                    <TableCell className="font-medium">
                      <Badge className={`flex items-center gap-1 w-fit ${getRoleBadgeColor(role.name)}`}>
                        <Shield className="h-3 w-3" />
                        {role.name.charAt(0).toUpperCase() + role.name.slice(1)}
                      </Badge>
                    </TableCell>
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
                          <span className="text-sm text-muted-foreground">No permissions</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
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
                            className="text-red-600 hover:bg-red-50 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="py-16">
                  <div className="flex flex-col items-center justify-center text-center">
                    <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-muted/50">
                      <Shield className="h-10 w-10 text-muted-foreground" />
                    </div>
                    <h3 className="mb-2 text-xl font-semibold">No roles found</h3>
                    <p className="mb-6 max-w-md text-muted-foreground">
                      {searchTerm
                        ? `No roles match "${searchTerm}". Try adjusting your search terms.`
                        : 'Get started by adding your first role to the system. Manage access and permissions effectively.'
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
      </ListPageLayout>

      <DeleteConfirmationDialog
        open={!!deleteConfirmation}
        onOpenChange={(open) => !open && setDeleteConfirmation(null)}
        title="Delete Role"
        description="Are you sure you want to delete this role? This action cannot be undone."
        itemName={deleteConfirmation?.name}
        onConfirm={confirmDelete}
      />
    </>
  )
}

