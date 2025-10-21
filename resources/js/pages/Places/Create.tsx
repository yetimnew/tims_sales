import { useState, useEffect } from 'react'
import { useForm } from '@inertiajs/react'
import { Link } from '@inertiajs/react'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useToast } from '@/hooks/use-toast'
import { validatePlace } from '@/lib/validation'
import AppLayout from '@/layouts/app-layout'
import { CircleAlert } from 'lucide-react'

interface Woreda {
  id: number
  name: string
}

interface PlaceFormData {
  name: string
  code: string
  woreda_id: string
  latitude: string
  longitude: string
  description: string
}

interface PlaceCreateProps {
  woredas: Woreda[]
}

export default function PlacesCreate({ woredas }: PlaceCreateProps) {
  const { toast } = useToast()
  const [frontendErrors, setFrontendErrors] = useState<Record<string, string>>({})
  const { data, setData, post, processing, errors } = useForm<PlaceFormData>({
    name: '',
    code: '',
    woreda_id: '',
    latitude: '',
    longitude: '',
    description: '',
  })

  useEffect(() => {
    if (Object.keys(errors).length > 0) {
      toast({ title: 'Validation Error', description: 'Please fix the errors', variant: 'destructive' })
    }
  }, [errors])

  const handleFieldChange = (field: string, value: string) => {
    setData(field as keyof PlaceFormData, value)
    if (frontendErrors[field]) {
      const validationErrors = validatePlace({ ...data, [field]: value })
      const error = validationErrors[field] || ''
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
    const validationErrors = validatePlace(data)
    if (Object.keys(validationErrors).length > 0) {
      setFrontendErrors(validationErrors)
      toast({ title: 'Validation Error', description: 'Please fix all errors', variant: 'destructive' })
      return
    }
    post(route('places.store'))
  }

  const hasErrors = Object.keys(frontendErrors).length > 0 || Object.keys(errors).length > 0

  return (
    <div className="flex h-full flex-1 flex-col gap-6 overflow-auto p-4">
      <div className="flex items-center gap-4">
        <Link href={route('places.index')}>
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">Create Place</h1>
      </div>

      <Card className="max-w-2xl">
        <CardHeader className="border-b">
          <h2 className="text-lg font-semibold">New Place Details</h2>
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
                placeholder="Enter place name"
                className={frontendErrors.name || errors.name ? 'border-red-500' : ''}
              />
              {(frontendErrors.name || errors.name) && (
                <p className="text-sm text-red-500">{frontendErrors.name || errors.name}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="code">Code</Label>
              <Input
                id="code"
                type="text"
                value={data.code}
                onChange={e => handleFieldChange('code', e.target.value)}
                placeholder="Enter place code"
                className={frontendErrors.code || errors.code ? 'border-red-500' : ''}
              />
              {(frontendErrors.code || errors.code) && (
                <p className="text-sm text-red-500">{frontendErrors.code || errors.code}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="woreda_id">Woreda *</Label>
              <Select value={data.woreda_id} onValueChange={value => handleFieldChange('woreda_id', value)}>
                <SelectTrigger
                  id="woreda_id"
                  className={frontendErrors.woreda_id || errors.woreda_id ? 'border-red-500' : ''}
                >
                  <SelectValue placeholder="Select a woreda" />
                </SelectTrigger>
                <SelectContent>
                  {woredas.map(woreda => (
                    <SelectItem key={woreda.id} value={woreda.id.toString()}>
                      {woreda.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {(frontendErrors.woreda_id || errors.woreda_id) && (
                <p className="text-sm text-red-500">{frontendErrors.woreda_id || errors.woreda_id}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="latitude">Latitude</Label>
                <Input
                  id="latitude"
                  type="number"
                  step="any"
                  value={data.latitude}
                  onChange={e => handleFieldChange('latitude', e.target.value)}
                  placeholder="e.g., 9.0320"
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
                  step="any"
                  value={data.longitude}
                  onChange={e => handleFieldChange('longitude', e.target.value)}
                  placeholder="e.g., 38.7469"
                  className={frontendErrors.longitude || errors.longitude ? 'border-red-500' : ''}
                />
                {(frontendErrors.longitude || errors.longitude) && (
                  <p className="text-sm text-red-500">{frontendErrors.longitude || errors.longitude}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={data.description}
                onChange={e => handleFieldChange('description', e.target.value)}
                placeholder="Enter place description"
                rows={4}
                className={frontendErrors.description || errors.description ? 'border-red-500' : ''}
              />
              {(frontendErrors.description || errors.description) && (
                <p className="text-sm text-red-500">{frontendErrors.description || errors.description}</p>
              )}
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="submit" disabled={processing || hasErrors} className="flex-1">
                Create Place
              </Button>
              <Link href={route('places.index')}>
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

PlacesCreate.layout = (page: React.ReactNode) => <AppLayout children={page} />

