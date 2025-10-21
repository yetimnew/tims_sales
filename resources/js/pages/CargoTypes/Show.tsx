import { useState } from 'react'
import { Link, router } from '@inertiajs/react'
import { ArrowLeft, Trash2, SquarePen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { DeleteConfirmationDialog } from '@/components/delete-confirmation-dialog'
import { ActivityLogTable } from '@/components/activity-log-table'
import { useToast } from '@/hooks/use-toast'
import { usePermissions } from '@/hooks/use-permissions'
import AppLayout from '@/layouts/app-layout'

interface CargoType {
  id: number
  name: string
  category: string
  weight_per_cubic_meter: number | null
  handling_requirements?: string
  safety_requirements?: string
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

interface CargoTypeShowProps {
  cargoType: CargoType
  activityLogs: ActivityLog[]
}

const getCategoryBadgeColor = (category: string) => {
  const colors: Record<string, string> = {
    Construction: 'bg-blue-100 text-blue-800',
    Agricultural: 'bg-green-100 text-green-800',
    Industrial: 'bg-orange-100 text-orange-800',
  }
  return colors[category] || 'bg-gray-100 text-gray-800'
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleString()
}

export default function CargoTypesShow({ cargoType, activityLogs }: CargoTypeShowProps) {
  const { toast } = useToast()
  const { hasPermission } = usePermissions()
  const [deleteConfirmation, setDeleteConfirmation] = useState(false)

  const handleDelete = () => {
    router.delete(route('cargo-types.destroy', cargoType.id), {
      onSuccess: () => {
        toast({
          title: 'Success',
          description: 'Cargo type deleted successfully',
          variant: 'success',
        })
      },
      onError: () => {
        toast({
          title: 'Error',
          description: 'Failed to delete cargo type',
          variant: 'destructive',
        })
      },
    })
  }

  return (
    <>
      <div className="flex h-full flex-1 flex-col gap-6 overflow-auto p-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href={route('cargo-types.index')}>
              <Button variant="outline" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold">{cargoType.name}</h1>
              <p className="text-muted-foreground">{cargoType.category}</p>
            </div>
          </div>
          <div className="flex gap-2">
            {hasPermission('cargo-types.edit') && (
              <Link href={route('cargo-types.edit', cargoType.id)}>
                <Button className="flex items-center gap-2">
                  <SquarePen className="h-4 w-4" />
                  Edit
                </Button>
              </Link>
            )}
            {hasPermission('cargo-types.destroy') && (
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
          {/* Left Column - Main Details */}
          <div className="col-span-2 space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader className="border-b">
                <h2 className="text-lg font-semibold">Basic Information</h2>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Category</p>
                  <Badge className={`${getCategoryBadgeColor(cargoType.category)} mt-1`}>
                    {cargoType.category}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Weight per Cubic Meter</p>
                  <p className="mt-1">{cargoType.weight_per_cubic_meter || 'Not specified'}</p>
                </div>
              </CardContent>
            </Card>

            {/* Handling Requirements */}
            {cargoType.handling_requirements && (
              <Card>
                <CardHeader className="border-b">
                  <h2 className="text-lg font-semibold">Handling Requirements</h2>
                </CardHeader>
                <CardContent className="pt-6">
                  <p className="whitespace-pre-wrap">{cargoType.handling_requirements}</p>
                </CardContent>
              </Card>
            )}

            {/* Safety Requirements */}
            {cargoType.safety_requirements && (
              <Card>
                <CardHeader className="border-b">
                  <h2 className="text-lg font-semibold">Safety Requirements</h2>
                </CardHeader>
                <CardContent className="pt-6">
                  <p className="whitespace-pre-wrap">{cargoType.safety_requirements}</p>
                </CardContent>
              </Card>
            )}

            {/* Record Information */}
            <Card>
              <CardHeader className="border-b">
                <h2 className="text-lg font-semibold">Record Information</h2>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Created</p>
                  <p className="mt-1">{formatDate(cargoType.created_at)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Last Updated</p>
                  <p className="mt-1">{formatDate(cargoType.updated_at)}</p>
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
                  <p className="text-sm font-medium text-muted-foreground">Cargo Type</p>
                  <p className="mt-1 font-semibold">{cargoType.name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Category Badge</p>
                  <Badge className={`${getCategoryBadgeColor(cargoType.category)} mt-1`}>
                    {cargoType.category}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">ID</p>
                  <p className="mt-1 font-mono text-sm">{cargoType.id}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <DeleteConfirmationDialog
        open={deleteConfirmation}
        title="Delete Cargo Type"
        description="Are you sure you want to delete this cargo type? This action cannot be undone."
        itemName={cargoType.name}
        onConfirm={handleDelete}
        onCancel={() => setDeleteConfirmation(false)}
      />
    </>
  )
}

CargoTypesShow.layout = (page: React.ReactNode) => <AppLayout children={page} />
