import { useState, useMemo } from 'react'
import { useForm } from '@inertiajs/react'
import { Link, router } from '@inertiajs/react'
import { Eye, Trash2, SquarePen, Plus, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { DeleteConfirmationDialog } from '@/components/delete-confirmation-dialog'
import { useToast } from '@/hooks/use-toast'
import { usePermissions } from '@/hooks/use-permissions'
import AppLayout from '@/layouts/app-layout'

interface Customer {
  id: number
  name: string
  email?: string
  phone?: string
  created_at: string
}

interface PaginationMeta {
  total: number
  per_page: number
  current_page: number
  last_page: number
}

interface CustomersIndexProps {
  customers: {
    data: Customer[]
    meta: PaginationMeta
  }
}

export default function CustomersIndex({ customers }: CustomersIndexProps) {
  const { toast } = useToast()
  const { hasPermission } = usePermissions()
  const [search, setSearch] = useState('')
  const [sortColumn, setSortColumn] = useState('name')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [deleteConfirmation, setDeleteConfirmation] = useState<{ id: number; name: string } | null>(null)

  const filtered = useMemo(() => {
    let items = customers?.data || []

    if (search.trim()) {
      const query = search.toLowerCase()
      items = items.filter(
        item =>
          item.name.toLowerCase().includes(query) ||
          item.email?.toLowerCase().includes(query) ||
          item.phone?.toLowerCase().includes(query)
      )
    }

    items.sort((a, b) => {
      let aVal: any = a[sortColumn as keyof Customer]
      let bVal: any = b[sortColumn as keyof Customer]

      if (sortColumn === 'name' || sortColumn === 'email') {
        aVal = aVal?.toLowerCase()
        bVal = bVal?.toLowerCase()
      }

      return sortOrder === 'asc' ? (aVal > bVal ? 1 : -1) : aVal < bVal ? 1 : -1
    })

    return items
  }, [search, sortColumn, sortOrder, customers])

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(column)
      setSortOrder('asc')
    }
  }

  const handleDelete = (customer: Customer) => {
    setDeleteConfirmation({ id: customer.id, name: customer.name })
  }

  const confirmDelete = () => {
    if (!deleteConfirmation) return
    router.delete(route('customers.destroy', deleteConfirmation.id), {
      onSuccess: () => {
        toast({
          title: 'Success',
          description: 'Customer deleted successfully',
          variant: 'success',
        })
        setDeleteConfirmation(null)
      },
      onError: () => {
        toast({
          title: 'Error',
          description: 'Failed to delete customer',
          variant: 'destructive',
        })
      },
    })
  }

  return (
    <>
      <div className="flex h-full flex-1 flex-col gap-6 overflow-hidden rounded-xl p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Customers</h1>
            <p className="text-muted-foreground">Manage your customers</p>
          </div>
          {hasPermission('customers.create') && (
            <Link href={route('customers.create')}>
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add Customer
              </Button>
            </Link>
          )}
        </div>

        <Card className="flex flex-1 flex-col overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
            <div className="relative w-64">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search customers..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardHeader>

          <CardContent className="flex flex-1 flex-col overflow-auto">
            {filtered.length > 0 ? (
              <div className="rounded-lg border">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead
                        onClick={() => handleSort('name')}
                        className="cursor-pointer select-none hover:bg-muted/70 transition-colors flex items-center"
                      >
                        Name
                      </TableHead>
                      <TableHead
                        onClick={() => handleSort('email')}
                        className="cursor-pointer select-none hover:bg-muted/70 transition-colors flex items-center"
                      >
                        Email
                      </TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead
                        onClick={() => handleSort('created_at')}
                        className="cursor-pointer select-none hover:bg-muted/70 transition-colors flex items-center"
                      >
                        Created
                      </TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map(customer => (
                      <TableRow key={customer.id}>
                        <TableCell className="font-medium">{customer.name}</TableCell>
                        <TableCell>{customer.email || '-'}</TableCell>
                        <TableCell>{customer.phone || '-'}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {new Date(customer.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right space-x-2">
                          {hasPermission('customers.show') && (
                            <Link href={route('customers.show', customer.id)}>
                              <Button variant="ghost" size="icon">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </Link>
                          )}
                          {hasPermission('customers.edit') && (
                            <Link href={route('customers.edit', customer.id)}>
                              <Button variant="ghost" size="icon">
                                <SquarePen className="h-4 w-4" />
                              </Button>
                            </Link>
                          )}
                          {hasPermission('customers.destroy') && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(customer)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="flex items-center justify-center py-12">
                <p className="text-muted-foreground">
                  No customers found.{' '}
                  {hasPermission('customers.create') && (
                    <Link href={route('customers.create')} className="text-primary hover:underline">
                      Create one
                    </Link>
                  )}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <DeleteConfirmationDialog
        open={!!deleteConfirmation}
        title="Delete Customer"
        description="Are you sure you want to delete this customer? This action cannot be undone."
        itemName={deleteConfirmation?.name}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteConfirmation(null)}
      />
    </>
  )
}

CustomersIndex.layout = (page: React.ReactNode) => <AppLayout children={page} />
