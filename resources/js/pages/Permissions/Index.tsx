import { useState, useMemo } from 'react'
import { Link, router } from '@inertiajs/react'
import { Eye, Search, Shield } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useToast } from '@/hooks/use-toast'
import { usePermissions } from '@/hooks/use-permissions'
import AppLayout from '@/layouts/app-layout'
import { Badge } from '@/components/ui/badge'

interface Permission {
  id: number
  name: string
  guard_name: string
  created_at: string
}

interface PermissionsIndexProps {
  permissions: {
    data: Permission[]
    meta: { total: number; per_page: number; current_page: number; last_page: number }
  }
}

export default function PermissionsIndex({ permissions }: PermissionsIndexProps) {
  const { toast } = useToast()
  const { hasPermission } = usePermissions()
  const [search, setSearch] = useState('')
  const [sortColumn, setSortColumn] = useState('name')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')

  const filtered = useMemo(() => {
    let items = permissions?.data || []

    if (search.trim()) {
      const query = search.toLowerCase()
      items = items.filter(
        item =>
          item.name.toLowerCase().includes(query) ||
          item.guard_name.toLowerCase().includes(query)
      )
    }

    items.sort((a, b) => {
      let aVal: any = a[sortColumn as keyof Permission]
      let bVal: any = b[sortColumn as keyof Permission]
      if (typeof aVal === 'string') {
        aVal = aVal?.toLowerCase()
        bVal = bVal?.toLowerCase()
      }
      return sortOrder === 'asc' ? (aVal > bVal ? 1 : -1) : aVal < bVal ? 1 : -1
    })

    return items
  }, [search, sortColumn, sortOrder, permissions])

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(column)
      setSortOrder('asc')
    }
  }

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
    <div className="flex h-full flex-1 flex-col gap-6 overflow-hidden rounded-xl p-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Permissions</h1>
          <p className="text-muted-foreground">Manage system permissions</p>
        </div>
        <div className="flex gap-2">
          {hasPermission('permissions.export') && (
            <Button variant="outline" onClick={() => router.get(route('permissions.export'))}>
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
                      Permission {sortColumn === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </div>
                  </TableHead>
                  <TableHead onClick={() => handleSort('guard_name')} className="cursor-pointer select-none hover:bg-muted/70 transition-colors">
                    <div className="flex items-center">
                      Guard {sortColumn === 'guard_name' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </div>
                  </TableHead>
                  <TableHead>Module</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length > 0 ? (
                  filtered.map(permission => {
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
                            <Link href={route('permissions.show', permission.id)}>
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
                    <TableCell colSpan={5} className="h-24 text-center">
                      No permissions found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Pagination */}
      {permissions.meta && permissions.meta.last_page > 1 && (
        <div className="flex items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex flex-1 justify-between sm:hidden">
            <Link
              href={permissions.meta.current_page > 1 ? route('permissions.index', { page: permissions.meta.current_page - 1, search, sort: sortColumn, direction: sortOrder }) : '#'}
              className={`relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 ${permissions.meta.current_page === 1 ? 'pointer-events-none opacity-50' : ''}`}
            >
              Previous
            </Link>
            <Link
              href={permissions.meta.current_page < permissions.meta.last_page ? route('permissions.index', { page: permissions.meta.current_page + 1, search, sort: sortColumn, direction: sortOrder }) : '#'}
              className={`relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 ${permissions.meta.current_page === permissions.meta.last_page ? 'pointer-events-none opacity-50' : ''}`}
            >
              Next
            </Link>
          </div>
          <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing <span className="font-medium">{(permissions.meta.current_page - 1) * permissions.meta.per_page + 1}</span> to{' '}
                <span className="font-medium">{Math.min(permissions.meta.current_page * permissions.meta.per_page, permissions.meta.total)}</span> of{' '}
                <span className="font-medium">{permissions.meta.total}</span> results
              </p>
            </div>
            <div>
              <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                {Array.from({ length: permissions.meta.last_page }, (_, i) => (
                  <Link
                    key={i + 1}
                    href={route('permissions.index', { page: i + 1, search, sort: sortColumn, direction: sortOrder })}
                    aria-current={permissions.meta.current_page === i + 1 ? 'page' : undefined}
                    className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                      permissions.meta.current_page === i + 1
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
  )
}

PermissionsIndex.layout = (page: React.ReactNode) => <AppLayout children={page} />
