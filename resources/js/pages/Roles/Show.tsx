import { Link } from '@inertiajs/react'
import { ArrowLeft, SquarePen, Trash2, Shield, Users, ScrollText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { DeleteConfirmationDialog } from '@/components/delete-confirmation-dialog'
import { ActivityLogTable } from '@/components/activity-log-table'
import { useToast } from '@/hooks/use-toast'
import { usePermissions } from '@/hooks/use-permissions'
import AppLayout from '@/layouts/app-layout'
import { useState } from 'react'
import { router } from '@inertiajs/react'

interface Permission {
  id: number
  name: string
  guard_name: string
}

interface User {
  id: number
  name: string
  email: string
}

interface Role {
  id: number
  name: string
  description: string
  permissions: Permission[]
  users: User[]
  created_at: string
  updated_at: string
}

interface ActivityLog {
  id: number
  log_name: string
  description: string
  subject_type: string
  subject_id: number
  causer_type: string
  causer_id: number
  properties: Record<string, any>
  created_at: string
}

interface RolesShowProps {
  role: Role
  activityLogs: ActivityLog[]
}

export default function RolesShow({ role, activityLogs }: RolesShowProps) {
  const { toast } = useToast()
  const { hasPermission } = usePermissions()
  const [deleteConfirmation, setDeleteConfirmation] = useState<{ id: number; name: string } | null>(null)

  const handleDelete = () => {
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

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' }
    return new Date(dateString).toLocaleDateString(undefined, options)
  }

  const getRoleBadgeColor = (roleName: string) => {
    switch (roleName.toLowerCase()) {
      case 'admin':
        return 'bg-red-500 text-white'
      case 'manager':
        return 'bg-blue-500 text-white'
      case 'driver':
        return 'bg-green-500 text-white'
      case 'user':
        return 'bg-gray-500 text-white'
      default:
        return 'bg-purple-500 text-white'
    }
  }

  // Group permissions by module
  const groupedPermissions = role.permissions.reduce((acc, permission) => {
    const module = permission.name.split('.')[0]
    if (!acc[module]) {
      acc[module] = []
    }
    acc[module].push(permission)
    return acc
  }, {} as Record<string, Permission[]>)

  return (
    <div className="flex h-full flex-1 flex-col gap-6 overflow-auto p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={route('roles.index')}>
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">Role: {role.name}</h1>
        </div>
        <div className="flex gap-2">
          {hasPermission('roles.edit') && (
            <Link href={route('roles.edit', role.id)}>
              <Button variant="outline">
                <SquarePen className="mr-2 h-4 w-4" /> Edit Role
              </Button>
            </Link>
          )}
          {hasPermission('roles.destroy') && (
            <Button variant="destructive" onClick={handleDelete}>
              <Trash2 className="mr-2 h-4 w-4" /> Delete Role
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Basic Information Card */}
        <Card className="lg:col-span-2">
          <CardHeader className="border-b">
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" /> Basic Information
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 p-6 md:grid-cols-2">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Name</p>
              <p className="text-base">{role.name}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Role ID</p>
              <Badge variant="outline">#{role.id}</Badge>
            </div>
            <div className="space-y-1 md:col-span-2">
              <p className="text-sm font-medium text-muted-foreground">Description</p>
              <p className="text-base">{role.description || 'No description provided.'}</p>
            </div>
          </CardContent>
        </Card>

        {/* Quick Info Sidebar */}
        <Card className="lg:col-span-1">
          <CardHeader className="border-b">
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" /> Quick Info
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 p-6">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Role Type</p>
              <Badge className={getRoleBadgeColor(role.name)}>{role.name}</Badge>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Permissions Count</p>
              <Badge variant="outline">{role.permissions.length}</Badge>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Users Count</p>
              <Badge variant="outline">{role.users.length}</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Permissions Card */}
        <Card className="lg:col-span-3">
          <CardHeader className="border-b">
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" /> Permissions
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {Object.keys(groupedPermissions).length > 0 ? (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {Object.entries(groupedPermissions).map(([module, modulePermissions]) => (
                  <Card key={module} className="p-4">
                    <h4 className="font-medium mb-3 capitalize">{module}</h4>
                    <div className="space-y-2">
                      {modulePermissions.map(permission => (
                        <div key={permission.id} className="flex items-center space-x-2">
                          <Badge variant="secondary" className="text-xs">
                            {permission.name.replace(`${module}.`, '')}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No permissions assigned to this role</p>
                {hasPermission('roles.edit') && (
                  <Link href={route('roles.edit', role.id)}>
                    <Button variant="outline" className="mt-4">
                      Assign Permissions
                    </Button>
                  </Link>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Users Card */}
        <Card className="lg:col-span-3">
          <CardHeader className="border-b">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" /> Users with this Role
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {role.users.length > 0 ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
                {role.users.map(user => (
                  <Link key={user.id} href={route('users.show', user.id)} className="block">
                    <Card className="hover:shadow-md transition-shadow">
                      <CardContent className="flex items-center gap-3 p-4">
                        <Users className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{user.name}</p>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No users assigned to this role</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Record Information Card */}
        <Card className="lg:col-span-3">
          <CardHeader className="border-b">
            <CardTitle className="flex items-center gap-2">
              <ScrollText className="h-5 w-5" /> Record Information
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 p-6 md:grid-cols-2">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Created At</p>
              <p className="text-base">{formatDate(role.created_at)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Last Updated At</p>
              <p className="text-base">{formatDate(role.updated_at)}</p>
            </div>
          </CardContent>
        </Card>

        {/* Activity Log Card */}
        <Card className="lg:col-span-3">
          <CardHeader className="border-b">
            <CardTitle className="flex items-center gap-2">
              <ScrollText className="h-5 w-5" /> Activity Log
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <ActivityLogTable activityLogs={activityLogs} />
          </CardContent>
        </Card>
      </div>

      <DeleteConfirmationDialog
        isOpen={!!deleteConfirmation}
        onClose={() => setDeleteConfirmation(null)}
        onConfirm={confirmDelete}
        itemName={deleteConfirmation?.name}
      />
    </div>
  )
}

RolesShow.layout = (page: React.ReactNode) => <AppLayout children={page} />
