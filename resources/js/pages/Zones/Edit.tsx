import { useState, useEffect } from 'react'
import { useForm } from '@inertiajs/react'
import { Link } from '@inertiajs/react'
import { route } from 'ziggy-js'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useToast } from '@/hooks/use-toast'
import { validateZone } from '@/lib/validation'
import AppLayout from '@/layouts/app-layout'
import { CircleAlert } from 'lucide-react'
import { Textarea } from '@/components/ui/textarea'

interface Region {
  id: number
  name: string
}

interface Zone {
  id: number
  name: string
  region_id: number
  status: 'active' | 'inactive'
  code?: string | null
  description?: string | null
  administrative_center?: string | null
  area_km2?: number | string | null
  population?: number | string | null
  latitude?: number | string | null
  longitude?: number | string | null
  elevation_m?: number | string | null
  accessibility_score?: number | string | null
  infrastructure_notes?: string | null
  climate_profile?: string | null
}

interface ZoneFormData {
  name: string
  region_id: string
  status: 'active' | 'inactive'
  code: string
  description: string
  administrative_center: string
  area_km2: string
  population: string
  latitude: string
  longitude: string
  elevation_m: string
  accessibility_score: string
  infrastructure_notes: string
  climate_profile: string
}

interface ZoneEditProps {
  zone: Zone
  regions: Region[]
}

export default function ZonesEdit({ zone, regions }: ZoneEditProps) {
  const { toast } = useToast()
  const [frontendErrors, setFrontendErrors] = useState<Record<string, string>>({})
  const { data, setData, put, processing, errors } = useForm<ZoneFormData>({
    name: zone.name,
    region_id: zone.region_id.toString(),
    status: zone.status,
    code: zone.code ?? '',
    description: zone.description ?? '',
    administrative_center: zone.administrative_center ?? '',
    area_km2: zone.area_km2 !== null && zone.area_km2 !== undefined ? String(zone.area_km2) : '',
    population: zone.population !== null && zone.population !== undefined ? String(zone.population) : '',
    latitude: zone.latitude !== null && zone.latitude !== undefined ? String(zone.latitude) : '',
    longitude: zone.longitude !== null && zone.longitude !== undefined ? String(zone.longitude) : '',
    elevation_m: zone.elevation_m !== null && zone.elevation_m !== undefined ? String(zone.elevation_m) : '',
    accessibility_score: zone.accessibility_score !== null && zone.accessibility_score !== undefined ? String(zone.accessibility_score) : '',
    infrastructure_notes: zone.infrastructure_notes ?? '',
    climate_profile: zone.climate_profile ?? '',
  })

  useEffect(() => {
    if (Object.keys(errors).length > 0) {
      toast({ title: 'Validation Error', description: 'Please fix the errors', variant: 'destructive' })
    }
  }, [errors])

  const handleFieldChange = (field: keyof ZoneFormData, value: string) => {
    setData(field, value)
    if (frontendErrors[field]) {
      const validationErrors = validateZone({ ...data, [field]: value })
      const error = validationErrors[field as string] || ''
      if (error) {
        setFrontendErrors(prev => ({ ...prev, [field]: error }))
      } else {
        setFrontendErrors(prev => {
          const updated = { ...prev }
          delete updated[field]
          return updated
        })
      }
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const validationErrors = validateZone(data)
    if (Object.keys(validationErrors).length > 0) {
      setFrontendErrors(validationErrors)
      toast({ title: 'Validation Error', description: 'Please fix all errors', variant: 'destructive' })
      return
    }
    put(route('zones.update', zone.id))
  }

  const hasErrors = Object.keys(frontendErrors).length > 0 || Object.keys(errors).length > 0

  return (
    <div className="flex h-full flex-1 flex-col gap-6 overflow-auto p-4">
      <div className="flex items-center gap-4">
        <Link href={route('zones.index')}>
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">Edit Zone</h1>
      </div>

      <Card className="max-w-2xl">
        <CardHeader className="border-b">
          <h2 className="text-lg font-semibold">Update Zone Details</h2>
        </CardHeader>
        <CardContent className="pt-6">
          {hasErrors && (
            <Alert variant="destructive" className="mb-6">
              <CircleAlert className="h-4 w-4" />
              <AlertDescription>Please fix all errors in the form below</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                type="text"
                value={data.name}
                onChange={e => handleFieldChange('name', e.target.value)}
                placeholder="Enter zone name"
                className={frontendErrors.name || errors.name ? 'border-red-500' : ''}
              />
              {(frontendErrors.name || errors.name) && (
                <p className="text-sm text-red-500">{frontendErrors.name || errors.name}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="region_id">Region *</Label>
              <Select value={data.region_id} onValueChange={value => handleFieldChange('region_id', value)}>
                <SelectTrigger
                  id="region_id"
                  className={frontendErrors.region_id || errors.region_id ? 'border-red-500' : ''}
                >
                  <SelectValue placeholder="Select a region" />
                </SelectTrigger>
                <SelectContent>
                  {regions.map(region => (
                    <SelectItem key={region.id} value={region.id.toString()}>
                      {region.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {(frontendErrors.region_id || errors.region_id) && (
                <p className="text-sm text-red-500">{frontendErrors.region_id || errors.region_id}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status *</Label>
              <Select value={data.status} onValueChange={value => handleFieldChange('status', value as 'active' | 'inactive')}>
                <SelectTrigger className={frontendErrors.status || errors.status ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
              {(frontendErrors.status || errors.status) && (
                <p className="text-sm text-red-500">{frontendErrors.status || errors.status}</p>
              )}
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="code">Code</Label>
                <Input
                  id="code"
                  type="text"
                  value={data.code}
                  onChange={e => handleFieldChange('code', e.target.value)}
                  placeholder="Enter zone code"
                  className={frontendErrors.code || errors.code ? 'border-red-500' : ''}
                />
                {(frontendErrors.code || errors.code) && (
                  <p className="text-sm text-red-500">{frontendErrors.code || errors.code}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="administrative_center">Administrative Center</Label>
                <Input
                  id="administrative_center"
                  type="text"
                  value={data.administrative_center}
                  onChange={e => handleFieldChange('administrative_center', e.target.value)}
                  placeholder="Enter administrative center"
                  className={frontendErrors.administrative_center || errors.administrative_center ? 'border-red-500' : ''}
                />
                {(frontendErrors.administrative_center || errors.administrative_center) && (
                  <p className="text-sm text-red-500">{frontendErrors.administrative_center || errors.administrative_center}</p>
                )}
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="area_km2">Area (km²)</Label>
                <Input
                  id="area_km2"
                  type="number"
                  min="0"
                  step="0.01"
                  value={data.area_km2}
                  onChange={e => handleFieldChange('area_km2', e.target.value)}
                  placeholder="Enter area"
                  className={frontendErrors.area_km2 || errors.area_km2 ? 'border-red-500' : ''}
                />
                {(frontendErrors.area_km2 || errors.area_km2) && (
                  <p className="text-sm text-red-500">{frontendErrors.area_km2 || errors.area_km2}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="population">Population</Label>
                <Input
                  id="population"
                  type="number"
                  min="0"
                  step="1"
                  value={data.population}
                  onChange={e => handleFieldChange('population', e.target.value)}
                  placeholder="Enter population"
                  className={frontendErrors.population || errors.population ? 'border-red-500' : ''}
                />
                {(frontendErrors.population || errors.population) && (
                  <p className="text-sm text-red-500">{frontendErrors.population || errors.population}</p>
                )}
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="latitude">Latitude</Label>
                <Input
                  id="latitude"
                  type="number"
                  step="0.000001"
                  value={data.latitude}
                  onChange={e => handleFieldChange('latitude', e.target.value)}
                  placeholder="e.g. 7.123456"
                  className={frontendErrors.latitude || errors.latitude ? 'border-red-500' : ''}
                />
                {(frontendErrors.latitude || errors.latitude) && (
                  <p className="text-sm text-red-500">{frontendErrors.latitude || errors.latitude}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="longitude">Longitude</Label>
                <Input
                  id="longitude"
                  type="number"
                  step="0.000001"
                  value={data.longitude}
                  onChange={e => handleFieldChange('longitude', e.target.value)}
                  placeholder="e.g. 39.987654"
                  className={frontendErrors.longitude || errors.longitude ? 'border-red-500' : ''}
                />
                {(frontendErrors.longitude || errors.longitude) && (
                  <p className="text-sm text-red-500">{frontendErrors.longitude || errors.longitude}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="elevation_m">Elevation (m)</Label>
                <Input
                  id="elevation_m"
                  type="number"
                  step="0.01"
                  value={data.elevation_m}
                  onChange={e => handleFieldChange('elevation_m', e.target.value)}
                  placeholder="Enter elevation"
                  className={frontendErrors.elevation_m || errors.elevation_m ? 'border-red-500' : ''}
                />
                {(frontendErrors.elevation_m || errors.elevation_m) && (
                  <p className="text-sm text-red-500">{frontendErrors.elevation_m || errors.elevation_m}</p>
                )}
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="accessibility_score">Accessibility Score</Label>
                <Input
                  id="accessibility_score"
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={data.accessibility_score}
                  onChange={e => handleFieldChange('accessibility_score', e.target.value)}
                  placeholder="0 - 100"
                  className={frontendErrors.accessibility_score || errors.accessibility_score ? 'border-red-500' : ''}
                />
                {(frontendErrors.accessibility_score || errors.accessibility_score) && (
                  <p className="text-sm text-red-500">{frontendErrors.accessibility_score || errors.accessibility_score}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={data.description}
                  onChange={e => handleFieldChange('description', e.target.value)}
                  placeholder="Add a short description"
                  className={frontendErrors.description || errors.description ? 'border-red-500' : ''}
                  rows={3}
                />
                {(frontendErrors.description || errors.description) && (
                  <p className="text-sm text-red-500">{frontendErrors.description || errors.description}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="infrastructure_notes">Infrastructure Notes</Label>
              <Textarea
                id="infrastructure_notes"
                value={data.infrastructure_notes}
                onChange={e => handleFieldChange('infrastructure_notes', e.target.value)}
                placeholder="Utility coverage, logistics insights"
                className={frontendErrors.infrastructure_notes || errors.infrastructure_notes ? 'border-red-500' : ''}
                rows={3}
              />
              {(frontendErrors.infrastructure_notes || errors.infrastructure_notes) && (
                <p className="text-sm text-red-500">{frontendErrors.infrastructure_notes || errors.infrastructure_notes}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="climate_profile">Climate Profile</Label>
              <Textarea
                id="climate_profile"
                value={data.climate_profile}
                onChange={e => handleFieldChange('climate_profile', e.target.value)}
                placeholder="Seasonality and climate notes"
                className={frontendErrors.climate_profile || errors.climate_profile ? 'border-red-500' : ''}
                rows={3}
              />
              {(frontendErrors.climate_profile || errors.climate_profile) && (
                <p className="text-sm text-red-500">{frontendErrors.climate_profile || errors.climate_profile}</p>
              )}
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="submit" disabled={processing || hasErrors} className="flex-1">
                Update Zone
              </Button>
              <Link href={route('zones.index')}>
                <Button type="button" variant="outline" className="flex-1">
                  Cancel
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

ZonesEdit.layout = (page: React.ReactNode) => <AppLayout children={page} />
