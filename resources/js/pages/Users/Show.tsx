import { Link } from '@inertiajs/react'
import { ArrowLeft, SquarePen, Trash2, User, Shield, ScrollText, Mail, Phone, Calendar } from 'lucide-react'
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

interface Role {
  id: number
  name: string
}

interface User {
  id: number
  name: string
  email: string
  email_verified_at: string
  created_at: string
  updated_at: string
  roles: Role[]
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

interface UsersShowProps {
  user: User
  activityLogs: ActivityLog[]
}

export default function UsersShow({ user, activityLogs }: UsersShowProps) {
  const { toast } = useToast()
  const { hasPermission } = usePermissions()
  const [deleteConfirmation, setDeleteConfirmation] = useState<{ id: number; name: string } | null>(null)

  const handleDelete = () => {
    setDeleteConfirmation({ id: user.id, name: user.name })
  }

  const confirmDelete = () => {
    if (!deleteConfirmation) return
    router.delete(route('users.destroy', deleteConfirmation.id), {
      onSuccess: () => {
        toast({ title: 'Success', description: 'User deleted successfully', variant: 'success' })
        setDeleteConfirmation(null)
      },
      onError: () => {
        toast({ title: 'Error', description: 'Failed to delete user', variant: 'destructive' })
      },
    })
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Not verified'
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

  return (
    <div className="flex h-full flex-1 flex-col gap-6 overflow-auto p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={route('users.index')}>
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">User: {user.name}</h1>
        </div>
        <div className="flex gap-2">
          {hasPermission('users.edit') && (
            <Link href={route('users.edit', user.id)}>
              <Button variant="outline">
                <SquarePen className="mr-2 h-4 w-4" /> Edit User
              </Button>
            </Link>
          )}
          {hasPermission('users.destroy') && (
            <Button variant="destructive" onClick={handleDelete}>
              <Trash2 className="mr-2 h-4 w-4" /> Delete User
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Basic Information Card */}
        <Card className="lg:col-span-2">
          <CardHeader className="border-b">
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" /> Basic Information
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 p-6 md:grid-cols-2">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Name</p>
              <p className="text-base">{user.name}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Email</p>
              <p className="text-base">{user.email}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Email Verified</p>
              <Badge variant={user.email_verified_at ? 'default' : 'secondary'}>
                {user.email_verified_at ? 'Verified' : 'Not Verified'}
              </Badge>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Verification Date</p>
              <p className="text-base">{formatDate(user.email_verified_at)}</p>
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
              <p className="text-sm font-medium text-muted-foreground">User ID</p>
              <Badge variant="outline">#{user.id}</Badge>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Account Status</p>
              <Badge variant={user.email_verified_at ? 'default' : 'secondary'}>
                {user.email_verified_at ? 'Active' : 'Pending'}
              </Badge>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Roles</p>
              <div className="space-y-1">
                {user.roles.length > 0 ? (
                  user.roles.map(role => (
                    <Badge key={role.id} className={getRoleBadgeColor(role.name)}>
                      {role.name}
                    </Badge>
                  ))
                ) : (
                  <Badge variant="outline">No roles assigned</Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Roles & Permissions Card */}
        <Card className="lg:col-span-3">
          <CardHeader className="border-b">
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" /> Roles & Permissions
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {user.roles.length > 0 ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
                {user.roles.map(role => (
                  <Link key={role.id} href={route('roles.show', role.id)} className="block">
                    <Card className="hover:shadow-md transition-shadow">
                      <CardContent className="flex items-center gap-3 p-4">
                        <Shield className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{role.name}</p>
                          <Badge className={getRoleBadgeColor(role.name)} variant="secondary">
                            Role
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No roles assigned to this user</p>
                {hasPermission('users.edit') && (
                  <Link href={route('users.edit', user.id)}>
                    <Button variant="outline" className="mt-4">
                      Assign Roles
                    </Button>
                  </Link>
                )}
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
              <p className="text-base">{formatDate(user.created_at)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Last Updated At</p>
              <p className="text-base">{formatDate(user.updated_at)}</p>
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

UsersShow.layout = (page: React.ReactNode) => <AppLayout children={page} />
