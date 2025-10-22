import { useState } from 'react'
import { useForm } from '@inertiajs/react'
import { ArrowLeft, MapPin, Route, Save, Navigation } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import { InteractiveMap } from '@/components/InteractiveMap'
import { useToast } from '@/hooks/use-toast'
import AppLayout from '@/layouts/app-layout'

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

interface DistancesCreateProps {
  places: Place[]
}

export default function DistancesCreate({ places }: DistancesCreateProps) {
  const { toast } = useToast()
  const [selectedFromPlace, setSelectedFromPlace] = useState<Place | null>(null)
  const [selectedToPlace, setSelectedToPlace] = useState<Place | null>(null)
  const [routePoints, setRoutePoints] = useState<[number, number][]>([])
  const [calculatedDistance, setCalculatedDistance] = useState<number>(0)
  const [calculatedTime, setCalculatedTime] = useState<number>(0)

  const { data, setData, post, processing, errors } = useForm({
    from_place_id: '',
    to_place_id: '',
    distance_km: '',
    estimated_time_hours: '',
    route_description: '',
    route_type: 'primary',
    estimated_travel_time_minutes: '',
    road_condition_factor: '1.0',
    toll_road: false,
    toll_cost: '',
    restricted_for_heavy_vehicles: false,
    route_notes: '',
  })

  // Handle place selection
  const handleFromPlaceChange = (placeId: string) => {
    setData('from_place_id', placeId)
    const place = places.find(p => p.id.toString() === placeId)
    setSelectedFromPlace(place || null)
  }

  const handleToPlaceChange = (placeId: string) => {
    setData('to_place_id', placeId)
    const place = places.find(p => p.id.toString() === placeId)
    setSelectedToPlace(place || null)
  }

  // Handle route changes from map
  const handleRouteChange = (points: [number, number][]) => {
    setRoutePoints(points)
  }

  const handleDistanceChange = (distance: number) => {
    setCalculatedDistance(distance)
    setData('distance_km', distance.toString())
  }

  const handleTimeChange = (time: number) => {
    setCalculatedTime(time)
    setData('estimated_time_hours', time.toString())
  }

  const validateField = (field: string, value: string) => {
    const fieldErrors: { [key: string]: string } = {}

    switch (field) {
      case 'from_place_id':
        if (!value) fieldErrors.from_place_id = 'From place is required'
        break
      case 'to_place_id':
        if (!value) fieldErrors.to_place_id = 'To place is required'
        if (value && value === data.from_place_id) {
          fieldErrors.to_place_id = 'To place must be different from from place'
        }
        break
      case 'distance_km':
        if (!value) fieldErrors.distance_km = 'Distance is required'
        else if (isNaN(Number(value)) || Number(value) <= 0) {
          fieldErrors.distance_km = 'Distance must be a positive number'
        }
        break
      case 'estimated_time_hours':
        if (!value) fieldErrors.estimated_time_hours = 'Estimated time is required'
        else if (isNaN(Number(value)) || Number(value) <= 0) {
          fieldErrors.estimated_time_hours = 'Estimated time must be a positive number'
        }
        break
    }

    return fieldErrors
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    post('/distances', {
      onSuccess: () => {
        toast({
          title: 'Success',
          description: 'Distance created successfully.',
        })
      },
      onError: () => {
        toast({
          title: 'Error',
          description: 'Failed to create distance.',
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
            <h1 className="text-3xl font-bold tracking-tight">Create Distance</h1>
            <p className="text-muted-foreground">
              Select places and draw route on map to calculate distance
            </p>
          </div>
        </div>

        <Tabs defaultValue="map" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="map">Interactive Map</TabsTrigger>
            <TabsTrigger value="form">Distance Form</TabsTrigger>
            <TabsTrigger value="preview">Route Preview</TabsTrigger>
          </TabsList>

          <TabsContent value="map" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Navigation className="h-5 w-5" />
                  <span>Route Planning Map</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <InteractiveMap
                  places={places}
                  selectedFromPlace={selectedFromPlace}
                  selectedToPlace={selectedToPlace}
                  onRouteChange={handleRouteChange}
                  onDistanceChange={handleDistanceChange}
                  onTimeChange={handleTimeChange}
                  height="500px"
                  showRouteDrawing={true}
                  showPlaceMarkers={true}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="form" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Distance Information</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="from_place_id">From Place *</Label>
                      <Select
                        value={data.from_place_id}
                        onValueChange={handleFromPlaceChange}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select from place" />
                        </SelectTrigger>
                        <SelectContent>
                          {places.map((place) => (
                            <SelectItem key={place.id} value={place.id.toString()}>
                              {place.name} {place.latitude && place.longitude ? '📍' : ''}
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
                        onValueChange={handleToPlaceChange}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select to place" />
                        </SelectTrigger>
                        <SelectContent>
                          {places
                            .filter((place) => place.id.toString() !== data.from_place_id)
                            .map((place) => (
                              <SelectItem key={place.id} value={place.id.toString()}>
                                {place.name} {place.latitude && place.longitude ? '📍' : ''}
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
                        placeholder="Auto-calculated from map"
                        readOnly={calculatedDistance > 0}
                      />
                      {calculatedDistance > 0 && (
                        <p className="text-sm text-green-600">
                          ✓ Calculated from map route
                        </p>
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
                        placeholder="Auto-calculated from route"
                        readOnly={calculatedTime > 0}
                      />
                      {calculatedTime > 0 && (
                        <p className="text-sm text-green-600">
                          ✓ Calculated from route
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="route_type">Route Type</Label>
                      <Select
                        value={data.route_type}
                        onValueChange={(value) => setData('route_type', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="primary">Primary Route (80 km/h)</SelectItem>
                          <SelectItem value="secondary">Secondary Route (50 km/h)</SelectItem>
                          <SelectItem value="alternative">Alternative Route (40 km/h)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="road_condition_factor">Road Condition Factor</Label>
                      <Input
                        id="road_condition_factor"
                        type="number"
                        step="0.1"
                        min="0.5"
                        max="2.0"
                        value={data.road_condition_factor}
                        onChange={(e) => setData('road_condition_factor', e.target.value)}
                        placeholder="1.0 = normal, 1.5 = poor condition"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="route_description">Route Description</Label>
                      <Textarea
                        id="route_description"
                        value={data.route_description}
                        onChange={(e) => setData('route_description', e.target.value)}
                        placeholder="Describe the route..."
                        rows={3}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="route_notes">Route Notes</Label>
                      <Textarea
                        id="route_notes"
                        value={data.route_notes}
                        onChange={(e) => setData('route_notes', e.target.value)}
                        placeholder="Additional notes about the route..."
                        rows={3}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="toll_road"
                          checked={data.toll_road}
                          onCheckedChange={(checked) => setData('toll_road', checked as boolean)}
                        />
                        <Label htmlFor="toll_road">Toll Road</Label>
                      </div>
                      {data.toll_road && (
                        <div className="space-y-2">
                          <Label htmlFor="toll_cost">Toll Cost (ETB)</Label>
                          <Input
                            id="toll_cost"
                            type="number"
                            step="0.01"
                            min="0"
                            value={data.toll_cost}
                            onChange={(e) => setData('toll_cost', e.target.value)}
                            placeholder="Enter toll cost"
                          />
                        </div>
                      )}
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="restricted_for_heavy_vehicles"
                          checked={data.restricted_for_heavy_vehicles}
                          onCheckedChange={(checked) => setData('restricted_for_heavy_vehicles', checked as boolean)}
                        />
                        <Label htmlFor="restricted_for_heavy_vehicles">Restricted for Heavy Vehicles</Label>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <Button type="submit" disabled={processing}>
                      <Save className="h-4 w-4 mr-2" />
                      {processing ? 'Creating...' : 'Create Distance'}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => window.history.back()}>
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="preview" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Route Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {routePoints.length > 0 ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-semibold">From: {selectedFromPlace?.name || 'Not selected'}</h4>
                          <p className="text-sm text-muted-foreground">
                            {selectedFromPlace?.woreda?.name || ''}
                          </p>
                        </div>
                        <div>
                          <h4 className="font-semibold">To: {selectedToPlace?.name || 'Not selected'}</h4>
                          <p className="text-sm text-muted-foreground">
                            {selectedToPlace?.woreda?.name || ''}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card>
                          <CardContent className="p-4 text-center">
                            <p className="text-sm text-muted-foreground">Route Points</p>
                            <p className="text-2xl font-bold">{routePoints.length}</p>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="p-4 text-center">
                            <p className="text-sm text-muted-foreground">Total Distance</p>
                            <p className="text-2xl font-bold">{calculatedDistance.toFixed(2)} km</p>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="p-4 text-center">
                            <p className="text-sm text-muted-foreground">Estimated Time</p>
                            <p className="text-2xl font-bold">{calculatedTime.toFixed(1)} hours</p>
                          </CardContent>
                        </Card>
                      </div>

                      <div className="space-y-2">
                        <h4 className="font-semibold">Route Details</h4>
                        <div className="space-y-1">
                          <p><strong>Route Type:</strong> {data.route_type}</p>
                          <p><strong>Road Condition Factor:</strong> {data.road_condition_factor}</p>
                          <p><strong>Toll Road:</strong> {data.toll_road ? 'Yes' : 'No'}</p>
                          {data.toll_road && data.toll_cost && (
                            <p><strong>Toll Cost:</strong> {data.toll_cost} ETB</p>
                          )}
                          <p><strong>Heavy Vehicle Restricted:</strong> {data.restricted_for_heavy_vehicles ? 'Yes' : 'No'}</p>
                          <p><strong>Route Points:</strong> {routePoints.length} points saved</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Route className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">No route drawn yet. Go to the Map tab to draw your route.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  )
}
