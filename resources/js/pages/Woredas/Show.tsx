import { Link, router } from '@inertiajs/react'
import { ArrowLeft, SquarePen, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DeleteConfirmationDialog } from '@/components/delete-confirmation-dialog'
import { ActivityLogTable } from '@/components/activity-log-table'
import { useToast } from '@/hooks/use-toast'
import { useState } from 'react'
import AppLayout from '@/layouts/app-layout'

interface Zone {
  id: number
  name: string
}

interface Place {
  id: number
  name: string
}

interface Woreda {
  id: number
  name: string
  code?: string
  zone_id: number
  zone?: Zone
  description?: string
  places_count?: number
  places?: Place[]
  created_at: string
  updated_at: string
}

interface ActivityLog {
  id: number
  description: string
  subject_id: number
  subject_type: string
  causer_id: number | null
  causer_type: string | null
  properties: any
  created_at: string
  causer?: { name: string }
}

interface WoredasShowProps {
  woreda: Woreda
  activityLogs: ActivityLog[]
}

export default function WoredasShow({ woreda, activityLogs }: WoredasShowProps) {
  const { toast } = useToast()
  const [deleteConfirmation, setDeleteConfirmation] = useState(false)

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const handleDelete = () => {
    setDeleteConfirmation(true)
  }

  const confirmDelete = () => {
    router.delete(route('woredas.destroy', woreda.id), {
      onSuccess: () => {
        toast({ title: 'Success', description: 'Woreda deleted successfully', variant: 'success' })
      },
      onError: () => {
        toast({ title: 'Error', description: 'Failed to delete woreda', variant: 'destructive' })
      },
    })
  }

  return (
    <>
      <div className="flex h-full flex-1 flex-col gap-6 overflow-auto p-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href={route('woredas.index')}>
              <Button variant="outline" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold">{woreda.name}</h1>
              <p className="text-muted-foreground">{woreda.zone?.name || 'N/A'}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link href={route('woredas.edit', woreda.id)}>
                <SquarePen className="mr-2 h-4 w-4" />
                Edit
              </Link>
            </Button>
            <Button onClick={handleDelete} variant="destructive">
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {/* Main Details - 2 columns */}
          <div className="md:col-span-2 space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Name</p>
                    <p className="text-base font-semibold">{woreda.name}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Code</p>
                    <p className="text-base font-semibold">{woreda.code || 'N/A'}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Zone</p>
                  <p className="text-base font-semibold">
                    {woreda.zone ? (
                      <Link href={route('zones.show', woreda.zone.id)} className="text-primary hover:underline">
                        {woreda.zone.name}
                      </Link>
                    ) : (
                      'N/A'
                    )}
                  </p>
                </div>
                {woreda.description && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Description</p>
                    <p className="text-base">{woreda.description}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Record Information */}
            <Card>
              <CardHeader>
                <CardTitle>Record Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Created At</p>
                  <p className="text-base">{formatDate(woreda.created_at)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Last Updated</p>
                  <p className="text-base">{formatDate(woreda.updated_at)}</p>
                </div>
              </CardContent>
            </Card>

            {/* Activity Log */}
            {activityLogs && activityLogs.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Activity Log</CardTitle>
                </CardHeader>
                <CardContent>
                  <ActivityLogTable activityLogs={activityLogs} />
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar - 1 column */}
          <div className="space-y-6">
            {/* Quick Info */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Places Count</p>
                  <p className="text-2xl font-bold">{woreda.places_count || 0}</p>
                </div>
              </CardContent>
            </Card>

            {/* Places List */}
            {woreda.places && woreda.places.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Places ({woreda.places.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {woreda.places.map(place => (
                      <li key={place.id} className="flex items-center justify-between border-b pb-2 last:border-0">
                        <span>{place.name}</span>
                        <Link href={route('places.show', place.id)}>
                          <Button variant="ghost" size="sm">
                            View
                          </Button>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      <DeleteConfirmationDialog
        open={deleteConfirmation}
        onClose={() => setDeleteConfirmation(false)}
        onConfirm={confirmDelete}
        itemName={woreda.name}
        title="Delete Woreda"
        description="Are you sure you want to delete this woreda? This action cannot be undone."
      />
    </>
  )
}

WoredasShow.layout = (page: React.ReactNode) => <AppLayout children={page} />

