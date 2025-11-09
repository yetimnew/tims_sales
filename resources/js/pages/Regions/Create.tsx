import { useState, useEffect } from 'react'
import { useForm } from '@inertiajs/react'
import { Link } from '@inertiajs/react'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useToast } from '@/hooks/use-toast'
import { validateRegion } from '@/lib/validation'
import AppLayout from '@/layouts/app-layout'
import { CircleAlert } from 'lucide-react'
import { Textarea } from '@/components/ui/textarea'

interface RegionFormData {
  name: string
  status: 'active' | 'inactive'
  code: string
  capital: string
  area_km2: string
  population: string
  latitude: string
  longitude: string
  elevation_m: string
  accessibility_score: string
  last_surveyed_at: string
  description: string
  infrastructure_notes: string
  climate_profile: string
}

export default function RegionsCreate() {
  const { toast } = useToast()
  const [frontendErrors, setFrontendErrors] = useState<Record<string, string>>({})
  const { data, setData, post, processing, errors } = useForm<RegionFormData>({
    name: '',
    status: 'active',
    code: '',
    capital: '',
    area_km2: '',
    population: '',
    latitude: '',
    longitude: '',
    elevation_m: '',
    accessibility_score: '',
    last_surveyed_at: '',
    description: '',
    infrastructure_notes: '',
    climate_profile: '',
  })

  useEffect(() => {
    if (Object.keys(errors).length > 0) {
      toast({ title: 'Validation Error', description: 'Please fix the errors', variant: 'destructive' })
    }
  }, [errors])

  const handleFieldChange = (field: keyof RegionFormData, value: string) => {
    setData(field, value)

    if (frontendErrors[field]) {
      const validationErrors = validateRegion({ ...data, [field]: value })
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
    const validationErrors = validateRegion(data)
    if (Object.keys(validationErrors).length > 0) {
      setFrontendErrors(validationErrors)
      toast({ title: 'Validation Error', description: 'Please fix all errors', variant: 'destructive' })
      return
    }
  post('/regions')
  }

  const hasErrors = Object.keys(frontendErrors).length > 0 || Object.keys(errors).length > 0

  return (
    <div className="flex h-full flex-1 flex-col gap-6 overflow-auto p-4">
      <div className="flex items-center gap-4">
  <Link href="/regions">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">Create Region</h1>
      </div>

      <Card className="max-w-2xl">
        <CardHeader className="border-b">
          <h2 className="text-lg font-semibold">New Region Details</h2>
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
                placeholder="Enter region name"
                className={frontendErrors.name || errors.name ? 'border-red-500' : ''}
              />
              {(frontendErrors.name || errors.name) && (
                <p className="text-sm text-red-500">{frontendErrors.name || errors.name}</p>
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
                  placeholder="Enter region code"
                  className={frontendErrors.code || errors.code ? 'border-red-500' : ''}
                />
                {(frontendErrors.code || errors.code) && (
                  <p className="text-sm text-red-500">{frontendErrors.code || errors.code}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="capital">Capital</Label>
                <Input
                  id="capital"
                  type="text"
                  value={data.capital}
                  onChange={e => handleFieldChange('capital', e.target.value)}
                  placeholder="Enter capital city"
                  className={frontendErrors.capital || errors.capital ? 'border-red-500' : ''}
                />
                {(frontendErrors.capital || errors.capital) && (
                  <p className="text-sm text-red-500">{frontendErrors.capital || errors.capital}</p>
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
                  placeholder="e.g. 8.9806"
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
                  placeholder="e.g. 38.7578"
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
                <Label htmlFor="last_surveyed_at">Last Surveyed</Label>
                <Input
                  id="last_surveyed_at"
                  type="date"
                  value={data.last_surveyed_at}
                  onChange={e => handleFieldChange('last_surveyed_at', e.target.value)}
                  className={frontendErrors.last_surveyed_at || errors.last_surveyed_at ? 'border-red-500' : ''}
                />
                {(frontendErrors.last_surveyed_at || errors.last_surveyed_at) && (
                  <p className="text-sm text-red-500">{frontendErrors.last_surveyed_at || errors.last_surveyed_at}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={data.description}
                onChange={e => handleFieldChange('description', e.target.value)}
                placeholder="Provide additional information about this region"
                className={frontendErrors.description || errors.description ? 'border-red-500' : ''}
                rows={3}
              />
              {(frontendErrors.description || errors.description) && (
                <p className="text-sm text-red-500">{frontendErrors.description || errors.description}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="infrastructure_notes">Infrastructure Notes</Label>
              <Textarea
                id="infrastructure_notes"
                value={data.infrastructure_notes}
                onChange={e => handleFieldChange('infrastructure_notes', e.target.value)}
                placeholder="Roads, power availability, telecom coverage"
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
                placeholder="Key climate considerations for logistics"
                className={frontendErrors.climate_profile || errors.climate_profile ? 'border-red-500' : ''}
                rows={3}
              />
              {(frontendErrors.climate_profile || errors.climate_profile) && (
                <p className="text-sm text-red-500">{frontendErrors.climate_profile || errors.climate_profile}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status *</Label>
              <Select value={data.status} onValueChange={(value) => setData('status', value as 'active' | 'inactive')}>
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

            <div className="flex gap-2 pt-4">
              <Button type="submit" disabled={processing || hasErrors} className="flex-1">
                Create Region
              </Button>
              <Link href="/regions">
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

RegionsCreate.layout = (page: React.ReactNode) => <AppLayout children={page} />
