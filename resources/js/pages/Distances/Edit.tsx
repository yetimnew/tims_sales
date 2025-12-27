import { Head, useForm } from '@inertiajs/react'
import { useMemo } from 'react'
import { AlertCircle, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { SearchableEntityCombobox } from '@/components/searchable-entity-combobox'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import AppLayout from '@/layouts/app-layout'
import type { BreadcrumbItem } from '@/types'

interface Place {
  id: number
  name: string
  latitude?: number
  longitude?: number
  woreda?: {
    name: string
    zone?: {
      name: string
      region?: { name: string }
    }
  }
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

const describePlace = (place: Place): string | null => {
  const locality = [place.woreda?.name, place.woreda?.zone?.name, place.woreda?.zone?.region?.name]
    .filter(Boolean)
    .join(' • ')

  return locality.length ? locality : null
}

const placeKeywords = (place: Place): Array<string | null | undefined> => [
  place.name,
  place.woreda?.name,
  place.woreda?.zone?.name,
  place.woreda?.zone?.region?.name,
  place.latitude ? place.latitude.toString() : null,
  place.longitude ? place.longitude.toString() : null,
]

export default function DistancesEdit({ distance, places }: DistancesEditProps) {
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
    })
  }

  const breadcrumbs = useMemo<BreadcrumbItem[]>(
    () => [
      { title: 'Distances', href: '/distances' },
      {
        title: `${distance.fromPlace?.name ?? 'Origin'} → ${distance.toPlace?.name ?? 'Destination'}`,
        href: `/distances/${distance.id}`,
      },
      { title: 'Edit', href: `/distances/${distance.id}/edit` },
    ],
    [distance.id, distance.fromPlace?.name, distance.toPlace?.name],
  )

  const distanceTitle = `${distance.fromPlace?.name ?? 'Origin'} → ${distance.toPlace?.name ?? 'Destination'}`

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title={`Edit Distance: ${distanceTitle}`} />
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
                <SearchableEntityCombobox
                  id="from_place_id"
                  label="From Place"
                  required
                  value={data.from_place_id}
                  items={places}
                  getValue={(place) => place.id.toString()}
                  getLabel={(place) => place.name}
                  getDescription={describePlace}
                  getKeywords={placeKeywords}
                  placeholder="Select from place"
                  searchPlaceholder="Search places..."
                  onSelect={(value) => setData('from_place_id', value)}
                  error={errors.from_place_id}
                />

                <SearchableEntityCombobox
                  id="to_place_id"
                  label="To Place"
                  required
                  value={data.to_place_id}
                  items={places}
                  getValue={(place) => place.id.toString()}
                  getLabel={(place) => place.name}
                  getDescription={describePlace}
                  getKeywords={placeKeywords}
                  placeholder="Select to place"
                  searchPlaceholder="Search places..."
                  onSelect={(value) => setData('to_place_id', value)}
                  error={errors.to_place_id}
                />

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
