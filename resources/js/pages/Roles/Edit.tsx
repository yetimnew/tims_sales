import { useState, useEffect } from 'react'
import { useForm } from '@inertiajs/react'
import { Link } from '@inertiajs/react'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useToast } from '@/hooks/use-toast'
import { validateRole } from '@/lib/validation'
import AppLayout from '@/layouts/app-layout'
import { CircleAlert } from 'lucide-react'

interface Permission {
  id: number
  name: string
  guard_name: string
}

interface Role {
  id: number
  name: string
  description: string
  permissions: Permission[]
}

interface RoleEditProps {
  role: Role
  permissions: Permission[]
}

export default function RolesEdit({ role, permissions }: RoleEditProps) {
  const { toast } = useToast()
  const [frontendErrors, setFrontendErrors] = useState<Record<string, string>>({})
  const [selectedPermissions, setSelectedPermissions] = useState<number[]>(
    role.permissions.map(p => p.id)
  )
  const { data, setData, put, processing, errors } = useForm<Role>({
    id: role.id,
    name: role.name,
    description: role.description || '',
    permissions: role.permissions.map(p => p.id),
  })

  useEffect(() => {
    if (Object.keys(errors).length > 0) {
      toast({ title: 'Validation Error', description: 'Please fix the errors', variant: 'destructive' })
    }
  }, [errors])

  const handleFieldChange = (field: string, value: string) => {
    setData(field as keyof Role, value)
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const validationErrors = validateRole({ ...data, permissions: selectedPermissions })
    if (Object.keys(validationErrors).length > 0) {
      setFrontendErrors(validationErrors)
      toast({ title: 'Validation Error', description: 'Please fix all errors', variant: 'destructive' })
      return
    }
    put(route('roles.update', role.id))
  }

  const hasErrors = Object.keys(frontendErrors).length > 0 || Object.keys(errors).length > 0

  // Group permissions by module
  const groupedPermissions = permissions.reduce((acc, permission) => {
    const module = permission.name.split('.')[0]
    if (!acc[module]) {
      acc[module] = []
    }
    acc[module].push(permission)
    return acc
  }, {} as Record<string, Permission[]>)

  return (
    <div className="flex h-full flex-1 flex-col gap-6 overflow-auto p-4">
      <div className="flex items-center gap-4">
        <Link href={route('roles.index')}>
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">Edit Role</h1>
      </div>

      <Card className="max-w-4xl">
        <CardHeader className="border-b">
          <h2 className="text-lg font-semibold">Role Details</h2>
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
                {Object.entries(groupedPermissions).map(([module, modulePermissions]) => (
                  <Card key={module} className="p-4">
                    <h4 className="font-medium mb-3 capitalize">{module}</h4>
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
                ))}
              </div>
              {(frontendErrors.permissions || errors.permissions) && (
                <p className="text-sm text-red-500">{frontendErrors.permissions || errors.permissions}</p>
              )}
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="submit" disabled={processing || hasErrors} className="flex-1">
                Update Role
              </Button>
              <Link href={route('roles.index')}>
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

RolesEdit.layout = (page: React.ReactNode) => <AppLayout children={page} />
