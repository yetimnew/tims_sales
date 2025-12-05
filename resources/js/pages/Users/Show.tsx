import { Link, Head } from '@inertiajs/react'
import { ArrowLeft, SquarePen, Trash2, User, Shield, ScrollText, MoreVertical, Send, RefreshCcw, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { DeleteConfirmationDialog } from '@/components/delete-confirmation-dialog'
import { ActivityLogTable } from '@/components/activity-log-table'
import { useToast } from '@/hooks/use-toast'
import { usePermissions } from '@/hooks/use-permissions'
import AppLayout from '@/layouts/app-layout'
import { useState } from 'react'
import { router } from '@inertiajs/react'
import { type BreadcrumbItem } from '@/types'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Users',
        href: '/users',
    },
    {
        title: 'Show',
        href: '#',
    },
];

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
    router.delete(`/users/${deleteConfirmation.id}`, {
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

  const formatDateTime = (dateString: string) => {
    if (!dateString) return 'Unknown date'
    return new Date(dateString).toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const roleBadgePalette: Record<string, string> = {
    admin: 'border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-900 dark:bg-indigo-950/40 dark:text-indigo-200',
    manager: 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-200',
    driver: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200',
    user: 'border-slate-200 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-200',
    default: 'border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-900 dark:bg-violet-950/40 dark:text-violet-200',
  }

  const getRoleBadgeClass = (roleName: string) => {
    return roleBadgePalette[roleName.toLowerCase()] ?? roleBadgePalette.default
  }

  const timelineEntries = [...activityLogs]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5)

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title={`User: ${user.name}`} />
      <div className="flex h-full flex-1 flex-col gap-6 overflow-auto p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              asChild
              className="border-slate-300 hover:bg-slate-100 dark:border-slate-600 dark:hover:bg-slate-800"
            >
              <Link href="/users">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <h1 className="text-2xl font-bold">User: {user.name}</h1>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2 border-slate-300 hover:bg-slate-100 dark:border-slate-600 dark:hover:bg-slate-800">
                <MoreVertical className="h-4 w-4" />
                Actions
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Quick Actions</DropdownMenuLabel>
              {hasPermission('users.edit') && (
                <DropdownMenuItem onSelect={() => router.visit(`/users/${user.id}/edit`)}>
                  <SquarePen className="h-4 w-4" />
                  Edit user
                </DropdownMenuItem>
              )}
              <DropdownMenuItem disabled>
                <Send className="h-4 w-4" />
                Resend invite (pending)
              </DropdownMenuItem>
              <DropdownMenuItem disabled>
                <RefreshCcw className="h-4 w-4" />
                Reset password link
              </DropdownMenuItem>
              {hasPermission('users.destroy') && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    variant="destructive"
                    onSelect={event => {
                      event.preventDefault()
                      handleDelete()
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete user
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-4">
        {/* Basic Information Card */}
        <Card className="xl:col-span-2">
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
        <Card className="xl:col-span-1">
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
                    <Badge key={role.id} variant="outline" className={`${getRoleBadgeClass(role.name)} border`}>
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

        {/* Recent Activity Timeline */}
        <Card className="xl:col-span-1">
          <CardHeader className="border-b">
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" /> Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {timelineEntries.length > 0 ? (
              <ul className="space-y-4">
                {timelineEntries.map((log, index) => (
                  <li key={log.id} className="relative pl-6">
                    {index < timelineEntries.length - 1 && (
                      <span className="absolute left-[9px] top-5 h-full w-px bg-slate-200 dark:bg-slate-700" aria-hidden="true" />
                    )}
                    <span className="absolute left-1.5 top-2 flex h-3 w-3 items-center justify-center rounded-full bg-indigo-500 dark:bg-indigo-400" aria-hidden="true" />
                    <div className="flex flex-col gap-1">
                      <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {log.description || 'Activity recorded'}
                      </span>
                      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                        <Badge variant="outline" className="border-slate-200 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-300">
                          {log.log_name}
                        </Badge>
                        <span>{formatDateTime(log.created_at)}</span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="rounded-md border border-dashed border-slate-300 px-4 py-6 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
                No recent activity recorded for this user.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Roles & Permissions Card */}
        <Card className="xl:col-span-4">
          <CardHeader className="border-b">
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" /> Roles & Permissions
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {user.roles.length > 0 ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
                {user.roles.map(role => (
                  <Link key={role.id} href={`/roles/${role.id}`} className="block">
                    <Card className="hover:shadow-md transition-shadow">
                      <CardContent className="flex items-center gap-3 p-4">
                        <Shield className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{role.name}</p>
                          <Badge variant="outline" className={`${getRoleBadgeClass(role.name)} border`}>
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
                  <Link href={`/users/${user.id}/edit`}>
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
        <Card className="xl:col-span-4">
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
        <Card className="xl:col-span-4">
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
      </div>

      <DeleteConfirmationDialog
        open={!!deleteConfirmation}
        onOpenChange={(open) => !open && setDeleteConfirmation(null)}
        title="Delete User"
        description="Are you sure you want to delete this user? This action cannot be undone."
        itemName={deleteConfirmation?.name}
        onConfirm={confirmDelete}
      />
    </AppLayout>
  )
}
