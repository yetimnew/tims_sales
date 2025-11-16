import { useCallback, useEffect, useRef, useState, type FormEventHandler } from 'react'
import { Head, Link, useForm } from '@inertiajs/react'
import AppLayout from '@/layouts/app-layout'
import { type BreadcrumbItem } from '@/types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { validatePlace, type ValidationErrors } from '@/lib/validation'
import {
  AlertCircle,
  ArrowLeft,
  ArrowUp,
  CheckCircle,
  Compass,
  FileText,
  MapPin,
  Navigation,
  Save,
} from 'lucide-react'

interface WoredaOption {
  id: number
  name: string
}

type PlaceFormData = {
  name: string
  status: 'active' | 'inactive'
  code: string
  woreda_id: string
  latitude: string
  longitude: string
  elevation_m: string
  population: string
  is_logistics_hub: boolean
  accessibility_score: string
  description: string
  infrastructure_notes: string
  road_quality_notes: string
}

interface PlacesCreateProps {
  woredas: WoredaOption[]
}

const breadcrumbs: BreadcrumbItem[] = [
  {
    title: 'Places',
    href: '/places',
  },
  {
    title: 'Create',
    href: '/places/create',
  },
]

export default function PlacesCreate({ woredas }: PlacesCreateProps) {
  const { data, setData, post, processing, errors, reset } = useForm<PlaceFormData>({
    name: '',
    status: 'active',
    code: '',
    woreda_id: '',
    latitude: '',
    longitude: '',
    elevation_m: '',
    population: '',
    is_logistics_hub: false,
    accessibility_score: '',
    description: '',
    infrastructure_notes: '',
    road_quality_notes: '',
  })

  const [frontendErrors, setFrontendErrors] = useState<ValidationErrors>({})
  const [isDirty, setIsDirty] = useState(false)
  const [showScrollTop, setShowScrollTop] = useState(false)
  const scrollContainerRef = useRef<HTMLFormElement | null>(null)

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

  const setFieldError = useCallback((field: keyof PlaceFormData, message: string) => {
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
    (field: keyof PlaceFormData, value: string) => {
      const nextValues: PlaceFormData = { ...data, [field]: value } as PlaceFormData
      const fieldErrors = validatePlace(nextValues)
      setFieldError(field, fieldErrors[field] ?? '')
    },
    [data, setFieldError]
  )

  const handleFieldChange = useCallback(
    (field: keyof PlaceFormData, value: string) => {
      setData(field, value as PlaceFormData[keyof PlaceFormData])
      validateField(field, value)
      setIsDirty(true)
    },
    [setData, validateField]
  )

  const handleCheckboxChange = useCallback(
    (checked: boolean) => {
      setData('is_logistics_hub', checked)
      setIsDirty(true)
    },
    [setData]
  )

  const submit: FormEventHandler = event => {
    event.preventDefault()

    const validationResults = validatePlace(data)
    if (Object.keys(validationResults).length > 0) {
      setFrontendErrors(validationResults)
      return
    }

    post('/places', {
      preserveScroll: true,
      onSuccess: () => {
        setFrontendErrors({})
        setIsDirty(false)
        reset()
      },
    })
  }

  const getFieldError = useCallback(
    (field: keyof PlaceFormData) => errors[field] || frontendErrors[field] || '',
    [errors, frontendErrors]
  )

  const handleScrollToTop = () => {
    scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Create Place" />
      <div className="flex h-full flex-1 flex-col gap-6 overflow-hidden rounded-xl p-4">
        <Card className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-slate-200/70 bg-white/95 text-card-foreground shadow-xl backdrop-blur-lg dark:border-slate-800/60 dark:bg-slate-900/70">
          <CardHeader className="px-6 pb-0">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex items-start gap-4">
                <div className="rounded-xl bg-rose-100 p-2 text-rose-600 shadow-sm dark:bg-rose-900/30 dark:text-rose-400">
                  <Navigation className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
                    Register New Place
                  </CardTitle>
                  <CardDescription className="text-sm text-slate-600 dark:text-slate-400">
                    Capture granular destination data, accessibility signals, and logistics capabilities for routing.
                  </CardDescription>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/places">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Places
                  </Link>
                </Button>
                {isDirty && (
                  <div className="flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1.5 text-sm font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                    <Save className="h-3 w-3" />
                    Unsaved Changes
                  </div>
                )}
                <div className="flex items-center gap-2 rounded-full bg-rose-100 px-3 py-1.5 text-sm font-medium text-rose-700 dark:bg-rose-900/30 dark:text-rose-300">
                  <div className="h-2 w-2 animate-pulse rounded-full bg-rose-500" />
                  Location Intelligence
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="flex flex-1 flex-col overflow-hidden p-0">
            <form
              ref={scrollContainerRef}
              onSubmit={submit}
              className="flex flex-1 flex-col gap-8 overflow-y-auto p-6 pb-24"
              style={{ minHeight: 0 }}
              noValidate
            >
              <section className="space-y-4 rounded-xl border border-slate-200/60 bg-white/75 p-5 shadow-sm dark:border-slate-800/70 dark:bg-slate-900/35">
                <div className="flex items-center gap-2.5 text-sm">
                  <div className="rounded-md bg-rose-100 p-1.5 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400">
                    <MapPin className="h-4 w-4" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">Place Identity</h2>
                    <p className="text-xs text-muted-foreground">Define how this location appears across planning and operations.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">
                      Place Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="name"
                      type="text"
                      value={data.name}
                      onChange={event => handleFieldChange('name', event.target.value)}
                      placeholder="e.g., Modjo Dry Port"
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
                    <Label htmlFor="woreda_id">
                      Woreda <span className="text-red-500">*</span>
                    </Label>
                    <Select value={data.woreda_id} onValueChange={value => handleFieldChange('woreda_id', value)}>
                      <SelectTrigger className={getFieldError('woreda_id') ? 'border-red-500 focus:ring-red-500/20' : ''}>
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
                    {getFieldError('woreda_id') && (
                      <p className="flex items-center gap-1 text-sm text-red-500">
                        <AlertCircle className="h-3 w-3" />
                        {getFieldError('woreda_id')}
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
                    <Label htmlFor="code">Place Code</Label>
                    <Input
                      id="code"
                      type="text"
                      value={data.code}
                      onChange={event => handleFieldChange('code', event.target.value)}
                      placeholder="e.g., PL-204"
                      className={getFieldError('code') ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}
                    />
                    {getFieldError('code') && (
                      <p className="flex items-center gap-1 text-sm text-red-500">
                        <AlertCircle className="h-3 w-3" />
                        {getFieldError('code')}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-3 rounded-md border border-slate-200/70 bg-slate-50 px-3 py-2 text-sm text-slate-700 dark:border-slate-800/60 dark:bg-slate-900/30 dark:text-slate-300 md:col-span-2">
                    <Checkbox
                      id="is_logistics_hub"
                      checked={data.is_logistics_hub}
                      onCheckedChange={value => handleCheckboxChange(Boolean(value))}
                    />
                    <Label htmlFor="is_logistics_hub" className="cursor-pointer">
                      Mark as logistics hub (key fulfillment or consolidation point)
                    </Label>
                  </div>
                </div>
              </section>

              <section className="space-y-4 rounded-xl border border-slate-200/60 bg-white/75 p-5 shadow-sm dark:border-slate-800/70 dark:bg-slate-900/35">
                <div className="flex items-center gap-2.5 text-sm">
                  <div className="rounded-md bg-rose-100 p-1.5 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400">
                    <Compass className="h-4 w-4" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">Geo Coordinates & Scale</h2>
                    <p className="text-xs text-muted-foreground">Provide accurate coordinates and coverage for routing accuracy.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="latitude">Latitude</Label>
                    <Input
                      id="latitude"
                      type="number"
                      step="0.000001"
                      value={data.latitude}
                      onChange={event => handleFieldChange('latitude', event.target.value)}
                      placeholder="e.g., 8.980603"
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
                      placeholder="e.g., 38.757761"
                      className={getFieldError('longitude') ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}
                    />
                    {getFieldError('longitude') && (
                      <p className="flex items-center gap-1 text-sm text-red-500">
                        <AlertCircle className="h-3 w-3" />
                        {getFieldError('longitude')}
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
                      placeholder="e.g., 2145"
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
                    <Label htmlFor="population">Population</Label>
                    <Input
                      id="population"
                      type="number"
                      step="1"
                      value={data.population}
                      onChange={event => handleFieldChange('population', event.target.value)}
                      placeholder="e.g., 45000"
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
                </div>
              </section>

              <section className="space-y-4 rounded-xl border border-slate-200/60 bg-white/75 p-5 shadow-sm dark:border-slate-800/70 dark:bg-slate-900/35">
                <div className="flex items-center gap-2.5 text-sm">
                  <div className="rounded-md bg-rose-100 p-1.5 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">Operational Insights</h2>
                    <p className="text-xs text-muted-foreground">Document infrastructure readiness and road intelligence for dispatch teams.</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={data.description}
                    onChange={event => handleFieldChange('description', event.target.value)}
                    placeholder="Purpose, services available, or notable details about this location"
                    className={`min-h-[100px] ${getFieldError('description') ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}`}
                  />
                  {getFieldError('description') && (
                    <p className="flex items-center gap-1 text-sm text-red-500">
                      <AlertCircle className="h-3 w-3" />
                      {getFieldError('description')}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="infrastructure_notes">Infrastructure Notes</Label>
                  <Textarea
                    id="infrastructure_notes"
                    value={data.infrastructure_notes}
                    onChange={event => handleFieldChange('infrastructure_notes', event.target.value)}
                    placeholder="Utilities, storage capacity, security, or communication coverage"
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
                  <Label htmlFor="road_quality_notes">Road Quality Notes</Label>
                  <Textarea
                    id="road_quality_notes"
                    value={data.road_quality_notes}
                    onChange={event => handleFieldChange('road_quality_notes', event.target.value)}
                    placeholder="Surface conditions, seasonal risks, or alternate routes"
                    className={`min-h-[120px] ${getFieldError('road_quality_notes') ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}`}
                  />
                  {getFieldError('road_quality_notes') && (
                    <p className="flex items-center gap-1 text-sm text-red-500">
                      <AlertCircle className="h-3 w-3" />
                      {getFieldError('road_quality_notes')}
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
                    <Link href="/places">Cancel</Link>
                  </Button>
                  <Button
                    type="submit"
                    disabled={
                      processing
                      || Object.keys(frontendErrors).length > 0
                      || Boolean(Object.keys(errors).length > 0)
                    }
                    className="min-w-[160px] bg-gradient-to-r from-rose-600 to-rose-700 px-6 text-white shadow-lg transition-all duration-200 hover:from-rose-700 hover:to-rose-800 hover:shadow-xl"
                  >
                    {processing ? (
                      <>
                        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-white" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Create Place
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

