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

interface StatusTypesShowProps {
  statusType: StatusType
  activityLogs: ActivityLog[]
}

export default function StatusTypesShow({ statusType, activityLogs }: StatusTypesShowProps) {
  const { toast } = useToast()
  const { hasPermission } = usePermissions()
  const [deleteConfirmation, setDeleteConfirmation] = useState<{ id: number; name: string } | null>(null)

  const handleDelete = () => {
    setDeleteConfirmation({ id: statusType.id, name: statusType.name })
  }

  const confirmDelete = () => {
    if (!deleteConfirmation) return
    router.delete(route('status-types.destroy', deleteConfirmation.id), {
      onSuccess: () => {
        toast({ title: 'Success', description: 'Status type deleted successfully', variant: 'success' })
        setDeleteConfirmation(null)
      },
      onError: () => {
        toast({ title: 'Error', description: 'Failed to delete status type', variant: 'destructive' })
      },
    })
  }

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' }
    return new Date(dateString).toLocaleDateString(undefined, options)
  }

  return (
    <div className="flex h-full flex-1 flex-col gap-6 overflow-auto p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={route('status-types.index')}>
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">Status Type: {statusType.name}</h1>
        </div>
        <div className="flex gap-2">
          {hasPermission('status-types.edit') && (
            <Link href={route('status-types.edit', statusType.id)}>
              <Button variant="outline">
                <SquarePen className="mr-2 h-4 w-4" /> Edit Status Type
              </Button>
            </Link>
          )}
          {hasPermission('status-types.destroy') && (
            <Button variant="destructive" onClick={handleDelete}>
              <Trash2 className="mr-2 h-4 w-4" /> Delete Status Type
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
              <p className="text-base">{statusType.name}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Status Type ID</p>
              <Badge variant="outline">#{statusType.id}</Badge>
            </div>
            <div className="space-y-1 md:col-span-2">
              <p className="text-sm font-medium text-muted-foreground">Description</p>
              <p className="text-base">{statusType.description || 'No description provided.'}</p>
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
              <p className="text-sm font-medium text-muted-foreground">Status Type</p>
              <Badge variant="default">{statusType.name}</Badge>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Record ID</p>
              <Badge variant="outline">#{statusType.id}</Badge>
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
              <p className="text-base">{formatDate(statusType.created_at)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Last Updated At</p>
              <p className="text-base">{formatDate(statusType.updated_at)}</p>
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

StatusTypesShow.layout = (page: React.ReactNode) => <AppLayout children={page} />
