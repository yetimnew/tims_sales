import { useState, useEffect, useMemo, useCallback } from 'react'
import { useForm, Head } from '@inertiajs/react'
import { User, Shield, Mail, CheckCircle, AlertCircle, Lock, Info, Plus, Trash2, Sparkles, Filter, Search, BellRing, ChevronDown, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { useToast } from '@/hooks/use-toast'
import AppLayout from '@/layouts/app-layout'
import { type BreadcrumbItem } from '@/types'
import { validateUser, type ValidationErrors } from '@/lib/validation'
import { evaluatePasswordStrength } from '@/lib/password-strength'
import { index as usersIndexRoute, create as createUserRoute } from '@/routes/users'

const breadcrumbs: BreadcrumbItem[] = [
  {
    title: 'User management',
    href: usersIndexRoute().url,
  },
  {
    title: 'Users',
    href: usersIndexRoute().url,
  },
  {
    title: 'Create',
    href: createUserRoute().url,
  },
];

interface Role {
  id: number
  name: string
}

interface NotificationTypeResource {
  id: number
  key: string
  name: string
  description: string | null
  default_in_app: boolean
  default_email: boolean
}

type NotificationPreferenceInput = {
  type_id: number
  in_app_enabled: boolean
  email_enabled: boolean
}

type NotificationAssignment = {
  typeId: number
  name: string
  description: string | null
  inAppEnabled: boolean
  emailEnabled: boolean
}

interface UserFormData {
  name: string
  email: string
  password: string
  password_confirmation: string
  role: string
  notification_preferences: NotificationPreferenceInput[]
}

interface UsersCreateProps {
  roles: Role[]
  notificationTypes: NotificationTypeResource[]
}

export default function UsersCreate({ roles, notificationTypes }: UsersCreateProps) {
  const { toast } = useToast()
  const [frontendErrors, setFrontendErrors] = useState<Record<string, string>>({})
  const { data, setData, post, processing, errors } = useForm<UserFormData>({
    name: '',
    email: '',
    password: '',
    password_confirmation: '',
    role: '',
    notification_preferences: [],
  })
  const [assignedNotifications, setAssignedNotifications] = useState<NotificationAssignment[]>([])
  const [pendingNotificationType, setPendingNotificationType] = useState<string>('')
  const [notificationSearchTerm, setNotificationSearchTerm] = useState<string>('')
  const [openSections, setOpenSections] = useState({
    profile: true,
    access: true,
    notifications: false,
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showPasswordConfirmation, setShowPasswordConfirmation] = useState(false)

  const isAdminRole = data.role === 'admin'

  useEffect(() => {
    if (Object.keys(errors).length > 0) {
      toast({ title: 'Validation Error', description: 'Please fix the errors', variant: 'destructive' })
    }
  }, [errors])

  useEffect(() => {
    setData('notification_preferences', assignedNotifications.map(notification => ({
      type_id: notification.typeId,
      in_app_enabled: notification.inAppEnabled,
      email_enabled: notification.emailEnabled,
    })))
  }, [assignedNotifications, setData])

  const passwordStrength = useMemo(() => evaluatePasswordStrength(data.password), [data.password])

  const availableNotificationTypes = useMemo(() =>
    notificationTypes.filter(type => !assignedNotifications.some(notification => notification.typeId === type.id)),
  [notificationTypes, assignedNotifications])

  const filteredAssignedNotifications = useMemo(() => {
    if (notificationSearchTerm.trim() === '') {
      return assignedNotifications
    }

    const term = notificationSearchTerm.toLowerCase()
    return assignedNotifications.filter(notification =>
      notification.name.toLowerCase().includes(term) ||
      (notification.description ?? '').toLowerCase().includes(term),
    )
  }, [assignedNotifications, notificationSearchTerm])

  const assignmentProgress = useMemo(() => {
    if (notificationTypes.length === 0) {
      return 0
    }

    return Math.round((assignedNotifications.length / notificationTypes.length) * 100)
  }, [assignedNotifications.length, notificationTypes.length])

  useEffect(() => {
    if (!isAdminRole) {
      return
    }

    setAssignedNotifications(current => {
      if (current.length === notificationTypes.length && current.every(notification => notification.inAppEnabled && notification.emailEnabled)) {
        return current
      }

      return notificationTypes.map(type => ({
        typeId: type.id,
        name: type.name,
        description: type.description,
        inAppEnabled: true,
        emailEnabled: true,
      }))
    })
  }, [isAdminRole, notificationTypes])

  const handleAddNotificationType = useCallback((value: string) => {
    if (isAdminRole) {
      return
    }

    setPendingNotificationType('')
    const typeId = Number(value)
    if (Number.isNaN(typeId)) {
      return
    }

    const type = notificationTypes.find(item => item.id === typeId)
    if (!type) {
      return
    }

    setAssignedNotifications(current => {
      if (current.some(notification => notification.typeId === typeId)) {
        return current
      }

      return [
        ...current,
        {
          typeId: type.id,
          name: type.name,
          description: type.description,
          inAppEnabled: type.default_in_app,
          emailEnabled: type.default_email,
        },
      ]
    })
  }, [isAdminRole, notificationTypes])

  const handleNotificationToggle = useCallback((typeId: number, channel: 'inAppEnabled' | 'emailEnabled', value: boolean) => {
    if (isAdminRole) {
      return
    }

    setAssignedNotifications(current => current.map(notification =>
      notification.typeId === typeId
        ? { ...notification, [channel]: value }
        : notification,
    ))
  }, [isAdminRole])

  const handleNotificationRemove = useCallback((typeId: number) => {
    if (isAdminRole) {
      return
    }

    setAssignedNotifications(current => current.filter(notification => notification.typeId !== typeId))
  }, [isAdminRole])

  const assignAllAvailableNotifications = useCallback(() => {
    if (notificationTypes.length === 0) {
      return
    }

    setAssignedNotifications(notificationTypes.map(type => ({
      typeId: type.id,
      name: type.name,
      description: type.description,
      inAppEnabled: true,
      emailEnabled: true,
    })))

    toast({ title: 'Notifications assigned', description: 'All notifications have been pre-selected for this user.', variant: 'default' })
  }, [notificationTypes, toast])

  const clearAllAssignedNotifications = useCallback(() => {
    setAssignedNotifications([])
    toast({ title: 'Notifications cleared', description: 'All assigned notifications were removed.', variant: 'default' })
  }, [toast])

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

  const assignedCount = assignedNotifications.length
  const totalNotificationTypes = notificationTypes.length

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Create User" />
      <div className="flex h-full flex-1 flex-col gap-6 overflow-auto p-4 lg:p-6">
        <div className="flex flex-col gap-2 pb-2 border-b border-slate-200/60 dark:border-slate-700/60">
          <div className="flex items-center gap-2">
            <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Create New User</h1>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400">Add a new teammate, set their role, and configure notification preferences.</p>
        </div>

        <Card className="flex-1 border-slate-200/60 dark:border-slate-700/60 shadow-sm">
          <CardHeader className="bg-gradient-to-r from-slate-50/80 to-slate-100/50 dark:from-slate-800/80 dark:to-slate-700/50 border-b border-slate-200/60 dark:border-slate-700/60">
            <CardTitle className="flex items-center gap-2 text-base font-semibold text-slate-900 dark:text-slate-100">
              <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              User Details
            </CardTitle>
            <CardDescription className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
              Enter comprehensive information for the new user
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 lg:p-6">
            {hasErrors && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                <p className="text-xs text-red-700 dark:text-red-300">Please fix all errors in the form below</p>
              </div>
            )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-3">
              <Collapsible
                open={openSections.profile}
                onOpenChange={value => setOpenSections(prev => ({ ...prev, profile: value }))}
                className="group/collapsible overflow-hidden rounded-lg border border-slate-200/60 bg-white/90 shadow-sm dark:border-slate-700/60 dark:bg-slate-900/40"
              >
                <CollapsibleTrigger asChild>
                  <button
                    type="button"
                    className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm font-semibold text-slate-800 transition hover:bg-slate-50 dark:text-slate-100 dark:hover:bg-slate-900/60"
                  >
                    <span className="inline-flex items-center gap-2">
                      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                        <User className="h-3.5 w-3.5" />
                      </span>
                      <span className="flex flex-col">
                        <span>Profile &amp; Contact</span>
                        <span className="text-xs font-normal text-slate-500 dark:text-slate-400">Name and sign-in email for the new teammate.</span>
                      </span>
                    </span>
                    <ChevronDown className="h-4 w-4 text-slate-500 transition-transform group-data-[state=open]/collapsible:rotate-180" />
                  </button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-4 border-t border-slate-200/60 px-4 pb-4 pt-4 dark:border-slate-700/60">
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
                          className={`pl-10 transition-all duration-200 bg-white dark:bg-slate-900/60 border-slate-300 dark:border-slate-700 ${frontendErrors.name || errors.name ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : 'hover:border-slate-400 focus:border-blue-500 focus:ring-blue-500/20 dark:hover:border-slate-500'}`}
                        />
                      </div>
                      {(frontendErrors.name || errors.name) && (
                        <p className="flex items-center gap-1 text-sm text-red-500">
                          <AlertCircle className="h-3 w-3" />
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
                          className={`pl-10 transition-all duration-200 bg-white dark:bg-slate-900/60 border-slate-300 dark:border-slate-700 ${frontendErrors.email || errors.email ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : 'hover:border-slate-400 focus:border-blue-500 focus:ring-blue-500/20 dark:hover:border-slate-500'}`}
                        />
                      </div>
                      {(frontendErrors.email || errors.email) && (
                        <p className="flex items-center gap-1 text-sm text-red-500">
                          <AlertCircle className="h-3 w-3" />
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
                className="group/collapsible overflow-hidden rounded-lg border border-slate-200/60 bg-white/90 shadow-sm dark:border-slate-700/60 dark:bg-slate-900/40"
              >
                <CollapsibleTrigger asChild>
                  <button
                    type="button"
                    className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm font-semibold text-slate-800 transition hover:bg-slate-50 dark:text-slate-100 dark:hover:bg-slate-900/60"
                  >
                    <span className="inline-flex items-center gap-2">
                      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300">
                        <Shield className="h-3.5 w-3.5" />
                      </span>
                      <span className="flex flex-col">
                        <span>Access &amp; Security</span>
                        <span className="text-xs font-normal text-slate-500 dark:text-slate-400">Assign the right role and set a strong starter password.</span>
                      </span>
                    </span>
                    <ChevronDown className="h-4 w-4 text-slate-500 transition-transform group-data-[state=open]/collapsible:rotate-180" />
                  </button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-4 border-t border-slate-200/60 px-4 pb-4 pt-4 dark:border-slate-700/60">
                  <div className="space-y-2">
                    <Label htmlFor="role" className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                      Role <span className="text-red-500">*</span>
                    </Label>
                    <Select value={data.role} onValueChange={value => handleFieldChange('role', value)}>
                      <SelectTrigger className={`transition-all duration-200 bg-white dark:bg-slate-900/60 border-slate-300 dark:border-slate-700 hover:border-slate-400 focus:border-blue-500 focus:ring-blue-500/20 dark:hover:border-slate-600 ${frontendErrors.role || errors.role ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}`}>
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                      <SelectContent className="z-50 max-h-64 bg-white dark:bg-slate-900/80">
                        {roles.map(role => (
                          <SelectItem
                            key={role.id}
                            value={role.name}
                            className="hover:bg-slate-100 dark:hover:bg-slate-800"
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
                      <p className="flex items-center gap-1 text-sm text-red-500">
                        <AlertCircle className="h-3 w-3" />
                        {frontendErrors.role || errors.role}
                      </p>
                    )}
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="password" className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                        Password <span className="text-red-500">*</span>
                      </Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <Input
                          id="password"
                          type={showPassword ? 'text' : 'password'}
                          value={data.password}
                          onChange={event => handleFieldChange('password', event.target.value)}
                          placeholder="Enter password"
                          className={`pl-10 pr-12 transition-all duration-200 bg-white dark:bg-slate-900/60 border-slate-300 dark:border-slate-700 ${frontendErrors.password || errors.password ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : 'hover:border-slate-400 focus:border-blue-500 focus:ring-blue-500/20 dark:hover:border-slate-600'}`}
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
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs font-medium text-slate-500 dark:text-slate-400">
                          <span>Password strength</span>
                          <span className={passwordStrength.evaluated ? passwordStrength.textClass : 'text-slate-500 dark:text-slate-400'}>
                            {passwordStrength.evaluated ? passwordStrength.label : 'Waiting for input'}
                          </span>
                        </div>
                        <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-800">
                          <div
                            className={`h-2 rounded-full transition-all duration-300 ${passwordStrength.barClass}`}
                            style={{ width: `${passwordStrength.evaluated ? passwordStrength.progress : 0}%` }}
                          />
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {passwordStrength.evaluated ? passwordStrength.hint : 'Start typing to evaluate this password.'}
                        </p>
                      </div>
                      {(frontendErrors.password || errors.password) && (
                        <p className="flex items-center gap-1 text-sm text-red-500">
                          <AlertCircle className="h-3 w-3" />
                          {frontendErrors.password || errors.password}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="password_confirmation" className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                        Confirm Password <span className="text-red-500">*</span>
                      </Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <Input
                          id="password_confirmation"
                          type={showPasswordConfirmation ? 'text' : 'password'}
                          value={data.password_confirmation}
                          onChange={event => handleFieldChange('password_confirmation', event.target.value)}
                          placeholder="Confirm password"
                          className={`pl-10 pr-12 transition-all duration-200 bg-white dark:bg-slate-900/60 border-slate-300 dark:border-slate-700 ${frontendErrors.password_confirmation || errors.password_confirmation ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : 'hover:border-slate-400 focus:border-blue-500 focus:ring-blue-500/20 dark:hover:border-slate-600'}`}
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
                          <AlertCircle className="h-3 w-3" />
                          {frontendErrors.password_confirmation || errors.password_confirmation}
                        </p>
                      )}
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>

              <Collapsible
                open={openSections.notifications}
                onOpenChange={value => setOpenSections(prev => ({ ...prev, notifications: value }))}
                className="group/collapsible overflow-hidden rounded-lg border border-slate-200/60 bg-white/90 shadow-sm dark:border-slate-700/60 dark:bg-slate-900/40"
              >
                <CollapsibleTrigger asChild>
                  <button
                    type="button"
                    className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm font-semibold text-slate-800 transition hover:bg-slate-50 dark:text-slate-100 dark:hover:bg-slate-900/60"
                  >
                    <span className="inline-flex items-center gap-2">
                      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                        <BellRing className="h-3.5 w-3.5" />
                      </span>
                      <span className="flex flex-col">
                        <span>Notification Preferences</span>
                        <span className="text-xs font-normal text-slate-500 dark:text-slate-400">Fine-tune advanced notification defaults for this account.</span>
                      </span>
                    </span>
                    <span className="inline-flex items-center gap-2 text-xs font-medium text-amber-700 dark:text-amber-300">
                      <Badge variant="outline" className="border-amber-200 bg-amber-100/60 text-amber-700 dark:border-amber-800 dark:bg-amber-900/30 dark:text-amber-200 text-xs">
                        Optional
                      </Badge>
                      <ChevronDown className="h-4 w-4 text-slate-500 transition-transform group-data-[state=open]/collapsible:rotate-180" />
                    </span>
                  </button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-4 border-t border-slate-200/60 px-4 pb-4 pt-4 dark:border-slate-700/60">
                  <div className="space-y-3">
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Select which lifecycle notifications this user should receive by default. They can personalize their channels later inside their profile.
                    </p>
                    {isAdminRole && (
                      <div className="flex items-center gap-2 rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-700 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-300">
                        <Sparkles className="h-3.5 w-3.5" />
                        <span>Admins automatically receive every notification across all channels.</span>
                      </div>
                    )}
                  </div>

                  {!isAdminRole && (
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-3">
                        <Select
                          value={pendingNotificationType}
                          onValueChange={value => {
                            setPendingNotificationType(value)
                            handleAddNotificationType(value)
                          }}
                        >
                          <SelectTrigger className="w-full bg-white dark:bg-slate-900/60 md:w-72">
                            <SelectValue placeholder="Add notification type" />
                          </SelectTrigger>
                          <SelectContent className="max-h-64">
                            {availableNotificationTypes.length === 0 ? (
                              <div className="px-3 py-2 text-sm text-slate-500">All notification types are already assigned.</div>
                            ) : (
                              availableNotificationTypes.map(type => (
                                <SelectItem key={type.id} value={String(type.id)}>
                                  {type.name}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                          <Plus className="h-3.5 w-3.5" />
                          Add notification
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={assignAllAvailableNotifications}
                          disabled={assignedNotifications.length === notificationTypes.length}
                          className="flex items-center gap-2 bg-white text-slate-700 hover:bg-slate-100 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                        >
                          <Sparkles className="h-4 w-4" />
                          Assign all
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={clearAllAssignedNotifications}
                          disabled={assignedNotifications.length === 0}
                          className="flex items-center gap-2 border-slate-300 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                        >
                          <Trash2 className="h-4 w-4" />
                          Clear
                        </Button>
                      </div>
                    </div>
                  )}

                  <div className="flex flex-col gap-3 rounded-md border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900/60">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div className="flex flex-col gap-1">
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Assignment overview</span>
                        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                          <Filter className="h-3.5 w-3.5" />
                          <span>{assignedCount} of {totalNotificationTypes} notifications selected</span>
                        </div>
                      </div>
                      {assignedNotifications.length > 0 && (
                        <div className="relative flex h-10 w-full items-center gap-2 overflow-hidden rounded-full bg-slate-100 px-3 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300 md:w-56">
                          <div
                            className="absolute left-0 top-0 h-full bg-gradient-to-r from-blue-500 to-purple-600"
                            style={{ width: `${assignmentProgress}%` }}
                          />
                          <span className="relative flex items-center gap-1">
                            <Sparkles className="h-3.5 w-3.5" />
                            {assignmentProgress}% coverage
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="relative">
                      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <Input
                        value={notificationSearchTerm}
                        onChange={event => setNotificationSearchTerm(event.target.value)}
                        placeholder="Search assigned notifications"
                        className="pl-10"
                      />
                    </div>
                  </div>

                  {filteredAssignedNotifications.length === 0 ? (
                    assignedNotifications.length === 0 ? (
                      <div className="rounded-md border border-dashed border-slate-300 px-4 py-6 text-sm text-slate-500 dark:border-slate-600 dark:text-slate-400">
                        No notifications selected. The user will inherit only default alerts from their permissions.
                      </div>
                    ) : (
                      <div className="rounded-md border border-dashed border-slate-300 px-4 py-6 text-sm text-slate-500 dark:border-slate-600 dark:text-slate-400">
                        No notifications match your search.
                      </div>
                    )
                  ) : (
                    <div className="space-y-4">
                      {filteredAssignedNotifications.map(notification => (
                        <div key={notification.typeId} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md dark:border-slate-700 dark:bg-slate-900/60">
                          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                            <div>
                              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">{notification.name}</h3>
                              <p className="text-sm text-slate-600 dark:text-slate-400">
                                {notification.description ?? 'No description available for this notification.'}
                              </p>
                            </div>
                            {!isAdminRole && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => handleNotificationRemove(notification.typeId)}
                                className="self-start text-slate-600 hover:text-red-600 dark:text-slate-300 dark:hover:text-red-400"
                              >
                                <Trash2 className="mr-1 h-4 w-4" /> Remove
                              </Button>
                            )}
                          </div>

                          <div className="mt-4 grid gap-3 md:grid-cols-2">
                            <div className={`flex items-start gap-3 rounded-md border border-slate-200 p-4 dark:border-slate-700 ${notification.inAppEnabled ? 'bg-blue-50/70 dark:bg-blue-950/30' : 'bg-slate-50 dark:bg-slate-900/70'}`}>
                              <Checkbox
                                id={`notification-${notification.typeId}-in-app`}
                                checked={notification.inAppEnabled}
                                onCheckedChange={value => handleNotificationToggle(notification.typeId, 'inAppEnabled', value === true)}
                                disabled={isAdminRole}
                              />
                              <div>
                                <Label htmlFor={`notification-${notification.typeId}-in-app`} className="text-sm font-medium text-slate-800 dark:text-slate-200">
                                  In-app alerts
                                </Label>
                                <p className="text-xs text-slate-600 dark:text-slate-400">
                                  Deliver real-time messages inside the dashboard.
                                </p>
                              </div>
                            </div>
                            <div className={`flex items-start gap-3 rounded-md border border-slate-200 p-4 dark:border-slate-700 ${notification.emailEnabled ? 'bg-blue-50/70 dark:bg-blue-950/30' : 'bg-slate-50 dark:bg-slate-900/70'}`}>
                              <Checkbox
                                id={`notification-${notification.typeId}-email`}
                                checked={notification.emailEnabled}
                                onCheckedChange={value => handleNotificationToggle(notification.typeId, 'emailEnabled', value === true)}
                                disabled={isAdminRole}
                              />
                              <div>
                                <Label htmlFor={`notification-${notification.typeId}-email`} className="text-sm font-medium text-slate-800 dark:text-slate-200">
                                  Email alerts
                                </Label>
                                <p className="text-xs text-slate-600 dark:text-slate-400">
                                  Send transactional emails when this event occurs.
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CollapsibleContent>
              </Collapsible>
            </div>

            <div className="flex flex-col gap-3 rounded-lg border border-slate-200/60 bg-gradient-to-r from-slate-50/80 to-slate-100/50 px-4 py-4 dark:border-slate-700/60 dark:from-slate-800/80 dark:to-slate-700/50 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                <span className="text-red-500">*</span>
                <span>All required fields must be completed</span>
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="outline" asChild size="sm" className="border-slate-200/60 hover:bg-slate-100 dark:border-slate-700/60 dark:hover:bg-slate-800">
                  <a href="/users">Cancel</a>
                </Button>
                <Button
                  type="submit"
                  disabled={processing}
                  size="sm"
                  className="min-w-[120px] bg-blue-600 px-4 text-white shadow-sm transition hover:bg-blue-700 hover:shadow-md"
                >
                  {processing ? (
                    <>
                      <div className="mr-2 h-3.5 w-3.5 animate-spin rounded-full border-b-2 border-white" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="mr-2 h-3.5 w-3.5" />
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

