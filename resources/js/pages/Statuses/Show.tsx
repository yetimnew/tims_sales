import { Link } from '@inertiajs/react'
import { ArrowLeft, SquarePen, Trash2, Tag, ScrollText } from 'lucide-react'
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

interface StatusType {
  id: number
  name: string
}

interface Status {
  id: number
  name: string
  status_type_id: number
  statusType: StatusType
  description: string
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

interface StatusesShowProps {
  status: Status
  activityLogs: ActivityLog[]
}

export default function StatusesShow({ status, activityLogs }: StatusesShowProps) {
  const { toast } = useToast()
  const { hasPermission } = usePermissions()
  const [deleteConfirmation, setDeleteConfirmation] = useState<{ id: number; name: string } | null>(null)

  const handleDelete = () => {
    setDeleteConfirmation({ id: status.id, name: status.name })
  }

  const confirmDelete = () => {
    if (!deleteConfirmation) return
    router.delete(route('statuses.destroy', deleteConfirmation.id), {
      onSuccess: () => {
        toast({ title: 'Success', description: 'Status deleted successfully', variant: 'success' })
        setDeleteConfirmation(null)
      },
      onError: () => {
        toast({ title: 'Error', description: 'Failed to delete status', variant: 'destructive' })
      },
    })
  }

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' }
    return new Date(dateString).toLocaleDateString(undefined, options)
  }

  const getStatusTypeBadgeColor = (typeName: string) => {
    switch (typeName.toLowerCase()) {
      case 'truck':
        return 'bg-blue-500 text-white'
      case 'driver':
        return 'bg-green-500 text-white'
      case 'maintenance':
        return 'bg-orange-500 text-white'
      case 'operation':
        return 'bg-purple-500 text-white'
      default:
        return 'bg-gray-500 text-white'
    }
  }

  return (
    <div className="flex h-full flex-1 flex-col gap-6 overflow-auto p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={route('statuses.index')}>
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">Status: {status.name}</h1>
        </div>
        <div className="flex gap-2">
          {hasPermission('statuses.edit') && (
            <Link href={route('statuses.edit', status.id)}>
              <Button variant="outline">
                <SquarePen className="mr-2 h-4 w-4" /> Edit Status
              </Button>
            </Link>
          )}
          {hasPermission('statuses.destroy') && (
            <Button variant="destructive" onClick={handleDelete}>
              <Trash2 className="mr-2 h-4 w-4" /> Delete Status
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Basic Information Card */}
        <Card className="lg:col-span-2">
          <CardHeader className="border-b">
            <CardTitle className="flex items-center gap-2">
              <Tag className="h-5 w-5" /> Basic Information
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 p-6 md:grid-cols-2">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Name</p>
              <p className="text-base">{status.name}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Status ID</p>
              <Badge variant="outline">#{status.id}</Badge>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Status Type</p>
              <Link href={route('status-types.show', status.statusType.id)} className="text-primary hover:underline">
                <Badge className={getStatusTypeBadgeColor(status.statusType.name)}>
                  {status.statusType.name}
                </Badge>
              </Link>
            </div>
            <div className="space-y-1 md:col-span-2">
              <p className="text-sm font-medium text-muted-foreground">Description</p>
              <p className="text-base">{status.description || 'No description provided.'}</p>
            </div>
          </CardContent>
        </Card>

        {/* Quick Info Sidebar */}
        <Card className="lg:col-span-1">
          <CardHeader className="border-b">
            <CardTitle className="flex items-center gap-2">
              <Tag className="h-5 w-5" /> Quick Info
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 p-6">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Status Name</p>
              <Badge variant="default">{status.name}</Badge>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Status Type</p>
              <Badge className={getStatusTypeBadgeColor(status.statusType.name)}>
                {status.statusType.name}
              </Badge>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Record ID</p>
              <Badge variant="outline">#{status.id}</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Status Type Information Card */}
        <Card className="lg:col-span-3">
          <CardHeader className="border-b">
            <CardTitle className="flex items-center gap-2">
              <Tag className="h-5 w-5" /> Status Type Information
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Status Type</p>
                <Link href={route('status-types.show', status.statusType.id)} className="text-primary hover:underline">
                  <p className="text-base">{status.statusType.name}</p>
                </Link>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Type ID</p>
                <Badge variant="outline">#{status.statusType.id}</Badge>
              </div>
            </div>
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
              <p className="text-base">{formatDate(status.created_at)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Last Updated At</p>
              <p className="text-base">{formatDate(status.updated_at)}</p>
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

StatusesShow.layout = (page: React.ReactNode) => <AppLayout children={page} />
