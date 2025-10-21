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
}

interface Zone {
  id: number
  name: string
  region_id: number
  region?: Region
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

interface ZoneShowProps {
  zone: Zone
  activityLogs: ActivityLog[]
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleString()
}

export default function ZonesShow({ zone, activityLogs }: ZoneShowProps) {
  const { toast } = useToast()
  const { hasPermission } = usePermissions()
  const [deleteConfirmation, setDeleteConfirmation] = useState(false)

  const handleDelete = () => {
    router.delete(route('zones.destroy', zone.id), {
      onSuccess: () => {
        toast({ title: 'Success', description: 'Zone deleted successfully', variant: 'success' })
      },
      onError: () => {
        toast({ title: 'Error', description: 'Failed to delete zone', variant: 'destructive' })
      },
    })
  }

  return (
    <>
      <div className="flex h-full flex-1 flex-col gap-6 overflow-auto p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href={route('zones.index')}>
              <Button variant="outline" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold">{zone.name}</h1>
              <p className="text-muted-foreground">{zone.region?.name || 'No Region'}</p>
            </div>
          </div>
          <div className="flex gap-2">
            {hasPermission('zones.edit') && (
              <Link href={route('zones.edit', zone.id)}>
                <Button className="flex items-center gap-2">
                  <SquarePen className="h-4 w-4" />
                  Edit
                </Button>
              </Link>
            )}
            {hasPermission('zones.destroy') && (
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

        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 space-y-6">
            <Card>
              <CardHeader className="border-b">
                <h2 className="text-lg font-semibold">Zone Information</h2>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Zone Name</p>
                  <p className="mt-1 font-semibold">{zone.name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Region</p>
                  <p className="mt-1">{zone.region?.name || 'Not assigned'}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="border-b">
                <h2 className="text-lg font-semibold">Record Information</h2>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Created</p>
                  <p className="mt-1">{formatDate(zone.created_at)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Last Updated</p>
                  <p className="mt-1">{formatDate(zone.updated_at)}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="border-b">
                <h2 className="text-lg font-semibold">Activity Log</h2>
              </CardHeader>
              <CardContent className="pt-6">
                <ActivityLogTable activityLogs={activityLogs} />
              </CardContent>
            </Card>
          </div>

          <div>
            <Card className="sticky top-4">
              <CardHeader className="border-b">
                <h2 className="text-lg font-semibold">Quick Info</h2>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Zone</p>
                  <p className="mt-1 font-semibold">{zone.name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Region</p>
                  <p className="mt-1 text-sm">{zone.region?.name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">ID</p>
                  <p className="mt-1 font-mono text-sm">{zone.id}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <DeleteConfirmationDialog
        open={deleteConfirmation}
        title="Delete Zone"
        description="Are you sure you want to delete this zone? This action cannot be undone."
        itemName={zone.name}
        onConfirm={handleDelete}
        onCancel={() => setDeleteConfirmation(false)}
      />
    </>
  )
}

ZonesShow.layout = (page: React.ReactNode) => <AppLayout children={page} />
