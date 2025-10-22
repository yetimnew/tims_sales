import { useEffect, useRef, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMapEvents } from 'react-leaflet'
import { Icon } from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { MapPin, Route, RotateCcw, Navigation } from 'lucide-react'

// Fix for default markers in react-leaflet
delete (Icon.Default.prototype as any)._getIconUrl
Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

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

interface MapPoint {
  id: string
  name: string
  coordinates: [number, number]
  placeId?: number
  type?: 'from' | 'to' | 'route'
}

interface InteractiveMapProps {
  places: Place[]
  onRouteChange?: (routePoints: [number, number][]) => void
  onDistanceChange?: (distance: number) => void
  onTimeChange?: (time: number) => void
  selectedFromPlace?: Place | null
  selectedToPlace?: Place | null
  height?: string
  showRouteDrawing?: boolean
  showPlaceMarkers?: boolean
  readOnly?: boolean
  showDirectRoute?: boolean
}

// Component to handle map click events
function MapClickHandler({ onMapClick, isDrawing }: { onMapClick: (lat: number, lng: number) => void, isDrawing: boolean }) {
  useMapEvents({
    click: (e) => {
      if (isDrawing) {
        onMapClick(e.latlng.lat, e.latlng.lng)
      }
    },
  })
  return null
}

export function InteractiveMap({
  places,
  onRouteChange,
  onDistanceChange,
  onTimeChange,
  selectedFromPlace,
  selectedToPlace,
  height = "500px",
  showRouteDrawing = true,
  showPlaceMarkers = true,
  readOnly = false,
  showDirectRoute = false
}: InteractiveMapProps) {
  const [mapPoints, setMapPoints] = useState<MapPoint[]>([])
  const [routePoints, setRoutePoints] = useState<[number, number][]>([])
  const [isDrawing, setIsDrawing] = useState(false)
  const [calculatedDistance, setCalculatedDistance] = useState<number>(0)
  const [estimatedTime, setEstimatedTime] = useState<number>(0)

  // Add selected places to map points
  useEffect(() => {
    const newPoints: MapPoint[] = []

    if (selectedFromPlace?.latitude && selectedFromPlace?.longitude) {
      newPoints.push({
        id: 'from_place',
        name: selectedFromPlace.name,
        coordinates: [selectedFromPlace.longitude, selectedFromPlace.latitude],
        placeId: selectedFromPlace.id,
        type: 'from'
      })
    }

    if (selectedToPlace?.latitude && selectedToPlace?.longitude) {
      newPoints.push({
        id: 'to_place',
        name: selectedToPlace.name,
        coordinates: [selectedToPlace.longitude, selectedToPlace.latitude],
        placeId: selectedToPlace.id,
        type: 'to'
      })
    }

    setMapPoints(newPoints)
  }, [selectedFromPlace, selectedToPlace])

  // Handle read-only mode with direct route display
  useEffect(() => {
    if (readOnly && showDirectRoute && selectedFromPlace?.latitude && selectedFromPlace?.longitude &&
        selectedToPlace?.latitude && selectedToPlace?.longitude) {
      // Show direct route line between the two places
      const directRoute: [number, number][] = [
        [selectedFromPlace.latitude, selectedToPlace.longitude],
        [selectedToPlace.latitude, selectedToPlace.longitude]
      ];
      setRoutePoints(directRoute);

      // Calculate distance for direct route
      const distance = haversineDistance(
        selectedFromPlace.latitude,
        selectedFromPlace.longitude,
        selectedToPlace.latitude,
        selectedToPlace.longitude
      );
      setCalculatedDistance(distance);
      setEstimatedTime(distance / 60); // Assume 60 km/h average speed

      // Notify parent components
      onRouteChange?.(directRoute);
      onDistanceChange?.(distance);
      onTimeChange?.(distance / 60);
    }
  }, [readOnly, showDirectRoute, selectedFromPlace, selectedToPlace, onRouteChange, onDistanceChange, onTimeChange])

  const handleMapClick = (lat: number, lng: number) => {
    if (!isDrawing) return

    const newPoint: [number, number] = [lng, lat]
    setRoutePoints(prev => [...prev, newPoint])

    // Add to map points for display
    const routePoint: MapPoint = {
      id: `route_${Date.now()}`,
      name: `Route Point ${routePoints.length + 1}`,
      coordinates: newPoint,
      type: 'route'
    }
    setMapPoints(prev => [...prev, routePoint])

    // Notify parent component
    onRouteChange?.(routePoints)
  }

  const startDrawing = () => {
    setIsDrawing(true)
    setRoutePoints([])
    // Remove existing route points
    setMapPoints(prev => prev.filter(point => point.type !== 'route'))
  }

  const stopDrawing = () => {
    setIsDrawing(false)
    if (routePoints.length > 0) {
      calculateRouteDistance()
    }
  }

  const calculateRouteDistance = () => {
    if (routePoints.length < 2) return

    let totalDistance = 0
    for (let i = 0; i < routePoints.length - 1; i++) {
      const distance = haversineDistance(
        routePoints[i][1], routePoints[i][0], // lat, lng
        routePoints[i + 1][1], routePoints[i + 1][0]
      )
      totalDistance += distance
    }

    setCalculatedDistance(totalDistance)
    onDistanceChange?.(totalDistance)

    // Calculate estimated time (assuming 50 km/h average)
    const time = totalDistance / 50
    setEstimatedTime(time)
    onTimeChange?.(time)
  }

  const haversineDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371 // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLon = (lon2 - lon1) * Math.PI / 180
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    return R * c
  }

  const clearRoute = () => {
    setRoutePoints([])
    setCalculatedDistance(0)
    setEstimatedTime(0)
    setMapPoints(prev => prev.filter(point => point.type !== 'route'))
    onRouteChange?.([])
    onDistanceChange?.(0)
    onTimeChange?.(0)
  }

  // Get center point for map
  const getMapCenter = (): [number, number] => {
    if (selectedFromPlace?.latitude && selectedFromPlace?.longitude) {
      return [selectedFromPlace.latitude, selectedFromPlace.longitude]
    }
    if (selectedToPlace?.latitude && selectedToPlace?.longitude) {
      return [selectedToPlace.latitude, selectedToPlace.longitude]
    }
    // Default to Ethiopia center
    return [9.145, 40.4897]
  }

  return (
    <div className="space-y-4">
      {/* Map Controls - Hide in read-only mode */}
      {showRouteDrawing && !readOnly && (
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={isDrawing ? stopDrawing : startDrawing}
            variant={isDrawing ? "destructive" : "default"}
            disabled={!selectedFromPlace || !selectedToPlace}
          >
            <Route className="h-4 w-4 mr-2" />
            {isDrawing ? 'Stop Drawing' : 'Start Drawing Route'}
          </Button>
          <Button onClick={clearRoute} variant="outline" disabled={routePoints.length === 0}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Clear Route
          </Button>
          <Button
            onClick={calculateRouteDistance}
            disabled={routePoints.length < 2}
            variant="secondary"
          >
            <Navigation className="h-4 w-4 mr-2" />
            Calculate Distance
          </Button>
        </div>
      )}

      {/* Route Information */}
      {routePoints.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Route Points</p>
                <p className="text-2xl font-bold">{routePoints.length}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Calculated Distance</p>
                <p className="text-2xl font-bold">{calculatedDistance.toFixed(2)} km</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Estimated Time</p>
                <p className="text-2xl font-bold">{estimatedTime.toFixed(1)} hrs</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Read-only route info */}
      {readOnly && selectedFromPlace && selectedToPlace && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Distance</p>
                <p className="text-2xl font-bold">{calculatedDistance.toFixed(2)} km</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Estimated Time</p>
                <p className="text-2xl font-bold">{estimatedTime.toFixed(1)} hrs</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Map Container */}
      <div style={{ height }} className="rounded-lg border overflow-hidden">
        <MapContainer
          center={getMapCenter()}
          zoom={6}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <MapClickHandler onMapClick={handleMapClick} isDrawing={isDrawing} />

          {/* Show existing places as markers */}
          {showPlaceMarkers && places.map((place) => {
            if (!place.latitude || !place.longitude) return null

            return (
              <Marker
                key={place.id}
                position={[place.latitude, place.longitude]}
              >
                <Popup>
                  <div>
                    <strong>{place.name}</strong><br />
                    {place.woreda?.name || 'Unknown Location'}
                  </div>
                </Popup>
              </Marker>
            )
          })}

          {/* Show selected places */}
          {mapPoints.map((point) => (
            <Marker
              key={point.id}
              position={[point.coordinates[1], point.coordinates[0]]}
            >
              <Popup>
                <div>
                  <strong>{point.name}</strong><br />
                  {point.type === 'from' && 'Starting Point'}
                  {point.type === 'to' && 'Destination Point'}
                  {point.type === 'route' && 'Route Point'}
                </div>
              </Popup>
            </Marker>
          ))}

          {/* Show route line */}
          {routePoints.length > 1 && (
            <Polyline
              positions={routePoints.map(point => [point[1], point[0]])}
              color="blue"
              weight={3}
              opacity={0.7}
            />
          )}
        </MapContainer>
      </div>

      {/* Route Summary */}
      {routePoints.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="space-y-2">
              <h4 className="font-semibold">Route Summary</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p><strong>From:</strong> {selectedFromPlace?.name || 'Not selected'}</p>
                  <p><strong>To:</strong> {selectedToPlace?.name || 'Not selected'}</p>
                </div>
                <div>
                  <p><strong>Total Distance:</strong> {calculatedDistance.toFixed(2)} km</p>
                  <p><strong>Estimated Time:</strong> {estimatedTime.toFixed(1)} hours</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
