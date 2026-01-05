import { Link, router } from '@inertiajs/react';
import { ArrowLeft, Edit, Trash2, Phone, Mail, MapPin, Activity, Target, Calendar, Building2, User, Navigation, PiggyBank, Hash, History, DollarSign, TrendingUp, BarChart3, Package, ExternalLink, Truck, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { type BreadcrumbItem } from '@/types';
import { toast } from '@/hooks/use-toast';
import { usePermissions } from '@/hooks/use-permissions';
import { useState } from 'react';
import { DeleteConfirmationDialog } from '@/components/delete-confirmation-dialog';
import { DetailPageLayout } from '@/components/detail/detail-page-layout';
import { DetailSectionCard } from '@/components/detail/detail-section-card';
import { DetailSummaryGrid, type DetailSummaryItem } from '@/components/detail/detail-summary-grid';
import { ActivityLogTable } from '@/components/activity-log-table';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from 'recharts';

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

    const { minimumFractionDigits, maximumFractionDigits, ...rest } = options ?? {};
    let minDigits = minimumFractionDigits ?? 2;
    let maxDigits = maximumFractionDigits ?? (minimumFractionDigits ?? 2);

    if (maxDigits < minDigits) {
      minDigits = maxDigits;
    }

    minDigits = Math.min(Math.max(minDigits, 0), 20);
    maxDigits = Math.min(Math.max(maxDigits, minDigits), 20);

    return Number(value).toLocaleString('en-US', {
      minimumFractionDigits: minDigits,
      maximumFractionDigits: maxDigits,
      ...rest,
    });
  };

  const activeOpsCount = activeOperationsCount ?? activeOperations.length;

  const aggregate = activeOperations.reduce(
    (acc, operation) => {
      const tonnage = operation.deliveredTonnage ?? 0;
      const distance = operation.totalDistance ?? 0;
      const cost = operation.totalCost ?? 0;
      const tonKm = tonnage * (operation.km ?? 0);
      const tariff = operation.tariff ?? 0;
      const revenue = tariff > 0 && tonKm > 0 ? tonKm * tariff : 0;

      acc.totalTrips += operation.totalTrips;
      acc.completedTrips += operation.completedTrips;
      acc.inProgressTrips += operation.inProgressTrips;
      acc.totalVolume += operation.volume ?? 0;
      acc.deliveredVolume += tonnage;
      acc.totalDistance += distance;
      acc.totalCost += cost;
      acc.totalRevenue += revenue;
      acc.totalTonKm += tonKm;

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
      totalRevenue: 0,
      totalTonKm: 0,
    },
  );

  const deliveredPercentage = aggregate.totalVolume > 0 ? Math.min(Math.max((aggregate.deliveredVolume / aggregate.totalVolume) * 100, 0), 100) : null;
  const grossMargin = aggregate.totalRevenue - aggregate.totalCost;
  const grossMarginPercent = aggregate.totalRevenue > 0 ? (grossMargin / aggregate.totalRevenue) * 100 : 0;
  const averageRevenuePerOperation = activeOpsCount > 0 ? aggregate.totalRevenue / activeOpsCount : 0;
  const averageCostPerOperation = activeOpsCount > 0 ? aggregate.totalCost / activeOpsCount : 0;
  const costPerTonKm = aggregate.totalTonKm > 0 ? aggregate.totalCost / aggregate.totalTonKm : 0;
  const revenuePerTrip = aggregate.completedTrips > 0 ? aggregate.totalRevenue / aggregate.completedTrips : 0;
  const costPerTrip = aggregate.completedTrips > 0 ? aggregate.totalCost / aggregate.completedTrips : 0;

  // Prepare chart data
  const operationChartData = activeOperations.map(op => ({
    name: op.operationid,
    tonnage: op.deliveredTonnage,
    trips: op.completedTrips,
    completion: op.completionRate ?? 0,
    cost: op.totalCost,
  })).slice(0, 10);

  const statusData = [
    { label: 'Completed', value: aggregate.completedTrips },
    { label: 'In Progress', value: aggregate.inProgressTrips },
  ];
  const hasStatusData = statusData.some(item => item.value > 0);
  const piePalette = ['#22c55e', '#3b82f6'];

  const formatCurrency = (value: number) => {
    return `${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Birr`;
  };

  const kpiSummary: DetailSummaryItem[] = [
    { label: 'Active Operations', value: activeOpsCount, helper: `${aggregate.totalTrips} total trips` },
    { label: 'Volume Delivered', value: `${formatNumber(aggregate.deliveredVolume)} MT`, helper: `${deliveredPercentage?.toFixed(1) ?? 'N/A'}% of planned` },
    { label: 'Total Revenue', value: formatCurrency(aggregate.totalRevenue), helper: `Margin: ${grossMarginPercent.toFixed(1)}%` },
    { label: 'Gross Margin', value: formatCurrency(grossMargin), helper: grossMargin >= 0 ? 'Profitable' : 'Loss' },
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

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">
            <Building2 className="h-4 w-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="operations">
            <Target className="h-4 w-4 mr-2" />
            Operations
          </TabsTrigger>
          <TabsTrigger value="analytics">
            <TrendingUp className="h-4 w-4 mr-2" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="activity">
            <History className="h-4 w-4 mr-2" />
            Activity
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
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

          <DetailSectionCard title="Quick Links" icon={<ExternalLink className="h-5 w-5" />}>
            <div className="grid gap-3 md:grid-cols-2">
              <Button variant="outline" asChild className="w-full">
                <Link href={`/operations?customer=${customer.id}`}>
                  <Target className="h-4 w-4 mr-2" />
                  View All Operations
                  <ExternalLink className="h-3 w-3 ml-auto" />
                </Link>
              </Button>
              <Button variant="outline" asChild className="w-full">
                <Link href={`/performances?customer=${customer.id}`}>
                  <Truck className="h-4 w-4 mr-2" />
                  View All Performances
                  <ExternalLink className="h-3 w-3 ml-auto" />
                </Link>
              </Button>
            </div>
          </DetailSectionCard>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Performance Snapshot</CardTitle>
                <CardDescription>Key metrics across operations</CardDescription>
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
                  <CheckCircle className="h-4 w-4" />
                  <div>
                    <p className="text-xs uppercase text-muted-foreground">Completed Trips</p>
                    <p className="font-semibold">{aggregate.completedTrips}</p>
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
                  <DollarSign className="h-4 w-4" />
                  <div>
                    <p className="text-xs uppercase text-muted-foreground">Total Revenue</p>
                    <p className="font-semibold">{formatCurrency(aggregate.totalRevenue)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <PiggyBank className="h-4 w-4" />
                  <div>
                    <p className="text-xs uppercase text-muted-foreground">Total Cost</p>
                    <p className="font-semibold">{formatCurrency(aggregate.totalCost)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 border-t pt-3">
                  <TrendingUp className={`h-4 w-4 ${grossMargin >= 0 ? 'text-green-600' : 'text-red-600'}`} />
                  <div>
                    <p className="text-xs uppercase text-muted-foreground">Gross Margin</p>
                    <p className={`font-bold ${grossMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(grossMargin)}
                    </p>
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
        </TabsContent>

        <TabsContent value="operations" className="space-y-6">
          <DetailSectionCard title="Active Operations" description="Live engagements and their progress" icon={<Activity className="h-5 w-5" />}>
            {activeOperations.length > 0 ? (
              <div className="space-y-4">
                {activeOperations.map(operation => {
                  const tripCompletion = operation.totalTrips > 0 ? Math.min(Math.max((operation.completedTrips / operation.totalTrips) * 100, 0), 100) : 0;
                  const volumeCompletion = operation.completionRate ?? (operation.volume && operation.volume > 0 ? Math.min(Math.max((operation.deliveredTonnage / operation.volume) * 100, 0), 100) : 0);
                  const tonKm = operation.deliveredTonnage * (operation.km ?? 0);
                  const revenue = (operation.tariff ?? 0) * tonKm;
                  const margin = revenue - operation.totalCost;
                  const marginPercent = revenue > 0 ? (margin / revenue) * 100 : 0;

                  return (
                    <div key={operation.id} className="rounded-lg border p-4 hover:border-blue-300 transition-colors">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <Link href={`/operations/${operation.id}`} className="font-semibold text-blue-600 hover:underline">
                            Operation {operation.operationid}
                          </Link>
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

                      <div className="mt-4 grid gap-3 text-xs sm:grid-cols-4">
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
                        <div className="flex items-center gap-2 rounded-lg bg-green-50 border border-green-200 p-3">
                          <DollarSign className="h-4 w-4 text-green-600" />
                          <div>
                            <p className="text-xs uppercase">Revenue</p>
                            <p className="font-semibold">{formatNumber(revenue, { maximumFractionDigits: 0 })} Birr</p>
                          </div>
                        </div>
                        <div className={`flex items-center gap-2 rounded-lg p-3 border ${margin >= 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                          <TrendingUp className={`h-4 w-4 ${margin >= 0 ? 'text-green-600' : 'text-red-600'}`} />
                          <div>
                            <p className="text-xs uppercase">Margin</p>
                            <p className={`font-semibold ${margin >= 0 ? 'text-green-700' : 'text-red-700'}`}>{marginPercent.toFixed(1)}%</p>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 flex justify-end">
                        <Button variant="outline" asChild size="sm">
                          <Link href={`/operations/${operation.id}`}>View Details</Link>
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="py-8 text-center text-muted-foreground">This customer has no active operations.</p>
            )}
          </DetailSectionCard>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-4">
            <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-center">
              <p className="text-xs font-semibold uppercase text-muted-foreground">Total Revenue</p>
              <p className="mt-2 text-2xl font-bold text-green-700">{formatCurrency(aggregate.totalRevenue)}</p>
              <p className="mt-1 text-xs text-muted-foreground">Across all operations</p>
            </div>
            <div className="rounded-lg border border-orange-200 bg-orange-50 p-4 text-center">
              <p className="text-xs font-semibold uppercase text-muted-foreground">Total Cost</p>
              <p className="mt-2 text-2xl font-bold text-orange-700">{formatCurrency(aggregate.totalCost)}</p>
              <p className="mt-1 text-xs text-muted-foreground">Operational expenses</p>
            </div>
            <div className={`rounded-lg border p-4 text-center ${grossMargin >= 0 ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
              <p className="text-xs font-semibold uppercase text-muted-foreground">Gross Margin</p>
              <p className={`mt-2 text-2xl font-bold ${grossMargin >= 0 ? 'text-green-700' : 'text-red-700'}`}>{formatCurrency(grossMargin)}</p>
              <p className="mt-1 text-xs text-muted-foreground">{grossMarginPercent.toFixed(1)}% margin</p>
            </div>
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-center">
              <p className="text-xs font-semibold uppercase text-muted-foreground">Avg per Operation</p>
              <p className="mt-2 text-2xl font-bold text-blue-700">{formatCurrency(averageRevenuePerOperation)}</p>
              <p className="mt-1 text-xs text-muted-foreground">Revenue average</p>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {operationChartData.length > 0 && (
              <DetailSectionCard title="Operations Performance" icon={<BarChart3 className="h-5 w-5" />}>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={operationChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="tonnage" fill="#22c55e" name="Tonnage (MT)" />
                      <Bar dataKey="trips" fill="#3b82f6" name="Trips" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </DetailSectionCard>
            )}

            {hasStatusData && (
              <DetailSectionCard title="Trip Status Distribution" icon={<Activity className="h-5 w-5" />}>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={statusData} dataKey="value" nameKey="label" cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={4} label>
                        {statusData.map((_, index) => (
                          <Cell key={index} fill={piePalette[index % piePalette.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </DetailSectionCard>
            )}
          </div>

          <DetailSectionCard title="Financial Metrics" icon={<DollarSign className="h-5 w-5" />}>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-lg border p-3">
                <p className="text-xs font-semibold uppercase text-muted-foreground">Revenue per Trip</p>
                <p className="mt-2 font-semibold">{formatCurrency(revenuePerTrip)}</p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-xs font-semibold uppercase text-muted-foreground">Cost per Trip</p>
                <p className="mt-2 font-semibold">{formatCurrency(costPerTrip)}</p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-xs font-semibold uppercase text-muted-foreground">Cost per Ton-Km</p>
                <p className="mt-2 font-semibold">{formatNumber(costPerTonKm, { minimumFractionDigits: 2 })} Birr</p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-xs font-semibold uppercase text-muted-foreground">Avg Revenue/Operation</p>
                <p className="mt-2 font-semibold">{formatCurrency(averageRevenuePerOperation)}</p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-xs font-semibold uppercase text-muted-foreground">Avg Cost/Operation</p>
                <p className="mt-2 font-semibold">{formatCurrency(averageCostPerOperation)}</p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-xs font-semibold uppercase text-muted-foreground">Total Ton-Km</p>
                <p className="mt-2 font-semibold">{formatNumber(aggregate.totalTonKm, { maximumFractionDigits: 0 })}</p>
              </div>
            </div>
          </DetailSectionCard>
        </TabsContent>

        <TabsContent value="activity" className="space-y-6">
          <DetailSectionCard title="Activity History" description="Auditable timeline of changes to this account" icon={<History className="h-5 w-5" />}>
            {activityLogs && activityLogs.length > 0 ? (
              <ActivityLogTable logs={activityLogs} />
            ) : (
              <p className="py-8 text-center text-muted-foreground">No activity history available.</p>
            )}
          </DetailSectionCard>
        </TabsContent>
      </Tabs>

      <DeleteConfirmationDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen} title="Delete Customer" description={`Are you sure you want to delete ${customer.name}? This action cannot be undone.`} onConfirm={handleDelete} isLoading={isDeleting} />
    </DetailPageLayout>
  );
}
