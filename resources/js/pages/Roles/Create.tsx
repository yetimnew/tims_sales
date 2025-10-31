import { useState, useEffect } from 'react'
import { useForm } from '@inertiajs/react'
import { Link, Head } from '@inertiajs/react'
import { ArrowLeft, CheckSquare, Square, CircleAlert } from 'lucide-react'
import AppLayout from '@/layouts/app-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useToast } from '@/hooks/use-toast'
import { validateRole } from '@/lib/validation'

interface Permission {
  id: number
  name: string
  guard_name: string
}

interface RoleFormData {
  name: string
  description: string
  permissions: number[]
}

interface RoleCreateProps {
  permissions: Record<string, Permission[]>
}

export default function RolesCreate({ permissions }: RoleCreateProps) {
  const { toast } = useToast()
  const [frontendErrors, setFrontendErrors] = useState<Record<string, string>>({})
  const [selectedPermissions, setSelectedPermissions] = useState<number[]>([])
  const { data, setData, post, processing, errors } = useForm<RoleFormData>({
    name: '',
    description: '',
    permissions: [],
  })

  useEffect(() => {
    if (Object.keys(errors).length > 0) {
      toast({ title: 'Validation Error', description: 'Please fix the errors', variant: 'destructive' })
    }
  }, [errors])

  const handleFieldChange = (field: string, value: string) => {
    setData(field as keyof RoleFormData, value)
    if (frontendErrors[field]) {
      const validationErrors = validateRole({ ...data, [field]: value })
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

  const handlePermissionChange = (permissionId: number, checked: boolean) => {
    let newPermissions: number[]
    if (checked) {
      newPermissions = [...selectedPermissions, permissionId]
    } else {
      newPermissions = selectedPermissions.filter(id => id !== permissionId)
    }
    setSelectedPermissions(newPermissions)
    setData('permissions', newPermissions)
  }

  const handleSelectAllModule = (module: string, modulePermissions: Permission[]) => {
    const modulePermissionIds = modulePermissions.map(p => p.id)
    const allSelected = modulePermissionIds.every(id => selectedPermissions.includes(id))

    let newPermissions: number[]
    if (allSelected) {
      // Deselect all permissions in this module
      newPermissions = selectedPermissions.filter(id => !modulePermissionIds.includes(id))
    } else {
      // Select all permissions in this module
      newPermissions = [...new Set([...selectedPermissions, ...modulePermissionIds])]
    }
    setSelectedPermissions(newPermissions)
    setData('permissions', newPermissions)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const validationErrors = validateRole({ ...data, permissions: selectedPermissions })
    if (Object.keys(validationErrors).length > 0) {
      setFrontendErrors(validationErrors)
      toast({ title: 'Validation Error', description: 'Please fix all errors', variant: 'destructive' })
      return
    }
    post('/roles')
  }

  const hasErrors = Object.keys(frontendErrors).length > 0 || Object.keys(errors).length > 0

  // Permissions are already grouped by the backend
  const groupedPermissions = permissions || {}

  return (
    <AppLayout breadcrumbs={[]}>
      <Head title="Create Role" />
      <div className="flex h-full flex-1 flex-col gap-6 overflow-auto p-4">
      <div className="flex items-center gap-4">
        <Link href="/roles">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">Create Role</h1>
      </div>

      <Card className="max-w-4xl">
        <CardHeader className="border-b">
          <h2 className="text-lg font-semibold">New Role Details</h2>
        </CardHeader>
        <CardContent className="pt-6">
          {hasErrors && (
            <Alert variant="destructive" className="mb-6">
              <CircleAlert className="h-4 w-4" />
              <AlertDescription>Please fix all errors in the form below</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  type="text"
                  value={data.name}
                  onChange={e => handleFieldChange('name', e.target.value)}
                  placeholder="Enter role name"
                  className={frontendErrors.name || errors.name ? 'border-red-500' : ''}
                />
                {(frontendErrors.name || errors.name) && (
                  <p className="text-sm text-red-500">{frontendErrors.name || errors.name}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={data.description}
                  onChange={e => handleFieldChange('description', e.target.value)}
                  placeholder="Enter role description"
                  rows={3}
                  className={frontendErrors.description || errors.description ? 'border-red-500' : ''}
                />
                {(frontendErrors.description || errors.description) && (
                  <p className="text-sm text-red-500">{frontendErrors.description || errors.description}</p>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <Label>Permissions *</Label>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {Object.entries(groupedPermissions).map(([module, modulePermissions]) => {
                  const modulePermissionIds = modulePermissions.map(p => p.id)
                  const allSelected = modulePermissionIds.every(id => selectedPermissions.includes(id))

                  return (
                    <Card key={module} className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium capitalize">{module}</h4>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSelectAllModule(module, modulePermissions)}
                          className="h-8 text-xs"
                        >
                          {allSelected ? (
                            <>
                              <CheckSquare className="h-3 w-3 mr-1" />
                              Deselect All
                            </>
                          ) : (
                            <>
                              <Square className="h-3 w-3 mr-1" />
                              Select All
                            </>
                          )}
                        </Button>
                      </div>
                      <div className="space-y-2">
                        {modulePermissions.map(permission => (
                          <div key={permission.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={`permission-${permission.id}`}
                              checked={selectedPermissions.includes(permission.id)}
                              onCheckedChange={checked => handlePermissionChange(permission.id, checked as boolean)}
                            />
                            <Label htmlFor={`permission-${permission.id}`} className="text-sm">
                              {permission.name.replace(`${module}.`, '')}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </Card>
                  )
                })}
              </div>
              {(frontendErrors.permissions || errors.permissions) && (
                <p className="text-sm text-red-500">{frontendErrors.permissions || errors.permissions}</p>
              )}
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="submit" disabled={processing || hasErrors} className="flex-1">
                Create Role
              </Button>
              <Link href="/roles">
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
