import { useCallback, useEffect, useMemo, useRef, useState, type FormEventHandler } from 'react'
import { Head, Link, useForm } from '@inertiajs/react'
import AppLayout from '@/layouts/app-layout'
import { type BreadcrumbItem } from '@/types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { validateZone, type ValidationErrors } from '@/lib/validation'
import { toast } from '@/hooks/use-toast'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  AlertCircle,
  ArrowLeft,
  ArrowUp,
  Building2,
  CheckCircle,
  Flag,
  Layers,
  MapPin,
  Save,
} from 'lucide-react'

interface RegionOption {
  id: number
  name: string
}

type ZoneFormData = {
  name: string
  status: 'active' | 'inactive'
  code: string
  region_id: string
  administrative_center: string
  area_km2: string
  population: string
  latitude: string
  longitude: string
  elevation_m: string
  accessibility_score: string
  description: string
  infrastructure_notes: string
  climate_profile: string
}

interface ZonesCreateProps {
  regions: RegionOption[]
}

const breadcrumbs: BreadcrumbItem[] = [
  {
    title: 'Zones',
    href: '/zones',
  },
  {
    title: 'Create',
    href: '/zones/create',
  },
]

export default function ZonesCreate({ regions }: ZonesCreateProps) {
  const { data, setData, post, processing, errors, reset } = useForm<ZoneFormData>({
    name: '',
    status: 'active',
    code: '',
    region_id: '',
    administrative_center: '',
    area_km2: '',
    population: '',
    latitude: '',
    longitude: '',
    elevation_m: '',
    accessibility_score: '',
    description: '',
    infrastructure_notes: '',
    climate_profile: '',
  })

  const [frontendErrors, setFrontendErrors] = useState<ValidationErrors>({})
  const [isDirty, setIsDirty] = useState(false)
  const [showScrollTop, setShowScrollTop] = useState(false)
  const scrollContainerRef = useRef<HTMLFormElement | null>(null)

  const hasErrors = useMemo(
    () => Object.keys(errors).length > 0 || Object.keys(frontendErrors).length > 0,
    [errors, frontendErrors]
  )

  useEffect(() => {
    const errorMessages = Object.values(errors)
      .flatMap(message => (Array.isArray(message) ? message : message ? [message] : []))
      .filter((message): message is string => Boolean(message))

    if (errorMessages.length > 0) {
      toast({
        title: '⚠️ Validation Error',
        description: errorMessages.join(', '),
        variant: 'destructive',
      })
    }
  }, [errors])

  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container) return

    const handleScroll = () => {
      setShowScrollTop(container.scrollTop > 240)
    }

    handleScroll()
    container.addEventListener('scroll', handleScroll)

    return () => {
      container.removeEventListener('scroll', handleScroll)
    }
  }, [])

  const setFieldError = useCallback((field: keyof ZoneFormData, message: string) => {
    setFrontendErrors(prev => {
      const next = { ...prev }
      if (message) {
        next[field] = message
      } else {
        delete next[field]
      }
      return next
    })
  }, [])

  const validateField = useCallback(
    (field: keyof ZoneFormData, value: string) => {
      const nextValues: ZoneFormData = { ...data, [field]: value } as ZoneFormData
      const fieldErrors = validateZone(nextValues)
      setFieldError(field, fieldErrors[field] ?? '')
    },
    [data, setFieldError]
  )

  const handleFieldChange = useCallback(
    (field: keyof ZoneFormData, value: string) => {
      setData(field, value as ZoneFormData[keyof ZoneFormData])
      validateField(field, value)
      setIsDirty(true)
    },
    [setData, validateField]
  )

  const submit: FormEventHandler = event => {
    event.preventDefault()

    const validationResults = validateZone(data)
    if (Object.keys(validationResults).length > 0) {
      setFrontendErrors(validationResults)
      return
    }

    post('/zones', {
      preserveScroll: true,
      onSuccess: () => {
        setFrontendErrors({})
        setIsDirty(false)
        reset()
      },
    })
  }

  const getFieldError = useCallback(
    (field: keyof ZoneFormData) => errors[field] || frontendErrors[field] || '',
    [errors, frontendErrors]
  )

  const handleScrollToTop = () => {
    scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Create Zone" />
      <div className="flex h-full flex-1 flex-col gap-6 overflow-hidden rounded-xl p-4">
        <Card className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-slate-200/70 bg-white/95 text-card-foreground shadow-xl backdrop-blur-lg dark:border-slate-800/60 dark:bg-slate-900/70">
          <CardHeader className="px-6 pb-0">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex items-start gap-4">
                <div className="rounded-xl bg-emerald-100 p-2 text-emerald-600 shadow-sm dark:bg-emerald-900/30 dark:text-emerald-400">
                  <Layers className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
                    Register New Zone
                  </CardTitle>
                  <CardDescription className="text-sm text-slate-600 dark:text-slate-400">
                    Define sub-regional coverage, readiness signals, and logistics context for planning.
                  </CardDescription>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/zones">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Zones
                  </Link>
                </Button>
                {isDirty && (
                  <div className="flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1.5 text-sm font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                    <Save className="h-3 w-3" />
                    Unsaved Changes
                  </div>
                )}
                <div className="flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1.5 text-sm font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                  <div className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
                  Coverage Mapping
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="flex flex-1 flex-col overflow-hidden p-0">
            {hasErrors && (
              <div className="px-6 pt-6">
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>Please resolve the highlighted fields before submitting the form.</AlertDescription>
                </Alert>
              </div>
            )}

            <form
              ref={scrollContainerRef}
              onSubmit={submit}
              className="flex flex-1 flex-col gap-8 overflow-y-auto p-6 pb-24"
              style={{ minHeight: 0 }}
              noValidate
            >

              <section className="space-y-4 rounded-xl border border-slate-200/60 bg-white/75 p-5 shadow-sm dark:border-slate-800/70 dark:bg-slate-900/35">
                <div className="flex items-center gap-2.5 text-sm">
                  <div className="rounded-md bg-emerald-100 p-1.5 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
                    <Building2 className="h-4 w-4" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">Zone Identity</h2>
                    <p className="text-xs text-muted-foreground">Capture the core identification and governance details for this zone.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">
                      Zone Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="name"
                      type="text"
                      value={data.name}
                      onChange={event => handleFieldChange('name', event.target.value)}
                      placeholder="e.g., East Arsi"
                      className={getFieldError('name') ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}
                    />
                    {getFieldError('name') && (
                      <p className="flex items-center gap-1 text-sm text-red-500">
                        <AlertCircle className="h-3 w-3" />
                        {getFieldError('name')}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="region_id">
                      Region <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={data.region_id}
                      onValueChange={value => handleFieldChange('region_id', value)}
                    >
                      <SelectTrigger className={getFieldError('region_id') ? 'border-red-500 focus:ring-red-500/20' : ''}>
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
                    {getFieldError('region_id') && (
                      <p className="flex items-center gap-1 text-sm text-red-500">
                        <AlertCircle className="h-3 w-3" />
                        {getFieldError('region_id')}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="status">
                      Status <span className="text-red-500">*</span>
                    </Label>
                    <Select value={data.status} onValueChange={value => handleFieldChange('status', value)}>
                      <SelectTrigger className={getFieldError('status') ? 'border-red-500 focus:ring-red-500/20' : ''}>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                    {getFieldError('status') && (
                      <p className="flex items-center gap-1 text-sm text-red-500">
                        <AlertCircle className="h-3 w-3" />
                        {getFieldError('status')}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="code">Zone Code</Label>
                    <Input
                      id="code"
                      type="text"
                      value={data.code}
                      onChange={event => handleFieldChange('code', event.target.value)}
                      placeholder="e.g., EA-02"
                      className={getFieldError('code') ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}
                    />
                    {getFieldError('code') && (
                      <p className="flex items-center gap-1 text-sm text-red-500">
                        <AlertCircle className="h-3 w-3" />
                        {getFieldError('code')}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="administrative_center">Administrative Center</Label>
                    <Input
                      id="administrative_center"
                      type="text"
                      value={data.administrative_center}
                      onChange={event => handleFieldChange('administrative_center', event.target.value)}
                      placeholder="Primary governance hub"
                      className={getFieldError('administrative_center') ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}
                    />
                    {getFieldError('administrative_center') && (
                      <p className="flex items-center gap-1 text-sm text-red-500">
                        <AlertCircle className="h-3 w-3" />
                        {getFieldError('administrative_center')}
                      </p>
                    )}
                  </div>
                </div>
              </section>

              <section className="space-y-4 rounded-xl border border-slate-200/60 bg-white/75 p-5 shadow-sm dark:border-slate-800/70 dark:bg-slate-900/35">
                <div className="flex items-center gap-2.5 text-sm">
                  <div className="rounded-md bg-emerald-100 p-1.5 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
                    <MapPin className="h-4 w-4" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">Geographic Profile</h2>
                    <p className="text-xs text-muted-foreground">Outline the spatial footprint and demographic scale for this zone.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="area_km2">Area (km²)</Label>
                    <Input
                      id="area_km2"
                      type="number"
                      step="0.01"
                      value={data.area_km2}
                      onChange={event => handleFieldChange('area_km2', event.target.value)}
                      placeholder="e.g., 12450"
                      className={getFieldError('area_km2') ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}
                    />
                    {getFieldError('area_km2') && (
                      <p className="flex items-center gap-1 text-sm text-red-500">
                        <AlertCircle className="h-3 w-3" />
                        {getFieldError('area_km2')}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="population">Population</Label>
                    <Input
                      id="population"
                      type="number"
                      step="1"
                      value={data.population}
                      onChange={event => handleFieldChange('population', event.target.value)}
                      placeholder="e.g., 820000"
                      className={getFieldError('population') ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}
                    />
                    {getFieldError('population') && (
                      <p className="flex items-center gap-1 text-sm text-red-500">
                        <AlertCircle className="h-3 w-3" />
                        {getFieldError('population')}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="elevation_m">Elevation (m)</Label>
                    <Input
                      id="elevation_m"
                      type="number"
                      step="0.01"
                      value={data.elevation_m}
                      onChange={event => handleFieldChange('elevation_m', event.target.value)}
                      placeholder="e.g., 1325"
                      className={getFieldError('elevation_m') ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}
                    />
                    {getFieldError('elevation_m') && (
                      <p className="flex items-center gap-1 text-sm text-red-500">
                        <AlertCircle className="h-3 w-3" />
                        {getFieldError('elevation_m')}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="latitude">Latitude</Label>
                    <Input
                      id="latitude"
                      type="number"
                      step="0.000001"
                      value={data.latitude}
                      onChange={event => handleFieldChange('latitude', event.target.value)}
                      placeholder="e.g., 7.123456"
                      className={getFieldError('latitude') ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}
                    />
                    {getFieldError('latitude') && (
                      <p className="flex items-center gap-1 text-sm text-red-500">
                        <AlertCircle className="h-3 w-3" />
                        {getFieldError('latitude')}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="longitude">Longitude</Label>
                    <Input
                      id="longitude"
                      type="number"
                      step="0.000001"
                      value={data.longitude}
                      onChange={event => handleFieldChange('longitude', event.target.value)}
                      placeholder="e.g., 39.987654"
                      className={getFieldError('longitude') ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}
                    />
                    {getFieldError('longitude') && (
                      <p className="flex items-center gap-1 text-sm text-red-500">
                        <AlertCircle className="h-3 w-3" />
                        {getFieldError('longitude')}
                      </p>
                    )}
                  </div>
                </div>
              </section>

              <section className="space-y-4 rounded-xl border border-slate-200/60 bg-white/75 p-5 shadow-sm dark:border-slate-800/70 dark:bg-slate-900/35">
                <div className="flex items-center gap-2.5 text-sm">
                  <div className="rounded-md bg-emerald-100 p-1.5 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
                    <Flag className="h-4 w-4" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">Infrastructure & Climate</h2>
                    <p className="text-xs text-muted-foreground">Record the signals that drive logistics readiness across the zone.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="accessibility_score">Accessibility Score</Label>
                    <Input
                      id="accessibility_score"
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      value={data.accessibility_score}
                      onChange={event => handleFieldChange('accessibility_score', event.target.value)}
                      placeholder="0 - 100"
                      className={getFieldError('accessibility_score') ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}
                    />
                    {getFieldError('accessibility_score') && (
                      <p className="flex items-center gap-1 text-sm text-red-500">
                        <AlertCircle className="h-3 w-3" />
                        {getFieldError('accessibility_score')}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={data.description}
                      onChange={event => handleFieldChange('description', event.target.value)}
                      placeholder="Brief narrative on economic focus or network role"
                      className={`min-h-[100px] ${getFieldError('description') ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}`}
                    />
                    {getFieldError('description') && (
                      <p className="flex items-center gap-1 text-sm text-red-500">
                        <AlertCircle className="h-3 w-3" />
                        {getFieldError('description')}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="infrastructure_notes">Infrastructure Notes</Label>
                  <Textarea
                    id="infrastructure_notes"
                    value={data.infrastructure_notes}
                    onChange={event => handleFieldChange('infrastructure_notes', event.target.value)}
                    placeholder="Connectivity, utilities, telecom coverage, or constraints"
                    className={`min-h-[120px] ${getFieldError('infrastructure_notes') ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}`}
                  />
                  {getFieldError('infrastructure_notes') && (
                    <p className="flex items-center gap-1 text-sm text-red-500">
                      <AlertCircle className="h-3 w-3" />
                      {getFieldError('infrastructure_notes')}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="climate_profile">Climate Profile</Label>
                  <Textarea
                    id="climate_profile"
                    value={data.climate_profile}
                    onChange={event => handleFieldChange('climate_profile', event.target.value)}
                    placeholder="Seasonal patterns, weather alerts, or climate risks"
                    className={`min-h-[120px] ${getFieldError('climate_profile') ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}`}
                  />
                  {getFieldError('climate_profile') && (
                    <p className="flex items-center gap-1 text-sm text-red-500">
                      <AlertCircle className="h-3 w-3" />
                      {getFieldError('climate_profile')}
                    </p>
                  )}
                </div>
              </section>

              <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200/70 bg-white/80 px-6 py-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/40">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                    <span className="text-red-500">*</span>
                    <span>All required fields must be completed</span>
                  </div>
                  {isDirty && (
                    <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400">
                      <Save className="h-3 w-3" />
                      <span>You have unsaved changes</span>
                    </div>
                  )}
                </div>
                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    asChild
                    className="border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700"
                  >
                    <Link href="/zones">Cancel</Link>
                  </Button>
                  <Button
                    type="submit"
                    disabled={
                      processing
                      || Object.keys(frontendErrors).length > 0
                      || Boolean(Object.keys(errors).length > 0)
                    }
                    className="min-w-[160px] bg-gradient-to-r from-emerald-600 to-emerald-700 px-6 text-white shadow-lg transition-all duration-200 hover:from-emerald-700 hover:to-emerald-800 hover:shadow-xl"
                  >
                    {processing ? (
                      <>
                        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-white" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Create Zone
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>

        {showScrollTop && (
          <Button
            type="button"
            onClick={handleScrollToTop}
            className="fixed bottom-6 right-6 z-50 shadow-lg"
            variant="secondary"
            aria-label="Scroll to top"
          >
            <ArrowUp className="h-4 w-4" />
          </Button>
        )}
      </div>
    </AppLayout>
  )
}
