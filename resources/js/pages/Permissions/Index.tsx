import { useState } from 'react'
import { Link, router, Head } from '@inertiajs/react'
import { Eye, Search, Shield, FileDown, ArrowUpDown, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { InertiaPagination } from '@/components/ui/pagination'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useToast } from '@/hooks/use-toast'
import { usePermissions } from '@/hooks/use-permissions'
import AppLayout from '@/layouts/app-layout'
import { Badge } from '@/components/ui/badge'
import { type BreadcrumbItem } from '@/types'

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Permissions',
        href: '/permissions',
    },
];

interface Permission {
  id: number
  name: string
  guard_name: string
  created_at: string
}

interface PermissionsIndexProps {
  permissions: {
    data: Permission[]
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

export default function PermissionsIndex({ permissions }: PermissionsIndexProps) {
  const { toast } = useToast()
  const { hasPermission } = usePermissions()
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState('name')
  const [sortDirection, setSortDirection] = useState('asc')

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchTerm(value)

    router.get('/permissions',
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

    router.get('/permissions',
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

  const permissionCount = permissions?.total || 0
  const perPage = permissions?.per_page || 20
  const currentPage = permissions?.current_page || 1
  const totalPages = permissions?.last_page || 1

  const getModuleBadgeColor = (module: string) => {
    switch (module.toLowerCase()) {
      case 'trucks':
        return 'bg-blue-500 text-white'
      case 'drivers':
        return 'bg-green-500 text-white'
      case 'maintenance':
        return 'bg-orange-500 text-white'
      case 'fuel':
        return 'bg-yellow-500 text-white'
      case 'financial':
        return 'bg-purple-500 text-white'
      case 'users':
        return 'bg-red-500 text-white'
      case 'roles':
        return 'bg-indigo-500 text-white'
      case 'permissions':
        return 'bg-pink-500 text-white'
      default:
        return 'bg-gray-500 text-white'
    }
  }

  const getActionBadgeColor = (action: string) => {
    switch (action.toLowerCase()) {
      case 'create':
        return 'bg-green-100 text-green-800'
      case 'read':
      case 'show':
        return 'bg-blue-100 text-blue-800'
      case 'update':
      case 'edit':
        return 'bg-yellow-100 text-yellow-800'
      case 'delete':
      case 'destroy':
        return 'bg-red-100 text-red-800'
      case 'export':
        return 'bg-purple-100 text-purple-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Permissions" />
      <div className="flex h-full flex-1 flex-col gap-6 overflow-hidden rounded-xl p-4">
        {/* Header Section */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Permission Management</h1>
            <p className="text-muted-foreground mt-2">Manage system permissions and access control</p>
          </div>
          <div className="flex gap-2">
            {hasPermission('permissions.export') && (
              <Button variant="outline" onClick={() => {
                window.location.href = '/permissions/export/csv';
              }}>
                <FileDown className="mr-2 h-4 w-4" />
                Export CSV
              </Button>
            )}
          </div>
        </div>

      <Card className="flex flex-1 flex-col overflow-hidden">
        <CardHeader className="relative border-b py-4">
          <div className="flex items-center justify-between">
            <div className="relative w-64">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search permissions..."
                value={searchTerm}
                onChange={handleSearch}
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
                      Permission <SortIcon column="name" />
                    </div>
                  </TableHead>
                  <TableHead onClick={() => handleSort('guard_name')} className="cursor-pointer select-none hover:bg-muted/70 transition-colors">
                    <div className="flex items-center">
                      Guard <SortIcon column="guard_name" />
                    </div>
                  </TableHead>
                  <TableHead>Module</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {permissions?.data && permissions.data.length > 0 ? (
                  permissions.data.map(permission => {
                    const [module, action] = permission.name.split('.')
                    return (
                      <TableRow key={permission.id}>
                        <TableCell className="font-medium">{permission.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{permission.guard_name}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={getModuleBadgeColor(module)}>
                            {module}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={getActionBadgeColor(action)}>
                            {action}
                          </Badge>
                        </TableCell>
                        <TableCell className="flex justify-end space-x-2">
                          {hasPermission('permissions.show') && (
                            <Link href={`/permissions/${permission.id}`}>
                              <Button variant="ghost" size="icon">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </Link>
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="py-16">
                      <div className="flex flex-col items-center justify-center text-center">
                        <div className="h-20 w-20 bg-muted/50 rounded-full flex items-center justify-center mb-6">
                          <Shield className="h-10 w-10 text-muted-foreground" />
                        </div>
                        <h3 className="text-xl font-semibold mb-2">No permissions found</h3>
                        <p className="text-muted-foreground">
                          {searchTerm
                            ? `No permissions match "${searchTerm}". Try adjusting your search terms.`
                            : "Permissions are managed automatically. Use roles to assign permissions to users."
                          }
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <InertiaPagination
            from={permissions?.from}
            to={permissions?.to}
            total={permissionCount}
            links={permissions?.links}
            currentPage={currentPage}
            lastPage={totalPages}
            className="mt-0 p-4 border-t bg-muted/30 flex-shrink-0"
          />
        </CardContent>
      </Card>
      </div>
    </AppLayout>
  )
}
