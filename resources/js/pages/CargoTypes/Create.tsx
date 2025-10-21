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
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { validateCargoType } from '@/lib/validation'
import AppLayout from '@/layouts/app-layout'
import { CircleAlert } from 'lucide-react'

interface CargoTypeFormData {
  name: string
  category: string
  weight_per_cubic_meter?: string
  handling_requirements?: string
  safety_requirements?: string
}

export default function CargoTypesCreate() {
  const { toast } = useToast()
  const [frontendErrors, setFrontendErrors] = useState<Record<string, string>>({})

  const { data, setData, post, processing, errors } = useForm<CargoTypeFormData>({
    name: '',
    category: '',
    weight_per_cubic_meter: '',
    handling_requirements: '',
    safety_requirements: '',
  })

  useEffect(() => {
    if (Object.keys(errors).length > 0) {
      toast({
        title: 'Validation Error',
        description: 'Please fix the errors in the form',
        variant: 'destructive',
      })
    }
  }, [errors])

  const validateField = (field: string, value: string) => {
    const validateObj = { ...data, [field]: value }
    const errors = validateCargoType(validateObj)
    return errors[field] || ''
  }

  const handleFieldChange = (field: string, value: string) => {
    setData(field as keyof CargoTypeFormData, value)
    if (frontendErrors[field]) {
      const error = validateField(field, value)
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

    const validationErrors = validateCargoType(data)
    if (Object.keys(validationErrors).length > 0) {
      setFrontendErrors(validationErrors)
      toast({
        title: 'Validation Error',
        description: 'Please fix all errors before submitting',
        variant: 'destructive',
      })
      return
    }

    post(route('cargo-types.store'))
  }

  const hasErrors = Object.keys(frontendErrors).length > 0 || Object.keys(errors).length > 0

  return (
    <div className="flex h-full flex-1 flex-col gap-6 overflow-auto p-4">
      <div className="flex items-center gap-4">
        <Link href={route('cargo-types.index')}>
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">Create Cargo Type</h1>
      </div>

      <Card className="max-w-2xl">
        <CardHeader className="border-b">
          <h2 className="text-lg font-semibold">New Cargo Type Details</h2>
        </CardHeader>
        <CardContent className="pt-6">
          {hasErrors && (
            <Alert variant="destructive" className="mb-6">
              <CircleAlert className="h-4 w-4" />
              <AlertDescription>
                Please fix all errors in the form below
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                type="text"
                value={data.name}
                onChange={e => handleFieldChange('name', e.target.value)}
                placeholder="Enter cargo type name"
                className={frontendErrors.name || errors.name ? 'border-red-500' : ''}
              />
              {(frontendErrors.name || errors.name) && (
                <p className="text-sm text-red-500">{frontendErrors.name || errors.name}</p>
              )}
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Select value={data.category} onValueChange={value => handleFieldChange('category', value)}>
                <SelectTrigger
                  id="category"
                  className={frontendErrors.category || errors.category ? 'border-red-500' : ''}
                >
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Construction">Construction</SelectItem>
                  <SelectItem value="Agricultural">Agricultural</SelectItem>
                  <SelectItem value="Industrial">Industrial</SelectItem>
                </SelectContent>
              </Select>
              {(frontendErrors.category || errors.category) && (
                <p className="text-sm text-red-500">{frontendErrors.category || errors.category}</p>
              )}
            </div>

            {/* Weight per Cubic Meter */}
            <div className="space-y-2">
              <Label htmlFor="weight">Weight per Cubic Meter</Label>
              <Input
                id="weight"
                type="number"
                step="0.01"
                value={data.weight_per_cubic_meter}
                onChange={e => handleFieldChange('weight_per_cubic_meter', e.target.value)}
                placeholder="e.g., 1500.50"
                className={frontendErrors.weight_per_cubic_meter ? 'border-red-500' : ''}
              />
              {frontendErrors.weight_per_cubic_meter && (
                <p className="text-sm text-red-500">{frontendErrors.weight_per_cubic_meter}</p>
              )}
            </div>

            {/* Handling Requirements */}
            <div className="space-y-2">
              <Label htmlFor="handling">Handling Requirements</Label>
              <Textarea
                id="handling"
                value={data.handling_requirements}
                onChange={e => setData('handling_requirements', e.target.value)}
                placeholder="Enter any special handling requirements"
                className="min-h-20"
              />
            </div>

            {/* Safety Requirements */}
            <div className="space-y-2">
              <Label htmlFor="safety">Safety Requirements</Label>
              <Textarea
                id="safety"
                value={data.safety_requirements}
                onChange={e => setData('safety_requirements', e.target.value)}
                placeholder="Enter any safety requirements"
                className="min-h-20"
              />
            </div>

            {/* Submit Button */}
            <div className="flex gap-2 pt-4">
              <Button type="submit" disabled={processing || hasErrors} className="flex-1">
                Create Cargo Type
              </Button>
              <Link href={route('cargo-types.index')}>
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

CargoTypesCreate.layout = (page: React.ReactNode) => <AppLayout children={page} />
