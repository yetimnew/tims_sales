import { useForm } from '@inertiajs/react'
import { AlertCircle, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import AppLayout from '@/layouts/app-layout'

interface Place {
  id: number
  name: string
}

interface Distance {
  id: number
  from_place_id: number
  to_place_id: number
  distance_km: number
  estimated_time_hours: number
  fromPlace?: { name: string }
  toPlace?: { name: string }
}

interface DistancesEditProps {
  distance: Distance
  places: Place[]
}

export default function DistancesEdit({ distance, places }: DistancesEditProps) {
  const { toast } = useToast()
  const { data, setData, put, processing, errors } = useForm({
    from_place_id: distance.from_place_id.toString(),
    to_place_id: distance.to_place_id.toString(),
    distance_km: distance.distance_km.toString(),
    estimated_time_hours: distance.estimated_time_hours.toString(),
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    put(`/distances/${distance.id}`, {
      preserveScroll: true,
      onSuccess: () => {
        toast({
          title: '✅ Distance Updated',
          description: 'Distance record has been saved successfully.',
        })
      },
      onError: () => {
        toast({
          title: '❌ Update Failed',
          description: 'Failed to update distance record.',
          variant: 'destructive',
        })
      },
    })
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" onClick={() => window.history.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Edit Distance</h1>
            <p className="text-muted-foreground">
              Update distance information between {distance.fromPlace?.name} and {distance.toPlace?.name}
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Distance Information</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {Object.keys(errors).length > 0 && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Please correct the validation errors below before submitting.
                  </AlertDescription>
                </Alert>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="from_place_id">From Place *</Label>
                  <Select
                    value={data.from_place_id}
                    onValueChange={(value) => setData('from_place_id', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select from place" />
                    </SelectTrigger>
                    <SelectContent>
                      {places.map((place) => (
                        <SelectItem key={place.id} value={place.id.toString()}>
                          {place.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.from_place_id && (
                    <p className="text-sm text-destructive">{errors.from_place_id}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="to_place_id">To Place *</Label>
                  <Select
                    value={data.to_place_id}
                    onValueChange={(value) => setData('to_place_id', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select to place" />
                    </SelectTrigger>
                    <SelectContent>
                      {places
                        .filter((place) => place.id.toString() !== data.from_place_id)
                        .map((place) => (
                          <SelectItem key={place.id} value={place.id.toString()}>
                            {place.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  {errors.to_place_id && (
                    <p className="text-sm text-destructive">{errors.to_place_id}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="distance_km">Distance (KM) *</Label>
                  <Input
                    id="distance_km"
                    type="number"
                    step="0.01"
                    min="0"
                    value={data.distance_km}
                    onChange={(e) => setData('distance_km', e.target.value)}
                    placeholder="Enter distance in kilometers"
                  />
                  {errors.distance_km && (
                    <p className="text-sm text-destructive">{errors.distance_km}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="estimated_time_hours">Estimated Time (Hours) *</Label>
                  <Input
                    id="estimated_time_hours"
                    type="number"
                    step="0.1"
                    min="0"
                    value={data.estimated_time_hours}
                    onChange={(e) => setData('estimated_time_hours', e.target.value)}
                    placeholder="Enter estimated time in hours"
                  />
                  {errors.estimated_time_hours && (
                    <p className="text-sm text-destructive">{errors.estimated_time_hours}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <Button type="submit" disabled={processing}>
                  {processing ? 'Updating...' : 'Update Distance'}
                </Button>
                <Button type="button" variant="outline" onClick={() => window.history.back()}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
}
