import { Link } from '@inertiajs/react'
import { ArrowLeft, SquarePen, Trash2, MapPin, Landmark, ScrollText } from 'lucide-react'
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

interface Woreda {
  id: number
  name: string
  zone: {
    id: number
    name: string
    region: {
      id: number
      name: string
    }
  }
}

interface Place {
  id: number
  name: string
  code: string
  woreda_id: number
  woreda: Woreda
  latitude: number
  longitude: number
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

interface PlacesShowProps {
  place: Place
  activityLogs: ActivityLog[]
}

export default function PlacesShow({ place, activityLogs }: PlacesShowProps) {
  const { toast } = useToast()
  const { hasPermission } = usePermissions()
  const [deleteConfirmation, setDeleteConfirmation] = useState<{ id: number; name: string } | null>(null)

  const handleDelete = () => {
    setDeleteConfirmation({ id: place.id, name: place.name })
  }

  const confirmDelete = () => {
    if (!deleteConfirmation) return
    router.delete(route('places.destroy', deleteConfirmation.id), {
      onSuccess: () => {
        toast({ title: 'Success', description: 'Place deleted successfully', variant: 'success' })
        setDeleteConfirmation(null)
      },
      onError: () => {
        toast({ title: 'Error', description: 'Failed to delete place', variant: 'destructive' })
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
          <Link href={route('places.index')}>
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">Place: {place.name}</h1>
        </div>
        <div className="flex gap-2">
          {hasPermission('places.edit') && (
            <Link href={route('places.edit', place.id)}>
              <Button variant="outline">
                <SquarePen className="mr-2 h-4 w-4" /> Edit Place
              </Button>
            </Link>
          )}
          {hasPermission('places.destroy') && (
            <Button variant="destructive" onClick={handleDelete}>
              <Trash2 className="mr-2 h-4 w-4" /> Delete Place
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Basic Information Card */}
        <Card className="lg:col-span-2">
          <CardHeader className="border-b">
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" /> Basic Information
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 p-6 md:grid-cols-2">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Name</p>
              <p className="text-base">{place.name}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Code</p>
              <p className="text-base">{place.code || 'N/A'}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Woreda</p>
              <Link href={route('woredas.show', place.woreda.id)} className="text-primary hover:underline">
                <p className="text-base">{place.woreda.name}</p>
              </Link>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Zone</p>
              <Link href={route('zones.show', place.woreda.zone.id)} className="text-primary hover:underline">
                <p className="text-base">{place.woreda.zone.name}</p>
              </Link>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Region</p>
              <Link href={route('regions.show', place.woreda.zone.region.id)} className="text-primary hover:underline">
                <p className="text-base">{place.woreda.zone.region.name}</p>
              </Link>
            </div>
            <div className="space-y-1 md:col-span-2">
              <p className="text-sm font-medium text-muted-foreground">Description</p>
              <p className="text-base">{place.description || 'No description provided.'}</p>
            </div>
          </CardContent>
        </Card>

        {/* Quick Info Sidebar */}
        <Card className="lg:col-span-1">
          <CardHeader className="border-b">
            <CardTitle className="flex items-center gap-2">
              <Landmark className="h-5 w-5" /> Quick Info
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 p-6">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Location Hierarchy</p>
              <div className="space-y-1">
                <Badge variant="outline">{place.woreda.zone.region.name}</Badge>
                <Badge variant="outline">{place.woreda.zone.name}</Badge>
                <Badge variant="outline">{place.woreda.name}</Badge>
              </div>
            </div>
            {(place.latitude || place.longitude) && (
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Coordinates</p>
                <p className="text-sm text-muted-foreground">
                  {place.latitude && place.longitude
                    ? `${place.latitude}, ${place.longitude}`
                    : 'Not specified'
                  }
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Location Details Card */}
        <Card className="lg:col-span-3">
          <CardHeader className="border-b">
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" /> Location Details
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Region</p>
                <Link href={route('regions.show', place.woreda.zone.region.id)} className="text-primary hover:underline">
                  <p className="text-base">{place.woreda.zone.region.name}</p>
                </Link>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Zone</p>
                <Link href={route('zones.show', place.woreda.zone.id)} className="text-primary hover:underline">
                  <p className="text-base">{place.woreda.zone.name}</p>
                </Link>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Woreda</p>
                <Link href={route('woredas.show', place.woreda.id)} className="text-primary hover:underline">
                  <p className="text-base">{place.woreda.name}</p>
                </Link>
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
              <p className="text-base">{formatDate(place.created_at)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Last Updated At</p>
              <p className="text-base">{formatDate(place.updated_at)}</p>
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

PlacesShow.layout = (page: React.ReactNode) => <AppLayout children={page} />
