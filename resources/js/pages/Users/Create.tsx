import { useState, useEffect } from 'react'
import { useForm } from '@inertiajs/react'
import { Link } from '@inertiajs/react'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import AppLayout from '@/layouts/app-layout'
import { CircleAlert } from 'lucide-react'
import { validateUser, type ValidationErrors } from '@/lib/validation'

interface Role {
  id: number
  name: string
}

interface UserFormData {
  name: string
  email: string
  password: string
  password_confirmation: string
  role: string
}

interface UsersCreateProps {
  roles: Role[]
}

export default function UsersCreate({ roles }: UsersCreateProps) {
  const { toast } = useToast()
  const [frontendErrors, setFrontendErrors] = useState<Record<string, string>>({})
  const { data, setData, post, processing, errors } = useForm<UserFormData>({
    name: '',
    email: '',
    password: '',
    password_confirmation: '',
    role: '',
  })

  useEffect(() => {
    if (Object.keys(errors).length > 0) {
      toast({ title: 'Validation Error', description: 'Please fix the errors', variant: 'destructive' })
    }
  }, [errors])

  const validateField = (field: string, value: string) => {
    const validationData = { ...data, [field]: value }
    const fieldErrors = validateUser(validationData)
    const error = fieldErrors[field as keyof ValidationErrors] || ''

    setFrontendErrors(prev => ({
      ...prev,
      [field]: error
    }))
  }

  const handleFieldChange = (field: string, value: string) => {
    setData(field as keyof UserFormData, value)
    validateField(field, value)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Frontend validation
    const validationErrors = validateUser(data)

    if (Object.keys(validationErrors).length > 0) {
      setFrontendErrors(validationErrors)
      toast({ title: 'Validation Error', description: 'Please fix all errors', variant: 'destructive' })
      return
    }

    post(route('users.store'))
  }

  const hasErrors = Object.keys(frontendErrors).length > 0 || Object.keys(errors).length > 0

  return (
    <div className="flex h-full flex-1 flex-col gap-6 overflow-auto p-4">
      <div className="flex items-center gap-4">
        <Link href={route('users.index')}>
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">Create User</h1>
      </div>

      <Card className="max-w-2xl">
        <CardHeader className="border-b">
          <h2 className="text-lg font-semibold">New User Details</h2>
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
                placeholder="Enter user name"
                className={frontendErrors.name || errors.name ? 'border-red-500' : ''}
              />
              {(frontendErrors.name || errors.name) && (
                <p className="text-sm text-red-500">{frontendErrors.name || errors.name}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
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
              <Label htmlFor="password">Password *</Label>
              <Input
                id="password"
                type="password"
                value={data.password}
                onChange={e => handleFieldChange('password', e.target.value)}
                placeholder="Enter password"
                className={frontendErrors.password || errors.password ? 'border-red-500' : ''}
              />
              {(frontendErrors.password || errors.password) && (
                <p className="text-sm text-red-500">{frontendErrors.password || errors.password}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password_confirmation">Confirm Password *</Label>
              <Input
                id="password_confirmation"
                type="password"
                value={data.password_confirmation}
                onChange={e => handleFieldChange('password_confirmation', e.target.value)}
                placeholder="Confirm password"
                className={frontendErrors.password_confirmation || errors.password_confirmation ? 'border-red-500' : ''}
              />
              {(frontendErrors.password_confirmation || errors.password_confirmation) && (
                <p className="text-sm text-red-500">{frontendErrors.password_confirmation || errors.password_confirmation}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Role *</Label>
              <Select value={data.role} onValueChange={value => handleFieldChange('role', value)}>
                <SelectTrigger className={frontendErrors.role || errors.role ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map(role => (
                    <SelectItem key={role.id} value={role.name}>
                      {role.name.charAt(0).toUpperCase() + role.name.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {(frontendErrors.role || errors.role) && (
                <p className="text-sm text-red-500">{frontendErrors.role || errors.role}</p>
              )}
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="submit" disabled={processing || hasErrors} className="flex-1">
                Create User
              </Button>
              <Link href={route('users.index')}>
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

UsersCreate.layout = (page: React.ReactNode) => <AppLayout children={page} />

