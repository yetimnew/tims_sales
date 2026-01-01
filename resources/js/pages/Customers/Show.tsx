import { Link, router } from '@inertiajs/react';
import { ArrowLeft, Edit, Trash2, Phone, Mail, MapPin, Activity, Target, Calendar, Building2, User, Navigation, PiggyBank, Hash, History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { type BreadcrumbItem } from '@/types';
import { toast } from '@/hooks/use-toast';
import { usePermissions } from '@/hooks/use-permissions';
import { useState } from 'react';
import { DeleteConfirmationDialog } from '@/components/delete-confirmation-dialog';
import { DetailPageLayout } from '@/components/detail/detail-page-layout';
import { DetailSectionCard } from '@/components/detail/detail-section-card';
import { DetailSummaryGrid, type DetailSummaryItem } from '@/components/detail/detail-summary-grid';

interface User {
  id: number;
  name: string;
}
interface ActivityLog {
  id: number;
  description: string;
  event: string;
  created_at: string;
  causer?: User;
}
interface Customer {
  id: number;
  name: string;
  contact_person?: string;
  phone?: string;
  email?: string;
  address?: string;
  status: string;
  created_at: string;
}
interface ActiveOperation {
  id: number;
  operationid: string;
  status: string;
  startdate?: string | null;
  enddate?: string | null;
  volume?: number | null;
  km?: number | null;
  tariff?: number | null;
  totalTrips: number;
  completedTrips: number;
  inProgressTrips: number;
  deliveredTonnage: number;
  remainingTonnage: number;
  completionRate: number | null;
  totalDistance: number;
  totalCost: number;
  lastDispatch?: string | null;
}
interface CustomersShowProps {
  customer: Customer;
  activityLogs?: ActivityLog[];
  activeOperations?: ActiveOperation[];
  activeOperationsCount?: number;
}

export default function CustomersShow({ customer, activityLogs = [], activeOperations = [], activeOperationsCount }: CustomersShowProps) {
  const breadcrumbs: BreadcrumbItem[] = [{ title: 'Customers', href: '/customers' }];
  const { hasPermission } = usePermissions();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = () => {
    setIsDeleting(true);
    router.delete(`/customers/${customer.id}`, {
      preserveScroll: true,
      onSuccess: () => {
        setDeleteDialogOpen(false);
        setIsDeleting(false);
        toast({
          title: '✅ Customer Deleted',
          description: `${customer.name} has been removed successfully.`,
        });
      },
      onError: errors => {
        setIsDeleting(false);
        const errorMessage = errors && typeof errors === 'object' && 'message' in errors ? String(errors.message) : 'An unexpected error occurred while deleting the customer.';
        toast({
          title: '❌ Delete Failed',
          description: errorMessage,
          variant: 'destructive',
        });
      },
    });
  };

  const getStatusColor = (status: string) => {
    return status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
  };

  const formatDate = (value?: string | null) => {
    if (!value) return 'N/A';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'N/A';
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatNumber = (value?: number | null, options?: Intl.NumberFormatOptions) => {
    if (value === null || value === undefined) return 'N/A';
    return Number(value).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
      ...options,
    });
  };

  const activeOpsCount = activeOperationsCount ?? activeOperations.length;

  const aggregate = activeOperations.reduce(
    (acc, operation) => {
      acc.totalTrips += operation.totalTrips;
      acc.completedTrips += operation.completedTrips;
      acc.inProgressTrips += operation.inProgressTrips;
      acc.totalVolume += operation.volume ?? 0;
      acc.deliveredVolume += operation.deliveredTonnage ?? 0;
      acc.totalDistance += operation.totalDistance ?? 0;
      acc.totalCost += operation.totalCost ?? 0;
      return acc;
    },
    {
      totalTrips: 0,
      completedTrips: 0,
      inProgressTrips: 0,
      totalVolume: 0,
      deliveredVolume: 0,
      totalDistance: 0,
      totalCost: 0,
    },
  );

  const deliveredPercentage = aggregate.totalVolume > 0 ? Math.min(Math.max((aggregate.deliveredVolume / aggregate.totalVolume) * 100, 0), 100) : null;

  const kpiSummary: DetailSummaryItem[] = [
    { label: 'Active Operations', value: activeOpsCount, helper: 'Currently monitored engagements' },
    { label: 'Trips Completed', value: aggregate.completedTrips, helper: 'Across all active operations' },
    { label: 'Delivered Volume', value: `${formatNumber(aggregate.deliveredVolume)} MT`, helper: 'Against planned commitments' },
    { label: 'Volume Completion', value: deliveredPercentage !== null ? `${deliveredPercentage.toFixed(1)}%` : 'N/A', helper: 'Aggregate delivery progress' },
  ];

  return (
    <DetailPageLayout
      title={customer.name}
      subtitle="Strategic partner overview and live operation performance snapshot."
      breadcrumbs={breadcrumbs}
      headTitle={`Customer: ${customer.name}`}
      icon={<Building2 className="h-6 w-6 text-indigo-600 dark:text-indigo-300" />}
      leading={
        <Button variant="outline" size="sm" onClick={() => router.get('/customers')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Customers
        </Button>
      }
      actions={
        <>
          <div className="flex flex-wrap gap-2">
            <Badge className={`${getStatusColor(customer.status)}`}>{customer.status.charAt(0).toUpperCase() + customer.status.slice(1)}</Badge>
            {activeOpsCount > 0 && (
              <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-200">
                <Activity className="h-3.5 w-3.5 mr-1" />
                {activeOpsCount} active operations
              </Badge>
            )}
          </div>
          {(hasPermission('customers.edit') || hasPermission('customers.destroy')) && (
            <div className="flex gap-2">
              {hasPermission('customers.edit') && (
                <Button variant="outline" asChild>
                  <Link href={`/customers/${customer.id}/edit`}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Link>
                </Button>
              )}
              {hasPermission('customers.destroy') && (
                <Button variant="outline" onClick={() => setDeleteDialogOpen(true)} className="border-red-200 text-red-600 hover:border-red-300 hover:bg-red-50">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              )}
            </div>
          )}
        </>
      }
    >
      <DetailSummaryGrid items={kpiSummary} />

      <div className="grid gap-6 lg:grid-cols-[1fr,20rem]">
        <div className="space-y-6">
          <DetailSectionCard title="Customer Overview" description="Core identifiers and relationship contacts" icon={<Building2 className="h-5 w-5" />}>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-lg border p-4">
                <p className="text-xs font-semibold uppercase text-muted-foreground">Customer Name</p>
                <p className="mt-2 text-lg font-semibold">{customer.name}</p>
              </div>
              <div className="rounded-lg border p-4">
                <p className="text-xs font-semibold uppercase text-muted-foreground">Status</p>
                <Badge className={`mt-2 ${getStatusColor(customer.status)}`}>{customer.status.charAt(0).toUpperCase() + customer.status.slice(1)}</Badge>
              </div>
              <div className="rounded-lg border p-4">
                <p className="text-xs font-semibold uppercase text-muted-foreground">Contact Person</p>
                <p className="mt-2 text-sm font-semibold">{customer.contact_person || 'N/A'}</p>
              </div>
              <div className="rounded-lg border p-4">
                <p className="text-xs font-semibold uppercase text-muted-foreground">Email</p>
                <p className="mt-2 text-sm font-semibold">{customer.email || 'N/A'}</p>
              </div>
              <div className="rounded-lg border p-4">
                <p className="text-xs font-semibold uppercase text-muted-foreground">Phone</p>
                <p className="mt-2 text-sm font-semibold">{customer.phone || 'N/A'}</p>
              </div>
              <div className="rounded-lg border p-4">
                <p className="text-xs font-semibold uppercase text-muted-foreground">Account Created</p>
                <p className="mt-2 text-sm font-semibold">{formatDate(customer.created_at)}</p>
              </div>
            </div>
            {customer.address && (
              <div className="mt-4 rounded-lg border p-4">
                <p className="text-xs font-semibold uppercase text-muted-foreground">Address</p>
                <p className="mt-2 whitespace-pre-wrap text-sm">{customer.address}</p>
              </div>
            )}
          </DetailSectionCard>

          <DetailSectionCard title="Active Operations" description="Snapshot of live engagements and their progress" icon={<Activity className="h-5 w-5" />}>
            {activeOperations.length > 0 ? (
              <div className="space-y-4">
                {activeOperations.map(operation => {
                  const tripCompletion = operation.totalTrips > 0 ? Math.min(Math.max((operation.completedTrips / operation.totalTrips) * 100, 0), 100) : 0;
                  const volumeCompletion = operation.completionRate ?? (operation.volume && operation.volume > 0 ? Math.min(Math.max((operation.deliveredTonnage / operation.volume) * 100, 0), 100) : 0);

                  return (
                    <div key={operation.id} className="rounded-lg border p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold">Operation {operation.operationid}</p>
                          <p className="text-xs text-muted-foreground">Last dispatch: {formatDate(operation.lastDispatch)}</p>
                        </div>
                        <Badge className={`text-xs ${getStatusColor(operation.status)}`}>{operation.status.charAt(0).toUpperCase() + operation.status.slice(1)}</Badge>
                      </div>

                      <div className="mt-4 grid gap-4 sm:grid-cols-2">
                        <div>
                          <p className="text-xs font-semibold uppercase text-muted-foreground">Trip Progress</p>
                          <div className="mt-2 flex justify-between text-xs text-muted-foreground">
                            <span>{operation.completedTrips} completed</span>
                            <span>{operation.totalTrips} total</span>
                          </div>
                          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
                            <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-500" style={{ width: `${tripCompletion}%` }} />
                          </div>
                        </div>
                        <div>
                          <p className="text-xs font-semibold uppercase text-muted-foreground">Volume Progress</p>
                          <div className="mt-2 flex justify-between text-xs text-muted-foreground">
                            <span>{formatNumber(operation.deliveredTonnage)} MT</span>
                            <span>{formatNumber(operation.remainingTonnage)} MT left</span>
                          </div>
                          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
                            <div className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600" style={{ width: `${Math.min(Math.max(volumeCompletion ?? 0, 0), 100)}%` }} />
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 grid gap-3 text-xs sm:grid-cols-3">
                        <div className="flex items-center gap-2 rounded-lg bg-muted p-3">
                          <Activity className="h-4 w-4 text-blue-600" />
                          <div>
                            <p className="text-xs uppercase">In Progress</p>
                            <p className="font-semibold">{operation.inProgressTrips}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 rounded-lg bg-muted p-3">
                          <Target className="h-4 w-4 text-emerald-600" />
                          <div>
                            <p className="text-xs uppercase">Completion</p>
                            <p className="font-semibold">{operation.completionRate !== null ? `${operation.completionRate.toFixed(1)}%` : 'N/A'}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 rounded-lg bg-muted p-3">
                          <Calendar className="h-4 w-4 text-purple-600" />
                          <div>
                            <p className="text-xs uppercase">Started</p>
                            <p className="font-semibold">{formatDate(operation.startdate)}</p>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 flex justify-end">
                        <Button variant="outline" asChild size="sm">
                          <Link href={`/operations/${operation.id}`}>View operation</Link>
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">This customer has no active operations.</p>
            )}
          </DetailSectionCard>

          {activityLogs.length > 0 && (
            <DetailSectionCard title="Activity History" description="Auditable timeline of changes to this account" icon={<History className="h-5 w-5" />}>
              <div className="space-y-3">
                {activityLogs.map(log => (
                  <div key={log.id} className="flex items-start gap-3 rounded-lg border p-3">
                    <div className="text-xs font-semibold uppercase text-muted-foreground">{formatDate(log.created_at)}</div>
                    <div>
                      <p className="font-medium">{log.causer?.name || 'System'}</p>
                      <p className="text-xs text-muted-foreground">{log.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </DetailSectionCard>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Snapshot</CardTitle>
              <CardDescription>Key metrics</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <Hash className="h-4 w-4" />
                <div>
                  <p className="text-xs uppercase text-muted-foreground">Customer ID</p>
                  <p className="font-semibold">{customer.id}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Activity className="h-4 w-4" />
                <div>
                  <p className="text-xs uppercase text-muted-foreground">Trips In Progress</p>
                  <p className="font-semibold">{aggregate.inProgressTrips}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Navigation className="h-4 w-4" />
                <div>
                  <p className="text-xs uppercase text-muted-foreground">Distance Covered</p>
                  <p className="font-semibold">{formatNumber(aggregate.totalDistance)} km</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <PiggyBank className="h-4 w-4" />
                <div>
                  <p className="text-xs uppercase text-muted-foreground">Total Cost</p>
                  <p className="font-semibold">{formatNumber(aggregate.totalCost)} Birr</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Contact Details</CardTitle>
              <CardDescription>Reach out directly</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center gap-3">
                <User className="h-4 w-4" />
                <div>
                  <p className="text-xs uppercase text-muted-foreground">Contact Person</p>
                  <p className="font-semibold">{customer.contact_person || 'N/A'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4" />
                <div>
                  <p className="text-xs uppercase text-muted-foreground">Phone</p>
                  <p className="font-mono">{customer.phone || 'N/A'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4" />
                <div>
                  <p className="text-xs uppercase text-muted-foreground">Email</p>
                  <p>{customer.email || 'N/A'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <DeleteConfirmationDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen} title="Delete Customer" description={`Are you sure you want to delete ${customer.name}? This action cannot be undone.`} onConfirm={handleDelete} isLoading={isDeleting} />
    </DetailPageLayout>
  );
}
