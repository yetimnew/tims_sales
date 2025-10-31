import { useState, useEffect } from 'react'
import { useForm } from '@inertiajs/react'
import { Link } from '@inertiajs/react'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useToast } from '@/hooks/use-toast'
import { validateStatus } from '@/lib/validation'
import AppLayout from '@/layouts/app-layout'
import { CircleAlert } from 'lucide-react'

interface StatusType {
  id: number
  name: string
}

interface Status {
  id: number
  name: string
  status_type_id: number
  description: string
}

interface StatusEditProps {
  status: Status
  statusTypes: StatusType[]
}

export default function StatusesEdit({ status, statusTypes }: StatusEditProps) {
  const { toast } = useToast()
  const [frontendErrors, setFrontendErrors] = useState<Record<string, string>>({})
  const { data, setData, put, processing, errors } = useForm<Status>({
    id: status.id,
    name: status.name,
    status_type_id: status.status_type_id.toString(),
    description: status.description || '',
  })

  useEffect(() => {
    if (Object.keys(errors).length > 0) {
      toast({ title: 'Validation Error', description: 'Please fix the errors', variant: 'destructive' })
    }
  }, [errors])

  const handleFieldChange = (field: string, value: string) => {
    setData(field as keyof Status, value)
    if (frontendErrors[field]) {
      const validationErrors = validateStatus({ ...data, [field]: value })
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
    const validationErrors = validateStatus(data)
    if (Object.keys(validationErrors).length > 0) {
      setFrontendErrors(validationErrors)
      toast({ title: 'Validation Error', description: 'Please fix all errors', variant: 'destructive' })
      return
    }
    put(`/statuses/${status.id}`)
  }

  const hasErrors = Object.keys(frontendErrors).length > 0 || Object.keys(errors).length > 0

  return (
    <div className="flex h-full flex-1 flex-col gap-6 overflow-auto p-4">
      <div className="flex items-center gap-4">
        <Link href="/statuses">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">Edit Status</h1>
      </div>

      <Card className="max-w-2xl">
        <CardHeader className="border-b">
          <h2 className="text-lg font-semibold">Status Details</h2>
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
                placeholder="Enter status name"
                className={frontendErrors.name || errors.name ? 'border-red-500' : ''}
              />
              {(frontendErrors.name || errors.name) && (
                <p className="text-sm text-red-500">{frontendErrors.name || errors.name}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="status_type_id">Status Type *</Label>
              <Select value={data.status_type_id} onValueChange={value => handleFieldChange('status_type_id', value)}>
                <SelectTrigger
                  id="status_type_id"
                  className={frontendErrors.status_type_id || errors.status_type_id ? 'border-red-500' : ''}
                >
                  <SelectValue placeholder="Select a status type" />
                </SelectTrigger>
                <SelectContent>
                  {statusTypes.map(statusType => (
                    <SelectItem key={statusType.id} value={statusType.id.toString()}>
                      {statusType.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {(frontendErrors.status_type_id || errors.status_type_id) && (
                <p className="text-sm text-red-500">{frontendErrors.status_type_id || errors.status_type_id}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={data.description}
                onChange={e => handleFieldChange('description', e.target.value)}
                placeholder="Enter status description"
                rows={4}
                className={frontendErrors.description || errors.description ? 'border-red-500' : ''}
              />
              {(frontendErrors.description || errors.description) && (
                <p className="text-sm text-red-500">{frontendErrors.description || errors.description}</p>
              )}
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="submit" disabled={processing || hasErrors} className="flex-1">
                Update Status
              </Button>
              <Link href="/statuses">
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

StatusesEdit.layout = (page: React.ReactNode) => <AppLayout children={page} />
