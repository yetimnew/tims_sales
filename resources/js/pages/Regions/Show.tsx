import { useState } from 'react'
import { Link, router } from '@inertiajs/react'
import { ArrowLeft, Trash2, SquarePen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { DeleteConfirmationDialog } from '@/components/delete-confirmation-dialog'
import { ActivityLogTable } from '@/components/activity-log-table'
import { useToast } from '@/hooks/use-toast'
import { usePermissions } from '@/hooks/use-permissions'
import AppLayout from '@/layouts/app-layout'

interface Region {
  id: number
  name: string
  created_at: string
  updated_at: string
}

interface ActivityLog {
  id: number
  event: string
  description?: string
  created_at: string
  causer?: { name: string }
  properties?: Record<string, any>
}

interface RegionShowProps {
  region: Region
  activityLogs: ActivityLog[]
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleString()
}

export default function RegionsShow({ region, activityLogs }: RegionShowProps) {
  const { toast } = useToast()
  const { hasPermission } = usePermissions()
  const [deleteConfirmation, setDeleteConfirmation] = useState(false)

  const handleDelete = () => {
    router.delete(route('regions.destroy', region.id), {
      onSuccess: () => {
        toast({ title: 'Success', description: 'Region deleted successfully', variant: 'success' })
      },
      onError: () => {
        toast({ title: 'Error', description: 'Failed to delete region', variant: 'destructive' })
      },
    })
  }

  return (
    <>
      <div className="flex h-full flex-1 flex-col gap-6 overflow-auto p-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href={route('regions.index')}>
              <Button variant="outline" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <h1 className="text-2xl font-bold">{region.name}</h1>
          </div>
          <div className="flex gap-2">
            {hasPermission('regions.edit') && (
              <Link href={route('regions.edit', region.id)}>
                <Button className="flex items-center gap-2">
                  <SquarePen className="h-4 w-4" />
                  Edit
                </Button>
              </Link>
            )}
            {hasPermission('regions.destroy') && (
              <Button
                variant="destructive"
                onClick={() => setDeleteConfirmation(true)}
                className="flex items-center gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </Button>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="col-span-2 space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader className="border-b">
                <h2 className="text-lg font-semibold">Basic Information</h2>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Region Name</p>
                  <p className="mt-1 font-semibold">{region.name}</p>
                </div>
              </CardContent>
            </Card>

            {/* Record Information */}
            <Card>
              <CardHeader className="border-b">
                <h2 className="text-lg font-semibold">Record Information</h2>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Created</p>
                  <p className="mt-1">{formatDate(region.created_at)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Last Updated</p>
                  <p className="mt-1">{formatDate(region.updated_at)}</p>
                </div>
              </CardContent>
            </Card>

            {/* Activity Log */}
            <Card>
              <CardHeader className="border-b">
                <h2 className="text-lg font-semibold">Activity Log</h2>
              </CardHeader>
              <CardContent className="pt-6">
                <ActivityLogTable logs={activityLogs} />
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Sidebar */}
          <div>
            <Card className="sticky top-4">
              <CardHeader className="border-b">
                <h2 className="text-lg font-semibold">Quick Info</h2>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Region</p>
                  <p className="mt-1 font-semibold">{region.name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">ID</p>
                  <p className="mt-1 font-mono text-sm">{region.id}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <DeleteConfirmationDialog
        open={deleteConfirmation}
        title="Delete Region"
        description="Are you sure you want to delete this region? This action cannot be undone."
        itemName={region.name}
        onConfirm={handleDelete}
        onCancel={() => setDeleteConfirmation(false)}
      />
    </>
  )
}

RegionsShow.layout = (page: React.ReactNode) => <AppLayout children={page} />
