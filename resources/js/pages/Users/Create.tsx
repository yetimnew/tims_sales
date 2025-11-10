import { useState, useEffect } from 'react'
import { useForm } from '@inertiajs/react'
import { Link, Head } from '@inertiajs/react'
import { ArrowLeft, User, Shield, Mail, Save, CheckCircle, AlertCircle, Lock, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import AppLayout from '@/layouts/app-layout'
import { type BreadcrumbItem } from '@/types'
import { validateUser, type ValidationErrors } from '@/lib/validation'

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Users',
        href: '/users',
    },
    {
        title: 'Create',
        href: '/users/create',
    },
];

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
    const fieldErrors = validateUser(validationData, false)
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
    const validationErrors = validateUser(data, false)

    if (Object.keys(validationErrors).length > 0) {
      setFrontendErrors(validationErrors)
      toast({ title: 'Validation Error', description: 'Please fix all errors', variant: 'destructive' })
      return
    }

    post('/users')
  }

  const hasErrors = Object.keys(frontendErrors).length > 0 || Object.keys(errors).length > 0

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Create User" />
      <div className="flex h-full flex-1 flex-col gap-6 overflow-auto rounded-xl p-4">
        {/* Enhanced Professional Header */}
        <div className="bg-gradient-to-r from-slate-50 to-blue-50 dark:from-slate-900 dark:to-blue-950/20 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Create New User</h1>
                <p className="text-sm text-slate-600 dark:text-slate-400">Add a new user with role and permissions</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-sm font-medium">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                User Management
              </div>
            </div>
          </div>
        </div>

        {/* Professional Form */}
        <Card className="flex-1 shadow-xl border-0 bg-white dark:bg-slate-900/50 backdrop-blur-sm">
          <CardHeader className="p-6 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-slate-50 to-blue-50 dark:from-slate-800 dark:to-blue-950/20">
            <CardTitle className="flex items-center gap-3 text-lg font-semibold text-slate-900 dark:text-slate-100">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              User Details
            </CardTitle>
            <CardDescription className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              Enter comprehensive information for the new user
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            {hasErrors && (
              <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                <p className="text-sm text-red-700 dark:text-red-300">Please fix all errors in the form below</p>
              </div>
            )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="name" className="text-sm font-semibold text-slate-700 dark:text-slate-300">Name <span className="text-red-500">*</span></Label>
                </div>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    id="name"
                    type="text"
                    value={data.name}
                    onChange={e => handleFieldChange('name', e.target.value)}
                    placeholder="Enter user name"
                    className={`pl-10 transition-all duration-200 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 ${frontendErrors.name || errors.name ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : 'focus:ring-blue-500/20 focus:border-blue-500 hover:border-slate-400 dark:hover:border-slate-500'}`}
                  />
                </div>
                {(frontendErrors.name || errors.name) && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {frontendErrors.name || errors.name}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="email" className="text-sm font-semibold text-slate-700 dark:text-slate-300">Email <span className="text-red-500">*</span></Label>
                </div>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    id="email"
                    type="email"
                    value={data.email}
                    onChange={e => handleFieldChange('email', e.target.value)}
                    placeholder="Enter email address"
                    className={`pl-10 transition-all duration-200 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 ${frontendErrors.email || errors.email ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : 'focus:ring-blue-500/20 focus:border-blue-500 hover:border-slate-400 dark:hover:border-slate-500'}`}
                  />
                </div>
                {(frontendErrors.email || errors.email) && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {frontendErrors.email || errors.email}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="password" className="text-sm font-semibold text-slate-700 dark:text-slate-300">Password <span className="text-red-500">*</span></Label>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    id="password"
                    type="password"
                    value={data.password}
                    onChange={e => handleFieldChange('password', e.target.value)}
                    placeholder="Enter password"
                    className={`pl-10 transition-all duration-200 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 ${frontendErrors.password || errors.password ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : 'focus:ring-blue-500/20 focus:border-blue-500 hover:border-slate-400 dark:hover:border-slate-500'}`}
                  />
                </div>
                {(frontendErrors.password || errors.password) && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {frontendErrors.password || errors.password}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="password_confirmation" className="text-sm font-semibold text-slate-700 dark:text-slate-300">Confirm Password <span className="text-red-500">*</span></Label>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    id="password_confirmation"
                    type="password"
                    value={data.password_confirmation}
                    onChange={e => handleFieldChange('password_confirmation', e.target.value)}
                    placeholder="Confirm password"
                    className={`pl-10 transition-all duration-200 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 ${frontendErrors.password_confirmation || errors.password_confirmation ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : 'focus:ring-blue-500/20 focus:border-blue-500 hover:border-slate-400 dark:hover:border-slate-500'}`}
                  />
                </div>
                {(frontendErrors.password_confirmation || errors.password_confirmation) && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {frontendErrors.password_confirmation || errors.password_confirmation}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="role" className="text-sm font-semibold text-slate-700 dark:text-slate-300">Role <span className="text-red-500">*</span></Label>
              </div>
              <Select value={data.role} onValueChange={value => handleFieldChange('role', value)}>
                <SelectTrigger className={`transition-all duration-200 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500 focus:ring-blue-500/20 focus:border-blue-500 ${frontendErrors.role || errors.role ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}`}>
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-lg z-50">
                  {roles.map(role => (
                    <SelectItem
                      key={role.id}
                      value={role.name}
                      className="hover:bg-slate-100 dark:hover:bg-slate-700 focus:bg-slate-100 dark:focus:bg-slate-700"
                    >
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        {role.name.charAt(0).toUpperCase() + role.name.slice(1)}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {(frontendErrors.role || errors.role) && (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {frontendErrors.role || errors.role}
                </p>
              )}
            </div>

            <div className="flex items-center justify-between pt-6 border-t border-slate-200 dark:border-slate-700 bg-gradient-to-r from-slate-50 to-blue-50 dark:from-slate-800 dark:to-blue-950/20 -mx-6 px-6 -mb-6 rounded-b-lg">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                  <span className="text-red-500">*</span>
                  <span>All required fields must be completed</span>
                </div>
              </div>
              <div className="flex gap-3">
                <Button type="button" variant="outline" asChild className="hover:bg-slate-100 dark:hover:bg-slate-700 border-slate-300 dark:border-slate-600">
                  <a href="/users">Cancel</a>
                </Button>
                <Button
                  type="submit"
                  disabled={processing}
                  className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl transition-all duration-200 px-6 min-w-[140px]"
                >
                  {processing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Creating...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Create User
                    </>
                  )}
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
    </AppLayout>
  )
}

