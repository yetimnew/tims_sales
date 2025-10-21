import { useState, useEffect } from 'react'
import { useForm } from '@inertiajs/react'
import { Link } from '@inertiajs/react'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useToast } from '@/hooks/use-toast'
import { validateCustomer } from '@/lib/validation'
import AppLayout from '@/layouts/app-layout'
import { CircleAlert } from 'lucide-react'

interface CustomerFormData {
  name: string
  email?: string
  phone?: string
  address?: string
  contact_person?: string
}

export default function CustomersCreate() {
  const { toast } = useToast()
  const [frontendErrors, setFrontendErrors] = useState<Record<string, string>>({})
  const { data, setData, post, processing, errors } = useForm<CustomerFormData>({
    name: '',
    email: '',
    phone: '',
    address: '',
    contact_person: '',
  })

  useEffect(() => {
    if (Object.keys(errors).length > 0) {
      toast({ title: 'Validation Error', description: 'Please fix the errors', variant: 'destructive' })
    }
  }, [errors])

  const handleFieldChange = (field: string, value: string) => {
    setData(field as keyof CustomerFormData, value)
    if (frontendErrors[field]) {
      const validationErrors = validateCustomer({ ...data, [field]: value })
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
    const validationErrors = validateCustomer(data)
    if (Object.keys(validationErrors).length > 0) {
      setFrontendErrors(validationErrors)
      toast({ title: 'Validation Error', description: 'Please fix all errors', variant: 'destructive' })
      return
    }
    post(route('customers.store'))
  }

  const hasErrors = Object.keys(frontendErrors).length > 0 || Object.keys(errors).length > 0

  return (
    <div className="flex h-full flex-1 flex-col gap-6 overflow-auto p-4">
      <div className="flex items-center gap-4">
        <Link href={route('customers.index')}>
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">Create Customer</h1>
      </div>

      <Card className="max-w-2xl">
        <CardHeader className="border-b">
          <h2 className="text-lg font-semibold">New Customer Details</h2>
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
                placeholder="Enter customer name"
                className={frontendErrors.name || errors.name ? 'border-red-500' : ''}
              />
              {(frontendErrors.name || errors.name) && (
                <p className="text-sm text-red-500">{frontendErrors.name || errors.name}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={data.email}
                onChange={e => handleFieldChange('email', e.target.value)}
                placeholder="Enter email address"
                className={frontendErrors.email || errors.email ? 'border-red-500' : ''}
              />
              {(frontendErrors.email || errors.email) && (
                <p className="text-sm text-red-500">{frontendErrors.email || errors.email}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                type="tel"
                value={data.phone}
                onChange={e => handleFieldChange('phone', e.target.value)}
                placeholder="Enter phone number"
                className={frontendErrors.phone || errors.phone ? 'border-red-500' : ''}
              />
              {(frontendErrors.phone || errors.phone) && (
                <p className="text-sm text-red-500">{frontendErrors.phone || errors.phone}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Textarea
                id="address"
                value={data.address}
                onChange={e => setData('address', e.target.value)}
                placeholder="Enter customer address"
                className="min-h-20"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact_person">Contact Person</Label>
              <Input
                id="contact_person"
                type="text"
                value={data.contact_person}
                onChange={e => setData('contact_person', e.target.value)}
                placeholder="Enter contact person name"
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="submit" disabled={processing || hasErrors} className="flex-1">
                Create Customer
              </Button>
              <Link href={route('customers.index')}>
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

CustomersCreate.layout = (page: React.ReactNode) => <AppLayout children={page} />

