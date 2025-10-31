import { useState, useEffect } from 'react'
import { useForm } from '@inertiajs/react'
import { Link, Head } from '@inertiajs/react'
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
import { type BreadcrumbItem } from '@/types'

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Users',
        href: '/users',
    },
    {
        title: 'Edit',
        href: '/users/edit',
    },
];

interface Role {
  id: number
  name: string
}

interface User {
  id: number
  name: string
  email: string
  roles?: Role[]
}

interface UserFormData {
  name: string
  email: string
  password?: string
  password_confirmation?: string
  role: string
}

interface UserEditProps {
  user: User
  roles: Role[]
}

export default function UsersEdit({ user, roles }: UserEditProps) {
  const { toast } = useToast()
  const [frontendErrors, setFrontendErrors] = useState<Record<string, string>>({})
  const { data, setData, put, processing, errors } = useForm<UserFormData>({
    name: user.name,
    email: user.email,
    password: '',
    password_confirmation: '',
    role: user.roles?.[0]?.name || '',
  })

  useEffect(() => {
    if (Object.keys(errors).length > 0) {
      toast({ title: 'Validation Error', description: 'Please fix the errors', variant: 'destructive' })
    }
  }, [errors])

  const validateField = (field: string, value: string) => {
    const validationData = { ...data, [field]: value }
    const fieldErrors = validateUser(validationData, true)
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

    // Frontend validation - pass isEdit=true to skip password validation if not provided
    const validationErrors = validateUser(data, true)

    if (Object.keys(validationErrors).length > 0) {
      setFrontendErrors(validationErrors)
      toast({ title: 'Validation Error', description: 'Please fix all errors', variant: 'destructive' })
      return
    }

    // Create payload - only include password if provided
    const payload: UserFormData = {
      name: data.name,
      email: data.email,
      role: data.role,
    }

    if (data.password && data.password.trim() !== '') {
      payload.password = data.password
      payload.password_confirmation = data.password_confirmation
    }

    // Use transform to filter out empty password fields
    put(`/users/${user.id}`, {
      transformRequest: [(data: any) => {
        const transformed = { ...data }
        if (!transformed.password || transformed.password.trim() === '') {
          delete transformed.password
          delete transformed.password_confirmation
        }
        return transformed
      }]
    })
  }

  const hasErrors = Object.keys(frontendErrors).length > 0 || Object.keys(errors).length > 0

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Edit User" />
      <div className="flex h-full flex-1 flex-col gap-6 overflow-auto p-4">
      <div className="flex items-center gap-4">
        <Link href="/users">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">Edit User</h1>
      </div>

      <Card className="max-w-2xl">
        <CardHeader className="border-b">
          <h2 className="text-lg font-semibold">Update User Details</h2>
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
              <Label htmlFor="password">New Password (leave blank to keep current)</Label>
              <Input
                id="password"
                type="password"
                value={data.password}
                onChange={e => handleFieldChange('password', e.target.value)}
                placeholder="Enter new password"
                className={frontendErrors.password || errors.password ? 'border-red-500' : ''}
              />
              {(frontendErrors.password || errors.password) && (
                <p className="text-sm text-red-500">{frontendErrors.password || errors.password}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password_confirmation">Confirm New Password</Label>
              <Input
                id="password_confirmation"
                type="password"
                value={data.password_confirmation}
                onChange={e => handleFieldChange('password_confirmation', e.target.value)}
                placeholder="Confirm new password"
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
              <Button type="submit" disabled={processing} className="flex-1">
                Update User
              </Button>
              <Link href="/users">
                <Button type="button" variant="outline" className="flex-1">
                  Cancel
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
      </div>
    </AppLayout>
  )
}

