import { useState, useEffect, useMemo } from 'react'
import { useForm } from '@inertiajs/react'
import { Link, Head } from '@inertiajs/react'
import { ArrowLeft, CircleAlert, User, Mail, Lock, Shield, ChevronDown, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { useToast } from '@/hooks/use-toast'
import AppLayout from '@/layouts/app-layout'
import { validateUser, type ValidationErrors } from '@/lib/validation'
import { type BreadcrumbItem } from '@/types'
import { evaluatePasswordStrength } from '@/lib/password-strength'

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
  const [openSections, setOpenSections] = useState({
    profile: true,
    access: true,
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showPasswordConfirmation, setShowPasswordConfirmation] = useState(false)
  const passwordStrength = useMemo(() => evaluatePasswordStrength(data.password ?? ''), [data.password])

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

    put(`/users/${user.id}`, payload)
  }

  const hasErrors = Object.keys(frontendErrors).length > 0 || Object.keys(errors).length > 0

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Edit User" />
      <div className="flex h-full flex-1 flex-col gap-6 overflow-auto p-4">
        <div className="rounded-lg border border-slate-200 bg-gradient-to-r from-slate-50 to-indigo-50 p-4 shadow-sm dark:border-slate-700 dark:from-slate-900 dark:to-indigo-950/30">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="icon"
                asChild
                className="border-slate-300 hover:bg-slate-100 dark:border-slate-600 dark:hover:bg-slate-800"
              >
                <Link href="/users">
                  <ArrowLeft className="h-4 w-4" />
                </Link>
              </Button>
              <div>
                <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Update User</h1>
                <p className="text-sm text-slate-600 dark:text-slate-400">Tune account details and security access for this teammate.</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-300">
              <span className="rounded-full bg-white px-3 py-1.5 shadow-sm dark:bg-slate-900/60">User ID #{user.id}</span>
            </div>
          </div>
        </div>

        <Card className="flex-1 border-0 bg-white shadow-xl dark:bg-slate-900/60">
          <CardHeader className="border-b border-slate-200 bg-gradient-to-r from-slate-50 to-indigo-50 dark:border-slate-700 dark:from-slate-900 dark:to-indigo-950/30">
            <CardTitle className="flex items-center gap-3 text-lg text-slate-900 dark:text-slate-100">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300">
                <Shield className="h-4 w-4" />
              </span>
              User Settings
            </CardTitle>
            <CardDescription className="text-sm text-slate-600 dark:text-slate-400">
              Maintain accurate contact information and keep credentials up to date.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            {hasErrors && (
              <div className="mb-6 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">
                <CircleAlert className="h-5 w-5" />
                <span>Please fix all errors in the form below.</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <Collapsible
                  open={openSections.profile}
                  onOpenChange={value => setOpenSections(prev => ({ ...prev, profile: value }))}
                  className="group/collapsible overflow-hidden rounded-xl border border-slate-200/80 bg-white/95 shadow-sm backdrop-blur-sm dark:border-slate-700/70 dark:bg-slate-900/40"
                >
                  <CollapsibleTrigger asChild>
                    <button
                      type="button"
                      className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left text-sm font-semibold text-slate-800 transition hover:bg-slate-50 dark:text-slate-100 dark:hover:bg-slate-900/60"
                    >
                      <span className="inline-flex items-center gap-3">
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                          <User className="h-4 w-4" />
                        </span>
                        <span className="flex flex-col">
                          <span>Profile &amp; Contact</span>
                          <span className="text-xs font-normal text-slate-500 dark:text-slate-400">Keep the name and email current.</span>
                        </span>
                      </span>
                      <ChevronDown className="h-4 w-4 text-slate-500 transition-transform group-data-[state=open]/collapsible:rotate-180" />
                    </button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-6 border-t border-slate-200/70 px-5 pb-6 pt-5 dark:border-slate-700/60">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="name" className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                          Name <span className="text-red-500">*</span>
                        </Label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                          <Input
                            id="name"
                            type="text"
                            value={data.name}
                            onChange={event => handleFieldChange('name', event.target.value)}
                            placeholder="Enter user name"
                            className={`pl-10 transition-all duration-200 bg-white dark:bg-slate-900/60 border-slate-300 dark:border-slate-700 ${frontendErrors.name || errors.name ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : 'hover:border-slate-400 focus:border-indigo-500 focus:ring-indigo-500/20 dark:hover:border-slate-500'}`}
                          />
                        </div>
                        {(frontendErrors.name || errors.name) && (
                          <p className="flex items-center gap-1 text-sm text-red-500">
                            <CircleAlert className="h-3.5 w-3.5" />
                            {frontendErrors.name || errors.name}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                          Email <span className="text-red-500">*</span>
                        </Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                          <Input
                            id="email"
                            type="email"
                            value={data.email}
                            onChange={event => handleFieldChange('email', event.target.value)}
                            placeholder="Enter email address"
                            className={`pl-10 transition-all duration-200 bg-white dark:bg-slate-900/60 border-slate-300 dark:border-slate-700 ${frontendErrors.email || errors.email ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : 'hover:border-slate-400 focus:border-indigo-500 focus:ring-indigo-500/20 dark:hover:border-slate-500'}`}
                          />
                        </div>
                        {(frontendErrors.email || errors.email) && (
                          <p className="flex items-center gap-1 text-sm text-red-500">
                            <CircleAlert className="h-3.5 w-3.5" />
                            {frontendErrors.email || errors.email}
                          </p>
                        )}
                      </div>
                    </div>
                  </CollapsibleContent>
                </Collapsible>

                <Collapsible
                  open={openSections.access}
                  onOpenChange={value => setOpenSections(prev => ({ ...prev, access: value }))}
                  className="group/collapsible overflow-hidden rounded-xl border border-slate-200/80 bg-white/95 shadow-sm backdrop-blur-sm dark:border-slate-700/70 dark:bg-slate-900/40"
                >
                  <CollapsibleTrigger asChild>
                    <button
                      type="button"
                      className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left text-sm font-semibold text-slate-800 transition hover:bg-slate-50 dark:text-slate-100 dark:hover:bg-slate-900/60"
                    >
                      <span className="inline-flex items-center gap-3">
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300">
                          <Shield className="h-4 w-4" />
                        </span>
                        <span className="flex flex-col">
                          <span>Access &amp; Security</span>
                          <span className="text-xs font-normal text-slate-500 dark:text-slate-400">Update role or rotate credentials as needed.</span>
                        </span>
                      </span>
                      <ChevronDown className="h-4 w-4 text-slate-500 transition-transform group-data-[state=open]/collapsible:rotate-180" />
                    </button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-6 border-t border-slate-200/70 px-5 pb-6 pt-5 dark:border-slate-700/60">
                    <div className="space-y-2">
                      <Label htmlFor="role" className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                        Role <span className="text-red-500">*</span>
                      </Label>
                      <Select value={data.role} onValueChange={value => handleFieldChange('role', value)}>
                        <SelectTrigger className={`transition-all duration-200 bg-white dark:bg-slate-900/60 border-slate-300 dark:border-slate-700 hover:border-slate-400 focus:border-indigo-500 focus:ring-indigo-500/20 dark:hover:border-slate-600 ${frontendErrors.role || errors.role ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}`}>
                          <SelectValue placeholder="Select a role" />
                        </SelectTrigger>
                        <SelectContent className="z-50 max-h-64 bg-white dark:bg-slate-900/80">
                          {roles.map(role => (
                            <SelectItem key={role.id} value={role.name} className="hover:bg-slate-100 dark:hover:bg-slate-800">
                              <div className="flex items-center gap-2">
                                <Shield className="h-4 w-4" />
                                {role.name.charAt(0).toUpperCase() + role.name.slice(1)}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {(frontendErrors.role || errors.role) && (
                        <p className="flex items-center gap-1 text-sm text-red-500">
                          <CircleAlert className="h-3.5 w-3.5" />
                          {frontendErrors.role || errors.role}
                        </p>
                      )}
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="password" className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                            New Password
                          </Label>
                          <span className="text-xs text-slate-500 dark:text-slate-400">Leave blank to keep current password</span>
                        </div>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                          <Input
                            id="password"
                            type={showPassword ? 'text' : 'password'}
                            value={data.password}
                            onChange={event => handleFieldChange('password', event.target.value)}
                            placeholder="Enter new password"
                            className={`pl-10 pr-12 transition-all duration-200 bg-white dark:bg-slate-900/60 border-slate-300 dark:border-slate-700 ${frontendErrors.password || errors.password ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : 'hover:border-slate-400 focus:border-indigo-500 focus:ring-indigo-500/20 dark:hover:border-slate-600'}`}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(prev => !prev)}
                            className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-500 transition hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                            aria-label={showPassword ? 'Hide password' : 'Show password'}
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                        {data.password && (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-xs font-medium text-slate-500 dark:text-slate-400">
                              <span>Password strength</span>
                              <span className={passwordStrength.textClass}>{passwordStrength.label}</span>
                            </div>
                            <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-800">
                              <div
                                className={`h-2 rounded-full transition-all duration-300 ${passwordStrength.barClass}`}
                                style={{ width: `${passwordStrength.progress}%` }}
                              />
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400">{passwordStrength.hint}</p>
                          </div>
                        )}
                        {(frontendErrors.password || errors.password) && (
                          <p className="flex items-center gap-1 text-sm text-red-500">
                            <CircleAlert className="h-3.5 w-3.5" />
                            {frontendErrors.password || errors.password}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="password_confirmation" className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                          Confirm New Password
                        </Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                          <Input
                            id="password_confirmation"
                            type={showPasswordConfirmation ? 'text' : 'password'}
                            value={data.password_confirmation}
                            onChange={event => handleFieldChange('password_confirmation', event.target.value)}
                            placeholder="Confirm new password"
                            className={`pl-10 pr-12 transition-all duration-200 bg-white dark:bg-slate-900/60 border-slate-300 dark:border-slate-700 ${frontendErrors.password_confirmation || errors.password_confirmation ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : 'hover:border-slate-400 focus:border-indigo-500 focus:ring-indigo-500/20 dark:hover:border-slate-600'}`}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPasswordConfirmation(prev => !prev)}
                            className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-500 transition hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                            aria-label={showPasswordConfirmation ? 'Hide password confirmation' : 'Show password confirmation'}
                          >
                            {showPasswordConfirmation ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                        {(frontendErrors.password_confirmation || errors.password_confirmation) && (
                          <p className="flex items-center gap-1 text-sm text-red-500">
                            <CircleAlert className="h-3.5 w-3.5" />
                            {frontendErrors.password_confirmation || errors.password_confirmation}
                          </p>
                        )}
                      </div>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </div>

              <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-gradient-to-r from-slate-50 to-indigo-50 px-6 py-5 dark:border-slate-700 dark:from-slate-900 dark:to-indigo-950/30 md:flex-row md:items-center md:justify-between">
                <div className="text-sm text-slate-600 dark:text-slate-400">
                  Remember to save after updating contact info or credentials.
                </div>
                <div className="flex gap-3">
                  <Button type="button" variant="outline" asChild className="border-slate-300 hover:bg-slate-100 dark:border-slate-600 dark:hover:bg-slate-700">
                    <Link href="/users">Cancel</Link>
                  </Button>
                  <Button type="submit" disabled={processing} className="min-w-[140px] bg-gradient-to-r from-indigo-600 to-indigo-700 px-6 text-white shadow-lg transition hover:from-indigo-700 hover:to-indigo-800 hover:shadow-xl">
                    {processing ? 'Updating...' : 'Update User'}
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

