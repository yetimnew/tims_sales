import { useState } from 'react'
import { Link, router } from '@inertiajs/react'
import { ArrowLeft, Trash2, SquarePen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { DeleteConfirmationDialog } from '@/components/delete-confirmation-dialog'
import { ActivityLogTable } from '@/components/activity-log-table'
import { useToast } from '@/hooks/use-toast'
import { usePermissions } from '@/hooks/use-permissions'
import AppLayout from '@/layouts/app-layout'

interface Customer {
  id: number
  name: string
  email?: string
  phone?: string
  address?: string
  contact_person?: string
  created_at: string
  updated_at: string
}

interface ActivityLog {
  id: number
  event: string
  description?: string
  created_at: string
  causer?: { name: string }
  properties?: Record<string, any>
}

interface CustomerShowProps {
  customer: Customer
  activityLogs: ActivityLog[]
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleString()
}

export default function CustomersShow({ customer, activityLogs }: CustomerShowProps) {
  const { toast } = useToast()
  const { hasPermission } = usePermissions()
  const [deleteConfirmation, setDeleteConfirmation] = useState(false)

  const handleDelete = () => {
    router.delete(route('customers.destroy', customer.id), {
      onSuccess: () => {
        toast({ title: 'Success', description: 'Customer deleted successfully', variant: 'success' })
      },
      onError: () => {
        toast({ title: 'Error', description: 'Failed to delete customer', variant: 'destructive' })
      },
    })
  }

  return (
    <>
      <div className="flex h-full flex-1 flex-col gap-6 overflow-auto p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href={route('customers.index')}>
              <Button variant="outline" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold">{customer.name}</h1>
              <p className="text-muted-foreground">{customer.email || 'No email'}</p>
            </div>
          </div>
          <div className="flex gap-2">
            {hasPermission('customers.edit') && (
              <Link href={route('customers.edit', customer.id)}>
                <Button className="flex items-center gap-2">
                  <SquarePen className="h-4 w-4" />
                  Edit
                </Button>
              </Link>
            )}
            {hasPermission('customers.destroy') && (
              <Button
                variant="destructive"
                onClick={() => setDeleteConfirmation(true)}
                className="flex items-center gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 space-y-6">
            <Card>
              <CardHeader className="border-b">
                <h2 className="text-lg font-semibold">Customer Information</h2>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Customer Name</p>
                  <p className="mt-1 font-semibold">{customer.name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Email</p>
                  <p className="mt-1">{customer.email || 'Not provided'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Phone</p>
                  <p className="mt-1">{customer.phone || 'Not provided'}</p>
                </div>
                {customer.contact_person && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Contact Person</p>
                    <p className="mt-1">{customer.contact_person}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {customer.address && (
              <Card>
                <CardHeader className="border-b">
                  <h2 className="text-lg font-semibold">Address</h2>
                </CardHeader>
                <CardContent className="pt-6">
                  <p className="whitespace-pre-wrap">{customer.address}</p>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader className="border-b">
                <h2 className="text-lg font-semibold">Record Information</h2>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Created</p>
                  <p className="mt-1">{formatDate(customer.created_at)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Last Updated</p>
                  <p className="mt-1">{formatDate(customer.updated_at)}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="border-b">
                <h2 className="text-lg font-semibold">Activity Log</h2>
              </CardHeader>
              <CardContent className="pt-6">
                <ActivityLogTable logs={activityLogs} />
              </CardContent>
            </Card>
          </div>

          <div>
            <Card className="sticky top-4">
              <CardHeader className="border-b">
                <h2 className="text-lg font-semibold">Quick Info</h2>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Customer</p>
                  <p className="mt-1 font-semibold">{customer.name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Email</p>
                  <p className="mt-1 text-sm">{customer.email || 'Not provided'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">ID</p>
                  <p className="mt-1 font-mono text-sm">{customer.id}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <DeleteConfirmationDialog
        open={deleteConfirmation}
        title="Delete Customer"
        description="Are you sure you want to delete this customer? This action cannot be undone."
        itemName={customer.name}
        onConfirm={handleDelete}
        onCancel={() => setDeleteConfirmation(false)}
      />
    </>
  )
}

CustomersShow.layout = (page: React.ReactNode) => <AppLayout children={page} />

